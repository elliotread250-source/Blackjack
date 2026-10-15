// Pointer-driven motion: tilt (spring-eased 3D with a moving glare), magnetic pull. Fine pointers and full
// motion only; everything resets exactly when the pointer leaves.
import { addTask, spring, isFull, finePointer } from './engine.js';

export function tilt(el, { max = 8, onMove } = {}) {
  if (!finePointer) return;
  const rx = spring(0, { k: 200, d: 20 }), ry = spring(0, { k: 200, d: 20 });
  let tx = 0, ty = 0, gx = 50, gy = 50, running = false;
  const run = () => {
    if (running) return; running = true;
    addTask(dt => {
      const a = rx.step(tx, dt), b = ry.step(ty, dt);
      el.style.setProperty('--rx', rx.value.toFixed(2) + 'deg'); el.style.setProperty('--ry', ry.value.toFixed(2) + 'deg');
      el.style.setProperty('--gx', gx.toFixed(1) + '%'); el.style.setProperty('--gy', gy.toFixed(1) + '%');
      if (!a && !b && !el.matches(':hover')) { running = false; return false; }
    });
  };
  el.addEventListener('pointermove', e => {
    if (!isFull() || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    ty = (x - .5) * 2 * max; tx = -(y - .5) * 2 * max * .8; gx = x * 100; gy = y * 100;
    if (onMove) onMove(x, y);
    run();
  });
  el.addEventListener('pointerleave', () => { tx = 0; ty = 0; run(); });
}

// leans the element towards the pointer when it comes within `radius` px
export function magnetic(el, { radius = 80, strength = .32 } = {}) {
  if (!finePointer) return;
  const sx = spring(0, { k: 220, d: 16 }), sy = spring(0, { k: 220, d: 16 });
  let tx = 0, ty = 0, running = false;
  const run = () => {
    if (running) return; running = true;
    addTask(dt => {
      const a = sx.step(tx, dt), b = sy.step(ty, dt);
      el.style.setProperty('--mx', sx.value.toFixed(2) + 'px'); el.style.setProperty('--my', sy.value.toFixed(2) + 'px');
      if (!a && !b) { running = false; return false; }
    });
  };
  addEventListener('pointermove', e => {
    if (!isFull() || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy, dist = Math.hypot(dx, dy) - Math.max(r.width, r.height) / 2;
    const want = dist < radius;
    const ntx = want ? dx * strength : 0, nty = want ? dy * strength : 0;
    if (ntx !== tx || nty !== ty) { tx = ntx; ty = nty; run(); }
  }, { passive: true });
}
