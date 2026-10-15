// Command palette (Ctrl/Cmd+K or /): real search over the registry with thumbnails, genres and status dots; fuzzy
// fallback on names (matched letters highlighted); commands; a glowing selection bar; "NO SIGNAL" when empty.
import { GAMES, byId, logo, thumb, esc } from './registry.js';
import { favList } from './favourites.js';
import { recentList } from './recent.js';
import { score, highlighter } from './search.js';
import { statusOf } from './status.js';
import { launch } from './components/launch.js';
import { setCat } from './sections/library.js';
import { confettiBurst } from './motion/particles.js';
import { apply } from './settings.js';
import { unlock } from './profile.js';
import { openSlot } from './components/slot.js';
import { toast } from './components/toast.js';

const dlg = () => document.getElementById('palette');
let items = [], sel = 0, opener = null;
let openSettings = () => {};
export const setSettingsOpener = fn => { openSettings = fn; };

const norm = s => s.toLowerCase();
function fuzzy(name, q) {                                  // subsequence match, returns highlighted html or null
  const n = norm(name), t = norm(q).replace(/\s+/g, ''); if (t.length < 3) return null;
  let j = 0; const hit = [];
  for (let i = 0; i < n.length && j < t.length; i++) if (n[i] === t[j]) { hit.push(i); j++; }
  if (j < t.length) return null;
  return [...name].map((c, i) => hit.includes(i) ? `<mark>${esc(c)}</mark>` : esc(c)).join('');
}
const COMMANDS = [
  ['Random game', 'spin the slot machine', 'shuffle', () => openSlot()],
  ['Toggle sounds', 'UI sounds on or off', 'volume', () => { const on = document.documentElement.dataset.sound !== 'on'; apply('sound', on ? 'on' : 'off'); toast(`UI sounds ${on ? 'on' : 'off'}`, { icon: on ? 'volume' : 'mute' }); }],
  ['Toggle CRT', 'scanlines on the hero', 'crt', () => { const on = document.documentElement.dataset.crt !== 'on'; apply('crt', on ? 'on' : 'off'); toast(`CRT overlay ${on ? 'on' : 'off'}`, { icon: 'crt' }); }],
  ['Go to favourites', 'your saved games', 'heart', () => document.getElementById('favourites').scrollIntoView({ behavior: 'smooth' })],
  ['Open settings', 'animations, effects, sounds', 'settings', () => openSettings(true)],
  ['Show multiplayer games', 'online and same-screen', 'users', () => setCat('multiplayer', { scroll: true, push: true })],
  ['Show puzzle games', 'filter the library', 'grid', () => setCat('puzzle', { scroll: true, push: true })],
  ['Show racing games', 'filter the library', 'controller', () => setCat('racing', { scroll: true, push: true })],
  ['Keyboard shortcuts', 'the control panel', 'keyboard', () => document.querySelector('[data-open-keys]')?.click()],
];
const cmd = ([label, sub, icon, run]) => ({ kind: 'cmd', label, sub, icon, run });
function row(g, nameHTML) {
  const st = statusOf(g);
  return { kind: 'game', g, html: `<img class="pi-thumb" src="${thumb(g.id)}" alt="" width="64" height="36"><div><p class="pi-name">${nameHTML || esc(g.name)}</p>
    <p class="pi-sub"><span class="pi-dot" data-state="${st}" title="${st}"></span>${esc(g.genres.join(' · '))}${g.pending ? ' · coming soon' : ''}</p></div><span class="pi-go">${g.pending ? 'SOON' : 'PLAY ↵'}</span>` };
}
function build(q) {
  const out = [], hl = highlighter(q), t = q.trim();
  if (!t) {
    const rec = recentList().map(r => byId.get(r.id)).filter(g => g && !g.pending).slice(0, 4);
    const fav = favList().map(id => byId.get(id)).filter(g => g && !g.pending && !rec.includes(g)).slice(0, 4);
    if (rec.length) out.push({ group: 'Recently played' }, ...rec.map(g => row(g)));
    if (fav.length) out.push({ group: 'Favourites' }, ...fav.map(g => row(g)));
    out.push({ group: 'Commands' }, ...COMMANDS.map(cmd));
    return out;
  }
  if (/^\/?(ember|ignite)$/i.test(t)) out.push({ group: 'Secret' }, { kind: 'cmd', label: 'Ignite the ember', sub: 'a small celebration', icon: 'fire', run: () => { confettiBurst(innerWidth / 2, innerHeight * .4); toast('// ember ignited', { icon: 'fire' }); } });
  if (/^\/?(konami|cheat|up up down down)$/i.test(t)) out.push({ group: 'Secret' }, { kind: 'cmd', label: '↑ ↑ ↓ ↓ ← → ← → B A', sub: 'type it anywhere on the page', icon: 'keyboard', run: () => toast('Try it outside a text field ↑↑↓↓←→←→BA', { icon: 'keyboard' }) });
  if (/^\/?insert coin$/i.test(t)) out.push({ group: 'Secret' }, { kind: 'cmd', label: 'Insert coin', sub: 'clink', icon: 'coin', run: () => window.__oaCoin && window.__oaCoin() });
  const cmds = COMMANDS.filter(c => norm(c[0]).includes(norm(t)) || norm(c[1]).includes(norm(t)));
  let hits = GAMES.map(g => ({ g, s: score(g, q), h: null })).filter(r => r.s > 0).sort((a, b) => b.s - a.s || a.g.shelf - b.g.shelf);
  if (!hits.length) hits = GAMES.map(g => ({ g, h: fuzzy(g.name, t) })).filter(r => r.h);
  hits = hits.slice(0, 12);
  if (hits.length) out.push({ group: `${hits.length} match${hits.length === 1 ? '' : 'es'}` }, ...hits.map(r => row(r.g, r.h || (hl ? hl(r.g.name) : null))));
  if (cmds.length) out.push({ group: 'Commands' }, ...cmds.map(cmd));
  return out;
}
function draw() {
  const ul = document.getElementById('pal-list'), q = document.getElementById('pal-q').value;
  items = build(q);
  const pick = items.filter(i => i.kind);
  if (sel >= pick.length) sel = Math.max(0, pick.length - 1);
  ul.textContent = '';
  if (!pick.length) { ul.innerHTML = `<li class="pal-empty"><b class="glitch go" data-text="NO SIGNAL">NO SIGNAL</b>No games match “${esc(q.trim())}”. Try “puzzle”, “car” or “multiplayer”.</li>`; mark(); return; }
  let n = 0;
  for (const it of items) {
    const li = document.createElement('li');
    if (it.group) { li.className = 'pal-group'; li.textContent = it.group; li.setAttribute('role', 'presentation'); ul.append(li); continue; }
    const i = n++;
    li.className = 'pal-item'; li.id = 'pal-' + i; li.setAttribute('role', 'option'); li.style.setProperty('--i', i);
    li.setAttribute('aria-selected', String(i === sel));
    li.innerHTML = it.kind === 'game' ? it.html : `<span class="cmd-ic" aria-hidden="true"><svg><use href="#i-${it.icon || 'arrow'}"/></svg></span><div><p class="pi-name">${esc(it.label)}</p><p class="pi-sub">${esc(it.sub)}</p></div><span class="pi-go">RUN ↵</span>`;
    li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; mark(); } });
    li.addEventListener('click', () => { sel = i; go(); });
    ul.append(li);
  }
  mark(true);
}
function mark(instant) {
  document.querySelectorAll('.pal-item').forEach((li, i) => li.setAttribute('aria-selected', String(i === sel)));
  const cur = document.getElementById('pal-' + sel), bar = document.querySelector('.pal-sel'), q = document.getElementById('pal-q');
  if (!cur) { bar.classList.remove('on'); q.removeAttribute('aria-activedescendant'); return; }
  bar.classList.add('on');
  if (instant) bar.style.transition = 'none';
  bar.style.transform = `translateY(${cur.offsetTop}px)`; bar.style.height = cur.offsetHeight + 'px';
  if (instant) requestAnimationFrame(() => { bar.style.transition = ''; });
  cur.scrollIntoView({ block: 'nearest' }); q.setAttribute('aria-activedescendant', cur.id);
}
function go() {
  const it = items.filter(i => i.kind)[sel];
  if (!it) return;
  if (it.kind === 'game') { if (it.g.pending) return; close(); launch(it.g); }
  else { close(); setTimeout(it.run, 60); }
}
export function open() {
  const d = dlg(); if (d.open) return;
  opener = document.activeElement;
  sel = 0; document.getElementById('pal-q').value = '';
  d.showModal(); draw(); document.getElementById('pal-q').focus();
  unlock('speed-reader');
}
export function close() { const d = dlg(); if (d.open) d.close(); }
const typing = t => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function initPalette() {
  const d = dlg(), q = document.getElementById('pal-q');
  q.addEventListener('input', () => { sel = 0; draw(); });
  q.addEventListener('keydown', e => {
    const n = items.filter(i => i.kind).length;
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, n); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + n) % Math.max(1, n); mark(); }
    else if (e.key === 'Enter') { e.preventDefault(); go(); }
    else if (e.key === 'Tab') e.preventDefault();          // focus stays in the palette
  });
  d.addEventListener('click', e => { if (e.target === d) close(); });
  d.addEventListener('close', () => { if (opener && opener.focus) opener.focus(); });
  document.querySelectorAll('[data-open-palette]').forEach(b => b.addEventListener('click', open));
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll('.st-kbd').forEach(k => { k.textContent = mac ? '⌘ K' : 'Ctrl K'; });
  document.querySelector('.search-trigger').setAttribute('aria-label', `Search games (${mac ? 'Cmd' : 'Ctrl'}+K)`);
  document.addEventListener('keydown', e => {
    const kk = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey;
    const slash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey;
    if (!kk && !slash) return;
    if (typing(e.target) && e.target.id !== 'pal-q') return;   // never steal keys from another field
    if (slash && (d.open || document.querySelector('dialog[open]'))) return;
    e.preventDefault(); d.open ? close() : open();
  });
}
