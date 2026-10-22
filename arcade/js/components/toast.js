// Toasts: slide up from the bottom with a pixel border, an icon and a progress bar for their lifetime.
// Stack, dismiss on click or swipe, optional action (Undo). Toasts with an action live longer, and every toast
// holds while the pointer is over it or keyboard focus is inside it.
import { isFull } from '../motion/engine.js';
const box = () => document.getElementById('toasts');
export function toast(msg, { icon = 'info', action, onAction, ms = action ? 6500 : 3800 } = {}) {
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status'); el.style.setProperty('--ms', ms + 'ms');
  el.innerHTML = `<svg class="ic" aria-hidden="true"><use href="#i-${icon}"/></svg><span class="t-msg"></span>${action ? '<button type="button" class="t-act"></button>' : ''}<i class="t-bar" aria-hidden="true"></i>`;
  el.querySelector('.t-msg').textContent = msg;
  if (action) { const b = el.querySelector('.t-act'); b.textContent = action; b.addEventListener('click', e => { e.stopPropagation(); onAction && onAction(); close(); }); }
  let t = setTimeout(close, ms), sx = null;
  function close() { clearTimeout(t); if (!el.isConnected) return; el.classList.add('out'); setTimeout(() => el.remove(), isFull() ? 260 : 0); }
  el.addEventListener('click', close);
  el.addEventListener('pointerdown', e => { sx = e.clientX; });
  el.addEventListener('pointermove', e => { if (sx !== null) el.style.translate = `${Math.max(0, e.clientX - sx)}px 0`; });
  el.addEventListener('pointerup', e => { if (sx !== null && e.clientX - sx > 70) close(); else el.style.translate = ''; sx = null; });
  const hold = () => { clearTimeout(t); el.classList.add('hold'); };
  const release = () => { if (el.matches(':hover') || el.contains(document.activeElement)) return; el.classList.remove('hold'); clearTimeout(t); t = setTimeout(close, 1500); };
  el.addEventListener('mouseenter', hold); el.addEventListener('focusin', hold);
  el.addEventListener('mouseleave', release); el.addEventListener('focusout', () => setTimeout(release, 0));
  const b = box(); b.append(el);
  while (b.children.length > 4) b.firstElementChild.remove();
  return close;
}
