"""Static file server for this folder, plus the suggestions box.

Stdlib only: the page is plain HTML and JS with no build step. Railway hands us
the port on $PORT and checks /healthz.

Suggestions: POST /api/suggestions {text, name} saves one to a JSON file on the
Railway volume at $DATA_DIR (default /data), so they survive redeploys. Reading
them back is POST /api/suggestions/view {code}; the code is the
SUGGESTIONS_CODE environment variable (kept out of the public repo), compared
in constant time. Posting and viewing are both rate limited per IP.
"""

import hmac
import json
import os
import re
import threading
import time
import uuid
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR") or ("/data" if os.path.isdir("/data") else os.path.join(ROOT, "data"))
SUGGESTIONS_FILE = os.path.join(DATA_DIR, "suggestions.json")
KEEP = 5000                 # newest suggestions kept on disk
MAX_TEXT, MAX_NAME = 1000, 40
POSTS_PER_WINDOW, VIEWS_PER_WINDOW, WINDOW = 5, 12, 600

_lock = threading.Lock()
_suggestions = []
_posts = {}                 # ip -> [times]
_views = {}


def _load():
    global _suggestions
    try:
        with open(SUGGESTIONS_FILE) as f:
            data = json.load(f)
        _suggestions = [s for s in data if isinstance(s, dict) and isinstance(s.get("text"), str)][-KEEP:]
    except (OSError, ValueError):
        _suggestions = []


def _save():
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = SUGGESTIONS_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(_suggestions, f)
    os.replace(tmp, SUGGESTIONS_FILE)


def _limited(table, ip, limit):
    """True if `ip` has used up `limit` actions in the window (and records this one otherwise)."""
    now = time.time()
    hits = [t for t in table.get(ip, []) if now - t < WINDOW]
    if len(hits) >= limit:
        table[ip] = hits
        return True
    hits.append(now)
    table[ip] = hits
    if len(table) > 50000:
        for k in [k for k, v in table.items() if not v or now - v[-1] > WINDOW]:
            del table[k]
    return False


def _clean(raw, limit):
    text = str(raw or "").replace("\r\n", "\n")
    text = re.sub(r"[\x00-\x08\x0b-\x1f\x7f]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text[:limit]


def add_suggestion(ip, body):
    text = _clean(body.get("text"), MAX_TEXT)
    name = re.sub(r"\s+", " ", _clean(body.get("name"), MAX_NAME))
    if len(text) < 3:
        return 400, {"error": "Write a little more first."}
    with _lock:
        if _limited(_posts, ip, POSTS_PER_WINDOW):
            return 429, {"error": "Thanks! That's a lot of ideas — try again in a few minutes."}
        if any(s["text"] == text for s in _suggestions[-50:]):
            return 200, {"ok": True}
        _suggestions.append({"id": uuid.uuid4().hex[:10], "time": int(time.time()), "name": name, "text": text})
        del _suggestions[:-KEEP]
        _save()
    return 201, {"ok": True}


def view_suggestions(ip, body):
    code = os.environ.get("SUGGESTIONS_CODE", "")
    with _lock:
        if _limited(_views, ip, VIEWS_PER_WINDOW):
            return 429, {"error": "Too many tries. Wait a few minutes."}
    if not code or not hmac.compare_digest(str(body.get("code") or "").encode(), code.encode()):
        return 403, {"error": "Wrong code."}
    with _lock:
        return 200, {"suggestions": list(reversed(_suggestions))}


class Handler(SimpleHTTPRequestHandler):
    # Pin the types: under nosniff a script served with the wrong type is refused.
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".json": "application/json",
        ".webmanifest": "application/manifest+json",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

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
        if self.path.split("?")[0] == "/healthz":
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path.split("?")[0] == "/data" or self.path.startswith("/data/"):
            return self._json(404, {"error": "Not found"})  # never serve a local data folder
        super().do_GET()

    def do_POST(self):
        route = self.path.split("?")[0]
        if route not in ("/api/suggestions", "/api/suggestions/view"):
            return self._json(404, {"error": "Not found"})
        try:
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(min(n, 8192)) or b"{}") if n else {}
            if not isinstance(body, dict):
                raise ValueError
        except ValueError:
            return self._json(400, {"error": "Bad request"})
        if route == "/api/suggestions":
            return self._json(*add_suggestion(self._ip(), body))
        return self._json(*view_suggestions(self._ip(), body))

    def log_message(self, fmt, *args):
        if self.path.split("?")[0] != "/healthz":
            super().log_message(fmt, *args)


def main():
    _load()
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), partial(Handler, directory=ROOT))
    print(f"serving {os.path.basename(ROOT)} on :{port} ({len(_suggestions)} suggestions)", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
