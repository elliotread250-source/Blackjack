// In-page storage tests. Bundled as an IIFE and driven by storage.browser.cjs (Playwright).
import { storage, encodeBlocks, decodeBlocks } from '../../src/world/storage';
import { Chunk } from '../../src/world/chunk';
import { ID, BLOCKS, pack } from '../../src/blocks/registry';
import { chunkKey, COLUMN_VOLUME } from '../../src/world/constants';
import type { WorldMeta } from '../../src/types';

const log: string[] = [];
let fails = 0;
function check(c: boolean, msg: string): void {
  if (c) log.push('ok   ' + msg); else { fails++; log.push('FAIL ' + msg); }
}

function meta(id: string, name: string, lastPlayed: number): WorldMeta {
  return {
    id, name, seed: 42, created: 1, lastPlayed, player: { x: 1.5, y: 70, z: -3.25, yaw: 0.5, pitch: -0.2, flying: true },
    hotbar: [1, 2, 3, 0, 0, 0, 0, 0, 0], hotbarNames: ['grass_block', 'stone', '', '', '', '', '', '', ''], selected: 2,
    dayTime: 0.3, timeMode: 'cycle', palette: BLOCKS.map((b) => b.name), version: 1,
  };
}

/** A column with layered terrain, ores, caves, oriented logs, stairs, water and air. */
function makeChunk(cx: number, cz: number, seed: number): Chunk {
  const blocks = new Uint16Array(COLUMN_VOLUME);
  let s = seed >>> 0 || 1;
  const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  for (let y = 0; y < 256; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
    const h = 60 + ((x * 7 + z * 3 + seed) % 9);
    let v = 0;
    if (y === 0) v = pack(ID.bedrock);
    else if (y < h - 4) v = r() < 0.02 ? pack(ID.coal_ore) : r() < 0.01 ? 0 : pack(ID.stone);
    else if (y < h) v = pack(ID.dirt);
    else if (y === h) v = pack(ID.grass_block);
    else if (y <= 62) v = pack(ID.water, y === 62 ? 3 : 0);
    else if (y === h + 1 && r() < 0.05) v = pack(ID.oak_log, 1 + Math.floor(r() * 2));
    else if (y === h + 1 && r() < 0.05) v = pack(ID.oak_stairs, Math.floor(r() * 8));
    blocks[(y << 8) | (z << 4) | x] = v;
  }
  const biome = new Uint8Array(256), tint = new Uint8Array(256 * 9);
  for (let i = 0; i < 256; i++) biome[i] = (i * 13 + seed) % 14;
  for (let i = 0; i < tint.length; i++) tint[i] = (i * 31 + seed) & 255;
  return new Chunk({ cx, cz, blocks, biome, tint });
}

function same(a: ArrayLike<number>, b: ArrayLike<number>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

async function basics(prefix: string): Promise<void> {
  // worlds
  await storage.saveWorld(meta(prefix + 'a', 'Alpha', 1000));
  await storage.saveWorld(meta(prefix + 'b', 'Beta', 3000));
  await storage.saveWorld(meta(prefix + 'c', 'Gamma', 2000));
  const list = (await storage.listWorlds()).filter((m) => m.id.startsWith(prefix));
  check(list.map((m) => m.name).join(',') === 'Beta,Gamma,Alpha', `listWorlds newest first (${list.map((m) => m.name).join(',')})`);
  const got = await storage.getWorld(prefix + 'a');
  check(!!got && got.name === 'Alpha' && got.player!.z === -3.25 && got.hotbarNames![1] === 'stone' && got.palette.length === BLOCKS.length, 'getWorld round trip');
  check((await storage.getWorld(prefix + 'missing')) === null, 'getWorld of a missing id is null');
  const m = meta(prefix + 'a', 'Alpha renamed', 5000);
  await storage.saveWorld(m);
  m.name = 'mutated after save';
  check((await storage.getWorld(prefix + 'a'))!.name === 'Alpha renamed', 'saveWorld stores a snapshot');
  check((await storage.listWorlds()).filter((x) => x.id.startsWith(prefix))[0].id === prefix + 'a', 'resorted after update');

  // chunks
  const coords: [number, number][] = [[0, 0], [-1, 5], [-300, -2], [1000, -1000]];
  for (const [cx, cz] of coords) await storage.saveChunk(prefix + 'a', makeChunk(cx, cz, cx * 7 + cz));
  await storage.saveChunk(prefix + 'b', makeChunk(0, 0, 99));
  const keys = await storage.savedChunkKeys(prefix + 'a');
  check(keys.size === coords.length && coords.every(([cx, cz]) => keys.has(chunkKey(cx, cz))), `savedChunkKeys (${keys.size})`);
  for (const [cx, cz] of coords) {
    const want = makeChunk(cx, cz, cx * 7 + cz);
    const got2 = await storage.loadChunk(prefix + 'a', cx, cz);
    check(!!got2 && same(got2.blocks, want.blocks) && same(got2.biome, want.biome) && same(got2.tint, want.tint), `loadChunk round trip ${cx},${cz}`);
  }
  check((await storage.loadChunk(prefix + 'a', 7, 7)) === null, 'loadChunk of an unsaved column is null');
  check(same((await storage.loadChunk(prefix + 'b', 0, 0))!.blocks, makeChunk(0, 0, 99).blocks), 'chunks are per world');

  // snapshot semantics: edits after saveChunk() do not leak into that save, and an
  // immediate load (before the write commits) sees it
  const c = makeChunk(3, 3, 5);
  const before = c.blocks.slice();
  const p = storage.saveChunk(prefix + 'a', c);
  c.blocks.fill(pack(ID.gold_block));
  const early = await storage.loadChunk(prefix + 'a', 3, 3);
  check(!!early && same(early.blocks, before), 'load right after save (write in flight) returns the saved state');
  await p;
  check(same((await storage.loadChunk(prefix + 'a', 3, 3))!.blocks, before), 'saved snapshot is the state at call time');
}

async function compression(): Promise<void> {
  const c = makeChunk(0, 0, 1);
  const { names, data } = encodeBlocks(c.blocks);
  check(same(decodeBlocks(names, data), c.blocks), 'RLE codec round trip');
  log.push(`info RLE: ${data.length} bytes for a noisy test column (${names.length} palette entries), raw 131072`);
  const empty = encodeBlocks(new Uint16Array(COLUMN_VOLUME));
  check(empty.data.length <= 4 && empty.names.length === 1, `empty column encodes to ${empty.data.length} bytes`);
  const full = new Uint16Array(COLUMN_VOLUME);
  for (let i = 0; i < full.length; i++) full[i] = (i * 2654435761 >>> 0) % 900 + 1 | ((i & 63) << 10);
  for (let i = 0; i < full.length; i++) if ((full[i] & 0x3ff) >= BLOCKS.length) full[i] = (full[i] & 0xfc00) | 1;
  const enc = encodeBlocks(full);
  check(same(decodeBlocks(enc.names, enc.data), full), `worst-case column (no runs, all meta bits) round trip, ${enc.data.length} bytes`);
}

async function paletteRemap(prefix: string): Promise<void> {
  // A record written by an older build: a palette with reordered names and an unknown block.
  const names = ['air', 'stone', 'mystery_block_from_the_future', 'oak_log', 'water'];
  const tokens: number[] = [];
  const blocks = [
    [1, 0, 100], [2, 0, 50], [3, 2, 10], [4, 3, 6], [0, 0, 65536 - 166],
  ];
  for (const [li, meta, run] of blocks) {
    let t = li * 64 + meta;
    while (t >= 0x80) { tokens.push((t & 0x7f) | 0x80); t >>>= 7; } tokens.push(t);
    let r = run - 1;
    while (r >= 0x80) { tokens.push((r & 0x7f) | 0x80); r >>>= 7; } tokens.push(r);
  }
  const rec = { w: prefix + 'old', cx: 4, cz: -4, v: 2, names, data: new Uint8Array(tokens), biome: new Uint8Array(256), tint: new Uint8Array(2304) };
  await new Promise<void>((res, rej) => {
    const req = indexedDB.open('blockforge');
    req.onsuccess = () => {
      const tx = req.result.transaction('chunks', 'readwrite');
      tx.objectStore('chunks').put(rec);
      tx.oncomplete = () => { req.result.close(); res(); };
      tx.onerror = () => rej(tx.error);
    };
    req.onerror = () => rej(req.error);
  });
  const got = await storage.loadChunk(prefix + 'old', 4, -4);
  check(!!got, 'old record loads');
  if (got) {
    check(got.blocks[0] === pack(ID.stone) && got.blocks[99] === pack(ID.stone), 'stone by name');
    check(got.blocks[100] === 0 && got.blocks[149] === 0, 'unknown block -> air');
    check(got.blocks[150] === pack(ID.oak_log, 2), 'oak_log keeps its axis meta under a new id');
    check(got.blocks[160] === pack(ID.water, 3), 'water level kept');
    check(got.blocks[166] === 0 && got.blocks[65535] === 0, 'rest air');
    const copy = got.blocks.slice();
    storage.remap(got.blocks, ['air', 'dirt', 'stone']);
    check(same(copy, got.blocks), 'remap() leaves loadChunk results alone (they are already in current ids)');
  }
  // legacy remap on a raw array
  const oldPalette = ['air', 'sand', 'glass', 'no_such_block', 'oak_log'];
  const raw = new Uint16Array([0, 1, 2, 3, 4 | (1 << 10), 1 | (5 << 10)]);
  storage.remap(raw, oldPalette);
  check(raw[0] === 0 && raw[1] === pack(ID.sand) && raw[2] === pack(ID.glass) && raw[3] === 0 && raw[4] === pack(ID.oak_log, 1) && raw[5] === pack(ID.sand, 5), 'remap() maps ids by name, unknown -> air, keeps meta');
}

async function persisted(prefix: string): Promise<void> {
  const list = (await storage.listWorlds()).filter((m) => m.id.startsWith(prefix));
  check(list.length === 3, `worlds survive a reload (${list.length})`);
  const got = await storage.loadChunk(prefix + 'a', -300, -2);
  check(!!got && same(got.blocks, makeChunk(-300, -2, -300 * 7 - 2).blocks), 'chunk survives a reload');
  await storage.deleteWorld(prefix + 'a');
  check((await storage.getWorld(prefix + 'a')) === null, 'deleteWorld removes the world');
  check((await storage.savedChunkKeys(prefix + 'a')).size === 0, 'deleteWorld removes its chunks');
  check((await storage.loadChunk(prefix + 'a', 0, 0)) === null, 'deleted chunk does not load');
  check((await storage.savedChunkKeys(prefix + 'b')).size === 1, 'other worlds keep their chunks');
  check((await storage.listWorlds()).filter((m) => m.id.startsWith(prefix)).length === 2, 'two worlds left');
}

const api = {
  async run(phase: string): Promise<{ fails: number; log: string[]; mode: string }> {
    log.length = 0; fails = 0;
    const mode = await storage.mode();
    log.push(`info storage mode: ${mode}`);
    try {
      if (phase === 'basics') { await basics('t1-'); await compression(); }
      else if (phase === 'remap') await paletteRemap('t2-');
      else if (phase === 'persisted') await persisted('t1-');
      else if (phase === 'fallback') { await basics('f-'); await compression(); }
    } catch (e) {
      fails++;
      log.push('FAIL exception ' + ((e as Error).stack ?? String(e)));
    }
    return { fails, log: log.slice(), mode };
  },
};
(globalThis as unknown as { __ws2: typeof api }).__ws2 = api;
