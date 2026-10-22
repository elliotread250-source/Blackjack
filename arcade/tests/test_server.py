"""python3 arcade/tests/test_server.py — starts the hub server on a free port with a temporary data
folder and checks every route the redesigned page relies on. Nothing touches real data."""
import json, os, socket, subprocess, sys, tempfile, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
passed, fails = 0, []
def ok(c, m):
    global passed
    if c: passed += 1
    else: fails.append(m)

def req(path, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, headers={"Content-Type": "application/json", **(headers or {})}, method="POST" if data is not None else "GET")
    try:
        with urllib.request.urlopen(r, timeout=10) as res:
            return res.status, res.read(), {k.lower(): v for k, v in res.headers.items()}
    except urllib.error.HTTPError as e:
        return e.code, e.read(), {k.lower(): v for k, v in e.headers.items()}

s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
BASE = f"http://127.0.0.1:{port}"
data = tempfile.mkdtemp()
env = {**os.environ, "PORT": str(port), "DATA_DIR": data, "SUGGESTIONS_CODE": "test-code-123"}
proc = subprocess.Popen([sys.executable, os.path.join(ROOT, "server.py")], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try:
            if req("/healthz")[0] == 200: break
        except OSError: time.sleep(.1)
    st, body, _ = req("/healthz"); ok(st == 200 and body == b"ok", "healthz")
    registry = json.load(open(os.path.join(ROOT, "registry.json")))["games"]
    live = {g["id"] for g in registry if not g.get("pending")}

    # page + assets are served with the right types and caching
    st, body, h = req("/"); ok(st == 200 and b"OPEN ARCADE" in body, "home page served")
    st, _, h = req("/js/app.js"); ok(st == 200 and h.get("content-type", "").startswith("text/javascript"), "module served as JavaScript")
    st, _, h = req("/css/tokens.css"); ok(st == 200 and h.get("content-type", "").startswith("text/css"), "css type")
    st, _, h = req("/assets/game-logos/tetris.svg"); ok(st == 200 and h.get("content-type") == "image/svg+xml" and "max-age" in h.get("cache-control", ""), "artwork served as SVG and cached")
    st, _, h = req("/registry.json"); ok(st == 200 and h.get("cache-control") == "no-cache", "registry always revalidated")
    st, _, h = req("/assets/branding/apple-touch-icon.png"); ok(st == 200 and h.get("content-type") == "image/png", "png type")
    ok(req("/data/plays.json")[0] == 404, "data folder never served")

    # play counts: count once, ignore a quick repeat, reject junk
    st, body, _ = req("/api/plays"); ok(st == 200 and json.loads(body)["plays"] == {}, "plays start empty in a fresh data dir")
    st, body, _ = req("/api/play", {"game": "tetris"}); ok(st == 200 and json.loads(body)["plays"] == 1, "a play is counted")
    st, body, _ = req("/api/play", {"game": "tetris"}); ok(json.loads(body)["plays"] == 1, "same visitor within 30 s is not counted twice")
    ok(req("/api/play", {"game": "../etc"})[0] == 400, "bad game key rejected")
    ok(json.load(open(os.path.join(data, "plays.json"))) == {"tetris": 1}, "plays persisted to the data dir")

    # status: only registry games, never anything from the request
    st, body, _ = req("/api/status?url=http://169.254.169.254/&game=evil"); s1 = json.loads(body)
    ok(st == 200 and set(s1["status"]) == live, "status covers exactly the live registry games")
    ok(all(v in ("up", "down", "checking") for v in s1["status"].values()), "status values are honest states")
    ok("evil" not in s1["status"], "query parameters are ignored")

    # suggestions: same API, code-protected viewing
    ok(req("/api/suggestions", {"text": "hi"})[0] == 400, "too-short suggestion rejected")
    ok(req("/api/suggestions", {"text": "Add a rhythm game", "name": "QA"})[0] == 201, "suggestion saved")
    ok(req("/api/suggestions/view", {"code": "nope"})[0] == 403, "wrong code refused")
    st, body, _ = req("/api/suggestions/view", {"code": "test-code-123"})
    ok(st == 200 and json.loads(body)["suggestions"][0]["text"] == "Add a rhythm game", "right code lists suggestions")
    ok(req("/api/nope", {})[0] == 404, "unknown POST route is 404")

    # 20x rebuild: themed 404 for missing pages only; API and data 404s stay JSON; new pages and moments served
    st, body, h = req("/no/such/page"); ok(st == 404 and b"GAME OVER" in body and h.get("content-type", "").startswith("text/html"), "missing page gets the themed 404 (still a 404)")
    st, body, h = req("/data/plays.json"); ok(st == 404 and h.get("content-type") == "application/json", "data folder 404 is unchanged JSON")
    st, body, h = req("/api/nope", {}); ok(st == 404 and json.loads(body)["error"] == "Not found", "API 404 is unchanged JSON")
    st, body, _ = req("/styleguide.html"); ok(st == 200 and b"Style guide" in body, "style guide served")
    st, _, h = req("/assets/game-moments/tetris.svg"); ok(st == 200 and h.get("content-type") == "image/svg+xml" and "max-age" in h.get("cache-control", ""), "hover moment served as SVG and cached")
    st, body, _ = req("/"); ok(b"STATIC-LIST:START" in body and body.count(b'href="https://') >= len(live), "home page carries the no-JS game list")
finally:
    proc.terminate(); proc.wait()

if fails:
    for f in fails: print("FAIL", f)
    print(f"{passed} passed, {len(fails)} failed"); sys.exit(1)
print(f"{passed} server checks passed")
