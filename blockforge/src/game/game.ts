// The running game: owns the world, chunk streaming, the player and the per-frame loop.
import { World } from '../world/world';
import { storage } from '../world/storage';
import { BIOME_NAMES } from '../world/generator';
import { ChunkManager } from './chunkManager';
import { Player } from './player';
import type { Input } from './input';
import { raycast } from './raycast';
import { Interaction } from './interact';
import type { Sounds } from './audio';
import type { Hotbar } from './hotbar';
import type { Renderer } from '../render/renderer';
import { selectionBoxes } from '../blocks/shapes';
import {
  BLOCKS, COUNT, ID, blockName, idOf, metaOf, FLUID, SOLID, LEAVES, isItem,
} from '../blocks/registry';
import type { SoundName } from '../blocks/registry';
import type { Hud } from '../ui/hud';
import type { Menus } from '../ui/screens';
import type { InventoryScreen } from '../ui/inventory';
import type { TouchControls } from '../ui/touch';
import { matches, HOTBAR_ACTIONS } from './keybinds';
import type { Settings } from '../settings';
import { DAY_LENGTH, xzIndex, SEA_LEVEL } from '../world/constants';
import type { RayHit, TimeMode, WorldMeta } from '../types';

const SOUND: SoundName[] = BLOCKS.map((b) => b.sound ?? 'stone');
const FIXED_TIME: Record<Exclude<TimeMode, 'cycle'>, number> = { sunrise: 0.02, noon: 0.25, sunset: 0.48, midnight: 0.75 };
const FACING = ['north', 'east', 'south', 'west'];
const FACING_AXIS = ['Towards negative Z', 'Towards positive X', 'Towards positive Z', 'Towards negative X'];
/** Seconds between world record saves (player, hotbar, time) while playing. */
const META_SAVE_EVERY = 5;
/** Seconds between synchronous session snapshots (survive a tab closing at any moment). */
const SESSION_EVERY = 1;

export interface GameDeps {
  renderer: Renderer;
  input: Input;
  hud: Hud;
  inventory: InventoryScreen;
  hotbar: Hotbar;
  sounds: Sounds;
  settings: Settings;
  touch?: TouchControls;
}

export type GameState = 'menu' | 'loading' | 'playing' | 'paused';

export class Game {
  state: GameState = 'menu';
  menus: Menus | null = null;
  world: World | null = null;
  chunks: ChunkManager | null = null;
  meta: WorldMeta | null = null;
  player: Player = new Player();
  private interaction: Interaction | null = null;
  private d: GameDeps;
  dayTime = 0.05;
  timeMode: TimeMode = 'cycle';
  private time = 0;
  private last = 0;
  private hit: RayHit | null = null;
  private hudHidden = false;
  private autosaveAt = 0;   // performance.now() of the next world record save
  private sessionAt = 0;    // performance.now() of the next session snapshot
  private stepDist = 0;
  private wasInWater = false;
  private fps = { frames: 0, acc: 0, value: 0, min: 999, max: 0, frameMs: 0 };
  private debugAcc = 1;
  private lastFrameAt = 0;
  private loadingToken = 0;

  constructor(d: GameDeps) {
    this.d = d;
    d.hotbar.onChange(() => this.onHotbarChange());
    d.input.onLockChange = (locked) => this.onLockChange(locked);
    d.input.onKey = (code, e) => this.onKey(code, e);
    d.inventory.onClose = () => {
      if (this.state === 'playing') { this.d.input.enabled = true; void this.lockOrPause(); }
    };
  }

  private get settings() { return this.d.settings; }
  private get touchMode() { return this.d.settings.controls === 'touch' && !!this.d.touch; }

  /** Touch mode has no pointer lock: show/hide the on-screen controls and fake the lock. */
  private setTouchActive(on: boolean) {
    if (!this.d.touch) return;
    this.d.touch.setEnabled(on && this.touchMode);
    this.d.input.virtualLock = on && this.touchMode;
  }

  openInventory() {
    if (this.state !== 'playing' || this.d.inventory.isOpen) return;
    this.d.input.enabled = false;
    this.d.inventory.open();
    this.d.input.exitLock();
    this.setTouchActive(false);
  }

  // ------------------------------------------------------------------ lifecycle
  async startWorld(meta: WorldMeta) {
    const token = ++this.loadingToken;
    this.state = 'loading';
    const menus = this.menus!;
    menus.showLoading('Preparing world', 0);
    if (this.settings.fullscreen) this.enterFullscreen();
    this.d.sounds.unlock();

    const savedKeys = await storage.savedChunkKeys(meta.id).catch(() => new Set<number>());
    if (token !== this.loadingToken) return;
    const names = BLOCKS.map((b) => b.name);
    const samePalette = meta.palette.length === names.length && meta.palette.every((n, i) => n === names[i]);

    const world = new World(meta.seed);
    this.world = world;
    this.meta = meta;
    this.chunks = new ChunkManager(world, this.d.renderer, {
      worldId: meta.id,
      seed: meta.seed,
      savedKeys,
      remapPalette: samePalette ? null : meta.palette,
      meshOptions: { fancyLeaves: this.settings.fancyLeaves, smoothLighting: this.settings.smoothLighting },
      renderDistance: this.settings.renderDistance,
    });
    this.timeMode = meta.timeMode ?? 'cycle';
    this.dayTime = meta.dayTime ?? 0.05;

    // Hotbar: saved by name so registry changes never scramble it.
    if (meta.hotbarNames && meta.hotbarNames.length === 9) {
      this.d.hotbar.load(meta.hotbarNames.map((n) => (n && ID[n] && isItem(ID[n]) ? ID[n] : 0)), meta.selected ?? 0);
    } else if (meta.hotbar && meta.hotbar.length === 9 && samePalette) {
      this.d.hotbar.load(meta.hotbar, meta.selected ?? 0);
    }

    const p = new Player();
    this.player = p;
    let freshSpawn = false;
    if (meta.player) {
      p.restore(meta.player);
    } else {
      const s = this.chunks.generator().findSpawn();
      p.restore({ x: s.x + 0.5, y: Math.max(SEA_LEVEL + 1, this.chunks.generator().heightAt(s.x, s.z) + 1), z: s.z + 0.5, yaw: 0, pitch: 0, flying: false });
      freshSpawn = true;
    }
    this.interaction = new Interaction(world, p, this.d.hotbar, {
      onBreak: (x, y, z, old) => {
        this.d.renderer.breakParticles(x, y, z, old);
        this.d.sounds.play('break', SOUND[idOf(old)]);
      },
      onPlace: (_x, _y, _z, v) => this.d.sounds.play('place', SOUND[idOf(v)]),
      onSwing: () => this.d.renderer.swing(),
      onUse: (_x, _y, _z, v) => this.d.sounds.play('use', SOUND[idOf(v)]),
    });

    // Stream in the spawn area with a generous budget while the loading screen is up.
    const radius = Math.min(2, this.settings.renderDistance);
    const started = performance.now();
    await new Promise<void>((resolve) => {
      const step = () => {
        if (token !== this.loadingToken || !this.chunks) { resolve(); return; }
        this.chunks.update(p.x, p.z, 30);
        const prog = this.chunks.progress(p.x, p.z, radius);
        menus.showLoading(prog < 0.5 ? 'Generating terrain' : 'Building terrain', prog);
        if (this.chunks.areaReady(p.x, p.z, radius) || performance.now() - started > 45000) resolve();
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    if (token !== this.loadingToken || !this.chunks) return;

    if (freshSpawn) {
      const y = this.safeGroundY(Math.floor(p.x), Math.floor(p.z));
      p.y = y;
    }
    meta.lastPlayed = Date.now();
    void this.saveMeta();
    this.time = 0;
    this.autosaveAt = performance.now() + META_SAVE_EVERY * 1000;
    this.sessionAt = performance.now() + SESSION_EVERY * 1000;
    this.onHotbarChange();
    this.d.hud.setVisible(true);
    this.hudHidden = false;
    this.state = 'playing';
    menus.hide();
    this.d.input.enabled = true;
    this.d.renderer.applySettings(this.settings);
    await this.lockOrPause();
  }

  /** Feet y for a fresh spawn: the highest solid, non-leaf block with 2 free blocks above. */
  private safeGroundY(x: number, z: number): number {
    const w = this.world!;
    for (let y = 250; y > 1; y--) {
      const id = idOf(w.get(x, y, z));
      if (!id || !SOLID[id] || LEAVES[id] || FLUID[id]) continue;
      if (!SOLID[idOf(w.get(x, y + 1, z))] && !SOLID[idOf(w.get(x, y + 2, z))]) return y + 1;
    }
    return Math.max(SEA_LEVEL + 1, w.topY(x, z) + 1);
  }

  /** Copy the live state (player, hotbar, time) into the world record. */
  private updateMeta(): WorldMeta | null {
    const meta = this.meta;
    if (!meta) return null;
    meta.player = this.player.serialize();
    meta.hotbar = this.d.hotbar.slots.slice();
    meta.hotbarNames = this.d.hotbar.slots.map((id) => (id ? BLOCKS[id].name : ''));
    meta.selected = this.d.hotbar.selected;
    meta.dayTime = this.dayTime;
    meta.timeMode = this.timeMode;
    return meta;
  }

  /** Synchronous snapshot of the player's state (cheap; localStorage). */
  private saveSession() {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    const meta = this.updateMeta();
    if (meta) storage.saveSession(meta);
  }

  /**
   * The page is being hidden or closed (visibilitychange, pagehide, beforeunload, freeze):
   * write everything that is not saved yet into the synchronous emergency store first, then
   * start the IndexedDB writes. Safe to call any number of times.
   */
  flushOnExit(): Promise<void> {
    if (!this.meta || !this.chunks || (this.state !== 'playing' && this.state !== 'paused')) return Promise.resolve();
    this.saveSession();
    const chunks = this.chunks.flushOnExit();
    return Promise.all([chunks, this.saveMeta()]).then(() => undefined, (e) => console.warn('[game] save on exit failed', e));
  }

  async saveMeta() {
    const meta = this.meta;
    if (!meta) return;
    meta.player = this.player.serialize();
    meta.hotbar = this.d.hotbar.slots.slice();
    meta.hotbarNames = this.d.hotbar.slots.map((id) => (id ? BLOCKS[id].name : ''));
    meta.selected = this.d.hotbar.selected;
    meta.dayTime = this.dayTime;
    meta.timeMode = this.timeMode;
    meta.palette = BLOCKS.map((b) => b.name);
    meta.lastPlayed = Date.now();
    try { await storage.saveWorld(meta); } catch (e) { console.warn('[game] could not save world', e); }
  }

  async saveAll() {
    if (!this.chunks) return;
    await Promise.all([this.chunks.saveAll(), this.saveMeta()]);
  }

  async saveAndQuit() {
    this.loadingToken++;
    this.menus?.showLoading('Saving world', 1);
    try { await this.saveAll(); } catch (e) { console.warn(e); }
    this.chunks?.dispose();
    this.chunks = null;
    this.world = null;
    this.meta = null;
    this.interaction = null;
    this.hit = null;
    this.d.renderer.setHighlight(null, 0, 0, 0);
    this.d.renderer.clear();
    this.state = 'menu';
    this.d.input.enabled = false;
    this.setTouchActive(false);
    this.d.input.exitLock();
    this.d.hud.setVisible(false);
    this.d.hud.setUnderwaterTint(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    this.menus?.showTitle();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.d.input.enabled = false;
    // free the cursor so the menu can be clicked (Esc already does this, other pauses may not)
    this.d.input.exitLock();
    this.setTouchActive(false);
    if (this.d.inventory.isOpen) this.d.inventory.close();
    this.menus?.showPause();
    this.saveSession();
    void this.saveAll();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.menus?.hide();
    this.state = 'playing';
    this.d.input.enabled = true;
    void this.lockOrPause();
  }

  /** Try to grab the mouse; if the browser refuses (no gesture yet), fall back to the pause screen. */
  private async lockOrPause() {
    if (this.touchMode) { this.setTouchActive(true); return; }
    if (this.d.input.locked) return;
    const ok = await this.d.input.requestLock();
    if (!ok && this.state === 'playing' && !this.d.inventory.isOpen) {
      this.state = 'paused';
      this.d.input.enabled = false;
      this.menus?.showPause();
    }
  }

  private enterFullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement || !el.requestFullscreen) return;
    el.requestFullscreen().then(() => {
      const kb = (navigator as unknown as { keyboard?: { lock?: (k?: string[]) => Promise<void> } }).keyboard;
      kb?.lock?.().catch(() => undefined);
    }).catch(() => undefined);
  }

  setTimeMode(m: TimeMode) {
    this.timeMode = m;
    if (m !== 'cycle') this.dayTime = FIXED_TIME[m];
  }

  applySettings(s: Settings) {
    this.d.renderer.applySettings(s);
    this.d.sounds.setVolume(s.volume);
    this.d.touch?.applySettings(s);
    if (this.chunks) {
      this.chunks.setRenderDistance(s.renderDistance);
      const mo = { fancyLeaves: s.fancyLeaves, smoothLighting: s.smoothLighting };
      // Only remesh when the mesh-affecting options really changed.
      const cur = this.chunks.meshOptions;
      if (cur.fancyLeaves !== mo.fancyLeaves || cur.smoothLighting !== mo.smoothLighting) this.chunks.setMeshOptions(mo);
    }
  }

  // ------------------------------------------------------------------ input events
  private onLockChange(locked: boolean) {
    if (!locked && this.state === 'playing' && !this.d.inventory.isOpen && !this.menus?.isOpen()) this.pause();
  }

  private onKey(code: string, e: Event) {
    const inv = this.d.inventory;
    if (inv.isOpen) {
      if (inv.handleKey(code)) { e.preventDefault(); return; }
      return;
    }
    if (this.menus?.isOpen()) {
      if (code === 'Escape') { this.menus.back(); e.preventDefault(); }
      return;
    }
    if (this.state !== 'playing') return;
    if (code === 'Escape') {
      // Normally the browser releases pointer lock (and we pause from onLockChange).
      if (!this.d.input.locked) this.pause();
      return;
    }
    if (matches('inventory', code)) { this.openInventory(); e.preventDefault(); return; }
    if (matches('hideHud', code)) {
      this.hudHidden = !this.hudHidden;
      this.d.hud.setVisible(!this.hudHidden);
      e.preventDefault();
      return;
    }
    if (matches('screenshot', code)) { void this.screenshot(); e.preventDefault(); return; }
    if (matches('debug', code)) {
      this.d.hud.setDebugVisible(!this.d.hud.debugVisible);
      this.debugAcc = 1;
      e.preventDefault();
      return;
    }
    const slot = HOTBAR_ACTIONS.findIndex((a) => matches(a, code));
    if (slot >= 0) this.d.hotbar.select(slot);
    else if (/^Numpad[1-9]$/.test(code)) this.d.hotbar.select(Number(code.slice(6)) - 1);
  }

  private onHotbarChange() {
    const id = this.d.hotbar.current();
    this.d.renderer.setHeldBlock(id);
    this.d.hud.showItemName(id ? blockName(id) : '');
  }

  async screenshot() {
    try {
      const blob = await this.d.renderer.screenshot();
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const name = `blockforge_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}.png`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      this.d.hud.message(`Saved screenshot as ${name}`);
    } catch (e) {
      this.d.hud.message('Could not take a screenshot');
      console.warn(e);
    }
  }

  // ------------------------------------------------------------------ frame
  frame(now: number) {
    const maxFps = this.settings.maxFps;
    if (maxFps > 0 && now - this.lastFrameAt < 1000 / maxFps - 1) return;
    const dt = Math.min(0.1, this.last ? (now - this.last) / 1000 : 0.016);
    this.last = now;
    this.lastFrameAt = now;
    this.countFps(dt);

    const world = this.world, chunks = this.chunks;
    if (!world || !chunks || this.state === 'menu' || this.state === 'loading') {
      this.d.input.endFrame();
      return;
    }
    const p = this.player;
    const input = this.d.input;
    if (this.state === 'playing') {
      this.time += dt;
      if (this.timeMode === 'cycle') this.dayTime = (this.dayTime + dt / DAY_LENGTH) % 1;
      this.d.touch?.update(dt);
      if (input.enabled) {
        if (input.wheel) this.d.hotbar.scroll(Math.sign(input.wheel));
      }
      const before = { x: p.x, z: p.z };
      p.update(dt, input, world, this.settings);
      world.tick(dt);
      this.footsteps(before.x, before.z);

      const eye = p.eye();
      const look = p.look();
      this.hit = raycast(world, eye.x, eye.y, eye.z, look[0], look[1], look[2], 5);
      if (input.enabled && input.locked) this.interaction?.update(dt, input, this.hit);
      this.updateHighlight();

      // Autosave: the world record every few seconds (edited columns are saved by the chunk
      // manager shortly after each edit), and a tiny synchronous snapshot every second.
      // Wall-clock timers: frames can be slow (software rendering) and dt is capped.
      if (now >= this.autosaveAt) { this.autosaveAt = now + META_SAVE_EVERY * 1000; void this.saveAll(); }
      if (now >= this.sessionAt) { this.sessionAt = now + SESSION_EVERY * 1000; this.saveSession(); }
    }
    chunks.update(p.x, p.z, this.state === 'playing' ? 6 : 10);
    this.d.hud.update(dt);
    this.render(dt);
    this.updateDebug(dt);
    input.endFrame();
  }

  private footsteps(px: number, pz: number) {
    const p = this.player, w = this.world!;
    if (p.inWater !== this.wasInWater) {
      if (p.inWater) this.d.sounds.play('splash', 'liquid');
      this.wasInWater = p.inWater;
    }
    if (!p.onGround || p.flying) { this.stepDist = 0; return; }
    this.stepDist += Math.hypot(p.x - px, p.z - pz);
    if (this.stepDist > 1.7) {
      this.stepDist = 0;
      const under = idOf(w.get(Math.floor(p.x), Math.floor(p.y - 0.2), Math.floor(p.z)));
      if (under) this.d.sounds.play('step', SOUND[under]);
    }
  }

  private updateHighlight() {
    const h = this.hit, w = this.world!;
    if (!h || this.hudHidden) { this.d.renderer.setHighlight(null, 0, 0, 0); return; }
    const nb = (dx: number, dy: number, dz: number) => w.get(h.x + dx, h.y + dy, h.z + dz);
    this.d.renderer.setHighlight(selectionBoxes(h.block, nb), h.x, h.y, h.z);
  }

  private render(dt: number) {
    const p = this.player, w = this.world!;
    const eye = p.eye();
    const ex = Math.floor(eye.x), ey = Math.floor(eye.y), ez = Math.floor(eye.z);
    const light = w.getLight(ex, ey, ez);
    const bob = this.settings.viewBobbing ? p.bob() : { phase: 0, amount: 0 };
    this.d.hud.setUnderwaterTint(p.headInWater);
    this.d.renderer.render({
      dt,
      time: this.time,
      dayTime: this.dayTime,
      eye,
      yaw: p.yaw,
      pitch: p.pitch,
      fov: this.settings.fov * p.fovScale(),
      underwater: p.headInWater,
      inLava: p.inLava && idOf(w.get(ex, ey, ez)) === ID.lava,
      handLight: { sky: light >> 4, block: light & 15 },
      bob,
      showHand: !this.hudHidden,
    });
  }

  private countFps(dt: number) {
    const f = this.fps;
    f.frames++; f.acc += dt;
    f.frameMs = dt * 1000;
    if (dt > 0) { f.min = Math.min(f.min, 1 / dt); f.max = Math.max(f.max, 1 / dt); }
    if (f.acc >= 1) {
      f.value = Math.round(f.frames / f.acc);
      f.frames = 0; f.acc = 0;
      if (this.settings.showFps && !this.d.hud.debugVisible && this.state !== 'menu') this.d.hud.setFps(`${f.value} fps`);
      else this.d.hud.setFps(null);
      f.min = 999; f.max = 0;
    }
  }

  private updateDebug(dt: number) {
    if (!this.d.hud.debugVisible || !this.world || !this.chunks) return;
    this.debugAcc += dt;
    if (this.debugAcc < 0.25) return;
    this.debugAcc = 0;
    const p = this.player, w = this.world, r = this.d.renderer;
    const bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z);
    const cx = Math.floor(bx / 16), cz = Math.floor(bz / 16);
    const chunk = w.getChunk(cx, cz);
    const biome = chunk ? BIOME_NAMES[chunk.biome[xzIndex(bx & 15, bz & 15)]] ?? '?' : 'loading';
    const yawDeg = ((-p.yaw * 180 / Math.PI) % 360 + 360) % 360;
    const facing = Math.round(yawDeg / 90) % 4;
    const light = w.getLight(bx, Math.floor(p.y + 0.1), bz);
    const st = r.stats();
    const cs = this.chunks.stats;
    const f = this.fps;
    const left = [
      `BlockForge 1.0 (${__BUILD_TIME__.slice(0, 10)})`,
      `${f.value} fps (${f.frameMs.toFixed(1)} ms)`,
      `Draw calls: ${st.drawCalls}  Triangles: ${st.triangles.toLocaleString()}`,
      `Sections: ${st.visibleSections} / ${st.sections} visible`,
      `Chunks: ${cs.loaded} loaded, gen queue ${cs.genQueue}, mesh queue ${cs.meshQueue}`,
      '',
      `XYZ: ${p.x.toFixed(3)} / ${p.y.toFixed(3)} / ${p.z.toFixed(3)}`,
      `Block: ${bx} ${by} ${bz}`,
      `Chunk: ${bx & 15} ${by & 15} ${bz & 15} in ${cx} ${by >> 4} ${cz}`,
      `Facing: ${FACING[facing]} (${FACING_AXIS[facing]}) (${yawDeg.toFixed(1)} / ${(p.pitch * -180 / Math.PI).toFixed(1)})`,
      `Biome: ${biome}`,
      `Light: ${light >> 4} sky, ${light & 15} block`,
      `Time: ${this.clock()} (${this.timeMode})`,
      `Mode: creative${p.flying ? ', flying' : ''}${p.sprinting ? ', sprinting' : ''}${p.sneaking ? ', sneaking' : ''}`,
    ];
    if (this.hit) {
      const h = this.hit;
      left.push('', `Looking at: ${h.x} ${h.y} ${h.z}`, `${blockName(idOf(h.block))} [${BLOCKS[idOf(h.block)].name}] meta ${metaOf(h.block)}`);
    }
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    const right = [
      `Renderer: ${r.info.webgl2 ? 'WebGL 2' : 'WebGL 1'}`,
      `GPU: ${r.info.renderer}`,
      `Vendor: ${r.info.vendor}`,
      `Display: ${innerWidth}x${innerHeight} @ ${(window.devicePixelRatio || 1).toFixed(2)}x`,
      mem ? `Memory: ${Math.round(mem.usedJSHeapSize / 1048576)} / ${Math.round(mem.jsHeapSizeLimit / 1048576)} MB` : 'Memory: n/a',
      `CPU threads: ${navigator.hardwareConcurrency || '?'}`,
      '',
      `Preset: ${this.settings.preset}, render distance ${this.settings.renderDistance}`,
      `Shadows: ${this.settings.shadows ? 'on' : 'off'}, leaves: ${this.settings.fancyLeaves ? 'fancy' : 'fast'}`,
      `Seed: ${this.meta?.seed ?? ''}`,
      `Blocks in registry: ${COUNT - 1}`,
      `Gen ${this.chunks.stats.genMs.toFixed(1)} ms, light ${this.chunks.stats.lightMs.toFixed(1)} ms, mesh ${this.chunks.stats.meshMs.toFixed(1)} ms`,
    ];
    this.d.hud.setDebug(left, right);
  }

  private clock(): string {
    // dayTime 0 = 06:00
    const minutes = Math.floor(((this.dayTime * 24 + 6) % 24) * 60);
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }
}
