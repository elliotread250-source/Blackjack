"""Static file server for Cookie Clicker, plus the biggest-bakeries leaderboard.

Stdlib only. Railway hands us the port on $PORT and mounts a volume at $DATA_DIR
(default /data) so the board survives redeploys.

API:
  GET  /api/leaderboard                     -> {"top": [{name, baked, cps, t}, ...]}
  POST /api/score {name, baked, cps}        -> {"ok", "rank", "top"}

The game posts your bakery's all-time cookies now and then; each name keeps its biggest.
An idle game can't be verified from the server, so this is just cleaned names, sane
numbers and a per-IP rate limit.
"""

import json
import math
import os
import re
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR") or ("/data" if os.path.isdir("/data") else os.path.join(ROOT, "data"))
BOARD_FILE = os.path.join(DATA_DIR, "leaderboard.json")
KEEP, SHOW = 100, 20
BLOCKED = re.compile(r"fuck|shit|cunt|nigg|fag|bitch|whore|slut|rape|nazi|hitler|penis|cock|dick|pussy|wank", re.I)

_lock = threading.Lock()
_last_post = {}
_board = []


def _load():
    global _board
    try:
        with open(BOARD_FILE) as f:
            _board = [e for e in json.load(f) if isinstance(e, dict) and "name" in e and "baked" in e][:KEEP]
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
    return None if not name or BLOCKED.search(name.replace(" ", "")) else name


def submit(ip, body):
    now = time.time()
    name = clean_name(body.get("name"))
    if not name:
        return 400, {"error": "Pick a different name"}
    try:
        baked = float(body.get("baked")); cps = float(body.get("cps") or 0)
    except (TypeError, ValueError):
        return 400, {"error": "Bad score"}
    if not (math.isfinite(baked) and math.isfinite(cps)) or baked < 1 or baked > 1e300 or cps < 0:
        return 400, {"error": "Bad score"}
    with _lock:
        if now - _last_post.get(ip, 0) < 10:
            return 429, {"error": "Slow down"}
        _last_post[ip] = now
        key = name.lower()
        mine = next((e for e in _board if e["name"].lower() == key), None)
        if mine is None or baked > mine["baked"]:
            if mine is not None:
                _board.remove(mine)
            _board.append({"name": name, "baked": baked, "cps": cps, "t": int(now)})
            _board.sort(key=lambda e: (-e["baked"], e["t"]))
            del _board[KEEP:]
            try:
                _save()
            except OSError as exc:
                print(f"leaderboard save failed: {exc}", flush=True)
        best = next((e for e in _board if e["name"].lower() == key), None)
        return 200, {"ok": True, "rank": _board.index(best) + 1 if best else None, "top": _board[:SHOW]}


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
            with _lock:
                return self._json(200, {"top": _board[:SHOW]})
        if path == "/data" or path.startswith("/data/"):
            return self._json(404, {"error": "Not found"})
        return super().do_GET()

    def do_POST(self):
        route = self.path.split("?")[0]
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
    print(f"cookie-clicker on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
