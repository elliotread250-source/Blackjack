// Easter eggs: the Konami code (ARCADE MODE: CRT intensifies, coin counter, UI blips, pixel edges, SECRET AGENT
// badge; the code again turns it off), typing "insert coin" (a coin drops and bounces off the header), five quick
// clicks on the brand (the emblem spins and the boot replays), and waiting at the very bottom (CONTINUE? 10… 9…).
import { isFull, addTask } from '../motion/engine.js';
import { unlock } from '../profile.js';
import { toast } from '../components/toast.js';
import { play } from '../motion/sound.js';
import { replayBoot } from './boot.js';
import { burst } from '../motion/particles.js';

const root = document.documentElement;
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const typing = t => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
let coins = 0, soundBefore = null, typed = '';
// true while a secret phrase is part-way typed, so single-key shortcuts (R, F, I…) stay quiet
export const eggTyping = () => typed.length >= 2 && 'insert coin'.startsWith(typed);

function coinDrop() {
  coins++; const cc = document.getElementById('coin-counter'); if (root.classList.contains('arcade-mode')) cc.querySelector('b').textContent = coins;
  play('coin');
  if (!isFull()) { toast('Clink! A coin rolled in.', { icon: 'coin' }); return; }
  const c = document.createElement('div'); c.className = 'coin-fall'; document.body.append(c);
  const hdr = document.querySelector('.site-header').getBoundingClientRect().bottom;
  let x = innerWidth * (.3 + Math.random() * .4), y = -40, vy = 0, vx = (Math.random() - .5) * 160, bounced = 0, t = 0;
  addTask(dt => {
    t += dt; vy += 1800 * dt; y += vy * dt; x += vx * dt;
    if (y > hdr - 28 && vy > 0 && bounced < 3) { y = hdr - 28; vy = -vy * .45; bounced++; play('tick'); if (bounced === 1) burst(x + 14, hdr, { count: 6, power: .3, up: true }); }
    c.style.transform = `translate(${x}px, ${y}px) scaleX(${Math.abs(Math.cos(t * 9)).toFixed(2)})`;
    if (y > innerHeight + 50 || t > 4) { c.remove(); return false; }
  });
}
window.__oaCoin = coinDrop;

function arcadeMode() {
  const on = !root.classList.contains('arcade-mode');
  root.classList.toggle('arcade-mode', on);
  document.getElementById('coin-counter').hidden = !on;
  document.getElementById('coin-counter').querySelector('b').textContent = coins;
  if (on) { soundBefore = root.dataset.sound; root.dataset.crt = 'on'; if (root.dataset.sound !== 'on') root.dataset.sound = 'on'; unlock('secret-agent'); toast('ARCADE MODE — enter the code again to leave', { icon: 'controller', ms: 5000 }); play('jackpot'); }
  else { if (soundBefore) root.dataset.sound = soundBefore; toast('Arcade mode off', { icon: 'controller' }); }
}

export function initEggs() {
  let k = 0;
  addEventListener('keydown', e => {
    if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) { k = 0; return; }
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    k = key === KONAMI[k] ? k + 1 : key === KONAMI[0] ? 1 : 0;
    if (k === KONAMI.length) { k = 0; arcadeMode(); }
    if (e.key.length === 1) {
      typed = (typed + e.key.toLowerCase()).slice(-11);
      if (typed.endsWith('insert coin')) { typed = ''; coinDrop(); }
      else while (typed && !'insert coin'.startsWith(typed)) typed = typed.slice(1);   // keep only a live prefix
    } else typed = '';
  });
  // five quick clicks on the brand mark
  const brand = document.getElementById('brand'); let clicks = [];
  brand.addEventListener('click', e => {
    const now = performance.now(); clicks = [...clicks.filter(t => now - t < 1600), now];
    if (clicks.length >= 5) { e.preventDefault(); clicks = []; brand.classList.remove('spin'); void brand.offsetWidth; brand.classList.add('spin'); setTimeout(replayBoot, 700); }
  });
  // CONTINUE? countdown when you rest at the very bottom
  const q = document.getElementById('continue-q'), n = document.getElementById('cq-n');
  let wait = 0, tick = 0, count = 10;
  const atBottom = () => innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  const stop = () => { clearTimeout(wait); clearInterval(tick); q.hidden = true; count = 10; };
  addEventListener('scroll', () => {
    if (!atBottom()) { stop(); return; }
    if (wait || !q.hidden) return;
    wait = setTimeout(() => {
      wait = 0; if (!atBottom()) return;
      q.hidden = false; count = 10; n.textContent = count; q.querySelector('.cq-title').textContent = 'CONTINUE?';
      tick = setInterval(() => {
        count--; n.textContent = Math.max(0, count); play('tick');
        if (count <= 0) { clearInterval(tick); q.querySelector('.cq-title').textContent = 'GAME OVER — THANKS FOR PLAYING'; n.textContent = ''; }
      }, 1000);
    }, 2500);
  }, { passive: true });
  document.getElementById('cq-top').addEventListener('click', () => { stop(); scrollTo({ top: 0, behavior: isFull() ? 'smooth' : 'auto' }); });
}
