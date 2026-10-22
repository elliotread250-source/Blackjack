// Hero: typed eyebrow, word-by-word headline (CSS), OBSESSION sheen + periodic glitch, the CSS-3D cabinet (spring
// tilt towards the pointer, device orientation on phones after a gesture where no permission prompt is needed,
// otherwise a slow idle sway), its CRT channel-changing through real thumbnails, the joystick leaning to the hovered
// CTA, orbiting thumbnail panels, magnetic CTAs with a liquid fill, the slot machine, and odometer stats.
import { GAMES, live, thumb } from '../registry.js';
import { plays, playsState, onPlays } from '../plays.js';
import { addTask, spring, isFull, finePointer, whenVisible } from '../motion/engine.js';
import { typewriter, scramble } from '../motion/text.js';
import { odometer } from '../motion/count.js';
import { magnetic } from '../motion/pointer.js';
import { glitch, ripple } from '../motion/fx.js';
import { burst, centerOf } from '../motion/particles.js';
import { play } from '../motion/sound.js';
import { openSlot } from '../components/slot.js';

const $ = id => document.getElementById(id);

export function initHero() {
  const n = live().length;
  for (const id of ['foot-count', 'shelf-total']) { const el = $(id); if (el) el.textContent = n; }
  document.querySelectorAll('.hero-title .w').forEach((w, i) => w.style.setProperty('--wi', i));

  // eyebrow types in once the hero starts
  const eb = $('eyebrow'), ebText = 'OPEN ARCADE: READY TO PLAY';
  if (isFull() && !document.documentElement.classList.contains('seen')) {
    eb.innerHTML = '<span class="eb-slash">//</span> <span class="eb-t"></span><span class="cursor" aria-hidden="true"></span>';
    eb.setAttribute('aria-label', '// ' + ebText);
    setTimeout(() => typewriter(eb.querySelector('.eb-t'), ebText, { cps: 38 }), document.documentElement.classList.contains('boot-cold') ? 1500 : 100);
  }

  // OBSESSION glitches for 200 ms every ~6 s (orange/amber only, then perfectly still)
  const star = document.querySelector('.star-text');
  setInterval(() => { if (!document.hidden && isFull()) glitch(star); }, 6000);

  // stats: games count and real total plays roll in as odometers when visible
  const fc = odometer($('fact-count')), fp = odometer($('fact-plays'));
  let seen = false;
  const total = () => Object.values(plays).reduce((a, b) => a + (b | 0), 0);
  const showStats = () => {
    fc.set(n);
    if (playsState === 'ok' && total() > 0) { $('fact-plays-wrap').hidden = false; fp.set(total()); }
  };
  whenVisible($('fact-count'), () => { if (!seen) { seen = true; setTimeout(showStats, 900); } });
  onPlays(() => { if (seen) showStats(); });

  cabinet();
  orbit();
  ctas();
}

// ---------------------------------------------------------------------- the cabinet
function cabinet() {
  const cab = $('cabinet'), scene = $('scene'), hero = document.querySelector('.hero');
  const rx = spring(0, { k: 90, d: 14 }), ry = spring(-14, { k: 90, d: 14 });
  let tx = 0, ty = -14, px = 0, py = 0, idle = true, running = false, visible = true, oriented = false, t0 = performance.now();
  const loop = () => {
    if (running || !isFull()) return; running = true;
    addTask(dt => {
      if (!visible || !isFull()) { running = false; return false; }
      if (idle && !oriented) { const t = (performance.now() - t0) / 1000; tx = Math.sin(t * .5) * 3; ty = -14 + Math.sin(t * .37) * 6; }
      rx.step(tx, dt); ry.step(ty, dt);
      cab.style.setProperty('--rx', rx.value.toFixed(2)); cab.style.setProperty('--ry', ry.value.toFixed(2));
      scene.style.setProperty('--px', px.toFixed(3)); scene.style.setProperty('--py', py.toFixed(3));
    });
  };
  whenVisible(hero, () => { visible = true; loop(); }, () => { visible = false; });
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !isFull()) return;
    const r = cab.getBoundingClientRect();
    px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5;
    ty = -14 + Math.max(-10, Math.min(10, (e.clientX - (r.left + r.width / 2)) / innerWidth * 30));
    tx = Math.max(-10, Math.min(10, -(e.clientY - (r.top + r.height / 2)) / innerHeight * 24));
    idle = false; loop();
  });
  hero.addEventListener('pointerleave', () => { idle = true; px = py = 0; });
  // phones: device orientation only where it needs no permission prompt, and only after a user gesture
  if (!finePointer && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    addEventListener('pointerdown', () => {
      addEventListener('deviceorientation', e => {
        if (e.beta == null || !isFull()) return;
        oriented = true; idle = false;
        ty = -14 + Math.max(-10, Math.min(10, (e.gamma || 0) / 3)); tx = Math.max(-10, Math.min(10, ((e.beta || 45) - 45) / -4)); loop();
      });
    }, { once: true });
  }
  loop();

  // the CRT cycles real game thumbnails every ~3 s with a channel change
  const screen = $('cab-screen'), imgEl = $('cab-img'), nameEl = $('cab-name');
  const pool = live().filter(g => g.kind === 'game');
  let i = Math.max(0, pool.findIndex(g => g.id === 'crossy-road'));
  imgEl.src = thumb(pool[i].id);
  const next = () => {
    if (document.hidden || !visible) return;
    i = (i + 1) % pool.length;
    const g = pool[i];
    const pre = new Image(); pre.src = thumb(g.id);
    if (isFull()) { screen.classList.remove('switch'); void screen.offsetWidth; screen.classList.add('switch'); }
    setTimeout(() => { imgEl.src = pre.src; scramble(nameEl, g.name.toUpperCase(), { duration: 500 }); }, isFull() ? 120 : 0);
  };
  setInterval(next, 3000);

  // the joystick leans towards the hovered CTA, and a button lights up
  const stick = $('cab-stick'), btns = cab.querySelectorAll('.cab-btns i');
  document.querySelectorAll('[data-cab]').forEach(b => {
    b.addEventListener('pointerenter', () => { stick.style.setProperty('--lean', b.dataset.cab === 'left' ? -28 : 28); btns[b.dataset.cab === 'left' ? 0 : 2].classList.add('lit'); });
    b.addEventListener('pointerleave', () => { stick.style.setProperty('--lean', 0); btns.forEach(x => x.classList.remove('lit')); });
  });
}

// ---------------------------------------------------------------------- orbiting thumbnail panels
function orbit() {
  const box = $('orbit');
  const featured = GAMES.filter(g => g.featured && !g.pending);
  const extra = live().filter(g => !g.featured && g.kind === 'game');
  const pick = [...featured, ...extra.sort(() => Math.random() - .5)].slice(0, 6);
  const spots = [[-4, 2, 1.4, -6], [70, -2, .8, 5], [-10, 62, 1.1, 4], [74, 66, .6, -5], [36, -10, .5, 3], [40, 84, 1.25, -3]];
  pick.forEach((g, k) => {
    const [ox, oy, d, rot] = spots[k];
    const el = document.createElement('div');
    el.className = 'orb';
    el.style.cssText = `--ox:${ox}%;--oy:${oy}%;--d:${d};--rot:${rot}deg;--od:${7 + k * 1.3}s;--odel:${-k * 1.7}s`;
    el.innerHTML = `<div><img src="${thumb(g.id)}" alt="" width="320" height="180" loading="lazy" decoding="async"></div><span>${g.name.toUpperCase()}</span>`;
    box.append(el);
  });
}

// ---------------------------------------------------------------------- CTAs
function ctas() {
  const explore = $('explore-btn'), surprise = $('surprise-btn');
  for (const b of [explore, surprise]) {
    magnetic(b, { radius: 80, strength: .28 });
    b.addEventListener('pointerenter', e => {   // liquid fill wipes in from the side the pointer entered
      const r = b.getBoundingClientRect();
      b.style.setProperty('--fx', (e.clientX - r.left) + 'px'); b.style.setProperty('--fy', (e.clientY - r.top) + 'px');
    });
  }
  explore.addEventListener('click', e => {
    ripple(explore, e); const [x, y] = centerOf(explore); burst(x, y, { count: 16, power: .6 }); play('click');
    e.preventDefault();
    const lib = $('library');
    setTimeout(() => lib.scrollIntoView({ behavior: isFull() ? 'smooth' : 'auto' }), isFull() ? 120 : 0);
    history.replaceState(null, '', '#library');
  });
  surprise.addEventListener('click', e => { ripple(surprise, e); play('click'); openSlot(surprise); });
}
