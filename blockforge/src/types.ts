// Shared data shapes passed between modules and workers.

/** A freshly generated (or loaded) column of 16x256x16 blocks. */
export interface GenChunk {
  cx: number;
  cz: number;
  /** packed blocks (id | meta << 10), index colIndex(x,y,z) */
  blocks: Uint16Array;
  /** biome id per column, index xzIndex(x,z) */
  biome: Uint8Array;
  /** 256 columns x 9 bytes: grass rgb, foliage rgb, water rgb; index xzIndex(x,z)*9 */
  tint: Uint8Array;
}

/** Input to the mesher: one 16^3 section plus a one-block border from its neighbours. */
export interface PaddedSection {
  /** packed blocks, PAD_VOLUME entries, index padIndex(x,y,z), x/y/z in -1..16 */
  blocks: Uint16Array;
  /** packed light (sky << 4 | block), same indexing */
  light: Uint8Array;
  /** 18x18 columns x 9 bytes (grass, foliage, water rgb), index padXZ(x,z)*9 */
  tint: Uint8Array;
}

/**
 * Vertex format (all attributes WebGL1-friendly):
 *  position Int16 x3   section-local block coords * 256 (0..4096). Mesh scale is 1/256.
 *  auv      Uint16 x2  atlas pixel coords (0..ATLAS_SIZE), shader divides by atlas size
 *  atint    Uint8 x4 normalized  rgb tint, a = tint mode (255 = mask by texture alpha [opaque layer only], 0 = whole face)
 *  alight   Uint8 x4 normalized  x = sky light * 17, y = block light * 17, z = shade (face shade * AO) * 255,
 *                                w = flags: bits 0-2 face (0..5, 6 = no normal), bits 3-4 wave (0 none,
 *                                1 plant, 2 leaves, 3 liquid surface), bit 5 = vertex is at the top of a plant
 */
export interface MeshLayer {
  positions: Int16Array;
  uvs: Uint16Array;
  tints: Uint8Array;
  lights: Uint8Array;
  indices: Uint16Array | Uint32Array;
  vertexCount: number;
  indexCount: number;
}
/** Index = render layer (0 opaque, 1 cutout, 2 translucent, 3 water, 4 lava). */
export type SectionMesh = (MeshLayer | null)[];

export interface MeshOptions {
  fancyLeaves: boolean;
  smoothLighting: boolean;
}

/** Axis-aligned box in block units relative to the block's min corner. */
export type Box = [number, number, number, number, number, number];

export interface RayHit {
  /** block coordinates of the hit block */
  x: number; y: number; z: number;
  /** face index 0..5 that was hit (see constants.ts) */
  face: number;
  /** exact hit point in world space */
  px: number; py: number; pz: number;
  dist: number;
  /** packed block value */
  block: number;
}

export interface PlayerState {
  x: number; y: number; z: number;
  yaw: number; pitch: number;
  flying: boolean;
}

export interface WorldMeta {
  id: string;
  name: string;
  seed: number;
  created: number;
  lastPlayed: number;
  player: PlayerState | null;
  hotbar: number[];        // block ids (0 = empty), stored by name in `hotbarNames` for safety
  hotbarNames?: string[];
  selected: number;
  dayTime: number;         // 0..1 (0 sunrise, .25 noon, .5 sunset, .75 midnight)
  timeMode: TimeMode;
  palette: string[];       // block names by id at save time, used to remap saved chunks
  version: 1;
}

export type TimeMode = 'cycle' | 'sunrise' | 'noon' | 'sunset' | 'midnight';
