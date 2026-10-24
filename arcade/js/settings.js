// Hub settings, saved locally and applied to <html data-*> (the inline head script applies them before paint).
import { get, set } from './store.js';
import { emitLevel } from './motion/engine.js';
import { setVolume } from './motion/sound.js';
const KEY = 'oa.settings';
const DEFAULTS = { anim: null, bg: 'on', density: 'comfortable', crt: 'on', cursor: 'on', sound: 'off', view: 'grid', vol: 60 };
const listeners = new Set();
export const onSettings = fn => listeners.add(fn);
const root = document.documentElement;
export function setting(k) { const s = get(KEY, {}) || {}; return s[k] ?? root.dataset[k] ?? DEFAULTS[k]; }
export function apply(k, v) {
  if (k !== 'view' && k !== 'vol') root.dataset[k] = v;
  set(KEY, Object.assign(get(KEY, {}) || {}, { [k]: v }));
  if (k === 'anim') emitLevel();
  if (k === 'vol') setVolume(v / 100);
  sync(); listeners.forEach(fn => fn(k, v));
}
export function sync() {
  document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.querySelectorAll('button').forEach(b =>
    b.setAttribute('aria-pressed', String(setting(seg.dataset.setting) === b.dataset.v))));
  const sb = document.getElementById('sound-btn');
  if (sb) { const on = root.dataset.sound === 'on'; sb.setAttribute('aria-pressed', String(on)); sb.querySelector('use').setAttribute('href', on ? '#i-volume' : '#i-mute'); sb.setAttribute('aria-label', on ? 'UI sounds on' : 'UI sounds off'); }
}
setVolume((setting('vol') ?? 60) / 100);

// ---- the flyout
export function initSettings(onReplay) {
  const fly = document.getElementById('settings'), btn = document.getElementById('settings-btn');
  const show = on => { fly.hidden = !on; btn.setAttribute('aria-expanded', String(on)); if (on) fly.querySelector('button[aria-pressed="true"]')?.focus(); };
  btn.addEventListener('click', e => { e.stopPropagation(); show(fly.hidden); });
  document.getElementById('settings-close').addEventListener('click', () => { show(false); btn.focus(); });
  document.addEventListener('click', e => { if (!fly.hidden && !fly.contains(e.target) && e.target !== btn && !e.target.closest('dialog')) show(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !fly.hidden) { show(false); btn.focus(); } });
  document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    apply(seg.dataset.setting, b.dataset.v);
    b.classList.remove('preview'); void b.offsetWidth; b.classList.add('preview');      // a tiny live preview
  }));
  const vol = document.getElementById('vol');
  vol.value = setting('vol') ?? 60;
  vol.addEventListener('input', () => apply('vol', +vol.value));
  document.getElementById('sound-btn').addEventListener('click', () => apply('sound', root.dataset.sound === 'on' ? 'off' : 'on'));
  document.getElementById('replay-intro').addEventListener('click', () => { show(false); onReplay && onReplay(); });
  sync();
  return show;
}
