// A planner that plays with the real rules: it clones the game and searches hop sequences
// (depth-first, forward first) through the time-expanded world until it finds one that gets a
// few rows further without dying. Used by the unit tests to prove generated worlds are passable
// and by the in-browser demo (?autopilot).
import { HOP_TICKS, TPS } from './logic.js';

const ACTIONS = ['up', 'wait', 'left', 'right', 'down'];
const WAIT_TICKS = 4;

function advance(g, action) {
  if (action === 'wait') {
    for (let i = 0; i < WAIT_TICKS; i++) { g.step(); if (g.player.dead) return false; }
    return true;
  }
  g.input(action);
  g.step();
  if (g.player.dead) return false;
  if (g.player.bumpTick === g.tick) return null; // blocked by a tree or the edge
  for (let i = 0; i < HOP_TICKS + 1 && (g.player.hop || g.player.queue.length); i++) {
    g.step();
    if (g.player.dead) return false;
  }
  return true;
}

export function plan(game, { ahead = 4, maxNodes = 20000, horizon = 16 } = {}) {
  const root = game.clone();
  const target = Math.max(root.player.row, root.player.maxRow) + ahead;
  const startTick = root.tick;
  const limit = startTick + horizon * TPS;
  const seen = new Set();
  let nodes = 0;
  let best = null; // fallback: the action reaching furthest / surviving longest

  function key(g) { return g.player.row + '|' + Math.round(g.player.x * 3) + '|' + g.tick; }

  function dfs(g, first) {
    if (nodes++ > maxNodes) return null;
    const score = g.player.row * 1000 + (g.tick - startTick) * 0.01;
    if (first && (!best || score > best.score)) best = { score, action: first };
    if (g.player.row >= target) return first;
    if (g.tick > limit) return null;
    for (const a of ACTIONS) {
      const c = g.clone();
      const ok = advance(c, a);
      if (!ok) continue;
      const k = key(c);
      if (seen.has(k)) continue;
      seen.add(k);
      const r = dfs(c, first || a);
      if (r) return r;
    }
    return null;
  }
  const found = dfs(root, null);
  return found || (best && best.action) || 'wait';
}

// Drive a game: call every tick; it queues a hop whenever the player is idle.
export class Autopilot {
  constructor(opts) { this.opts = opts || {}; this.waitUntil = 0; }
  update(game) {
    const p = game.player;
    if (p.dead || p.hop || p.queue.length || game.tick < this.waitUntil) return;
    const a = plan(game, this.opts);
    if (a === 'wait') this.waitUntil = game.tick + WAIT_TICKS;
    else game.input(a);
  }
}
