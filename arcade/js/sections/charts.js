// The charts: real play counts as an arcade HIGH SCORES board, the top three on a podium. Rank numbers flip like a
// split-flap display; movement since this browser's last visit (▲ ▼ NEW) comes from a locally stored snapshot.
import { live, logo, esc } from '../registry.js';
import { plays, playsState, onPlays } from '../plays.js';
import { wireLaunch } from '../components/launch.js';
import { get, set } from '../store.js';
import { whenVisible, isFull } from '../motion/engine.js';
import { burst } from '../motion/particles.js';

const $ = id => document.getElementById(id);
let base = null, celebrated = false;
function baseline(ranks) {
  if (base) return base;
  try { base = JSON.parse(sessionStorage.getItem('oa.chartsBase') || 'null'); } catch { base = null; }
  if (!base) {
    base = get('oa.charts', null) || { none: true };
    try { sessionStorage.setItem('oa.chartsBase', JSON.stringify(base)); } catch { /* fine */ }
  }
  set('oa.charts', { t: Date.now(), ranks });
  return base;
}
const flaps = (n, i) => String(n).padStart(2, '0').split('').map((d, j) => `<span class="flap" style="--i:${i};--j:${j}">${d}</span>`).join('');

function render() {
  const ol = $('popular-list'), pod = $('podium'), note = $('popular-note');
  if (playsState === 'loading') return;
  if (playsState === 'failed') { pod.textContent = ''; ol.innerHTML = '<li class="hs-note">Play counts are unavailable right now. Every game still works — scroll down to the library.</li>'; note.textContent = ''; return; }
  const top = live().filter(g => (plays[g.id] || 0) > 0).sort((a, b) => plays[b.id] - plays[a.id] || a.shelf - b.shelf).slice(0, 12);
  if (!top.length) { pod.textContent = ''; ol.innerHTML = '<li class="hs-note">Nothing has been played yet. Be the first — pick anything below.</li>'; return; }
  const ranks = Object.fromEntries(top.map((g, i) => [g.id, i + 1]));
  const b = baseline(ranks);
  const move = g => {
    if (b.none || !b.ranks) return '';
    const was = b.ranks[g.id], now = ranks[g.id];
    if (!was) return '<span class="mv new">NEW</span>';
    if (was > now) return `<span class="mv up" title="Up ${was - now} since your last visit">▲${was - now}</span>`;
    if (was < now) return `<span class="mv dn" title="Down ${now - was} since your last visit">▼${now - was}</span>`;
    return '';
  };
  const max = plays[top[0].id];
  pod.textContent = '';
  [1, 0, 2].forEach(k => {
    const g = top[k]; if (!g) return;
    const a = document.createElement('a');
    a.className = `pod p${k + 1}`; a.href = g.url; a.setAttribute('aria-label', `Number ${k + 1}: ${g.name}, ${plays[g.id].toLocaleString()} plays`);
    a.innerHTML = `${k === 0 ? '<span class="crown" aria-hidden="true"></span>' : ''}<img class="pod-art" src="${logo(g.id)}" alt="" width="110" height="110">
      <span class="pod-name">${esc(g.name)}</span><span class="pod-count">${plays[g.id].toLocaleString()}</span><span class="pod-block" aria-hidden="true">${k + 1}</span>`;
    wireLaunch(a, g, () => a.querySelector('img'));
    pod.append(a);
  });
  ol.textContent = '';
  top.slice(3, 12).forEach((g, i) => {
    const li = document.createElement('li'); li.className = 'hs';
    li.innerHTML = `<a href="${esc(g.url)}" style="--i:${i};--share:${(plays[g.id] / max).toFixed(3)}" aria-label="Rank ${i + 4}: ${esc(g.name)}, ${plays[g.id].toLocaleString()} plays">
      <span class="hs-rank" aria-hidden="true">${flaps(i + 4, i)}</span><img src="${logo(g.id)}" alt="" width="40" height="40" loading="lazy">
      <span class="hs-name">${esc(g.name)}</span><span class="hs-score">${move(g)}${plays[g.id].toLocaleString()}</span><span class="hs-bar" aria-hidden="true"></span></a>`;
    wireLaunch(li.querySelector('a'), g, () => li.querySelector('img'));
    ol.append(li);
  });
  if (top.length <= 3) ol.innerHTML = '<li class="hs-note">Only these have been played so far. Every launch counts.</li>';
  // podium movement labels
  pod.querySelectorAll('.pod').forEach(a => { const g = top.find(x => x.url === a.getAttribute('href')); const m = move(g); if (m) a.querySelector('.pod-count').insertAdjacentHTML('beforeend', ' ' + m); });
  note.textContent = 'Counted from real launches on this site' + (b.none ? '.' : ' · ▲▼ since your last visit');
}
export function initCharts() {
  const charts = $('charts');
  render(); onPlays(render);
  whenVisible(charts, () => {
    if (charts.classList.contains('in')) return;
    charts.classList.add('in');
    if (!celebrated && isFull() && playsState === 'ok') {
      celebrated = true;
      setTimeout(() => { const p = charts.querySelector('.pod.p1 .pod-block'); if (!p) return; const r = p.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, { count: 40, up: true, power: 1.1, gravity: 600 }); }, 900);
    }
  }, () => {}, '-15%');
}
