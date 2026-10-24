// The library: terminal search (keeps the substring fixes in search.js), category chips with a sliding pill and live
// counts, sort (most played / A–Z / shelf / recently played by you), four views (grid, compact, cabinet row, list)
// morphing with FLIP, animated filtering, empty state, URL state (#library?cat=&q=&sort=&view=) with back/forward,
// and arrow-key movement between cards.
import { GAMES, CATEGORIES, byId } from '../registry.js';
import { plays, playsState, onPlays } from '../plays.js';
import { isFav, onFavs } from '../favourites.js';
import { recentList } from '../recent.js';
import { onStatus } from '../status.js';
import { card, refreshCard, skeletonCard } from '../components/card.js';
import { score, highlighter } from '../search.js';
import { get, set } from '../store.js';
import { setting } from '../settings.js';
import { flip } from '../motion/flip.js';
import { isFull } from '../motion/engine.js';
import { setLibraryHash, onRoute } from '../router.js';

const $ = id => document.getElementById(id);
const VIEWS = { grid: 'standard', compact: 'compact', cabinet: 'cabinet', list: 'list' };
const SORTS = ['plays', 'az', 'shelf', 'recent'];
const saved = get('oa.library', {}) || {};
// phones default to the two-column compact view unless a view was chosen
const st = { cat: 'all', sort: 'plays', q: '', view: (get('oa.settings', {}) || {}).view || (innerWidth < 600 ? 'compact' : 'grid') };
if (CATEGORIES.some(([k]) => k === saved.cat)) st.cat = saved.cat;
if (SORTS.includes(saved.sort)) st.sort = saved.sort;
if (VIEWS[saved.view]) st.view = saved.view;
const els = new Map();       // id -> card (reused so FLIP can animate them)
let ready = false;

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
  else if (st.sort === 'recent') { const r = recentList().map(x => x.id); const k = id => (r.indexOf(id) + 1) || 999; list.sort((a, b) => k(a.g.id) - k(b.g.id) || tie(a, b)); }
  else list.sort(tie);
  list.sort((a, b) => (!!a.g.pending) - (!!b.g.pending));       // pending entries last
  return list.map(r => r.g);
}

// ---------- chips
function renderChips() {
  const box = $('chips'), pill = box.querySelector('.chip-pill');
  const prevCounts = Object.fromEntries([...box.querySelectorAll('.chip')].map(b => [b.dataset.cat, b.querySelector('.n')?.textContent]));
  box.querySelectorAll('.chip').forEach(b => b.remove());
  for (const [k, label] of CATEGORIES) {
    const n = GAMES.filter(g => inCat(g, k)).length;
    if (!n && k !== 'favourites' && k !== 'all') continue;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.cat = k;
    b.innerHTML = `${label}<span class="n">${n}</span>`;
    if (prevCounts[k] !== undefined && prevCounts[k] !== String(n)) b.querySelector('.n').classList.add('tick');
    b.setAttribute('aria-pressed', String(st.cat === k));
    b.addEventListener('click', () => setCat(k, { push: true }));
    box.append(b);
  }
  box.append(pill);
  movePill();
}
function movePill() {
  const box = $('chips'), pill = box.querySelector('.chip-pill'), b = box.querySelector(`.chip[data-cat="${st.cat}"]`);
  if (!b) { pill.style.opacity = 0; return; }
  pill.style.opacity = 1; pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft}px)`;
}
export function setCat(k, { scroll, push } = {}) {
  st.cat = k; save(push);
  for (const b of document.querySelectorAll('#chips .chip')) b.setAttribute('aria-pressed', String(b.dataset.cat === k));
  movePill();
  const active = document.querySelector(`#chips .chip[data-cat="${k}"]`);
  if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: isFull() ? 'smooth' : 'auto' });
  render({ animate: true });
  if (scroll) $('library').scrollIntoView({ behavior: isFull() ? 'smooth' : 'auto' });
}
function save(push) {
  set('oa.library', { cat: st.cat, sort: st.sort, view: st.view });
  if (ready) setLibraryHash({ cat: st.cat, q: st.q.trim(), sort: st.sort === 'plays' ? '' : st.sort, view: st.view === 'grid' ? '' : st.view }, push);
}

// ---------- render with FLIP: leaving cards shrink away, staying cards glide, entering cards spring in
let pending = 0;
export function render({ animate = false } = {}) {
  const grid = $('lib-grid'), list = results(), hl = highlighter(st.q), variant = VIEWS[st.view];
  const anim = animate && isFull();
  const keep = new Set(list.map(g => g.id));
  const doRender = () => {
    flip(() => [...grid.children], () => {
      const frag = document.createDocumentFragment();
      list.forEach((g, i) => {
        let el = els.get(g.id);
        if (!el || el._hl !== st.q) { el = card(g, { highlight: hl, variant }); el._hl = st.q; els.set(g.id, el); }
        else refreshCard(el, g);
        el.className = el.className.replace(/\bv-\w+/, 'v-' + variant);
        el.classList.remove('leaving');
        el.style.setProperty('--i', Math.min(i, 16));
        frag.append(el);
      });
      grid.textContent = ''; grid.append(frag); grid.dataset.view = st.view;
    }, { enter: el => { el.classList.remove('entering'); void el.offsetWidth; el.classList.add('entering'); setTimeout(() => el.classList.remove('entering'), 900); } });
    status(list);
  };
  clearTimeout(pending);
  const leaving = anim ? [...grid.children].filter(el => !keep.has(el.dataset.id)) : [];
  if (leaving.length) { leaving.forEach(el => el.classList.add('leaving')); pending = setTimeout(doRender, 170); }
  else if (anim) doRender();
  else doRender();
}
function status(list) {
  const live = list.filter(g => !g.pending).length;
  $('lib-count').textContent = `${live} ${live === 1 ? 'title' : 'titles'}${list.length > live ? ` + ${list.length - live} coming soon` : ''}` +
    (st.q.trim() ? ` for “${st.q.trim()}”` : '') + (st.sort === 'plays' && !st.q.trim() ? (playsState === 'ok' ? ' · most played first' : playsState === 'failed' ? ' · counts unavailable, shelf order' : '') : '');
  $('lib-empty').hidden = !!list.length;
  $('lib-empty-q').textContent = st.q.trim() ? `“${st.q.trim()}”` : 'these filters';
  if (!list.length && st.cat === 'favourites' && !st.q.trim()) $('lib-empty-q').textContent = 'yet — your favourites list is empty';
}

function setView(v, push) {
  if (!VIEWS[v]) return;
  st.view = v; save(push);
  document.querySelectorAll('#views button').forEach(b => { const on = b.dataset.view === v; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
  render({ animate: true });
}

// block caret that sits at the end of the typed text
function caret(input) {
  const field = $('search-field'), c = document.createElement('canvas').getContext('2d');
  const place = () => {
    const cs = getComputedStyle(input); c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const w = c.measureText(input.value.slice(0, input.selectionEnd ?? input.value.length)).width;
    field.style.setProperty('--caret', Math.min(input.offsetLeft + w + 2, field.clientWidth - 30) + 'px');
  };
  ['input', 'keyup', 'click', 'focus'].forEach(ev => input.addEventListener(ev, place));
  place(); addEventListener('resize', place);
}

function applyState(p, { scroll } = {}) {
  if (p.cat && CATEGORIES.some(([k]) => k === p.cat)) st.cat = p.cat; else st.cat = 'all';
  st.sort = SORTS.includes(p.sort) ? p.sort : 'plays';
  st.view = VIEWS[p.view] ? p.view : (VIEWS[setting('view')] ? setting('view') : 'grid');
  st.q = p.q || '';
  $('lib-search').value = st.q; $('lib-sort').value = st.sort;
  document.querySelectorAll('#views button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.view === st.view)));
  renderChips(); render({ animate: ready });
  if (scroll) requestAnimationFrame(() => $('library').scrollIntoView({ behavior: 'auto' }));
}

// arrow keys move focus between cards by position; Enter plays (native link), I opens details, F favourites
function arrows(grid) {
  grid.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const cur = e.target.closest('.gcard'); if (!cur || !e.target.matches('.gc-link')) return;
    const r0 = cur.getBoundingClientRect(), dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
    let best = null, bd = Infinity;
    for (const el of grid.children) {
      if (el === cur) continue;
      const r = el.getBoundingClientRect(), dx = (r.left + r.width / 2) - (r0.left + r0.width / 2), dy = (r.top + r.height / 2) - (r0.top + r0.height / 2);
      if ((dir[0] && Math.sign(dx) !== dir[0]) || (dir[1] && Math.sign(dy) !== dir[1])) continue;
      if (dir[0] && Math.abs(dy) > r0.height / 2) continue;
      const d = dir[0] ? Math.abs(dx) + Math.abs(dy) * 3 : Math.abs(dy) + Math.abs(dx) * 3;
      if (d < bd) { bd = d; best = el; }
    }
    if (best) { e.preventDefault(); best.querySelector('.gc-link').focus(); best.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  });
}

export function initLibrary() {
  const grid = $('lib-grid'), q = $('lib-search'), sort = $('lib-sort');
  // skeletons of the final size while the first render is prepared
  for (let i = 0; i < 6; i++) grid.append(skeletonCard());
  renderChips();
  sort.value = st.sort;
  document.querySelectorAll('#views button').forEach(b => { b.setAttribute('aria-checked', String(b.dataset.view === st.view)); b.addEventListener('click', () => setView(b.dataset.view, true)); });
  $('views').addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const ks = Object.keys(VIEWS), i = ks.indexOf(st.view), n = ks[(i + (e.key === 'ArrowRight' ? 1 : -1) + ks.length) % ks.length];
    setView(n, true); document.querySelector(`#views [data-view="${n}"]`).focus(); e.preventDefault();
  });
  let t, scanT;
  const field = $('search-field');
  q.addEventListener('input', () => {
    field.classList.add('scanning'); clearTimeout(scanT); scanT = setTimeout(() => field.classList.remove('scanning'), 500);
    clearTimeout(t); t = setTimeout(() => { st.q = q.value; save(false); render({ animate: true }); }, 90);
  });
  q.addEventListener('keydown', e => { if (e.key === 'Escape' && q.value) { e.stopPropagation(); q.value = ''; st.q = ''; save(false); render({ animate: true }); } });
  caret(q);
  sort.addEventListener('change', () => { st.sort = sort.value; save(true); render({ animate: true }); });
  $('lib-reset').addEventListener('click', () => {
    const empty = $('lib-empty'); if (isFull()) { empty.classList.remove('rewind'); void empty.offsetWidth; empty.classList.add('rewind'); }
    q.value = ''; st.q = ''; setCat('all', { push: true }); q.focus();
  });
  onPlays(() => { if (st.sort === 'plays') render(); else for (const [id, el] of els) refreshCard(el, byId.get(id)); });
  onStatus(() => { for (const [id, el] of els) refreshCard(el, byId.get(id)); });
  onFavs(() => { for (const [id, el] of els) refreshCard(el, byId.get(id)); renderChips(); if (st.cat === 'favourites') render({ animate: true }); });
  document.addEventListener('click', e => { const a = e.target.closest('a[data-cat]'); if (a) { e.preventDefault(); setCat(a.dataset.cat, { scroll: true, push: true }); } });
  addEventListener('resize', movePill);
  arrows(grid);
  onRoute('library', p => applyState(p, { scroll: true }));
  render();
  ready = true;
  document.documentElement.classList.add('app');
}
export const libraryState = () => ({ ...st });
