// The motion engine: ONE requestAnimationFrame loop for every JS-driven effect, a quality governor, and the
// motion level (Settings: full | reduced | off, defaulting to reduced under prefers-reduced-motion).
// Effects register tasks; a task gets (dt seconds, now ms) and returns false when it is finished.
const root = document.documentElement;
const tasks = new Set();
let raf = 0, last = 0;
export const DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
export const coarse = matchMedia('(pointer: coarse)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const level = () => root.dataset.anim || 'full';
export const isFull = () => level() === 'full';
export const isOff = () => level() === 'off';
export const bgOn = () => root.dataset.bg !== 'off';

// ---- quality governor: 3 everything · 2 fewer particles · 1 no cursor trail / lighter canvas · 0 static ambience
export let quality = (navigator.hardwareConcurrency || 8) <= 2 ? 2 : 3;
const qFns = new Set();
export const onQuality = fn => (qFns.add(fn), () => qFns.delete(fn));
let winStart = 0, frames = 0, low = 0, cool = 0, started = 0;
function govern(now) {
  if (!started) { started = now; winStart = now; frames = 0; return; }
  if (now - started < 600) { winStart = now; frames = 0; return; }          // ignore the first frames after a wake
  frames++;
  if (now - winStart < 1000) return;
  const fps = frames * 1000 / (now - winStart);
  winStart = now; frames = 0;
  if (now < cool) return;
  const floor = coarse ? 28 : 50;
  low = fps < floor ? low + 1 : 0;
  if (low >= 2 && quality > 0) {                                            // two slow seconds in a row: step down, never up
    quality--; low = 0; cool = now + 2500;
    if (DEV) console.info(`[motion] ${fps.toFixed(0)} fps → quality ${quality}`);
    qFns.forEach(fn => { try { fn(quality); } catch (e) { console.error(e); } });
  }
}
export function forceQuality(q) { quality = q; qFns.forEach(fn => fn(quality)); }

// ---- the loop
export function addTask(fn) {
  const t = { fn };
  tasks.add(t); wake();
  return () => tasks.delete(t);
}
function tick(now) {
  raf = 0;
  if (document.hidden) return;
  const dt = Math.min(.1, Math.max(0, (now - last) / 1000)); last = now;
  if (tasks.size > 0) govern(now);
  for (const t of [...tasks]) {
    let keep;
    try { keep = t.fn(dt, now); } catch (e) { console.error('[motion] task failed', e); keep = false; }
    if (keep === false) tasks.delete(t);
  }
  if (tasks.size) raf = requestAnimationFrame(tick); else started = 0;
}
function wake() { if (!raf && !document.hidden) { last = performance.now(); started = 0; raf = requestAnimationFrame(tick); } }
document.addEventListener('visibilitychange', () => { if (!document.hidden && tasks.size) wake(); });

// ---- level changes (settings.js calls emitLevel)
const lFns = new Set();
export const onLevel = fn => (lFns.add(fn), () => lFns.delete(fn));
export function emitLevel() { lFns.forEach(fn => { try { fn(level()); } catch (e) { console.error(e); } }); }

// ---- small shared helpers
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const wait = ms => new Promise(r => setTimeout(r, ms));
// a critically-damped-ish spring: call step(target, dt) every frame
export function spring(value = 0, { k = 170, d = 18 } = {}) {
  let v = 0;
  return {
    get value() { return value; }, set value(x) { value = x; v = 0; },
    step(target, dt) { const f = k * (target - value) - d * v; v += f * dt; value += v * dt; return Math.abs(target - value) > .001 || Math.abs(v) > .001; },
  };
}
// run fn when el is on screen (and stop when it leaves)
export function whenVisible(el, on, off = () => {}, margin = '120px') {
  const io = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? on() : off())), { rootMargin: margin });
  io.observe(el);
  return () => io.disconnect();
}
// will-change only while an animation runs
export function animating(el, ms) { el.classList.add('is-animating'); setTimeout(() => el.classList.remove('is-animating'), ms + 50); }
