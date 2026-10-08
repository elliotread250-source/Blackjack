'use strict';
// Space Invaders Extreme-style remake: neon 2D, beat-synced marching, colour
// chains that grant powers, UFO Rounds into Fever Time, roulette, special
// invaders, five stages that end in bosses, branching B routes, three
// difficulties and same-screen two-player co-op.
(function () {
  const W = 600, H = 800, STEP = 1 / 60;
  const PY = H - 92;                    // cannon row
  const A = SIE.audio;
  const B = SI.BMP;
  const COL = { red: '#ff3d68', blue: '#3fa9ff', green: '#3dff8f', black: '#b07cff' };
  const CORE = { red: '#ffd0da', blue: '#d6ecff', green: '#d4ffe6', black: '#1a1030' };
  const COLORS = ['red', 'blue', 'green', 'black'];
  const POWER = { red: 'bomb', blue: 'laser', green: 'spread', black: 'shield' };
  const POWER_NAME = { bomb: 'BOMB', laser: 'LASER', spread: 'SPREAD', shield: 'SHIELD', fever: 'FEVER' };
  const BASE = { octopus: 100, crab: 200, squid: 300, mini: 150 };
  const SHIP = ['......###......', '.....#####.....', '....##.#.##....', '..###########..', '.#############.', '###############', '##.###...###.##', '#...##...##...#'];

  const DIFF = {
    easy: { lives: 5, fire: 0.6, speed: 0.85, bullet: 0.85 },
    normal: { lives: 3, fire: 1, speed: 1, bullet: 1 },
    hard: { lives: 3, fire: 1.5, speed: 1.15, bullet: 1.2 },
  };

  // ---------- stages ----------
  // waves: grid formations or snaking lines; specials sprinkled per wave
  const STAGES = [
    { name: 'NEON GATE', hue: 200, song: 's1', boss: 'crab', waves: [
      { type: 'grid', rows: 4, cols: 8, pattern: 'columns' },
      { type: 'grid', rows: 5, cols: 10, pattern: 'rows', sp: { bomb: 4 } },
      { type: 'snake', count: 18, pattern: 'blocks', sp: { bomb: 2 } },
    ] },
    { name: 'PRISM FIELD', hue: 280, song: 's2', boss: 'twins', waves: [
      { type: 'grid', rows: 5, cols: 10, pattern: 'checker', sp: { armor: 6 } },
      { type: 'snake', count: 22, pattern: 'columns', sp: { split: 4 } },
      { type: 'grid', rows: 5, cols: 11, pattern: 'blocks', sp: { diver: 5, bomb: 3 } },
    ] },
    { name: 'ION STORM', hue: 160, song: 's3', boss: 'mother', waves: [
      { type: 'grid', rows: 5, cols: 11, pattern: 'rows', sp: { reflect: 4, armor: 4 } },
      { type: 'snake', count: 26, pattern: 'random', sp: { diver: 4, split: 3 }, speed: 1.2 },
      { type: 'grid', rows: 5, cols: 11, pattern: 'blocks', sp: { bomb: 5, armor: 6, split: 3 } },
    ] },
    { name: 'RED SHIFT', hue: 340, song: 's4', boss: 'mirror', waves: [
      { type: 'grid', rows: 5, cols: 11, pattern: 'checker', sp: { diver: 8, split: 4 } },
      { type: 'snake', count: 30, pattern: 'columns', sp: { reflect: 3, bomb: 3 }, speed: 1.25 },
      { type: 'grid', rows: 5, cols: 11, pattern: 'random', sp: { armor: 8, reflect: 4, diver: 4 } },
    ] },
    { name: 'THE CORE', hue: 40, song: 's5', boss: 'king', waves: [
      { type: 'grid', rows: 5, cols: 11, pattern: 'blocks', sp: { armor: 6, bomb: 4, split: 4 } },
      { type: 'snake', count: 34, pattern: 'random', sp: { diver: 6, reflect: 3 }, speed: 1.35 },
      { type: 'grid', rows: 5, cols: 11, pattern: 'checker', sp: { armor: 8, diver: 6, reflect: 4, split: 4, bomb: 3 } },
    ] },
  ];

  // ---------- canvas ----------
  const cv = document.getElementById('screen');
  const ctx = cv.getContext('2d');
  const view = { s: 1, dpr: 1, ox: 0, oy: 0 };
  function fit() {
    const vw = innerWidth, vh = innerHeight, dpr = Math.min(2.5, devicePixelRatio || 1);
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
    view.s = Math.min(vw / W, vh / H); view.dpr = dpr;
    view.ox = (vw - W * view.s) / 2; view.oy = (vh - H * view.s) / 2;
  }
  addEventListener('resize', fit); fit();

  const store = {
    get(k, d) { try { const v = localStorage.getItem('sie:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('sie:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  const opts = Object.assign({ diff: 'normal', sound: true }, store.get('opts', {}));
  A.setEnabled(opts.sound);
  const hiScores = store.get('hi', {});
  const hiFor = () => hiScores[opts.diff] || 0;

  // ---------- glowing sprites ----------
  const cache = new Map();
  function glow(rows, color, scale, core) {
    const key = rows.join('') + color + scale + core;
    let c = cache.get(key);
    if (c) return c;
    const pad = Math.ceil(scale * 3);
    c = document.createElement('canvas');
    c.width = rows[0].length * scale + pad * 2; c.height = rows.length * scale + pad * 2;
    const g = c.getContext('2d');
    g.shadowColor = color; g.shadowBlur = scale * 3;
    g.fillStyle = color;
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') g.fillRect(pad + i * scale, pad + j * scale, scale, scale); }));
    g.shadowBlur = 0;
    g.fillStyle = core || '#ffffff';
    g.globalAlpha = 0.45;
    const inset = Math.max(1, Math.floor(scale / 3));
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') g.fillRect(pad + i * scale + inset, pad + j * scale + inset, scale - inset * 2, scale - inset * 2); }));
    c.pad = pad;
    cache.set(key, c);
    return c;
  }
  function blit(spr, x, y, alpha) {
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.drawImage(spr, Math.round(x - spr.width / 2), Math.round(y - spr.height / 2));
    if (alpha != null) ctx.globalAlpha = 1;
  }
  const SHAPES = { squid: B.squid, crab: B.crab, octopus: B.octopus };

  // ---------- state ----------
  let mode = 'title';           // title | intro | play | warning | boss | clear | over | allclear
  let modeT = 0, menuSel = 0, paused = false, numPlayers = 1;
  let stageIdx = 0, route = 'A', waveIdx = 0, score = 0, kills = 0, maxCombo = 0;
  let players = [];
  let invaders = [], form = null, pBullets = [], eBullets = [], ufos = [], parts = [], pops = [], beams = [], rings = [];
  let boss = null, round = null;
  let feverT = 0, freezeT = 0, ufoTimeT = 0, doubleT = 0, ufoTimer = 14, waveBreak = 0;
  let combo = 0, comboT = 0, chain = { color: null, n: 0 }, sets = [];
  const stars = [];
  let banner = null;          // big centre text
  let lastBeat = 0, beatHit = 0;
  for (let i = 0; i < 140; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 0.9 + 0.1 });

  const D = () => DIFF[opts.diff];
  const stage = () => STAGES[Math.min(stageIdx, STAGES.length - 1)];
  const hard = () => (route === 'B' ? 1.25 : 1);

  function newPlayer(i) {
    return { i, x: numPlayers === 2 ? (i === 0 ? W * 0.35 : W * 0.65) : W / 2, lives: D().lives, level: 1, power: null, shield: 0, ghostT: 0, invT: 2, cd: 0, deadT: 0, out: false,
      color: i === 0 ? '#3ff2ff' : '#ff5cf0', fire: false, dir: 0, touchX: null, touchFire: false };
  }
  function startGame(n) {
    A.init();
    numPlayers = n;
    players = [];
    for (let i = 0; i < n; i++) players.push(newPlayer(i));
    score = 0; kills = 0; maxCombo = 0; combo = 0;
    stageIdx = 0; route = 'A';
    startStage();
  }
  function startStage() {
    waveIdx = 0; waveBreak = 0;
    invaders = []; pBullets = []; eBullets = []; ufos = []; beams = []; boss = null; round = null; form = null;
    feverT = freezeT = ufoTimeT = doubleT = 0; ufoTimer = 12;
    chain = { color: null, n: 0 }; sets = [];
    mode = 'intro'; modeT = 0;
    A.start(stage().song); A.setIntensity(0);
    banner = { t: 0, life: 2.6, big: `STAGE ${stageIdx + 1}-${route}`, small: stage().name };
  }

  // ---------- waves ----------
  function colorFor(pattern, r, c) {
    switch (pattern) {
      case 'columns': return COLORS[Math.floor(c / 2) % 4];
      case 'rows': return COLORS[r % 4];
      case 'checker': return COLORS[(Math.floor(r / 2) * 2 + Math.floor(c / 3)) % 4];
      case 'blocks': return COLORS[(Math.floor(r / 3) * 3 + Math.floor(c / 4)) % 4];
      default: return COLORS[Math.floor(Math.random() * 4)];
    }
  }
  function makeInvader(kind, color, x, y) {
    return { kind, color, x, y, hp: 1, maxHp: 1, sp: null, frame: 0, alive: true, state: 'form', vx: 0, vy: 0, flash: 0, shieldT: Math.random() * 3, shieldOn: false, col: 0, row: 0, t: 0 };
  }
  function sprinkle(list, sp) {
    if (!sp) return;
    const pool = list.slice();
    for (const k in sp) {
      for (let n = 0; n < Math.round(sp[k] * hard()) && pool.length; n++) {
        const a = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        a.sp = k;
        if (k === 'armor') { a.hp = a.maxHp = 3; }
      }
    }
  }
  function spawnWave() {
    const wv = stage().waves[waveIdx];
    invaders = invaders.filter((a) => a.alive);
    if (wv.type === 'grid') {
      const kinds = ['squid', 'crab', 'crab', 'octopus', 'octopus'];
      const sx = 46, sy = 42;
      const list = [];
      for (let r = 0; r < wv.rows; r++) for (let c = 0; c < wv.cols; c++) {
        const a = makeInvader(kinds[Math.min(4, Math.round(r * 4 / Math.max(1, wv.rows - 1)))], colorFor(wv.pattern, r, c), 0, 0);
        a.col = c; a.row = r; list.push(a);
      }
      sprinkle(list, wv.sp);
      form = { ox: (W - (wv.cols - 1) * sx) / 2, oy: -wv.rows * sy, targetY: 120, dir: 1, sx, sy, lastStep: A.beat(), entering: true };
      for (const a of list) { a.x = form.ox + a.col * sx; a.y = form.oy + a.row * sy; }
      invaders.push(...list);
    } else {
      const list = [];
      for (let i = 0; i < wv.count; i++) {
        const a = makeInvader(['squid', 'crab', 'octopus'][i % 3], colorFor(wv.pattern, Math.floor(i / 6), (i % 6) * 2), -40, -40);
        a.state = 'snake'; a.t = -i * 0.32; a.speed = (wv.speed || 1) * 125;
        list.push(a);
      }
      sprinkle(list, wv.sp);
      form = null;
      invaders.push(...list);
    }
  }
  function snakePos(a) {
    const run = W - 110, s = Math.max(0, a.t) * a.speed;
    const row = Math.floor(s / run), u = s % run;
    const x = 55 + (row % 2 === 0 ? u : run - u);
    const y = 110 + row * 52 + Math.sin((u / run) * Math.PI) * 6;
    return { x, y };
  }

  // ---------- players ----------
  function alivePlayers() { return players.filter((p) => !p.out && p.deadT <= 0); }
  function firePlayer(p) {
    const lv = p.level;
    const pw = feverT > 0 ? 'fever' : p.power && p.power.t > 0 ? p.power.type : null;
    const size = 3 + lv * 0.45;
    const sp = 780 + lv * 35;
    const add = (o) => pBullets.push(Object.assign({ x: p.x, y: PY - 20, vx: 0, vy: -sp, r: size, dmg: lv >= 7 ? 2 : 1, owner: p, type: 'normal', hit: null }, o));
    if (pw === 'fever') {
      add({ type: 'laser', vy: -1500, r: 7, dmg: 2, hit: new Set() });
      for (const a of [-0.25, 0.25]) add({ vx: Math.sin(a) * sp, vy: -Math.cos(a) * sp, r: size + 1, dmg: 2 });
      p.cd = 0.07; A.fx.laser(); return;
    }
    if (pw === 'laser') { add({ type: 'laser', vy: -1400, r: 5 + lv * 0.3, hit: new Set() }); p.cd = 0.24 - lv * 0.008; A.fx.laser(); return; }
    if (pw === 'bomb') { add({ type: 'bomb', vy: -560, r: 8 + lv * 0.4 }); p.cd = 0.42; A.fx.shot(); return; }
    if (pw === 'spread') {
      const angs = lv >= 6 ? [-0.32, -0.16, 0, 0.16, 0.32] : [-0.2, 0, 0.2];
      for (const a of angs) add({ vx: Math.sin(a) * sp, vy: -Math.cos(a) * sp });
      p.cd = 0.3 - lv * 0.01; A.fx.shot(); return;
    }
    add({});
    p.cd = Math.max(0.12, 0.3 - lv * 0.017);
    A.fx.shot();
  }
  function hurtPlayer(p) {
    if (p.out || p.deadT > 0 || p.invT > 0 || p.ghostT > 0) return;
    if (p.power && p.power.type === 'shield' && p.shield > 0) {
      p.shield--; burst(p.x, PY, COL.black, 14, 260); A.fx.clink();
      if (p.shield <= 0) p.power = null;
      return;
    }
    burst(p.x, PY, p.color, 40, 420); burst(p.x, PY, '#ffffff', 20, 300);
    A.fx.hit();
    p.lives--; p.level = Math.max(1, p.level - 2); p.power = null; p.shield = 0;
    combo = 0;
    if (p.lives <= 0) { p.out = true; p.deadT = 0; }
    else p.deadT = 1.6;
    if (players.every((q) => q.out)) { mode = 'over'; modeT = 0; saveHi(); A.setIntensity(0); round = null; }
  }
  function saveHi() { if (score > hiFor()) { hiScores[opts.diff] = score; store.set('hi', hiScores); } }

  // ---------- scoring, chains, powers ----------
  function addScore(n, x, y, color) {
    const mult = (feverT > 0 ? 2 : 1) * (doubleT > 0 ? 2 : 1);
    const v = Math.round(n * mult);
    score += v;
    if (x != null) pops.push({ x, y, text: String(v), t: 0, color: color || '#fff' });
    return v;
  }
  function onKill(a, p) {
    kills++;
    comboT = 1.1; combo++; maxCombo = Math.max(maxCombo, combo);
    const cm = 1 + Math.min(4, Math.floor(combo / 5) * 0.5);
    const base = ufoTimeT > 0 && a.state === 'form' ? 1000 : (a.kind === 'mini' ? BASE.mini : BASE[a.kind]) + (a.sp ? 100 : 0);
    addScore(base * cm, a.x, a.y - 10, COL[a.color]);
    if (round && round.type === 'color' && a.round && a.color === round.color) round.got++;
    // colour chain: four of a kind grants that colour's power
    if (ufoTimeT > 0 || feverT > 0) return;
    if (chain.color === a.color) chain.n++; else { chain.color = a.color; chain.n = 1; }
    A.fx.chain(chain.n);
    if (chain.n >= 4) {
      grantPower(p || alivePlayers()[0] || players[0], a.color);
      sets.push(a.color);
      chain = { color: null, n: 0 };
      checkSets();
    }
  }
  function grantPower(p, color) {
    if (!p) return;
    const type = POWER[color];
    p.power = { type, t: type === 'shield' ? 12 : 9, max: type === 'shield' ? 12 : 9 };
    if (type === 'shield') p.shield = 3;
    pops.push({ x: p.x, y: PY - 50, text: POWER_NAME[type] + '!', t: 0, color: COL[color], big: true });
    A.fx.power();
  }
  // two sets in a row call in a special UFO; black-led pairs are the special combos
  function checkSets() {
    if (sets.length < 2) return;
    const [a, b] = sets.slice(-2);
    sets = [];
    if (a === 'black' && b === 'green') spawnUfo('roulette');
    else if (a === 'black' && b === 'red') { ufoTimeT = 6; banner = { t: 0, life: 1.4, big: 'UFO TIME!', small: '1000 PTS EACH' }; A.fx.fanfare(); }
    else if (a === 'black' && b === 'blue') { freezeT = 6; banner = { t: 0, life: 1.4, big: 'FREEZE!', small: '' }; A.fx.fanfare(); }
    else if (a !== b) spawnUfo('round');
    else spawnUfo('normal');
  }

  // ---------- UFOs, rounds, roulette ----------
  const ROULETTE = ['1UP', 'GHOST', 'x2 SCORE', 'FREEZE', 'UFO TIME', '+5000'];
  function spawnUfo(type) {
    if (ufos.some((u) => u.type === type)) return;
    if (type === 'round' && (round || boss)) type = 'normal';
    const dir = Math.random() < 0.5 ? 1 : -1;
    ufos.push({ type, x: dir > 0 ? -40 : W + 40, y: type === 'normal' ? 96 : 110, vx: dir * (type === 'normal' ? 120 : 100), t: 0, hp: type === 'target' ? 6 : 1, ri: 0 });
    A.fx.ufo();
  }
  function hitUfo(u) {
    u.hp--;
    if (u.hp > 0) { burst(u.x, u.y, '#ffffff', 6, 160); A.fx.clink(); return; }
    ufos.splice(ufos.indexOf(u), 1);
    burst(u.x, u.y, '#ff4040', 30, 360); burst(u.x, u.y, '#ffe060', 20, 260);
    A.fx.pop(true);
    if (u.type === 'normal') addScore([500, 800, 1000, 1500, 3000][Math.floor(Math.random() * 5)], u.x, u.y, '#ff6060');
    else if (u.type === 'round') startRound();
    else if (u.type === 'target') { if (round) round.done = true; }
    else if (u.type === 'roulette') {
      const r = ROULETTE[u.ri];
      if (r === '1UP') for (const q of players) if (!q.out) q.lives++;
      if (r === 'GHOST') for (const q of players) q.ghostT = 10;
      if (r === 'x2 SCORE') doubleT = 15;
      if (r === 'FREEZE') freezeT = 6;
      if (r === 'UFO TIME') ufoTimeT = 6;
      if (r === '+5000') addScore(5000, u.x, u.y + 20, '#ffe060');
      banner = { t: 0, life: 1.6, big: r + '!', small: 'ROULETTE' };
      A.fx.fanfare();
    }
  }
  const totalLives = () => players.reduce((s, p) => s + p.lives, 0);
  function startRound() {
    if (round || boss) return;
    const types = ['clear', 'color', 'target', 'survive'];
    const type = types[Math.floor(Math.random() * types.length)];
    round = { type, t: 0, limit: type === 'survive' ? 12 : 18, got: 0, need: 8, color: COLORS[Math.floor(Math.random() * 3)], done: false, failed: false, hitBefore: totalLives() };
    const text = { clear: 'DESTROY ALL', color: `DESTROY 8 ${round.color.toUpperCase()}`, target: 'HIT THE TARGET UFO', survive: 'SURVIVE!' }[type];
    banner = { t: 0, life: 2, big: 'ROUND', small: text };
    A.setIntensity(1); A.fx.fanfare();
    if (type === 'clear' || type === 'color') {
      const n = type === 'clear' ? 14 : 18;
      for (let i = 0; i < n; i++) {
        const c = type === 'clear' ? COLORS[i % 4] : (i % 2 === 0 ? round.color : COLORS[(COLORS.indexOf(round.color) + 1 + (i % 3)) % 4]);
        const a = makeInvader(['squid', 'crab', 'octopus'][i % 3], c, W / 2, -30);
        a.state = 'orbit'; a.round = true; a.t = (i / n) * Math.PI * 2; a.r0 = 120 + (i % 2) * 60;
        invaders.push(a);
      }
    }
    if (type === 'target') spawnUfo('target');
  }
  function endRound(win) {
    for (const a of invaders) if (a.round) a.alive = false;
    ufos = ufos.filter((u) => u.type !== 'target');
    round = null;
    if (win) { feverT = 12; banner = { t: 0, life: 1.8, big: 'FEVER!!', small: 'DOUBLE SCORE' }; A.start('fever'); A.setIntensity(2); A.fx.fanfare(); }
    else { banner = { t: 0, life: 1.4, big: 'FAILED', small: '' }; A.setIntensity(boss ? 1 : 0); }
  }

  // ---------- effects ----------
  function burst(x, y, color, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = Math.random() * sp;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.4 + Math.random() * 0.5, t: 0, color, size: 2 + Math.random() * 3 });
    }
    if (parts.length > 900) parts.splice(0, parts.length - 900);
  }

  // ---------- damage ----------
  function damageInvader(a, dmg, p, bullet) {
    if (!a.alive) return false;
    if (a.sp === 'reflect' && a.shieldOn && bullet && bullet.type !== 'laser' && bullet.type !== 'bomb' && feverT <= 0) {
      // shielded invaders bounce your shot straight back
      eBullets.push({ x: bullet.x, y: a.y + 20, vx: -bullet.vx * 0.5, vy: Math.abs(bullet.vy) * 0.45, r: 5, color: '#ffffff', reflected: true });
      A.fx.clink();
      return true;
    }
    if (a.sp === 'diver' && a.state !== 'dive') {
      // divers break for the ground when hit: shoot them again before they land
      a.state = 'dive'; a.hp = 1; a.flash = 0.1; a.vy = 60;
      const ap = alivePlayers();
      const tgt = ap[Math.floor(Math.random() * Math.max(1, ap.length))];
      a.tx = tgt ? tgt.x : W / 2;
      A.fx.clink();
      return true;
    }
    a.hp -= dmg; a.flash = 0.08;
    if (a.hp > 0) { A.fx.clink(); burst(a.x, a.y, '#ffffff', 4, 120); return true; }
    a.alive = false;
    burst(a.x, a.y, COL[a.color], 16, 260); burst(a.x, a.y, '#ffffff', 6, 180);
    A.fx.pop(false);
    onKill(a, p);
    if (a.sp === 'split' && a.kind !== 'mini') {
      for (const s of [-1, 1]) { const m = makeInvader('mini', a.color, a.x + s * 10, a.y); m.state = 'free'; m.vx = s * 110; m.vy = 45; m.round = a.round; invaders.push(m); }
    }
    if (a.sp === 'bomb') explode(a.x, a.y, 95, 3, p);
    return true;
  }
  function explode(x, y, r, dmg, p) {
    burst(x, y, '#ffb040', 40, 420); burst(x, y, '#ffffff', 20, 300);
    rings.push({ x, y, r, t: 0 });
    A.fx.pop(true);
    for (const a of invaders) {
      if (!a.alive || Math.hypot(a.x - x, a.y - y) >= r) continue;
      if (a.sp === 'reflect') a.shieldOn = false;
      const wasDiver = a.sp === 'diver' && a.state !== 'dive';
      damageInvader(a, dmg, p, null);
      if (wasDiver && a.alive) damageInvader(a, dmg, p, null);
    }
    if (boss) bossDamageArea(x, y, r, dmg);
    for (const u of ufos.slice()) if (Math.hypot(u.x - x, u.y - y) < r) hitUfo(u);
  }

  // ---------- bosses ----------
  function makeBoss(kind) {
    const b = { kind, x: W / 2, y: -160, ty: 190, t: 0, hp: 0, maxHp: 0, parts: [], fireT: 2, spawnT: 6, phase: 0, orbs: [] };
    const hpMul = (route === 'B' ? 1.3 : 1) * (numPlayers === 2 ? 1.5 : 1);
    if (kind === 'crab') {
      b.shape = 'crab'; b.scale = 11; b.color = COL.red; b.name = 'GIANT CRAB';
      b.parts = [{ dx: -20, dy: -6, rw: 20, rh: 18, hp: 40 * hpMul }, { dx: 20, dy: -6, rw: 20, rh: 18, hp: 40 * hpMul }];
    } else if (kind === 'twins') {
      b.shape = 'squid'; b.scale = 8; b.color = COL.blue; b.name = 'TWIN SQUIDS';
      b.parts = [{ orbit: 0, hp: 42 * hpMul, rw: 22, rh: 22 }, { orbit: Math.PI, hp: 42 * hpMul, rw: 22, rh: 22 }];
    } else if (kind === 'mother') {
      b.shape = 'ufo'; b.scale = 11; b.color = '#ff5050'; b.name = 'MOTHERSHIP';
      b.parts = [{ dx: -60, dy: 26, rw: 12, rh: 12, hp: 15 * hpMul, turret: 1 }, { dx: 0, dy: 30, rw: 12, rh: 12, hp: 15 * hpMul, turret: 1 }, { dx: 60, dy: 26, rw: 12, rh: 12, hp: 15 * hpMul, turret: 1 }, { dx: 0, dy: -6, rw: 26, rh: 16, hp: 48 * hpMul, core: 1 }];
    } else if (kind === 'mirror') {
      b.shape = 'octopus'; b.scale = 9; b.color = COL.black; b.name = 'MIRROR LORD';
      b.parts = [{ dx: 0, dy: 0, rw: 22, rh: 16, hp: 70 * hpMul }];
      for (let i = 0; i < 8; i++) b.orbs.push({ a: (i / 8) * Math.PI * 2 });
    } else {
      b.shape = 'octopus'; b.scale = 13; b.color = '#ffd040'; b.name = 'INVADER KING';
      b.parts = [{ dx: 0, dy: 4, rw: 26, rh: 18, hp: 120 * hpMul }, { dx: -40, dy: -14, rw: 12, rh: 10, hp: 45 * hpMul }, { dx: 40, dy: -14, rw: 12, rh: 10, hp: 45 * hpMul }];
    }
    for (const p of b.parts) { p.max = p.hp; p.flash = 0; }
    b.maxHp = b.parts.reduce((s, p) => s + p.hp, 0); b.hp = b.maxHp;
    return b;
  }
  function partPos(b, p) {
    if (p.orbit != null) return { x: b.x + Math.cos(b.t * 0.9 + p.orbit) * 130, y: b.y + Math.sin(b.t * 0.9 + p.orbit) * 50 };
    return { x: b.x + p.dx, y: b.y + p.dy };
  }
  const coreLocked = (b, p) => p.core && b.parts.some((o) => o.turret && o.hp > 0);
  function bossHit(bullet) {
    const b = boss;
    const rows = b.shape === 'ufo' ? B.ufo : SHAPES[b.shape][0];
    const hw = rows[0].length * b.scale / 2, hh = rows.length * b.scale / 2;
    const inBody = Math.abs(bullet.x - b.x) < hw && Math.abs(bullet.y - b.y) < hh;
    for (const p of b.parts) {
      if (p.hp <= 0) continue;
      const q = partPos(b, p);
      // shots come from below, so a weak point owns its whole column of the body
      const inCol = Math.abs(bullet.x - q.x) < p.rw + bullet.r;
      if (inCol && (Math.abs(bullet.y - q.y) < p.rh + bullet.r || (p.orbit == null && inBody))) {
        // the mothership's core only opens once its turrets are gone
        if (coreLocked(b, p)) { A.fx.clink(); burst(bullet.x, bullet.y, '#ffffff', 4, 100); return true; }
        damagePart(b, p, bullet.dmg);
        return true;
      }
    }
    if (b.kind === 'twins') return false;
    // the rest of the body is armour: shots spark off it
    if (inBody) { A.fx.clink(); burst(bullet.x, bullet.y, '#ffffff', 3, 90); return true; }
    return false;
  }
  function damagePart(b, p, dmg) {
    p.hp -= dmg; p.flash = 0.06;
    b.hp = b.parts.reduce((s, q) => s + Math.max(0, q.hp), 0);
    score += 10;
    if (p.hp <= 0) { const q = partPos(b, p); burst(q.x, q.y, b.color, 30, 340); A.fx.pop(true); addScore(2000, q.x, q.y, '#ffe060'); }
    if (b.hp <= 0) killBoss();
  }
  function bossDamageArea(x, y, r, dmg) {
    for (const p of boss.parts) {
      if (p.hp <= 0 || coreLocked(boss, p)) continue;
      const q = partPos(boss, p);
      if (Math.hypot(q.x - x, q.y - y) < r + p.rw) damagePart(boss, p, dmg);
      if (!boss) return;
    }
  }
  function killBoss() {
    const b = boss;
    for (let i = 0; i < 6; i++) setTimeout(() => { burst(b.x + (Math.random() - 0.5) * 180, b.y + (Math.random() - 0.5) * 90, i % 2 ? b.color : '#ffffff', 40, 420); A.fx.pop(true); }, i * 140);
    addScore(30000 * (route === 'B' ? 1.5 : 1), b.x, b.y, '#ffe060');
    boss = null; eBullets = []; beams = []; round = null;
    for (const a of invaders) a.alive = false;
    for (const p of players) if (!p.out) p.level = Math.min(10, p.level + 1);
    mode = 'clear'; modeT = 0; A.setIntensity(0); A.fx.fanfare();
  }
  function enemyShot(x, y, vx, vy, color, r) { eBullets.push({ x, y, vx: vx * D().bullet, vy: vy * D().bullet, r: r || 5, color: color || '#ff60a0' }); }
  function aimAt(x, y, speed) {
    const ap = alivePlayers();
    const t = ap[Math.floor(Math.random() * Math.max(1, ap.length))] || { x: W / 2 };
    const dx = t.x - x, dy = PY - y, d = Math.hypot(dx, dy) || 1;
    return [dx / d * speed, dy / d * speed];
  }
  function updateBoss(dt) {
    const b = boss;
    b.t += dt;
    for (const p of b.parts) if (p.flash > 0) p.flash -= dt;
    if (b.y < b.ty) { b.y += 90 * dt; return; }
    if (freezeT > 0) return;
    const rate = D().fire * (route === 'B' ? 1.25 : 1);
    const life = b.hp / b.maxHp;
    b.x = W / 2 + Math.sin(b.t * (b.kind === 'king' ? 0.6 : 0.75)) * (b.kind === 'mother' ? 170 : 150);
    b.fireT -= dt * rate;
    b.spawnT -= dt;
    if (b.kind === 'crab') {
      if (b.fireT <= 0) { b.fireT = 1.3; for (let i = -2; i <= 2; i++) enemyShot(b.x + i * 12, b.y + 40, i * 55, 230, COL.red); }
      if (b.spawnT <= 0) { b.spawnT = 7; for (const s of [-1, 1]) { const m = makeInvader('mini', COLORS[Math.floor(Math.random() * 4)], b.x + s * 70, b.y + 20); m.state = 'free'; m.vx = s * 120; m.vy = 50; invaders.push(m); } }
    } else if (b.kind === 'twins') {
      if (b.fireT <= 0) {
        b.fireT = 0.7;
        for (const p of b.parts) if (p.hp > 0) { const q = partPos(b, p); const [vx, vy] = aimAt(q.x, q.y, 260); enemyShot(q.x, q.y + 20, vx, vy, COL.blue); }
      }
      if (b.spawnT <= 0) { b.spawnT = 8; for (let i = 0; i < 4; i++) { const m = makeInvader('mini', COLORS[i], 100 + i * 130, 120); m.state = 'free'; m.vx = (i % 2 ? 1 : -1) * 90; m.vy = 40; invaders.push(m); } }
    } else if (b.kind === 'mother') {
      if (b.fireT <= 0) {
        b.fireT = 1.0;
        const turrets = b.parts.filter((p) => p.turret && p.hp > 0);
        if (turrets.length) for (const p of turrets) { const q = partPos(b, p); const [vx, vy] = aimAt(q.x, q.y, 250); enemyShot(q.x, q.y + 10, vx, vy, '#ff7050'); }
        else for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI + b.t; enemyShot(b.x, b.y + 20, Math.cos(a) * 200, Math.abs(Math.sin(a)) * 200 + 60, '#ff7050'); }
      }
      if (b.spawnT <= 0) { b.spawnT = 8; for (let i = 0; i < 6; i++) { const m = makeInvader('crab', COLORS[i % 4], 80 + i * 88, b.y + 70); m.state = 'free'; m.vx = (i % 2 ? 1 : -1) * 60; m.vy = 22; invaders.push(m); } }
    } else if (b.kind === 'mirror') {
      for (const o of b.orbs) o.a += dt * 1.2;
      if (b.fireT <= 0) { b.fireT = 1.5; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + b.t; enemyShot(b.x, b.y, Math.cos(a) * 170, Math.sin(a) * 170 + 70, COL.black); } }
      if (b.spawnT <= 0) { b.spawnT = 9; for (let i = 0; i < 4; i++) { const m = makeInvader('mini', COLORS[i], 120 + i * 120, 130); m.state = 'free'; m.vx = (i % 2 ? 1 : -1) * 80; m.vy = 35; invaders.push(m); } }
    } else if (b.kind === 'king') {
      b.phase = life > 0.66 ? 0 : life > 0.33 ? 1 : 2;
      if (b.fireT <= 0) {
        b.fireT = [1.2, 1.0, 0.75][b.phase];
        const n = [5, 7, 9][b.phase];
        for (let i = 0; i < n; i++) { const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.22; enemyShot(b.x, b.y + 50, Math.cos(a) * 240, Math.sin(a) * 240, '#ffd040'); }
      }
      if (b.spawnT <= 0) {
        b.spawnT = [6, 5.5, 3.5][b.phase];
        const p = alivePlayers()[0];
        if (b.phase >= 1) beams.push({ x: p ? p.x : W / 2, t: 0, warn: 1.0, on: 0.6, w: 16 });
        for (let i = 0; i < 2 + b.phase; i++) { const m = makeInvader('squid', COLORS[Math.floor(Math.random() * 4)], b.x + (i - 1) * 80, b.y + 60); if (b.phase === 2 && i === 0) { m.state = 'dive'; m.sp = 'diver'; m.vy = 80; m.tx = p ? p.x : W / 2; } else { m.state = 'free'; m.vx = (i % 2 ? 1 : -1) * 90; m.vy = 40; } invaders.push(m); }
      }
    }
  }

  // ---------- update ----------
  function update(dt) {
    modeT += dt;
    if (banner) { banner.t += dt; if (banner.t > banner.life) banner = null; }
    const beat = A.beat();
    if (Math.floor(beat) !== Math.floor(lastBeat)) beatHit = 1;
    beatHit = Math.max(0, beatHit - dt * 4);
    lastBeat = beat;
    for (const s of stars) { s.y += (20 + s.z * 90) * dt * (feverT > 0 ? 3 : 1); if (s.y > H) { s.y = -2; s.x = Math.random() * W; } }
    for (const p of parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; }
    parts = parts.filter((p) => p.t < p.life);
    for (const p of pops) p.t += dt;
    pops = pops.filter((p) => p.t < 1.1);
    for (const r of rings) r.t += dt;
    rings = rings.filter((r) => r.t < 0.35);
    if (mode === 'title' || paused || mode === 'over' || mode === 'allclear') return;
    if (mode === 'clear') {
      updatePlayers(dt); updateBullets(dt);
      if (modeT > 4) {
        stageIdx++;
        if (stageIdx >= STAGES.length) { stageIdx = STAGES.length - 1; mode = 'allclear'; modeT = 0; saveHi(); A.start('fever'); A.setIntensity(2); return; }
        // the B route is for players who are scoring well
        route = score >= stageIdx * 60000 * (opts.diff === 'easy' ? 0.7 : 1) ? 'B' : 'A';
        startStage();
      }
      return;
    }
    if (mode === 'intro') {
      updatePlayers(dt);
      if (modeT > 2.4) { mode = 'play'; modeT = 0; spawnWave(); }
      return;
    }
    if (mode === 'warning') {
      updatePlayers(dt); updateBullets(dt);
      if (modeT > 2.8) { mode = 'boss'; boss = makeBoss(stage().boss); A.start('boss'); A.setIntensity(1); }
      return;
    }
    // timers
    if (feverT > 0) { feverT -= dt; if (feverT <= 0) { A.start(boss ? 'boss' : stage().song); A.setIntensity(boss ? 1 : 0); } }
    if (freezeT > 0) freezeT -= dt;
    if (ufoTimeT > 0) ufoTimeT -= dt;
    if (doubleT > 0) doubleT -= dt;
    if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }

    updatePlayers(dt);
    updateInvaders(dt, beat);
    if (boss) updateBoss(dt);
    updateUfos(dt);
    updateRound(dt);
    updateBullets(dt);
    updateBeams(dt);
    if (mode !== 'play') return;

    // wave progression
    if (!round) {
      const left = invaders.filter((a) => a.alive).length;
      if (left === 0) {
        waveBreak += dt;
        if (waveBreak > 1.1) {
          waveBreak = 0;
          addScore(5000 * (waveIdx + 1), W / 2, H / 2, '#ffe060');
          for (const p of players) if (!p.out) p.level = Math.min(10, p.level + 1);
          waveIdx++;
          if (waveIdx >= stage().waves.length) { mode = 'warning'; modeT = 0; eBullets = []; ufos = []; A.fx.warning(); }
          else spawnWave();
        }
      }
    }
  }
  function updatePlayers(dt) {
    for (const p of players) {
      if (p.out) continue;
      if (p.deadT > 0) { p.deadT -= dt; if (p.deadT <= 0) { p.invT = 2.2; } continue; }
      if (p.invT > 0) p.invT -= dt;
      if (p.ghostT > 0) p.ghostT -= dt;
      if (p.power) { p.power.t -= dt; if (p.power.t <= 0) { p.power = null; p.shield = 0; } }
      if (p.touchX != null) { const d = p.touchX - p.x; p.x += Math.sign(d) * Math.min(Math.abs(d), 900 * dt); }
      else p.x += p.dir * 330 * dt;
      p.x = Math.max(24, Math.min(W - 24, p.x));
      p.cd -= dt;
      if ((p.fire || p.touchFire) && p.cd <= 0 && mode !== 'intro' && mode !== 'clear') firePlayer(p);
    }
  }
  function updateInvaders(dt, beat) {
    const frozen = freezeT > 0;
    const alive = invaders.filter((a) => a.alive);
    const formMembers = alive.filter((a) => a.state === 'form');
    // grid formation: steps on the beat, faster as it thins out
    if (form && formMembers.length) {
      if (form.entering) {
        form.oy += 160 * dt;
        if (form.oy >= form.targetY) { form.oy = form.targetY; form.entering = false; form.lastStep = beat; }
      } else if (!frozen && !round) {
        const n = formMembers.length;
        const every = n > 30 ? 1 : n > 16 ? 0.5 : n > 6 ? 0.25 : 0.125;
        if (beat < form.lastStep) form.lastStep = beat; // the clock restarts with each song
        if (beat - form.lastStep >= every) {
          form.lastStep = beat;
          let lo = 1e9, hi = -1e9;
          for (const a of formMembers) { lo = Math.min(lo, a.x); hi = Math.max(hi, a.x); }
          const step = 12 * D().speed * hard();
          if ((form.dir > 0 && hi + step > W - 28) || (form.dir < 0 && lo - step < 28)) { form.oy += 20; form.dir *= -1; }
          else form.ox += form.dir * step;
          for (const a of formMembers) a.frame ^= 1;
        }
      }
      for (const a of formMembers) { a.x = form.ox + a.col * form.sx; a.y = form.oy + a.row * form.sy; }
      // reaching the cannons is an invasion
      let low = 0; for (const a of formMembers) low = Math.max(low, a.y);
      if (low > PY - 50) { for (const p of alivePlayers()) hurtPlayer(p); form.oy -= 140; }
    }
    for (const a of alive) {
      if (a.flash > 0) a.flash -= dt;
      if (a.sp === 'reflect') { a.shieldT += dt; a.shieldOn = a.shieldT % 3.4 < 2.2; }
      if (frozen && a.state !== 'dive') continue;
      if (a.state === 'snake') {
        a.t += dt * D().speed * hard();
        if (a.t > 0) { const q = snakePos(a); a.x = q.x; a.y = q.y; } else { a.x = -60; a.y = -60; }
        a.frame = Math.floor(beat * 2) % 2;
        if (a.y > PY - 50) { for (const p of alivePlayers()) hurtPlayer(p); a.t -= 4; }
      } else if (a.state === 'free') {
        a.x += a.vx * dt; a.y += a.vy * dt;
        if (a.x < 20 || a.x > W - 20) a.vx *= -1;
        a.frame = Math.floor(beat * 2) % 2;
        if (a.y > PY - 30) { a.alive = false; burst(a.x, a.y, COL[a.color], 12, 200); for (const p of alivePlayers()) if (Math.abs(p.x - a.x) < 50) hurtPlayer(p); }
      } else if (a.state === 'dive') {
        a.vy = Math.min(420, a.vy + 380 * dt);
        a.x += Math.sign(a.tx - a.x) * Math.min(Math.abs(a.tx - a.x), 120 * dt);
        a.y += a.vy * dt;
        // a diver that lands takes out whoever it lands on
        if (a.y > PY - 10) {
          a.alive = false; burst(a.x, PY, COL[a.color], 30, 320); A.fx.pop(true);
          const near = alivePlayers().sort((p, q) => Math.abs(p.x - a.x) - Math.abs(q.x - a.x))[0];
          if (near && Math.abs(near.x - a.x) < 70) hurtPlayer(near);
        }
      } else if (a.state === 'orbit') {
        a.t += dt * 1.4;
        a.x = W / 2 + Math.cos(a.t) * a.r0; a.y = 270 + Math.sin(a.t) * a.r0 * 0.45;
        a.frame = Math.floor(beat * 2) % 2;
      }
    }
    // enemy fire
    const shooting = !frozen && (mode === 'play' || mode === 'boss') && ufoTimeT <= 0 && (!round || round.type === 'survive');
    if (shooting) {
      const shooters = alive.filter((a) => a.state !== 'dive' && a.y > 0);
      const rate = (0.8 + stageIdx * 0.35) * D().fire * hard() * (boss ? 0.4 : 1);
      if (shooters.length && Math.random() < rate * dt) {
        const a = shooters[Math.floor(Math.random() * shooters.length)];
        if (stageIdx >= 2 && Math.random() < 0.35) { const [vx, vy] = aimAt(a.x, a.y, 230); enemyShot(a.x, a.y + 14, vx, vy, COL[a.color]); }
        else enemyShot(a.x, a.y + 14, 0, 210 + stageIdx * 15, COL[a.color]);
      }
      if (round && round.type === 'survive' && Math.random() < 7 * D().fire * dt) enemyShot(30 + Math.random() * (W - 60), 80, (Math.random() - 0.5) * 60, 230, '#ff60ff');
    }
    invaders = invaders.filter((a) => a.alive);
    if (!invaders.some((a) => a.state === 'form')) form = null;
  }
  function updateUfos(dt) {
    if (mode === 'play' && !round) {
      ufoTimer -= dt;
      if (ufoTimer <= 0) { ufoTimer = 16 + Math.random() * 8; spawnUfo('normal'); }
    }
    for (const u of ufos.slice()) {
      u.t += dt;
      if (u.type === 'target') { u.x = W / 2 + Math.sin(u.t * 1.8) * 220; u.y = 140 + Math.sin(u.t * 3.1) * 50; continue; }
      if (u.type === 'roulette') u.ri = Math.floor(u.t * 7) % ROULETTE.length;
      u.x += u.vx * dt;
      if (u.x < -60 || u.x > W + 60) ufos.splice(ufos.indexOf(u), 1);
    }
  }
  function updateRound(dt) {
    if (!round) return;
    round.t += dt;
    if (round.type === 'clear' && round.t > 1 && !invaders.some((a) => a.round && a.alive)) round.done = true;
    if (round.type === 'color' && round.got >= round.need) round.done = true;
    if (round.type === 'survive') { if (totalLives() < round.hitBefore) round.failed = true; else if (round.t >= round.limit) round.done = true; }
    if (round.done) endRound(true);
    else if (round.failed || round.t >= round.limit) endRound(false);
  }
  function updateBullets(dt) {
    for (const b of pBullets) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < -40 || b.x < -20 || b.x > W + 20) { b.dead = true; continue; }
      for (const u of ufos) {
        if (Math.abs(b.x - u.x) < 26 + b.r && Math.abs(b.y - u.y) < 14 + b.r) {
          if (b.type === 'bomb') explode(b.x, b.y, 85 + b.owner.level * 3, 3, b.owner); else hitUfo(u);
          if (b.type !== 'laser') b.dead = true;
          break;
        }
      }
      if (b.dead) continue;
      if (boss && boss.y >= boss.ty - 1) {
        if (boss.kind === 'mirror' && b.type !== 'laser') {
          // orbiting mirrors bounce anything but lasers
          for (const o of boss.orbs) {
            const ox = boss.x + Math.cos(o.a) * 140, oy = boss.y + Math.sin(o.a) * 70;
            if (Math.hypot(b.x - ox, b.y - oy) < 18 + b.r) { eBullets.push({ x: b.x, y: oy + 18, vx: -b.vx * 0.4, vy: 220, r: 5, color: '#ffffff', reflected: true }); b.dead = true; A.fx.clink(); break; }
          }
          if (b.dead) continue;
        }
        if (b.type === 'laser') {
          // lasers burn through, hitting each part once
          for (const p of boss.parts) {
            if (p.hp <= 0 || b.hit.has(p)) continue;
            const q = partPos(boss, p);
            if (Math.abs(b.x - q.x) < p.rw + b.r && Math.abs(b.y - q.y) < p.rh + 30) { b.hit.add(p); if (!coreLocked(boss, p)) damagePart(boss, p, b.dmg); if (!boss) break; }
          }
        } else if (bossHit(b)) {
          if (b.type === 'bomb') explode(b.x, b.y, 85, 3, b.owner);
          b.dead = true; continue;
        }
      }
      if (b.dead) continue;
      for (const a of invaders) {
        if (!a.alive || (b.hit && b.hit.has(a))) continue;
        const rr = a.kind === 'mini' ? 12 : 18;
        if (Math.abs(b.x - a.x) < rr + b.r && Math.abs(b.y - a.y) < 14 + b.r + (b.type === 'laser' ? 26 : 0)) {
          if (b.type === 'bomb') { b.dead = true; explode(b.x, b.y, 85 + b.owner.level * 3, 3, b.owner); break; }
          damageInvader(a, b.dmg, b.owner, b);
          if (b.type === 'laser') { b.hit.add(a); continue; }
          b.dead = true; break;
        }
      }
    }
    pBullets = pBullets.filter((b) => !b.dead);
    for (const e of eBullets) {
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.y > H + 10 || e.y < -20 || e.x < -20 || e.x > W + 20) { e.dead = true; continue; }
      for (const p of players) {
        if (p.out || p.deadT > 0) continue;
        const hitR = p.power && p.power.type === 'shield' && p.shield > 0 ? 34 : 0;
        const hit = hitR ? Math.hypot(e.x - p.x, e.y - PY) < hitR + e.r : Math.abs(e.x - p.x) < 15 + e.r * 0.6 && Math.abs(e.y - (PY + 2)) < 10 + e.r * 0.6;
        if (hit) { e.dead = true; hurtPlayer(p); break; }
      }
    }
    eBullets = eBullets.filter((e) => !e.dead);
    if (eBullets.length > 400) eBullets.splice(0, eBullets.length - 400);
  }
  function updateBeams(dt) {
    for (const bm of beams) {
      bm.t += dt;
      if (bm.t > bm.warn && bm.t < bm.warn + bm.on) for (const p of players) if (Math.abs(p.x - bm.x) < bm.w + 12) hurtPlayer(p);
    }
    beams = beams.filter((bm) => bm.t < bm.warn + bm.on);
  }

  // ---------- drawing ----------
  function font(size, weight) { return `${weight || 700} ${size}px Orbitron, 'Segoe UI', sans-serif`; }
  function neonText(str, x, y, size, color, align) {
    ctx.font = font(size, 900); ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = color; ctx.shadowBlur = size * 0.6;
    ctx.fillStyle = color; ctx.fillText(str, x, y);
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(str, x, y);
  }
  function plainText(str, x, y, size, color, align) {
    ctx.font = font(size, 700); ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.fillText(str, x, y);
  }
  function hueNow() { return feverT > 0 ? (performance.now() / 12) % 360 : mode === 'title' || mode === 'allclear' ? (performance.now() / 60) % 360 : stage().hue; }
  function drawBackground() {
    const hue = hueNow();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `hsl(${hue},70%,5%)`); g.addColorStop(0.6, `hsl(${(hue + 30) % 360},70%,9%)`); g.addColorStop(1, `hsl(${hue},80%,14%)`);
    // tall or wide screens: carry the backdrop out into the letterbox so it reads as one surface
    const x0 = -view.ox / view.s, y0 = -view.oy / view.s, x1 = W - x0, y1 = H - y0;
    ctx.fillStyle = `hsl(${hue},70%,5%)`; ctx.fillRect(x0, y0, x1 - x0, -y0 + 1);
    ctx.fillStyle = `hsl(${hue},80%,14%)`; ctx.fillRect(x0, H - 1, x1 - x0, y1 - H + 1);
    ctx.fillStyle = g; ctx.fillRect(x0, 0, x1 - x0, H);
    const pulse = beatHit * (feverT > 0 ? 0.35 : 0.18);
    if (pulse > 0.01) { const rg = ctx.createRadialGradient(W / 2, H, 10, W / 2, H, H * 0.9); rg.addColorStop(0, `hsla(${hue},100%,60%,${pulse})`); rg.addColorStop(1, `hsla(${hue},100%,60%,0)`); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); }
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${0.25 + s.z * 0.6})`; const sz = s.z > 0.8 ? 2 : 1, sh = feverT > 0 ? sz * 5 : sz;
      for (let oy = s.y - H; oy >= y0 - 2 && oy < s.y; oy += H) ctx.fillRect(s.x, oy, sz, sh);
      ctx.fillRect(s.x, s.y, sz, sh);
      if (s.y + H < y1) ctx.fillRect(s.x, s.y + H, sz, sh);
      if (x0 < 0) { ctx.fillRect(s.x - W, s.y, sz, sh); ctx.fillRect(s.x + W, s.y, sz, sh); }
    }
    // perspective grid floor that scrolls with the beat
    ctx.strokeStyle = `hsla(${(hue + 180) % 360},100%,65%,${0.22 + beatHit * 0.2})`; ctx.lineWidth = 1;
    const top = H - 170, vx = W / 2, off = A.beat() % 1;
    const n = Math.max(9, Math.ceil(9 * Math.sqrt((y1 - top) / (H - top))));
    for (let i = 0; i < n; i++) { const f = (i + off) / 9; const y = top + f * f * (H - top); if (y > y1) break; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    const k = (y1 - top) / (H - top);
    for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(vx + i * 14, top); ctx.lineTo(vx + i * 14 + i * 96 * k, y1); ctx.stroke(); }
    // faint rails mark the edge of play when there's room either side
    if (x0 < -4) { ctx.fillStyle = `hsla(${(hue + 180) % 360},100%,65%,0.25)`; ctx.fillRect(-2, y0, 2, y1 - y0); ctx.fillRect(W, y0, 2, y1 - y0); }
  }
  function drawInvader(a) {
    const scale = a.kind === 'mini' ? 2 : 3;
    let rows;
    if (ufoTimeT > 0 && a.state === 'form') rows = B.ufo;
    else rows = (a.kind === 'mini' ? B.squid : SHAPES[a.kind])[a.frame];
    const color = freezeT > 0 ? '#bff4ff' : COL[a.color];
    blit(glow(rows, color, scale, CORE[a.color]), a.x, a.y);
    if (a.flash > 0) blit(glow(rows, '#ffffff', scale, '#ffffff'), a.x, a.y, 0.8);
    if (a.sp === 'armor' && a.hp > 1) { ctx.strokeStyle = '#e8eef5'; ctx.lineWidth = 2; for (let i = 0; i < a.hp - 1; i++) { ctx.beginPath(); ctx.moveTo(a.x - 14, a.y - 17 - i * 4); ctx.lineTo(a.x + 14, a.y - 17 - i * 4); ctx.stroke(); } }
    if (a.sp === 'bomb') { ctx.fillStyle = beatHit > 0.5 ? '#ffffff' : '#ffb040'; ctx.beginPath(); ctx.arc(a.x, a.y - 19, 4, 0, Math.PI * 2); ctx.fill(); }
    if (a.sp === 'split') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(a.x, a.y - 16); ctx.lineTo(a.x, a.y + 16); ctx.stroke(); ctx.setLineDash([]); }
    if (a.sp === 'diver' && a.state !== 'dive') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(a.x - 5, a.y + 16); ctx.lineTo(a.x + 5, a.y + 16); ctx.lineTo(a.x, a.y + 23); ctx.fill(); }
    if (a.state === 'dive') { ctx.strokeStyle = COL[a.color]; ctx.globalAlpha = 0.5; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y - 14); ctx.lineTo(a.x, a.y - 40); ctx.stroke(); ctx.globalAlpha = 1; }
    if (a.sp === 'reflect' && a.shieldOn) { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, 22, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); ctx.beginPath(); ctx.arc(a.x, a.y, 22, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
  }
  function drawPlayer(p) {
    if (p.out || p.deadT > 0) return;
    if (p.invT > 0 && Math.floor(p.invT * 12) % 2 === 0) return;
    blit(glow(SHIP, p.color, 3, '#ffffff'), p.x, PY, p.ghostT > 0 ? 0.45 : 1);
    if (p.power && p.power.type === 'shield' && p.shield > 0) { ctx.strokeStyle = COL.black; ctx.lineWidth = 2 + p.shield; ctx.shadowColor = COL.black; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(p.x, PY, 34, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
    if (numPlayers === 2) plainText(p.i === 0 ? '1P' : '2P', p.x, PY + 26, 11, p.color, 'center');
  }
  function drawCore(x, y, p, locked) {
    const t = performance.now() / 200;
    ctx.fillStyle = locked ? 'rgba(160,160,160,0.6)' : p.flash > 0 ? '#ffffff' : `hsla(${(t * 40) % 360},100%,65%,0.9)`;
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.ellipse(x, y, p.rw * 0.8 + Math.sin(t) * 2, p.rh * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  function drawBoss() {
    const b = boss;
    if (b.kind === 'twins') {
      for (const p of b.parts) { if (p.hp <= 0) continue; const q = partPos(b, p); blit(glow(SHAPES.squid[Math.floor(b.t * 2) % 2], b.color, b.scale, CORE.blue), q.x, q.y); drawCore(q.x, q.y, p); }
    } else {
      const rows = b.shape === 'ufo' ? B.ufo : SHAPES[b.shape][Math.floor(b.t * 2) % 2];
      blit(glow(rows, b.color, b.scale, '#ffffff'), b.x, b.y);
      for (const p of b.parts) { if (p.hp <= 0) continue; const q = partPos(b, p); drawCore(q.x, q.y, p, coreLocked(b, p)); }
    }
    if (b.kind === 'mirror') for (const o of b.orbs) { const ox = b.x + Math.cos(o.a) * 140, oy = b.y + Math.sin(o.a) * 70; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(ox, oy, 12, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
  }
  function drawBullets() {
    ctx.globalCompositeOperation = 'lighter';
    for (const b of pBullets) {
      if (b.type === 'laser') { ctx.fillStyle = feverT > 0 ? `hsl(${(performance.now() / 4) % 360},100%,65%)` : COL.blue; ctx.fillRect(b.x - b.r / 2, b.y - 36, b.r, 60); ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - b.r / 5, b.y - 36, b.r / 2.5, 60); }
      else if (b.type === 'bomb') { ctx.fillStyle = COL.red; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r / 2, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillStyle = b.owner.color; ctx.fillRect(b.x - b.r / 2, b.y - b.r * 2.5, b.r, b.r * 5); ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - b.r / 4, b.y - b.r * 2, b.r / 2, b.r * 4); }
    }
    for (const e of eBullets) {
      ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of parts) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); }
    ctx.globalAlpha = 1;
    for (const r of rings) { ctx.strokeStyle = `rgba(255,200,90,${1 - r.t / 0.35})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.3 + (r.t / 0.35) * 0.8), 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over';
  }
  function drawBeams() {
    for (const bm of beams) {
      if (bm.t < bm.warn) { ctx.fillStyle = `rgba(255,60,60,${0.15 + 0.25 * (Math.floor(bm.t * 10) % 2)})`; ctx.fillRect(bm.x - bm.w, 0, bm.w * 2, H); }
      else { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,220,80,0.85)'; ctx.fillRect(bm.x - bm.w, 0, bm.w * 2, H); ctx.fillStyle = '#ffffff'; ctx.fillRect(bm.x - bm.w / 3, 0, bm.w / 1.5, H); ctx.globalCompositeOperation = 'source-over'; }
    }
  }
  function drawUfos() {
    for (const u of ufos) {
      let color = '#ff4040';
      if (u.type === 'round') color = `hsl(${Math.floor(performance.now() / 60) * 40 % 360},100%,60%)`;
      if (u.type === 'roulette') color = ['#ff3d68', '#3fa9ff', '#3dff8f', '#b07cff', '#ffd040', '#ffffff'][u.ri];
      if (u.type === 'target') color = '#ffd040';
      blit(glow(B.ufo, color, 3, '#ffffff'), u.x, u.y);
      if (u.type === 'roulette') plainText(ROULETTE[u.ri], u.x, u.y - 24, 12, '#ffffff', 'center');
      if (u.type === 'round') plainText('ROUND', u.x, u.y - 24, 11, '#ffffff', 'center');
      if (u.type === 'target') plainText('TARGET ' + u.hp, u.x, u.y - 24, 11, '#ffd040', 'center');
    }
  }
  function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, 40);
    plainText('SCORE', 14, 13, 10, '#9fb4d6');
    plainText(String(score).padStart(8, '0'), 14, 28, 16, '#ffffff');
    plainText('HI ' + String(Math.max(score, hiFor())).padStart(8, '0'), W / 2, 13, 10, '#9fb4d6', 'center');
    plainText(`STAGE ${stageIdx + 1}-${route}${boss ? '  BOSS' : ''}`, W / 2, 28, 13, `hsl(${hueNow()},100%,72%)`, 'center');
    players.forEach((p, i) => {
      const y = numPlayers === 1 ? 20 : 13 + i * 15;
      plainText(`${numPlayers === 2 ? (i ? '2P ' : '1P ') : ''}LV${p.level}  x${Math.max(0, p.lives)}`, W - 14, y, 12, p.color, 'right');
    });
    const y = H - 24;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, H - 46, W, 46);
    plainText('CHAIN', 14, y, 11, '#9fb4d6');
    for (let i = 0; i < 4; i++) {
      const filled = i < chain.n;
      ctx.fillStyle = filled ? COL[chain.color] : 'rgba(255,255,255,0.12)';
      if (filled) { ctx.shadowColor = COL[chain.color]; ctx.shadowBlur = 10; }
      ctx.fillRect(70 + i * 22, y - 8, 16, 16); ctx.shadowBlur = 0;
    }
    if (sets.length) { plainText('SET', 172, y, 10, '#9fb4d6'); ctx.fillStyle = COL[sets[sets.length - 1]]; ctx.fillRect(200, y - 6, 12, 12); }
    let px = 228;
    for (const p of players) {
      if (p.out) continue;
      const pw = feverT > 0 ? { type: 'fever', t: feverT, max: 12 } : p.power;
      if (!pw) continue;
      const col = pw.type === 'fever' ? `hsl(${(performance.now() / 4) % 360},100%,65%)` : COL[Object.keys(POWER).find((k) => POWER[k] === pw.type)];
      plainText(POWER_NAME[pw.type] + (pw.type === 'shield' ? ' ' + p.shield : ''), px, y - 7, 11, col);
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(px, y + 4, 90, 5);
      ctx.fillStyle = col; ctx.fillRect(px, y + 4, 90 * Math.max(0, pw.t / pw.max), 5);
      px += 110;
      if (feverT > 0) break;
    }
    if (combo >= 5) neonText(`CHAIN ${combo}`, W - 70, y, 14, '#ffd040');
    const st = [];
    if (freezeT > 0) st.push('FREEZE');
    if (ufoTimeT > 0) st.push('UFO TIME');
    if (doubleT > 0) st.push('x2 SCORE');
    if (players.some((p) => p.ghostT > 0)) st.push('GHOST');
    if (st.length) plainText(st.join('  '), W / 2, 52, 12, '#ffffff', 'center');
    if (round) {
      const left = Math.max(0, round.limit - round.t);
      const what = round.type === 'color' ? `${round.got}/${round.need} ${round.color.toUpperCase()}` : round.type === 'survive' ? 'SURVIVE' : round.type === 'target' ? 'HIT THE TARGET' : 'DESTROY ALL';
      neonText(`ROUND  ${what}  ${left.toFixed(1)}`, W / 2, 66, 15, '#ffd040');
    }
    if (boss) {
      plainText(boss.name, 20, 62, 11, '#ffffff');
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(20, 72, W - 40, 7);
      ctx.fillStyle = boss.color; ctx.fillRect(20, 72, (W - 40) * Math.max(0, boss.hp / boss.maxHp), 7);
    }
  }
  function drawPops() {
    for (const p of pops) {
      ctx.globalAlpha = 1 - p.t / 1.1;
      if (p.big) neonText(p.text, p.x, p.y - p.t * 40, 18, p.color);
      else plainText(p.text, p.x, p.y - p.t * 40, 12, p.color, 'center');
    }
    ctx.globalAlpha = 1;
  }
  function drawBanner() {
    if (!banner) return;
    const k = Math.min(1, banner.t / 0.2), out = Math.max(0, (banner.t - banner.life + 0.3) / 0.3);
    ctx.globalAlpha = k * (1 - out);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, H / 2 - 70, W, 120);
    neonText(banner.big, W / 2, H / 2 - 22, 44 * (0.8 + 0.2 * k), `hsl(${hueNow()},100%,65%)`);
    if (banner.small) plainText(banner.small, W / 2, H / 2 + 26, 16, '#ffffff', 'center');
    ctx.globalAlpha = 1;
  }
  const MENU = () => ['1 PLAYER', '2 PLAYERS (CO-OP)', 'DIFFICULTY: ' + opts.diff.toUpperCase(), 'SOUND: ' + (opts.sound ? 'ON' : 'OFF')];
  function drawTitle() {
    const t = performance.now() / 1000, hue = hueNow();
    for (let i = 0; i < 8; i++) { const c = COLORS[i % 4]; blit(glow(SHAPES[['squid', 'crab', 'octopus'][i % 3]][Math.floor(A.beat()) % 2], COL[c], 4, CORE[c]), 70 + i * 66 + Math.sin(t) * 10, 120 + Math.sin(t * 2 + i) * 8); }
    neonText('SPACE INVADERS', W / 2, 230, 46, `hsl(${hue},100%,65%)`);
    neonText('EXTREME', W / 2, 288, 40 + beatHit * 6, `hsl(${(hue + 120) % 360},100%,65%)`);
    plainText('REMIX', W / 2, 330, 14, '#9fb4d6', 'center');
    MENU().forEach((m, i) => {
      const y = 420 + i * 46;
      if (i === menuSel) { ctx.fillStyle = `hsla(${hue},100%,60%,0.18)`; ctx.fillRect(W / 2 - 200, y - 19, 400, 38); neonText(m, W / 2, y, 20, `hsl(${hue},100%,70%)`); }
      else plainText(m, W / 2, y, 18, '#9fb4d6', 'center');
    });
    plainText('HI-SCORE ' + String(hiFor()).padStart(8, '0'), W / 2, 620, 14, '#ffffff', 'center');
    const lines = ['Shoot 4 of a colour in a row for a power:', 'RED bomb   BLUE laser   GREEN spread   BLACK shield', 'Two sets bring a UFO. Win its Round for FEVER.', 'P1: A/D + W or SPACE    P2: ARROWS + UP or ENTER', 'Touch: drag to steer, hold to fire, tap top bar to pause'];
    lines.forEach((l, i) => plainText(l, W / 2, 664 + i * 22, 11, i === 1 ? '#ffd040' : '#9fb4d6', 'center'));
  }
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(view.s * view.dpr, 0, 0, view.s * view.dpr, view.ox * view.dpr, view.oy * view.dpr);
    drawBackground();
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    if (mode === 'title') { drawTitle(); ctx.restore(); return; }
    drawBeams();
    drawUfos();
    for (const a of invaders) if (a.alive) drawInvader(a);
    if (boss) drawBoss();
    for (const p of players) drawPlayer(p);
    drawBullets();
    drawPops();
    drawHUD();
    drawBanner();
    if (mode === 'warning') { const f = Math.floor(modeT * 4) % 2; ctx.fillStyle = `rgba(255,0,40,${f ? 0.22 : 0.08})`; ctx.fillRect(0, 0, W, H); neonText('WARNING', W / 2, H / 2 - 20, 54, '#ff2040'); plainText('A HUGE INVADER IS APPROACHING', W / 2, H / 2 + 30, 14, '#ffffff', 'center'); }
    if (mode === 'clear') { neonText('STAGE CLEAR', W / 2, H / 2 - 60, 44, '#3dff8f'); plainText(`SCORE ${score}`, W / 2, H / 2, 18, '#ffffff', 'center'); plainText(`KILLS ${kills}   MAX CHAIN ${maxCombo}`, W / 2, H / 2 + 34, 14, '#9fb4d6', 'center'); }
    if (mode === 'over') { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H); neonText('GAME OVER', W / 2, H / 2 - 50, 50, '#ff3d68'); plainText(`SCORE ${score}`, W / 2, H / 2 + 10, 20, '#ffffff', 'center'); plainText(score >= hiFor() && score > 0 ? 'NEW HIGH SCORE!' : `HI ${hiFor()}`, W / 2, H / 2 + 44, 14, '#ffd040', 'center'); if (modeT > 1.5) plainText('PRESS FIRE OR TAP', W / 2, H / 2 + 90, 14, '#9fb4d6', 'center'); }
    if (mode === 'allclear') { neonText('ALL CLEAR!', W / 2, H / 2 - 60, 50, `hsl(${hueNow()},100%,65%)`); plainText(`FINAL SCORE ${score}`, W / 2, H / 2, 20, '#ffffff', 'center'); plainText(`MAX CHAIN ${maxCombo}   KILLS ${kills}`, W / 2, H / 2 + 36, 14, '#9fb4d6', 'center'); if (modeT > 2) plainText('PRESS FIRE OR TAP', W / 2, H / 2 + 90, 14, '#9fb4d6', 'center'); }
    if (paused) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H); neonText('PAUSED', W / 2, H / 2, 46, '#ffffff'); plainText('P OR TAP TO RESUME     Q TO QUIT', W / 2, H / 2 + 46, 12, '#9fb4d6', 'center'); plainText('TOUCH: TAP THE TOP BAR AGAIN TO QUIT', W / 2, H / 2 + 70, 11, '#9fb4d6', 'center'); }
    ctx.restore();
  }

  // ---------- input ----------
  const keys = {};
  function applyKeys() {
    if (!players.length) return;
    const p1 = players[0], p2 = players[1];
    if (numPlayers === 1) {
      p1.dir = (keys.KeyA || keys.ArrowLeft ? -1 : 0) + (keys.KeyD || keys.ArrowRight ? 1 : 0);
      p1.fire = !!(keys.Space || keys.KeyW || keys.ArrowUp || keys.KeyZ || keys.KeyJ || keys.Enter);
    } else {
      p1.dir = (keys.KeyA ? -1 : 0) + (keys.KeyD ? 1 : 0);
      p1.fire = !!(keys.Space || keys.KeyW);
      p2.dir = (keys.ArrowLeft ? -1 : 0) + (keys.ArrowRight ? 1 : 0);
      p2.fire = !!(keys.ArrowUp || keys.Enter || keys.Numpad0 || keys.ShiftRight);
    }
  }
  function menuPick(i) {
    A.init();
    if (i === 0) startGame(1);
    else if (i === 1) startGame(2);
    else if (i === 2) { const d = ['easy', 'normal', 'hard']; opts.diff = d[(d.indexOf(opts.diff) + 1) % 3]; store.set('opts', opts); A.fx.tick(); }
    else if (i === 3) { opts.sound = !opts.sound; A.setEnabled(opts.sound); store.set('opts', opts); A.fx.tick(); }
  }
  function toTitle() { mode = 'title'; paused = false; players = []; invaders = []; boss = null; ufos = []; pBullets = []; eBullets = []; round = null; feverT = 0; A.start('title'); A.setIntensity(0); }
  addEventListener('keydown', (e) => {
    A.init();
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (mode === 'title') {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') menuSel = (menuSel + 3) % 4;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') menuSel = (menuSel + 1) % 4;
      if (e.code === 'Enter' || e.code === 'Space') menuPick(menuSel);
      if (e.code === 'Digit1') startGame(1);
      if (e.code === 'Digit2') startGame(2);
      return;
    }
    if ((mode === 'over' && modeT > 1.5) || (mode === 'allclear' && modeT > 2)) { if (['Space', 'Enter', 'KeyW', 'ArrowUp'].includes(e.code)) toTitle(); return; }
    if (e.code === 'KeyP' || e.code === 'Escape') paused = !paused;
    if (paused && e.code === 'KeyQ') toTitle();
    if (e.code === 'KeyM') { opts.sound = !opts.sound; A.setEnabled(opts.sound); store.set('opts', opts); }
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  const autoPause = () => { for (const k in keys) keys[k] = false; if (mode !== 'title' && mode !== 'over' && mode !== 'allclear') paused = true; };
  addEventListener('blur', autoPause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });

  // touch and mouse: drag to steer, holding fires. In co-op each half of the screen is one player.
  const toLogical = (e) => ({ x: (e.clientX - view.ox) / view.s, y: (e.clientY - view.oy) / view.s });
  const fingers = new Map();
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault(); A.init();
    const p = toLogical(e);
    if (mode === 'title') {
      const i = Math.round((p.y - 420) / 46);
      if (i >= 0 && i < 4 && Math.abs(p.x - W / 2) < 210) { menuSel = i; menuPick(i); }
      return;
    }
    if ((mode === 'over' && modeT > 1.5) || (mode === 'allclear' && modeT > 2)) { toTitle(); return; }
    // the HUD strip doubles as the touch pause button; tap it again while paused to quit
    if (p.y < 44) { if (paused) toTitle(); else paused = true; return; }
    if (paused) { paused = false; return; }
    const who = numPlayers === 2 && p.x > W / 2 ? 1 : 0;
    const pl = players[who];
    if (!pl) return;
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    fingers.set(e.pointerId, { who, sx: p.x, px: pl.x, mouse: e.pointerType === 'mouse' });
    if (e.pointerType === 'mouse') pl.touchX = p.x;
    pl.touchFire = true;
  });
  cv.addEventListener('pointermove', (e) => {
    const f = fingers.get(e.pointerId); if (!f) return;
    const p = toLogical(e), pl = players[f.who]; if (!pl) return;
    pl.touchX = Math.max(24, Math.min(W - 24, f.mouse ? p.x : f.px + (p.x - f.sx) * 1.4));
  });
  const lift = (e) => {
    const f = fingers.get(e.pointerId); if (!f) return;
    fingers.delete(e.pointerId);
    const pl = players[f.who];
    if (pl && ![...fingers.values()].some((g) => g.who === f.who)) { pl.touchX = null; pl.touchFire = false; }
  };
  cv.addEventListener('pointerup', lift); cv.addEventListener('pointercancel', lift);

  // ---------- loop ----------
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    while (acc >= STEP) { applyKeys(); update(STEP); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }
  A.start('title');
  requestAnimationFrame(frame);

  // hooks for automated checks
  window.SIEG = {
    get mode() { return mode; }, get score() { return score; }, get players() { return players; }, get invaders() { return invaders; },
    get boss() { return boss; }, partPos, get stageIdx() { return stageIdx; }, get route() { return route; }, get round() { return round; }, get feverT() { return feverT; },
    get eBullets() { return eBullets; }, get ufos() { return ufos; }, get chain() { return chain; }, get waveIdx() { return waveIdx; }, get paused() { return paused; },
    startGame, update, keys, opts, spawnUfo, grantPower, startRound, toTitle,
    skipToBoss() { waveIdx = STAGES[stageIdx].waves.length; invaders = []; form = null; mode = 'warning'; modeT = 0; },
    setStage(i) { stageIdx = i; startStage(); },
  };
})();
