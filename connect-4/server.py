"""Static file server for Connect 4, plus WebSocket rooms for online play.

Stdlib only. Rooms, quick match, seat tokens and reconnects, rematches, rate limits and expiry come
from the shared turnrooms.py (transport: wsnet.py). This file holds just the Connect 4 rules the
server enforces: a move must come from the player whose turn it is and the column must have room;
the server finds four in a row (or a full-board draw) and broadcasts every accepted move.
Railway hands us the port on $PORT and checks /healthz.
"""

import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import turnrooms
import wsnet

ROOT = os.path.dirname(os.path.abspath(__file__))
COLS, ROWS = 7, 6


class Game:
    def __init__(self, first):
        self.board = [[0] * ROWS for _ in range(COLS)]   # board[col][row], row 0 at the bottom
        self.moves = []
        self.turn = first
        self.over = False
        self.winner = -1
        self.n = 0
        self.line = None


class Connect4Rules:
    allow_draw = False

    def new(self, first):
        return Game(first)

    @staticmethod
    def line_through(g, col, row):
        """Cells of the longest line of 4+ through (col, row), or None."""
        p = g.board[col][row]
        best = None
        for dc, dr in ((1, 0), (0, 1), (1, 1), (1, -1)):
            c, r = col, row
            while 0 <= c - dc < COLS and 0 <= r - dr < ROWS and g.board[c - dc][r - dr] == p:
                c -= dc
                r -= dr
            cells = []
            while 0 <= c < COLS and 0 <= r < ROWS and g.board[c][r] == p:
                cells.append([c, r])
                c += dc
                r += dr
            if len(cells) >= 4 and (best is None or len(cells) > len(best)):
                best = cells
        return best

    def apply(self, g, side, msg):
        col = msg.get("col")
        if not isinstance(col, int) or isinstance(col, bool) or not 0 <= col < COLS:
            return None, "col"
        column = g.board[col]
        if column[ROWS - 1]:
            return None, "full"
        row = column.index(0)
        column[row] = side + 1
        g.moves.append(col)
        line = self.line_through(g, col, row)
        if line:
            g.over, g.winner, g.line = True, side, line
        elif len(g.moves) == COLS * ROWS:
            g.over, g.winner = True, -1
        g.turn = 1 - side
        return {"col": col, "row": row, "line": line}, None

    def view(self, g):
        return {"moves": list(g.moves), "line": g.line}


GAME = turnrooms.TurnServer(Connect4Rules(), grace=float(os.environ.get("C4_GRACE", "30")))


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
        path = self.path.split("?")[0]
        if path not in ("/healthz", "/ws"):
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
    handler = partial(Handler, directory=ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    server.daemon_threads = True
    GAME.start()
    print(f"connect-4 on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
