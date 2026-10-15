import { GAMES, CATEGORIES, byId } from './registry.js';
import { plays, playsState, onPlays } from './plays.js';
import { isFav, onFavs } from './favourites.js';
import { onStatus } from './status.js';
import { card, refreshCard } from './cards.js';
import { score, highlighter } from './search.js';
import { get, set } from './store.js';

const $ = id => document.getElementById(id);
const st = Object.assign({ cat: 'all', sort: 'plays', q: '' }, get('oa.library', {}));
if (!CATEGORIES.some(([k]) => k === st.cat)) st.cat = 'all';
if (!['plays', 'az', 'shelf'].includes(st.sort)) st.sort = 'plays';
st.q = '';
const els = new Map();       // id -> card element (reused across renders so FLIP can animate them)

function inCat(g, cat) {
  if (cat === 'all') return true;
  if (cat === 'favourites') return isFav(g.id);
  if (cat === 'tool') return g.kind === 'tool';
  return g.categories.includes(cat);
}
function results() {
  let list = GAMES.filter(g => inCat(g, st.cat)).map(g => ({ g, s: score(g, st.q) })).filter(r => r.s > 0);
  const tie = (a, b) => a.g.shelf - b.g.shelf;
  if (st.q.trim()) list.sort((a, b) => b.s - a.s || (plays[b.g.id] || 0) - (plays[a.g.id] || 0) || tie(a, b));
  else if (st.sort === 'az') list.sort((a, b) => a.g.name.localeCompare(b.g.name, undefined, { numeric: true }) || tie(a, b));
  else if (st.sort === 'plays' && playsState === 'ok') list.sort((a, b) => (plays[b.g.id] || 0) - (plays[a.g.id] || 0) || tie(a, b));
  else list.sort(tie);
  // pending entries sit at the end so live games come first
  list.sort((a, b) => (!!a.g.pending) - (!!b.g.pending));
  return list.map(r => r.g);
}

function renderChips() {
  const box = $('chips'); box.textContent = '';
  for (const [k, label] of CATEGORIES) {
    const n = GAMES.filter(g => inCat(g, k)).length;
    if (!n && k !== 'favourites' && k !== 'all') continue;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.cat = k;
    b.innerHTML = `${label}<span class="n">${n}</span>`;
    b.setAttribute('aria-pressed', String(st.cat === k));
    b.addEventListener('click', () => setCat(k));
    box.append(b);
  }
}
export function setCat(k, { scroll } = {}) {
  st.cat = k; save();
  for (const b of document.querySelectorAll('.chip')) b.setAttribute('aria-pressed', String(b.dataset.cat === k));
  const active = document.querySelector(`.chip[data-cat="${k}"]`);
  if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  render({ animate: true });
  if (scroll) $('library').scrollIntoView({ behavior: document.documentElement.dataset.anim === 'off' ? 'auto' : 'smooth' });
}
function save() { set('oa.library', { cat: st.cat, sort: st.sort }); }

// animate only when the user changed something (search, chip, sort); data arriving re-sorts quietly
export function render({ animate = false } = {}) {
  const grid = $('lib-grid'), list = results(), hl = highlighter(st.q);
  const anim = animate && document.documentElement.dataset.anim === 'full';
  const first = new Map();
  if (anim) for (const [id, el] of els) if (el.isConnected) first.set(id, el.getBoundingClientRect());
  const frag = document.createDocumentFragment();
  for (const g of list) {
    let el = els.get(g.id);
    if (!el || el._hl !== st.q) { el = card(g, { highlight: hl }); el._hl = st.q; els.set(g.id, el); }
    else refreshCard(el, g);
    frag.append(el);
  }
  grid.textContent = ''; grid.append(frag);
  // FLIP: slide cards that stayed, fade in the new ones
  if (anim) for (const g of list) {
    const el = els.get(g.id), a = first.get(g.id);
    if (!a) { el.classList.remove('entering'); void el.offsetWidth; el.classList.add('entering'); continue; }
    const b = el.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
    if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  const live = list.filter(g => !g.pending).length;
  $('lib-count').textContent = `${live} ${live === 1 ? 'title' : 'titles'}${list.length > live ? ` + ${list.length - live} coming soon` : ''}` +
    (st.q.trim() ? ` for “${st.q.trim()}”` : '') + (st.sort === 'plays' && !st.q.trim() ? (playsState === 'ok' ? ' · most played first' : playsState === 'failed' ? ' · counts unavailable, shelf order' : '') : '');
  $('lib-empty').hidden = !!list.length;
  $('lib-empty-q').textContent = st.q.trim() ? `“${st.q.trim()}”` : 'these filters';
  if (!list.length && st.cat === 'favourites' && !st.q.trim()) $('lib-empty-q').textContent = 'yet — your favourites list is empty';
}

export function initLibrary() {
  renderChips();
  const q = $('lib-search'), sort = $('lib-sort');
  sort.value = st.sort;
  let t;
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { st.q = q.value; render({ animate: true }); }, 70); });
  q.addEventListener('keydown', e => { if (e.key === 'Escape' && q.value) { q.value = ''; st.q = ''; render({ animate: true }); } });
  sort.addEventListener('change', () => { st.sort = sort.value; save(); render({ animate: true }); });
  $('lib-reset').addEventListener('click', () => { q.value = ''; st.q = ''; setCat('all'); q.focus(); });
  onPlays(() => { if (st.sort === 'plays') render(); else for (const [id, el] of els) refreshCard(el, byId.get(id)); });
  onStatus(() => { for (const [id, el] of els) refreshCard(el, byId.get(id)); });
  onFavs(() => { for (const [id, el] of els) refreshCard(el, byId.get(id)); renderChips(); if (st.cat === 'favourites') render(); });
  document.addEventListener('click', e => { const a = e.target.closest('[data-cat]'); if (a && !a.classList.contains('chip')) { e.preventDefault(); setCat(a.dataset.cat, { scroll: true }); } });
  render();
}
