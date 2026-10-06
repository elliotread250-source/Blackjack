"""Humanizer server: serves the page and proxies anything that needs a secret.

The page does the orchestration (rewrite, judge, detect, repeat). This server
only exists so API keys can live in Railway variables instead of the browser,
and so detector APIs that don't allow browser calls (CORS) still work.

Routes:
  GET  /healthz       Railway health check
  GET  /api/config    which models/detectors the server has keys for
  POST /api/llm       {vendor: "claude"|"gpt", system, prompt, kind}
  POST /api/detect    {id, text, keys?}
"""

import hmac
import json
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import detectors
import llm

ROOT = os.path.dirname(os.path.abspath(__file__))
MAX_BODY = 512 * 1024
MAX_TEXT = 30000
# Only the page and its assets are public; the Python files and deploy config aren't.
PUBLIC_EXT = {".html", ".js", ".css", ".svg", ".png", ".ico", ".webmanifest", ".txt"}


def _password():
    return os.environ.get("APP_PASSWORD", "")


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".svg": "image/svg+xml",
        ".webmanifest": "application/manifest+json",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def _json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _route(self):
        return self.path.split("?", 1)[0]

    def _authorized(self):
        pw = _password()
        if not pw:
            return True
        given = self.headers.get("X-App-Password", "")
        return hmac.compare_digest(given.encode("utf-8"), pw.encode("utf-8"))

    def send_head(self):
        route = self._route()
        if route == "/healthz":
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return None if self.command == "HEAD" else _Body(body)
        if route == "/api/config":
            self._json(200, {
                "server": True,
                "password": bool(_password()),
                "authorized": self._authorized(),
                "llm": llm.describe(),
                "detectors": detectors.describe(),
            })
            return None
        if route.startswith("/api/"):
            self._json(404, {"error": "not found"})
            return None
        ext = os.path.splitext(route)[1].lower()
        if not route.endswith("/") and ext not in PUBLIC_EXT:
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def do_POST(self):
        route = self._route()
        if route not in ("/api/llm", "/api/detect"):
            self._json(404, {"error": "not found"})
            return
        if not self._authorized():
            self._json(401, {"error": "wrong or missing app password"})
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = -1
        if length <= 0 or length > MAX_BODY:
            self._json(413, {"error": "request body missing or too large"})
            return
        try:
            data = json.loads(self.rfile.read(length))
        except ValueError:
            self._json(400, {"error": "body isn't valid JSON"})
            return
        if not isinstance(data, dict):
            self._json(400, {"error": "body must be a JSON object"})
            return

        if route == "/api/llm":
            self._llm(data)
        else:
            self._detect(data)

    def _llm(self, data):
        system, prompt = str(data.get("system") or ""), str(data.get("prompt") or "")
        if not prompt or len(prompt) > 4 * MAX_TEXT:
            self._json(400, {"error": "prompt missing or too long"})
            return
        kind = "judge" if data.get("kind") == "judge" else "rewrite"
        try:
            text, model = llm.ask(str(data.get("vendor")), system, prompt, kind)
        except llm.LLMError as e:
            self._json(502, {"error": str(e)})
            return
        self._json(200, {"text": text, "model": model})

    def _detect(self, data):
        text = str(data.get("text") or "")
        if not text.strip() or len(text) > MAX_TEXT:
            self._json(400, {"error": f"text must be 1-{MAX_TEXT} characters"})
            return
        keys = data.get("keys") if isinstance(data.get("keys"), dict) else {}
        try:
            result = detectors.run(str(data.get("id")), text, keys)
        except detectors.DetectorError as e:
            self._json(400, {"error": str(e)})
            return
        except detectors.UpstreamError as e:
            self._json(502, {"error": str(e)})
            return
        self._json(200, result)

    def log_message(self, fmt, *args):
        if self._route() != "/healthz":
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
    print(f"humanizer listening on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
