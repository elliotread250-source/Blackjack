'use strict';
// Pong, after the 1972 Atari arcade machine: white blocks on black, a dashed
// net, block digit scores, eight-segment paddles that change the ball's angle,
// speed-ups at 4 and 12 hits, and the original three beeps.
(function () {
  const W = 800, H = 600;
  const PAD_W = 14, PAD_H = 72, PAD_X = 40, BALL = 14;
  const WIN = 11;
  const STEP = 1 / 120;
  const SPEEDS = [430, 540, 660];          // ball px/s: start, after 4 hits, after 12
  const ANGLES = [-58, -42, -26, -10, 10, 26, 42, 58]; // by paddle segment, top to bottom
  const CPU = {
    // look: how far across the court the ball must be before the CPU reads it
    easy: { speed: 280, react: 0.25, err: 64, look: 0.62 },
    normal: { speed: 380, react: 0.16, err: 44, look: 0.45 },
    hard: { speed: 440, react: 0.1, err: 50, look: 0.3 },
  };

  const cv = document.getElementById('screen');
  const ctx = cv.getContext('2d');
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pong:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('pong:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  const opts = Object.assign({ diff: 'normal', crt: true, sound: true }, store.get('opts', {}));

  // ---------- sound: the original's three tones ----------
  let ac = null;
  function beep(freq, ms) {
    if (!opts.sound) return;
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
    if (ac.state === 'suspended') ac.resume();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square'; o.frequency.value = freq;
    const t = ac.currentTime;
    g.gain.setValueAtTime(0.12, t); g.gain.setValueAtTime(0.12, t + ms / 1000); g.gain.linearRampToValueAtTime(0, t + ms / 1000 + 0.01);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + ms / 1000 + 0.02);
  }
  const SFX0 = { paddle: () => beep(459, 96), wall: () => beep(226, 16), score: () => beep(490, 257) };
  let netEvents = [];
  const SFX = {};
  for (const k in SFX0) SFX[k] = () => { SFX0[k](); if (net && net.side === 0) netEvents.push(k); };

  // ---------- block font ----------
  // scores use chunky 4x7 digits like the arcade; menus use a 5x7 font
  const DIG = {
    0: ['1111', '1001', '1001', '1001', '1001', '1001', '1111'],
    1: ['0001', '0001', '0001', '0001', '0001', '0001', '0001'],
    2: ['1111', '0001', '0001', '1111', '1000', '1000', '1111'],
    3: ['1111', '0001', '0001', '1111', '0001', '0001', '1111'],
    4: ['1001', '1001', '1001', '1111', '0001', '0001', '0001'],
    5: ['1111', '1000', '1000', '1111', '0001', '0001', '1111'],
    6: ['1000', '1000', '1000', '1111', '1001', '1001', '1111'],
    7: ['1111', '0001', '0001', '0001', '0001', '0001', '0001'],
    8: ['1111', '1001', '1001', '1111', '1001', '1001', '1111'],
    9: ['1111', '1001', '1001', '1111', '0001', '0001', '0001'],
  };
  const F = {
    A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
    C: '01111 10000 10000 10000 10000 10000 01111', D: '11110 10001 10001 10001 10001 10001 11110',
    E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
    G: '01111 10000 10000 10011 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
    I: '11111 00100 00100 00100 00100 00100 11111', J: '00111 00010 00010 00010 00010 10010 01100',
    K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
    M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 11001 10101 10011 10001 10001 10001',
    O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
    Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
    S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
    U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
    W: '10001 10001 10001 10101 10101 11011 10001', X: '10001 10001 01010 00100 01010 10001 10001',
    Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
    0: '01110 10001 10011 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110',
    2: '01110 10001 00001 00110 01000 10000 11111', 3: '11110 00001 00001 01110 00001 00001 11110',
    4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
    6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000',
    8: '01110 10001 10001 01110 10001 10001 01110', 9: '01110 10001 10001 01111 00001 00010 01100',
    ' ': '000 000 000 000 000 000 000', '!': '1 1 1 1 1 0 1', '.': '0 0 0 0 0 0 1', ':': '0 0 1 0 0 1 0',
    '<': '00010 00100 01000 10000 01000 00100 00010', '>': '01000 00100 00010 00001 00010 00100 01000',
    '/': '00001 00010 00010 00100 01000 01000 10000', '-': '000 000 000 111 000 000 000',
  };
  for (const k in F) F[k] = F[k].split(' ');
  function textW(s, z) { let w = 0; for (const c of s) w += ((F[c] || F[' '])[0].length + 1) * z; return w - z; }
  function text(s, cx, y, z, col, left) {
    let x = Math.round(left ? cx : cx - textW(s, z) / 2);
    ctx.fillStyle = col || '#fff';
    for (const c of s) {
      const g = F[c] || F[' '];
      for (let j = 0; j < 7; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === '1') ctx.fillRect(x + i * z, y + j * z, z, z);
      x += (g[0].length + 1) * z;
    }
  }
  function digits(n, cx, y, z) {
    const s = String(n);
    const w = s.length * 4 * z + (s.length - 1) * 2 * z;
    let x = Math.round(cx - w / 2);
    ctx.fillStyle = '#fff';
    for (const c of s) {
      const g = DIG[c];
      for (let j = 0; j < 7; j++) for (let i = 0; i < 4; i++) if (g[j][i] === '1') ctx.fillRect(x + i * z, y + j * z, z, z);
      x += 6 * z;
    }
  }

  // ---------- online ----------
  // Host-authoritative: whoever creates the room runs the game (left paddle)
  // and streams state; the guest sends its paddle and draws what it's sent.
  const ONLINE_HOST = /railway\.app$|^localhost$|^127\./.test(location.hostname) ? location.host : 'game-production-3c6d.up.railway.app';
  let net = null;          // { ws, side, code, status }
  let online = { sel: 0, joinCode: '', msg: '', msgT: 0 };
  let guestY = H / 2 - PAD_H / 2, netTick = 0, lastSnap = 0;
  const isGuest = () => net && net.side === 1 && net.status === 'playing';
  const isHost = () => net && net.side === 0 && net.status === 'playing';
  function connect(then) {
    if (net) { try { net.ws.close(); } catch (e) { /* closed */ } }
    const proto = location.protocol === 'https:' || ONLINE_HOST !== location.host ? 'wss' : 'ws';
    let ws;
    try { ws = new WebSocket(`${proto}://${ONLINE_HOST}/ws`); } catch (e) { flashMsg('CANNOT CONNECT'); return; }
    net = { ws, side: -1, code: '', status: 'connecting' };
    ws.onopen = () => then(ws);
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } onNet(m); };
    ws.onclose = () => { if (net && net.ws === ws) { const was = net.status; net = null; if (mode === 'lobby' || was === 'playing') { mode = 'menu'; flashMsg(was === 'playing' ? 'CONNECTION LOST' : 'CANNOT CONNECT'); } } };
    ws.onerror = () => {};
  }
  function netSend(o) { if (net && net.ws.readyState === 1) net.ws.send(JSON.stringify(o)); }
  function flashMsg(m) { online.msg = m; online.msgT = 2.5; }
  function createRoom() { mode = 'lobby'; connect((ws) => ws.send(JSON.stringify({ t: 'create' }))); }
  function joinRoom(code) {
    code = String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    if (code.length !== 4) { flashMsg('CODES ARE 4 LETTERS'); return; }
    mode = 'lobby'; connect((ws) => { net.code = code; ws.send(JSON.stringify({ t: 'join', code })); });
  }
  function leaveOnline() { if (net) { const ws = net.ws; net = null; try { ws.close(); } catch (e) { /* closed */ } } mode = 'menu'; }
  function onNet(m) {
    if (!net) return;
    if (m.t === 'room') { net.code = m.code; net.status = 'waiting'; history.replaceState(null, '', '?room=' + m.code); }
    else if (m.t === 'error') { const msg = m.msg === 'no room' ? 'NO ROOM WITH THAT CODE' : m.msg === 'room full' ? 'THAT ROOM IS FULL' : 'SERVER BUSY'; leaveOnline(); flashMsg(msg); }
    else if (m.t === 'start') { net.side = m.side; net.status = 'playing'; net.code = m.code; history.replaceState(null, '', location.pathname); newGame(2); beep(459, 60); }
    else if (m.t === 'left') { net = null; mode = 'menu'; flashMsg('OPPONENT LEFT'); }
    else if (m.t === 'p' && isHost()) guestY = m.y;
    else if (m.t === 'again' && isHost() && mode === 'over') newGame(2);
    else if (m.t === 's' && isGuest()) {
      ball.x = m.b[0]; ball.y = m.b[1]; ball.vx = m.b[2]; ball.vy = m.b[3]; ball.live = !!m.b[4];
      P[0].y = m.p; P[0].score = m.sc[0]; P[1].score = m.sc[1];
      mode = m.m; winner = m.w; timer = m.tm;
      for (const e of m.e || []) SFX0[e] && SFX0[e]();
      lastSnap = performance.now();
    }
  }

  // ---------- state ----------
  const P = [{ y: H / 2 - PAD_H / 2, score: 0, vy: 0 }, { y: H / 2 - PAD_H / 2, score: 0, vy: 0 }];
  const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, hits: 0, live: false };
  let mode = 'menu';     // menu | serve | play | point | over | pause
  let players = 1, menuSel = 0, timer = 0, serveDir = 1, winner = -1;
  const keys = {};
  const touchY = [null, null];
  let cpuAim = H / 2, cpuThink = 0;

  function resetPaddles() { for (const p of P) { p.y = H / 2 - PAD_H / 2; p.vy = 0; } }
  function newGame(n) {
    players = n; P[0].score = P[1].score = 0; winner = -1;
    resetPaddles();
    serveDir = Math.random() < 0.5 ? -1 : 1;
    toServe();
  }
  function toServe() {
    mode = 'serve'; timer = 1.0;
    ball.x = W / 2 - BALL / 2; ball.y = H / 2 - BALL / 2; ball.live = false; ball.hits = 0;
  }
  function serve() {
    mode = 'play';
    ball.live = true;
    const a = ((Math.random() * 40 - 20) * Math.PI) / 180;
    ball.x = W / 2 - BALL / 2;
    ball.y = 80 + Math.random() * (H - 160);
    ball.vx = Math.cos(a) * SPEEDS[0] * serveDir;
    ball.vy = Math.sin(a) * SPEEDS[0];
  }

  // ---------- update ----------
  function movePaddle(i, dt) {
    const p = P[i];
    const cpu = players === 1 && i === 1 && !net;
    if (isHost() && i === 1) { const d = guestY - p.y; p.y += Math.sign(d) * Math.min(Math.abs(d), 1600 * dt); p.y = Math.max(0, Math.min(H - PAD_H, p.y)); return; }
    let target = null, dir = 0;
    if (cpu) {
      const c = CPU[opts.diff];
      cpuThink -= dt;
      if (cpuThink <= 0) {
        cpuThink = c.react;
        // read where the ball will cross, with a human-ish error
        if (ball.vx > 0 && ball.live && ball.x > W * c.look) {
          let t = (W - PAD_X - PAD_W - ball.x) / ball.vx;
          let y = ball.y + ball.vy * t;
          const span = H - BALL;
          y = ((y % (2 * span)) + 2 * span) % (2 * span);
          if (y > span) y = 2 * span - y;
          cpuAim = y + BALL / 2 + (Math.random() * 2 - 1) * c.err;
        } else if (ball.vx <= 0) cpuAim = H / 2 + (ball.y - H / 2) * 0.3;
      }
      const d = cpuAim - (p.y + PAD_H / 2);
      const mv = Math.sign(d) * Math.min(Math.abs(d), c.speed * dt);
      p.y += mv;
    } else {
      const solo = players === 1 || (net && net.status === 'playing');
      const kb = isGuest() ? (keys.KeyW || keys.ArrowUp ? -1 : 0) + (keys.KeyS || keys.ArrowDown ? 1 : 0) : i === 0
        ? (keys.KeyW || (solo && keys.ArrowUp) ? -1 : 0) + (keys.KeyS || (solo && keys.ArrowDown) ? 1 : 0)
        : (keys.ArrowUp ? -1 : 0) + (keys.ArrowDown ? 1 : 0);
      dir = kb;
      target = isGuest() ? touchY[0] : touchY[i];
      if (target != null) {
        const d = target - (p.y + PAD_H / 2);
        p.y += Math.sign(d) * Math.min(Math.abs(d), 1400 * dt);
      } else p.y += dir * 620 * dt;
    }
    p.y = Math.max(0, Math.min(H - PAD_H, p.y));
  }
  function hitPaddle(i) {
    const p = P[i];
    const px = i === 0 ? PAD_X : W - PAD_X - PAD_W;
    if (ball.x + BALL < px || ball.x > px + PAD_W) return false;
    if (ball.y + BALL < p.y || ball.y > p.y + PAD_H) return false;
    // eight segments, like the original's paddle logic
    const rel = (ball.y + BALL / 2 - p.y) / PAD_H;
    const seg = Math.max(0, Math.min(7, Math.floor(rel * 8)));
    ball.hits++;
    const sp = SPEEDS[ball.hits >= 12 ? 2 : ball.hits >= 4 ? 1 : 0];
    const a = (ANGLES[seg] * Math.PI) / 180;
    const dir = i === 0 ? 1 : -1;
    ball.vx = Math.cos(a) * sp * dir;
    ball.vy = Math.sin(a) * sp;
    ball.x = i === 0 ? px + PAD_W : px - BALL;
    SFX.paddle();
    return true;
  }
  function update(dt) {
    if (online.msgT > 0) online.msgT -= dt;
    if (mode === 'menu' || mode === 'pause' || mode === 'lobby' || mode === 'online' || mode === 'join') return;
    if (isGuest()) {
      movePaddle(1, dt);
      if (ball.live && mode === 'play') {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.y < 0) { ball.y = 0; ball.vy = Math.abs(ball.vy); }
        if (ball.y > H - BALL) { ball.y = H - BALL; ball.vy = -Math.abs(ball.vy); }
      }
      if (++netTick % 2 === 0) netSend({ t: 'p', y: Math.round(P[1].y) });
      return;
    }
    if (isHost() && ++netTick % 2 === 0) {
      netSend({ t: 's', b: [Math.round(ball.x * 10) / 10, Math.round(ball.y * 10) / 10, Math.round(ball.vx), Math.round(ball.vy), ball.live ? 1 : 0], p: Math.round(P[0].y), sc: [P[0].score, P[1].score], m: mode, w: winner, tm: timer, e: netEvents });
      netEvents = [];
    }
    movePaddle(0, dt); movePaddle(1, dt);
    if (mode === 'serve') { timer -= dt; if (timer <= 0) serve(); return; }
    if (mode === 'point') { timer -= dt; if (timer <= 0) { if (winner >= 0) mode = 'over'; else toServe(); } return; }
    if (mode !== 'play') return;
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    if (ball.y < 0) { ball.y = 0; ball.vy = Math.abs(ball.vy); SFX.wall(); }
    if (ball.y > H - BALL) { ball.y = H - BALL; ball.vy = -Math.abs(ball.vy); SFX.wall(); }
    if (ball.vx < 0) hitPaddle(0); else hitPaddle(1);
    if (ball.x < -BALL || ball.x > W) {
      const scorer = ball.x < 0 ? 1 : 0;
      P[scorer].score++;
      SFX.score();
      ball.live = false;
      serveDir = scorer === 0 ? 1 : -1;  // serve goes toward the player who just lost the point
      if (P[scorer].score >= WIN) winner = scorer;
      mode = 'point'; timer = winner >= 0 ? 0.8 : 0.6;
    }
  }

  // ---------- draw ----------
  const MENU = () => ['1 PLAYER', '2 PLAYERS', 'PLAY ONLINE', 'CPU: ' + opts.diff.toUpperCase(), 'CRT: ' + (opts.crt ? 'ON' : 'OFF'), 'SOUND: ' + (opts.sound ? 'ON' : 'OFF')];
  function draw(now) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(view.s * view.dpr, 0, 0, view.s * view.dpr, view.ox * view.dpr, view.oy * view.dpr);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    if (opts.crt) { ctx.shadowColor = 'rgba(255,255,255,0.75)'; ctx.shadowBlur = 10; }
    // net
    ctx.fillStyle = '#fff';
    for (let y = 6; y < H; y += 30) ctx.fillRect(W / 2 - 3, y, 6, 16);
    if (mode === 'online' || mode === 'lobby' || mode === 'join') {
      ctx.fillStyle = '#000'; ctx.fillRect(W / 2 - 260, 140, 520, 340);
      text('ONLINE', W / 2, 160, 8);
      if (mode === 'online') {
        ['CREATE ROOM', 'JOIN ROOM', 'BACK'].forEach((m, i) => {
          const y = 300 + i * 40;
          text(m, W / 2, y, 3, i === online.sel ? '#fff' : '#8a8a8a');
          if (i === online.sel && Math.floor(now / 400) % 2 === 0) { text('>', W / 2 - textW(m, 3) / 2 - 26, y, 3); text('<', W / 2 + textW(m, 3) / 2 + 12, y, 3); }
        });
        text('HOST PLAYS LEFT, GUEST PLAYS RIGHT', W / 2, 440, 2, '#8a8a8a');
      } else if (mode === 'join') {
        const c = (online.joinCode + '____').slice(0, 4);
        text('TYPE THE ROOM CODE', W / 2, 270, 3, '#bbb');
        text(c.split('').join(' '), W / 2, 320, 8);
        text('ENTER TO JOIN  ESC TO GO BACK', W / 2, 420, 2, '#8a8a8a');
      } else {
        if (!net || net.status === 'connecting') text('CONNECTING...', W / 2, 300, 3, '#bbb');
        else if (net.status === 'waiting') {
          text('ROOM CODE', W / 2, 260, 3, '#bbb');
          text(net.code.split('').join(' '), W / 2, 300, 8);
          text('WAITING FOR PLAYER 2' + '...'.slice(0, Math.floor(now / 400) % 4), W / 2, 380, 2, '#bbb');
          text('TAP TO COPY INVITE LINK  ESC TO CANCEL', W / 2, 420, 2, '#8a8a8a');
        } else text('JOINING ' + net.code + '...', W / 2, 300, 3, '#bbb');
      }
    } else if (mode === 'menu') {
      digits(0, W / 2 - 110, 40, 12); digits(0, W / 2 + 110, 40, 12);
      ctx.fillStyle = '#000'; ctx.fillRect(W / 2 - 220, 170, 440, 410);
      text('PONG', W / 2, 190, 14);
      MENU().forEach((m, i) => {
        const y = 330 + i * 34;
        text(m, W / 2, y, 3, i === menuSel ? '#fff' : '#8a8a8a');
        if (i === menuSel && Math.floor(now / 400) % 2 === 0) { text('>', W / 2 - textW(m, 3) / 2 - 26, y, 3); text('<', W / 2 + textW(m, 3) / 2 + 12, y, 3); }
      });
      text('FIRST TO 11', W / 2, 548, 2, '#8a8a8a');
    } else {
      digits(P[0].score, W / 2 - 110, 40, 12);
      digits(P[1].score, W / 2 + 110, 40, 12);
      if (net && net.status === 'playing') { text(net.side === 0 ? 'YOU' : 'P1', W / 2 - 110, 140, 2, '#9a9a9a'); text(net.side === 1 ? 'YOU' : 'P2', W / 2 + 110, 140, 2, '#9a9a9a'); }
      ctx.fillStyle = '#fff';
      ctx.fillRect(PAD_X, Math.round(P[0].y), PAD_W, PAD_H);
      ctx.fillRect(W - PAD_X - PAD_W, Math.round(P[1].y), PAD_W, PAD_H);
      if (ball.live || mode === 'serve' && Math.floor(now / 250) % 2 === 0) ctx.fillRect(Math.round(ball.x), Math.round(ball.y), BALL, BALL);
      if (mode === 'over') {
        ctx.fillStyle = '#000'; ctx.fillRect(W / 2 - 250, 230, 500, 160);
        const who = net && net.status === 'playing' ? (winner === net.side ? 'YOU WIN!' : 'YOU LOSE') : players === 1 ? (winner === 0 ? 'YOU WIN!' : 'CPU WINS') : `PLAYER ${winner + 1} WINS`;
        text(who, W / 2, 250, 6);
        text('PRESS SPACE OR TAP TO PLAY AGAIN', W / 2, 330, 2, '#bbb');
        text(net ? 'ESC TO LEAVE THE ROOM' : 'ESC FOR MENU', W / 2, 360, 2, '#888');
      }
      if (mode === 'pause') { ctx.fillStyle = '#000'; ctx.fillRect(W / 2 - 160, 260, 320, 90); text('PAUSED', W / 2, 280, 6); }
    }
    if (online.msgT > 0) { ctx.fillStyle = '#000'; const w = textW(online.msg, 3) + 40; ctx.fillRect(W / 2 - w / 2, 500, w, 44); text(online.msg, W / 2, 510, 3); }
    ctx.restore();
    if (opts.crt) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      for (let y = 0; y < H; y += 4) ctx.fillRect(0, y + 2, W, 2);
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------- layout ----------
  const view = { s: 1, ox: 0, oy: 0, dpr: 1 };
  function fit() {
    const vw = innerWidth, vh = innerHeight, dpr = Math.min(3, devicePixelRatio || 1);
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
    view.s = Math.min(vw / W, vh / H); view.dpr = dpr;
    view.ox = (vw - W * view.s) / 2; view.oy = (vh - H * view.s) / 2;
  }
  addEventListener('resize', fit); fit();

  // ---------- input ----------
  function menuPick(i) {
    if (i === 0) newGame(1);
    else if (i === 1) newGame(2);
    else if (i === 2) { mode = 'online'; online.sel = 0; }
    else if (i === 3) { const d = ['easy', 'normal', 'hard']; opts.diff = d[(d.indexOf(opts.diff) + 1) % 3]; store.set('opts', opts); }
    else if (i === 4) { opts.crt = !opts.crt; store.set('opts', opts); }
    else if (i === 5) { opts.sound = !opts.sound; store.set('opts', opts); }
    beep(459, 40);
  }
  addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    if (mode === 'online') {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') online.sel = (online.sel + 2) % 3;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') online.sel = (online.sel + 1) % 3;
      if (e.code === 'Enter' || e.code === 'Space') onlinePick(online.sel);
      if (e.code === 'Escape') mode = 'menu';
      return;
    }
    if (mode === 'join') {
      if (/^Key[A-Z]$/.test(e.code) && online.joinCode.length < 4) online.joinCode += e.code.slice(3);
      if (e.code === 'Backspace') online.joinCode = online.joinCode.slice(0, -1);
      if (e.code === 'Enter') joinRoom(online.joinCode);
      if (e.code === 'Escape') mode = 'online';
      return;
    }
    if (mode === 'lobby') { if (e.code === 'Escape') leaveOnline(); return; }
    if (mode === 'menu') {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') menuSel = (menuSel + 5) % 6;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') menuSel = (menuSel + 1) % 6;
      if (e.code === 'Enter' || e.code === 'Space') menuPick(menuSel);
      if (e.code === 'Digit1') newGame(1);
      if (e.code === 'Digit2') newGame(2);
      return;
    }
    if (mode === 'over') { if (e.code === 'Space' || e.code === 'Enter') again(); if (e.code === 'Escape') { if (net) leaveOnline(); mode = 'menu'; } return; }
    if (net && e.code === 'Escape') { leaveOnline(); return; }
    if (!net && (e.code === 'KeyP' || e.code === 'Escape')) {
      if (mode === 'pause') mode = pausedFrom; else { pausedFrom = mode; mode = 'pause'; }
    }
    if (e.code === 'KeyQ' && mode === 'pause') mode = 'menu';
  });
  let pausedFrom = 'play';
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (!net && (mode === 'play' || mode === 'serve')) { pausedFrom = mode; mode = 'pause'; } });
  function again() { if (isGuest()) netSend({ t: 'again' }); else newGame(players); }
  function onlinePick(i) {
    if (i === 0) createRoom();
    else if (i === 1) {
      if (touchDevice) { const c = prompt('Room code (4 letters)'); if (c) joinRoom(c); }
      else { online.joinCode = ''; mode = 'join'; }
    } else mode = 'menu';
    beep(459, 40);
  }
  const touchDevice = matchMedia('(pointer: coarse)').matches;

  const toLogical = (e) => ({ x: (e.clientX - view.ox) / view.s, y: (e.clientY - view.oy) / view.s });
  const pointers = new Map();
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const p = toLogical(e);
    if (mode === 'menu') {
      const i = Math.floor((p.y - 322) / 34);
      if (i >= 0 && i < 6 && Math.abs(p.x - W / 2) < 220) { menuSel = i; menuPick(i); }
      return;
    }
    if (mode === 'online') {
      const i = Math.floor((p.y - 292) / 40);
      if (i >= 0 && i < 3) { online.sel = i; onlinePick(i); }
      return;
    }
    if (mode === 'lobby') {
      if (net && net.status === 'waiting') {
        const link = location.origin + location.pathname + '?room=' + net.code;
        if (navigator.share) navigator.share({ title: 'Pong', text: 'Play Pong with me', url: link }).catch(() => {});
        else if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => flashMsg('INVITE LINK COPIED'), () => {});
      }
      return;
    }
    if (mode === 'over') { again(); return; }
    if (mode === 'pause') { mode = pausedFrom; return; }
    pointers.set(e.pointerId, p);
    trackTouches();
  });
  cv.addEventListener('pointermove', (e) => { if (pointers.has(e.pointerId)) { pointers.set(e.pointerId, toLogical(e)); trackTouches(); } });
  const lift = (e) => { pointers.delete(e.pointerId); trackTouches(); };
  cv.addEventListener('pointerup', lift); cv.addEventListener('pointercancel', lift);
  // 1 player: a finger anywhere moves your paddle. 2 players: each half of the screen drives its own paddle.
  function trackTouches() {
    touchY[0] = touchY[1] = null;
    for (const p of pointers.values()) {
      if (players === 1 || (net && net.status === 'playing')) touchY[0] = p.y;
      else touchY[p.x < W / 2 ? 0 : 1] = p.y;
    }
  }

  // ---------- loop ----------
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    draw(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const inviteCode = new URLSearchParams(location.search).get('room');
  if (inviteCode) joinRoom(inviteCode);
  window.PONG = { get mode() { return mode; }, get net() { return net; }, P, ball, newGame, update, opts, createRoom, joinRoom };
})();
