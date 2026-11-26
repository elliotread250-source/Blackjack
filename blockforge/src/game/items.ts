// Survival items: everything a player can hold that is not a block (tools, armour, food,
// materials), plus the survival properties of blocks (how long they take to break, which
// tool suits them, what they drop). Item ids start at ITEM_BASE so they never collide with
// block ids (blocks are 10-bit). Item art is painted by code at 16x16, like the block textures.
import { BLOCKS, COUNT, ID, LEAVES, SHAPE, S, FLUID, blockName } from '../blocks/registry';

export const ITEM_BASE = 2000;
export type ToolKind = 'pick' | 'axe' | 'shovel' | 'sword';

export interface ItemDef {
  name: string;
  display: string;
  stack: number;
  tool?: { kind: ToolKind; tier: number };
  dur?: number;                              // uses before a tool breaks
  armor?: { slot: number; points: number };  // slot 0 head, 1 chest, 2 legs, 3 feet
  food?: { hunger: number; sat: number; heal?: number };
  fuel?: number;                             // smelts per item when burnt
  art: { shape: string; c: number[]; c2?: number[] };
}

type RGB = number[];
const WOOD: RGB = [156, 116, 64], STONE: RGB = [134, 134, 134], COPPER: RGB = [216, 124, 84],
  IRON: RGB = [220, 220, 220], DIAMOND: RGB = [92, 219, 213], GOLD: RGB = [246, 206, 62], HIDE: RGB = [152, 94, 52];

/** Tool tiers: index = tier (0 = bare hand). */
export const TIER_NAMES = ['Hand', 'Wooden', 'Stone', 'Copper', 'Iron', 'Diamond'];
const TIER_KEYS = ['', 'wooden', 'stone', 'copper', 'iron', 'diamond'];
const TIER_COL: RGB[] = [[0, 0, 0], WOOD, STONE, COPPER, IRON, DIAMOND];
export const TIER_SPEED = [1, 2, 3.5, 5, 6.5, 9];
const TIER_DUR = [0, 60, 132, 200, 300, 1300];
const SWORD_DMG = [1, 4, 5, 6, 7, 9];
const AXE_DMG = [1, 3, 4, 5, 6, 7];

export const ITEMS: ItemDef[] = [];
export const ITEM_ID: Record<string, number> = {};
function item(d: ItemDef) { ITEM_ID[d.name] = ITEM_BASE + ITEMS.length; ITEMS.push(d); }

// materials
item({ name: 'stick', display: 'Stick', stack: 64, fuel: 0.5, art: { shape: 'stick', c: WOOD } });
item({ name: 'coal', display: 'Coal', stack: 64, fuel: 8, art: { shape: 'lump', c: [44, 44, 48] } });
item({ name: 'charcoal', display: 'Charcoal', stack: 64, fuel: 8, art: { shape: 'lump', c: [70, 58, 48] } });
item({ name: 'raw_iron', display: 'Raw Iron', stack: 64, art: { shape: 'lump', c: [200, 160, 130] } });
item({ name: 'raw_copper', display: 'Raw Copper', stack: 64, art: { shape: 'lump', c: [190, 110, 80] } });
item({ name: 'raw_gold', display: 'Raw Gold', stack: 64, art: { shape: 'lump', c: [230, 190, 70] } });
item({ name: 'iron_ingot', display: 'Iron Ingot', stack: 64, art: { shape: 'ingot', c: IRON } });
item({ name: 'copper_ingot', display: 'Copper Ingot', stack: 64, art: { shape: 'ingot', c: COPPER } });
item({ name: 'gold_ingot', display: 'Gold Ingot', stack: 64, art: { shape: 'ingot', c: GOLD } });
item({ name: 'diamond', display: 'Diamond', stack: 64, art: { shape: 'gem', c: DIAMOND } });
item({ name: 'emerald', display: 'Emerald', stack: 64, art: { shape: 'gem', c: [60, 210, 110] } });
item({ name: 'lapis', display: 'Lapis Lazuli', stack: 64, art: { shape: 'lump', c: [50, 90, 200] } });
item({ name: 'redstone_dust', display: 'Redstone Dust', stack: 64, art: { shape: 'dust', c: [210, 30, 20] } });
item({ name: 'quartz', display: 'Quartz', stack: 64, art: { shape: 'gem', c: [236, 230, 222] } });
item({ name: 'flint', display: 'Flint', stack: 64, art: { shape: 'flint', c: [60, 60, 66] } });
item({ name: 'hide', display: 'Hide', stack: 64, art: { shape: 'hide', c: HIDE } });
item({ name: 'thread', display: 'Thread', stack: 64, art: { shape: 'thread', c: [236, 236, 236] } });
item({ name: 'bone', display: 'Bone', stack: 64, art: { shape: 'bone', c: [236, 232, 214] } });
item({ name: 'bowl', display: 'Bowl', stack: 64, art: { shape: 'bowl', c: [120, 84, 44] } });
// food
item({ name: 'apple', display: 'Apple', stack: 64, food: { hunger: 4, sat: 2.4 }, art: { shape: 'apple', c: [214, 44, 40] } });
item({ name: 'golden_apple', display: 'Golden Apple', stack: 64, food: { hunger: 6, sat: 9, heal: 8 }, art: { shape: 'apple', c: GOLD } });
item({ name: 'raw_meat', display: 'Raw Meat', stack: 64, food: { hunger: 3, sat: 1.2 }, art: { shape: 'meat', c: [226, 110, 110] } });
item({ name: 'cooked_meat', display: 'Cooked Meat', stack: 64, food: { hunger: 8, sat: 9 }, art: { shape: 'meat', c: [150, 84, 44] } });
item({ name: 'melon_slice', display: 'Melon Slice', stack: 64, food: { hunger: 2, sat: 1.2 }, art: { shape: 'slice', c: [222, 60, 50], c2: [80, 150, 50] } });
item({ name: 'mushroom_stew', display: 'Mushroom Stew', stack: 1, food: { hunger: 6, sat: 7 }, art: { shape: 'stew', c: [120, 84, 44], c2: [196, 140, 100] } });
// tools
for (let t = 1; t <= 5; t++) {
  const k = TIER_KEYS[t], n = TIER_NAMES[t], c = TIER_COL[t];
  item({ name: `${k}_pickaxe`, display: `${n} Pickaxe`, stack: 1, tool: { kind: 'pick', tier: t }, dur: TIER_DUR[t], art: { shape: 'pick', c } });
  item({ name: `${k}_axe`, display: `${n} Axe`, stack: 1, tool: { kind: 'axe', tier: t }, dur: TIER_DUR[t], art: { shape: 'axe', c } });
  item({ name: `${k}_shovel`, display: `${n} Shovel`, stack: 1, tool: { kind: 'shovel', tier: t }, dur: TIER_DUR[t], art: { shape: 'shovel', c } });
  item({ name: `${k}_sword`, display: `${n} Sword`, stack: 1, tool: { kind: 'sword', tier: t }, dur: TIER_DUR[t], art: { shape: 'sword', c } });
}
// armour
export const ARMOR_SETS: [string, string, RGB, number[]][] = [
  ['hide', 'Hide', HIDE, [1, 3, 2, 1]],
  ['copper', 'Copper', COPPER, [2, 4, 3, 1]],
  ['iron', 'Iron', IRON, [2, 6, 5, 2]],
  ['diamond', 'Diamond', DIAMOND, [3, 8, 6, 3]],
];
export const ARMOR_PIECES: [string, string, string][] = [
  ['helmet', 'Helmet', 'helmet'], ['chestplate', 'Chestplate', 'chest'], ['leggings', 'Leggings', 'legs'], ['boots', 'Boots', 'boots'],
];
for (const [k, n, c, pts] of ARMOR_SETS) {
  ARMOR_PIECES.forEach(([pk, pn, shape], slot) => {
    item({ name: `${k}_${pk}`, display: `${n} ${pn}`, stack: 1, armor: { slot, points: pts[slot] }, art: { shape, c } });
  });
}

export const isItemId = (id: number) => id >= ITEM_BASE && id < ITEM_BASE + ITEMS.length;
export const itemDef = (id: number): ItemDef | null => (isItemId(id) ? ITEMS[id - ITEM_BASE] : null);
/** Display name of a block or an item id. */
export function thingName(id: number): string {
  if (!id) return '';
  const d = itemDef(id);
  return d ? d.display : blockName(id);
}
/** Stable name used in saves ("stone", "iron_pickaxe"). */
export function thingKey(id: number): string {
  const d = itemDef(id);
  return d ? 'i:' + d.name : id > 0 && id < COUNT ? BLOCKS[id].name : '';
}
export function thingFromKey(key: string): number {
  if (!key) return 0;
  if (key.startsWith('i:')) return ITEM_ID[key.slice(2)] ?? 0;
  return ID[key] ?? 0;
}
export function maxStack(id: number): number { return itemDef(id)?.stack ?? 64; }

// ============================================================================ block survival data
/** Seconds to break with a bare hand. Infinity = cannot be broken. */
export const HARD = new Float32Array(COUNT);
/** Tool that speeds this block up: 0 none, 1 pick, 2 axe, 3 shovel. */
export const TOOL_FOR = new Uint8Array(COUNT);
/** Minimum pickaxe tier needed for the block to drop anything (0 = any, even a hand). */
export const NEED_TIER = new Uint8Array(COUNT);
const KIND_NUM: Record<ToolKind, number> = { pick: 1, axe: 2, shovel: 3, sword: 0 };

const ORE_TIER: Record<string, number> = { coal: 1, copper: 2, iron: 2, lapis: 3, gold: 3, redstone: 3, diamond: 4, emerald: 4 };
for (let i = 1; i < COUNT; i++) {
  const b = BLOCKS[i], n = b.name, snd = b.sound ?? 'stone';
  const shape = SHAPE[i];
  let h = 4, tool = 1, need = 1;
  if (FLUID[i]) { h = Infinity; tool = 0; need = 0; }
  else if (n === 'bedrock') { h = Infinity; }
  else if (shape === S.cross || shape === S.torch || shape === S.carpet || shape === S.layer || shape === S.lily) { h = 0.05; tool = 0; need = 0; }
  else if (LEAVES[i]) { h = 0.35; tool = 0; need = 0; }
  else if (snd === 'wood') { h = n.includes('log') || n.includes('_wood') ? 2.6 : 2.2; tool = 2; need = 0; }
  else if (snd === 'grass' || snd === 'gravel' || snd === 'sand' || snd === 'snow') { h = 0.8; tool = 3; need = 0; }
  else if (snd === 'wool' || snd === 'slime') { h = 1; tool = 0; need = 0; }
  else if (snd === 'glass') { h = 0.5; tool = 0; need = 0; }
  else if (snd === 'metal') { h = 8; need = 2; }
  else if (n.endsWith('_ore')) {
    const k = Object.keys(ORE_TIER).find((o) => n.includes(o));
    h = 6; need = k ? ORE_TIER[k] : 1;
  } else if (n === 'obsidian' || n === 'crying_obsidian') { h = 60; need = 5; }
  else if (n.includes('deepslate') || n.includes('blackstone') || n.includes('end_stone')) h = 5.5;
  if (b.cat === 'ores' && snd !== 'metal' && !n.endsWith('_ore')) { h = 8; need = 2; }
  HARD[i] = h; TOOL_FOR[i] = tool; NEED_TIER[i] = need;
}

/** How long (seconds) `held` takes to break block id, and whether it will drop. */
export function breakInfo(id: number, held: number): { time: number; drops: boolean } {
  const h = HARD[id];
  if (!(h < Infinity)) return { time: Infinity, drops: false };
  const t = itemDef(held)?.tool;
  const right = !!t && TOOL_FOR[id] !== 0 && KIND_NUM[t.kind] === TOOL_FOR[id];
  const tier = right ? t!.tier : 0;
  const need = NEED_TIER[id];
  if (need > 0 && tier < need) return { time: h * (tier > 0 ? 1.2 : 2), drops: false };
  return { time: right ? h / TIER_SPEED[tier] : h, drops: true };
}

/** Damage a swing with `held` does to a creature. */
export function attackDamage(held: number): number {
  const t = itemDef(held)?.tool;
  if (!t) return 1;
  return t.kind === 'sword' ? SWORD_DMG[t.tier] : t.kind === 'axe' ? AXE_DMG[t.tier] : 2;
}

const ORE_DROP: Record<string, [string, number, number]> = {
  coal: ['coal', 1, 1], iron: ['raw_iron', 1, 1], copper: ['raw_copper', 2, 4], gold: ['raw_gold', 1, 1],
  redstone: ['redstone_dust', 3, 5], lapis: ['lapis', 3, 6], diamond: ['diamond', 1, 1], emerald: ['emerald', 1, 1], quartz: ['quartz', 1, 2],
};
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/** What breaking packed block value `v` gives: a list of [id, count]. */
export function dropsFor(v: number): [number, number][] {
  const id = v & 0x3ff, meta = v >> 10;
  if (!id || id >= COUNT) return [];
  const b = BLOCKS[id], n = b.name, shape = SHAPE[id];
  if (FLUID[id]) return [];
  if (n.endsWith('_ore')) {
    const k = Object.keys(ORE_DROP).find((o) => n.includes(o));
    if (k) { const [it, a, z] = ORE_DROP[k]; return [[ITEM_ID[it], rnd(a, z)]]; }
  }
  if (LEAVES[id]) {
    const out: [number, number][] = [];
    const sap = ID[n.replace('_leaves', '_sapling')];
    if (sap && Math.random() < 0.07) out.push([sap, 1]);
    if (Math.random() < 0.06) out.push([ITEM_ID.apple, 1]);
    if (Math.random() < 0.04) out.push([ITEM_ID.stick, rnd(1, 2)]);
    return out;
  }
  if (shape === S.door && (meta & 8)) return [];           // the lower half carries the door
  if (shape === S.bed && (meta & 4)) return [];            // the foot half carries the bed
  if (shape === S.slab && (meta & 3) === 2) return [[id, 2]];
  switch (n) {
    case 'stone': return [[ID.cobblestone, 1]];
    case 'deepslate': return [[ID.cobbled_deepslate, 1]];
    case 'grass_block': case 'snowy_grass_block': case 'podzol': case 'mycelium': case 'dirt_path': return [[ID.dirt, 1]];
    case 'gravel': return Math.random() < 0.12 ? [[ITEM_ID.flint, 1]] : [[id, 1]];
    case 'glass': case 'glass_pane': case 'ice': case 'short_grass': case 'fern': case 'dead_bush': case 'seagrass': case 'snow': return [];
    case 'melon': return [[ITEM_ID.melon_slice, rnd(3, 6)]];
    case 'cobweb': return [[ITEM_ID.thread, 1]];
    case 'bookshelf': return [[ID.oak_planks, 4]];
    case 'glowstone': case 'sea_lantern': return [[id, 1]];
  }
  if (n.endsWith('stained_glass') || n.endsWith('stained_glass_pane') || n === 'tinted_glass') return [];
  return b.item === false ? [] : [[id, 1]];
}

// ============================================================================ item art
const SIZE = 16;
class Art {
  px = new Uint8ClampedArray(SIZE * SIZE * 4);
  set(x: number, y: number, c: RGB, k = 1) {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    const o = (y * SIZE + x) * 4;
    this.px[o] = c[0] * k; this.px[o + 1] = c[1] * k; this.px[o + 2] = c[2] * k; this.px[o + 3] = 255;
  }
  has(x: number, y: number) { return x >= 0 && y >= 0 && x < SIZE && y < SIZE && this.px[(y * SIZE + x) * 4 + 3] > 0; }
  rect(x0: number, y0: number, x1: number, y1: number, c: RGB, k = 1) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c, k); }
  clear(x0: number, y0: number, x1: number, y1: number) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.px[(y * SIZE + x) * 4 + 3] = 0; }
  /** Diagonal bar from bottom-left (x,y) going up-right for n steps. */
  diag(x: number, y: number, n: number, c: RGB, thick = true) {
    for (let i = 0; i < n; i++) { this.set(x + i, y - i, c); if (thick) this.set(x + i + 1, y - i, c, 0.72); }
  }
  disc(cx: number, cy: number, r: number, c: RGB) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r + 1) this.set(cx + x, cy + y, c, 1 - 0.28 * Math.max(0, (x + y) / (2 * r)) - (x + y > r ? 0.12 : 0));
    }
  }
  /** Dark rim around everything drawn so far (gives the sprites their inventory outline). */
  outline() {
    const add: number[] = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (this.has(x, y)) continue;
      if (this.has(x + 1, y) || this.has(x - 1, y) || this.has(x, y + 1) || this.has(x, y - 1)) add.push(x, y);
    }
    for (let i = 0; i < add.length; i += 2) this.set(add[i], add[i + 1], [24, 18, 14]);
  }
}

const HANDLE: RGB = [118, 82, 40];
function paint(a: Art, shape: string, c: RGB, c2?: RGB) {
  const lite: RGB = c.map((v) => Math.min(255, v * 1.18 + 14));
  const dark: RGB = c.map((v) => v * 0.68);
  switch (shape) {
    case 'stick': a.diag(3, 12, 10, c); break;
    case 'pick': {
      a.diag(2, 13, 9, HANDLE);
      const arc = [[4, 4], [5, 3], [6, 2], [7, 2], [8, 2], [9, 2], [10, 3], [11, 4], [12, 5], [13, 6], [13, 7], [13, 8], [13, 9], [12, 10], [11, 11]];
      for (const [x, y] of arc) { a.set(x, y, c); a.set(x, y + 1, dark); }
      for (const [x, y] of arc.slice(2, 12)) a.set(x, y, lite);
      break;
    }
    case 'axe':
      a.diag(2, 13, 10, HANDLE);
      a.rect(7, 2, 12, 7, c); a.rect(8, 1, 11, 1, lite); a.rect(12, 3, 13, 6, c); a.clear(7, 7, 8, 7); a.clear(7, 2, 7, 2);
      a.rect(8, 6, 12, 7, dark); a.rect(8, 2, 9, 3, lite);
      break;
    case 'shovel':
      a.diag(2, 13, 7, HANDLE);
      a.rect(9, 3, 12, 6, c); a.rect(10, 2, 13, 5, c); a.rect(10, 2, 11, 3, lite); a.rect(11, 6, 12, 6, dark); a.set(13, 5, dark);
      a.set(2, 14, HANDLE); a.set(1, 13, HANDLE);
      break;
    case 'sword':
      for (let i = 0; i < 8; i++) { a.set(6 + i, 9 - i, lite); a.set(7 + i, 9 - i, c); a.set(6 + i, 10 - i, dark); }
      a.set(14, 1, lite);
      a.rect(3, 9, 4, 10, dark); a.rect(5, 11, 6, 12, dark); a.set(4, 11, dark); a.set(5, 10, dark); a.set(4, 8, dark); a.set(7, 12, dark);
      a.set(3, 12, HANDLE); a.set(2, 13, HANDLE); a.set(1, 14, [60, 40, 20]);
      break;
    case 'ingot':
      for (let y = 0; y < 5; y++) for (let x = 0; x < 10; x++) a.set(3 + x + (y < 2 ? 1 : 0), 6 + y, y === 0 ? lite : y > 3 ? dark : c);
      a.rect(4, 6, 12, 6, lite); a.rect(3, 10, 12, 10, dark);
      break;
    case 'gem':
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
        if (Math.abs(x) + Math.abs(y) <= 5 && Math.abs(x) <= 4 && Math.abs(y) <= 4) a.set(8 + x, 8 + y, x + y < -2 ? lite : x + y > 3 ? dark : c);
      }
      a.set(6, 6, [255, 255, 255]); a.set(7, 5, [255, 255, 255]);
      break;
    case 'lump':
      a.disc(8, 8, 4, c); a.clear(4, 4, 5, 4); a.clear(11, 12, 12, 12); a.clear(12, 4, 12, 5);
      a.set(6, 6, lite); a.set(7, 6, lite); a.set(9, 9, dark); a.set(10, 7, lite); a.set(7, 10, dark);
      break;
    case 'dust':
      for (const [x, y] of [[5, 9], [6, 8], [7, 9], [8, 10], [9, 8], [10, 9], [7, 7], [8, 8], [6, 10], [9, 10], [10, 11], [5, 11], [8, 6], [11, 8], [7, 11], [8, 12]]) a.set(x, y, (x + y) & 1 ? c : dark);
      break;
    case 'flint':
      for (let y = 4; y <= 12; y++) for (let x = 5; x <= 11; x++) if (x - 5 <= (y - 3) && (11 - x) + (12 - y) >= 2) a.set(x, y, x + y < 14 ? lite : c);
      break;
    case 'hide':
      a.rect(4, 4, 11, 12, c); a.rect(3, 4, 3, 5, c); a.rect(12, 4, 12, 5, c); a.rect(3, 11, 3, 12, c); a.rect(12, 11, 12, 12, c);
      a.rect(6, 6, 7, 7, lite); a.rect(9, 9, 10, 10, lite); a.rect(4, 12, 11, 12, dark);
      break;
    case 'thread':
      for (const [x, y] of [[4, 5], [5, 4], [6, 4], [7, 5], [8, 6], [9, 7], [10, 7], [11, 6], [12, 5], [7, 6], [6, 7], [5, 8], [5, 9], [6, 10], [7, 11], [8, 11], [9, 10], [10, 9], [11, 10], [12, 11]]) a.set(x, y, (x & 1) ? c : dark);
      break;
    case 'bone':
      a.diag(4, 11, 8, c, false); a.diag(5, 11, 7, dark, false);
      a.rect(3, 11, 4, 12, c); a.rect(4, 12, 5, 13, c); a.rect(11, 3, 12, 4, c); a.rect(10, 2, 11, 3, c);
      break;
    case 'bowl': case 'stew':
      for (let y = 0; y < 5; y++) a.rect(3 + y, 8 + y, 12 - y, 8 + y, y === 0 ? lite : y > 2 ? dark : c);
      if (shape === 'stew' && c2) a.rect(4, 8, 11, 8, c2);
      if (shape === 'stew' && c2) { a.set(6, 8, [180, 60, 50]); a.set(9, 8, [150, 110, 80]); }
      break;
    case 'apple':
      a.disc(8, 9, 4, c); a.clear(8, 5, 8, 5); a.set(8, 4, HANDLE); a.set(8, 3, HANDLE); a.set(9, 3, [70, 160, 60]); a.set(10, 3, [70, 160, 60]); a.set(10, 4, [50, 130, 50]);
      a.set(6, 7, [255, 255, 255]);
      break;
    case 'meat':
      a.disc(9, 7, 4, c); a.rect(4, 10, 5, 11, [236, 232, 214]); a.rect(3, 11, 4, 12, [236, 232, 214]); a.set(6, 9, [236, 232, 214]); a.set(3, 13, [200, 196, 180]); a.set(2, 11, [236, 232, 214]);
      a.set(8, 5, lite); a.set(9, 5, lite);
      break;
    case 'slice':
      for (let y = 0; y < 7; y++) for (let x = 0; x <= 12 - y * 2; x++) a.set(2 + y + x, 5 + y, y === 0 ? (c2 ?? dark) : c);
      a.set(6, 7, [30, 20, 20]); a.set(9, 8, [30, 20, 20]); a.set(8, 6, [30, 20, 20]);
      break;
    case 'helmet':
      a.rect(4, 4, 11, 11, c); a.rect(5, 3, 10, 3, lite); a.rect(4, 4, 11, 5, lite); a.clear(6, 9, 9, 11); a.rect(4, 10, 5, 11, dark); a.rect(10, 10, 11, 11, dark);
      break;
    case 'chest':
      a.rect(4, 5, 11, 13, c); a.rect(2, 3, 5, 7, c); a.rect(10, 3, 13, 7, c); a.rect(6, 3, 9, 4, c); a.clear(7, 3, 8, 3);
      a.rect(2, 3, 5, 3, lite); a.rect(10, 3, 13, 3, lite); a.rect(4, 12, 11, 13, dark); a.rect(7, 6, 8, 10, lite);
      break;
    case 'legs':
      a.rect(4, 3, 11, 5, c); a.rect(4, 6, 6, 13, c); a.rect(9, 6, 11, 13, c); a.rect(4, 3, 11, 3, lite); a.rect(4, 12, 6, 13, dark); a.rect(9, 12, 11, 13, dark);
      break;
    case 'boots':
      a.rect(3, 5, 6, 12, c); a.rect(9, 5, 12, 12, c); a.rect(2, 10, 3, 12, c); a.rect(12, 10, 13, 12, c);
      a.rect(3, 5, 6, 5, lite); a.rect(9, 5, 12, 5, lite); a.rect(2, 12, 6, 12, dark); a.rect(9, 12, 13, 12, dark);
      break;
    default: a.rect(4, 4, 11, 11, c);
  }
  a.outline();
}

const artCache = new Map<number, Uint8ClampedArray>();
/** 16x16 RGBA pixels of an item's sprite. */
export function itemPixels(id: number): Uint8ClampedArray {
  let p = artCache.get(id);
  if (!p) {
    const d = itemDef(id), a = new Art();
    if (d) paint(a, d.art.shape, d.art.c, d.art.c2);
    p = a.px;
    artCache.set(id, p);
  }
  return p;
}

const ICON_COLS = 16;
let sheetURL = '';
/** One sprite sheet with every item, upscaled so CSS never blurs it. */
function itemSheet(): string {
  if (sheetURL || typeof document === 'undefined') return sheetURL;
  const rows = Math.ceil(ITEMS.length / ICON_COLS), K = 4;
  const c = document.createElement('canvas');
  c.width = ICON_COLS * SIZE * K; c.height = rows * SIZE * K;
  const g = c.getContext('2d')!;
  ITEMS.forEach((_, i) => {
    const p = itemPixels(ITEM_BASE + i);
    const ox = (i % ICON_COLS) * SIZE * K, oy = Math.floor(i / ICON_COLS) * SIZE * K;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const o = (y * SIZE + x) * 4;
      if (!p[o + 3]) continue;
      g.fillStyle = `rgb(${p[o]},${p[o + 1]},${p[o + 2]})`;
      g.fillRect(ox + x * K, oy + y * K, K, K);
    }
  });
  sheetURL = c.toDataURL();
  return sheetURL;
}

/** Point an icon element at an item sprite (inline styles override the block sheet). */
export function applyItemIcon(el: HTMLElement, id: number): void {
  const i = id - ITEM_BASE;
  const rows = Math.ceil(ITEMS.length / ICON_COLS);
  el.classList.add('bf-icon');
  el.style.backgroundImage = `url(${itemSheet()})`;
  el.style.backgroundSize = `${ICON_COLS * 100}% ${rows * 100}%`;
  el.style.backgroundPosition = `${((i % ICON_COLS) * 100) / (ICON_COLS - 1)}% ${rows > 1 ? (Math.floor(i / ICON_COLS) * 100) / (rows - 1) : 0}%`;
  el.setAttribute('data-icon', String(id));
}
/** Undo applyItemIcon before the element shows a block again. */
export function clearItemIcon(el: HTMLElement): void {
  if (!el.style.backgroundImage) return;
  el.style.backgroundImage = '';
  el.style.backgroundSize = '';
}
