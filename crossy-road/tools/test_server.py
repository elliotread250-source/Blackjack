"""End-to-end tests for the Crossy Road server: accounts, devices, runs, coins, daily missions,
shop, crown, migration and admin. Starts a real server on a temp data dir.

    python3 tools/test_server.py
"""
import http.cookiejar
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8197
BASE = f"http://127.0.0.1:{PORT}"
DATA = tempfile.mkdtemp(prefix="crossy-test-")
DAY_MS = 86400000
passed = 0


def ok(cond, msg):
    global passed
    if not cond:
        raise AssertionError(msg)
    passed += 1


class Device:
    """One browser: its own cookie jar."""

    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def call(self, path, body=None, origin=None):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(BASE + path, data=data, method="POST" if body is not None else "GET",
                                     headers={"Content-Type": "application/json", **({"Origin": origin} if origin else {})})
        try:
            with self.op.open(req, timeout=30) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")


def fixture(seed, hop, rows, fast_at=-1):
    out = subprocess.run(["node", os.path.join(ROOT, "tools", "runfixture.mjs"), str(seed), str(hop), str(rows), str(fast_at)], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def play(dev, rows, fast_at=-1):
    s, r = dev.call("/api/run/start", {})
    assert s == 200, r
    f = fixture(r["seed"], r["hopTicks"], rows, fast_at)
    s2, res = dev.call("/api/run/finish", {"token": r["token"], "inputs": f["inputs"], "fast": f["fast"], "endTick": f["endTick"], "score": f["score"]})
    return r, f, s2, res


def main():
    legacy = [{"name": "Sam H", "score": 245, "char": "duck", "t": 1}]
    with open(os.path.join(DATA, "leaderboard.json"), "w") as fh:
        json.dump(legacy, fh)
    env = {**os.environ, "DATA_DIR": DATA, "PORT": str(PORT), "ADMIN_CODE": "testcode", "RUN_TIME_SLACK": "100000"}
    srv = subprocess.Popen([sys.executable, os.path.join(ROOT, "server.py")], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        for _ in range(60):
            try:
                urllib.request.urlopen(BASE + "/healthz", timeout=1)
                break
            except OSError:
                time.sleep(0.2)
        run_tests()
    finally:
        srv.terminate()
        out = srv.communicate(timeout=10)[0]
        if os.environ.get("VERBOSE"):
            print(out)
        shutil.rmtree(DATA, ignore_errors=True)
    print(f"{passed} server checks passed")


def run_tests():
    desk, phone, other = Device(), Device(), Device()
    # ---- accounts
    s, r = desk.call("/api/auth/check", {"username": "Sam"})
    ok(s == 200 and r["exists"] is False, "new username is free")
    ok(desk.call("/api/auth/check", {"username": "x"})[1]["ok"] is False, "too-short names are refused")
    s, r = desk.call("/api/auth/register", {"username": "Sam", "pin": "4821", "settings": {"hopTicks": 4}})
    ok(s == 200 and r["user"]["username"] == "Sam" and r["user"]["coins"] == 0 and len(r["recovery"]) == 14, "register Sam")
    recovery = r["recovery"]
    for variant in ("sam", "SAM", " Sam "):
        ok(other.call("/api/auth/check", {"username": variant})[1]["exists"] is True, f"'{variant}' is the same identity")
        ok(other.call("/api/auth/register", {"username": variant, "pin": "1111"})[0] == 409, f"can't register '{variant}' again")
    db = sqlite3.connect(os.path.join(DATA, "crossy.db"))
    row = db.execute("SELECT pin_hash, rec_hash FROM users WHERE uname = 'sam'").fetchone()
    ok("4821" not in row[0] and len(row[0]) == 64, "PIN is stored hashed, not in plain text")
    ok(desk.call("/api/session")[1]["user"]["username"] == "Sam", "this device stays signed in")
    ok(phone.call("/api/me")[0] == 401, "a new device is not signed in")
    ok(phone.call("/api/auth/login", {"username": "sam", "pin": "0000"})[0] == 401, "wrong PIN is refused")
    ok(phone.call("/api/auth/login", {"username": "nobody", "pin": "0000"})[1]["error"] == phone.call("/api/auth/login", {"username": "sam", "pin": "0001"})[1]["error"],
       "the same error for unknown users and wrong PINs")
    ok(desk.call("/api/auth/register", {"username": "Alex", "pin": "abcd"}, origin="https://evil.example")[0] == 403, "cross-site POSTs are refused")

    # ---- runs: the server replays them, coins come from the replay
    r, f, s, res = play(desk, 40)
    ok(s == 200 and res["result"]["score"] == f["score"] and res["result"]["coins"] == f["coins"], f"run replayed: score {f['score']}, coins {f['coins']}")
    ok(res["user"]["coins"] == f["coins"] and res["user"]["best"] == f["score"], "coins and best score credited")
    s2, again = desk.call("/api/run/finish", {"token": r["token"], "inputs": f["inputs"], "endTick": f["endTick"]})
    ok(again.get("repeat") and again["user"]["coins"] == f["coins"], "sending the same run twice pays once")
    s3, fake = desk.call("/api/run/start", {})
    lie = fixture(fake["seed"], 4, 15)
    s4, lied = desk.call("/api/run/finish", {"token": fake["token"], "inputs": lie["inputs"], "endTick": lie["endTick"], "score": 999})
    ok(s4 == 200 and lied["result"]["score"] == lie["score"], "a claimed score of 999 is ignored: the replay decides")
    coins_now = lied["user"]["coins"]
    r, f, s, res = play(desk, 30, fast_at=10)
    ok(res["practice"] and res["user"]["coins"] == coins_now, "runs using 'fast' are practice: no coins")
    # replay with someone else's token
    s, tok = desk.call("/api/run/start", {})
    ok(other.call("/api/run/finish", {"token": tok["token"], "inputs": [], "endTick": 1})[0] in (401, 404), "can't finish another player's run")

    # ---- cross-device: phone signs in with the PIN and sees the same account
    s, r = phone.call("/api/auth/login", {"username": "SAM", "pin": "4821"})
    ok(s == 200 and r["user"]["coins"] == coins_now and r["user"]["id"] == desk.call("/api/me")[1]["user"]["id"], "second device sees the same coins and account")

    # ---- shop
    buy = phone.call("/api/shop/buy", {"char": "foresthog"})
    ok(buy[0] == 200 if coins_now >= 25 else buy[0] == 402, "buy (or refused for lack of coins)")
    db.execute("UPDATE users SET coins = coins + 2000, coins_earned = coins_earned + 2000 WHERE uname = 'sam'")
    db.commit()
    s, b = desk.call("/api/shop/buy", {"char": "royalphoenix"})
    ok(s == 200 and "royalphoenix" in b["user"]["owned"] and b["user"]["equipped"] == "royalphoenix", "buy the Royal Phoenix")
    left = b["user"]["coins"]
    s, b2 = desk.call("/api/shop/buy", {"char": "royalphoenix"})
    ok(b2.get("already") and desk.call("/api/me")[1]["user"]["coins"] == left, "buying it again charges nothing")
    ok(desk.call("/api/shop/buy", {"char": "ironsuit"})[0] == 400, "challenge skins can't be bought")
    s, pz = desk.call("/api/shop/prize", {"req": "req-000000001"})
    won = pz["won"]
    price = {c: p for c, p in [("royalphoenix", 1000)]}
    ok(s == 200 and won != "royalphoenix", f"prize machine gave {won}")
    s, pz2 = desk.call("/api/shop/prize", {"req": "req-000000001"})
    ok(pz2.get("repeat") and pz2["won"] == won and desk.call("/api/me")[1]["user"]["coins"] == pz["user"]["coins"], "a retried prize request isn't charged twice")
    ok(phone.call("/api/me/equip", {"char": "royalphoenix"})[1]["user"]["equipped"] == "royalphoenix", "equip from the phone")
    ok(desk.call("/api/me")[1]["user"]["equipped"] == "royalphoenix", "equipped skin follows the account")

    # ---- settings follow the account
    ok(desk.call("/api/me/settings", {"settings": {"hopTicks": 8, "muted": True, "hopTicksX": 99}})[1]["settings"]["hopTicks"] == 8, "set 8-tick movement")
    ok(phone.call("/api/me")[1]["user"]["settings"]["hopTicks"] == 8, "the phone sees Classic (8 ticks)")
    ok(desk.call("/api/me/settings", {"settings": {"hopTicks": 5}})[1]["settings"]["hopTicks"] == 8, "only 4 or 8 are allowed")
    s, st = desk.call("/api/run/start", {})
    ok(st["hopTicks"] == 8, "new runs use the account's 8-tick setting")
    f8 = fixture(st["seed"], 8, 25)
    s, r8 = desk.call("/api/run/finish", {"token": st["token"], "inputs": f8["inputs"], "endTick": f8["endTick"], "score": f8["score"]})
    ok(r8["result"]["score"] == f8["score"], "an 8-tick run replays at 8 ticks")
    f4 = fixture(st["seed"], 4, 25)
    ok(f4["endTick"] != f8["endTick"] or f4["inputs"] != f8["inputs"], "4- and 8-tick runs really differ")

    # ---- secret skins: codes, and the 1-tick hop that only works while Quackers is on
    ok(desk.call("/api/redeem", {"code": "nope"})[0] == 404, "an unknown code is refused")
    s, r = desk.call("/api/redeem", {"code": " Parkour  SAM "})
    ok(s == 200 and r["char"] == "batcostume" and "batcostume" in r["user"]["owned"] and r["user"]["equipped"] == "batcostume", "'parkour sam' gives the Bat Costume")
    ok(desk.call("/api/me/settings", {"settings": {"hopTicks": 1}})[1]["settings"]["hopTicks"] == 1, "the 1-tick setting can be saved")
    ok(desk.call("/api/run/start", {})[1]["hopTicks"] == 4, "without Quackers the 1-tick setting plays at Fast")
    s, r = desk.call("/api/redeem", {"code": "quackers250"})
    ok(s == 200 and r["char"] == "quackers" and r["user"]["equipped"] == "quackers", "'quackers250' gives Quackers")
    r, f, s2, res = play(desk, 25)
    ok(r["hopTicks"] == 1 and s2 == 200 and res["result"]["score"] == f["score"] > 0, "wearing Quackers, runs are 1-tick and replay exactly")
    desk.call("/api/me/equip", {"char": "batcostume"})
    ok(desk.call("/api/run/start", {})[1]["hopTicks"] == 4, "switching skin takes the 1-tick hop away")
    desk.call("/api/me/equip", {"char": "quackers"})
    desk.call("/api/me/settings", {"settings": {"hopTicks": 8}})

    # ---- daily missions: force today's three to easy ones we can finish quickly
    day = int(time.time() * 1000) // DAY_MS
    db.execute("DELETE FROM daily_assign WHERE day = ?", (day,))
    for i, cid in enumerate(["E01", "M25", "H30"]):
        db.execute("INSERT INTO daily_assign (day, slot, cid) VALUES (?,?,?)", (day, i, cid))
    db.commit()
    s, d = desk.call("/api/daily")
    ok(s == 200 and [c["id"] for c in d["challenges"]] == ["E01", "M25", "H30"] and d["resetAt"] == (day + 1) * DAY_MS, "today's missions and the UTC reset")
    ok(d["challenges"][0]["done"] and d["challenges"][0]["reward"] == 10, "row 10 already reached today: done, worth 10")
    ok(d["challenges"][1]["reward"] == 25 + 5, "a Medium Rare mission pays 25 + 5")
    ok(desk.call("/api/daily/claim", {"day": day, "id": "H30"})[0] == 409, "can't claim an unfinished mission")
    before = desk.call("/api/me")[1]["user"]["coins"]
    s, c1 = desk.call("/api/daily/claim", {"day": day, "id": "E01"})
    ok(s == 200 and c1["awarded"] == 10 and c1["user"]["coins"] == before + 10, "claim pays 10 once")
    s, c2 = phone.call("/api/daily/claim", {"day": day, "id": "E01"})
    ok(c2.get("already") and c2["user"]["coins"] == before + 10, "claiming again (even from the phone) pays nothing")
    ok(desk.call("/api/daily/claim", {"day": day - 5, "id": "E01"})[0] == 410, "old days can't be claimed")
    ok(phone.call("/api/daily")[1]["challenges"][0]["claimed"], "the claim shows on the other device")

    # ---- crown: Alex beats Sam
    alex = Device()
    alex.call("/api/auth/register", {"username": "Alex", "pin": "9999"})
    lb = alex.call("/api/leaderboard")[1]
    ok(lb["champion"]["name"] == "Sam" and lb["top"][0]["crown"], "Sam holds the crown")
    ok(lb["legacy"][0]["name"] == "Sam H", "the classic board is kept separately")
    db.execute("UPDATE users SET best = 999, best_at = 1 WHERE uname = 'alex'")
    db.commit()
    ok(alex.call("/api/me")[1]["user"]["champion"] and not desk.call("/api/me")[1]["user"]["champion"], "the crown moves to Alex")

    # ---- account switching on one device
    s, r = desk.call("/api/auth/login", {"username": "alex", "pin": "9999"})
    ok(set(desk.call("/api/session")[1]["accounts"]) == {"Sam", "Alex"}, "both accounts remembered on the desktop")
    ok(desk.call("/api/auth/switch", {"username": "sam"})[1]["user"]["username"] == "Sam", "switch back to Sam without a PIN")
    ok(phone.call("/api/auth/switch", {"username": "alex"})[0] == 401, "a device Alex never used can't switch to Alex")
    ok(desk.call("/api/me")[1]["user"]["coins"] != alex.call("/api/me")[1]["user"]["coins"], "balances never mix")

    # ---- recovery code resets the PIN and signs other devices out
    s, rc = other.call("/api/auth/recover", {"username": "sam", "code": recovery.lower(), "pin": "2468"})
    ok(s == 200 and rc["recovery"] != recovery, "recovery code resets the PIN")
    ok(phone.call("/api/me")[0] == 401, "other devices are signed out after a reset")
    ok(phone.call("/api/auth/login", {"username": "sam", "pin": "2468"})[0] == 200, "new PIN works")

    # ---- brute force: an account locks after repeated wrong PINs
    attacker = Device()
    codes = [attacker.call("/api/auth/login", {"username": "alex", "pin": f"{i:04d}"})[0] for i in range(7)]
    ok(codes[-1] == 429, "repeated wrong PINs lock the account for a while")

    # ---- migration of an old local save (capped, once)
    mig = Device()
    mig.call("/api/auth/register", {"username": "Jordan", "pin": "1357"})
    s, m = mig.call("/api/migrate", {"coins": 99999, "owned": ["pig", "dragon", "royalphoenix", "nonsense"], "selected": "dragon", "records": {"score": 80}})
    ok(s == 200 and m["coins"] == 1000 and set(m["owned"]) == {"pig", "dragon"} and m["user"]["equipped"] == "dragon", "old save brought in, capped at 1000 coins, no premium skins")
    ok(mig.call("/api/migrate", {"coins": 500})[0] == 409, "and only once")
    ok("ironsuit" not in m["user"]["owned"] and m["user"]["records"]["score"] == 80, "records carried over")

    # ---- admin board editor
    ok(desk.call("/api/admin", {"code": "nope"})[0] == 403, "admin needs the code")
    s, a = desk.call("/api/admin", {"code": "testcode", "action": "list"})
    ok(s == 200 and a["rows"][0]["name"] == "Alex" and a["legacy"][0]["name"] == "Sam H", "admin lists both boards")
    desk.call("/api/admin", {"code": "testcode", "action": "save", "board": "accounts", "rows": [{"id": a["rows"][0]["id"], "score": 0}]})
    ok(alex.call("/api/leaderboard")[1]["champion"]["name"] == "Sam", "admin edits change the crown holder")

    # ---- the real-time check (a run can't end faster than it was played)
    os.environ  # (slack is huge in this server; the check is covered by test.mjs via the replay limits)


if __name__ == "__main__":
    main()
