"""Static file server for Tic Tac Toe, plus WebSocket rooms for online games.

Stdlib only. Rooms, quick match, seat tokens and reconnects, rematches, rate limits and expiry come
from the shared turnrooms.py (transport: wsnet.py). The server keeps the board: a move must come from
the player whose turn it is and land on an empty square; the server finds three in a row or a full
board. The player who moves first is X and that swaps every rematch. Railway hands us the port on
$PORT and checks /healthz.
"""

import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import turnrooms
import wsnet

ROOT = os.path.dirname(os.path.abspath(__file__))
LINES = ((0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8), (0, 4, 8), (2, 4, 6))


class Game:
    def __init__(self, first):
        self.board = [""] * 9
        self.x = first              # the side that plays X
        self.turn = first
        self.over = False
        self.winner = -1
        self.n = 0
        self.line = None


class TTTRules:
    allow_draw = False

    def new(self, first):
        return Game(first)

    def apply(self, g, side, msg):
        cell = msg.get("cell")
        if not isinstance(cell, int) or isinstance(cell, bool) or not 0 <= cell < 9:
            return None, "cell"
        if g.board[cell]:
            return None, "taken"
        mark = "X" if side == g.x else "O"
        g.board[cell] = mark
        for line in LINES:
            if all(g.board[i] == mark for i in line):
                g.over, g.winner, g.line = True, side, list(line)
                break
        else:
            if all(g.board):
                g.over, g.winner = True, -1
        g.turn = 1 - side
        return {"cell": cell, "mark": mark, "line": g.line}, None

    def view(self, g):
        return {"board": list(g.board), "x": g.x, "line": g.line}


GAME = turnrooms.TurnServer(TTTRules(), grace=float(os.environ.get("TTT_GRACE", "30")))


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
    print(f"tic-tac-toe on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
