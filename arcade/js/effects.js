// One ambient canvas loop for the whole page: a faded graphite grid, a few orange signal nodes travelling
// along grid lines, sparse slow embers and a handful of faint code fragments. Capped particle counts,
// lower frame rate on small screens, paused when the tab is hidden or effects/animation are off.
const FRAGS = ['<play/>', '{ score++ }', '// insert coin', 'while(alive)', 'fn hop()', '0x1UP', 'ready();', '[ ]', '=> next'];
let ctx, W = 0, H = 0, dpr = 1, nodes = [], embers = [], frags = [], raf = 0, last = 0, running = false, gridImg = null;
const root = document.documentElement;
const level = () => root.dataset.anim;

function layout() {
  const c = document.getElementById('ambient'); if (!c) return;
  dpr = Math.min(1.5, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  if (W < 2 || H < 2) { ctx = null; return; }           // hidden or not laid out yet: try again on resize
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const small = W < 700, G = small ? 44 : 56;
  // the grid is drawn once into an offscreen canvas (faded towards the corners)
  gridImg = document.createElement('canvas'); gridImg.width = c.width; gridImg.height = c.height;
  const g = gridImg.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.strokeStyle = 'rgba(120,140,165,.075)'; g.lineWidth = 1; g.beginPath();
  for (let x = (W % G) / 2; x < W; x += G) { g.moveTo(x + .5, 0); g.lineTo(x + .5, H); }
  for (let y = 0; y < H; y += G) { g.moveTo(0, y + .5); g.lineTo(W, y + .5); }
  g.stroke();
  const fade = g.createRadialGradient(W * .55, H * .35, 0, W * .55, H * .35, Math.max(W, H) * .75);
  fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(8,11,16,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 0, W, H);
  const n = small ? 3 : 6, e = small ? 14 : 34;
  nodes = Array.from({ length: n }, () => node(G));
  embers = Array.from({ length: e }, () => ember(true));
  frags = small ? [] : Array.from({ length: 5 }, (_, i) => ({ t: FRAGS[(i * 3) % FRAGS.length], x: Math.random() * W, y: H * (.15 + i * .17), v: 4 + Math.random() * 5, a: .05 + Math.random() * .05 }));
}
function node(G) {
  const horiz = Math.random() < .5;
  return { G, horiz, p: Math.random() * (horiz ? W : H), line: Math.floor(Math.random() * ((horiz ? H : W) / G)) * G + (horiz ? 0 : (W % G) / 2), v: (30 + Math.random() * 50) * (Math.random() < .5 ? -1 : 1), life: 3 + Math.random() * 5 };
}
function ember(any) { return { x: Math.random() * W, y: any ? Math.random() * H : H + 10, r: .6 + Math.random() * 1.6, vy: 6 + Math.random() * 14, vx: -3 + Math.random() * 6, a: .15 + Math.random() * .45, ph: Math.random() * 6.28 }; }

function frame(t) {
  raf = 0;
  if (!running) return;
  const small = W < 700, minDt = small ? 1000 / 30 : 1000 / 50;
  if (t - last < minDt) { raf = requestAnimationFrame(frame); return; }
  const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
  draw(dt, t / 1000);
  raf = requestAnimationFrame(frame);
}
function draw(dt, time) {
  if (!ctx || !gridImg || !gridImg.width) return;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(gridImg, 0, 0, W, H);
  // signal nodes with a short tail
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]; n.p += n.v * dt; n.life -= dt;
    if (n.life < 0 || n.p < -40 || n.p > (n.horiz ? W : H) + 40) { nodes[i] = node(n.G); continue; }
    const x = n.horiz ? n.p : n.line, y = n.horiz ? n.line : n.p, tx = n.horiz ? -Math.sign(n.v) * 46 : 0, ty = n.horiz ? 0 : -Math.sign(n.v) * 46;
    const gr = ctx.createLinearGradient(x + tx, y + ty, x, y); gr.addColorStop(0, 'rgba(255,117,24,0)'); gr.addColorStop(1, 'rgba(255,140,50,.55)');
    ctx.strokeStyle = gr; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + tx, y + ty); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,170,90,.9)'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 6.283); ctx.fill();
  }
  // embers drifting up
  for (let i = 0; i < embers.length; i++) {
    const e = embers[i]; e.y -= e.vy * dt; e.x += (e.vx + Math.sin(time + e.ph) * 4) * dt;
    if (e.y < -10) { embers[i] = ember(false); continue; }
    const fl = .7 + .3 * Math.sin(time * 2 + e.ph);
    ctx.fillStyle = `rgba(255,${130 + (e.r * 30 | 0)},60,${(e.a * fl).toFixed(3)})`; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.283); ctx.fill();
  }
  // faint code fragments in the negative space
  ctx.font = '12px "JetBrains Mono", monospace';
  for (const f of frags) { f.x += f.v * dt; if (f.x > W + 100) f.x = -120; ctx.fillStyle = `rgba(255,150,80,${f.a})`; ctx.fillText(f.t, f.x, f.y); }
}
function update() {
  const want = root.dataset.bg !== 'off' && level() === 'full' && !document.hidden;
  if (!ctx) layout();
  if (!ctx) return;
  if (want && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  else if (!want && running) { running = false; cancelAnimationFrame(raf); raf = 0; }
  if (!want && root.dataset.bg !== 'off') draw(0, 0);            // reduced/off: one still frame
}

// hero pointer parallax (fine pointer + full motion only)
function parallax() {
  const scene = document.getElementById('scene'); if (!scene) return;
  const hero = document.querySelector('.hero');
  let raf2 = 0, px = 0, py = 0;
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || level() !== 'full') return;
    px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5;
    if (!raf2) raf2 = requestAnimationFrame(() => { raf2 = 0; scene.style.setProperty('--px', px.toFixed(3)); scene.style.setProperty('--py', py.toFixed(3)); });
  });
  hero.addEventListener('pointerleave', () => { scene.style.setProperty('--px', 0); scene.style.setProperty('--py', 0); });
}

// reveal sections as they scroll in (content is visible without JS: .js gates the hidden state)
function reveals() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  const watch = () => document.querySelectorAll('.reveal:not(.in), [data-reveal]:not(.in)').forEach(el => io.observe(el));
  watch(); new MutationObserver(watch).observe(document.querySelector('main'), { childList: true, subtree: true });
}

// easter egg: a short burst of orange pixel confetti (skipped when motion is reduced/off)
export function confetti() {
  if (level() !== 'full') { toast('// ember ignited'); return; }
  const c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.append(c);
  const g = c.getContext('2d'), cols = ['#ff7518', '#ffb347', '#ffd08a', '#ff8c32', '#f2f5fa'];
  const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight * .4, vx: (Math.random() - .5) * 900, vy: -200 - Math.random() * 700, s: 3 + Math.random() * 5, c: cols[Math.random() * 5 | 0] }));
  let t0 = performance.now();
  const step = t => {
    const dt = Math.min(.04, (t - t0) / 1000); t0 = t; g.clearRect(0, 0, c.width, c.height);
    let alive = false;
    for (const p of ps) { p.vy += 1200 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y < c.height + 10) alive = true; g.fillStyle = p.c; g.fillRect(p.x | 0, p.y | 0, p.s, p.s); }
    if (alive) requestAnimationFrame(step); else c.remove();
  };
  requestAnimationFrame(step);
  toast('// ember ignited');
}
export function toast(msg) {
  const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 2600);
}

export function initEffects() {
  layout(); update(); parallax(); reveals();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); update(); if (!running && root.dataset.bg !== 'off') draw(0, 0); }, 200); });
  document.addEventListener('visibilitychange', update);
}
export { update as updateEffects };
