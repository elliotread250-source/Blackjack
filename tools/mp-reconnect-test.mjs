// node tools/mp-reconnect-test.mjs pool|kart <http-url> [graceSeconds]
// Reconnects with raw sockets: a dropped player's seat is held (the other side hears "away"), a resume with
// the seat token restores it ("back", same side/id), a wrong token is refused, and when the grace runs out
// the other player is told they left. Run against a local server started with SEAT_GRACE=3.
const [game, base, graceArg] = process.argv.slice(2);
const url = String(base || '').replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
const grace = Number(graceArg || 3);
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else fails.push(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function client(name) {
  const ws = new WebSocket(url);
  const c = { ws, name, inbox: [] };
  ws.onmessage = e => c.inbox.push(JSON.parse(e.data));
  c.open = new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  c.send = o => ws.send(JSON.stringify(o));
  c.wait = async (t, pred = () => true, ms = 4000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { const i = c.inbox.findIndex(m => m.t === t && pred(m)); if (i >= 0) return c.inbox.splice(i, 1)[0]; await sleep(15); }
    throw new Error(`${name}: no ${t} (${JSON.stringify(c.inbox).slice(0, 200)})`);
  };
  return c;
}

async function pool() {
  const a = client('A'), b = client('B'); await Promise.all([a.open, b.open]);
  a.send({ t: 'create', name: 'Ann' });
  const room = await a.wait('room');
  b.send({ t: 'join', code: room.code, name: 'Ben' });
  const [sa, sb] = await Promise.all([a.wait('start'), b.wait('start')]);
  ok(sa.token && sb.token && sa.token !== sb.token, 'each seat gets its own token');
  b.ws.close();
  const away = await a.wait('away');
  ok(!!away, 'the other player hears "away" (not "left")');
  a.send({ t: 'state', n: 0, b: [], r: {} });          // relayed into the void while B is away: no crash
  const bad = client('B?'); await bad.open;
  bad.send({ t: 'resume', code: room.code, token: sa.token.slice(0, -1) + 'x' });
  ok((await bad.wait('error')).msg === 'no session', 'a wrong token is refused');
  const b2 = client('B2'); await b2.open;
  b2.send({ t: 'resume', code: room.code, token: sb.token });
  const r = await b2.wait('resumed');
  ok(r.side === sb.side && r.seed === sb.seed && r.frame === sb.frame && r.names[1] === 'Ben', 'resume restores the same seat and frame');
  const back = await a.wait('back');
  ok(back.sync === true, 'the player who stayed is asked for a full sync');
  a.send({ t: 'fullsync', n: 3, b: [0], r: {} });
  ok((await b2.wait('fullsync')).n === 3, 'the full sync is relayed');
  b2.send({ t: 'aim', n: 3, d: [1, 0], p: 0.5 });
  ok((await a.wait('aim')).p === 0.5, 'play carries on after the resume');
  // grace runs out
  b2.ws.close();
  await a.wait('away');
  await sleep((grace + 6) * 1000);
  ok(!!(await a.wait('left', () => true, 2000)), 'after the grace the other player is told they left');
  const b3 = client('B3'); await b3.open;
  b3.send({ t: 'resume', code: room.code, token: sb.token });
  ok((await b3.wait('error')).msg === 'no session', 'too late to resume');
  // an explicit leave is immediate
  const c = client('C'), d = client('D'); await Promise.all([c.open, d.open]);
  c.send({ t: 'create', name: 'C' }); const rc = await c.wait('room');
  d.send({ t: 'join', code: rc.code, name: 'D' }); await c.wait('start');
  d.send({ t: 'leave' });
  ok(!!(await c.wait('left')), 'an explicit leave ends the game at once');
  for (const x of [a, bad, b3, c, d]) x.ws.close();
}

async function kart() {
  const a = client('A'), b = client('B'); await Promise.all([a.open, b.open]);
  const ha = await a.wait('hello'), hb = await b.wait('hello');
  ok(ha.tok && hb.tok && ha.tok !== hb.tok, 'each socket gets a seat token');
  a.send({ t: 'create', name: 'Ann' });
  const room = await a.wait('room');
  b.send({ t: 'join', code: room.code, name: 'Ben' });
  await b.wait('room');
  b.send({ t: 'ready', v: true });
  await sleep(200);
  a.send({ t: 'start' });
  await Promise.all([a.wait('start'), b.wait('start')]);
  b.ws.close();
  const away = await a.wait('away');
  ok(away.id === hb.id, 'the others hear "away" with the racer id');
  const snap = await a.wait('room', m => m.players.some(p => p.id === hb.id && p.away));
  ok(snap.players.length === 2, 'the dropped racer keeps their place in the room');
  const b2 = client('B2'); await b2.open; await b2.wait('hello');
  b2.send({ t: 'resume', code: room.code, id: hb.id, tok: 'nope' });
  ok((await b2.wait('error')).msg === 'no session', 'a wrong token is refused');
  b2.send({ t: 'resume', code: room.code, id: hb.id, tok: hb.tok });
  const r = await b2.wait('resumed');
  ok(r.id === hb.id && r.race === 1, 'resume takes the seat back, still in the race');
  ok((await a.wait('back')).id === hb.id, 'the others hear "back"');
  b2.send({ t: 'st', ts: 1, s: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] });
  ok((await a.wait('st')).id === hb.id, 'state from the resumed socket is relayed under the old id');
  b2.send({ t: 'fin', time: 61000 });
  ok((await a.wait('fin')).id === hb.id, 'the resumed racer can still finish');
  // the host drops; after the grace the other racer becomes host
  a.ws.close();
  await b2.wait('away');
  await sleep((grace + 2) * 1000);
  const left = await b2.wait('left', () => true, 3000);
  ok(left.id === ha.id && left.host === hb.id, 'after the grace the host role passes to someone still here');
  b2.ws.close();
}

try { if (game === 'pool') await pool(); else if (game === 'kart') await kart(); else throw new Error('usage: pool|kart <url>'); }
catch (e) { fails.push(String(e.message || e)); }
for (const f of fails) console.log('FAIL', f);
console.log(`${game}: ${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
