// Sticky header state, active-section underline, mobile drawer with focus management, back-to-top.
export function initNav() {
  const header = document.querySelector('.site-header'), top = document.querySelector('.to-top');
  const onScroll = () => { const y = scrollY; header.classList.toggle('scrolled', y > 24); top.classList.toggle('show', y > 900); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // active section underline
  const links = [...document.querySelectorAll('.main-nav a')], ink = document.querySelector('.nav-ink');
  const moveInk = a => {
    links.forEach(l => l === a ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current'));
    if (!a) { ink.style.opacity = 0; return; }
    ink.style.opacity = 1; ink.style.width = a.offsetWidth - 28 + 'px'; ink.style.transform = `translateX(${a.offsetLeft + 14}px)`;
  };
  const map = { discover: 'discover', featured: 'discover', recent: 'library', popular: 'library', library: 'library', favourites: 'favourites', idea: null };
  const io = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting) {
      const key = e.target.id === 'library' && document.getElementById('categories').getBoundingClientRect().top < 140 ? 'categories' : map[e.target.id];
      moveInk(links.find(l => l.dataset.nav === key) || null);
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  for (const id of Object.keys(map)) { const s = document.getElementById(id); if (s) io.observe(s); }

  // drawer
  const btn = document.getElementById('menu-btn'), drawer = document.getElementById('drawer'), scrim = document.getElementById('drawer-scrim');
  let lastFocus = null;
  const open = on => {
    btn.setAttribute('aria-expanded', String(on)); btn.setAttribute('aria-label', on ? 'Close menu' : 'Open menu');
    if (on) {
      lastFocus = document.activeElement; drawer.hidden = scrim.hidden = false;
      requestAnimationFrame(() => { drawer.classList.add('open'); scrim.classList.add('open'); drawer.querySelector('a').focus(); });
      document.body.style.overflow = 'hidden';
    } else {
      drawer.classList.remove('open'); scrim.classList.remove('open'); document.body.style.overflow = '';
      setTimeout(() => { if (!drawer.classList.contains('open')) drawer.hidden = scrim.hidden = true; }, 320);
      if (lastFocus) lastFocus.focus();
    }
  };
  btn.addEventListener('click', () => open(btn.getAttribute('aria-expanded') !== 'true'));
  document.getElementById('drawer-close').addEventListener('click', () => open(false));
  scrim.addEventListener('click', () => open(false));
  drawer.addEventListener('click', e => { if (e.target.closest('a, [data-open-palette]')) open(false); });
  drawer.addEventListener('keydown', e => {
    if (e.key === 'Escape') open(false);
    if (e.key !== 'Tab') return;
    const f = [...drawer.querySelectorAll('a, button')], first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  matchMedia('(min-width: 1025px)').addEventListener('change', e => { if (e.matches && btn.getAttribute('aria-expanded') === 'true') open(false); });
}
