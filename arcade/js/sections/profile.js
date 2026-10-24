// Your arcade: local stats in scoreboard style and badges (flip + shine + embers + toast + sparkle on unlock).
import { byId, CAT_LABEL, esc } from '../registry.js';
import { stats, BADGES, onProfile, onUnlock, resetProfile, hasBadge } from '../profile.js';
import { clearRecent } from '../recent.js';
import { toast } from '../components/toast.js';
import { burst, centerOf } from '../motion/particles.js';
import { play } from '../motion/sound.js';
import { countUp } from '../motion/count.js';
import { whenVisible } from '../motion/engine.js';

const $ = id => document.getElementById(id);
let fresh = new Set(), shown = false;
function favGenre(s) {
  const tally = {};
  for (const [id, n] of Object.entries(s.launches)) { const g = byId.get(id); if (g) for (const c of g.categories) if (c !== 'multiplayer') tally[c] = (tally[c] || 0) + n; }
  const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  return best ? CAT_LABEL[best[0]] || best[0] : '—';
}
function render() {
  const s = stats();
  const rows = [['Games tried', s.tried, 1], ['Launches from this browser', s.total, 1], ['Favourite genre', favGenre(s), 0], ['Current daily streak', s.current, 1], ['Best daily streak', s.best, 1],
    ['First visit', new Date(s.first).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }), 0]];
  $('stats').innerHTML = rows.map(([k, v, num]) => `<div><dt>${k}</dt><dd class="${num ? '' : 'small'}"${num ? ` data-n="${v}"` : ''}>${num ? (shown ? v : 0) : esc(v)}</dd></div>`).join('');
  if (shown) $('stats').querySelectorAll('dd[data-n]').forEach(d => { d.dataset.v = d.dataset.n; });
  const got = BADGES.filter(b => hasBadge(b[0])).length;
  $('badge-count').textContent = `${got} / ${BADGES.length}`;
  $('badges').innerHTML = BADGES.map(([id, name, how, icon]) => {
    const on = hasBadge(id);
    return `<li class="badge${on ? '' : ' locked'}${fresh.has(id) ? ' fresh' : ''}" data-b="${id}"><div class="badge-in">
      <span class="bd-ic" aria-hidden="true"><svg><use href="#i-${on ? icon : 'lock'}"/></svg></span>
      <b>${on ? name : '???'}</b><small>${on ? how : 'Hint: ' + how.toLowerCase()}</small>
      <span class="visually-hidden">${on ? 'Unlocked' : 'Locked'}</span></div></li>`;
  }).join('');
}
export function initProfileSection() {
  render(); onProfile(render);
  whenVisible($('stats'), () => { if (shown) return; shown = true; $('stats').querySelectorAll('dd[data-n]').forEach(d => countUp(d, +d.dataset.n, { duration: 1100 })); }, () => {}, '-10%');
  onUnlock(b => {
    fresh.add(b[0]); render(); setTimeout(() => fresh.delete(b[0]), 2000);
    play('sparkle');
    toast(`Badge unlocked: ${b[1]}`, { icon: 'badge', ms: 4500 });
    const el = document.querySelector(`.badge[data-b="${b[0]}"]`);
    if (el) { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { const [x, y] = centerOf(el); burst(x, y, { count: 30, power: .9 }); } }
  });
  $('reset-data').addEventListener('click', async () => {
    const dlg = $('confirm');
    $('confirm-title').textContent = 'Reset your arcade?'; $('confirm-text').textContent = 'This clears your local stats, badges and play history in this browser. Favourites and settings stay. It cannot be undone.';
    dlg.showModal();
    dlg.addEventListener('close', () => { if (dlg.returnValue === 'yes') { resetProfile(); clearRecent(); toast('Your arcade data was reset', { icon: 'undo' }); } }, { once: true });
  });
}
