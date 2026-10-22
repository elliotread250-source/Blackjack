"""Static file server for Boggle.

Deliberately stdlib-only: the game is static files with no build step and no
backend state, so pulling in a framework would just be more to break. Railway
hands us the port on $PORT.
"""

import email.utils
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))

# The dictionary is the one big file (1.7 MB plain, ~450 KB gzipped). It is
# shipped pre-compressed next to the plain copy and served as gzip to any
# client that says it can take it. It only changes when the word list does
# (and the page asks for it with a ?v= query then), so let browsers keep it.
WORDS_PATH = "/words.txt"
WORDS_FILE = os.path.join(ROOT, "words.txt")
WORDS_GZ = WORDS_FILE + ".gz"
WORDS_CACHE = "public, max-age=604800"


class Handler(SimpleHTTPRequestHandler):
    _cache_control = None

    def end_headers(self):
        # The page is the app; if it gets cached hard, a fix never reaches
        # anyone who already played. Cheap file, so just don't cache it.
        # (The word list is the exception, see WORDS_CACHE.)
        self.send_header("Cache-Control", self._cache_control or "no-cache")
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
        if self.path.split("?")[0] == WORDS_PATH:
            return self._send_words()
        return super().send_head()

    def _send_words(self):
        accept = self.headers.get("Accept-Encoding", "")
        wants_gzip = any(
            part.split(";")[0].strip().lower() in ("gzip", "x-gzip", "*")
            and not part.replace(" ", "").endswith(";q=0")
            for part in accept.split(",")
        )
        use_gz = wants_gzip and os.path.isfile(WORDS_GZ)
        path = WORDS_GZ if use_gz else WORDS_FILE
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None
        try:
            st = os.fstat(f.fileno())
            self._cache_control = WORDS_CACHE
            ims = self.headers.get("If-Modified-Since")
            if ims:
                try:
                    since = email.utils.parsedate_to_datetime(ims).timestamp()
                except (TypeError, ValueError, IndexError, OverflowError):
                    since = None
                if since is not None and int(st.st_mtime) <= since:
                    f.close()
                    self.send_response(304)
                    self.send_header("Vary", "Accept-Encoding")
                    self.end_headers()
                    return None
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            if use_gz:
                self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
            self.send_header("Content-Length", str(st.st_size))
            self.send_header("Last-Modified", self.date_time_string(st.st_mtime))
            self.end_headers()
            return f
        except Exception:
            f.close()
            raise

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
    print(f"boggle on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
