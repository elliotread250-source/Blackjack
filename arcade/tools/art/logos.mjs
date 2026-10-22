// Square game logos: 96x96 rounded tiles, one bold emblem each, readable down to 40px.
import { svg, lg, rg, blur, rect, circ, ell, path, line, g, text, poly, suit, SANS, SERIF, shade, iso, voxel } from './lib.mjs';
import { KNIGHT } from './thumbs3.mjs';

const S = 96;
// tile(c1 top, c2 bottom, body): gradient tile, inner top highlight, hairline border
function tile(c1, c2, body, extraDefs = '') {
  const defs = lg('tl', 0, 0, 0, 1, [[0, c1], [1, c2]]) + lg('hl', 0, 0, 0, 1, [[0, '#fff', .22], [.5, '#fff', 0]]) + extraDefs;
  return svg(S, S, defs, rect(0, 0, S, S, 'url(#tl)', 'rx="22"') + rect(0, 0, S, S, 'url(#hl)', 'rx="22"') + body + rect(.75, .75, S - 1.5, S - 1.5, 'none', 'rx="21.5" stroke="#fff" stroke-opacity=".14" stroke-width="1.5"'));
}
const GL = blur('gl', 3);
export const LOGOS = {};

LOGOS['blackjack'] = () => tile('#0f6a45', '#05281a', g('transform="rotate(-8 48 48)"', rect(26, 16, 46, 64, '#000', 'rx="7" opacity=".35" transform="translate(3 4)"') + rect(26, 16, 46, 64, '#fbf8f1', 'rx="7" stroke="#e9c46a" stroke-width="3"') + suit('spade', 49, 50, 34, '#15171c') + text(32, 32, 'A', 13, '#15171c', SERIF)));
LOGOS['pool'] = () => tile('#13704a', '#06301e', line(10, 86, 52, 46, '#e8c890', 5, 'stroke-linecap="round"') + line(10, 86, 26, 71, '#3a1d0c', 6, 'stroke-linecap="round"') + circ(58, 42, 25, 'url(#b)') + circ(58, 42, 11, '#f4f1e8') + text(58, 47, '8', 14, '#111', `${SANS} text-anchor="middle"`) + ell(50, 32, 7, 4, '#fff', 'opacity=".5"'), rg('b', .35, .3, .7, [[0, '#555'], [.5, '#111'], [1, '#000']]));
LOGOS['kart-racer'] = () => tile('#e8322c', '#7a0a12', path('M18 58 Q18 24 50 22 Q80 22 80 52 L80 66 L30 66 Q18 66 18 58Z', '#f4c430') + path('M44 36 H80 V54 H48 Q42 54 42 46Z', '#1a2a4a') + path('M48 40 H76', 'none', 'stroke="#8ad0ff" stroke-width="3" stroke-linecap="round"') + path('M22 52 H40', 'none', 'stroke="#e8322c" stroke-width="5" stroke-linecap="round"') + rect(30, 66, 50, 6, '#222', 'rx="2"'));
LOGOS['geometry-dash'] = () => tile('#2a2ad8', '#100a5a', g('transform="rotate(-10 48 48)"', rect(20, 20, 56, 56, '#ffd21f', 'rx="6" stroke="#000" stroke-width="4"') + rect(30, 31, 14, 14, '#3af0ff', 'stroke="#000" stroke-width="3"') + rect(52, 31, 14, 14, '#3af0ff', 'stroke="#000" stroke-width="3"') + rect(30, 55, 36, 9, '#3af0ff', 'stroke="#000" stroke-width="3"')));
LOGOS['bloons-td-6'] = () => tile('#7cd04a', '#2f7a2a', path('M48 16 C68 16 74 36 70 50 C66 64 54 70 48 72 C42 70 30 64 26 50 C22 36 28 16 48 16Z', '#e8322c') + path('M44 72 L52 72 L48 78Z', '#9a1a1a') + ell(40, 30, 7, 10, '#fff', 'opacity=".5" transform="rotate(-20 40 30)"') + path('M84 14 L60 38', 'none', 'stroke="#5a3a1a" stroke-width="4" stroke-linecap="round"') + path('M60 38 L54 46 L64 42Z', '#d0d0d8') + path('M84 14 L90 8 M84 14 L92 16 M84 14 L82 6', 'none', 'stroke="#fff" stroke-width="2.5"'));
LOGOS['flappy-bird'] = () => {
  const B = (x, y, w, h, c) => rect(16 + x * 6, 22 + y * 6, w * 6, h * 6, c);
  return tile('#4ec0e8', '#2a8ab8', B(2, 0, 7, 1, '#222') + B(1, 1, 9, 1, '#222') + B(0, 2, 11, 6, '#222') + B(1, 8, 9, 1, '#222') + B(1, 1, 7, 1, '#f8e04a') + B(1, 2, 8, 6, '#f8d030') + B(6, 1, 3, 4, '#fff') + B(8, 2, 1, 2, '#222') + B(7, 5, 5, 2, '#f06a1a') + B(0, 3, 4, 3, '#fff4c0') + B(1, 6, 6, 2, '#f0a020'));
};
LOGOS['space-invaders'] = () => {
  const m = ['00100000100', '00010001000', '00111111100', '01101110110', '11111111111', '10111111101', '10100000101', '00011011000'];
  let o = ''; m.forEach((r, j) => [...r].forEach((v, i) => { if (v === '1') o += rect(15 + i * 6, 24 + j * 6, 6, 6, '#3af0ff'); }));
  return tile('#2a0a50', '#06021a', g('filter="url(#gl)" opacity=".8"', o) + o, GL);
};
LOGOS['pong'] = () => tile('#1a1d22', '#000', rect(16, 22, 9, 34, '#fff') + rect(71, 42, 9, 34, '#fff') + rect(52, 44, 10, 10, '#fff') + rect(52, 44, 10, 10, '#fff', 'filter="url(#gl)"') + rect(38, 52, 8, 8, '#fff', 'opacity=".4"') + rect(26, 58, 6, 6, '#fff', 'opacity=".2"') + path('M48 12 V84', 'none', 'stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-dasharray="5 5"'), GL);
LOGOS['tetris'] = () => {
  const c = (x, y, col) => rect(x, y, 18, 18, col, 'rx="2"') + rect(x + 2, y + 2, 14, 5, '#fff', 'opacity=".4" rx="1"');
  return tile('#1a1650', '#07061e', c(21, 21, '#b44bff') + c(39, 21, '#b44bff') + c(57, 21, '#b44bff') + c(39, 39, '#b44bff') + c(21, 57, '#21d4e8') + c(39, 57, '#f8d030') + c(57, 57, '#f8d030') + c(57, 39, '#f8d030') + c(21, 39, '#f08a1a'));
};
LOGOS['snake'] = () => tile('#1a5a24', '#0a240e', path('M18 70 Q18 54 34 54 H52', 'none', 'stroke="#3fbf3a" stroke-width="14" stroke-linecap="round"') + path('M48 40 L72 46 L80 58 L72 70 L48 76Z', '#7aee4a') + path('M48 40 L72 46 L80 58 L48 58Z', '#9aff6a') + circ(62, 52, 4.5, '#fff') + circ(63.5, 52, 2.2, '#111') + path('M80 58 L90 58 M86 58 L92 54 M86 58 L92 62', 'none', 'stroke="#e8222c" stroke-width="3" stroke-linecap="round"') + circ(26, 26, 8, '#e8222c') + path('M26 18 q2 -6 6 -6', 'none', 'stroke="#5a3a1a" stroke-width="2.5"'));
LOGOS['pac-man'] = () => tile('#1a2aa8', '#03051a', path('M44 48 L74 30 A34 34 0 1 0 74 66Z', '#ffd21f') + circ(46, 30, 4, '#03051a') + circ(74, 48, 4, '#ffd9a8') + circ(86, 48, 4, '#ffd9a8'));
LOGOS['2048'] = () => tile('#f2c45a', '#c8862a', rect(14, 26, 68, 44, '#000', 'rx="9" opacity=".2" transform="translate(2 4)"') + rect(14, 26, 68, 44, '#edc53f', 'rx="9"') + rect(17, 29, 62, 12, '#fff', 'opacity=".25" rx="6"') + text(48, 56, '2048', 21, '#fff9ef', `${SANS} text-anchor="middle"`));
LOGOS['minesweeper'] = () => {
  let o = circ(42, 54, 20, '#0a0e10');
  for (let a = 0; a < 8; a++) { const r = a * Math.PI / 4; o += line(42 + Math.cos(r) * 16, 54 + Math.sin(r) * 16, 42 + Math.cos(r) * 28, 54 + Math.sin(r) * 28, '#0a0e10', 5, 'stroke-linecap="round"'); }
  return tile('#5a7a88', '#24323c', o + circ(35, 47, 5, '#fff', 'opacity=".8"') + line(68, 46, 68, 14, '#1a1a1a', 4) + path('M68 14 L88 22 L68 30Z', '#ff3a4a') + rect(58, 44, 20, 5, '#1a1a1a'));
};
LOGOS['solitaire'] = () => tile('#1f7a4a', '#0a3a22', rect(36, 20, 40, 56, '#1a3a8a', 'rx="6" stroke="#fff" stroke-width="2.5" transform="rotate(12 56 48)"') + g('transform="rotate(-8 42 48)"', rect(20, 18, 44, 60, '#fbf8f1', 'rx="7" stroke="#e9c46a" stroke-width="2.5"') + suit('heart', 42, 52, 30, '#d22b3a') + text(26, 34, 'A', 13, '#d22b3a', SERIF)));
LOGOS['wordle'] = () => {
  const t = (x, y, c, ch) => rect(x, y, 30, 30, c, 'rx="5"') + text(x + 15, y + 22, ch, 18, '#fff', `${SANS} text-anchor="middle"`);
  return tile('#2a2f3a', '#0c0e12', t(15, 15, '#4aa860', 'W') + t(51, 15, '#d8b440', 'O') + t(15, 51, '#3a3e46', 'R') + t(51, 51, '#4aa860', 'D'));
};
LOGOS['sudoku'] = () => {
  let o = rect(18, 18, 60, 60, '#fbf7ec', 'rx="5"') + rect(38, 38, 20, 20, '#f4c040');
  for (let i = 1; i < 3; i++) o += line(18 + i * 20, 18, 18 + i * 20, 78, '#2a2e6a', 2.5) + line(18, 18 + i * 20, 78, 18 + i * 20, '#2a2e6a', 2.5);
  o += text(28, 34, '5', 14, '#1a1e5a', `${SERIF} text-anchor="middle"`) + text(48, 54, '9', 15, '#fff', `${SERIF} text-anchor="middle"`) + text(68, 74, '3', 14, '#1a1e5a', `${SERIF} text-anchor="middle"`) + text(68, 34, '7', 14, '#1a1e5a', `${SERIF} text-anchor="middle"`);
  return tile('#2a2e7a', '#0c0e30', o);
};
LOGOS['breakout'] = () => {
  const cols = ['#ff3a5a', '#ff8a2a', '#ffd23a']; let o = '';
  cols.forEach((c, j) => { for (let i = 0; i < 4; i++) if (!(j === 2 && (i === 1 || i === 2)) && !(j === 1 && i === 2)) o += rect(12 + i * 18, 16 + j * 11, 16, 9, c, 'rx="2"'); });
  return tile('#0a1a5a', '#03061a', o + path('M30 80 L52 50', 'none', 'stroke="#ffd08a" stroke-width="6" stroke-linecap="round" opacity=".5"') + circ(54, 47, 7, '#fff') + rect(20, 80, 40, 7, '#2ab8ff', 'rx="3.5"') + rect(48, 30, 8, 6, '#ffd23a', 'transform="rotate(30 52 33)"'));
};
LOGOS['asteroids'] = () => tile('#141a2e', '#000', circ(48, 48, 32, 'none', 'stroke="#9ab0ff" stroke-width="2" stroke-dasharray="3 6" opacity=".6"') + path(poly([[68, 20], [82, 26], [84, 38], [74, 44], [62, 36]]), '#1a1e2a', 'stroke="#9ab0ff" stroke-width="2.5"') + path(poly([[16, 60], [26, 56], [32, 66], [24, 74], [14, 70]]), '#1a1e2a', 'stroke="#9ab0ff" stroke-width="2.5"') + g('transform="rotate(-40 48 50)"', path('M48 30 L60 66 L48 58 L36 66Z', '#0a0c14', 'stroke="#fff" stroke-width="3.5" stroke-linejoin="round"') + path('M43 62 L48 76 L53 62Z', '#ff8c32')));
LOGOS['dino-run'] = () => {
  const P = 5, D = (x, y, w, h) => rect(22 + x * P, 16 + y * P, w * P, h * P, '#1a1418');
  return tile('#f49a4a', '#c8483a', D(5, 0, 6, 1) + D(4, 1, 8, 4) + D(4, 5, 5, 1) + D(0, 5, 1, 3) + D(1, 6, 2, 3) + D(2, 5, 8, 6) + D(9, 7, 2, 1) + D(3, 11, 6, 1) + D(3, 12, 2, 2) + D(7, 12, 2, 1) + rect(22 + 6 * P, 16 + P, P, P, '#f8d08a'));
};
LOGOS['drift-boss'] = () => tile('#5a1a7a', '#1a0a3a', path('M14 80 Q40 62 60 70', 'none', 'stroke="#000" stroke-width="5" opacity=".6"') + path('M18 88 Q44 70 64 78', 'none', 'stroke="#000" stroke-width="5" opacity=".6"') + circ(56, 42, 26, '#1a1a1e') + circ(56, 42, 26, 'none', 'stroke="#3ad8d0" stroke-width="4"') + circ(56, 42, 13, '#8a8a92') + [0, 1, 2, 3, 4].map(i => line(56, 42, 56 + Math.cos(i * 1.256) * 12, 42 + Math.sin(i * 1.256) * 12, '#3a3a42', 3)).join('') + circ(56, 42, 4, '#ff7a6a') + [0, 1, 2, 3, 4, 5, 6, 7].map(i => rect(54, 14, 4, 6, '#2a2a30', `transform="rotate(${i * 45} 56 42)"`)).join(''));
LOGOS['doodle-jump'] = () => tile('#fdf6e4', '#e8dcb8', rect(14, 72, 68, 10, '#7ac84a', 'rx="5" stroke="#3a3020" stroke-width="2.5"') + ell(44, 42, 20, 19, '#c8e84a', 'stroke="#3a3020" stroke-width="3"') + path('M24 44 h40 v8 q0 4 -4 4 h-32 q-4 0 -4 -4Z', '#7a5aa8', 'stroke="#3a3020" stroke-width="2.5"') + path('M58 32 h18 v9 h-18Z', '#c8e84a', 'stroke="#3a3020" stroke-width="2.5"') + circ(40, 34, 5, '#fff', 'stroke="#3a3020" stroke-width="2"') + circ(41, 34, 2.2, '#3a3020') + line(36, 60, 34, 68, '#3a3020', 3, 'stroke-linecap="round"') + line(50, 60, 52, 68, '#3a3020', 3, 'stroke-linecap="round"'));
LOGOS['crossy-road'] = () => {
  const I = iso(41, 80, 27);
  return tile('#7ad04a', '#3a9a2a', ell(48, 80, 24, 6, '#000', 'opacity=".2"') + voxel(I, 0, 0, .9, 1.2, 1.2, 1.1, '#ffffff') + voxel(I, .7, .15, 2, .55, .9, .6, '#ffffff') + voxel(I, .8, .4, 2.6, .35, .4, .3, '#e8322c') + voxel(I, 1.25, .45, 2.1, .3, .3, .22, '#f49a1a') + voxel(I, .35, .25, .3, .18, .18, .6, '#f49a1a') + voxel(I, .35, .8, .3, .18, .18, .6, '#f49a1a') + voxel(I, -.2, .3, 1.4, .3, .7, .5, '#eaeaea') + (() => { const [x, y] = I.P(1.25, .7, 2.45); return rect(x - 2, y - 2, 4, 4, '#111'); })());
};
LOGOS['stickman-hook'] = () => tile('#2ab8e8', '#1a6aa8', circ(60, 22, 11, '#ff7a3a') + circ(60, 22, 11, 'none', 'stroke="#fff" stroke-width="3"') + line(60, 22, 40, 52, '#1a1a1a', 2.5) + g('transform="translate(38 58) rotate(-25)"', circ(0, -10, 6, '#1a1a1a') + line(0, -4, 0, 14, '#1a1a1a', 5, 'stroke-linecap="round"') + line(0, -2, 6, -8, '#1a1a1a', 4, 'stroke-linecap="round"') + line(0, 14, -8, 26, '#1a1a1a', 4, 'stroke-linecap="round"') + line(0, 14, 8, 24, '#1a1a1a', 4, 'stroke-linecap="round"')) + path('M14 84 Q30 66 34 60', 'none', 'stroke="#fff" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"'));
LOGOS['connect-4'] = () => tile('#2a7aff', '#1448c0', [[0, 3, 'r'], [1, 2, 'y'], [2, 1, 'r'], [3, 0, 'y'], [0, 2, ''], [1, 3, 'y'], [2, 3, 'r'], [3, 3, 'r'], [0, 0, ''], [1, 0, ''], [2, 0, ''], [0, 1, ''], [1, 1, 'r'], [3, 1, ''], [2, 2, 'y'], [3, 2, 'y']].map(([i, j, c]) => circ(21 + i * 18, 21 + j * 18, 7.5, c === 'r' ? '#e8222c' : c === 'y' ? '#f8d030' : '#081438')).join('') + line(21, 75, 75, 21, '#fff', 3, 'opacity=".55" stroke-linecap="round"'));
LOGOS['candy-match'] = () => tile('#ffb8d8', '#b88aff', path('M18 48 l-10 -12 v24Z M78 48 l10 -12 v24Z', '#ff8ab8') + ell(48, 48, 30, 20, '#ff5a9a') + path('M34 30 v36 M48 28 v40 M62 30 v36', 'none', 'stroke="#fff" stroke-width="5" opacity=".7"') + ell(40, 38, 12, 5, '#fff', 'opacity=".5"'));
LOGOS['boggle'] = () => {
  const die = (x, y, r, ch, on) => g(`transform="rotate(${r} ${x} ${y})"`, rect(x - 17, y - 14, 34, 34, '#b8a888', 'rx="7"') + rect(x - 17, y - 17, 34, 32, on ? '#e8f4ff' : '#fffaf0', 'rx="7"') + text(x, y + 7, ch, 20, on ? '#1a4aff' : '#1a1e3a', `${SANS} text-anchor="middle"`));
  return tile('#1a2a6a', '#060a24', die(32, 34, -8, 'W', 1) + die(64, 34, 6, 'O', 1) + die(32, 66, 4, 'R', 0) + die(64, 66, -6, 'D', 1) + path('M32 34 L64 34 L64 66', 'none', 'stroke="#3ab8ff" stroke-width="3" opacity=".7" stroke-linecap="round"'));
};
LOGOS['tic-tac-toe'] = () => tile('#3a0a5a', '#08041a', path('M24 24 L52 52 M52 24 L24 52', 'none', 'stroke="#ff4fa8" stroke-width="10" stroke-linecap="round" filter="url(#gl)"') + path('M24 24 L52 52 M52 24 L24 52', 'none', 'stroke="#ffd0e8" stroke-width="5" stroke-linecap="round"') + circ(60, 60, 17, 'none', 'stroke="#3af0ff" stroke-width="10" filter="url(#gl)"') + circ(60, 60, 17, 'none', 'stroke="#d0fcff" stroke-width="5"'), GL);
LOGOS['cookie-clicker'] = () => tile('#c8742a', '#5a2a0c', ell(51, 53, 32, 30, '#000', 'opacity=".3"') + circ(48, 48, 31, 'url(#ck)') + circ(48, 48, 31, 'none', 'stroke="#7a4214" stroke-width="2"') + [[38, 36, 6], [58, 32, 5], [62, 54, 6.5], [40, 60, 5], [50, 46, 4], [28, 50, 3.5]].map(([x, y, r]) => path(poly([[x - r, y - r * .5], [x + r * .2, y - r], [x + r, y - r * .1], [x + r * .5, y + r * .8], [x - r * .7, y + r * .6]]), '#3a1a08')).join('') + ell(38, 34, 10, 5, '#fff', 'opacity=".18"'), rg('ck', .38, .32, .75, [[0, '#f0b86a'], [.7, '#c8823a'], [1, '#8a5020']]));
LOGOS['block-blast'] = () => {
  const b = (x, y, c) => rect(x, y, 22, 22, c, 'rx="5"') + rect(x + 3, y + 3, 16, 6, '#fff', 'opacity=".4" rx="2"');
  return tile('#1a2a8a', '#080e3a', b(14, 14, '#ff8a2a') + b(37, 14, '#ff8a2a') + b(37, 37, '#3af0ff') + b(60, 37, '#3af0ff') + b(14, 60, '#b44bff') + b(37, 60, '#b44bff') + b(60, 60, '#b44bff'));
};
LOGOS['chess'] = () => tile('#2a2018', '#08060a', g('transform="translate(23 14) scale(.52)"', path(KNIGHT, 'url(#iv)') + path(KNIGHT, 'none', 'stroke="#e9c46a" stroke-width="4"') + circ(30, 30, 4, '#e9c46a')), lg('iv', 0, 0, 1, 1, [[0, '#fffaf0'], [1, '#c8b890']]));
LOGOS['fruit-ninja'] = () => tile('#3a4048', '#14181c', g('transform="rotate(-25 48 48)"', path('M18 52 A30 30 0 0 0 78 52Z', '#2a8a3a') + path('M22 52 A26 26 0 0 0 74 52Z', '#e8323c') + [[34, 60], [48, 66], [62, 60]].map(([x, y]) => ell(x, y, 2, 3.5, '#1a1010')).join('') + path('M18 44 A30 30 0 0 1 78 44Z', '#2a8a3a') + path('M22 44 A26 26 0 0 1 74 44Z', '#e8323c')) + path('M12 84 L86 14', 'none', 'stroke="#fff" stroke-width="5" stroke-linecap="round" filter="url(#gl)"') + path('M12 84 L86 14', 'none', 'stroke="#fff" stroke-width="2.5" stroke-linecap="round"'), GL);
LOGOS['subway-surfers'] = () => tile('#3a9aff', '#1a5ac8', path('M26 90 L44 46 M70 90 L52 46', 'none', 'stroke="#c0c0c8" stroke-width="4"') + [0, 1, 2].map(i => rect(32 - i * 4, 56 + i * 12, 32 + i * 8, 3, '#5a4a3a')).join('') + g('transform="translate(50 36) rotate(-12)"', circ(0, -16, 8, '#f0b890') + path('M-9 -20 Q0 -31 10 -20 L14 -18 L-9 -17Z', '#e8322c') + path('M-9 -8 Q0 -14 9 -8 L11 12 L-11 12Z', '#f8d030') + line(-4, 12, -12, 28, '#2a2a40', 6, 'stroke-linecap="round"') + line(5, 12, 14, 24, '#2a2a40', 6, 'stroke-linecap="round"') + line(9, -6, 22, -18, '#f8d030', 5, 'stroke-linecap="round"')));
LOGOS['wreck-run'] = () => tile('#8a4a2a', '#2a1408', path('M14 62 Q12 46 26 42 L38 26 L66 26 L78 42 Q86 44 84 62Z', '#e8641a') + path('M40 30 L64 30 L72 42 L32 42Z', '#2a3a4a') + path('M44 30 L50 38 L46 42 M58 30 L56 36', 'none', 'stroke="#fff" stroke-width="1.6" opacity=".8"') + path('M78 44 l6 6 l-4 4 l6 4', 'none', 'stroke="#3a1a08" stroke-width="2.5"') + circ(30, 64, 9, '#1a1a1a') + circ(68, 64, 9, '#1a1a1a') + rect(16, 48, 10, 6, '#fff8d0', 'rx="2"') + [0, 1, 2, 3, 4].map(i => line(86, 24, 86 + Math.cos(-2 + i * .5) * 10, 24 + Math.sin(-2 + i * .5) * 10, '#ffd23a', 2.5, 'stroke-linecap="round"')).join(''));
LOGOS['nosy-neighbour'] = () => tile('#1a2a5a', '#0a1030', rect(28, 52, 44, 30, '#2a8aa8') + rect(24, 36, 44, 18, '#e09a3a', 'transform="rotate(-4 46 54)"') + path('M22 38 L46 14 L72 38Z', '#b24a30', 'transform="rotate(5 46 38)"') + rect(56, 14, 7, 14, '#8a3a2a', 'transform="rotate(10 59 21)"') + rect(42, 60, 14, 16, '#ffc35a', 'stroke="#f4ecd8" stroke-width="2"') + rect(38, 56, 22, 24, '#ffb040', 'opacity=".3" filter="url(#gl)"') + path('M49 60 V76 M42 68 H56', 'none', 'stroke="#f4ecd8" stroke-width="2"') + rect(30, 40, 9, 9, '#1a1e2a', 'stroke="#f4ecd8" stroke-width="1.5" transform="rotate(-4 34 44)"') + circ(76, 18, 7, '#fff8e0', 'opacity=".9"'), GL);
LOGOS['getting-over-it'] = () => tile('#5ab0e8', '#2a6a98', path('M8 88 L34 46 L48 60 L66 24 L90 88Z', '#8a929a') + path('M66 24 L60 36 L72 36Z', '#fff') + path('M30 70 Q28 86 42 86 Q56 86 54 70Z', '#1d1c1b') + ell(42, 70, 12, 3.5, '#33312e') + circ(42, 62, 5.5, '#e8b890') + line(46, 66, 74, 40, '#8a6a4a', 3.5, 'stroke-linecap="round"') + rect(68, 30, 16, 9, '#4a4a52', 'rx="2" transform="rotate(-40 76 34)"'));
LOGOS['blockforge'] = () => {
  const I = iso(48, 24, 26);
  return tile('#6ac0ff', '#2a7ac8', I.box(-.6, -.6, -.9, 1.2, 1.2, .9, '#8a5a32', '#7a4a28', '#5e3a1e') + I.box(-.6, -.6, 0, 1.2, 1.2, .25, '#6fbf4a', '#5ba33a', '#4c8f2f'));
};
LOGOS['apex-gp'] = () => tile('#2a2a32', '#08080c', path('M18 74 L44 20 H58 L84 74 H70 L51 32 L32 74Z', 'url(#rd)') + path('M38 58 H70', 'none', 'stroke="#f0f0f4" stroke-width="6"') + path('M10 82 H86', 'none', 'stroke="#e8222c" stroke-width="4" stroke-dasharray="8 6"'), lg('rd', 0, 0, 0, 1, [[0, '#ff4a4a'], [1, '#a00a14']]));
LOGOS['2-weeks'] = () => tile('#3a9aff', '#0b2a4a', path('M14 78 L50 46 L50 56 L22 82Z', '#d8a25a', 'stroke="#5a3a1a" stroke-width="2"') + rect(50, 30, 30, 26, '#c8924a', 'stroke="#5a3a1a" stroke-width="2"') + path('M50 43 H80 M65 30 V56', 'none', 'stroke="#8a5a2a" stroke-width="2"') + text(48, 30, '2', 26, '#ff7518', `${SANS} text-anchor="middle" stroke="#0b2a4a" stroke-width="3" paint-order="stroke"`) + line(58, 82, 58, 64, '#fff', 2) + path('M58 64 L74 68 L58 72Z', '#ff7518') + ell(48, 86, 38, 6, '#5fbf4a'));
LOGOS['the-humanizer'] = () => tile('#202937', '#0a0d12', rect(16, 26, 26, 4, '#6f7886', 'rx="2"') + rect(16, 36, 20, 4, '#6f7886', 'rx="2"') + rect(16, 46, 24, 4, '#6f7886', 'rx="2"') + path('M44 40 H56 M51 34 L57 40 L51 46', 'none', 'stroke="#ff7518" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"') + text(70, 58, 'Aa', 24, '#f4ead8', `font-family="Georgia,serif" font-style="italic" text-anchor="middle"`) + rect(60, 66, 26, 3, '#ff7518', 'rx="1.5"') + rect(84, 44, 4, 18, '#ff7518'));
LOGOS['nosy-neighbor-v2'] = () => {
  const I = iso(48, 56, 12.5);
  return tile('#c9d3dc', '#7f93a6', I.box(-1.4, -1.1, 0, 2.8, 2.2, 2.2, '#e6e6e2', '#cfcfca', '#a9a9a4') + I.box(-1.4, -1.1, 2.2, 2.8, 2.2, .18, '#b4b4ae', '#9a9a94', '#84847e') +
    path(poly([I.P(1.4, -.5, .5), I.P(1.4, .3, .5), I.P(1.4, .3, 1.4), I.P(1.4, -.5, 1.4)]), '#9fb2c4') + path(poly([I.P(-.3, 1.1, 0), I.P(.4, 1.1, 0), I.P(.4, 1.1, 1.6), I.P(-.3, 1.1, 1.6)]), '#5a6a7a') +
    line(...I.P(-1.4, 1.5, 0), ...I.P(1.4, 1.5, 0), '#ff3366', 3) + circ(...I.P(-1.4, 1.5, 0), 3, '#ff3366') + circ(...I.P(1.4, 1.5, 0), 3, '#ff3366'));
};
LOGOS['retro-bowl'] = () => {
  // a chunky pixel football over a yellow goalpost on turf
  const P = 6, B = (x, y, w, h, c) => rect(12 + x * P, 14 + y * P, w * P, h * P, c);
  return tile('#2f8f3a', '#0f3a17', rect(44, 50, 8, 34, '#ffd21f') + rect(22, 46, 52, 6, '#ffd21f') + rect(22, 16, 6, 34, '#ffd21f') + rect(68, 16, 6, 34, '#ffd21f') +
    B(3, 3, 7, 1, '#6a3410') + B(2, 4, 9, 4, '#7a3e12') + B(3, 8, 7, 1, '#6a3410') + B(1, 5, 1, 2, '#7a3e12') + B(11, 5, 1, 2, '#7a3e12') +
    B(4, 5.6, 5, .5, '#fff') + B(5, 5, .5, 1.7, '#fff') + B(6.5, 5, .5, 1.7, '#fff') + B(8, 5, .5, 1.7, '#fff') + B(2.2, 4.3, 1, 1, '#a35a24'));
};
LOGOS['trap-race'] = () => tile('#3a2d8f', '#17123a',
  rect(10, 70, 76, 14, '#a35a4a', 'rx="3"') + rect(10, 70, 76, 4, '#e0a16a', 'rx="2"') +
  path('M18 70 L24 58 L30 70Z M30 70 L36 58 L42 70Z', '#dfe4ef', 'stroke="#5b6074" stroke-width="1.5"') +
  line(70, 70, 70, 22, '#e8e8f0', 3) + path('M70 22 Q80 18 90 26 Q80 32 70 32Z', '#ff5e8a') +
  g('transform="translate(52 44) rotate(-12)"', rect(-7, -6, 14, 14, '#f08a2c', 'rx="5" stroke="#1a0e2e" stroke-width="1.6"') + circ(0, -12, 7, '#f08a2c', 'stroke="#1a0e2e" stroke-width="1.6"') + path('M-6 -16 L-3 -24 L0 -17Z M2 -17 L5 -24 L7 -15Z', '#f08a2c', 'stroke="#1a0e2e" stroke-width="1.2"') + circ(3, -13, 1.4, '#1a0e2e')) +
  text(48, 94, 'TRAP RACE', 10, '#ffd25e', `${SANS} text-anchor="middle" letter-spacing=".5"`));
