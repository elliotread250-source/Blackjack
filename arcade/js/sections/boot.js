// Boot sequence. Cold (first visit in a session, full motion): CRT line → screen opens with a bloom → BIOS readout
// → emblem draws, INSERT COIN → coin drops, shutters open on the hero. ≤ 1.8 s, skippable with any key/click/tap.
// Warm (returning browser): 350 ms emblem flick + scanline wipe. Reduced: a 150 ms fade (CSS). Seen this session: nothing.
import { isFull } from '../motion/engine.js';
import { play } from '../motion/sound.js';

const root = document.documentElement;
const boot = () => document.getElementById('boot');
const timers = [];
let finished = false;
const at = (ms, fn) => timers.push(setTimeout(fn, ms));
function heroGo() { root.classList.remove('boot-hold'); root.classList.add('hero-go'); }
function finish() {
  if (finished) return; finished = true;
  timers.forEach(clearTimeout); timers.length = 0;
  const b = boot(); b.classList.add('done');
  root.classList.remove('boot-cold', 'boot-warm');
  heroGo();
  removeEventListener('keydown', skip, true); removeEventListener('pointerdown', skip, true);
  try { sessionStorage.setItem('oa.intro', '1'); localStorage.setItem('oa.visited', '1'); } catch { /* storage blocked */ }
}
function skip(e) { if (e.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return; finish(); }

function bios(count) {
  const pre = document.getElementById('boot-bios');
  const lines = ['OPEN ARCADE BIOS v2.0', '> memory check ........ 640K <span class="ok">OK</span>', `> mounting shelf ...... ${count} titles`,
    '> calibrating joystick . <span class="ok">OK</span>', '> warming up cabinets .. <span id="bb-bar"></span>', '<span class="rdy">[READY]</span>'];
  lines.forEach((l, i) => at(i * 105, () => { pre.insertAdjacentHTML('beforeend', l + '\n'); if (i === 4) fillBar(); }));
}
function fillBar() {
  const bar = document.getElementById('bb-bar'); if (!bar) return;
  for (let k = 0; k <= 8; k++) at(k * 14, () => { bar.innerHTML = '▮'.repeat(k) + '▯'.repeat(8 - k) + ` ${Math.round(k / 8 * 100)}%`; });
}

export function runCold() {
  finished = false;
  const b = boot(); b.className = 'boot'; b.style.display = 'block';
  document.getElementById('boot-bios').innerHTML = '';
  root.classList.add('boot-hold');
  const count = document.querySelectorAll('#static-list li').length || 38;
  addEventListener('keydown', skip, true); addEventListener('pointerdown', skip, true);
  document.getElementById('boot-skip').onclick = finish;
  at(0, () => b.classList.add('p1'));
  at(200, () => { b.classList.add('p2'); play('hum'); });
  at(450, () => { b.classList.add('p3'); bios(count); });
  at(1100, () => b.classList.add('p4'));
  at(1450, () => { b.classList.add('p5'); play('coin'); heroGo(); });
  at(1800, finish);
}
function runWarm() {
  addEventListener('keydown', skip, true); addEventListener('pointerdown', skip, true);
  at(60, heroGo); at(350, finish);
}
export function initBoot() {
  if (root.classList.contains('boot-cold') && isFull()) runCold();
  else if (root.classList.contains('boot-warm') && isFull()) runWarm();
  else { boot().classList.add('done'); heroGo(); try { sessionStorage.setItem('oa.intro', '1'); localStorage.setItem('oa.visited', '1'); } catch { /* fine */ } }
}
// Settings > Replay the intro, and the 5-click brand easter egg
export function replayBoot() {
  if (!isFull()) return;
  scrollTo({ top: 0, behavior: 'auto' });
  root.classList.remove('hero-go'); void root.offsetWidth;
  const b = boot(); b.classList.remove('done');
  runCold();
}
