// node tools/mp-probe.mjs <wss-url> — two independent clients: A creates a room, B joins with the code.
const url = process.argv[2];
const open = name => new Promise((res, rej) => {
  const ws = new WebSocket(url), inbox = [];
  const t = setTimeout(() => rej(new Error(name + ': no open in 8s')), 8000);
  ws.onopen = () => { clearTimeout(t); res({ ws, inbox, name }); };
  ws.onerror = e => { clearTimeout(t); rej(new Error(name + ': ' + (e.message || 'socket error'))); };
  ws.onmessage = e => inbox.push(JSON.parse(e.data));
  ws.onclose = e => inbox.push({ t: '__closed', code: e.code });
});
const wait = (c, pred, ms = 6000) => new Promise((res, rej) => {
  const t0 = Date.now(), iv = setInterval(() => { const m = c.inbox.find(pred); if (m) { clearInterval(iv); res(m); } else if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error(`${c.name}: timed out; inbox ${JSON.stringify(c.inbox).slice(0, 300)}`)); } }, 30);
});
const send = (c, o) => c.ws.send(JSON.stringify(o));
try {
  const A = await open('A'), B = await open('B');
  send(A, { t: 'create', name: 'Probe A' });
  const room = await wait(A, m => m.t === 'room');
  console.log('A created room', room.code);
  send(B, { t: 'join', code: room.code, name: 'Probe B' });
  const sb = await wait(B, m => ['start', 'room', 'lobby', 'joined'].includes(m.t) && m !== room);
  console.log('B joined:', JSON.stringify(sb).slice(0, 160));
  const sa = await wait(A, m => m.t !== 'room' && m.t !== 'hello', 4000).catch(e => ({ t: 'none', err: e.message }));
  console.log('A then got:', JSON.stringify(sa).slice(0, 160));
  A.ws.close(); await new Promise(r => setTimeout(r, 800));
  console.log('B after A closed:', JSON.stringify(B.inbox.slice(-2)).slice(0, 200));
  B.ws.close();
  process.exit(0);
} catch (e) { console.log('FAIL', e.message); process.exit(1); }
