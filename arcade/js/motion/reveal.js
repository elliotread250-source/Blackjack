// Scroll reveals: elements with .reveal / [data-reveal] / .split fade-rise in once. Scroll-driven CSS
// (animation-timeline: view()) where the browser supports it; IntersectionObserver otherwise. The hidden state
// only exists after .motion-ready is set here, so a failed script never hides content.
import { splitText } from './text.js';

const SEL = '.reveal:not(.in), [data-reveal]:not(.in), .split:not(.in)';
export function initReveals() {
  const root = document.documentElement;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -10% 0px' });
  const prep = el => {
    el._rv = 1;
    if (el.classList.contains('split') && !el.dataset.split) { splitText(el); el.classList.add('armed'); }
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * .92 && r.bottom > 0) el.classList.add('in');           // already on screen: no flash
    else io.observe(el);
  };
  document.querySelectorAll(SEL).forEach(prep);
  root.classList.add('motion-ready');
  let t = 0;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => document.querySelectorAll(SEL).forEach(el => { if (!el._rv) { el._rv = 1; prep(el); } }), 30); })
    .observe(document.getElementById('main'), { childList: true, subtree: true });
}
