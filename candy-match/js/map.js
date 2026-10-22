// map.js: the level map. A tall scrolling world, level 1 at the bottom, a winding path of
// 40 nodes climbing up through four candy lands. Nodes are real buttons (big touch targets).
import { isUnlocked, highestUnlocked } from './store.js';

const STAR = 'M12 2l3 7 7.5.6-5.7 4.9 1.8 7.4L12 17.8 5.4 21.9l1.8-7.4L1.5 9.6 9 9z';
export const WORLDS = ['Sugar Meadow', 'Gumdrop Hills', 'Licorice Lagoon', 'Choco Peaks'];
const SPACING = 104, PAD_TOP = 150, PAD_BOT = 120;

const svgEl = (tag, attrs, parent) => {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
function rng(seed) { let a = seed; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function nodePos(n, w, count) {
  const y = PAD_TOP + (count - n) * SPACING;
  const x = w * (0.5 + 0.3 * Math.sin((n - 1) * 0.82 + 0.4));
  return [x, y];
}

export function renderMap(host, { levels, prog, onPick }) {
  const count = levels.length;
  const w = Math.min(host.clientWidth || 390, 520);
  const h = PAD_TOP + (count - 1) * SPACING + PAD_BOT;
  host.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'mapinner';
  inner.style.cssText = `width:${w}px;height:${h}px`;
  host.appendChild(inner);

  const svg = svgEl('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true' }, inner);
  svg.classList.add('mapsvg');
  const defs = svgEl('defs', {}, svg);
  // four lands, bottom to top
  const bands = [['#c8f5c4', '#fff0c8'], ['#ffd9ee', '#e6d4ff'], ['#bfe6ff', '#d6f3ff'], ['#e9d3bd', '#c9a487']];
  const bandH = h / 4;
  bands.forEach((b, k) => {
    const id = 'bg' + k;
    const g = svgEl('linearGradient', { id, x1: 0, y1: 1, x2: 0, y2: 0 }, defs);
    svgEl('stop', { offset: 0, 'stop-color': b[0] }, g); svgEl('stop', { offset: 1, 'stop-color': b[1] }, g);
    svgEl('rect', { x: 0, y: h - (k + 1) * bandH - 1, width: w, height: bandH + 2, fill: `url(#${id})` }, svg);
  });
  // scenery
  const R = rng(7);
  const deco = svgEl('g', { opacity: 0.9 }, svg);
  for (let k = 0; k < 46; k++) {
    const y = R() * h, side = R() < 0.5 ? 0.06 : 0.94, x = w * (side + (R() - 0.5) * 0.14);
    const land = Math.min(3, Math.floor((h - y) / bandH));
    const pal = [['#ff7ab8', '#ffd23f', '#7be0ff'], ['#c07bff', '#ff9ad0', '#ffffff'], ['#59b8ff', '#ffffff', '#9dffe0'], ['#7a4a2a', '#b07848', '#ffe6cc']][land];
    const c1 = pal[(R() * 3) | 0], kind = R();
    if (kind < 0.4) { // lollipop
      svgEl('rect', { x: x - 2, y, width: 4, height: 34, rx: 2, fill: '#fff', opacity: 0.9 }, deco);
      svgEl('circle', { cx: x, cy: y, r: 13, fill: c1 }, deco);
      svgEl('circle', { cx: x, cy: y, r: 7, fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 0.8 }, deco);
    } else if (kind < 0.75) { // gumdrop
      svgEl('path', { d: `M${x - 13} ${y + 10} Q${x - 13} ${y - 14} ${x} ${y - 14} Q${x + 13} ${y - 14} ${x + 13} ${y + 10} Z`, fill: c1 }, deco);
      svgEl('ellipse', { cx: x - 4, cy: y - 5, rx: 4, ry: 2.5, fill: '#fff', opacity: 0.6 }, deco);
    } else { // cloud
      for (const [dx, dy, r] of [[-12, 4, 9], [0, -3, 12], [13, 4, 9]]) svgEl('circle', { cx: x + dx, cy: y + dy, r, fill: '#fff', opacity: 0.7 }, deco);
    }
  }
  // land titles
  WORLDS.forEach((name, k) => {
    const y = h - k * bandH - 36;
    const t = svgEl('text', { x: w / 2, y, 'text-anchor': 'middle', class: 'landname' }, svg);
    t.textContent = name;
  });
  // path
  const pts = levels.map(l => nodePos(l.n, w, count));
  const reach = highestUnlocked(prog, count);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], my = (y0 + y1) / 2;
    d += ` C${x0} ${my} ${x1} ${my} ${x1} ${y1}`;
  }
  svgEl('path', { d, fill: 'none', stroke: 'rgba(60,20,90,.22)', 'stroke-width': 22, 'stroke-linecap': 'round', transform: 'translate(0 4)' }, svg);
  svgEl('path', { d, fill: 'none', stroke: '#fffaf0', 'stroke-width': 18, 'stroke-linecap': 'round' }, svg);
  svgEl('path', { d, fill: 'none', stroke: 'rgba(255,120,190,.65)', 'stroke-width': 4, 'stroke-dasharray': '2 11', 'stroke-linecap': 'round' }, svg);

  let currentBtn = null;
  levels.forEach((lv, k) => {
    const [x, y] = pts[k];
    const unlocked = isUnlocked(prog, lv.n), stars = prog.stars[lv.n] | 0;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'node' + (unlocked ? '' : ' locked') + (stars ? ' done' : '') + (lv.n === reach && !stars ? ' current' : '');
    b.style.left = x + 'px'; b.style.top = y + 'px';
    b.dataset.level = lv.n;
    b.setAttribute('aria-label', unlocked ? `Level ${lv.n}, ${stars} of 3 stars` : `Level ${lv.n}, locked`);
    b.innerHTML = unlocked
      ? `<span class="num">${lv.n}</span><span class="nstars">${[0, 1, 2].map(i => `<svg viewBox="0 0 24 24" class="${i < stars ? 'on' : ''}"><path d="${STAR}"/></svg>`).join('')}</span>`
      : `<svg class="lock" viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0 1 10 0v2h1.5A1.5 1.5 0 0 1 20 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-8A1.5 1.5 0 0 1 5.5 10zm2 0h6V8a3 3 0 0 0-6 0z"/></svg><span class="num small">${lv.n}</span>`;
    b.addEventListener('click', () => onPick(lv.n, b));
    inner.appendChild(b);
    if (b.classList.contains('current')) currentBtn = b;
    if (!currentBtn && lv.n === reach) currentBtn = b;
  });
  return { scrollToCurrent(smooth) {
    const target = currentBtn || inner.querySelector('.node');
    if (!target) return;
    const y = parseFloat(target.style.top);
    host.scrollTo({ top: Math.max(0, y - host.clientHeight * 0.55), behavior: smooth ? 'smooth' : 'auto' });
  } };
}
