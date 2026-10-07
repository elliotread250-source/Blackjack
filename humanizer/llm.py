"""Server-side Claude and ChatGPT calls.

In order of preference: the vendor's own API key (ANTHROPIC_API_KEY,
OPENAI_API_KEY), then one shared Puter account (PUTER_AUTH_TOKEN, free; see
puter.py). With neither, the browser talks to Puter directly and each visitor
signs in to their own free Puter account.
"""

import os
import re
import threading

import puter
from net import UpstreamError, get_json, post_json


class LLMError(Exception):
    pass


CLAUDE_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-opus-5-5")
OPENAI_FALLBACK_MODEL = "gpt-5"

# Effort exists on Opus 4.5+, Sonnet 4.6 and the 5.x family; older models 400 on it.
_EFFORT = re.compile(r"^claude-(?:(?:opus|sonnet|fable|mythos)-5|opus-4-[5-8]|sonnet-4-6)")
# Models that accept the server-side refusal fallback in its "default" form.
_DEFAULT_FALLBACK = {"claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"}

_lock = threading.Lock()
_claude_client = None
_openai_model = None


def claude_ready():
    return bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"))


def gpt_ready():
    return bool(os.environ.get("OPENAI_API_KEY"))


def _client():
    global _claude_client
    with _lock:
        if _claude_client is None:
            import anthropic

            _claude_client = anthropic.Anthropic(timeout=300.0, max_retries=2)
        return _claude_client


def claude(system, prompt, kind):
    import anthropic

    kwargs = {
        "model": CLAUDE_MODEL,
        "max_tokens": 16000,
        "system": system,
        "messages": [{"role": "user", "content": prompt}],
    }
    if _EFFORT.match(CLAUDE_MODEL):
        # Judging is a quick read; rewriting deserves a bit more thought.
        kwargs["output_config"] = {"effort": "low" if kind == "judge" else "medium"}
    if CLAUDE_MODEL in _DEFAULT_FALLBACK:
        kwargs["betas"] = ["server-side-fallback-2026-07-01"]
        kwargs["fallbacks"] = "default"
    try:
        resp = _client().beta.messages.create(**kwargs)
    except anthropic.AuthenticationError:
        raise LLMError("the server's ANTHROPIC_API_KEY was rejected") from None
    except anthropic.NotFoundError:
        raise LLMError(f"Claude model {CLAUDE_MODEL!r} doesn't exist; fix ANTHROPIC_MODEL") from None
    except anthropic.RateLimitError:
        raise LLMError("Claude is rate limiting this key; wait a minute and retry") from None
    except anthropic.APIStatusError as e:
        raise LLMError(f"Claude API error {e.status_code}: {e.message}") from None
    except anthropic.APIConnectionError:
        raise LLMError("couldn't reach the Claude API") from None
    if resp.stop_reason == "refusal":
        raise LLMError("Claude declined to process this text")
    text = "".join(b.text for b in resp.content if b.type == "text").strip()
    if not text:
        raise LLMError(f"Claude returned no text (stop reason: {resp.stop_reason})")
    return text, resp.model


def _pick_openai_model(key):
    """Newest plain gpt-N(.N) model this key can see, so ChatGPT stays current without redeploys."""
    global _openai_model
    if os.environ.get("OPENAI_MODEL"):
        return os.environ["OPENAI_MODEL"]
    with _lock:
        if _openai_model:
            return _openai_model
    best = None
    try:
        data = get_json("https://api.openai.com/v1/models", {"Authorization": f"Bearer {key}"})
        for m in data.get("data") or []:
            hit = re.fullmatch(r"gpt-(\d+)(?:\.(\d+))?", str(m.get("id", "")))
            if hit:
                ver = (int(hit.group(1)), int(hit.group(2) or 0))
                if best is None or ver > best[0]:
                    best = (ver, m["id"])
    except UpstreamError:
        best = None
    with _lock:
        _openai_model = best[1] if best else OPENAI_FALLBACK_MODEL
        return _openai_model


def gpt(system, prompt, kind):
    key = os.environ["OPENAI_API_KEY"]
    model = _pick_openai_model(key)
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "max_completion_tokens": 16000,
    }
    if re.match(r"^(?:gpt-[5-9]|o\d)", model):
        body["reasoning_effort"] = "low" if kind == "judge" else "medium"
    try:
        data = post_json(
            "https://api.openai.com/v1/chat/completions",
            body,
            {"Authorization": f"Bearer {key}"},
            timeout=300,
        )
    except UpstreamError as e:
        if e.status == 401:
            raise LLMError("the server's OPENAI_API_KEY was rejected") from None
        raise LLMError(f"OpenAI: {e}") from None
    choice = (data.get("choices") or [{}])[0]
    text = ((choice.get("message") or {}).get("content") or "").strip()
    if not text:
        raise LLMError(f"ChatGPT returned no text (finish reason: {choice.get('finish_reason')})")
    return text, data.get("model", model)


def describe():
    out = {}
    for vendor, direct_ready, model in (
        ("claude", claude_ready(), lambda: CLAUDE_MODEL),
        ("gpt", gpt_ready(), lambda: os.environ.get("OPENAI_MODEL") or _openai_model or "newest gpt"),
    ):
        if direct_ready:
            out[vendor] = {"ready": True, "via": "api", "model": model()}
        elif puter.ready():
            out[vendor] = {"ready": True, "via": "puter", "model": puter.model_label(vendor)}
        else:
            out[vendor] = {"ready": False}
    return out


def ask(vendor, system, prompt, kind):
    """Vendor's own API key if the server has one, else the server's Puter account."""
    if vendor not in ("claude", "gpt"):
        raise LLMError(f"unknown model vendor {vendor!r}")
    if vendor == "claude" and claude_ready():
        return claude(system, prompt, kind)
    if vendor == "gpt" and gpt_ready():
        return gpt(system, prompt, kind)
    if puter.ready():
        try:
            return puter.chat(vendor, system, prompt, kind)
        except puter.PuterError as e:
            raise LLMError(str(e)) from None
    raise LLMError(f"no {'ANTHROPIC_API_KEY' if vendor == 'claude' else 'OPENAI_API_KEY'} or PUTER_AUTH_TOKEN on the server")
