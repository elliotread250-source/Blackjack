/*
 * App glue: screens (title with an AI attract demo, ready/go, playing,
 * paused, game over), fixed-timestep loop, storage, sound and effects wiring.
 */
(function () {
  'use strict';
  const E = window.TetrisEngine, R = window.TetrisRender;
  const STEP = 1000 / 240;                 // fixed simulation step (ms)
  const READY_MS = 900, GO_MS = 520;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const store = {
    get(k, d) { try { const v = window.localStorage.getItem('tetris.' + k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { window.localStorage.setItem('tetris.' + k, String(v)); } catch (e) { /* storage blocked */ } },
  };
  const num = (v) => { const n = Number(v); return isFinite(n) && n > 0 ? n : 0; };

  // ---- attract-mode player: El-Tetris placement AI driving a real Game ----
  class Demo {
    constructor(app) { this.app = app; this.reset(); }
    reset() {
      this.game = new E.Game({ mode: 'marathon', startLevel: 1 });
      this.app.wire(this.game, true);
      this.game.start();
      this.plan = null; this.timer = 0; this.overT = 0;
    }
    update(dt) {
      const g = this.game;
      if (g.phase === 'over' || g.lines >= 150) {
        this.overT += dt;
        if (this.overT > 2200) this.reset();
        return;
      }
      g.update(dt);
      const a = g.active;
      if (!a || g.phase !== 'falling') { this.plan = null; return; }
      if (!this.plan || this.plan.piece !== a) {
        const best = E.AI.best(g);
        if (!best) return;
        this.plan = { piece: a, rot: best.rot, x: best.x, wait: 180 + Math.random() * 160 };
        this.timer = 0;
      }
      const p = this.plan;
      this.timer += dt;
      if (this.timer < p.wait) return;
      this.timer = 0; p.wait = 60 + Math.random() * 30;
      if (a.rot !== p.rot) {
        const d = (p.rot - a.rot + 4) % 4;
        if (!g.rotate(d === 3 ? -1 : d === 2 ? 2 : 1)) p.rot = a.rot;
        return;
      }
      if (a.x !== p.x) { if (!g.shift(Math.sign(p.x - a.x))) p.x = a.x; return; }
      if (!p.settled) { p.settled = true; p.wait = 140; return; }
      g.hardDrop();
    }
  }

  class App {
    constructor() {
      this.canvas = $('game');
      this.renderer = new R.Renderer(this.canvas);
      this.fx = this.renderer.fx;
      this.sound = new window.TetrisSound();
      this.mode = store.get('mode', 'marathon') === 'sprint' ? 'sprint' : 'marathon';
      this.startLevel = clamp(parseInt(store.get('level', '1'), 10) || 1, 1, 15);
      this.best = { marathon: num(store.get('best.marathon', 0)), sprint: num(store.get('best.sprint', 0)) };
      this.sound.muted = store.get('muted', '0') === '1';
      this.sound.musicOn = store.get('music', '1') !== '0';
      let coarse = false;
      try { coarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) { /* old browser */ }
      this.touch = coarse || 'ontouchstart' in window;
      this.screen = 'title';
      this.game = null;
      this.readyT = 0;
      this.overT = 0;
      this.acc = 0;
      this.last = performance.now();
      this.demo = new Demo(this);
      this.input = new window.TetrisInput(this, this.canvas, $('touch'));
      this.bindUI();
      this.applyTouchClass();
      this.resize();
      this.showScreen('title');
      this.refreshTitle();
      this.refreshAudioUI();

      const unlock = () => this.sound.unlock();
      for (const ev of ['pointerdown', 'keydown', 'touchend', 'click']) window.addEventListener(ev, unlock, true);
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(true); });
      window.addEventListener('pagehide', () => this.pause(true));
      let pending = false;
      const onResize = () => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; this.resize(); }); };
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', () => setTimeout(onResize, 120));
      if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

      requestAnimationFrame((t) => this.frame(t));
    }

    // ------------------------------------------------------------- layout
    applyTouchClass() { document.body.classList.toggle('touch', this.touch); }

    noteTouch(e) {
      if (e && e.pointerType === 'touch' && !this.touch) { this.touch = true; this.applyTouchClass(); this.resize(); }
    }

    safeArea() {
      const p = $('safe-probe');
      if (!p) return { top: 0, right: 0, bottom: 0, left: 0 };
      const cs = getComputedStyle(p);
      return { top: parseFloat(cs.paddingTop) || 0, right: parseFloat(cs.paddingRight) || 0, bottom: parseFloat(cs.paddingBottom) || 0, left: parseFloat(cs.paddingLeft) || 0 };
    }

    resize() {
      const W = window.innerWidth, H = window.innerHeight;
      const dpr = clamp(window.devicePixelRatio || 1, 1, 3);
      const land = W > H * 1.05;
      document.body.classList.toggle('land', land);
      const ins = this.safeArea();
      const root = document.documentElement.style;
      if (this.touch) {
        if (land) {
          const btn = Math.round(clamp(H * 0.16, 44, 64));
          root.setProperty('--btn', btn + 'px');
          const w = btn * 2 + 8 + 14;
          ins.left += w; ins.right += w;
        } else {
          const bh = Math.round(clamp(H * 0.082, 52, 76));
          root.setProperty('--bar-h', bh + 'px');
          ins.bottom += bh + 12;
        }
      }
      const L = this.renderer.resize(W, H, dpr, ins);
      const hud = $('hud');
      hud.style.left = Math.round(L.icons.x) + 'px';
      hud.style.top = Math.round(L.icons.y) + 'px';
      hud.style.gap = L.icons.gap + 'px';
      root.setProperty('--icon', L.icons.size + 'px');
      this.renderer.drawLogo($('logo'), Math.min(300, W - 96));
    }

    cellCss() { return this.renderer.L ? this.renderer.L.cellCss : 30; }

    // ------------------------------------------------------------- UI
    bindUI() {
      const click = (id, fn) => $(id).addEventListener('click', (e) => { e.currentTarget.blur(); fn(); });
      click('btn-start', () => this.start());
      click('lvl-dn', () => this.changeLevel(-1));
      click('lvl-up', () => this.changeLevel(1));
      for (const b of document.querySelectorAll('[data-mode]')) {
        b.addEventListener('click', (e) => { e.currentTarget.blur(); this.setMode(b.dataset.mode); });
      }
      for (const b of document.querySelectorAll('.music-chip')) b.addEventListener('click', (e) => { e.currentTarget.blur(); this.toggleMusic(); });
      click('btn-resume', () => this.resume());
      click('btn-restart', () => this.start());
      click('btn-pause-menu', () => this.toMenu());
      click('btn-again', () => this.start());
      click('btn-over-menu', () => this.toMenu());
      click('btn-pause', () => (this.screen === 'paused' ? this.resume() : this.pause()));
      click('btn-mute', () => this.toggleMute());
    }

    showScreen(name) {
      this.screen = name;
      document.body.dataset.screen = name;
      const ov = $('overlay');
      const card = name === 'title' ? 'scr-title' : name === 'paused' ? 'scr-pause' : name === 'over' && this.overShown ? 'scr-over' : null;
      ov.classList.toggle('hidden', !card);
      ov.classList.toggle('is-title', name === 'title');
      for (const id of ['scr-title', 'scr-pause', 'scr-over']) $(id).hidden = id !== card;
      $('btn-pause').setAttribute('aria-label', name === 'paused' ? 'Resume' : 'Pause');
    }

    refreshTitle() {
      for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === this.mode));
      $('lvl').textContent = String(this.startLevel);
      $('level-row').hidden = this.mode !== 'marathon';
      $('mode-desc').textContent = this.mode === 'marathon'
        ? 'Endless. Speed rises every 10 lines.'
        : 'Clear 40 lines as fast as you can.';
      const b = this.best[this.mode];
      $('title-best').textContent = this.mode === 'marathon'
        ? 'Best ' + (b ? R.fmt(b) : '0')
        : 'Best time ' + (b ? R.fmtTime(b) : '--');
    }

    refreshAudioUI() {
      document.body.classList.toggle('muted', this.sound.muted);
      $('btn-mute').setAttribute('aria-label', this.sound.muted ? 'Unmute' : 'Mute');
      for (const b of document.querySelectorAll('.music-chip')) {
        b.textContent = 'Music: ' + (this.sound.musicOn ? 'On' : 'Off');
        b.setAttribute('aria-pressed', String(this.sound.musicOn));
      }
    }

    setMode(m) {
      if (m !== 'marathon' && m !== 'sprint') return;
      this.mode = m;
      store.set('mode', m);
      this.sound.play('menu');
      this.refreshTitle();
    }

    changeLevel(d) {
      const nl = clamp(this.startLevel + d, 1, 15);
      if (nl !== this.startLevel) this.sound.play('menu');
      this.startLevel = nl;
      store.set('level', nl);
      this.refreshTitle();
    }

    toggleMute() {
      this.sound.unlock();
      this.sound.setMuted(!this.sound.muted);
      store.set('muted', this.sound.muted ? '1' : '0');
      this.refreshAudioUI();
    }

    toggleMusic() {
      this.sound.unlock();
      this.sound.setMusicOn(!this.sound.musicOn);
      store.set('music', this.sound.musicOn ? '1' : '0');
      this.refreshAudioUI();
      this.sound.play('menu');
    }

    // ------------------------------------------------------------- flow
    start() {
      this.sound.unlock();
      store.set('mode', this.mode);
      store.set('level', this.startLevel);
      this.input.down.clear();
      this.game = new E.Game({ mode: this.mode, startLevel: this.startLevel });
      this.wire(this.game, false);
      this.fx.clear();
      this.readyT = 0;
      this.goFired = false;
      this.complete = false;
      this.newBest = false;
      this.overShown = false;
      this.overT = 0;
      this.sound.musicStop();
      this.sound.setTempo(this.tempo());
      this.showScreen('ready');
      this.sound.play('ready');
    }

    tempo() { return 140 + Math.min((this.game ? this.game.level : 1) - 1, 14) * 4; }

    pause(auto) {
      if (this.screen !== 'playing' && this.screen !== 'ready') return;
      this.prevScreen = this.screen;
      this.game.releaseAll();
      this.input.down.clear();
      this.sound.musicPause();
      if (!auto) this.sound.play('pause');
      this.showScreen('paused');
    }

    resume() {
      if (this.screen !== 'paused') return;
      this.showScreen(this.prevScreen || 'playing');
      this.last = performance.now();
      this.acc = 0;
      this.sound.musicResume();
      this.sound.play('resume');
    }

    toMenu() {
      this.sound.musicStop();
      this.fx.clear();
      this.game = null;
      this.showScreen('title');
      this.refreshTitle();
      this.sound.play('menu');
    }

    onGameOver() {
      const g = this.game;
      this.overT = 0;
      this.overShown = false;
      this.sound.musicStop();
      this.sound.play('gameover');
      if (this.mode === 'marathon' && g.score > this.best.marathon) {
        this.newBest = this.best.marathon > 0 || g.score > 0;
        this.best.marathon = g.score;
        store.set('best.marathon', g.score);
      }
      this.showScreen('over');
    }

    onComplete() {
      const g = this.game;
      this.complete = true;
      this.overT = 0;
      this.overShown = false;
      this.sound.musicStop();
      this.sound.play('complete');
      if (!this.best.sprint || g.time < this.best.sprint) {
        this.newBest = true;
        this.best.sprint = Math.round(g.time);
        store.set('best.sprint', Math.round(g.time));
      }
      this.showScreen('over');
    }

    showOverCard() {
      const g = this.game;
      this.overShown = true;
      const sprint = this.mode === 'sprint';
      $('over-title').textContent = this.complete ? '40 Lines Clear!' : 'Game Over';
      $('over-newbest').hidden = !this.newBest;
      const rows = [];
      if (sprint) {
        rows.push(['Time', R.fmtTime(g.time), true]);
        rows.push(['Lines', Math.min(g.lines, 40) + ' / 40']);
        rows.push(['Pieces', String(g.pieces)]);
        rows.push(['PPS', g.time > 0 ? (g.pieces / (g.time / 1000)).toFixed(2) : '0.00']);
        rows.push(['Best', this.best.sprint ? R.fmtTime(this.best.sprint) : '--']);
      } else {
        rows.push(['Score', R.fmt(g.score), true]);
        rows.push(['Level', String(g.level)]);
        rows.push(['Lines', String(g.lines)]);
        rows.push(['Tetrises', String(g.stats.tetrises)]);
        rows.push(['T-spins', String(g.stats.tspins)]);
        rows.push(['Time', R.fmtTime(g.time).replace(/\.\d+$/, '')]);
        rows.push(['Best', R.fmt(this.best.marathon)]);
      }
      const box = $('over-stats');
      box.textContent = '';
      for (const [k, v, big] of rows) {
        const d = document.createElement('div');
        d.className = big ? 'stat big' : 'stat';
        const a = document.createElement('span'); a.textContent = k;
        const b = document.createElement('strong'); b.textContent = v;
        d.append(a, b);
        box.append(d);
      }
      if (this.newBest) this.sound.play('newbest');
      this.showScreen('over');
    }

    // ------------------------------------------------------------- events
    wire(g, silent) {
      const fx = this.fx;
      let lastHard = false;
      const snd = (n, a) => { if (!silent && g === this.game) this.sound.play(n, a); };
      const visible = () => (silent ? this.screen === 'title' && this.demo && g === this.demo.game : g === this.game);
      g.on((type, d) => {
        if (!visible()) return;
        switch (type) {
          case 'move': snd('move'); break;
          case 'rotate': if (!d.o) snd('rotate'); break;
          case 'soft': snd('soft'); break;
          case 'hold': snd('hold'); break;
          case 'holdfail': snd('holdfail'); break;
          case 'harddrop': lastHard = true; fx.trail(g, d); snd('harddrop'); break;
          case 'lock':
            if (!lastHard) snd('lock');
            lastHard = false;
            fx.lockFlash(d.cells);
            break;
          case 'action': {
            const lines = [];
            if (d.b2b) lines.push({ text: 'BACK-TO-BACK', color: '#ffd76a', size: 0.5 });
            const special = d.lines === 4 || d.tspin !== 'none';
            lines.push({ text: d.name, color: d.tspin !== 'none' ? '#d68cff' : d.lines === 4 ? '#5ff3ff' : '#ffffff', size: special ? 0.86 : 0.7 });
            if (d.combo >= 1) lines.push({ text: 'COMBO x' + d.combo, color: '#ffa64d', size: 0.56 });
            if (d.perfect) lines.push({ text: 'PERFECT CLEAR', color: '#7dffb0', size: 0.62 });
            if (!silent) lines.push({ text: '+' + R.fmt(d.points), color: '#c9cff0', size: 0.46 });
            fx.label(lines);
            if (d.rows.length) fx.burst(g.board, d.rows, d.lines === 4);
            if (d.tspin !== 'none') snd('tspin');
            if (d.lines === 4) { snd('tetris'); fx.shake(0.2, 320); fx.flash('rgba(120,240,255,A)', 300); }
            else if (d.lines > 0 && d.tspin === 'none') snd('clear', d.lines);
            if (d.b2b) snd('b2b');
            if (d.combo >= 1) snd('combo', d.combo);
            if (d.perfect) { snd('perfect'); fx.flash('rgba(140,255,190,A)', 500); }
            break;
          }
          case 'levelup':
            fx.label([{ text: 'LEVEL ' + d.level, color: '#7dff9a', size: 0.62 }], true);
            snd('levelup');
            if (!silent) this.sound.setTempo(this.tempo());
            break;
          case 'gameover': if (!silent) this.onGameOver(); break;
          case 'complete': if (!silent) this.onComplete(); break;
        }
      });
    }

    // ------------------------------------------------------------- input
    onAction(a, down, repeat) {
      if (a === 'mute') { if (down && !repeat) this.toggleMute(); return; }
      if (a === 'music') { if (down && !repeat) this.toggleMusic(); return; }
      const s = this.screen;
      if (s === 'title') {
        if (!down) return;
        if ((a === 'enter' || a === 'hard') && !repeat) this.start();
        else if (a === 'left') this.changeLevel(-1);
        else if (a === 'right') this.changeLevel(1);
        else if ((a === 'cw' || a === 'soft') && !repeat) this.setMode(this.mode === 'marathon' ? 'sprint' : 'marathon');
        return;
      }
      if (s === 'ready' || s === 'playing') {
        if (a === 'pause') { if (down && !repeat) this.pause(); return; }
        if (a === 'enter' || repeat) return;
        if (down) this.game.press(a); else this.game.release(a);
        return;
      }
      if (s === 'paused') {
        if (down && !repeat && (a === 'pause' || a === 'enter')) this.resume();
        if (!down && this.game) this.game.release(a);
        return;
      }
      if (s === 'over') {
        if (!down || repeat || !this.overShown || this.overT < 1600) return;
        if (a === 'enter') this.start();
        else if (a === 'pause') this.toMenu();
      }
    }

    onReleaseAll() { if (this.game) this.game.releaseAll(); }

    gesturesEnabled() { return this.screen === 'playing' && !!this.game && this.game.playing; }

    onGesture(kind) {
      const g = this.game;
      if (!this.gesturesEnabled()) return;
      switch (kind) {
        case 'shiftL': g.shift(-1); break;
        case 'shiftR': g.shift(1); break;
        case 'softStep': g.softStep(); break;
        case 'hard': g.hardDrop(); break;
        case 'hold': g.holdPiece(); break;
        case 'cw': g.rotate(1); break;
      }
    }

    // ------------------------------------------------------------- loop
    tick(dt) {
      switch (this.screen) {
        case 'title': this.demo.update(dt); break;
        case 'ready':
        case 'playing':
          this.readyT += dt;
          if (!this.goFired && this.readyT >= READY_MS) {
            this.goFired = true;
            this.game.start();
            this.showScreen('playing');
            this.sound.play('go');
            this.sound.musicStart();
          }
          this.game.update(dt);
          break;
        case 'over':
          this.overT += dt;
          if (!this.overShown && this.overT > (this.complete ? 1000 : 1400)) this.showOverCard();
          break;
      }
    }

    frame(now) {
      requestAnimationFrame((t) => this.frame(t));
      let dt = now - this.last;
      this.last = now;
      if (!(dt > 0)) dt = 0;
      if (dt > 100) dt = 100;
      this.acc += dt;
      let n = 0;
      while (this.acc >= STEP && n < 60) { this.tick(STEP); this.acc -= STEP; n++; }
      if (n >= 60) this.acc = 0;
      if (this.screen !== 'paused') this.fx.update(dt);
      this.sound.musicTick();
      this.render(now);
    }

    render(now) {
      const inGame = this.screen !== 'title' && this.game;
      let banner = null;
      if (inGame && (this.screen === 'ready' || this.screen === 'playing') && this.readyT < READY_MS + GO_MS) {
        if (this.readyT < READY_MS) banner = { text: 'READY', t: this.readyT, color: '#ffffff' };
        else {
          const t = this.readyT - READY_MS;
          banner = { text: 'GO!', t, big: true, color: '#7dff9a', alpha: t > 300 ? Math.max(0, 1 - (t - 300) / (GO_MS - 300)) : 1 };
        }
      }
      if (inGame && this.screen === 'over' && this.complete && !this.overShown) banner = { text: 'FINISH!', t: this.overT, big: true, color: '#ffd76a' };
      this.renderer.draw({
        game: inGame ? this.game : this.demo.game,
        mode: inGame ? this.mode : 'marathon',
        best: inGame ? this.best[this.mode] : this.best.marathon,
        live: this.screen === 'playing' || this.screen === 'ready',
        now,
        hideBoard: this.screen === 'paused',
        overT: this.screen === 'over' && !this.complete ? this.overT : null,
        banner,
      });
    }
  }

  function boot() {
    const app = new App();
    // Small debug/test hook.
    window.__tetris = {
      app,
      get game() { return app.game; },
      get screen() { return app.screen; },
      start(opts) {
        if (opts && opts.mode) app.mode = opts.mode;
        if (opts && opts.level) app.startLevel = opts.level;
        app.start();
      },
      skipReady() { if (app.screen === 'ready') { app.readyT = READY_MS - STEP; app.tick(STEP); } },
      step(ms) { for (let t = 0; t < ms; t += STEP) app.tick(STEP); },
      state() {
        const g = app.game;
        if (!g) return { screen: app.screen };
        return {
          screen: app.screen, phase: g.phase, score: g.score, lines: g.lines, level: g.level, combo: g.combo, b2b: g.b2b,
          pieces: g.pieces, time: g.time, hold: g.hold, holdUsed: g.holdUsed, queue: g.queue.slice(0, 5),
          active: g.active && { type: g.active.type, rot: g.active.rot, x: g.active.x, y: g.active.y },
          stack: g.board.slice(E.TOP).map((r) => Array.from(r).map((v) => (v ? '#' : '.')).join('')),
        };
      },
      setBoard(rows) { app.game.setBoardRows(rows); },
      setQueue(q) { app.game.setQueue(q); },
      setActive(t) { app.game.setActive(t); },
      layout() { const L = app.renderer.L; return L && { narrow: L.narrow, u: L.u, dpr: L.dpr, board: L.boardCss, cellCss: L.cellCss, icons: L.icons }; },
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
