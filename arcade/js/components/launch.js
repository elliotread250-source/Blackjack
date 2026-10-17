// Launching a game: one play count (POST /api/play), one history entry, local profile stats, then — for a plain
// left click — the launch transition (art expands, CRT "LOADING" screen) before navigating. Middle/modifier
// clicks still open new tabs normally (they are counted but never intercepted).
import { countPlay } from '../plays.js';
import { recordLaunch } from '../recent.js';
import { recordProfileLaunch } from '../profile.js';
import { live, thumb, esc } from '../registry.js';
import { isFull, isOff, animating } from '../motion/engine.js';
import { play } from '../motion/sound.js';

const TIPS = ['TIP: favourites are saved in this browser', 'TIP: press / to search from anywhere', 'TIP: press R for a random game',
  'TIP: press ? to see every shortcut', 'TIP: the back button brings you straight back here', 'TIP: Reduced motion lives in Settings',
  'TIP: Ctrl/Cmd+K opens the command palette', 'TIP: middle-click a card to open it in a new tab'];
const go = url => (window.__oaNavigate || (u => location.assign(u)))(url);

export function count(g) {
  countPlay(g.id); recordLaunch(g.id);
  try { recordProfileLaunch(g.id, live().map(x => x.id)); } catch (e) { console.error(e); }
}

export function launch(g, from) {
  if (!g || g.pending) return;
  count(g); play('coin');
  if (isOff()) return go(g.url);
  const ov = document.getElementById('launch');
  ov.querySelector('.launch-art').style.backgroundImage = `url("${thumb(g.id)}")`;
  document.getElementById('launch-title').textContent = 'LOADING ' + g.name.toUpperCase();
  document.getElementById('launch-tip').textContent = TIPS[Math.random() * TIPS.length | 0];
  ov.hidden = false; ov.classList.remove('go');
  document.documentElement.classList.add('launching');
  const art = ov.querySelector('.launch-art');
  if (isFull() && from) {
    const r = from.getBoundingClientRect();
    art.animate([{ transform: `translate(${r.left}px, ${r.top}px) scale(${r.width / innerWidth}, ${r.height / innerHeight})`, opacity: 1 },
      { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
    animating(art, 420);
  }
  requestAnimationFrame(() => ov.classList.add('go'));
  const bar = document.getElementById('launch-bar');
  const steps = 8, total = isFull() ? 640 : 160;
  for (let i = 0; i <= steps; i++) setTimeout(() => { bar.textContent = '▮'.repeat(i) + '▯'.repeat(steps - i); }, total * i / steps);
  setTimeout(() => go(g.url), total + 40);
}
// leaving with the back button: bfcache restores the page — take the overlay away
addEventListener('pageshow', () => { const ov = document.getElementById('launch'); if (ov) { ov.hidden = true; ov.classList.remove('go'); } document.documentElement.classList.remove('launching'); });

// wire a link so a plain click plays the transition; other clicks are counted only
export function wireLaunch(a, g, fromEl) {
  a.addEventListener('click', e => {
    if (g.pending) { e.preventDefault(); return; }
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { count(g); return; }
    e.preventDefault(); launch(g, fromEl ? fromEl() : a);
  });
  a.addEventListener('auxclick', e => { if (e.button === 1 && !g.pending) count(g); });
}
export { esc };
