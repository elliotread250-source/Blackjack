"""Crossy Road server: static files, accounts, the coin economy, daily challenges and leaderboards.

Stdlib only. Railway hands us $PORT and mounts a volume at $DATA_DIR (default /data).

Storage: SQLite in $DATA_DIR/crossy.db (WAL mode, schema migrations in MIGRATIONS, a backup copy in
$DATA_DIR/backups before every migration and once a day). The old JSON leaderboard file is kept,
read-only, as the "Classic" board.

Trust model: the browser is never trusted with money. The server picks every run's seed; when a run
ends the browser sends the hops it made (tick + direction) and tools/worker.mjs replays them with
the same game code (js/logic.js), so score, coins, jewels and challenge progress all come from the
replay. Coins only change inside transactions, through a ledger with a unique (user, reason, ref)
key, so retries and double clicks can never pay twice.

Accounts: a username (case-insensitively unique) and a PIN or password, hashed with scrypt. A device
gets a random HttpOnly cookie; each account signed in on that device is a row in device_logins, so
several people can share a computer and switch without mixing progress. New devices need the PIN.
A recovery code is shown once at sign-up (stored hashed) to reset a forgotten PIN.

API (JSON; POSTs must be same-origin):
  GET  /api/session                     who is signed in here, remembered accounts, champion
  POST /api/auth/check {username}       {exists, ok, error}
  POST /api/auth/register {username, pin}           -> {user, recovery}
  POST /api/auth/login {username, pin}              -> {user}
  POST /api/auth/switch {username}                  -> {user} (accounts already trusted here)
  POST /api/auth/logout                             forget the current account on this device
  POST /api/auth/recover {username, code, pin}      -> {user, recovery}
  POST /api/auth/pin {old, pin}                     change PIN
  GET  /api/me                                      profile
  POST /api/me/settings {settings}
  POST /api/me/equip {char}
  POST /api/shop/buy {char}                         idempotent
  POST /api/shop/prize {req}                        idempotent per request id
  POST /api/redeem {code}
  POST /api/migrate {coins, owned, selected, records, settings}   once, capped
  POST /api/run/start                               -> {token, seed, hopTicks, day}
  POST /api/run/finish {token, inputs, fast, endTick, score, autopilot}
  GET  /api/daily                                   today's three missions with progress
  POST /api/daily/claim {day, id}                   idempotent
  GET  /api/leaderboard                             {top, legacy, champion}
  POST /api/admin {code, action, board, rows}       board editor (ADMIN_CODE env var)
  GET  /ws                                          online races (race.py): same seed, live ghosts, replayed results
"""

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import subprocess
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import race
import wsnet

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR") or ("/data" if os.path.isdir("/data") else os.path.join(ROOT, "data"))
DB_FILE = os.path.join(DATA_DIR, "crossy.db")
LEGACY_FILE = os.path.join(DATA_DIR, "leaderboard.json")
BACKUP_DIR = os.path.join(DATA_DIR, "backups")
ADMIN_CODE = os.environ.get("ADMIN_CODE", "").strip().lower()

SHOW = 20
DAY_MS = 86400000
RUN_TTL = 48 * 3600              # a finished run can be sent this long after it started (offline play)
TIME_SLACK = int(os.environ.get("RUN_TIME_SLACK", "600"))   # ticks of leeway on the real-time check
OPEN_RUNS = 30                   # unfinished run tokens one account may hold
MIGRATE_COIN_CAP = 1000          # most coins a device's old local save can bring into an account
PRIZE_MAX_PRICE = 300
QUICK_HOP, QUICK_SKIN = 1, "quackers"   # the secret 1-tick hop belongs to this skin alone
SCRYPT = dict(n=2 ** 14, r=8, p=1, dklen=32)
NAME_RE = re.compile(r"^[A-Za-z0-9 _.\-]{3,14}$")
BLOCKED = re.compile(r"fuck|shit|cunt|nigg|fag|bitch|whore|slut|rape|nazi|hitler|penis|cock|dick|pussy|wank", re.I)
DEFAULT_SETTINGS = {"hopTicks": 4, "volume": 0.8, "sfx": 1.0, "muted": False, "quality": "high", "reducedMotion": False,
                    "highContrast": False, "trainWarning": "strong", "shake": True}

_lock = threading.RLock()        # serialises every database transaction (low traffic, keeps SQLite simple)
_db = None
_catalog = None
_legacy = []
_rate = {}                       # (bucket, key) -> [times]
_login_fail = {}                 # uname -> (count, locked_until)


def now_ms():
    return int(time.time() * 1000)


def today():
    return now_ms() // DAY_MS


# ---------------------------------------------------------------------------- the node game worker
class Worker:
    """The game logic in node (tools/worker.mjs), kept running and spoken to over JSON lines."""

    def __init__(self):
        self.proc = None
        self.n = 0
        self.lock = threading.Lock()

    def _start(self):
        self.proc = subprocess.Popen(["node", os.path.join(ROOT, "tools", "worker.mjs")], cwd=ROOT,
                                     stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1)

    def call(self, op, **kw):
        with self.lock:
            for attempt in range(2):
                try:
                    if self.proc is None or self.proc.poll() is not None:
                        self._start()
                    self.n += 1
                    self.proc.stdin.write(json.dumps({"id": self.n, "op": op, **kw}) + "\n")
                    self.proc.stdin.flush()
                    line = self.proc.stdout.readline()
                    if not line:
                        raise OSError("worker exited")
                    out = json.loads(line)
                    if not out.get("ok"):
                        raise ValueError(out.get("error") or "worker error")
                    return out["result"]
                except (OSError, BrokenPipeError):
                    self.proc = None
                    if attempt:
                        raise
        raise OSError("worker unavailable")


worker = Worker()


def race_replay(seed, hop_ticks, inputs, fast, end_tick):
    """A race result comes from the same replay as a solo run (never what the browser says)."""
    return worker.call("replay", seed=seed, hopTicks=hop_ticks, inputs=inputs, fast=fast, endTick=end_tick)


races = race.RaceServer(race_replay)


def catalog():
    global _catalog
    if _catalog is None:
        _catalog = worker.call("catalog")
        _catalog["byId"] = {c["id"]: c for c in _catalog["characters"]}
        _catalog["dailyById"] = {d["id"]: d for d in _catalog["dailies"]}
    return _catalog


# ---------------------------------------------------------------------------- database
MIGRATIONS = [
    # 1: accounts, devices, runs, the coin ledger, owned characters, daily missions
    """
    CREATE TABLE users (
      id INTEGER PRIMARY KEY, username TEXT NOT NULL, uname TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL, pin_salt TEXT NOT NULL, rec_hash TEXT NOT NULL, rec_salt TEXT NOT NULL,
      created INTEGER NOT NULL, last_active INTEGER NOT NULL,
      coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0), coins_earned INTEGER NOT NULL DEFAULT 0, coins_spent INTEGER NOT NULL DEFAULT 0,
      best INTEGER NOT NULL DEFAULT 0, best_at INTEGER, runs INTEGER NOT NULL DEFAULT 0, rows_total INTEGER NOT NULL DEFAULT 0,
      deaths INTEGER NOT NULL DEFAULT 0, coins_collected INTEGER NOT NULL DEFAULT 0,
      equipped TEXT NOT NULL DEFAULT 'chicken', settings TEXT NOT NULL DEFAULT '{}', records TEXT NOT NULL DEFAULT '{}',
      migrated INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX users_best ON users(best DESC, best_at ASC, id ASC);
    CREATE TABLE owned (user_id INTEGER NOT NULL REFERENCES users(id), char_id TEXT NOT NULL, acquired INTEGER NOT NULL, how TEXT NOT NULL,
      PRIMARY KEY (user_id, char_id));
    CREATE TABLE devices (token_hash TEXT PRIMARY KEY, created INTEGER NOT NULL, last_used INTEGER NOT NULL, active_user INTEGER, migrated INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE device_logins (token_hash TEXT NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id), created INTEGER NOT NULL, last_used INTEGER NOT NULL,
      PRIMARY KEY (token_hash, user_id));
    CREATE TABLE runs (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), seed INTEGER NOT NULL, hop_ticks INTEGER NOT NULL,
      day INTEGER NOT NULL, issued INTEGER NOT NULL, finished INTEGER, score INTEGER, coins INTEGER, stats TEXT, practice INTEGER, status TEXT NOT NULL DEFAULT 'open');
    CREATE INDEX runs_user_day ON runs(user_id, day, status);
    CREATE TABLE ledger (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), amount INTEGER NOT NULL, reason TEXT NOT NULL, ref TEXT NOT NULL,
      created INTEGER NOT NULL, UNIQUE (user_id, reason, ref));
    CREATE TABLE daily_assign (day INTEGER NOT NULL, slot INTEGER NOT NULL, cid TEXT NOT NULL, PRIMARY KEY (day, slot));
    CREATE TABLE daily_claims (user_id INTEGER NOT NULL REFERENCES users(id), day INTEGER NOT NULL, cid TEXT NOT NULL, amount INTEGER NOT NULL, created INTEGER NOT NULL,
      PRIMARY KEY (user_id, day, cid));
    """,
]


def backup(tag):
    """A consistent copy of the database (SQLite online backup), keeping the newest 14."""
    if not os.path.exists(DB_FILE):
        return
    os.makedirs(BACKUP_DIR, exist_ok=True)
    dest = os.path.join(BACKUP_DIR, time.strftime("crossy-%Y%m%d-%H%M%S", time.gmtime()) + f"-{tag}.db")
    src = sqlite3.connect(DB_FILE)
    try:
        out = sqlite3.connect(dest)
        with out:
            src.backup(out)
        out.close()
    finally:
        src.close()
    files = sorted(f for f in os.listdir(BACKUP_DIR) if f.startswith("crossy-"))
    for f in files[:-14]:
        try:
            os.remove(os.path.join(BACKUP_DIR, f))
        except OSError:
            pass


def open_db():
    global _db
    os.makedirs(DATA_DIR, exist_ok=True)
    existed = os.path.exists(DB_FILE)
    _db = sqlite3.connect(DB_FILE, check_same_thread=False, isolation_level=None)
    _db.row_factory = sqlite3.Row
    _db.execute("PRAGMA journal_mode=WAL")
    _db.execute("PRAGMA foreign_keys=ON")
    version = _db.execute("PRAGMA user_version").fetchone()[0]
    if version < len(MIGRATIONS):
        if existed and version > 0:
            backup(f"before-v{len(MIGRATIONS)}")
        for v in range(version, len(MIGRATIONS)):
            _db.execute("BEGIN IMMEDIATE")
            try:
                for stmt in [s.strip() for s in MIGRATIONS[v].split(";") if s.strip()]:
                    _db.execute(stmt)
                _db.execute(f"PRAGMA user_version={v + 1}")
                _db.execute("COMMIT")
            except Exception:
                _db.execute("ROLLBACK")
                raise


class Tx:
    """BEGIN IMMEDIATE ... COMMIT (or ROLLBACK on any error), under the global lock."""

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


def hash_secret(secret, salt=None):
    salt = salt or secrets.token_hex(16)
    h = hashlib.scrypt(str(secret).encode(), salt=bytes.fromhex(salt), **SCRYPT).hex()
    return h, salt


def check_secret(secret, h, salt):
    return hmac.compare_digest(hash_secret(secret, salt)[0], h)


def check_pin(pin):
    pin = str(pin or "")
    if not 4 <= len(pin) <= 64:
        raise ApiError(400, "Your PIN or password needs 4 to 64 characters.")
    return pin


def new_recovery():
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    raw = "".join(secrets.choice(alphabet) for _ in range(12))
    return "-".join(raw[i:i + 4] for i in range(0, 12, 4))


def jload(s, default):
    try:
        v = json.loads(s or "")
        return v if isinstance(v, type(default)) else default
    except ValueError:
        return default


def clean_settings(raw, base=None):
    out = dict(DEFAULT_SETTINGS)
    out.update(base or {})
    if not isinstance(raw, dict):
        return out
    if raw.get("hopTicks") in (1, 4, 8):
        out["hopTicks"] = raw["hopTicks"]
    for k in ("volume", "sfx"):
        if isinstance(raw.get(k), (int, float)):
            out[k] = max(0.0, min(1.0, float(raw[k])))
    for k in ("muted", "reducedMotion", "highContrast", "shake"):
        if isinstance(raw.get(k), bool):
            out[k] = raw[k]
    if raw.get("quality") in ("low", "medium", "high"):
        out["quality"] = raw["quality"]
    if raw.get("trainWarning") in ("strong", "steady"):
        out["trainWarning"] = raw["trainWarning"]
    return out


def credit(db, uid, amount, reason, ref):
    """Add (or with a negative amount, spend) coins once per (reason, ref). Returns False if already done."""
    try:
        db.execute("INSERT INTO ledger (user_id, amount, reason, ref, created) VALUES (?,?,?,?,?)", (uid, amount, reason, ref, now_ms()))
    except sqlite3.IntegrityError:
        return False
    if amount >= 0:
        db.execute("UPDATE users SET coins = coins + ?, coins_earned = coins_earned + ? WHERE id = ?", (amount, amount, uid))
    else:
        cur = db.execute("UPDATE users SET coins = coins + ?, coins_spent = coins_spent + ? WHERE id = ? AND coins >= ?", (amount, -amount, uid, -amount))
        if cur.rowcount != 1:
            raise ApiError(402, "Not enough coins.")
    return True


def champion():
    r = q1("SELECT id, username, best, equipped FROM users WHERE best > 0 ORDER BY best DESC, best_at ASC, id ASC LIMIT 1")
    return {"id": r["id"], "name": r["username"], "score": r["best"], "char": r["equipped"]} if r else None


def profile(uid):
    u = q1("SELECT * FROM users WHERE id = ?", uid)
    if not u:
        return None
    owned = [r["char_id"] for r in q("SELECT char_id FROM owned WHERE user_id = ? ORDER BY acquired", uid)]
    rank = None
    if u["best"] > 0:
        rank = q1("SELECT COUNT(*) + 1 FROM users WHERE best > ? OR (best = ? AND (best_at < ? OR (best_at = ? AND id < ?)))",
                  u["best"], u["best"], u["best_at"], u["best_at"], uid)[0]
    champ = champion()
    return {
        "id": u["id"], "username": u["username"], "created": u["created"], "lastActive": u["last_active"],
        "coins": u["coins"], "coinsEarned": u["coins_earned"], "coinsSpent": u["coins_spent"],
        "best": u["best"], "runs": u["runs"], "rows": u["rows_total"], "deaths": u["deaths"], "coinsCollected": u["coins_collected"],
        "owned": owned, "equipped": u["equipped"], "settings": clean_settings(jload(u["settings"], {})),
        "records": jload(u["records"], {}), "migrated": bool(u["migrated"]), "rank": rank,
        "champion": bool(champ and champ["id"] == uid),
    }


# ---------------------------------------------------------------------------- sessions (device cookie)
def device_of(handler, create=False):
    raw = handler.cookies.get("cr_dev", "")
    if re.fullmatch(r"[A-Za-z0-9_\-]{40,64}", raw):
        h = hashlib.sha256(raw.encode()).hexdigest()
        row = q1("SELECT * FROM devices WHERE token_hash = ?", h)
        if row:
            return h, row
    if not create:
        return None, None
    raw = secrets.token_urlsafe(32)
    h = hashlib.sha256(raw.encode()).hexdigest()
    with Tx() as db:
        db.execute("INSERT INTO devices (token_hash, created, last_used) VALUES (?,?,?)", (h, now_ms(), now_ms()))
    handler.set_cookie("cr_dev", raw)
    return h, q1("SELECT * FROM devices WHERE token_hash = ?", h)


def current_user(handler, required=True):
    h, dev = device_of(handler)
    uid = dev["active_user"] if dev else None
    if uid and q1("SELECT 1 FROM device_logins WHERE token_hash = ? AND user_id = ?", h, uid):
        with Tx() as db:
            db.execute("UPDATE users SET last_active = ? WHERE id = ?", (now_ms(), uid))
            db.execute("UPDATE device_logins SET last_used = ? WHERE token_hash = ? AND user_id = ?", (now_ms(), h, uid))
        return uid
    if required:
        raise ApiError(401, "Please sign in.")
    return None


def trust_device(handler, uid):
    h, _ = device_of(handler, create=True)
    with Tx() as db:
        db.execute("INSERT OR REPLACE INTO device_logins (token_hash, user_id, created, last_used) VALUES (?,?,?,?)", (h, uid, now_ms(), now_ms()))
        db.execute("UPDATE devices SET active_user = ?, last_used = ? WHERE token_hash = ?", (uid, now_ms(), h))
        db.execute("UPDATE users SET last_active = ? WHERE id = ?", (now_ms(), uid))


def remembered(handler):
    h, dev = device_of(handler)
    if not dev:
        return []
    rows = q("SELECT u.username FROM device_logins d JOIN users u ON u.id = d.user_id WHERE d.token_hash = ? ORDER BY d.last_used DESC", h)
    return [r["username"] for r in rows]


# ---------------------------------------------------------------------------- auth
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


def api_check(h, body):
    if limited("check", h.ip, 40, 600):
        raise ApiError(429, "Slow down a little.")
    name, uname, err = check_name(body.get("username"))
    if err:
        return {"exists": False, "ok": False, "error": err}
    exists = q1("SELECT 1 FROM users WHERE uname = ?", uname) is not None
    return {"exists": exists, "ok": True, "username": name}


def api_register(h, body):
    if limited("register", h.ip, 6, 3600):
        raise ApiError(429, "Too many new accounts from here. Try again later.")
    name, uname, err = check_name(body.get("username"))
    if err:
        raise ApiError(400, err)
    pin = check_pin(body.get("pin"))
    rec = new_recovery()
    ph, ps = hash_secret(pin)
    rh, rs = hash_secret(rec.replace("-", ""))
    t = now_ms()
    with Tx() as db:
        try:
            cur = db.execute("INSERT INTO users (username, uname, pin_hash, pin_salt, rec_hash, rec_salt, created, last_active, settings) VALUES (?,?,?,?,?,?,?,?,?)",
                             (name, uname, ph, ps, rh, rs, t, t, json.dumps(clean_settings(body.get("settings")))))
        except sqlite3.IntegrityError:
            raise ApiError(409, "That username is taken. If it's yours, sign in instead.")
        uid = cur.lastrowid
        db.execute("INSERT INTO owned (user_id, char_id, acquired, how) VALUES (?,?,?,?)", (uid, "chicken", t, "start"))
    trust_device(h, uid)
    return {"user": profile(uid), "recovery": rec}


def api_login(h, body):
    if limited("login", h.ip, 30, 600):
        raise ApiError(429, "Too many sign-in attempts from here. Wait a few minutes.")
    _, uname = norm_name(body.get("username"))
    login_guard(uname)
    u = q1("SELECT id, pin_hash, pin_salt FROM users WHERE uname = ?", uname)
    pin = str(body.get("pin") or "")
    # hash even for unknown names so timing doesn't reveal which usernames exist
    ok = check_secret(pin, u["pin_hash"], u["pin_salt"]) if u else (hash_secret(pin, "00" * 16) and False)
    if not ok:
        login_failed(uname)
        raise ApiError(401, "That username and PIN don't match.")
    _login_fail.pop(uname, None)
    trust_device(h, u["id"])
    return {"user": profile(u["id"])}


def api_switch(h, body):
    dh, dev = device_of(h)
    _, uname = norm_name(body.get("username"))
    u = q1("SELECT id FROM users WHERE uname = ?", uname)
    if not dev or not u or not q1("SELECT 1 FROM device_logins WHERE token_hash = ? AND user_id = ?", dh, u["id"]):
        raise ApiError(401, "Sign in with your PIN to use that account here.", needPin=True)
    with Tx() as db:
        db.execute("UPDATE devices SET active_user = ? WHERE token_hash = ?", (u["id"], dh))
    return {"user": profile(u["id"])}


def api_logout(h, body):
    dh, dev = device_of(h)
    if dev and dev["active_user"]:
        with Tx() as db:
            db.execute("DELETE FROM device_logins WHERE token_hash = ? AND user_id = ?", (dh, dev["active_user"]))
            db.execute("UPDATE devices SET active_user = NULL WHERE token_hash = ?", (dh,))
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
        db.execute("DELETE FROM device_logins WHERE user_id = ?", (u["id"],))      # sign every other device out
    _login_fail.pop(uname, None)
    trust_device(h, u["id"])
    return {"user": profile(u["id"]), "recovery": rec}


def api_pin(h, body):
    uid = current_user(h)
    u = q1("SELECT pin_hash, pin_salt FROM users WHERE id = ?", uid)
    if not check_secret(str(body.get("old") or ""), u["pin_hash"], u["pin_salt"]):
        raise ApiError(401, "Your current PIN isn't right.")
    ph, ps = hash_secret(check_pin(body.get("pin")))
    with Tx() as db:
        db.execute("UPDATE users SET pin_hash = ?, pin_salt = ? WHERE id = ?", (ph, ps, uid))
    return {"ok": True}


# ---------------------------------------------------------------------------- profile, shop
def api_settings(h, body):
    uid = current_user(h)
    base = jload(q1("SELECT settings FROM users WHERE id = ?", uid)["settings"], {})
    s = clean_settings(body.get("settings"), clean_settings(base))
    with Tx() as db:
        db.execute("UPDATE users SET settings = ? WHERE id = ?", (json.dumps(s), uid))
    return {"settings": s}


def api_equip(h, body):
    uid = current_user(h)
    cid = str(body.get("char") or "")
    with Tx() as db:
        if not db.execute("SELECT 1 FROM owned WHERE user_id = ? AND char_id = ?", (uid, cid)).fetchone():
            raise ApiError(403, "You don't own that character yet.")
        db.execute("UPDATE users SET equipped = ? WHERE id = ?", (cid, uid))
    return {"user": profile(uid)}


def api_buy(h, body):
    uid = current_user(h)
    c = catalog()["byId"].get(str(body.get("char") or ""))
    if not c or c["price"] is None:
        raise ApiError(400, "That character isn't for sale.")
    with Tx() as db:
        if db.execute("SELECT 1 FROM owned WHERE user_id = ? AND char_id = ?", (uid, c["id"])).fetchone():
            return {"user": None, "already": True}
        credit(db, uid, -c["price"], "buy", c["id"])
        db.execute("INSERT INTO owned (user_id, char_id, acquired, how) VALUES (?,?,?,?)", (uid, c["id"], now_ms(), "buy"))
        db.execute("UPDATE users SET equipped = ? WHERE id = ?", (c["id"], uid))
    return {"user": profile(uid), "bought": c["id"]}


def api_prize(h, body):
    uid = current_user(h)
    req = str(body.get("req") or "")
    if not re.fullmatch(r"[A-Za-z0-9\-]{8,64}", req):
        raise ApiError(400, "Bad request id.")
    cat = catalog()
    with Tx() as db:
        done = db.execute("SELECT char_id FROM owned WHERE user_id = ? AND how = ?", (uid, "prize:" + req)).fetchone()
        if done:
            return {"user": None, "won": done["char_id"], "repeat": True}
        owned = {r["char_id"] for r in db.execute("SELECT char_id FROM owned WHERE user_id = ?", (uid,))}
        left = [c for c in cat["characters"] if c["price"] is not None and c["price"] <= PRIZE_MAX_PRICE and c["id"] not in owned]
        if not left:
            raise ApiError(400, "You already have every prize character!")
        credit(db, uid, -cat["prizePrice"], "prize", req)
        c = secrets.choice(left)
        db.execute("INSERT INTO owned (user_id, char_id, acquired, how) VALUES (?,?,?,?)", (uid, c["id"], now_ms(), "prize:" + req))
        db.execute("UPDATE users SET equipped = ? WHERE id = ?", (c["id"], uid))
    return {"user": profile(uid), "won": c["id"]}


def api_redeem(h, body):
    uid = current_user(h)
    if limited("redeem", uid, 20, 600):
        raise ApiError(429, "Slow down a little.")
    code = " ".join(str(body.get("code") or "").lower().split())
    c = next((c for c in catalog()["characters"] if c.get("code") and c["code"] == code), None)
    if not c:
        raise ApiError(404, "Unknown code")
    with Tx() as db:
        db.execute("INSERT OR IGNORE INTO owned (user_id, char_id, acquired, how) VALUES (?,?,?,?)", (uid, c["id"], now_ms(), "code"))
        db.execute("UPDATE users SET equipped = ? WHERE id = ?", (c["id"], uid))
    return {"user": profile(uid), "char": c["id"]}


def api_migrate(h, body):
    """Bring a device's old local save into an account, once per account and once per device.
    Local saves can't be verified, so this is capped: up to MIGRATE_COIN_CAP coins, and only
    characters that existed before accounts (not the new 2026 collection or premium skins)."""
    uid = current_user(h)
    dh, dev = device_of(h)
    cat = catalog()
    allowed = {c["id"] for c in cat["characters"] if c["id"] in LEGACY_CHARS}
    coins = max(0, min(MIGRATE_COIN_CAP, int(body.get("coins") or 0)))
    owned = [c for c in (body.get("owned") or []) if isinstance(c, str) and c in allowed][:80]
    records = body.get("records") if isinstance(body.get("records"), dict) else {}
    with Tx() as db:
        u = db.execute("SELECT migrated, records, settings FROM users WHERE id = ?", (uid,)).fetchone()
        if u["migrated"] or (dev and dev["migrated"]):
            raise ApiError(409, "This save has already been brought into an account.")
        if coins:
            credit(db, uid, coins, "migrate", "local")
        for cid in owned:
            db.execute("INSERT OR IGNORE INTO owned (user_id, char_id, acquired, how) VALUES (?,?,?,?)", (uid, cid, now_ms(), "migrate"))
        rec = jload(u["records"], {})
        for k in ("score", "roads", "rails", "logs", "coins"):
            try:
                rec[k] = max(int(rec.get(k, 0)), min(int(records.get(k, 0)), 2000))
            except (TypeError, ValueError):
                pass
        sel = body.get("selected") if body.get("selected") in owned else None
        db.execute("UPDATE users SET migrated = 1, records = ?, settings = ?" + (", equipped = ?" if sel else "") + " WHERE id = ?",
                   (json.dumps(rec), json.dumps(clean_settings(body.get("settings"), clean_settings(jload(u["settings"], {})))), *([sel] if sel else []), uid))
        if dev:
            db.execute("UPDATE devices SET migrated = 1 WHERE token_hash = ?", (dh,))
    return {"user": profile(uid), "coins": coins, "owned": owned}


# characters that existed before accounts (the only ones an old local save may bring in)
LEGACY_CHARS = {"chicken", "duck", "frog", "pig", "cat", "penguin", "fox", "panda", "robot", "unicorn", "dog", "bunny", "mouse", "sheep", "cow",
                "turtle", "bee", "owl", "camel", "lizard", "monkey", "parrot", "tiger", "polarbear", "snowman", "pumpkin", "bat", "ghost", "skeleton",
                "zombie", "gingerbread", "ninja", "dino", "alien", "astronaut", "dragon", "golden", "ironsuit", "starshield", "thunder", "brute",
                "crawler", "panther", "miner", "hedgehog", "knight", "marine", "golem", "phoenix", "titan", "frost", "pirate", "cosmic"}


# ---------------------------------------------------------------------------- runs
def api_run_start(h, body):
    uid = current_user(h)
    if limited("runstart", uid, 40, 60):
        raise ApiError(429, "Slow down a little.")
    me = q1("SELECT settings, equipped FROM users WHERE id = ?", uid)
    settings = clean_settings(jload(me["settings"], {}))
    # the secret 1-tick hop only counts while the Quackers skin is on (and owned); anything else plays at Fast
    hop = settings["hopTicks"]
    if hop == QUICK_HOP and not (me["equipped"] == QUICK_SKIN and q1("SELECT 1 FROM owned WHERE user_id = ? AND char_id = ?", uid, QUICK_SKIN)):
        hop = 4
    settings["hopTicks"] = hop
    token = secrets.token_urlsafe(18)
    seed = secrets.randbits(31)
    t = now_ms()
    with Tx() as db:
        # drop this account's oldest unfinished tokens beyond the limit
        old = db.execute("SELECT token FROM runs WHERE user_id = ? AND status = 'open' ORDER BY issued DESC LIMIT -1 OFFSET ?", (uid, OPEN_RUNS - 1)).fetchall()
        for r in old:
            db.execute("UPDATE runs SET status = 'expired' WHERE token = ?", (r["token"],))
        db.execute("INSERT INTO runs (token, user_id, seed, hop_ticks, day, issued) VALUES (?,?,?,?,?,?)", (token, uid, seed, settings["hopTicks"], t // DAY_MS, t))
    return {"token": token, "seed": seed, "hopTicks": settings["hopTicks"], "day": t // DAY_MS}


def day_runs(uid, day):
    return [jload(r["stats"], {}) for r in q("SELECT stats FROM runs WHERE user_id = ? AND day = ? AND status = 'done' AND practice = 0", uid, day)]


def api_run_finish(h, body):
    uid = current_user(h)
    token = str(body.get("token") or "")
    run = q1("SELECT * FROM runs WHERE token = ?", token)
    if not run or run["user_id"] != uid:
        raise ApiError(404, "Unknown run.")
    if run["status"] == "done":
        return {"repeat": True, "result": jload(run["stats"], {}), "user": profile(uid)}
    if run["status"] != "open" or now_ms() - run["issued"] > RUN_TTL * 1000:
        raise ApiError(410, "That run expired before it was sent.")
    inputs, fast = body.get("inputs"), body.get("fast") or []
    end = body.get("endTick")
    if not isinstance(inputs, list) or not isinstance(end, int) or end < 0:
        raise ApiError(400, "Bad run.")
    # a run can't have lasted longer (in game time) than the real time since it started
    elapsed_ticks = (now_ms() - run["issued"]) / 1000 * 60
    if end > elapsed_ticks * 1.08 + TIME_SLACK:
        with Tx() as db:
            db.execute("UPDATE runs SET status = 'rejected', finished = ? WHERE token = ?", (now_ms(), token))
        raise ApiError(400, "That run finished faster than real time.")
    try:
        res = worker.call("replay", seed=run["seed"], hopTicks=run["hop_ticks"], inputs=inputs, fast=fast, endTick=end)
    except ValueError as exc:
        raise ApiError(400, f"Couldn't replay that run ({exc}).")
    practice = bool(res["practice"] or body.get("autopilot"))
    st = res["stats"]
    st["practice"] = practice
    mismatch = isinstance(body.get("score"), int) and body["score"] != res["score"]
    cat = catalog()
    unlocked = []
    with Tx() as db:
        db.execute("UPDATE runs SET status = 'done', finished = ?, score = ?, coins = ?, stats = ?, practice = ? WHERE token = ? AND status = 'open'",
                   (now_ms(), res["score"], res["coins"], json.dumps(st), int(practice), token))
        if db.execute("SELECT changes()").fetchone()[0] != 1:
            raise ApiError(409, "Run already sent.")
        if not practice and res["score"] > 0:
            if res["coins"]:
                credit(db, uid, res["coins"], "run", token)
            u = db.execute("SELECT best, records FROM users WHERE id = ?", (uid,)).fetchone()
            db.execute("UPDATE users SET runs = runs + 1, rows_total = rows_total + ?, deaths = deaths + ?, coins_collected = coins_collected + ? WHERE id = ?",
                       (res["score"], 1 if res["dead"] else 0, res["coins"], uid))
            if res["score"] > u["best"]:
                db.execute("UPDATE users SET best = ?, best_at = ? WHERE id = ?", (res["score"], now_ms(), uid))
            rec = jload(u["records"], {})
            for k in ("score", "roads", "rails", "logs", "coins"):
                rec[k] = max(int(rec.get(k, 0) or 0), int(st.get(k, res["coins"] if k == "coins" else 0) or 0))
            db.execute("UPDATE users SET records = ? WHERE id = ?", (json.dumps(rec), uid))
            owned = {r["char_id"] for r in db.execute("SELECT char_id FROM owned WHERE user_id = ?", (uid,))}
            for c in cat["challenges"]:
                if c["id"] not in owned and rec.get(c["stat"], 0) >= c["goal"]:
                    db.execute("INSERT OR IGNORE INTO owned (user_id, char_id, acquired, how) VALUES (?,?,?,?)", (uid, c["id"], now_ms(), "challenge"))
                    unlocked.append(c["id"])
    if mismatch:
        print(f"run {token[:8]}: client said {body['score']}, replay {res['score']}", flush=True)
    return {"result": {**st, "score": res["score"], "coins": res["coins"], "dead": res["dead"]}, "practice": practice,
            "unlocked": unlocked, "user": profile(uid), "daily": daily_state(uid), "champion": champion()}


# ---------------------------------------------------------------------------- daily missions
def assignment(day):
    rows = q("SELECT slot, cid FROM daily_assign WHERE day = ? ORDER BY slot", day)
    if len(rows) == 3:
        return [r["cid"] for r in rows]
    ids = worker.call("rotation", day=day)["ids"]
    with Tx() as db:
        for i, cid in enumerate(ids):
            db.execute("INSERT OR IGNORE INTO daily_assign (day, slot, cid) VALUES (?,?,?)", (day, i, cid))
    return [r["cid"] for r in q("SELECT slot, cid FROM daily_assign WHERE day = ? ORDER BY slot", day)]


def daily_state(uid, day=None):
    day = today() if day is None else day
    ids = assignment(day)
    prog = worker.call("daily", day=day, ids=ids, runs=day_runs(uid, day) if uid else [])["progress"]
    claimed = {r["cid"] for r in q("SELECT cid FROM daily_claims WHERE user_id = ? AND day = ?", uid, day)} if uid else set()
    defs = catalog()["dailyById"]
    out = []
    for cid, p in zip(ids, prog):
        d = defs[cid]
        out.append({**{k: d[k] for k in ("id", "tier", "rarity", "name", "desc", "base", "bonus", "reward", "goal")},
                    "value": p["value"], "done": p["done"], "claimed": cid in claimed})
    return {"day": day, "now": now_ms(), "resetAt": (day + 1) * DAY_MS, "challenges": out}


def api_daily(h, body):
    return daily_state(current_user(h, required=False))


def api_claim(h, body):
    uid = current_user(h)
    day = body.get("day")
    cid = str(body.get("id") or "")
    t = today()
    # today's missions, or yesterday's for an hour after the reset (a run that crossed midnight)
    if day not in (t, t - 1) or (day == t - 1 and now_ms() - t * DAY_MS > 3600 * 1000):
        raise ApiError(410, "That day's challenges have ended.")
    st = daily_state(uid, day)
    ch = next((c for c in st["challenges"] if c["id"] == cid), None)
    if not ch:
        raise ApiError(404, "That isn't one of the day's challenges.")
    if not ch["done"]:
        raise ApiError(409, "Not finished yet.")
    with Tx() as db:
        try:
            db.execute("INSERT INTO daily_claims (user_id, day, cid, amount, created) VALUES (?,?,?,?,?)", (uid, day, cid, ch["reward"], now_ms()))
        except sqlite3.IntegrityError:
            return {"already": True, "user": profile(uid), "daily": daily_state(uid)}
        credit(db, uid, ch["reward"], "daily", f"{day}:{cid}")
    return {"awarded": ch["reward"], "user": profile(uid), "daily": daily_state(uid)}


# ---------------------------------------------------------------------------- leaderboards
def load_legacy():
    global _legacy
    try:
        with open(LEGACY_FILE) as f:
            data = json.load(f)
        _legacy = [e for e in data if isinstance(e, dict) and "name" in e and "score" in e][:100]
    except (OSError, ValueError):
        _legacy = []


def api_leaderboard(h, body):
    rows = q("SELECT id, username, best, equipped FROM users WHERE best > 0 ORDER BY best DESC, best_at ASC, id ASC LIMIT ?", SHOW)
    top = [{"id": r["id"], "name": r["username"], "score": r["best"], "char": r["equipped"], "crown": i == 0} for i, r in enumerate(rows)]
    return {"top": top, "legacy": _legacy[:SHOW], "champion": champion()}


def api_session(h, body):
    uid = current_user(h, required=False)
    return {"user": profile(uid) if uid else None, "accounts": remembered(h), "champion": champion(), "now": now_ms()}


def api_me(h, body):
    return {"user": profile(current_user(h))}


def api_admin(h, body):
    code = str(body.get("code") or "").strip().lower()
    fails = [t for t in _rate.get(("adminfail", h.ip), []) if time.time() - t < 600]
    if len(fails) >= 6:
        raise ApiError(429, "Too many tries, wait a few minutes")
    if not ADMIN_CODE or not hmac.compare_digest(code.encode(), ADMIN_CODE.encode()):
        _rate[("adminfail", h.ip)] = fails + [time.time()]
        raise ApiError(403, "Unknown code")
    if body.get("action") == "save":
        rows = body.get("rows")
        if not isinstance(rows, list) or len(rows) > 200:
            raise ApiError(400, "Bad rows")
        if body.get("board") == "legacy":
            out = []
            for r in rows:
                if isinstance(r, dict) and isinstance(r.get("score"), int) and 0 <= r["score"] <= 999999:
                    name, _, err = check_name(r.get("name"))
                    if not err:
                        out.append({"name": name, "score": r["score"], "char": r.get("char") or "chicken", "t": r.get("t") if isinstance(r.get("t"), int) else int(time.time())})
            out.sort(key=lambda e: (-e["score"], e["t"]))
            _legacy[:] = out[:100]
            os.makedirs(DATA_DIR, exist_ok=True)
            with open(LEGACY_FILE + ".tmp", "w") as f:
                json.dump(_legacy, f)
            os.replace(LEGACY_FILE + ".tmp", LEGACY_FILE)
        else:
            # account board: change a player's best score (0 takes them off the board)
            with Tx() as db:
                for r in rows:
                    if isinstance(r, dict) and isinstance(r.get("id"), int) and isinstance(r.get("score"), int) and 0 <= r["score"] <= 999999:
                        db.execute("UPDATE users SET best = ?, best_at = COALESCE(best_at, ?) WHERE id = ?", (r["score"], now_ms(), r["id"]))
    accounts = [{"id": r["id"], "name": r["username"], "score": r["best"]} for r in q("SELECT id, username, best FROM users WHERE best > 0 ORDER BY best DESC, best_at ASC, id ASC LIMIT 100")]
    return {"rows": accounts, "legacy": _legacy}


ROUTES = {
    ("GET", "/api/session"): api_session, ("GET", "/api/me"): api_me, ("GET", "/api/daily"): api_daily,
    ("GET", "/api/leaderboard"): api_leaderboard,
    ("POST", "/api/auth/check"): api_check, ("POST", "/api/auth/register"): api_register, ("POST", "/api/auth/login"): api_login,
    ("POST", "/api/auth/switch"): api_switch, ("POST", "/api/auth/logout"): api_logout, ("POST", "/api/auth/recover"): api_recover,
    ("POST", "/api/auth/pin"): api_pin, ("POST", "/api/me/settings"): api_settings, ("POST", "/api/me/equip"): api_equip,
    ("POST", "/api/shop/buy"): api_buy, ("POST", "/api/shop/prize"): api_prize, ("POST", "/api/redeem"): api_redeem,
    ("POST", "/api/migrate"): api_migrate, ("POST", "/api/run/start"): api_run_start, ("POST", "/api/run/finish"): api_run_finish,
    ("POST", "/api/daily/claim"): api_claim, ("POST", "/api/admin"): api_admin,
}


# ---------------------------------------------------------------------------- http
class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".mjs": "text/javascript", ".js": "text/javascript"}

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
                if n > 2_000_000:
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
        except Exception as e:      # never leak internals
            print(f"error on {route}: {e!r}", flush=True)
            return self._json(500, {"error": "Something went wrong on our side. Try again."})

    def do_GET(self):
        path = self.path.split("?")[0]
        if wsnet.is_upgrade(self):
            return races.serve_socket(self)
        if path.startswith("/api/"):
            return self._api("GET")
        if path in ("/data", "/ws") or path.startswith("/data/") or path.startswith("/tools/") or path.endswith(".py") or path.endswith(".db"):
            return self._json(404, {"error": "Not found"})
        return super().do_GET()

    def do_POST(self):
        return self._api("POST")

    def send_head(self):
        if self.path.split("?")[0] == "/healthz":
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return None if self.command == "HEAD" else _Body(body)
        return super().send_head()

    def log_message(self, fmt, *args):
        if self.path.split("?")[0] not in ("/healthz", "/ws"):
            super().log_message(fmt, *args)


class _Body:
    def __init__(self, data):
        self._data, self._read = data, False

    def read(self, *_):
        if self._read:
            return b""
        self._read = True
        return self._data

    def close(self):
        pass


def daily_backups():
    while True:
        time.sleep(24 * 3600)
        try:
            with _lock:
                backup("daily")
        except Exception as exc:
            print(f"backup failed: {exc!r}", flush=True)


def main():
    open_db()
    load_legacy()
    catalog()
    threading.Thread(target=daily_backups, daemon=True).start()
    races.start_thread()
    n = q1("SELECT COUNT(*) FROM users")[0]
    print(f"crossy-road: {n} accounts, {len(_legacy)} classic scores, db {DB_FILE}", flush=True)
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), partial(Handler, directory=ROOT))
    print(f"crossy-road on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
