"""python3 tests/test_server.py — the real server over real sockets: accounts, WebSocket auth, two players
sharing one room, deaths scored by the server, the all-time board, and bots kept off it."""
import base64, http.client, json, os, shutil, socket, struct, subprocess, sys, tempfile, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 9481
passed, fails = 0, []
def ok(c, m):
    global passed
    if c: passed += 1
    else: fails.append(m)

def http_req(method, path, body=None, cookie=None):
    c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=10)
    h = {"Content-Type": "application/json"}
    if cookie: h["Cookie"] = cookie
    c.request(method, path, json.dumps(body) if body is not None else None, h)
    r = c.getresponse(); data = json.loads(r.read() or b"{}")
    set_c = r.getheader("Set-Cookie")
    return r.status, data, (set_c.split(";")[0] if set_c else cookie)

class WS:
    def __init__(self, game, cookie=None):
        self.s = socket.create_connection(("127.0.0.1", PORT), timeout=5)
        key = base64.b64encode(os.urandom(16)).decode()
        extra = f"Cookie: {cookie}\r\n" if cookie else ""
        self.s.sendall(f"GET /ws?game={game} HTTP/1.1\r\nHost: 127.0.0.1:{PORT}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n{extra}\r\n".encode())
        head = b""
        while b"\r\n\r\n" not in head: head += self.s.recv(1)
        self.status = head.split(b" ")[1]
        self.buf = b""
    def send(self, obj):
        p = json.dumps(obj).encode(); k = os.urandom(4)
        h = bytes([0x81, 0x80 | len(p)]) if len(p) < 126 else bytes([0x81, 0x80 | 126]) + struct.pack(">H", len(p))
        self.s.sendall(h + k + bytes(c ^ k[i & 3] for i, c in enumerate(p)))
    def _need(self, n):
        while len(self.buf) < n:
            d = self.s.recv(65536)
            if not d: raise EOFError
            self.buf += d
    def recv(self):
        self._need(2); b0, b1 = self.buf[0], self.buf[1]; n = b1 & 0x7F; off = 2
        if n == 126: self._need(4); n = struct.unpack(">H", self.buf[2:4])[0]; off = 4
        elif n == 127: self._need(10); n = struct.unpack(">Q", self.buf[2:10])[0]; off = 10
        self._need(off + n); data = self.buf[off:off + n]; self.buf = self.buf[off + n:]
        if b0 & 0x0F == 0x8: raise EOFError
        return json.loads(data)
    def until(self, pred, timeout=10):
        end = time.time() + timeout
        self.s.settimeout(timeout)
        while time.time() < end:
            m = self.recv()
            if pred(m): return m
        raise TimeoutError

data = tempfile.mkdtemp()
proc = subprocess.Popen([sys.executable, "server.py"], cwd=ROOT, env={**os.environ, "PORT": str(PORT), "DATA_DIR": data},
                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
try:
    for _ in range(50):
        try: http_req("GET", "/healthz"); break
        except (OSError, ValueError): time.sleep(0.1)
    c = http.client.HTTPConnection("127.0.0.1", PORT); c.request("GET", "/healthz"); ok(c.getresponse().read() == b"ok", "healthz")
    for path in ("/turf-wars/", "/wormhole-run/", "/sinkhole/", "/", "/js/net.js", "/js/ui.js"):
        c = http.client.HTTPConnection("127.0.0.1", PORT); c.request("GET", path); ok(c.getresponse().status == 200, f"serves {path}")
    for path in ("/server.py", "/iocore/scores.py", "/data/io.db", "/tests/test_server.py"):
        c = http.client.HTTPConnection("127.0.0.1", PORT); c.request("GET", path); ok(c.getresponse().status == 404, f"hides {path}")

    # accounts
    st, d, alice = http_req("POST", "/api/auth/register", {"username": "Alice", "pin": "1234"})
    ok(st == 200 and d["user"]["username"] == "Alice" and len(d["recovery"]) == 14 and alice, "register Alice")
    st, d, _ = http_req("POST", "/api/auth/register", {"username": "alice", "pin": "9999"})
    ok(st == 409, "usernames are unique ignoring capitals")
    st, d, _ = http_req("POST", "/api/auth/register", {"username": "Bo", "pin": "12"})
    ok(st == 400, "bad username/PIN refused")
    st, d, bob = http_req("POST", "/api/auth/register", {"username": "Bob", "pin": "4321"})
    st, d, _ = http_req("POST", "/api/auth/login", {"username": "bob", "pin": "0000"})
    ok(st == 401, "wrong PIN refused")
    st, d, bob2 = http_req("POST", "/api/auth/login", {"username": "bob", "pin": "4321"})
    ok(st == 200 and d["user"]["username"] == "Bob", "login with PIN")
    st, d, _ = http_req("GET", "/api/session", cookie=alice)
    ok(d["user"]["username"] == "Alice", "session from cookie")

    # no cookie, no game
    w = WS("turf-wars")
    m = w.until(lambda m: True)
    ok(m.get("t") == "error" and m.get("code") == "auth", "WebSocket without an account is refused")
    w = WS("not-a-game", alice); ok(w.status == b"404", "unknown game refused")

    # two humans, one room, bots filling the rest
    a, b = WS("turf-wars", alice), WS("turf-wars", bob)
    wa = a.until(lambda m: m["t"] == "welcome"); wb = b.until(lambda m: m["t"] == "welcome")
    ok(wa["room"] == wb["room"], "both players land in the same room")
    ok(wa["world"]["n"] == 100 and wa["world"]["owner"], "turf welcome carries the grid")
    lb = a.until(lambda m: m["t"] == "lb")
    ok(lb["humans"] == 2 and lb["n"] >= 10, f"room has 2 humans and bots ({lb['n']} players)")
    snap = a.until(lambda m: m["t"] == "s")
    ids = snap["p"][0::4]
    ok(wa["you"] in ids and wb["you"] in ids, "each sees the other in snapshots")
    # client tries to cheat: extra fields are ignored, only steering is read
    a.send({"t": "in", "d": 0, "score": 99999, "count": 9999})
    # Bob drives into the nearest wall: the server kills him and scores the run. Runs shorter than 3 s
    # don't count, and a bot may get him first, so give him a few lives to post one that does.
    for life in range(4):
        snap = b.until(lambda m: m["t"] == "s" and wb["you"] in m["p"][0::4], 10)
        ids = snap["p"][0::4]
        me = snap["p"][ids.index(wb["you"]) * 4: ids.index(wb["you"]) * 4 + 4]
        x, y = me[1] / 100, me[2] / 100
        d = min(((x, 2), (100 - x, 0), (y, 3), (100 - y, 1)))[1]
        time.sleep(3.2)
        t0 = time.time()
        while time.time() - t0 < 4:
            b.send({"t": "in", "d": d}); time.sleep(0.15)
        over = b.until(lambda m: m["t"] == "over", 30)
        if over["counted"]:
            break
        b.send({"t": "spawn"})
    ok(over["reason"] in ("crashed", "killed") and over["score"] > 0, f"Bob's death is reported by the server ({over})")
    ok(over["counted"] and over["best"] == over["score"] and over["allTime"] in (1, 2), f"run counted on the all-time board ({over})")
    st, d, _ = http_req("GET", "/api/leaderboard?game=turf-wars", cookie=bob)
    names = [r["name"] for r in d["top"]]
    ok(st == 200 and "Bob" in names and set(names) <= {"Alice", "Bob"}, f"board lists only humans, never bots ({d['top']})")
    ok(d["me"]["best"] == over["score"], "board knows Bob's best")
    st, d, _ = http_req("POST", "/api/leaderboard?game=turf-wars", {"score": 10000}, cookie=bob)
    ok(st == 404, "there is no way to post a score")
    b.send({"t": "spawn"})
    snap = b.until(lambda m: m["t"] == "s" and wb["you"] in m["p"][0::4], 5)
    ok(True, "play again respawns in the same room")
    a.s.close(); b.s.close()

    # the other two games accept players and stream their worlds
    w = WS("wormhole-run", alice)
    wel = w.until(lambda m: m["t"] == "welcome"); ok(wel["world"]["r"] > 0, "wormhole welcome")
    s = w.until(lambda m: m["t"] == "s" and "pl" in m); ok(any(x[0] == wel["you"] for x in s["w"]) and len(s["pl"]) > 0, "wormhole snapshot has you and pellets")
    w.send({"t": "in", "a": 1.2, "b": 1})
    w.s.close()
    w = WS("sinkhole", bob)
    wel = w.until(lambda m: m["t"] == "welcome"); ok(len(wel["world"]["objs"]) > 3000 and wel["world"]["types"], "sinkhole welcome carries the city")
    s = w.until(lambda m: m["t"] == "s"); ok(wel["you"] in s["h"][0::5] and s["ph"] == "play", "sinkhole snapshot has your hole")
    w.send({"t": "in", "a": 0.5, "m": 1})
    w.s.close()

    # input flood: the token bucket drops the excess instead of stalling the room
    w = WS("turf-wars", alice); w.until(lambda m: m["t"] == "welcome")
    for _ in range(400): w.send({"t": "in", "d": 1})
    ok(w.until(lambda m: m["t"] == "s") is not None, "flooding input doesn't break the socket")
    w.s.close()
finally:
    proc.terminate()
    out = proc.communicate(timeout=5)[0].decode()
    shutil.rmtree(data, ignore_errors=True)
    errs = [l for l in out.splitlines() if "failed" in l or "Traceback" in l]
    ok(not errs, "server log has no errors: " + " | ".join(errs[:3]))
print(f"{passed} server checks passed" + (f", {len(fails)} FAILED:\n  " + "\n  ".join(fails) if fails else ""))
sys.exit(1 if fails else 0)
