// Data-driven block registry. Every block in BlockForge is one entry in DEFS below.
// To add a block: push a def with a name, display name, category and textures.
// Texture names refer to generators in textures.ts (parametric names like
// "wool_red" are understood there too).

export type Category =
  | 'building' | 'colored' | 'natural' | 'ores' | 'wood' | 'light' | 'decor' | 'fluids';

export type ShapeName =
  | 'cube' | 'slab' | 'stairs' | 'fence' | 'wall' | 'cross' | 'torch' | 'door' | 'trapdoor'
  | 'pane' | 'fluid' | 'layer' | 'carpet' | 'cactus' | 'lantern' | 'chest' | 'rod' | 'lily';

export type LayerName = 'opaque' | 'cutout' | 'translucent' | 'water' | 'lava';
export type TintName = 'none' | 'grass' | 'foliage' | 'water';
export type SoundName = 'stone' | 'wood' | 'grass' | 'gravel' | 'sand' | 'glass' | 'wool' | 'metal' | 'snow' | 'slime' | 'liquid';

export interface TexSpec {
  all?: string; top?: string; bottom?: string; side?: string; end?: string; front?: string;
  north?: string; south?: string; east?: string; west?: string;
}

export interface BlockDef {
  name: string;
  display: string;
  cat: Category;
  tex: string | TexSpec;
  shape?: ShapeName;
  layer?: LayerName;
  light?: number;          // light emission 0..15
  solid?: boolean;         // has collision
  fluid?: boolean;
  transparent?: boolean;   // does not hide neighbour faces (derived when omitted)
  opacity?: number;        // how much light it eats (derived when omitted)
  tint?: TintName;
  tintMask?: boolean;      // texture alpha marks the tinted pixels (grass block)
  orient?: 'axis' | 'horizontal';
  replaceable?: boolean;
  item?: boolean;          // shows in the creative inventory
  sound?: SoundName;
  cullSelf?: boolean;      // hide faces between two of the same block (glass, water)
  support?: 'soil' | 'sand' | 'solid' | 'water' | 'cactus' | 'cane';
  wave?: 'plant' | 'leaves';
  family?: string;         // fences, panes and walls connect within a family
}

// ---------------------------------------------------------------------------
// Shared palettes for the parametric families
export const DYES = [
  'white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray',
  'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black',
] as const;
export type Dye = typeof DYES[number];

export const WOODS = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry'] as const;
export type Wood = typeof WOODS[number];

const title = (s: string) => s.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const DEFS: BlockDef[] = [];
const add = (d: BlockDef) => { DEFS.push(d); return d; };

// 0 is always air
add({ name: 'air', display: 'Air', cat: 'natural', tex: 'missing', solid: false, transparent: true, opacity: 0, replaceable: true, item: false, layer: 'cutout', shape: 'cross' });

// ---------------------------------------------------------------- natural
add({ name: 'grass_block', display: 'Grass Block', cat: 'natural', tex: { top: 'grass_top', bottom: 'dirt', side: 'grass_side' }, tint: 'grass', tintMask: true, sound: 'grass' });
add({ name: 'snowy_grass_block', display: 'Snowy Grass Block', cat: 'natural', tex: { top: 'snow', bottom: 'dirt', side: 'grass_side_snowy' }, sound: 'snow' });
add({ name: 'dirt', display: 'Dirt', cat: 'natural', tex: 'dirt', sound: 'gravel' });
add({ name: 'coarse_dirt', display: 'Coarse Dirt', cat: 'natural', tex: 'coarse_dirt', sound: 'gravel' });
add({ name: 'podzol', display: 'Podzol', cat: 'natural', tex: { top: 'podzol_top', bottom: 'dirt', side: 'podzol_side' }, sound: 'gravel' });
add({ name: 'rooted_dirt', display: 'Rooted Dirt', cat: 'natural', tex: 'rooted_dirt', sound: 'gravel' });
add({ name: 'mycelium', display: 'Mycelium', cat: 'natural', tex: { top: 'mycelium_top', bottom: 'dirt', side: 'mycelium_side' }, sound: 'grass' });
add({ name: 'dirt_path', display: 'Dirt Path', cat: 'natural', tex: { top: 'path_top', bottom: 'dirt', side: 'path_side' }, sound: 'grass' });
add({ name: 'mud', display: 'Mud', cat: 'natural', tex: 'mud', sound: 'gravel' });
add({ name: 'clay', display: 'Clay', cat: 'natural', tex: 'clay', sound: 'gravel' });
add({ name: 'moss_block', display: 'Moss Block', cat: 'natural', tex: 'moss', sound: 'grass' });
add({ name: 'sand', display: 'Sand', cat: 'natural', tex: 'sand', sound: 'sand' });
add({ name: 'red_sand', display: 'Red Sand', cat: 'natural', tex: 'red_sand', sound: 'sand' });
add({ name: 'gravel', display: 'Gravel', cat: 'natural', tex: 'gravel', sound: 'gravel' });
add({ name: 'stone', display: 'Stone', cat: 'natural', tex: 'stone' });
add({ name: 'granite', display: 'Granite', cat: 'natural', tex: 'granite' });
add({ name: 'diorite', display: 'Diorite', cat: 'natural', tex: 'diorite' });
add({ name: 'andesite', display: 'Andesite', cat: 'natural', tex: 'andesite' });
add({ name: 'deepslate', display: 'Deepslate', cat: 'natural', tex: { top: 'deepslate_top', bottom: 'deepslate_top', side: 'deepslate' }, orient: 'axis' });
add({ name: 'tuff', display: 'Tuff', cat: 'natural', tex: 'tuff' });
add({ name: 'calcite', display: 'Calcite', cat: 'natural', tex: 'calcite' });
add({ name: 'dripstone_block', display: 'Dripstone Block', cat: 'natural', tex: 'dripstone' });
add({ name: 'bedrock', display: 'Bedrock', cat: 'natural', tex: 'bedrock' });
add({ name: 'snow_block', display: 'Snow Block', cat: 'natural', tex: 'snow', sound: 'snow' });
add({ name: 'snow', display: 'Snow', cat: 'natural', tex: 'snow', shape: 'layer', sound: 'snow', replaceable: true, support: 'solid' });
add({ name: 'ice', display: 'Ice', cat: 'natural', tex: 'ice', layer: 'translucent', cullSelf: true, opacity: 1, sound: 'glass' });
add({ name: 'packed_ice', display: 'Packed Ice', cat: 'natural', tex: 'packed_ice', sound: 'glass' });
add({ name: 'blue_ice', display: 'Blue Ice', cat: 'natural', tex: 'blue_ice', sound: 'glass' });
add({ name: 'obsidian', display: 'Obsidian', cat: 'natural', tex: 'obsidian' });
add({ name: 'crying_obsidian', display: 'Crying Obsidian', cat: 'natural', tex: 'crying_obsidian', light: 10 });
add({ name: 'netherrack', display: 'Netherrack', cat: 'natural', tex: 'netherrack' });
add({ name: 'soul_sand', display: 'Soul Sand', cat: 'natural', tex: 'soul_sand', sound: 'sand' });
add({ name: 'soul_soil', display: 'Soul Soil', cat: 'natural', tex: 'soul_soil', sound: 'sand' });
add({ name: 'magma_block', display: 'Magma Block', cat: 'natural', tex: 'magma', light: 3 });
add({ name: 'basalt', display: 'Basalt', cat: 'natural', tex: { end: 'basalt_top', side: 'basalt_side' }, orient: 'axis' });
add({ name: 'blackstone', display: 'Blackstone', cat: 'natural', tex: { top: 'blackstone_top', bottom: 'blackstone_top', side: 'blackstone' } });
add({ name: 'end_stone', display: 'End Stone', cat: 'natural', tex: 'end_stone' });
add({ name: 'amethyst_block', display: 'Block of Amethyst', cat: 'natural', tex: 'amethyst', sound: 'glass' });
add({ name: 'bone_block', display: 'Bone Block', cat: 'natural', tex: { end: 'bone_top', side: 'bone_side' }, orient: 'axis' });

// ---------------------------------------------------------------- ores
const ORES: [string, string][] = [
  ['coal', 'Coal'], ['iron', 'Iron'], ['copper', 'Copper'], ['gold', 'Gold'],
  ['redstone', 'Redstone'], ['lapis', 'Lapis Lazuli'], ['diamond', 'Diamond'], ['emerald', 'Emerald'],
];
for (const [k, n] of ORES) add({ name: `${k}_ore`, display: `${n} Ore`, cat: 'ores', tex: `ore_stone_${k}`, light: k === 'redstone' ? 0 : 0 });
for (const [k, n] of ORES) add({ name: `deepslate_${k}_ore`, display: `Deepslate ${n} Ore`, cat: 'ores', tex: `ore_deepslate_${k}` });
add({ name: 'nether_gold_ore', display: 'Nether Gold Ore', cat: 'ores', tex: 'ore_nether_gold' });
add({ name: 'nether_quartz_ore', display: 'Nether Quartz Ore', cat: 'ores', tex: 'ore_nether_quartz' });
const MINERALS: [string, string][] = [
  ['coal_block', 'Block of Coal'], ['iron_block', 'Block of Iron'], ['copper_block', 'Block of Copper'],
  ['gold_block', 'Block of Gold'], ['redstone_block', 'Block of Redstone'], ['lapis_block', 'Block of Lapis Lazuli'],
  ['diamond_block', 'Block of Diamond'], ['emerald_block', 'Block of Emerald'], ['netherite_block', 'Block of Netherite'],
  ['raw_iron_block', 'Block of Raw Iron'], ['raw_copper_block', 'Block of Raw Copper'], ['raw_gold_block', 'Block of Raw Gold'],
  ['exposed_copper', 'Exposed Copper'], ['weathered_copper', 'Weathered Copper'], ['oxidized_copper', 'Oxidized Copper'],
];
for (const [k, n] of MINERALS) add({ name: k, display: n, cat: 'ores', tex: k, sound: 'metal' });

// ---------------------------------------------------------------- wood
for (const w of WOODS) {
  const n = title(w);
  const stem = w === 'mangrove' || w === 'cherry' ? w : w;
  add({ name: `${w}_log`, display: `${n} Log`, cat: 'wood', tex: { end: `${stem}_log_top`, side: `${stem}_log` }, orient: 'axis', sound: 'wood' });
  add({ name: `${w}_wood`, display: `${n} Wood`, cat: 'wood', tex: `${stem}_log`, orient: 'axis', sound: 'wood' });
  add({ name: `stripped_${w}_log`, display: `Stripped ${n} Log`, cat: 'wood', tex: { end: `stripped_${w}_log_top`, side: `stripped_${w}_log` }, orient: 'axis', sound: 'wood' });
  add({ name: `${w}_planks`, display: `${n} Planks`, cat: 'wood', tex: `${w}_planks`, sound: 'wood' });
  const tinted = w !== 'spruce' && w !== 'birch' && w !== 'cherry';
  add({ name: `${w}_leaves`, display: `${n} Leaves`, cat: 'wood', tex: `${w}_leaves`, layer: 'cutout', opacity: 1, tint: tinted ? 'foliage' : 'none', sound: 'grass', wave: 'leaves' });
  add({ name: `${w}_slab`, display: `${n} Slab`, cat: 'wood', tex: `${w}_planks`, shape: 'slab', sound: 'wood' });
  add({ name: `${w}_stairs`, display: `${n} Stairs`, cat: 'wood', tex: `${w}_planks`, shape: 'stairs', sound: 'wood' });
  add({ name: `${w}_fence`, display: `${n} Fence`, cat: 'wood', tex: `${w}_planks`, shape: 'fence', family: 'wood_fence', sound: 'wood' });
  add({ name: `${w}_door`, display: `${n} Door`, cat: 'wood', tex: { top: `${w}_door_top`, bottom: `${w}_door_bottom`, side: `${w}_door_bottom` }, shape: 'door', layer: 'cutout', sound: 'wood' });
  add({ name: `${w}_trapdoor`, display: `${n} Trapdoor`, cat: 'wood', tex: `${w}_trapdoor`, shape: 'trapdoor', layer: 'cutout', sound: 'wood' });
  add({ name: `${w}_sapling`, display: `${n} Sapling`, cat: 'wood', tex: `${w}_sapling`, shape: 'cross', layer: 'cutout', solid: false, support: 'soil', sound: 'grass', wave: 'plant' });
}

// ---------------------------------------------------------------- building
const STONEISH: [string, string, string][] = [
  // name, display, texture
  ['cobblestone', 'Cobblestone', 'cobblestone'],
  ['mossy_cobblestone', 'Mossy Cobblestone', 'mossy_cobblestone'],
  ['smooth_stone', 'Smooth Stone', 'smooth_stone'],
  ['stone_bricks', 'Stone Bricks', 'stone_bricks'],
  ['mossy_stone_bricks', 'Mossy Stone Bricks', 'mossy_stone_bricks'],
  ['cracked_stone_bricks', 'Cracked Stone Bricks', 'cracked_stone_bricks'],
  ['chiseled_stone_bricks', 'Chiseled Stone Bricks', 'chiseled_stone_bricks'],
  ['bricks', 'Bricks', 'bricks'],
  ['polished_granite', 'Polished Granite', 'polished_granite'],
  ['polished_diorite', 'Polished Diorite', 'polished_diorite'],
  ['polished_andesite', 'Polished Andesite', 'polished_andesite'],
  ['cobbled_deepslate', 'Cobbled Deepslate', 'cobbled_deepslate'],
  ['polished_deepslate', 'Polished Deepslate', 'polished_deepslate'],
  ['deepslate_bricks', 'Deepslate Bricks', 'deepslate_bricks'],
  ['deepslate_tiles', 'Deepslate Tiles', 'deepslate_tiles'],
  ['polished_tuff', 'Polished Tuff', 'polished_tuff'],
  ['mud_bricks', 'Mud Bricks', 'mud_bricks'],
  ['packed_mud', 'Packed Mud', 'packed_mud'],
  ['prismarine', 'Prismarine', 'prismarine'],
  ['prismarine_bricks', 'Prismarine Bricks', 'prismarine_bricks'],
  ['dark_prismarine', 'Dark Prismarine', 'dark_prismarine'],
  ['nether_bricks', 'Nether Bricks', 'nether_bricks'],
  ['red_nether_bricks', 'Red Nether Bricks', 'red_nether_bricks'],
  ['cracked_nether_bricks', 'Cracked Nether Bricks', 'cracked_nether_bricks'],
  ['chiseled_nether_bricks', 'Chiseled Nether Bricks', 'chiseled_nether_bricks'],
  ['polished_blackstone', 'Polished Blackstone', 'polished_blackstone'],
  ['polished_blackstone_bricks', 'Polished Blackstone Bricks', 'polished_blackstone_bricks'],
  ['end_stone_bricks', 'End Stone Bricks', 'end_stone_bricks'],
  ['purpur_block', 'Purpur Block', 'purpur'],
  ['terracotta', 'Terracotta', 'terracotta'],
];
for (const [k, n, t] of STONEISH) add({ name: k, display: n, cat: 'building', tex: t });
add({ name: 'sandstone', display: 'Sandstone', cat: 'building', tex: { top: 'sandstone_top', bottom: 'sandstone_bottom', side: 'sandstone' } });
add({ name: 'chiseled_sandstone', display: 'Chiseled Sandstone', cat: 'building', tex: { top: 'sandstone_top', bottom: 'sandstone_top', side: 'chiseled_sandstone' } });
add({ name: 'cut_sandstone', display: 'Cut Sandstone', cat: 'building', tex: { top: 'sandstone_top', bottom: 'sandstone_top', side: 'cut_sandstone' } });
add({ name: 'smooth_sandstone', display: 'Smooth Sandstone', cat: 'building', tex: 'sandstone_top' });
add({ name: 'red_sandstone', display: 'Red Sandstone', cat: 'building', tex: { top: 'red_sandstone_top', bottom: 'red_sandstone_bottom', side: 'red_sandstone' } });
add({ name: 'chiseled_red_sandstone', display: 'Chiseled Red Sandstone', cat: 'building', tex: { top: 'red_sandstone_top', bottom: 'red_sandstone_top', side: 'chiseled_red_sandstone' } });
add({ name: 'cut_red_sandstone', display: 'Cut Red Sandstone', cat: 'building', tex: { top: 'red_sandstone_top', bottom: 'red_sandstone_top', side: 'cut_red_sandstone' } });
add({ name: 'smooth_red_sandstone', display: 'Smooth Red Sandstone', cat: 'building', tex: 'red_sandstone_top' });
add({ name: 'quartz_block', display: 'Block of Quartz', cat: 'building', tex: { top: 'quartz_top', bottom: 'quartz_top', side: 'quartz_side' } });
add({ name: 'chiseled_quartz_block', display: 'Chiseled Quartz Block', cat: 'building', tex: { end: 'chiseled_quartz_top', side: 'chiseled_quartz' }, orient: 'axis' });
add({ name: 'quartz_pillar', display: 'Quartz Pillar', cat: 'building', tex: { end: 'quartz_pillar_top', side: 'quartz_pillar' }, orient: 'axis' });
add({ name: 'quartz_bricks', display: 'Quartz Bricks', cat: 'building', tex: 'quartz_bricks' });
add({ name: 'smooth_quartz', display: 'Smooth Quartz Block', cat: 'building', tex: 'quartz_top' });
add({ name: 'purpur_pillar', display: 'Purpur Pillar', cat: 'building', tex: { end: 'purpur_pillar_top', side: 'purpur_pillar' }, orient: 'axis' });
add({ name: 'glass', display: 'Glass', cat: 'building', tex: 'glass', layer: 'cutout', cullSelf: true, sound: 'glass' });
add({ name: 'tinted_glass', display: 'Tinted Glass', cat: 'building', tex: 'tinted_glass', layer: 'translucent', cullSelf: true, opacity: 15, sound: 'glass' });
add({ name: 'glass_pane', display: 'Glass Pane', cat: 'building', tex: 'glass', shape: 'pane', layer: 'cutout', family: 'pane', sound: 'glass' });
add({ name: 'iron_bars', display: 'Iron Bars', cat: 'building', tex: 'iron_bars', shape: 'pane', layer: 'cutout', family: 'pane', sound: 'metal' });
// hand-drawn by the owner (src/blocks/handmade.ts)
add({ name: 'weathered_copper_bars', display: 'Weathered Copper Bars', cat: 'building', tex: 'weathered_copper_bars', shape: 'pane', layer: 'cutout', family: 'pane', sound: 'metal' });

// slabs, stairs and walls for the common stones
const SHAPED: [string, string, string, boolean][] = [
  // base, display, texture, has wall
  ['stone', 'Stone', 'stone', false],
  ['cobblestone', 'Cobblestone', 'cobblestone', true],
  ['mossy_cobblestone', 'Mossy Cobblestone', 'mossy_cobblestone', true],
  ['smooth_stone', 'Smooth Stone', 'smooth_stone_slab_side', false],
  ['stone_brick', 'Stone Brick', 'stone_bricks', true],
  ['brick', 'Brick', 'bricks', true],
  ['sandstone', 'Sandstone', 'sandstone_top', true],
  ['red_sandstone', 'Red Sandstone', 'red_sandstone_top', true],
  ['quartz', 'Quartz', 'quartz_top', false],
  ['granite', 'Granite', 'granite', true],
  ['diorite', 'Diorite', 'diorite', true],
  ['andesite', 'Andesite', 'andesite', true],
  ['polished_andesite', 'Polished Andesite', 'polished_andesite', false],
  ['cobbled_deepslate', 'Cobbled Deepslate', 'cobbled_deepslate', true],
  ['deepslate_brick', 'Deepslate Brick', 'deepslate_bricks', true],
  ['prismarine', 'Prismarine', 'prismarine', true],
  ['nether_brick', 'Nether Brick', 'nether_bricks', true],
  ['blackstone', 'Blackstone', 'blackstone', true],
  ['end_stone_brick', 'End Stone Brick', 'end_stone_bricks', true],
  ['purpur', 'Purpur', 'purpur', false],
  ['mud_brick', 'Mud Brick', 'mud_bricks', true],
];
for (const [k, n, t, wall] of SHAPED) {
  const tex = k === 'smooth_stone' ? { top: 'smooth_stone', bottom: 'smooth_stone', side: t } : t;
  add({ name: `${k}_slab`, display: `${n} Slab`, cat: 'building', tex, shape: 'slab' });
  if (k !== 'smooth_stone') add({ name: `${k}_stairs`, display: `${n} Stairs`, cat: 'building', tex: t, shape: 'stairs' });
  if (wall) add({ name: `${k}_wall`, display: `${n} Wall`, cat: 'building', tex: t, shape: 'wall', family: 'wall' });
}

// ---------------------------------------------------------------- coloured
for (const c of DYES) add({ name: `${c}_wool`, display: `${title(c)} Wool`, cat: 'colored', tex: `wool_${c}`, sound: 'wool' });
for (const c of DYES) add({ name: `${c}_carpet`, display: `${title(c)} Carpet`, cat: 'colored', tex: `wool_${c}`, shape: 'carpet', sound: 'wool', support: 'solid' });
for (const c of DYES) add({ name: `${c}_concrete`, display: `${title(c)} Concrete`, cat: 'colored', tex: `concrete_${c}` });
for (const c of DYES) add({ name: `${c}_concrete_powder`, display: `${title(c)} Concrete Powder`, cat: 'colored', tex: `powder_${c}`, sound: 'sand' });
for (const c of DYES) add({ name: `${c}_terracotta`, display: `${title(c)} Terracotta`, cat: 'colored', tex: `terracotta_${c}` });
for (const c of DYES) add({ name: `${c}_glazed_terracotta`, display: `${title(c)} Glazed Terracotta`, cat: 'colored', tex: `glazed_${c}`, orient: 'horizontal' });
for (const c of DYES) add({ name: `${c}_stained_glass`, display: `${title(c)} Stained Glass`, cat: 'colored', tex: `stained_glass_${c}`, layer: 'translucent', cullSelf: true, sound: 'glass' });
for (const c of DYES) add({ name: `${c}_stained_glass_pane`, display: `${title(c)} Stained Glass Pane`, cat: 'colored', tex: `stained_glass_${c}`, shape: 'pane', layer: 'translucent', family: 'pane', sound: 'glass' });

// ---------------------------------------------------------------- light sources
add({ name: 'glowstone', display: 'Glowstone', cat: 'light', tex: 'glowstone', light: 15, sound: 'glass' });
add({ name: 'sea_lantern', display: 'Sea Lantern', cat: 'light', tex: 'sea_lantern', light: 15, sound: 'glass' });
add({ name: 'torch', display: 'Torch', cat: 'light', tex: 'torch', shape: 'torch', layer: 'cutout', light: 14, solid: false, sound: 'wood' });
add({ name: 'soul_torch', display: 'Soul Torch', cat: 'light', tex: 'soul_torch', shape: 'torch', layer: 'cutout', light: 10, solid: false, sound: 'wood' });
add({ name: 'lantern', display: 'Lantern', cat: 'light', tex: 'lantern', shape: 'lantern', layer: 'cutout', light: 15, sound: 'metal' });
add({ name: 'soul_lantern', display: 'Soul Lantern', cat: 'light', tex: 'soul_lantern', shape: 'lantern', layer: 'cutout', light: 10, sound: 'metal' });
add({ name: 'shroomlight', display: 'Shroomlight', cat: 'light', tex: 'shroomlight', light: 15, sound: 'wool' });
add({ name: 'jack_o_lantern', display: "Jack o'Lantern", cat: 'light', tex: { top: 'pumpkin_top', bottom: 'pumpkin_top', side: 'pumpkin_side', front: 'jack_o_lantern' }, orient: 'horizontal', light: 15, sound: 'wood' });
add({ name: 'redstone_lamp', display: 'Redstone Lamp', cat: 'light', tex: 'redstone_lamp_on', light: 15, sound: 'glass' });
// hand-drawn by the owner (src/blocks/handmade.ts)
add({ name: 'weathered_copper_bulb', display: 'Weathered Copper Bulb', cat: 'light', tex: 'weathered_copper_bulb', sound: 'metal' });
add({ name: 'weathered_copper_bulb_lit', display: 'Lit Weathered Copper Bulb', cat: 'light', tex: 'weathered_copper_bulb_lit', light: 12, sound: 'metal' });
add({ name: 'weathered_copper_bulb_powered', display: 'Powered Weathered Copper Bulb', cat: 'light', tex: 'weathered_copper_bulb_powered', sound: 'metal' });
add({ name: 'weathered_copper_bulb_lit_powered', display: 'Lit Powered Weathered Copper Bulb', cat: 'light', tex: 'weathered_copper_bulb_lit_powered', light: 12, sound: 'metal' });
add({ name: 'ochre_froglight', display: 'Ochre Froglight', cat: 'light', tex: { end: 'froglight_ochre_top', side: 'froglight_ochre' }, orient: 'axis', light: 15 });
add({ name: 'verdant_froglight', display: 'Verdant Froglight', cat: 'light', tex: { end: 'froglight_verdant_top', side: 'froglight_verdant' }, orient: 'axis', light: 15 });
add({ name: 'pearlescent_froglight', display: 'Pearlescent Froglight', cat: 'light', tex: { end: 'froglight_pearl_top', side: 'froglight_pearl' }, orient: 'axis', light: 15 });
add({ name: 'end_rod', display: 'End Rod', cat: 'light', tex: 'end_rod', shape: 'rod', layer: 'cutout', light: 14, sound: 'glass' });
add({ name: 'campfire_log_glow', display: 'Glowing Embers', cat: 'light', tex: 'embers', light: 12, sound: 'wood' });

// ---------------------------------------------------------------- decorative
add({ name: 'bookshelf', display: 'Bookshelf', cat: 'decor', tex: { top: 'oak_planks', bottom: 'oak_planks', side: 'bookshelf' }, sound: 'wood' });
add({ name: 'crafting_table', display: 'Crafting Table', cat: 'decor', tex: { top: 'crafting_table_top', bottom: 'oak_planks', side: 'crafting_table_side', front: 'crafting_table_front' }, orient: 'horizontal', sound: 'wood' });
add({ name: 'furnace', display: 'Furnace', cat: 'decor', tex: { top: 'furnace_top', bottom: 'furnace_top', side: 'furnace_side', front: 'furnace_front' }, orient: 'horizontal' });
add({ name: 'blast_furnace', display: 'Blast Furnace', cat: 'decor', tex: { top: 'blast_furnace_top', bottom: 'blast_furnace_top', side: 'blast_furnace_side', front: 'blast_furnace_front' }, orient: 'horizontal' });
add({ name: 'chest', display: 'Chest', cat: 'decor', tex: { top: 'chest_top', bottom: 'chest_top', side: 'chest_side', front: 'chest_front' }, shape: 'chest', orient: 'horizontal', layer: 'cutout', sound: 'wood' });
add({ name: 'barrel', display: 'Barrel', cat: 'decor', tex: { end: 'barrel_top', side: 'barrel_side' }, orient: 'axis', sound: 'wood' });
add({ name: 'note_block', display: 'Note Block', cat: 'decor', tex: 'note_block', sound: 'wood' });
add({ name: 'jukebox', display: 'Jukebox', cat: 'decor', tex: { top: 'jukebox_top', bottom: 'jukebox_side', side: 'jukebox_side' }, sound: 'wood' });
add({ name: 'tnt', display: 'TNT', cat: 'decor', tex: { top: 'tnt_top', bottom: 'tnt_bottom', side: 'tnt_side' }, sound: 'grass' });
add({ name: 'target', display: 'Target', cat: 'decor', tex: { top: 'target_top', bottom: 'target_top', side: 'target_side' }, sound: 'grass' });
add({ name: 'pumpkin', display: 'Pumpkin', cat: 'decor', tex: { top: 'pumpkin_top', bottom: 'pumpkin_top', side: 'pumpkin_side' }, sound: 'wood' });
add({ name: 'carved_pumpkin', display: 'Carved Pumpkin', cat: 'decor', tex: { top: 'pumpkin_top', bottom: 'pumpkin_top', side: 'pumpkin_side', front: 'carved_pumpkin' }, orient: 'horizontal', sound: 'wood' });
add({ name: 'melon', display: 'Melon', cat: 'decor', tex: { top: 'melon_top', bottom: 'melon_top', side: 'melon_side' }, sound: 'wood' });
add({ name: 'hay_block', display: 'Hay Bale', cat: 'decor', tex: { end: 'hay_top', side: 'hay_side' }, orient: 'axis', sound: 'grass' });
add({ name: 'sponge', display: 'Sponge', cat: 'decor', tex: 'sponge', sound: 'grass' });
add({ name: 'wet_sponge', display: 'Wet Sponge', cat: 'decor', tex: 'wet_sponge', sound: 'grass' });
add({ name: 'slime_block', display: 'Slime Block', cat: 'decor', tex: 'slime', layer: 'translucent', cullSelf: true, sound: 'slime' });
add({ name: 'honey_block', display: 'Honey Block', cat: 'decor', tex: 'honey', layer: 'translucent', cullSelf: true, sound: 'slime' });
add({ name: 'honeycomb_block', display: 'Honeycomb Block', cat: 'decor', tex: 'honeycomb', sound: 'wool' });
add({ name: 'dried_kelp_block', display: 'Dried Kelp Block', cat: 'decor', tex: { top: 'kelp_top', bottom: 'kelp_top', side: 'kelp_side' }, sound: 'grass' });
add({ name: 'brown_mushroom_block', display: 'Brown Mushroom Block', cat: 'decor', tex: 'mushroom_brown', sound: 'wood' });
add({ name: 'red_mushroom_block', display: 'Red Mushroom Block', cat: 'decor', tex: 'mushroom_red', sound: 'wood' });
add({ name: 'mushroom_stem', display: 'Mushroom Stem', cat: 'decor', tex: 'mushroom_stem', sound: 'wood' });
add({ name: 'cobweb', display: 'Cobweb', cat: 'decor', tex: 'cobweb', shape: 'cross', layer: 'cutout', solid: false, sound: 'wool' });
add({ name: 'cactus', display: 'Cactus', cat: 'decor', tex: { top: 'cactus_top', bottom: 'cactus_bottom', side: 'cactus_side' }, shape: 'cactus', layer: 'cutout', support: 'cactus', sound: 'wool' });
add({ name: 'sugar_cane', display: 'Sugar Cane', cat: 'decor', tex: 'sugar_cane', shape: 'cross', layer: 'cutout', solid: false, support: 'cane', sound: 'grass' });
add({ name: 'short_grass', display: 'Short Grass', cat: 'decor', tex: 'tall_grass', shape: 'cross', layer: 'cutout', solid: false, tint: 'grass', replaceable: true, support: 'soil', sound: 'grass', wave: 'plant' });
add({ name: 'fern', display: 'Fern', cat: 'decor', tex: 'fern', shape: 'cross', layer: 'cutout', solid: false, tint: 'grass', replaceable: true, support: 'soil', sound: 'grass', wave: 'plant' });
add({ name: 'dead_bush', display: 'Dead Bush', cat: 'decor', tex: 'dead_bush', shape: 'cross', layer: 'cutout', solid: false, replaceable: true, support: 'sand', sound: 'grass', wave: 'plant' });
const FLOWERS: [string, string][] = [
  ['dandelion', 'Dandelion'], ['poppy', 'Poppy'], ['blue_orchid', 'Blue Orchid'], ['allium', 'Allium'],
  ['azure_bluet', 'Azure Bluet'], ['red_tulip', 'Red Tulip'], ['orange_tulip', 'Orange Tulip'],
  ['white_tulip', 'White Tulip'], ['pink_tulip', 'Pink Tulip'], ['oxeye_daisy', 'Oxeye Daisy'],
  ['cornflower', 'Cornflower'], ['lily_of_the_valley', 'Lily of the Valley'],
];
for (const [k, n] of FLOWERS) add({ name: k, display: n, cat: 'decor', tex: `flower_${k}`, shape: 'cross', layer: 'cutout', solid: false, support: 'soil', sound: 'grass', wave: 'plant' });
add({ name: 'brown_mushroom', display: 'Brown Mushroom', cat: 'decor', tex: 'brown_mushroom', shape: 'cross', layer: 'cutout', solid: false, support: 'solid', sound: 'grass' });
add({ name: 'red_mushroom', display: 'Red Mushroom', cat: 'decor', tex: 'red_mushroom', shape: 'cross', layer: 'cutout', solid: false, support: 'solid', sound: 'grass' });
add({ name: 'lily_pad', display: 'Lily Pad', cat: 'decor', tex: 'lily_pad', shape: 'lily', layer: 'cutout', solid: true, tint: 'foliage', support: 'water', sound: 'grass' });
add({ name: 'seagrass', display: 'Seagrass', cat: 'decor', tex: 'seagrass', shape: 'cross', layer: 'cutout', solid: false, item: false, sound: 'grass', wave: 'plant' });

// ---------------------------------------------------------------- fluids
add({ name: 'water', display: 'Water', cat: 'fluids', tex: 'water', shape: 'fluid', layer: 'water', fluid: true, solid: false, opacity: 1, replaceable: true, cullSelf: true, tint: 'water', sound: 'liquid' });
add({ name: 'lava', display: 'Lava', cat: 'fluids', tex: 'lava', shape: 'fluid', layer: 'lava', fluid: true, solid: false, light: 15, opacity: 0, replaceable: true, cullSelf: true, sound: 'liquid' });

// ===========================================================================
// Derived lookup tables used in the hot loops (mesher, lighting, physics).

export const BLOCKS = DEFS;
export const COUNT = DEFS.length;
export const ID: Record<string, number> = {};
DEFS.forEach((d, i) => { ID[d.name] = i; });

export const SHAPES: ShapeName[] = ['cube', 'slab', 'stairs', 'fence', 'wall', 'cross', 'torch', 'door', 'trapdoor', 'pane', 'fluid', 'layer', 'carpet', 'cactus', 'lantern', 'chest', 'rod', 'lily'];
export const S = Object.fromEntries(SHAPES.map((s, i) => [s, i])) as Record<ShapeName, number>;
export const LAYERS: LayerName[] = ['opaque', 'cutout', 'translucent', 'water', 'lava'];
export const L = Object.fromEntries(LAYERS.map((s, i) => [s, i])) as Record<LayerName, number>;

export const SHAPE = new Uint8Array(COUNT);
export const LAYER = new Uint8Array(COUNT);
export const EMIT = new Uint8Array(COUNT);
export const OPACITY = new Uint8Array(COUNT);
export const OCCLUDES = new Uint8Array(COUNT);   // full opaque cube: hides neighbour faces, casts AO
export const SOLID = new Uint8Array(COUNT);
export const FLUID = new Uint8Array(COUNT);
export const CULLSELF = new Uint8Array(COUNT);
export const REPLACEABLE = new Uint8Array(COUNT);
export const TINT = new Uint8Array(COUNT);       // 0 none, 1 grass, 2 foliage, 3 water
export const TINTMASK = new Uint8Array(COUNT);
export const ORIENT = new Uint8Array(COUNT);     // 0 none, 1 axis, 2 horizontal
export const WAVE = new Uint8Array(COUNT);       // 0 none, 1 plant, 2 leaves
export const LEAVES = new Uint8Array(COUNT);
export const FAMILY = new Uint8Array(COUNT);     // 0 none, else family index
export const TARGETABLE = new Uint8Array(COUNT);

const families: string[] = [''];
const TINTS: TintName[] = ['none', 'grass', 'foliage', 'water'];

for (let i = 0; i < COUNT; i++) {
  const d = DEFS[i];
  const shape = d.shape ?? 'cube';
  const layer = d.layer ?? 'opaque';
  SHAPE[i] = S[shape];
  LAYER[i] = L[layer];
  EMIT[i] = d.light ?? 0;
  const fullOpaque = shape === 'cube' && layer === 'opaque';
  OCCLUDES[i] = fullOpaque && d.transparent !== true ? 1 : 0;
  OPACITY[i] = d.opacity ?? (fullOpaque ? 15 : 0);
  SOLID[i] = (d.solid ?? true) ? 1 : 0;
  FLUID[i] = d.fluid ? 1 : 0;
  CULLSELF[i] = d.cullSelf ? 1 : 0;
  REPLACEABLE[i] = d.replaceable ? 1 : 0;
  TINT[i] = TINTS.indexOf(d.tint ?? 'none');
  TINTMASK[i] = d.tintMask ? 1 : 0;
  ORIENT[i] = d.orient === 'axis' ? 1 : d.orient === 'horizontal' ? 2 : 0;
  WAVE[i] = d.wave === 'plant' ? 1 : d.wave === 'leaves' ? 2 : 0;
  LEAVES[i] = d.name.endsWith('_leaves') ? 1 : 0;
  if (d.family) {
    let f = families.indexOf(d.family);
    if (f < 0) { f = families.length; families.push(d.family); }
    FAMILY[i] = f;
  }
  TARGETABLE[i] = i !== 0 && !d.fluid ? 1 : 0;
}
// Air: nothing.
SOLID[0] = 0; OPACITY[0] = 0;

// ---------------------------------------------------------------------------
// Textures: every distinct texture name gets a tile index in the atlas.
// Faces are indexed 0:+X(east) 1:-X(west) 2:+Y(up) 3:-Y(down) 4:+Z(south) 5:-Z(north).
export const TEXTURE_NAMES: string[] = [];
const texIndex = new Map<string, number>();
export function textureId(name: string): number {
  let t = texIndex.get(name);
  if (t === undefined) { t = TEXTURE_NAMES.length; TEXTURE_NAMES.push(name); texIndex.set(name, t); }
  return t;
}
textureId('missing');

// FACE_TEX[id*6+face] for the block in its default orientation (north-facing front).
export const FACE_TEX = new Uint16Array(COUNT * 6);
for (let i = 0; i < COUNT; i++) {
  const t = DEFS[i].tex;
  let f: string[];
  if (typeof t === 'string') f = [t, t, t, t, t, t];
  else {
    const side = t.side ?? t.all ?? t.end ?? 'missing';
    const top = t.top ?? t.end ?? side;
    const bottom = t.bottom ?? t.end ?? top;
    f = [t.east ?? side, t.west ?? side, top, bottom, t.south ?? side, t.north ?? t.front ?? side];
  }
  for (let k = 0; k < 6; k++) FACE_TEX[i * 6 + k] = textureId(f[k]);
}
// Extra textures referenced directly by models / effects.
export const EXTRA_TEX = {
  water_still: textureId('water'),
  lava_still: textureId('lava'),
};

// Which atlas tiles hold alpha-tested or blended pixels (affects mip generation).
export const TEX_KIND = new Uint8Array(1024); // 0 opaque, 1 cutout, 2 translucent
for (let i = 0; i < COUNT; i++) {
  const k = LAYER[i] === L.cutout ? 1 : LAYER[i] === L.translucent ? 2 : 0;
  for (let f = 0; f < 6; f++) {
    const t = FACE_TEX[i * 6 + f];
    if (k > TEX_KIND[t]) TEX_KIND[t] = k;
  }
}

export function blockName(id: number): string { return DEFS[id]?.display ?? 'Unknown'; }
export function isItem(id: number): boolean { return id > 0 && DEFS[id].item !== false; }

// Block state helpers -------------------------------------------------------
// A stored block is a Uint16: low 10 bits block id, high 6 bits state ("meta").
export const ID_MASK = 0x3ff;
export const META_SHIFT = 10;
export const pack = (id: number, meta = 0) => id | (meta << META_SHIFT);
export const idOf = (v: number) => v & ID_MASK;
export const metaOf = (v: number) => v >> META_SHIFT;

if (COUNT > 1024) throw new Error('Too many blocks for 10-bit ids');
