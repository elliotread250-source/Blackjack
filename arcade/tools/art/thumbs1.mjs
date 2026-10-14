// 16:9 promotional thumbnails, part 1. Canvas 640x360 (exported at 2x intrinsic size).
import { svg, lg, rg, blur, rect, circ, ell, path, line, g, text, rng, poly, finish, glow, stars, suit, SERIF, SANS, MONO, shade, f } from './lib.mjs';

const W = 640, H = 360;
const T = (defs, body, v = finish()) => svg(W, H, defs + v.defs, body + v.body);

// a playing card at (x,y) rotated r degrees
function card(x, y, r, rank, kind, { w = 92, h = 130, id = 'cs' } = {}) {
  const red = kind === 'heart' || kind === 'diamond', ink = red ? '#d22b3a' : '#15171c';
  return g(`transform="translate(${x} ${y}) rotate(${r})"`,
    rect(-w / 2 + 4, -h / 2 + 8, w, h, '#000', `rx="9" opacity=".35" filter="url(#${id})"`) +
    rect(-w / 2, -h / 2, w, h, '#fbf8f1', 'rx="9"') + rect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 'none', 'rx="8" stroke="#d9cfb8" stroke-width="1.5"') +
    text(-w / 2 + 9, -h / 2 + 24, rank, 21, ink, SERIF) + suit(kind, -w / 2 + 16, -h / 2 + 38, 15, ink) +
    suit(kind, 0, 6, rank === 'A' ? 52 : 34, ink) +
    g(`transform="rotate(180)"`, text(-w / 2 + 9, -h / 2 + 24, rank, 21, ink, SERIF) + suit(kind, -w / 2 + 16, -h / 2 + 38, 15, ink)));
}
function chip(x, y, c, rim = '#fff', s = 1) {
  return g(`transform="translate(${x} ${y}) scale(${s})"`,
    ell(0, 6, 26, 9, shade(c, -.45)) + rect(-26, -2, 52, 8, shade(c, -.3)) + ell(0, -2, 26, 9, c) +
    ell(0, -2, 26, 9, 'none', `stroke="${rim}" stroke-width="3.5" stroke-dasharray="7 6"`) + ell(0, -2, 15, 5, 'none', `stroke="${rim}" stroke-opacity=".7" stroke-width="1.5"`));
}
const stack = (x, y, c, n, rim) => Array.from({ length: n }, (_, i) => chip(x, y - i * 8, c, rim)).join('');

export const THUMBS = {};

THUMBS['blackjack'] = () => {
  const defs = rg('felt', .5, .38, .75, [[0, '#1b8a5a'], [.55, '#0d5a3a'], [1, '#04241a']]) + rg('lamp', .5, 0, .7, [[0, '#ffe7b0', .55], [1, '#ffe7b0', 0]]) +
    lg('rail', 0, 0, 0, 1, [[0, '#6a3a1e'], [.5, '#3a1d0e'], [1, '#1d0d05']]) + blur('cs', 4);
  let b = rect(0, 0, W, H, 'url(#felt)') + ell(320, -40, 420, 260, 'url(#lamp)');
  b += path(`M60 360 Q320 250 580 360`, 'none', 'stroke="#e9c46a" stroke-opacity=".5" stroke-width="2"');
  b += `<path id="arc" d="M150 330 Q320 255 490 330" fill="none"/>` + `<text font-size="15" letter-spacing="5" fill="#e9c46a" fill-opacity=".75" ${SERIF}><textPath href="#arc" startOffset="50%" text-anchor="middle">BLACKJACK PAYS 3 TO 2</textPath></text>`;
  b += path('M-20 360 Q320 300 660 360 L660 380 L-20 380Z', 'url(#rail)') + path('M-20 361 Q320 301 660 361', 'none', 'stroke="#e9c46a" stroke-width="3"');
  b += ell(320, 200, 160, 24, '#000', 'opacity=".22"');
  b += card(268, 168, -12, 'A', 'spade') + card(352, 164, 10, 'K', 'heart');
  b += card(116, 92, -24, '7', 'club', { w: 64, h: 90 }) + card(150, 86, -8, '9', 'diamond', { w: 64, h: 90 });
  b += stack(500, 230, '#c8202f', 6) + stack(556, 250, '#18181c', 5, '#e9c46a') + stack(470, 280, '#e9b23a', 3, '#fff7e0') + chip(110, 270, '#2a62c8', '#fff', .9) + chip(150, 292, '#c8202f', '#fff', .9);
  b += circ(352, 110, 3, '#fff', 'opacity=".9"') + circ(270, 115, 2, '#fff', 'opacity=".7"');
  return T(defs, b, finish('v', .7, .5, .45));
};

THUMBS['pool'] = () => {
  const defs = lg('wall', 0, 0, 0, 1, [[0, '#2a1608'], [1, '#120904']]) + lg('felt', 0, 0, 0, 1, [[0, '#0f6a45'], [1, '#0a8a58']]) + lg('wood', 0, 0, 0, 1, [[0, '#7a4524'], [1, '#3a1d0c']]) +
    rg('lamp', .5, .5, .5, [[0, '#ffd99a', .75], [1, '#ffd99a', 0]]) + rg('b8', .35, .3, .7, [[0, '#555'], [.5, '#111'], [1, '#000']]) + rg('cue', .35, .3, .7, [[0, '#fff'], [1, '#cfc8b8']]) + blur('sh', 3);
  let b = rect(0, 0, W, H, 'url(#wall)');
  for (let x = 30; x < W; x += 70) b += rect(x, 0, 2, 120, '#3a2210', 'opacity=".6"');
  b += ell(320, 70, 300, 110, 'url(#lamp)') + path('M250 0 L250 30 L210 62 L430 62 L390 30 L390 0Z', '#1d4a2a') + rect(210, 60, 220, 6, '#e9c46a');
  // table in perspective
  b += path('M60 360 L150 128 L490 128 L580 360Z', 'url(#wood)') + path('M92 352 L170 140 L470 140 L548 352Z', 'url(#felt)');
  b += path('M92 352 L170 140 L470 140 L548 352Z', 'none', 'stroke="#05351f" stroke-width="3"');
  for (const [x, y, r] of [[172, 142, 9], [468, 142, 9], [320, 138, 8], [96, 348, 14], [544, 348, 14]]) b += ell(x, y, r * 1.4, r * .7, '#050505');
  b += ell(320, 230, 120, 40, '#fff', 'opacity=".05"');
  const balls = [['#f4c430', 300, 190], ['#1f4fc8', 314, 182], ['#d22b3a', 328, 190], ['#6a2ab8', 307, 198], ['#f07a1a', 321, 198], ['#1a8a3a', 335, 198], ['#8a1c1c', 342, 182]];
  for (const [c, x, y] of balls) b += ell(x + 2, y + 6, 8, 3, '#000', 'opacity=".35"') + circ(x, y, 8, c) + circ(x - 2.5, y - 3, 2.5, '#fff', 'opacity=".7"');
  b += ell(372, 268, 18, 6, '#000', 'opacity=".4" filter="url(#sh)"') + circ(368, 252, 17, 'url(#b8)') + circ(368, 252, 7, '#f4f1e8') + text(368, 256, '8', 10, '#111', `${SANS} text-anchor="middle"`) + circ(362, 245, 4, '#fff', 'opacity=".55"');
  b += ell(262, 300, 16, 5, '#000', 'opacity=".4" filter="url(#sh)"') + circ(258, 286, 14, 'url(#cue)') + circ(254, 281, 3.5, '#fff');
  b += line(240, 300, 40, 380, '#d9b07a', 7, 'stroke-linecap="round"') + line(228, 310, 40, 380, '#3a1d0c', 8, 'stroke-linecap="round"') + circ(243, 297, 4, '#5ac8e8');
  for (let i = 0; i < 4; i++) b += line(288 + i * 10, 268 - i * 3, 340 + i * 8, 260 - i * 3, '#fff', 1.5, `opacity="${.5 - i * .1}" stroke-linecap="round"`);
  return T(defs, b);
};

THUMBS['kart-racer'] = () => {
  const defs = lg('sky', 0, 0, 0, 1, [[0, '#3a8ae8'], [.6, '#9ad4ff'], [1, '#e8f6ff']]) + lg('road', 0, 0, 0, 1, [[0, '#4a4f5a'], [1, '#2a2d34']]) + blur('sm', 6) + blur('mb', 2);
  let b = rect(0, 0, W, H, 'url(#sky)');
  b += path('M0 150 Q80 120 160 140 T320 130 T480 138 T640 128 L640 190 L0 190Z', '#6ab04a') + path('M0 170 Q120 150 240 165 T480 160 T640 158 L640 200 L0 200Z', '#4a9a3a');
  for (let x = 20; x < 640; x += 46) b += path(`M${x} 160 l12 -34 l12 34Z`, '#2f7a34') + rect(x + 10, 158, 4, 8, '#5a3a20');
  b += rect(380, 104, 220, 40, '#e8e8f0') + rect(380, 96, 220, 10, '#d22b3a');
  for (let x = 388; x < 596; x += 10) b += circ(x, 120 + (x % 3) * 4, 3, ['#f4c430', '#3a8ae8', '#d22b3a', '#fff'][x % 4]);
  b += path('M-20 360 L-20 250 Q300 160 660 210 L660 360Z', 'url(#road)');
  b += path('M-20 250 Q300 160 660 210', 'none', 'stroke="#fff" stroke-width="12" stroke-dasharray="26 26"') + path('M-20 250 Q300 160 660 210', 'none', 'stroke="#d22b3a" stroke-width="12" stroke-dasharray="26 26" stroke-dashoffset="26"');
  b += path('M60 360 Q300 250 660 290', 'none', 'stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-dasharray="20 18"');
  const kart = (x, y, s, body, helm, flip) => g(`transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(-6)"`,
    ell(0, 34, 70, 10, '#000', 'opacity=".3"') +
    path('M-62 18 L-50 0 L30 -4 L62 10 L66 22 L-62 26Z', body) + path('M-50 0 L30 -4 L40 4 L-40 8Z', shade(body, .25)) + rect(-66, 10, 18, 8, '#222', 'rx="2"') +
    path('M58 8 L72 6 L72 16 L60 18Z', '#222') + circ(-4, -18, 15, helm) + path('M-2 -24 Q14 -24 14 -14 L-2 -12Z', '#1a2a4a') + circ(-8, -24, 4, '#fff', 'opacity=".6"') +
    circ(-42, 26, 15, '#1a1a1a') + circ(-42, 26, 6, '#888') + circ(44, 26, 15, '#1a1a1a') + circ(44, 26, 6, '#888'));
  for (let i = 0; i < 7; i++) b += circ(150 - i * 22, 268 + (i % 2) * 8, 14 + i * 4, '#e8e8e8', `opacity="${.55 - i * .06}" filter="url(#sm)"`);
  b += kart(250, 238, 1.15, '#d22b3a', '#f4c430');
  for (let i = 0; i < 5; i++) b += line(100 - i * 8, 230 + i * 10, 160 - i * 8, 232 + i * 10, '#fff', 3, 'opacity=".6" stroke-linecap="round"');
  for (let i = 0; i < 5; i++) b += circ(440 - i * 18, 220 + (i % 2) * 6, 10 + i * 3, '#e8e8e8', `opacity="${.45 - i * .07}" filter="url(#sm)"`);
  b += kart(500, 200, .85, '#1f6ad8', '#fff');
  return T(defs, b, finish('v', .45));
};

THUMBS['geometry-dash'] = () => {
  const defs = lg('bg', 0, 0, 0, 1, [[0, '#1a1aa8'], [.7, '#3a1a9a'], [1, '#12105a']]) + lg('gr', 0, 0, 0, 1, [[0, '#2a2ad8'], [1, '#0a0a5a']]) + blur('gl', 5) + lg('tr', 1, 0, 0, 0, [[0, '#ffd21f', .9], [1, '#ffd21f', 0]]);
  let b = rect(0, 0, W, H, 'url(#bg)');
  for (let i = 0; i < 8; i++) b += rect(40 + i * 82, 40 + (i % 3) * 30, 50, 50, 'none', `stroke="#6a6aff" stroke-opacity=".25" stroke-width="2" transform="rotate(${i * 10} ${65 + i * 82} ${65 + (i % 3) * 30})"`);
  b += circ(520, 90, 60, 'none', 'stroke="#ff4fd8" stroke-width="3" opacity=".6" filter="url(#gl)"') + circ(520, 90, 40, 'none', 'stroke="#3af0ff" stroke-width="2" opacity=".7"');
  b += rect(0, 268, W, 92, 'url(#gr)') + rect(0, 266, W, 4, '#7dff3a') + rect(0, 266, W, 4, '#7dff3a', 'filter="url(#gl)"');
  for (let x = 0; x < W; x += 40) b += rect(x, 270, 40, 40, 'none', 'stroke="#4a4aff" stroke-opacity=".35"');
  for (const [x, y, w, h] of [[300, 210, 60, 58], [420, 170, 60, 98], [540, 210, 100, 58]]) b += rect(x, y, w, h, '#0a0a3a', 'stroke="#fff" stroke-width="3"') + rect(x + 6, y + 6, w - 12, h - 12, 'none', 'stroke="#3af0ff" stroke-opacity=".6" stroke-width="2"');
  for (const x of [240, 262, 380, 402]) b += path(`M${x} 266 L${x + 11} 236 L${x + 22} 266Z`, '#0a0a3a', 'stroke="#ff4fd8" stroke-width="3" stroke-linejoin="round"');
  b += path('M240 266 L251 236 L262 266Z M262 266 L273 236 L284 266Z', 'none', 'stroke="#ff4fd8" stroke-width="5" opacity=".6" filter="url(#gl)"');
  for (let i = 1; i < 7; i++) b += rect(170 - i * 26, 150 + i * 6, 34 - i * 3, 34 - i * 3, '#ffd21f', `opacity="${.5 - i * .06}"`);
  b += rect(90, 150, 140, 22, 'url(#tr)', 'opacity=".4"');
  b += g('transform="translate(196 140) rotate(32)"', rect(-26, -26, 52, 52, '#ffd21f', 'rx="4" stroke="#000" stroke-width="4"') + rect(-16, -14, 12, 12, '#3af0ff', 'stroke="#000" stroke-width="2.5"') + rect(4, -14, 12, 12, '#3af0ff', 'stroke="#000" stroke-width="2.5"') + rect(-16, 6, 32, 8, '#3af0ff', 'stroke="#000" stroke-width="2.5"'));
  b += circ(196, 140, 44, 'none', 'stroke="#fff" stroke-width="2" opacity=".35"');
  return T(defs, b);
};

THUMBS['bloons-td-6'] = () => {
  const defs = lg('gr', 0, 0, 0, 1, [[0, '#7cd04a'], [1, '#4a9a2a']]) + rg('bal', .35, .3, .8, [[0, '#fff', .55], [.4, '#fff', 0]]) + blur('sh', 3);
  let b = rect(0, 0, W, H, 'url(#gr)');
  const R = rng(7);
  for (let i = 0; i < 60; i++) b += path(`M${R() * W} ${R() * H} l3 -8 l3 8`, '#3f8a2a', 'opacity=".6"');
  const route = 'M-20 90 C120 90 140 40 240 70 C340 100 280 220 380 240 C480 260 520 150 660 170';
  b += path(route, 'none', 'stroke="#8a6a3a" stroke-width="58" stroke-linecap="round"') + path(route, 'none', 'stroke="#d8b878" stroke-width="46" stroke-linecap="round"') + path(route, 'none', 'stroke="#c8a464" stroke-width="2" stroke-dasharray="4 10"');
  for (const [x, y, s] of [[60, 250, 1.2], [560, 300, 1], [470, 60, .9], [140, 320, .8]]) b += circ(x, y, 34 * s, '#2f7a2a') + circ(x - 12 * s, y - 10 * s, 24 * s, '#3f9a34') + circ(x + 14 * s, y - 4 * s, 20 * s, '#4aa83e');
  const balloon = (x, y, c, s = 1) => g(`transform="translate(${x} ${y}) scale(${s})"`, path('M0 30 q-6 12 2 26', 'none', 'stroke="#fff" stroke-opacity=".6" stroke-width="1.5"') + ell(4, 30, 18, 6, '#000', 'opacity=".2"') + path('M0 -26 C20 -26 26 -6 22 8 C18 22 6 28 0 30 C-6 28 -18 22 -22 8 C-26 -6 -20 -26 0 -26Z', c) + path('M-4 30 L4 30 L0 36Z', shade(c, -.3)) + path('M0 -26 C20 -26 26 -6 22 8 C18 22 6 28 0 30 C-6 28 -18 22 -22 8 C-26 -6 -20 -26 0 -26Z', 'url(#bal)'));
  b += balloon(120, 70, '#e8322c') + balloon(196, 52, '#1f6ad8', .9) + balloon(268, 92, '#3fbf3a') + balloon(320, 190, '#f4c430', 1.1) + balloon(376, 226, '#ff6ac8', .95) + balloon(450, 224, '#ffffff', .9) + balloon(530, 176, '#1a1a1a', 1);
  // towers: stone dart tower and a cannon
  b += ell(208, 196, 40, 12, '#000', 'opacity=".25"') + rect(180, 120, 56, 76, '#8a8a92', 'rx="4"') + rect(174, 112, 68, 14, '#6a6a72', 'rx="3"');
  for (let x = 176; x < 240; x += 14) b += rect(x, 100, 9, 14, '#6a6a72');
  b += rect(198, 140, 20, 26, '#2a2a30', 'rx="10"') + path('M216 128 L262 112 L264 118 L218 134Z', '#5a3a20') + path('M262 108 L280 113 L264 122Z', '#c0c0c8');
  for (const [x, y] of [[290, 112], [312, 120]]) b += line(x, y, x + 18, y + 6, '#3a2a1a', 2.5) + path(`M${x + 18} ${y + 3} L${x + 26} ${y + 8} L${x + 17} ${y + 10}Z`, '#d0d0d8');
  b += ell(520, 302, 38, 11, '#000', 'opacity=".25"') + rect(492, 262, 56, 40, '#6a4a2a', 'rx="6"') + circ(520, 262, 24, '#3a3a42') + path('M520 252 L566 230 L572 244 L528 268Z', '#2a2a30') + circ(570, 237, 7, '#111');
  return T(defs, b, finish('v', .5));
};

THUMBS['flappy-bird'] = () => {
  const defs = lg('sky', 0, 0, 0, 1, [[0, '#4ec0e8'], [1, '#bdeef8']]);
  let b = rect(0, 0, W, H, 'url(#sky)');
  const px = (x, y, w, h, c) => rect(x, y, w, h, c);
  for (const [x, y, s] of [[60, 60, 1], [300, 40, 1.4], [520, 80, 1]]) b += px(x, y + 8 * s, 70 * s, 16 * s, '#fff') + px(x + 12 * s, y, 40 * s, 12 * s, '#fff') + px(x + 6 * s, y + 4 * s, 56 * s, 8 * s, '#fff');
  for (let x = 0; x < W; x += 36) { const h = 40 + ((x * 7) % 50); b += px(x, 268 - h, 34, h, '#a8e6c8') + px(x + 6, 268 - h + 8, 6, 6, '#e8fff4') + px(x + 20, 268 - h + 20, 6, 6, '#e8fff4'); }
  for (let x = 0; x < W; x += 24) b += px(x, 252 - (x % 48 ? 0 : 6), 24, 20, '#6ad88a');
  b += px(0, 290, W, 70, '#ded895') + px(0, 290, W, 10, '#7ac83a') + px(0, 300, W, 6, '#5aa82a');
  for (let x = 0; x < W; x += 20) b += px(x, 300, 10, 6, '#8ad84a');
  const pipe = (x, top, gapY, gap) => px(x, 0, 64, gapY, '#5ac83a') + px(x + 6, 0, 10, gapY, '#9aee6a') + px(x + 48, 0, 10, gapY, '#3a9a2a') + px(x - 6, gapY - 26, 76, 26, '#5ac83a') + px(x - 6, gapY - 26, 76, 4, '#1a3a10') + px(x - 6, gapY - 4, 76, 4, '#1a3a10') + px(x, gapY, 0, 0, '#000') +
    px(x, gapY + gap + 26, 64, 290 - gapY - gap - 26, '#5ac83a') + px(x + 6, gapY + gap + 26, 10, 290 - gapY - gap - 26, '#9aee6a') + px(x + 48, gapY + gap + 26, 10, 290 - gapY - gap - 26, '#3a9a2a') + px(x - 6, gapY + gap, 76, 26, '#5ac83a') + px(x - 6, gapY + gap, 76, 4, '#1a3a10') + px(x - 6, gapY + gap + 22, 76, 4, '#1a3a10');
  b += pipe(290, 0, 104, 120) + pipe(500, 0, 150, 110) + pipe(90, 0, 70, 120);
  // the bird: chunky pixel body, wing up, big eye, orange beak
  const s = 6, bx = 330, by = 140, B = (x, y, w, h, c) => px(bx + x * s, by + y * s, w * s, h * s, c);
  b += B(2, 0, 8, 1, '#222') + B(1, 1, 10, 1, '#222') + B(0, 2, 12, 6, '#222') + B(1, 8, 10, 1, '#222') + B(2, 9, 8, 1, '#222');
  b += B(2, 1, 6, 1, '#f8e04a') + B(1, 2, 8, 6, '#f8d030') + B(2, 8, 6, 1, '#f0a020') + B(1, 6, 7, 2, '#f0b020');
  b += B(7, 1, 3, 4, '#fff') + B(9, 2, 1, 2, '#222') + B(8, 5, 5, 2, '#f06a1a') + B(8, 7, 4, 1, '#d04a10') + B(0, 3, 4, 3, '#fff4c0') + B(-1, 2, 2, 2, '#fff4c0');
  for (let i = 0; i < 3; i++) b += px(bx - 28 - i * 18, by + 26 + i * 4, 10 - i * 2, 4, '#fff');
  return svg(W, H, defs + finish('v', .35).defs, b + finish('v', .35).body, { pixel: true });
};

THUMBS['space-invaders'] = () => {
  const defs = lg('bg', 0, 0, 0, 1, [[0, '#06021a'], [.6, '#1a0640'], [1, '#2a0a50']]) + blur('gl', 3) + blur('gl2', 8);
  let b = rect(0, 0, W, H, 'url(#bg)') + stars(90, 3);
  for (let i = 0; i < 9; i++) { const y = 250 + i * i * 2.4; b += line(0, y, W, y, '#ff4fd8', 1, `opacity="${.15 + i * .04}"`); }
  for (let i = -8; i <= 8; i++) b += line(320 + i * 14, 250, 320 + i * 90, 360, '#ff4fd8', 1, 'opacity=".2"');
  // three original pixel aliens (11x8) in rows
  const A = [
    ['00100000100', '00010001000', '00111111100', '01101110110', '11111111111', '10111111101', '10100000101', '00011011000'],
    ['00011111000', '01111111110', '11100100111', '11111111111', '00111011100', '01100000110', '00110001100', '11000000011'],
    ['00001110000', '00111111100', '01101110110', '11111111111', '01011111010', '00010001000', '00101010100', '01000000010'],
  ];
  const alien = (x, y, m, c, s = 4) => { let o = ''; m.forEach((row, j) => [...row].forEach((v, i) => { if (v === '1') o += rect(x + i * s, y + j * s, s, s, c); })); return o; };
  const cols = ['#3af0ff', '#ff4fd8', '#b44bff', '#7dff3a'];
  let al = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) if (!(r === 3 && (c === 2 || c === 5))) al += alien(70 + c * 64 + (r % 2) * 10, 30 + r * 46, A[r % 3], cols[r]);
  b += g('filter="url(#gl2)" opacity=".7"', al) + al;
  b += rect(206, 140, 4, 60, '#ff4fd8') + rect(206, 140, 4, 60, '#ff4fd8', 'filter="url(#gl)"') + rect(430, 180, 4, 50, '#3af0ff') + rect(318, 230, 4, 44, '#fff') + rect(318, 230, 4, 44, '#fff', 'filter="url(#gl)"');
  const R = rng(4); for (let i = 0; i < 14; i++) b += rect(250 + R() * 60, 180 + R() * 40, 4, 4, ['#ffd21f', '#ff6a1a', '#fff'][i % 3]);
  b += g('transform="translate(296 290)"', rect(0, 12, 48, 14, '#7dff3a') + rect(4, 6, 40, 8, '#7dff3a') + rect(20, 0, 8, 8, '#7dff3a')) + rect(296, 290, 48, 26, '#7dff3a', 'filter="url(#gl2)" opacity=".5"');
  return svg(W, H, defs + finish('v', .6).defs, b + finish('v', .6).body, { pixel: true });
};

THUMBS['pong'] = () => {
  const defs = rg('crt', .5, .5, .7, [[0, '#14181c'], [1, '#020304']]) + blur('gl', 4) + lg('trail', 1, 0, 0, 0, [[0, '#fff', .9], [1, '#fff', 0]]);
  let b = rect(0, 0, W, H, '#000') + rect(20, 16, 600, 328, 'url(#crt)', 'rx="38"');
  for (let y = 18; y < 344; y += 4) b += rect(20, y, 600, 1.5, '#fff', 'opacity=".035"');
  for (let y = 36; y < 330; y += 26) b += rect(318, y, 4, 14, '#fff', 'opacity=".55"');
  const dig = { 3: ['111', '001', '111', '001', '111'], 1: ['010', '110', '010', '010', '111'] };
  const D = (x, y, n) => { let o = ''; dig[n].forEach((r, j) => [...r].forEach((v, i) => { if (v === '1') o += rect(x + i * 9, y + j * 9, 9, 9, '#fff'); })); return o; };
  b += g('opacity=".85"', D(230, 40, 3) + D(380, 40, 1));
  b += rect(70, 120, 12, 70, '#fff') + rect(70, 120, 12, 70, '#fff', 'filter="url(#gl)"') + rect(558, 178, 12, 70, '#fff') + rect(558, 178, 12, 70, '#fff', 'filter="url(#gl)"');
  for (let i = 0; i < 8; i++) b += rect(420 - i * 28, 200 - i * 14, 12, 12, '#fff', `opacity="${.6 - i * .07}"`);
  b += rect(432, 206, 14, 14, '#fff') + rect(432, 206, 14, 14, '#fff', 'filter="url(#gl)"');
  b += rect(20, 16, 600, 328, 'none', 'rx="38" stroke="#1a1d22" stroke-width="10"');
  return T(defs, b, finish('v', .75));
};

THUMBS['tetris'] = () => {
  const defs = lg('bg', 0, 0, 1, 1, [[0, '#14103a'], [1, '#05061a']]) + blur('gl', 6);
  let b = rect(0, 0, W, H, 'url(#bg)');
  const C = { I: '#21d4e8', O: '#f8d030', T: '#b44bff', S: '#3fd04a', Z: '#f0383a', J: '#2a6ae8', L: '#f08a1a' };
  const S = 22, ox = 210, oy = 30, cell = (x, y, c, op = 1) => g(`opacity="${op}"`, rect(ox + x * S, oy + y * S, S, S, c) + path(`M${ox + x * S} ${oy + y * S}h${S}l-5 5h${-S + 10}v${S - 10}l-5 5Z`, '#fff', 'opacity=".35"') + path(`M${ox + x * S + S} ${oy + y * S + S}h${-S}l5 -5h${S - 10}v${-S + 10}l5 -5Z`, '#000', 'opacity=".3"'));
  b += rect(ox - 8, oy - 4, 10 * S + 16, 14 * S + 12, '#0a0a24', 'rx="6" stroke="#3a3a8a" stroke-width="2"');
  for (let x = 0; x <= 10; x++) b += line(ox + x * S, oy, ox + x * S, oy + 14 * S, '#2a2a6a', 1, 'opacity=".5"');
  const board = ['..........', '..........', '..........', '..........', '..........', '..........', '..........', '.....T....', '....TTT...', 'L......OO.', 'LLL.JJJOOZ', 'SS.IIII.ZZ', '.SSJJJLLLZ', 'IIIIOOSS.T'];
  board.forEach((row, y) => [...row].forEach((v, x) => { if (C[v]) b += cell(x, y, C[v], y >= 7 && y <= 8 ? 1 : 1); }));
  b += rect(ox, oy + 11 * S, 10 * S, S, '#fff', 'opacity=".22"') + rect(ox - 10, oy + 11 * S - 4, 10 * S + 20, S + 8, '#fff', 'opacity=".25" filter="url(#gl)"');
  for (const [x, y] of [[6, 9], [7, 9], [8, 9], [7, 10]]) b += rect(ox + x * S + 1, oy + y * S + 1, S - 2, S - 2, 'none', 'stroke="#b44bff" stroke-width="2" stroke-dasharray="4 3" opacity=".7"');
  const piece = (cells, c, x0, y0, r, s = 1) => g(`transform="translate(${x0} ${y0}) rotate(${r}) scale(${s})"`, cells.map(([x, y]) => rect(x * S, y * S, S, S, c, 'stroke="#000" stroke-opacity=".3"') + rect(x * S + 3, y * S + 3, S - 6, 4, '#fff', 'opacity=".35"')).join(''));
  b += piece([[0, 0], [1, 0], [2, 0], [3, 0]], C.I, 60, 70, -20, 1.1) + piece([[0, 0], [1, 0], [0, 1], [1, 1]], C.O, 520, 60, 15) + piece([[0, 0], [0, 1], [1, 1], [2, 1]], C.J, 70, 230, 12) + piece([[1, 0], [2, 0], [0, 1], [1, 1]], C.S, 500, 230, -18, 1.1);
  return T(defs, b);
};

THUMBS['snake'] = () => {
  const defs = lg('body', 0, 0, 1, 1, [[0, '#9aee4a'], [1, '#2f9a2a']]) + rg('ap', .35, .3, .7, [[0, '#ff8a7a'], [.5, '#e8222c'], [1, '#8a0a10']]) + blur('gl', 8);
  let b = rect(0, 0, W, H, '#0e2a14');
  for (let y = 0; y < H; y += 32) for (let x = 0; x < W; x += 32) if ((x + y) / 32 % 2) b += rect(x, y, 32, 32, '#123418');
  b += circ(470, 180, 90, '#e8222c', 'opacity=".22" filter="url(#gl)"');
  const coil = 'M60 300 C60 200 180 200 180 260 C180 320 300 320 300 240 C300 140 140 130 160 80 C180 30 320 40 360 120 C380 160 400 175 430 178';
  b += path(coil, 'none', 'stroke="#0a1a0c" stroke-width="44" stroke-linecap="round" opacity=".5" transform="translate(6 8)"');
  b += path(coil, 'none', 'stroke="url(#body)" stroke-width="40" stroke-linecap="round"') + path(coil, 'none', 'stroke="#1f6a1c" stroke-width="40" stroke-linecap="round" stroke-dasharray="2 14" opacity=".45"') + path(coil, 'none', 'stroke="#d8ff9a" stroke-width="6" stroke-linecap="round" opacity=".35" transform="translate(-6 -8)"');
  b += g('transform="translate(436 178) rotate(8)"', path('M-14 -24 L26 -16 L36 0 L26 16 L-14 24Z', '#5ad83a') + path('M-14 -24 L26 -16 L36 0 L-14 0Z', '#7aee4a') + circ(14, -10, 6, '#fff') + circ(16, -10, 3, '#111') + circ(14, 10, 6, '#fff') + circ(16, 10, 3, '#111') + path('M36 0 L52 0 L58 -5 M52 0 L58 5', 'none', 'stroke="#e8222c" stroke-width="3" stroke-linecap="round"'));
  b += ell(512, 214, 26, 8, '#000', 'opacity=".35"') + circ(510, 184, 28, 'url(#ap)') + path('M510 158 q4 -12 12 -16', 'none', 'stroke="#5a3a1a" stroke-width="4" stroke-linecap="round"') + path('M514 150 q18 -10 26 4 q-14 8 -26 -4Z', '#3fbf3a') + ell(500, 172, 7, 10, '#fff', 'opacity=".5"');
  for (const [x, y] of [[560, 120], [590, 250], [440, 290]]) b += circ(x, y, 3, '#d8ff9a', 'opacity=".6"');
  return T(defs, b);
};

THUMBS['pac-man'] = () => {
  const defs = blur('gl', 4) + blur('gl2', 10) + rg('pm', .4, .35, .7, [[0, '#fff27a'], [.6, '#ffd21f'], [1, '#e8a80a']]);
  let b = rect(0, 0, W, H, '#03051a');
  const walls = ['M40 40 H260 V100 H120 V160', 'M600 40 H380 V100 H520 V160', 'M40 320 H200 V250', 'M600 320 H440 V250', 'M260 180 H380 V250 H260Z', 'M120 220 V280', 'M520 220 V280'];
  for (const w of walls) b += path(w, 'none', 'stroke="#2a6aff" stroke-width="16" stroke-linejoin="round" stroke-linecap="round" filter="url(#gl2)" opacity=".7"') + path(w, 'none', 'stroke="#2a6aff" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"') + path(w, 'none', 'stroke="#03051a" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"');
  for (let x = 70; x < 600; x += 26) if (x < 230 || x > 410) b += circ(x, 200, 3.2, '#ffd9a8');
  for (let x = 300; x < 600; x += 26) b += circ(x, 140, 3.2, '#ffd9a8');
  b += circ(560, 200, 9, '#ffd9a8') + circ(560, 200, 14, '#ffd9a8', 'opacity=".3" filter="url(#gl)"');
  b += circ(180, 200, 46, '#ffd21f', 'opacity=".35" filter="url(#gl2)"') + path('M180 200 L222 178 A46 46 0 1 0 222 222Z', 'url(#pm)') + circ(184, 174, 6, '#03051a');
  const ghost = (x, y, c, look) => g(`transform="translate(${x} ${y})"`, path('M-26 26 V-2 A26 26 0 0 1 26 -2 V26 L17 18 L9 26 L0 18 L-9 26 L-17 18Z', c) + path('M-26 26 V-2 A26 26 0 0 1 26 -2 V26 L17 18 L9 26 L0 18 L-9 26 L-17 18Z', c, 'filter="url(#gl)" opacity=".6"') + ell(-9, -4, 8, 9, '#fff') + ell(9, -4, 8, 9, '#fff') + circ(-9 + look, -2, 4, '#1a2aa8') + circ(9 + look, -2, 4, '#1a2aa8'));
  b += ghost(330, 140, '#ff4f7a', -3) + ghost(470, 260, '#3af0ff', -3) + ghost(400, 92, '#ffa04a', -2);
  return T(defs, b);
};

THUMBS['2048'] = () => {
  const defs = rg('bg', .5, .4, .8, [[0, '#4a2e1c'], [1, '#160c06']]) + blur('gl', 14) + lg('t2048', 0, 0, 0, 1, [[0, '#ffe08a'], [1, '#e8b030']]);
  let b = rect(0, 0, W, H, 'url(#bg)');
  b += circ(410, 170, 110, '#ffcf5a', 'opacity=".35" filter="url(#gl)"');
  const tile = (x, y, n, s = 70) => {
    const c = { 2: '#efe4d8', 4: '#ecdcc0', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: 'url(#t2048)' }[n];
    const ink = n <= 4 ? '#776e65' : '#fff9ef', fs = n >= 1000 ? s * .3 : n >= 100 ? s * .38 : s * .46;
    return rect(x + 3, y + 6, s, s, '#000', 'rx="9" opacity=".3"') + rect(x, y, s, s, c, 'rx="9"') + rect(x + 4, y + 4, s - 8, s * .3, '#fff', 'rx="6" opacity=".12"') + text(x + s / 2, y + s / 2 + fs * .36, n, fs, ink, `${SANS} text-anchor="middle"`);
  };
  b += g('transform="translate(80 40) skewY(6) skewX(-8)"', rect(-10, -10, 330, 330, '#8a7462', 'rx="16"') + (() => { let o = ''; const grid = [[2, 8, 0, 4], [16, 64, 32, 2], [128, 256, 8, 0], [512, 0, 4, 2]]; grid.forEach((r, j) => r.forEach((n, i) => { o += n ? tile(i * 78 + 2, j * 78 + 2, n) : rect(i * 78 + 2, j * 78 + 2, 70, 70, '#a39080', 'rx="9"'); })); return o; })());
  b += g('transform="translate(360 108) rotate(-6)"', tile(-8, 8, 1024, 96) + tile(108, 0, 1024, 96)) + path('M455 160 l18 -10 v20Z', '#ffe08a', 'opacity=".8"');
  b += g('transform="translate(420 100) rotate(4)"', tile(0, 0, 2048, 150));
  for (const [x, y, r] of [[440, 90, 3], [600, 120, 2], [580, 270, 3], [470, 290, 2]]) b += circ(x, y, r, '#ffe08a');
  return T(defs, b);
};

THUMBS['minesweeper'] = () => {
  const defs = lg('bg', 0, 0, 1, 1, [[0, '#24323c'], [1, '#0e161c']]) + lg('cell', 0, 0, 1, 1, [[0, '#8aa0aa'], [1, '#5a6e78']]) + rg('mine', .35, .3, .7, [[0, '#6a7880'], [1, '#0a0e10']]) + blur('gl', 8);
  let b = rect(0, 0, W, H, 'url(#bg)');
  const S = 46, ox = 40, oy = 20;
  const revealed = new Set(['2,2', '3,2', '4,2', '2,3', '3,3', '4,3', '5,3', '3,4', '4,4', '5,4', '6,4', '4,5', '5,5', '6,5', '7,5', '3,5', '2,4']);
  const nums = { '2,2': 1, '3,2': 1, '4,2': 2, '2,3': 1, '5,3': 3, '2,4': 2, '6,4': 1, '3,5': 1, '7,5': 2, '4,3': 1 };
  const col = { 1: '#3a7aff', 2: '#3fbf5a', 3: '#ff4a5a' };
  for (let j = 0; j < 8; j++) for (let i = 0; i < 12; i++) {
    const x = ox + i * S, y = oy + j * S, k = `${i},${j}`;
    if (revealed.has(k)) { b += rect(x, y, S, S, '#1a262e', 'stroke="#2e3e48"'); if (nums[k]) b += text(x + S / 2, y + 32, nums[k], 28, col[nums[k]], `${SANS} text-anchor="middle"`); }
    else b += rect(x, y, S, S, 'url(#cell)') + path(`M${x} ${y}h${S}l-5 5h${-S + 10}v${S - 10}l-5 5Z`, '#d8e8ee', 'opacity=".6"') + path(`M${x + S} ${y + S}h${-S}l5 -5h${S - 10}v${-S + 10}l5 -5Z`, '#1a262e', 'opacity=".55"');
  }
  const flag = (x, y) => line(x, y + 30, x, y, '#1a1a1a', 3) + path(`M${x} ${y} L${x + 22} ${y + 8} L${x} ${y + 16}Z`, '#ff3a4a') + rect(x - 10, y + 28, 20, 5, '#1a1a1a');
  b += flag(ox + 5 * S + 22, oy + 2 * S + 8) + flag(ox + 1 * S + 22, oy + 4 * S + 8) + flag(ox + 8 * S + 22, oy + 5 * S + 8);
  const mx = ox + 9 * S + 23, my = oy + 2 * S + 23;
  b += circ(mx, my, 60, '#ff3a4a', 'opacity=".35" filter="url(#gl)"') + rect(mx - 23, my - 23, 46, 46, '#ff3a4a');
  for (let a = 0; a < 8; a++) { const r = a * Math.PI / 4; b += line(mx + Math.cos(r) * 10, my + Math.sin(r) * 10, mx + Math.cos(r) * 19, my + Math.sin(r) * 19, '#0a0e10', 4, 'stroke-linecap="round"'); }
  b += circ(mx, my, 13, 'url(#mine)') + circ(mx - 4, my - 4, 3.5, '#fff', 'opacity=".8"');
  return T(defs, b);
};

THUMBS['solitaire'] = () => {
  const defs = rg('felt', .5, .4, .8, [[0, '#1f7a4a'], [1, '#0a3a22']]);
  let b = rect(0, 0, W, H, 'url(#felt)');
  b += rect(14, 14, 612, 332, 'none', 'rx="14" stroke="#e9c46a" stroke-opacity=".45" stroke-width="2"');
  const mini = (x, y, rank, kind, r = 0) => card(x, y, r, rank, kind, { w: 62, h: 88 });
  b += mini(380, 66, 'A', 'heart') + mini(452, 66, '2', 'spade') + mini(524, 66, 'A', 'diamond') + rect(565, 22, 62, 88, 'none', 'rx="8" stroke="#e9c46a" stroke-opacity=".5" stroke-dasharray="5 5" transform="translate(-6 0)"');
  b += rect(40, 22, 62, 88, '#1a3a8a', 'rx="8" stroke="#fff" stroke-width="3"') + path('M50 32 h42 v68 h-42Z', 'none', 'stroke="#e9c46a" stroke-opacity=".6"') + suit('diamond', 71, 66, 24, '#e9c46a', 'opacity=".7"');
  const cols = [[['K', 'spade'], ['Q', 'heart'], ['J', 'club']], [['9', 'diamond'], ['8', 'club'], ['7', 'heart'], ['6', 'spade']], [['Q', 'club'], ['J', 'diamond']], [['10', 'heart'], ['9', 'spade'], ['8', 'heart']]];
  cols.forEach((col, i) => { for (let k = 0; k < 2; k++) b += rect(110 + i * 88 - 31, 150 + k * 10 - 44, 62, 88, '#1a3a8a', 'rx="8" stroke="#fff" stroke-width="2"'); col.forEach(([r, s], j) => { b += mini(110 + i * 88, 170 + j * 26, r, s); }); });
  b += g('transform="translate(526 230) rotate(14)"', rect(-27, -38, 62, 88, '#000', 'rx="8" opacity=".4" filter="url(#cs)" transform="translate(8 14)"')) + mini(526, 230, 'K', 'heart', 14);
  return svg(W, H, defs + blur('cs', 4) + finish().defs, b + finish().body);
};

THUMBS['wordle'] = () => {
  const defs = rg('bg', .5, .3, .9, [[0, '#2a2f3a'], [1, '#0c0e12']]) + blur('gl', 10);
  let b = rect(0, 0, W, H, 'url(#bg)');
  const rows = [['STORE', 'xxxxx'], ['PLANE', 'gyxxy'], ['PIXEL', 'ggggg']];
  const C = { g: '#4aa860', y: '#d8b440', x: '#3a3e46' };
  const S = 52, ox = 320 - (5 * S + 4 * 8) / 2, oy = 34;
  for (let r = 0; r < 6; r++) for (let i = 0; i < 5; i++) {
    const x = ox + i * (S + 8), y = oy + r * (S + 8) * .82;
    const row = rows[r];
    if (row) b += rect(x, y, S, S * .82, C[row[1][i]], 'rx="5"') + text(x + S / 2, y + S * .62, row[0][i], 28, '#fff', `${SANS} text-anchor="middle"`);
    else b += rect(x, y, S, S * .82, 'none', 'rx="5" stroke="#3a3e46" stroke-width="2"');
  }
  b += rect(ox - 10, oy + 2 * (S + 8) * .82 - 6, 5 * S + 52, S * .82 + 12, '#4aa860', 'rx="10" opacity=".35" filter="url(#gl)"');
  const keys = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  const kc = { P: 'g', I: 'g', X: 'g', E: 'g', L: 'g', S: 'x', T: 'x', O: 'x', R: 'x', A: 'x', N: 'x' };
  keys.forEach((row, j) => [...row].forEach((k, i) => { const x = 320 - row.length * 16 + i * 32, y = 270 + j * 28; b += rect(x, y, 28, 24, kc[k] ? C[kc[k]] : '#5a606c', 'rx="4"') + text(x + 14, y + 17, k, 12, '#fff', `${SANS} text-anchor="middle"`); }));
  return T(defs, b);
};

THUMBS['sudoku'] = () => {
  const defs = lg('bg', 0, 0, 1, 1, [[0, '#262a6a'], [1, '#0c0e30']]) + blur('gl', 8) + lg('paper', 0, 0, 0, 1, [[0, '#fbf7ec'], [1, '#ece4cc']]);
  let b = rect(0, 0, W, H, 'url(#bg)');
  b += g('transform="translate(120 40) skewX(-12) skewY(3)"', (() => {
    const S = 34, N = [[5, 3, 0, 0, 7, 0, 0, 0, 0], [6, 0, 0, 1, 9, 5, 0, 0, 0], [0, 9, 8, 0, 0, 0, 0, 6, 0], [8, 0, 0, 0, 6, 0, 0, 0, 3], [4, 0, 0, 8, 0, 3, 0, 0, 1], [7, 0, 0, 0, 2, 0, 0, 0, 6], [0, 6, 0, 0, 0, 0, 2, 8, 0], [0, 0, 0, 4, 1, 9, 0, 0, 5]];
    let o = rect(-6, -6, 9 * S + 12, 8 * S + 12, '#000', 'opacity=".35" rx="6" transform="translate(10 14)"') + rect(-6, -6, 9 * S + 12, 8 * S + 12, 'url(#paper)', 'rx="6"');
    o += rect(4 * S, 0, S, 8 * S, '#e8d7a8', 'opacity=".5"') + rect(0, 4 * S, 9 * S, S, '#e8d7a8', 'opacity=".5"') + rect(4 * S, 4 * S, S, S, '#f4c040');
    for (let i = 0; i <= 9; i++) o += line(i * S, 0, i * S, 8 * S, '#2a2e6a', i % 3 ? 1 : 3);
    for (let j = 0; j <= 8; j++) o += line(0, j * S, 9 * S, j * S, '#2a2e6a', j % 3 ? 1 : 3);
    N.forEach((r, j) => r.forEach((n, i) => { if (n) o += text(i * S + S / 2, j * S + 25, n, 21, i === 4 && j === 4 ? '#fff' : '#1a1e5a', `${SERIF} text-anchor="middle"`); else if ((i + j) % 4 === 0) o += text(i * S + 6, j * S + 12, `${(i % 3) + 2} ${(j % 3) + 4}`, 8, '#7a7ab0', MONO); }));
    o += text(4 * S + S / 2, 4 * S + 25, 5, 22, '#1a1e5a', `${SERIF} text-anchor="middle"`);
    return o;
  })());
  b += g('transform="translate(500 190) rotate(38)"', rect(-8, -110, 16, 150, '#f4c040') + rect(-8, -110, 5, 150, '#ffd970') + rect(-8, -122, 16, 14, '#e87a8a') + rect(-8, -110, 16, 6, '#c0c0c8') + path('M-8 40 L0 62 L8 40Z', '#e8c8a0') + path('M-3 54 L0 62 L3 54Z', '#333'));
  b += circ(270, 180, 80, '#f4c040', 'opacity=".12" filter="url(#gl)"');
  return T(defs, b);
};
