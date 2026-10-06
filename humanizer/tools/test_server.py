"""Server tests: routes, auth, and each detector adapter against canned responses.

Run from humanizer/: python tools/test_server.py
"""

import json
import os
import sys
import threading
import unittest
import urllib.error
import urllib.request
from functools import partial
from http.server import ThreadingHTTPServer
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import detectors  # noqa: E402
import llm  # noqa: E402
import server  # noqa: E402

KEY_VARS = detectors.ALL_KEYS + ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "OPENAI_API_KEY", "APP_PASSWORD"]


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.env = mock.patch.dict(os.environ, {k: "" for k in KEY_VARS})
        cls.env.start()
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), partial(server.Handler, directory=server.ROOT))
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.env.stop()

    def call(self, path, body=None, headers=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, headers={"Content-Type": "application/json", **(headers or {})})
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        try:
            with opener.open(req, timeout=10) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def test_health_and_page(self):
        self.assertEqual(self.call("/healthz"), (200, b"ok"))
        status, body = self.call("/")
        self.assertEqual(status, 200)
        self.assertIn(b"<title>Humanizer</title>", body)
        for path in ("/js/app.js", "/js/local-detectors.worker.js", "/style.css", "/icon.svg"):
            self.assertEqual(self.call(path)[0], 200, path)

    def test_source_and_listings_hidden(self):
        for path in ("/server.py", "/detectors.py", "/Dockerfile", "/railway.json", "/js/", "/tools/test.mjs"):
            self.assertEqual(self.call(path)[0], 404, path)

    def test_config_without_keys(self):
        status, body = self.call("/api/config")
        cfg = json.loads(body)
        self.assertEqual(status, 200)
        self.assertFalse(cfg["password"])
        self.assertFalse(cfg["llm"]["claude"]["ready"])
        self.assertFalse(cfg["llm"]["gpt"]["ready"])
        ready = {d["id"]: d["server_ready"] for d in cfg["detectors"]}
        self.assertTrue(ready["zerogpt"], "ZeroGPT needs no key")
        self.assertFalse(ready["gptzero"])

    def test_llm_without_key_is_clear_error(self):
        status, body = self.call("/api/llm", {"vendor": "claude", "system": "s", "prompt": "p"})
        self.assertEqual(status, 502)
        self.assertIn("ANTHROPIC_API_KEY", json.loads(body)["error"])

    def test_detect_validation(self):
        self.assertEqual(self.call("/api/detect", {"id": "nope", "text": "hi"})[0], 400)
        status, body = self.call("/api/detect", {"id": "gptzero", "text": "hi"})
        self.assertEqual(status, 400)
        self.assertIn("GPTZERO_API_KEY", json.loads(body)["error"])
        self.assertEqual(self.call("/api/detect", {"id": "gptzero", "text": ""})[0], 400)
        self.assertEqual(self.call("/api/detect", {"id": "gptzero", "text": "x" * 40000})[0], 400)

    def test_detect_short_text_skips(self):
        status, body = self.call("/api/detect", {"id": "winston", "text": "short", "keys": {"WINSTON_API_KEY": "k"}})
        self.assertEqual(status, 200)
        self.assertIn("300", json.loads(body)["skipped"])

    def test_password(self):
        with mock.patch.dict(os.environ, {"APP_PASSWORD": "pw"}):
            self.assertEqual(self.call("/api/detect", {"id": "zerogpt", "text": "hi"})[0], 401)
            cfg = json.loads(self.call("/api/config")[1])
            self.assertTrue(cfg["password"])
            self.assertFalse(cfg["authorized"])
            cfg = json.loads(self.call("/api/config", headers={"X-App-Password": "pw"})[1])
            self.assertTrue(cfg["authorized"])
            status, _ = self.call("/api/detect", {"id": "nope", "text": "hi"}, {"X-App-Password": "pw"})
            self.assertEqual(status, 400)

    def test_upstream_failure_is_502(self):
        def boom(*a, **k):
            raise detectors.UpstreamError("api.zerogpt.com returned 403: blocked", 403)

        with mock.patch.object(detectors, "post_json", boom):
            status, body = self.call("/api/detect", {"id": "zerogpt", "text": "Some text here."})
        self.assertEqual(status, 502)
        self.assertIn("403", json.loads(body)["error"])


class AdapterTest(unittest.TestCase):
    TEXT = "First sentence here. " * 20

    def run_with(self, det, payload, keys):
        calls = []

        def fake(url, body, headers=None, timeout=90):
            calls.append((url, body, headers or {}))
            return payload(url) if callable(payload) else payload

        with mock.patch.object(detectors, "post_json", fake):
            return detectors.run(det, self.TEXT, keys), calls

    def test_gptzero(self):
        r, calls = self.run_with("gptzero", {"documents": [{"class_probabilities": {"human": 0.1, "ai": 0.8, "mixed": 0.1},
                                                          "sentences": [{"sentence": "A.", "generated_prob": 0.9}]}]},
                                 {"GPTZERO_API_KEY": "k"})
        self.assertEqual(r["ai"], 90.0)
        self.assertEqual(r["flagged"], ["A."])
        self.assertEqual(calls[0][2]["x-api-key"], "k")

    def test_originality(self):
        r, _ = self.run_with("originality", {"score": {"ai": 0.42, "original": 0.58}, "blocks": [{"text": "B.", "result": {"fake": 0.7}}]},
                             {"ORIGINALITY_API_KEY": "k"})
        self.assertEqual((r["ai"], r["flagged"]), (42.0, ["B."]))

    def test_sapling(self):
        r, calls = self.run_with("sapling", {"score": 0.123, "sentence_scores": [{"sentence": "C.", "score": 0.9}]}, {"SAPLING_API_KEY": "k"})
        self.assertEqual((r["ai"], r["flagged"]), (12.3, ["C."]))
        self.assertEqual(calls[0][1]["key"], "k")

    def test_winston_reports_human_score(self):
        r, _ = self.run_with("winston", {"score": 85, "sentences": [{"text": "D.", "score": 20}]}, {"WINSTON_API_KEY": "k"})
        self.assertEqual((r["ai"], r["flagged"]), (15.0, ["D."]))

    def test_zerogpt_free_and_keyed(self):
        payload = {"success": True, "data": {"fakePercentage": 33.5, "h": ["E."]}}
        r, calls = self.run_with("zerogpt", payload, {})
        self.assertEqual((r["ai"], r["flagged"]), (33.5, ["E."]))
        self.assertNotIn("ApiKey", calls[0][2])
        self.assertEqual(calls[0][2]["Origin"], "https://www.zerogpt.com")
        _, calls = self.run_with("zerogpt", payload, {"ZEROGPT_API_KEY": "k"})
        self.assertEqual(calls[0][2]["ApiKey"], "k")

    def test_copyleaks(self):
        detectors._copyleaks_tokens.clear()

        def payload(url):
            if "login" in url:
                return {"access_token": "tok"}
            return {"summary": {"ai": 0.6, "human": 0.4},
                    "results": [{"classification": 2, "matches": [{"text": {"chars": {"starts": [0], "lengths": [15]}}}]}]}

        r, calls = self.run_with("copyleaks", payload, {"COPYLEAKS_EMAIL": "a@b.c", "COPYLEAKS_API_KEY": "k"})
        self.assertEqual((r["ai"], r["flagged"]), (60.0, ["First sentence"]))
        self.assertEqual(calls[1][2]["Authorization"], "Bearer tok")

    def test_huggingface_labels(self):
        r, _ = self.run_with("huggingface", [[{"label": "Real", "score": 0.3}, {"label": "Fake", "score": 0.7}]], {"HF_TOKEN": "t"})
        self.assertEqual(r["ai"], 70.0)

    def test_garbage_response_is_detector_error(self):
        with self.assertRaises(detectors.DetectorError):
            self.run_with("winston", {"nothing": True}, {"WINSTON_API_KEY": "k"})
        with self.assertRaises(detectors.DetectorError):
            self.run_with("gptzero", {"documents": "nope"}, {"GPTZERO_API_KEY": "k"})


class LLMTest(unittest.TestCase):
    def test_openai_model_pick(self):
        with mock.patch.dict(os.environ, {"OPENAI_MODEL": ""}), \
             mock.patch.object(llm, "get_json", return_value={"data": [{"id": "gpt-4o"}, {"id": "gpt-5.5"}, {"id": "gpt-5.5-mini"}, {"id": "gpt-5"}]}):
            llm._openai_model = None
            self.assertEqual(llm._pick_openai_model("k"), "gpt-5.5")
        llm._openai_model = None

    def test_gpt_request_shape(self):
        seen = {}

        def fake(url, body, headers=None, timeout=90):
            seen.update(body=body, headers=headers)
            return {"model": "gpt-5.5", "choices": [{"message": {"content": " hi "}, "finish_reason": "stop"}]}

        with mock.patch.dict(os.environ, {"OPENAI_API_KEY": "k", "OPENAI_MODEL": "gpt-5.5"}), mock.patch.object(llm, "post_json", fake):
            self.assertEqual(llm.ask("gpt", "sys", "prompt", "judge"), ("hi", "gpt-5.5"))
        self.assertEqual(seen["body"]["reasoning_effort"], "low")
        self.assertNotIn("temperature", seen["body"])
        self.assertEqual(seen["headers"]["Authorization"], "Bearer k")


if __name__ == "__main__":
    unittest.main(verbosity=1)
