// Game detail sheet: a right-side panel on desktop, a bottom sheet on phones. Opens from a card's details button
// (thumbnail morphs in via the View Transitions API where supported), deep-linkable as #game/{id}, works with
// back/forward, closes on Esc, scrim click and swipe down, traps focus (native modal dialog) and returns it.
import { GAMES, byId, thumb, logo, moment, FEATURE_LABELS, FEATURE_EXPLAIN, CAT_LABEL, esc } from '../registry.js';
import { plays, playsState } from '../plays.js';
import { statusOf, paint } from '../status.js';
import { launchesOf } from '../profile.js';
import { favButton, card, setSheetOpener } from './card.js';
import { wireLaunch } from './launch.js';
import { toast } from './toast.js';
import { isFull } from '../motion/engine.js';
import { onRoute, openGameHash, closeGameHash } from '../router.js';

const $ = id => document.getElementById(id);
let returnTo = null, current = null;
const STATUS_WORDS = { up: 'Online', down: 'Not responding', checking: 'Checking', unknown: 'Unknown', soon: 'Coming soon' };

function fill(g) {
  const box = $('sheet-box'), mine = launchesOf(g.id), st = statusOf(g);
  const n = plays[g.id] || 0;
  const more = GAMES.filter(x => x.id !== g.id && !x.pending && x.categories.some(c => g.categories.includes(c) && c !== 'multiplayer'))
    .sort((a, b) => b.categories.filter(c => g.categories.includes(c)).length - a.categories.filter(c => g.categories.includes(c)).length || a.shelf - b.shelf).slice(0, 4);
  box.innerHTML = `
    <div class="sh-art"><img src="${thumb(g.id)}" alt="${esc(g.name)} artwork" width="640" height="360">${g.pending ? '' : `<img class="sh-moment" src="${moment(g.id)}" alt="" width="640" height="360">`}</div>
    <button class="icon-btn sh-close" type="button" aria-label="Close details"><svg aria-hidden="true"><use href="#i-close"/></svg></button>
    <div class="sh-body">
      <div class="sh-title"><img src="${logo(g.id)}" alt="" width="72" height="72"><div><h2 id="sheet-title">${esc(g.name)}</h2><p>${esc(g.genres.join(' · '))}</p></div></div>
      <p class="sh-blurb">${esc(g.blurb)}</p>
      <div class="sh-actions">
        ${g.pending ? '<span class="btn btn-ghost" aria-disabled="true"><svg aria-hidden="true"><use href="#i-lock"/></svg><span>Coming soon</span></span>' : `<a class="btn btn-primary btn-xl sh-play" href="${esc(g.url)}"><svg aria-hidden="true"><use href="#i-play"/></svg><span>Play ${esc(g.name)}</span></a>`}
        <button class="btn btn-ghost sh-copy" type="button"><svg aria-hidden="true"><use href="#i-link"/></svg><span>Copy link</span></button>
      </div>
      <dl class="sh-meta">
        <div><dt>Status</dt><dd><span class="status" style="position:static"><i></i><span></span></span></dd></div>
        <div><dt>Plays here</dt><dd>${playsState === 'ok' ? n.toLocaleString() : '—'}</dd></div>
        <div><dt>You've played</dt><dd>${mine ? `${mine} ${mine === 1 ? 'time' : 'times'}` : 'Not yet'}</dd></div>
      </dl>
      ${g.features.length ? `<ul class="sh-feats" aria-label="Features">${g.features.map(f => `<li>${esc(FEATURE_EXPLAIN[f] || FEATURE_LABELS[f] || f)}</li>`).join('')}</ul>` : ''}
      <div class="sh-tags" aria-label="Categories">${g.categories.map(c => `<span>${esc(CAT_LABEL[c] || c)}</span>`).join('')}</div>
      ${more.length ? '<div class="sh-more"><h3>More like this</h3><ul></ul></div>' : ''}
    </div>`;
  paint(box.querySelector('.status'), st);
  box.querySelector('.status span').textContent = STATUS_WORDS[st] || st;
  box.querySelector('.sh-actions').append(favButton(g));
  const playA = box.querySelector('.sh-play'); if (playA) wireLaunch(playA, g, () => box.querySelector('.sh-art'));
  box.querySelector('.sh-close').addEventListener('click', close);
  box.querySelector('.sh-copy').addEventListener('click', async () => {
    const link = `${location.origin}${location.pathname}#game/${g.id}`;
    try { await navigator.clipboard.writeText(link); toast('Link copied', { icon: 'link' }); } catch { toast(link, { icon: 'link', ms: 6000 }); }
  });
  const ul = box.querySelector('.sh-more ul');
  if (ul) more.forEach(x => { const li = document.createElement('li'); const c = card(x, { variant: 'mini' }); c.querySelector('.gc-link')?.addEventListener('click', () => { $('sheet').close(); }); li.append(c); ul.append(li); });
}

function show(g, from) {
  if (!g) return;
  const d = $('sheet');
  current = g;
  if (from) returnTo = from.querySelector('.gc-info') || from;
  const thumbEl = from && from.querySelector('.gc-thumb');
  const doOpen = () => { fill(g); if (!d.open) d.showModal(); d.classList.remove('closing'); d.querySelector('.sh-close').focus({ preventScroll: true }); };
  if (isFull() && document.startViewTransition && thumbEl) {
    thumbEl.style.viewTransitionName = 'game-art';
    document.startViewTransition(() => { thumbEl.style.viewTransitionName = ''; doOpen(); const a = d.querySelector('.sh-art img'); if (a) a.style.viewTransitionName = 'game-art'; })
      .finished.finally(() => { const a = d.querySelector('.sh-art img'); if (a) a.style.viewTransitionName = ''; });
  } else doOpen();
}
export function openSheet(g, from) { show(g, from); openGameHash(g.id); }
function close() {
  const d = $('sheet'); if (!d.open) return;
  if (isFull()) { d.classList.add('closing'); setTimeout(() => { d.close(); d.classList.remove('closing'); }, 260); } else d.close();
}

export function initSheet() {
  const d = $('sheet');
  setSheetOpener(openSheet);
  d.addEventListener('cancel', e => { e.preventDefault(); close(); });
  d.addEventListener('click', e => { if (e.target === d) close(); });
  d.addEventListener('close', () => { closeGameHash(); current = null; if (returnTo && returnTo.isConnected) returnTo.focus({ preventScroll: true }); });
  // swipe down to close (bottom sheet on phones)
  let sy = null, dy = 0;
  const box = $('sheet-box');
  box.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && box.scrollTop <= 0) { sy = e.clientY; dy = 0; } });
  box.addEventListener('pointermove', e => { if (sy === null) return; dy = Math.max(0, e.clientY - sy); box.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (sy === null) return; sy = null; box.style.transform = ''; if (dy > 110) close(); };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
  onRoute('game', id => { const g = byId.get(id); if (g && (!current || current.id !== id)) show(g); });
  onRoute('close', () => { if (d.open) close(); });
}
export const sheetGame = () => current;
