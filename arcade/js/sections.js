import { GAMES, byId, logo, thumb, FEATURE_LABELS } from './registry.js';
import { plays, playsState, fmtPlays, onPlays } from './plays.js';
import { favList, onFavs } from './favourites.js';
import { recentList, clearRecent, onRecent, ago } from './recent.js';
import { card, esc, img, wireLaunch, refreshCard } from './cards.js';
import { onStatus } from './status.js';

const $ = id => document.getElementById(id);
const POINTS = {
  'crossy-road': ['Endless hopping', '100 daily missions', 'Accounts & leaderboard'],
  'nosy-neighbour': ['Five stealth levels', 'A learning AI', 'Tram & Fear rooms'],
  'apex-gp': ['Ten teams, three circuits', 'Online grid with friends'],
  'blockforge': ['Endless voxel world', 'Day, night and caves'],
};

// ---- featured: one cinematic headliner + supporting panels, all real Play links
export function renderFeatured() {
  const grid = $('featured-grid');
  const list = GAMES.filter(g => g.featured && !g.pending).sort((a, b) => a.featured - b.featured).slice(0, 4);
  grid.textContent = '';
  list.forEach((g, i) => {
    const a = document.createElement('a');
    a.className = 'feature' + (i === 0 ? ' main' : '');
    a.href = g.url; a.dataset.reveal = ''; a.style.setProperty('--delay', i * 80 + 'ms');
    a.setAttribute('aria-label', `Play ${g.name}`);
    a.innerHTML = `
      ${i === 0 ? '<svg class="f-trace" preserveAspectRatio="none" aria-hidden="true"><rect x="1" y="1" rx="25"/></svg>' : ''}
      <div class="f-body">
        <div class="f-meta"></div>
        <p class="f-kicker">${i === 0 ? '// headliner' : '// also tonight'} · ${g.genres.map(esc).join(' · ')}</p>
        <h3>${esc(g.name)}</h3>
        <p class="f-desc">${esc(g.blurb)}</p>
        ${i === 0 ? `<ul class="f-points">${(POINTS[g.id] || g.features.map(f => FEATURE_LABELS[f]).filter(Boolean)).map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
        <span class="btn btn-primary f-cta">Play ${esc(g.name)} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </div>`;
    a.prepend(img(thumb(g.id), '', 'f-art', 1280, 720, i > 0));
    a.querySelector('.f-meta').append(img(logo(g.id), '', 'f-logo', 64, 64, false));
    if (i === 0) a.querySelector('.f-body').prepend(a.querySelector('.f-logo'));
    wireLaunch(a, g);
    // gentle parallax on the art
    a.addEventListener('pointermove', e => {
      if (document.documentElement.dataset.anim !== 'full') return;
      const r = a.getBoundingClientRect();
      a.style.setProperty('--fx', ((e.clientX - r.left) / r.width - .5).toFixed(3)); a.style.setProperty('--fy', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    });
    a.addEventListener('pointerleave', () => { a.style.removeProperty('--fx'); a.style.removeProperty('--fy'); });
    grid.append(a);
  });
}

// ---- most played: real counts only
export function renderPopular() {
  const ol = $('popular-list'), note = $('popular-note');
  if (playsState === 'loading') { ol.innerHTML = '<li class="skeleton"></li>'.repeat(5); return; }
  if (playsState === 'failed') { ol.innerHTML = '<li class="note">Play counts are unavailable right now. Every game still works — scroll down to the library.</li>'; note.textContent = ''; return; }
  const top = GAMES.filter(g => !g.pending && (plays[g.id] || 0) > 0).sort((a, b) => plays[b.id] - plays[a.id] || a.shelf - b.shelf).slice(0, 5);
  note.textContent = 'Counted from real launches on this site.';
  if (!top.length) { ol.innerHTML = '<li class="note">Nothing has been played yet. Be the first — pick anything below.</li>'; return; }
  ol.textContent = '';
  top.forEach((g, i) => {
    const li = document.createElement('li'); li.className = 'rank'; li.dataset.reveal = ''; li.style.setProperty('--delay', i * 60 + 'ms');
    li.innerHTML = `<a href="${esc(g.url)}"><div class="r-body"><span class="r-n">${i + 1}</span><div><p class="r-name">${esc(g.name)}</p><p class="r-plays">${fmtPlays(plays[g.id])}</p></div></div></a>`;
    li.querySelector('a').prepend(img(thumb(g.id), `${g.name} artwork`, 'r-art', 640, 360));
    wireLaunch(li.querySelector('a'), g);
    ol.append(li);
  });
  revealNow(ol);
}

// ---- recently played (only shown when there is real history)
export function renderRecent() {
  const sec = $('recent'), ol = $('recent-list');
  const list = recentList().filter(r => byId.has(r.id) && !byId.get(r.id).pending);
  sec.hidden = !list.length;
  ol.textContent = '';
  for (const r of list) {
    const g = byId.get(r.id), li = document.createElement('li');
    li.innerHTML = `<a href="${esc(g.url)}"><div><p class="sn">${esc(g.name)}</p><p class="st">launched ${ago(r.t)}</p></div></a>`;
    li.querySelector('a').prepend(img(logo(g.id), '', '', 48, 48));
    wireLaunch(li.querySelector('a'), g);
    ol.append(li);
  }
}

// ---- favourites
export function renderFavourites() {
  const grid = $('fav-grid'), empty = $('fav-empty');
  const list = favList().map(id => byId.get(id)).filter(Boolean);
  empty.hidden = !!list.length;
  grid.textContent = '';
  for (const g of list) grid.append(card(g));
}

function revealNow(root) { requestAnimationFrame(() => root.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('in'))); }

export function initSections() {
  renderFeatured(); renderPopular(); renderRecent(); renderFavourites();
  onPlays(renderPopular); onRecent(renderRecent); onFavs(renderFavourites);
  onStatus(() => document.querySelectorAll('#fav-grid .card').forEach(el => refreshCard(el, byId.get(el.dataset.id))));
  onPlays(() => document.querySelectorAll('#fav-grid .card').forEach(el => refreshCard(el, byId.get(el.dataset.id))));
  $('recent-clear').addEventListener('click', () => { clearRecent(); });
  // keep the footer category links useful
  const foot = $('foot-cats');
  for (const [k, label] of [['racing', 'Racing'], ['puzzle', 'Puzzle'], ['multiplayer', 'Multiplayer'], ['classic', 'Classics'], ['tool', 'Tools']])
    foot.insertAdjacentHTML('beforeend', `<li><a href="#library" data-cat="${k}">${label}</a></li>`);
}
