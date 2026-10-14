"""Static file server for this folder, plus the suggestions box.

Stdlib only: the page is plain HTML and JS with no build step. Railway hands us
the port on $PORT and checks /healthz.

Suggestions: POST /api/suggestions {text, name} saves one to a JSON file on the
Railway volume at $DATA_DIR (default /data), so they survive redeploys. Reading
them back is POST /api/suggestions/view {code}; the code is the
SUGGESTIONS_CODE environment variable (kept out of the public repo), compared
in constant time. Posting and viewing are both rate limited per IP.

Play counts: POST /api/play {game} adds one to that game's count (the same IP
clicking the same game again within PLAY_GAP seconds is ignored), and
GET /api/plays returns {"plays": {game: count}}. Stored in plays.json.

Status: GET /api/status returns {"status": {game: "up" | "down" | "checking"}, "checked": t}. The server
itself asks each game's URL — only the URLs listed in registry.json (an allowlist read at start-up, never
anything from the request), without following redirects, 5 s timeout, at most 8 at a time — and caches
the answers for STATUS_TTL seconds. Checks only run when someone loads the hub, so idle games can still
sleep. "up" means the game's server answered with a non-5xx status; it is not a claim about players.
"""

import hmac
import http.client
import json
import os
import re
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from urllib.parse import urlsplit
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR") or ("/data" if os.path.isdir("/data") else os.path.join(ROOT, "data"))
SUGGESTIONS_FILE = os.path.join(DATA_DIR, "suggestions.json")
KEEP = 5000                 # newest suggestions kept on disk
MAX_TEXT, MAX_NAME = 1000, 40
POSTS_PER_WINDOW, VIEWS_PER_WINDOW, WINDOW = 5, 12, 600
PLAYS_FILE = os.path.join(DATA_DIR, "plays.json")
PLAY_GAP = 30               # seconds before the same IP can count the same game again
MAX_GAMES = 300
GAME_KEY = re.compile(r"^[a-z0-9][a-z0-9-]{0,47}$")

_lock = threading.Lock()
_suggestions = []
_posts = {}                 # ip -> [times]
_views = {}
_plays = {}                 # game -> count
_last_play = {}             # (ip, game) -> time

STATUS_TTL = 90
_status = {}                # game -> "up" | "down"
_status_at = 0.0
_status_busy = False
_targets = {}               # game -> (host, path): the allowlist


def _load_targets():
    """The only hosts /api/status will ever contact: the live entries of registry.json."""
    global _targets
    try:
        with open(os.path.join(ROOT, "registry.json")) as f:
            games = json.load(f)["games"]
    except (OSError, ValueError, KeyError) as exc:
        print(f"registry not loaded: {exc}", flush=True)
        return
    t = {}
    for g in games:
        if g.get("pending") or not GAME_KEY.match(str(g.get("id", ""))):
            continue
        u = urlsplit(str(g.get("url", "")))
        if u.scheme == "https" and u.hostname and u.hostname.endswith(".up.railway.app"):
            t[g["id"]] = (u.hostname, u.path or "/")
    _targets = t


def _probe(target):
    host, path = target
    try:
        conn = http.client.HTTPSConnection(host, 443, timeout=5)
        conn.request("GET", path, headers={"User-Agent": "open-arcade-status/1"})
        code = conn.getresponse().status
        conn.close()
        return "up" if code < 500 else "down"   # redirects are answers too; they are not followed
    except (OSError, http.client.HTTPException):
        return "down"


def _refresh_status():
    global _status, _status_at, _status_busy
    try:
        with ThreadPoolExecutor(max_workers=8) as pool:
            ids = list(_targets)
            results = dict(zip(ids, pool.map(lambda i: _probe(_targets[i]), ids)))
        with _lock:
            _status, _status_at = results, time.time()
    finally:
        _status_busy = False


def get_status():
    global _status_busy
    with _lock:
        stale = time.time() - _status_at > STATUS_TTL
        if stale and not _status_busy and _targets:
            _status_busy = True
            threading.Thread(target=_refresh_status, daemon=True).start()
        out = {g: _status.get(g, "checking") for g in _targets}
        return {"status": out, "checked": int(_status_at), "fresh": not stale}


def _load():
    global _suggestions
    try:
        with open(SUGGESTIONS_FILE) as f:
            data = json.load(f)
        _suggestions = [s for s in data if isinstance(s, dict) and isinstance(s.get("text"), str)][-KEEP:]
    except (OSError, ValueError):
        _suggestions = []


def _load_plays():
    global _plays
    try:
        with open(PLAYS_FILE) as f:
            data = json.load(f)
        _plays = {k: int(v) for k, v in data.items() if isinstance(k, str) and GAME_KEY.match(k) and int(v) >= 0}
    except (OSError, ValueError, AttributeError, TypeError):
        _plays = {}


def add_play(ip, body):
    game = str(body.get("game") or "").strip().lower()
    if not GAME_KEY.match(game):
        return 400, {"error": "Bad game"}
    now = time.time()
    with _lock:
        if game not in _plays and len(_plays) >= MAX_GAMES:
            return 400, {"error": "Bad game"}
        if len(_last_play) > 50000:
            for k in [k for k, t in _last_play.items() if now - t > PLAY_GAP]:
                del _last_play[k]
        if now - _last_play.get((ip, game), 0) >= PLAY_GAP:
            _last_play[(ip, game)] = now
            _plays[game] = _plays.get(game, 0) + 1
            try:
                os.makedirs(DATA_DIR, exist_ok=True)
                tmp = PLAYS_FILE + ".tmp"
                with open(tmp, "w") as f:
                    json.dump(_plays, f)
                os.replace(tmp, PLAYS_FILE)
            except OSError as exc:
                print(f"plays save failed: {exc}", flush=True)
        return 200, {"game": game, "plays": _plays.get(game, 0)}


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
        ".webp": "image/webp",
        ".png": "image/png",
    }

    def end_headers(self):
        # artwork and fonts change rarely: let browsers keep them for a day (filenames are stable,
        # so a redeploy is picked up after revalidation); everything else is revalidated every time
        path = self.path.split("?")[0]
        self.send_header("Cache-Control", "public, max-age=86400" if path.startswith("/assets/") else "no-cache")
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
        if self.path.split("?")[0] == "/api/status":
            return self._json(200, get_status())
        if self.path.split("?")[0] == "/api/plays":
            with _lock:
                return self._json(200, {"plays": dict(_plays)})
        if self.path.split("?")[0] == "/data" or self.path.startswith("/data/"):
            return self._json(404, {"error": "Not found"})  # never serve a local data folder
        super().do_GET()

    def do_POST(self):
        route = self.path.split("?")[0]
        if route not in ("/api/suggestions", "/api/suggestions/view", "/api/play"):
            return self._json(404, {"error": "Not found"})
        try:
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(min(n, 8192)) or b"{}") if n else {}
            if not isinstance(body, dict):
                raise ValueError
        except ValueError:
            return self._json(400, {"error": "Bad request"})
        if route == "/api/play":
            return self._json(*add_play(self._ip(), body))
        if route == "/api/suggestions":
            return self._json(*add_suggestion(self._ip(), body))
        return self._json(*view_suggestions(self._ip(), body))

    def log_message(self, fmt, *args):
        if self.path.split("?")[0] != "/healthz":
            super().log_message(fmt, *args)


def main():
    _load()
    _load_plays()
    _load_targets()
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), partial(Handler, directory=ROOT))
    print(f"serving {os.path.basename(ROOT)} on :{port} ({len(_suggestions)} suggestions)", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
