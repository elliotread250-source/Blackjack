// Multiplayer client. A room on the server holds a seed, a game mode and every block the
// players changed; each browser generates the terrain itself and lays the room's edits on top.
// Positions go out ten times a second, block edits as they happen.
import { COUNT } from '../blocks/registry';
import { chunkKey, colIndex } from '../world/constants';
import type { GenChunk } from '../types';

export interface Remote {
  id: number; name: string;
  x: number; y: number; z: number; yaw: number; pitch: number;
  tx: number; ty: number; tz: number; tyaw: number; tpitch: number;
  walk: number; moving: number; swing: number; sneaking: boolean; survival: boolean;
}

export interface NetEvents {
  onEdit(x: number, y: number, z: number, v: number): void;
  onChat(name: string, text: string): void;
  onJoin(name: string): void;
  onLeave(name: string): void;
  onMobs(snapshot: number[]): void;
  onTime(v: number): void;
  onDirect(from: number, d: Record<string, unknown>): void;
  onHost(isHost: boolean): void;
  onClosed(reason: string): void;
  onChest(key: string, data: unknown): void;
}

export interface RoomInfo { code: string; seed: number; mode: 'creative' | 'survival'; time: number }
const PROTOCOL = COUNT;   // both sides must agree on block ids

export function wsUrl(): string | null {
  if (typeof location === 'undefined' || !/^https?:$/.test(location.protocol)) return null;
  return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
}

export class Net {
  id = 0;
  hostId = 0;
  room: RoomInfo = { code: '', seed: 0, mode: 'creative', time: 0.05 };
  players = new Map<number, Remote>();
  /** Every changed block in the room: chunk key -> (column index -> packed block). */
  edits = new Map<number, Map<number, number>>();
  events: NetEvents | null = null;
  /** Chest contents by "x,y,z", as the server holds them. */
  chests = new Map<string, unknown>();
  private ws: WebSocket;
  private out: number[] = [];
  private posT = 0;
  private closed = false;

  private constructor(ws: WebSocket) { this.ws = ws; }

  get isHost(): boolean { return this.hostId === this.id; }

  /** Open a room (hello.t = 'host') or enter one (hello.t = 'join'). Resolves once its edits have arrived. */
  static connect(hello: { t: 'host'; name: string; seed: number; mode: string } | { t: 'join'; name: string; code: string }): Promise<Net> {
    return new Promise((resolve, reject) => {
      const url = wsUrl();
      if (!url) { reject(new Error('Multiplayer needs the online version of the game.')); return; }
      let ws: WebSocket;
      try { ws = new WebSocket(url); } catch { reject(new Error('Could not reach the server.')); return; }
      const net = new Net(ws);
      let done = false;
      const fail = (msg: string) => { if (!done) { done = true; try { ws.close(); } catch { /* closed */ } reject(new Error(msg)); } };
      const timer = setTimeout(() => fail('The server did not answer.'), 15000);
      ws.onopen = () => ws.send(JSON.stringify({ ...hello, ver: PROTOCOL }));
      ws.onerror = () => fail('Could not reach the server.');
      ws.onclose = () => {
        if (!done) fail('The connection closed.');
        else if (!net.closed) { net.closed = true; net.events?.onClosed('Lost the connection to the server.'); }
      };
      ws.onmessage = (ev) => {
        let m: any;
        try { m = JSON.parse(String(ev.data)); } catch { return; }
        if (!done) {
          if (m.t === 'err') { clearTimeout(timer); fail(String(m.msg || 'Could not join.')); return; }
          if (m.t === 'ready') { clearTimeout(timer); done = true; resolve(net); return; }
        }
        net.receive(m);
      };
    });
  }

  private receive(m: any) {
    switch (m.t) {
      case 'joined':
        this.id = m.id; this.hostId = m.host;
        this.room = { code: m.code, seed: m.seed, mode: m.mode === 'survival' ? 'survival' : 'creative', time: m.time ?? 0.05 };
        for (const p of m.players ?? []) this.addPlayer(p);
        break;
      case 'b': {
        const e = m.e as number[];
        for (let i = 0; i + 3 < e.length; i += 4) {
          this.remember(e[i], e[i + 1], e[i + 2], e[i + 3]);
          this.events?.onEdit(e[i], e[i + 1], e[i + 2], e[i + 3]);
        }
        break;
      }
      case 'p': {
        const r = this.players.get(m.id);
        if (!r) break;
        r.tx = m.x; r.ty = m.y; r.tz = m.z; r.tyaw = m.yaw; r.tpitch = m.pitch;
        const f = m.f | 0;
        r.sneaking = (f & 1) !== 0; r.survival = (f & 4) !== 0;
        if (f & 2) r.swing = 0.001;
        break;
      }
      case 'join': this.addPlayer(m.p); this.events?.onJoin(m.p.name); break;
      case 'leave': { const r = this.players.get(m.id); if (r) { this.players.delete(m.id); this.events?.onLeave(r.name); } break; }
      case 'host': this.hostId = m.id; this.events?.onHost(this.isHost); break;
      case 'chat': this.events?.onChat(String(m.name), String(m.m)); break;
      case 'chest':
        if (m.s === null) this.chests.delete(String(m.k)); else this.chests.set(String(m.k), m.s);
        this.events?.onChest(String(m.k), m.s);
        break;
      case 'mobs': this.events?.onMobs(m.m); break;
      case 'time': this.events?.onTime(m.v); break;
      case 'from': this.events?.onDirect(m.from, m.d ?? {}); break;
    }
  }

  private addPlayer(p: any) {
    this.players.set(p.id, {
      id: p.id, name: String(p.name), x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch,
      tx: p.x, ty: p.y, tz: p.z, tyaw: p.yaw, tpitch: p.pitch, walk: 0, moving: 0, swing: 0, sneaking: false, survival: false,
    });
  }

  private remember(x: number, y: number, z: number, v: number) {
    const k = chunkKey(Math.floor(x / 16), Math.floor(z / 16));
    let m = this.edits.get(k);
    if (!m) { m = new Map(); this.edits.set(k, m); }
    m.set(colIndex(x & 15, y, z & 15), v);
  }

  /** Lay the room's edits over a freshly generated column. */
  applyTo(g: GenChunk) {
    const m = this.edits.get(chunkKey(g.cx, g.cz));
    if (m) for (const [i, v] of m) g.blocks[i] = v;
  }

  /** The local player changed a block. */
  edit(x: number, y: number, z: number, v: number) {
    if (y < 0 || y > 255) return;
    this.remember(x, y, z, v);
    this.out.push(x, y, z, v);
  }

  private send(m: unknown) { if (this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); }
  chat(text: string) { this.send({ t: 'chat', m: text }); }
  chest(key: string, data: unknown) { if (data === null) this.chests.delete(key); else this.chests.set(key, data); this.send({ t: 'chest', k: key, s: data }); }
  direct(to: number, d: Record<string, unknown>) { this.send({ t: 'to', to, d }); }
  mobs(snapshot: number[]) { this.send({ t: 'mobs', m: snapshot }); }
  time(v: number) { this.send({ t: 'time', v }); }

  /** Per frame: flush edits, send our position, ease the other players towards theirs. */
  update(dt: number, me: { x: number; y: number; z: number; yaw: number; pitch: number; sneaking: boolean; swung: boolean; survival: boolean }) {
    if (this.out.length) {
      for (let i = 0; i < this.out.length; i += 4000) this.send({ t: 'b', e: this.out.slice(i, i + 4000) });
      this.out.length = 0;
    }
    this.posT -= dt;
    if (this.posT <= 0 || me.swung) {
      this.posT = 0.1;
      const r = (n: number) => Math.round(n * 100) / 100;
      this.send({ t: 'p', x: r(me.x), y: r(me.y), z: r(me.z), yaw: r(me.yaw), pitch: r(me.pitch), f: (me.sneaking ? 1 : 0) | (me.swung ? 2 : 0) | (me.survival ? 4 : 0) });
    }
    const k = Math.min(1, dt * 12);
    for (const p of this.players.values()) {
      const ox = p.x, oz = p.z;
      p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; p.z += (p.tz - p.z) * k;
      let d = p.tyaw - p.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      p.yaw += d * k;
      p.pitch += (p.tpitch - p.pitch) * k;
      const sp = Math.hypot(p.x - ox, p.z - oz) / Math.max(dt, 1e-3);
      p.moving = Math.min(1, sp / 3);
      p.walk += sp * dt * 2.2;
      if (p.swing > 0) { p.swing += dt * 3.3; if (p.swing >= 1) p.swing = 0; }
    }
  }

  close() {
    this.closed = true;
    try { this.ws.close(); } catch { /* already closed */ }
  }
}
