"""Static file server for Chess, plus WebSocket rooms for online games.

Stdlib only. Rooms, quick match, seat tokens and reconnects, rematches, resignations, draw offers, rate
limits and expiry come from the shared turnrooms.py (transport: wsnet.py). The server keeps the real
game: every move is checked against the full rules in chess_rules.py (a port of js/chess.js, tested to
agree with it), including check, castling, en passant, promotion, checkmate, stalemate, the fifty-move
rule, threefold repetition and insufficient material. The player who moves first plays White and the
colours swap on every rematch. Railway hands us the port on $PORT and checks /healthz.
"""

import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import turnrooms
import wsnet
from chess_rules import Position

ROOT = os.path.dirname(os.path.abspath(__file__))
MAX_PLIES = 1000


class Game:
    def __init__(self, first):
        self.pos = Position()
        self.white = first          # the side that plays White
        self.turn = first
        self.over = False
        self.winner = -1
        self.n = 0
        self.uci = []
        self.sans = []
        self.result = None
        self.reason = None


class ChessRules:
    allow_draw = True

    def new(self, first):
        return Game(first)

    def apply(self, g, side, msg):
        u = msg.get("uci")
        if not isinstance(u, str) or not 4 <= len(u) <= 5 or len(g.uci) >= MAX_PLIES:
            return None, "move"
        move = next((m for m in g.pos.moves() if m.uci() == u.lower()), None)
        if move is None:
            return None, "illegal"
        san = g.pos.san(move)
        g.pos.make(move)
        g.uci.append(move.uci())
        g.sans.append(san)
        g.turn = 1 - side
        out = g.pos.outcome()
        if out:
            g.result, g.reason = out
            g.over = True
            g.winner = -1 if out[0] == "1/2-1/2" else (g.white if out[0] == "1-0" else 1 - g.white)
        return {"uci": move.uci(), "san": san, "result": g.result, "reason": g.reason}, None

    def view(self, g):
        return {"white": g.white, "moves": list(g.uci), "result": g.result, "reason": g.reason}


GAME = turnrooms.TurnServer(ChessRules(), grace=float(os.environ.get("CHESS_GRACE", "60")))


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # The page is the app; if it gets cached hard, a fix never reaches
        # anyone who already played. Cheap files, so just don't cache them.
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_GET(self):
        if wsnet.is_upgrade(self):
            GAME.serve_socket(self)
            return
        super().do_GET()

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
        if self.path.split("?")[0] not in ("/healthz", "/ws"):
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
    server = ThreadingHTTPServer(("0.0.0.0", port), partial(Handler, directory=ROOT))
    server.daemon_threads = True
    GAME.start()
    print(f"chess on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
