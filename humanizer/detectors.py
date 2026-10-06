"""Adapters for the commercial AI detectors.

Each one takes the text plus a dict of credentials and returns
{"ai": 0-100, "flagged": [sentences the detector blamed]}. Credentials come
from Railway variables, or from the browser's settings panel when the person
pasted their own key there (the browser's key wins, so you can test a key
without redeploying).

ZeroGPT works with no key at all (through its free public checker). The rest
are paid APIs and are skipped until a key is set; the app's free detectors run
in the browser instead (see js/local-models.js).
"""

import os
import re
import threading
import time
import uuid

from net import UpstreamError, post_json


class DetectorError(Exception):
    pass


def _pct(x):
    return max(0.0, min(100.0, float(x) * (100.0 if float(x) <= 1.0 else 1.0)))


def gptzero(text, c):
    data = post_json(
        "https://api.gptzero.me/v2/predict/text",
        {"document": text},
        {"x-api-key": c["GPTZERO_API_KEY"]},
    )
    doc = (data.get("documents") or [{}])[0]
    probs = doc.get("class_probabilities") or {}
    if "human" in probs:
        ai = 1.0 - float(probs["human"])
    else:
        ai = float(doc.get("completely_generated_prob", 0))
    flagged = [
        s.get("sentence", "")
        for s in doc.get("sentences") or []
        if s.get("highlight_sentence_for_ai") or float(s.get("generated_prob") or 0) >= 0.5
    ]
    return {"ai": _pct(ai), "flagged": flagged}


def originality(text, c):
    data = post_json(
        "https://api.originality.ai/api/v1/scan/ai",
        {"content": text, "storeScan": "false"},
        {"X-OAI-API-KEY": c["ORIGINALITY_API_KEY"]},
    )
    score = data.get("score") or {}
    ai = score["ai"] if "ai" in score else 1.0 - float(score.get("original", 0))
    flagged = [
        b.get("text", "")
        for b in data.get("blocks") or []
        if float((b.get("result") or {}).get("fake") or 0) >= 0.5
    ]
    return {"ai": _pct(ai), "flagged": flagged}


def sapling(text, c):
    data = post_json(
        "https://api.sapling.ai/api/v1/aidetect",
        {"key": c["SAPLING_API_KEY"], "text": text, "sent_scores": True},
    )
    flagged = [
        s.get("sentence", "")
        for s in data.get("sentence_scores") or []
        if float(s.get("score") or 0) >= 0.5
    ]
    return {"ai": _pct(data.get("score", 0)), "flagged": flagged}


def winston(text, c):
    data = post_json(
        "https://api.gowinston.ai/v2/ai-content-detection",
        {"text": text, "sentences": True},
        {"Authorization": f"Bearer {c['WINSTON_API_KEY']}"},
    )
    if "score" not in data:
        raise DetectorError(str(data.get("description") or data.get("error") or "no score in response")[:200])
    # Winston reports a *human* score out of 100.
    human = float(data["score"])
    sents = data.get("sentences") or []
    if isinstance(sents, dict):
        sents = sents.get("sentences") or []
    flagged = [s.get("text", "") for s in sents if isinstance(s, dict) and float(s.get("score", 100)) < 50]
    return {"ai": max(0.0, min(100.0, 100.0 - human)), "flagged": flagged}


def zerogpt(text, c):
    key = c.get("ZEROGPT_API_KEY")
    if key:
        headers = {"ApiKey": key}
    else:
        # No key: ZeroGPT's free public checker, the same call zerogpt.com's own
        # page makes. Unofficial, so it can be rate limited or blocked.
        headers = {
            "Origin": "https://www.zerogpt.com",
            "Referer": "https://www.zerogpt.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/129.0 Safari/537.36",
        }
    data = post_json("https://api.zerogpt.com/api/detect/detectText", {"input_text": text}, headers)
    if data.get("success") is False:
        raise DetectorError(str(data.get("message") or "ZeroGPT refused the request")[:200])
    d = data.get("data") or {}
    flagged = [s for s in d.get("h") or [] if isinstance(s, str)]
    return {"ai": max(0.0, min(100.0, float(d.get("fakePercentage") or 0))), "flagged": flagged}


_copyleaks_tokens = {}
_copyleaks_lock = threading.Lock()


def _copyleaks_token(email, key):
    with _copyleaks_lock:
        cached = _copyleaks_tokens.get((email, key))
        if cached and cached[1] > time.time():
            return cached[0]
    data = post_json("https://id.copyleaks.com/v3/account/login/api", {"email": email, "key": key})
    token = data.get("access_token")
    if not token:
        raise DetectorError("Copyleaks login didn't return a token")
    with _copyleaks_lock:
        # Tokens last 48h; refresh well before that.
        _copyleaks_tokens[(email, key)] = (token, time.time() + 40 * 3600)
    return token


def copyleaks(text, c):
    token = _copyleaks_token(c["COPYLEAKS_EMAIL"], c["COPYLEAKS_API_KEY"])
    data = post_json(
        f"https://api.copyleaks.com/v2/writer-detector/{uuid.uuid4().hex}/check",
        {"text": text},
        {"Authorization": f"Bearer {token}"},
    )
    summary = data.get("summary") or {}
    flagged = []
    for result in data.get("results") or []:
        if result.get("classification") != 2:
            continue
        chars = ((result.get("matches") or [{}])[0].get("text") or {}).get("chars") or {}
        for start, length in zip(chars.get("starts") or [], chars.get("lengths") or []):
            flagged.append(text[start:start + length])
    return {"ai": _pct(summary.get("ai", 0)), "flagged": flagged}


_AI_LABEL = re.compile(r"fake|chatgpt|gpt|\bai\b|machine|generated|^label_1$", re.I)
_HUMAN_LABEL = re.compile(r"real|human|^label_0$", re.I)


def _chunks(text, size=1200):
    out, cur = [], ""
    for part in re.split(r"(?<=[.!?])\s+", text):
        if cur and len(cur) + len(part) > size:
            out.append(cur)
            cur = ""
        cur = f"{cur} {part}".strip()
    if cur:
        out.append(cur)
    return out[:4]


def huggingface(text, c):
    model = c.get("HF_DETECTOR_MODEL") or "openai-community/roberta-base-openai-detector"
    scores = []
    for chunk in _chunks(text):
        try:
            data = post_json(
                f"https://router.huggingface.co/hf-inference/models/{model}",
                {"inputs": chunk},
                {"Authorization": f"Bearer {c['HF_TOKEN']}"},
            )
        except UpstreamError as e:
            if e.status == 503:
                raise DetectorError(f"{model} is still loading on Hugging Face, try again in a minute") from None
            raise
        if data and isinstance(data[0], list):
            data = data[0]
        ai = None
        for item in data or []:
            label = str(item.get("label", ""))
            if _AI_LABEL.search(label):
                ai = float(item.get("score", 0))
                break
            if _HUMAN_LABEL.search(label):
                ai = 1.0 - float(item.get("score", 0))
        if ai is None:
            raise DetectorError(f"don't recognise {model}'s labels: {[d.get('label') for d in data or []]}")
        scores.append((ai, len(chunk)))
    total = sum(n for _, n in scores) or 1
    return {"ai": _pct(sum(a * n for a, n in scores) / total), "flagged": []}


# id -> (display name, required credentials, optional credentials, adapter, min chars, link)
DETECTORS = {
    "gptzero": ("GPTZero", ["GPTZERO_API_KEY"], [], gptzero, 0, "https://gptzero.me/api"),
    "originality": ("Originality.ai", ["ORIGINALITY_API_KEY"], [], originality, 250, "https://originality.ai/api"),
    "copyleaks": ("Copyleaks", ["COPYLEAKS_EMAIL", "COPYLEAKS_API_KEY"], [], copyleaks, 255, "https://copyleaks.com/api"),
    "winston": ("Winston AI", ["WINSTON_API_KEY"], [], winston, 300, "https://gowinston.ai/ai-content-detection-api/"),
    "zerogpt": ("ZeroGPT", [], ["ZEROGPT_API_KEY"], zerogpt, 0, "https://zerogpt.com/business"),
    "sapling": ("Sapling", ["SAPLING_API_KEY"], [], sapling, 0, "https://sapling.ai/ai-content-detector"),
    "huggingface": ("Open-source RoBERTa (Hugging Face)", ["HF_TOKEN"], ["HF_DETECTOR_MODEL"], huggingface, 0,
                    "https://huggingface.co/settings/tokens"),
}

ALL_KEYS = sorted({k for _, req, opt, *_ in DETECTORS.values() for k in req + opt})


def credentials(detector_id, browser_keys):
    _, required, optional, *_ = DETECTORS[detector_id]
    out = {}
    for name in required + optional:
        val = (browser_keys or {}).get(name) or os.environ.get(name) or ""
        out[name] = str(val).strip()
    return out


def describe():
    out = []
    for did, (name, required, _optional, _fn, min_chars, link) in DETECTORS.items():
        out.append({
            "id": did,
            "name": name,
            "keys": required,
            "server_ready": all(os.environ.get(k) for k in required),
            "min_chars": min_chars,
            "link": link,
        })
    return out


def run(detector_id, text, browser_keys=None):
    if detector_id not in DETECTORS:
        raise DetectorError(f"unknown detector {detector_id!r}")
    name, required, _optional, fn, min_chars, _link = DETECTORS[detector_id]
    creds = credentials(detector_id, browser_keys)
    missing = [k for k in required if not creds.get(k)]
    if missing:
        raise DetectorError(f"{name} needs {', '.join(missing)}")
    if len(text) < min_chars:
        return {"ai": None, "flagged": [], "skipped": f"{name} needs at least {min_chars} characters"}
    try:
        result = fn(text, creds)
    except (KeyError, TypeError, ValueError, IndexError, AttributeError) as e:
        raise DetectorError(f"{name} sent a response this app doesn't understand ({type(e).__name__})") from None
    result["ai"] = round(result["ai"], 1)
    result["flagged"] = [s.strip() for s in result.get("flagged", []) if s and s.strip()][:8]
    return result
