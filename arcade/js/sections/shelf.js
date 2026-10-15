// The shelf: a pinned section where vertical scroll walks a row of every cabinet past the camera with depth
// parallax, a live counter and the current name in huge outlined type. On phones / reduced motion it is a swipe row.
import { live, byId } from '../registry.js';
import { card, refreshCard } from '../components/card.js';
import { pin } from '../motion/scroll.js';
import { isFull, finePointer } from '../motion/engine.js';
import { onStatus } from '../status.js';
import { onPlays } from '../plays.js';

export function initShelf() {
  const sec = document.getElementById('shelf'), track = document.getElementById('shelf-track'), ghost = document.getElementById('shelf-ghost'), num = document.getElementById('shelf-n');
  const games = live();
  games.forEach((g, i) => { const d = document.createElement('div'); d.className = 'shelf-item'; d.dataset.i = i; d.append(card(g, { variant: 'cabinet' })); track.append(d); });
  const items = [...track.children];
  const pinned = () => isFull() && finePointer && innerWidth > 860;
  const size = () => {
    if (!pinned()) { sec.style.removeProperty('--shelf-h'); track.style.transform = ''; return; }
    const extra = track.scrollWidth - innerWidth;
    sec.style.setProperty('--shelf-h', `${Math.max(innerHeight * 1.2, innerHeight + extra / 1.8)}px`);   // 1 px of scroll walks 1.8 px of floor
  };
  size(); addEventListener('resize', size);
  let last = -1;
  pin(sec, p => {
    if (!pinned()) return;
    const extra = track.scrollWidth - innerWidth;
    track.style.transform = `translate3d(${(-p * extra).toFixed(1)}px,0,0)`;
    const centre = innerWidth / 2;
    let best = 0, bd = Infinity;
    items.forEach((it, i) => {
      const r = it.getBoundingClientRect(), c = r.left + r.width / 2, d = (c - centre) / innerWidth;
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; }
      it.style.setProperty('--sy', (Math.abs(d) * 60).toFixed(1) + 'px');              // depth: near the centre rises
      it.style.setProperty('--ss', (1 - Math.min(.14, Math.abs(d) * .18)).toFixed(3));
    });
    if (best !== last) { last = best; num.textContent = String(best + 1).padStart(2, '0'); ghost.textContent = games[best].name; }
  });
  // phone / reduced: the counter follows the swipe position
  track.addEventListener('scroll', () => {
    if (pinned()) return;
    const w = items[0].getBoundingClientRect().width + 28, i = Math.round(track.scrollLeft / w);
    num.textContent = String(Math.min(games.length, i + 1)).padStart(2, '0');
  }, { passive: true });
  const refresh = () => track.querySelectorAll('.gcard').forEach(el => refreshCard(el, byId.get(el.dataset.id)));
  onStatus(refresh); onPlays(refresh);
}
