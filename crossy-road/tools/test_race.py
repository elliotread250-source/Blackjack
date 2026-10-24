"""python3 crossy-road/tools/test_race.py — race rooms (race.py) with fake sockets, a fake clock and a fake replay."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import race  # noqa: E402

passed, fails = 0, []


def ok(c, m):
    global passed
    if c:
        passed += 1
    else:
        fails.append(m)


class Clock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


class FakeConn:
    def __init__(self):
        self.out, self.closed, self.room, self.tokens = [], False, None, 1e9

    def send(self, obj):
        self.out.append(json.loads(json.dumps(obj)))
        return True

    def send_raw(self, data):
        n = data[1] & 0x7F
        off = 2 if n < 126 else 4 if n == 126 else 10
        self.out.append(json.loads(data[off:].decode()))
        return True

    def allow(self, cost=1.0):
        if self.tokens < cost:
            return False
        self.tokens -= cost
        return True

    def close(self, code=1000):
        self.closed = True

    def take(self, t=None):
        got = [m for m in self.out if t is None or m["t"] == t]
        self.out = [m for m in self.out if not (t is None or m["t"] == t)]
        return got

    def last(self, t):
        got = [m for m in self.out if m["t"] == t]
        return got[-1] if got else None


calls = []
replay_result = {"fn": lambda seed, hop, inputs, fast, end: {"score": len(inputs), "practice": False, "dead": True}}


def replay(seed, hop, inputs, fast, end):
    calls.append((seed, hop, len(inputs), end))
    return replay_result["fn"](seed, hop, inputs, fast, end)


clock = Clock()
srv = race.RaceServer(replay, now=clock, limit_s=180, countdown_ms=4000, quick_start_s=12, finish_grace_s=45)


def send(c, **m):
    srv.handle(c, m)


# ---- private room: create, join, start
a, b, c = FakeConn(), FakeConn(), FakeConn()
send(a, t="create", name="Ann<script>", ch="duck")
lob = a.last("lobby")
ok(lob and len(lob["code"]) == 4 and lob["host"] == lob["you"] and lob["phase"] == "lobby", "create opens a lobby with you as host")
ok(lob["players"][0]["name"] == "Annscript" and lob["players"][0]["ch"] == "duck", "names are cleaned, character kept")
code, a_id, a_tok = lob["code"], lob["you"], lob["token"]
send(b, t="join", code=code.lower(), name="Bob", ch="../../etc")
lb = b.last("lobby")
ok(lb and len(lb["players"]) == 2 and lb["players"][1]["ch"] == "chicken", "join by code (case-insensitive); bad character id falls back")
ok(a.last("lobby")["players"][1]["name"] == "Bob", "host sees the new player")
send(c, t="join", code="ZZZZ", name="Cy")
ok(c.last("error")["msg"] == "no room", "unknown code refused")
b_id, b_tok = lb["you"], lb["token"]
a.take(); b.take()
send(b, t="go")
ok(not a.out and not b.out, "only the host can start")
send(a, t="go", hopTicks=4)
sa, sb = a.last("start"), b.last("start")
ok(sa and sb and sa["seed"] == sb["seed"] and sa["hopTicks"] == 4 and sa["in"] == 4000 and sa["limit"] == 180, "both get the same seed, speed, countdown and limit")
ok(sa["you"] == a_id and sb["you"] == b_id, "each start says who you are")
seed1 = sa["seed"]
send(c, t="join", code=code, name="Cy")
ok(c.last("error")["msg"] == "racing", "no joining mid-race")

# ---- positions are relayed (sanitised), never echoed
clock.t += 5
srv.sweep()
a.take(); b.take()
send(a, t="pos", k=60, r=3, x=1.5, s=3, d=False)
pa = b.last("pos")
ok(pa and pa["id"] == a_id and pa["r"] == 3 and pa["s"] == 3 and not a.out, "position relayed to the others only")
send(a, t="pos", k="x", r=3, x=1, s=3)
send(a, t="pos", k=70, r=1e9, x=-1e9, s=2)
pa = b.last("pos")
ok(pa["r"] == 100000 and pa["x"] == -20 and pa["s"] == 3, "out-of-range numbers clamped; score never goes down; junk ignored")

# ---- finishing: too fast is disqualified, a real run is replayed
send(b, t="finish", inputs=[[1, "up"]] * 5, endTick=60 * 60, fast=[])          # 60 s of play after 1 s of race
rb = a.last("result")
ok(rb and rb["id"] == b_id and rb["status"] == "dq" and rb["score"] == 0, "a run longer than the time that has passed is disqualified")
ok(not calls, "a disqualified run is never replayed")
clock.t += 30
send(a, t="finish", inputs=[[10, "up"]] * 12, endTick=30 * 60, fast=[])
ra = b.last("result")
ok(ra and ra["id"] == a_id and ra["status"] == "ok" and ra["score"] == 12, "a valid run is scored by the replay")
ok(calls and calls[-1][0] == seed1 and calls[-1][1] == 4, "the replay uses the room's seed and speed")
fin = a.last("final")
ok(fin and [r["id"] for r in fin["standings"]] == [a_id, b_id] and fin["standings"][0]["place"] == 1 and fin["standings"][1]["status"] == "dq", "final standings: verified first, disqualified last")
send(a, t="finish", inputs=[], endTick=10)
ok(len(calls) == 1, "a second finish is ignored")

# ---- rematch from the results
a.take(); b.take()
send(a, t="go")
s2 = b.last("start")
ok(s2 and s2["seed"] != seed1 and s2["race"] == 2 and s2["hopTicks"] == 8, "rematch: new seed, race 2, default speed")
clock.t += 10
srv.sweep()

# ---- fast, practice and broken replays are disqualified
send(a, t="finish", inputs=[[5, "up"]], endTick=300, fast=[100])
ok(b.last("result")["status"] == "dq", "a run using fast is disqualified")
replay_result["fn"] = lambda *_: {"score": 50, "practice": True, "dead": True}
send(b, t="finish", inputs=[[5, "up"]], endTick=300, fast=[])
ok(a.last("result")["status"] == "dq", "a replay that says practice is disqualified")
replay_result["fn"] = lambda seed, hop, inputs, fast, end: {"score": len(inputs), "practice": False, "dead": True}

# ---- ties share a place
x, y, z = FakeConn(), FakeConn(), FakeConn()
send(x, t="create", name="X")
cx = x.last("lobby")["code"]
send(y, t="join", code=cx, name="Y")
send(z, t="join", code=cx, name="Z")
send(x, t="go")
clock.t += 20
srv.sweep()
for conn, n in ((x, 7), (y, 7), (z, 3)):
    send(conn, t="finish", inputs=[[1, "up"]] * n, endTick=600)
st = x.last("final")["standings"]
ok([r["place"] for r in st] == [1, 1, 3], "equal scores share a place, the next place skips")

# ---- dropping out mid-race, reconnecting, and the time limit
p, q = FakeConn(), FakeConn()
send(p, t="create", name="P")
cp = p.last("lobby")["code"]
send(q, t="join", code=cp, name="Q")
q_tok, q_id = q.last("lobby")["token"], q.last("lobby")["you"]
send(p, t="go")
clock.t += 6
srv.sweep()
send(p, t="pos", k=100, r=8, x=0, s=8)
srv.leave(q, graceful=False)
ok(p.last("away")["id"] == q_id, "others see a dropped player as away")
q2 = FakeConn()
send(q2, t="resume", code=cp, token="wrong")
ok(q2.last("error")["msg"] == "no session", "resume needs the seat token")
send(q2, t="resume", code=cp, token=q_tok)
lq = q2.last("lobby")
ok(lq and lq["race"] and lq["race"]["seed"] and lq["race"]["elapsed"] > 0, "resume brings back the race (seed, elapsed time)")
ok(q2.last("pos") and q2.last("pos")["r"] == 8, "resume replays the others' last positions")
ok(p.last("back")["id"] == q_id, "others see the player come back")
send(q2, t="finish", inputs=[[1, "up"]] * 4, endTick=200)
ok(p.last("result")["score"] == 4, "a reconnected player can still finish")
clock.t += 180 + 45 + 1
srv.sweep()
fin = q2.last("final")
ok(fin and {r["status"] for r in fin["standings"]} == {"ok", "dnf"}, "when time runs out, anyone without a result is DNF")

# ---- quick play
u = [FakeConn() for _ in range(5)]
send(u[0], t="quick", name="U0")
ok(u[0].last("lobby")["quick"] and not u[0].last("soon"), "one quick player waits")
send(u[1], t="quick", name="U1")
ok(u[0].last("soon") and u[0].last("lobby")["code"] == u[1].last("lobby")["code"], "a second quick player joins the same room; start is announced")
clock.t += 13
srv.sweep()
ok(u[0].last("start") and u[1].last("start"), "a quick room starts by itself")
send(u[2], t="quick", name="U2")
ok(u[2].last("lobby")["code"] != u[0].last("lobby")["code"], "a racing quick room takes nobody new")
for i in (3, 4):
    send(u[i], t="quick", name="U%d" % i)
send(FakeConn(), t="quick", name="U5")
ok(u[2].last("start") and u[4].last("start"), "four quick players start at once")

# ---- leaving the lobby passes host on; full rooms; rate limit; idle expiry
h, g = FakeConn(), FakeConn()
send(h, t="create", name="H")
ch = h.last("lobby")["code"]
send(g, t="join", code=ch, name="G")
g_id = g.last("lobby")["you"]
send(h, t="leave")
ok(g.last("lobby")["host"] == g_id and len(g.last("lobby")["players"]) == 1, "the host leaving hands the room on")
for i in range(3):
    send(FakeConn(), t="join", code=ch, name="F%d" % i)
late = FakeConn()
send(late, t="join", code=ch, name="Late")
ok(late.last("error")["msg"] == "room full", "a fifth player is refused")
spam = FakeConn()
spam.tokens = 2
send(spam, t="create", name="S")
send(spam, t="create", name="S")
send(spam, t="create", name="S")
ok(spam.last("error") and spam.last("error")["msg"] == "slow down", "rate limited")
lonely = FakeConn()
send(lonely, t="create", name="L")
cl = lonely.last("lobby")["code"]
clock.t += race.ROOM_IDLE_S + 1
srv.sweep()
ok(cl not in srv.rooms and lonely.last("error")["msg"] == "expired", "idle rooms expire")
srv.leave(g, graceful=False)
clock.t += race.SEAT_GRACE_S + 1
srv.sweep()
ok(ch not in srv.rooms or all(s.conn is not g for s in srv.rooms[ch].seats), "a dropped seat outside a race goes after the grace period")

if fails:
    for f in fails:
        print("FAIL", f)
    print(f"{passed} passed, {len(fails)} failed")
    sys.exit(1)
print(f"{passed} race checks passed")
