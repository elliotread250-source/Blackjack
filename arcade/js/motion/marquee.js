// Infinite marquee strips driven by the engine. Speed rises with scroll velocity and flips when scrolling up;
// pauses on hover and when off screen. Each track holds its content twice so a -50% loop is seamless.
import { addTask, isFull, whenVisible } from './engine.js';
import { velocity } from './scroll.js';

export function marquee(row, { speed = 40, dir = -1 } = {}) {
  const track = row.querySelector('.tk-track');
  let x = 0, hover = false, stop = null, half = 0, flip = 1;
  const measure = () => { half = track.scrollWidth / 2; };
  row.addEventListener('pointerenter', () => { hover = true; });
  row.addEventListener('pointerleave', () => { hover = false; });
  row.addEventListener('focusin', () => { hover = true; });
  row.addEventListener('focusout', () => { hover = false; });
  addEventListener('resize', measure);
  const start = () => {
    if (stop || !isFull()) return;
    measure();
    stop = addTask(dt => {
      if (!isFull()) { stop = null; track.style.transform = ''; return false; }
      const v = velocity();
      if (Math.abs(v) > 40) flip = v < 0 ? -1 : 1;
      const boost = 1 + Math.min(3, Math.abs(v) / 900);
      if (!hover) x += dir * flip * speed * boost * dt;
      if (half) { x %= half; if (x > 0) x -= half; }
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    });
  };
  whenVisible(row, start, () => { if (stop) { stop(); stop = null; } });
}
