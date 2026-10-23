// node tools/overlap.mjs — lists every pair of boxes in the secret skins that share volume.
import { MODELS, batPose, BAT_FLAPS, batFlapBoxes } from '../js/characters.js';

export function overlaps(boxes) {
  const lo = (b, k) => (k === 1 ? b[1] : b[k] - b[k + 3] / 2), hi = (b, k) => (k === 1 ? b[1] + b[4] : b[k] + b[k + 3] / 2);
  const bad = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    if ([0, 1, 2].every(k => Math.min(hi(boxes[i], k), hi(boxes[j], k)) - Math.max(lo(boxes[i], k), lo(boxes[j], k)) > 1e-6)) bad.push([i, j]);
  }
  return bad;
}
if (process.argv[1] && process.argv[1].endsWith('overlap.mjs')) {
  for (const [id, tucked] of [['batcostume', false], ['batcostume', true], ['quackers', false]]) {
    batPose.tucked = tucked;
    const b = MODELS[id](), bad = overlaps(b);
    console.log(id, tucked ? '(tucked)' : '', b.length, 'boxes,', bad.length, 'overlaps', bad.slice(0, 6).map(([i, j]) => JSON.stringify([b[i], b[j]])).join('\n  '));
  }
  for (let i = 0; i < BAT_FLAPS.length; i++) { const b = batFlapBoxes(i); console.log('bat flap', BAT_FLAPS[i], b.length, 'boxes,', overlaps(b).length, 'overlaps, lowest', Math.min(...b.map(x => x[1])).toFixed(2), 'highest', Math.max(...b.map(x => x[1] + x[4])).toFixed(2)); }
}
