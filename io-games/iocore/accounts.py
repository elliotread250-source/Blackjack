"""Username + PIN accounts, the same scheme Retro Bowl and Crossy Road use.

A username is unique ignoring capitals; the PIN (4-8 digits) and a one-time recovery code are stored
hashed with scrypt. A device gets a random HttpOnly cookie and every account signed in on it is
remembered, so a shared computer can switch players; a new device always needs the PIN. Wrong PINs
back off per username, and every route is rate limited per IP.

The WebSocket upgrade carries the same cookie, so the game server knows who is playing without the
browser ever sending a name or id of its own.
"""

import hashlib
import hmac
import re
import secrets
import sqlite3
import time

from .store import Tx, lock, now, q, q1

COOKIE = "io_dev"
SCRYPT = dict(n=2 ** 14, r=8, p=1, dklen=32)
NAME_RE = re.compile(r"^[A-Za-z0-9 _.\-]{3,14}$")
PIN_RE = re.compile(r"^[0-9]{4,8}$")
BLOCKED = re.compile(r"fuck|shit|cunt|nigg|fag|bitch|whore|slut|rape|nazi|hitler|penis|cock|dick|pussy|wank", re.I)

_rate = {}
_login_fail = {}


class ApiError(Exception):
    def __init__(self, status, msg, **extra):
        super().__init__(msg)
        self.status, self.msg, self.extra = status, msg, extra


def limited(bucket, key, limit, window):
    """Sliding-window limiter: True when `key` has used up `limit` hits in the last `window` seconds."""
    t = time.time()
    with lock:
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


def public_user(uid):
    u = q1("SELECT id, username FROM users WHERE id = ?", uid)
    return {"id": u["id"], "username": u["username"]} if u else None


# ---------------------------------------------------------------------------- device sessions
def _token_hash(raw):
    if re.fullmatch(r"[A-Za-z0-9_\-]{40,64}", raw or ""):
        return hashlib.sha256(raw.encode()).hexdigest()
    return None


def device_of(h, create=False):
    th = _token_hash(h.cookies.get(COOKIE, ""))
    if th:
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


def user_for_cookie(raw):
    """The signed-in user for a raw device cookie, or None. Used by the WebSocket upgrade."""
    th = _token_hash(raw)
    if not th:
        return None
    row = q1("""SELECT u.id, u.username FROM devices d JOIN device_logins l ON l.token_hash = d.token_hash AND l.user_id = d.active_user
                JOIN users u ON u.id = d.active_user WHERE d.token_hash = ?""", th)
    return {"id": row["id"], "username": row["username"]} if row else None


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
    with lock:
        count, _ = _login_fail.get(uname, (0, 0))
        count += 1
        until = time.time() + 60 * (2 ** min(count - 5, 6)) if count >= 5 else 0
        _login_fail[uname] = (count, until)


# ---------------------------------------------------------------------------- routes
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
    # hash even for unknown names so timing doesn't reveal which usernames exist
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


ROUTES = {
    ("GET", "/api/session"): api_session, ("POST", "/api/auth/check"): api_check,
    ("POST", "/api/auth/register"): api_register, ("POST", "/api/auth/login"): api_login,
    ("POST", "/api/auth/switch"): api_switch, ("POST", "/api/auth/logout"): api_logout,
    ("POST", "/api/auth/recover"): api_recover,
}
