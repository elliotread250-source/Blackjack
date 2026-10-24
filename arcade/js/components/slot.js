// "Surprise me" slot machine: three reels of real game logos spin at different speeds, stop one after another with
// a clunk and a bounce, and land on a random LIVE game (status up and not pending; if status is unknown, any live
// game). Then embers + confetti, the game's card flies out, and PLAY [NAME]? / SPIN AGAIN.
import { live, logo, esc } from '../registry.js';
import { statusOf } from '../status.js';
import { isFull, addTask } from '../motion/engine.js';
import { confettiBurst, burst, centerOf } from '../motion/particles.js';
import { play } from '../motion/sound.js';
import { unlock } from '../profile.js';
import { card } from './card.js';
import { launch, count } from './launch.js';

const $ = id => document.getElementById(id);
let opener = null, current = null, spinning = false;
const ITEM = 120;   // px per reel row (84 img + 2×18 margin)

function pool() {
  const games = live().filter(g => g.kind === 'game');
  const up = games.filter(g => statusOf(g) === 'up');
  return up.length ? up : games;
}

function fill(strip, ids, target) {
  strip.innerHTML = ids.map(id => `<img src="${logo(id)}" alt="" width="84" height="84">`).join('') + `<img src="${logo(target)}" alt="" width="84" height="84">`;
}

export function openSlot(from) {
  const dlg = $('slot');
  opener = from || document.activeElement;
  if (!dlg.open) dlg.showModal();
  spin();
}

function spin() {
  if (spinning) return;
  const games = pool(); if (!games.length) return;
  const g = games[Math.random() * games.length | 0];
  current = g; spinning = true;
  unlock('lucky-spin');
  $('slot-actions').hidden = true; $('slot-result').innerHTML = '';
  const reels = [...document.querySelectorAll('#slot .reel')], all = live().map(x => x.id);
  if (!isFull()) {
    reels.forEach(r => { fill(r.querySelector('.strip'), [], g.id); r.querySelector('.strip').style.transform = 'none'; });
    return land(g);
  }
  reels.forEach((r, i) => {
    const strip = r.querySelector('.strip'), n = 14 + i * 7;
    const ids = Array.from({ length: n }, () => all[Math.random() * all.length | 0]);
    fill(strip, ids, g.id);
    strip.style.transform = 'translateY(0)'; r.classList.remove('landed'); r.classList.add('spinning');
    const dist = n * ITEM, dur = 1100 + i * 450;
    let t = 0, lastRow = 0;
    addTask(dt => {
      t = Math.min(1, t + dt * 1000 / dur);
      const e = 1 - Math.pow(1 - t, 4), y = e * dist;
      strip.style.transform = `translateY(${-y}px)`;
      const row = Math.floor(y / ITEM); if (row !== lastRow) { lastRow = row; if (i === 0) play('tick'); }
      if (t > .82) r.classList.remove('spinning');
      if (t >= 1) {
        r.classList.add('landed'); play('clunk');
        if (i === reels.length - 1) land(g);
        return false;
      }
    });
  });
}

function land(g) {
  spinning = false;
  const res = $('slot-result');
  res.innerHTML = `<p>PLAY ${esc(g.name.toUpperCase())}?</p>`;
  const mini = card(g, { variant: 'mini', lazy: false }); mini.classList.add('mini-card');
  res.append(mini);
  const playBtn = $('slot-play');
  playBtn.href = g.url; playBtn.querySelector('span').textContent = `Play ${g.name}`;
  $('slot-actions').hidden = false;
  if (isFull()) { const [x, y] = centerOf($('slot').querySelector('.slot-window')); confettiBurst(x, y); burst(x, y, { count: 30, power: 1.2 }); }
  play('jackpot');
  playBtn.focus({ preventScroll: true });
}

export function initSlot() {
  const dlg = $('slot');
  $('slot-again').addEventListener('click', spin);
  $('slot-close').addEventListener('click', () => dlg.close());
  $('slot-play').addEventListener('click', e => {
    if (!current) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { count(current); return; }
    e.preventDefault(); dlg.close(); launch(current, $('slot-result'));
  });
  $('slot-play').addEventListener('auxclick', e => { if (e.button === 1 && current) count(current); });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { spinning = false; if (opener && opener.focus) opener.focus(); });
}
