// Race HUD (DOM + minimap canvas) and the on-screen touch controls.
import { ordinal, fmtTime } from './data.js';

const $ = id => document.getElementById(id);

export const ITEM_SVG = {
  boost: '<svg viewBox="0 0 64 64"><path d="M32 4c8 10 14 18 14 28a14 14 0 0 1-28 0c0-6 3-11 6-15 1 5 3 8 6 9-2-8 0-15 2-22z" fill="#ff7a1a"/><path d="M32 22c5 6 8 10 8 15a8 8 0 0 1-16 0c0-4 2-7 4-9 1 3 2 4 4 5-1-4 0-8 0-11z" fill="#ffe14d"/></svg>',
  banana: '<svg viewBox="0 0 64 64"><path d="M14 16c-2 18 8 34 30 36 6 0 8-3 6-5-16-2-26-14-26-31 0-4-8-6-10 0z" fill="#ffd93b" stroke="#a36b00" stroke-width="2.5"/><path d="M14 16l-2-6 6 2z" fill="#6b4a1e"/></svg>',
  shell: '<svg viewBox="0 0 64 64"><g fill="#fff"><path d="M32 3l5 10H27z"/><path d="M58 30l-10 5V25z"/><path d="M32 61l-5-10h10z"/><path d="M6 30l10-5v10z"/></g><circle cx="32" cy="32" r="18" fill="#e8313c" stroke="#fff" stroke-width="5"/><circle cx="26" cy="26" r="5" fill="#ff9a9a"/></svg>',
  shield: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="rgba(110,210,255,0.45)" stroke="#7fdcff" stroke-width="4"/><path d="M20 24a14 14 0 0 1 12-8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
};
const ITEMS = ['boost', 'banana', 'shell', 'shield'];
const MUTE_ON = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>';
const MUTE_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';

export class Hud {
  constructor(input) {
    this.input = input;
    this.el = $('hud');
    this.pos = $('h-pos'); this.lap = $('h-lap'); this.time = $('h-time'); this.laptime = $('h-laptime'); this.best = $('h-best');
    this.item = $('h-item'); this.speed = $('h-speed'); this.speedbar = $('h-speedbar');
    this.bannerEl = $('h-banner'); this.warn = $('h-warn'); this.hint = $('h-hint'); this.fps = $('h-fps');
    this.names = $('h-names');
    this.map = $('minimap'); this.mctx = this.map.getContext('2d');
    this.cache = {};
    this.bannerT = 0;
    this.touchEl = $('touch');
    this.setupTouch();
  }
  show(on) { this.el.hidden = !on; }
  setMute(m) { $('h-mute').innerHTML = m ? MUTE_ON : MUTE_OFF; }
  set(key, el, val, html = false) {
    if (this.cache[key] === val) return;
    this.cache[key] = val;
    if (html) el.innerHTML = val; else el.textContent = val;
  }
  setupRace(track, laps, n) {
    this.track = track; this.laps = laps; this.n = n; this.cache = {};
    // minimap transform
    const t = track;
    let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9;
    for (let i = 0; i < t.N; i++) { mnx = Math.min(mnx, t.PX[i]); mxx = Math.max(mxx, t.PX[i]); mnz = Math.min(mnz, t.PZ[i]); mxz = Math.max(mxz, t.PZ[i]); }
    const W = this.map.width, pad = 26;
    const sc = (W - pad * 2) / Math.max(mxx - mnx, mxz - mnz);
    const ox = (W - (mxx - mnx) * sc) / 2, oz = (W - (mxz - mnz) * sc) / 2;
    // looking from the default camera the map is drawn with +x to the left so it matches the view
    this.mapT = (x, z) => [W - (ox + (x - mnx) * sc), W - (oz + (z - mnz) * sc)];
    const p = new Path2D();
    for (let i = 0; i <= t.N; i++) { const [a, b] = this.mapT(t.PX[i % t.N], t.PZ[i % t.N]); if (i) p.lineTo(a, b); else p.moveTo(a, b); }
    this.mapPath = p;
    this.mapW = Math.max(6, t.HW[0] * 2 * sc);
    this.bannerEl.hidden = true; this.warn.hidden = true; this.hint.hidden = true;
  }
  banner(text, sub = '', ms = 1400, cls = '') {
    const b = this.bannerEl;
    b.className = 'banner pop ' + cls;
    b.innerHTML = text + (sub ? `<small>${sub}</small>` : '');
    b.hidden = false;
    void b.offsetWidth;
    this.bannerT = ms / 1000;
  }
  update(dt, s) {
    // s: { place, n, lap, laps, time, lapTime, best, item, itemCount, rolling, speed, vmax, wrong, hint, karts:[{x,z,color,me}], fps, labels }
    if (this.bannerT > 0) { this.bannerT -= dt; if (this.bannerT <= 0) this.bannerEl.hidden = true; }
    this.set('pos', this.pos, `${s.place}<sup>${ordinal(s.place).replace(/^\d+/, '')}</sup><small>/${s.n}</small>`, true);
    this.set('lap', this.lap, s.finished ? 'FINISHED' : `LAP ${s.lap}/${s.laps}`);
    this.set('time', this.time, fmtTime(Math.max(0, s.time) * 1000));
    this.set('laptime', this.laptime, 'Lap ' + fmtTime(Math.max(0, s.lapTime) * 1000));
    this.set('best', this.best, s.best ? 'Best ' + fmtTime(s.best * 1000) : '');
    let it = '';
    if (s.rolling) it = ITEM_SVG[ITEMS[Math.floor(performance.now() / 70) % 4]];
    else if (s.item) it = ITEM_SVG[s.item] + (s.itemCount > 1 ? `<span class="cnt">&times;${s.itemCount}</span>` : '');
    this.set('item', this.item, it, true);
    const kmh = Math.round(Math.abs(s.speed) * 3.6);
    this.set('speed', this.speed, String(kmh));
    this.set('sbar', this.speedbar, Math.min(100, (Math.abs(s.speed) / (s.vmax * 1.3)) * 100).toFixed(0));
    if (this.cache.sbarW !== this.cache.sbar) { this.speedbar.style.width = this.cache.sbar + '%'; this.cache.sbarW = this.cache.sbar; }
    this.warn.hidden = !s.wrong;
    if (s.hint) { this.hint.hidden = false; this.set('hint', this.hint, s.hint); } else this.hint.hidden = true;
    if (s.fps !== undefined) { this.fps.hidden = false; this.set('fps', this.fps, s.fps + ' fps'); } else this.fps.hidden = true;
    this.drawMap(s.karts);
    this.drawLabels(s.labels || []);
  }
  drawMap(karts) {
    const c = this.mctx, W = this.map.width;
    c.clearRect(0, 0, W, W);
    if (!this.mapPath) return;
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = this.mapW + 10; c.stroke(this.mapPath);
    c.strokeStyle = 'rgba(255,255,255,0.92)'; c.lineWidth = this.mapW; c.stroke(this.mapPath);
    const t = this.track;
    const [sx, sz] = this.mapT(t.PX[0], t.PZ[0]);
    c.fillStyle = '#111'; c.beginPath(); c.arc(sx, sz, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(sx, sz, 3, 0, Math.PI * 2); c.fill();
    for (const k of karts) {
      const [x, z] = this.mapT(k.x, k.z);
      c.fillStyle = k.color;
      c.strokeStyle = k.me ? '#fff' : 'rgba(0,0,0,0.7)';
      c.lineWidth = k.me ? 4 : 2;
      c.beginPath(); c.arc(x, z, k.me ? 11 : 8, 0, Math.PI * 2); c.fill(); c.stroke();
    }
  }
  drawLabels(labels) {
    const el = this.names;
    while (el.children.length < labels.length) el.appendChild(document.createElement('span'));
    for (let i = 0; i < el.children.length; i++) {
      const sp = el.children[i];
      const l = labels[i];
      if (!l) { sp.style.display = 'none'; continue; }
      sp.style.display = '';
      if (sp.textContent !== l.text) sp.textContent = l.text;
      sp.style.left = l.x + 'px'; sp.style.top = l.y + 'px';
      sp.style.color = l.color;
    }
  }

  // ---------- touch
  setupTouch() {
    const T = this.input.touch;
    const bind = (id, key) => {
      const el = $(id);
      const ids = new Set();
      const on = e => { e.preventDefault(); ids.add(e.pointerId); try { el.setPointerCapture(e.pointerId); } catch {} T[key] = true; el.classList.add('on'); };
      const off = e => { ids.delete(e.pointerId); if (!ids.size) { T[key] = false; el.classList.remove('on'); } };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('lostpointercapture', off);
    };
    bind('t-left', 'left'); bind('t-right', 'right'); bind('t-gas', 'accel'); bind('t-brake', 'brake');
    bind('t-drift', 'drift'); bind('t-item', 'item'); bind('t-back', 'back');
    // slider steering
    const sl = $('t-steer'), knob = sl.querySelector('i');
    let pid = null;
    const move = e => {
      const r = sl.getBoundingClientRect();
      const v = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2 - 34)));
      T.steer = Math.abs(v) < 0.08 ? 0.0001 * Math.sign(v) : v;
      knob.style.transform = `translateX(${v * (r.width / 2 - 34)}px)`;
    };
    sl.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; try { sl.setPointerCapture(pid); } catch {} move(e); });
    sl.addEventListener('pointermove', e => { if (e.pointerId === pid) move(e); });
    const end = e => { if (e.pointerId !== pid) return; pid = null; T.steer = 0; knob.style.transform = ''; };
    sl.addEventListener('pointerup', end); sl.addEventListener('pointercancel', end);
  }
  setSteerMode(mode) {
    const slider = mode === 'slider';
    $('t-steer').hidden = !slider;
    $('t-left').hidden = slider; $('t-right').hidden = slider;
    $('t-back').style.left = slider ? 'calc(var(--safe-l) + 274px)' : '';
  }
  showTouch(on) { this.touchEl.hidden = !on; if (!on) { const T = this.input.touch; for (const k in T) T[k] = typeof T[k] === 'boolean' ? false : 0; } }
}

// Mini-map drawing for track cards
export function drawTrackThumb(canvas, track, theme) {
  const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, theme.skyTop); g.addColorStop(1, theme.ground);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9;
  for (let i = 0; i < track.N; i++) { mnx = Math.min(mnx, track.PX[i]); mxx = Math.max(mxx, track.PX[i]); mnz = Math.min(mnz, track.PZ[i]); mxz = Math.max(mxz, track.PZ[i]); }
  const pad = W * 0.1;
  const sc = Math.min((W - pad * 2) / (mxx - mnx), (H - pad * 2) / (mxz - mnz));
  const ox = (W - (mxx - mnx) * sc) / 2, oz = (H - (mxz - mnz) * sc) / 2;
  const T = (x, z) => [W - (ox + (x - mnx) * sc), H - (oz + (z - mnz) * sc)];
  c.lineJoin = 'round'; c.lineCap = 'round';
  const path = () => { c.beginPath(); for (let i = 0; i <= track.N; i++) { const [a, b] = T(track.PX[i % track.N], track.PZ[i % track.N]); if (i) c.lineTo(a, b); else c.moveTo(a, b); } };
  path(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = Math.max(6, track.HW[0] * 2 * sc + 6); c.stroke();
  path(); c.strokeStyle = theme.road === '#2c2f3c' ? '#9aa0ff' : '#f4f4f4'; c.lineWidth = Math.max(3, track.HW[0] * 2 * sc); c.stroke();
  path(); c.strokeStyle = theme.kerb[0]; c.lineWidth = Math.max(1.5, sc * 2); c.setLineDash([sc * 6, sc * 6]); c.stroke(); c.setLineDash([]);
  const [sx, sz] = T(track.PX[0], track.PZ[0]);
  c.fillStyle = '#111'; c.fillRect(sx - 5, sz - 5, 10, 10); c.fillStyle = '#fff'; c.fillRect(sx - 5, sz - 5, 5, 5); c.fillRect(sx, sz, 5, 5);
}
