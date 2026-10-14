// 16:9 promotional thumbnails, part 2.
import { svg, lg, rg, blur, rect, circ, ell, path, line, g, text, rng, poly, finish, stars, SANS, SERIF, MONO, shade, iso, voxel, f } from './lib.mjs';
const W = 640, H = 360;
const T = (defs, body, v = finish()) => svg(W, H, defs + v.defs, body + v.body);
export const THUMBS = {};

THUMBS['breakout'] = () => {
  const defs = lg('bg', 0, 0, 0, 1, [[0, '#0a1440'], [1, '#03061a']]) + blur('gl', 5) + blur('gl2', 12) + lg('tr', 0, 1, 1, 0, [[0, '#ff8a2a', 0], [1, '#ffd08a', .9]]);
  let b = rect(0, 0, W, H, 'url(#bg)');
  const rows = ['#ff3a5a', '#ff8a2a', '#ffd23a', '#3fd06a', '#2ab8ff', '#7a5aff'];
  const gone = new Set(['2,4', '3,4', '3,5', '4,5', '2,5', '4,3']);
  rows.forEach((c, j) => { for (let i = 0; i < 10; i++) { if (gone.has(`${j},${i}`)) continue; const x = 22 + i * 60, y = 26 + j * 24; b += rect(x, y, 56, 20, c, 'rx="3"') + rect(x + 3, y + 2, 50, 5, '#fff', 'opacity=".35" rx="2"') + rect(x, y + 15, 56, 5, '#000', 'opacity=".2"'); } });
  const R = rng(9);
  for (let i = 0; i < 9; i++) { const x = 250 + R() * 120, y = 110 + R() * 70; b += rect(x, y, 14 + R() * 18, 8 + R() * 6, rows[(i % 3) + 2], `rx="2" transform="rotate(${(R() * 80 - 40) | 0} ${x} ${y})"`); }
  b += path('M150 330 L300 160', 'none', 'stroke="url(#tr)" stroke-width="16" stroke-linecap="round" opacity=".7"');
  b += circ(300, 160, 26, '#ffd08a', 'opacity=".5" filter="url(#gl2)"') + circ(300, 160, 11, '#fff') + circ(297, 157, 4, '#fff');
  for (let a = 0; a < 10; a++) { const r = a * .63; b += line(300 + Math.cos(r) * 16, 160 + Math.sin(r) * 16, 300 + Math.cos(r) * (28 + (a % 3) * 8), 160 + Math.sin(r) * (28 + (a % 3) * 8), '#ffd08a', 2, 'stroke-linecap="round" opacity=".8"'); }
  b += rect(80, 316, 150, 16, '#2ab8ff', 'rx="8" filter="url(#gl)" opacity=".8"') + rect(80, 316, 150, 16, 'url(#pad)', 'rx="8"') + rect(86, 318, 138, 4, '#fff', 'opacity=".5" rx="2"');
  return T(defs + lg('pad', 0, 0, 1, 0, [[0, '#ff7518'], [1, '#2ab8ff']]), b);
};

THUMBS['asteroids'] = () => {
  const defs = rg('bg', .5, .5, .8, [[0, '#0e1220'], [1, '#000']]) + blur('gl', 4) + blur('gl2', 10) + lg('fl', 0, 0, 1, 0, [[0, '#ffd08a', 0], [1, '#ff7518']]);
  let b = rect(0, 0, W, H, 'url(#bg)') + stars(140, 5) + circ(120, 70, 50, '#3a2a6a', 'opacity=".4" filter="url(#gl2)"');
  const R = rng(21);
  const rock = (cx, cy, r, rot) => { const pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + rot, rr = r * (.75 + R() * .35); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } const d = poly(pts); return path(d, '#1a1e2a') + path(d, 'none', 'stroke="#9ab0ff" stroke-width="2.4" stroke-linejoin="round"') + path(d, 'none', 'stroke="#9ab0ff" stroke-width="5" opacity=".3" filter="url(#gl)"') + circ(cx - r * .25, cy - r * .1, r * .14, '#2a3040') + circ(cx + r * .2, cy + r * .25, r * .1, '#2a3040'); };
  b += rock(140, 250, 56, .2) + rock(500, 90, 64, 1) + rock(560, 260, 34, .5) + rock(80, 110, 26, 2) + rock(420, 300, 22, 3) + rock(250, 70, 18, 1.4);
  b += g('transform="translate(320 185) rotate(-35)"', path('M-60 0 L-30 -5 L-30 5Z', 'url(#fl)') + path('M-46 0 L-30 -3 L-30 3Z', '#fff') + path('M34 0 L-24 -20 L-14 0 L-24 20Z', '#0a0c14', 'stroke="#fff" stroke-width="3" stroke-linejoin="round"') + path('M34 0 L-24 -20 L-14 0 L-24 20Z', 'none', 'stroke="#ff8c32" stroke-width="6" opacity=".45" filter="url(#gl)"'));
  for (let i = 0; i < 4; i++) b += circ(360 + i * 26, 158 - i * 19, 2.6, '#fff') + circ(360 + i * 26, 158 - i * 19, 6, '#ff8c32', 'opacity=".4" filter="url(#gl)"');
  return T(defs, b);
};

THUMBS['dino-run'] = () => {
  const defs = lg('sky', 0, 0, 0, 1, [[0, '#2a1a3a'], [.45, '#c8483a'], [.75, '#f49a4a'], [1, '#f8d08a']]) + rg('sun', .5, .5, .5, [[0, '#fff2c0'], [.6, '#ffc060'], [1, '#ff8a3a', 0]]);
  let b = rect(0, 0, W, H, 'url(#sky)') + circ(470, 210, 110, 'url(#sun)') + circ(470, 210, 54, '#ffe8a8');
  for (let i = 0; i < 5; i++) b += rect(380, 196 + i * 12, 180, 4, '#e8603a', `opacity="${.6 - i * .1}"`);
  b += path('M0 250 Q120 200 240 240 T480 230 T640 236 L640 360 L0 360Z', '#5a2a2a') + path('M0 280 Q160 250 320 270 T640 262 L640 360 L0 360Z', '#2a1418') + rect(0, 296, W, 64, '#1a0e10');
  b += line(0, 296, W, 296, '#f8d08a', 2, 'opacity=".5"');
  for (let x = 10; x < W; x += 34) b += rect(x, 304 + (x % 3) * 8, 10 + (x % 4) * 3, 2, '#5a3a3a');
  const cactus = (x, h) => rect(x, 296 - h, 14, h, '#120a0c', 'rx="5"') + rect(x - 14, 296 - h * .7, 10, h * .35, '#120a0c', 'rx="4"') + rect(x - 14, 296 - h * .45, 18, 8, '#120a0c') + rect(x + 18, 296 - h * .8, 10, h * .3, '#120a0c', 'rx="4"') + rect(x + 10, 296 - h * .55, 18, 8, '#120a0c');
  b += cactus(420, 66) + cactus(560, 48) + cactus(600, 70);
  const P = 7, dx = 150, dy = 196, D = (x, y, w, h) => rect(dx + x * P, dy + y * P, w * P, h * P, '#141014');
  b += D(8, 0, 8, 1) + D(7, 1, 10, 4) + D(9, 1, 1, 1).replace('#141014', '#f8d08a') + D(7, 5, 6, 1) + D(7, 5, 4, 1) + D(0, 6, 1, 3) + D(1, 7, 2, 3) + D(3, 6, 9, 5) + D(12, 7, 2, 1) + D(13, 8, 1, 1) + D(3, 11, 8, 2) + D(4, 13, 2, 2) + D(8, 13, 2, 1) + D(4, 15, 3, 1) + D(9, 14, 1, 2);
  b += rect(dx + 9 * P, dy + 2 * P, P, P, '#f8d08a');
  for (let i = 0; i < 6; i++) b += circ(120 - i * 16, 296 - (i % 2) * 6, 5 + i * 2, '#8a5a4a', `opacity="${.5 - i * .07}"`);
  b += path('M260 70 l26 10 l-10 -18 l16 6 l20 -4 l-20 12 l14 8Z', '#2a1418');
  return svg(W, H, defs + finish('v', .45).defs, b + finish('v', .45).body, { pixel: false });
};

THUMBS['drift-boss'] = () => {
  const defs = lg('bg', 0, 0, 1, 1, [[0, '#2a0a5a'], [.6, '#5a1a7a'], [1, '#1a0a3a']]) + blur('gl', 6) + blur('sm', 5);
  let b = rect(0, 0, W, H, 'url(#bg)') + stars(120, 8, W, H, '#ffe8f8');
  b += circ(540, 70, 44, '#ff7a6a') + circ(530, 60, 44, '#5a1a7a', 'opacity=".55"') + ell(540, 70, 80, 12, 'none', 'stroke="#ffd0a8" stroke-width="3" opacity=".7" transform="rotate(-18 540 70)"');
  b += circ(90, 300, 40, '#3ad8d0', 'opacity=".5" filter="url(#gl)"') + circ(90, 300, 22, '#3ad8d0');
  const I = iso(150, 110, 1);
  const seg = (x, y, len, dir) => { const w = dir ? len : 60, d = dir ? 60 : len; return I.box(x, y, 0, w, d, 14, '#3a3f52', '#ff7a6a', '#d0505a') + (dir ? line(...I.P(x + 8, y + 30, 14), ...I.P(x + w - 8, y + 30, 14), '#fff', 3, 'stroke-dasharray="12 12" opacity=".6"') : line(...I.P(x + 30, y + 8, 14), ...I.P(x + 30, y + d - 8, 14), '#fff', 3, 'stroke-dasharray="12 12" opacity=".6"')); };
  b += seg(0, 0, 200, 1) + seg(140, 60, 160, 0) + seg(140, 220, 200, 1) + seg(280, 280, 120, 0);
  const [cx, cy] = I.P(170, 90, 14);
  b += path(`M${cx - 120} ${cy - 40} Q${cx - 60} ${cy - 10} ${cx - 10} ${cy + 4}`, 'none', 'stroke="#111" stroke-width="5" opacity=".6"') + path(`M${cx - 110} ${cy - 20} Q${cx - 50} ${cy + 6} ${cx - 2} ${cy + 18}`, 'none', 'stroke="#111" stroke-width="5" opacity=".6"');
  for (let i = 0; i < 6; i++) b += circ(cx - 40 - i * 20, cy - 4 - i * 6, 12 + i * 4, '#ffe8f8', `opacity="${.45 - i * .06}" filter="url(#sm)"`);
  b += g(`transform="translate(${cx} ${cy}) rotate(28)"`, ell(4, 16, 40, 12, '#000', 'opacity=".35"') + rect(-34, -14, 68, 30, '#3ad8d0', 'rx="9"') + rect(-14, -10, 30, 22, '#1a2a4a', 'rx="5"') + rect(-12, -8, 26, 6, '#8af0ff', 'opacity=".7" rx="2"') + rect(28, -10, 6, 8, '#fff2a0') + rect(28, 8, 6, 8, '#fff2a0') + rect(-34, -10, 4, 8, '#ff3a4a') + rect(-34, 8, 4, 8, '#ff3a4a'));
  return T(defs, b);
};

THUMBS['doodle-jump'] = () => {
  const defs = lg('bg', 0, 0, 0, 1, [[0, '#fdf6e4'], [1, '#f4ead0']]);
  let b = rect(0, 0, W, H, 'url(#bg)');
  for (let x = 0; x < W; x += 20) b += line(x, 0, x, H, '#e4d8b8', 1);
  for (let y = 0; y < H; y += 20) b += line(0, y, W, y, '#e4d8b8', 1);
  const cloud = (x, y) => path(`M${x} ${y} q10 -22 30 -10 q14 -20 34 -2 q22 -2 20 18 q-4 14 -22 12 h-52 q-22 -2 -10 -18Z`, '#fff', 'stroke="#c8b898" stroke-width="2.5" stroke-linejoin="round"');
  b += cloud(60, 60) + cloud(480, 40) + cloud(540, 200);
  const plat = (x, y, c, extra = '') => rect(x, y, 90, 14, c, 'rx="7" stroke="#3a3020" stroke-width="2.5"') + rect(x + 8, y + 3, 50, 3, '#fff', 'opacity=".5" rx="2"') + extra;
  b += plat(90, 300, '#7ac84a') + plat(300, 250, '#7ac84a') + plat(150, 190, '#5ab0e8', path('M146 197 l-14 0 M244 197 l14 0', 'none', 'stroke="#3a3020" stroke-width="2" stroke-dasharray="3 4"')) + plat(420, 150, '#b8865a', path('M462 150 l4 14', 'none', 'stroke="#3a3020" stroke-width="2.5"')) + plat(260, 90, '#7ac84a', rect(300, 76, 18, 14, '#c0c0c8', 'stroke="#3a3020" stroke-width="2" rx="2"') + path('M302 80 h14 M302 84 h14', 'none', 'stroke="#3a3020" stroke-width="1.5"'));
  b += path('M370 330 Q330 230 380 160', 'none', 'stroke="#3a3020" stroke-width="2.5" stroke-dasharray="6 8" opacity=".55"');
  // the jumper: a round green critter with a periscope nose, stubby legs and a backpack
  b += g('transform="translate(392 150) rotate(-8)"', ell(0, 20, 32, 30, '#c8e84a', 'stroke="#3a3020" stroke-width="3"') + path('M-30 22 h60 v12 q0 6 -6 6 h-48 q-6 0 -6 -6Z', '#7a5aa8', 'stroke="#3a3020" stroke-width="3"') + path('M16 4 h24 v12 h-24Z', '#c8e84a', 'stroke="#3a3020" stroke-width="3"') + ell(42, 10, 4, 8, '#3a3020') + circ(-6, 6, 7, '#fff', 'stroke="#3a3020" stroke-width="2.5"') + circ(-4, 6, 3, '#3a3020') + circ(10, 4, 6, '#fff', 'stroke="#3a3020" stroke-width="2.5"') + circ(11, 4, 2.5, '#3a3020') + line(-14, 44, -18, 56, '#3a3020', 4, 'stroke-linecap="round"') + line(0, 46, 0, 58, '#3a3020', 4, 'stroke-linecap="round"') + line(14, 44, 18, 56, '#3a3020', 4, 'stroke-linecap="round"'));
  for (const [x, y] of [[360, 210], [372, 228], [350, 192]]) b += path(`M${x} ${y} q-8 6 -16 2`, 'none', 'stroke="#3a3020" stroke-width="2" stroke-linecap="round"');
  return T(defs, b, finish('v', .25));
};

THUMBS['crossy-road'] = () => {
  const defs = lg('bg', 0, 0, 0, 1, [[0, '#8ad8ff'], [1, '#c8f0ff']]) + blur('sh', 2);
  let b = rect(0, 0, W, H, 'url(#bg)');
  const I = iso(330, -40, 22);
  // lanes running along x; y picks the lane
  const lane = (y0, y1, c, x0 = -12, x1 = 14) => I.box(x0, y0, -1, x1 - x0, y1 - y0, 1, c, shade(c, -.2), shade(c, -.35));
  b += lane(0, 2, '#7ad04a') + lane(2, 5, '#4a4f5a') + lane(5, 6, '#8ad85a') + lane(6, 8, '#3aa8e8') + lane(8, 9, '#7ad04a') + lane(9, 10, '#8a7a6a') + lane(10, 14, '#7ad04a');
  for (let x = -10; x < 14; x += 3) b += I.box(x, 3.45, 0, 1.6, .1, .02, '#f4f4f0', '#ccc', '#bbb');
  for (let x = -12; x < 14; x += 1.2) b += I.box(x, 9.1, 0, .3, .8, .12, '#6a4a2a', '#5a3a1a', '#4a2a10');
  b += I.box(-12, 9.25, .12, 26, .08, .1, '#c0c0c8', '#9a9aa0', '#8a8a90') + I.box(-12, 9.65, .12, 26, .08, .1, '#c0c0c8', '#9a9aa0', '#8a8a90');
  // trees and bushes
  for (const [x, y] of [[-8, .4], [-3, 10.6], [6, .5], [9, 11], [-10, 12]]) b += voxel(I, x + .3, y + .3, 0, .4, .4, .8, '#7a5232') + voxel(I, x, y, .8, 1, 1, 1.2, '#3a9a3a') + voxel(I, x + .2, y + .2, 2, .6, .6, .5, '#4aaa44');
  // logs on the river
  b += voxel(I, -6, 6.2, 0, 4, .8, .5, '#8a5a2a') + voxel(I, 3, 6.9, 0, 3.4, .8, .5, '#8a5a2a');
  // a car and a truck
  b += voxel(I, -5, 2.4, 0, 2, 1, .7, '#e8322c') + voxel(I, -4.5, 2.5, .7, 1.1, .8, .5, '#f4f4f0') + voxel(I, 4, 3.6, 0, 3.2, 1.1, 1.3, '#2a6ae8') + voxel(I, 6.9, 3.6, 0, .9, 1.1, 1, '#f4c430');
  // the train on the tracks
  b += voxel(I, 8, 9, .2, 5, 1, 1.5, '#d8d8e0') + voxel(I, 8, 9, 1.7, 5, 1, .2, '#e8322c') + voxel(I, 8.3, 9.05, .9, 1.2, .1, .4, '#2a3a5a');
  // the chicken, mid-hop
  const cx = -1.6, cy = 5.4, cz = 1.4;
  b += ell(...I.P(cx + .5, cy + .5, 0), 18, 8, '#000', 'opacity=".25"');
  b += voxel(I, cx, cy, cz, 1, 1, 1, '#ffffff') + voxel(I, cx + .55, cy + .1, cz + 1, .45, .8, .5, '#ffffff') + voxel(I, cx + .62, cy + .3, cz + 1.5, .3, .4, .25, '#e8322c') + voxel(I, cx + 1, cy + .35, cz + 1.1, .25, .3, .2, '#f49a1a') + voxel(I, cx + .3, cy + .2, cz - .3, .15, .15, .3, '#f49a1a') + voxel(I, cx + .3, cy + .65, cz - .3, .15, .15, .3, '#f49a1a') + voxel(I, cx - .15, cy + .2, cz + .4, .25, .6, .4, '#eeeeee');
  const [ex, ey] = I.P(cx + 1, cy + .55, cz + 1.35); b += rect(ex - 2, ey - 2, 4, 4, '#111');
  return T(defs, b, finish('v', .4));
};

THUMBS['stickman-hook'] = () => {
  const defs = lg('bg', 0, 0, 0, 1, [[0, '#2ab8e8'], [.7, '#8ae0f8'], [1, '#ffd8b8']]) + blur('gl', 6);
  let b = rect(0, 0, W, H, 'url(#bg)');
  for (const [x, y, s] of [[90, 260, 1.4], [520, 300, 1], [300, 320, 1.8]]) b += ell(x, y, 80 * s, 26 * s, '#fff', 'opacity=".6"');
  const hook = (x, y, on) => circ(x, y, on ? 26 : 20, '#ff7a3a', `opacity="${on ? .5 : .25}" filter="url(#gl)"`) + circ(x, y, 13, '#ff7a3a') + circ(x, y, 13, 'none', 'stroke="#fff" stroke-width="3"') + circ(x, y, 5, '#fff');
  b += hook(160, 80, 0) + hook(330, 60, 1) + hook(520, 110, 0);
  b += path('M60 250 Q160 330 250 210 Q300 140 330 60', 'none', 'stroke="#fff" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" opacity=".9"');
  b += path('M330 60 Q420 230 560 170', 'none', 'stroke="#ff7a3a" stroke-width="3" stroke-dasharray="10 10" opacity=".7"');
  const fx = 420, fy = 200;
  b += line(330, 60, fx - 8, fy - 22, '#1a1a1a', 3);
  b += g(`transform="translate(${fx} ${fy}) rotate(-30)"`, circ(0, -38, 10, '#1a1a1a') + line(0, -28, 0, 6, '#1a1a1a', 7, 'stroke-linecap="round"') + line(0, -20, -14, -34, '#1a1a1a', 6, 'stroke-linecap="round"') + line(0, -18, 18, -6, '#1a1a1a', 6, 'stroke-linecap="round"') + line(0, 6, -16, 26, '#1a1a1a', 6, 'stroke-linecap="round"') + line(0, 6, 14, 30, '#1a1a1a', 6, 'stroke-linecap="round"'));
  for (let i = 0; i < 4; i++) b += line(fx - 30 - i * 16, fy + 20 + i * 4, fx - 60 - i * 16, fy + 40 + i * 4, '#fff', 3, 'stroke-linecap="round" opacity=".6"');
  return T(defs, b, finish('v', .35));
};

THUMBS['connect-4'] = () => {
  const defs = lg('bg', 0, 0, 1, 1, [[0, '#1a2a5a'], [1, '#080e24']]) + lg('fr', 0, 0, 0, 1, [[0, '#2a7aff'], [1, '#1448c0']]) + rg('red', .35, .3, .7, [[0, '#ff8a8a'], [.6, '#e8222c'], [1, '#9a0a10']]) + rg('yel', .35, .3, .7, [[0, '#fff2a0'], [.6, '#f8d030'], [1, '#c0900a']]) + blur('gl', 8);
  let b = rect(0, 0, W, H, 'url(#bg)');
  const S = 46, ox = 160, oy = 70;
  const grid = ['.......', '.......', '...y...', '..yr...', '.yrrr..', 'yrryyr.'];
  b += rect(ox - 14, oy - 14, 7 * S + 28, 6 * S + 28, '#0a1a4a', 'rx="16" transform="translate(10 12)" opacity=".6"') + rect(ox - 14, oy - 14, 7 * S + 28, 6 * S + 28, 'url(#fr)', 'rx="16"') + rect(ox - 14, oy - 14, 7 * S + 28, 10, '#fff', 'opacity=".2" rx="10"');
  grid.forEach((row, j) => [...row].forEach((v, i) => { const x = ox + i * S + S / 2, y = oy + j * S + S / 2; b += circ(x, y, 18, v === 'r' ? 'url(#red)' : v === 'y' ? 'url(#yel)' : '#081438') + circ(x, y, 18, 'none', 'stroke="#0a2a7a" stroke-width="3"'); if (v !== '.') b += circ(x, y, 12, 'none', 'stroke="#fff" stroke-opacity=".25" stroke-width="2"'); }));
  b += line(ox + S / 2, oy + 5 * S + S / 2, ox + 3 * S + S / 2, oy + 2 * S + S / 2, '#f8d030', 10, 'stroke-linecap="round" opacity=".5" filter="url(#gl)"');
  b += circ(ox + 4 * S + S / 2, oy - 46, 18, 'url(#yel)') + circ(ox + 4 * S + S / 2, oy - 46, 26, '#f8d030', 'opacity=".35" filter="url(#gl)"') + path(`M${ox + 4 * S + S / 2} ${oy - 20} v14`, 'none', 'stroke="#f8d030" stroke-width="3" stroke-dasharray="3 4"');
  b += rect(ox - 30, oy + 6 * S + 14, 7 * S + 60, 14, '#1448c0', 'rx="6"');
  return T(defs, b);
};

THUMBS['candy-match'] = () => {
  const defs = lg('bg', 0, 0, 1, 1, [[0, '#ffb8d8'], [1, '#b88aff']]) + rg('gl', .3, .25, .8, [[0, '#fff', .8], [.35, '#fff', 0]]) + blur('bl', 6);
  let b = rect(0, 0, W, H, 'url(#bg)');
  const S = 50, ox = 145, oy = 36;
  b += rect(ox - 12, oy - 12, 7 * S + 24, 6 * S + 24, '#fff', 'rx="20" opacity=".55"');
  const kinds = [
    (x, y) => circ(x, y, 18, '#ff3a6a') + circ(x, y, 18, 'url(#gl)'),
    (x, y) => path(`M${x - 22} ${y} l8 -9 v18Z M${x + 22} ${y} l-8 -9 v18Z`, '#f8a020') + ell(x, y, 15, 13, '#ffb020') + ell(x, y, 15, 13, 'url(#gl)'),
    (x, y) => rect(x - 15, y - 15, 30, 30, '#3ad06a', 'rx="8" transform="rotate(45 ' + x + ' ' + y + ')"') + circ(x, y, 15, 'url(#gl)'),
    (x, y) => ell(x, y, 12, 18, '#5a8aff') + ell(x, y, 12, 18, 'url(#gl)'),
    (x, y) => path(`M${x} ${y - 19} l5 12 l13 1 l-10 8 l4 13 l-12 -7 l-12 7 l4 -13 l-10 -8 l13 -1Z`, '#ffd23a') + circ(x, y - 2, 10, 'url(#gl)'),
    (x, y) => circ(x, y, 17, '#b44bff') + path(`M${x - 17} ${y} a17 17 0 0 0 34 0`, 'none', 'stroke="#fff" stroke-width="3" stroke-dasharray="4 4"') + circ(x, y, 17, 'url(#gl)'),
  ];
  const board = ['013245', '102354', '230111', '541025', '325043', '014532'];
  board.forEach((r, j) => [...r].forEach((k, i) => { b += kinds[+k](ox + 30 + i * S + (i >= 6 ? 0 : 0), oy + 25 + j * S); }));
  b += rect(ox + 105, oy + 100, 150, 50, '#fff', 'rx="25" opacity=".5" filter="url(#bl)"') + board[2].slice(3, 6).split('').map((k, i) => kinds[+k](ox + 30 + (3 + i) * S, oy + 25 + 2 * S)).join('');
  for (const [x, y, s] of [[260, 100, 1], [500, 60, .8], [120, 280, .7], [520, 300, 1.1]]) b += path(`M${x} ${y - 10 * s} l${2 * s} ${8 * s} l${8 * s} ${2 * s} l${-8 * s} ${2 * s} l${-2 * s} ${8 * s} l${-2 * s} ${-8 * s} l${-8 * s} ${-2 * s} l${8 * s} ${-2 * s}Z`, '#fff');
  b += g('transform="translate(530 170) rotate(-15)"', rect(-34, -16, 68, 32, '#ff5a9a', 'rx="16"') + path('M-34 0 l-18 -16 v32Z M34 0 l18 -16 v32Z', '#ff8ab8') + rect(-30, -12, 60, 8, '#fff', 'opacity=".4" rx="4"') + path('M-14 -16 v32 M0 -16 v32 M14 -16 v32', 'none', 'stroke="#fff" stroke-width="4" opacity=".6"'));
  return T(defs, b, finish('v', .3));
};

THUMBS['boggle'] = () => {
  const defs = lg('bg', 0, 0, 1, 1, [[0, '#14205a'], [1, '#060a24']]) + blur('gl', 6) + lg('die', 0, 0, 1, 1, [[0, '#fffaf0'], [1, '#e8dcc0']]);
  let b = rect(0, 0, W, H, 'url(#bg)');
  const L = ['QUIT', 'PLAY', 'MEGA', 'ROSE'];
  const S = 64, ox = 190, oy = 40;
  b += rect(ox - 16, oy - 12, 4 * S + 24, 4 * S + 24, '#0a1440', 'rx="18" stroke="#2a4aaa" stroke-width="2"');
  const pos = (i, j) => [ox + i * S + S / 2 - 4, oy + j * S + S / 2];
  const trail = [[0, 1], [1, 1], [2, 1], [3, 1]].map(([i, j]) => pos(i, j));
  L.forEach((row, j) => [...row].forEach((ch, i) => {
    const [x, y] = pos(i, j), on = j === 1, r = ((i * 7 + j * 3) % 5 - 2) * 2;
    b += g(`transform="rotate(${r} ${x} ${y})"`, rect(x - 26, y - 22, 52, 52, '#b8a888', 'rx="10"') + rect(x - 26, y - 26, 52, 50, on ? '#e8f4ff' : 'url(#die)', 'rx="10"') + text(x, y + 10, ch === 'Q' ? 'Qu' : ch, ch === 'Q' ? 24 : 30, on ? '#1a4aff' : '#1a1e3a', `${SANS} text-anchor="middle"`));
  }));
  b += path('M' + trail.map(p => p.join(' ')).join(' L'), 'none', 'stroke="#3ab8ff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" opacity=".25" filter="url(#gl)"');
  b += path('M' + trail.map(p => p.join(' ')).join(' L'), 'none', 'stroke="#3ab8ff" stroke-width="5" stroke-linecap="round" opacity=".6"');
  b += g('transform="translate(520 220)"', path('M-20 -50 h40 l-16 30 l16 30 h-40 l16 -30Z', '#e8dcc0', 'stroke="#c8a464" stroke-width="3"') + path('M-12 -42 h24 l-12 18Z M-10 6 h20 v4 h-20Z', '#f4c040'));
  b += text(110, 300, 'PLAY', 30, '#3ab8ff', `${SANS} letter-spacing="8" opacity=".85"`) + text(110, 324, '+4 points', 13, '#8ab8ff', MONO);
  return T(defs, b);
};

THUMBS['tic-tac-toe'] = () => {
  const defs = lg('bg', 0, 0, 1, 1, [[0, '#2a0a4a'], [1, '#08041a']]) + blur('gl', 6) + blur('gl2', 14);
  let b = rect(0, 0, W, H, 'url(#bg)');
  for (let i = 0; i < 10; i++) { const y = 250 + i * i * 2; b += line(0, y, W, y, '#b44bff', 1, `opacity="${.12 + i * .03}"`); }
  const S = 82, ox = 197, oy = 36;
  const gridP = `M${ox + S} ${oy} v${3 * S} M${ox + 2 * S} ${oy} v${3 * S} M${ox} ${oy + S} h${3 * S} M${ox} ${oy + 2 * S} h${3 * S}`;
  b += path(gridP, 'none', 'stroke="#b44bff" stroke-width="10" stroke-linecap="round" filter="url(#gl2)" opacity=".7"') + path(gridP, 'none', 'stroke="#e0b0ff" stroke-width="5" stroke-linecap="round"');
  const X = (i, j, a = 1) => { const x = ox + i * S + S / 2, y = oy + j * S + S / 2, d = `M${x - 22} ${y - 22} L${x + 22} ${y + 22} M${x + 22} ${y - 22} L${x - 22} ${y + 22}`; return g(`opacity="${a}"`, path(d, 'none', 'stroke="#ff4fa8" stroke-width="14" stroke-linecap="round" filter="url(#gl)"') + path(d, 'none', 'stroke="#ffd0e8" stroke-width="6" stroke-linecap="round"')); };
  const O = (i, j) => { const x = ox + i * S + S / 2, y = oy + j * S + S / 2; return circ(x, y, 24, 'none', 'stroke="#3af0ff" stroke-width="14" filter="url(#gl)"') + circ(x, y, 24, 'none', 'stroke="#d0fcff" stroke-width="6"'); };
  b += X(0, 0) + X(1, 1) + O(1, 0) + O(2, 1) + O(0, 2) + X(2, 2, .35);
  b += path(`M${ox + 20} ${oy + 20} L${ox + 3 * S - 20} ${oy + 3 * S - 20}`, 'none', 'stroke="#ff4fa8" stroke-width="3" stroke-dasharray="8 10" opacity=".7"');
  return T(defs, b);
};

THUMBS['cookie-clicker'] = () => {
  const defs = rg('bg', .45, .45, .8, [[0, '#c8742a'], [.6, '#6a3410'], [1, '#2a1406']]) + rg('ck', .38, .32, .75, [[0, '#f0b86a'], [.7, '#c8823a'], [1, '#8a5020']]) + blur('gl', 16) + rg('chip', .35, .3, .7, [[0, '#6a3a1a'], [1, '#2a1206']]);
  let b = rect(0, 0, W, H, 'url(#bg)');
  for (let a = 0; a < 16; a++) { const r = a * Math.PI / 8; b += path(`M300 180 L${300 + Math.cos(r - .08) * 520} ${180 + Math.sin(r - .08) * 520} L${300 + Math.cos(r + .08) * 520} ${180 + Math.sin(r + .08) * 520}Z`, '#ffd08a', 'opacity=".07"'); }
  b += circ(300, 180, 150, '#ffb060', 'opacity=".4" filter="url(#gl)"');
  const R = rng(11);
  const cookie = (cx, cy, r, chips = 9) => { const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, rr = r * (.94 + R() * .08); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } let o = ell(cx + r * .08, cy + r * .12, r, r * .95, '#000', 'opacity=".3"') + path(poly(pts), 'url(#ck)') + path(poly(pts), 'none', `stroke="#7a4214" stroke-width="${r * .04}"`); for (let i = 0; i < chips; i++) { const a = R() * 6.283, d = R() * r * .72, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, s = r * (.08 + R() * .06); o += path(poly([[x - s, y - s * .6], [x + s * .2, y - s], [x + s, y - s * .1], [x + s * .5, y + s * .8], [x - s * .7, y + s * .6]]), 'url(#chip)') + circ(x - s * .3, y - s * .4, s * .25, '#a06a3a', 'opacity=".7"'); } for (let i = 0; i < 14; i++) { const a = R() * 6.283, d = R() * r * .8; o += circ(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * .02, '#8a5020', 'opacity=".6"'); } return o; };
  b += cookie(300, 180, 128, 12);
  b += cookie(530, 80, 34, 4) + cookie(90, 270, 30, 4) + cookie(560, 290, 22, 3) + cookie(110, 70, 18, 3);
  for (const [x, y, s] of [[450, 150, 22], [470, 230, 18], [150, 150, 16]]) b += text(x, y, '+1', s, '#fff8e0', `${SANS} opacity=".9"`);
  for (let i = 0; i < 18; i++) b += circ(180 + R() * 300, 60 + R() * 250, 1.5 + R() * 3, '#e8b070', 'opacity=".8"');
  return T(defs, b);
};
