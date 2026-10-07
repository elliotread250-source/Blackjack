// Persistence: IndexedDB database 'blockforge' with stores 'worlds' (WorldMeta by id) and
// 'chunks' (one record per saved column, key [worldId, cx, cz]). Falls back to memory when
// IndexedDB is missing, throws (file:// in some Chrome setups, locked-down school browsers,
// private modes) or never answers. Every call is guarded and never rejects for storage
// reasons: a write that IndexedDB refuses is kept in memory for the rest of the session.
//
// Chunk records carry their own small palette (block names used in that column), so a save
// stays readable whatever the registry looks like later: unknown names load as air. Blocks
// are run-length encoded as varint pairs (token = paletteIndex * 64 + meta, runLength - 1)
// in column order, which keeps a typical terrain column around 5..20 KB.
import type { WorldMeta } from '../types';
import type { Chunk } from './chunk';
import { BLOCKS, ID, COUNT } from '../blocks/registry';
import { chunkKey, COLUMN_VOLUME } from './constants';

const DB_NAME = 'blockforge';
const DB_VERSION = 1;
const WORLDS = 'worlds';
const CHUNKS = 'chunks';
const OPEN_TIMEOUT_MS = 5000;

/** Stored form of a column. */
export interface ChunkRecord {
  w: string;
  cx: number;
  cz: number;
  v: 2;
  /** block names of the local palette */
  names: string[];
  /** RLE varint stream, see file header */
  data: Uint8Array;
  biome: Uint8Array;
  tint: Uint8Array;
}

// ---------------------------------------------------------------------------
// RLE codec

let outBuf = new Uint8Array(1 << 16);
const localIndex = new Int16Array(1024).fill(-1);

function ensure(n: number): void {
  if (n <= outBuf.length) return;
  let len = outBuf.length * 2;
  while (len < n) len *= 2;
  const nb = new Uint8Array(len);
  nb.set(outBuf);
  outBuf = nb;
}

/** Encode packed blocks with a local palette. */
export function encodeBlocks(blocks: Uint16Array): { names: string[]; data: Uint8Array } {
  const names: string[] = [];
  const used: number[] = [];
  let p = 0;
  const n = blocks.length;
  let i = 0;
  try {
    while (i < n) {
      const v = blocks[i];
      let j = i + 1;
      while (j < n && blocks[j] === v) j++;
      const id = v & 0x3ff;
      let li = localIndex[id];
      if (li < 0) {
        li = names.length;
        localIndex[id] = li;
        names.push(id < COUNT ? BLOCKS[id].name : 'air');
        used.push(id);
      }
      ensure(p + 8);
      p = writeVarint(outBuf, p, li * 64 + (v >> 10));
      p = writeVarint(outBuf, p, j - i - 1);
      i = j;
    }
  } finally {
    for (const id of used) localIndex[id] = -1;
  }
  return { names, data: outBuf.slice(0, p) };
}

function writeVarint(b: Uint8Array, p: number, v: number): number {
  while (v >= 0x80) { b[p++] = (v & 0x7f) | 0x80; v >>>= 7; }
  b[p++] = v;
  return p;
}

/** Decode an RLE stream into packed blocks with current registry ids (unknown names -> air). */
export function decodeBlocks(names: string[], data: Uint8Array, out = new Uint16Array(COLUMN_VOLUME)): Uint16Array {
  const map = new Uint16Array(names.length);
  for (let k = 0; k < names.length; k++) {
    const id = ID[names[k]];
    map[k] = id !== undefined && id < COUNT ? id : 0;
  }
  const n = out.length, len = data.length;
  let p = 0, i = 0;
  while (p < len && i < n) {
    let token = 0, shift = 0, b: number;
    do { b = data[p++]; token |= (b & 0x7f) << shift; shift += 7; } while (b & 0x80 && p < len);
    let run = 0; shift = 0;
    do { b = data[p++]; run |= (b & 0x7f) << shift; shift += 7; } while (b & 0x80 && p < len);
    run += 1;
    const li = token >>> 6, meta = token & 63;
    const id = li < map.length ? map[li] : 0;
    const v = id === 0 ? 0 : id | (meta << 10);
    const end = i + run > n ? n : i + run;
    if (end - i > 16) out.fill(v, i, end);
    else for (let k = i; k < end; k++) out[k] = v;
    i = end;
  }
  return out;
}

export function encodeChunk(worldId: string, c: Chunk): ChunkRecord {
  const { names, data } = encodeBlocks(c.blocks);
  return { w: worldId, cx: c.cx, cz: c.cz, v: 2, names, data, biome: c.biome.slice(0, 256), tint: c.tint.slice(0, 256 * 9) };
}

/** Arrays returned by loadChunk: already in current registry ids, so remap() leaves them alone. */
const currentIds = new WeakSet<Uint16Array>();

function decodeRecord(r: unknown): { blocks: Uint16Array; biome: Uint8Array; tint: Uint8Array } | null {
  const rec = r as Partial<ChunkRecord> | null;
  if (!rec || rec.v !== 2 || !Array.isArray(rec.names) || !(rec.data instanceof Uint8Array)) return null;
  const blocks = decodeBlocks(rec.names, rec.data);
  currentIds.add(blocks);
  const biome = new Uint8Array(256);
  if (rec.biome instanceof Uint8Array) biome.set(rec.biome.subarray(0, 256));
  const tint = new Uint8Array(256 * 9);
  if (rec.tint instanceof Uint8Array) tint.set(rec.tint.subarray(0, 256 * 9));
  return { blocks, biome, tint };
}

// ---------------------------------------------------------------------------
// IndexedDB plumbing

let dbPromise: Promise<IDBDatabase | null> | null = null;
let memoryMode = false;
const warned = new Set<string>();

function warnOnce(kind: string, e: unknown): void {
  if (warned.has(kind)) return;
  warned.add(kind);
  console.warn(`[storage] ${kind}`, e);
}

function getIDB(): IDBFactory | null {
  try {
    const g = globalThis as { indexedDB?: IDBFactory };
    return g.indexedDB ?? null;
  } catch {
    return null;   // SecurityError: storage disabled for this origin
  }
}

function openDB(): Promise<IDBDatabase | null> {
  if (memoryMode) return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (db: IDBDatabase | null, why?: unknown) => {
      if (settled) { if (db) try { db.close(); } catch { /* ignore */ } return; }
      settled = true;
      if (timer !== null) clearTimeout(timer);
      if (!db) {
        memoryMode = true;
        if (why !== undefined) warnOnce('IndexedDB unavailable, worlds are kept in memory for this session', why);
      }
      resolve(db);
    };
    const idb = getIDB();
    if (!idb) { finish(null, 'no indexedDB'); return; }
    try {
      const req = idb.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        try {
          const db = req.result;
          if (!db.objectStoreNames.contains(WORLDS)) db.createObjectStore(WORLDS, { keyPath: 'id' });
          if (!db.objectStoreNames.contains(CHUNKS)) db.createObjectStore(CHUNKS, { keyPath: ['w', 'cx', 'cz'] });
        } catch (e) { finish(null, e); }
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { try { db.close(); } catch { /* ignore */ } dbPromise = null; };
        db.onclose = () => { dbPromise = null; };
        finish(db);
      };
      req.onerror = (ev) => { ev.preventDefault?.(); finish(null, req.error); };
      req.onblocked = () => { /* an older tab holds the db open; the timeout decides */ };
      timer = setTimeout(() => finish(null, 'open timed out'), OPEN_TIMEOUT_MS);
    } catch (e) {
      finish(null, e);
    }
  });
  return dbPromise;
}

function reqP<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise<T>((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = (ev) => { ev.preventDefault?.(); rej(r.error); };
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = (ev) => { ev.preventDefault?.(); rej(tx.error); };
    tx.onabort = () => rej(tx.error ?? new Error('transaction aborted'));
  });
}

const chunkRange = (worldId: string) => IDBKeyRange.bound([worldId, -Infinity, -Infinity], [worldId, Infinity, Infinity]);

// In memory mode these hold everything; with IndexedDB they hold writes that are still in
// flight or that IndexedDB refused, and reads check them first.
const memWorlds = new Map<string, WorldMeta>();
const memChunks = new Map<string, Map<number, ChunkRecord>>();

function cloneMeta(m: WorldMeta): WorldMeta {
  return JSON.parse(JSON.stringify(m)) as WorldMeta;
}

function memChunkMap(worldId: string): Map<number, ChunkRecord> {
  let m = memChunks.get(worldId);
  if (!m) { m = new Map(); memChunks.set(worldId, m); }
  return m;
}

let persistAsked = false;
function askPersist(): void {
  if (persistAsked) return;
  persistAsked = true;
  try {
    const nav = (globalThis as { navigator?: Navigator }).navigator;
    const p = nav?.storage?.persist?.();
    if (p) p.catch(() => undefined);
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------

export const storage = {
  /** All saved worlds, newest lastPlayed first. */
  async listWorlds(): Promise<WorldMeta[]> {
    const byId = new Map<string, WorldMeta>();
    const db = await openDB();
    if (db) {
      try {
        const all = await reqP(db.transaction(WORLDS, 'readonly').objectStore(WORLDS).getAll() as IDBRequest<WorldMeta[]>);
        for (const m of all) if (m && typeof m.id === 'string') byId.set(m.id, m);
      } catch (e) { warnOnce('could not list worlds', e); }
    }
    for (const [id, m] of memWorlds) byId.set(id, cloneMeta(m));
    return Array.from(byId.values()).sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
  },

  async getWorld(id: string): Promise<WorldMeta | null> {
    const mem = memWorlds.get(id);
    if (mem) return cloneMeta(mem);
    const db = await openDB();
    if (!db) return null;
    try {
      const m = await reqP(db.transaction(WORLDS, 'readonly').objectStore(WORLDS).get(id) as IDBRequest<WorldMeta | undefined>);
      return m ?? null;
    } catch (e) {
      warnOnce('could not read a world', e);
      return null;
    }
  },

  async saveWorld(meta: WorldMeta): Promise<void> {
    let snap: WorldMeta;
    try { snap = cloneMeta(meta); } catch (e) { warnOnce('world metadata is not serialisable', e); return; }
    memWorlds.set(snap.id, snap);
    const db = await openDB();
    if (!db) return;
    try {
      const tx = db.transaction(WORLDS, 'readwrite');
      tx.objectStore(WORLDS).put(snap);
      await txDone(tx);
      if (memWorlds.get(snap.id) === snap) memWorlds.delete(snap.id);
      askPersist();
    } catch (e) {
      warnOnce('could not save a world, keeping it in memory', e);
    }
  },

  /** Delete a world and all of its chunks. */
  async deleteWorld(id: string): Promise<void> {
    memWorlds.delete(id);
    memChunks.delete(id);
    const db = await openDB();
    if (!db) return;
    try {
      const tx = db.transaction([WORLDS, CHUNKS], 'readwrite');
      tx.objectStore(WORLDS).delete(id);
      tx.objectStore(CHUNKS).delete(chunkRange(id));
      await txDone(tx);
    } catch (e) {
      warnOnce('could not delete a world', e);
    }
  },

  /** chunkKeys of every column saved for this world. */
  async savedChunkKeys(worldId: string): Promise<Set<number>> {
    const out = new Set<number>();
    const db = await openDB();
    if (db) {
      try {
        const store = db.transaction(CHUNKS, 'readonly').objectStore(CHUNKS);
        if (typeof store.getAllKeys === 'function') {
          const keys = await reqP(store.getAllKeys(chunkRange(worldId)));
          for (const k of keys) {
            const a = k as unknown as [string, number, number];
            out.add(chunkKey(a[1], a[2]));
          }
        } else {
          await new Promise<void>((res, rej) => {
            const r = store.openKeyCursor(chunkRange(worldId));
            r.onsuccess = () => {
              const cur = r.result;
              if (!cur) { res(); return; }
              const a = cur.key as unknown as [string, number, number];
              out.add(chunkKey(a[1], a[2]));
              cur.continue();
            };
            r.onerror = () => rej(r.error);
          });
        }
      } catch (e) { warnOnce('could not list saved chunks', e); }
    }
    const mem = memChunks.get(worldId);
    if (mem) for (const k of mem.keys()) out.add(k);
    return out;
  },

  /** A saved column, decoded to current block ids, or null when there is none. */
  async loadChunk(worldId: string, cx: number, cz: number): Promise<{ blocks: Uint16Array; biome: Uint8Array; tint: Uint8Array } | null> {
    const mem = memChunks.get(worldId)?.get(chunkKey(cx, cz));
    if (mem) return decodeRecord(mem);
    const db = await openDB();
    if (!db) return null;
    try {
      const r = await reqP(db.transaction(CHUNKS, 'readonly').objectStore(CHUNKS).get([worldId, cx, cz]));
      return decodeRecord(r);
    } catch (e) {
      warnOnce('could not read a chunk', e);
      return null;
    }
  },

  /** Save a column (encoded synchronously, so later edits do not leak into this save). */
  async saveChunk(worldId: string, c: Chunk): Promise<void> {
    let rec: ChunkRecord;
    try { rec = encodeChunk(worldId, c); } catch (e) { warnOnce('could not encode a chunk', e); return; }
    const key = chunkKey(c.cx, c.cz);
    const mem = memChunkMap(worldId);
    mem.set(key, rec);
    const db = await openDB();
    if (!db) return;
    try {
      const tx = db.transaction(CHUNKS, 'readwrite');
      tx.objectStore(CHUNKS).put(rec);
      await txDone(tx);
      if (mem.get(key) === rec) mem.delete(key);
    } catch (e) {
      warnOnce('could not save a chunk, keeping it in memory', e);
    }
  },

  /**
   * Remap ids saved with an older palette (names by id) to current ids in place; unknown
   * names become air. Arrays returned by loadChunk already use current ids (each record
   * stores its own palette), so they are left untouched.
   */
  remap(blocks: Uint16Array, palette: string[]): void {
    if (currentIds.has(blocks)) return;
    const table = new Uint16Array(1024);
    for (let i = 0; i < palette.length && i < 1024; i++) {
      const id = ID[palette[i]];
      table[i] = id !== undefined && id < COUNT ? id : 0;
    }
    for (let i = 0; i < blocks.length; i++) {
      const v = blocks[i];
      if (v === 0) continue;
      const id = table[v & 0x3ff];
      blocks[i] = id === 0 ? 0 : id | (v & 0xfc00);
    }
  },

  /** 'indexeddb' when saves survive a reload, 'memory' otherwise. */
  async mode(): Promise<'indexeddb' | 'memory'> {
    return (await openDB()) ? 'indexeddb' : 'memory';
  },
};
