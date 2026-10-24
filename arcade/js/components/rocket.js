// Back to top: a pixel rocket. Click → shakes, ignites, launches with a smoke trail while the page scrolls to the top,
// then lands back in place.
import { isFull } from '../motion/engine.js';
import { onScrollFrame } from '../motion/scroll.js';
import { play } from '../motion/sound.js';

export function initRocket() {
  const r = document.getElementById('rocket');
  r.hidden = false; r.classList.add('off');
  onScrollFrame(y => r.classList.toggle('off', y < 900 && !r.classList.contains('launch')));
  r.addEventListener('click', () => {
    if (!isFull()) { scrollTo({ top: 0, behavior: 'auto' }); document.getElementById('brand').focus(); return; }
    play('whoosh');
    r.classList.add('ignite');
    setTimeout(() => {
      r.classList.remove('ignite'); r.classList.add('launch');
      const b = r.getBoundingClientRect();
      for (let i = 0; i < 8; i++) setTimeout(() => {
        const s = document.createElement('span'); s.className = 'smoke'; s.style.left = (b.left + b.width / 2 - 7) + 'px'; s.style.top = (b.bottom - 10 - i * 30) + 'px';
        s.style.setProperty('--sx', (Math.random() * 30 - 15) + 'px'); document.body.append(s); setTimeout(() => s.remove(), 1000);
      }, i * 50);
      scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => { r.classList.remove('launch'); r.classList.add('off'); }, 900);
      setTimeout(() => { document.getElementById('brand').focus({ preventScroll: true }); }, 1100);
    }, 380);
  });
}
