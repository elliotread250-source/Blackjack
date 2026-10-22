// view.js: draws the board and plays the event list the rules engine recorded. It owns no
// game logic: a sprite per candy id, a tween per movement, particles and popups on top.
import { W, H, N, T } from './core.js';
import { CANDIES, makeSprites } from './art.js';
import { Tweens, Particles, ease } from './tween.js';
import { Sfx } from './audio.js';

const COMBO_WORDS = { 3: 'Yum!', 4: 'Tasty!', 5: 'Scrumptious!', 6: 'Sugar rush!' };
const row = i => (i / W) | 0, col = i => i % W;

export class BoardView {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.tw = new Tweens(); this.pa = new Particles();
    this.sprites = new Map(); this.fx = []; this.pops = [];
    this.size = 360; this.cell = 40; this.dpr = 1;
    this.mask = new Uint8Array(N); this.jelly = new Uint8Array(N);
    this.sel = -1; this.cursor = -1; this.hintIds = null; this.shake = 0; this.time = 0;
    this.baseSpeed = 1; this.boost = false; this.running = false;
    this.hooks = {};
    const mq = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = !!(mq && mq.matches);
    this.pa.reduced = this.reduced;
  }

  // ---------------------------------------------------------------- setup
  resize(sizeCss) {
    this.size = Math.floor(sizeCss);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.cell = this.size / W;
    const px = Math.round(this.size * this.dpr);
    this.cv.width = this.cv.height = px;
    this.cv.style.width = this.cv.style.height = this.size + 'px';
    this.sp = makeSprites(this.cell * this.dpr);
    this.buildBg();
  }
  buildBg() {
    const c = document.createElement('canvas'), d = this.dpr, cs = this.cell;
    c.width = c.height = Math.round(this.size * d);
    const x = c.getContext('2d'); x.scale(d, d);
    for (let i = 0; i < N; i++) {
      if (!this.mask[i]) continue;
      const px = col(i) * cs, py = row(i) * cs;
      x.fillStyle = (row(i) + col(i)) % 2 ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.11)';
      x.beginPath(); x.roundRect(px + 0.75, py + 0.75, cs - 1.5, cs - 1.5, cs * 0.14); x.fill();
    }
    this.bg = c;
  }
  setState(st) {
    this.mask = st.L.mask;
    this.jelly = Uint8Array.from(st.jelly);
    this.sprites.clear(); this.fx = []; this.pops = []; this.pa.list = [];
    this.sel = -1; this.hintIds = null;
    for (const i of st.L.cells) { const cd = st.board[i]; if (cd) this.mkSprite(cd.id, cd.t, cd.c, col(i), row(i), cd.cage); }
    if (this.sp) this.buildBg();
  }
  mkSprite(id, t, c, x, y, cage = 0) {
    const s = { id, t, c, cage, x, y, sx: 1, sy: 1, a: 1, rot: 0 };
    this.sprites.set(id, s);
    return s;
  }
  /** Make the sprites match the logic state exactly (after a batch of events, or on reset). */
  sync(st) {
    const live = new Set();
    for (const i of st.L.cells) {
      const cd = st.board[i];
      if (!cd) continue;
      live.add(cd.id);
      let s = this.sprites.get(cd.id);
      if (!s) s = this.mkSprite(cd.id, cd.t, cd.c, col(i), row(i), cd.cage);
      s.t = cd.t; s.c = cd.c; s.cage = cd.cage; s.x = col(i); s.y = row(i); s.sx = s.sy = s.a = 1; s.rot = 0;
    }
    for (const id of [...this.sprites.keys()]) if (!live.has(id)) this.sprites.delete(id);
    this.jelly = Uint8Array.from(st.jelly);
  }
  spriteAt(i) {
    for (const s of this.sprites.values()) if (Math.round(s.x) === col(i) && Math.round(s.y) === row(i)) return s;
    return null;
  }
  cellAt(clientX, clientY) {
    const r = this.cv.getBoundingClientRect();
    const fx = (clientX - r.left) / r.width * W, fy = (clientY - r.top) / r.height * H;
    if (fx < 0 || fy < 0 || fx >= W || fy >= H) return { i: -1, fx, fy };
    const i = Math.floor(fy) * W + Math.floor(fx);
    return { i: this.mask[i] ? i : -1, fx, fy };
  }
  setHint(a, b) {
    const ids = new Set();
    for (const i of [a, b]) { const s = this.spriteAt(i); if (s) ids.add(s.id); }
    this.hintIds = ids;
  }
  clearHint() { this.hintIds = null; }
  setSpeed(v) { this.baseSpeed = v; this.applySpeed(); }
  applySpeed() { this.tw.speed = this.baseSpeed * (this.boost ? 3.2 : 1); }

  // ---------------------------------------------------------------- loop
  start() {
    if (this.running) return;
    this.running = true;
    let last = performance.now();
    const frame = now => {
      if (!this.running) return;
      const dt = Math.min(50, now - last); last = now;
      this.time = now;
      this.tick(dt);
      this.draw();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  tick(dt) {
    this.tw.update(dt);
    const d = dt * this.tw.speed;
    this.pa.update(d);
    for (let i = 0; i < this.fx.length; i++) { const f = this.fx[i]; f.t += d; if (f.t >= f.dur) { this.fx.splice(i, 1); i--; } }
    for (let i = 0; i < this.pops.length; i++) { const p = this.pops[i]; p.t += d; if (p.t >= p.dur) { this.pops.splice(i, 1); i--; } }
    this.shake = Math.max(0, this.shake - dt * 0.03);
    if (this.hooks.frame) this.hooks.frame(dt);
  }

  // ---------------------------------------------------------------- drawing
  draw() {
    const ctx = this.ctx, cs = this.cell, d = this.dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, this.size, this.size);
    if (this.shake > 0 && !this.reduced) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    if (this.bg) ctx.drawImage(this.bg, 0, 0, this.size, this.size);
    for (let i = 0; i < N; i++) {
      if (!this.mask[i] || !this.jelly[i]) continue;
      ctx.drawImage(this.sp.get('jelly', 0, this.jelly[i]), col(i) * cs, row(i) * cs, cs, cs);
    }
    // keyboard cursor
    if (this.cursor >= 0) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.roundRect(col(this.cursor) * cs + 2, row(this.cursor) * cs + 2, cs - 4, cs - 4, cs * 0.16); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < N; i++) if (this.mask[i]) ctx.rect(col(i) * cs, row(i) * cs, cs, cs);
    ctx.clip();
    const t = this.time;
    const selSprite = this.sel >= 0 ? this.spriteAt(this.sel) : null;
    if (selSprite) {
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.roundRect(col(this.sel) * cs + 1, row(this.sel) * cs + 1, cs - 2, cs - 2, cs * 0.16); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(col(this.sel) * cs + 1.5, row(this.sel) * cs + 1.5, cs - 3, cs - 3, cs * 0.16); ctx.stroke();
    }
    for (const s of this.sprites.values()) {
      let k = 1;
      if (s.t >= 1 && s.t <= 4) k += 0.035 * Math.sin(t * 0.006 + s.id);
      if (this.hintIds && this.hintIds.has(s.id)) k += 0.13 * (0.5 + 0.5 * Math.sin(t * 0.009));
      if (s === selSprite) k += 0.1;
      const cx = (s.x + 0.5) * cs, cy = (s.y + 0.5) * cs;
      if (s.t === T.BOMB && s.a > 0.5) this.halo(ctx, cx, cy, cs, t);
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.a);
      ctx.translate(cx, cy);
      if (s.rot) ctx.rotate(s.rot);
      ctx.scale(s.sx * k, s.sy * k);
      ctx.drawImage(this.sp.get(s.t, s.c), -cs / 2, -cs / 2, cs, cs);
      if (s.cage) ctx.drawImage(this.sp.get('cage', 0), -cs / 2, -cs / 2, cs, cs);
      ctx.restore();
    }
    ctx.restore();
    this.drawFx(ctx);
    this.pa.draw(ctx);
    for (const p of this.pops) this.drawPop(ctx, p);
  }
  halo(ctx, cx, cy, cs, t) {
    const cols = ['#ff5a7a', '#ffd23f', '#5ce1ff', '#9dff6a', '#e08bff'];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) {
      const a = t * 0.004 + k * 1.2566, r = cs * 0.43;
      ctx.fillStyle = cols[k]; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cs * 0.055, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  drawFx(ctx) {
    const cs = this.cell;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const f of this.fx) {
      const p = f.t / f.dur, a = 1 - p;
      if (f.k === 'beam') {
        const thick = cs * (f.n || 1) * (0.55 + 0.45 * ease.out(Math.min(1, p * 3)));
        if (f.h) {
          const y = (f.r + 0.5) * cs - thick / 2;
          const g = ctx.createLinearGradient(0, y, 0, y + thick);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.95 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g; ctx.fillRect(0, y, this.size, thick);
          ctx.fillStyle = f.color; ctx.globalAlpha = 0.45 * a; ctx.fillRect(0, y + thick * 0.3, this.size, thick * 0.4); ctx.globalAlpha = 1;
        } else {
          const x = (f.c + 0.5) * cs - thick / 2;
          const g = ctx.createLinearGradient(x, 0, x + thick, 0);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.95 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g; ctx.fillRect(x, 0, thick, this.size);
          ctx.fillStyle = f.color; ctx.globalAlpha = 0.45 * a; ctx.fillRect(x + thick * 0.3, 0, thick * 0.4, this.size); ctx.globalAlpha = 1;
        }
      } else if (f.k === 'ring') {
        const cx = (col(f.i) + 0.5) * cs, cy = (row(f.i) + 0.5) * cs, r = (f.rad + 0.6) * cs * (0.3 + 0.9 * ease.out(p));
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(255,255,255,${0.8 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
        ctx.strokeStyle = f.color; ctx.globalAlpha = a; ctx.lineWidth = Math.max(1, 7 * a);
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.92, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (f.k === 'bolt') {
        ctx.strokeStyle = f.color; ctx.lineJoin = 'round';
        for (const [w, al] of [[7, 0.35], [2.5, 1]]) {
          ctx.lineWidth = w; ctx.globalAlpha = a * al;
          ctx.beginPath(); ctx.moveTo(f.pts[0][0], f.pts[0][1]);
          for (let k = 1; k < f.pts.length; k++) ctx.lineTo(f.pts[k][0], f.pts[k][1]);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (f.k === 'flash') {
        ctx.fillStyle = `rgba(255,255,255,${0.85 * a * a})`; ctx.fillRect(0, 0, this.size, this.size);
      }
    }
    ctx.restore();
    for (const f of this.fx) {
      if (f.k !== 'hammer') continue;
      const p = f.t / f.dur, cx = (col(f.i) + 0.5) * cs, cy = (row(f.i) + 0.5) * cs;
      const ang = -1.15 + 1.55 * ease.inOut(Math.min(1, p * 1.5));
      ctx.save(); ctx.translate(cx + cs * 0.5, cy - cs * 0.55); ctx.rotate(ang); ctx.globalAlpha = p > 0.8 ? 1 - (p - 0.8) * 5 : 1;
      ctx.fillStyle = '#c9884e'; ctx.strokeStyle = '#5a3416'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-cs * 0.06, 0, cs * 0.12, cs * 0.95, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c0c4d8'; ctx.beginPath(); ctx.roundRect(-cs * 0.3, cs * 0.78, cs * 0.6, cs * 0.3, 5); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }
  drawPop(ctx, p) {
    const k = p.t / p.dur;
    const sc = p.big ? ease.back(Math.min(1, k * 3)) * (k > 0.8 ? 1 - (k - 0.8) * 2.5 : 1) : 1;
    const x = p.x, y = p.y - (p.big ? 0 : 46 * ease.out(k));
    ctx.save();
    ctx.globalAlpha = p.big ? 1 : Math.min(1, (1 - k) * 2.5);
    ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.font = `800 ${p.size}px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = p.size * 0.22; ctx.strokeStyle = 'rgba(60,10,90,.9)'; ctx.strokeText(p.text, 0, 0);
    ctx.fillStyle = p.color; ctx.fillText(p.text, 0, 0);
    ctx.restore();
  }

  // ---------------------------------------------------------------- effects helpers
  centre(i) { return [(col(i) + 0.5) * this.cell, (row(i) + 0.5) * this.cell]; }
  popup(i, text, color = '#fff', size = 20, dur = 900) {
    const [x, y] = Array.isArray(i) ? i : this.centre(i);
    const cx = Math.max(size * 1.5, Math.min(this.size - size * 1.5, x));
    this.pops.push({ x: cx, y, text, color, size, t: 0, dur });
  }
  banner(text, color = '#ffe66b', size = null) {
    this.pops.push({ x: this.size / 2, y: this.size * 0.42, text, color, size: size || Math.max(26, this.size * 0.1), t: 0, dur: 1100, big: true });
  }
  candyBurst(i, c, n = 7) {
    const [x, y] = this.centre(i), k = CANDIES[c] || CANDIES[0];
    this.pa.burst(x, y, n, { color: [k.light, k.mid, '#fff'], speed: 230, size: this.cell * 0.09, life: 520, shape: Math.random() < 0.4 ? 'star' : 'circle', gravity: 900, up: 60 });
  }
  sparkle(i, n = 10, color = ['#fff', '#ffe66b', '#ff9de0']) {
    const [x, y] = this.centre(i);
    this.pa.burst(x, y, n, { color, speed: 260, size: this.cell * 0.1, life: 700, shape: 'star', gravity: 200 });
  }
  pulse(s, to = 1.3) {
    s.sx = s.sy = 0.55;
    return this.tw.to(s, { sx: to, sy: to }, 120, ease.out).then(() => this.tw.to(s, { sx: 1, sy: 1 }, 260, ease.elastic));
  }
  /** Sprites drop into the board when a level starts. */
  async intro() {
    const ps = [];
    for (const s of this.sprites.values()) {
      const y = s.y; s.y = y - 10; s.a = 1;
      ps.push(this.tw.to(s, { y }, 420 + y * 40, ease.fall, col(Math.round(s.x)) * 25 + (8 - y) * 12));
    }
    Sfx.play('swap');
    await Promise.all(ps);
  }

  // ---------------------------------------------------------------- event player
  async play(events) {
    this.boost = false; this.applySpeed();
    for (const ev of events) {
      const fn = this['ev_' + ev.t];
      if (fn) await fn.call(this, ev);
    }
  }

  async ev_swap(ev) {
    Sfx.play('swap');
    const A = this.sprites.get(ev.ida), B = this.sprites.get(ev.idb);
    if (this.hooks.onSwap) this.hooks.onSwap(ev);
    if (!A || !B) return;
    await Promise.all([
      this.tw.to(A, { x: col(ev.b), y: row(ev.b) }, 150, ease.inOut),
      this.tw.to(B, { x: col(ev.a), y: row(ev.a) }, 150, ease.inOut),
    ]);
  }
  async ev_bounce(ev) {
    Sfx.play('bad');
    const A = this.spriteAt(ev.a), B = this.spriteAt(ev.b);
    if (!A || !B) return;
    const ax = A.x, ay = A.y, bx = B.x, by = B.y;
    await Promise.all([
      this.tw.to(A, { x: ax + (bx - ax) * 0.85, y: ay + (by - ay) * 0.85 }, 110, ease.out),
      this.tw.to(B, { x: bx + (ax - bx) * 0.85, y: by + (ay - by) * 0.85 }, 110, ease.out),
    ]);
    await Promise.all([this.tw.to(A, { x: ax, y: ay }, 130, ease.back), this.tw.to(B, { x: bx, y: by }, 130, ease.back)]);
  }
  async ev_transform(ev) {
    Sfx.play('special');
    const ps = [];
    for (const it of ev.items) {
      const s = this.sprites.get(it.id); if (!s) continue;
      s.t = it.t; s.c = it.c;
      ps.push(this.pulse(s, 1.4));
      this.sparkle(it.i, 4);
    }
    await Promise.all(ps);
    await this.tw.wait(120);
  }
  async ev_hammer(ev) {
    this.fx.push({ k: 'hammer', i: ev.i, t: 0, dur: 330 });
    await this.tw.wait(210);
    Sfx.play('hammer'); this.shake = 5;
    this.sparkle(ev.i, 8, ['#fff', '#ffd27a']);
    await this.tw.wait(110);
  }
  async ev_clear(ev) {
    const cs = this.cell, tw = this.tw;
    let origin = -1, hasFx = ev.fx.length > 0;
    for (const f of ev.fx) {
      if (origin < 0 && f.i !== undefined) origin = f.i;
      if (f.k === 'row') { this.fx.push({ k: 'beam', h: true, r: f.r, n: 1, t: 0, dur: 420, color: CANDIES[f.c]?.light || '#fff' }); Sfx.play('stripe'); this.shake = Math.max(this.shake, 4); }
      else if (f.k === 'col') { this.fx.push({ k: 'beam', h: false, c: f.c, n: 1, t: 0, dur: 420, color: CANDIES[f.col]?.light || '#fff' }); Sfx.play('stripe'); this.shake = Math.max(this.shake, 4); }
      else if (f.k === 'rows') { this.fx.push({ k: 'beam', h: true, r: f.r, n: f.n, t: 0, dur: 480, color: '#fff2a8' }); Sfx.play('stripe'); this.shake = 7; }
      else if (f.k === 'cols') { this.fx.push({ k: 'beam', h: false, c: f.c, n: f.n, t: 0, dur: 480, color: '#fff2a8' }); this.shake = 7; }
      else if (f.k === 'blast') { this.fx.push({ k: 'ring', i: f.i, rad: f.rad, t: 0, dur: 450, color: CANDIES[f.col]?.light || '#ffe28a' }); Sfx.play('blast'); this.shake = 5 + f.rad * 3; }
      else if (f.k === 'zap') {
        const [bx, by] = this.centre(f.i);
        const cells = f.cells.length > 30 ? f.cells.filter((_, k) => k % 2 === 0) : f.cells;
        for (const j of cells) {
          const [tx, ty] = this.centre(j), pts = [[bx, by]];
          for (let k = 1; k < 4; k++) pts.push([bx + (tx - bx) * k / 4 + (Math.random() - 0.5) * cs * 0.6, by + (ty - by) * k / 4 + (Math.random() - 0.5) * cs * 0.6]);
          pts.push([tx, ty]);
          this.fx.push({ k: 'bolt', pts, t: 0, dur: 420, color: CANDIES[f.color]?.light || '#fff' });
        }
        Sfx.play('zap'); this.shake = 4;
      } else if (f.k === 'all') { this.fx.push({ k: 'flash', t: 0, dur: 700 }); this.fx.push({ k: 'ring', i: f.i, rad: 8, t: 0, dur: 700, color: '#fff' }); Sfx.play('mega'); this.shake = 12; }
    }
    const dist = i => origin < 0 ? 0 : Math.max(Math.abs(row(i) - row(origin)), Math.abs(col(i) - col(origin)));
    const ps = [];
    let jellySound = false;
    ev.cleared.forEach((it, n) => {
      const s = this.sprites.get(it.id);
      if (!s) return;
      const delay = hasFx ? Math.min(120 + dist(it.i) * 34, 480) : 0;
      if (it.kind === 'deliver') {
        Sfx.play('deliver');
        ps.push(tw.to(s, { sx: 1.5, sy: 1.5 }, 180, ease.out, delay).then(() => { this.sparkle(it.i, 16, ['#ffe66b', '#fff', '#ff5a7a']); return tw.to(s, { sx: 0.1, sy: 0.1, a: 0, y: s.y + 0.4 }, 260, ease.out); }).then(() => this.sprites.delete(it.id)));
        return;
      }
      ps.push(tw.to(s, { sx: 1.28, sy: 1.28 }, 70, ease.out, delay).then(() => {
        if (it.kind === 'choc') this.pa.burst(...this.centre(it.i), 8, { color: ['#6b3d1f', '#8a5632', '#3a1d0c'], shape: 'rect', speed: 220, size: cs * 0.1, life: 600 });
        else this.candyBurst(it.i, it.c, hasFx ? 5 : 7);
        return tw.to(s, { sx: 0.05, sy: 0.05, a: 0 }, 170, ease.out);
      }).then(() => this.sprites.delete(it.id)));
    });
    for (const cr of ev.created) {
      const s = this.sprites.get(cr.id);
      if (!s) continue;
      ps.push(tw.wait(80).then(() => { s.t = cr.t; s.c = cr.c; this.sparkle(cr.i, 14); return this.pulse(s, 1.45); }));
    }
    if (ev.created.length) Sfx.play('special', 0);
    for (const j of ev.jelly) {
      this.jelly[j.i] = j.left;
      const [x, y] = this.centre(j.i);
      this.pa.burst(x, y, 6, { color: ['#ff9de0', '#ffd0f0', '#fff'], shape: 'rect', speed: 200, size: cs * 0.07, life: 550 });
      jellySound = true;
    }
    if (jellySound) Sfx.play('jelly');
    for (const i of ev.cage) {
      const s = this.spriteAt(i);
      if (s) { s.cage = 0; const [x, y] = this.centre(i); this.pa.burst(x, y, 8, { color: ['#d6cfe6', '#8a7fa0', '#fff'], shape: 'rect', speed: 230, size: cs * 0.07, life: 600 }); }
      Sfx.play('cage');
    }
    if (!hasFx || ev.cleared.length) Sfx.play('pop', ev.mult - 1);
    // score popup at the middle of what was cleared
    if (ev.pts > 0 && (ev.cleared.length || ev.created.length)) {
      let sx = 0, sy = 0, n = 0;
      for (const it of ev.cleared) { const [x, y] = this.centre(it.i); sx += x; sy += y; n++; }
      if (n) this.popup([sx / n, sy / n], '+' + ev.pts, ev.mult > 3 ? '#ffe66b' : '#fff', Math.min(34, 18 + ev.mult * 2.2));
    }
    if (COMBO_WORDS[Math.min(ev.mult, 6)] && ev.mult >= 3) this.banner(COMBO_WORDS[Math.min(ev.mult, 6)], ['#fff', '#fff', '#ffe66b', '#9dff9d', '#7fe0ff', '#ff9de0'][Math.min(ev.mult, 6) - 1]);
    if (this.hooks.onClear) this.hooks.onClear(ev);
    await Promise.all(ps);
    await tw.wait(hasFx ? 90 : 40);
  }
  async ev_fall(ev) {
    const tw = this.tw, ps = [];
    for (const mv of ev.moves) {
      const s = this.sprites.get(mv.id); if (!s) continue;
      const to = row(mv.to), dist = Math.max(0.2, to - s.y);
      ps.push(tw.to(s, { y: to }, 140 + 80 * Math.sqrt(dist), ease.fall));
    }
    for (const sp of ev.spawned) {
      const s = this.mkSprite(sp.id, sp.t, sp.c, col(sp.to), sp.fromRow);
      const to = row(sp.to), dist = to - sp.fromRow;
      ps.push(tw.to(s, { y: to }, 140 + 80 * Math.sqrt(dist), ease.fall, col(sp.to) * 10));
    }
    if (ps.length) { await Promise.all(ps); Sfx.play('land'); }
  }
  async ev_shuffle(ev) {
    Sfx.play('shuffle');
    this.banner('Shuffle!', '#9dffd0');
    const ps = [];
    for (const m of ev.moves) {
      const s = this.sprites.get(m.id); if (!s) continue;
      s.rot = 0;
      ps.push(this.tw.to(s, { x: col(m.to), y: row(m.to), rot: Math.PI * 2 }, 520, ease.inOut).then(() => { s.rot = 0; }));
    }
    await Promise.all(ps);
    await this.tw.wait(120);
  }
  async ev_spread(ev) {
    Sfx.play('spread');
    const s = this.sprites.get(ev.id);
    if (!s) return;
    s.t = T.CHOC; s.c = 0;
    this.pa.burst(...this.centre(ev.i), 8, { color: ['#6b3d1f', '#8a5632'], shape: 'rect', speed: 160, size: this.cell * 0.09, life: 500 });
    await this.pulse(s, 1.3);
  }
  async ev_bonusStart(ev) {
    this.banner('Sugar crush!', '#ffe66b');
    if (this.hooks.onBonus) this.hooks.onBonus(ev);
    await this.tw.wait(800);
  }
  async ev_bonusPick(ev) {
    const ps = [];
    ev.items.forEach((it, n) => {
      const s = this.sprites.get(it.id); if (!s) return;
      ps.push(this.tw.wait(n * 85).then(() => {
        s.t = it.t; s.c = it.c; this.sparkle(it.i, 7); Sfx.play('pop', Math.min(10, n));
        if (this.hooks.onBonusTick) this.hooks.onBonusTick(n + 1, ev.items.length);
        return this.pulse(s, 1.35);
      }));
    });
    this.popup([this.size / 2, this.size * 0.62], '+' + ev.pts, '#ffe66b', 30, 1200);
    if (this.hooks.onScore) this.hooks.onScore(ev.score);
    await Promise.all(ps);
    await this.tw.wait(250);
    this.tw.speed = this.baseSpeed * (this.boost ? 3.2 : 1.7);
  }
}
