// Infinite seeded terrain generator (WS1).
//
// Pipeline for one 16x256x16 column, all a pure function of (seed, cx, cz):
//   1. climate + height for the 18x18 area (chunk plus a 1-block border, for slopes)
//   2. terrain fill: bedrock, stone/deepslate (dithered), surface layers, water, ice
//   3. stone blobs (granite, diorite, andesite, tuff, dirt, gravel) as 3x3-chunk features
//   4. caves: cheese + spaghetti 3D noise on a 4x4x4 grid, trilinear, lava at y <= 10
//   5. ore veins (random walks, 3x3-chunk features so veins cross borders intact)
//   6. trees from a jittered 4x4-block cell grid around the chunk (cross-border safe)
//   7. plants, cactus, sugar cane, lily pads, seagrass, pumpkins, snow cover
//   8. biome ids + smoothly blended grass/foliage/water tints
//
// The height field is a continuous function of smooth climate noises (continentalness,
// erosion, ridges, humidity/temperature for swamp flattening, river distance), so biome
// borders never create cliffs: biomes only pick surface blocks, plants and tints.
import { Noise, fbm2, ridged2, hash2i, hash3i, Rng } from './noise';
import { ID, pack, OCCLUDES, LEAVES, SOLID, FLUID } from '../blocks/registry';
import { SEA_LEVEL, COLUMN_VOLUME } from './constants';
import type { GenChunk } from '../types';

export const BIOME_NAMES: string[] = [
  'Ocean', 'Deep Ocean', 'Beach', 'Plains', 'Forest', 'Birch Forest', 'Desert',
  'Snowy Tundra', 'Mountains', 'Snowy Peaks', 'Swamp', 'Cherry Grove', 'River', 'Stony Shore',
];

export const BIOME: {
  ocean: number; deep_ocean: number; beach: number; plains: number; forest: number; birch_forest: number;
  desert: number; snowy_tundra: number; mountains: number; snowy_peaks: number; swamp: number;
  cherry_grove: number; river: number; stony_shore: number;
} = {
  ocean: 0, deep_ocean: 1, beach: 2, plains: 3, forest: 4, birch_forest: 5, desert: 6,
  snowy_tundra: 7, mountains: 8, snowy_peaks: 9, swamp: 10, cherry_grove: 11, river: 12, stony_shore: 13,
};

const B_OCEAN = 0, B_DEEP = 1, B_BEACH = 2, B_PLAINS = 3, B_FOREST = 4, B_BIRCH = 5, B_DESERT = 6,
  B_TUNDRA = 7, B_MOUNTAINS = 8, B_PEAKS = 9, B_SWAMP = 10, B_CHERRY = 11, B_RIVER = 12, B_STONY = 13;
const NBIOMES = 14;

// ---------------------------------------------------------------------------- blocks
function bid(name: string): number {
  const v = ID[name];
  if (v === undefined) throw new Error(`generator: unknown block ${name}`);
  return v;
}
const AIR = 0;
const BEDROCK = bid('bedrock'), STONE = bid('stone'), DEEPSLATE = bid('deepslate'), TUFF = bid('tuff');
const GRANITE = bid('granite'), DIORITE = bid('diorite'), ANDESITE = bid('andesite');
const DIRT = bid('dirt'), GRASS = bid('grass_block'), SNOWY_GRASS = bid('snowy_grass_block'), PODZOL = bid('podzol');
const COARSE_DIRT = bid('coarse_dirt'), MUD = bid('mud'), CLAY = bid('clay'), SAND = bid('sand'), SANDSTONE = bid('sandstone');
const GRAVEL = bid('gravel'), SNOW_BLOCK = bid('snow_block'), SNOW = bid('snow'), ICE = bid('ice'), PACKED_ICE = bid('packed_ice');
const CALCITE = bid('calcite');
const WATER = bid('water'), LAVA = bid('lava');
const OAK_LOG = bid('oak_log'), OAK_LEAVES = bid('oak_leaves');
const BIRCH_LOG = bid('birch_log'), BIRCH_LEAVES = bid('birch_leaves');
const SPRUCE_LOG = bid('spruce_log'), SPRUCE_LEAVES = bid('spruce_leaves');
const CHERRY_LOG = bid('cherry_log'), CHERRY_LEAVES = bid('cherry_leaves');
const DARK_OAK_LOG = bid('dark_oak_log'), DARK_OAK_LEAVES = bid('dark_oak_leaves');
const SHORT_GRASS = bid('short_grass'), FERN = bid('fern'), DEAD_BUSH = bid('dead_bush'), CACTUS = bid('cactus');
const SUGAR_CANE = bid('sugar_cane'), LILY_PAD = bid('lily_pad'), SEAGRASS = bid('seagrass'), PUMPKIN = bid('pumpkin');
const BROWN_MUSHROOM = bid('brown_mushroom'), RED_MUSHROOM = bid('red_mushroom');
const DANDELION = bid('dandelion'), POPPY = bid('poppy'), BLUE_ORCHID = bid('blue_orchid'), ALLIUM = bid('allium');
const AZURE_BLUET = bid('azure_bluet'), RED_TULIP = bid('red_tulip'), ORANGE_TULIP = bid('orange_tulip');
const WHITE_TULIP = bid('white_tulip'), PINK_TULIP = bid('pink_tulip'), OXEYE = bid('oxeye_daisy');
const CORNFLOWER = bid('cornflower'), LILY_VALLEY = bid('lily_of_the_valley');

const ORE_NAMES = ['coal', 'iron', 'copper', 'gold', 'redstone', 'lapis', 'diamond', 'emerald'] as const;
const ORE_STONE = ORE_NAMES.map((n) => bid(`${n}_ore`));
const ORE_DEEP = ORE_NAMES.map((n) => bid(`deepslate_${n}_ore`));

/** Ore vein configs: [ore index, veins per chunk, vein size, min y, max y, distribution (0 uniform, 1 triangle)] */
const ORE_VEINS: [number, number, number, number, number, number][] = [
  [0, 20, 15, 5, 128, 0],   // coal: common, high
  [0, 6, 17, 60, 128, 0],   // coal: extra near the surface, exposed on cliffs
  [2, 12, 10, 20, 96, 1],   // copper
  [1, 10, 9, 5, 72, 1],     // iron
  [1, 3, 9, 5, 24, 0],      // iron: extra deep
  [3, 2, 9, 5, 32, 1],      // gold
  [4, 6, 8, 5, 16, 0],      // redstone
  [5, 2, 7, 5, 32, 1],      // lapis
  [6, 1, 8, 5, 16, 0],      // diamond (+ a second small vein half the time, see ores())
];

/** Stone blob configs: [block, replace mask, per chunk, size, min y, max y]. mask bit 1 stone, 2 deepslate */
const BLOBS: [number, number, number, number, number, number][] = [
  [GRANITE, 1, 2, 52, 0, 64], [DIORITE, 1, 2, 52, 0, 64], [ANDESITE, 1, 2, 52, 0, 64],
  [GRANITE, 1, 0.25, 52, 64, 128], [DIORITE, 1, 0.25, 52, 64, 128], [ANDESITE, 1, 0.25, 52, 64, 128],
  [TUFF, 2, 2, 52, 0, 16],
  [DIRT, 1, 4, 30, 0, 160], [GRAVEL, 1, 5, 30, 0, 160],
];

// --------------------------------------------------------------------------- climate
const TUNDRA_T = -0.5;   // colder than this: snowy tundra (and frozen water)
const DESERT_T = 0.42;
const DESERT_H = 0.05;

/** Max horizontal distance a tree reaches from its trunk (canopy + branches). */
export const TREE_REACH = 9;

// Tree kinds
const T_OAK = 0, T_BIRCH = 1, T_SPRUCE = 2, T_CHERRY = 3, T_BIG_OAK = 4, T_DARK_OAK = 5, T_SWAMP_OAK = 6, T_TALL_BIRCH = 7;

// Continentalness -> base height (piecewise linear).
const SPLINE_X = [-1.2, -0.62, -0.45, -0.3, -0.2, -0.14, -0.1, -0.06, 0, 0.3, 1.2];
const SPLINE_Y = [29, 35, 42, 48, 54, 58.5, 61.6, 63.2, 64.8, 70, 82];
function spline(c: number): number {
  if (c <= SPLINE_X[0]) return SPLINE_Y[0];
  for (let i = 1; i < SPLINE_X.length; i++) {
    if (c < SPLINE_X[i]) {
      const t = (c - SPLINE_X[i - 1]) / (SPLINE_X[i] - SPLINE_X[i - 1]);
      return SPLINE_Y[i - 1] + (SPLINE_Y[i] - SPLINE_Y[i - 1]) * t;
    }
  }
  return SPLINE_Y[SPLINE_Y.length - 1];
}
function smoothstep(e0: number, e1: number, x: number): number {
  let t = (x - e0) / (e1 - e0);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}

// ------------------------------------------------------------------------------ tints
const hex = (s: string) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
// per biome: grass, foliage, water
const BIOME_TINT: number[][] = [];
function setTint(b: number, g: string, f: string, w: string) { BIOME_TINT[b] = [...hex(g), ...hex(f), ...hex(w)]; }
setTint(B_OCEAN, '#8eb971', '#71a74d', '#3f76e4');
setTint(B_DEEP, '#8eb971', '#71a74d', '#3a69d6');
setTint(B_BEACH, '#91bd59', '#77ab2f', '#3f76e4');
setTint(B_PLAINS, '#91bd59', '#77ab2f', '#3f76e4');
setTint(B_FOREST, '#79c05a', '#59ae30', '#3f76e4');
setTint(B_BIRCH, '#88bb67', '#6ba941', '#3f76e4');
setTint(B_DESERT, '#bfb755', '#aea42a', '#3f8ee4');
setTint(B_TUNDRA, '#80b497', '#60a17b', '#3938c9');
setTint(B_MOUNTAINS, '#8ab689', '#6da36b', '#3f6ee0');
setTint(B_PEAKS, '#80b497', '#60a17b', '#3938c9');
setTint(B_SWAMP, '#6a7039', '#6a7039', '#617b64');
setTint(B_CHERRY, '#b6db61', '#b6db61', '#5db7ef');
setTint(B_RIVER, '#8eb971', '#71a74d', '#3f76e4');
setTint(B_STONY, '#8ab689', '#6da36b', '#3d5fd9');
const COLD_WATER = hex('#3d57d6'), WARM_WATER = hex('#45adf2'), SNOWY_GRASS_TINT = hex('#80b497'), SNOWY_FOLIAGE = hex('#60a17b');

// ------------------------------------------------------------------------- flowers
const FLOWERS: number[][] = [];
FLOWERS[B_PLAINS] = [DANDELION, POPPY, AZURE_BLUET, OXEYE, CORNFLOWER, RED_TULIP, ORANGE_TULIP, WHITE_TULIP, PINK_TULIP, DANDELION, POPPY];
FLOWERS[B_FOREST] = [DANDELION, POPPY, LILY_VALLEY, POPPY, DANDELION];
FLOWERS[B_BIRCH] = [DANDELION, POPPY, LILY_VALLEY, OXEYE];
FLOWERS[B_SWAMP] = [BLUE_ORCHID];
FLOWERS[B_CHERRY] = [PINK_TULIP, PINK_TULIP, WHITE_TULIP, ALLIUM];
FLOWERS[B_MOUNTAINS] = [ALLIUM, AZURE_BLUET, CORNFLOWER, DANDELION, OXEYE, POPPY];
FLOWERS[B_RIVER] = [DANDELION, POPPY];
FLOWERS[B_BEACH] = [DANDELION];

// Seed salts for the independent hashes.
const SALT_BEDROCK = 0x1b873593, SALT_DEEP = 0x2c1b3c6d, SALT_DECO = 0x297a2d39, SALT_TREE = 0x6b43a9b5;
const SALT_FEAT = 0x5f356495, SALT_ORE = 0x3c6ef372, SALT_CACTUS = 0x7c3a9a5f, SALT_PUMPKIN = 0x4f1bbcdc;
const SALT_DEPTH = 0x11a2b3c4, SALT_EMERALD = 0x0badc0de;

const MAP = 18;                      // 16 + 1 block border each side
const MAP_N = MAP * MAP;
const TG = 9;                        // tint grid: 9x9 points every 4 blocks, from -8 to +24
const CAVE_NY = 65;                  // y grid levels 0,4,..,256

export class Generator {
  readonly seed: number;
  // terrain noises
  private nCont: Noise; private nWarp: Noise; private nEro: Noise; private nRidge: Noise; private nAmp: Noise;
  private nHill: Noise; private nDet: Noise; private nRiver: Noise; private nSwamp: Noise;
  // climate noises
  private nTemp: Noise; private nHum: Noise; private nVar: Noise; private nJit: Noise;
  // surface + decoration noises
  private nPatch: Noise; private nPatch2: Noise; private nFlower: Noise; private nFlowerType: Noise; private nGrass: Noise;
  private nForest: Noise; private nEnt: Noise; private nSnow: Noise;
  // caves
  private nCheese: Noise; private nCheese2: Noise; private nSpagA: Noise; private nSpagB: Noise; private nSpagW: Noise;

  // sample() outputs (no allocation)
  private sB = 0; private sT = 0; private sHum = 0; private sC = 0; private sMtn = 0; private sChan = 0;

  // per-chunk scratch
  private hm = new Int16Array(MAP_N);
  private bm = new Uint8Array(MAP_N);
  private tm = new Float32Array(MAP_N);
  private frozen = new Uint8Array(256);
  private slopes = new Uint8Array(256);
  private carveTop = new Int16Array(256);
  private tintGrid = new Float32Array(TG * TG * 9);
  private tintBlur = new Float32Array(TG * TG * 9);
  private caveC = new Float32Array(25 * CAVE_NY);
  private caveA = new Float32Array(25 * CAVE_NY);
  private caveB = new Float32Array(25 * CAVE_NY);
  private colC = new Float32Array(CAVE_NY);
  private colA = new Float32Array(CAVE_NY);
  private colB = new Float32Array(CAVE_NY);
  private cheeseThr = new Float32Array(257);
  private spagW2 = new Float32Array(257);
  private rng = new Rng();
  private rng2 = new Rng();
  private blocks: Uint16Array = new Uint16Array(0);
  private X0 = 0;
  private Z0 = 0;
  // surface() outputs
  private fFill = 0; private fDepth = 0; private fUnder = 0; private fUnderDepth = 0;
  private spawn: { x: number; z: number } | null = null;

  constructor(seed: number) {
    this.seed = seed | 0;
    let k = 0;
    const mk = () => new Noise((this.seed + Math.imul(++k, 0x9e3779b1)) | 0);
    this.nCont = mk(); this.nWarp = mk(); this.nEro = mk(); this.nRidge = mk(); this.nAmp = mk();
    this.nHill = mk(); this.nDet = mk(); this.nRiver = mk(); this.nSwamp = mk();
    this.nTemp = mk(); this.nHum = mk(); this.nVar = mk(); this.nJit = mk();
    this.nPatch = mk(); this.nPatch2 = mk(); this.nFlower = mk(); this.nFlowerType = mk(); this.nGrass = mk();
    this.nForest = mk(); this.nEnt = mk(); this.nSnow = mk();
    this.nCheese = mk(); this.nCheese2 = mk(); this.nSpagA = mk(); this.nSpagB = mk(); this.nSpagW = mk();
    for (let y = 0; y <= 256; y++) {
      // Big chambers mostly deep down, rarer towards the surface.
      this.cheeseThr[y] = 0.45 + 0.2 * smoothstep(24, 100, y) + 0.12 * smoothstep(4, -2, y);
      const w = 0.083 + 0.017 * smoothstep(80, 20, y);
      this.spagW2[y] = w * w;
    }
  }

  // ======================================================================= climate
  /**
   * Height and biome of one column. Pure function of (seed, x, z). Also leaves the
   * climate values in the s* fields for callers that need them.
   */
  private sample(x: number, z: number): number {
    // Small wobble so biome borders are irregular, kept weak enough not to fragment them.
    const jit = this.nJit.noise2(x * (1 / 64), z * (1 / 64)) * 0.026 + this.nJit.noise2(x * (1 / 17) + 31.7, z * (1 / 17) - 11.3) * 0.004;
    const T = fbm2(this.nTemp, x * (1 / 1500), z * (1 / 1500), 3) * 1.45 + jit;
    const Hm = fbm2(this.nHum, x * (1 / 1150), z * (1 / 1150), 3) * 1.45 - jit;
    const V = fbm2(this.nVar, x * (1 / 640), z * (1 / 640), 2) * 1.55 + jit;
    // Continentalness with a light domain warp so coastlines are not round blobs.
    const wx = x + this.nWarp.noise2(x * (1 / 420), z * (1 / 420)) * 80;
    const wz = z + this.nWarp.noise2(z * (1 / 420) + 57.1, x * (1 / 420) - 23.9) * 80;
    const c = fbm2(this.nCont, wx * (1 / 1800), wz * (1 / 1800), 5) * 1.75 + 0.1;
    const e = fbm2(this.nEro, x * (1 / 1250), z * (1 / 1250), 3) * 1.55;

    let h = spline(c);
    const inland = smoothstep(-0.12, 0.25, c);
    // Mountains: inland and low erosion. Ridged noise gives crests and valleys.
    const mtn = smoothstep(-0.2, 0.08, c) * smoothstep(-0.18, -0.66, e);
    if (mtn > 0) {
      const r = ridged2(this.nRidge, x * (1 / 620), z * (1 / 620), 5);
      const amp = 0.82 + 0.25 * this.nAmp.noise2(x * (1 / 1100), z * (1 / 1100));
      const m = mtn * mtn * (3 - 2 * mtn);
      h += m * (20 + 190 * r * Math.sqrt(r)) * amp;
    }
    // Rolling hills (stronger with lower erosion), small detail everywhere.
    const hillA = inland * (3 + 16 * smoothstep(0.55, -0.2, e)) * (1 - 0.6 * mtn) + (1 - inland) * 2.5;
    h += fbm2(this.nHill, x * (1 / 200), z * (1 / 200), 4) * 1.35 * hillA;
    h += fbm2(this.nDet, x * (1 / 40), z * (1 / 40), 2) * (0.9 + 1.4 * inland);

    // Swamps: flatten towards the water line where it is wet and warm enough.
    const sw = smoothstep(0.36, 0.5, Hm) * smoothstep(-0.36, -0.22, T) * smoothstep(-0.28, 0.0, e)
      * (1 - smoothstep(0.04, 0.2, mtn)) * smoothstep(-0.07, 0.03, c);
    if (sw > 0) h += (61.8 + this.nSwamp.noise2(x * (1 / 13), z * (1 / 13)) * 1.8 - h) * sw;

    // Rivers along the zero line of a noise field: a wide gentle valley + a channel.
    let chan = 0;
    const rs = 1 - smoothstep(0.25, 0.6, mtn);
    if (rs > 0) {
      const rv = Math.abs(fbm2(this.nRiver, x * (1 / 700), z * (1 / 700), 3) * 1.7);
      if (rv < 0.2) {
        // broad valley that reaches the water line before the channel starts
        const keep = 1 - (1 - smoothstep(0.035, 0.2, rv)) * rs;
        if (h > 63) h = 63 + (h - 63) * keep;
        chan = (1 - smoothstep(0.0, 0.045, rv)) * rs;
        if (chan > 0) {
          const bed = 56.5 + this.nDet.noise2(x * (1 / 23), z * (1 / 23)) * 1.5;
          if (h > bed) h += (bed - h) * chan;
        }
      }
    }

    // soft ceiling so the highest peaks flatten out well below the build limit
    if (h > 185) h = 185 + 55 * (1 - Math.exp((185 - h) / 55));
    let hi = Math.floor(h);
    if (hi < 2) hi = 2; else if (hi > 250) hi = 250;

    // ---- biome (only surface, plants, tints depend on it)
    let b: number;
    if (hi < SEA_LEVEL && c < -0.13) {
      b = c < -0.5 ? B_DEEP : B_OCEAN;
    } else if (chan > 0.4 && hi <= SEA_LEVEL + 1) {
      b = B_RIVER;
    } else if (c < -0.03 + jit && mtn > 0.07 && hi < 78 && hi >= SEA_LEVEL - 3) {
      b = B_STONY;
    } else if (c < -0.035 + jit * 0.6 && hi <= 66 && hi >= SEA_LEVEL - 2) {
      b = B_BEACH;
    } else if (mtn > 0.32 && hi >= 92) {
      const peak = 148 + this.nSnow.noise2(x * (1 / 60), z * (1 / 60)) * 10 - (T < TUNDRA_T + 0.1 ? 30 : 0);
      b = hi >= peak ? B_PEAKS : B_MOUNTAINS;
    } else if (T < TUNDRA_T) {
      b = B_TUNDRA;
    } else if (T > DESERT_T && Hm < DESERT_H) {
      b = B_DESERT;
    } else if (sw > 0.5) {
      b = B_SWAMP;
    } else if (V > 0.42 && T > -0.3 && T < 0.32 && Hm > -0.3 && Hm < 0.36 && e < 0.12) {
      b = B_CHERRY;
    } else if (V < -0.33 && T > -0.42 && T < 0.3 && Hm > -0.12) {
      b = B_BIRCH;
    } else if (Hm > 0.02) {
      b = B_FOREST;
    } else {
      b = B_PLAINS;
    }
    this.sB = b; this.sT = T; this.sHum = Hm; this.sC = c; this.sMtn = mtn; this.sChan = chan;
    return hi;
  }

  /** Terrain surface y (top solid block) before caves. */
  heightAt(x: number, z: number): number { return this.sample(Math.floor(x), Math.floor(z)); }

  biomeAt(x: number, z: number): number { this.sample(Math.floor(x), Math.floor(z)); return this.sB; }

  /** Central-difference slope (blocks of rise over 2 blocks) from the pure height function. */
  private slopeAt(x: number, z: number): number {
    const a = this.sample(x + 1, z), b = this.sample(x - 1, z), c = this.sample(x, z + 1), d = this.sample(x, z - 1);
    return Math.max(Math.abs(a - b), Math.abs(c - d));
  }

  private snowline(x: number, z: number): number {
    return 122 + this.nSnow.noise2(x * (1 / 37), z * (1 / 37)) * 7;
  }

  private isEntrance(x: number, z: number): boolean {
    return this.nEnt.noise2(x * (1 / 85), z * (1 / 85)) > 0.62;
  }

  // ======================================================================= surface
  /**
   * Top block for a column and the layers below it (fFill x fDepth, then fUnder x fUnderDepth,
   * then stone). Pure function of its inputs (+ noise), shared by terrain and tree checks.
   */
  private surface(x: number, z: number, h: number, b: number, slope: number, T: number): number {
    const p = this.nPatch.noise2(x * (1 / 11), z * (1 / 11));
    const dh = hash2i(this.seed ^ SALT_DEPTH, x, z);
    const depth = 3 + (dh & 1);
    this.fFill = DIRT; this.fDepth = depth; this.fUnder = STONE; this.fUnderDepth = 0;
    if (h < SEA_LEVEL) {
      // Underwater floors.
      const wd = SEA_LEVEL - h;
      let top: number;
      if (b === B_OCEAN || b === B_DEEP) {
        top = wd > 16 || b === B_DEEP ? (p > -0.35 ? GRAVEL : SAND) : (p > 0.55 && wd < 12 ? CLAY : p < -0.45 ? GRAVEL : SAND);
      } else if (b === B_RIVER) {
        top = p > 0.5 ? CLAY : p < -0.4 ? GRAVEL : SAND;
      } else if (b === B_SWAMP) {
        top = p > -0.1 ? MUD : p < -0.55 ? CLAY : DIRT;
      } else if (b === B_DESERT || b === B_BEACH) {
        top = SAND;
      } else if (b === B_TUNDRA || b === B_PEAKS || b === B_MOUNTAINS || b === B_STONY) {
        top = p > 0.1 ? GRAVEL : DIRT;
      } else {
        top = p > 0.55 ? CLAY : p > 0.05 ? SAND : p > -0.45 ? DIRT : GRAVEL;
      }
      this.fFill = top === CLAY || top === MUD ? DIRT : top;
      this.fDepth = top === CLAY ? 2 : depth;
      if (top === SAND) { this.fUnder = SANDSTONE; this.fUnderDepth = 2; }
      return top;
    }
    switch (b) {
      case B_DESERT:
        this.fFill = SAND; this.fDepth = depth + 1; this.fUnder = SANDSTONE; this.fUnderDepth = 3 + ((dh >>> 1) & 1);
        return SAND;
      case B_BEACH:
        this.fFill = SAND; this.fDepth = depth; this.fUnder = SANDSTONE; this.fUnderDepth = 2;
        return SAND;
      case B_STONY:
        if (slope > 2 || p > 0.15) { this.fFill = STONE; return STONE; }
        this.fFill = GRAVEL; this.fDepth = 2;
        return GRAVEL;
      case B_PEAKS:
        if (slope >= 6) { this.fFill = STONE; return p > 0.5 ? CALCITE : STONE; }
        if (p > 0.62) { this.fFill = GRAVEL; this.fDepth = 2; return GRAVEL; }
        if (p < -0.66 && slope <= 2) { this.fFill = PACKED_ICE; this.fDepth = 2; return PACKED_ICE; }
        this.fFill = SNOW_BLOCK; this.fDepth = 1 + (dh & 1);
        return SNOW_BLOCK;
      case B_MOUNTAINS:
        if (slope >= 5 || (slope >= 3 && h > 128)) {
          this.fFill = STONE;
          return p > 0.66 ? GRAVEL : STONE;
        }
        if (slope >= 3 && p > 0.45) { this.fFill = GRAVEL; this.fDepth = 2; return GRAVEL; }
        this.fDepth = 1 + (dh & 1);
        {
          // podzol under the spruce woods of the lower slopes, a few coarse dirt scars
          const q = this.nPatch2.noise2(x * (1 / 34), z * (1 / 34)) + p * 0.15;
          if (h < 114 && q < -0.8) return PODZOL;
          if (q > 0.9) return COARSE_DIRT;
        }
        return GRASS;
      case B_TUNDRA:
        if (slope >= 6) { this.fFill = STONE; return STONE; }
        if (this.nPatch2.noise2(x * (1 / 22), z * (1 / 22)) > 0.86) { this.fFill = PACKED_ICE; this.fDepth = 2; return PACKED_ICE; }
        return SNOWY_GRASS;
      case B_SWAMP:
        return p > 0.52 ? MUD : GRASS;
      case B_RIVER:
        if (h <= SEA_LEVEL) {
          if (T < TUNDRA_T) return GRAVEL;
          this.fFill = SAND;
          return p > 0.2 ? GRASS : SAND;
        }
        return T < TUNDRA_T ? SNOWY_GRASS : GRASS;
      default:
        if (slope >= 8) { this.fFill = STONE; return STONE; }
        return GRASS;
    }
  }

  // ===================================================================== generation
  generate(cx: number, cz: number): GenChunk {
    const blocks = new Uint16Array(COLUMN_VOLUME);
    const biome = new Uint8Array(256);
    const tint = new Uint8Array(256 * 9);
    this.blocks = blocks;
    const X0 = (this.X0 = cx * 16), Z0 = (this.Z0 = cz * 16);
    const hm = this.hm, bm = this.bm, tm = this.tm;

    // 1. heights + biomes for the chunk and a 1-block border
    for (let mz = 0; mz < MAP; mz++) {
      for (let mx = 0; mx < MAP; mx++) {
        const i = mz * MAP + mx;
        hm[i] = this.sample(X0 + mx - 1, Z0 + mz - 1);
        bm[i] = this.sB;
        tm[i] = this.sT;
      }
    }

    // 2. terrain fill
    let maxH = 0;
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const mi = (lz + 1) * MAP + lx + 1;
        const h = hm[mi], b = bm[mi], T = tm[mi];
        const wx = X0 + lx, wz = Z0 + lz;
        if (h > maxH) maxH = h;
        const slope = Math.max(Math.abs(hm[mi + 1] - hm[mi - 1]), Math.abs(hm[mi + MAP] - hm[mi - MAP]));
        const top = this.surface(wx, wz, h, b, slope, T);
        const col = (lz << 4) | lx;
        this.slopes[col] = slope > 255 ? 255 : slope;
        const fillEnd = h - this.fDepth;            // fill occupies (fillEnd, h)
        const underEnd = fillEnd - this.fUnderDepth; // under occupies (underEnd, fillEnd]
        const fill = this.fFill, under = this.fUnder;
        blocks[col] = BEDROCK;
        for (let y = 1; y < h; y++) {
          let v: number;
          if (y > fillEnd) v = fill;
          else if (y > underEnd) v = under;
          else if (y >= 20) v = STONE;
          else if (y < 12) v = DEEPSLATE;
          else v = (hash3i(this.seed ^ SALT_DEEP, wx, y, wz) & 7) < 20 - y ? DEEPSLATE : STONE;
          if (y <= 4 && (hash3i(this.seed ^ SALT_BEDROCK, wx, y, wz) % 5) < 5 - y) v = BEDROCK;
          blocks[(y << 8) | col] = v;
        }
        blocks[(h << 8) | col] = top;
        // frozen columns: cold climate, or mountains above the snow line
        let fz = T < TUNDRA_T || b === B_PEAKS ? 1 : 0;
        if (!fz && (b === B_MOUNTAINS || b === B_STONY) && h >= this.snowline(wx, wz)) fz = 1;
        this.frozen[col] = fz;
        if (h < SEA_LEVEL) {
          for (let y = h + 1; y <= SEA_LEVEL; y++) blocks[(y << 8) | col] = WATER;
          if (fz) {
            // Lakes and rivers freeze over; cold oceans get drifting ice floes.
            const ocean = b === B_OCEAN || b === B_DEEP;
            if (!ocean || this.nPatch2.noise2(wx * (1 / 44), wz * (1 / 44)) * 0.75 + this.nPatch.noise2(wx * (1 / 9), wz * (1 / 9)) * 0.25 > -0.12) {
              blocks[(SEA_LEVEL << 8) | col] = ICE;
            }
          }
        }
      }
    }

    // 3. stone blobs (before caves so caves cut through them)
    this.blobs(cx, cz);

    // 4. caves
    this.caves(maxH);

    // 5. ores
    this.ores(cx, cz);

    // 6. trees
    this.trees();

    // 7. decoration + snow
    this.decorate(cx, cz);

    // 8. biome ids + tints
    for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) biome[(lz << 4) | lx] = bm[(lz + 1) * MAP + lx + 1];
    this.tints(tint);

    this.blocks = new Uint16Array(0);
    return { cx, cz, blocks, biome, tint };
  }

  // ========================================================================= blobs
  /** Writes `v` over blocks in this chunk matching `mask` (1 stone-like, 2 deepslate-like). */
  private vein(rng: Rng, x: number, y: number, z: number, size: number, v: number, vDeep: number, mask: number, ymin: number, ymax: number, spheres: number): void {
    const X0 = this.X0, Z0 = this.Z0, blocks = this.blocks;
    const angle = rng.next() * Math.PI;
    const spread = size / 8;
    const sx = Math.sin(angle) * spread, sz = Math.cos(angle) * spread;
    const x1 = x + sx, x2 = x - sx, z1 = z + sz, z2 = z - sz;
    const y1 = y + rng.int(3) - 1, y2 = y + rng.int(3) - 1;
    const maxR = (2 * size / 16 + 1) / 2 + 1;
    // Reject veins that cannot touch this chunk (random draws above are per-vein, so
    // skipping here never changes another vein).
    if (Math.max(x1, x2) + maxR < X0 || Math.min(x1, x2) - maxR > X0 + 16) return;
    if (Math.max(z1, z2) + maxR < Z0 || Math.min(z1, z2) - maxR > Z0 + 16) return;
    const n = spheres;
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5;
      const px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t, pz = z1 + (z2 - z1) * t;
      const rr = rng.next() * size / 16;
      const rad = ((Math.sin(Math.PI * t) + 1) * rr + 1) / 2;
      const r2 = rad * rad;
      let ax = Math.floor(px - rad), bx = Math.floor(px + rad);
      let az = Math.floor(pz - rad), bz = Math.floor(pz + rad);
      let ay = Math.floor(py - rad), by = Math.floor(py + rad);
      if (ax < X0) ax = X0; if (bx > X0 + 15) bx = X0 + 15;
      if (az < Z0) az = Z0; if (bz > Z0 + 15) bz = Z0 + 15;
      if (ay < ymin) ay = ymin; if (by > ymax) by = ymax;
      if (ax > bx || az > bz || ay > by) continue;
      for (let yy = ay; yy <= by; yy++) {
        const dy = yy + 0.5 - py, dy2 = dy * dy;
        if (dy2 >= r2) continue;
        for (let zz = az; zz <= bz; zz++) {
          const dz = zz + 0.5 - pz, dyz = dy2 + dz * dz;
          if (dyz >= r2) continue;
          const row = (yy << 8) | ((zz - Z0) << 4);
          for (let xx = ax; xx <= bx; xx++) {
            const dx = xx + 0.5 - px;
            if (dyz + dx * dx >= r2) continue;
            const idx = row | (xx - X0);
            const cur = blocks[idx];
            if (mask === 4) {
              // ore: stone-like -> stone ore, deepslate-like -> deepslate ore
              if (cur === STONE || cur === GRANITE || cur === DIORITE || cur === ANDESITE) blocks[idx] = v;
              else if (cur === DEEPSLATE || cur === TUFF) blocks[idx] = vDeep;
            } else if (((mask & 1) && cur === STONE) || ((mask & 2) && cur === DEEPSLATE)) {
              blocks[idx] = v;
            }
          }
        }
      }
    }
  }

  private blobs(cx: number, cz: number): void {
    const rng = this.rng, r2 = this.rng2;
    for (let ncz = cz - 1; ncz <= cz + 1; ncz++) {
      for (let ncx = cx - 1; ncx <= cx + 1; ncx++) {
        rng.seed(hash2i(this.seed ^ SALT_FEAT, ncx, ncz));
        for (let k = 0; k < BLOBS.length; k++) {
          const [v, mask, per, size, ymin, ymax] = BLOBS[k];
          let count = Math.floor(per);
          if (rng.next() < per - count) count++;
          for (let i = 0; i < count; i++) {
            const x = ncx * 16 + rng.int(16), z = ncz * 16 + rng.int(16);
            const y = ymin + rng.int(ymax - ymin + 1);
            r2.seed(rng.u32());
            this.vein(r2, x, y, z, size, v, v, mask, Math.max(1, ymin - 4), Math.min(255, ymax + 4), 12);
          }
        }
      }
    }
  }

  // ========================================================================== ores
  private ores(cx: number, cz: number): void {
    const rng = this.rng, r2 = this.rng2, blocks = this.blocks;
    for (let ncz = cz - 1; ncz <= cz + 1; ncz++) {
      for (let ncx = cx - 1; ncx <= cx + 1; ncx++) {
        rng.seed(hash2i(this.seed ^ SALT_ORE, ncx, ncz));
        for (let k = 0; k < ORE_VEINS.length; k++) {
          const [ore, count, size, ymin, ymax, dist] = ORE_VEINS[k];
          let n = count;
          let sz = size;
          if (ore === 6 && rng.next() < 0.5) n++; // second diamond vein
          for (let i = 0; i < n; i++) {
            const x = ncx * 16 + rng.int(16), z = ncz * 16 + rng.int(16);
            const span = ymax - ymin;
            const y = dist === 1 ? ymin + Math.floor((rng.next() + rng.next()) * 0.5 * (span + 1)) : ymin + rng.int(span + 1);
            if (ore === 6 && i > 0) sz = 4;
            r2.seed(rng.u32());
            this.vein(r2, x, y, z, sz, ORE_STONE[ore], ORE_DEEP[ore], 4, ymin, ymax, Math.max(2, Math.ceil(sz * 0.75)));
          }
        }
      }
    }
    // Emeralds: single blocks inside mountain stone (own chunk only, no cross-border need).
    rng.seed(hash2i(this.seed ^ SALT_EMERALD, cx, cz));
    const tries = 3 + rng.int(6);
    for (let i = 0; i < tries; i++) {
      const lx = rng.int(16), lz = rng.int(16), y = 5 + rng.int(96);
      const b = this.bm[(lz + 1) * MAP + lx + 1];
      if (b !== B_MOUNTAINS && b !== B_PEAKS) continue;
      const idx = (y << 8) | (lz << 4) | lx;
      const cur = blocks[idx];
      if (cur === STONE || cur === GRANITE || cur === DIORITE || cur === ANDESITE) blocks[idx] = ORE_STONE[7];
      else if (cur === DEEPSLATE || cur === TUFF) blocks[idx] = ORE_DEEP[7];
    }
  }

  // ========================================================================= caves
  private caves(maxH: number): void {
    const hm = this.hm, blocks = this.blocks, X0 = this.X0, Z0 = this.Z0;
    // carve limits per column
    let topMax = 0;
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const mi = (lz + 1) * MAP + lx + 1;
        const h = hm[mi];
        const n1 = hm[mi + 1], n2 = hm[mi - 1], n3 = hm[mi + MAP], n4 = hm[mi - MAP];
        const mn = Math.min(h, n1, n2, n3, n4);
        let top: number;
        if (mn < SEA_LEVEL) top = mn - 6;                        // never undercut water
        else if (this.isEntrance(X0 + lx, Z0 + lz) && mn >= SEA_LEVEL + 2) top = h;  // cave mouths
        else top = h - 5;
        if (top > 250) top = 250;
        this.carveTop[(lz << 4) | lx] = top;
        if (top > topMax) topMax = top;
      }
    }
    if (topMax < 1) return;
    const ny = Math.min(CAVE_NY, (Math.min(maxH, topMax) >> 2) + 2);
    // coarse noise grid: 5 x ny x 5 points, step 4
    const C = this.caveC, A = this.caveA, Bf = this.caveB;
    for (let gz = 0; gz < 5; gz++) {
      for (let gx = 0; gx < 5; gx++) {
        const wx = X0 + gx * 4, wz = Z0 + gz * 4;
        const base = (gz * 5 + gx) * CAVE_NY;
        for (let gy = 0; gy < ny; gy++) {
          const wy = gy * 4;
          C[base + gy] = this.nCheese.noise3(wx * (1 / 88), wy * (1 / 44), wz * (1 / 88)) * 0.68
            + this.nCheese2.noise3(wx * (1 / 30), wy * (1 / 22), wz * (1 / 30)) * 0.32;
          A[base + gy] = this.nSpagA.noise3(wx * (1 / 52), wy * (1 / 30), wz * (1 / 52));
          Bf[base + gy] = this.nSpagB.noise3(wx * (1 / 52), wy * (1 / 30), wz * (1 / 52));
        }
      }
    }
    const colC = this.colC, colA = this.colA, colB = this.colB;
    const thr = this.cheeseThr, w2 = this.spagW2;
    for (let lz = 0; lz < 16; lz++) {
      const gz = lz >> 2, fz = (lz & 3) * 0.25;
      for (let lx = 0; lx < 16; lx++) {
        const col = (lz << 4) | lx;
        const top = this.carveTop[col];
        if (top < 1) continue;
        const gx = lx >> 2, fx = (lx & 3) * 0.25;
        const i00 = (gz * 5 + gx) * CAVE_NY, i10 = i00 + CAVE_NY, i01 = i00 + 5 * CAVE_NY, i11 = i01 + CAVE_NY;
        const w00 = (1 - fx) * (1 - fz), w10 = fx * (1 - fz), w01 = (1 - fx) * fz, w11 = fx * fz;
        const nl = Math.min(ny, (top >> 2) + 2);
        for (let gy = 0; gy < nl; gy++) {
          colC[gy] = C[i00 + gy] * w00 + C[i10 + gy] * w10 + C[i01 + gy] * w01 + C[i11 + gy] * w11;
          colA[gy] = A[i00 + gy] * w00 + A[i10 + gy] * w10 + A[i01 + gy] * w01 + A[i11 + gy] * w11;
          colB[gy] = Bf[i00 + gy] * w00 + Bf[i10 + gy] * w10 + Bf[i01 + gy] * w01 + Bf[i11 + gy] * w11;
        }
        for (let y = 1; y <= top; y++) {
          const gy = y >> 2, t = (y & 3) * 0.25;
          const c = colC[gy] + (colC[gy + 1] - colC[gy]) * t;
          let carve = c > thr[y];
          if (!carve) {
            const a = colA[gy] + (colA[gy + 1] - colA[gy]) * t;
            if (a * a < w2[y]) {
              const b = colB[gy] + (colB[gy + 1] - colB[gy]) * t;
              carve = a * a + b * b < w2[y];
            }
          }
          if (!carve) continue;
          const idx = (y << 8) | col;
          const cur = blocks[idx];
          if (cur === BEDROCK || cur === WATER) continue;
          blocks[idx] = y <= 10 ? LAVA : AIR;
        }
      }
    }
  }

  // ========================================================================= trees
  /** Set a tree block if inside this chunk. Logs replace air, leaves, water and plants; leaves only fill air. */
  private put(x: number, y: number, z: number, v: number, log: boolean): void {
    const lx = x - this.X0, lz = z - this.Z0;
    if (lx < 0 || lx > 15 || lz < 0 || lz > 15 || y < 1 || y > 255) return;
    const idx = (y << 8) | (lz << 4) | lx;
    const cur = this.blocks[idx];
    if (log) {
      if (cur === AIR || LEAVES[cur & 1023] || cur === WATER || cur === SHORT_GRASS || cur === SNOW) this.blocks[idx] = v;
    } else if (cur === AIR) {
      this.blocks[idx] = v;
    }
  }

  /** Ground under a trunk becomes dirt (only inside this chunk). */
  private rootDirt(x: number, y: number, z: number): void {
    const lx = x - this.X0, lz = z - this.Z0;
    if (lx < 0 || lx > 15 || lz < 0 || lz > 15 || y < 1) return;
    const idx = (y << 8) | (lz << 4) | lx;
    const cur = this.blocks[idx];
    if (cur === GRASS || cur === SNOWY_GRASS || cur === PODZOL || cur === MUD) this.blocks[idx] = DIRT;
  }

  /** Tree density per 4x4-block cell for a biome at a site. */
  private treeDensity(b: number, x: number, z: number, h: number): number {
    const f = this.nForest.noise2(x * (1 / 96), z * (1 / 96));
    switch (b) {
      case B_FOREST: return 0.5 + 0.32 * f;
      case B_BIRCH: return 0.46 + 0.28 * f;
      case B_PLAINS: return f > 0.55 ? 0.12 : 0.012;
      case B_SWAMP: return 0.16 + 0.08 * f;
      case B_TUNDRA: return f > 0.4 ? 0.12 : 0.025;
      case B_MOUNTAINS: return h < 116 ? 0.13 + 0.15 * f : h < 126 ? 0.04 : 0;
      case B_CHERRY: return 0.16 + 0.08 * f;
      case B_RIVER: return 0;
      default: return 0;
    }
  }

  private trees(): void {
    const X0 = this.X0, Z0 = this.Z0, R = TREE_REACH;
    const gx0 = Math.floor((X0 - R) / 4), gx1 = Math.floor((X0 + 15 + R) / 4);
    const gz0 = Math.floor((Z0 - R) / 4), gz1 = Math.floor((Z0 + 15 + R) / 4);
    const rng = this.rng;
    for (let gz = gz0; gz <= gz1; gz++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const hsh = hash2i(this.seed ^ SALT_TREE, gx, gz);
        const tx = gx * 4 + (hsh & 3), tz = gz * 4 + ((hsh >>> 2) & 3);
        if (tx < X0 - R || tx > X0 + 15 + R || tz < Z0 - R || tz > Z0 + 15 + R) continue;
        const roll = ((hsh >>> 8) & 0xffff) / 65536;
        if (roll > 0.82) continue; // above the densest biome: skip the climate sample
        const h = this.sample(tx, tz);
        const b = this.sB;
        if (roll >= this.treeDensity(b, tx, tz, h)) continue;
        if (h < SEA_LEVEL - (b === B_SWAMP ? 1 : 0) || h > 236) continue;
        if (this.isEntrance(tx, tz)) continue;
        const T = this.sT;
        const slope = this.slopeAt(tx, tz);
        if (slope > 3) continue;
        const top = this.surface(tx, tz, h, b, slope, T);
        if (h >= SEA_LEVEL && top !== GRASS && top !== DIRT && top !== PODZOL && top !== SNOWY_GRASS && top !== COARSE_DIRT) continue;
        if (h < SEA_LEVEL && top !== MUD && top !== DIRT && top !== CLAY) continue;
        // choose the kind
        rng.seed(hsh ^ 0x9e3779b9);
        const k = rng.next();
        let kind: number;
        switch (b) {
          case B_FOREST: kind = k < 0.66 ? T_OAK : k < 0.86 ? T_BIRCH : k < 0.95 ? T_BIG_OAK : T_DARK_OAK; break;
          case B_BIRCH: kind = k < 0.82 ? T_BIRCH : k < 0.97 ? T_TALL_BIRCH : T_OAK; break;
          case B_PLAINS: kind = k < 0.88 ? T_OAK : T_BIG_OAK; break;
          case B_SWAMP: kind = T_SWAMP_OAK; break;
          case B_TUNDRA: kind = T_SPRUCE; break;
          // spruce on cool slopes, oak and birch where the mountains rise from warm lands
          case B_MOUNTAINS: kind = T > 0.25 ? (k < 0.75 ? T_OAK : T_BIRCH) : k < 0.88 ? T_SPRUCE : T_OAK; break;
          case B_CHERRY: kind = T_CHERRY; break;
          default: kind = T_OAK;
        }
        if (kind === T_DARK_OAK) {
          // a 2x2 trunk needs flat ground under all four logs
          if (this.sample(tx + 1, tz) !== h || this.sample(tx, tz + 1) !== h || this.sample(tx + 1, tz + 1) !== h) kind = T_OAK;
        }
        this.tree(kind, tx, h + 1, tz, rng);
      }
    }
  }

  private leafDisc(x: number, y: number, z: number, r: number, v: number, rng: Rng, cornerKeep: number): void {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (r > 0 && (dx === r || dx === -r) && (dz === r || dz === -r)) {
          if (rng.next() >= cornerKeep) continue;
        }
        this.put(x + dx, y, z + dz, v, false);
      }
    }
  }

  private tree(kind: number, x: number, y0: number, z: number, rng: Rng): void {
    switch (kind) {
      case T_OAK: case T_BIRCH: case T_TALL_BIRCH: case T_SWAMP_OAK: {
        const log = kind === T_OAK || kind === T_SWAMP_OAK ? OAK_LOG : BIRCH_LOG;
        const leaves = kind === T_OAK || kind === T_SWAMP_OAK ? OAK_LEAVES : BIRCH_LEAVES;
        const th = kind === T_OAK ? 4 + rng.int(3) : kind === T_BIRCH ? 5 + rng.int(3) : kind === T_TALL_BIRCH ? 8 + rng.int(3) : 5 + rng.int(3);
        const wide = kind === T_SWAMP_OAK ? 1 : 0;
        const top = y0 + th;
        for (let yy = top - 3; yy <= top; yy++) {
          const dy = yy - top;
          const r = (dy >= -1 ? 1 : 2) + wide;
          // MC style: corners of the top layer always gone, others 50/50
          this.leafDisc(x, yy, z, r, leaves, rng, dy === 0 ? 0 : 0.5);
        }
        for (let yy = y0; yy < top; yy++) this.put(x, yy, z, log, true);
        this.rootDirt(x, y0 - 1, z);
        return;
      }
      case T_SPRUCE: {
        const th = 6 + rng.int(4);
        const leafStart = 1 + rng.int(2);
        const maxR = 2 + rng.int(2);
        const top = y0 + th;
        let r = rng.int(2), lim = 1, start = 0;
        this.put(x, top + 1, z, SPRUCE_LEAVES, false);
        for (let yy = top; yy >= y0 + leafStart; yy--) {
          this.leafDisc(x, yy, z, r, SPRUCE_LEAVES, rng, 0);
          if (r >= lim) { r = start; start = 1; lim = Math.min(lim + 1, maxR); } else r++;
        }
        for (let yy = y0; yy <= top; yy++) this.put(x, yy, z, SPRUCE_LOG, true);
        this.rootDirt(x, y0 - 1, z);
        return;
      }
      case T_BIG_OAK: {
        const th = 8 + rng.int(5);
        const top = y0 + th;
        const nb = 3 + rng.int(3);
        // branches with leaf clusters at their ends
        for (let i = 0; i < nb; i++) {
          const a = rng.next() * Math.PI * 2;
          const len = 2 + rng.next() * 2.5;
          const by = y0 + Math.floor(th * (0.5 + rng.next() * 0.4));
          const ex = Math.round(x + Math.cos(a) * len), ez = Math.round(z + Math.sin(a) * len);
          const ey = by + 1 + rng.int(2);
          this.cluster(ex, ey, ez, OAK_LEAVES, rng, 2.6, 2);
          // branch logs from the trunk to the cluster
          const steps = Math.ceil(len) + 1;
          const axis = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? 1 : 2;
          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            this.put(Math.round(x + (ex - x) * t), Math.round(by + (ey - by) * t), Math.round(z + (ez - z) * t), pack(OAK_LOG, axis), true);
          }
        }
        this.cluster(x, top, z, OAK_LEAVES, rng, 2.8, 2);
        for (let yy = y0; yy < top; yy++) this.put(x, yy, z, OAK_LOG, true);
        this.rootDirt(x, y0 - 1, z);
        return;
      }
      case T_DARK_OAK: {
        const th = 6 + rng.int(3);
        const top = y0 + th;
        // flat wide canopy over a 2x2 trunk (trunk occupies x..x+1, z..z+1)
        const cxm = x + 0.5, czm = z + 0.5;
        for (let yy = top - 2; yy <= top + 1; yy++) {
          const dy = yy - top;
          const rad = dy === 1 ? 2.2 : dy === 0 ? 4.2 : dy === -1 ? 4.6 : 3.4;
          const ri = Math.ceil(rad) + 1;
          for (let dz = -ri; dz <= ri + 1; dz++) {
            for (let dx = -ri; dx <= ri + 1; dx++) {
              const ddx = x + dx - cxm, ddz = z + dz - czm;
              const d2 = ddx * ddx + ddz * ddz;
              const edge = d2 > (rad - 1) * (rad - 1);
              const keep = d2 <= rad * rad && (!edge || rng.next() < 0.6);
              if (keep) this.put(x + dx, yy, z + dz, DARK_OAK_LEAVES, false);
            }
          }
        }
        for (let yy = y0; yy <= top; yy++) {
          this.put(x, yy, z, DARK_OAK_LOG, true); this.put(x + 1, yy, z, DARK_OAK_LOG, true);
          this.put(x, yy, z + 1, DARK_OAK_LOG, true); this.put(x + 1, yy, z + 1, DARK_OAK_LOG, true);
        }
        this.rootDirt(x, y0 - 1, z); this.rootDirt(x + 1, y0 - 1, z);
        this.rootDirt(x, y0 - 1, z + 1); this.rootDirt(x + 1, y0 - 1, z + 1);
        return;
      }
      case T_CHERRY: {
        const th = 4 + rng.int(2);
        const top = y0 + th;
        const nb = 2 + rng.int(2);
        const d0 = rng.int(4);
        for (let i = 0; i < nb; i++) {
          // branches leave in different horizontal directions, then turn upwards
          const dir = (d0 + i * (nb === 2 ? 2 : 1) + (nb === 3 && i === 2 ? 1 : 0)) & 3;
          const ddx = dir === 1 ? 1 : dir === 3 ? -1 : 0, ddz = dir === 0 ? -1 : dir === 2 ? 1 : 0;
          const len = 2 + rng.int(3);
          const by = top - 2 + rng.int(2);
          const axis = ddx !== 0 ? 1 : 2;
          let bx = x, bz = z;
          for (let s = 1; s <= len; s++) {
            bx = x + ddx * s; bz = z + ddz * s;
            this.put(bx, by + (s > 1 ? 1 : 0), bz, pack(CHERRY_LOG, axis), true);
          }
          const rise = 1 + rng.int(2);
          for (let s = 2; s <= rise + 1; s++) this.put(bx, by + s, bz, CHERRY_LOG, true);
          this.cherryCanopy(bx, by + rise + 2, bz, rng);
        }
        for (let yy = y0; yy < top; yy++) this.put(x, yy, z, CHERRY_LOG, true);
        this.cherryCanopy(x, top + 1, z, rng);
        this.rootDirt(x, y0 - 1, z);
        return;
      }
    }
  }

  /** Round leaf cluster (big oak). */
  private cluster(x: number, y: number, z: number, v: number, rng: Rng, rad: number, below: number): void {
    const ri = Math.ceil(rad);
    for (let dy = -below; dy <= 1; dy++) {
      const lr = dy === 1 ? rad - 1.2 : dy === -below ? rad - 0.9 : rad;
      const lr2 = lr * lr;
      for (let dz = -ri; dz <= ri; dz++) {
        for (let dx = -ri; dx <= ri; dx++) {
          const d2 = dx * dx + dz * dz;
          if (d2 > lr2) continue;
          if (d2 > (lr - 1) * (lr - 1) && rng.next() < 0.25) continue;
          this.put(x + dx, y + dy, z + dz, v, false);
        }
      }
    }
  }

  /** Wide, slightly drooping pink canopy (cherry). */
  private cherryCanopy(x: number, y: number, z: number, rng: Rng): void {
    const R = 3;
    for (let dy = -2; dy <= 1; dy++) {
      const lr = dy === 1 ? 1.8 : dy === 0 ? 3.3 : dy === -1 ? 3.1 : 2.2;
      const lr2 = lr * lr;
      for (let dz = -R; dz <= R; dz++) {
        for (let dx = -R; dx <= R; dx++) {
          const d2 = dx * dx + dz * dz;
          if (d2 > lr2) continue;
          // hanging fringe below the canopy only at the rim
          if (dy === -2 && (d2 < 2 || rng.next() < 0.55)) continue;
          if (d2 > (lr - 1) * (lr - 1) && rng.next() < 0.2) continue;
          this.put(x + dx, y + dy, z + dz, CHERRY_LEAVES, false);
        }
      }
    }
  }

  // ==================================================================== decoration
  private decorate(cx: number, cz: number): void {
    const blocks = this.blocks, hm = this.hm, bm = this.bm, X0 = this.X0, Z0 = this.Z0;
    const seed = this.seed;
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const col = (lz << 4) | lx;
        const mi = (lz + 1) * MAP + lx + 1;
        const h = hm[mi], b = bm[mi];
        const wx = X0 + lx, wz = Z0 + lz;
        const topV = blocks[(h << 8) | col];
        if (topV === AIR || topV === LAVA) continue;    // cave mouth
        const frozen = this.frozen[col];
        const hs = hash2i(seed ^ SALT_DECO, wx, wz);
        const u1 = (hs & 0xffff) / 65536, u2 = (hs >>> 16) / 65536;
        if (h < SEA_LEVEL) {
          if (frozen) continue;
          const wd = SEA_LEVEL - h;
          if (b === B_SWAMP && wd <= 2) {
            if (u1 < 0.09 && blocks[((SEA_LEVEL + 1) << 8) | col] === AIR) blocks[((SEA_LEVEL + 1) << 8) | col] = LILY_PAD;
          } else if (wd >= 2 && wd <= 14 && (topV === SAND || topV === GRAVEL || topV === DIRT || topV === CLAY)) {
            const g = this.nGrass.noise2(wx * (1 / 14), wz * (1 / 14));
            const p = b === B_RIVER ? 0.22 : 0.12 + 0.3 * smoothstep(-0.2, 0.6, g);
            if (u1 < p && blocks[((h + 1) << 8) | col] === WATER) blocks[((h + 1) << 8) | col] = SEAGRASS;
          }
          continue;
        }
        const above = ((h + 1) << 8) | col;
        if (h >= 255 || blocks[above] !== AIR) continue;
        if (frozen) continue; // snow pass below
        // sugar cane: ground at the water line with water beside it
        if (h === SEA_LEVEL && (topV === GRASS || topV === SAND || topV === DIRT || topV === PODZOL || topV === MUD)) {
          if (this.waterBeside(mi, lx, lz) && u1 < 0.22 && this.nFlower.noise2(wx * (1 / 20), wz * (1 / 20)) > -0.3) {
            const ch = 1 + ((hs >>> 20) % 3);
            for (let k = 1; k <= ch && blocks[((h + k) << 8) | col] === AIR; k++) blocks[((h + k) << 8) | col] = SUGAR_CANE;
            continue;
          }
        }
        if (topV === GRASS) {
          this.plant(b, wx, wz, h, col, u1, u2);
        } else if (topV === PODZOL || topV === COARSE_DIRT) {
          if (u1 < 0.1) blocks[above] = FERN;
          else if (u1 < 0.15) blocks[above] = SHORT_GRASS;
          else if (u1 < 0.16) blocks[above] = BROWN_MUSHROOM;
        } else if (topV === SAND && b === B_DESERT) {
          if (u1 < 0.012) blocks[above] = DEAD_BUSH;
        } else if (topV === MUD && b === B_SWAMP) {
          if (u1 < 0.05) blocks[above] = SHORT_GRASS;
        }
      }
    }
    this.cacti(cx, cz);
    this.pumpkins(cx, cz);
    this.snowCover();
  }

  private waterBeside(mi: number, lx: number, lz: number): boolean {
    // Neighbour columns below the water line hold water at y = SEA_LEVEL unless frozen.
    const hm = this.hm;
    const ok = (m: number, nlx: number, nlz: number) => {
      if (hm[m] >= SEA_LEVEL) return false;
      if (nlx >= 0 && nlx < 16 && nlz >= 0 && nlz < 16) return this.blocks[(SEA_LEVEL << 8) | (nlz << 4) | nlx] === WATER;
      return this.tm[m] >= TUNDRA_T;
    };
    return ok(mi + 1, lx + 1, lz) || ok(mi - 1, lx - 1, lz) || ok(mi + MAP, lx, lz + 1) || ok(mi - MAP, lx, lz - 1);
  }

  private shaded(col: number, h: number): boolean {
    const blocks = this.blocks;
    for (let y = h + 2; y < Math.min(256, h + 18); y++) if (LEAVES[blocks[(y << 8) | col] & 1023]) return true;
    return false;
  }

  private plant(b: number, wx: number, wz: number, h: number, col: number, u1: number, u2: number): void {
    const blocks = this.blocks;
    const above = ((h + 1) << 8) | col;
    const gn = this.nGrass.noise2(wx * (1 / 19), wz * (1 / 19));
    const fn = this.nFlower.noise2(wx * (1 / 26), wz * (1 / 26));
    let grass = 0, fern = 0, flower = 0, mush = 0;
    switch (b) {
      case B_PLAINS: grass = 0.22 + 0.22 * gn; flower = fn > 0.4 ? 0.12 : 0.006; break;
      case B_FOREST: grass = 0.14 + 0.1 * gn; fern = 0.02; flower = fn > 0.5 ? 0.05 : 0.005; mush = 0.03; break;
      case B_BIRCH: grass = 0.16 + 0.1 * gn; fern = 0.015; flower = fn > 0.45 ? 0.06 : 0.006; mush = 0.015; break;
      case B_SWAMP: grass = 0.16 + 0.08 * gn; fern = 0.03; flower = 0.012; mush = 0.02; break;
      case B_CHERRY: grass = 0.28 + 0.12 * gn; flower = fn > 0.2 ? 0.06 : 0.01; break;
      case B_MOUNTAINS: grass = 0.2 + 0.12 * gn; fern = h < 118 ? 0.05 : 0.01; flower = fn > 0.3 ? 0.07 : 0.004; break;
      case B_RIVER: case B_BEACH: grass = 0.1; flower = 0.003; break;
      default: grass = 0.15;
    }
    if (u1 < flower) {
      const list = FLOWERS[b] ?? FLOWERS[B_PLAINS];
      // Each patch is dominated by one or two species, with a few strays.
      let k = Math.floor((this.nFlowerType.noise2(wx * (1 / 40), wz * (1 / 40)) * 0.5 + 0.5) * list.length);
      if (u2 < 0.2) k = Math.floor(u2 * 5 * list.length);
      blocks[above] = list[Math.max(0, Math.min(list.length - 1, k))];
      return;
    }
    if (mush > 0 && u1 < flower + mush && this.shaded(col, h)) {
      blocks[above] = u2 < 0.6 ? BROWN_MUSHROOM : RED_MUSHROOM;
      return;
    }
    if (u1 < flower + mush + fern) { blocks[above] = FERN; return; }
    if (u1 < flower + mush + fern + grass) blocks[above] = u2 < 0.08 && b !== B_PLAINS ? FERN : SHORT_GRASS;
  }

  private cacti(cx: number, cz: number): void {
    const blocks = this.blocks, hm = this.hm, bm = this.bm;
    for (let gz = 0; gz < 4; gz++) {
      for (let gx = 0; gx < 4; gx++) {
        const hs = hash2i(this.seed ^ SALT_CACTUS, cx * 4 + gx, cz * 4 + gz);
        if ((hs & 0xffff) / 65536 > 0.08) continue;
        const lx = gx * 4 + 1 + ((hs >>> 16) & 1), lz = gz * 4 + 1 + ((hs >>> 17) & 1);
        const mi = (lz + 1) * MAP + lx + 1;
        const h = hm[mi];
        if (bm[mi] !== B_DESERT || h < SEA_LEVEL + 1 || h > 240) continue;
        const col = (lz << 4) | lx;
        if (blocks[(h << 8) | col] !== SAND) continue;
        if (hm[mi + 1] > h || hm[mi - 1] > h || hm[mi + MAP] > h || hm[mi - MAP] > h) continue;
        const ch = 1 + ((hs >>> 18) % 3);
        for (let k = 1; k <= ch; k++) {
          const idx = ((h + k) << 8) | col;
          if (blocks[idx] !== AIR && blocks[idx] !== DEAD_BUSH) break;
          blocks[idx] = CACTUS;
        }
      }
    }
  }

  private pumpkins(cx: number, cz: number): void {
    const hs = hash2i(this.seed ^ SALT_PUMPKIN, cx, cz);
    if ((hs & 0xffff) / 65536 > 0.035) return;
    const blocks = this.blocks, hm = this.hm, bm = this.bm;
    const pcx = 4 + ((hs >>> 16) & 7), pcz = 4 + ((hs >>> 19) & 7);
    const r = this.rng2.seed(hs);
    for (let dz = -3; dz <= 3; dz++) {
      for (let dx = -3; dx <= 3; dx++) {
        const take = r.next() < 0.22;
        const lx = pcx + dx, lz = pcz + dz;
        if (!take) continue;
        const mi = (lz + 1) * MAP + lx + 1;
        const b = bm[mi];
        if (b !== B_PLAINS && b !== B_FOREST && b !== B_BIRCH && b !== B_MOUNTAINS) continue;
        const h = hm[mi], col = (lz << 4) | lx;
        if (blocks[(h << 8) | col] !== GRASS) continue;
        const idx = ((h + 1) << 8) | col;
        if (blocks[idx] === AIR || blocks[idx] === SHORT_GRASS) blocks[idx] = PUMPKIN;
      }
    }
  }

  /** Snow layers on everything in frozen columns (ground, leaves), snowy grass under them. */
  private snowCover(): void {
    const blocks = this.blocks, hm = this.hm;
    for (let col = 0; col < 256; col++) {
      if (!this.frozen[col]) continue;
      const lx = col & 15, lz = col >> 4;
      const h = hm[(lz + 1) * MAP + lx + 1];
      let y = Math.min(254, h + 40);
      while (y > 0 && blocks[(y << 8) | col] === AIR) y--;
      const v = blocks[(y << 8) | col];
      if (v === GRASS) blocks[(y << 8) | col] = SNOWY_GRASS;
      if (v === WATER || v === ICE || v === PACKED_ICE || v === LAVA || v === SNOW || v === SNOW_BLOCK || v === CACTUS) continue;
      // steep rock faces stay bare, like real mountains
      if (y === h && this.slopes[col] >= 5 && v !== GRASS) continue;
      if (OCCLUDES[v & 1023] || LEAVES[v & 1023]) {
        if (y < 255 && blocks[((y + 1) << 8) | col] === AIR) blocks[((y + 1) << 8) | col] = SNOW;
      }
      // the ground under a snowy tree canopy is snowy too
      if (y > h) {
        const g = (h << 8) | col;
        if (blocks[g] === GRASS) blocks[g] = SNOWY_GRASS;
      }
    }
  }

  // ========================================================================= tints
  private tints(out: Uint8Array): void {
    const g = this.tintGrid, bl = this.tintBlur;
    const gx0 = this.X0 - 8, gz0 = this.Z0 - 8;
    for (let j = 0; j < TG; j++) {
      for (let i = 0; i < TG; i++) {
        const x = gx0 + i * 4, z = gz0 + j * 4;
        const h = this.sample(x, z);
        const b = this.sB, T = this.sT;
        const base = BIOME_TINT[b];
        const o = (j * TG + i) * 9;
        for (let k = 0; k < 9; k++) g[o + k] = base[k];
        if (b === B_OCEAN || b === B_DEEP || b === B_RIVER || b === B_BEACH || b === B_STONY) {
          // ocean temperature: cold deep blue .. warm turquoise
          const cold = smoothstep(-0.15, -0.55, T), warm = smoothstep(0.35, 0.7, T);
          for (let k = 0; k < 3; k++) {
            g[o + 6 + k] = g[o + 6 + k] + (COLD_WATER[k] - g[o + 6 + k]) * cold;
            g[o + 6 + k] = g[o + 6 + k] + (WARM_WATER[k] - g[o + 6 + k]) * warm * (b === B_DEEP ? 0.6 : 1);
          }
        }
        // altitude and cold climate make vegetation bluish, heat makes it yellowish
        const chill = Math.max(smoothstep(95, 150, h), smoothstep(TUNDRA_T + 0.25, TUNDRA_T, T)) * (b === B_SWAMP ? 0 : 1);
        if (chill > 0) {
          for (let k = 0; k < 3; k++) {
            g[o + k] += (SNOWY_GRASS_TINT[k] - g[o + k]) * chill;
            g[o + 3 + k] += (SNOWY_FOLIAGE[k] - g[o + 3 + k]) * chill;
          }
        }
        // subtle humidity variation inside a biome
        const hv = this.sHum * 6;
        g[o] -= hv * 0.5; g[o + 1] += hv * 0.3; g[o + 3] -= hv * 0.5; g[o + 4] += hv * 0.3;
      }
    }
    // 3x3 box blur over the grid (interior points)
    for (let j = 1; j < TG - 1; j++) {
      for (let i = 1; i < TG - 1; i++) {
        const o = (j * TG + i) * 9;
        for (let k = 0; k < 9; k++) {
          let s = 0;
          for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) s += g[((j + dj) * TG + i + di) * 9 + k];
          bl[o + k] = s / 9;
        }
      }
    }
    // bilinear per column
    for (let lz = 0; lz < 16; lz++) {
      const u = (lz + 8) / 4, j = Math.floor(u), fj = u - j;
      for (let lx = 0; lx < 16; lx++) {
        const v = (lx + 8) / 4, i = Math.floor(v), fi = v - i;
        const o00 = (j * TG + i) * 9, o10 = o00 + 9, o01 = o00 + TG * 9, o11 = o01 + 9;
        const w00 = (1 - fi) * (1 - fj), w10 = fi * (1 - fj), w01 = (1 - fi) * fj, w11 = fi * fj;
        const o = ((lz << 4) | lx) * 9;
        for (let k = 0; k < 9; k++) {
          const c = bl[o00 + k] * w00 + bl[o10 + k] * w10 + bl[o01 + k] * w01 + bl[o11 + k] * w11;
          out[o + k] = c < 0 ? 0 : c > 255 ? 255 : Math.round(c);
        }
      }
    }
  }

  // ========================================================================= spawn
  /** Dry land near (0,0), preferring plains/forest; never ocean or river. */
  findSpawn(): { x: number; z: number } {
    if (this.spawn) return { x: this.spawn.x, z: this.spawn.z };
    const STEP = 8;
    let fallback: { x: number; z: number } | null = null;
    let found: { x: number; z: number } | null = null;
    const good = (b: number) => b === B_PLAINS || b === B_FOREST;
    const ok = (b: number) => b !== B_OCEAN && b !== B_DEEP && b !== B_RIVER && b !== B_SWAMP;
    for (let ring = 0; ring <= 400 && !found; ring++) {
      for (let k = 0; k < Math.max(1, ring * 8) && !found; k++) {
        // walk the square ring of radius `ring`
        let i: number, j: number;
        const side = ring * 2;
        if (ring === 0) { i = 0; j = 0; }
        else if (k < side) { i = -ring + k; j = -ring; }
        else if (k < side * 2) { i = ring; j = -ring + (k - side); }
        else if (k < side * 3) { i = ring - (k - side * 2); j = ring; }
        else { i = -ring; j = ring - (k - side * 3); }
        const x = i * STEP, z = j * STEP;
        const h = this.sample(x, z);
        const b = this.sB;
        if (h < SEA_LEVEL + 1 || h > 140 || !ok(b) || this.isEntrance(x, z)) continue;
        if (this.slopeAt(x, z) > 2) continue;
        if (good(b)) {
          const s = this.verifySpawn(x, z);
          if (s) found = s;
        } else if (!fallback && ring > 0) {
          fallback = this.verifySpawn(x, z);
        }
        if (!found && fallback && ring > 128) break;
      }
      if (!found && fallback && ring > 128) break;
    }
    const r = found ?? fallback ?? { x: 0, z: 0 };
    this.spawn = r;
    return { x: r.x, z: r.z };
  }

  /** Check the real generated column (trees, caves) and pick a free dry spot in that chunk. */
  private verifySpawn(x: number, z: number): { x: number; z: number } | null {
    const cx = Math.floor(x / 16), cz = Math.floor(z / 16);
    const g = this.generate(cx, cz);
    const bl = g.blocks;
    let best: { x: number; z: number } | null = null, bestD = 1e9;
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const wx = cx * 16 + lx, wz = cz * 16 + lz;
        const h = this.sample(wx, wz);
        if (h < SEA_LEVEL + 1 || h > 250 || this.sB === B_RIVER || this.sB === B_OCEAN || this.sB === B_DEEP) continue;
        const col = (lz << 4) | lx;
        const ground = bl[(h << 8) | col] & 1023;
        if (!OCCLUDES[ground] || LEAVES[ground]) continue;
        let free = true;
        for (let y = h + 1; y <= h + 3; y++) {
          const v = bl[(y << 8) | col] & 1023;
          if (SOLID[v] || FLUID[v]) { free = false; break; }
        }
        if (!free) continue;
        const d = (wx - x) * (wx - x) + (wz - z) * (wz - z);
        if (d < bestD) { bestD = d; best = { x: wx, z: wz }; }
      }
    }
    return best;
  }
}
