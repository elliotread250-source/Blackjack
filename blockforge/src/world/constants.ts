// World dimensions, indexing and direction tables shared by every module.

export const CHUNK = 16;          // chunk width/depth in blocks
export const HEIGHT = 256;        // world height (y 0..255)
export const SECTIONS = 16;       // 16x16x16 sections per column
export const SEA_LEVEL = 62;      // water surface sits at y = 62
export const COLUMN_VOLUME = CHUNK * CHUNK * HEIGHT; // 65536

// Index of a block inside a column: y-major so each section is contiguous (4096 entries).
export const colIndex = (x: number, y: number, z: number) => (y << 8) | (z << 4) | x;
// Index of a column (x,z) inside 16x16 per-column arrays (biome, tint).
export const xzIndex = (x: number, z: number) => (z << 4) | x;

// Numeric keys (no string allocation in hot paths).
export const chunkKey = (cx: number, cz: number) => (cx + 32768) * 65536 + (cz + 32768);
export const chunkKeyX = (k: number) => Math.floor(k / 65536) - 32768;
export const chunkKeyZ = (k: number) => (k % 65536) - 32768;
export const sectionKey = (cx: number, sy: number, cz: number) => chunkKey(cx, cz) * 16 + sy;
export const sectionKeyY = (k: number) => k % 16;
export const sectionKeyChunk = (k: number) => Math.floor(k / 16);

// Horizontal directions: 0 north (-Z), 1 east (+X), 2 south (+Z), 3 west (-X).
export const H_DX = [0, 1, 0, -1];
export const H_DZ = [-1, 0, 1, 0];
// Faces: 0 +X east, 1 -X west, 2 +Y up, 3 -Y down, 4 +Z south, 5 -Z north.
export const FACE_DX = [1, -1, 0, 0, 0, 0];
export const FACE_DY = [0, 0, 1, -1, 0, 0];
export const FACE_DZ = [0, 0, 0, 0, 1, -1];
export const OPPOSITE_FACE = [1, 0, 3, 2, 5, 4];
export const H_TO_FACE = [5, 0, 4, 1];           // horizontal dir -> face index
export const FACE_TO_H = [1, 3, -1, -1, 2, 0];   // face index -> horizontal dir (-1 for up/down)

// Padded section used by the mesher: 18x18x18 cells, local coords -1..16.
export const PAD = 18;
export const PAD_VOLUME = PAD * PAD * PAD;
export const padIndex = (x: number, y: number, z: number) => ((y + 1) * PAD + (z + 1)) * PAD + (x + 1);
export const padXZ = (x: number, z: number) => (z + 1) * PAD + (x + 1); // into 18x18 per-column arrays

// Day length in seconds (one full day/night cycle).
export const DAY_LENGTH = 1200;
