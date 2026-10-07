"""Game server for the Geometry Dash replica: the static game plus a small API.

Stdlib only (http.server + sqlite3), so there is nothing to install. Railway
hands us the port on $PORT and a persistent volume at /data for the database.

API (JSON in and out; CORS open so the GitHub Pages copy can use it too):
  POST /api/register        {name}                    -> {token, id, name}
  POST /api/whoami          {token}                   -> {id, name}
  POST /api/save            {token, data}             -> {ok}      cloud save
  POST /api/load            {token}                   -> {data, at}
  POST /api/score           {token, stars, demons, coins, levels, practice}
  GET  /api/leaderboard     ?by=stars|demons|coins|levels
  GET  /api/levels          ?sort=new|top|liked&q=&page=
  POST /api/levels          {token, name, code, face} -> {id}      upload
  GET  /api/levels/<id>                               -> level + code (counts a play)
  POST /api/levels/<id>/like    {token}
  POST /api/levels/<id>/report  {token}               hidden after 5 reports
  POST /api/levels/<id>/delete  {token}               your own levels only

Accounts have no password: the server hands out a random token, keeps only
its hash, and the token doubles as the "account code" for other devices.
"""

import hashlib
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
DB_PATH = os.path.join(DATA_DIR, "gd.sqlite3")

MAX_BODY = 600_000          # cloud saves are ~20-200KB
MAX_CODE = 120_000          # a shared level link
FACES = {"Easy", "Normal", "Hard", "Harder", "Insane", "Easy Demon", "Medium Demon",
         "Hard Demon", "Insane Demon", "Extreme Demon"}
CODE_RE = re.compile(r"^[zj][A-Za-z0-9_-]{4,}$")
PAGE = 30

_db_lock = threading.Lock()
_db = None


def db():
    global _db
    if _db is None:
        os.makedirs(DATA_DIR, exist_ok=True)
        _db = sqlite3.connect(DB_PATH, check_same_thread=False)
        _db.row_factory = sqlite3.Row
        _db.executescript("""
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS players (
              id INTEGER PRIMARY KEY, name TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL,
              created REAL NOT NULL, save TEXT, save_at REAL,
              stars INTEGER DEFAULT 0, demons INTEGER DEFAULT 0, coins INTEGER DEFAULT 0,
              levels INTEGER DEFAULT 0, practice INTEGER DEFAULT 0, score_at REAL);
            CREATE TABLE IF NOT EXISTS levels (
              id INTEGER PRIMARY KEY, player INTEGER NOT NULL, name TEXT NOT NULL, face TEXT,
              code TEXT NOT NULL, objects INTEGER DEFAULT 0, created REAL NOT NULL,
              plays INTEGER DEFAULT 0, likes INTEGER DEFAULT 0, reports INTEGER DEFAULT 0,
              hidden INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS votes (
              level INTEGER NOT NULL, player INTEGER NOT NULL, kind TEXT NOT NULL,
              PRIMARY KEY (level, player, kind));
            CREATE INDEX IF NOT EXISTS levels_created ON levels(created);
        """)
    return _db


def q(sql, args=(), one=False, write=False):
    with _db_lock:
        cur = db().execute(sql, args)
        if write:
            db().commit()
            return cur.lastrowid
        rows = cur.fetchall()
    return (rows[0] if rows else None) if one else rows


def clean_name(s, n):
    """Printable text only, collapsed spaces, at most n characters."""
    s = re.sub(r"[\x00-\x1f\x7f<>]", "", str(s or ""))
    s = re.sub(r"\s+", " ", s).strip()
    return s[:n]


def token_hash(t):
    return hashlib.sha256(str(t).encode()).hexdigest()


class ApiError(Exception):
    def __init__(self, status, msg):
        super().__init__(msg)
        self.status = status
        self.msg = msg


# Per-IP write limiter: 40 writes a minute is plenty for one player.
_hits = {}
_hits_lock = threading.Lock()


def limit(ip, n=40, window=60):
    now = time.time()
    with _hits_lock:
        recent = [t for t in _hits.get(ip, []) if now - t < window]
        if len(recent) >= n:
            raise ApiError(429, "slow down")
        recent.append(now)
        _hits[ip] = recent


def player_for(body):
    tok = body.get("token")
    if not isinstance(tok, str) or len(tok) < 20:
        raise ApiError(401, "no account")
    row = q("SELECT * FROM players WHERE token_hash=?", (token_hash(tok),), one=True)
    if not row:
        raise ApiError(401, "unknown account")
    return row


def level_row(r, code=False):
    out = {
        "id": r["id"], "name": r["name"], "face": r["face"], "author": r["author"],
        "objects": r["objects"], "created": r["created"], "plays": r["plays"], "likes": r["likes"],
    }
    if code:
        out["code"] = r["code"]
    return out


def as_int(v, lo=0, hi=1_000_000):
    try:
        return max(lo, min(hi, int(v)))
    except (TypeError, ValueError):
        return lo


# ------------------------------------------------------------------ routes

def api_get(path, params):
    if path == "/api/leaderboard":
        by = params.get("by", "stars")
        if by not in ("stars", "demons", "coins", "levels"):
            by = "stars"
        rows = q(f"SELECT id, name, stars, demons, coins, levels, practice FROM players "
                 f"WHERE score_at IS NOT NULL ORDER BY {by} DESC, score_at ASC LIMIT 50")
        return {"by": by, "players": [dict(r) for r in rows]}
    if path == "/api/levels":
        sort = params.get("sort", "new")
        order = {"top": "plays DESC", "liked": "likes DESC"}.get(sort, "created DESC")
        page = as_int(params.get("page"), 0, 1000)
        text = clean_name(params.get("q", ""), 30)
        where, args = "WHERE l.hidden=0", []
        if text:
            where += " AND (l.name LIKE ? OR p.name LIKE ?)"
            args += [f"%{text}%", f"%{text}%"]
        rows = q(f"SELECT l.*, p.name AS author FROM levels l JOIN players p ON p.id=l.player {where} "
                 f"ORDER BY {order}, l.id DESC LIMIT ? OFFSET ?", args + [PAGE, page * PAGE])
        return {"levels": [level_row(r) for r in rows], "page": page, "more": len(rows) == PAGE}
    m = re.fullmatch(r"/api/levels/(\d+)", path)
    if m:
        r = q("SELECT l.*, p.name AS author FROM levels l JOIN players p ON p.id=l.player "
              "WHERE l.id=? AND l.hidden=0", (int(m.group(1)),), one=True)
        if not r:
            raise ApiError(404, "level not found")
        q("UPDATE levels SET plays=plays+1 WHERE id=?", (r["id"],), write=True)
        return level_row(r, code=True)
    raise ApiError(404, "no such endpoint")


def api_post(path, body):
    if path == "/api/register":
        name = clean_name(body.get("name"), 20)
        if len(name) < 2:
            raise ApiError(400, "pick a name of at least 2 characters")
        tok = secrets.token_urlsafe(24)
        pid = q("INSERT INTO players (name, token_hash, created) VALUES (?,?,?)",
                (name, token_hash(tok), time.time()), write=True)
        return {"token": tok, "id": pid, "name": name}
    if path == "/api/whoami":
        p = player_for(body)
        return {"id": p["id"], "name": p["name"]}
    if path == "/api/rename":
        p = player_for(body)
        name = clean_name(body.get("name"), 20)
        if len(name) < 2:
            raise ApiError(400, "pick a name of at least 2 characters")
        q("UPDATE players SET name=? WHERE id=?", (name, p["id"]), write=True)
        return {"ok": True, "name": name}
    if path == "/api/save":
        p = player_for(body)
        data = body.get("data")
        if not isinstance(data, dict):
            raise ApiError(400, "bad save")
        blob = json.dumps({k: v for k, v in data.items() if isinstance(k, str) and k.startswith("gdr:")
                           and isinstance(v, str)})
        if len(blob) > MAX_BODY:
            raise ApiError(413, "save too big")
        now = time.time()
        q("UPDATE players SET save=?, save_at=? WHERE id=?", (blob, now, p["id"]), write=True)
        return {"ok": True, "at": now}
    if path == "/api/load":
        p = player_for(body)
        return {"data": json.loads(p["save"]) if p["save"] else None, "at": p["save_at"]}
    if path == "/api/score":
        p = player_for(body)
        q("UPDATE players SET stars=?, demons=?, coins=?, levels=?, practice=?, score_at=? WHERE id=?",
          (as_int(body.get("stars"), 0, 500), as_int(body.get("demons"), 0, 50), as_int(body.get("coins"), 0, 1000),
           as_int(body.get("levels"), 0, 50), as_int(body.get("practice"), 0, 1000), time.time(), p["id"]),
          write=True)
        return {"ok": True}
    if path == "/api/levels":
        p = player_for(body)
        name = clean_name(body.get("name"), 28) or "Untitled"
        code = body.get("code")
        if not isinstance(code, str) or len(code) > MAX_CODE or not CODE_RE.match(code):
            raise ApiError(400, "bad level code")
        face = body.get("face") if body.get("face") in FACES else "Normal"
        mine = q("SELECT COUNT(*) AS n FROM levels WHERE player=? AND created>?",
                 (p["id"], time.time() - 3600), one=True)["n"]
        if mine >= 10:
            raise ApiError(429, "that's 10 uploads this hour, try later")
        dup = q("SELECT id FROM levels WHERE player=? AND code=?", (p["id"], code), one=True)
        if dup:
            return {"id": dup["id"], "existing": True}
        lid = q("INSERT INTO levels (player, name, face, code, objects, created) VALUES (?,?,?,?,?,?)",
                (p["id"], name, face, code, as_int(body.get("objects"), 0, 100000), time.time()), write=True)
        return {"id": lid}
    m = re.fullmatch(r"/api/levels/(\d+)/(like|report|delete)", path)
    if m:
        p = player_for(body)
        lid, act = int(m.group(1)), m.group(2)
        lv = q("SELECT * FROM levels WHERE id=?", (lid,), one=True)
        if not lv:
            raise ApiError(404, "level not found")
        if act == "delete":
            if lv["player"] != p["id"]:
                raise ApiError(403, "not your level")
            q("DELETE FROM levels WHERE id=?", (lid,), write=True)
            return {"ok": True}
        try:
            q("INSERT INTO votes (level, player, kind) VALUES (?,?,?)", (lid, p["id"], act), write=True)
        except sqlite3.IntegrityError:
            return {"ok": True, "already": True}
        col = "likes" if act == "like" else "reports"
        q(f"UPDATE levels SET {col}={col}+1, hidden=CASE WHEN reports+1>=5 AND ?='reports' THEN 1 ELSE hidden END "
          f"WHERE id=?", (col, lid), write=True)
        return {"ok": True}
    raise ApiError(404, "no such endpoint")


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
        ".js": "text/javascript",
    }

    def end_headers(self):
        # The page is the app; if it gets cached hard, a fix never reaches
        # anyone who already played. Cheap file, so just don't cache it.
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    # --- API plumbing
    def _ip(self):
        fwd = self.headers.get("X-Forwarded-For", "")
        return fwd.split(",")[0].strip() or self.client_address[0]

    def _json(self, status, obj):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def _api(self, method):
        path, _, query = self.path.partition("?")
        params = {}
        for part in query.split("&"):
            if "=" in part:
                k, v = part.split("=", 1)
                from urllib.parse import unquote_plus
                params[unquote_plus(k)] = unquote_plus(v)
        try:
            if method == "GET":
                return self._json(200, api_get(path, params))
            limit(self._ip())
            n = int(self.headers.get("Content-Length") or 0)
            if n > MAX_BODY:
                raise ApiError(413, "too big")
            try:
                body = json.loads(self.rfile.read(n) or b"{}")
            except ValueError:
                raise ApiError(400, "bad json")
            if not isinstance(body, dict):
                raise ApiError(400, "bad json")
            self._json(200, api_post(path, body))
        except ApiError as e:
            self._json(e.status, {"error": e.msg})
        except Exception as e:  # never leak a traceback to the client
            print("api error:", repr(e), flush=True)
            self._json(500, {"error": "server error"})

    def do_GET(self):
        if self.path.startswith("/api/"):
            return self._api("GET")
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/"):
            return self._api("POST")
        self._json(404, {"error": "not found"})

    def send_head(self):
        # /healthz for Railway's checks, without a 404 in the logs.
        if self.path.split("?")[0] == "/healthz":
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return None if self.command == "HEAD" else _Body(body)
        # Never serve the database or dev tools as files.
        if self.path.split("?")[0].startswith(("/data", "/tools", "/server.py", "/Dockerfile")):
            self.send_error(404)
            return None
        return super().send_head()

    def log_message(self, fmt, *args):
        if self.path.split("?")[0] != "/healthz":
            super().log_message(fmt, *args)


class _Body:
    """Minimal file-like wrapper so copyfile() can write a literal response."""

    def __init__(self, data):
        self._data = data
        self._read = False

    def read(self, *_args):
        if self._read:
            return b""
        self._read = True
        return self._data

    def close(self):
        pass


def main():
    port = int(os.environ.get("PORT", "8080"))
    db()  # create tables up front so a bad volume fails the deploy, not a player
    handler = partial(Handler, directory=ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    print(f"geometry dash replica running on :{port}, data in {DATA_DIR}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
