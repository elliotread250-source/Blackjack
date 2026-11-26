// Static server for Railway plus the multiplayer rooms. Serves the built game from dist/
// and relays players, block edits, chat and creatures between everyone in a room over
// WebSocket (/ws). A room is a seed, a game mode and the list of blocks players changed;
// terrain itself is generated in each browser from the seed.
import express from 'express';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { WebSocketServer } from 'ws';

const app = express();
const dist = path.join(path.dirname(new URL(import.meta.url).pathname), 'dist');
const port = Number(process.env.PORT) || 8080;

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/ is missing. Run "npm run build" first.');
  process.exit(1);
}

app.disable('x-powered-by');
app.use(compression());
app.get('/healthz', (_req, res) => res.type('text').send('ok'));
// The offline build downloads as a file instead of opening in the tab.
app.get('/download', (_req, res) => res.download(path.join(dist, 'blockforge.html'), 'blockforge.html'));
app.use(express.static(dist, {
  extensions: ['html'],
  setHeaders(res, file) {
    res.setHeader('Cache-Control', file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600');
  },
}));
app.use((_req, res) => res.status(404).sendFile(path.join(dist, 'index.html')));

const server = app.listen(port, '0.0.0.0', () => console.log(`BlockForge listening on :${port}`));

// ============================================================================ multiplayer
const MAX_ROOMS = 200;
const MAX_PLAYERS = 12;
const MAX_EDITS = 400000;          // per room
const EMPTY_ROOM_TTL = 6 * 3600e3; // an empty room is kept this long (7 days when saved to disk)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DATA_DIR = process.env.DATA_DIR || '';   // set this (to a Railway volume) to keep rooms across restarts

/** code -> { code, seed, mode, ver, edits: Map<"x,y,z", v>, clients: Map<id, client>, host, time, emptySince, dirty } */
const rooms = new Map();
let nextClient = 1;

const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const num = (v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 4e7;
const cleanName = (s) => String(s ?? '').replace(/[^\w \-]/g, '').trim().slice(0, 16) || 'Player';

function newCode() {
  for (let tries = 0; tries < 50; tries++) {
    let c = '';
    for (let i = 0; i < 5; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    if (!rooms.has(c)) return c;
  }
  return null;
}

function send(ws, msg) { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function broadcast(room, msg, except) {
  const s = JSON.stringify(msg);
  for (const c of room.clients.values()) if (c !== except && c.ws.readyState === 1) c.ws.send(s);
}
const publicPlayer = (c) => ({ id: c.id, name: c.name, x: c.x, y: c.y, z: c.z, yaw: c.yaw, pitch: c.pitch });

function enter(client, room) {
  client.room = room;
  room.clients.set(client.id, client);
  room.emptySince = 0;
  if (!room.host || !room.clients.has(room.host)) room.host = client.id;
  send(client.ws, {
    t: 'joined', code: room.code, id: client.id, seed: room.seed, mode: room.mode, host: room.host, time: room.time,
    players: [...room.clients.values()].filter((c) => c !== client).map(publicPlayer),
  });
  // the room's edits, in pieces so one message never gets huge
  let part = [];
  for (const [k, v] of room.edits) {
    const [x, y, z] = k.split(',');
    part.push(+x, +y, +z, v);
    if (part.length >= 40000) { send(client.ws, { t: 'b', e: part }); part = []; }
  }
  if (part.length) send(client.ws, { t: 'b', e: part });
  for (const [k, s] of room.chests) send(client.ws, { t: 'chest', k, s });
  send(client.ws, { t: 'ready' });
  broadcast(room, { t: 'join', p: publicPlayer(client) }, client);
}

function leave(client) {
  const room = client.room;
  if (!room) return;
  client.room = null;
  room.clients.delete(client.id);
  broadcast(room, { t: 'leave', id: client.id });
  if (room.clients.size === 0) { room.emptySince = Date.now(); room.host = 0; }
  else if (room.host === client.id) {
    room.host = room.clients.keys().next().value;
    broadcast(room, { t: 'host', id: room.host });
  }
}

function handle(client, m) {
  if (!m || typeof m.t !== 'string') return;
  const room = client.room;
  if (!room) {
    if (m.t === 'host') {
      if (rooms.size >= MAX_ROOMS) return send(client.ws, { t: 'err', msg: 'The server is full. Try again later.' });
      const code = newCode();
      if (!code || !int(m.seed, -2147483648, 2147483647) || !int(m.ver, 1, 1e6)) return send(client.ws, { t: 'err', msg: 'Could not create the room.' });
      client.name = cleanName(m.name);
      const r = { code, seed: m.seed, mode: m.mode === 'survival' ? 'survival' : 'creative', ver: m.ver, edits: new Map(), chests: new Map(), clients: new Map(), host: 0, time: 0.05, emptySince: 0, dirty: true };
      rooms.set(code, r);
      enter(client, r);
    } else if (m.t === 'join') {
      const r = rooms.get(String(m.code ?? '').toUpperCase().trim());
      if (!r) return send(client.ws, { t: 'err', msg: 'No world with that code. Check it and try again.' });
      if (r.ver !== m.ver) return send(client.ws, { t: 'err', msg: 'That world was made with a different game version. Reload the page and try again.' });
      if (r.clients.size >= MAX_PLAYERS) return send(client.ws, { t: 'err', msg: 'That world is full.' });
      client.name = cleanName(m.name);
      enter(client, r);
    }
    return;
  }
  switch (m.t) {
    case 'p':
      if (!num(m.x) || !num(m.y) || !num(m.z) || !num(m.yaw) || !num(m.pitch)) return;
      client.x = m.x; client.y = m.y; client.z = m.z; client.yaw = m.yaw; client.pitch = m.pitch;
      broadcast(room, { t: 'p', id: client.id, x: m.x, y: m.y, z: m.z, yaw: m.yaw, pitch: m.pitch, f: m.f | 0 }, client);
      break;
    case 'b': {
      const e = m.e;
      if (!Array.isArray(e) || e.length > 4096 || e.length % 4) return;
      for (let i = 0; i < e.length; i += 4) {
        if (!int(e[i], -3e7, 3e7) || !int(e[i + 1], 0, 255) || !int(e[i + 2], -3e7, 3e7) || !int(e[i + 3], 0, 65535)) return;
      }
      for (let i = 0; i < e.length; i += 4) {
        const k = e[i] + ',' + e[i + 1] + ',' + e[i + 2];
        if (room.edits.size >= MAX_EDITS && !room.edits.has(k)) continue;
        room.edits.set(k, e[i + 3]);
      }
      room.dirty = true;
      broadcast(room, { t: 'b', e }, client);
      break;
    }
    case 'chest': {   // what is inside the chest at "x,y,z" (null = the chest is gone)
      const k = String(m.k ?? '');
      if (!/^-?\d{1,9},\d{1,3},-?\d{1,9}$/.test(k)) return;
      if (m.s === null) room.chests.delete(k);
      else if (Array.isArray(m.s) && m.s.length <= 27 && JSON.stringify(m.s).length < 4000 && (room.chests.size < 5000 || room.chests.has(k))) room.chests.set(k, m.s);
      else return;
      room.dirty = true;
      broadcast(room, { t: 'chest', k, s: m.s }, client);
      break;
    }
    case 'chat': {
      const text = String(m.m ?? '').replace(/[\u0000-\u001f]/g, '').slice(0, 120).trim();
      if (text) broadcast(room, { t: 'chat', id: client.id, name: client.name, m: text });
      break;
    }
    case 'mobs':   // creature snapshot from the host
      if (room.host === client.id && Array.isArray(m.m) && m.m.length <= 8 * 64 && m.m.every(num)) broadcast(room, { t: 'mobs', m: m.m }, client);
      break;
    case 'time':
      if (num(m.v)) { room.time = ((m.v % 1) + 1) % 1; broadcast(room, { t: 'time', v: room.time }, client); }
      break;
    case 'to': {   // small direct message: a hit, damage, loot
      const target = room.clients.get(m.to);
      if (target && m.d && typeof m.d === 'object' && JSON.stringify(m.d).length < 600) send(target.ws, { t: 'from', from: client.id, d: m.d });
      break;
    }
  }
}

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 128 * 1024 });
wss.on('connection', (ws) => {
  const client = { id: nextClient++, ws, room: null, name: 'Player', x: 0, y: 80, z: 0, yaw: 0, pitch: 0, tokens: 120, last: Date.now(), alive: true };
  ws.on('pong', () => { client.alive = true; });
  ws.on('message', (data, isBinary) => {
    if (isBinary) return;
    // token bucket: 80 messages a second, bursts to 160
    const now = Date.now();
    client.tokens = Math.min(160, client.tokens + ((now - client.last) / 1000) * 80);
    client.last = now;
    if (client.tokens < 1) return;
    client.tokens -= 1;
    let m;
    try { m = JSON.parse(data.toString()); } catch { return; }
    try { handle(client, m); } catch (e) { console.warn('[ws] message failed', e); }
  });
  ws.on('close', () => leave(client));
  ws.on('error', () => undefined);
});

// Drop dead connections, forget rooms nobody came back to, save the rest.
setInterval(() => {
  for (const ws of wss.clients) ws.ping();
  const now = Date.now();
  const ttl = DATA_DIR ? 7 * 24 * 3600e3 : EMPTY_ROOM_TTL;
  for (const [code, r] of rooms) {
    if (r.clients.size === 0 && r.emptySince && now - r.emptySince > ttl) {
      rooms.delete(code);
      if (DATA_DIR) fs.promises.unlink(path.join(DATA_DIR, `room-${code}.json`)).catch(() => undefined);
    }
  }
  saveRooms();
}, 30000).unref();

function saveRooms() {
  if (!DATA_DIR) return;
  for (const r of rooms.values()) {
    if (!r.dirty) continue;
    r.dirty = false;
    const e = [];
    for (const [k, v] of r.edits) { const [x, y, z] = k.split(','); e.push(+x, +y, +z, v); }
    const body = JSON.stringify({ code: r.code, seed: r.seed, mode: r.mode, ver: r.ver, time: r.time, e, chests: [...r.chests] });
    fs.promises.writeFile(path.join(DATA_DIR, `room-${r.code}.json`), body).catch((err) => { r.dirty = true; console.warn('[rooms] save failed', err.message); });
  }
}

if (DATA_DIR) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    for (const f of fs.readdirSync(DATA_DIR)) {
      if (!/^room-[A-Z0-9]{5}\.json$/.test(f)) continue;
      try {
        const d = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
        const edits = new Map();
        for (let i = 0; i + 3 < d.e.length; i += 4) edits.set(d.e[i] + ',' + d.e[i + 1] + ',' + d.e[i + 2], d.e[i + 3]);
        rooms.set(d.code, { code: d.code, seed: d.seed, mode: d.mode, ver: d.ver, edits, chests: new Map(Array.isArray(d.chests) ? d.chests : []), clients: new Map(), host: 0, time: d.time ?? 0.05, emptySince: Date.now(), dirty: false });
      } catch (e) { console.warn('[rooms] could not read', f, e.message); }
    }
    console.log(`[rooms] ${rooms.size} saved room(s) loaded from ${DATA_DIR}`);
  } catch (e) { console.warn('[rooms] DATA_DIR unusable', e.message); }
}
process.on('SIGTERM', () => { saveRooms(); setTimeout(() => process.exit(0), 300); });
