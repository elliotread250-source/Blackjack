// Ctrl/Cmd+K command palette: real search over the registry, favourites and real history when empty.
import { GAMES, byId, logo } from './registry.js';
import { favList } from './favourites.js';
import { recentList } from './recent.js';
import { score, highlighter } from './search.js';
import { launch, esc } from './cards.js';
import { setCat } from './library.js';
import { confetti } from './effects.js';

const dlg = () => document.getElementById('palette');
let items = [], sel = 0, opener = null;

function row(g, sub, hl) {
  return { kind: 'game', g, html: `<img src="${logo(g.id)}" alt="" width="36" height="36"><div><p class="pi-name">${hl ? hl(g.name) : esc(g.name)}</p><p class="pi-sub">${esc(sub)}</p></div><span class="pi-go">${g.pending ? 'SOON' : 'PLAY ↵'}</span>` };
}
function build(q) {
  const out = [], hl = highlighter(q);
  if (!q.trim()) {
    const rec = recentList().map(r => byId.get(r.id)).filter(g => g && !g.pending).slice(0, 4);
    const fav = favList().map(id => byId.get(id)).filter(g => g && !g.pending && !rec.includes(g)).slice(0, 4);
    if (rec.length) out.push({ group: 'Recently played' }, ...rec.map(g => row(g, g.genres.join(' · '))));
    if (fav.length) out.push({ group: 'Favourites' }, ...fav.map(g => row(g, g.genres.join(' · '))));
    out.push({ group: 'Browse' }, { kind: 'cmd', label: 'Show multiplayer games', sub: 'online and same-screen', run: () => setCat('multiplayer', { scroll: true }) },
      { kind: 'cmd', label: 'Show puzzle games', sub: 'filter the library', run: () => setCat('puzzle', { scroll: true }) },
      { kind: 'cmd', label: 'Show racing games', sub: 'filter the library', run: () => setCat('racing', { scroll: true }) });
    return out;
  }
  if (/^\/?(ember|ignite)$/i.test(q.trim())) out.push({ group: 'Secret' }, { kind: 'cmd', label: 'Ignite the ember', sub: 'a small celebration', run: () => confetti() });
  const hits = GAMES.map(g => ({ g, s: score(g, q) })).filter(r => r.s > 0).sort((a, b) => b.s - a.s || a.g.shelf - b.g.shelf).slice(0, 12);
  if (hits.length) out.push({ group: `${hits.length} match${hits.length === 1 ? '' : 'es'}` }, ...hits.map(r => row(r.g, r.g.genres.join(' · ') + (r.g.pending ? ' · coming soon' : ''), hl)));
  return out;
}
function draw() {
  const ul = document.getElementById('pal-list'), q = document.getElementById('pal-q').value;
  items = build(q);
  const pick = items.filter(i => i.kind);
  if (sel >= pick.length) sel = Math.max(0, pick.length - 1);
  ul.textContent = '';
  if (!pick.length) { ul.innerHTML = `<li class="pal-empty">No games match “${esc(q.trim())}”. Try “puzzle”, “car” or “multiplayer”.</li>`; return; }
  let n = 0;
  for (const it of items) {
    const li = document.createElement('li');
    if (it.group) { li.className = 'pal-group'; li.textContent = it.group; li.setAttribute('role', 'presentation'); ul.append(li); continue; }
    const i = n++;
    li.className = 'pal-item'; li.id = 'pal-' + i; li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', String(i === sel));
    li.innerHTML = it.kind === 'game' ? it.html : `<span class="pal-prompt" aria-hidden="true">#</span><div><p class="pi-name">${esc(it.label)}</p><p class="pi-sub">${esc(it.sub)}</p></div><span class="pi-go">RUN ↵</span>`;
    li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; mark(); } });
    li.addEventListener('click', () => { sel = i; go(); });
    ul.append(li);
  }
  document.getElementById('pal-q').setAttribute('aria-activedescendant', 'pal-' + sel);
}
function mark() {
  document.querySelectorAll('.pal-item').forEach((li, i) => li.setAttribute('aria-selected', String(i === sel)));
  const cur = document.getElementById('pal-' + sel);
  if (cur) { cur.scrollIntoView({ block: 'nearest' }); document.getElementById('pal-q').setAttribute('aria-activedescendant', cur.id); }
}
function go() {
  const it = items.filter(i => i.kind)[sel];
  if (!it) return;
  if (it.kind === 'game') { if (it.g.pending) return; close(); launch(it.g); }
  else { close(); it.run(); }
}
export function open() {
  const d = dlg(); if (d.open) return;
  opener = document.activeElement;
  sel = 0; document.getElementById('pal-q').value = ''; draw();
  d.showModal(); document.getElementById('pal-q').focus();
}
export function close() { const d = dlg(); if (d.open) d.close(); }

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
  document.addEventListener('keydown', e => {
    if (!(e.key === 'k' || e.key === 'K') || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
    const t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) && t.id !== 'pal-q';
    if (typing) return;                                    // never steal the shortcut from another field
    e.preventDefault(); dlg().open ? close() : open();
  });
}
