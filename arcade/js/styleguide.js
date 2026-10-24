// The living style guide: renders tokens and components from the real CSS/JS (styleguide.html, linked from the footer).
import { loadRegistry, byId } from './registry.js';
import { card } from './components/card.js';
import { toast } from './components/toast.js';
import { BADGES } from './profile.js';
import { scramble, typewriter, splitText } from './motion/text.js';
import { countUp, odometer } from './motion/count.js';
import { ripple, shake, glitch, sheen } from './motion/fx.js';
import { burst, confettiBurst, centerOf } from './motion/particles.js';
import { magnetic, tilt } from './motion/pointer.js';

const $ = id => document.getElementById(id);
// the icon sprite lives in index.html: borrow it so the guide shows the same set
const html = await (await fetch('index.html')).text();
const sprite = /<svg class="sprite"[\s\S]*?<\/svg>/.exec(html);
if (sprite) document.body.insertAdjacentHTML('afterbegin', sprite[0]);
const ids = sprite ? [...sprite[0].matchAll(/<symbol id="(i-[\w-]+)"/g)].map(m => m[1]) : [];
$('icons').innerHTML = ids.map(id => `<div><svg aria-hidden="true"><use href="#${id}"/></svg>${id.slice(2)}</div>`).join('');

const css = getComputedStyle(document.documentElement);
const v = n => css.getPropertyValue(n).trim();
$('colours').innerHTML = ['--ink', '--surface', '--panel', '--raised', '--line', '--orange', '--orange-hover', '--amber', '--gold', '--text', '--muted', '--faint', '--ok', '--warn', '--err', '--unknown', '--orange-15', '--orange-50']
  .map(n => `<div class="sw"><i style="background:var(${n})"></i><p><b>${n}</b>${v(n)}</p></div>`).join('');
$('gradients').innerHTML = ['--grad-ember', '--grad-heat', '--grad-heat-v', '--grad-ink', '--grad-sheen', '--grad-btn'].map(n => `<div class="sw"><i style="background:var(${n})"></i><p><b>${n}</b></p></div>`).join('');
$('glows').innerHTML = ['--glow-1', '--glow-2', '--glow-3', '--glow-4', '--glow-5', '--glow-in-2', '--bezel', '--bezel-hot'].map(n => `<div class="glow-box" style="box-shadow:var(${n})">${n}</div>`).join('');
$('type').innerHTML = [['Hero', 'font:700 min(var(--fs-hero),14vw)/.9 var(--font-display);text-transform:uppercase;letter-spacing:-.035em', 'OBSESSION'],
  ['Section (h2)', 'font:700 var(--fs-h2)/1 var(--font-display);text-transform:uppercase', 'The charts'], ['Card title (h3)', 'font:700 var(--fs-h3)/1.1 var(--font-display)', 'Crossy Road'],
  ['Lead', 'font:400 var(--fs-lead)/1.5 var(--font-body);color:var(--muted)', 'Discover brilliant browser games.'], ['Body', 'font:400 1rem/1.6 var(--font-body)', 'No downloads, no sign-ups. Just play.'],
  ['Overline', '', '<span class="overline"><span>01</span> // tonight</span>'], ['Eyebrow', '', '<span class="eyebrow">// OPEN ARCADE: READY TO PLAY</span>'],
  ['Scoreboard', '', '<span class="score-num">012,345</span>'], ['Marquee', '', '<span class="marquee-text" style="font-size:3rem">PRESS START</span>'], ['Mono', 'font:500 .9rem/1.4 var(--font-mono)', '&gt;_ ready();']]
  .map(([k, st, t]) => `<div class="type-row"><code>${k}</code><div style="${st}">${t}</div></div>`).join('');
$('chips-demo').insertAdjacentHTML('afterbegin', ['All', 'Racing', 'Puzzle', 'Multiplayer'].map((x, i) => `<button class="chip" aria-pressed="${i === 0}">${x}<span class="n">${[38, 4, 7, 8][i]}</span></button>`).join(''));
const pill = document.querySelector('#chips-demo .chip-pill'), first = document.querySelector('#chips-demo .chip');
requestAnimationFrame(() => { pill.style.width = first.offsetWidth + 'px'; pill.style.transform = `translateX(${first.offsetLeft}px)`; });
document.querySelectorAll('#chips-demo .chip').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#chips-demo .chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft}px)`;
}));
$('sg-badges').innerHTML = BADGES.slice(0, 4).map(([id, name, how, icon], i) => `<li class="badge${i === 3 ? ' locked' : ''}"><div class="badge-in"><span class="bd-ic"><svg><use href="#i-${i === 3 ? 'lock' : icon}"/></svg></span><b>${i === 3 ? '???' : name}</b><small>${how}</small></div></li>`).join('');

await loadRegistry();
const g = byId.get('crossy-road');
for (const variant of ['standard', 'compact', 'cabinet', 'list', 'mini']) {
  const box = document.createElement('div'); box.style.gridColumn = variant === 'list' ? '1 / -1' : '';
  box.innerHTML = `<p class="overline" style="margin-bottom:10px">.v-${variant}</p>`; box.append(card(g, { variant, featured: variant === 'standard' }));
  $('cards').append(box);
}
const demos = [
  ['scramble', el => scramble(el, 'PRESS START', { duration: 700 })], ['typewriter', el => { el.textContent = ''; typewriter(el, '> boot.open_arcade()', { cps: 30 }); }],
  ['countUp', el => countUp(el, Math.round(Math.random() * 99999), { duration: 1200 })], ['odometer', el => { el.classList.add('score-num'); odometer(el).set(Math.round(Math.random() * 99999)); }],
  ['splitText + reveal', el => { el.textContent = 'HIGH SCORE'; delete el.dataset.split; el.className = 'out split armed'; splitText(el); requestAnimationFrame(() => el.classList.add('in')); }],
  ['ripple', (el, e) => ripple(el.parentElement, e)], ['shake', el => shake(el.parentElement)], ['glitch', el => { el.textContent = 'NO SIGNAL'; el.dataset.text = 'NO SIGNAL'; glitch(el); }],
  ['sheen', el => sheen(el.parentElement)], ['particles: embers', el => { const [x, y] = centerOf(el); burst(x, y, { count: 30 }); }],
  ['particles: hearts', el => { const [x, y] = centerOf(el); burst(x, y, { count: 14, shape: 'heart', power: .5, gravity: 300 }); }],
  ['particles: confetti', el => { const [x, y] = centerOf(el); confettiBurst(x, y); }], ['toast', () => toast('A toast with an action', { icon: 'badge', action: 'Undo', onAction: () => toast('Undone') })],
];
for (const [name, run] of demos) {
  const d = document.createElement('div'); d.className = 'demo';
  d.innerHTML = `<p class="overline">${name}</p><p class="out">—</p><button class="btn btn-ghost" type="button"><span>Play</span></button>`;
  d.querySelector('button').addEventListener('click', e => run(d.querySelector('.out'), e));
  $('motion').append(d);
}
const mag = document.createElement('div'); mag.className = 'demo';
mag.innerHTML = '<p class="overline">magnetic + tilt</p><p class="out">Hover the button / card</p><button class="btn btn-primary" type="button"><span>Magnetic</span></button>';
$('motion').append(mag); magnetic(mag.querySelector('button')); tilt(mag, { max: 8 });
