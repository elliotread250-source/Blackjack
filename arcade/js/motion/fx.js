// Small one-shot effects: ripple from a point, shake, glitch, sheen. All skip politely when motion is reduced/off.
import { isFull } from './engine.js';

export function ripple(el, e) {
  if (!isFull()) return;
  const r = el.getBoundingClientRect(), d = document.createElement('span');
  d.className = 'ripple-dot';
  d.style.left = (e && e.clientX ? e.clientX - r.left : r.width / 2) + 'px'; d.style.top = (e && e.clientY ? e.clientY - r.top : r.height / 2) + 'px';
  d.style.setProperty('--rs', Math.max(r.width, r.height) * 2.2 + 'px');
  el.append(d); d.addEventListener('animationend', () => d.remove(), { once: true });
}
const once = (el, cls, ms) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); };
export const shake = el => isFull() && once(el, 'shake', 520);
export const glitch = el => isFull() && once(el.classList.contains('glitch') ? el : (el.classList.add('glitch'), el), 'go', 240);
export const sheen = el => isFull() && once(el.classList.contains('sheen') ? el : (el.classList.add('sheen'), el), 'go', 1150);
