// 16:9 promotional thumbnails, part 3.
import { svg, lg, rg, blur, rect, circ, ell, path, line, g, text, rng, poly, finish, stars, SANS, SERIF, MONO, shade, iso, voxel, f } from './lib.mjs';
const W = 640, H = 360;
const T = (defs, body, v = finish()) => svg(W, H, defs + v.defs, body + v.body);
export const THUMBS = {};

// a chess knight silhouette in a 100x120 box (base at y=120)
export const KNIGHT = 'M18 120 H86 V110 H78 C78 92 70 82 72 64 C74 40 62 16 36 10 L30 0 L24 12 C14 16 8 28 6 40 L4 56 C4 62 10 66 16 62 L26 54 C30 52 34 52 38 54 C30 66 20 76 22 110 H18Z';

THUMBS['block-blast'] = () => {
  const defs = lg('bg', 0, 0, 1, 1, [[0, '#1a2a8a'], [1, '#080e3a']]) + blur('gl', 8);
  let b = rect(0, 0, W, H, 'url(#bg)');
  const S = 32, ox = 190, oy = 22, C = ['#ff8a2a', '#3af0ff', '#b44bff', '#3fd06a', '#ffd23a', '#ff4f7a'];
  b += rect(ox - 10, oy - 10, 8 * S + 20, 8 * S + 20, '#0a1450', 'rx="14" stroke="#3a5aff" stroke-opacity=".5" stroke-width="2"');
  const blk = (x, y, c, s = S) => rect(x + 1, y + 1, s - 2, s - 2, c, 'rx="6"') + rect(x + 4, y + 4, s - 8, (s - 8) * .35, '#fff', 'opacity=".4" rx="3"') + rect(x + 1, y + s * .7, s - 2, s * .3 - 1, '#000', 'opacity=".18" rx="4"');
  const board = ['........', '..22....', '..2.11..', '33333333', '.5..11..', '.55.4...', '..5.44..', '6..444.6'];
  board.forEach((r, j) => [...r].forEach((v, i) => { const x = ox + i * S, y = oy + j * S; b += v === '.' ? rect(x + 1, y + 1, S - 2, S - 2, '#13207a', 'rx="6"') : blk(x, y, C[+v - 1]); }));
  b += rect(ox - 14, oy + 3 * S - 6, 8 * S + 28, S + 12, '#3af0ff', 'opacity=".35" rx="10" filter="url(#gl)"') + rect(ox, oy + 3 * S, 8 * S, S, '#fff', 'opacity=".25" rx="6"');
  const piece = (cells, c, x0, y0, s = 26) => cells.map(([x, y]) => blk(x0 + x * s, y0 + y * s, c, s)).join('');
  b += rect(40, 70, 110, 220, '#0a1450', 'rx="14" opacity=".7"') + piece([[0, 0], [1, 0], [1, 1]], C[1], 58, 96) + piece([[0, 0], [0, 1], [0, 2], [1, 2]], C[3], 70, 180);
  b += rect(490, 70, 110, 220, '#0a1450', 'rx="14" opacity=".7"') + piece([[0, 0], [1, 0], [2, 0]], C[0], 506, 110) + piece([[0, 0], [1, 0], [0, 1], [1, 1]], C[4], 520, 190);
  return T(defs, b);
};

THUMBS['chess'] = () => {
  const defs = lg('bg', 0, 0, 0, 1, [[0, '#14100a'], [1, '#050302']]) + lg('ivory', 0, 0, 1, 1, [[0, '#fffaf0'], [1, '#c8b890']]) + lg('ebony', 0, 0, 1, 1, [[0, '#4a4a52'], [1, '#08080a']]) + rg('spot', .5, .2, .6, [[0, '#ffd890', .4], [1, '#ffd890', 0]]) + blur('gl', 3);
  let b = rect(0, 0, W, H, 'url(#bg)') + ell(320, 60, 360, 220, 'url(#spot)');
  // board in perspective: rows shrink toward the horizon
  const rows = 8, y0 = 160, y1 = 360, xl = x => x;
  for (let j = 0; j < rows; j++) {
    const ya = y0 + (y1 - y0) * Math.pow(j / rows, 1.3), yb = y0 + (y1 - y0) * Math.pow((j + 1) / rows, 1.3);
    const wa = 220 + j * 52, wb = 220 + (j + 1) * 52;
    for (let i = 0; i < 8; i++) { const xa0 = 320 - wa + i * wa / 4, xa1 = xa0 + wa / 4, xb0 = 320 - wb + i * wb / 4, xb1 = xb0 + wb / 4; b += path(poly([[xa0, ya], [xa1, ya], [xb1, yb], [xb0, yb]]), (i + j) % 2 ? '#2a1c10' : '#c8a87a'); }
  }
  b += path(poly([[100, 160], [540, 160], [540, 158], [100, 158]]), '#e9c46a');
  const knight = (x, y, s, fill, rim) => g(`transform="translate(${x} ${y}) scale(${s})"`, ell(52, 122, 46, 9, '#000', 'opacity=".5"') + path(KNIGHT, fill) + path(KNIGHT, 'none', `stroke="${rim}" stroke-width="2"`) + circ(30, 30, 3.5, rim === '#e9c46a' ? '#e9c46a' : '#111'));
  const pawn = (x, y, s, fill) => g(`transform="translate(${x} ${y}) scale(${s})"`, ell(0, 50, 22, 5, '#000', 'opacity=".5"') + path('M-18 50 H18 V44 H12 C12 30 6 22 8 14 A12 12 0 1 0 -8 14 C-6 22 -12 30 -12 44 H-18Z', fill));
  b += pawn(150, 240, 1, 'url(#ebony)') + pawn(470, 250, 1.1, 'url(#ivory)') + pawn(210, 200, .7, 'url(#ivory)') + pawn(420, 196, .7, 'url(#ebony)');
  b += g('transform="translate(392 110) scale(1.15)"', ell(0, 120, 36, 8, '#000', 'opacity=".5"') + path('M-30 120 H30 V110 H22 C22 88 14 70 16 50 L22 40 H-22 L-16 50 C-14 70 -22 88 -22 110 H-30Z', 'url(#ebony)') + rect(-24, 30, 48, 10, 'url(#ebony)') + path('M-4 30 V12 H-12 V6 H-4 V-2 H4 V6 H12 V12 H4 V30Z', 'url(#ebony)') + path('M-30 120 H30', 'none', 'stroke="#e9c46a" stroke-width="2"'));
  b += knight(200, 82, 1.45, 'url(#ivory)', '#e9c46a');
  b += path('M226 96 C250 110 260 140 250 170', 'none', 'stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"');
  return T(defs, b, finish('v', .6));
};

THUMBS['fruit-ninja'] = () => {
  const defs = lg('bg', 0, 0, 1, 1, [[0, '#3a4048'], [1, '#14181c']]) + blur('gl', 5) + lg('blade', 0, 1, 1, 0, [[0, '#fff', 0], [.5, '#fff', .95], [1, '#bff', 0]]);
  let b = rect(0, 0, W, H, 'url(#bg)');
  for (let y = 0; y < H; y += 60) b += rect(0, y, W, 58, '#2a2f36', 'opacity=".5"') + line(0, y + 58, W, y + 58, '#1a1e22', 2);
  const splat = (x, y, c, s) => { const R = rng(x * 3 + y); let o = ''; for (let i = 0; i < 9; i++) { const a = R() * 6.283, d = 20 + R() * 40 * s; o += circ(x + Math.cos(a) * d, y + Math.sin(a) * d, 3 + R() * 8 * s, c, 'opacity=".75"'); } return circ(x, y, 26 * s, c, 'opacity=".6"') + o; };
  b += splat(150, 250, '#e8222c', 1.2) + splat(470, 110, '#f8a020', 1) + splat(520, 280, '#9ae84a', .8);
  // watermelon halves
  b += g('transform="translate(170 200) rotate(-20)"', path('M-70 0 A70 70 0 0 0 70 0Z', '#2a8a3a') + path('M-62 0 A62 62 0 0 0 62 0Z', '#e8f0b0') + path('M-56 0 A56 56 0 0 0 56 0Z', '#e8323c') + [[-30, 14], [-10, 24], [12, 22], [32, 12], [0, 40]].map(([x, y]) => ell(x, y, 3, 5, '#1a1010')).join(''));
  b += g('transform="translate(210 160) rotate(-200)"', path('M-70 0 A70 70 0 0 0 70 0Z', '#2a8a3a') + path('M-62 0 A62 62 0 0 0 62 0Z', '#e8f0b0') + path('M-56 0 A56 56 0 0 0 56 0Z', '#e8323c'));
  // orange halves + kiwi + whole apple
  b += g('transform="translate(450 140) rotate(15)"', circ(0, 0, 40, '#f8a020') + circ(0, 0, 33, '#ffc860') + [...Array(8)].map((_, i) => line(0, 0, Math.cos(i * .785) * 30, Math.sin(i * .785) * 30, '#f8a020', 2)).join(''));
  b += g('transform="translate(500 250)"', circ(0, 0, 32, '#7a5a2a') + circ(0, 0, 27, '#8ad83a') + circ(0, 0, 10, '#f0f8d0') + [...Array(10)].map((_, i) => circ(Math.cos(i * .628) * 16, Math.sin(i * .628) * 16, 2, '#1a1a1a')).join(''));
  b += circ(330, 290, 34, '#d8222c') + ell(320, 278, 8, 12, '#fff', 'opacity=".4"') + path('M330 256 q4 -12 10 -14', 'none', 'stroke="#5a3a1a" stroke-width="4"') + path('M334 250 q16 -12 24 2 q-14 6 -24 -2Z', '#3fbf3a');
  b += path('M60 330 Q320 170 600 30', 'none', 'stroke="url(#blade)" stroke-width="14" stroke-linecap="round" filter="url(#gl)"') + path('M60 330 Q320 170 600 30', 'none', 'stroke="url(#blade)" stroke-width="4" stroke-linecap="round"');
  return T(defs, b);
};

THUMBS['subway-surfers'] = () => {
  const defs = lg('sky', 0, 0, 0, 1, [[0, '#3a9aff'], [1, '#bfe4ff']]) + lg('tr', 0, 0, 0, 1, [[0, '#f8d030'], [1, '#e89a10']]) + blur('mb', 2);
  let b = rect(0, 0, W, H, 'url(#sky)');
  for (let i = 0; i < 9; i++) { const x = i * 76 - 10, h = 90 + (i * 37 % 80); b += rect(x, 150 - h, 70, h + 30, ['#ff8a5a', '#5ac8e8', '#f8d030', '#b88aff'][i % 4], 'opacity=".85"'); for (let wy = 160 - h; wy < 160; wy += 18) b += rect(x + 10, wy, 12, 10, '#fff', 'opacity=".5"') + rect(x + 40, wy, 12, 10, '#fff', 'opacity=".5"'); }
  b += path('M0 170 L640 170 L640 360 L0 360Z', '#6a6a72');
  b += rect(0, 140, 200, 40, '#d84a8a') + text(20, 170, 'GO!', 30, '#ffe8a0', `${SANS} letter-spacing="2"`) + path('M120 150 q20 -10 40 4 q10 10 30 2', 'none', 'stroke="#3af0ff" stroke-width="6" stroke-linecap="round"');
  const VP = [320, 120];
  for (const x of [-220, -80, 80, 220]) b += line(320 + x * .12, 172, 320 + x * 1.6, 360, '#c0c0c8', 4);
  for (let j = 0; j < 9; j++) { const t = Math.pow(j / 9, 1.6), y = 172 + t * 188, w = 50 + t * 520; b += rect(320 - w / 2, y, w, 3 + t * 8, '#4a3a2a', 'opacity=".9"'); }
  // oncoming train (original design) in the left lane
  b += g('transform="translate(196 190)"', path('M-56 0 Q-56 -60 0 -64 Q56 -60 56 0 L56 130 L-56 130Z', 'url(#tr)') + rect(-44, -44, 88, 40, '#2a3a5a', 'rx="10"') + rect(-40, -40, 34, 32, '#8ad0ff', 'opacity=".6" rx="6"') + rect(-56, 30, 112, 14, '#d84a3a') + circ(-34, 80, 10, '#fff8d0') + circ(34, 80, 10, '#fff8d0') + rect(-20, 96, 40, 20, '#3a3a40', 'rx="3"'));
  // runner mid-jump (hoodie, cap, backpack)
  b += g('transform="translate(420 200) rotate(-10)"', ell(0, 120, 30, 6, '#000', 'opacity=".3"') + path('M-18 -20 Q0 -36 18 -20 L22 30 L-22 30Z', '#2a8aff') + rect(-26, -14, 12, 34, '#f8d030', 'rx="5"') + circ(0, -34, 14, '#f0b890') + path('M-16 -40 Q0 -58 18 -40 L26 -38 L-16 -36Z', '#e8322c') + line(-8, 30, -24, 62, '#2a2a40', 10, 'stroke-linecap="round"') + line(10, 30, 26, 52, '#2a2a40', 10, 'stroke-linecap="round"') + line(26, 52, 38, 66, '#fff', 9, 'stroke-linecap="round"') + line(-24, 62, -12, 76, '#fff', 9, 'stroke-linecap="round"') + line(16, -16, 40, -40, '#2a8aff', 9, 'stroke-linecap="round"') + line(-16, -12, -36, 6, '#2a8aff', 9, 'stroke-linecap="round"'));
  for (let i = 0; i < 5; i++) b += circ(480 + i * 22, 150 - i * 14, 9, '#f8d030', 'stroke="#c08a10" stroke-width="3"');
  return T(defs, b, finish('v', .4));
};

THUMBS['wreck-run'] = () => {
  const defs = lg('sky', 0, 0, 0, 1, [[0, '#ff9a4a'], [1, '#ffd8a0']]) + lg('road', 0, 0, 0, 1, [[0, '#4a4440'], [1, '#2a2622']]) + blur('gl', 4) + blur('sm', 7);
  let b = rect(0, 0, W, H, 'url(#sky)');
  for (let i = 0; i < 7; i++) { const x = i * 96 - 20, h = 80 + (i * 29 % 70); b += rect(x, 170 - h, 88, h, ['#8a5a4a', '#5a6a7a', '#a87a4a', '#6a4a5a'][i % 4]) + rect(x, 170 - h + 30, 88, 12, ['#e8322c', '#f8d030', '#3ac8e8', '#fff'][i % 4], 'opacity=".85"'); for (let wy = 170 - h + 52; wy < 160; wy += 22) b += rect(x + 12, wy, 18, 12, '#ffe8a0', 'opacity=".6"') + rect(x + 52, wy, 18, 12, '#2a2a30', 'opacity=".6"'); }
  b += path('M0 170 H640 V360 H0Z', 'url(#road)') + path('M0 260 H640', 'none', 'stroke="#f8d030" stroke-width="6" stroke-dasharray="40 30"');
  b += circ(380, 200, 70, '#ffb040', 'opacity=".5" filter="url(#sm)"');
  for (let i = 0; i < 8; i++) b += circ(170 - i * 22, 270 + (i % 2) * 10, 16 + i * 4, '#d8d0c8', `opacity="${.5 - i * .05}" filter="url(#sm)"`);
  // hatchback, slightly crumpled, nitro flame
  b += g('transform="translate(290 240) rotate(-8)"', ell(0, 44, 110, 14, '#000', 'opacity=".35"') + path('M-110 -2 Q-118 -24 -96 -30 L-50 -34 L-24 -66 L50 -66 L84 -32 L112 -24 Q122 -10 116 12 L-104 16Z', '#e8641a') + path('M-20 -60 L44 -60 L72 -32 L-42 -32Z', '#2a3a4a') + path('M18 -60 L24 -32', 'none', 'stroke="#e8641a" stroke-width="6"') + path('M-20 -60 L2 -46 L-6 -36', 'none', 'stroke="#fff" stroke-width="1.5" opacity=".7"') + path('M84 -24 l10 8 l-6 6 l12 4', 'none', 'stroke="#5a2a0a" stroke-width="3"') + rect(100, -18, 16, 10, '#fff8d0', 'rx="3"') + rect(-112, -10, 12, 10, '#ff3a3a', 'rx="2"') + circ(-62, 14, 24, '#1a1a1a') + circ(-62, 14, 10, '#8a8a90') + circ(70, 14, 24, '#1a1a1a') + circ(70, 14, 10, '#8a8a90') + path('M-114 2 L-170 -6 L-150 4 L-176 14Z', '#3af0ff', 'filter="url(#gl)"') + path('M-114 4 L-150 2 L-140 6 L-152 10Z', '#fff'));
  // smashed things flying: cones, a bin, a gnome
  b += g('transform="translate(440 150) rotate(30)"', path('M-14 20 L0 -24 L14 20Z', '#ff6a1a') + rect(-8, -4, 16, 6, '#fff') + rect(-18, 18, 36, 6, '#ff6a1a'));
  b += g('transform="translate(500 210) rotate(-40)"', rect(-16, -22, 32, 44, '#3a8a4a', 'rx="4"') + rect(-18, -26, 36, 8, '#2a6a3a', 'rx="3"'));
  b += g('transform="translate(410 90) rotate(-25)"', path('M-10 0 L0 -26 L10 0Z', '#e8222c') + circ(0, 6, 10, '#f0c8a0') + path('M-10 10 Q0 30 10 10Z', '#fff') + rect(-10, 16, 20, 16, '#3a6ae8', 'rx="4"'));
  for (let i = 0; i < 16; i++) { const a = -1 + i * .14, d = 40 + (i % 4) * 18; b += line(400 + Math.cos(a) * 20, 190 + Math.sin(a) * 20, 400 + Math.cos(a) * d, 190 + Math.sin(a) * d, '#fff2a0', 3, 'stroke-linecap="round"'); }
  b += text(36, 62, 'x6 COMBO', 26, '#fff', `${SANS} font-style="italic" stroke="#5a2a0a" stroke-width="5" paint-order="stroke"`);
  return T(defs, b, finish('v', .45));
};

THUMBS['nosy-neighbour'] = () => {
  const defs = lg('sky', 0, 0, 0, 1, [[0, '#0a1030'], [.6, '#1a2a5a'], [1, '#3a3a6a']]) + rg('moon', .5, .5, .5, [[0, '#fff8e0'], [.5, '#fff2c0', .6], [1, '#fff2c0', 0]]) + blur('gl', 6) + lg('lawn', 0, 0, 0, 1, [[0, '#1a3a2a'], [1, '#0a1a10']]);
  let b = rect(0, 0, W, H, 'url(#sky)') + stars(70, 12, W, 200) + circ(520, 60, 70, 'url(#moon)') + circ(520, 60, 26, '#fff8e0');
  b += path('M0 300 Q160 270 320 284 T640 276 V360 H0Z', 'url(#lawn)');
  // the crooked stacked house: every floor a different colour, shoved sideways
  const floor = (x, y, w, h, c, rot = 0, win = []) => g(`transform="rotate(${rot} ${x + w / 2} ${y + h})"`, rect(x, y, w, h, c) + rect(x, y, w, 6, '#f4ecd8') + rect(x - 4, y + h - 4, w + 8, 6, '#f4ecd8') + win.map(([wx, lit]) => rect(x + wx, y + 16, 22, 26, lit ? '#ffc35a' : '#1a1e2a', 'stroke="#f4ecd8" stroke-width="3"') + (lit ? rect(x + wx - 6, y + 10, 34, 38, '#ffb040', 'opacity=".25" filter="url(#gl)"') : '')).join(''));
  b += floor(220, 236, 200, 60, '#2a8aa8', 0, [[20, 1], [90, 0], [158, 1]]) + rect(308, 254, 26, 42, '#d23a3a', 'stroke="#f4ecd8" stroke-width="3"');
  b += floor(200, 176, 190, 60, '#e09a3a', -2, [[24, 0], [100, 1], [150, 0]]) + floor(240, 120, 170, 58, '#b24a30', 3, [[18, 1], [84, 0], [130, 1]]) + floor(214, 70, 150, 52, '#5ab88a', -3, [[30, 0], [100, 1]]);
  b += path('M200 72 L290 18 L380 72Z', '#2c4a6a', 'transform="rotate(-3 290 72)"') + rect(330, 20, 16, 40, '#8a3a2a', 'transform="rotate(8 338 40)"');
  for (const [x, y, r] of [[200, 236, -30], [410, 176, 30], [214, 122, -25]]) b += line(x, y, x + (r < 0 ? 18 : -18), y - 30, '#5a3a26', 6);
  // the tram track sweeping behind and the windmill
  b += path('M60 140 Q320 100 600 150', 'none', 'stroke="#3a4a5a" stroke-width="10"') + path('M60 140 Q320 100 600 150', 'none', 'stroke="#c0c0c8" stroke-width="2" stroke-dasharray="8 6"');
  for (const x of [80, 560]) b += rect(x, 140, 8, 160, '#2a3440');
  b += g('transform="translate(440 70)"', rect(-8, 0, 16, 50, '#f0e0c0') + [0, 1, 2, 3].map(i => rect(-4, -46, 8, 46, '#f4ecd8', `transform="rotate(${i * 90 + 20})"`)).join('') + circ(0, 0, 5, '#8a2c26'));
  // the player, small, in the foreground with a torch beam
  b += path('M120 330 L300 250 L300 280Z', '#fff2c0', 'opacity=".12"') + g('transform="translate(110 300)"', circ(0, -26, 8, '#1a1e2a') + rect(-8, -18, 16, 26, '#1a1e2a', 'rx="5"') + rect(-7, 8, 5, 16, '#1a1e2a') + rect(2, 8, 5, 16, '#1a1e2a'));
  b += g('transform="translate(355 140)"', rect(-6, -4, 12, 26, '#ffc35a') + circ(0, 4, 4, '#1a1010') + rect(-5, 8, 10, 12, '#1a1010'));
  for (let x = 20; x < W; x += 16) b += rect(x, 306, 8, 30, '#e8e0d0', 'opacity=".8"');
  b += rect(0, 314, W, 4, '#e8e0d0', 'opacity=".8"');
  return T(defs, b, finish('v', .55));
};

THUMBS['getting-over-it'] = () => {
  const defs = lg('sky', 0, 0, 0, 1, [[0, '#5ab0e8'], [1, '#d8eef8']]) + lg('rock', 0, 0, 1, 1, [[0, '#9aa0a8'], [1, '#4a5058']]);
  let b = rect(0, 0, W, H, 'url(#sky)');
  b += path('M0 200 L80 140 L150 170 L240 90 L320 150 L420 60 L520 130 L640 80 V360 H0Z', '#b8c4d0', 'opacity=".7"') + path('M420 60 L404 84 L436 84Z M240 90 L228 108 L254 108Z', '#fff');
  b += path('M0 360 L0 250 L110 220 L180 240 L260 150 L320 168 L380 110 L470 130 L540 70 L640 100 V360Z', 'url(#rock)');
  b += path('M260 150 L320 168 L300 200 L230 190Z M380 110 L470 130 L440 160 L370 150Z', '#6a7078');
  for (const [x, y, r] of [[120, 300, 40], [560, 260, 50], [330, 280, 30]]) b += ell(x, y, r, r * .7, '#5a6068') + ell(x - r * .3, y - r * .3, r * .3, r * .15, '#b8c0c8', 'opacity=".5"');
  // the man in the pot with his hammer on the ledge
  b += g('transform="translate(296 140) scale(1.9)"', path('M-26 0 Q-30 34 0 36 Q30 34 26 0Z', '#1d1c1b') + ell(0, 0, 27, 7, '#33312e') + circ(0, -14, 11, '#e8b890') + rect(-12, -10, 24, 12, '#4a6a3a', 'rx="4"') + path('M-4 -30 q10 -4 12 4 Z', '#3a2a1a') + line(6, -6, 70, -60, '#8a6a4a', 5, 'stroke-linecap="round"') + rect(58, -78, 30, 16, '#4a4a52', 'rx="3" transform="rotate(-40 73 -70)"'));
  for (const [x, y] of [[480, 40], [500, 52], [180, 60]]) b += path(`M${x} ${y} q6 -6 12 0 q6 -6 12 0`, 'none', 'stroke="#3a4a5a" stroke-width="2"');
  return T(defs, b, finish('v', .4));
};

THUMBS['blockforge'] = () => {
  const defs = lg('sky', 0, 0, 0, 1, [[0, '#6ac0ff'], [1, '#d8f0ff']]) + rg('sun', .5, .5, .5, [[0, '#fff8d0'], [1, '#fff8d0', 0]]);
  let b = rect(0, 0, W, H, 'url(#sky)') + circ(110, 60, 70, 'url(#sun)') + circ(110, 60, 22, '#fffbe0');
  for (let a = 0; a < 8; a++) { const r = .3 + a * .12; b += path(`M110 60 L${110 + Math.cos(r) * 700} ${60 + Math.sin(r) * 700} L${110 + Math.cos(r + .04) * 700} ${60 + Math.sin(r + .04) * 700}Z`, '#fff', 'opacity=".07"'); }
  const I = iso(340, 30, 24);
  const height = (x, y) => Math.max(0, Math.round(3 + 2.2 * Math.sin(x * .7) + 1.6 * Math.cos(y * .9) - (x + y > 15 ? 2 : 0)));
  const cells = [];
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) cells.push([x, y]);
  cells.sort((a, b2) => (a[0] + a[1]) - (b2[0] + b2[1]));
  for (const [x, y] of cells) {
    const h = height(x, y), water = h <= 1 && x + y > 9;
    for (let z = 0; z < h; z++) b += voxel(I, x, y, z, 1, 1, 1, z === h - 1 ? '#5aaa3a' : z > h - 3 ? '#8a5a32' : '#7a7a82');
    if (water) b += I.box(x, y, h, 1, 1, .8, '#3a9ae8', '#2a7ac8', '#1a6ab8', 'opacity=".85"');
    if (!water && (x * 7 + y * 3) % 13 === 0 && h > 1) { b += voxel(I, x + .35, y + .35, h, .3, .3, 1.6, '#6a4a2a'); b += voxel(I, x - .2, y - .2, h + 1.6, 1.4, 1.4, 1.1, '#2f8a2f') + voxel(I, x + .1, y + .1, h + 2.7, .8, .8, .6, '#3a9a3a'); }
  }
  return T(defs, b, finish('v', .35));
};

THUMBS['apex-gp'] = () => {
  const defs = lg('bg', 0, 0, 0, 1, [[0, '#08080c'], [1, '#1a1014']]) + lg('road', 0, 0, 0, 1, [[0, '#2a2c32'], [1, '#14151a']]) + lg('body', 0, 0, 0, 1, [[0, '#ff4a4a'], [.5, '#d81a22'], [1, '#7a0a10']]) + blur('mb', 3) + blur('gl', 10) + lg('carbon', 0, 0, 1, 1, [[0, '#2a2a30'], [1, '#0a0a0c']]);
  let b = rect(0, 0, W, H, 'url(#bg)');
  for (let i = 0; i < 14; i++) b += circ(30 + i * 46, 60 + (i % 3) * 6, 5, '#fff2d0', 'opacity=".8"') + circ(30 + i * 46, 60 + (i % 3) * 6, 18, '#fff2d0', 'opacity=".15" filter="url(#gl)"');
  b += rect(0, 90, W, 50, '#14141c') + rect(0, 96, W, 3, '#d81a22', 'opacity=".6"');
  b += path('M-20 360 L-20 220 Q320 150 660 190 L660 360Z', 'url(#road)');
  b += path('M-20 220 Q320 150 660 190', 'none', 'stroke="#fff" stroke-width="10" stroke-dasharray="22 22"') + path('M-20 220 Q320 150 660 190', 'none', 'stroke="#e8222c" stroke-width="10" stroke-dasharray="22 22" stroke-dashoffset="22"');
  for (let i = 0; i < 12; i++) b += line(0, 230 + i * 10, 200 - i * 8, 236 + i * 10, '#fff', 1.5, `opacity="${.25 - i * .015}"`);
  // open-wheel car, three-quarter side view, original livery
  b += g('transform="translate(330 238) rotate(-5) scale(1.38)"',
    ell(0, 40, 200, 14, '#000', 'opacity=".55"') +
    path('M-190 10 L-150 -6 L-40 -16 L30 -30 L90 -30 L130 -14 L190 -6 L200 12 L-190 22Z', 'url(#body)') +
    path('M-40 -16 L30 -30 L90 -30 L110 -18Z', '#f0f0f4') + path('M10 -30 Q30 -52 60 -30Z', 'url(#carbon)') + circ(38, -38, 9, '#f4c430') +
    path('M-196 -30 L-150 -30 L-150 -20 L-196 -18Z', 'url(#carbon)') + rect(-180, -24, 8, 30, '#222') + path('M180 4 L224 2 L226 16 L182 18Z', 'url(#carbon)') +
    path('M-120 4 H60', 'none', 'stroke="#fff" stroke-width="3" opacity=".6"') + text(-60, 0, '27', 18, '#fff', `${SANS} font-style="italic"`) +
    circ(-130, 18, 30, '#111') + circ(-130, 18, 22, '#1a1a1e') + circ(-130, 18, 9, '#8a8a90') + circ(130, 20, 28, '#111') + circ(130, 20, 20, '#1a1a1e') + circ(130, 20, 8, '#8a8a90') +
    path('M-140 -4 Q-130 -10 -120 -4', 'none', 'stroke="#ffd23a" stroke-width="3"') + path('M120 -2 Q130 -8 140 -2', 'none', 'stroke="#ffd23a" stroke-width="3"'));
  b += path('M180 236 L350 220', 'none', 'stroke="#fff" stroke-width="2" opacity=".3"') + rect(140, 214, 60, 8, '#fff', 'opacity=".15" filter="url(#mb)"');
  return T(defs, b, finish('v', .55));
};

THUMBS['2-weeks'] = () => {
  const defs = lg('sky', 0, 0, 0, 1, [[0, '#3a9aff'], [1, '#bfe8ff']]) + lg('storm', 1, 0, 0, 0, [[0, '#8a3aff', .7], [1, '#8a3aff', 0]]) + blur('gl', 8);
  let b = rect(0, 0, W, H, 'url(#sky)');
  b += rect(470, 0, 170, H, 'url(#storm)') + path('M540 0 Q500 180 560 360', 'none', 'stroke="#d8a0ff" stroke-width="3" opacity=".7"');
  b += ell(300, 330, 380, 90, '#e8d28a') + ell(300, 320, 340, 74, '#5fbf4a') + path('M60 300 Q140 250 220 280 Q300 240 380 270 T560 280 V360 H40Z', '#4aa83a');
  for (const [x, y, s] of [[90, 270, 1], [520, 260, .9], [430, 240, .7]]) b += rect(x - 3, y, 6, 24 * s, '#6a4a2a') + circ(x, y, 18 * s, '#2f8a2f') + circ(x - 8, y + 6, 12 * s, '#3a9a3a');
  // built structures: wooden walls and ramps
  const plank = (pts, c) => path(poly(pts), c, 'stroke="#5a3a1a" stroke-width="2"');
  b += plank([[180, 280], [300, 200], [300, 220], [196, 290]], '#c8924a') + plank([[300, 200], [300, 140], [316, 140], [316, 210]], '#b8823a') + plank([[316, 140], [380, 140], [380, 210], [316, 210]], '#d8a25a');
  for (let i = 0; i < 4; i++) b += line(196 + i * 26, 286 - i * 17, 212 + i * 26, 276 - i * 17, '#8a5a2a', 2);
  b += path('M380 210 L440 250 L440 270 L380 230Z', '#c8924a', 'stroke="#5a3a1a" stroke-width="2"');
  // loot chest glow
  b += circ(470, 290, 40, '#ffd23a', 'opacity=".45" filter="url(#gl)"') + rect(452, 278, 36, 24, '#8a5a2a', 'rx="3"') + rect(452, 272, 36, 10, '#a86a2a', 'rx="4"') + rect(466, 280, 8, 8, '#ffd23a');
  // original hero: round helmet, goggles, orange jacket, mid-jump on the ramp
  b += g('transform="translate(260 200) rotate(-8)"', circ(0, -40, 15, '#f0c090') + path('M-16 -46 Q0 -64 16 -46 L16 -40 L-16 -40Z', '#2a6ae8') + rect(-12, -44, 24, 7, '#3af0ff', 'rx="3"') + path('M-16 -26 Q0 -32 16 -26 L18 8 L-18 8Z', '#ff7518') + rect(-24, -24, 10, 26, '#3a8a4a', 'rx="4"') + line(-8, 8, -20, 36, '#2a2a40', 9, 'stroke-linecap="round"') + line(8, 8, 20, 32, '#2a2a40', 9, 'stroke-linecap="round"') + line(14, -20, 40, -30, '#ff7518', 8, 'stroke-linecap="round"') + rect(30, -38, 36, 10, '#3a3a42', 'rx="3"') + line(-14, -20, -30, -6, '#ff7518', 8, 'stroke-linecap="round"'));
  b += g('transform="translate(150 70)"', ell(0, 0, 34, 40, '#ff4f7a') + path('M-34 0 Q0 30 34 0', 'none', 'stroke="#fff" stroke-width="3"') + line(-16, 34, -8, 60, '#5a3a1a', 2) + line(16, 34, 8, 60, '#5a3a1a', 2) + rect(-10, 60, 20, 14, '#8a5a2a'));
  return T(defs, b, finish('v', .4));
};

THUMBS['the-humanizer'] = () => {
  const defs = lg('bg', 0, 0, 1, 1, [[0, '#1a1f28'], [1, '#0a0d12']]) + blur('gl', 8) + lg('arrow', 0, 0, 1, 0, [[0, '#ff7518', .3], [1, '#ffb347']]);
  let b = rect(0, 0, W, H, 'url(#bg)');
  for (let x = 0; x < W; x += 32) b += line(x, 0, x, H, '#2a3440', 1, 'opacity=".35"');
  const win = (x, y, w, h, title) => rect(x + 6, y + 10, w, h, '#000', 'rx="12" opacity=".4"') + rect(x, y, w, h, '#141a22', 'rx="12" stroke="#2a3440" stroke-width="1.5"') + rect(x, y, w, 26, '#1d242e', 'rx="12"') + rect(x, y + 14, w, 12, '#1d242e') + circ(x + 16, y + 13, 4, '#ff7518') + circ(x + 30, y + 13, 4, '#3a4450') + circ(x + 44, y + 13, 4, '#3a4450') + text(x + 60, y + 17, title, 10, '#6f7886', MONO);
  b += win(36, 60, 250, 240, 'draft_ai.txt') + win(352, 50, 254, 260, 'humanized.md');
  const L1 = ['In today\'s fast-paced', 'world, it is important', 'to note that leveraging', 'synergies can unlock', 'unprecedented value.', 'Furthermore, in', 'conclusion, it is', 'crucial to delve…'];
  L1.forEach((s, i) => { b += text(52, 112 + i * 22, s, 12.5, '#6f7886', MONO) + (i % 3 === 1 ? rect(50, 99 + i * 22, s.length * 7.4, 18, '#ff5c7a', 'opacity=".12" rx="3"') : ''); });
  b += text(52, 100, '01', 9, '#3a4450', MONO);
  const L2 = ['Honestly? Working', 'together just gets', 'more done — and it', 'shows. We tried it on', 'the last two projects', 'and it paid off.'];
  L2.forEach((s, i) => { b += text(372, 110 + i * 26, s, 17, '#f4ead8', `font-family="Georgia,serif" font-style="${i === 0 ? 'italic' : 'normal'}"`); });
  b += rect(372 + 8.6 * 'and it paid off.'.length, 241, 9, 20, '#ff7518');
  b += circ(318, 180, 46, '#ff7518', 'opacity=".25" filter="url(#gl)"') + path('M290 180 H340 M326 166 L342 180 L326 194', 'none', 'stroke="url(#arrow)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"');
  b += rect(372, 278, 120, 20, '#48d6a1', 'opacity=".12" rx="10"') + text(384, 292, '● reads human', 11, '#48d6a1', MONO);
  return T(defs, b, finish('v', .5));
};

THUMBS['nosy-neighbor-v2'] = () => {
  const defs = lg('sky', 0, 0, 0, 1, [[0, '#9fb4c8'], [1, '#dde4ea']]);
  let b = rect(0, 0, W, H, 'url(#sky)');
  const I = iso(330, 215, 13);
  // survey ground with a 1 m grid
  b += path(poly([I.P(-9, -8, 0), I.P(9, -8, 0), I.P(9, 8, 0), I.P(-9, 8, 0)]), '#a7b19a');
  for (let i = -9; i <= 9; i++) b += line(...I.P(i, -8, 0), ...I.P(i, 8, 0), '#8a947e', 1) + (i >= -8 && i <= 8 ? line(...I.P(-9, i, 0), ...I.P(9, i, 0), '#8a947e', 1) : '');
  // the grey survey house: three floors stacked, a box on top
  const wall = ['#e6e6e2', '#cfcfca', '#a9a9a4'];
  b += I.box(-4, -3, 0, 8, 6, 3.4, ...wall) + I.box(-4, -3, 3.4, 8, 6, .3, '#b4b4ae', '#9a9a94', '#84847e');
  b += I.box(-4, -3, 3.7, 8, 6, 3.4, ...wall) + I.box(-4, -3, 7.1, 8, 6, .3, '#b4b4ae', '#9a9a94', '#84847e');
  b += I.box(-2, -1.5, 7.4, 4, 2.5, 3, ...wall);
  const win = (x0, x1, z0, z1, y = 3) => path(poly([I.P(x0, y, z0), I.P(x1, y, z0), I.P(x1, y, z1), I.P(x0, y, z1)]), '#9fb2c4', 'stroke="#7f93a6" stroke-width="1.5"');
  for (const x of [-3.2, -1.2, 1.8]) b += win(x, x + 1, .9, 2.4) + win(x, x + 1, 4.6, 6.1);
  b += path(poly([I.P(.2, 3, 0), I.P(1.15, 3, 0), I.P(1.15, 3, 2.6), I.P(.2, 3, 2.6)]), '#5a6a7a');
  // ruler across the front wall with its readout
  const a = I.P(-4, 3.6, 0), c = I.P(4, 3.6, 0);
  b += line(...a, ...c, '#ff3366', 4) + circ(...a, 5, '#ff3366') + circ(...c, 5, '#ff3366');
  const m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 + 40];
  b += rect(m[0] - 56, m[1] - 15, 112, 28, '#1c2430', 'rx="6"') + text(m[0], m[1] + 5, '8.000 m', 15, '#fff', `${MONO} text-anchor="middle"`);
  // the child-height gauge by the door
  const gp = I.P(2.2, 4.2, 0);
  b += rect(gp[0] - 4, gp[1] - 15.6, 8, 15.6, '#33aaff', 'opacity=".6"') + line(gp[0] - 6, gp[1] - 14.3, gp[0] + 6, gp[1] - 14.3, '#ffcc00', 2);
  // the HUD badge
  b += rect(24, 22, 268, 34, '#ffffff', 'opacity=".9" rx="7"') + text(38, 44, 'ACT 3 HOUSE STUDY', 13, '#1c2430', `${MONO} font-weight="700"`) + text(196, 44, '0% measured', 12, '#c0182b', `${MONO} font-weight="700"`);
  return T(defs, b, finish('v', .35));
};
THUMBS['retro-bowl'] = () => {
  // pixel-art gridiron: striped turf, end zone, a quarterback lofting the ball to a receiver, and a scoreboard
  const defs = '';
  let b = rect(0, 0, W, H, '#1d1f2b');
  for (let x = 0; x < W; x += 8) for (let y = 4; y < 54; y += 8) b += rect(x + (y % 16 ? 4 : 0), y, 4, 4, ['#c94f4f', '#e0c060', '#5c8fd6', '#e8e8e8', '#6fbf73'][(x / 8 + y) % 5]);
  for (let i = 0; i < 16; i++) b += rect(i * 40, 64, 40, 272, i % 2 ? '#3f9b45' : '#47a84d');
  b += rect(0, 64, 80, 272, '#0b162a') + text(52, 210, 'RETRO', 26, '#c83803', `font-family="monospace" font-weight="700" transform="rotate(-90 52 210)"`);
  for (let x = 80; x <= 640; x += 40) b += rect(x, 64, x % 80 ? 1 : 3, 272, '#ffffff', 'opacity=".9"');
  for (let x = 90; x < 640; x += 10) b += rect(x, 150, 1, 6, '#fff', 'opacity=".8"') + rect(x, 240, 1, 6, '#fff', 'opacity=".8"');
  b += rect(0, 62, W, 3, '#fff') + rect(0, 334, W, 3, '#fff') + rect(286, 64, 3, 272, '#4f8cff') + rect(406, 64, 3, 272, '#ffe14d');
  const guy = (x, y, jersey, helmet, pants) => rect(x - 9, y - 3, 18, 5, '#000', 'opacity=".3"') + rect(x - 6, y - 14, 4, 12, pants) + rect(x + 2, y - 14, 4, 12, pants) +
    rect(x - 8, y - 26, 16, 13, jersey) + rect(x - 6, y - 37, 12, 11, helmet) + rect(x + 3, y - 33, 3, 5, '#c9c9c9') + rect(x - 10, y - 24, 2, 7, '#e0ac69') + rect(x + 8, y - 24, 2, 7, '#e0ac69');
  for (const [x, y] of [[300, 170], [300, 200], [300, 230], [300, 260], [300, 290]]) b += guy(x, y, '#0b162a', '#0b162a', '#c83803');
  for (const [x, y] of [[320, 180], [320, 215], [320, 250], [320, 280], [370, 150], [380, 250], [470, 120], [540, 300]]) b += guy(x, y, '#f4f4f4', '#0b6e4f', '#0b6e4f');
  b += guy(250, 236, '#0b162a', '#0b162a', '#c83803') + guy(500, 130, '#0b162a', '#0b162a', '#c83803');
  // the throw: dotted arc to a target ring
  for (let i = 1; i < 14; i++) { const k = i / 14, x = 258 + (520 - 258) * k, y = 214 + (136 - 214) * k - 120 * k * (1 - k); b += rect(x - 2, y - 2, 4, 4, '#fff'); }
  b += ell(522, 140, 16, 8, 'none', 'stroke="#fff" stroke-width="3"') + rect(519, 137, 6, 6, '#ffe14d');
  b += rect(380, 80, 14, 9, '#7a3e12') + rect(386, 82, 2, 5, '#fff');
  // scoreboard
  b += rect(0, 0, W, 0, '#000') + rect(150, 284, 340, 44, '#0d0e14', 'opacity=".92"') + rect(150, 284, 340, 4, '#ffe14d') +
    text(320, 315, 'RETRO BOWL', 26, '#ffe14d', `font-family="monospace" font-weight="700" text-anchor="middle" letter-spacing="3"`);
  return svg(W, H, defs + finish('v', .35).defs, b + finish('v', .35).body, { pixel: true });
};

THUMBS['trap-race'] = () => {
  const defs = lg('sky', 0, 0, 0, 1, [[0, '#2b2d6e'], [1, '#f08a6c']]) + rg('bh', .5, .5, .5, [[0, '#7a3cdc', .55], [1, '#7a3cdc', 0]]) + blur('gl', 6);
  let b = rect(0, 0, W, H, 'url(#sky)');
  // far skyline
  for (let i = 0; i < 12; i++) b += rect(i * 56 - 10, 150 + ((i * 37) % 5) * 18, 50, 260, '#3b3570');
  for (let i = 0; i < 9; i++) b += rect(i * 76, 200 + ((i * 53) % 4) * 16, 66, 200, '#54487f');
  // rooftops
  const roof = (x, y, w) => rect(x, y, w, H - y, '#a35a4a') + rect(x, y, w, 9, '#e0a16a') + rect(x, y + 9, w, 4, '#5b2f33', 'opacity=".4"');
  b += roof(0, 270, 170) + roof(230, 250, 160) + roof(450, 222, 190);
  // player-built course: crates, a plank bridge, spikes, barbed wire
  const crate = (x, y) => rect(x, y, 36, 36, '#8f6ad8', 'stroke="#2a1850" stroke-width="2"') + rect(x + 3, y + 3, 30, 5, '#fff', 'opacity=".2"');
  b += crate(300, 214) + crate(336, 214) + crate(336, 178) + rect(170, 238, 60, 10, '#c98b4f', 'stroke="#6a3a1a" stroke-width="2"');
  for (let i = 0; i < 5; i++) b += path(`M${236 + i * 12} 250 L${242 + i * 12} 234 L${248 + i * 12} 250Z`, '#dfe4ef', 'stroke="#5b6074" stroke-width="1.5"');
  for (let i = 0; i < 6; i++) b += circ(456 + i * 10, 218, 5, 'none', 'stroke="#c9ced8" stroke-width="2"');
  // tripod sniper with a warning sight
  b += line(352, 178, 340, 160, '#3b3f52', 3) + line(352, 178, 364, 160, '#3b3f52', 3) + rect(338, 148, 30, 12, '#4b5068', 'rx="3"') + rect(366, 151, 26, 5, '#2b2f40') + line(392, 153, 640, 153, '#ff3030', 2, 'opacity=".6"');
  // black hole
  b += circ(560, 110, 70, 'url(#bh)') + path('M560 80 Q600 96 586 120 Q570 140 548 128', 'none', 'stroke="#d6b8ff" stroke-width="3" opacity=".7"') + circ(560, 110, 14, '#05010f', 'stroke="#ff3bd0" stroke-width="3"');
  // flag
  b += line(600, 222, 600, 160, '#e8e8f0', 4) + path('M600 160 Q620 152 640 166 Q620 176 600 172Z', '#ff5e8a');
  // fox mid wall-jump with a coin
  b += g('transform="translate(250 150) rotate(-14)"',
    path('M-14 10 Q-34 16 -32 -4 Q-24 2 -12 2Z', '#f08a2c', 'stroke="#1a0e2e" stroke-width="2.5"') +
    rect(-14, -14, 28, 30, '#f08a2c', 'rx="10" stroke="#1a0e2e" stroke-width="2.5"') + ell(2, 2, 8, 9, '#fff3e2') +
    circ(0, -28, 15, '#f08a2c', 'stroke="#1a0e2e" stroke-width="2.5"') + path('M-10 -38 L-4 -54 L2 -40Z M4 -40 L12 -54 L14 -36Z', '#f08a2c', 'stroke="#1a0e2e" stroke-width="2"') +
    ell(8, -24, 8, 6, '#fff3e2') + circ(4, -31, 2.4, '#1a0e2e') + circ(12, -31, 2.4, '#1a0e2e') +
    line(-8, 16, -16, 34, '#7a3a12', 7, 'stroke-linecap="round"') + line(8, 16, 18, 28, '#7a3a12', 7, 'stroke-linecap="round"') +
    line(12, -8, 30, -24, '#f08a2c', 6, 'stroke-linecap="round"') + line(-12, -8, -28, -20, '#f08a2c', 6, 'stroke-linecap="round"'));
  b += circ(250, 96, 11, '#ffcf33', 'stroke="#a66a00" stroke-width="2.5"') + circ(246, 92, 3, '#fff1a8');
  b += circ(200, 150, 26, '#ffd25e', 'opacity=".25" filter="url(#gl)"');
  b += text(26, 54, 'TRAP RACE', 40, '#ffd25e', `${SANS} letter-spacing="2" stroke="#5b1f4a" stroke-width="2" paint-order="stroke"`) + text(28, 80, 'draft · build · race', 16, '#f2f5fa', `${SANS} opacity=".85"`);
  return T(defs, b, finish('v', .38));
};

THUMBS['fnaf'] = () => {
  const defs = lg('wall', 0, 0, 0, 1, [[0, '#1a0c0c'], [1, '#050203']]) + rg('beam', .5, .5, .5, [[0, '#fff1c8', .55], [1, '#fff1c8', 0]]) + rg('scr', .5, .5, .5, [[0, '#5af07a', .35], [1, '#5af07a', 0]]) + blur('gl', 4);
  let b = rect(0, 0, W, H, 'url(#wall)');
  // checkered strip along the office wall
  for (let i = 0; i < 32; i++) b += rect(i * 20, 196, 20, 10, i % 2 ? '#e8e2d2' : '#111', 'opacity=".55"') + rect(i * 20, 206, 20, 10, i % 2 ? '#111' : '#e8e2d2', 'opacity=".55"');
  // left and right doorways: the left one dark with eyes, the right one lit by the hall light
  b += rect(20, 60, 120, 230, '#000') + rect(20, 60, 120, 230, 'none', 'stroke="#4a2c1e" stroke-width="6"');
  b += ell(62, 132, 9, 6, '#fff4d0', 'filter="url(#gl)"') + ell(98, 132, 9, 6, '#fff4d0', 'filter="url(#gl)"') + circ(62, 132, 3, '#c41e1e') + circ(98, 132, 3, '#c41e1e');
  b += rect(500, 60, 120, 230, '#2a2216') + rect(500, 60, 120, 230, 'url(#beam)') + rect(500, 60, 120, 230, 'none', 'stroke="#4a2c1e" stroke-width="6"');
  // desk, a CRT monitor showing a camera feed, a desk fan
  b += rect(150, 262, 340, 98, '#2e2018') + rect(150, 262, 340, 8, '#4a3424');
  b += rect(250, 170, 140, 96, '#1a1a1a', 'rx="8"') + rect(262, 180, 116, 72, '#0b2412') + rect(262, 180, 116, 72, 'url(#scr)');
  for (let y = 182; y < 252; y += 4) b += rect(262, y, 116, 1, '#000', 'opacity=".35"');
  b += circ(270, 190, 4, '#ff3a3a') + text(280, 194, 'CAM 1A', 11, '#cfe8d0', `font-family="monospace"`);
  b += circ(200, 232, 26, 'none', 'stroke="#555" stroke-width="4"') + path('M200 232 L188 212 M200 232 L222 238 M200 232 L192 254', 'none', 'stroke="#777" stroke-width="7" stroke-linecap="round"') + rect(196, 256, 8, 10, '#444');
  // flashlight beam across the floor
  b += path('M430 360 L560 300 L640 340 L640 360Z', '#fff1c8', 'opacity=".12"');
  // the clock and title
  b += text(612, 44, '6 AM', 34, '#f2f5fa', `font-family="monospace" font-weight="700" text-anchor="end"`);
  b += text(170, 54, 'FNAF REPLICA', 38, '#e8e4dc', `${SANS} letter-spacing="2" stroke="#c41e1e" stroke-width="2" paint-order="stroke"`) + text(172, 80, 'survive the night · up to 4 guards', 15, '#f2f5fa', `${SANS} opacity=".8"`);
  return T(defs, b, finish('v', .5));
};
