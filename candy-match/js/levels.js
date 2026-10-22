// levels.js: the 40 hand-designed levels. Each one is a shape (a mask of holes), a few
// painted obstacles, a goal and a move limit. Every column of a shape must be one
// contiguous run (holes only at its top or bottom) so refills and ingredient exits work.
// Move limits and star scores come from js/tuning.js, which tools/tune.cjs regenerates
// from the bot's results (see README), so the numbers below are only the starting point.
import { TUNE } from './tuning.js';

const S = {
  full: ['.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........'],
  diamond: ['###...###', '##.....##', '#.......#', '.........', '.........', '.........', '#.......#', '##.....##', '###...###'],
  castle: ['...###...', '...###...', '.........', '.........', '.........', '.........', '.........', '.........', '.........'],
  pyramid: ['####.####', '###...###', '##.....##', '#.......#', '.........', '.........', '.........', '.........', '.........'],
  bowl: ['.........', '.........', '.........', '.........', '.........', '#.......#', '##.....##', '###...###', '####.####'],
  plus: ['###...###', '###...###', '###...###', '.........', '.........', '.........', '###...###', '###...###', '###...###'],
  wings: ['#.......#', '.........', '.........', '.........', '.........', '.........', '.........', '.........', '#.......#'],
  notch: ['.#######.', '.#######.', '.........', '.........', '.........', '.........', '.........', '.........', '.........'],
  tower: ['##.....##', '##.....##', '#.......#', '#.......#', '.........', '.........', '.........', '.........', '.........'],
  funnel: ['.........', '.........', '.........', '.........', '.........', '#.......#', '#.......#', '##.....##', '###...###'],
};

// paint(shape, [[char, (r, c) => bool], ...]): holes stay holes; where rules overlap the
// obstacle wins over jelly (priority i x K k c J j).
function paint(shape, rules) {
  return S[shape].map((row, r) => [...row].map((ch, c) => {
    if (ch === '#') return '#';
    let best = ch, rank = 99;
    for (const [x, f] of rules) {
      const k = 'ixKkcJj'.indexOf(x);
      if (f(r, c) && k < rank) { best = x; rank = k; }
    }
    return best;
  }).join(''));
}
const rowsGE = n => r => r >= n;
const at = (...p) => (r, c) => p.some(([pr, pc]) => pr === r && pc === c);
const box = (r0, r1, c0, c1) => (r, c) => r >= r0 && r <= r1 && c >= c0 && c <= c1;
const check = k => (r, c) => (r + c) % 2 === k;
const and = (...f) => (r, c) => f.every(g => g(r, c));
const R = n => r => r === n;
const ing = (...cols) => ['i', (r, c) => r === 0 && cols.includes(c)];

function L(shape, colors, moves, goal, rules = [], extra = {}) {
  return { shape, colors, moves, goal, rows: paint(shape, rules), stars: [1000, 2000, 3000], ...extra };
}

const BASE = [
  /* 1 */ L('full', 5, 20, { score: 3000 }),
  /* 2 */ L('diamond', 5, 20, { score: 4500 }),
  /* 3 */ L('full', 5, 22, { jelly: 1 }, [['j', rowsGE(7)]]),
  /* 4 */ L('castle', 5, 20, { collect: [0, 40] }),
  /* 5 */ L('full', 5, 24, { ing: 2 }, [ing(2, 6)]),
  /* 6 */ L('pyramid', 5, 25, { jelly: 1 }, [['j', rowsGE(6)]]),
  /* 7 */ L('diamond', 5, 24, { jelly: 1 }, [['J', box(3, 5, 3, 5)], ['j', box(2, 6, 2, 6)]]),
  /* 8 */ L('full', 5, 22, { collect: [3, 45] }),
  /* 9 */ L('plus', 5, 26, { jelly: 1 }, [['k', and(box(3, 5, 3, 5), check(0))], ['j', box(3, 5, 2, 6)]]),
  /* 10 */ L('bowl', 5, 26, { ing: 2 }, [ing(2, 6)]),

  /* 11 */ L('full', 5, 28, { jelly: 1 }, [['J', rowsGE(7)]]),
  /* 12 */ L('diamond', 6, 22, { score: 7000 }),
  /* 13 */ L('castle', 5, 24, { collect: [1, 40] }, [['x', at([4, 0], [4, 8], [6, 3], [6, 5])]]),
  /* 14 */ L('plus', 5, 28, { ing: 2 }, [ing(3, 5), ['c', at([4, 3], [4, 5], [5, 4])]]),
  /* 15 */ L('full', 6, 28, { jelly: 1 }, [['j', and(rowsGE(4), check(0))]]),
  /* 16 */ L('bowl', 5, 30, { ing: 3 }, [ing(2, 4, 6)]),
  /* 17 */ L('pyramid', 5, 28, { jelly: 1 }, [['x', at([6, 0], [6, 8], [4, 4])], ['j', rowsGE(6)]]),
  /* 18 */ L('diamond', 5, 24, { score: 6000, collect: [4, 30] }),
  /* 19 */ L('wings', 6, 28, { jelly: 1 }, [['k', at([1, 1], [1, 7], [7, 1], [7, 7])], ['J', box(4, 4, 3, 5)], ['j', box(3, 5, 1, 7)]]),
  /* 20 */ L('full', 6, 32, { jelly: 1 }, [['J', box(7, 8, 2, 6)], ['j', box(7, 8, 0, 8)], ['x', at([4, 0], [4, 8])], ['k', at([4, 3], [4, 5])]]),

  /* 21 */ L('tower', 6, 26, { collect: [2, 34] }, [['c', at([5, 3], [5, 5], [6, 4])]]),
  /* 22 */ L('funnel', 6, 30, { ing: 2 }, [ing(1, 7), ['x', at([5, 1], [5, 7])]]),
  /* 23 */ L('notch', 6, 28, { jelly: 1 }, [['J', box(6, 8, 3, 5)], ['j', box(4, 8, 2, 6)]]),
  /* 24 */ L('plus', 6, 30, { jelly: 1, score: 9000 }, [['k', at([4, 1], [4, 2], [4, 6], [4, 7])], ['j', box(2, 6, 3, 5)]]),
  /* 25 */ L('castle', 6, 32, { ing: 2, jelly: 1 }, [ing(3, 5), ['j', rowsGE(8)], ['c', at([4, 2], [4, 6])]]),
  /* 26 */ L('diamond', 6, 26, { collect: [5, 30] }, [['x', at([3, 3], [3, 5], [5, 3], [5, 5])]]),
  /* 27 */ L('pyramid', 6, 30, { jelly: 1 }, [['K', at([8, 2], [8, 6])], ['J', box(7, 8, 2, 6)], ['j', box(7, 8, 0, 8)], ['x', at([5, 0], [5, 8])]]),
  /* 28 */ L('bowl', 6, 34, { ing: 2 }, [ing(2, 6), ['c', at([2, 4], [3, 3], [3, 5])], ['x', at([4, 4])]]),
  /* 29 */ L('wings', 6, 28, { score: 14000 }, [['c', at([4, 1], [4, 7])]]),
  /* 30 */ L('full', 6, 36, { jelly: 1 }, [['J', box(7, 8, 2, 6)], ['j', and(box(4, 6, 0, 8), check(0))], ['x', at([0, 4], [6, 0], [6, 8])], ['k', at([2, 2], [2, 6])]]),

  /* 31 */ L('notch', 6, 26, { collect: [0, 30], score: 9000 }, [['x', at([5, 2], [5, 6])]]),
  /* 32 */ L('tower', 6, 34, { jelly: 1 }, [['J', box(7, 8, 2, 6)], ['j', box(4, 6, 2, 6)], ['c', at([4, 4], [3, 3], [3, 5])]]),
  /* 33 */ L('funnel', 6, 34, { ing: 2 }, [ing(3, 5), ['c', at([3, 2], [3, 6], [4, 4])], ['x', at([4, 1], [4, 7])]]),
  /* 34 */ L('diamond', 6, 28, { jelly: 1, collect: [3, 20] }, [['J', box(3, 5, 3, 5)], ['x', at([2, 4], [6, 4])]]),
  /* 35 */ L('plus', 6, 36, { jelly: 1 }, [['K', at([4, 4])], ['k', at([4, 3], [4, 5], [3, 4], [5, 4])], ['J', box(3, 5, 2, 6)], ['x', at([0, 3], [0, 5], [8, 3], [8, 5])]]),
  /* 36 */ L('castle', 6, 36, { ing: 2 }, [ing(3, 5), ['c', at([3, 1], [3, 7], [5, 1], [5, 7], [4, 4])], ['x', at([6, 3], [6, 5])]]),
  /* 37 */ L('pyramid', 6, 30, { score: 18000 }, [['c', at([5, 3], [5, 5])], ['x', at([6, 4])]]),
  /* 38 */ L('wings', 6, 36, { jelly: 1, ing: 2 }, [ing(2, 6), ['J', box(7, 7, 1, 7)], ['j', box(5, 6, 1, 7)], ['k', at([2, 4], [4, 2], [4, 6])], ['x', at([5, 0], [5, 8])]]),
  /* 39 */ L('full', 6, 36, { collect: [1, 32], jelly: 1 }, [['J', box(3, 5, 3, 5)], ['x', at([1, 1], [1, 7], [7, 1], [7, 7])], ['c', at([4, 1], [4, 7])]]),
  /* 40 */ L('full', 6, 42, { jelly: 1, ing: 3, score: 20000 }, [ing(1, 4, 7), ['J', box(7, 8, 3, 5)], ['K', at([4, 4])], ['k', at([3, 3], [3, 5], [5, 3], [5, 5])], ['x', at([2, 0], [2, 8], [6, 0], [6, 8])]]),
].map((lv, i) => ({ n: i + 1, ...lv }));

export const BASE_LEVELS = BASE;
export const LEVELS = BASE.map(lv => {
  const t = TUNE[lv.n];
  const out = { ...lv, goal: { ...lv.goal } };
  if (t) {
    out.moves = t.moves;
    out.stars = t.stars.slice();
    if (out.goal.score) out.goal.score = t.stars[0];
  }
  out.seed = 1000 + lv.n * 7919;
  return out;
});
export const LEVEL_COUNT = LEVELS.length;
