// Footer: the OPEN ARCADE wordmark ripples as the pointer passes, category links from the registry, and a live
// status line from /api/status ("37 / 38 cabinets online") with a popover naming any that are down.
import { GAMES, CATEGORIES, live, byId, esc } from '../registry.js';
import { state as statusState, onStatus } from '../status.js';
import { isFull, finePointer } from '../motion/engine.js';

const $ = id => document.getElementById(id);
export function initFooter() {
  // wordmark letters lift and scale near the pointer
  const mark = $('foot-mark');
  mark.innerHTML = [...mark.textContent].map(c => `<span class="fm-c">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  const cs = [...mark.children];
  if (finePointer) {
    mark.addEventListener('pointermove', e => {
      if (!isFull()) return;
      for (const c of cs) { const r = c.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)) / 160, k = Math.max(0, 1 - d);
        c.style.setProperty('--lift', (-k * 26).toFixed(1) + 'px'); c.style.setProperty('--sc', (1 + k * .08).toFixed(3)); }
    });
    mark.addEventListener('pointerleave', () => cs.forEach(c => { c.style.removeProperty('--lift'); c.style.removeProperty('--sc'); }));
  }
  // categories (only those with live games)
  const ul = $('foot-cats');
  for (const [k, label] of CATEGORIES) {
    if (['all', 'favourites'].includes(k)) continue;
    const n = GAMES.filter(g => !g.pending && (k === 'tool' ? g.kind === 'tool' : g.categories.includes(k))).length;
    if (n) ul.insertAdjacentHTML('beforeend', `<li><a href="#library" data-cat="${k}">${label} <span class="mono" style="color:var(--faint);margin-left:6px">${n}</span></a></li>`);
  }
  // live status line
  const line = $('foot-status'), pop = $('fs-pop');
  const paint = () => {
    const ids = live().map(g => g.id), known = ids.filter(id => statusState[id] === 'up' || statusState[id] === 'down');
    if (statusState.__failed && !known.length) { line.querySelector('span').textContent = 'Cabinet status unavailable'; line.classList.remove('ok'); return; }
    if (!known.length) return;
    const up = ids.filter(id => statusState[id] === 'up'), down = ids.filter(id => statusState[id] === 'down');
    line.querySelector('span').textContent = `${up.length} / ${ids.length} cabinets online`;
    line.classList.toggle('ok', true);
    pop.innerHTML = down.length ? `Not responding right now: ${down.map(id => esc(byId.get(id).name)).join(', ')}` : 'Every cabinet answered our last check.';
  };
  onStatus(paint); paint();
  line.tabIndex = 0;
  const show = on => { pop.hidden = !on; };
  line.addEventListener('mouseenter', () => show(true)); line.addEventListener('mouseleave', () => show(false));
  line.addEventListener('focus', () => show(true)); line.addEventListener('blur', () => show(false));
}
