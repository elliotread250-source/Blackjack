'use strict';
// Bloon table. Speeds and layer structure follow BTD6: speed 1 is a red,
// children are what pops out, hp is per layer (ceramics and blimps soak hits).
window.BTD = window.BTD || {};

BTD.W = 1000;            // playfield width in px
BTD.H = 680;             // playfield height in px
BTD.U = 3;               // BTD6 distance units to px
BTD.BASE_SPEED = 84;     // px/s for a red bloon

BTD.BLOONS = {
  red:     { hp: 1,  speed: 1,    r: 11,   color: '#ee2b2b', kids: [] },
  blue:    { hp: 1,  speed: 1.4,  r: 11.5, color: '#2a8df0', kids: ['red'] },
  green:   { hp: 1,  speed: 1.8,  r: 12,   color: '#57c51e', kids: ['blue'] },
  yellow:  { hp: 1,  speed: 3.2,  r: 12.5, color: '#ffe01a', kids: ['green'] },
  pink:    { hp: 1,  speed: 3.5,  r: 13,   color: '#ff79b4', kids: ['yellow'] },
  black:   { hp: 1,  speed: 1.8,  r: 8.5,  color: '#1b1b1d', kids: ['pink', 'pink'], immune: ['explosion'] },
  white:   { hp: 1,  speed: 2,    r: 8.5,  color: '#f2f4f6', kids: ['pink', 'pink'], immune: ['cold'] },
  purple:  { hp: 1,  speed: 3,    r: 13,   color: '#9b34d8', kids: ['pink', 'pink'], immune: ['energy', 'fire', 'plasma'] },
  lead:    { hp: 1,  speed: 1,    r: 13,   color: '#8b9097', kids: ['black', 'black'], immune: ['sharp'], fortHp: 4 },
  zebra:   { hp: 1,  speed: 1.8,  r: 13,   color: '#ffffff', kids: ['black', 'white'], immune: ['explosion', 'cold'] },
  rainbow: { hp: 1,  speed: 2.2,  r: 14,   color: '#ff9a1a', kids: ['zebra', 'zebra'] },
  ceramic: { hp: 10, speed: 2.5,  r: 15,   color: '#b8722e', kids: ['rainbow', 'rainbow'], fortHp: 20 },
  moab:    { hp: 200,   speed: 1,    moab: 1, len: 66,  wid: 42, color: '#2f7fe0', kids: ['ceramic', 'ceramic', 'ceramic', 'ceramic'] },
  bfb:     { hp: 700,   speed: 0.25, moab: 2, len: 92,  wid: 58, color: '#d8262a', kids: ['moab', 'moab', 'moab', 'moab'] },
  zomg:    { hp: 4000,  speed: 0.18, moab: 3, len: 112, wid: 70, color: '#3a3f2c', kids: ['bfb', 'bfb', 'bfb', 'bfb'] },
  ddt:     { hp: 400,   speed: 2.75, moab: 2, len: 70,  wid: 36, color: '#2c2f2a', kids: ['ceramic', 'ceramic', 'ceramic', 'ceramic', 'ceramic', 'ceramic'], immune: ['sharp', 'explosion'], camo: true, kidFlags: 'cr' },
  bad:     { hp: 20000, speed: 0.18, moab: 4, len: 140, wid: 88, color: '#6b2fa8', kids: ['zomg', 'zomg', 'ddt', 'ddt', 'ddt'] },
};

BTD.RANK = ['red', 'blue', 'green', 'yellow', 'pink', 'black', 'white', 'purple', 'lead', 'zebra', 'rainbow', 'ceramic', 'moab', 'ddt', 'bfb', 'zomg', 'bad'];

(function () {
  const B = BTD.BLOONS;
  BTD.RANK.forEach((k, i) => { B[k].rank = i; B[k].key = k; });
  // Red bloon equivalent: what it costs you in lives if it leaks, and how
  // many pops (= dollars) it's worth popped all the way down.
  const rbe = (k) => {
    const b = B[k];
    if (b.rbe) return b.rbe;
    b.rbe = b.hp + b.kids.reduce((s, c) => s + rbe(c), 0);
    return b.rbe;
  };
  const pops = (k) => {
    const b = B[k];
    if (b.pops) return b.pops;
    b.pops = 1 + b.kids.reduce((s, c) => s + pops(c), 0);
    return b.pops;
  };
  for (const k in B) { rbe(k); pops(k); }
  BTD.NAMES = {
    red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow', pink: 'Pink', black: 'Black',
    white: 'White', purple: 'Purple', lead: 'Lead', zebra: 'Zebra', rainbow: 'Rainbow',
    ceramic: 'Ceramic', moab: 'M.O.A.B.', bfb: 'B.F.B.', zomg: 'Z.O.M.G.', ddt: 'D.D.T.', bad: 'B.A.D.',
  };
})();
