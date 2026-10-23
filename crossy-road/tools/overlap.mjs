// node tools/overlap.mjs — lists every pair of boxes in the secret skins that share volume.
import { MODELS } from '../js/characters.js';

export function overlaps(boxes) {
  const lo = (b, k) => (k === 1 ? b[1] : b[k] - b[k + 3] / 2), hi = (b, k) => (k === 1 ? b[1] + b[4] : b[k] + b[k + 3] / 2);
  const bad = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    if ([0, 1, 2].every(k => Math.min(hi(boxes[i], k), hi(boxes[j], k)) - Math.max(lo(boxes[i], k), lo(boxes[j], k)) > 1e-6)) bad.push([i, j]);
  }
  return bad;
}
if (process.argv[1] && process.argv[1].endsWith('overlap.mjs')) {
  for (const id of ['batcostume', 'quackers']) console.log(id, MODELS[id]().length, 'boxes,', overlaps(MODELS[id]()).length, 'overlaps');
}
