"""Static file server for this folder.

Stdlib only: the page is plain HTML and JS with no build step and no backend
state. Railway hands us the port on $PORT and checks /healthz.
"""

import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))


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

    def do_GET(self):
        if self.path.split("?")[0] == "/healthz":
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def log_message(self, fmt, *args):
        if self.path.split("?")[0] != "/healthz":
            super().log_message(fmt, *args)


def main():
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), partial(Handler, directory=ROOT))
    print(f"serving {os.path.basename(ROOT)} on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
