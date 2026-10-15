// Scroll: one passive listener feeding velocity, progress and pinned scenes (sticky sections whose
// progress 0→1 drives a callback). Work is batched into the engine loop, never done in the event.
import { addTask } from './engine.js';

let y = scrollY, lastY = scrollY, vel = 0, pending = false;
const subs = new Set();
export const velocity = () => vel;
export const onScrollFrame = fn => (subs.add(fn), () => subs.delete(fn));
addEventListener('scroll', () => {
  y = scrollY;
  if (pending) return; pending = true;
  addTask(dt => {
    const v = (y - lastY) / Math.max(dt, .008); lastY = y;
    vel = vel * .6 + v * .4;
    subs.forEach(fn => { try { fn(y, vel); } catch (e) { console.error(e); } });
    if (Math.abs(vel) < 5) { vel = 0; pending = false; subs.forEach(fn => fn(y, 0)); return false; }
    vel *= .85;
  });
}, { passive: true });

export function scrollProgress(bar) {
  const set = () => { const max = document.documentElement.scrollHeight - innerHeight; const p = max > 0 ? scrollY / max : 0;
    bar.style.transform = `scaleX(${p.toFixed(4)})`; bar.style.setProperty('--inv', p > .001 ? (1 / p).toFixed(3) : 1); return p; };
  onScrollFrame(set); addEventListener('resize', set); return set();
}

// pin(section, fn): fn(progress 0..1) while the tall section scrolls past its sticky child
export function pin(section, fn) {
  const calc = () => {
    const r = section.getBoundingClientRect(), total = r.height - innerHeight;
    if (r.bottom < -200 || r.top > innerHeight + 200) return;
    fn(Math.max(0, Math.min(1, total > 0 ? -r.top / total : 0)));
  };
  onScrollFrame(calc); addEventListener('resize', calc); calc();
  return calc;
}
