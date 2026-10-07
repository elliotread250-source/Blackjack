'use strict';
// Maps. Field is 1000x680. Paths are control points: 'round' draws straight
// runs with rounded corners, 'spline' a smooth curve through the points.
// water: placement zones for subs and boats. lava/blocks: no placement.
BTD.THEMES = {
  grass:  { g1: '#79c442', g2: '#69b335', g3: '#8dd352', track: '#e2c48a', edge: '#b48d55', shade: '#cfae6f', tree: ['#3f9a2a', '#2f7d1f', '#58b83a'], deco: 'flowers' },
  autumn: { g1: '#a5bf45', g2: '#93ad38', g3: '#b9cf5a', track: '#d8b98a', edge: '#a78559', shade: '#c4a374', tree: ['#e0822a', '#c45b1d', '#f2b134'], deco: 'leaves' },
  snow:   { g1: '#eaf3f8', g2: '#d8e6ef', g3: '#f8fcff', track: '#b5a184', edge: '#87735a', shade: '#a28e72', tree: ['#2f6b4a', '#22553a', '#3f8460'], deco: 'snow' },
  spa:    { g1: '#ead9b3', g2: '#dcc89d', g3: '#f3e6c6', track: '#c9a77a', edge: '#9b7a51', shade: '#b8966a', tree: ['#4fae55', '#3c9244', '#68c46b'], deco: 'tiles' },
  cubism: { g1: '#e7ecf3', g2: '#d5dde8', g3: '#f6f8fb', track: '#86b8e8', edge: '#4f86c2', shade: '#73a6da', tree: ['#ff6d6d', '#ffb340', '#6bc1ff'], deco: 'cubes' },
  dark:   { g1: '#3d4a3a', g2: '#33402f', g3: '#4a5946', track: '#7d6b57', edge: '#4e4136', shade: '#6d5c4a', tree: ['#2a3a2a', '#1f2c1f', '#3a4d36'], deco: 'graves' },
  cave:   { g1: '#5c4a3b', g2: '#4f3f32', g3: '#6b5747', track: '#b29a76', edge: '#7a6448', shade: '#9e8664', tree: ['#3b2f25', '#2e241c', '#4a3c30'], deco: 'embers' },
  lava:   { g1: '#4a2f28', g2: '#3e2621', g3: '#5a3a30', track: '#8e7464', edge: '#5b463b', shade: '#7c6556', tree: ['#2b1d19', '#211613', '#3a2822'], deco: 'embers' },
};

BTD.MAPS = [
  {
    id: 'meadow', name: 'Monkey Meadow', diff: 'Beginner', theme: 'grass', trees: 14,
    paths: [{ mode: 'round', r: 46, pts: [[-40, 200], [200, 200], [200, 80], [420, 80], [420, 330], [110, 330], [110, 580], [560, 580], [560, 150], [790, 150], [790, 520], [1040, 520]] }],
  },
  {
    id: 'stump', name: 'Tree Stump', diff: 'Beginner', theme: 'grass', trees: 10,
    stump: [520, 350, 58],
    paths: [{ mode: 'spline', pts: [[-40, 110], [180, 90], [420, 50], [680, 70], [880, 170], [930, 360], [860, 540], [640, 630], [380, 620], [170, 530], [110, 360], [200, 220], [400, 170], [620, 190], [760, 300], [740, 440], [600, 500], [420, 480], [350, 385], [430, 335], [520, 350]] }],
  },
  {
    id: 'alpine', name: 'Alpine Run', diff: 'Beginner', theme: 'snow', trees: 16,
    paths: [{ mode: 'spline', pts: [[-40, 560], [150, 560], [260, 460], [230, 300], [120, 180], [180, 70], [360, 60], [470, 170], [460, 340], [540, 500], [700, 560], [850, 480], [860, 320], [760, 200], [800, 80], [1040, 60]] }],
  },
  {
    id: 'park', name: 'Park Path', diff: 'Intermediate', theme: 'autumn', trees: 14,
    water: [{ t: 'ellipse', x: 500, y: 350, rx: 210, ry: 130 }],
    paths: [{ mode: 'round', r: 50, pts: [[460, -40], [460, 110], [150, 110], [150, 580], [850, 580], [850, 110], [640, 110], [640, -40]] }],
  },
  {
    id: 'spa', name: 'Spa Pits', diff: 'Intermediate', theme: 'spa', trees: 6,
    water: [{ t: 'circle', x: 250, y: 450, r: 82 }, { t: 'circle', x: 490, y: 250, r: 92 }, { t: 'circle', x: 740, y: 440, r: 86 }, { t: 'circle', x: 930, y: 580, r: 70 }],
    paths: [{ mode: 'round', r: 40, pts: [[-40, 340], [140, 340], [140, 120], [360, 120], [360, 560], [620, 560], [620, 120], [860, 120], [860, 340], [1040, 340]] }],
  },
  {
    id: 'cubism', name: 'Cubism', diff: 'Advanced', theme: 'cubism', trees: 10,
    paths: [{ mode: 'round', r: 16, pts: [[-40, 120], [300, 120], [300, 300], [120, 300], [120, 560], [480, 560], [480, 220], [700, 220], [700, 460], [880, 460], [880, -40]] }],
  },
  {
    id: 'downstream', name: 'Downstream', diff: 'Intermediate', theme: 'grass', trees: 10,
    water: [{ t: 'ellipse', x: 385, y: 290, rx: 68, ry: 100 }, { t: 'ellipse', x: 690, y: 420, rx: 58, ry: 88 }, { t: 'circle', x: 95, y: 110, r: 70 }],
    paths: [{ mode: 'spline', pts: [[-40, 600], [150, 560], [260, 440], [200, 300], [260, 160], [420, 100], [560, 180], [560, 330], [460, 450], [520, 580], [700, 620], [860, 540], [880, 380], [780, 260], [840, 120], [1040, 90]] }],
  },
  {
    id: 'patspond', name: "Pat's Pond", diff: 'Advanced', theme: 'autumn', trees: 10,
    hole: [300, 440, 36],
    water: [{ t: 'ellipse', x: 520, y: 510, rx: 250, ry: 36 }, { t: 'ellipse', x: 470, y: 350, rx: 150, ry: 34 }],
    paths: [{ mode: 'round', r: 55, pts: [[-40, 120], [860, 120], [860, 580], [140, 580], [140, 260], [700, 260], [700, 440], [300, 440]] }],
  },
  {
    id: 'underground', name: 'Underground', diff: 'Advanced', theme: 'cave', trees: 8,
    paths: [{ mode: 'round', r: 30, pts: [[-40, 580], [120, 580], [120, 100], [300, 100], [300, 470], [480, 470], [480, 100], [660, 100], [660, 470], [840, 470], [840, 100], [1040, 100]] }],
  },
  {
    id: 'castle', name: 'Dark Castle', diff: 'Expert', theme: 'dark', trees: 10,
    castle: [930, 330],
    water: [{ t: 'ellipse', x: 105, y: 340, rx: 70, ry: 115 }, { t: 'ellipse', x: 530, y: 340, rx: 85, ry: 55 }],
    paths: [
      { mode: 'spline', pts: [[-40, 60], [280, 60], [340, 150], [210, 200], [235, 270], [420, 250], [560, 170], [720, 110], [810, 220], [880, 330]] },
      { mode: 'spline', pts: [[-40, 620], [280, 620], [340, 530], [210, 480], [235, 410], [420, 430], [560, 510], [720, 570], [810, 460], [880, 350]] },
    ],
  },
  {
    id: 'quad', name: 'Quad', diff: 'Expert', theme: 'grass', trees: 8,
    hole: [500, 340, 44],
    paths: [
      { mode: 'spline', pts: [[-40, 90], [260, 90], [300, 200], [180, 300], [300, 380], [440, 340], [500, 340]] },
      { mode: 'spline', pts: [[1040, 590], [740, 590], [700, 480], [820, 380], [700, 300], [560, 340], [500, 340]] },
      { mode: 'spline', pts: [[700, -40], [700, 80], [840, 160], [740, 230], [580, 260], [500, 335]] },
      { mode: 'spline', pts: [[300, 720], [300, 600], [160, 520], [260, 450], [420, 420], [500, 345]] },
    ],
  },
  {
    id: 'infernal', name: 'Infernal', diff: 'Expert', theme: 'lava', trees: 6,
    lava: [{ x: 380, y: 420, r: 72 }, { x: 650, y: 300, r: 62 }, { x: 110, y: 140, r: 64 }, { x: 890, y: 150, r: 72 }, { x: 120, y: 570, r: 62 }, { x: 900, y: 590, r: 56 }],
    paths: [{ mode: 'round', r: 34, pts: [[-40, 340], [240, 340], [240, 170], [520, 170], [520, 510], [780, 510], [780, 340], [1040, 340]] }],
  },
];

BTD.MODES = {
  Easy:   [
    { id: 'standard', name: 'Standard', desc: 'Rounds 1-40', start: 1, end: 40 },
    { id: 'primary', name: 'Primary Only', desc: 'Only Primary monkeys', start: 1, end: 40, only: 'primary' },
    { id: 'deflation', name: 'Deflation', desc: '$20,000, no income, rounds 31-60', start: 31, end: 60, cash: 20000, noIncome: true },
  ],
  Medium: [
    { id: 'standard', name: 'Standard', desc: 'Rounds 1-60', start: 1, end: 60 },
    { id: 'military', name: 'Military Only', desc: 'Only Military monkeys', start: 1, end: 60, only: 'military' },
    { id: 'apopalypse', name: 'Apopalypse', desc: 'Rounds never stop', start: 1, end: 60, apop: true },
    { id: 'reverse', name: 'Reverse', desc: 'Bloons go the other way', start: 1, end: 60, reverse: true },
  ],
  Hard:   [
    { id: 'standard', name: 'Standard', desc: 'Rounds 3-80', start: 3, end: 80 },
    { id: 'magic', name: 'Magic Only', desc: 'Only Magic monkeys', start: 3, end: 80, only: 'magic' },
    { id: 'doublehp', name: 'Double HP MOABs', desc: 'Blimps have twice the health', start: 3, end: 80, moabHp: 2 },
    { id: 'halfcash', name: 'Half Cash', desc: 'Half the money from everything', start: 3, end: 80, cashMult: 0.5 },
    { id: 'impoppable', name: 'Impoppable', desc: '1 life, +20% prices, rounds 6-100', start: 6, end: 100, lives: 1, cost: 1.2 },
    { id: 'chimps', name: 'C.H.I.M.P.S.', desc: 'No selling, no farms or round cash, 1 life', start: 6, end: 100, lives: 1, cost: 1.2, chimps: true },
  ],
};

BTD.DIFF = {
  Easy:   { lives: 200, cost: 0.85, cash: 650 },
  Medium: { lives: 150, cost: 1,    cash: 650 },
  Hard:   { lives: 100, cost: 1.08, cash: 650 },
};
