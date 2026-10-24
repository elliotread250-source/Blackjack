"""Open Arcade IO games: Turf Wars, Wormhole Run and Sinkhole on one server.

Stdlib only; the WebSocket transport is the shared wsnet.py. Railway hands us $PORT, checks /healthz and
mounts a volume at $DATA_DIR (default /data) for the SQLite database.

  /turf-wars/  /wormhole-run/  /sinkhole/      the games (static files)
  /ws?game=<key>                              one WebSocket per player; the device cookie says who it is
  /api/session, /api/auth/*                   username + PIN accounts (iocore/accounts.py)
  GET /api/leaderboard?game=<key>             all-time top 20 plus the caller's best and rank
  GET /api/stats                              rooms and humans online per game

The game state lives in memory in each room (iocore/rooms.py), so this must run as a single replica:
every player in a room has to reach the same process. Railway's default of one replica does that; scaling
out would need sticky routing per room, which Railway doesn't offer.
"""

import json
import os
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

import wsnet
from iocore import accounts, scores, store
from iocore.accounts import ApiError
from iocore.rooms import Client, Lobby
from iocore.sink import Sinkhole
from iocore.turf import TurfWars
from iocore.worm import WormholeRun

ROOT = os.path.dirname(os.path.abspath(__file__))
IDLE_TIMEOUT = 45
MAX_MSG = 1024
LOBBIES = {g.key: Lobby(g.key, g) for g in (TurfWars, WormholeRun, Sinkhole)}
HIDDEN = ("/iocore", "/tests", "/data", "/backups")


def api_leaderboard(h, body):
    game = (parse_qs(urlsplit(h.path).query).get("game") or [""])[0]
    if game not in scores.GAMES:
        raise ApiError(404, "Unknown game.")
    uid = accounts.current_user(h, required=False)
    return {"game": game, "top": scores.top(game), "me": scores.mine(game, uid) if uid else None}


def api_stats(h, body):
    return {k: lob.stats() for k, lob in LOBBIES.items()}


ROUTES = {**accounts.ROUTES, ("GET", "/api/leaderboard"): api_leaderboard, ("GET", "/api/stats"): api_stats}


# ---------------------------------------------------------------------------- sockets
def on_message(conn, msg):
    client = conn.client
    t = msg["t"]
    if t == "ping":
        client.send({"t": "pong", "id": msg.get("id")})
        return
    if not conn.allow():
        return                                     # over the input budget: drop it
    if t == "in" and client.room:
        client.room.command("input", client, {k: msg.get(k) for k in ("a", "b", "d", "m")})
    elif t == "spawn" and client.room:
        client.room.command("spawn", client)


def on_close(conn):
    client = conn.client
    client.close()
    if client.room:
        client.room.command("leave", client)


def handle_socket(handler, game):
    conn = wsnet.Conn(handler.rfile, handler.wfile, max_msg=MAX_MSG, rate=40, burst=80)
    user = accounts.user_for_cookie(handler.cookies.get(accounts.COOKIE, ""))
    if not user:
        conn.send({"t": "error", "code": "auth", "msg": "Sign in to play."})
        conn.close(4001)
        return
    client = Client(conn, user)
    conn.client = client
    LOBBIES[game].join(client)
    wsnet.serve(conn, on_message, on_close)


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

    def _plain(self, body):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
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
                if n > 4096:
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
        if wsnet.is_upgrade(self):
            game = (parse_qs(urlsplit(self.path).query).get("game") or [""])[0]
            if game not in LOBBIES:
                return self._json(404, {"error": "Unknown game"})
            origin = self.headers.get("Origin")
            if origin and origin.split("://", 1)[-1] != self.headers.get("Host", ""):
                return self._json(403, {"error": "Bad origin"})   # no playing from someone else's page
            if wsnet.accept(self, IDLE_TIMEOUT):
                handle_socket(self, game)
            return
        if path.startswith("/api/"):
            return self._api("GET")
        if path.startswith(HIDDEN) or path.endswith((".py", ".db", ".pyc")):
            return self._json(404, {"error": "Not found"})
        return super().do_GET()

    def do_HEAD(self):
        if self.path.split("?")[0] == "/healthz":
            return self._plain(b"ok")
        return super().do_HEAD()

    def do_POST(self):
        return self._api("POST")

    def log_message(self, fmt, *args):
        if self.path.split("?")[0] not in ("/healthz", "/ws"):
            super().log_message(fmt, *args)


def main():
    store.open_db()
    threading.Thread(target=store.daily_backups, daemon=True).start()
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), partial(Handler, directory=ROOT))
    server.daemon_threads = True
    print(f"io games on :{port} (data in {store.DATA_DIR})", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
