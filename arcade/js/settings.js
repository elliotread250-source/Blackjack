// Hub settings: animation level, background effects, density. Saved locally; applied to <html> data-*.
import { get, set } from './store.js';
const KEY = 'oa.settings';
const listeners = new Set();
export const onSettings = fn => listeners.add(fn);
export function current() { const d = document.documentElement.dataset; return { anim: d.anim, bg: d.bg, density: d.density }; }
function apply(k, v) {
  document.documentElement.dataset[k] = v;
  set(KEY, Object.assign(get(KEY, {}) || {}, { [k]: v }));
  sync(); listeners.forEach(fn => fn(k, v));
}
function sync() {
  const cur = current();
  document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(cur[seg.dataset.setting] === b.dataset.v))));
}
export function initSettings() {
  const fly = document.getElementById('settings'), btn = document.getElementById('settings-btn');
  const show = on => { fly.hidden = !on; btn.setAttribute('aria-expanded', String(on)); if (on) fly.querySelector('button[aria-pressed="true"]')?.focus(); };
  btn.addEventListener('click', e => { e.stopPropagation(); show(fly.hidden); });
  document.getElementById('settings-close').addEventListener('click', () => { show(false); btn.focus(); });
  document.addEventListener('click', e => { if (!fly.hidden && !fly.contains(e.target) && e.target !== btn) show(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !fly.hidden) { show(false); btn.focus(); } });
  document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) apply(seg.dataset.setting, b.dataset.v); }));
  sync();
}
