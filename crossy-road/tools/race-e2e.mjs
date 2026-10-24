// node crossy-road/tools/race-e2e.mjs [http://localhost:9410] — two raw WebSocket clients race on a real
// server: room, start, relayed positions, real replays (scores compared with replayRun here), standings,
// a too-fast run disqualified, reconnect with the seat token, rematch.
import { replayRun } from '../js/logic.js';

const base = (process.argv[2] || 'http://localhost:9410').replace(/\/$/, '');
const wsUrl = base.replace(/^http/, 'ws') + '/ws';
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else fails.push(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function client(name) {
  const ws = new WebSocket(wsUrl);
  const c = { ws, name, inbox: [], waiters: [] };
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    c.inbox.push(m);
    for (const w of c.waiters.slice()) if (w.test(m)) { c.waiters.splice(c.waiters.indexOf(w), 1); w.resolve(m); }
  };
  c.open = new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  c.send = o => ws.send(JSON.stringify(o));
  c.wait = (t, pred = () => true, ms = 8000) => {
    const hit = c.inbox.find(m => m.t === t && pred(m));
    if (hit) { c.inbox.splice(c.inbox.indexOf(hit), 1); return Promise.resolve(hit); }
    return new Promise((resolve, reject) => {
      const w = { test: m => m.t === t && pred(m), resolve: m => { c.inbox.splice(c.inbox.indexOf(m), 1); resolve(m); } };
      c.waiters.push(w);
      setTimeout(() => reject(new Error(`${name}: no ${t} within ${ms} ms`)), ms);
    });
  };
  return c;
}

// a run: hop up every `gap` ticks, sometimes sideways
const run = (n, gap, side) => Array.from({ length: n }, (_, i) => [10 + i * gap, side && i % 5 === 4 ? side : 'up']);

try {
  const a = client('A'), b = client('B');
  await Promise.all([a.open, b.open]);
  a.send({ t: 'create', name: 'Alice', ch: 'chicken' });
  const la = await a.wait('lobby');
  ok(/^[A-Z]{4}$/.test(la.code) && la.host === la.you, 'room created');
  b.send({ t: 'join', code: la.code, name: 'Bob', ch: 'duck' });
  const lb = await b.wait('lobby');
  ok(lb.players.length === 2, 'second player joined');
  a.send({ t: 'go', hopTicks: 8 });
  const [sa, sb] = await Promise.all([a.wait('start'), b.wait('start')]);
  ok(sa.seed === sb.seed && sa.hopTicks === 8 && sa.in > 3000, 'same seed and countdown for both');
  // B "plays" too long for the time that has passed: disqualified
  b.send({ t: 'finish', inputs: run(5, 20), endTick: 5000, fast: [] });
  const dq = await a.wait('result', m => m.id === sb.you);
  ok(dq.status === 'dq', 'a run longer than real time is disqualified');
  await sleep(sa.in + 200);
  a.send({ t: 'pos', k: 30, r: 2, x: 0.5, s: 2, d: false });
  const p = await b.wait('pos');
  ok(p.id === sa.you && p.r === 2, 'positions relayed');
  await sleep(3200);
  const inputs = run(18, 14, 'left'), endTick = 300;
  const expect = replayRun({ seed: sa.seed, hopTicks: 8, inputs, fast: [], endTick });
  a.send({ t: 'finish', inputs, endTick, fast: [] });
  const ra = await b.wait('result', m => m.id === sa.you, 10000);
  ok(ra.status === 'ok' && ra.score === expect.score, `server replay matches the game (${ra.score} vs ${expect.score})`);
  const fin = await a.wait('final');
  ok(fin.standings[0].id === sa.you && fin.standings[0].place === 1 && fin.standings[1].status === 'dq', 'final standings');

  // reconnect: drop B's socket, resume with the token, then a rematch
  const tokB = lb.token;
  b.ws.close();
  await sleep(300);
  const b2 = client('B2');
  await b2.open;
  b2.send({ t: 'resume', code: la.code, token: tokB });
  const lb2 = await b2.wait('lobby');
  ok(lb2.you === lb.you && lb2.phase === 'done' && lb2.standings, 'resume returns to the same seat with the results');
  a.send({ t: 'go', hopTicks: 4 });
  const [s2a, s2b] = await Promise.all([a.wait('start'), b2.wait('start')]);
  ok(s2a.seed === s2b.seed && s2a.seed !== sa.seed && s2a.hopTicks === 4 && s2a.race === 2, 'rematch on a new seed at Fast speed');
  await sleep(s2a.in + 3500);
  const in2 = run(25, 6), e2 = 240;
  const ex2 = replayRun({ seed: s2a.seed, hopTicks: 4, inputs: in2, fast: [], endTick: e2 });
  b2.send({ t: 'finish', inputs: in2, endTick: e2, fast: [] });
  a.send({ t: 'finish', inputs: in2, endTick: e2, fast: [] });
  const f2 = await a.wait('final', () => true, 10000);
  ok(f2.standings.every(r => r.status === 'ok' && r.score === ex2.score) && f2.standings.every(r => r.place === 1), `identical runs tie for first (${ex2.score})`);
  a.send({ t: 'leave' });
  a.ws.close(); b2.ws.close();
} catch (e) {
  fails.push(String(e.message || e));
}
if (fails.length) for (const f of fails) console.log('FAIL', f);
console.log(`${pass} passed, ${fails.length} failed (${base})`);
process.exit(fails.length ? 1 : 0);
