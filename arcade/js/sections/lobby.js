// Multiplayer lobby: SELECT YOUR MODE. Lists ONLY what the registry's `features` verifiably say
// (online, coop, bots, local2p). No player counts: no API provides them.
import { live } from '../registry.js';
import { card, refreshCard } from '../components/card.js';
import { onStatus } from '../status.js';
import { onPlays } from '../plays.js';
import { byId } from '../registry.js';

const MODES = [
  ['online', 'Online', 'users', 'Send a friend a link and play together over the internet.'],
  ['coop', 'Co-op', 'controller', 'Team up on one screen.'],
  ['bots', 'Vs bots', 'bot', 'Computer opponents ready when you are.'],
  ['local2p', 'Same screen', 'keyboard', 'Two players, one keyboard or screen.'],
];
let mode = 'online';
export function initLobby() {
  const tabs = document.getElementById('lobby-tabs'), panel = document.getElementById('lobby-panel'), ink = tabs.querySelector('.lt-ink');
  const modes = MODES.map(m => [...m, live().filter(g => g.features.includes(m[0]))]).filter(m => m[4].length);
  if (!modes.length) { document.getElementById('lobby').hidden = true; return; }
  mode = modes[0][0];
  const moveInk = b => { ink.style.width = b.offsetWidth + 'px'; ink.style.transform = `translateX(${b.offsetLeft - 6}px)`; };
  const show = (k, focus) => {
    mode = k;
    const m = modes.find(x => x[0] === k);
    tabs.querySelectorAll('.lt').forEach(b => { const on = b.dataset.mode === k; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on) { moveInk(b); if (focus) b.focus(); } });
    panel.setAttribute('aria-labelledby', 'lt-' + k);
    panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
    panel.innerHTML = `<p class="lobby-explain" style="grid-column:1/-1">${m[3]}</p>`;
    m[4].forEach((g, i) => {
      const box = document.createElement('div'); box.className = 'lobby-card'; box.style.setProperty('--i', i);
      box.innerHTML = `<span class="lobby-tag" aria-hidden="true"><i class="lamp"></i>READY · <span class="p2">PLAYER 2 PRESS START</span></span>`;
      box.append(card(g, { variant: 'standard' }));
      panel.append(box);
    });
  };
  modes.forEach(([k, label, icon, , games]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lt'; b.id = 'lt-' + k; b.dataset.mode = k; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'lobby-panel');
    b.innerHTML = `<svg aria-hidden="true"><use href="#i-${icon}"/></svg>${label}<span class="n">${games.length}</span>`;
    b.addEventListener('click', () => show(k));
    tabs.append(b);
  });
  tabs.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const ks = modes.map(m => m[0]), i = ks.indexOf(mode);
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? ks.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + ks.length) % ks.length;
    show(ks[n], true);
  });
  show(mode);
  addEventListener('resize', () => { const b = tabs.querySelector('[aria-selected="true"]'); if (b) moveInk(b); });
  const refresh = () => panel.querySelectorAll('.gcard').forEach(el => refreshCard(el, byId.get(el.dataset.id)));
  onStatus(refresh); onPlays(refresh);
}
