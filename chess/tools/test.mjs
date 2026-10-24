// node tools/test.mjs — move generation (perft), rules, notation and the computer player.
import assert from 'node:assert/strict';
import { Position, think, sqIndex } from '../js/chess.js';

let n = 0; const ok = (v, m) => { assert(v, m); n++; };
// Standard perft positions: move generation must match these exact counts.
const PERFT = [
  ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', [20, 400, 8902, 197281]],
  ['r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', [48, 2039, 97862]],      // kiwipete
  ['8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238]],
  ['r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264, 9467]],
  ['rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486, 62379]],
];
for (const [fen, counts] of PERFT) counts.forEach((c, d) => ok(new Position(fen).perft(d + 1) === c, `perft ${d + 1} = ${c} for ${fen}`));
// FEN round trip, make/unmake restores everything
const p = new Position('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
const before = p.fen();
for (const m of p.moves()) { p.make(m); p.unmake(); }
ok(p.fen() === before, 'make/unmake restores the position');
// endings
ok(new Position('7k/8/8/8/8/8/5Q2/6K1 b - - 0 1').outcome() === null, 'not over yet');
ok(new Position('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1').outcome().reason === 'checkmate', 'checkmate');
ok(new Position('7k/5Q2/5K2/8/8/8/8/8 b - - 0 1').outcome().reason === 'stalemate', 'stalemate');
ok(new Position('8/8/4k3/8/8/4K3/4B3/8 w - - 0 1').outcome().reason === 'insufficient material', 'K+B v K is a draw');
const rep = new Position();
for (const [a, b] of [['g1', 'f3'], ['g8', 'f6'], ['f3', 'g1'], ['f6', 'g8'], ['g1', 'f3'], ['g8', 'f6'], ['f3', 'g1'], ['f6', 'g8']]) rep.make(rep.moves().find(m => m.from === sqIndex(a) && m.to === sqIndex(b)));
ok(rep.outcome()?.reason === 'threefold repetition', 'threefold repetition');
// notation
const s = new Position();
ok(s.san(s.moves().find(m => m.to === sqIndex('e4'))) === 'e4' && s.san(s.moves().find(m => m.to === sqIndex('f3') && m.piece === 'N')) === 'Nf3', 'SAN basics');
const c = new Position('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
ok(c.moves().filter(m => m.flag === 'castle').map(m => c.san(m)).sort().join() === 'O-O,O-O-O', 'both castles available');
const pr = new Position('8/P6k/8/8/8/8/8/K7 w - - 0 1');
ok(pr.moves().filter(m => m.promo).length === 4 && pr.san(pr.moves().find(m => m.promo === 'Q')) === 'a8=Q', 'promotion choices');
const dis = new Position('7k/8/8/8/8/8/8/R4RK1 w - - 0 1');
ok(dis.san(dis.moves().find(m => m.from === sqIndex('a1') && m.to === sqIndex('d1'))) === 'Rad1', 'SAN disambiguation');
// the computer finds mate in one and grabs a free queen
ok(new Position('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1').san(think('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', 'hard', { ms: 3000 }).move) === 'Ra8#', 'hard finds back-rank mate');
const grab = think('4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1', 'medium', { random: () => 0.99 });
ok(grab.move.to === sqIndex('d5'), 'medium takes a hanging queen');
// computer vs computer plays a legal game to the end
let g = new Position(), plies = 0;
while (!g.outcome() && plies < 160) { const r = think(g.fen(), 'easy', { ms: 40 }); g.make(r.move); plies++; }
ok(plies > 10, `easy vs easy played ${plies} legal plies`);
console.log(n + ' chess checks passed');
