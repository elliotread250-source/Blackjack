"""Static file server for Nosy Neighbour, plus a fastest-times leaderboard.

Deliberately stdlib-only. Railway hands us the port on $PORT and mounts a volume
at $DATA_DIR (default /data) so times survive redeploys.

API:
  GET  /api/leaderboard?level=N            -> {"top": [{name, time, caught, diff, t}, ...]}
  POST /api/run                             -> {"run": token}   (when a game starts or resumes)
  POST /api/score {run, name, level, time, caught, diff} -> {"ok", "rank", "best", "top"}

Each name keeps its best (fastest, then fewest catches) per level. Cheap checks only:
a run token old enough for the claimed time to be plausible, cleaned names, rate limits.
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
LEVELS = 5
KEEP, SHOW = 100, 20
MIN_TIME = 15            # seconds: nobody finishes a level faster than this
RUN_TTL = 12 * 3600
DIFFS = {"Easy", "Normal", "Hard"}
BLOCKED = re.compile(r"fuck|shit|cunt|nigg|fag|bitch|whore|slut|rape|nazi|hitler|penis|cock|dick|pussy|wank", re.I)

_lock = threading.Lock()
_runs, _last_post = {}, {}
_boards = {str(i): [] for i in range(LEVELS)}


def _load():
    try:
        with open(BOARD_FILE) as f:
            data = json.load(f)
        for k in _boards:
            _boards[k] = [e for e in data.get(k, []) if isinstance(e, dict) and "name" in e and "time" in e][:KEEP]
    except (OSError, ValueError, AttributeError):
        pass


def _save():
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = BOARD_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(_boards, f)
    os.replace(tmp, BOARD_FILE)


def clean_name(raw):
    name = re.sub(r"[^A-Za-z0-9 _.\-]", "", str(raw or ""))
    name = re.sub(r"\s+", " ", name).strip()[:14]
    return None if not name or BLOCKED.search(name.replace(" ", "")) else name


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
    now = time.time()
    name = clean_name(body.get("name"))
    if not name:
        return 400, {"error": "Pick a different name"}
    level = str(body.get("level"))
    if level not in _boards:
        return 400, {"error": "Bad level"}
    try:
        t = round(float(body.get("time")), 1)
        caught = max(0, int(body.get("caught") or 0))
    except (TypeError, ValueError):
        return 400, {"error": "Bad time"}
    if not (MIN_TIME <= t <= 6 * 3600):
        return 400, {"error": "Bad time"}
    diff = body.get("diff") if body.get("diff") in DIFFS else "Normal"
    with _lock:
        if now - _last_post.get(ip, 0) < 3:
            return 429, {"error": "Slow down"}
        _last_post[ip] = now
        started = _runs.pop(str(body.get("run") or ""), None)
        if started is None:
            return 409, {"error": "Run expired"}
        if now - started < min(t, 60) * 0.5:
            return 400, {"error": "Too fast"}
        board = _boards[level]
        key = name.lower()
        mine = next((e for e in board if e["name"].lower() == key), None)
        if mine is None or (t, caught) < (mine["time"], mine["caught"]):
            if mine is not None:
                board.remove(mine)
            board.append({"name": name, "time": t, "caught": caught, "diff": diff, "t": int(now)})
            board.sort(key=lambda e: (e["time"], e["caught"], e["t"]))
            del board[KEEP:]
            try:
                _save()
            except OSError as exc:
                print(f"leaderboard save failed: {exc}", flush=True)
        best = next((e for e in board if e["name"].lower() == key), None)
        return 200, {"ok": True, "rank": board.index(best) + 1 if best else None, "best": best, "top": board[:SHOW]}


class Handler(SimpleHTTPRequestHandler):
    def _json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _ip(self):
        fwd = self.headers.get("X-Forwarded-For", "")
        return fwd.split(",")[0].strip() or self.client_address[0]

    def do_GET(self):
        path, _, query = self.path.partition("?")
        if path == "/api/leaderboard":
            level = (re.search(r"level=(\d+)", query) or [None, "0"])[1]
            with _lock:
                return self._json(200, {"top": _boards.get(level, [])[:SHOW]})
        if path == "/data" or path.startswith("/data/"):
            return self._json(404, {"error": "Not found"})
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

    def end_headers(self):
        # The page is the app; if it gets cached hard, a fix never reaches
        # anyone who already played. Cheap file, so just don't cache it.
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

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
    port = int(os.environ.get("PORT", "8080"))
    handler = partial(Handler, directory=ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    print(f"neighbour on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
