// Pixel-art canvas renderer: the field, players, ball, aiming arc, HUD, banners and the kicking view.
// Two layers, the way GameMaker draws it: the world is pixel art on a W x H buffer that gets scaled up with
// hard edges, and the HUD, labels and text are drawn on top at the screen's own resolution so they stay sharp.
import { FIELD_W, fmtClock, downText, yardText, maxThrow, flightTime } from './match.js';

export const H = 432;                // art pixels top to bottom: a wider look at the field than the old 360
export let W = 768;                  // 16:9 by default; widens to fill wide phone screens (see setAspect)
export const UI_SCALE = H / 360;     // gestures were tuned at 360 tall
const SX = 10;                     // pixels per yard along the field
const TOP = 72, BOT = 404;         // field sidelines on screen
const SY = (BOT - TOP) / FIELD_W;  // pixels per yard across the field
const FONT = '"Press Start 2P", ui-monospace, monospace';

const SKIN = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e', '#ffdbac'];

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function colorDist(a, b) { const A = hexToRgb(a), B = hexToRgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); }
function shade(h, f) { const [r, g, b] = hexToRgb(h); const c = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${c(r)},${c(g)},${c(b)})`; }

export class Renderer {
  constructor(canvas) {
    this.c = canvas;
    this.out = canvas.getContext('2d');
    this.world = document.createElement('canvas');
    this.world.width = W; this.world.height = H;
    this.wg = this.world.getContext('2d');
    this.wg.imageSmoothingEnabled = false;
    this.g = this.wg;
    this.k = 1;
    this.labels = [];
    this.resize(W, H);
    this.camX = 30;
    this.shake = 0;
    this.crowd = makeCrowd();
    this.t = 0;
    this.confetti = [];
  }

  kits(m) {
    const us = { jersey: m.us.c1, helmet: m.us.c1, pants: m.us.c2, trim: m.us.c2 };
    let them = { jersey: m.them.c1, helmet: m.them.c1, pants: m.them.c2, trim: m.them.c2 };
    if (colorDist(m.us.c1, m.them.c1) < 120) them = { jersey: '#f4f4f4', helmet: m.them.c1, pants: m.them.c1, trim: m.them.c1 };
    return { o: us, d: them };
  }

  // fill the screen's shape instead of letterboxing: 16:9 up to about 21:9
  setAspect(a) {
    const w = Math.round(H * Math.max(16 / 9, Math.min(2.25, a)) / 2) * 2;
    if (w !== W) { W = w; this.world.width = W; this.wg.imageSmoothingEnabled = false; }
  }

  // size of the canvas in real device pixels
  resize(pw, ph) {
    if (this.c.width !== pw || this.c.height !== ph) { this.c.width = pw; this.c.height = ph; }
    this.k = pw / W;
  }

  // world buffer -> screen with hard pixel edges, then switch drawing to the sharp screen layer
  present() {
    const o = this.out;
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.imageSmoothingEnabled = false;
    o.drawImage(this.world, 0, 0, this.c.width, this.c.height);
    o.setTransform(this.k, 0, 0, this.k, 0, 0);
    this.g = o;
    for (const L of this.labels) this.label(...L);
    this.labels.length = 0;
  }

  sx(x) { return Math.round((x - this.camX) * SX + W / 2); }
  sy(y) { return Math.round(TOP + y * SY); }

  draw(m, dt, ui = {}) {
    this.t += dt;
    const g = this.g = this.wg;
    if (m.stage === 'kick' && m.kick) { this.drawKick(m, ui); this.present(); this.drawKickGui(m, ui); this.drawHud(m); return; }
    const P = m.play;
    // camera follows the ball, a little ahead of it
    let focus = m.los + 8;
    if (P) {
      const b = P.ball;
      focus = P.carrier ? P.carrier.x + 8 : b.air ? b.x + 4 : P.live ? P.qb.x + 14 : m.los + 10;
    }
    const half = W / 2 / SX;
    focus = Math.max(-11 + half, Math.min(111 - half, focus));
    this.camX += (focus - this.camX) * Math.min(1, dt * 4);
    g.save();
    if (this.shake > 0) { this.shake -= dt; g.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3); }
    this.drawStands();
    this.drawField(m);
    if (P) this.drawPlay(m, P, ui);
    g.restore();
    this.drawConfetti(dt);
    this.present();
    this.drawHud(m);
    this.drawBanner(m);
    if (m.stage === 'opp' || m.stage === 'opp-wait') this.drawOpp(m);
  }

  drawStands() {
    const g = this.g;
    g.fillStyle = '#1d1f2b'; g.fillRect(0, 0, W, TOP);
    g.fillRect(0, BOT, W, H - BOT);
    const off = Math.floor(((this.camX * SX * 0.6) % 160 + 160) % 160);
    for (let x = -off; x < W; x += 160) {
      g.drawImage(this.crowd, x, TOP - 8 - CROWD_H);
      g.drawImage(this.crowd, x, BOT + 7);
    }
    // sideline strip
    g.fillStyle = '#2e6b2e'; g.fillRect(0, TOP - 8, W, 8); g.fillRect(0, BOT, W, 7);
  }

  drawField(m) {
    const g = this.g;
    const x0 = this.camX - W / 2 / SX - 1, x1 = this.camX + W / 2 / SX + 1;
    for (let x = Math.floor(x0 / 5) * 5; x < x1; x += 5) {
      if (x < -10 || x >= 110) continue;
      const a = this.sx(x), b = this.sx(x + 5);
      if (x < 0 || x >= 100) {
        const team = x < 0 ? m.us : m.them;
        g.fillStyle = shade(team.c1, 0.9);
      } else g.fillStyle = (Math.floor(x / 5) % 2) ? '#3f9b45' : '#47a84d';
      g.fillRect(a, TOP, b - a, BOT - TOP);
    }
    // end zone names
    for (const [x, team] of [[-5, m.us], [105, m.them]]) {
      const px = this.sx(x);
      if (px < -60 || px > W + 60) continue;
      g.save(); g.translate(px, (TOP + BOT) / 2); g.rotate(x < 0 ? -Math.PI / 2 : Math.PI / 2);
      g.font = `14px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = shade(team.c2, 1); g.fillText(team.city.toUpperCase(), 0, 0);
      g.restore();
    }
    g.fillStyle = '#ffffff';
    for (let x = 0; x <= 100; x += 5) {
      const px = this.sx(x);
      if (px < -4 || px > W + 4) continue;
      g.fillRect(px, TOP, x % 10 === 0 || x === 0 || x === 100 ? 2 : 1, BOT - TOP);
    }
    // hash marks and numbers
    g.fillStyle = 'rgba(255,255,255,0.85)';
    for (let x = 1; x < 100; x++) {
      if (x % 5 === 0) continue;
      const px = this.sx(x);
      if (px < 0 || px > W) continue;
      for (const y of [0.6, 23.4, 29.9, FIELD_W - 1.2]) g.fillRect(px, this.sy(y), 1, 3);
    }
    g.font = `10px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let x = 10; x <= 90; x += 10) {
      const px = this.sx(x);
      if (px < -20 || px > W + 20) continue;
      const n = x <= 50 ? x : 100 - x;
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.fillText(String(n), px + 1, this.sy(6));
      g.fillText(String(n), px + 1, this.sy(FIELD_W - 6));
    }
    g.fillStyle = '#ffffff';
    g.fillRect(0, TOP - 1, W, 2); g.fillRect(0, BOT - 1, W, 2);
    // goal posts (seen from above: a small yellow T on the end line)
    for (const x of [-10, 110]) {
      const px = this.sx(x);
      if (px < -10 || px > W + 10) continue;
      g.fillStyle = '#ffd400';
      g.fillRect(px - 1, this.sy(MIDY - 3.1), 3, Math.round(6.2 * SY));
    }
    // line of scrimmage + first down marker
    if (m.stage === 'presnap' || m.stage === 'live' || m.stage === 'fourth' || m.stage === 'result') {
      const los = this.sx(m.los);
      g.fillStyle = 'rgba(70,140,255,0.9)'; g.fillRect(los, TOP, 2, BOT - TOP);
      if (m.fd < 100) { g.fillStyle = 'rgba(255,225,40,0.95)'; g.fillRect(this.sx(m.fd), TOP, 2, BOT - TOP); }
    }
  }

  drawPlay(m, P, ui) {
    const g = this.g;
    const kits = this.kits(m);
    const all = [...P.o, ...P.d].sort((a, b) => a.y - b.y);
    // aim arc
    if (P.aim && !P.thrown) this.drawAim(P, ui);
    for (const p of all) this.drawPlayer(p, kits[p.team], p === P.carrier, P, m);
    // ball
    const b = P.ball;
    if (b.air || (!P.carrier && !P.live && !P.result)) {
      const bx = this.sx(b.x), by = this.sy(b.y);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(bx - 2, by - 1, 4, 2);
      const lift = Math.round(b.z * 7);
      g.fillStyle = '#7a3e12'; g.fillRect(bx - 2, by - lift - 1, 5, 3);
      g.fillStyle = '#ffffff'; g.fillRect(bx, by - lift, 1, 1);
    }
    // hand-off hint
    if (P.live && P.handoffOpen && !P.aim && P.t > 0.2 && ui.hints) {
      const rx = this.sx(P.rb.x), ry = this.sy(P.rb.y) - 26;
      this.label('TAP RB: RUN', rx, ry, '#ffe14d');
    }
    if (m.stage === 'presnap') {
      const qx = this.sx(P.qb.x), qy = this.sy(P.qb.y) - 30;
      const bob = Math.round(Math.sin(this.t * 5) * 2);
      this.label(ui.touch ? 'TAP TO SNAP' : 'CLICK / SPACE TO SNAP', qx, qy + bob, '#ffffff');
    }
  }

  drawAim(P, ui) {
    const g = this.g, qb = P.qb, a = P.aim;
    const d = Math.hypot(a.x - qb.x, a.y - qb.y);
    const h = 1.2 + d * 0.11;
    const n = Math.max(6, Math.round(d / 1.6));
    for (let i = 1; i <= n; i++) {
      if (i % 2 && i !== n) continue;
      const k = i / n;
      const x = qb.x + (a.x - qb.x) * k, y = qb.y + (a.y - qb.y) * k;
      const z = 1.4 + h * 4 * k * (1 - k);
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.fillRect(this.sx(x) - 1, this.sy(y) - Math.round(z * 7) - 1, 2, 2);
    }
    const tx = this.sx(a.x), ty = this.sy(a.y);
    g.strokeStyle = '#ffffff'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(tx + 0.5, ty + 0.5, 7, 4, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ffe14d'; g.fillRect(tx - 1, ty - 1, 2, 2);
    // throw strength bar
    const pct = Math.min(1, d / maxThrow(qb.p));
    const bx = this.sx(qb.x) - 12, by = this.sy(qb.y) + 6;
    g.fillStyle = '#000'; g.fillRect(bx - 1, by - 1, 26, 5);
    g.fillStyle = pct > 0.9 ? '#ff5a3c' : '#ffe14d'; g.fillRect(bx, by, Math.round(24 * pct), 3);
    void flightTime; void ui;
  }

  drawPlayer(p, kit, isCarrier, P, m) {
    const g = this.g;
    const x = this.sx(p.x), y = this.sy(p.y);
    if (x < -12 || x > W + 12) return;
    const skin = SKIN[(p.p ? p.p.id : p.role.charCodeAt(0) + Math.round(p.y)) % SKIN.length] || SKIN[0];
    const moving = Math.hypot(p.vx, p.vy) > 0.6;
    const f = moving ? Math.floor(p.anim) % 2 : 0;
    const down = (P.result && P.carrier === p && P.result.kind !== 'td') || p.stun > 0.3;
    const diving = P.diving > 0 && P.carrier === p;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x - 4, y - 1, 9, 3);
    if (down || diving) {
      // lying flat
      g.fillStyle = kit.jersey; g.fillRect(x - 6, y - 5, 9, 4);
      g.fillStyle = kit.pants; g.fillRect(x - 9 * p.face + (p.face > 0 ? 3 : 0) - 3, y - 4, 4, 3);
      g.fillStyle = kit.helmet; g.fillRect(x + (p.face > 0 ? 3 : -8), y - 6, 5, 4);
      return;
    }
    // legs
    g.fillStyle = kit.pants;
    g.fillRect(x - 3, y - 6, 2, f ? 5 : 4);
    g.fillRect(x + 1, y - 6, 2, f ? 4 : 5);
    g.fillStyle = '#111'; g.fillRect(x - 3, y - 1 - (f ? 0 : 1), 2, 1); g.fillRect(x + 1, y - 1 - (f ? 1 : 0), 2, 1);
    // body + arms
    g.fillStyle = kit.jersey; g.fillRect(x - 4, y - 11, 8, 6);
    g.fillStyle = kit.trim; g.fillRect(x - 4, y - 11, 8, 1);
    g.fillStyle = skin; g.fillRect(x - 5, y - 10 + f, 1, 3); g.fillRect(x + 4, y - 10 + (1 - f), 1, 3);
    // helmet + facemask
    g.fillStyle = kit.helmet; g.fillRect(x - 3, y - 16, 6, 5);
    g.fillStyle = shade(kit.helmet, 1.35); g.fillRect(x - 2, y - 16, 3, 1);
    g.fillStyle = skin; g.fillRect(x + (p.face > 0 ? 1 : -3), y - 14, 2, 2);
    g.fillStyle = '#c9c9c9'; g.fillRect(x + (p.face > 0 ? 3 : -4), y - 14, 1, 3);
    if (isCarrier) {
      g.fillStyle = '#7a3e12'; g.fillRect(x + (p.face > 0 ? 2 : -5), y - 9, 3, 2);
      const bob = Math.round(Math.sin(this.t * 8) * 1);
      g.fillStyle = '#ffe14d'; g.fillRect(x - 2, y - 22 + bob, 5, 1); g.fillRect(x - 1, y - 21 + bob, 3, 1); g.fillRect(x, y - 20 + bob, 1, 1);
    } else if (p.role === 'QB' && P.live && !P.thrown) {
      g.fillStyle = '#7a3e12'; g.fillRect(x + (p.face > 0 ? 2 : -5), y - 12, 3, 2);
    }
    void m;
  }

  label(text, x, y, color) {
    if (this.g === this.wg) { this.labels.push([text, x, y, color]); return; }   // drawn sharp after present()
    const g = this.g;
    g.font = `8px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = g.measureText(text).width + 8;
    g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(Math.round(x - w / 2), y - 6, Math.round(w), 12);
    g.fillStyle = color; g.fillText(text, x, y + 1);
  }

  drawHud(m) {
    const g = this.g;
    g.fillStyle = '#0d0e14'; g.fillRect(0, 0, W, 26);
    g.font = `10px ${FONT}`; g.textBaseline = 'middle';
    // our box
    const box = (x, team, score, right) => {
      g.fillStyle = team.c1; g.fillRect(x, 3, 150, 20);
      g.fillStyle = shade(team.c2, 1); g.fillRect(right ? x : x + 146, 3, 4, 20);
      g.fillStyle = '#ffffff'; g.textAlign = right ? 'right' : 'left';
      const nm = team.city.toUpperCase();
      g.font = `${nm.length > 10 ? 7 : 10}px ${FONT}`;
      g.fillText(nm, right ? x + 142 - 30 : x + 6 + 30, 14);
      g.font = `10px ${FONT}`;
      g.fillStyle = '#000000aa'; g.fillRect(right ? x + 118 : x + 4, 5, 28, 16);
      g.fillStyle = '#ffe14d'; g.textAlign = 'center'; g.fillText(String(score), right ? x + 132 : x + 18, 14);
    };
    box(4, m.us, m.score.us, false);
    box(W - 154, m.them, m.score.them, true);
    g.fillStyle = '#ffffff'; g.textAlign = 'center';
    const qn = m.q <= 4 ? `Q${m.q}` : 'OT';
    g.fillText(`${qn} ${fmtClock(m.clock)}`, W / 2, 9);
    g.font = `8px ${FONT}`;
    g.fillStyle = '#9fd3ff';
    const sub = (m.stage === 'opp' || m.stage === 'opp-wait') ? 'DEFENSE' : m.twoPoint ? '2-PT TRY' : `${downText(m)} · ${yardText(m.los).toUpperCase()}`;
    g.fillText(sub, W / 2, 20);
    // timeouts
    for (let i = 0; i < 3; i++) { g.fillStyle = i < m.timeouts ? '#ffe14d' : '#333'; g.fillRect(162 + i * 7, 18, 5, 3); }
  }

  drawBanner(m) {
    if (!m.msg || !(m.stage === 'result' || m.stage === 'banner')) return;
    const g = this.g;
    const { big, small } = m.msg;
    const y = Math.round(H * 0.42);
    if (big) {
      g.font = `22px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const w = Math.min(W - 20, g.measureText(big).width + 40);
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect((W - w) / 2, y - 22, w, small ? 60 : 44);
      g.fillStyle = '#000'; g.fillText(big, W / 2 + 2, y + 2);
      g.fillStyle = /TOUCHDOWN|GOOD|FIRST|2 POINTS/.test(big) ? '#ffe14d' : /INTER|FUMBLE|SACK|SAFETY|TURNOVER|NO GOOD/.test(big) ? '#ff6b4a' : '#ffffff';
      g.fillText(big, W / 2, y);
      if (small) { g.font = `10px ${FONT}`; g.fillStyle = '#ffffff'; g.fillText(small, W / 2, y + 26); }
    } else if (small) {
      this.label(small.toUpperCase(), W / 2, y, '#ffffff');
    }
  }

  drawOpp(m) {
    const g = this.g;
    const px = W / 2 - 250, py = Math.round(H / 2 - 110);
    g.fillStyle = 'rgba(8,10,20,0.82)'; g.fillRect(px, py, 500, 220);
    g.strokeStyle = m.them.c1; g.lineWidth = 3; g.strokeRect(px + 1.5, py + 1.5, 497, 217);
    g.font = `12px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffffff'; g.fillText(`${m.them.city.toUpperCase()} ON OFFENSE`, W / 2, py + 26);
    let y = py + 60;
    for (let i = 0; i < m.oppShown; i++) {
      const L = m.oppLines[i];
      g.font = `${L.big ? 14 : 9}px ${FONT}`;
      g.fillStyle = L.big ? (L.good ? '#7dff8a' : '#ff6b4a') : '#cfd6ff';
      g.fillText(L.text.toUpperCase(), W / 2, y);
      y += L.big ? 30 : 22;
    }
    if (m.stage === 'opp-wait' && Math.floor(this.t * 2) % 2 === 0) {
      g.font = `9px ${FONT}`; g.fillStyle = '#ffe14d'; g.fillText('TAP TO CONTINUE', W / 2, py + 202);
    }
  }

  // ------------------------------------------------------------ kicking view (behind the kicker)
  drawKick(m, ui) {
    const g = this.g, k = m.kick;
    const hor = Math.round(H * 0.42), F = 700 * UI_SCALE, camH = 2.2, Z0 = 14;
    // sky + stands
    const grad = g.createLinearGradient(0, 26, 0, hor);
    grad.addColorStop(0, '#1b2440'); grad.addColorStop(1, '#3a4a7a');
    g.fillStyle = grad; g.fillRect(0, 26, W, hor - 26);
    for (let x = 0; x < W; x += 160) g.drawImage(this.crowd, x, hor - CROWD_H);
    g.fillStyle = '#3f9b45'; g.fillRect(0, hor, W, H - hor);
    const proj = (x, z, h) => ({ x: W / 2 + x / (z + Z0) * F, y: hor + (camH - h) / (z + Z0) * F });
    // yard lines every 5 yards
    for (let z = -10; z < 90; z += 5) {
      const a = proj(-30, z, 0), b = proj(30, z, 0);
      g.fillStyle = z % 10 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)';
      g.fillRect(Math.max(0, a.x), Math.round(a.y), Math.min(W, b.x) - Math.max(0, a.x), 1);
    }
    for (const sx of [-26.65, 26.65]) {
      for (let z = -10; z < 90; z += 1) {
        const a = proj(sx, z, 0);
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(Math.round(a.x), Math.round(a.y), 1, 1);
      }
    }
    // goalposts at the kick distance
    const D = k.distance;
    const post = (x) => { const a = proj(x, D, 3.33), b = proj(x, D, 10); g.fillRect(Math.round(a.x) - 1, Math.round(b.y), 3, Math.round(a.y - b.y)); };
    g.fillStyle = '#ffd400';
    const L = proj(-3.08, D, 3.33), Rr = proj(3.08, D, 3.33), base = proj(0, D, 0);
    g.fillRect(Math.round(L.x), Math.round(L.y) - 1, Math.round(Rr.x - L.x) + 2, 3);
    g.fillRect(Math.round(base.x) - 1, Math.round(L.y), 3, Math.round(base.y - L.y));
    post(-3.08); post(3.08);
    // the ball
    const b = k.ball || { z: 0, x: 0, h: 0 };
    const pb = proj(b.x, b.z, b.h + 0.2), sh = proj(b.x, b.z, 0);
    const size = Math.max(3, Math.round(0.45 / (b.z + Z0) * F));
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.round(sh.x - size / 2), Math.round(sh.y), size, Math.max(1, size / 3));
    g.fillStyle = '#7a3e12'; g.fillRect(Math.round(pb.x - size / 2), Math.round(pb.y - size / 2), size, Math.round(size * 0.7));
    g.fillStyle = '#fff'; g.fillRect(Math.round(pb.x), Math.round(pb.y - size / 4), 1, 1);
    // aiming line (the meter and text go on the sharp layer)
    if (k.phase === 'aim') {
      const a = ui.kickAim || { aim: 0, power: 0 };
      if (a.active) {
        const tip = proj(a.aim * 30, 30, 0);
        g.strokeStyle = '#ffe14d'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(pb.x, pb.y); g.lineTo(tip.x, tip.y); g.stroke();
      }
    }
    this.kickBallScreen = proj(0, 0, 0.2);
  }

  // kicking view, sharp layer: the meter, the hint and the wind
  drawKickGui(m, ui) {
    const g = this.g, k = m.kick, D = k.distance;
    const top = Math.round(H * 0.42), len = H - top - 50, bot = top + len;
    g.font = `9px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (k.phase === 'aim') {
      const a = ui.kickAim || { aim: 0, power: 0 };
      // power meter
      g.fillStyle = '#000'; g.fillRect(W - 40, top, 18, len + 6);
      const pw = Math.min(1.05, a.power || 0);
      g.fillStyle = pw > 1 ? '#ff5a3c' : '#ffe14d';
      g.fillRect(W - 37, bot + 3 - Math.round(len * Math.min(1, pw)), 12, Math.round(len * Math.min(1, pw)));
      // the distance this kicker needs at full power
      const need = Math.min(1, D / k.maxRange);
      g.fillStyle = '#fff'; g.fillRect(W - 44, bot + 3 - Math.round(len * need), 26, 2);
      this.label(ui.touch ? 'SWIPE UP FROM THE BALL TO KICK' : 'DRAG UP FROM THE BALL (OR HOLD SPACE, ←/→ TO AIM)', W / 2, H - 14, '#ffffff');
    }
    // wind + info
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(8, 34, 170, 40);
    g.fillStyle = '#fff'; g.textAlign = 'left';
    g.fillText(`${k.purpose === 'pat' ? 'EXTRA POINT' : 'FIELD GOAL'} ${D} YD`, 14, 46);
    g.fillText(`WIND ${Math.abs(k.wind)} MPH ${k.wind < 0 ? '←' : k.wind > 0 ? '→' : ''}`, 14, 62);
    if (k.phase === 'done') {
      g.textAlign = 'center'; g.font = `22px ${FONT}`;
      g.fillStyle = k.result === 'good' ? '#ffe14d' : '#ff6b4a';
      g.fillText(k.result === 'good' ? "IT'S GOOD!" : 'NO GOOD', W / 2, top + 50);
      if (k.why) { g.font = `10px ${FONT}`; g.fillStyle = '#fff'; g.fillText(k.why.toUpperCase(), W / 2, top + 78); }
    }
  }

  burst() {
    for (let i = 0; i < 90; i++) this.confetti.push({ x: Math.random() * W, y: -Math.random() * 120, vy: 40 + Math.random() * 80, vx: (Math.random() - 0.5) * 40, c: ['#ffe14d', '#ff6b4a', '#7dff8a', '#9fd3ff', '#ffffff'][i % 5], t: 3 + Math.random() * 2 });
  }
  drawConfetti(dt) {
    if (!this.confetti.length) return;
    const g = this.g;
    for (const p of this.confetti) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), 2, 3); }
    this.confetti = this.confetti.filter(p => p.t > 0 && p.y < H);
  }

  // screen → field yards
  toField(px, py) { return { x: (px - W / 2) / SX + this.camX, y: (py - TOP) / SY }; }
}
const MIDY = FIELD_W / 2;
const CROWD_H = 40;
export const PX_PER_YARD = { x: SX, y: SY };

function makeCrowd() {
  const c = document.createElement('canvas');
  c.width = 160; c.height = CROWD_H;
  const g = c.getContext('2d');
  g.fillStyle = '#20232f'; g.fillRect(0, 0, 160, CROWD_H);
  const cols = ['#c94f4f', '#e0c060', '#5c8fd6', '#e8e8e8', '#6fbf73', '#b06fd0', '#f08a3c', '#333a4f'];
  for (let y = 1; y < CROWD_H; y += 4) for (let x = (y % 8 === 1 ? 0 : 2); x < 160; x += 4) {
    g.fillStyle = cols[(x * 7 + y * 13) % cols.length];
    g.fillRect(x, y, 2, 2);
    g.fillStyle = '#f1c27d'; g.fillRect(x, y - 1, 2, 1);
  }
  return c;
}
