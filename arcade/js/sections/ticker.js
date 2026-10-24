// Marquee ticker: a strip of every live game's logo (real links) one way, huge outlined words the other.
import { live, logo, esc } from '../registry.js';
import { wireLaunch } from '../components/launch.js';
import { marquee } from '../motion/marquee.js';

export function initTicker() {
  const track = document.querySelector('#tk-logos .tk-track');
  const games = live();
  const html = g => `<a class="tk-logo" href="${esc(g.url)}" data-id="${g.id}"><img src="${logo(g.id)}" alt="" width="38" height="38" loading="lazy" decoding="async">${esc(g.name)}</a>`;
  track.innerHTML = games.map(html).join('') + games.map(html).join('');
  // the second copy is for the seamless loop only: hidden from assistive tech and the tab order
  [...track.children].slice(games.length).forEach(a => { a.setAttribute('aria-hidden', 'true'); a.tabIndex = -1; });
  track.querySelectorAll('a').forEach(a => wireLaunch(a, games.find(g => g.id === a.dataset.id), () => a.querySelector('img')));
  marquee(document.getElementById('tk-logos'), { speed: 38, dir: -1 });
  marquee(document.querySelector('.tk-words'), { speed: 60, dir: 1 });
}
