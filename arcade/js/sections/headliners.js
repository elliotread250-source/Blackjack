// Tonight's headliners: a cinematic carousel of the registry's `featured` games. Ken Burns art, a diagonal ember
// wipe between slides, the name splitting and re-forming, real features/status/plays only. Auto-advances every 7 s
// (paused on hover, focus, off-screen, in Reduced/Off and by the pause button); arrows, swipe and pips.
import { GAMES, thumb, logo, FEATURE_LABELS, esc } from '../registry.js';
import { plays, playsState, onPlays } from '../plays.js';
import { statusOf, paint, onStatus } from '../status.js';
import { favButton } from '../components/card.js';
import { wireLaunch } from '../components/launch.js';
import { splitText } from '../motion/text.js';
import { isFull, whenVisible } from '../motion/engine.js';

const $ = id => document.getElementById(id);
const MS = 7000;
let list = [], idx = 0, timer = 0, paused = false, hover = false, visible = false, slides = [];

function slide(g, i) {
  const el = document.createElement('div');
  el.className = 'hl-slide'; el.id = 'hl-' + i;
  el.setAttribute('role', 'group'); el.setAttribute('aria-roledescription', 'slide'); el.setAttribute('aria-label', `${i + 1} of ${list.length}: ${g.name}`);
  const feats = g.features.filter(f => FEATURE_LABELS[f]).map(f => `<span class="tag${f === 'online' ? ' hot' : ''}">${FEATURE_LABELS[f]}</span>`).join('');
  el.innerHTML = `
    <div class="hl-art"><img src="${thumb(g.id)}" alt="" width="1280" height="720" ${i ? 'loading="lazy"' : ''} decoding="async"></div>
    <div class="hl-content">
      <div class="hl-kicker"><img src="${logo(g.id)}" alt="" width="56" height="56"><p class="overline">// headliner ${String(i + 1).padStart(2, '0')} · ${g.genres.map(esc).join(' · ')}</p></div>
      <h3 class="hl-name">${esc(g.name)}</h3>
      <p class="hl-blurb">${esc(g.blurb)}</p>
      <div class="hl-meta"><span class="status"><i></i><span></span></span>${g.genres.map(x => `<span class="tag">${esc(x)}</span>`).join('')}${feats}<span class="tag plays" data-plays></span></div>
      <div class="hl-actions"><a class="btn btn-primary btn-xl" href="${esc(g.url)}"><svg aria-hidden="true"><use href="#i-play"/></svg><span>Play ${esc(g.name)}</span></a></div>
    </div>`;
  splitText(el.querySelector('.hl-name'));
  el.querySelector('.hl-actions').append(favButton(g));
  wireLaunch(el.querySelector('.hl-actions a'), g, () => el.querySelector('.hl-art'));
  return el;
}
function refresh() {
  slides.forEach((el, i) => {
    const g = list[i];
    paint(el.querySelector('.status'), statusOf(g));
    const p = el.querySelector('[data-plays]'), n = plays[g.id] || 0;
    p.hidden = playsState !== 'ok'; p.textContent = `▶ ${n.toLocaleString()} ${n === 1 ? 'play' : 'plays'}`;
  });
}
function go(n, dir = 1, announce = true) {
  if (!slides.length) return;
  const prev = slides[idx]; idx = (n + list.length) % list.length; const cur = slides[idx];
  if (prev !== cur) {
    slides.forEach(s => s.classList.remove('out', 'enter', 'back'));
    prev.classList.remove('on'); prev.classList.add('out'); setTimeout(() => prev.classList.remove('out'), 950);
    cur.classList.add('on', 'enter'); if (dir < 0) cur.classList.add('back');
    setTimeout(() => cur.classList.remove('enter', 'back'), 950);
  } else cur.classList.add('on');
  document.querySelectorAll('.hl-pip').forEach((p, i) => { p.setAttribute('aria-selected', String(i === idx)); p.tabIndex = i === idx ? 0 : -1; const b = p.querySelector('i'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; });
  if (announce) $('hl-live').textContent = `Headliner ${idx + 1} of ${list.length}: ${list[idx].name}`;
  peeks(); schedule();
}
function peeks() {
  const box = $('headliners');
  box.querySelectorAll('.hl-peek').forEach(p => p.remove());
  if (list.length < 2) return;
  for (const [cls, k, lbl] of [['prev', -1, 'Previous'], ['next', 1, 'Next']]) {
    const g = list[(idx + k + list.length) % list.length], b = document.createElement('button');
    b.type = 'button'; b.className = 'hl-peek ' + cls; b.setAttribute('aria-label', `${lbl}: ${g.name}`);
    b.innerHTML = `<img src="${thumb(g.id)}" alt="" width="320" height="180" loading="lazy">`;
    b.addEventListener('click', () => go(idx + k, k));
    box.append(b);
  }
}
const running = () => isFull() && !paused && !hover && visible && !document.hidden;
function schedule() { clearTimeout(timer); if (running()) timer = setTimeout(() => go(idx + 1, 1, false), MS); }

export function initHeadliners() {
  list = GAMES.filter(g => g.featured && !g.pending).sort((a, b) => a.featured - b.featured);
  const stage = $('hl-stage'), box = $('headliners');
  box.style.setProperty('--hl-ms', MS + 'ms');
  stage.textContent = '';
  slides = list.map(slide); slides.forEach(s => stage.append(s));
  const pips = $('hl-pips');
  list.forEach((g, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hl-pip'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', g.name); b.setAttribute('aria-controls', 'hl-' + i);
    b.innerHTML = '<i></i>'; b.addEventListener('click', () => go(i, i > idx ? 1 : -1));
    pips.append(b);
  });
  pips.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(idx + (e.key === 'ArrowRight' ? 1 : -1), e.key === 'ArrowRight' ? 1 : -1); pips.children[idx].focus(); } });
  $('hl-next').addEventListener('click', () => go(idx + 1, 1));
  $('hl-prev').addEventListener('click', () => go(idx - 1, -1));
  const pb = $('hl-pause');
  const setPaused = p => { paused = p; box.classList.toggle('paused', p); pb.setAttribute('aria-pressed', String(p)); pb.setAttribute('aria-label', p ? 'Play the carousel' : 'Pause the carousel'); pb.querySelector('use').setAttribute('href', p ? '#i-play' : '#i-pause'); schedule(); };
  pb.addEventListener('click', () => setPaused(!paused));
  if (!isFull()) setPaused(true);
  box.addEventListener('pointerenter', () => { hover = true; box.classList.add('paused'); schedule(); });
  box.addEventListener('pointerleave', () => { hover = false; box.classList.toggle('paused', paused); schedule(); });
  box.addEventListener('focusin', () => { hover = true; box.classList.add('paused'); schedule(); });
  box.addEventListener('focusout', () => { hover = false; box.classList.toggle('paused', paused); schedule(); });
  whenVisible(box, () => { visible = true; schedule(); }, () => { visible = false; schedule(); }, '0px');
  document.addEventListener('visibilitychange', schedule);
  // swipe
  let sx = null;
  stage.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') sx = e.clientX; });
  stage.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
  go(0, 1, false); refresh();
  onPlays(refresh); onStatus(refresh);
}
