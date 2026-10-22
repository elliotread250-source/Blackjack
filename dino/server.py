"""Static file server for Dino Run.

Deliberately stdlib-only: the game is static files with no build step and no
backend state, so pulling in a framework would just be more to break. Railway
hands us the port on $PORT.
"""

import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(SimpleHTTPRequestHandler):
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
    port = int(os.environ.get("PORT", "8080"))
    handler = partial(Handler, directory=ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    print(f"dino on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
