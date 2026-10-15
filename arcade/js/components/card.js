// The game card: one builder, five variants (standard, compact, cabinet, list, mini). The whole card is a real
// link to the game (middle-click and new tabs work); favourite and details are separate buttons above it.
import { logo, thumb, moment, FEATURE_LABELS, esc } from '../registry.js';
import { plays, playsState } from '../plays.js';
import { statusOf, paint } from '../status.js';
import { isFav, toggleFav } from '../favourites.js';
import { wireLaunch } from './launch.js';
import { tilt } from '../motion/pointer.js';
import { isFull } from '../motion/engine.js';
import { burst, centerOf } from '../motion/particles.js';
import { play } from '../motion/sound.js';
import { toast } from './toast.js';

let openSheet = () => {};
export const setSheetOpener = fn => { openSheet = fn; };

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
export function playsHTML(g) {
  if (playsState !== 'ok') return '';
  const n = plays[g.id] || 0;
  return `▶ <b>${n.toLocaleString()}</b> ${n === 1 ? 'play' : 'plays'}`;
}

export function favButton(g, { small } = {}) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'fav'; b.dataset.fav = g.id;
  b.innerHTML = '<svg aria-hidden="true"><use href="#i-heart"/></svg>';
  const sync = () => { const on = isFav(g.id); b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', `${on ? 'Remove' : 'Add'} ${g.name} ${on ? 'from' : 'to'} favourites`); };
  sync();
  b.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();       // never launches the game
    const on = toggleFav(g.id);
    b.classList.remove('pop', 'pfff'); void b.offsetWidth; b.classList.add(on ? 'pop' : 'pfff');
    if (on) { const [x, y] = centerOf(b); burst(x, y, { count: 12, shape: 'heart', power: .55, gravity: 300 }); burst(x, y, { count: 8, power: .4 }); play('pop'); }
    else play('pfff');
    toast(on ? `Added ${g.name} to favourites` : `Removed ${g.name} from favourites`, { icon: 'heart', action: 'Undo', onAction: () => toggleFav(g.id) });
  });
  b._sync = sync;
  if (small) b.classList.add('small');
  return b;
}

export function card(g, { variant = 'standard', highlight, featured = false, lazy = true } = {}) {
  const el = document.createElement(variant === 'mini' ? 'div' : 'article');
  el.className = `gcard v-${variant}${g.pending ? ' pending' : ''}${featured ? ' featured' : ''}`;
  el.dataset.id = g.id;
  if (g.accent) el.style.setProperty('--accent', g.accent);
  const name = highlight ? highlight(g.name) : esc(g.name);
  const feats = g.features.filter(f => FEATURE_LABELS[f]).slice(0, 3).map((f, i) => `<li class="${f === 'online' ? 'online' : ''}" style="--i:${i}">${FEATURE_LABELS[f]}</li>`).join('');
  el.innerHTML = `
    <div class="gc-tilt">
      <div class="gc-media">
        <span class="gc-scan"></span><span class="gc-glare"></span>
        <span class="status"><i></i><span></span></span>
        ${g.kind === 'tool' ? '<span class="gc-kind">Tool</span>' : ''}
        ${g.pending ? '<div class="gc-soon"><svg aria-hidden="true"><use href="#i-lock"/></svg>COMING SOON</div>' : '<div class="gc-tape" aria-hidden="true"><b>OUT OF ORDER</b></div>'}
        ${g.pending || variant === 'mini' ? '' : '<div class="gc-ticker" aria-hidden="true"><span>PRESS START ▶ PRESS START ▶ PRESS START ▶ </span></div>'}
        ${variant === 'mini' ? '' : '<div class="gc-actions"></div>'}
      </div>
      <div class="gc-body">
        <div class="gc-head">
          <div><h3>${g.pending ? `<span class="gc-link">${name}</span>` : `<a class="gc-link" href="${esc(g.url)}">${name}</a>`}</h3>
          <p class="gc-genres">${g.genres.map(esc).join(' · ')}</p></div>
        </div>
        <p class="gc-blurb">${highlight ? highlight(g.blurb) : esc(g.blurb)}</p>
        ${feats ? `<ul class="gc-chips" aria-label="Features">${feats}</ul>` : ''}
        <div class="gc-foot">
          ${g.pending ? '<span class="gc-plays">Not live yet</span>' : `<span class="gc-plays" data-plays>${playsHTML(g)}</span><span class="gc-play" aria-hidden="true"><svg><use href="#i-play"/></svg>Play</span>`}
        </div>
      </div>
      <span class="gc-edge" aria-hidden="true"></span>
    </div>`;
  const media = el.querySelector('.gc-media');
  media.prepend(img(thumb(g.id), `${g.name} artwork`, 'gc-thumb', 640, 360, lazy));
  el.querySelector('.gc-head').prepend(img(logo(g.id), '', 'gc-logo', 44, 44, lazy));
  const actions = el.querySelector('.gc-actions');
  if (actions) {
    actions.append(favButton(g));
    const info = document.createElement('button');
    info.type = 'button'; info.className = 'gc-info'; info.setAttribute('aria-label', `Details for ${g.name}`);
    info.innerHTML = '<svg aria-hidden="true"><use href="#i-info"/></svg>';
    info.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openSheet(g, el); });
    actions.append(info);
  }
  paintStatus(el, g);
  const a = el.querySelector('a.gc-link');
  if (a) wireLaunch(a, g, () => el.querySelector('.gc-media'));
  // the game's own hover moment: loaded on first hover/focus only
  const loadMoment = () => {
    if (el._m || g.pending || !isFull()) return;
    el._m = 1; media.insertBefore(img(moment(g.id), '', 'gc-moment', 640, 360, false), media.children[1]);
  };
  el.addEventListener('pointerenter', loadMoment); el.addEventListener('focusin', loadMoment);
  el.addEventListener('pointerenter', () => play('blip'));
  if (variant !== 'mini' && variant !== 'list') tilt(el, { max: 8, onMove: (x, y) => { el.style.setProperty('--px', (x - .5).toFixed(3)); el.style.setProperty('--py', (y - .5).toFixed(3)); } });
  return el;
}

function paintStatus(el, g) {
  const s = statusOf(g);
  paint(el.querySelector('.status'), s);
  el.classList.toggle('is-down', s === 'down');
}
export function refreshCard(el, g) {
  const p = el.querySelector('[data-plays]'); if (p) p.innerHTML = playsHTML(g);
  paintStatus(el, g);
  const f = el.querySelector('.fav'); if (f && f._sync) f._sync();
}

export function skeletonCard(variant = 'standard') {
  const el = document.createElement('div');
  el.className = `gcard skel v-${variant}`; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="gc-tilt"><div class="gc-media"></div><div class="gc-body"><span class="sk-line h20"></span><span class="sk-line w90"></span><span class="sk-line w60"></span></div></div>';
  return el;
}
