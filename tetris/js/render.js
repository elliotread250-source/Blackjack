/*
 * Canvas renderer. Everything is laid out and drawn in DEVICE pixels with an
 * integer cell size, so block edges stay crisp at any devicePixelRatio.
 * Effects (particles, trails, labels) live in board-cell units so a resize
 * mid-animation does not break them.
 */
(function () {
  'use strict';
  const E = window.TetrisEngine;
  const { COLS, ROWS, TOP, SHAPES } = E;

  const COLORS = [null, '#2fd6f2', '#3a6df6', '#ff9424', '#ffd42a', '#4ad65f', '#b04cf2', '#ff3d4f', '#737a90'];
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(h, to, k) {
    const a = hexRgb(h), b = to === 'w' ? [255, 255, 255] : [0, 0, 0];
    return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',') + ')';
  }
  function rgba(h, a) { const c = hexRgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function spacing(ctx, px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }
  function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }
  function fmtTime(ms) {
    if (ms == null || !isFinite(ms)) return '--';
    const cs = Math.floor(ms / 10), m = Math.floor(cs / 6000), s = Math.floor(cs / 100) % 60, c = cs % 100;
    return m + ':' + String(s).padStart(2, '0') + '.' + String(c).padStart(2, '0');
  }

  function pieceBounds(type) {
    const c = SHAPES[type][0];
    const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs) + 1, y0: Math.min(...ys), y1: Math.max(...ys) + 1 };
  }

  // ------------------------------------------------------------------ layout
  function computeLayout(W, H, dpr, ins) {
    const m = 10;
    const aw = Math.max(50, W - ins.left - ins.right - 2 * m);
    const ah = Math.max(50, H - ins.top - ins.bottom - 2 * m);
    const cWide = Math.min(aw / 21.3, ah / 20.5);
    const cNarrow = Math.min(aw / 12.95, ah / 22.7);
    const narrow = cNarrow > cWide * 1.08;
    const cCss = Math.min(narrow ? cNarrow : cWide, 54);
    const u = Math.max(6, Math.floor(cCss * dpr));
    const fp = Math.max(2, Math.round(u * 0.14));
    const areaX = (ins.left + m) * dpr, areaY = (ins.top + m) * dpr;
    const areaW = aw * dpr, areaH = ah * dpr;
    const L = { dpr, u, fp, narrow, W: Math.round(W * dpr), H: Math.round(H * dpr) };

    if (!narrow) {
      const P = Math.round(u * 4.9), G = Math.round(u * 0.55);
      const totalW = 10 * u + 2 * P + 2 * G + 2 * fp, totalH = 20 * u + 2 * fp;
      const x0 = Math.round(areaX + (areaW - totalW) / 2), y0 = Math.round(areaY + (areaH - totalH) / 2);
      L.board = { x: x0 + P + G + fp, y: y0 + fp, w: 10 * u, h: 20 * u };
      L.hold = { x: x0, y: L.board.y, w: P, h: Math.round(u * 3.7) };
      L.stats = { x: x0, y: L.hold.y + L.hold.h + Math.round(u * 0.45), w: P, h: Math.round(u * 7.6) };
      L.labels = { x: x0, y: L.stats.y + L.stats.h + Math.round(u * 0.4), w: P, h: 0 };
      L.labels.h = L.board.y + L.board.h - L.labels.y;
      L.next = { x: L.board.x + L.board.w + fp + G, y: L.board.y, w: P, h: Math.round(u * 12.9) };
      const size = Math.round(Math.min(46, Math.max(34, u / dpr)));
      L.icons = { x: (L.next.x) / dpr, y: (L.board.y + L.board.h) / dpr - size, size, gap: 10, align: 'left' };
      L.nextScale = [0.78, 0.62];
    } else {
      // Portrait: HOLD + stats in a row above the board, a slim NEXT column beside it.
      const K = Math.round(u * 2.35), G = Math.round(u * 0.25);
      const hudH = Math.round(u * 1.95), hudGap = Math.round(u * 0.3);
      const totalW = 10 * u + 2 * fp + G + K, totalH = hudH + hudGap + 20 * u + 2 * fp;
      const x0 = Math.round(areaX + (areaW - totalW) / 2), y0 = Math.round(areaY + (areaH - totalH) / 2);
      const hudW = 10 * u + 2 * fp, sg = Math.round(u * 0.18);
      L.hold = { x: x0, y: y0, w: Math.round(u * 2.45), h: hudH };
      L.hud = { x: x0 + L.hold.w + sg, y: y0, w: hudW - L.hold.w - sg, h: hudH };
      L.board = { x: x0 + fp, y: y0 + hudH + hudGap + fp, w: 10 * u, h: 20 * u };
      const colX = L.board.x + L.board.w + fp + G;
      L.next = { x: colX, y: L.board.y - fp, w: K, h: Math.round(u * 9.0) };
      L.labels = null;
      const gap = 6;
      const size = Math.round(Math.min(40, Math.max(26, Math.min(hudH / dpr - 6, (K / dpr - gap) / 2))));
      L.icons = { x: colX / dpr + (K / dpr - size * 2 - gap) / 2, y: y0 / dpr + (hudH / dpr - size) / 2, size, gap, align: 'right' };
      L.nextScale = [0.5, 0.4];
    }
    L.cellCss = u / dpr;
    L.boardCss = { x: L.board.x / dpr, y: L.board.y / dpr, w: L.board.w / dpr, h: L.board.h / dpr };
    return L;
  }

  // ---------------------------------------------------------------- effects
  class Fx {
    constructor() { this.clear(); }
    clear() { this.particles = []; this.trails = []; this.flashes = []; this.labels = []; this.bump = null; this.flashScreen = null; }
    update(dt) {
      const s = dt / 1000;
      for (const p of this.particles) { p.life -= dt; p.vy += 38 * s; p.vx *= 0.985; p.x += p.vx * s; p.y += p.vy * s; p.rot += p.vr * s; }
      this.particles = this.particles.filter((p) => p.life > 0);
      for (const arr of [this.trails, this.flashes, this.labels]) for (const t of arr) t.t += dt;
      this.trails = this.trails.filter((t) => t.t < t.dur);
      this.flashes = this.flashes.filter((t) => t.t < t.dur);
      this.labels = this.labels.filter((t) => t.t < t.dur);
      if (this.bump) { this.bump.t += dt; if (this.bump.t > this.bump.dur) this.bump = null; }
      if (this.flashScreen) { this.flashScreen.t += dt; if (this.flashScreen.t > this.flashScreen.dur) this.flashScreen = null; }
    }
    burst(board, rows, big) {
      for (const y of rows) {
        for (let x = 0; x < COLS; x++) {
          const type = board[y][x] || 8;
          const n = big ? 3 : 2;
          for (let i = 0; i < n; i++) {
            this.particles.push({
              x: x + 0.5 + (Math.random() - 0.5) * 0.6, y: y - TOP + 0.5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12,
              vx: (x - 4.5) * (0.9 + Math.random() * 1.6) + (Math.random() - 0.5) * 4,
              vy: -(3 + Math.random() * (big ? 11 : 7)),
              life: 550 + Math.random() * 450, max: 1000, size: 0.22 + Math.random() * 0.25, color: COLORS[type],
            });
          }
        }
      }
      if (this.particles.length > 900) this.particles.splice(0, this.particles.length - 900);
    }
    trail(game, d) {
      if (d.dist < 1) return;
      const cells = SHAPES[d.type][d.rot];
      const cols = {};
      for (const [cx, cy] of cells) { const x = d.x + cx; const top = d.fromY + cy; if (cols[x] == null || top < cols[x]) cols[x] = top; }
      this.trails.push({ t: 0, dur: 220, color: COLORS[d.type], cols: Object.keys(cols).map((x) => [+x, cols[x] - TOP, d.y - TOP + Math.min(...cells.filter((c) => d.x + c[0] === +x).map((c) => c[1]))]) });
      this.bump = { t: 0, dur: 160, amp: Math.min(0.22, 0.06 + d.dist * 0.012) };
    }
    lockFlash(cells) { this.flashes.push({ t: 0, dur: 180, cells: cells.map(([x, y]) => [x, y - TOP]) }); }
    label(lines, merge) {
      const last = this.labels[this.labels.length - 1];
      if (merge && last && last.t < 80) { last.lines.push(...lines); last.dur = Math.max(last.dur, 1700); return; }
      this.labels = [{ t: 0, dur: 1700, lines }];
    }
    shake(amp, dur) { this.bump = { t: 0, dur: dur || 260, amp, shake: true }; }
    flash(color, dur) { this.flashScreen = { t: 0, dur: dur || 260, color }; }
  }

  // --------------------------------------------------------------- renderer
  class Renderer {
    constructor(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.cache = new Map();
      this.fx = new Fx();
      this.L = null;
    }

    resize(cssW, cssH, dpr, insets) {
      this.L = computeLayout(cssW, cssH, dpr, insets);
      this.cv.width = this.L.W;
      this.cv.height = this.L.H;
      this.cache.clear();
      this.bg = null;
      return this.L;
    }

    // Cached block sprite: style 'n' normal, 'g' ghost, 'w' white flash.
    block(type, s, style) {
      const key = type + ':' + s + ':' + (style || 'n');
      let c = this.cache.get(key);
      if (c) return c;
      c = document.createElement('canvas');
      c.width = c.height = s;
      const g = c.getContext('2d');
      const col = COLORS[type];
      if (style === 'g') {
        const lw = Math.max(1, Math.round(s * 0.07));
        g.fillStyle = rgba(col, 0.13);
        g.fillRect(0, 0, s, s);
        g.strokeStyle = rgba(col, 0.6);
        g.lineWidth = lw;
        g.strokeRect(lw / 2 + 0.5, lw / 2 + 0.5, s - lw - 1, s - lw - 1);
      } else {
        const b = Math.max(1, Math.round(s * 0.13));
        const poly = (pts, fill) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fillStyle = fill; g.fill(); };
        g.fillStyle = col; g.fillRect(0, 0, s, s);
        poly([0, 0, s, 0, s - b, b, b, b], mix(col, 'w', 0.5));
        poly([0, 0, b, b, b, s - b, 0, s], mix(col, 'w', 0.24));
        poly([s, 0, s, s, s - b, s - b, s - b, b], mix(col, 'k', 0.22));
        poly([0, s, s, s, s - b, s - b, b, s - b], mix(col, 'k', 0.45));
        const gr = g.createLinearGradient(0, b, 0, s - b);
        gr.addColorStop(0, mix(col, 'w', 0.16));
        gr.addColorStop(1, mix(col, 'k', 0.08));
        g.fillStyle = gr;
        g.fillRect(b, b, s - 2 * b, s - 2 * b);
        // glossy sheen across the upper face
        const sh = g.createLinearGradient(0, b, 0, b + (s - 2 * b) * 0.55);
        sh.addColorStop(0, 'rgba(255,255,255,0.30)');
        sh.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = sh;
        g.fillRect(b, b, s - 2 * b, Math.round((s - 2 * b) * 0.55));
        g.fillStyle = 'rgba(255,255,255,0.55)';
        const d = Math.max(1, Math.round(s * 0.09));
        g.fillRect(b + d * 0.5, b + d * 0.5, d, d);
        g.strokeStyle = 'rgba(0,0,0,0.35)';
        g.lineWidth = 1;
        g.strokeRect(0.5, 0.5, s - 1, s - 1);
        if (style === 'w') { g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(0, 0, s, s); }
      }
      this.cache.set(key, c);
      return c;
    }

    buildBackground() {
      const L = this.L;
      const c = document.createElement('canvas');
      c.width = L.W; c.height = L.H;
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, L.H);
      gr.addColorStop(0, '#0d1022'); gr.addColorStop(1, '#05060d');
      g.fillStyle = gr; g.fillRect(0, 0, L.W, L.H);
      const b = L.board;
      const rg = g.createRadialGradient(b.x + b.w / 2, b.y + b.h * 0.45, b.w * 0.2, b.x + b.w / 2, b.y + b.h * 0.45, Math.max(L.W, L.H) * 0.7);
      rg.addColorStop(0, 'rgba(70,80,190,0.20)'); rg.addColorStop(1, 'rgba(70,80,190,0)');
      g.fillStyle = rg; g.fillRect(0, 0, L.W, L.H);
      // faint dot grid
      g.fillStyle = 'rgba(255,255,255,0.025)';
      const step = Math.max(12, Math.round(L.u * 0.9));
      for (let y = step / 2; y < L.H; y += step) for (let x = step / 2; x < L.W; x += step) g.fillRect(Math.round(x), Math.round(y), Math.max(1, L.dpr), Math.max(1, L.dpr));
      // board well with grid
      const fp = L.fp, u = L.u;
      g.save();
      g.shadowColor = 'rgba(90,110,255,0.35)'; g.shadowBlur = u * 0.8;
      rr(g, b.x - fp, b.y - fp, b.w + 2 * fp, b.h + 2 * fp, fp * 1.6);
      g.fillStyle = '#121735'; g.fill();
      g.restore();
      g.fillStyle = '#05070f';
      g.fillRect(b.x, b.y, b.w, b.h);
      g.fillStyle = 'rgba(255,255,255,0.045)';
      for (let x = 1; x < COLS; x++) g.fillRect(b.x + x * u, b.y, 1, b.h);
      for (let y = 1; y < 20; y++) g.fillRect(b.x, b.y + y * u, b.w, 1);
      // panels
      const panel = (p) => { if (!p) return; rr(g, p.x, p.y, p.w, p.h, u * 0.28); g.fillStyle = 'rgba(255,255,255,0.035)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = Math.max(1, L.dpr); g.stroke(); };
      panel(L.hold); panel(L.next); panel(L.stats);
      this.bg = c;
    }

    // ------------------------------------------------------------- drawing
    draw(view) {
      const L = this.L, ctx = this.ctx;
      if (!L) return;
      if (!this.bg) this.buildBackground();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.bg, 0, 0);
      const g = view.game;
      const u = L.u, b = L.board;

      // board frame glow when the stack is near the top
      let danger = 0;
      if (g && !view.hideBoard) {
        for (let y = TOP - 2; y < TOP + 4; y++) if (g.board[y] && g.board[y].some((v) => v)) { danger = 1; break; }
      }
      if (danger && view.live) {
        const a = 0.35 + 0.25 * Math.sin(view.now / 160);
        ctx.save();
        rr(ctx, b.x - L.fp, b.y - L.fp, b.w + 2 * L.fp, b.h + 2 * L.fp, L.fp * 1.6);
        ctx.strokeStyle = `rgba(255,60,80,${a})`; ctx.lineWidth = Math.max(2, L.fp * 0.6); ctx.stroke();
        ctx.restore();
      }

      if (g) {
        let oy = 0, ox = 0;
        const bump = this.fx.bump;
        if (bump) {
          const k = 1 - bump.t / bump.dur;
          if (bump.shake) { ox = Math.sin(bump.t / 18) * bump.amp * u * k; oy = Math.cos(bump.t / 23) * bump.amp * u * 0.5 * k; }
          else oy = Math.sin((bump.t / bump.dur) * Math.PI) * bump.amp * u;
        }
        ctx.save();
        ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
        ctx.translate(Math.round(ox), Math.round(oy));
        if (!view.hideBoard) this.drawBoard(g, view);
        this.drawEffects(view);
        ctx.restore();
        if (!view.hideBoard) {
          this.drawHold(g);
          this.drawNext(g);
        }
        this.drawStats(view);
      }
      if (this.fx.flashScreen) {
        const f = this.fx.flashScreen, k = 1 - f.t / f.dur;
        ctx.fillStyle = f.color.replace('A', (0.35 * k).toFixed(3));
        ctx.fillRect(b.x, b.y, b.w, b.h);
      }
      this.drawLabels(view);
      if (view.banner) this.drawBanner(view.banner);
    }

    cellPos(x, yv) { const L = this.L; return [L.board.x + x * L.u, L.board.y + yv * L.u]; }

    drawBoard(g, view) {
      const ctx = this.ctx, L = this.L, u = L.u, bx = L.board.x, by = L.board.y;
      const clearing = g.phase === 'clearing';
      const clearSet = clearing ? new Set(g.clearRows) : null;
      const p = clearing ? g.clearTimer / g.cfg.clearDelay : 0;
      const flashEnd = 0.55;
      let e = 0;
      if (clearing && p > flashEnd) { const q = (p - flashEnd) / (1 - flashEnd); e = q * q; }
      const greyRows = view.overT != null ? view.overT / 28 : -1;

      for (let y = TOP - 1; y < ROWS; y++) {
        const row = g.board[y];
        let drop = 0;
        if (clearing) {
          if (clearSet.has(y)) {
            if (p >= flashEnd) continue;
            const q = p / flashEnd;
            for (let x = 0; x < COLS; x++) {
              const k = Math.abs(x - 4.5) - 0.5;          // 0 centre .. 4 edge
              const vt = 0.4 + k * 0.12;
              if (q > vt) continue;
              const px = bx + x * u, py = by + (y - TOP) * u;
              ctx.drawImage(this.block(row[x] || 8, u), px, py);
              const fl = 0.45 + 0.55 * Math.abs(Math.sin(q * Math.PI * 3));
              ctx.fillStyle = `rgba(255,255,255,${fl.toFixed(3)})`;
              ctx.fillRect(px, py, u, u);
            }
            continue;
          }
          for (const r of g.clearRows) if (r > y) drop++;
        }
        const yy = by + Math.round((y - TOP + drop * e) * u);
        for (let x = 0; x < COLS; x++) {
          const t = row[x];
          if (!t) continue;
          const grey = greyRows >= 0 && (ROWS - 1 - y) < greyRows;
          ctx.drawImage(this.block(grey ? 8 : t, u), bx + x * u, yy);
        }
      }

      const a = g.active;
      if (a && (g.phase === 'falling' || g.phase === 'over')) {
        const cells = SHAPES[a.type][a.rot];
        if (g.phase === 'falling' && view.ghost !== false) {
          const gy = g.ghostY();
          if (gy !== a.y) {
            const gimg = this.block(a.type, u, 'g');
            for (const [cx, cy] of cells) ctx.drawImage(gimg, bx + (a.x + cx) * u, by + (gy + cy - TOP) * u);
          }
        }
        const img = this.block(view.overT != null ? 8 : a.type, u);
        const lockK = g.phase === 'falling' && g.lockTimer > 0 ? g.lockTimer / g.cfg.lockDelay : 0;
        for (const [cx, cy] of cells) {
          const px = bx + (a.x + cx) * u, py = by + (a.y + cy - TOP) * u;
          ctx.drawImage(img, px, py);
          if (lockK > 0) { ctx.fillStyle = `rgba(0,0,0,${(lockK * 0.38).toFixed(3)})`; ctx.fillRect(px, py, u, u); }
        }
      }
    }

    drawEffects() {
      const ctx = this.ctx, L = this.L, u = L.u, bx = L.board.x, by = L.board.y, fx = this.fx;
      for (const t of fx.trails) {
        const k = 1 - t.t / t.dur;
        for (const [x, y0, y1] of t.cols) {
          const top = by + y0 * u, bot = by + y1 * u;
          if (bot <= top) continue;
          const gr = ctx.createLinearGradient(0, top, 0, bot);
          gr.addColorStop(0, rgba(t.color, 0));
          gr.addColorStop(1, rgba(t.color, 0.38 * k));
          ctx.fillStyle = gr;
          ctx.fillRect(bx + x * u + u * 0.12, top, u * 0.76, bot - top);
        }
      }
      for (const f of fx.flashes) {
        const k = 1 - f.t / f.dur;
        ctx.fillStyle = `rgba(255,255,255,${(0.6 * k).toFixed(3)})`;
        for (const [x, y] of f.cells) ctx.fillRect(bx + x * u, by + y * u, u, u);
      }
      for (const p of fx.particles) {
        const k = Math.min(1, p.life / 400);
        const s = p.size * u;
        ctx.save();
        ctx.globalAlpha = k;
        ctx.translate(bx + p.x * u, by + p.y * u);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(-s / 2, -s / 2, s, s * 0.3);
        ctx.restore();
      }
    }

    drawMini(type, cx, cy, s, alpha) {
      const ctx = this.ctx;
      const bd = pieceBounds(type);
      const w = (bd.x1 - bd.x0) * s, h = (bd.y1 - bd.y0) * s;
      const x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2);
      const img = this.block(type, s);
      if (alpha != null) ctx.globalAlpha = alpha;
      for (const [x, y] of SHAPES[type][0]) ctx.drawImage(img, x0 + (x - bd.x0) * s, y0 + (y - bd.y0) * s);
      ctx.globalAlpha = 1;
    }

    panelTitle(p, text) {
      const ctx = this.ctx, u = this.L.u;
      const fs = Math.max(9, Math.round(u * (this.L.narrow ? 0.4 : 0.44)));
      ctx.font = `700 ${fs}px ${FONT}`;
      spacing(ctx, Math.round(fs * 0.18));
      ctx.fillStyle = '#8d96bf';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(text, p.x + Math.round(u * 0.32), p.y + Math.round(u * (this.L.narrow ? 0.22 : 0.3)));
      spacing(ctx, 0);
      return fs;
    }

    drawHold(g) {
      const L = this.L, p = L.hold, u = L.u;
      this.panelTitle(p, 'HOLD');
      if (!g.hold) return;
      const s = Math.max(4, Math.round(u * (L.narrow ? 0.44 : 0.78)));
      const top = L.narrow ? u * 0.62 : u * 0.95;
      this.drawMini(g.hold, p.x + p.w / 2, p.y + top + (p.h - top) / 2, s, g.holdUsed ? 0.3 : 1);
    }

    drawNext(g) {
      const L = this.L, p = L.next, u = L.u;
      this.panelTitle(p, 'NEXT');
      const s0 = Math.max(4, Math.round(u * L.nextScale[0])), s1 = Math.max(3, Math.round(u * L.nextScale[1]));
      let y = p.y + (L.narrow ? u * 0.72 : u * 1.05);
      const slot0 = L.narrow ? u * 1.65 : u * 2.6, slot = L.narrow ? u * 1.6 : u * 2.15;
      for (let i = 0; i < 5; i++) {
        const t = g.queue[i];
        const h = i === 0 ? slot0 : slot;
        if (t) this.drawMini(t, p.x + p.w / 2, y + h / 2, i === 0 ? s0 : s1);
        y += h;
      }
    }

    fitFont(text, maxW, size, weight) {
      const ctx = this.ctx;
      ctx.font = `${weight} ${size}px ${FONT}`;
      const w = ctx.measureText(text).width;
      if (w > maxW) { size = Math.max(6, Math.floor(size * maxW / w)); ctx.font = `${weight} ${size}px ${FONT}`; }
      return size;
    }

    statEntries(view) {
      const g = view.game;
      if (view.mode === 'sprint') {
        const pps = g.time > 0 ? (g.pieces / (g.time / 1000)).toFixed(2) : '0.00';
        return [['TIME', fmtTime(g.time)], ['LINES', Math.min(g.lines, 40) + '/40'], ['PPS', pps], ['BEST', view.best ? fmtTime(view.best) : '--']];
      }
      return [['SCORE', fmt(g.score)], ['LEVEL', String(g.level)], ['LINES', String(g.lines)], ['BEST', fmt(Math.max(view.best || 0, view.live ? g.score : 0))]];
    }

    drawStats(view) {
      const L = this.L, ctx = this.ctx, u = L.u;
      const entries = this.statEntries(view);
      if (!L.narrow) {
        const p = L.stats, pad = Math.round(u * 0.32);
        const rowH = (p.h - pad * 2) / 4;
        entries.forEach(([label, value], i) => {
          const y = p.y + pad + i * rowH;
          const fs = Math.max(8, Math.round(u * 0.4));
          ctx.font = `700 ${fs}px ${FONT}`;
          spacing(ctx, Math.round(fs * 0.18));
          ctx.fillStyle = '#8d96bf'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillText(label, p.x + pad, y);
          spacing(ctx, 0);
          this.fitFont(value, p.w - pad * 2, Math.round(u * 0.85), 800);
          ctx.fillStyle = label === 'BEST' ? '#ffd76a' : '#f2f4ff';
          ctx.fillText(value, p.x + pad, y + fs * 1.35);
        });
      } else {
        const h = L.hud, gap = Math.round(u * 0.18);
        const fr = view.mode === 'sprint' ? [0.32, 0.24, 0.2, 0.24] : [0.34, 0.19, 0.19, 0.28];
        let x = h.x;
        entries.forEach(([label, value], i) => {
          const w = Math.round((h.w - gap * 3) * fr[i]);
          rr(ctx, x, h.y, w, h.h, u * 0.22);
          ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = Math.max(1, L.dpr); ctx.stroke();
          const fs = Math.max(8, Math.round(u * 0.36));
          ctx.font = `700 ${fs}px ${FONT}`;
          spacing(ctx, Math.round(fs * 0.12));
          ctx.fillStyle = '#8d96bf'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(label, x + w / 2, h.y + Math.round(u * 0.2));
          spacing(ctx, 0);
          this.fitFont(value, w - u * 0.3, Math.round(u * 0.66), 800);
          ctx.fillStyle = label === 'BEST' ? '#ffd76a' : '#f2f4ff';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(value, x + w / 2, h.y + h.h - Math.round(u * 0.25));
          x += w + gap;
        });
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    drawLabels(view) {
      const fx = this.fx;
      if (!fx.labels.length || view.hideBoard) return;
      const L = this.L, ctx = this.ctx, u = L.u;
      const lab = fx.labels[fx.labels.length - 1];
      const area = L.labels && L.labels.h > u * 3 ? L.labels : null;
      const cx = area ? area.x + area.w / 2 : L.board.x + L.board.w / 2;
      let y = area ? area.y + u * 1.2 : L.board.y + L.board.h * 0.26;
      const maxW = area ? area.w - u * 0.3 : L.board.w - u * 0.6;
      const k = lab.t < 120 ? lab.t / 120 : 1;
      const fade = lab.t > lab.dur - 450 ? (lab.dur - lab.t) / 450 : 1;
      const rise = area ? 0 : -(lab.t / lab.dur) * u * 0.8;
      ctx.save();
      ctx.globalAlpha = Math.max(0, fade);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const line of lab.lines) {
        const base = Math.round(u * (line.size || 0.7) * (area ? 0.92 : 1.05));
        const size = this.fitFont(line.text, maxW, Math.round(base * (0.7 + 0.3 * k)), 900);
        ctx.lineWidth = Math.max(2, size * 0.16);
        ctx.strokeStyle = 'rgba(5,6,16,0.85)';
        ctx.lineJoin = 'round';
        ctx.strokeText(line.text, cx, y + rise);
        ctx.fillStyle = line.color || '#fff';
        ctx.fillText(line.text, cx, y + rise);
        y += size * 1.25;
      }
      ctx.restore();
    }

    drawBanner(bn) {
      const L = this.L, ctx = this.ctx, b = L.board;
      const k = Math.min(1, bn.t / 140);
      const size = Math.round(L.u * (bn.big ? 2.0 : 1.5) * (0.6 + 0.4 * k));
      ctx.save();
      ctx.globalAlpha = bn.alpha == null ? 1 : bn.alpha;
      ctx.font = `900 ${size}px ${FONT}`;
      spacing(ctx, Math.round(size * 0.08));
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(3, size * 0.14); ctx.strokeStyle = 'rgba(5,6,16,0.9)'; ctx.lineJoin = 'round';
      ctx.strokeText(bn.text, b.x + b.w / 2, b.y + b.h * 0.42);
      ctx.fillStyle = bn.color || '#fff';
      ctx.fillText(bn.text, b.x + b.w / 2, b.y + b.h * 0.42);
      spacing(ctx, 0);
      ctx.restore();
    }

    // Block-built TETRIS logo for the title card.
    drawLogo(canvas, cssW) {
      const font = {
        T: ['###', '.#.', '.#.', '.#.', '.#.'],
        E: ['###', '#..', '##.', '#..', '###'],
        R: ['##.', '#.#', '##.', '#.#', '#.#'],
        I: ['###', '.#.', '.#.', '.#.', '###'],
        S: ['.##', '#..', '.#.', '..#', '##.'],
      };
      const word = 'TETRIS', cols = [7, 3, 4, 5, 1, 6];
      const dpr = window.devicePixelRatio || 1;
      const unitsW = word.length * 3 + (word.length - 1);
      const s = Math.max(4, Math.floor((cssW * dpr) / unitsW));
      canvas.width = s * unitsW; canvas.height = s * 5;
      canvas.style.width = (canvas.width / dpr) + 'px';
      canvas.style.height = (canvas.height / dpr) + 'px';
      const g = canvas.getContext('2d');
      g.clearRect(0, 0, canvas.width, canvas.height);
      [...word].forEach((ch, i) => {
        font[ch].forEach((row, y) => [...row].forEach((v, x) => {
          if (v === '#') g.drawImage(this.block(cols[i], s), (i * 4 + x) * s, y * s);
        }));
      });
    }
  }

  window.TetrisRender = { Renderer, COLORS, fmt, fmtTime, computeLayout };
}());
