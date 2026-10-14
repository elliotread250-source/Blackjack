// Hero: truthful counts, a short typewriter on the decorative terminal, and Surprise Me.
import { live, GAMES } from './registry.js';
import { launch } from './cards.js';

export function initHero() {
  const n = live().length;
  for (const id of ['fact-count', 'term-count', 'foot-count']) { const el = document.getElementById(id); if (el) el.textContent = n; }
  document.getElementById('surprise-btn').addEventListener('click', () => {
    const pool = live().filter(g => g.kind === 'game');
    if (!pool.length) return;
    const g = pool[Math.floor(Math.random() * pool.length)];
    launch(g);
  });
  typewriter();
  try { sessionStorage.setItem('oa.intro', '1'); } catch { /* fine */ }
}

function typewriter() {
  const root = document.documentElement;
  if (root.classList.contains('seen') || root.dataset.anim !== 'full') return;
  const lines = [...document.querySelectorAll('#term .tl')];
  root.classList.add('typing');
  lines.forEach((l, i) => setTimeout(() => { l.classList.add('on'); if (i === lines.length - 1) setTimeout(() => root.classList.remove('typing'), 50); }, 1300 + i * 380));
}
