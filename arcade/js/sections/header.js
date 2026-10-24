// Header: frosted on scroll, hides going down and springs back going up; idle brand blink; scrambled subline;
// liquid nav ink tracking the active section; scroll progress spark; mobile drawer (focus trap, swipe to close).
import { scramble } from '../motion/text.js';
import { scrollProgress, onScrollFrame } from '../motion/scroll.js';
import { isFull } from '../motion/engine.js';
import { burst } from '../motion/particles.js';

const SUBS = ['//ready_to_play', '//insert_coin', '//high_score_pending', '//player_2_ready', '//press_start', '//now_loading', '//continue?'];

export function initHeader() {
  const header = document.querySelector('.site-header');
  let lastY = scrollY, hidden = false;
  const onY = y => {
    header.classList.toggle('scrolled', y > 40);
    header.style.setProperty('--hdr-glow', Math.min(.6, .18 + y / 4000).toFixed(3));
    const down = y > lastY + 4, up = y < lastY - 4;
    if (down && y > 300 && !hidden && !document.querySelector('.drawer.open')) { hidden = true; header.classList.add('hide'); }
    else if ((up || y < 120) && hidden) { hidden = false; header.classList.remove('hide'); }
    lastY = y;
    document.querySelector('.scroll-cue')?.classList.toggle('gone', y > 60);
  };
  onScrollFrame(onY); onY(scrollY);
  header.addEventListener('focusin', () => { hidden = false; header.classList.remove('hide'); });

  // scroll progress with a spark that sheds a few particles while moving
  const bar = document.getElementById('scroll-bar');
  scrollProgress(bar);
  let lastSpark = 0;
  onScrollFrame((y, v) => {
    if (!isFull() || Math.abs(v) < 400 || performance.now() - lastSpark < 120) return;
    lastSpark = performance.now();
    const r = bar.getBoundingClientRect(); burst(r.right, r.top + 1, { count: 3, power: .15, gravity: 200 });
  });

  // brand: blink every ~8 s, subline scramble every ~20 s
  const brand = document.getElementById('brand'), sub = document.getElementById('brand-sub');
  setInterval(() => { if (!document.hidden && isFull()) { brand.classList.remove('blink'); void brand.offsetWidth; brand.classList.add('blink'); } }, 8000);
  let si = 0;
  setInterval(() => { if (!document.hidden) { si = (si + 1) % SUBS.length; scramble(sub, SUBS[si], { duration: 700 }); } }, 20000);

  // nav: hover scramble + liquid ink between items
  const links = [...document.querySelectorAll('.main-nav a')], ink = document.querySelector('.nav-ink');
  links.forEach(a => { const t = a.textContent; a.setAttribute('aria-label', t); a.addEventListener('mouseenter', () => scramble(a, t, { duration: 320 })); });
  let cur = null;
  const moveInk = a => {
    links.forEach(l => l === a ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current'));
    if (!a) { ink.style.opacity = 0; cur = null; return; }
    const x = a.offsetLeft + 13, w = a.offsetWidth - 26;
    ink.style.opacity = 1;
    if (cur && isFull()) {
      const ox = cur.offsetLeft + 13, ow = cur.offsetWidth - 26, l = Math.min(ox, x), r = Math.max(ox + ow, x + w);
      ink.animate([{ transform: `translateX(${ox}px) scaleX(${ow / 100})` }, { transform: `translateX(${l}px) scaleX(${(r - l) / 100})`, offset: .45 },
        { transform: `translateX(${x}px) scaleX(${w / 100})` }], { duration: 520, easing: 'cubic-bezier(.65,0,.35,1)' });
    }
    ink.style.transform = `translateX(${x}px) scaleX(${w / 100})`;
    cur = a;
  };
  const map = { discover: 'discover', ticker: 'discover', featured: 'discover', recent: 'popular', popular: 'popular', categories: 'categories', lobby: 'lobby', shelf: 'library', library: 'library', favourites: 'favourites', profile: 'favourites', idea: null };
  const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) moveInk(links.find(l => l.dataset.nav === map[e.target.id]) || null); }, { rootMargin: '-45% 0px -50% 0px' });
  for (const id of Object.keys(map)) { const s = document.getElementById(id); if (s) io.observe(s); }
  addEventListener('resize', () => cur && moveInk(cur));

  drawer();
}

function drawer() {
  const btn = document.getElementById('menu-btn'), dr = document.getElementById('drawer'), scrim = document.getElementById('drawer-scrim'), main = document.getElementById('main');
  let lastFocus = null;
  dr.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--i', i));
  const open = on => {
    btn.setAttribute('aria-expanded', String(on)); btn.setAttribute('aria-label', on ? 'Close menu' : 'Open menu');
    if (on) {
      lastFocus = document.activeElement; dr.hidden = scrim.hidden = false; main.inert = true; document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => { dr.classList.add('open'); scrim.classList.add('open'); dr.querySelector('a').focus(); });
      dr.querySelectorAll('.dr-n').forEach((n, i) => { const to = +n.dataset.n; let k = 0; n.textContent = '00'; const iv = setInterval(() => { k++; n.textContent = String(Math.min(k, to)).padStart(2, '0'); if (k >= to) clearInterval(iv); }, isFull() ? 40 + i * 4 : 0); });
    } else {
      dr.classList.remove('open'); scrim.classList.remove('open'); document.body.style.overflow = ''; main.inert = false; dr.style.transform = '';
      setTimeout(() => { if (!dr.classList.contains('open')) dr.hidden = scrim.hidden = true; }, 420);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
  };
  btn.addEventListener('click', () => open(btn.getAttribute('aria-expanded') !== 'true'));
  document.getElementById('drawer-close').addEventListener('click', () => open(false));
  scrim.addEventListener('click', () => open(false));
  dr.addEventListener('click', e => { if (e.target.closest('a, [data-open-palette]')) open(false); });
  dr.addEventListener('keydown', e => {
    if (e.key === 'Escape') open(false);
    if (e.key !== 'Tab') return;
    const f = [...dr.querySelectorAll('a, button')], first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // swipe right to close
  let sx = null, dx = 0;
  dr.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { sx = e.clientX; dx = 0; dr.classList.add('dragging'); } });
  dr.addEventListener('pointermove', e => { if (sx === null) return; dx = Math.max(0, e.clientX - sx); dr.style.transform = `translateX(${dx}px)`; });
  const end = () => { if (sx === null) return; dr.classList.remove('dragging'); sx = null; if (dx > 90) open(false); else dr.style.transform = ''; };
  dr.addEventListener('pointerup', end); dr.addEventListener('pointercancel', end);
  matchMedia('(min-width: 1181px)').addEventListener('change', e => { if (e.matches && btn.getAttribute('aria-expanded') === 'true') open(false); });
}
