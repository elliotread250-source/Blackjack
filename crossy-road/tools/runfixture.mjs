// Test helper: play a seed with the autopilot until `rows` (or death) and print the run as the
// browser would send it. node tools/runfixture.mjs <seed> <hopTicks> <rows> [fastAtTick]
import { Game } from '../js/logic.js';
import { Autopilot } from '../js/autopilot.js';
const [seed, hopTicks, rows, fastAt] = process.argv.slice(2).map(Number);
const g = new Game({ seed, hopTicks }); const ap = new Autopilot();
let n = 0;
while (!g.player.dead && g.score < rows && n++ < 400000) { if (fastAt >= 0 && g.tick === fastAt) g.makeInvincible(); ap.update(g); g.step(); g.events.length = 0; }
process.stdout.write(JSON.stringify({ inputs: g.inputs, fast: g.fastTicks, endTick: g.tick, score: g.score, coins: g.coins, stats: g.runStats() }));
