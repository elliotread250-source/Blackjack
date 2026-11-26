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
  BLOCKS, COUNT, ID, blockName, idOf, metaOf, FLUID, SOLID, LEAVES, isItem, SHAPE, S,
} from '../blocks/registry';
import { Inventory, loadStacks, saveStacks } from './inventory';
import type { Stack } from './inventory';
import { Survival } from './survival';
import { Mobs, MOB_TYPES, rayBox } from './mobs';
import type { Mob, MobTarget } from './mobs';
import type { Net } from './net';
import { attackDamage, breakInfo, dropsFor, itemDef, thingName, isItemId, thingFromKey, ITEM_ID } from './items';
import type { Entities } from '../render/entities';
import { CHEST_SIZE } from '../ui/survivalUi';
import type { StatusBars, SurvivalScreen, HotbarCounts, DeathScreen, ChatBox, RoomBadge, ChestView } from '../ui/survivalUi';
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
  inv: Inventory;
  entities: Entities;
  bars: StatusBars;
  screen: SurvivalScreen;
  counts: HotbarCounts;
  death: DeathScreen;
  chat: ChatBox;
  badge: RoomBadge;
}

/** Id the creature code uses for the local player. */
const SELF = -1;
const STATION_REACH = 4;

/** 0 at night, 1 by day, from the time of day (0 sunrise, .25 noon, .5 sunset). */
function dayLight(dayTime: number): number {
  return Math.max(0, Math.min(1, (Math.sin(dayTime * Math.PI * 2) + 0.15) / 0.35));
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
  mode: 'creative' | 'survival' = 'creative';
  survival: Survival | null = null;
  mobs: Mobs | null = null;
  net: Net | null = null;
  /** Called when an online game ends because the connection dropped. */
  onDisconnected: ((reason: string) => void) | null = null;
  private chests = new Map<string, (Stack | null)[]>();
  private applyingRemote = false;
  private primaryBreak = false;
  private attackCd = 0;
  private swung = false;
  private mobSendT = 0;
  private timeSendT = 0;
  private fullMsgAt = 0;

  constructor(d: GameDeps) {
    this.d = d;
    d.hotbar.onChange(() => this.onHotbarChange());
    d.inv.onChange(() => { if (this.mode === 'survival' && this.world) d.inv.syncHotbar(d.hotbar); });
    d.screen.onClose = () => {
      if (this.state === 'playing' && !d.death.isOpen) { this.d.input.enabled = true; void this.lockOrPause(); }
    };
    d.screen.onCraft = () => d.sounds.play('click', 'wood');
    d.death.onRespawn = () => this.respawn();
    d.chat.onSend = (t) => this.net?.chat(t);
    d.chat.onClose = () => { if (this.state === 'playing' && !d.death.isOpen) d.input.enabled = true; };
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

  /** The id in the selected slot: a block, or a survival item. */
  private heldId(): number {
    return this.mode === 'survival' ? this.d.inv.slots[this.d.hotbar.selected]?.id ?? 0 : this.d.hotbar.current();
  }

  /** Which recipe sets are in reach: by hand always, a crafting table or furnace when one is near. */
  private stationsNear(): [boolean, boolean, boolean] {
    const w = this.world, p = this.player;
    let table = false, furnace = false;
    if (w) {
      const bx = Math.floor(p.x), by = Math.floor(p.y + 1), bz = Math.floor(p.z);
      for (let y = by - 3; y <= by + 3; y++) for (let x = bx - STATION_REACH; x <= bx + STATION_REACH; x++) for (let z = bz - STATION_REACH; z <= bz + STATION_REACH; z++) {
        const id = idOf(w.get(x, y, z));
        if (id === ID.crafting_table) table = true;
        else if (id === ID.furnace || id === ID.blast_furnace) furnace = true;
      }
    }
    return [true, table, furnace];
  }

  private openSurvival(chest: ChestView | null) {
    if (this.state !== 'playing' || this.d.screen.isOpen || this.d.death.isOpen) return;
    this.d.input.enabled = false;
    this.d.screen.open(this.stationsNear(), chest);
    this.d.input.exitLock();
    this.setTouchActive(false);
  }

  private give(id: number, n: number, d?: number) {
    if (!id || n <= 0) return;
    const left = this.d.inv.add(id, n, d);
    if (left > 0 && performance.now() > this.fullMsgAt) { this.fullMsgAt = performance.now() + 4000; this.d.hud.message('Your inventory is full'); }
  }

  private loot(items: unknown) {
    if (!Array.isArray(items)) return;
    for (const it of items.slice(0, 8)) {
      if (!Array.isArray(it)) continue;
      const id = thingFromKey(String(it[0])) || ITEM_ID[String(it[0])] || 0;
      const n = Math.max(1, Math.min(8, Math.floor(Number(it[1]) || 1)));
      if (id && this.mode === 'survival') this.give(id, n);
    }
  }

  private chestAt(x: number, y: number, z: number): ChestView {
    const key = `${x},${y},${z}`;
    let slots = this.chests.get(key);
    if (!slots) { slots = new Array(CHEST_SIZE).fill(null); this.chests.set(key, slots); }
    const list = slots;
    return { slots: list, changed: () => { this.net?.chest(key, saveStacks(list)); } };
  }

  /** Right-click on a block that does something of its own. */
  private interact(x: number, y: number, z: number, v: number): boolean {
    const id = idOf(v);
    if (SHAPE[id] === S.bed) { this.useBed(x, y, z); return true; }
    if (this.mode !== 'survival') return false;
    if (id === ID.crafting_table || id === ID.furnace || id === ID.blast_furnace) { this.openSurvival(null); return true; }
    if (id === ID.chest || id === ID.barrel) { this.d.sounds.play('use', 'wood'); this.openSurvival(this.chestAt(x, y, z)); return true; }
    return false;
  }

  private useBed(x: number, y: number, z: number) {
    if (this.survival) this.survival.spawn = [x + 0.5, y + 0.6, z + 0.5];
    const night = this.dayTime > 0.5;
    if (night && this.timeMode === 'cycle') {
      this.dayTime = 0.02;
      this.net?.time(this.dayTime);
      // the things that came out in the dark go with it
      if (this.mobs && this.mobs.authority) this.mobs.list = this.mobs.list.filter((m) => !MOB_TYPES[m.t].hostile);
      this.d.hud.message(this.survival ? 'You slept until morning. You will wake up here from now on.' : 'You slept until morning.');
    } else {
      this.d.hud.message(this.survival ? 'You can only sleep at night. You will wake up here from now on.' : 'You can only sleep at night.');
    }
    this.d.sounds.play('use', 'wool');
  }

  private respawn() {
    const s = this.survival, p = this.player;
    if (!s || !this.chunks) return;
    s.respawn();
    let pos = s.spawn;
    if (!pos) {
      const f = this.chunks.generator().findSpawn();
      pos = [f.x + 0.5, Math.max(SEA_LEVEL + 1, this.chunks.generator().heightAt(f.x, f.z) + 1), f.z + 0.5];
    }
    p.restore({ x: pos[0], y: pos[1], z: pos[2], yaw: 0, pitch: 0, flying: false });
    s.resetFall(pos[1]);
    this.d.death.hide();
    if (this.state === 'playing') { this.d.input.enabled = true; void this.lockOrPause(); }
  }

  openInventory() {
    if (this.mode === 'survival') { this.openSurvival(null); return; }
    if (this.state !== 'playing' || this.d.inventory.isOpen) return;
    this.d.input.enabled = false;
    this.d.inventory.open();
    this.d.input.exitLock();
    this.setTouchActive(false);
  }

  // ------------------------------------------------------------------ lifecycle
  async startWorld(meta: WorldMeta, net: Net | null = null) {
    const token = ++this.loadingToken;
    this.net = net;
    this.mode = meta.mode === 'survival' ? 'survival' : 'creative';
    this.state = 'loading';
    const menus = this.menus!;
    menus.showLoading('Preparing world', 0);
    if (this.settings.fullscreen) this.enterFullscreen();
    this.d.sounds.unlock();

    const savedKeys = net ? new Set<number>() : await storage.savedChunkKeys(meta.id).catch(() => new Set<number>());
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
      noSave: !!net,
      onColumn: net ? (g) => net.applyTo(g) : undefined,
    });
    // Online: every block the player changes (not what flowing water does) goes to the room.
    const chained = world.onBlockChange;
    world.onBlockChange = (x, y, z, o, n) => {
      chained?.(x, y, z, o, n);
      if (this.net && !this.applyingRemote) this.net.edit(x, y, z, n);
    };
    this.timeMode = meta.timeMode ?? 'cycle';
    this.dayTime = meta.dayTime ?? 0.05;

    // Hotbar: saved by name so registry changes never scramble it.
    if (this.mode === 'survival') { /* the hotbar mirrors the inventory, set below */ }
    else if (meta.hotbarNames && meta.hotbarNames.length === 9) {
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
    p.canFly = this.mode !== 'survival';
    if (!p.canFly) p.flying = false;

    // chests
    this.chests.clear();
    const savedChests = net ? Object.fromEntries(net.chests) : meta.chests ?? {};
    for (const [k, v] of Object.entries(savedChests)) this.chests.set(k, loadStacks(v, CHEST_SIZE));

    // survival state
    const inv = this.d.inv;
    if (this.mode === 'survival') {
      inv.restore(meta.survival?.inv ?? null);
      const sv = new Survival(inv, {
        onHurt: () => this.d.sounds.play('break', 'wool', 1.5),
        onDeath: (cause) => {
          this.d.input.enabled = false;
          if (this.d.screen.isOpen) this.d.screen.close();
          this.d.input.exitLock();
          this.setTouchActive(false);
          this.d.death.show(`You ${cause}`);
          this.net?.chat(cause);
        },
      });
      sv.restore(meta.survival?.stats as Record<string, never> | undefined);
      this.survival = sv;
      inv.syncHotbar(this.d.hotbar);
    } else this.survival = null;
    this.d.bars.setVisible(this.mode === 'survival');
    this.d.death.hide();

    // creatures
    const mobs = new Mobs(world);
    mobs.hostileAllowed = this.mode === 'survival';
    mobs.authority = !net || net.isHost;
    mobs.onAttack = (tid, dmg, mob) => {
      const name = MOB_TYPES[mob.t].name;
      if (tid === SELF) this.survival?.damage(dmg, `were caught by a ${name}`);
      else this.net?.direct(tid, { k: 'hurt', dmg, by: name });
    };
    mobs.onDeath = (_mob, killer, drops) => {
      if (killer === SELF) this.loot(drops);
      else this.net?.direct(killer, { k: 'loot', items: drops });
    };
    this.mobs = mobs;
    this.d.entities.clear();
    if (net) this.bindNet(net);
    this.d.badge.set(net ? `World code: ${net.room.code}` : null);

    this.interaction = new Interaction(world, p, this.d.hotbar, {
      onBreak: (x, y, z, old) => {
        this.d.renderer.breakParticles(x, y, z, old);
        this.d.sounds.play('break', SOUND[idOf(old)]);
        const id = idOf(old);
        const primary = this.primaryBreak;
        this.primaryBreak = false;
        // a broken chest hands back what was in it
        if (id === ID.chest || id === ID.barrel) {
          const key = `${x},${y},${z}`;
          const had = this.chests.get(key);
          if (had) {
            if (this.mode === 'survival') for (const st of had) if (st) this.give(st.id, st.n, st.d);
            this.chests.delete(key);
            this.net?.chest(key, null);
          }
        }
        if (this.mode !== 'survival') return;
        if (primary && !breakInfo(id, this.heldId()).drops) return;
        for (const [did, n] of dropsFor(old)) this.give(did, n);
      },
      onPlace: (_x, _y, _z, v) => this.d.sounds.play('place', SOUND[idOf(v)]),
      onSwing: () => { this.d.renderer.swing(); this.swung = true; },
      onUse: (_x, _y, _z, v) => this.d.sounds.play('use', SOUND[idOf(v)]),
      onInteract: (x, y, z, v) => this.interact(x, y, z, v),
    });
    this.interaction.rules = this.mode !== 'survival' ? null : {
      breakTime: (v) => breakInfo(idOf(v), this.heldId()).time,
      onMined: () => {
        const slot = this.d.hotbar.selected;
        const st = inv.slots[slot];
        if (st && st.d !== undefined) {
          const name = thingName(st.id);
          if (inv.wear(slot)) { this.d.hud.message(`Your ${name} broke`); this.d.sounds.play('break', 'wood', 0.7); }
        }
        this.survival?.exhaust(0.025);
      },
      onProgress: (hit, pr) => {
        if (!hit) { this.primaryBreak = true; this.d.entities.setCrack(0, 0, 0, null); }
        else this.d.entities.setCrack(hit.x, hit.y, hit.z, pr);
      },
      heldBlock: () => { const id = this.heldId(); return id && !isItemId(id) ? id : 0; },
      consume: () => inv.consume(this.d.hotbar.selected),
      useItem: () => {
        const slot = this.d.hotbar.selected;
        const st = inv.slots[slot];
        const def = st ? itemDef(st.id) : null;
        if (!def?.food || !this.survival?.eat(def)) return false;
        inv.consume(slot);
        if (def.name === 'mushroom_stew') this.give(ITEM_ID.bowl, 1);
        this.d.sounds.play('use', 'wool', 0.8);
        this.d.renderer.swing();
        return true;
      },
    };

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
    if (this.survival) {
      if (!this.survival.spawn) this.survival.spawn = [p.x, p.y, p.z];
      this.survival.resetFall(p.y);
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
    if (this.mode !== 'survival') {
      meta.hotbar = this.d.hotbar.slots.slice();
      meta.hotbarNames = this.d.hotbar.slots.map((id) => (id ? BLOCKS[id].name : ''));
    }
    meta.selected = this.d.hotbar.selected;
    meta.dayTime = this.dayTime;
    meta.timeMode = this.timeMode;
    this.stampSurvival(meta);
    return meta;
  }

  private stampSurvival(meta: WorldMeta) {
    meta.mode = this.mode;
    if (this.survival) meta.survival = { inv: this.d.inv.serialize(), stats: this.survival.serialize() };
    if (!this.net) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of this.chests) if (v.some((x) => x)) out[k] = saveStacks(v);
      meta.chests = out;
    }
  }

  /** Online worlds live on the server; this browser only keeps where you were and what you carried. */
  private saveOnline() {
    const meta = this.meta, net = this.net;
    if (!meta || !net) return;
    try {
      localStorage.setItem('blockforge.mp.' + net.room.code, JSON.stringify({
        player: this.survival?.dead ? null : this.player.serialize(),
        survival: this.survival ? { inv: this.d.inv.serialize(), stats: this.survival.serialize() } : undefined,
      }));
    } catch { /* storage full or blocked */ }
  }

  /** Synchronous snapshot of the player's state (cheap; localStorage). */
  private saveSession() {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    if (this.net) { this.saveOnline(); return; }
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
    if (this.net) return Promise.resolve();
    const chunks = this.chunks.flushOnExit();
    return Promise.all([chunks, this.saveMeta()]).then(() => undefined, (e) => console.warn('[game] save on exit failed', e));
  }

  async saveMeta() {
    const meta = this.meta;
    if (!meta) return;
    if (this.net) { this.saveOnline(); return; }
    meta.player = this.player.serialize();
    if (this.mode !== 'survival') {
      meta.hotbar = this.d.hotbar.slots.slice();
      meta.hotbarNames = this.d.hotbar.slots.map((id) => (id ? BLOCKS[id].name : ''));
    }
    meta.selected = this.d.hotbar.selected;
    meta.dayTime = this.dayTime;
    meta.timeMode = this.timeMode;
    this.stampSurvival(meta);
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
    if (this.net) { this.net.events = null; this.net.close(); this.net = null; }
    if (this.d.screen.isOpen) this.d.screen.close();
    if (this.d.chat.isOpen) this.d.chat.close();
    this.d.death.hide();
    this.d.bars.setVisible(false);
    this.d.counts.update(null);
    this.d.badge.set(null);
    this.d.entities.clear();
    this.mobs = null;
    this.survival = null;
    this.mode = 'creative';
    this.chests.clear();
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
    if (this.d.screen.isOpen) this.d.screen.close();
    if (this.d.chat.isOpen) this.d.chat.close();
    this.menus?.showPause();
    this.saveSession();
    void this.saveAll();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.menus?.hide();
    this.state = 'playing';
    if (this.d.death.isOpen) return;      // still dead: the Respawn button is next
    this.d.input.enabled = true;
    void this.lockOrPause();
  }

  /** Try to grab the mouse; if the browser refuses (no gesture yet), fall back to the pause screen. */
  private async lockOrPause() {
    if (this.touchMode) { this.setTouchActive(true); return; }
    if (this.d.input.locked) return;
    const ok = await this.d.input.requestLock();
    if (!ok && this.state === 'playing' && !this.d.inventory.isOpen && !this.d.screen.isOpen && !this.d.death.isOpen) {
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
    if (!locked && this.state === 'playing' && !this.d.inventory.isOpen && !this.d.screen.isOpen && !this.d.death.isOpen && !this.menus?.isOpen()) this.pause();
  }

  private onKey(code: string, e: Event) {
    if (this.d.chat.isOpen) return;
    if (this.d.screen.isOpen) {
      if (this.d.screen.handleKey(code)) e.preventDefault();
      return;
    }
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
    if (this.d.death.isOpen) return;
    if (this.net && (code === 'KeyT' || code === 'Enter')) {
      this.d.input.enabled = false;
      this.d.chat.open();
      e.preventDefault();
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
    this.d.hud.showItemName(id ? thingName(id) : '');
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
    // An online world keeps going while this player has the menu open.
    if (this.state === 'playing' || (this.state === 'paused' && this.net)) {
      const playing = this.state === 'playing';
      const sv = this.survival;
      this.time += dt;
      if (this.timeMode === 'cycle') this.dayTime = (this.dayTime + dt / DAY_LENGTH) % 1;
      if (playing) this.d.touch?.update(dt);
      if (playing && input.enabled) {
        if (input.wheel) this.d.hotbar.scroll(Math.sign(input.wheel));
      }
      const before = { x: p.x, z: p.z };
      p.noSprint = !!sv && !sv.canSprint;
      if (p.noSprint) p.sprinting = false;
      if (!sv || !sv.dead) p.update(dt, input, world, this.settings);
      world.tick(dt);
      this.footsteps(before.x, before.z);
      if (sv) {
        sv.update(dt, p, world);
        this.d.bars.update(sv, this.d.inv.armorPoints(), p.headInWater);
      }
      this.d.counts.update(sv ? this.d.inv : null);

      const eye = p.eye();
      const look = p.look();
      this.hit = raycast(world, eye.x, eye.y, eye.z, look[0], look[1], look[2], 5);
      this.swung = false;
      if (playing && input.enabled && input.locked) this.act(dt, input, eye, look);
      this.updateHighlight();
      this.updateCreatures(dt);

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

  /** Hit a creature or another player if one is in the way; otherwise dig, place and use blocks. */
  private act(dt: number, input: Input, eye: { x: number; y: number; z: number }, look: [number, number, number]) {
    if (this.attackCd > 0) this.attackCd -= dt;
    const reach = Math.min(4, this.hit ? this.hit.dist : 4);
    const mobHit = this.mobs ? this.mobs.pick(eye.x, eye.y, eye.z, look[0], look[1], look[2], reach) : null;
    let other = -1, otherDist = mobHit ? mobHit.dist : reach;
    if (this.net) {
      for (const r of this.net.players.values()) {
        const d = rayBox(eye.x, eye.y, eye.z, look[0], look[1], look[2], r.x - 0.35, r.y, r.z - 0.35, r.x + 0.35, r.y + 1.8, r.z + 0.35);
        if (d >= 0 && d < otherDist) { otherDist = d; other = r.id; }
      }
    }
    const target = other >= 0 || !!mobHit;
    if (target && input.actionPressed('attack') && this.attackCd <= 0) {
      this.attackCd = 0.3;
      const dmg = attackDamage(this.heldId());
      const l = Math.hypot(look[0], look[2]) || 1;
      const kx = look[0] / l, kz = look[2] / l;
      if (other >= 0) this.net!.direct(other, { k: 'pvp', dmg });
      else if (mobHit) {
        if (this.mobs!.authority) this.mobs!.hit(mobHit.mob.id, dmg, kx, kz, SELF);
        else { this.net?.direct(this.net.hostId, { k: 'mobhit', id: mobHit.mob.id, dmg, kx, kz }); mobHit.mob.hurt = 0.3; }
      }
      this.d.sounds.play('break', 'wool', 1.2);
      if (this.survival) {
        this.survival.exhaust(0.1);
        const slot = this.d.hotbar.selected, st = this.d.inv.slots[slot];
        if (st && st.d !== undefined) {
          const name = thingName(st.id);
          if (this.d.inv.wear(slot)) this.d.hud.message(`Your ${name} broke`);
        }
      }
    }
    this.interaction?.update(dt, input, target ? null : this.hit);
  }

  private updateCreatures(dt: number) {
    const w = this.world!, p = this.player, net = this.net, mobs = this.mobs;
    const day = dayLight(this.dayTime);
    if (mobs) {
      const targets: MobTarget[] = [{ id: SELF, x: p.x, y: p.y, z: p.z, hunted: this.mode === 'survival' && !this.survival?.dead }];
      if (net) for (const r of net.players.values()) targets.push({ id: r.id, x: r.x, y: r.y, z: r.z, hunted: r.survival });
      mobs.update(dt, targets, day);
    }
    if (net) {
      net.update(dt, { x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch, sneaking: p.sneaking, swung: this.swung, survival: this.mode === 'survival' && !this.survival?.dead });
      if (net.isHost && mobs) {
        this.mobSendT -= dt;
        if (this.mobSendT <= 0) { this.mobSendT = 0.1; net.mobs(mobs.snapshot()); }
        this.timeSendT -= dt;
        if (this.timeSendT <= 0) { this.timeSendT = 5; net.time(this.dayTime); }
      }
    }
    const lightAt = (x: number, y: number, z: number) => {
      const l = w.getLight(Math.floor(x), Math.floor(y), Math.floor(z));
      return 0.18 + 0.82 * Math.max(((l >> 4) / 15) * (0.12 + 0.88 * day), (l & 15) / 15);
    };
    this.d.entities.syncMobs(mobs ? mobs.list : [], lightAt);
    this.d.entities.syncPlayers(net ? Array.from(net.players.values()) : [], lightAt);
  }

  /** Listen to the room: other players' blocks, chat, creatures and the odd direct message. */
  private bindNet(net: Net) {
    const hud = this.d.hud;
    const num = (v: unknown, max: number) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(max, v)) : 0);
    net.events = {
      onEdit: (x, y, z, v) => {
        const w = this.world;
        if (!w || !w.getChunk(Math.floor(x / 16), Math.floor(z / 16))) return;   // applied when the column loads
        this.applyingRemote = true;
        try { w.set(x, y, z, v); } finally { this.applyingRemote = false; }
      },
      onChat: (name, text) => hud.message(`<${name}> ${text}`),
      onJoin: (name) => hud.message(`${name} joined the world`),
      onLeave: (name) => hud.message(`${name} left the world`),
      onMobs: (snap) => { if (this.mobs && !this.mobs.authority) this.mobs.applySnapshot(snap); },
      onTime: (v) => { if (this.timeMode === 'cycle') this.dayTime = v; },
      onHost: (isHost) => {
        if (!this.mobs) return;
        if (isHost && !this.mobs.authority) this.mobs.clear();   // start the creatures afresh under the new host
        this.mobs.authority = isHost;
      },
      onChest: (key, data) => {
        if (data === null) { this.chests.delete(key); return; }
        const fresh = loadStacks(data, CHEST_SIZE);
        const cur = this.chests.get(key);
        if (cur) { for (let i = 0; i < CHEST_SIZE; i++) cur[i] = fresh[i]; if (this.d.screen.isOpen) this.d.inv.changed(); }
        else this.chests.set(key, fresh);
      },
      onDirect: (from, d) => {
        const who = net.players.get(from)?.name ?? 'someone';
        switch (d.k) {
          case 'mobhit': if (this.mobs?.authority) this.mobs.hit(num(d.id, 1e9), num(d.dmg, 12), Math.max(-1, Math.min(1, Number(d.kx) || 0)), Math.max(-1, Math.min(1, Number(d.kz) || 0)), from); break;
          case 'hurt': if (from === net.hostId) this.survival?.damage(num(d.dmg, 12), `were caught by a ${String(d.by ?? 'creature').replace(/[^\w ]/g, '').slice(0, 20)}`); break;
          case 'pvp': this.survival?.damage(num(d.dmg, 12), `were beaten by ${who}`); break;
          case 'loot': if (from === net.hostId) this.loot(d.items); break;
        }
      },
      onClosed: (reason) => {
        hud.message(reason);
        const cb = this.onDisconnected;
        void this.saveAndQuit().then(() => cb?.(reason));
      },
    };
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
      `Mode: ${this.mode}${this.net ? ` (online, ${this.net.players.size + 1} players)` : ''}${p.flying ? ', flying' : ''}${p.sprinting ? ', sprinting' : ''}${p.sneaking ? ', sneaking' : ''}`,
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
