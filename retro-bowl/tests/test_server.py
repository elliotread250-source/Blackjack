"""python3 tests/test_server.py — accounts, PINs, saves and the leaderboard against a real server process."""
import json, os, subprocess, sys, tempfile, time, urllib.request, http.cookiejar

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 18093
data = tempfile.mkdtemp()
env = dict(os.environ, PORT=str(PORT), DATA_DIR=data, MATCH_MIN_SECONDS="1")
srv = subprocess.Popen([sys.executable, os.path.join(ROOT, "server.py")], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
fails = 0

def client():
    jar = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    def call(path, body=None):
        req = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", data=None if body is None else json.dumps(body).encode(),
                                     headers={"Content-Type": "application/json"}, method="GET" if body is None else "POST")
        try:
            with op.open(req) as r: return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b"{}")
    return call

def ok(cond, msg):
    global fails
    if not cond: fails += 1; print("FAIL", msg)

try:
    for _ in range(50):
        try: urllib.request.urlopen(f"http://127.0.0.1:{PORT}/healthz"); break
        except Exception: time.sleep(0.1)
    a = client()
    s, r = a("/api/auth/check", {"username": "Coach Sam"}); ok(s == 200 and r["exists"] is False, "new name free")
    s, r = a("/api/auth/register", {"username": "Coach Sam", "pin": "12"}); ok(s == 400, "short pin refused")
    s, r = a("/api/auth/register", {"username": "Coach Sam", "pin": "1234"}); ok(s == 200 and r["recovery"], "register")
    rec = r["recovery"]
    s, r = a("/api/auth/register", {"username": "coach sam", "pin": "9999"}); ok(s == 409, "names unique ignoring case")
    s, r = a("/api/session"); ok(r["user"]["username"] == "Coach Sam", "signed in after register")
    s, r = a("/api/save", {"save": {"v": 1, "teamName": "Chicago", "x": 1}, "rev": 0}); ok(s == 200 and r["rev"] == 1, "save")
    s, r = a("/api/save", {"save": {"v": 1, "x": 2}, "rev": 0}); ok(s == 409, "stale save refused")
    b = client()
    s, r = b("/api/auth/login", {"username": "COACH SAM", "pin": "0000"}); ok(s == 401, "wrong pin")
    s, r = b("/api/auth/switch", {"username": "Coach Sam"}); ok(s == 401, "new device needs the pin")
    s, r = b("/api/auth/login", {"username": "COACH SAM", "pin": "1234"}); ok(s == 200, "login any case")
    s, r = b("/api/save"); ok(r["save"]["x"] == 1 and r["rev"] == 1, "save follows the account")
    s, r = b("/api/match/start", {}); tok = r["token"]
    s, r = b("/api/match/finish", {"token": tok, "us": 28, "them": 14, "kind": "season"}); ok(r.get("counted") is False, "instant result rejected")
    s, r = b("/api/match/start", {}); tok = r["token"]
    time.sleep(1.2)
    s, r = b("/api/match/finish", {"token": tok, "us": 14, "them": 10, "kind": "final"}); ok(r.get("counted") and r["user"]["titles"] == 1, "title counted")
    s, r = b("/api/match/finish", {"token": tok, "us": 14, "them": 10, "kind": "final"}); ok(r.get("counted") is False, "token used once")
    s, r = b("/api/match/finish", {"token": "nope", "us": 1, "them": 0}); ok(s == 404, "unknown token")
    s, r = b("/api/leaderboard"); ok(r["top"][0]["name"] == "Coach Sam" and r["top"][0]["team"] == "Chicago", "leaderboard")
    s, r = a("/api/auth/recover", {"username": "coach sam", "code": rec, "pin": "4321"}); ok(s == 200 and r["recovery"] != rec, "recover resets pin")
    s, r = b("/api/save"); ok(s == 401, "other devices signed out after reset")
    s, r = a("/api/auth/logout", {}); s, r = a("/api/session"); ok(r["user"] is None and r["accounts"] == ["Coach Sam"], "logout keeps account remembered")
    s, r = a("/api/auth/switch", {"username": "Coach Sam"}); ok(s == 200, "switch back without pin on a trusted device")
finally:
    srv.terminate()
print("server tests:", "FAILED %d" % fails if fails else "all good")
sys.exit(1 if fails else 0)
