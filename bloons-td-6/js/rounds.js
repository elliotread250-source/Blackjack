'use strict';
// Rounds 1-100, modelled on BTD6's standard set: same milestones (blacks on 20,
// whites on 22, the first camo on 24, purples on 25, leads on 28, the first
// MOAB on 40, BFB on 60, ZOMG on 80, DDTs on 90, the B.A.D. on 100).
// Each group: [count, type, startSeconds, endSeconds]. Flags after a colon:
// c = camo, r = regrow, f = fortified.
BTD.ROUNDS = [
  null,
  [[20, 'red', 0, 17.5]],
  [[35, 'red', 0, 19]],
  [[25, 'red', 0, 15], [5, 'blue', 5, 13]],
  [[35, 'red', 0, 18], [18, 'blue', 6, 18]],
  [[5, 'red', 0, 3], [27, 'blue', 2, 17]],
  [[15, 'red', 0, 12], [15, 'blue', 3, 14], [4, 'green', 12, 16]],
  [[20, 'red', 0, 12], [25, 'blue', 3, 17], [5, 'green', 14, 18]],
  [[10, 'red', 0, 8], [20, 'blue', 2, 16], [14, 'green', 8, 18]],
  [[30, 'green', 0, 18]],
  [[102, 'blue', 0, 25]],
  [[10, 'red', 0, 6], [18, 'blue', 3, 12], [12, 'green', 8, 16], [3, 'yellow', 15, 18]],
  [[15, 'blue', 0, 8], [10, 'green', 6, 14], [5, 'yellow', 12, 18]],
  [[50, 'blue', 0, 16], [23, 'green', 8, 20]],
  [[49, 'red', 0, 14], [15, 'blue', 4, 12], [10, 'green', 10, 16], [9, 'yellow', 14, 20]],
  [[20, 'red', 0, 8], [15, 'green', 4, 12], [12, 'yellow', 10, 18], [5, 'pink', 16, 20]],
  [[20, 'green', 0, 10], [8, 'yellow', 8, 16]],
  [[8, 'yellow:r', 0, 12]],
  [[80, 'green', 0, 22]],
  [[10, 'green', 0, 6], [4, 'yellow', 4, 8], [5, 'yellow:r', 6, 12], [7, 'pink', 10, 16]],
  [[6, 'black', 0, 10]],
  [[14, 'yellow', 0, 8], [12, 'pink', 4, 14]],
  [[16, 'white', 0, 15]],
  [[7, 'black', 0, 8], [7, 'white', 4, 12]],
  [[1, 'green:c', 0, 0], [20, 'blue', 1, 12]],
  [[31, 'yellow:r', 0, 14], [10, 'purple', 10, 18]],
  [[23, 'pink', 0, 12], [4, 'zebra', 10, 16]],
  [[100, 'red', 0, 12], [60, 'blue', 2, 14], [45, 'green', 6, 18], [45, 'yellow', 10, 22]],
  [[6, 'lead', 0, 10]],
  [[48, 'yellow', 0, 14], [12, 'yellow:r', 8, 18]],
  [[9, 'lead', 0, 14]],
  [[8, 'zebra', 0, 8], [8, 'black:r', 4, 12], [8, 'white:r', 8, 16]],
  [[25, 'black', 0, 14], [30, 'white', 4, 18], [15, 'purple', 10, 20]],
  [[20, 'yellow:c', 0, 8], [15, 'red', 2, 10], [13, 'pink:r', 8, 14]],
  [[140, 'yellow', 0, 24], [5, 'zebra', 16, 22]],
  [[35, 'pink', 0, 10], [30, 'black', 6, 16], [25, 'white', 10, 20], [5, 'rainbow', 18, 22]],
  [[81, 'pink', 0, 16]],
  [[20, 'black', 0, 8], [20, 'white', 4, 12], [7, 'white:c', 10, 14], [15, 'lead', 10, 20], [10, 'zebra', 16, 24]],
  [[42, 'pink', 0, 10], [17, 'white', 6, 14], [14, 'lead', 10, 18], [10, 'zebra', 14, 22], [4, 'ceramic', 20, 26]],
  [[10, 'black', 0, 6], [10, 'white', 3, 9], [20, 'zebra', 6, 16], [12, 'rainbow', 12, 22], [6, 'rainbow:r', 18, 26]],
  [[1, 'moab', 0, 0]],
  [[60, 'black', 0, 16], [60, 'zebra', 4, 24]],
  [[6, 'rainbow:r', 0, 8], [2, 'moab', 6, 12]],
  [[10, 'rainbow', 0, 8], [7, 'ceramic', 6, 14]],
  [[50, 'zebra', 0, 16]],
  [[200, 'pink', 0, 24], [8, 'ceramic:r', 10, 20]],
  [[1, 'lead:c', 0, 0], [2, 'moab', 3, 10]],
  [[70, 'pink:c', 0, 14], [12, 'rainbow', 8, 16]],
  [[120, 'pink', 0, 16], [50, 'rainbow:r', 8, 22]],
  [[343, 'green', 0, 24], [20, 'zebra', 4, 14], [30, 'rainbow', 10, 22], [10, 'rainbow:r', 16, 24], [10, 'ceramic:r', 20, 28]],
  [[8, 'lead', 0, 6], [20, 'red', 0, 8], [2, 'moab', 6, 14], [20, 'ceramic', 10, 22]],
  [[10, 'rainbow', 0, 8], [28, 'ceramic', 4, 20]],
  [[25, 'rainbow:r', 0, 12], [10, 'ceramic:r', 8, 16], [2, 'moab', 12, 20]],
  [[80, 'pink:c', 0, 18], [3, 'moab', 10, 22]],
  [[35, 'ceramic', 0, 18], [2, 'moab', 12, 20]],
  [[45, 'ceramic', 0, 20], [1, 'moab', 18, 18]],
  [[40, 'rainbow:c', 0, 16], [1, 'moab', 10, 10]],
  [[40, 'rainbow', 0, 14], [4, 'moab', 8, 22]],
  [[29, 'ceramic', 0, 14], [5, 'moab', 8, 24]],
  [[50, 'lead:r', 0, 20], [28, 'ceramic', 8, 24]],
  [[1, 'bfb', 0, 0]],
  [[150, 'zebra', 0, 20], [5, 'moab', 8, 20]],
  [[80, 'pink:c', 0, 16], [12, 'moab', 4, 26]],
  [[75, 'lead', 0, 18], [50, 'ceramic', 4, 24], [5, 'moab', 16, 28]],
  [[9, 'moab', 0, 16]],
  [[12, 'zebra:c', 0, 4], [3, 'bfb', 2, 20], [4, 'moab', 8, 20]],
  [[25, 'ceramic:c', 0, 12], [2, 'moab', 4, 8]],
  [[24, 'ceramic', 0, 12], [4, 'moab', 6, 16]],
  [[4, 'moab', 0, 8], [1, 'bfb', 6, 6]],
  [[50, 'lead:c', 0, 16], [30, 'rainbow:cr', 6, 18]],
  [[200, 'rainbow:r', 0, 24], [4, 'moab', 10, 20]],
  [[30, 'ceramic:c', 0, 14], [10, 'moab', 4, 24]],
  [[3, 'bfb', 0, 12]],
  [[150, 'ceramic', 0, 30]],
  [[15, 'moab', 0, 20], [3, 'bfb', 10, 20], [30, 'ceramic:cr', 4, 20]],
  [[6, 'bfb', 0, 20], [30, 'lead:c', 6, 16]],
  [[60, 'ceramic:c', 0, 20]],
  [[3, 'bfb', 0, 6], [20, 'moab', 4, 24]],
  [[100, 'ceramic', 0, 26], [3, 'bfb', 10, 20]],
  [[16, 'moab', 0, 18], [4, 'bfb', 8, 20], [30, 'rainbow:cr', 2, 14]],
  [[1, 'zomg', 0, 0], [2, 'bfb', 6, 12]],
  [[30, 'ceramic:cr', 0, 14], [6, 'bfb', 4, 20]],
  [[100, 'ceramic:cr', 0, 24], [20, 'moab', 10, 24]],
  [[30, 'moab', 0, 20], [8, 'bfb', 10, 24]],
  [[50, 'moab', 0, 24], [4, 'bfb', 10, 20]],
  [[1, 'zomg', 0, 0], [4, 'bfb', 4, 12]],
  [[20, 'moab', 0, 10], [2, 'zomg', 8, 16]],
  [[120, 'ceramic:f', 0, 26], [6, 'bfb', 10, 22]],
  [[30, 'moab', 0, 14], [6, 'bfb', 6, 18]],
  [[2, 'zomg', 0, 12], [10, 'moab:f', 4, 16]],
  [[9, 'ddt', 0, 16]],
  [[3, 'zomg', 0, 14], [10, 'bfb', 4, 20]],
  [[6, 'zomg', 0, 22]],
  [[20, 'bfb', 0, 24], [5, 'ddt', 10, 20]],
  [[3, 'zomg', 0, 10], [10, 'ddt', 4, 20]],
  [[30, 'bfb', 0, 20], [4, 'zomg', 4, 16], [20, 'ddt:f', 10, 28]],
  [[5, 'zomg:f', 0, 16], [30, 'bfb', 4, 24]],
  [[4, 'zomg:f', 0, 10], [30, 'ddt', 2, 24]],
  [[30, 'bfb:f', 0, 30], [6, 'zomg:f', 6, 24]],
  [[10, 'zomg', 0, 20], [20, 'ddt:f', 4, 24]],
  [[1, 'bad', 0, 0]],
];

// Freeplay (101+): seeded mix that keeps getting meaner, plus BTD6-style
// health and speed ramps on blimps.
BTD.freeplayRound = function (n) {
  let s = n * 9301 + 49297;
  const rnd = () => { s = (s * 233280 + 49297) % 2147483647; return (s % 100000) / 100000; };
  const g = [];
  const span = 24;
  if (n % 10 === 0) g.push([1 + Math.floor((n - 100) / 20), 'bad', 0, span]);
  const pool = ['ceramic:f', 'ceramic:cr', 'moab:f', 'bfb', 'bfb:f', 'zomg', 'ddt', 'ddt:f', 'zomg:f'];
  const k = 2 + Math.floor(rnd() * 3);
  for (let i = 0; i < k; i++) {
    const t = pool[Math.floor(rnd() * pool.length)];
    const base = t.startsWith('ceramic') ? 60 : t.startsWith('moab') ? 24 : t.startsWith('bfb') ? 12 : t.startsWith('ddt') ? 14 : 5;
    const c = Math.round(base * (0.6 + rnd() * 0.8) * (1 + (n - 100) * 0.02));
    const st = rnd() * 8;
    g.push([c, t, st, st + 10 + rnd() * 14]);
  }
  return g;
};

BTD.roundSpec = (n) => (n <= 100 ? BTD.ROUNDS[n] : BTD.freeplayRound(n));

// Blimp health and bloon speed ramps for late rounds.
BTD.hpScale = (n) => {
  if (n <= 80) return 1;
  if (n <= 100) return 1 + (n - 80) * 0.02;
  if (n <= 124) return 1.4 + (n - 100) * 0.05;
  if (n <= 150) return 2.6 + (n - 124) * 0.15;
  if (n <= 250) return 6.5 + (n - 150) * 0.35;
  return 41.5 + (n - 250) * 1;
};
BTD.speedScale = (n) => {
  if (n <= 80) return 1;
  if (n <= 100) return 1 + (n - 80) * 0.02;
  if (n <= 150) return 1.4 + (n - 100) * 0.02;
  if (n <= 200) return 2.4 + (n - 150) * 0.01;
  return 2.9;
};
BTD.cashScale = (n) => {
  if (n <= 50) return 1;
  if (n <= 60) return 0.5;
  if (n <= 85) return 0.2;
  if (n <= 100) return 0.1;
  if (n <= 120) return 0.05;
  return 0.02;
};
