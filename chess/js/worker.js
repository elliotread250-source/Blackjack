// The computer thinks here, off the main thread, so the board stays smooth.
import { think } from './chess.js';

self.onmessage = e => {
  const { id, fen, level } = e.data;
  const r = think(fen, level);
  self.postMessage({ id, move: r.move && { from: r.move.from, to: r.move.to, promo: r.move.promo }, score: r.score, depth: r.depth });
};
