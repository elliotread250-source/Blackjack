import { logo, thumb, FEATURE_LABELS } from './registry.js';
import { plays, playsState, countPlay, fmtPlays } from './plays.js';
import { statusOf, paint } from './status.js';
import { isFav, toggleFav } from './favourites.js';
import { recordLaunch } from './recent.js';
import { MOTIFS } from './motifs.js';

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5 C5 15.6 3 12 4.3 8.6 C5.6 5.4 9.6 4.9 12 7.6 C14.4 4.9 18.4 5.4 19.7 8.6 C21 12 19 15.6 12 20.5Z"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

// A launch = one play count + one history entry. Wired to click (incl. keyboard Enter) and middle click.
export function wireLaunch(a, g) {
  const go = () => { countPlay(g.id); recordLaunch(g.id); };
  a.addEventListener('click', go);
  a.addEventListener('auxclick', e => { if (e.button === 1) go(); });
}
// navigation goes through one function so tests can observe it (window.__oaNavigate) without leaving
export function launch(g) { countPlay(g.id); recordLaunch(g.id); (window.__oaNavigate || (u => location.assign(u)))(g.url); }

export function img(src, alt, cls, w, h, lazy = true) {
  const i = document.createElement('img');
  i.className = cls; i.src = src; i.alt = alt; i.width = w; i.height = h; i.decoding = 'async';
  if (lazy) i.loading = 'lazy';
  i.addEventListener('error', () => {
    const fb = document.createElement('div'); fb.className = 'img-fallback'; fb.setAttribute('role', 'img'); fb.setAttribute('aria-label', alt || 'Artwork unavailable');
    fb.textContent = 'OPEN ARCADE'; i.replaceWith(fb);
  }, { once: true });
  return i;
}

export function playsText(g) {
  if (playsState !== 'ok') return '';
  return `▶ <b>${(plays[g.id] || 0).toLocaleString()}</b> ${(plays[g.id] || 0) === 1 ? 'play' : 'plays'}`;
}

export function favButton(g) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'fav'; b.innerHTML = HEART; b.dataset.fav = g.id;
  const sync = () => { const on = isFav(g.id); b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', `${on ? 'Remove' : 'Add'} ${g.name} ${on ? 'from' : 'to'} favourites`); };
  sync();
  b.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();       // never launches the game
    toggleFav(g.id); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  });
  b._sync = sync;
  return b;
}

export function card(g, { highlight } = {}) {
  const el = document.createElement('article');
  el.className = 'card' + (g.pending ? ' pending' : '');
  el.dataset.id = g.id;
  const name = highlight ? highlight(g.name) : esc(g.name);
  const feats = g.features.filter(f => FEATURE_LABELS[f]).slice(0, 3)
    .map(f => `<li class="feat${f === 'online' ? ' online' : ''}">${FEATURE_LABELS[f]}</li>`).join('');
  el.innerHTML = `
    <div class="card-media">
      <span class="kind-tag">${g.kind === 'tool' ? 'Tool' : 'Game'}</span>
      <span class="status"><i></i><span></span></span>
      ${MOTIFS[g.id] && !g.pending ? `<div class="motif" aria-hidden="true">${MOTIFS[g.id]}</div>` : ''}
    </div>
    <div class="card-body">
      <div class="card-head">
        <div class="card-titles">
          <h3>${g.pending ? name : `<a class="card-link" href="${esc(g.url)}">${name}</a>`}</h3>
          <p class="genres">${g.genres.map(esc).join(' · ')}</p>
        </div>
      </div>
      <p class="blurb">${highlight ? highlight(g.blurb) : esc(g.blurb)}</p>
      <div class="card-foot">
        <ul class="features" aria-label="Features">${feats}</ul>
        ${g.pending ? '<span class="soon-note">Not live yet</span>' : `<span class="plays" data-plays>${playsText(g)}</span><span class="play-go" aria-hidden="true">Play ${ARROW}</span>`}
      </div>
    </div>`;
  const media = el.querySelector('.card-media');
  media.prepend(img(thumb(g.id), `${g.name} artwork`, 'card-thumb', 640, 360));
  el.querySelector('.card-head').prepend(img(logo(g.id), '', 'card-logo', 46, 46));
  el.querySelector('.card-head').append(favButton(g));
  paint(el.querySelector('.status'), statusOf(g));
  const a = el.querySelector('.card-link');
  if (a) wireLaunch(a, g);
  tilt(el);
  return el;
}

// restrained pointer tilt (desktop, full motion only); resets exactly on leave
function tilt(el) {
  if (matchMedia('(hover: none)').matches) return;
  el.addEventListener('pointermove', e => {
    if (document.documentElement.dataset.anim !== 'full') return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    el.style.setProperty('--ty', (x * 5).toFixed(2) + 'deg'); el.style.setProperty('--tx', (-y * 4).toFixed(2) + 'deg');
  });
  el.addEventListener('pointerleave', () => { el.style.removeProperty('--tx'); el.style.removeProperty('--ty'); });
}

export function refreshCard(el, g) {
  const p = el.querySelector('[data-plays]'); if (p) p.innerHTML = playsText(g);
  const s = el.querySelector('.status'); if (s) paint(s, statusOf(g));
  const f = el.querySelector('.fav'); if (f && f._sync) f._sync();
}
