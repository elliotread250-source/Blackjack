// Custom cursor (fine pointers, Settings > Cursor effects): an orange dot plus a spring-trailing ring that grows over
// links, becomes a PLAY pill over game cards, gets out of the way over text fields and squashes on click. A faint
// ember trail follows fast movement. The native cursor is hidden only while the script is actively tracking; if a
// frame is missed for 250 ms, it comes back.
import { addTask, spring, finePointer, isFull, quality } from '../motion/engine.js';
import { burst } from '../motion/particles.js';

const root = document.documentElement;
export function initCursor() {
  if (!finePointer) return;
  const dot = document.getElementById('cursor-dot'), ring = document.getElementById('cursor-ring');
  const sx = spring(0, { k: 260, d: 24 }), sy = spring(0, { k: 260, d: 24 });
  let x = -100, y = -100, lx = x, ly = y, stop = null, lastSeen = 0, inside = false;
  const enabled = () => root.dataset.cursor === 'on' && root.dataset.anim !== 'off';
  const off = () => { root.classList.remove('cursor-live', 'cursor-hide'); if (stop) { stop(); stop = null; } };
  const start = () => {
    if (stop || !enabled()) return;
    root.classList.add('cursor-live', 'cursor-hide');
    stop = addTask(dt => {
      if (!enabled()) { off(); return false; }
      lastSeen = performance.now();
      sx.step(x, dt); sy.step(y, dt);
      dot.style.transform = `translate(${x}px, ${y}px)`;
      ring.style.transform = `translate(${sx.value.toFixed(1)}px, ${sy.value.toFixed(1)}px)`;
      const v = Math.hypot(x - lx, y - ly) / Math.max(dt, .008); lx = x; ly = y;
      if (v > 2200 && isFull() && quality >= 2 && Math.random() < .5) burst(x, y, { count: 1, power: .05, gravity: -40 });
      if (!inside) { off(); return false; }
    });
  };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY; inside = true;
    if (!stop) { sx.value = x; sy.value = y; start(); }
    const t = e.target;
    const field = t.closest && t.closest('input, textarea, select, [contenteditable]');
    const cardEl = t.closest && t.closest('.gcard:not(.pending)');
    const actionable = t.closest && t.closest('a, button, [role="button"], [role="tab"], label');
    ring.classList.toggle('text', !!field);
    ring.classList.toggle('play', !!cardEl && !field && !(actionable && actionable.matches('button')));
    ring.classList.toggle('link', !cardEl && !!actionable && !field);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { inside = false; });
  addEventListener('blur', () => { inside = false; });
  addEventListener('pointerdown', () => ring.classList.add('down'));
  addEventListener('pointerup', () => ring.classList.remove('down'));
  // safety: if the loop stalls, give the native cursor back
  setInterval(() => { if (root.classList.contains('cursor-hide') && performance.now() - lastSeen > 250) root.classList.remove('cursor-hide'); else if (stop && performance.now() - lastSeen < 250) root.classList.add('cursor-hide'); }, 200);
}
