"""python3 chess/tools/test_rules.py — the server's Python rules must agree with the browser's js/chess.js.

1. perft counts against the published values (start position, Kiwipete, two tricky endgames).
2. 60 random games played by the JS engine (via node): at every ply Python must produce the same set of
   legal moves, the same SAN, the same FEN after the move and the same outcome."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from chess_rules import Position, START

fails, passed = [], 0
def ok(c, m):
    global passed
    if c: passed += 1
    else: fails.append(m)

PERFT = [(START, 3, 8902), ("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", 2, 2039),
         ("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", 3, 2812), ("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", 2, 264)]
for fen, d, n in PERFT:
    got = Position(fen).perft(d)
    ok(got == n, f"perft {d} {fen[:30]}…: {got} != {n}")

js = r"""
import { Position } from '../js/chess.js';
let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
const sq = i => 'abcdefgh'[i & 7] + (8 - (i >> 3)), uci = m => sq(m.from) + sq(m.to) + (m.promo ? m.promo.toLowerCase() : '');
const games = [];
for (let g = 0; g < 60; g++) {
  const p = new Position(), plies = [];
  for (let i = 0; i < 160 && !p.outcome(); i++) {
    const ms = p.moves(), m = ms[Math.floor(rnd() * ms.length)];
    const san = p.san(m); const legal = ms.map(uci).sort(); p.make(m);
    plies.push({ legal, uci: uci(m), san, fen: p.fen() });
  }
  const o = p.outcome(); games.push({ plies, outcome: o ? [o.result, o.reason] : null });
}
console.log(JSON.stringify(games));
"""
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, "_gen.mjs")
open(src, "w").write(js)
try:
    games = json.loads(subprocess.run(["node", src], capture_output=True, text=True, check=True).stdout)
finally:
    os.remove(src)
for gi, game in enumerate(games):
    p = Position()
    for i, ply in enumerate(game["plies"]):
        legal = sorted(m.uci() for m in p.moves())
        if legal != ply["legal"]:
            ok(False, f"game {gi} ply {i}: legal moves differ ({len(legal)} vs {len(ply['legal'])})"); break
        m = next(m for m in p.moves() if m.uci() == ply["uci"])
        if p.san(m) != ply["san"]:
            ok(False, f"game {gi} ply {i}: SAN {p.san(m)} != {ply['san']}"); break
        p.make(m)
        if p.fen() != ply["fen"]:
            ok(False, f"game {gi} ply {i}: FEN differs"); break
    else:
        o = p.outcome()
        ok((list(o) if o else None) == game["outcome"], f"game {gi}: outcome {o} != {game['outcome']}")
        ok(True, "")
plies = sum(len(g["plies"]) for g in games)
if fails:
    for f in fails: print("FAIL", f)
    sys.exit(1)
print(f"{passed} checks passed ({len(games)} random games, {plies} plies compared with js/chess.js)")
