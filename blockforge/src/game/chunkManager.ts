// Streams columns in and out around the player: generation (worker pool), saved-chunk
// loading, lighting (World.addChunk), meshing (worker pool, main-thread fallback) and
// unloading. Everything here is time-budgeted so frames stay smooth on slow laptops.
import genWorkerCode from 'inline-worker:../workers/gen.worker.ts';
import meshWorkerCode from 'inline-worker:../workers/mesh.worker.ts';
import { Generator } from '../world/generator';
import { Chunk } from '../world/chunk';
import type { World } from '../world/world';
import { storage } from '../world/storage';
import { gatherSection, meshSection, newPadded } from '../render/mesher';
import type { Renderer } from '../render/renderer';
import type { GenChunk, MeshOptions, SectionMesh, PaddedSection } from '../types';
import {
  chunkKey, chunkKeyX, chunkKeyZ, sectionKey, sectionKeyY, sectionKeyChunk, SECTIONS,
} from '../world/constants';

interface PoolWorker { w: Worker; busy: number }

/** A small pool of identical workers created from an inlined script. */
class WorkerPool {
  workers: PoolWorker[] = [];
  private url: string;
  constructor(code: string, count: number, private onMessage: (data: any) => void) {
    this.url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    for (let i = 0; i < count; i++) {
      const w = new Worker(this.url);
      const pw: PoolWorker = { w, busy: 0 };
      w.onmessage = (e) => { pw.busy = Math.max(0, pw.busy - 1); this.onMessage(e.data); };
      w.onerror = (e) => { console.error('[worker]', e.message); };
      this.workers.push(pw);
    }
  }
  /** Least busy worker with fewer than `max` jobs, or null. */
  free(max: number): PoolWorker | null {
    let best: PoolWorker | null = null;
    for (const pw of this.workers) if (pw.busy < max && (!best || pw.busy < best.busy)) best = pw;
    return best;
  }
  get inFlight() { return this.workers.reduce((s, w) => s + w.busy, 0); }
  broadcast(msg: unknown) { for (const pw of this.workers) pw.w.postMessage(msg); }
  terminate() { for (const pw of this.workers) pw.w.terminate(); URL.revokeObjectURL(this.url); }
}

export interface ChunkManagerOptions {
  worldId: string;
  seed: number;
  savedKeys: Set<number>;
  /** Palette the saved chunks were written with, when it differs from the current registry. */
  remapPalette: string[] | null;
  meshOptions: MeshOptions;
  renderDistance: number;
}

export class ChunkManager {
  readonly world: World;
  private renderer: Renderer;
  private opts: ChunkManagerOptions;
  private gen: Generator | null = null;          // main-thread fallback (also used for spawn search)
  private genPool: WorkerPool | null = null;
  private meshPool: WorkerPool | null = null;

  private centerCx = 0;
  private centerCz = 0;
  private wanted: number[] = [];                 // chunk keys to load, nearest first
  private wantedDirty = true;
  private requested = new Set<number>();         // generation/loading in progress
  private arrived: GenChunk[] = [];              // waiting for World.addChunk
  private nextJob = 1;
  private meshSeq = new Map<number, number>();   // section key -> latest dispatched sequence
  private meshInFlight = new Map<number, number>(); // section key -> seq in flight
  private meshJobs = new Map<number, { k: number; seq: number }>(); // worker job id -> section
  private meshed = new Set<number>();            // sections that currently have geometry
  private padded: PaddedSection = newPadded();
  private urgent = new Set<number>();            // sections to mesh synchronously this frame
  private saving = new Set<number>();
  disposed = false;

  stats = { loaded: 0, genQueue: 0, meshQueue: 0, genMs: 0, meshMs: 0, lightMs: 0 };

  constructor(world: World, renderer: Renderer, opts: ChunkManagerOptions) {
    this.world = world;
    this.renderer = renderer;
    this.opts = opts;
    const hc = Math.max(2, navigator.hardwareConcurrency || 2);
    const genWorkers = Math.max(1, Math.min(2, hc - 2));
    const meshWorkers = Math.max(1, Math.min(2, hc - 2));
    try {
      this.genPool = new WorkerPool(genWorkerCode, genWorkers, (d) => this.onGenMessage(d));
      this.genPool.broadcast({ type: 'init', seed: opts.seed });
    } catch (e) {
      console.warn('[chunks] generation workers unavailable, generating on the main thread', e);
      this.genPool = null;
    }
    try {
      this.meshPool = new WorkerPool(meshWorkerCode, meshWorkers, (d) => this.onMeshMessage(d));
    } catch (e) {
      console.warn('[chunks] mesh workers unavailable, meshing on the main thread', e);
      this.meshPool = null;
    }
    // When a block is edited, mesh the sections around it in the same frame.
    world.onBlockChange = (x, y, z) => {
      const cx = Math.floor(x / 16), cz = Math.floor(z / 16), sy = y >> 4;
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) {
        const s = sy + dy;
        if (s < 0 || s >= SECTIONS) continue;
        const k = sectionKey(cx + dx, s, cz + dz);
        if (this.world.dirtySections.has(k)) this.urgent.add(k);
      }
    };
  }

  private mainGen(): Generator {
    if (!this.gen) this.gen = new Generator(this.opts.seed);
    return this.gen;
  }

  get renderDistance() { return this.opts.renderDistance; }
  get meshOptions(): MeshOptions { return this.opts.meshOptions; }

  setRenderDistance(rd: number) {
    if (rd === this.opts.renderDistance) return;
    this.opts.renderDistance = rd;
    this.wantedDirty = true;
    // Drop geometry that is now outside the view radius; it is remeshed if we come back.
    for (const k of Array.from(this.meshed)) {
      const ck = sectionKeyChunk(k);
      if (!this.inViewRange(chunkKeyX(ck), chunkKeyZ(ck))) {
        this.renderer.setSection(chunkKeyX(ck), sectionKeyY(k), chunkKeyZ(ck), null);
        this.meshed.delete(k);
        this.world.dirtySections.add(k);
      }
    }
  }

  setMeshOptions(o: MeshOptions) {
    this.opts.meshOptions = { ...o };
    this.remeshAll();
  }

  /** Mark every loaded section dirty (after mesh options change). */
  remeshAll() {
    for (const c of this.world.chunks.values()) {
      for (let sy = 0; sy < SECTIONS; sy++) this.world.dirtySections.add(sectionKey(c.cx, sy, c.cz));
    }
  }

  private inViewRange(cx: number, cz: number) {
    const dx = cx - this.centerCx, dz = cz - this.centerCz;
    const r = this.opts.renderDistance + 0.5;
    return dx * dx + dz * dz <= r * r;
  }

  private inLoadRange(cx: number, cz: number, extra: number) {
    const dx = cx - this.centerCx, dz = cz - this.centerCz;
    const r = this.opts.renderDistance + extra + 0.5;
    return dx * dx + dz * dz <= r * r;
  }

  /** True once every column within `radius` chunks of (x,z) is loaded, lit and meshed. */
  areaReady(x: number, z: number, radius: number): boolean {
    const ccx = Math.floor(x / 16), ccz = Math.floor(z / 16);
    for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
      const c = this.world.getChunk(ccx + dx, ccz + dz);
      if (!c || !c.lit) return false;
      for (let sy = 0; sy < SECTIONS; sy++) {
        const k = sectionKey(ccx + dx, sy, ccz + dz);
        if (this.world.dirtySections.has(k) || this.meshInFlight.has(k)) return false;
      }
    }
    return true;
  }

  /** Fraction of the view area that is ready (for the loading screen). */
  progress(x: number, z: number, radius: number): number {
    const ccx = Math.floor(x / 16), ccz = Math.floor(z / 16);
    let total = 0, done = 0;
    for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
      total += 2;
      const c = this.world.getChunk(ccx + dx, ccz + dz);
      if (!c) continue;
      done++;
      let clean = true;
      for (let sy = 0; sy < SECTIONS && clean; sy++) {
        const k = sectionKey(ccx + dx, sy, ccz + dz);
        if (this.world.dirtySections.has(k) || this.meshInFlight.has(k)) clean = false;
      }
      if (clean) done++;
    }
    return total ? done / total : 1;
  }

  /** Per-frame work. `budgetMs` bounds main-thread time spent on lighting + meshing. */
  update(px: number, pz: number, budgetMs: number) {
    if (this.disposed) return;
    const ccx = Math.floor(px / 16), ccz = Math.floor(pz / 16);
    if (ccx !== this.centerCx || ccz !== this.centerCz) {
      this.centerCx = ccx; this.centerCz = ccz;
      this.wantedDirty = true;
    }
    const t0 = performance.now();
    if (this.wantedDirty) { this.computeWanted(); this.unloadFar(); this.wantedDirty = false; }
    this.requestColumns();
    this.flushUrgent();
    this.integrateArrived(t0, budgetMs * 0.5);
    this.dispatchMeshing(t0, budgetMs);
    this.stats.loaded = this.world.chunks.size;
    this.stats.genQueue = this.requested.size + this.arrived.length;
    this.stats.meshQueue = this.world.dirtySections.size;
  }

  private computeWanted() {
    const r = this.opts.renderDistance + 1;
    const list: [number, number][] = [];
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (dx * dx + dz * dz > (r + 0.5) * (r + 0.5)) continue;
      list.push([dx * dx + dz * dz, chunkKey(this.centerCx + dx, this.centerCz + dz)]);
    }
    list.sort((a, b) => a[0] - b[0]);
    this.wanted = list.map((e) => e[1]);
  }

  private requestColumns() {
    for (const key of this.wanted) {
      if (this.world.chunks.has(key) || this.requested.has(key)) continue;
      const cx = chunkKeyX(key), cz = chunkKeyZ(key);
      if (this.opts.savedKeys.has(key)) {
        this.requested.add(key);
        this.loadSaved(cx, cz, key);
        continue;
      }
      if (this.genPool) {
        const pw = this.genPool.free(2);
        if (!pw) break;
        pw.busy++;
        this.requested.add(key);
        pw.w.postMessage({ type: 'gen', id: this.nextJob++, cx, cz });
      } else {
        // Main-thread fallback: one column per frame keeps frames responsive.
        if (this.arrived.length > 0) break;
        const t = performance.now();
        this.arrived.push(this.mainGen().generate(cx, cz));
        this.stats.genMs = performance.now() - t;
        break;
      }
    }
  }

  private async loadSaved(cx: number, cz: number, key: number) {
    try {
      const data = await storage.loadChunk(this.opts.worldId, cx, cz);
      if (this.disposed) return;
      if (data) {
        if (this.opts.remapPalette) storage.remap(data.blocks, this.opts.remapPalette);
        this.arrived.push({ cx, cz, blocks: data.blocks, biome: data.biome, tint: data.tint });
        return;
      }
    } catch (e) {
      console.warn('[chunks] failed to load saved chunk', cx, cz, e);
    }
    // Missing or unreadable save: regenerate it.
    if (this.disposed) return;
    this.opts.savedKeys.delete(key);
    this.requested.delete(key);
  }

  private onGenMessage(d: any) {
    if (this.disposed || !d || d.type !== 'chunk') return;
    this.arrived.push({ cx: d.cx, cz: d.cz, blocks: d.blocks, biome: d.biome, tint: d.tint });
  }

  private integrateArrived(t0: number, budgetMs: number) {
    // Nearest first, so the area around the player lights up before the horizon.
    if (this.arrived.length > 1) {
      const cx = this.centerCx, cz = this.centerCz;
      this.arrived.sort((a, b) => ((a.cx - cx) ** 2 + (a.cz - cz) ** 2) - ((b.cx - cx) ** 2 + (b.cz - cz) ** 2));
    }
    let n = 0;
    while (this.arrived.length) {
      if (n > 0 && performance.now() - t0 > budgetMs) break;
      const g = this.arrived.shift()!;
      const key = chunkKey(g.cx, g.cz);
      this.requested.delete(key);
      if (this.world.chunks.has(key)) continue;
      if (!this.inLoadRange(g.cx, g.cz, 2)) continue;   // player moved away meanwhile
      const t = performance.now();
      this.world.addChunk(new Chunk(g));
      this.stats.lightMs = performance.now() - t;
      n++;
    }
  }

  private columnReady(cx: number, cz: number): boolean {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const c = this.world.getChunk(cx + dx, cz + dz);
      if (!c || !c.lit) return false;
    }
    return true;
  }

  /** Sections touched by block edits are meshed right now, on this thread. */
  private flushUrgent() {
    if (!this.urgent.size) return;
    for (const k of this.urgent) {
      if (!this.world.dirtySections.has(k)) continue;
      const ck = sectionKeyChunk(k), cx = chunkKeyX(ck), cz = chunkKeyZ(ck), sy = sectionKeyY(k);
      if (!this.inViewRange(cx, cz) || !this.columnReady(cx, cz)) continue;
      this.world.dirtySections.delete(k);
      this.meshSync(cx, sy, cz, k);
    }
    this.urgent.clear();
  }

  private meshSync(cx: number, sy: number, cz: number, k: number) {
    const chunk = this.world.getChunk(cx, cz)!;
    // A newer result supersedes anything still in a worker.
    this.meshSeq.set(k, (this.meshSeq.get(k) ?? 0) + 1);
    this.meshInFlight.delete(k);
    if (chunk.counts[sy] === 0) { this.apply(cx, sy, cz, k, null); return; }
    const t = performance.now();
    gatherSection(this.world, cx, sy, cz, this.padded);
    const mesh = meshSection(this.padded, this.opts.meshOptions);
    this.stats.meshMs = performance.now() - t;
    this.apply(cx, sy, cz, k, mesh);
  }

  private apply(cx: number, sy: number, cz: number, k: number, mesh: SectionMesh | null) {
    const empty = !mesh || mesh.every((l) => !l);
    this.renderer.setSection(cx, sy, cz, empty ? null : mesh);
    if (empty) this.meshed.delete(k); else this.meshed.add(k);
  }

  private dispatchMeshing(t0: number, budgetMs: number) {
    const dirty = this.world.dirtySections;
    if (!dirty.size) return;
    // Order candidates by distance from the player's section.
    const pcx = this.centerCx, pcz = this.centerCz;
    const cand: [number, number][] = [];
    for (const k of dirty) {
      if (this.meshInFlight.has(k)) continue;
      const ck = sectionKeyChunk(k), cx = chunkKeyX(ck), cz = chunkKeyZ(ck);
      if (!this.inViewRange(cx, cz)) continue;
      const d = (cx - pcx) ** 2 + (cz - pcz) ** 2;
      cand.push([d, k]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    const readyCache = new Map<number, boolean>();
    for (const [, k] of cand) {
      const ck = sectionKeyChunk(k), cx = chunkKeyX(ck), cz = chunkKeyZ(ck), sy = sectionKeyY(k);
      let ready = readyCache.get(ck);
      if (ready === undefined) { ready = this.columnReady(cx, cz); readyCache.set(ck, ready); }
      if (!ready) continue;
      const chunk = this.world.getChunk(cx, cz)!;
      if (chunk.counts[sy] === 0) {
        dirty.delete(k);
        if (this.meshed.has(k)) this.apply(cx, sy, cz, k, null);
        continue;
      }
      if (this.meshPool) {
        const pw = this.meshPool.free(3);
        if (!pw) break;
        if (performance.now() - t0 > budgetMs) break;
        dirty.delete(k);
        const seq = (this.meshSeq.get(k) ?? 0) + 1;
        this.meshSeq.set(k, seq);
        this.meshInFlight.set(k, seq);
        const p = newPadded();
        gatherSection(this.world, cx, sy, cz, p);
        pw.busy++;
        const id = this.nextJob++;
        this.meshJobs.set(id, { k, seq });
        pw.w.postMessage(
          { id, blocks: p.blocks, light: p.light, tint: p.tint, opts: this.opts.meshOptions },
          [p.blocks.buffer, p.light.buffer, p.tint.buffer],
        );
      } else {
        if (performance.now() - t0 > budgetMs) break;
        dirty.delete(k);
        this.meshSync(cx, sy, cz, k);
      }
    }
  }

  private onMeshMessage(d: any) {
    if (this.disposed || !d) return;
    const job = this.meshJobs.get(d.id);
    if (!job) return;
    this.meshJobs.delete(d.id);
    const { k, seq } = job;
    if (this.meshInFlight.get(k) !== seq) return;     // stale: a newer mesh was made
    this.meshInFlight.delete(k);
    const ck = sectionKeyChunk(k), cx = chunkKeyX(ck), cz = chunkKeyZ(ck), sy = sectionKeyY(k);
    if (!this.world.getChunk(cx, cz) || !this.inViewRange(cx, cz)) {
      this.world.dirtySections.add(k);
      return;
    }
    this.apply(cx, sy, cz, k, d.mesh as SectionMesh);
  }

  private unloadFar() {
    for (const c of Array.from(this.world.chunks.values())) {
      if (this.inLoadRange(c.cx, c.cz, 3)) continue;
      const key = chunkKey(c.cx, c.cz);
      if (c.modified) this.saveChunk(c);
      this.world.removeChunk(c.cx, c.cz);
      this.renderer.removeColumn(c.cx, c.cz);
      for (let sy = 0; sy < SECTIONS; sy++) {
        const k = sectionKey(c.cx, sy, c.cz);
        this.world.dirtySections.delete(k);
        this.meshed.delete(k);
        this.meshInFlight.delete(k);
        this.urgent.delete(k);
      }
      void key;
    }
  }

  private saveChunk(c: Chunk) {
    const key = chunkKey(c.cx, c.cz);
    c.modified = false;
    this.opts.savedKeys.add(key);
    this.saving.add(key);
    storage.saveChunk(this.opts.worldId, c)
      .catch((e) => { console.warn('[chunks] save failed', e); c.modified = true; })
      .finally(() => this.saving.delete(key));
  }

  /** Save every modified loaded chunk. */
  async saveAll(): Promise<void> {
    const jobs: Promise<void>[] = [];
    for (const c of this.world.chunks.values()) {
      if (!c.modified) continue;
      c.modified = false;
      this.opts.savedKeys.add(chunkKey(c.cx, c.cz));
      jobs.push(storage.saveChunk(this.opts.worldId, c).catch((e) => { console.warn('[chunks] save failed', e); c.modified = true; }));
    }
    await Promise.all(jobs);
  }

  /** Generator for spawn search and other main-thread queries. */
  generator(): Generator { return this.mainGen(); }

  dispose() {
    this.disposed = true;
    this.genPool?.terminate();
    this.meshPool?.terminate();
    this.world.onBlockChange = null;
    for (const k of this.meshed) {
      const ck = sectionKeyChunk(k);
      this.renderer.setSection(chunkKeyX(ck), sectionKeyY(k), chunkKeyZ(ck), null);
    }
    this.meshed.clear();
  }
}
