// tween.js: a tiny time-stepped tweening layer plus a particle pool. Everything is driven by
// the single requestAnimationFrame loop in view.js (update(dt) once per frame), and every
// tween returns a Promise so the event player can simply `await` a whole phase.

export const ease = {
  linear: t => t,
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  // fall: accelerate (gravity), land, one small bounce back up, settle
  fall: t => {
    if (t < 0.78) { const k = t / 0.78; return k * k; }
    const k = (t - 0.78) / 0.22;
    return 1 - 0.07 * Math.sin(Math.PI * k);
  },
  elastic: t => (t === 0 || t === 1 ? t : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
};

export class Tweens {
  constructor() { this.list = []; this.speed = 1; }
  to(obj, props, dur, fn = ease.out, delay = 0) {
    return new Promise(resolve => {
      this.list.push({ obj, to: props, from: null, dur: Math.max(1, dur), delay, t: 0, fn, resolve });
    });
  }
  wait(ms) { return this.to({ v: 0 }, { v: 1 }, ms, ease.linear); }
  update(dt) {
    dt *= this.speed;
    const L = this.list;
    for (let i = 0; i < L.length; i++) {
      const tw = L[i];
      if (tw.delay > 0) { tw.delay -= dt; if (tw.delay > 0) continue; tw.t += -tw.delay; tw.delay = 0; }
      else tw.t += dt;
      if (!tw.from) { tw.from = {}; for (const k in tw.to) tw.from[k] = tw.obj[k]; }
      const k = Math.min(1, tw.t / tw.dur), e = tw.fn(k);
      for (const p in tw.to) tw.obj[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * e;
      if (k >= 1) { for (const p in tw.to) tw.obj[p] = tw.to[p]; tw.resolve(); L.splice(i, 1); i--; }
    }
  }
  /** Finish everything immediately (used when a level is left mid-animation). */
  flush() { for (const tw of this.list) { if (tw.from) for (const p in tw.to) tw.obj[p] = tw.to[p]; tw.resolve(); } this.list = []; }
}

export class Particles {
  constructor(max = 320) { this.max = max; this.list = []; this.reduced = false; }
  add(p) { if (this.list.length < this.max) this.list.push(p); }
  burst(x, y, n, o = {}) {
    if (this.reduced) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = (o.angle ?? Math.random() * Math.PI * 2) + (o.spread ? (Math.random() - 0.5) * o.spread : 0);
      const sp = (o.speed || 200) * (0.4 + Math.random() * 0.8);
      this.add({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), g: o.gravity ?? 700,
        life: (o.life || 600) * (0.6 + Math.random() * 0.6), age: 0, size: (o.size || 6) * (0.6 + Math.random() * 0.8),
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, color: Array.isArray(o.color) ? o.color[(Math.random() * o.color.length) | 0] : o.color || '#fff',
        shape: o.shape || 'circle',
      });
    }
  }
  update(dt) {
    const s = dt / 1000;
    const L = this.list;
    for (let i = 0; i < L.length; i++) {
      const p = L[i];
      p.age += dt;
      if (p.age >= p.life) { L[i] = L[L.length - 1]; L.pop(); i--; continue; }
      p.vy += p.g * s; p.x += p.vx * s; p.y += p.vy * s; p.rot += p.vr * s;
    }
  }
  draw(ctx) {
    for (const p of this.list) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.fillStyle = p.color;
      const s = p.size * (0.4 + 0.6 * k);
      if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 7); ctx.fill(); }
      else if (p.shape === 'rect') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-s, -s * 0.4, s * 2, s * 0.8); ctx.restore(); }
      else if (p.shape === 'star') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.4 : s * 1.3, a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill(); ctx.restore();
      } else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-s, -s, s * 2, s * 2); ctx.restore(); }
    }
    ctx.globalAlpha = 1;
  }
}
