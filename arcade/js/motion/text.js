// Text motion: splitText (screen readers keep the whole text via aria-label), typewriter, scramble.
import { addTask, isFull, isOff } from './engine.js';

export function splitText(el, { by = 'chars' } = {}) {
  if (el.dataset.split) return el;
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.dataset.split = by;
  let i = 0;
  el.innerHTML = text.split(/(\s+)/).map(w => {
    if (/^\s+$/.test(w)) return ' ';
    const inner = by === 'words' ? esc(w) : [...w].map(c => `<span class="split-c" style="--i:${i++}">${esc(c)}</span>`).join('');
    return `<span class="split-w" aria-hidden="true"${by === 'words' ? ` style="--i:${i++}"` : ''}>${inner}</span>`;
  }).join('');
  return el;
}
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// types text into el (or a target node); resolves when done. Instant when motion is not full.
export function typewriter(el, text, { cps = 40, html = false } = {}) {
  return new Promise(resolve => {
    if (!isFull()) { html ? (el.innerHTML = text) : (el.textContent = text); return resolve(); }
    let n = 0, acc = 0;
    addTask(dt => {
      acc += dt * cps; const k = Math.min(text.length, Math.floor(acc));
      if (k !== n) { n = k; el.textContent = text.slice(0, n); }
      if (n >= text.length) { if (html) el.innerHTML = text; resolve(); return false; }
    });
  });
}

// characters cycle through glyphs before resolving to the final text
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEFX░▒▓';
export function scramble(el, text, { duration = 600, keepLabel = false } = {}) {
  if (keepLabel && !el.hasAttribute('aria-label')) el.setAttribute('aria-label', text);
  if (!isFull() || isOff()) { el.textContent = text; return Promise.resolve(); }
  const from = el.textContent, len = Math.max(from.length, text.length);
  const starts = Array.from({ length: len }, () => Math.random() * .4), ends = starts.map(s => s + .3 + Math.random() * .4);
  let t = 0;
  return new Promise(resolve => addTask(dt => {
    t += dt * 1000 / duration;
    let out = '';
    for (let i = 0; i < len; i++) {
      if (t >= ends[i]) out += text[i] || '';
      else if (t >= starts[i]) out += GLYPHS[Math.random() * GLYPHS.length | 0];
      else out += from[i] || '';
    }
    el.textContent = out;
    if (t >= 1.05) { el.textContent = text; resolve(); return false; }
  }));
}
