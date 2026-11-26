// The survival inventory: 36 stacks (0..8 are the hotbar) plus four armour slots, and the
// crafting recipes. Crafting is a recipe book: a recipe lists what it needs, and making it
// takes those things out of the inventory. Some recipes need a crafting table or a furnace
// within reach.
import { BLOCKS, COUNT, ID } from '../blocks/registry';
import { WOODS } from '../blocks/registry';
import { ARMOR_PIECES, ARMOR_SETS, ITEM_ID, itemDef, maxStack, thingFromKey, thingKey } from './items';
import type { Hotbar } from './hotbar';

export interface Stack { id: number; n: number; d?: number }   // d = uses left on a tool
export interface SavedStack { k: string; n: number; d?: number }
export const INV_SIZE = 36;

export class Inventory {
  slots: (Stack | null)[] = new Array(INV_SIZE).fill(null);
  armor: (Stack | null)[] = [null, null, null, null];
  /** Smelts left from fuel that was already burnt. */
  fuel = 0;
  listeners: Array<() => void> = [];

  onChange(fn: () => void) { this.listeners.push(fn); }
  changed() { for (const f of this.listeners) f(); }

  clear() { this.slots.fill(null); this.armor = [null, null, null, null]; this.fuel = 0; this.changed(); }

  /** Add items, filling matching stacks first. Returns how many did not fit. */
  add(id: number, n: number, d?: number): number {
    if (!id || n <= 0) return 0;
    const max = maxStack(id);
    if (max > 1) {
      for (const s of this.slots) {
        if (n <= 0) break;
        if (s && s.id === id && s.n < max) { const k = Math.min(n, max - s.n); s.n += k; n -= k; }
      }
    }
    for (let i = 0; i < INV_SIZE && n > 0; i++) {
      if (this.slots[i]) continue;
      const k = Math.min(n, max);
      const st: Stack = { id, n: k };
      const dur = d ?? itemDef(id)?.dur;
      if (dur !== undefined) st.d = dur;
      this.slots[i] = st;
      n -= k;
    }
    this.changed();
    return n;
  }

  /** How many more of this thing would fit. */
  room(id: number): number {
    const max = maxStack(id);
    let r = 0;
    for (const s of this.slots) { if (!s) r += max; else if (s.id === id && max > 1) r += max - s.n; }
    return r;
  }

  count(ids: number | number[]): number {
    let c = 0;
    for (const s of this.slots) if (s && (typeof ids === 'number' ? s.id === ids : ids.includes(s.id))) c += s.n;
    return c;
  }

  /** Take n of the given thing (or of any id in the list). Returns false, taking nothing, when short. */
  take(ids: number | number[], n: number): boolean {
    if (this.count(ids) < n) return false;
    for (let i = INV_SIZE - 1; i >= 0 && n > 0; i--) {
      const s = this.slots[i];
      if (!s || !(typeof ids === 'number' ? s.id === ids : ids.includes(s.id))) continue;
      const k = Math.min(n, s.n);
      s.n -= k; n -= k;
      if (s.n <= 0) this.slots[i] = null;
    }
    this.changed();
    return true;
  }

  /** Use up one of the stack in a slot (placing a block, eating). */
  consume(slot: number) {
    const s = this.slots[slot];
    if (!s) return;
    if (--s.n <= 0) this.slots[slot] = null;
    this.changed();
  }

  /** Wear the tool in a slot by one use. Returns true when it broke. */
  wear(slot: number): boolean {
    const s = this.slots[slot];
    if (!s || s.d === undefined) return false;
    if (--s.d <= 0) { this.slots[slot] = null; this.changed(); return true; }
    this.changed();
    return false;
  }

  armorPoints(): number {
    let p = 0;
    for (const s of this.armor) if (s) p += itemDef(s.id)?.armor?.points ?? 0;
    return p;
  }

  /** Mirror the first nine stacks into the shared hotbar (HUD, held item). */
  syncHotbar(hotbar: Hotbar) {
    let same = true;
    for (let i = 0; i < 9; i++) { const id = this.slots[i]?.id ?? 0; if (hotbar.slots[i] !== id) { same = false; hotbar.slots[i] = id; } }
    if (!same) hotbar.load(hotbar.slots.slice(), hotbar.selected);
  }

  serialize(): { slots: (SavedStack | null)[]; armor: (SavedStack | null)[]; fuel: number } {
    const enc = (s: Stack | null): SavedStack | null => (s ? (s.d !== undefined ? { k: thingKey(s.id), n: s.n, d: s.d } : { k: thingKey(s.id), n: s.n }) : null);
    return { slots: this.slots.map(enc), armor: this.armor.map(enc), fuel: this.fuel };
  }

  restore(data: unknown) {
    const d = data as { slots?: (SavedStack | null)[]; armor?: (SavedStack | null)[]; fuel?: number } | null;
    const dec = (s: SavedStack | null | undefined): Stack | null => {
      if (!s || typeof s.k !== 'string') return null;
      const id = thingFromKey(s.k);
      const n = Math.max(1, Math.min(maxStack(id), Math.floor(Number(s.n) || 1)));
      if (!id) return null;
      return typeof s.d === 'number' ? { id, n, d: s.d } : { id, n };
    };
    this.slots = new Array(INV_SIZE).fill(null);
    this.armor = [null, null, null, null];
    if (d && Array.isArray(d.slots)) for (let i = 0; i < INV_SIZE; i++) this.slots[i] = dec(d.slots[i]);
    if (d && Array.isArray(d.armor)) for (let i = 0; i < 4; i++) this.armor[i] = dec(d.armor[i]);
    this.fuel = d && typeof d.fuel === 'number' && d.fuel > 0 ? d.fuel : 0;
    this.changed();
  }
}

/** A plain list of stacks (a chest) to and from its saved form. */
export function saveStacks(a: (Stack | null)[]): (SavedStack | null)[] {
  return a.map((s) => (s ? (s.d !== undefined ? { k: thingKey(s.id), n: s.n, d: s.d } : { k: thingKey(s.id), n: s.n }) : null));
}
export function loadStacks(data: unknown, size: number): (Stack | null)[] {
  const out: (Stack | null)[] = new Array(size).fill(null);
  if (!Array.isArray(data)) return out;
  for (let i = 0; i < size; i++) {
    const s = data[i] as SavedStack | null;
    if (!s || typeof s.k !== 'string') continue;
    const id = thingFromKey(s.k);
    if (!id) continue;
    const n = Math.max(1, Math.min(maxStack(id), Math.floor(Number(s.n) || 1)));
    out[i] = typeof s.d === 'number' ? { id, n, d: s.d } : { id, n };
  }
  return out;
}

// ============================================================================ recipes
export type Station = 0 | 1 | 2;   // 0 by hand, 1 crafting table, 2 furnace
export const STATION_NAMES = ['Crafting', 'Crafting Table', 'Furnace'];
/** An ingredient is one id or any of a list of ids, with a count. */
export interface Ingredient { ids: number[]; n: number; label: string }
export interface Recipe { out: number; n: number; needs: Ingredient[]; station: Station; group: string }

export const RECIPES: Recipe[] = [];
const ids = (names: string[]) => names.map((n) => ID[n] ?? ITEM_ID[n]).filter((v) => v !== undefined);
const TAGS: Record<string, { ids: number[]; label: string }> = {
  planks: { ids: ids(WOODS.map((w) => `${w}_planks`)), label: 'Any Planks' },
  logs: { ids: ids(WOODS.flatMap((w) => [`${w}_log`, `${w}_wood`, `stripped_${w}_log`])), label: 'Any Log' },
  cobble: { ids: ids(['cobblestone', 'cobbled_deepslate', 'blackstone', 'mossy_cobblestone']), label: 'Any Cobblestone' },
  coal: { ids: ids(['coal', 'charcoal']), label: 'Coal or Charcoal' },
  wool: { ids: ids(BLOCKS.filter((b) => b.name.endsWith('_wool')).map((b) => b.name)), label: 'Any Wool' },
  sand: { ids: ids(['sand', 'red_sand']), label: 'Any Sand' },
};
const thing = (name: string) => ID[name] ?? ITEM_ID[name] ?? 0;

function ing(spec: string, n: number): Ingredient | null {
  if (spec[0] === '#') { const t = TAGS[spec.slice(1)]; return t && t.ids.length ? { ids: t.ids, n, label: t.label } : null; }
  const id = thing(spec);
  if (!id) return null;
  return { ids: [id], n, label: itemDef(id)?.display ?? BLOCKS[id].display };
}
/** recipe('oak_planks', 4, 0, 'Wood', ['oak_log', 1]) : skipped when anything it names is missing. */
function recipe(out: string, n: number, station: Station, group: string, ...needs: [string, number][]) {
  const o = thing(out);
  const list = needs.map(([s, c]) => ing(s, c));
  if (!o || list.some((i) => !i)) return;
  RECIPES.push({ out: o, n, needs: list as Ingredient[], station, group });
}

// ---- by hand
for (const w of WOODS) {
  recipe(`${w}_planks`, 4, 0, 'Basics', [`${w}_log`, 1]);
  recipe(`${w}_planks`, 4, 0, 'Basics', [`${w}_wood`, 1]);
  recipe(`${w}_planks`, 4, 0, 'Basics', [`stripped_${w}_log`, 1]);
}
recipe('stick', 4, 0, 'Basics', ['#planks', 2]);
recipe('crafting_table', 1, 0, 'Basics', ['#planks', 4]);
recipe('torch', 4, 0, 'Basics', ['#coal', 1], ['stick', 1]);
// ---- crafting table: tools
const TOOL_MATS: [string, string][] = [['wooden', '#planks'], ['stone', '#cobble'], ['copper', 'copper_ingot'], ['iron', 'iron_ingot'], ['diamond', 'diamond']];
for (const [k, m] of TOOL_MATS) {
  recipe(`${k}_pickaxe`, 1, 1, 'Tools', [m, 3], ['stick', 2]);
  recipe(`${k}_axe`, 1, 1, 'Tools', [m, 3], ['stick', 2]);
  recipe(`${k}_shovel`, 1, 1, 'Tools', [m, 1], ['stick', 2]);
  recipe(`${k}_sword`, 1, 1, 'Tools', [m, 2], ['stick', 1]);
}
// ---- armour
const ARMOR_COST = [5, 8, 7, 4];
for (const [k] of ARMOR_SETS) {
  const mat = k === 'hide' ? 'hide' : k === 'diamond' ? 'diamond' : `${k}_ingot`;
  ARMOR_PIECES.forEach(([pk], slot) => recipe(`${k}_${pk}`, 1, 1, 'Armour', [mat, ARMOR_COST[slot]]));
}
// ---- useful blocks
recipe('furnace', 1, 1, 'Blocks', ['#cobble', 8]);
recipe('chest', 1, 1, 'Blocks', ['#planks', 8]);
recipe('barrel', 1, 1, 'Blocks', ['#planks', 6]);
recipe('bookshelf', 1, 1, 'Blocks', ['#planks', 6], ['hide', 1]);
recipe('lantern', 1, 1, 'Blocks', ['torch', 1], ['iron_ingot', 1]);
recipe('jack_o_lantern', 1, 1, 'Blocks', ['pumpkin', 1], ['torch', 1]);
recipe('white_wool', 1, 1, 'Blocks', ['thread', 4]);
recipe('white_carpet', 3, 1, 'Blocks', ['white_wool', 2]);
recipe('bone_block', 1, 1, 'Blocks', ['bone', 9]);
recipe('glass_pane', 16, 1, 'Blocks', ['glass', 6]);
recipe('iron_bars', 16, 1, 'Blocks', ['iron_ingot', 6]);
recipe('stone_bricks', 4, 1, 'Blocks', ['stone', 4]);
recipe('bricks', 2, 1, 'Blocks', ['terracotta', 2]);
recipe('sandstone', 1, 1, 'Blocks', ['sand', 4]);
recipe('red_sandstone', 1, 1, 'Blocks', ['red_sand', 4]);
recipe('polished_andesite', 4, 1, 'Blocks', ['andesite', 4]);
recipe('polished_granite', 4, 1, 'Blocks', ['granite', 4]);
recipe('polished_diorite', 4, 1, 'Blocks', ['diorite', 4]);
recipe('mossy_cobblestone', 1, 1, 'Blocks', ['cobblestone', 1], ['moss_block', 1]);
recipe('snow_block', 1, 1, 'Blocks', ['snow', 4]);
for (const [base, block] of [['cobblestone', 'cobblestone'], ['stone', 'stone'], ['stone_brick', 'stone_bricks'], ['brick', 'bricks'], ['sandstone', 'sandstone'], ['cobbled_deepslate', 'cobbled_deepslate']]) {
  recipe(`${base}_slab`, 6, 1, 'Blocks', [block, 3]);
  recipe(`${base}_stairs`, 4, 1, 'Blocks', [block, 6]);
  recipe(`${base}_wall`, 6, 1, 'Blocks', [block, 6]);
}
for (const w of WOODS) {
  recipe(`${w}_slab`, 6, 1, 'Wood', [`${w}_planks`, 3]);
  recipe(`${w}_stairs`, 4, 1, 'Wood', [`${w}_planks`, 6]);
  recipe(`${w}_fence`, 3, 1, 'Wood', [`${w}_planks`, 4], ['stick', 2]);
  recipe(`${w}_door`, 3, 1, 'Wood', [`${w}_planks`, 6]);
  recipe(`${w}_trapdoor`, 2, 1, 'Wood', [`${w}_planks`, 6]);
}
for (const [k, it] of [['iron', 'iron_ingot'], ['copper', 'copper_ingot'], ['gold', 'gold_ingot'], ['diamond', 'diamond'], ['coal', 'coal']]) {
  recipe(`${k}_block`, 1, 1, 'Minerals', [it, 9]);
  recipe(it, 9, 1, 'Minerals', [`${k}_block`, 1]);
}
// ---- colours: flowers and minerals dye white wool, wool and planks make a bed
const DYE_FROM: Record<string, [string, number][][]> = {
  red: [[['poppy', 1]], [['red_tulip', 1]], [['redstone_dust', 1]]],
  yellow: [[['dandelion', 1]]], orange: [[['orange_tulip', 1]]], pink: [[['pink_tulip', 1]]],
  light_blue: [[['blue_orchid', 1]]], blue: [[['cornflower', 1]], [['lapis', 1]]], magenta: [[['allium', 1]]],
  light_gray: [[['azure_bluet', 1]], [['oxeye_daisy', 1]]], green: [[['cactus', 1]]], black: [[['#coal', 1]]],
  brown: [[['brown_mushroom', 1]]], gray: [[['#coal', 1], ['bone', 1]]], lime: [[['cactus', 1], ['dandelion', 1]]],
  cyan: [[['cactus', 1], ['lapis', 1]]], purple: [[['lapis', 1], ['poppy', 1]]],
};
for (const [c, ways] of Object.entries(DYE_FROM)) for (const w of ways) recipe(`${c}_wool`, 1, 1, 'Colours', ['white_wool', 1], ...w);
for (const b of BLOCKS) {
  if (!b.name.endsWith('_bed')) continue;
  recipe(b.name, 1, 1, 'Colours', [b.name.replace(/_bed$/, '_wool'), 3], ['#planks', 3]);
}
// ---- food
recipe('bowl', 4, 1, 'Food', ['#planks', 3]);
recipe('mushroom_stew', 1, 0, 'Food', ['bowl', 1], ['red_mushroom', 1], ['brown_mushroom', 1]);
recipe('golden_apple', 1, 1, 'Food', ['apple', 1], ['gold_ingot', 4]);
// ---- furnace
recipe('iron_ingot', 1, 2, 'Smelting', ['raw_iron', 1]);
recipe('copper_ingot', 1, 2, 'Smelting', ['raw_copper', 1]);
recipe('gold_ingot', 1, 2, 'Smelting', ['raw_gold', 1]);
recipe('cooked_meat', 1, 2, 'Smelting', ['raw_meat', 1]);
recipe('charcoal', 1, 2, 'Smelting', ['#logs', 1]);
recipe('glass', 1, 2, 'Smelting', ['#sand', 1]);
recipe('stone', 1, 2, 'Smelting', ['cobblestone', 1]);
recipe('smooth_stone', 1, 2, 'Smelting', ['stone', 1]);
recipe('deepslate', 1, 2, 'Smelting', ['cobbled_deepslate', 1]);
recipe('terracotta', 1, 2, 'Smelting', ['clay', 1]);

/** Smelts one item of fuel gives when burnt (0 = not a fuel). */
export function fuelValue(id: number): number {
  const d = itemDef(id);
  if (d) return d.fuel ?? 0;
  if (id > 0 && id < COUNT) {
    if (TAGS.logs.ids.includes(id)) return 1.5;
    if (TAGS.planks.ids.includes(id)) return 1.5;
    if (BLOCKS[id].name === 'coal_block') return 72;
  }
  return 0;
}

/** Fuel the inventory could still burn (banked smelts plus what the fuel items are worth). */
export function fuelAvailable(inv: Inventory): number {
  let f = inv.fuel;
  for (const s of inv.slots) if (s) f += fuelValue(s.id) * s.n;
  return f;
}

/** How many times the recipe can be made right now. */
export function craftable(inv: Inventory, r: Recipe): number {
  let times = Infinity;
  for (const g of r.needs) times = Math.min(times, Math.floor(inv.count(g.ids) / g.n));
  if (r.station === 2) {
    // A smelt never burns the thing it is about to smelt.
    let f = inv.fuel;
    for (const s of inv.slots) if (s && !r.needs.some((g) => g.ids.includes(s.id))) f += fuelValue(s.id) * s.n;
    times = Math.min(times, Math.floor(f + 1e-6));
  }
  return times === Infinity ? 0 : times;
}

/** Make the recipe once. Returns false (changing nothing) when something is missing or there is no room. */
export function craft(inv: Inventory, r: Recipe): boolean {
  if (craftable(inv, r) < 1) return false;
  // Room for the result (an ingredient stack that gets used up frees a slot too, but keep it simple).
  if (inv.room(r.out) < r.n) return false;
  if (r.station === 2) {
    while (inv.fuel < 1 - 1e-6) {
      // burn the cheapest fuel that is not an ingredient
      let best = -1, bestV = Infinity;
      for (let i = 0; i < INV_SIZE; i++) {
        const s = inv.slots[i];
        if (!s || r.needs.some((g) => g.ids.includes(s.id))) continue;
        const v = fuelValue(s.id);
        if (v > 0 && v < bestV) { best = i; bestV = v; }
      }
      if (best < 0) return false;
      inv.fuel += bestV;
      inv.consume(best);
    }
    inv.fuel -= 1;
  }
  for (const g of r.needs) inv.take(g.ids, g.n);
  inv.add(r.out, r.n);
  return true;
}
