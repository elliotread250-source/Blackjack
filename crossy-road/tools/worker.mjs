// The server's game brain: a long-running node process that answers JSON-lines requests from
// server.py using the very same game code the browser runs. That way the score, coins and challenge
// progress the server trusts come from replaying a run, never from what the browser says happened.
//
//   {"id":1,"op":"catalog"}                                   -> characters, challenges and constants
//   {"id":2,"op":"replay","seed":..,"hopTicks":4,"inputs":[[t,"up"],..],"fast":[..],"endTick":..}
//   {"id":3,"op":"daily","day":20375,"runs":[stats,..]}       -> today's three missions + progress
import { createInterface } from 'node:readline';
import { CHARACTERS, CHALLENGES, GEM_VALUE, HOP_CHOICES, PRIZE_PRICE, replayRun } from '../js/logic.js';
import { DAILIES, dailiesForDay, dailyById, progressOf } from '../js/dailies.js';

const DIRS = new Set(['up', 'down', 'left', 'right']);

function handle(req) {
  switch (req.op) {
    case 'catalog':
      return {
        characters: CHARACTERS.map(c => ({ id: c.id, name: c.name, price: c.price, theme: c.theme, code: c.code || null, challenge: c.challenge || null, tier: c.tier || null })),
        challenges: CHALLENGES.map(c => ({ id: c.id, stat: c.challenge.stat, goal: c.challenge.goal })),
        dailies: DAILIES, gemValue: GEM_VALUE, hopChoices: HOP_CHOICES, prizePrice: PRIZE_PRICE,
      };
    case 'replay': {
      const inputs = Array.isArray(req.inputs) ? req.inputs : [];
      if (inputs.length > 40000) throw new Error('too many inputs');
      for (const e of inputs) if (!Array.isArray(e) || !Number.isInteger(e[0]) || e[0] < 0 || !DIRS.has(e[1])) throw new Error('bad input');
      const fast = (Array.isArray(req.fast) ? req.fast : []).filter(Number.isInteger).slice(0, 1000);
      return replayRun({ seed: req.seed >>> 0, hopTicks: req.hopTicks, inputs, fast, endTick: req.endTick });
    }
    case 'daily': {
      const ids = req.ids && req.ids.length === 3 ? req.ids : dailiesForDay(req.day);
      const runs = Array.isArray(req.runs) ? req.runs : [];
      return { ids, progress: ids.map(id => progressOf(dailyById[id], runs)) };
    }
    case 'rotation':
      return { ids: dailiesForDay(req.day) };
    case 'ping':
      return { pong: true };
  }
  throw new Error('unknown op');
}

const rl = createInterface({ input: process.stdin });
rl.on('line', line => {
  let req;
  try { req = JSON.parse(line); } catch { return; }
  let out;
  try { out = { id: req.id, ok: true, result: handle(req) }; } catch (e) { out = { id: req.id, ok: false, error: String(e && e.message || e) }; }
  process.stdout.write(JSON.stringify(out) + '\n');
});
