/*
 * Vector renderer. Everything is a line or a dot in world units, batched by
 * brightness and stroked twice per frame: once with a soft shadow blur for
 * the phosphor bloom, once crisp for the beam itself. Optional persistence
 * fades the previous frame out instead of clearing it.
 */
(function () {
  'use strict';

  const { SHIP, ROCKS, ROCK_UNIT, SAUCER } = window.Shapes;
  const VF = window.VFont;
  const TAU = Math.PI * 2;
  const LEVELS = [1, 0.72, 0.42];
  const BEAM = '#f4f8ff';
  const GLOW = 'rgba(190, 215, 255, 0.95)';

  class Renderer {
    constructor(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.segs = [[], [], []];
      this.dots = [[], [], []];
      this.trails = false;
      this.quality = 2;              // 2: blur glow, 1: cheap glow
      this.view = { x: 0, y: 0, scale: 1, W: 1024, H: 768 };
      this.dpr = 1; this.cssW = 1; this.cssH = 1;
      this.fresh = true;
    }

    resize(cssW, cssH, dpr, view) {
      this.cssW = cssW; this.cssH = cssH; this.dpr = dpr;
      this.view = view;
      const w = Math.max(1, Math.round(cssW * dpr)), h = Math.max(1, Math.round(cssH * dpr));
      if (this.cv.width !== w) this.cv.width = w;
      if (this.cv.height !== h) this.cv.height = h;
      this.cv.style.width = cssW + 'px';
      this.cv.style.height = cssH + 'px';
      this.fresh = true;
    }

    // ---- primitive batching ------------------------------------------------

    seg(x1, y1, x2, y2, b) { this.segs[b || 0].push(x1, y1, x2, y2); }
    dot(x, y, r, b) { this.dots[b || 0].push(x, y, r); }

    poly(pts, closed, b, tx) {
      const out = this.segs[b || 0];
      let p0 = tx(pts[0]);
      const first = p0;
      for (let i = 1; i < pts.length; i++) {
        const p1 = tx(pts[i]);
        out.push(p0[0], p0[1], p1[0], p1[1]);
        p0 = p1;
      }
      if (closed) out.push(p0[0], p0[1], first[0], first[1]);
    }

    text(str, x, y, size, align, b, maxW) {
      if (maxW) {
        const w = VF.measure(str, size);
        if (w > maxW) size *= maxW / w;
      }
      const out = this.segs[b || 0];
      VF.text((a, c, d, e) => out.push(a, c, d, e), str, x, y, size, align);
      return size;
    }

    // ---- frame -----------------------------------------------------------

    begin(dt) {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (this.trails && !this.fresh) {
        const keep = Math.pow(0.42, Math.min(4, dt * 60));
        ctx.fillStyle = 'rgba(0,0,0,' + (1 - keep).toFixed(3) + ')';
        ctx.fillRect(0, 0, this.cv.width, this.cv.height);
      } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.cv.width, this.cv.height);
      }
      this.fresh = false;
      for (let b = 0; b < 3; b++) { this.segs[b].length = 0; this.dots[b].length = 0; }
    }

    flush(dim) {
      const ctx = this.ctx, v = this.view, d = this.dpr;
      const k = d * v.scale;
      ctx.save();
      ctx.setTransform(k, 0, 0, k, d * v.x, d * v.y);
      ctx.beginPath();
      ctx.rect(0, 0, v.W, v.H);
      ctx.clip();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const lw = Math.max(1.7, 1.25 / v.scale);
      const blurCss = Math.max(3, Math.min(8, 6.5 * v.scale));
      for (let b = 0; b < 3; b++) {
        const S = this.segs[b], D = this.dots[b];
        if (!S.length && !D.length) continue;
        const a = LEVELS[b] * (dim || 1);
        ctx.beginPath();
        for (let i = 0; i < S.length; i += 4) { ctx.moveTo(S[i], S[i + 1]); ctx.lineTo(S[i + 2], S[i + 3]); }
        const dp = new Path2D();
        for (let i = 0; i < D.length; i += 3) { dp.moveTo(D[i] + D[i + 2], D[i + 1]); dp.arc(D[i], D[i + 1], D[i + 2], 0, TAU); }
        // bloom
        if (this.quality >= 2) {
          ctx.shadowColor = GLOW;
          ctx.shadowBlur = blurCss * d;
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = BEAM; ctx.fillStyle = BEAM;
          ctx.lineWidth = lw;
          ctx.stroke();
          ctx.fill(dp);
          ctx.shadowBlur = 0;
        } else {
          ctx.globalAlpha = a * 0.22;
          ctx.strokeStyle = GLOW; ctx.fillStyle = GLOW;
          ctx.lineWidth = lw * 3.2;
          ctx.stroke();
          ctx.fill(dp);
        }
        // beam core
        ctx.globalAlpha = a;
        ctx.strokeStyle = BEAM; ctx.fillStyle = BEAM;
        ctx.lineWidth = lw * 0.8;
        ctx.stroke();
        ctx.fill(dp);
        S.length = 0; D.length = 0;
      }
      ctx.restore();
    }

    frameBorder() {
      const ctx = this.ctx, v = this.view, d = this.dpr;
      const w = v.W * v.scale, h = v.H * v.scale;
      if (w >= this.cssW - 2 && h >= this.cssH - 2) return;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.lineWidth = 1;
      ctx.strokeRect(v.x - 0.5, v.y - 0.5, w + 1, h + 1);
    }

    // ---- shapes -----------------------------------------------------------

    wrapped(x, y, r, fn) {
      const W = this.view.W, H = this.view.H;
      const xs = [0], ys = [0];
      if (x < r) xs.push(W); else if (x > W - r) xs.push(-W);
      if (y < r) ys.push(H); else if (y > H - r) ys.push(-H);
      for (const ox of xs) for (const oy of ys) fn(x + ox, y + oy);
    }

    ship(x, y, a, scale, flame, b) {
      const c = Math.cos(a) * scale, s = Math.sin(a) * scale;
      const tx = (p) => [x + p[0] * c - p[1] * s, y + p[0] * s + p[1] * c];
      const n = tx(SHIP.nose), l = tx(SHIP.left), r = tx(SHIP.right);
      const bl = tx(SHIP.barL), br = tx(SHIP.barR);
      this.seg(l[0], l[1], n[0], n[1], b);
      this.seg(n[0], n[1], r[0], r[1], b);
      this.seg(bl[0], bl[1], br[0], br[1], b);
      if (flame) {
        const f = SHIP.flame;
        const tip = [f[1][0] * flame + f[0][0] * (1 - flame), 0];
        this.poly([f[0], tip, f[2]], false, b, tx);
      }
    }

    rock(k, x, y) {
      const u = ROCK_UNIT[k.size];
      this.poly(ROCKS[k.shape], true, 0, (p) => [x + p[0] * u, y + p[1] * u]);
    }

    saucer(x, y, small) {
      const u = small ? 0.5 : 1;
      const tx = (p) => [x + p[0] * u, y + p[1] * u];
      this.poly(SAUCER.hull, false, 0, tx);
      this.poly(SAUCER.belt, false, 0, tx);
      this.poly(SAUCER.dome, false, 0, tx);
    }

    // ---- the playfield ------------------------------------------------------

    world(g, alpha, opts) {
      const lerp = (o) => [o.px + (o.x - o.px) * alpha, o.py + (o.y - o.py) * alpha];
      for (const k of g.rocks) {
        const p = lerp(k);
        const r = ROCK_UNIT[k.size] * 4.6;
        this.wrapped(p[0], p[1], r, (x, y) => this.rock(k, x, y));
      }
      if (g.saucer) {
        const u = g.saucer, p = lerp(u);
        this.wrapped(-1e4, p[1], u.hw, (x, y) => this.saucer(p[0], y, u.small));
      }
      for (const b of g.bullets) {
        const p = lerp(b);
        this.dot(p[0], p[1], 1.9, 0);
      }
      for (const q of g.particles) {
        const p = lerp(q), f = q.life / q.max;
        this.dot(p[0], p[1], 1.5, f > 0.6 ? 0 : f > 0.3 ? 1 : 2);
      }
      for (const d of g.debris) {
        const p = lerp(d), f = d.life / d.max;
        const c = Math.cos(d.a) * d.len / 2, s = Math.sin(d.a) * d.len / 2;
        this.seg(p[0] - c, p[1] - s, p[0] + c, p[1] + s, f > 0.55 ? 0 : f > 0.25 ? 1 : 2);
      }
      const s = g.ship;
      if (g.mode === 'play' && s.state === 'alive') {
        const blink = s.invuln > 0 && ((s.invuln >> 3) & 1);
        if (!blink || opts.paused) {
          const p = lerp(s);
          let da = s.a - s.pa;
          if (da > Math.PI) da -= TAU; else if (da < -Math.PI) da += TAU;
          const a = s.pa + da * alpha;
          // Flame flickers on alternate frames like the arcade's.
          let flame = 0;
          if (s.thrusting && ((g.tick >> 1) & 1) === 0) flame = 0.75 + 0.25 * (((g.tick * 2654435761) >>> 28) / 15);
          if (s.thrusting && opts.paused) flame = 1;
          this.wrapped(p[0], p[1], 14, (x, y) => this.ship(x, y, a, 1, flame, 0));
        }
      }
    }

    hud(g, best, showLives) {
      const W = this.view.W;
      const score = g.score > 0 ? String(g.score) : '00';
      const size = 26;
      const right = 34 + Math.max(VF.measure('00000', size), VF.measure(score, size));
      this.text(score, right, 22, size, 'right', 0);
      const hi = best > 0 ? String(best) : '00';
      this.text(hi, W / 2, 26, 16, 'center', 1);
      if (showLives) {
        const n = Math.min(g.lives, 12);
        for (let i = 0; i < n; i++) this.ship(right - 8 - i * 19, 72, -Math.PI / 2, 0.9, 0, 0);
      }
    }
  }

  window.Renderer = Renderer;
})();
