'use strict';
// Space Invaders, after the 1978 Taito board. 224x256 portrait screen with
// the cellophane colour overlay, the one-alien-per-frame "ripple" march that
// speeds up as the rack thins, the four-note bass loop, three bomb types with
// the original column tables, eroding bunkers, holes in the floor line, the
// mystery ship's shot-counting score table, attract mode with the upside-down
// Y, a demo game and two-player alternating turns.
(function () {
  const W = 224, H = 256, STEP = 1 / 60;
  const B = SI.BMP;
  const SPR = {
    squid: B.squid.map(SI.sprite), crab: B.crab.map(SI.sprite), octopus: B.octopus.map(SI.sprite),
    player: SI.sprite(B.player), playerExp: B.playerExp.map(SI.sprite), alienExp: SI.sprite(B.alienExp),
    ufo: SI.sprite(B.ufo), ufoExp: SI.sprite(B.ufoExp), shotExp: SI.sprite(B.shotExp), bombExp: SI.sprite(B.bombExp),
    bombs: { rolling: B.bombs.rolling.map(SI.sprite), plunger: B.bombs.plunger.map(SI.sprite), squiggly: B.bombs.squiggly.map(SI.sprite) },
  };
  const MASK_SHOT = SI.mask(B.shotExp), MASK_BOMB = SI.mask(B.bombExp);
  const ALIEN_MASK = { squid: B.squid.map(SI.mask), crab: B.crab.map(SI.mask), octopus: B.octopus.map(SI.mask) };

  const ROW_TYPES = ['octopus', 'octopus', 'crab', 'crab', 'squid'];   // row 0 is the bottom row
  const POINTS = { octopus: 10, crab: 20, squid: 30 };
  const OFF = { squid: 4, crab: 2, octopus: 2 };
  const WID = { squid: 8, crab: 11, octopus: 12 };
  const START_Y = [120, 136, 152, 160, 160, 160, 168, 168, 168];       // bottom row start, by wave
  const SHIELD_X = [32, 77, 122, 167], SHIELD_Y = 192;
  const PLAYER_Y = 216, GROUND_Y = 239, UFO_Y = 40;
  const UFO_SCORES = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100];
  const PLUNGER_COLS = [0, 6, 0, 0, 0, 3, 10, 0, 5, 2, 0, 0, 10, 8, 1, 7];
  const SQUIGGLY_COLS = [10, 0, 5, 2, 0, 0, 10, 8, 1, 7, 1, 10, 3, 6, 9];
  const EXTRA_LIFE = 1500;

  // ---------- canvases ----------
  const cv = document.getElementById('screen');
  const dctx = cv.getContext('2d');
  const scr = document.createElement('canvas');
  scr.width = W; scr.height = H;
  const g = scr.getContext('2d');

  const store = {
    get(k, d) { try { const v = localStorage.getItem('si:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('si:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  const opts = Object.assign({ overlay: true, crt: true, sound: true, diff: 'normal' }, store.get('opts', {}));
  // Normal is the arcade board's own numbers; Easy and Hard bend them
  const DIFF = {
    easy: { lives: 5, reload: 1.7, bombSpeed: 0.8, maxBombs: 2, march: 1 },
    normal: { lives: 3, reload: 1, bombSpeed: 1, maxBombs: 3, march: 1 },
    hard: { lives: 3, reload: 0.55, bombSpeed: 1.3, maxBombs: 3, march: 2 },
  };
  const D = () => DIFF[opts.diff] || DIFF.normal;
  const DIFFS = ['easy', 'normal', 'hard'];
  function cycleDiff() {
    opts.diff = DIFFS[(DIFFS.indexOf(opts.diff) + 1) % 3]; store.set('opts', opts);
    const b = document.querySelector('[data-k="diff"]'); if (b) b.textContent = opts.diff.toUpperCase();
  }
  let hiScore = store.get('hi', 0);

  // ---------- sound ----------
  const snd = (() => {
    let ac = null, master = null, nbuf = null, siren = null;
    const ok = () => opts.sound && ac;
    function unlock() {
      if (!ac) {
        try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
        master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
        nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } else if (ac.state === 'suspended') ac.resume();
    }
    function tone(f, dur, type, vol, f2, delay) {
      if (!ok()) return;
      const t = ac.currentTime + (delay || 0);
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(gn); gn.connect(master); o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(dur, type, f, vol, f2) {
      if (!ok()) return;
      const t = ac.currentTime;
      const s = ac.createBufferSource(); s.buffer = nbuf;
      const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t);
      if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const gn = ac.createGain(); gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(fl); fl.connect(gn); gn.connect(master); s.start(t); s.stop(t + dur + 0.02);
    }
    // the four descending bass thumps of the march
    const MARCH = [98, 87, 78, 70];
    return {
      unlock,
      march(i) {
        if (!ok()) return;
        const t = ac.currentTime;
        const o = ac.createOscillator(), fl = ac.createBiquadFilter(), gn = ac.createGain();
        o.type = 'square'; o.frequency.value = MARCH[i & 3];
        fl.type = 'lowpass'; fl.frequency.value = 420;
        gn.gain.setValueAtTime(0.55, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        o.connect(fl); fl.connect(gn); gn.connect(master); o.start(t); o.stop(t + 0.12);
      },
      shoot() { noise(0.28, 'bandpass', 2600, 0.22, 500); tone(1100, 0.12, 'square', 0.03, 300); },
      alienDie() { noise(0.18, 'highpass', 900, 0.3); tone(900, 0.16, 'square', 0.05, 120); },
      playerDie() { noise(1.1, 'lowpass', 1400, 0.45, 120); },
      ufoHit() { for (let i = 0; i < 6; i++) tone(1400 - i * 120, 0.09, 'square', 0.06, 700, i * 0.1); },
      extra() { for (let i = 0; i < 4; i++) tone(880, 0.07, 'square', 0.07, 880, i * 0.12); },
      coin() { tone(1200, 0.08, 'square', 0.06, 1800); },
      sirenOn() {
        if (!ok() || siren) return;
        const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), gn = ac.createGain();
        o.type = 'square'; o.frequency.value = 760;
        lfo.frequency.value = 7; lg.gain.value = 260;
        lfo.connect(lg); lg.connect(o.frequency);
        gn.gain.value = 0.05; o.connect(gn); gn.connect(master);
        o.start(); lfo.start();
        siren = { o, lfo };
      },
      sirenOff() { if (siren) { try { siren.o.stop(); siren.lfo.stop(); } catch (e) { /* stopped */ } siren = null; } },
    };
  })();

  // ---------- player state (one per player, swapped on turns) ----------
  function newPlayer() { return { score: 0, lives: D().lives, wave: 0, extra: false, shots: 0, aliens: null, shields: null, ground: null, rackDx: 2, dropping: false, cursor: 0, bombCycle: 0, plunger: 0, squig: 0 }; }
  function setupWave(ps) {
    const by = START_Y[Math.min(ps.wave, START_Y.length - 1)];
    ps.aliens = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 11; c++) ps.aliens.push({ r, c, type: ROW_TYPES[r], x: 24 + c * 16, y: by - r * 16, alive: true, frame: 0 });
    ps.shields = SHIELD_X.map(() => { const a = new Uint8Array(22 * 16); B.shield.forEach((row, j) => [...row].forEach((ch, i) => { a[j * 22 + i] = ch === '#' ? 1 : 0; })); return a; });
    ps.ground = new Uint8Array(W).fill(1);
    ps.rackDx = 2; ps.dropping = false; ps.cursor = 0;
    shieldsDirty = true;
  }

  // ---------- game state ----------
  let mode = 'attract';          // attract | play | gameover
  let demo = false;
  let players = [newPlayer(), newPlayer()], cur = 0, numPlayers = 1, credits = 0;
  let ps = players[0];
  let phase = 'turn';            // turn | live | dead | clear (inside play)
  let phaseT = 0;
  const pl = { x: 24, alive: false, expT: 0 };
  let shot = null, bombs = [], fx = [], alienExp = null, ufo = null, ufoPop = null;
  let bombTimer = 60, ufoTimer = 1536, marchT = 0, marchNote = 0, aliveCount = 55;
  let fireQueued = false, paused = false, shieldsDirty = true;
  const keys = {};
  let attract = { stage: 'title', t: 0, cycle: 0 };
  let goT = 0, goPlayer = 0;

  function countAlive() { aliveCount = ps.aliens.filter((a) => a.alive).length; return aliveCount; }

  // ---------- starting games ----------
  function startGame(n, isDemo) {
    demo = !!isDemo;
    numPlayers = n;
    players = [newPlayer(), newPlayer()];
    setupWave(players[0]); setupWave(players[1]);
    if (n === 1) players[1].lives = 0;
    cur = 0; ps = players[0];
    mode = 'play';
    beginTurn();
    snd.sirenOff();
  }
  function beginTurn() {
    phase = demo ? 'live' : 'turn'; phaseT = 0;
    pl.x = 24; pl.alive = demo; pl.expT = 0;
    shot = null; bombs = []; fx = []; alienExp = null; ufo = null; ufoPop = null;
    bombTimer = 90; ufoTimer = 1536; marchT = 0;
    countAlive();
    shieldsDirty = true;
    snd.sirenOff();
  }
  function insertCoin() { credits = Math.min(99, credits + 1); snd.coin(); if (mode === 'attract') { attract.stage = 'push'; attract.t = 0; } }
  function pushStart(n) {
    if (mode !== 'attract' || demo) { if (mode === 'play' && demo) { /* fall through: abort demo */ } else return; }
    if (credits < n) return;
    credits -= n;
    startGame(n, false);
  }
  function quickStart(n) {
    // free play convenience: Enter or a tap inserts the coins and starts
    snd.unlock();
    if (mode === 'play' && !demo) return;
    if (mode === 'gameover') return;
    while (credits < n) credits++;
    credits -= n;
    startGame(n, false);
  }

  // ---------- rack ----------
  function rackStep() {
    const al = ps.aliens;
    for (let k = 0; k <= al.length; k++) {
      if (ps.cursor >= al.length) { ps.cursor = 0; endPass(); }
      const a = al[ps.cursor++];
      if (a.alive) { moveAlien(a); return; }
    }
  }
  function moveAlien(a) {
    if (ps.dropping) a.y += 8;
    else a.x += aliveCount === 1 && ps.rackDx > 0 ? 3 : ps.rackDx;
    a.frame ^= 1;
    if (a.y + 8 > SHIELD_Y) eatShield(a);
    if (a.y + 8 >= PLAYER_Y && pl.alive) killPlayer(true);
  }
  function endPass() {
    if (ps.dropping) { ps.dropping = false; return; }
    let lo = 999, hi = -999;
    for (const a of ps.aliens) if (a.alive) { lo = Math.min(lo, a.x + OFF[a.type]); hi = Math.max(hi, a.x + OFF[a.type] + WID[a.type]); }
    if ((ps.rackDx > 0 && hi >= 214) || (ps.rackDx < 0 && lo <= 10)) { ps.dropping = true; ps.rackDx = -ps.rackDx; }
  }
  // invaders flying through bunkers rub them out
  function eatShield(a) {
    const m = ALIEN_MASK[a.type][a.frame];
    const ax = a.x + OFF[a.type];
    for (let s = 0; s < 4; s++) {
      const sx = SHIELD_X[s];
      if (ax + WID[a.type] <= sx || ax >= sx + 22 || a.y >= SHIELD_Y + 16 || a.y + 8 <= SHIELD_Y) continue;
      const sh = ps.shields[s];
      for (let j = 0; j < 8; j++) for (let i = 0; i < m[j].length; i++) {
        if (!m[j][i]) continue;
        const px = ax + i - sx, py = a.y + j - SHIELD_Y;
        if (px >= 0 && px < 22 && py >= 0 && py < 16) sh[py * 22 + px] = 0;
      }
      shieldsDirty = true;
    }
  }
  function shieldAt(x, y) {
    if (y < SHIELD_Y || y >= SHIELD_Y + 16) return -1;
    for (let s = 0; s < 4; s++) {
      const px = x - SHIELD_X[s];
      if (px >= 0 && px < 22 && ps.shields[s][(y - SHIELD_Y) * 22 + px]) return s;
    }
    return -1;
  }
  function erode(x0, y0, mask) {
    for (let j = 0; j < mask.length; j++) for (let i = 0; i < mask[j].length; i++) {
      if (!mask[j][i]) continue;
      const x = x0 + i, y = y0 + j;
      if (y < SHIELD_Y || y >= SHIELD_Y + 16) continue;
      for (let s = 0; s < 4; s++) { const px = x - SHIELD_X[s]; if (px >= 0 && px < 22) ps.shields[s][(y - SHIELD_Y) * 22 + px] = 0; }
    }
    shieldsDirty = true;
  }

  // ---------- scoring ----------
  function addScore(n) {
    if (demo) return;
    ps.score += n;
    if (!ps.extra && ps.score >= EXTRA_LIFE) { ps.extra = true; ps.lives++; snd.extra(); }
    if (ps.score > hiScore) { hiScore = ps.score; store.set('hi', hiScore); }
  }
  function reloadFrames() {
    const s = ps.score;
    return Math.round((s < 200 ? 48 : s < 1000 ? 16 : s < 2000 ? 11 : s < 3000 ? 8 : 7) * D().reload);
  }

  // ---------- player ----------
  function killPlayer(invaded) {
    if (!pl.alive) return;
    pl.alive = false; pl.expT = 0;
    phase = 'dead'; phaseT = 0;
    shot = null; bombs = [];
    if (invaded) ps.lives = 1;   // the last life goes with it
    snd.playerDie(); snd.sirenOff(); ufo = null;
  }
  function afterDeath() {
    ps.lives--;
    if (demo) { endDemo(); return; }
    const other = players[1 - cur];
    if (ps.lives <= 0) {
      if (numPlayers === 2 && other.lives > 0) { mode = 'gameover'; goT = 0; goPlayer = cur; return; }
      mode = 'gameover'; goT = 0; goPlayer = numPlayers === 2 ? cur : -1; return;
    }
    if (numPlayers === 2 && other.lives > 0) { cur = 1 - cur; ps = players[cur]; }
    beginTurn();
  }

  // ---------- update ----------
  function update() {
    if (paused) return;
    if (mode === 'attract') { updateAttract(); if (!demo) return; }
    if (mode === 'gameover') { updateGameOver(); return; }
    if (mode !== 'play') return;
    phaseT++;
    for (const f of fx) f.t--;
    fx = fx.filter((f) => f.t > 0);
    if (ufoPop && --ufoPop.t <= 0) ufoPop = null;

    if (phase === 'turn') {
      if (phaseT > (numPlayers === 2 ? 120 : 70)) { phase = 'live'; pl.alive = true; phaseT = 0; }
      return;
    }
    if (phase === 'clear') {
      if (phaseT > 90) { ps.wave++; setupWave(ps); beginTurn(); phase = 'live'; pl.alive = true; }
      return;
    }
    if (phase === 'dead') {
      pl.expT++;
      if (phaseT > 150) afterDeath();
      return;
    }
    // --- live ---
    // player movement
    let dir = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
    let fire = fireQueued; fireQueued = false;
    if (demo) { const ai = demoAI(); dir = ai.dir; fire = ai.fire; }
    if (pl.alive) pl.x = Math.max(16, Math.min(W - 16 - 13, pl.x + dir));
    if (fire && pl.alive && !shot && !alienExp) {
      shot = { x: pl.x + 6, y: PLAYER_Y - 4 };
      ps.shots++;
      snd.shoot();
    }
    // alien explosion freezes the rack, like the original
    if (alienExp) { if (--alienExp.t <= 0) alienExp = null; }
    else {
      for (let k = 0; k < D().march; k++) rackStep();
      marchT += D().march;
      if (marchT >= Math.max(6, aliveCount)) { marchT = 0; snd.march(marchNote++); }
    }
    updateShot();
    updateBombs();
    updateUfo();
    if (aliveCount === 0 && !alienExp && phase === 'live') { phase = 'clear'; phaseT = 0; shot = null; bombs = []; snd.sirenOff(); ufo = null; }
  }
  function updateShot() {
    if (!shot) return;
    for (let k = 0; k < 4 && shot; k++) {
      shot.y--;
      const x = shot.x, y = shot.y;
      if (y <= 32) { fx.push({ spr: SPR.shotExp, x: x - 3, y: 32, t: 16 }); shot = null; return; }
      if (ufo && y >= UFO_Y && y < UFO_Y + 8 && x >= ufo.x && x < ufo.x + 16) {
        const pts = UFO_SCORES[ps.shots % 15];
        addScore(pts);
        fx.push({ spr: SPR.ufoExp, x: Math.round(ufo.x) - 2, y: UFO_Y, t: 30 });
        ufoPop = { x: Math.round(ufo.x), t: 90, pts };
        ufo = null; snd.sirenOff(); snd.ufoHit(); shot = null; return;
      }
      for (const a of ps.aliens) {
        if (!a.alive) continue;
        const ax = a.x + OFF[a.type];
        if (x >= ax && x < ax + WID[a.type] && y >= a.y && y < a.y + 8) {
          a.alive = false; aliveCount--;
          alienExp = { x: a.x + 1, y: a.y, t: 16 };
          addScore(POINTS[a.type]);
          snd.alienDie(); shot = null; return;
        }
      }
      for (let i = 0; i < bombs.length; i++) {
        const b = bombs[i];
        if (x >= b.x - 1 && x <= b.x + 3 && y >= b.y && y < b.y + 7) {
          fx.push({ spr: SPR.shotExp, x: x - 3, y: y - 4, t: 12 });
          bombs.splice(i, 1); shot = null; return;
        }
      }
      if (shieldAt(x, y) >= 0) { erode(x - 3, y - 5, MASK_SHOT); fx.push({ spr: SPR.shotExp, x: x - 3, y: y - 5, t: 10 }); shot = null; return; }
    }
  }
  function updateBombs() {
    // fire
    if (pl.alive && !alienExp && aliveCount > 0) {
      if (--bombTimer <= 0 && bombs.length < D().maxBombs) {
        const types = ['rolling', 'plunger', 'squiggly'];
        let type = null;
        for (let k = 0; k < 3; k++) {
          const t = types[(ps.bombCycle + k) % 3];
          if (!bombs.some((b) => b.type === t) && !(t === 'plunger' && aliveCount === 1)) { type = t; ps.bombCycle = (ps.bombCycle + k + 1) % 3; break; }
        }
        if (type) {
          let col;
          if (type === 'rolling') {
            // the rolling bomb drops from the column right above you
            let best = 99;
            for (const a of ps.aliens) if (a.alive) { const d = Math.abs(a.x + 8 - (pl.x + 6)); if (d < best) { best = d; col = a.c; } }
          } else if (type === 'plunger') col = PLUNGER_COLS[ps.plunger++ % PLUNGER_COLS.length];
          else col = SQUIGGLY_COLS[ps.squig++ % SQUIGGLY_COLS.length];
          let shooter = null;
          for (const a of ps.aliens) if (a.alive && a.c === col && (!shooter || a.y > shooter.y)) shooter = a;
          if (shooter) bombs.push({ type, x: shooter.x + OFF[shooter.type] + (WID[shooter.type] >> 1) - 1, y: shooter.y + 8, f: 0 });
        }
        bombTimer = reloadFrames();
      }
    }
    const speed = (aliveCount <= 8 ? 5 / 3 : 4 / 3) * D().bombSpeed;
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i];
      b.y += speed;
      b.f++;
      const by = Math.floor(b.y);
      let gone = false;
      // bunker
      for (let cx = 0; cx < 3 && !gone; cx++) {
        if (shieldAt(b.x + cx, by + 7) >= 0) { erode(b.x - 2, by + 2, MASK_BOMB); fx.push({ spr: SPR.bombExp, x: b.x - 2, y: by + 2, t: 10 }); gone = true; }
      }
      // player
      if (!gone && pl.alive && b.x + 3 > pl.x && b.x < pl.x + 13 && by + 7 >= PLAYER_Y && by < PLAYER_Y + 8) {
        // pixel check against the cannon's silhouette
        const px = b.x + 1 - pl.x, py = Math.max(0, by + 6 - PLAYER_Y);
        if (px < 0 || px > 12 || B.player[Math.min(7, py)][px] === '#' || py >= 3) { killPlayer(false); return; }
      }
      // floor: bombs blow holes in the line
      if (!gone && by + 7 >= GROUND_Y - 7) {
        fx.push({ spr: SPR.bombExp, x: b.x - 2, y: GROUND_Y - 9, t: 10 });
        for (let k = -1; k <= 3; k++) if (b.x + k >= 0 && b.x + k < W && Math.random() < 0.8) ps.ground[b.x + k] = 0;
        gone = true;
      }
      if (gone) bombs.splice(i, 1);
    }
  }
  function updateUfo() {
    if (!ufo) {
      if (aliveCount >= 8 && pl.alive && --ufoTimer <= 0) {
        ufoTimer = 1536;
        const dir = ps.shots & 1 ? -1 : 1;
        ufo = { x: dir > 0 ? -16 : W, dir };
        snd.sirenOn();
      }
      return;
    }
    ufo.x += ufo.dir * 0.8;
    if (ufo.x < -18 || ufo.x > W + 2) { ufo = null; snd.sirenOff(); }
  }

  // ---------- demo player ----------
  const aiState = { target: W / 2, t: 0 };
  function demoAI() {
    const cx = pl.x + 6;
    // dodge anything about to land on us
    for (const b of bombs) if (b.y > PLAYER_Y - 50 && Math.abs(b.x + 1 - cx) < 10) return { dir: b.x + 1 < cx ? 1 : -1, fire: false };
    if (aiState.t-- <= 0 || !ps.aliens.some((a) => a.alive && Math.abs(a.x + OFF[a.type] + (WID[a.type] >> 1) - aiState.target) < 6)) {
      const live = ps.aliens.filter((a) => a.alive);
      const a = live[Math.floor(Math.random() * live.length)];
      aiState.target = a ? a.x + OFF[a.type] + (WID[a.type] >> 1) : W / 2;
      aiState.t = 40;
    }
    const tgt = aiState.target;
    return { dir: Math.abs(tgt - cx) < 2 ? 0 : Math.sign(tgt - cx), fire: Math.abs(tgt - cx) < 4 };
  }
  function endDemo() {
    demo = false; mode = 'attract'; attract.stage = 'coin'; attract.t = 0;
    snd.sirenOff();
  }

  // ---------- attract mode ----------
  const TYPE_RATE = 6; // frames per character, like the slow ROM typing
  function updateAttract() {
    const a = attract;
    a.t++;
    if (a.stage === 'title') {
      if (a.t > 470) { a.stage = a.cycle % 2 === 1 ? 'yfix' : 'hold'; a.t = 0; }
    } else if (a.stage === 'yfix') {
      if (a.t > 470) { a.stage = 'hold'; a.t = 0; }
    } else if (a.stage === 'hold') {
      if (a.t > 120) { a.stage = 'demo'; a.t = 0; startGame(1, true); }
    } else if (a.stage === 'demo') {
      if (a.t > 60 * 40) endDemo();
    } else if (a.stage === 'coin') {
      if (a.t > 360) { a.stage = 'title'; a.t = 0; a.cycle++; }
    } else if (a.stage === 'push') {
      if (credits === 0) { a.stage = 'title'; a.t = 0; }
    }
  }
  function updateGameOver() {
    goT++;
    if (goT > 300) {
      const other = players[1 - cur];
      if (numPlayers === 2 && other.lives > 0) { cur = 1 - cur; ps = players[cur]; mode = 'play'; beginTurn(); return; }
      mode = 'attract'; attract = { stage: credits > 0 ? 'push' : 'title', t: 0, cycle: attract.cycle + 1 };
    }
  }

  // ---------- drawing ----------
  const F = SI.FONT;
  function text(str, x, y, opt) {
    opt = opt || {};
    g.fillStyle = '#fff';
    for (let n = 0; n < str.length; n++) {
      const glyph = F[str[n]] || F[' '];
      const flip = opt.flipAt === n;
      for (let j = 0; j < 7; j++) {
        const row = glyph[flip ? 6 - j : j];
        for (let i = 0; i < 5; i++) if (row[i] === '1') g.fillRect(x + n * 8 + i + 1, y + j, 1, 1);
      }
    }
  }
  const pad = (n, l) => String(n).padStart(l, '0');
  let shieldCanvas = document.createElement('canvas');
  shieldCanvas.width = W; shieldCanvas.height = 16;
  function drawShields() {
    if (shieldsDirty) {
      const sg = shieldCanvas.getContext('2d');
      sg.clearRect(0, 0, W, 16);
      sg.fillStyle = '#fff';
      for (let s = 0; s < 4; s++) { const sh = ps.shields[s]; for (let j = 0; j < 16; j++) for (let i = 0; i < 22; i++) if (sh[j * 22 + i]) sg.fillRect(SHIELD_X[s] + i, j, 1, 1); }
      shieldsDirty = false;
    }
    g.drawImage(shieldCanvas, 0, SHIELD_Y);
  }
  function drawHeader() {
    text('SCORE<1> HI-SCORE SCORE<2>', 8, 8);
    const blink = mode === 'play' && phase === 'turn' && numPlayers === 2 && Math.floor(phaseT / 8) % 2;
    if (!(blink && cur === 0)) text(pad(players[0].score, 4), 24, 24);
    text(pad(hiScore, 4), 88, 24);
    if (numPlayers === 2 && !(blink && cur === 1)) text(pad(players[1].score, 4), 168, 24);
  }
  function drawFooter(showLives) {
    if (showLives && mode === 'play' && !demo) {
      const lives = Math.max(0, ps.lives);
      text(String(lives), 8, 241);
      for (let i = 0; i < Math.min(lives - 1, 5); i++) g.drawImage(SPR.player, 24 + i * 16, 240);
    }
    text('CREDIT ' + pad(credits, 2), 136, 241);
  }
  function drawPlayfield() {
    // ufo and its score
    if (ufo) g.drawImage(SPR.ufo, Math.round(ufo.x), UFO_Y);
    if (ufoPop && !fx.some((f) => f.spr === SPR.ufoExp)) text(String(ufoPop.pts), ufoPop.x - 4, UFO_Y);
    for (const a of ps.aliens) if (a.alive) g.drawImage(SPR[a.type][a.frame], a.x + OFF[a.type], a.y);
    if (alienExp) g.drawImage(SPR.alienExp, alienExp.x, alienExp.y);
    drawShields();
    if (pl.alive) g.drawImage(SPR.player, pl.x, PLAYER_Y);
    else if (phase === 'dead' && pl.expT < 100) g.drawImage(SPR.playerExp[Math.floor(pl.expT / 5) % 2], pl.x - 1, PLAYER_Y);
    if (shot) { g.fillStyle = '#fff'; g.fillRect(shot.x, shot.y, 1, 4); }
    for (const b of bombs) { const fr = SPR.bombs[b.type]; g.drawImage(fr[Math.floor(b.f / 6) % fr.length], b.x, Math.floor(b.y)); }
    for (const f of fx) g.drawImage(f.spr, f.x, f.y);
    // floor line with its bomb holes
    g.fillStyle = '#fff';
    for (let x = 0; x < W; x++) if (ps.ground[x]) g.fillRect(x, GROUND_Y, 1, 1);
  }
  function typed(str, x, y, startT, opt) {
    const n = Math.max(0, Math.min(str.length, Math.floor((attract.t - startT) / TYPE_RATE)));
    if (n > 0) text(str.slice(0, n), x, y, opt);
    return startT + str.length * TYPE_RATE;
  }
  function drawAttract() {
    const a = attract;
    if (a.stage === 'title' || a.stage === 'yfix' || a.stage === 'hold') {
      const t0 = a.stage === 'title' ? 0 : -9999;
      const wrongY = a.cycle % 2 === 1 && (a.stage === 'title' || (a.stage === 'yfix' && a.t < 330));
      let t = typed('PLAY', 96, 64, t0, wrongY ? { flipAt: 3 } : null);
      t = typed('SPACE  INVADERS', 52, 88, t + 10);
      t += 30;
      if (a.t >= t || a.stage !== 'title') {
        text('*SCORE ADVANCE TABLE*', 28, 120);
        g.drawImage(SPR.ufo, 52, 136); g.drawImage(SPR.squid[0], 56, 152); g.drawImage(SPR.crab[1], 54, 168); g.drawImage(SPR.octopus[0], 54, 184);
      }
      t += 20;
      t = typed('=? MYSTERY', 72, 136, t);
      t = typed('=30 POINTS', 72, 152, t);
      t = typed('=20 POINTS', 72, 168, t);
      typed('=10 POINTS', 72, 184, t);
      if (a.stage === 'yfix') drawYFix(a.t);
    } else if (a.stage === 'coin') {
      text('INSERT  COIN', 64, 88);
      text('<1 OR 2 PLAYERS>', 48, 112);
      text('*1 PLAYER  1 COIN', 40, 136);
      text('*2 PLAYERS 2 COINS', 40, 160);
    } else if (a.stage === 'push') {
      text('PUSH', 96, 88);
      text(credits >= 2 ? '1 OR 2PLAYERS BUTTON' : 'ONLY 1PLAYER  BUTTON', 32, 112);
    }
  }
  // the alien that walks in, steals the upside-down Y in "PLAY" and brings back the right one
  function drawYFix(t) {
    const yx = 120, row = 64;
    let x, carry = null;
    if (t < 100) x = 232 - t * 1.04;                 // walks in to the Y
    else if (t < 210) { x = 128 + (t - 100); carry = 'flip'; }   // drags the bad Y away
    else if (t < 330) { x = 238 - (t - 210) * 0.92; carry = 'good'; } // brings the right one back
    else x = 128 + (t - 330) * 1.2;                  // leaves
    const fr = Math.floor(x / 4) % 2;
    // cover the Y slot while it is being swapped
    if (t >= 100 && t < 330) { g.clearRect(yx, row, 8, 8); }
    if (carry === 'flip') text('Y', x - 9, row, { flipAt: 0 });
    if (carry === 'good') text('Y', x - 9, row);
    g.drawImage(SPR.crab[fr], Math.round(x), row);
    if (t >= 330) text('Y', yx - 0, row);
  }
  function drawOverlay() {
    if (!opts.overlay) return;
    // the cellophane strips glued to the original monitor
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = '#ff2b2b'; g.fillRect(0, 32, W, 16);
    g.fillStyle = '#29ff4a'; g.fillRect(0, 184, W, 56); g.fillRect(0, 240, 136, 16);
    g.globalCompositeOperation = 'source-over';
  }
  function render(now) {
    g.clearRect(0, 0, W, H);
    drawHeader();
    if (mode === 'attract' && !demo) { drawAttract(); text('LEVEL ' + opts.diff.toUpperCase(), opts.diff === 'normal' ? 64 : 72, 220); drawFooter(false); }
    else if (mode === 'play' || mode === 'gameover') {
      // the board blanks the field while it announces whose turn it is
      if (ps.aliens && !(mode === 'play' && phase === 'turn' && numPlayers === 2)) drawPlayfield();
      if (demo) text('DEMO', 8, 241);
      if (mode === 'play' && phase === 'turn' && numPlayers === 2) text('PLAY PLAYER<' + (cur + 1) + '>', 56, 112);
      if (mode === 'gameover') {
        const s = 'GAME OVER';
        const n = Math.min(s.length, Math.floor(goT / 10));
        text(s.slice(0, n), 76, 48);
        if (goPlayer >= 0) text('PLAYER<' + (goPlayer + 1) + '>', 80, 64);
      }
      drawFooter(true);
    }
    if (paused) text('PAUSED', 88, 128);
    drawOverlay();
    // to the display
    dctx.setTransform(1, 0, 0, 1, 0, 0);
    dctx.fillStyle = '#000'; dctx.fillRect(0, 0, cv.width, cv.height);
    dctx.imageSmoothingEnabled = false;
    if (opts.crt) { dctx.shadowColor = 'rgba(255,255,255,0.35)'; dctx.shadowBlur = 6 * view.dpr; }
    dctx.drawImage(scr, 0, 0, Math.round(W * view.s * view.dpr), Math.round(H * view.s * view.dpr));
    dctx.shadowBlur = 0;
    if (opts.crt) {
      const step = Math.max(2, Math.round(view.s * view.dpr));
      dctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let y = 0; y < cv.height; y += step) dctx.fillRect(0, y + Math.floor(step / 2), cv.width, Math.max(1, Math.floor(step / 3)));
    }
  }

  // ---------- layout ----------
  const view = { s: 1, dpr: 1 };
  const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const padEl = document.getElementById('pad');
  if (touch) document.body.classList.add('touch');
  function fit() {
    const vw = innerWidth, vh = innerHeight;
    const ctrl = touch ? padEl.offsetHeight : 0;
    const dpr = Math.min(3, devicePixelRatio || 1);
    view.s = Math.min(vw / W, (vh - ctrl) / H);
    view.dpr = dpr;
    const cw = Math.round(W * view.s), ch = Math.round(H * view.s);
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  }
  addEventListener('resize', fit); fit();

  // ---------- input ----------
  function press(kind) {
    snd.unlock();
    if (kind === 'fire') {
      if (mode === 'attract' && !demo) { quickStart(1); return; }
      if (demo) { quickStart(1); return; }
      fireQueued = true;
    }
  }
  addEventListener('keydown', (e) => {
    snd.unlock();
    const c = e.code;
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(c)) e.preventDefault();
    if (c === 'ArrowLeft' || c === 'KeyA') keys.left = true;
    if (c === 'ArrowRight' || c === 'KeyD') keys.right = true;
    if (e.repeat) return;
    if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW' || c === 'KeyZ') {
      if (mode === 'attract' || demo) quickStart(1); else fireQueued = true;
    }
    if (c === 'Enter') quickStart(1);
    if (c === 'Digit5' || c === 'KeyC') insertCoin();
    if (c === 'Digit1') { if (credits >= 1) pushStart(1); else quickStart(1); }
    if (c === 'Digit2') { if (credits >= 2) pushStart(2); else quickStart(2); }
    if (c === 'KeyP' || c === 'Escape') { if (mode === 'play' && !demo) paused = !paused; }
    if (c === 'KeyM') { opts.sound = !opts.sound; store.set('opts', opts); if (!opts.sound) snd.sirenOff(); }
    if (c === 'KeyX' && (mode === 'attract' || demo)) cycleDiff();
    if (c === 'KeyO') { opts.overlay = !opts.overlay; store.set('opts', opts); }
    if (c === 'KeyT') { opts.crt = !opts.crt; store.set('opts', opts); }
  });
  addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  });
  addEventListener('blur', () => { keys.left = keys.right = false; if (mode === 'play' && !demo) paused = true; snd.sirenOff(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play' && !demo) paused = true; });
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault(); snd.unlock();
    if (paused) { paused = false; return; }
    if (mode === 'attract' || demo) quickStart(1);
    else if (!touch) fireQueued = true;
  });
  // on-screen pad
  for (const btn of document.querySelectorAll('[data-k]')) {
    const k = btn.dataset.k;
    const down = (e) => {
      e.preventDefault(); snd.unlock();
      btn.classList.add('on');
      if (k === 'left') keys.left = true;
      else if (k === 'right') keys.right = true;
      else if (k === 'fire') press('fire');
      else if (k === '1p') quickStart(1);
      else if (k === '2p') quickStart(2);
      else if (k === 'diff') { if (mode === 'attract' || demo) cycleDiff(); }
      else if (k === 'pause') { if (mode === 'play' && !demo) paused = !paused; }
      else if (k === 'sound') { opts.sound = !opts.sound; store.set('opts', opts); if (!opts.sound) snd.sirenOff(); btn.textContent = opts.sound ? 'SOUND' : 'MUTED'; }
    };
    const up = (e) => { e.preventDefault(); btn.classList.remove('on'); if (k === 'left') keys.left = false; if (k === 'right') keys.right = false; };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('pointerleave', up);
    if (k === 'sound') btn.textContent = opts.sound ? 'SOUND' : 'MUTED';
    if (k === 'diff') btn.textContent = opts.diff.toUpperCase();
  }

  // ---------- loop ----------
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    while (acc >= STEP) { update(); acc -= STEP; }
    render(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // hooks for automated checks
  window.SPACE = {
    get mode() { return mode; }, get phase() { return phase; }, get ps() { return ps; }, get pl() { return pl; },
    get bombs() { return bombs; }, get ufo() { return ufo; }, get alive() { return aliveCount; }, get attract() { return attract; },
    get demo() { return demo; }, get hiScore() { return hiScore; }, get players() { return players; },
    startGame, update, cycleDiff, quickStart, insertCoin, fire() { fireQueued = true; }, keys, opts,
  };
})();
