"""Retro Bowl server: static files, username + PIN accounts, cloud career saves and the leaderboard.

Stdlib only. Railway hands us $PORT and mounts a volume at $DATA_DIR (default /data).

Storage: SQLite in $DATA_DIR/retrobowl.db (WAL mode), with a backup copy in $DATA_DIR/backups once a day.

Accounts work like Crossy Road's: a username (unique ignoring capitals) and a PIN, hashed with scrypt.
Signing up shows a one-time recovery code (stored hashed) that resets a forgotten PIN. A device gets a
random HttpOnly cookie and every account signed in on it is remembered, so a shared computer can switch
between players without mixing careers. New devices always need the PIN.

Leaderboard: every finished match is reported. The server issues a match token at kick-off and refuses a
result that comes back too quickly for the game clock to have run, or with an impossible score, so the
board can't be filled by just posting numbers. Ranking: Retro Bowl titles, then wins, then points scored.

API (JSON; POSTs must be same-origin):
  GET  /api/session                         signed-in user, remembered accounts
  POST /api/auth/check {username}           {exists, ok, error}
  POST /api/auth/register {username, pin}   -> {user, recovery}
  POST /api/auth/login {username, pin}      -> {user}
  POST /api/auth/switch {username}          -> {user}   (accounts already trusted on this device)
  POST /api/auth/logout
  POST /api/auth/recover {username, code, pin}
  POST /api/auth/pin {old, pin}
  GET  /api/save                            {save, rev}
  POST /api/save {save, rev}                optimistic: refused if rev is stale (another device saved)
  POST /api/match/start                     -> {token}
  POST /api/match/finish {token, us, them, kind, team}
  GET  /api/leaderboard                     {top, me}
"""

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR") or ("/data" if os.path.isdir("/data") else os.path.join(ROOT, "data"))
DB_FILE = os.path.join(DATA_DIR, "retrobowl.db")
BACKUP_DIR = os.path.join(DATA_DIR, "backups")
COOKIE = "rb_dev"

SHOW = 25
SAVE_MAX = 300_000               # bytes of career JSON per account
MATCH_MIN_SECONDS = int(os.environ.get("MATCH_MIN_SECONDS", "60"))   # a real match can't be finished faster
MATCH_TTL = 6 * 3600
MAX_POINTS = 120
KINDS = ("season", "wildcard", "divisional", "conference", "final", "exhibition")
SCRYPT = dict(n=2 ** 14, r=8, p=1, dklen=32)
NAME_RE = re.compile(r"^[A-Za-z0-9 _.\-]{3,14}$")
PIN_RE = re.compile(r"^[0-9]{4,8}$")
BLOCKED = re.compile(r"fuck|shit|cunt|nigg|fag|bitch|whore|slut|rape|nazi|hitler|penis|cock|dick|pussy|wank", re.I)

_lock = threading.RLock()
_db = None
_rate = {}
_login_fail = {}

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, username TEXT NOT NULL, uname TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL, pin_salt TEXT NOT NULL, rec_hash TEXT NOT NULL, rec_salt TEXT NOT NULL,
  created INTEGER NOT NULL, last_active INTEGER NOT NULL,
  save TEXT, save_rev INTEGER NOT NULL DEFAULT 0, team TEXT NOT NULL DEFAULT '',
  games INTEGER NOT NULL DEFAULT 0, wins INTEGER NOT NULL DEFAULT 0, losses INTEGER NOT NULL DEFAULT 0, ties INTEGER NOT NULL DEFAULT 0,
  pf INTEGER NOT NULL DEFAULT 0, pa INTEGER NOT NULL DEFAULT 0, titles INTEGER NOT NULL DEFAULT 0,
  best_margin INTEGER NOT NULL DEFAULT 0, last_game INTEGER
);
CREATE INDEX IF NOT EXISTS users_rank ON users(titles DESC, wins DESC, pf DESC);
CREATE TABLE IF NOT EXISTS devices (token_hash TEXT PRIMARY KEY, created INTEGER NOT NULL, active_user INTEGER);
CREATE TABLE IF NOT EXISTS device_logins (token_hash TEXT NOT NULL, user_id INTEGER NOT NULL, last_used INTEGER NOT NULL,
  PRIMARY KEY (token_hash, user_id));
CREATE TABLE IF NOT EXISTS matches (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, issued INTEGER NOT NULL,
  finished INTEGER, us INTEGER, them INTEGER, kind TEXT);
CREATE INDEX IF NOT EXISTS matches_user ON matches(user_id, issued);
"""


def now():
    return int(time.time())


# ---------------------------------------------------------------------------- database
def open_db():
    global _db
    os.makedirs(DATA_DIR, exist_ok=True)
    _db = sqlite3.connect(DB_FILE, check_same_thread=False, isolation_level=None)
    _db.row_factory = sqlite3.Row
    _db.execute("PRAGMA journal_mode=WAL")
    _db.executescript(SCHEMA)


class Tx:
    def __enter__(self):
        _lock.acquire()
        _db.execute("BEGIN IMMEDIATE")
        return _db

    def __exit__(self, kind, *_):
        try:
            _db.execute("ROLLBACK" if kind else "COMMIT")
        finally:
            _lock.release()
        return False


def q(sql, *args):
    with _lock:
        return _db.execute(sql, args).fetchall()


def q1(sql, *args):
    with _lock:
        return _db.execute(sql, args).fetchone()


def backup():
    if not os.path.exists(DB_FILE):
        return
    os.makedirs(BACKUP_DIR, exist_ok=True)
    dest = os.path.join(BACKUP_DIR, time.strftime("retrobowl-%Y%m%d-%H%M%S.db", time.gmtime()))
    with _lock:
        out = sqlite3.connect(dest)
        with out:
            _db.backup(out)
        out.close()
    files = sorted(f for f in os.listdir(BACKUP_DIR) if f.startswith("retrobowl-"))
    for f in files[:-14]:
        try:
            os.remove(os.path.join(BACKUP_DIR, f))
        except OSError:
            pass


# ---------------------------------------------------------------------------- helpers
class ApiError(Exception):
    def __init__(self, status, msg, **extra):
        super().__init__(msg)
        self.status, self.msg, self.extra = status, msg, extra


def limited(bucket, key, limit, window):
    t = time.time()
    with _lock:
        hits = [h for h in _rate.get((bucket, key), []) if t - h < window]
        if len(hits) >= limit:
            _rate[(bucket, key)] = hits
            return True
        hits.append(t)
        _rate[(bucket, key)] = hits
        if len(_rate) > 50000:
            for k in [k for k, v in _rate.items() if not v or t - v[-1] > 3600]:
                del _rate[k]
        return False


def norm_name(raw):
    name = re.sub(r"\s+", " ", str(raw or "")).strip()
    return name, name.lower()


def check_name(raw):
    name, uname = norm_name(raw)
    if not NAME_RE.match(name):
        return None, None, "Usernames are 3-14 letters, numbers, spaces, dots, dashes or underscores."
    if BLOCKED.search(uname.replace(" ", "")):
        return None, None, "Please pick a different username."
    return name, uname, None


def check_pin(pin):
    pin = str(pin or "")
    if not PIN_RE.match(pin):
        raise ApiError(400, "Your PIN needs 4 to 8 numbers.")
    return pin


def hash_secret(secret, salt=None):
    salt = salt or secrets.token_hex(16)
    return hashlib.scrypt(str(secret).encode(), salt=bytes.fromhex(salt), **SCRYPT).hex(), salt


def check_secret(secret, h, salt):
    return hmac.compare_digest(hash_secret(secret, salt)[0], h)


def new_recovery():
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    raw = "".join(secrets.choice(alphabet) for _ in range(12))
    return "-".join(raw[i:i + 4] for i in range(0, 12, 4))


def rank_of(u):
    return q1("SELECT COUNT(*) + 1 FROM users WHERE games > 0 AND (titles > ? OR (titles = ? AND (wins > ? OR (wins = ? AND (pf > ? OR (pf = ? AND id < ?))))))",
              u["titles"], u["titles"], u["wins"], u["wins"], u["pf"], u["pf"], u["id"])[0]


def public_user(uid):
    u = q1("SELECT * FROM users WHERE id = ?", uid)
    if not u:
        return None
    return {"id": u["id"], "username": u["username"], "team": u["team"], "games": u["games"], "wins": u["wins"],
            "losses": u["losses"], "ties": u["ties"], "pf": u["pf"], "pa": u["pa"], "titles": u["titles"],
            "bestMargin": u["best_margin"], "rank": rank_of(u) if u["games"] else None, "saveRev": u["save_rev"]}


# ---------------------------------------------------------------------------- device sessions
def device_of(h, create=False):
    raw = h.cookies.get(COOKIE, "")
    if re.fullmatch(r"[A-Za-z0-9_\-]{40,64}", raw):
        th = hashlib.sha256(raw.encode()).hexdigest()
        row = q1("SELECT * FROM devices WHERE token_hash = ?", th)
        if row:
            return th, row
    if not create:
        return None, None
    raw = secrets.token_urlsafe(32)
    th = hashlib.sha256(raw.encode()).hexdigest()
    with Tx() as db:
        db.execute("INSERT INTO devices (token_hash, created) VALUES (?,?)", (th, now()))
    h.set_cookie(COOKIE, raw)
    return th, q1("SELECT * FROM devices WHERE token_hash = ?", th)


def current_user(h, required=True):
    th, dev = device_of(h)
    uid = dev["active_user"] if dev else None
    if uid and q1("SELECT 1 FROM device_logins WHERE token_hash = ? AND user_id = ?", th, uid):
        with Tx() as db:
            db.execute("UPDATE users SET last_active = ? WHERE id = ?", (now(), uid))
            db.execute("UPDATE device_logins SET last_used = ? WHERE token_hash = ? AND user_id = ?", (now(), th, uid))
        return uid
    if required:
        raise ApiError(401, "Please sign in.")
    return None


def trust_device(h, uid):
    th, _ = device_of(h, create=True)
    with Tx() as db:
        db.execute("INSERT OR REPLACE INTO device_logins (token_hash, user_id, last_used) VALUES (?,?,?)", (th, uid, now()))
        db.execute("UPDATE devices SET active_user = ? WHERE token_hash = ?", (uid, th))
        db.execute("UPDATE users SET last_active = ? WHERE id = ?", (now(), uid))


def remembered(h):
    th, dev = device_of(h)
    if not dev:
        return []
    rows = q("SELECT u.username FROM device_logins d JOIN users u ON u.id = d.user_id WHERE d.token_hash = ? ORDER BY d.last_used DESC", th)
    return [r["username"] for r in rows]


def login_guard(uname):
    count, until = _login_fail.get(uname, (0, 0))
    if until > time.time():
        raise ApiError(429, f"Too many wrong tries. Try again in {int(until - time.time()) // 60 + 1} min.")


def login_failed(uname):
    with _lock:
        count, _ = _login_fail.get(uname, (0, 0))
        count += 1
        until = time.time() + 60 * (2 ** min(count - 5, 6)) if count >= 5 else 0
        _login_fail[uname] = (count, until)


# ---------------------------------------------------------------------------- auth routes
def api_session(h, body):
    uid = current_user(h, required=False)
    return {"user": public_user(uid) if uid else None, "accounts": remembered(h)}


def api_check(h, body):
    if limited("check", h.ip, 60, 600):
        raise ApiError(429, "Slow down a little.")
    name, uname, err = check_name(body.get("username"))
    if err:
        return {"exists": False, "ok": False, "error": err}
    return {"exists": q1("SELECT 1 FROM users WHERE uname = ?", uname) is not None, "ok": True, "username": name}


def api_register(h, body):
    if limited("register", h.ip, 8, 3600):
        raise ApiError(429, "Too many new accounts from here. Try again later.")
    name, uname, err = check_name(body.get("username"))
    if err:
        raise ApiError(400, err)
    pin = check_pin(body.get("pin"))
    rec = new_recovery()
    ph, ps = hash_secret(pin)
    rh, rs = hash_secret(rec.replace("-", ""))
    with Tx() as db:
        try:
            cur = db.execute("INSERT INTO users (username, uname, pin_hash, pin_salt, rec_hash, rec_salt, created, last_active) VALUES (?,?,?,?,?,?,?,?)",
                             (name, uname, ph, ps, rh, rs, now(), now()))
        except sqlite3.IntegrityError:
            raise ApiError(409, "That username is taken. If it's yours, sign in instead.")
        uid = cur.lastrowid
    trust_device(h, uid)
    return {"user": public_user(uid), "recovery": rec}


def api_login(h, body):
    if limited("login", h.ip, 30, 600):
        raise ApiError(429, "Too many sign-in attempts from here. Wait a few minutes.")
    _, uname = norm_name(body.get("username"))
    login_guard(uname)
    u = q1("SELECT id, pin_hash, pin_salt FROM users WHERE uname = ?", uname)
    pin = str(body.get("pin") or "")
    ok = check_secret(pin, u["pin_hash"], u["pin_salt"]) if u else (hash_secret(pin, "00" * 16) and False)
    if not ok:
        login_failed(uname)
        raise ApiError(401, "That username and PIN don't match.")
    _login_fail.pop(uname, None)
    trust_device(h, u["id"])
    return {"user": public_user(u["id"])}


def api_switch(h, body):
    th, dev = device_of(h)
    _, uname = norm_name(body.get("username"))
    u = q1("SELECT id FROM users WHERE uname = ?", uname)
    if not dev or not u or not q1("SELECT 1 FROM device_logins WHERE token_hash = ? AND user_id = ?", th, u["id"]):
        raise ApiError(401, "Enter your PIN to use that account here.", needPin=True)
    with Tx() as db:
        db.execute("UPDATE devices SET active_user = ? WHERE token_hash = ?", (u["id"], th))
    return {"user": public_user(u["id"])}


def api_logout(h, body):
    th, dev = device_of(h)
    if dev and dev["active_user"]:
        with Tx() as db:
            if body.get("forget"):
                db.execute("DELETE FROM device_logins WHERE token_hash = ? AND user_id = ?", (th, dev["active_user"]))
            db.execute("UPDATE devices SET active_user = NULL WHERE token_hash = ?", (th,))
    return {"ok": True, "accounts": remembered(h)}


def api_recover(h, body):
    if limited("recover", h.ip, 10, 3600):
        raise ApiError(429, "Too many tries. Try again later.")
    _, uname = norm_name(body.get("username"))
    login_guard(uname)
    u = q1("SELECT id, rec_hash, rec_salt FROM users WHERE uname = ?", uname)
    code = re.sub(r"[^A-Za-z0-9]", "", str(body.get("code") or "")).upper()
    if not u or not check_secret(code, u["rec_hash"], u["rec_salt"]):
        login_failed(uname)
        raise ApiError(401, "That recovery code doesn't match.")
    pin = check_pin(body.get("pin"))
    rec = new_recovery()
    ph, ps = hash_secret(pin)
    rh, rs = hash_secret(rec.replace("-", ""))
    with Tx() as db:
        db.execute("UPDATE users SET pin_hash = ?, pin_salt = ?, rec_hash = ?, rec_salt = ? WHERE id = ?", (ph, ps, rh, rs, u["id"]))
        db.execute("DELETE FROM device_logins WHERE user_id = ?", (u["id"],))
    _login_fail.pop(uname, None)
    trust_device(h, u["id"])
    return {"user": public_user(u["id"]), "recovery": rec}


def api_pin(h, body):
    uid = current_user(h)
    u = q1("SELECT pin_hash, pin_salt FROM users WHERE id = ?", uid)
    if not check_secret(str(body.get("old") or ""), u["pin_hash"], u["pin_salt"]):
        raise ApiError(401, "Your current PIN isn't right.")
    ph, ps = hash_secret(check_pin(body.get("pin")))
    with Tx() as db:
        db.execute("UPDATE users SET pin_hash = ?, pin_salt = ? WHERE id = ?", (ph, ps, uid))
    return {"ok": True}


# ---------------------------------------------------------------------------- career save
def api_save_get(h, body):
    uid = current_user(h)
    u = q1("SELECT save, save_rev FROM users WHERE id = ?", uid)
    save = None
    if u["save"]:
        try:
            save = json.loads(u["save"])
        except ValueError:
            save = None
    return {"save": save, "rev": u["save_rev"]}


def api_save_put(h, body):
    uid = current_user(h)
    if limited("save", uid, 240, 600):
        raise ApiError(429, "Saving too often.")
    save = body.get("save")
    if save is not None and not isinstance(save, dict):
        raise ApiError(400, "Bad save.")
    raw = json.dumps(save, separators=(",", ":")) if save is not None else None
    if raw and len(raw) > SAVE_MAX:
        raise ApiError(413, "Save is too big.")
    team = ""
    if isinstance(save, dict):
        team = re.sub(r"[^A-Za-z .'\-]", "", str(save.get("teamName") or ""))[:24]
    rev = body.get("rev")
    with Tx() as db:
        cur = db.execute("SELECT save_rev FROM users WHERE id = ?", (uid,)).fetchone()["save_rev"]
        if isinstance(rev, int) and not body.get("force") and rev != cur:
            raise ApiError(409, "This career was saved on another device.", rev=cur)
        db.execute("UPDATE users SET save = ?, save_rev = save_rev + 1, team = ? WHERE id = ?", (raw, team, uid))
    return {"rev": cur + 1}


# ---------------------------------------------------------------------------- matches + leaderboard
def api_match_start(h, body):
    uid = current_user(h)
    if limited("mstart", uid, 40, 3600):
        raise ApiError(429, "Too many matches started. Take a breather.")
    token = secrets.token_urlsafe(18)
    with Tx() as db:
        db.execute("DELETE FROM matches WHERE user_id = ? AND finished IS NULL AND issued < ?", (uid, now() - MATCH_TTL))
        db.execute("INSERT INTO matches (token, user_id, issued) VALUES (?,?,?)", (token, uid, now()))
    return {"token": token}


def as_int(v, lo, hi):
    if isinstance(v, bool) or not isinstance(v, int) or not lo <= v <= hi:
        raise ApiError(400, "Bad result.")
    return v


def api_match_finish(h, body):
    uid = current_user(h)
    token = str(body.get("token") or "")
    us = as_int(body.get("us"), 0, MAX_POINTS)
    them = as_int(body.get("them"), 0, MAX_POINTS)
    kind = body.get("kind") if body.get("kind") in KINDS else "season"
    with Tx() as db:
        m = db.execute("SELECT * FROM matches WHERE token = ? AND user_id = ?", (token, uid)).fetchone()
        if not m:
            raise ApiError(404, "Unknown match.")
        if m["finished"]:
            return {"ok": True, "counted": False, "user": None}
        took = now() - m["issued"]
        if took > MATCH_TTL:
            raise ApiError(410, "That match is too old to count.")
        # every quarter takes real time to play; a 'result' that arrives in seconds was never played
        if took < MATCH_MIN_SECONDS or us > 14 + took // 4:
            db.execute("UPDATE matches SET finished = ?, us = ?, them = ?, kind = 'rejected' WHERE token = ?", (now(), us, them, token))
            return {"ok": True, "counted": False, "reason": "too fast"}
        db.execute("UPDATE matches SET finished = ?, us = ?, them = ?, kind = ? WHERE token = ?", (now(), us, them, kind, token))
        if kind != "exhibition":
            win, loss, tie = int(us > them), int(us < them), int(us == them)
            title = int(kind == "final" and win)
            db.execute("""UPDATE users SET games = games + 1, wins = wins + ?, losses = losses + ?, ties = ties + ?,
                          pf = pf + ?, pa = pa + ?, titles = titles + ?, best_margin = MAX(best_margin, ?), last_game = ? WHERE id = ?""",
                       (win, loss, tie, us, them, title, us - them, now(), uid))
    return {"ok": True, "counted": kind != "exhibition", "user": public_user(uid)}


def api_leaderboard(h, body):
    rows = q("""SELECT id, username, team, games, wins, losses, ties, pf, pa, titles FROM users WHERE games > 0
                ORDER BY titles DESC, wins DESC, pf DESC, id ASC LIMIT ?""", SHOW)
    top = [{"rank": i + 1, "name": r["username"], "team": r["team"], "titles": r["titles"], "wins": r["wins"],
            "losses": r["losses"], "ties": r["ties"], "pf": r["pf"], "pa": r["pa"], "games": r["games"]} for i, r in enumerate(rows)]
    uid = current_user(h, required=False)
    return {"top": top, "me": public_user(uid) if uid else None,
            "players": q1("SELECT COUNT(*) FROM users WHERE games > 0")[0]}


ROUTES = {
    ("GET", "/api/session"): api_session, ("POST", "/api/auth/check"): api_check,
    ("POST", "/api/auth/register"): api_register, ("POST", "/api/auth/login"): api_login,
    ("POST", "/api/auth/switch"): api_switch, ("POST", "/api/auth/logout"): api_logout,
    ("POST", "/api/auth/recover"): api_recover, ("POST", "/api/auth/pin"): api_pin,
    ("GET", "/api/save"): api_save_get, ("POST", "/api/save"): api_save_put,
    ("POST", "/api/match/start"): api_match_start, ("POST", "/api/match/finish"): api_match_finish,
    ("GET", "/api/leaderboard"): api_leaderboard,
}


# ---------------------------------------------------------------------------- http
class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".mjs": "text/javascript",
                      ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        for c in getattr(self, "_set_cookies", []):
            self.send_header("Set-Cookie", c)
        super().end_headers()

    @property
    def ip(self):
        fwd = self.headers.get("X-Forwarded-For", "")
        return fwd.split(",")[0].strip() or self.client_address[0]

    @property
    def cookies(self):
        out = {}
        for part in (self.headers.get("Cookie") or "").split(";"):
            if "=" in part:
                k, v = part.split("=", 1)
                out[k.strip()] = v.strip()
        return out

    def set_cookie(self, name, value):
        secure = self.headers.get("X-Forwarded-Proto", "") == "https"
        c = f"{name}={value}; Path=/; Max-Age={2 * 365 * 86400}; HttpOnly; SameSite=Lax" + ("; Secure" if secure else "")
        self._set_cookies = getattr(self, "_set_cookies", []) + [c]

    def _json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _api(self, method):
        route = self.path.split("?")[0]
        fn = ROUTES.get((method, route))
        if not fn:
            return self._json(404, {"error": "Not found"})
        body = {}
        if method == "POST":
            origin = self.headers.get("Origin")
            if origin and origin.split("://", 1)[-1] != self.headers.get("Host", ""):
                return self._json(403, {"error": "Bad origin"})
            try:
                n = int(self.headers.get("Content-Length") or 0)
                if n > SAVE_MAX + 10_000:
                    raise ValueError
                body = json.loads(self.rfile.read(n) or b"{}") if n else {}
                if not isinstance(body, dict):
                    raise ValueError
            except ValueError:
                return self._json(400, {"error": "Bad request"})
        try:
            return self._json(200, fn(self, body))
        except ApiError as e:
            return self._json(e.status, {"error": e.msg, **e.extra})
        except Exception as e:
            print(f"error on {route}: {e!r}", flush=True)
            return self._json(500, {"error": "Something went wrong on our side. Try again."})

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/healthz":
            return self._plain(b"ok")
        if path.startswith("/api/"):
            return self._api("GET")
        if path in ("/data",) or path.startswith("/data/") or path.startswith("/tests/") or path.endswith(".py") or path.endswith(".db"):
            return self._json(404, {"error": "Not found"})
        return super().do_GET()

    def do_HEAD(self):
        if self.path.split("?")[0] == "/healthz":
            return self._plain(b"ok")
        return super().do_HEAD()

    def do_POST(self):
        return self._api("POST")

    def _plain(self, body):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def log_message(self, fmt, *args):
        if self.path.split("?")[0] != "/healthz":
            super().log_message(fmt, *args)


def daily_backups():
    while True:
        time.sleep(24 * 3600)
        try:
            backup()
        except Exception as exc:
            print(f"backup failed: {exc!r}", flush=True)


def main():
    open_db()
    threading.Thread(target=daily_backups, daemon=True).start()
    n = q1("SELECT COUNT(*) FROM users")[0]
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), partial(Handler, directory=ROOT))
    print(f"retro-bowl on :{port} ({n} accounts, db {DB_FILE})", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
