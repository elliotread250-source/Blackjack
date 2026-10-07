'use strict';
// Flappy Bird replica. Runs at the original 288x512 resolution with 2x2
// "art pixels" like the 2013 game, scaled up crisp to fit the screen.
(function () {
  const W = 288, H = 512, GROUND_Y = 400;
  const STEP = 1 / 60;
  // per-frame values from the original, converted to per second
  const GRAVITY = 0.25 * 3600;      // px/s^2
  const FLAP = -4.6 * 60;           // px/s
  const MAX_FALL = 10 * 60;         // px/s
  const PIPE_W = 52;
  // classic run: pipes scroll 2 px/frame, 100 px gaps
  const CLASSIC = { speed: 2 * 60, gap: 100, spacing: 180, move: 0, target: 0 };
  // levels mode: ten stages from a gentle warm-up to moving-pipe chaos
  const LEVELS = [
    { n: 'BREEZY', target: 10, gap: 135, speed: 100, spacing: 210, move: 0 },
    { n: 'EASY', target: 15, gap: 125, speed: 105, spacing: 200, move: 0 },
    { n: 'CASUAL', target: 20, gap: 115, speed: 115, spacing: 190, move: 0 },
    { n: 'NORMAL', target: 25, gap: 105, speed: 120, spacing: 180, move: 0 },
    { n: 'TRICKY', target: 25, gap: 105, speed: 120, spacing: 180, move: 18 },
    { n: 'HARD', target: 30, gap: 100, speed: 130, spacing: 175, move: 28, night: 1 },
    { n: 'HARDER', target: 30, gap: 96, speed: 140, spacing: 170, move: 36 },
    { n: 'BRUTAL', target: 35, gap: 92, speed: 150, spacing: 165, move: 44, night: 1 },
    { n: 'INSANE', target: 40, gap: 90, speed: 155, spacing: 165, move: 48 },
    { n: 'DEMON', target: 50, gap: 88, speed: 165, spacing: 162, move: 54, night: 1 },
  ];
  let cfg = CLASSIC;
  let SPEED = cfg.speed, GAP = cfg.gap, PIPE_SPACING = cfg.spacing;

  const screen = document.getElementById('screen');
  const sctx = screen.getContext('2d');
  const buf = document.createElement('canvas');
  buf.width = W; buf.height = H;
  const x = buf.getContext('2d');
  x.imageSmoothingEnabled = false;

  const K = '#543847'; // the outline colour used all over the original

  // ---------- pixel art ----------
  const BIRD_BODY = [
    '......kkkkkk.....',
    '....kkllllkwwk...',
    '...klllyyykwwwwk.',
    '..klyyyyykwwwbwk.',
    '.kyyyyyyykwwwbwk.',
    'kyyyyyyyyykwwwwk.',
    'kyyyyyyyyyykkkkkk',
    'kyyyyyyyyykrrrrrk',
    '.kyyyyyyyykrkkkkk',
    '..kkkoooooookrrrk',
    '...kkoooooookkkk.',
    '.....kkkkkk......',
  ];
  const WING = [
    '.kkkk..',
    'kWWWWk.',
    'kWWWWWk',
    '.kkkkk.',
  ];
  const BIRDS = [
    { y: '#fbd935', l: '#fdf3a6', o: '#f7a73a', W: '#fdf6d5' },
    { y: '#5fc5e8', l: '#c4ecf7', o: '#3d8fc4', W: '#e4f7fd' },
    { y: '#f2643a', l: '#f9b08f', o: '#cc3b22', W: '#fde0d3' },
  ];
  function sprite(rows, pal, scale) {
    const c = document.createElement('canvas');
    c.width = rows[0].length * scale; c.height = rows.length * scale;
    const g = c.getContext('2d');
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      g.fillStyle = pal[ch] || '#f0f';
      g.fillRect(i * scale, j * scale, scale, scale);
    }));
    return c;
  }
  // three wing frames baked into each bird
  function birdFrames(col) {
    const pal = { k: K, w: '#ffffff', b: '#000000', r: '#f5502c', y: col.y, l: col.l, o: col.o, W: col.W };
    const body = sprite(BIRD_BODY, pal, 2);
    const wing = sprite(WING, pal, 2);
    const wingDown = sprite(WING.slice().reverse(), pal, 2);
    return [4, 10, 12].map((wy, f) => {
      const c = document.createElement('canvas');
      c.width = 34; c.height = 24;
      const g = c.getContext('2d');
      g.drawImage(body, 0, 0);
      g.drawImage(f === 2 ? wingDown : wing, 0, f === 0 ? 6 : wy);
      return c;
    });
  }
  const birdSets = BIRDS.map(birdFrames);

  // 5x7 pixel font for words and numbers
  const FONT = {
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
    X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
    '!': ['1', '1', '1', '1', '1', '0', '1'],
    0: ['01110', '11011', '11011', '11011', '11011', '11011', '01110'],
    1: ['00110', '01110', '00110', '00110', '00110', '00110', '00110'],
    2: ['01110', '11011', '00011', '00110', '01100', '11000', '11111'],
    3: ['11110', '00011', '00011', '01110', '00011', '00011', '11110'],
    4: ['00110', '01110', '11110', '10110', '11111', '00110', '00110'],
    5: ['11111', '11000', '11110', '00011', '00011', '11011', '01110'],
    6: ['01110', '11000', '11000', '11110', '11011', '11011', '01110'],
    7: ['11111', '00011', '00011', '00110', '00110', '01100', '01100'],
    8: ['01110', '11011', '11011', '01110', '11011', '11011', '01110'],
    9: ['01110', '11011', '11011', '01111', '00011', '00011', '01110'],
    ' ': ['000', '000', '000', '000', '000', '000', '000'],
    J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    '.': ['0', '0', '0', '0', '0', '0', '1'],
    ':': ['0', '0', '1', '0', '0', '1', '0'],
    '-': ['000', '000', '000', '111', '000', '000', '000'],
    '#': ['01010', '11111', '01010', '01010', '11111', '01010', '00000'],
    // lowercase: x-height rows 2-6, descenders on rows 7-8 like the original logo font
    a: ['00000', '00000', '01110', '00001', '01111', '10001', '01111', '00000', '00000'],
    b: ['10000', '10000', '11110', '10001', '10001', '10001', '11110', '00000', '00000'],
    c: ['00000', '00000', '01111', '10000', '10000', '10000', '01111', '00000', '00000'],
    d: ['00001', '00001', '01111', '10001', '10001', '10001', '01111', '00000', '00000'],
    e: ['00000', '00000', '01110', '10001', '11111', '10000', '01111', '00000', '00000'],
    f: ['0011', '0100', '1111', '0100', '0100', '0100', '0100', '0000', '0000'],
    g: ['00000', '00000', '01111', '10001', '10001', '10001', '01111', '00001', '01110'],
    h: ['10000', '10000', '11110', '10001', '10001', '10001', '10001', '00000', '00000'],
    i: ['1', '0', '1', '1', '1', '1', '1', '0', '0'],
    j: ['001', '000', '001', '001', '001', '001', '001', '101', '010'],
    k: ['1000', '1000', '1001', '1010', '1100', '1010', '1001', '0000', '0000'],
    l: ['10', '10', '10', '10', '10', '10', '01', '00', '00'],
    m: ['00000', '00000', '11010', '10101', '10101', '10101', '10101', '00000', '00000'],
    n: ['00000', '00000', '10110', '11001', '10001', '10001', '10001', '00000', '00000'],
    o: ['00000', '00000', '01110', '10001', '10001', '10001', '01110', '00000', '00000'],
    p: ['00000', '00000', '11110', '10001', '10001', '10001', '11110', '10000', '10000'],
    q: ['00000', '00000', '01111', '10001', '10001', '10001', '01111', '00001', '00001'],
    r: ['0000', '0000', '1011', '1100', '1000', '1000', '1000', '0000', '0000'],
    s: ['00000', '00000', '01111', '10000', '01110', '00001', '11110', '00000', '00000'],
    t: ['0100', '0100', '1111', '0100', '0100', '0100', '0011', '0000', '0000'],
    u: ['00000', '00000', '10001', '10001', '10001', '10011', '01101', '00000', '00000'],
    v: ['00000', '00000', '10001', '10001', '10001', '01010', '00100', '00000', '00000'],
    w: ['00000', '00000', '10001', '10001', '10101', '10101', '01010', '00000', '00000'],
    x: ['00000', '00000', '10001', '01010', '00100', '01010', '10001', '00000', '00000'],
    y: ['00000', '00000', '10001', '10001', '10001', '10001', '01111', '00001', '01110'],
    z: ['00000', '00000', '11111', '00010', '00100', '01000', '11111', '00000', '00000'],
  };
  for (const k in FONT) while (FONT[k].length < 9) FONT[k].push('0'.repeat(FONT[k][0].length));
  function textWidth(str, s) {
    let w = 0;
    for (const ch of str) w += ((FONT[ch] || FONT[' '])[0].length + 1) * s;
    return w - s;
  }
  // layered outline text: dark outline, optional white rim, then fill
  function pixText(str, cx, y, s, fill, opts) {
    opts = opts || {};
    const w = textWidth(str, s);
    let px = Math.round(opts.left ? cx : cx - w / 2);
    const layers = [];
    if (opts.rim) layers.push([K, s + opts.rim], ['#ffffff', opts.rim]);
    else layers.push([K, opts.out != null ? opts.out : Math.max(1, s / 2)]);
    layers.push([fill, 0]);
    for (const [col, o] of layers) {
      let cx2 = px;
      x.fillStyle = col;
      for (const ch of str) {
        const g = FONT[ch] || FONT[' '];
        for (let j = 0; j < g.length; j++) for (let i = 0; i < g[j].length; i++) {
          if (g[j][i] !== '1') continue;
          x.fillRect(cx2 + i * s - o, y + j * s - o, s + o * 2, s + o * 2);
        }
        cx2 += (g[0].length + 1) * s;
      }
      if (opts.shade && col === fill) {
        // darker lower half like the original logo lettering
        x.fillStyle = opts.shade;
        let c3 = px;
        for (const ch of str) {
          const g = FONT[ch] || FONT[' '];
          for (let j = 4; j < g.length; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === '1') x.fillRect(c3 + i * s, y + j * s, s, s);
          c3 += (g[0].length + 1) * s;
        }
      }
    }
    return w;
  }

  // ---------- backgrounds ----------
  const THEMES = {
    day: { sky: '#4ec0ca', cloud: '#e9fcd9', cloudEdge: '#c3ecd4', city: '#d7f0c8', cityEdge: '#a8dcb8', win: '#bfe6c8', bush: '#5ee270', bushEdge: '#4bc55f' },
    night: { sky: '#008793', cloud: '#21707c', cloudEdge: '#1a5f6a', city: '#0f5e6e', cityEdge: '#0a4a57', win: '#f1e05a', bush: '#1f9e4c', bushEdge: '#16803c' },
  };
  function makeBackground(th) {
    // drawn on the 144x256 art grid, then doubled, so every edge is a hard
    // 2x2 pixel like the original sprite sheet
    const aw = W / 2, ah = H / 2, gy = GROUND_Y / 2;
    const a = document.createElement('canvas');
    a.width = aw; a.height = ah;
    const g = a.getContext('2d');
    const disc = (cx, cy, r, col) => {
      g.fillStyle = col;
      for (let j = -r; j <= r; j++) { const w = Math.floor(Math.sqrt(r * r - j * j) + 0.35); g.fillRect(cx - w, cy + j, w * 2 + 1, 1); }
    };
    g.fillStyle = th.sky; g.fillRect(0, 0, aw, ah);
    // clouds: overlapping puffs with a darker rim on top, flat bottom band
    const puffs = [[2, 166, 12], [18, 161, 11], [33, 166, 12], [49, 158, 14], [68, 165, 11], [84, 160, 13], [102, 166, 11], [118, 158, 14], [136, 164, 12], [150, 165, 12]];
    for (const [cx, cy, r] of puffs) disc(cx, cy - 1, r + 1, th.cloudEdge);
    for (const [cx, cy, r] of puffs) disc(cx, cy, r, th.cloud);
    g.fillStyle = th.cloud; g.fillRect(0, 166, aw, gy - 166);
    // city skyline with windows
    const blds = [[0, 176, 11], [10, 171, 9], [18, 179, 8], [25, 168, 12], [36, 175, 9], [44, 172, 11], [54, 179, 7], [60, 170, 10], [69, 176, 9], [77, 167, 13], [89, 174, 9], [97, 178, 8], [104, 170, 11], [114, 175, 9], [122, 169, 11], [132, 176, 12]];
    for (const [bx, by, bw] of blds) {
      g.fillStyle = th.cityEdge; g.fillRect(bx, by - 1, bw, gy - by + 1);
      g.fillStyle = th.city; g.fillRect(bx + 1, by, bw - 2, gy - by);
      g.fillStyle = th.win;
      for (let wy = by + 2; wy < 192; wy += 3) for (let wx = bx + 2; wx < bx + bw - 2; wx += 2) if ((wx * 7 + wy * 3) % 4) g.fillRect(wx, wy, 1, 1);
    }
    // bushes along the ground
    const bush = [[0, 190, 8], [11, 188, 9], [22, 191, 7], [32, 187, 10], [45, 190, 8], [56, 188, 9], [68, 191, 7], [78, 187, 10], [91, 190, 8], [102, 188, 9], [114, 191, 7], [124, 187, 10], [137, 190, 8], [148, 189, 8]];
    for (const [cx, cy, r] of bush) disc(cx, cy - 1, r + 1, th.bushEdge);
    for (const [cx, cy, r] of bush) disc(cx, cy, r, th.bush);
    g.fillStyle = th.bush; g.fillRect(0, 192, aw, gy - 192);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const cg = c.getContext('2d');
    cg.imageSmoothingEnabled = false;
    cg.drawImage(a, 0, 0, W, H);
    return c;
  }
  const backgrounds = { day: makeBackground(THEMES.day), night: makeBackground(THEMES.night) };

  // ground strip, wider than the screen so it can scroll
  const ground = (() => {
    const c = document.createElement('canvas');
    c.width = W + 24; c.height = H - GROUND_Y;
    const g = c.getContext('2d');
    g.fillStyle = '#ded895'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = K; g.fillRect(0, 0, c.width, 2);
    g.fillStyle = '#e4fd8b'; g.fillRect(0, 2, c.width, 2);
    for (let i = -12; i < c.width; i += 12) {
      g.fillStyle = '#9ce659';
      g.beginPath(); g.moveTo(i, 4); g.lineTo(i + 6, 4); g.lineTo(i + 12, 14); g.lineTo(i + 6, 14); g.closePath(); g.fill();
      g.fillStyle = '#73bf2e';
      g.beginPath(); g.moveTo(i + 6, 4); g.lineTo(i + 12, 4); g.lineTo(i + 18, 14); g.lineTo(i + 12, 14); g.closePath(); g.fill();
    }
    g.fillStyle = '#558022'; g.fillRect(0, 14, c.width, 2);
    g.fillStyle = '#d7a84c'; g.fillRect(0, 16, c.width, 2);
    g.fillStyle = '#e8e2a4'; g.fillRect(0, 18, c.width, 3);
    return c;
  })();

  // pipe pieces (2x art pixels): body column shading and a wider cap
  function pipeBody(h) {
    const cols = [K, '#e4fd8b', '#9ce659', '#9ce659', '#73bf2e', '#73bf2e', '#e4fd8b', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#5fa62a', '#73bf2e', '#5fa62a', '#558022', '#558022', '#558022', '#4a7020', K];
    const c = document.createElement('canvas');
    c.width = cols.length * 2; c.height = h;
    const g = c.getContext('2d');
    cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(i * 2, 0, 2, h); });
    return c;
  }
  const PIPE_BODY = pipeBody(512);
  const PIPE_CAP = (() => {
    const cols = [K, '#e4fd8b', '#9ce659', '#9ce659', '#9ce659', '#73bf2e', '#e4fd8b', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#73bf2e', '#5fa62a', '#73bf2e', '#5fa62a', '#558022', '#558022', '#558022', '#4a7020', '#4a7020', K];
    const c = document.createElement('canvas');
    c.width = cols.length * 2; c.height = 24;
    const g = c.getContext('2d');
    cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(i * 2, 0, 2, 24); });
    g.fillStyle = K; g.fillRect(0, 0, c.width, 2); g.fillRect(0, 22, c.width, 2);
    return c;
  })();
  function drawPipe(px, gapTop, GAP) {
    const bodyX = px + 2;
    // top pipe
    x.drawImage(PIPE_BODY, 0, 0, 48, gapTop - 24, bodyX, 0, 48, gapTop - 24);
    x.drawImage(PIPE_CAP, px, gapTop - 24);
    // bottom pipe
    const by = gapTop + GAP;
    x.drawImage(PIPE_CAP, px, by);
    x.drawImage(PIPE_BODY, 0, 0, 48, GROUND_Y - by - 24, bodyX, by + 24, 48, GROUND_Y - by - 24);
  }

  // ---------- sound ----------
  let actx = null;
  const sfx = {
    unlock() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } } else if (actx.state === 'suspended') actx.resume(); },
    play(n) {
      if (!actx || muted) return;
      const t = actx.currentTime;
      if (n === 'wing') { noise(t, 0.09, 1400, 0.25, 'bandpass', 3000); }
      if (n === 'point') { tone(t, 980, 0.09, 'sine', 0.22); tone(t + 0.09, 1310, 0.22, 'sine', 0.22); }
      if (n === 'hit') { noise(t, 0.14, 500, 0.6, 'lowpass'); tone(t, 140, 0.12, 'square', 0.15, 60); }
      if (n === 'die') { tone(t, 700, 0.45, 'sine', 0.18, 120); }
      if (n === 'swoosh') { noise(t, 0.3, 900, 0.18, 'bandpass', 2600); }
    },
  };
  function tone(t0, f, dur, type, vol, f2) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  let nb = null;
  function noise(t0, dur, f, vol, type, f2) {
    if (!nb) { nb = actx.createBuffer(1, actx.sampleRate * 0.5, actx.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = actx.createBufferSource(); s.buffer = nb;
    const fl = actx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t0); fl.Q.value = 1.4;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = actx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(actx.destination); s.start(t0); s.stop(t0 + dur + 0.02);
  }

  // ---------- state ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('flappy:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('flappy:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  let best = store.get('best', 0);
  let muted = store.get('muted', false);
  let state = 'title';          // title | ready | play | dying | over
  let theme = 'day', birdSet = 0;
  const bird = { x: 0, y: 0, vy: 0, rot: 0, frame: 0, ft: 0, bob: 0 };
  let pipes = [], score = 0, groundX = 0, t = 0;
  let flash = 0, fade = 0, fadeTo = null, overT = 0, shownScore = 0, newBest = false, paused = false;
  let sparkle = { t: 0, x: 0, y: 0 };
  let level = -1, spawned = 0, clearT = 0;
  let unlocked = store.get('unlocked', 1);           // levels you can play
  const levelBest = store.get('levelBest', {});
  let top = store.get('top', []);                    // local top ten, standing in for the original leaderboard

  function newRun(lv) {
    level = lv == null ? -1 : lv;
    cfg = level >= 0 ? LEVELS[level] : CLASSIC;
    SPEED = cfg.speed; GAP = cfg.gap; PIPE_SPACING = cfg.spacing;
    spawned = 0; clearT = 0;
    theme = level >= 0 ? (cfg.night ? 'night' : 'day') : Math.random() < 0.5 ? 'day' : 'night';
    birdSet = Math.floor(Math.random() * 3);
    bird.x = 80; bird.y = 236; bird.vy = 0; bird.rot = 0; bird.bob = 0;
    pipes = []; score = 0; shownScore = 0; newBest = false; flash = 0; overT = 0; paused = false;
    state = 'ready';
  }
  function transition(fn) { fade = 0.0001; fadeTo = fn; sfx.play('swoosh'); }

  function flap() {
    if (paused) return;
    sfx.unlock();
    if (state === 'ready') { state = 'play'; spawnPipe(W + 80); }
    if (state !== 'play') return;
    bird.vy = FLAP;
    bird.rot = -25;
    sfx.play('wing');
  }
  function spawnPipe(px) {
    if (cfg.target && spawned >= cfg.target) return;
    spawned++;
    const lo = 60, hi = GROUND_Y - GAP - 60;
    let gapTop = lo + Math.floor(Math.random() * (hi - lo));
    // in levels, keep each jump between pipes climbable at that speed
    const prev = pipes[pipes.length - 1];
    if (cfg.target && prev) {
      // the slide on moving levels adds up to 2x its range, so budget for it
      const maxD = Math.max(24, Math.min(200, (PIPE_SPACING / SPEED) * 120) - cfg.move * 1.5);
      gapTop = Math.max(lo, Math.min(hi, prev.base + (Math.random() * 2 - 1) * maxD));
    }
    pipes.push({ x: px, gapTop, base: gapTop, gap: GAP, ph: Math.random() * 6.28, scored: false });
  }
  function die(hitPipe) {
    if (state !== 'play') return;
    state = 'dying';
    flash = 1;
    sfx.play('hit');
    if (hitPipe) setTimeout(() => sfx.play('die'), 250);
    if (level < 0 && score > best) { best = score; newBest = true; store.set('best', best); }
    if (level < 0 && score > 0) {
      const d = new Date();
      top.push({ s: score, d: `${d.getDate()}/${d.getMonth() + 1}` });
      top.sort((p, q) => q.s - p.s); top = top.slice(0, 10); store.set('top', top);
    }
    if (level >= 0 && score > (levelBest[level] || 0)) { levelBest[level] = score; store.set('levelBest', levelBest); }
    const games = store.get('games', 0) + 1; store.set('games', games);
  }

  // ---------- update ----------
  function update(dt) {
    t += dt;
    if (fade > 0) {
      fade += dt * 4;
      if (fade >= 1 && fadeTo) { const f = fadeTo; fadeTo = null; f(); }
      if (fade >= 2) fade = 0;
    }
    if (flash > 0) flash = Math.max(0, flash - dt * 5);
    if (paused) return;
    const scrolling = state === 'title' || state === 'ready' || state === 'play' || state === 'levels' || state === 'scores' || state === 'clear';
    if (scrolling) groundX = (groundX + SPEED * dt) % 12;
    // wing flaps
    const flapRate = state === 'play' ? 12 : 8;
    if (state !== 'dying' && state !== 'over' && !(state === 'play' && bird.rot >= 80)) {
      bird.ft += dt * flapRate;
      bird.frame = [0, 1, 2, 1][Math.floor(bird.ft) % 4];
    }
    if (state === 'clear') {
      clearT += dt;
      bird.bob += dt * 7; bird.vy = 0; bird.rot = 0;
      bird.y += (236 + Math.sin(bird.bob) * 4 - bird.y) * Math.min(1, dt * 3);
      for (const p of pipes) p.x -= SPEED * dt;
      return;
    }
    if (state === 'levels' || state === 'scores') return;
    if (state === 'title' || state === 'ready') {
      bird.bob += dt * 7;
      bird.y = (state === 'title' ? 196 : 236) + Math.sin(bird.bob) * 4;
      bird.rot = 0;
      return;
    }
    if (state === 'play' || state === 'dying') {
      bird.vy = Math.min(MAX_FALL, bird.vy + GRAVITY * dt);
      bird.y += bird.vy * dt;
      if (bird.vy >= 4 * 60 || state === 'dying') bird.rot = Math.min(90, bird.rot + 600 * dt);
      else if (bird.vy < 0) bird.rot = -25;
      if (bird.y < -30) { bird.y = -30; bird.vy = 0; }
    }
    if (state === 'play') {
      for (const p of pipes) {
        p.x -= SPEED * dt;
        // moving pipes slide while they approach, then lock before the bird
        // reaches them so the hard levels stay fair
        if (cfg.move && p.x > bird.x + 110) p.gapTop = Math.max(40, Math.min(GROUND_Y - p.gap - 40, p.base + Math.sin(t * 1.6 + p.ph) * cfg.move));
      }
      if (pipes.length && pipes[0].x < -PIPE_W) pipes.shift();
      const last = pipes[pipes.length - 1];
      if (last && last.x < W + 20 - PIPE_SPACING + PIPE_W) spawnPipe(last.x + PIPE_SPACING);
      // scoring and collisions (hitbox a touch smaller than the sprite, as in the original)
      const r = 11;
      for (const p of pipes) {
        if (!p.scored && bird.x > p.x + PIPE_W / 2) {
          p.scored = true; score++; sfx.play('point');
          if (cfg.target && score >= cfg.target) {
            state = 'clear'; clearT = 0;
            if (score > (levelBest[level] || 0)) { levelBest[level] = score; store.set('levelBest', levelBest); }
            if (level + 2 > unlocked) { unlocked = Math.min(LEVELS.length, level + 2); store.set('unlocked', unlocked); }
            const done = store.get('cleared', []); if (!done.includes(level)) { done.push(level); store.set('cleared', done); }
            return;
          }
        }
        const inX = bird.x + r > p.x + 2 && bird.x - r < p.x + PIPE_W - 2;
        if (inX && (bird.y - r < p.gapTop || bird.y + r > p.gapTop + p.gap)) {
          // circle vs the two rectangles for a fair corner test
          const hit = rectHit(bird.x, bird.y, r, p.x, -100, PIPE_W, p.gapTop + 100) || rectHit(bird.x, bird.y, r, p.x, p.gapTop + p.gap, PIPE_W, GROUND_Y);
          if (hit) { die(true); break; }
        }
      }
    }
    if ((state === 'play' || state === 'dying') && bird.y + 12 >= GROUND_Y) {
      bird.y = GROUND_Y - 12;
      if (state === 'play') die(false);
      state = 'over';
      overT = 0;
      bird.rot = 90;
    }
    if (state === 'over') {
      overT += dt;
      if (overT > 0.9 && shownScore < score) shownScore = Math.min(score, shownScore + Math.max(1, Math.ceil(score / 30)));
      sparkle.t += dt;
      if (sparkle.t > 0.5) { sparkle.t = 0; sparkle.x = Math.random() * 22 - 11; sparkle.y = Math.random() * 22 - 11; }
    }
  }
  function rectHit(cx, cy, r, rx, ry, rw, rh) {
    const nx = Math.max(rx, Math.min(cx, rx + rw)), ny = Math.max(ry, Math.min(cy, ry + rh));
    return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
  }

  // ---------- draw ----------
  const BTN = {
    play: { x: 30, y: 340, w: 104, h: 58 },
    score: { x: 154, y: 340, w: 104, h: 58 },
    levels: { x: 92, y: 278, w: 104, h: 44 },
    pause: { x: 10, y: 10, w: 26, h: 28 },
    sound: { x: 252, y: 10, w: 26, h: 28 },
  };
  function button(b, kind) {
    x.fillStyle = K; x.fillRect(b.x, b.y + 2, b.w, b.h - 2); x.fillRect(b.x + 2, b.y, b.w - 4, b.h);
    x.fillStyle = '#ffffff'; x.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 6);
    x.fillStyle = '#e86a17'; x.fillRect(b.x + 2, b.y + b.h - 6, b.w - 4, 2);
    x.fillStyle = '#ffffff'; x.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 12);
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2 - 2;
    if (kind === 'play') {
      x.fillStyle = '#5ac54f';
      for (let i = 0; i < 14; i++) x.fillRect(cx - 8 + i, cy - 13 + i, 2, 26 - i * 2);
      x.fillStyle = K;
      for (let i = 0; i < 14; i++) { x.fillRect(cx - 10 + i, cy - 15 + i, 2, 2); x.fillRect(cx - 10 + i, cy + 13 - i, 2, 2); }
      x.fillRect(cx - 10, cy - 13, 2, 26);
    } else if (kind === 'score') {
      x.fillStyle = K; x.fillRect(cx - 16, cy + 8, 32, 4);
      x.fillStyle = '#f9a72b'; x.fillRect(cx - 14, cy - 2, 8, 10); x.fillStyle = '#ffffff'; x.fillRect(cx - 4, cy - 12, 8, 20); x.fillStyle = '#e86a17'; x.fillRect(cx + 6, cy + 2, 8, 6);
      x.fillStyle = K; x.strokeStyle = K; x.lineWidth = 2; x.strokeRect(cx - 14, cy - 2, 8, 10); x.strokeRect(cx - 4, cy - 12, 8, 20); x.strokeRect(cx + 6, cy + 2, 8, 6);
    } else if (kind === 'levels') {
      pixText('LEVELS', cx, cy - 7, 2, '#f9a72b', { out: 1 });
    } else if (kind === 'next') {
      pixText('NEXT', cx, cy - 7, 2, '#5ac54f', { out: 1 });
    } else if (kind === 'menu') {
      pixText('MENU', cx, cy - 7, 2, '#f9a72b', { out: 1 });
    } else if (kind === 'ok') {
      pixText('OK', cx, cy - 7, 2, '#f9a72b', { out: 1 });
    }
  }
  function smallButton(b, kind) {
    x.fillStyle = K; x.fillRect(b.x, b.y, b.w, b.h);
    x.fillStyle = '#f9a72b'; x.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
    x.fillStyle = '#ffffff';
    if (kind === 'pause') { if (paused) { for (let i = 0; i < 8; i++) x.fillRect(b.x + 9 + i, b.y + 6 + i, 1, 16 - i * 2); } else { x.fillRect(b.x + 8, b.y + 7, 4, 14); x.fillRect(b.x + 15, b.y + 7, 4, 14); } }
    if (kind === 'sound') {
      x.fillRect(b.x + 6, b.y + 11, 4, 6); x.fillRect(b.x + 10, b.y + 8, 3, 12);
      if (muted) { x.fillStyle = K; for (let i = 0; i < 8; i++) { x.fillRect(b.x + 14 + i, b.y + 9 + i, 2, 2); x.fillRect(b.x + 21 - i, b.y + 9 + i, 2, 2); } }
      else { x.fillRect(b.x + 16, b.y + 10, 2, 8); x.fillRect(b.x + 19, b.y + 8, 2, 12); }
    }
  }
  function drawBird() {
    const fr = birdSets[birdSet][bird.frame];
    x.save();
    x.translate(Math.round(bird.x), Math.round(bird.y));
    x.rotate((bird.rot * Math.PI) / 180);
    x.drawImage(fr, -17, -12);
    x.restore();
  }
  function pdisc(cx, cy, r, col) {
    x.fillStyle = col;
    for (let j = -r; j <= r; j += 2) { const w = Math.floor(Math.sqrt(r * r - j * j) / 2) * 2; x.fillRect(cx - w, cy + j, w * 2, 2); }
  }
  function drawScore(n, cx, y, s) { pixText(String(n), cx, y, s, '#ffffff', { out: s >= 4 ? 2 : 1 }); }
  function panel(px, py) {
    const w = 226, h = 116;
    x.fillStyle = K; x.fillRect(px + 2, py, w - 4, h); x.fillRect(px, py + 2, w, h - 4);
    x.fillStyle = '#ded895'; x.fillRect(px + 2, py + 2, w - 4, h - 4);
    x.fillStyle = '#cbb968'; x.fillRect(px + 4, py + h - 6, w - 8, 2);
    x.fillStyle = '#f2ebb0'; x.fillRect(px + 4, py + 4, w - 8, 2);
    pixText('MEDAL', px + 46, py + 12, 1, '#e86a17', { out: 0 });
    pixText('SCORE', px + w - 40, py + 12, 1, '#e86a17', { out: 0 });
    pixText(level >= 0 ? 'GOAL' : 'BEST', px + w - 34, py + 60, 1, '#e86a17', { out: 0 });
    // medal slot
    pdisc(px + 46, py + 64, 24, '#e4dba0');
    const medal = score >= 40 ? ['#e7f4f9', '#b4d6e2'] : score >= 30 ? ['#fcdb4a', '#d8a61b'] : score >= 20 ? ['#e0e0e0', '#a8a8a8'] : score >= 10 ? ['#e8a35c', '#a8673a'] : null;
    if (medal && overT > 1.2) {
      pdisc(px + 46, py + 64, 24, K);
      pdisc(px + 46, py + 64, 22, medal[1]);
      pdisc(px + 44, py + 62, 18, medal[0]);
      // little bird face on the medal
      x.fillStyle = medal[1]; x.fillRect(px + 38, py + 56, 14, 14); x.fillStyle = medal[0]; x.fillRect(px + 40, py + 58, 10, 10);
      x.fillStyle = '#fff'; x.fillRect(px + 46, py + 59, 4, 4);
      // sparkle
      const sx = px + 46 + sparkle.x, sy = py + 64 + sparkle.y, k = sparkle.t < 0.25 ? sparkle.t * 4 : (0.5 - sparkle.t) * 4;
      x.fillStyle = '#ffffff';
      x.fillRect(sx - 1, sy - 4 * k, 2, 8 * k); x.fillRect(sx - 4 * k, sy - 1, 8 * k, 2);
    }
    drawScore(shownScore, px + w - 40, py + 28, 2);
    drawScore(level >= 0 ? cfg.target : best, px + w - 40, py + 76, 2);
    if (newBest && overT > 1.2) {
      x.fillStyle = '#ff3a3a'; x.fillRect(px + w - 106, py + 64, 28, 12);
      pixText('NEW', px + w - 92, py + 66, 1, '#ffffff', { out: 0 });
    }
  }
  const LBTN = LEVELS.map((_, i) => ({ x: i % 2 ? 150 : 26, y: 120 + Math.floor(i / 2) * 54, w: 112, h: 46 }));
  const BACK = { x: 94, y: 410, w: 100, h: 40 };
  function drawLevels() {
    pixText('Levels', W / 2, 56, 4, '#fdd13a', { rim: 2, shade: '#f9a72b' });
    const done = store.get('cleared', []);
    LEVELS.forEach((lv, i) => {
      const b = LBTN[i], open = i < unlocked;
      x.fillStyle = K; x.fillRect(b.x, b.y + 2, b.w, b.h - 2); x.fillRect(b.x + 2, b.y, b.w - 4, b.h);
      x.fillStyle = open ? '#ffffff' : '#9c9c9c'; x.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
      // difficulty stripe from green to red
      const hue = 120 - (i / (LEVELS.length - 1)) * 120;
      x.fillStyle = open ? `hsl(${hue},75%,50%)` : '#6f6f6f'; x.fillRect(b.x + 2, b.y + 2, 6, b.h - 4);
      pixText(String(i + 1), b.x + 29, b.y + 8, 3, open ? '#ffffff' : '#cfcfcf', { out: 1 });
      pixText(open ? lv.n : 'LOCKED', b.x + 52, b.y + 10, 1, open ? '#e86a17' : '#555555', { out: 0, left: true });
      if (open) pixText('GOAL ' + lv.target, b.x + 52, b.y + 22, 1, '#543847', { out: 0, left: true });
      if (done.includes(i)) { x.fillStyle = '#fdd13a'; x.fillRect(b.x + b.w - 14, b.y + 30, 8, 8); x.fillStyle = K; x.fillRect(b.x + b.w - 14, b.y + 38, 8, 2); }
      else if (open && levelBest[i]) pixText('BEST ' + levelBest[i], b.x + 52, b.y + 33, 1, '#888888', { out: 0, left: true });
    });
    button(BACK, 'menu');
  }
  function drawScores() {
    pixText('Top Scores', W / 2, 56, 3, '#fdd13a', { rim: 2, shade: '#f9a72b' });
    const px = 31, py = 104, w = 226, h = 280;
    x.fillStyle = K; x.fillRect(px + 2, py, w - 4, h); x.fillRect(px, py + 2, w, h - 4);
    x.fillStyle = '#ded895'; x.fillRect(px + 2, py + 2, w - 4, h - 4);
    x.fillStyle = '#f2ebb0'; x.fillRect(px + 4, py + 4, w - 8, 2);
    if (!top.length) pixText('No scores yet', W / 2, py + 120, 2, '#e86a17', { out: 0 });
    top.forEach((e, i) => {
      const y = py + 14 + i * 26;
      const col = i === 0 ? '#fdd13a' : i === 1 ? '#e0e0e0' : i === 2 ? '#e8a35c' : '#ffffff';
      pixText('#' + (i + 1), px + 16, y, 2, col, { out: 1, left: true });
      pixText(String(e.s), px + 120, y, 2, '#ffffff', { out: 1 });
      pixText(e.d, px + w - 16 - textWidth(e.d, 1), y + 4, 1, '#543847', { out: 0, left: true });
    });
    pixText('Games ' + store.get('games', 0), W / 2, py + h + 8, 1, '#ffffff', { out: 1 });
    button(BACK, 'menu');
  }
  function drawTapHint(cx, cy) {
    // the "tap" hand from the Get Ready screen
    x.fillStyle = '#ffffff'; x.globalAlpha = 0.85;
    x.fillRect(cx - 2, cy - 30, 4, 10);
    for (let i = 0; i < 6; i++) { x.fillRect(cx - 18 + i * 2, cy - 30 + i * 2, 2, 2); x.fillRect(cx + 16 - i * 2, cy - 30 + i * 2, 2, 2); }
    x.globalAlpha = 1;
    x.fillStyle = K; x.fillRect(cx - 9, cy - 8, 18, 30); x.fillRect(cx - 3, cy - 18, 6, 12);
    x.fillStyle = '#ffffff'; x.fillRect(cx - 7, cy - 6, 14, 26); x.fillRect(cx - 1, cy - 16, 2, 12);
    x.fillStyle = '#f9a72b'; x.fillRect(cx - 7, cy + 14, 14, 6);
    pixText('TAP', cx - 40, cy - 2, 2, '#e86a17', { out: 1 });
    pixText('TAP', cx + 40, cy - 2, 2, '#e86a17', { out: 1 });
  }
  function draw() {
    x.drawImage(backgrounds[theme], 0, 0);
    for (const p of pipes) drawPipe(Math.round(p.x), Math.round(p.gapTop), p.gap);
    x.drawImage(ground, -Math.floor(groundX), GROUND_Y);
    if (state === 'levels') { drawLevels(); }
    else if (state === 'scores') { drawScores(); }
    else if (state === 'title') {
      pixText('FlappyBird', W / 2, 104, 4, '#fdd13a', { rim: 2, shade: '#f9a72b' });
      pixText('replica', W / 2, 152, 2, '#ffffff', { out: 1 });
      bird.x = W / 2;
      drawBird();
      button(BTN.levels, 'levels');
      button(BTN.play, 'play');
      button(BTN.score, 'score');
      pixText('BEST ' + best, W / 2, 430, 2, '#ffffff', { out: 1 });
    } else {
      if (state === 'ready') {
        pixText('Get Ready!', W / 2, 118, 4, '#79d34a', { rim: 2, shade: '#4fb83a' });
        drawTapHint(W / 2 + 20, 270);
      }
      drawBird();
      if (state === 'play' || state === 'ready' || state === 'dying' || state === 'clear') {
        drawScore(score, W / 2, 50, 4);
        if (level >= 0) {
          pixText('LEVEL ' + (level + 1) + '  GOAL ' + cfg.target, W / 2, 92, 1, '#ffffff', { out: 1 });
          x.fillStyle = K; x.fillRect(W / 2 - 52, 104, 104, 8);
          x.fillStyle = '#5ac54f'; x.fillRect(W / 2 - 50, 106, Math.round(100 * Math.min(1, score / cfg.target)), 4);
        }
      }
      if (state === 'clear') {
        pixText('Level Clear!', W / 2, 146, 3, '#79d34a', { rim: 2, shade: '#4fb83a' });
        if (clearT > 0.6) {
          pixText(cfg.n, W / 2, 196, 2, '#ffffff', { out: 1 });
          if (level < LEVELS.length - 1) button(BTN.play, 'next'); else pixText('ALL CLEAR!', W / 2 - 64, 362, 2, '#fdd13a', { out: 1 });
          button(BTN.score, 'menu');
        }
      }
      if (state === 'play') smallButton(BTN.pause, 'pause');
      if (state === 'over') {
        const slide = Math.min(1, Math.max(0, (overT - 0.3) / 0.35));
        // "Game Over" drops in with a small bounce, as in the original
        if (overT > 0.15) { const k = Math.min(1, (overT - 0.15) / 0.25); pixText('Game Over', W / 2, 118 - Math.round(Math.sin(k * Math.PI) * 10), 4, '#f9a72b', { rim: 2, shade: '#e86a17' }); }
        panel(31, 190 + (1 - slide) * 340);
        if (overT > 0.9) { button(BTN.play, 'play'); button(BTN.score, 'menu'); }
        if (level >= 0 && overT > 0.5) pixText('LEVEL ' + (level + 1) + ' ' + cfg.n + '  ' + score + '/' + cfg.target, W / 2, 172, 1, '#ffffff', { out: 1 });
      }
      if (paused) { x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, 0, W, H); pixText('Paused', W / 2, 220, 3, '#ffffff', { out: 2 }); }
    }
    smallButton(BTN.sound, 'sound');
    if (flash > 0) { x.fillStyle = `rgba(255,255,255,${flash})`; x.fillRect(0, 0, W, H); }
    if (fade > 0) { x.fillStyle = `rgba(0,0,0,${fade < 1 ? fade : 2 - fade})`; x.fillRect(0, 0, W, H); }
  }

  // ---------- layout ----------
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    let s = Math.min(vw / W, vh / H);
    if (s >= 1) s = Math.floor(s * dpr) / dpr || s; // whole device pixels when we can
    const cw = Math.round(W * s), ch = Math.round(H * s);
    screen.style.width = cw + 'px'; screen.style.height = ch + 'px';
    screen.width = Math.round(cw * dpr); screen.height = Math.round(ch * dpr);
    sctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', fit);
  fit();

  // ---------- input ----------
  function toLogical(e) {
    const r = screen.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }
  const inBtn = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  function press(p) {
    sfx.unlock();
    if (p && inBtn(p, BTN.sound)) { muted = !muted; store.set('muted', muted); return; }
    if (fade > 0) return;
    if (state === 'title') {
      if (!p || inBtn(p, BTN.play)) transition(() => newRun());
      else if (inBtn(p, BTN.levels)) transition(() => { state = 'levels'; pipes = []; });
      else if (inBtn(p, BTN.score)) transition(() => { state = 'scores'; pipes = []; });
      return;
    }
    if (state === 'scores') {
      if (!p || inBtn(p, BACK)) transition(() => { state = 'title'; });
      return;
    }
    if (state === 'levels') {
      if (!p) return;
      if (inBtn(p, BACK)) { transition(() => { state = 'title'; }); return; }
      LBTN.forEach((b, i) => { if (inBtn(p, b) && i < unlocked) transition(() => newRun(i)); });
      return;
    }
    if (state === 'clear') {
      if (clearT < 0.6) return;
      if ((!p || inBtn(p, BTN.play)) && level < LEVELS.length - 1) { const n = level + 1; transition(() => newRun(n)); }
      else if (p && inBtn(p, BTN.score)) transition(() => { state = 'levels'; pipes = []; bird.rot = 0; });
      return;
    }
    if (state === 'play' && p && inBtn(p, BTN.pause)) { paused = !paused; return; }
    if (paused) { paused = false; return; }
    if (state === 'over') {
      if (overT < 0.9) return;
      if (!p || inBtn(p, BTN.play)) { const lv = level; transition(() => newRun(lv >= 0 ? lv : null)); }
      else if (inBtn(p, BTN.score)) transition(() => { state = level >= 0 ? 'levels' : 'title'; pipes = []; bird.rot = 0; });
      return;
    }
    flap();
  }
  screen.addEventListener('pointerdown', (e) => { e.preventDefault(); press(toLogical(e)); });
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Enter') { e.preventDefault(); press(null); }
    if (e.code === 'KeyP' || e.code === 'Escape') { if (state === 'play') paused = !paused; }
    if (e.code === 'KeyM') { muted = !muted; store.set('muted', muted); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') paused = true; });

  // ---------- loop ----------
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    draw();
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.drawImage(buf, 0, 0, screen.width, screen.height);
    requestAnimationFrame(frame);
  }
  bird.x = W / 2; bird.y = 196;
  requestAnimationFrame(frame);

  // hooks for automated checks
  window.FLAPPY = { get state() { return state; }, get score() { return score; }, get bird() { return bird; }, get pipes() { return pipes; }, get level() { return level; }, get unlocked() { return unlocked; }, LEVELS, press, newRun, update, consts: { GRAVITY, FLAP, MAX_FALL, PIPE_W, GROUND_Y } };
})();
