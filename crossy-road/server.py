"""Static file server for Crossy Road, plus the global leaderboard.

Deliberately stdlib-only: the game is static files with no build step, and the
leaderboard is one small JSON file, so pulling in a framework or a database
would just be more to break. Railway hands us the port on $PORT and mounts a
volume at $DATA_DIR (default /data) so scores survive redeploys.

API:
  GET  /api/leaderboard          -> {"top": [{name, score, char, t}, ...]}
  POST /api/run                  -> {"run": token}   (call when a run starts)
  POST /api/score {run, name, score, char} -> {"ok", "rank", "best", "top"}

There's no way to fully stop a determined cheater with a client-side game, so
the server sticks to cheap checks: a score needs a run token issued long enough
ago for that many hops, names are cleaned up, and each IP is rate limited.
"""

import json
import os
import re
import secrets
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR") or ("/data" if os.path.isdir("/data") else os.path.join(ROOT, "data"))
BOARD_FILE = os.path.join(DATA_DIR, "leaderboard.json")

KEEP = 100            # entries kept on disk (one per name)
SHOW = 20             # entries sent to clients
MAX_SCORE = 10000
HOPS_PER_SEC = 7.5    # one hop is 8 ticks at 60 Hz, so nobody can beat this
RUN_TTL = 6 * 3600
CHARS = {"chicken", "duck", "frog", "pig", "cat", "penguin", "fox", "panda", "robot", "unicorn"}
BLOCKED = re.compile(r"fuck|shit|cunt|nigg|fag|bitch|whore|slut|rape|nazi|hitler|penis|cock|dick|pussy|wank", re.I)

_lock = threading.Lock()
_runs = {}            # token -> issue time
_last_post = {}       # ip -> last score post time
_board = []


def _load():
    global _board
    try:
        with open(BOARD_FILE) as f:
            data = json.load(f)
        _board = [e for e in data if isinstance(e, dict) and "name" in e and "score" in e][:KEEP]
    except (OSError, ValueError):
        _board = []


def _save():
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = BOARD_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(_board, f)
    os.replace(tmp, BOARD_FILE)


def clean_name(raw):
    name = re.sub(r"[^A-Za-z0-9 _.\-]", "", str(raw or ""))
    name = re.sub(r"\s+", " ", name).strip()[:14]
    if not name or BLOCKED.search(name.replace(" ", "")):
        return None
    return name


def new_run():
    now = time.time()
    with _lock:
        if len(_runs) > 20000:
            for k in [k for k, t in _runs.items() if now - t > RUN_TTL]:
                del _runs[k]
        token = secrets.token_urlsafe(12)
        _runs[token] = now
    return token


def submit(ip, body):
    """Returns (status, payload)."""
    now = time.time()
    name = clean_name(body.get("name"))
    if not name:
        return 400, {"error": "Pick a different name"}
    try:
        score = int(body.get("score"))
    except (TypeError, ValueError):
        return 400, {"error": "Bad score"}
    if score < 1 or score > MAX_SCORE:
        return 400, {"error": "Bad score"}
    char = body.get("char") if body.get("char") in CHARS else "chicken"
    with _lock:
        if now - _last_post.get(ip, 0) < 2:
            return 429, {"error": "Slow down"}
        _last_post[ip] = now
        started = _runs.pop(str(body.get("run") or ""), None)
        if started is None:
            return 409, {"error": "Run expired"}
        if score > (now - started) * HOPS_PER_SEC + 3:
            return 400, {"error": "Too fast"}
        key = name.lower()
        mine = next((e for e in _board if e["name"].lower() == key), None)
        if mine is None or score > mine["score"]:
            if mine is not None:
                _board.remove(mine)
            _board.append({"name": name, "score": score, "char": char, "t": int(now)})
            _board.sort(key=lambda e: (-e["score"], e["t"]))
            del _board[KEEP:]
            try:
                _save()
            except OSError as exc:
                print(f"leaderboard save failed: {exc}", flush=True)
        best = next((e for e in _board if e["name"].lower() == key), None)
        rank = _board.index(best) + 1 if best else None
        return 200, {"ok": True, "rank": rank, "best": best["score"] if best else score, "top": _board[:SHOW]}


def top():
    with _lock:
        return {"top": _board[:SHOW]}


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # The page is the app; if it gets cached hard, a fix never reaches
        # anyone who already played. Cheap file, so just don't cache it.
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def _json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _ip(self):
        fwd = self.headers.get("X-Forwarded-For", "")
        return fwd.split(",")[0].strip() or self.client_address[0]

    def do_GET(self):
        if self.path.split("?")[0] == "/api/leaderboard":
            return self._json(200, top())
        return super().do_GET()

    def do_POST(self):
        route = self.path.split("?")[0]
        if route == "/api/run":
            return self._json(200, {"run": new_run()})
        if route == "/api/score":
            try:
                n = int(self.headers.get("Content-Length") or 0)
                body = json.loads(self.rfile.read(min(n, 4096)) or b"{}") if n else {}
                if not isinstance(body, dict):
                    raise ValueError
            except ValueError:
                return self._json(400, {"error": "Bad request"})
            return self._json(*submit(self._ip(), body))
        return self._json(404, {"error": "Not found"})

    def send_head(self):
        # /healthz for Railway's checks, without a 404 in the logs.
        if self.path.split("?")[0] == "/healthz":
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return None if self.command == "HEAD" else _Body(body)
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
    _load()
    print(f"leaderboard: {len(_board)} entries in {BOARD_FILE}", flush=True)
    port = int(os.environ.get("PORT", "8080"))
    handler = partial(Handler, directory=ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    print(f"crossy-road on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
