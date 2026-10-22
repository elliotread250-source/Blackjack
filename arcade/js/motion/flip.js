// Layout transitions: flip(elements, mutate) animates from old to new positions with WAAPI;
// viewTransition(fn) uses the View Transitions API when available, else just runs fn.
import { isFull } from './engine.js';

export function flip(els, mutate, { duration = 420, easing = 'cubic-bezier(.2,.8,.2,1)', enter, exit } = {}) {
  if (!isFull()) { mutate(); return; }
  const first = new Map();
  for (const el of els()) if (el.isConnected) first.set(el, el.getBoundingClientRect());
  const before = new Set(first.keys());
  mutate();
  const after = els();
  after.forEach((el, i) => {
    const a = first.get(el);
    if (!a) { if (enter) enter(el, i); return; }
    const b = el.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top, sx = a.width / (b.width || 1), sy = a.height / (b.height || 1);
    if (Math.abs(dx) < .5 && Math.abs(dy) < .5 && Math.abs(sx - 1) < .01) return;
    el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, transformOrigin: 'top left' }, { transform: 'none', transformOrigin: 'top left' }],
      { duration, easing, delay: Math.min(i, 12) * 12 });
  });
  if (exit) for (const el of before) if (!after.includes(el)) exit(el);
}

export function viewTransition(fn) {
  if (isFull() && document.startViewTransition) return document.startViewTransition(fn).finished.catch(() => {});
  fn(); return Promise.resolve();
}
