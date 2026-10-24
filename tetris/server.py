"""Static Tetris app and persistent leaderboard API (Python standard library)."""

import os
import json
import sqlite3
from urllib.parse import parse_qs, urlsplit
import leaderboard
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

    def json_response(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def do_GET(self):
        if urlsplit(self.path).path == '/api/leaderboard':
            mode = parse_qs(urlsplit(self.path).query).get('mode', ['marathon'])[0]
            try:
                self.json_response(200, {'entries': leaderboard.top(mode)})
            except ValueError as exc:
                self.json_response(400, {'error': str(exc)})
            except sqlite3.Error:
                self.json_response(503, {'error': 'Leaderboard unavailable. Please try again.'})
            return
        super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != '/api/leaderboard':
            self.json_response(404, {'error': 'Not found.'})
            return
        # JSON-only, same-origin writes; no cross-origin score submissions.
        origin = self.headers.get('Origin')
        if origin and urlsplit(origin).netloc != self.headers.get('Host'):
            self.json_response(403, {'error': 'Use the game page to submit scores.'})
            return
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            self.json_response(415, {'error': 'Expected JSON.'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 2048:
                self.json_response(413, {'error': 'Score submission is too large or empty.'})
                return
            self.connection.settimeout(10)
            data = json.loads(self.rfile.read(length))
            self.json_response(200, {'entries': leaderboard.submit(data)})
        except (ValueError, UnicodeDecodeError) as exc:
            self.json_response(400, {'error': str(exc) if not isinstance(exc, json.JSONDecodeError) else 'Invalid JSON.'})
        except (sqlite3.Error, OSError):
            self.json_response(503, {'error': 'Could not save your score. Please try again.'})

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
    leaderboard.initialize()
    port = int(os.environ.get("PORT", "8080"))
    handler = partial(Handler, directory=ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    print(f"tetris on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
