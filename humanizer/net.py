"""Tiny JSON-over-HTTPS helper shared by the detector and model adapters.

urllib is enough here: every upstream is a single JSON POST, and keeping the
image to one pip dependency (the Anthropic SDK) keeps builds fast.
"""

import json
import urllib.error
import urllib.parse
import urllib.request


class UpstreamError(Exception):
    def __init__(self, message, status=None):
        super().__init__(message)
        self.status = status


def _detail(raw):
    text = raw[:600].decode("utf-8", errors="replace").strip()
    try:
        data = json.loads(text)
    except ValueError:
        return text[:300]
    if isinstance(data, dict):
        err = data.get("error")
        if isinstance(err, dict):
            return str(err.get("message") or err)[:300]
        for key in ("error", "message", "detail", "msg"):
            if data.get(key):
                return str(data[key])[:300]
    return text[:300]


def request_json(method, url, body=None, headers=None, timeout=90):
    host = urllib.parse.urlsplit(url).hostname
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "humanizer/1.0",
            **(headers or {}),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as e:
        raise UpstreamError(f"{host} returned {e.code}: {_detail(e.read())}", e.code) from None
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        reason = getattr(e, "reason", e)
        raise UpstreamError(f"couldn't reach {host}: {reason}") from None
    try:
        return json.loads(raw)
    except ValueError:
        raise UpstreamError(f"{host} sent back something that isn't JSON") from None


def post_json(url, body, headers=None, timeout=90):
    return request_json("POST", url, body, headers, timeout)


def get_json(url, headers=None, timeout=30):
    return request_json("GET", url, None, headers, timeout)
