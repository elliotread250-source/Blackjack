// Your favourites: an ordered grid saved in this browser. Reorder by dragging the grip (mouse or touch: the card
// lifts, neighbours make room) or by keyboard (focus a card, Space to pick up, arrows to move, Space to drop, Esc to
// cancel), with screen-reader announcements.
import { byId } from '../registry.js';
import { favList, onFavs, setFavOrder } from '../favourites.js';
import { onStatus } from '../status.js';
import { onPlays } from '../plays.js';
import { card, refreshCard } from '../components/card.js';
import { flip } from '../motion/flip.js';
import { unlock } from '../profile.js';

const $ = id => document.getElementById(id);
const say = t => { $('fav-live').textContent = ''; setTimeout(() => { $('fav-live').textContent = t; }, 30); };
const items = () => [...$('fav-grid').children];
const nameOf = li => byId.get(li.dataset.id)?.name || '';
let picked = null, origin = null, moving = false;

function render() {
  const grid = $('fav-grid'), list = favList().map(id => byId.get(id)).filter(Boolean);
  if (list.length >= 5) unlock('curator');
  if (items().map(li => li.dataset.id).join() === list.map(g => g.id).join()) { items().forEach(li => refreshCard(li.firstElementChild, byId.get(li.dataset.id))); return; }
  $('fav-empty').hidden = !!list.length;
  flip(() => items(), () => {
    const old = new Map(items().map(li => [li.dataset.id, li]));
    grid.textContent = '';
    list.forEach(g => {
      let li = old.get(g.id);
      if (!li) {
        li = document.createElement('li'); li.dataset.id = g.id;
        li.append(card(g));
        const grip = document.createElement('button');
        grip.type = 'button'; grip.className = 'grip'; grip.textContent = '⋮⋮'; grip.tabIndex = -1; grip.setAttribute('aria-hidden', 'true');
        li.append(grip); dragging(li, grip);
      }
      grid.append(li);
    });
  }, { enter: el => el.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.18,1.25,.4,1)' }) });
}
const commit = () => setFavOrder(items().map(li => li.dataset.id));

// ---- pointer drag
function dragging(li, grip) {
  let x0, y0, l0, t0, moved;
  grip.addEventListener('pointerdown', e => {
    e.preventDefault(); grip.setPointerCapture(e.pointerId);
    x0 = e.clientX; y0 = e.clientY; l0 = li.offsetLeft; t0 = li.offsetTop; moved = false;
    li.classList.add('lifted');
  });
  grip.addEventListener('pointermove', e => {
    if (!li.classList.contains('lifted')) return;
    moved = true;
    const cx = e.clientX, cy = e.clientY;
    const over = items().find(o => { if (o === li) return false; const r = o.getBoundingClientRect(); return cx > r.left && cx < r.right && cy > r.top && cy < r.bottom; });
    if (over) {
      const list = items(), from = list.indexOf(li), to = list.indexOf(over);
      flip(() => items().filter(o => o !== li), () => { if (from < to) over.after(li); else over.before(li); }, { duration: 260 });
    }
    li.style.transform = `translate(${l0 + (cx - x0) - li.offsetLeft}px, ${t0 + (cy - y0) - li.offsetTop}px)`;
  });
  const drop = () => {
    if (!li.classList.contains('lifted')) return;
    const from = li.style.transform; li.classList.remove('lifted'); li.style.transform = '';
    if (from) li.animate([{ transform: from }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.18,1.25,.4,1)' });
    if (moved) { commit(); say(`${nameOf(li)} moved to position ${items().indexOf(li) + 1} of ${items().length}.`); }
  };
  grip.addEventListener('pointerup', drop); grip.addEventListener('pointercancel', drop);
}

// ---- keyboard: Space picks up / drops, arrows move, Esc cancels
function keyboard() {
  const grid = $('fav-grid');
  grid.addEventListener('keydown', e => {
    const li = e.target.closest('#fav-grid > li'); if (!li || !e.target.matches('.gc-link')) return;
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (picked === li) { li.classList.remove('picked'); picked = null; commit(); say(`Dropped ${nameOf(li)} at position ${items().indexOf(li) + 1} of ${items().length}.`); }
      else { if (picked) picked.classList.remove('picked'); picked = li; origin = items().map(x => x.dataset.id); li.classList.add('picked');
        say(`Picked up ${nameOf(li)}, position ${items().indexOf(li) + 1} of ${items().length}. Use the arrow keys to move, Space to drop, Escape to cancel.`); }
      return;
    }
    if (e.key === 'Escape' && picked) {
      e.preventDefault(); picked.classList.remove('picked');
      const map = new Map(items().map(x => [x.dataset.id, x])); grid.textContent = ''; origin.forEach(id => grid.append(map.get(id)));
      say(`Cancelled. ${nameOf(picked)} is back at position ${origin.indexOf(picked.dataset.id) + 1}.`); picked.querySelector('.gc-link').focus(); picked = null;
      return;
    }
    if (picked !== li || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    const list = items(), i = list.indexOf(li), cols = Math.max(1, Math.round(grid.clientWidth / li.offsetWidth));
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.key], j = Math.max(0, Math.min(list.length - 1, i + step));
    if (j === i) return;
    moving = true;
    flip(() => items(), () => { if (j > i) list[j].after(li); else list[j].before(li); }, { duration: 260 });
    li.querySelector('.gc-link').focus(); moving = false;
    say(`${nameOf(li)}, position ${j + 1} of ${list.length}.`);
  });
  grid.addEventListener('focusout', e => { if (picked && !moving && !grid.contains(e.relatedTarget)) { picked.classList.remove('picked'); commit(); picked = null; } });
}

export function initFavourites() {
  render(); keyboard();
  onFavs(render);
  const refresh = () => items().forEach(li => refreshCard(li.firstElementChild, byId.get(li.dataset.id)));
  onStatus(refresh); onPlays(refresh);
}
