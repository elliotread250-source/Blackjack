// node tools/mp-turn-test.mjs <ws-url> <game>  — two-client protocol test for shared turnrooms games.
const [url, game] = process.argv.slice(2);
const MOVES = { // [first player's move, second player's move, an illegal move]
  c4: [{ col: 3 }, { col: 4 }, { col: 9 }], chess: [{ uci: 'e2e4' }, { uci: 'e7e5' }, { uci: 'e2e5' }], ttt: [{ cell: 4 }, { cell: 0 }, { cell: 9 }],
}[game];
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('FAIL', m); } };
const client = name => new Promise((res, rej) => {
  const ws = new WebSocket(url), c = { ws, inbox: [], name };
  ws.onopen = () => res(c); ws.onerror = () => rej(new Error(name + ' could not connect'));
  ws.onmessage = e => c.inbox.push(JSON.parse(e.data)); ws.onclose = () => c.inbox.push({ t: '__closed' });
});
const send = (c, o) => c.ws.send(JSON.stringify(o));
const next = (c, pred, ms = 3000) => new Promise((res, rej) => { const t0 = Date.now(); const iv = setInterval(() => { const i = c.inbox.findIndex(pred); if (i >= 0) { clearInterval(iv); res(c.inbox.splice(i, 1)[0]); } else if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error(`${c.name}: timeout waiting; got ${JSON.stringify(c.inbox).slice(0, 200)}`)); } }, 15); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  const A = await client('A'), B = await client('B');
  send(A, { t: 'create', name: 'Ann' }); const room = await next(A, m => m.t === 'room');
  ok(/^[A-Z]{4}$/.test(room.code), 'room code');
  send(B, { t: 'join', code: room.code.toLowerCase(), name: 'Bob' });
  const sa = await next(A, m => m.t === 'start'), sb = await next(B, m => m.t === 'start');
  ok(sa.side === 0 && sb.side === 1 && sa.names[1] === 'Bob' && sb.names[0] === 'Ann', 'both seated with names');
  const C = await client('C'); send(C, { t: 'join', code: room.code, name: 'Cy' }); ok((await next(C, m => m.t === 'error')).msg === 'room full', 'third player refused');
  send(C, { t: 'join', code: 'ZZZZ' }); ok((await next(C, m => m.t === 'error')).msg === 'no room', 'unknown code refused');
  const first = sa.first === 0 ? A : B, second = first === A ? B : A;
  send(second, { t: 'move', n: 0, ...MOVES[1] }); ok((await next(second, m => m.t === 'reject')).why === 'turn', 'out-of-turn refused');
  send(first, { t: 'move', n: 0, ...MOVES[2] }); ok(['col', 'illegal', 'cell'].includes((await next(first, m => m.t === 'reject')).why), 'illegal move refused');
  send(first, { t: 'move', n: 5, ...MOVES[0] }); ok((await next(first, m => m.t === 'reject')).why === 'stale', 'stale move refused');
  send(first, { t: 'move', n: 0, ...MOVES[0] });
  const m1 = await next(first, m => m.t === 'move'), m2 = await next(second, m => m.t === 'move');
  ok(m1.n === 1 && m2.n === 1 && JSON.stringify(m1) === JSON.stringify(m2), 'move reaches both players identically');
  if (game === 'ttt') { send(second, { t: 'move', n: 1, cell: 4 }); ok((await next(second, m => m.t === 'reject')).why === 'taken', 'occupied square refused'); }
  // simultaneous: both send at once; only the player on turn may move
  send(second, { t: 'move', n: 1, ...MOVES[1] }); send(first, { t: 'move', n: 1, ...MOVES[1] });
  const got = await next(second, m => m.t === 'move'); const rj = await next(first, m => m.t === 'reject');
  ok(got.n === 2 && ['turn', 'stale'].includes(rj.why) && !first.inbox.some(m => m.t === 'move' && m.n > 2), 'simultaneous moves: exactly one accepted');
  // drop B's socket hard, then resume with the seat token
  B.ws.close(); ok((await next(A, m => m.t === 'away')).t === 'away', 'opponent told when a player drops');
  const B2 = await client('B2'); send(B2, { t: 'resume', code: room.code, token: sb.token });
  const back = await next(B2, m => m.t === 'start'); ok(back.side === 1 && back.n === 2, 'resumed seat with the game state');
  ok((await next(A, m => m.t === 'back')).t === 'back', 'opponent told when the player is back');
  send(B2, { t: 'resume', code: room.code, token: 'nope' }); ok((await next(B2, m => m.t === 'error')).msg === 'no session', 'bad token refused');
  // resign ends the game; rematch needs both
  send(A, { t: 'resign' }); const r1 = await next(A, m => m.t === 'move' && m.over); ok(r1.winner === 1 && r1.score[1] === 1, 'resignation ends the game for the right side');
  send(A, { t: 'rematch' }); ok((await next(B2, m => m.t === 'rematch_req')).t, 'rematch request relayed');
  send(B2, { t: 'rematch' }); const re = await next(A, m => m.t === 'start'); ok(re.game === 2 && re.first !== sa.first && re.n === 0, 'rematch starts a fresh game with the other player first');
  // quick match pairs two waiting players
  const Q1 = await client('Q1'), Q2 = await client('Q2');
  send(Q1, { t: 'quick', name: 'Q1' }); ok((await next(Q1, m => m.t === 'queued')).t, 'queued'); send(Q2, { t: 'quick', name: 'Q2' });
  const q1 = await next(Q1, m => m.t === 'start'), q2 = await next(Q2, m => m.t === 'start'); ok(q1.code === q2.code && q1.side !== q2.side, 'quick match pairs players');
  // leaving notifies the other player
  send(Q1, { t: 'leave' }); ok((await next(Q2, m => m.t === 'left')).t, 'leaving tells the opponent');
  // spam is rate limited, the server survives
  for (let i = 0; i < 80; i++) send(C, { t: 'move', n: 0, ...MOVES[0] });
  await sleep(300); ok(C.inbox.some(m => m.why === 'rate'), 'rate limit engages');
  send(C, { t: 'ping', id: 7 }); ok((await next(C, m => m.t === 'pong')).id === 7, 'server still answering');
  for (const c of [A, B2, C, Q1, Q2]) c.ws.close();
} catch (e) { fails++; console.log('FAIL', e.message); }
console.log(`${game}: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
