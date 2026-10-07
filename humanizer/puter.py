"""Claude and ChatGPT through Puter, called from the server with one Puter account.

With PUTER_AUTH_TOKEN set (copy it from puter.com/dashboard#account), the
server makes the same request Puter's own SDK makes, so visitors never see a
sign-in window: usage comes out of that one account's free allowance.

The request shape comes from @heyputer/puter.js (src/lib/networkUtils.js and
src/modules/ai/chat.js): POST /drivers/call with the token in the body.
"""

import os
import re
import threading
import time

from net import UpstreamError, get_json, post_json

API = "https://api.puter.com"
_MODELS_TTL = 3600

_lock = threading.Lock()
_models = {"at": 0.0, "ids": []}
_bad = set()


class PuterError(Exception):
    pass


def ready():
    return bool(os.environ.get("PUTER_AUTH_TOKEN"))


def _version(model_id, vendor):
    if vendor == "gpt":
        m = re.search(r"gpt-(\d+)(?:\.(\d+))?", model_id, re.I)
        if not m:
            return (0, 0)
        major, minor = int(m.group(1)), int(m.group(2) or 0)
        # "gpt-35-turbo" is 3.5, not version 35.
        if major >= 10 and not m.group(2):
            major, minor = divmod(major, 10)
        return (major, minor)
    nums = [int(n) for n in re.findall(r"\d+", re.sub(r"\d{8}", "", model_id))][:2]
    nums = [n for n in nums if n < 100] + [0, 0]
    return (nums[0], nums[1])


def rank_models(ids, vendor):
    """Same ranking as js/engines.js rankModels: newest Sonnet / newest plain GPT, Puter's own ids first."""
    seen, models = set(), []
    for model_id in ids:
        if model_id and model_id not in seen and not re.search(r":(?:batch|flex|priority)\b", model_id, re.I):
            seen.add(model_id)
            models.append(model_id)

    def native(model_id):
        return not re.search(r"[:/]", model_id)

    def newest_first(model_id):
        major, minor = _version(model_id, vendor)
        return (-major, -minor, not native(model_id), len(model_id))

    if vendor == "claude":
        def tier(model_id):
            for rank, name in enumerate(("sonnet", "opus")):
                if name in model_id.lower():
                    return rank
            return 3 if "haiku" in model_id.lower() else 2

        models = [m for m in models if "claude" in m.lower() and not re.search(r"thinking|instant|-v\d|bedrock|vertex", m, re.I)]
        return sorted(models, key=lambda m: (tier(m), *newest_first(m)))
    models = [m for m in models if re.search(r"gpt-\d", m, re.I) and not re.search(
        r"mini|nano|audio|realtime|image|search|transcribe|tts|codex|oss|instruct|vision|embedding|turbo|-pro\b", m, re.I)]
    return sorted(models, key=newest_first)


def _model_ids():
    with _lock:
        if _models["ids"] and time.time() - _models["at"] < _MODELS_TTL:
            return _models["ids"]
    try:
        data = get_json(f"{API}/puterai/chat/models/details")
        ids = [m.get("id") for m in data.get("models") or [] if isinstance(m, dict)]
    except UpstreamError:
        ids = []
    with _lock:
        if ids:
            _models.update(at=time.time(), ids=ids)
        return _models["ids"]


FALLBACKS = {
    "claude": ["claude-sonnet-5-5", "claude-sonnet-5", "claude-sonnet-4-6"],
    "gpt": ["gpt-6.1-sol", "gpt-6-sol", "gpt-5.5", "gpt-5"],
}


def candidates(vendor):
    pinned = os.environ.get(f"PUTER_{vendor.upper()}_MODEL")
    ranked = rank_models(_model_ids(), vendor)
    out = []
    for m in [pinned, *ranked[:6], *FALLBACKS[vendor]]:
        if m and m not in out and m not in _bad:
            out.append(m)
    return out


def model_label(vendor):
    c = candidates(vendor)
    return c[0] if c else "auto"


def _text(result):
    msg = result.get("message") if isinstance(result, dict) else None
    content = (msg or {}).get("content") if isinstance(msg, dict) else None
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(b if isinstance(b, str) else (b.get("text") or "") for b in content if isinstance(b, (str, dict)))
    if isinstance(result, dict) and isinstance(result.get("text"), str):
        return result["text"]
    return ""


def _error_text(resp):
    err = resp.get("error") if isinstance(resp, dict) else None
    if isinstance(err, dict):
        return f"{err.get('message') or ''} {err.get('code') or ''}".strip()
    return str(err or resp)[:300]


def chat(vendor, system, prompt, kind):
    token = os.environ["PUTER_AUTH_TOKEN"]
    last = None
    for model in candidates(vendor):
        body = {
            "interface": "puter-chat-completion",
            "driver": "ai-chat",
            "test_mode": False,
            "method": "complete",
            "args": {
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "model": model,
                "max_tokens": 1000 if kind == "judge" else 8000,
            },
            "auth_token": token,
        }
        try:
            resp = post_json(f"{API}/drivers/call", body, {"Content-Type": "text/plain;actually=json"}, timeout=300)
        except UpstreamError as e:
            msg = str(e)
            if e.status == 401:
                raise PuterError("the server's PUTER_AUTH_TOKEN was rejected; copy a fresh one from puter.com/dashboard#account") from None
            if e.status == 402 or re.search(r"insufficient|funds|credit|quota|usage.?limit", msg, re.I):
                raise PuterError("this app's Puter account has used up its free allowance for now") from None
            if re.search(r"model|not.?found|unknown|unsupported|not.?available", msg, re.I):
                _bad.add(model)
                last = msg
                continue
            raise PuterError(f"Puter: {msg}") from None
        if isinstance(resp, dict) and resp.get("success") is False:
            msg = _error_text(resp)
            if re.search(r"insufficient|funds|credit|quota|usage.?limit", msg, re.I):
                raise PuterError("this app's Puter account has used up its free allowance for now")
            if re.search(r"model|not.?found|unknown|unsupported|not.?available", msg, re.I):
                _bad.add(model)
                last = msg
                continue
            raise PuterError(f"Puter: {msg}")
        result = resp.get("result", resp) if isinstance(resp, dict) else {}
        text = _text(result).strip()
        if not text:
            raise PuterError(f"Puter returned no text from {model}")
        return text, model
    raise PuterError(f"no {vendor} model on Puter worked ({last})")
