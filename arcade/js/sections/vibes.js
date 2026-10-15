// Pick your vibe: one tile per registry category with a real game count and its own looping micro-illustration
// (original SVG in brand colours). Clicking filters the library and scrolls to it.
import { GAMES, CATEGORIES } from '../registry.js';
import { setCat } from './library.js';
import { tilt } from '../motion/pointer.js';

const O = '#ff7518', A = '#ffb347', G = '#ffd08a', L = '#2a3440', R = '#202937', T = '#f2f5fa';
const ILL = {
  racing: `<g class="a-speed"><path d="M40 52h40M30 64h56M46 76h30" stroke="${A}" stroke-width="3" stroke-linecap="round"/></g>
    <g class="a-drift"><rect x="88" y="50" width="44" height="22" rx="7" fill="${O}"/><rect x="100" y="42" width="20" height="12" rx="4" fill="${G}"/><circle cx="96" cy="74" r="6" fill="${R}" stroke="${A}" stroke-width="2"/><circle cx="124" cy="74" r="6" fill="${R}" stroke="${A}" stroke-width="2"/></g>`,
  puzzle: `<g class="a-fall"><rect x="88" y="20" width="16" height="16" fill="${O}"/><rect x="104" y="20" width="16" height="16" fill="${O}"/><rect x="104" y="36" width="16" height="16" fill="${O}"/></g>
    <g class="a-clear"><rect x="40" y="84" width="120" height="16" fill="${A}"/></g><rect x="40" y="100" width="56" height="14" fill="${L}"/><rect x="120" y="100" width="40" height="14" fill="${L}"/>`,
  multiplayer: `<g class="a-five"><path d="M60 40 L84 64 L72 66 L80 82 L72 86 L64 70 L56 78Z" fill="${O}"/></g><g class="a-five r"><path d="M140 40 L116 64 L128 66 L120 82 L128 86 L136 70 L144 78Z" fill="${G}" transform="translate(200 0) scale(-1 1)"/></g>
    <g class="a-spark"><path d="M100 30 l4 12 12 4 -12 4 -4 12 -4 -12 -12 -4 12 -4z" fill="${G}"/></g>`,
  classic: `<g class="a-wobble"><path d="M84 30h32v6h6v6h6v40h-8v-6h-6v6h-8v-6h-8v6h-8v-6h-6v6h-8V42h6v-6h6z" fill="${A}"/><rect x="88" y="48" width="8" height="10" fill="#080b10"/><rect x="106" y="48" width="8" height="10" fill="#080b10"/></g>`,
  '3d': `<g class="a-cube"><path d="M100 26 L134 44 L134 80 L100 98 L66 80 L66 44Z" fill="none" stroke="${O}" stroke-width="2.5"/><path d="M66 44 L100 62 L134 44 M100 62 V98" fill="none" stroke="${A}" stroke-width="2.5"/><path d="M100 26 V62 M66 80 L100 62 L134 80" fill="none" stroke="${G}" stroke-width="1" opacity=".5"/></g>`,
  strategy: `<rect x="56" y="40" width="88" height="66" fill="${R}"/><path d="M56 62h88M56 84h88M78 40v66M100 40v66M122 40v66" stroke="${L}" stroke-width="2"/>
    <g class="a-knight"><path d="M80 98h16v-4h-3c0-6 2-9 2-13 0-5-4-8-8-8l-1 3c-3 1-5 3-5 7l3 1 3-2c0 4-4 6-4 12h-3z" fill="${G}" stroke="${O}" stroke-width="1"/></g>`,
  casual: `<g class="a-shadow"><ellipse cx="100" cy="104" rx="20" ry="4" fill="${O}" opacity=".4"/></g><g class="a-ball"><circle cx="100" cy="86" r="16" fill="${A}"/><path d="M86 80 Q100 92 114 80" stroke="${O}" stroke-width="3" fill="none"/></g>`,
  board: `<g class="a-dice"><rect x="66" y="48" width="44" height="44" rx="9" fill="${T}"/><circle cx="78" cy="60" r="4" fill="${O}"/><circle cx="98" cy="80" r="4" fill="${O}"/><circle cx="88" cy="70" r="4" fill="${O}"/></g>
    <rect x="116" y="58" width="34" height="34" rx="7" fill="${A}"/><circle cx="126" cy="68" r="3.5" fill="#080b10"/><circle cx="140" cy="82" r="3.5" fill="#080b10"/>`,
  arcade: `<g class="a-coin"><circle cx="100" cy="62" r="28" fill="${A}" stroke="${O}" stroke-width="4"/><text x="100" y="72" text-anchor="middle" font-family="monospace" font-weight="700" font-size="28" fill="${O}">¢</text></g>`,
  platformer: `<rect x="34" y="96" width="40" height="8" rx="3" fill="${L}"/><rect x="82" y="74" width="40" height="8" rx="3" fill="${L}"/><rect x="128" y="42" width="40" height="8" rx="3" fill="${L}"/>
    <g class="a-jump"><rect x="94" y="78" width="14" height="16" rx="3" fill="${O}"/><rect x="98" y="82" width="3" height="3" fill="#080b10"/></g>`,
  action: `<g class="a-boom"><path d="M100 30 L108 52 L132 44 L118 62 L138 76 L112 76 L110 100 L98 80 L80 96 L84 72 L62 66 L86 58 L76 38 L96 50Z" fill="${O}"/><circle cx="100" cy="64" r="12" fill="${G}"/></g>`,
  tool: `<rect x="56" y="34" width="88" height="62" rx="8" fill="${R}" stroke="${L}" stroke-width="2"/><text x="68" y="62" font-family="monospace" font-size="16" fill="${A}">&gt;_</text><rect class="a-type" x="96" y="50" width="9" height="16" fill="${O}"/>`,
};

export function initVibes() {
  const ul = document.getElementById('vibes');
  for (const [k, label] of CATEGORIES) {
    if (k === 'all' || k === 'favourites') continue;
    const n = GAMES.filter(g => !g.pending && (k === 'tool' ? g.kind === 'tool' : g.categories.includes(k))).length;
    if (!n) continue;
    const li = document.createElement('li'); li.className = 'vibe'; li.dataset.reveal = '';
    li.innerHTML = `<button type="button" aria-label="${label}: ${n} ${n === 1 ? 'title' : 'titles'}. Show them in the library">
      <span class="ill" aria-hidden="true"><svg viewBox="0 0 200 120">${ILL[k] || ''}</svg></span>
      <span class="v-name">${label}</span><span class="v-n"><b>${n}</b> ${n === 1 ? 'title' : 'titles'}</span></button>`;
    li.querySelector('button').addEventListener('click', () => setCat(k, { scroll: true, push: true }));
    tilt(li.querySelector('button'), { max: 7 });
    ul.append(li);
  }
  ul.querySelectorAll('.vibe').forEach((li, i) => li.style.setProperty('--delay', (i % 4) * 70 + 'ms'));
}
