// Numbers: countUp (eased tween) and odometer (rolling digit columns, CSS-transitioned).
import { addTask, isFull } from './engine.js';

export function countUp(el, to, { duration = 900, format = n => Math.round(n).toLocaleString() } = {}) {
  const from = +(el.dataset.v || 0) || 0; el.dataset.v = to;
  if (!isFull() || from === to) { el.textContent = format(to); return; }
  let t = 0;
  addTask(dt => {
    t = Math.min(1, t + dt * 1000 / duration);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = format(from + (to - from) * e);
    if (t >= 1) return false;
  });
}

// builds one column of 0–9 per digit; columns roll to their digit (staggered) when set() is called
export function odometer(el) {
  el.classList.add('odo');
  return {
    set(value) {
      const s = Math.max(0, Math.round(value)).toLocaleString();
      if (!isFull()) { el.textContent = s; return; }
      // screen readers get the plain number; the rolling columns are decoration
      const cols = [...s].map(ch => /\d/.test(ch)
        ? `<span class="odo-col" aria-hidden="true"><span class="odo-strip">${'0123456789'.split('').map(d => `<span>${d}</span>`).join('')}</span></span>`
        : `<span class="odo-sep" aria-hidden="true">${ch}</span>`);
      el.innerHTML = `<span class="visually-hidden">${s}</span>` + cols.join('');
      const strips = el.querySelectorAll('.odo-strip');
      const digits = [...s].filter(c => /\d/.test(c));
      requestAnimationFrame(() => requestAnimationFrame(() => strips.forEach((st, i) => {
        st.style.transitionDelay = (i * 70) + 'ms';
        st.style.transform = `translateY(${-digits[i] * 10}%)`;
      })));
    },
  };
}
