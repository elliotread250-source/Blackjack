// Everything visible is built from boxes in code and merged into one BufferGeometry per object,
// with flat per-face normals and per-vertex colours, so a whole lane or a car is one draw call.
import * as THREE from 'three';
import { characterBoxes } from './characters.js';
import { HALF, COLS, TRAIN_CAR } from './logic.js';

const tmp = new THREE.Color();

// Box: [cx, y0, cz, w, h, d, colour, shade?]  (bottom-anchored), in world units.
export function mergeBoxes(boxes, scale = 1) {
  const n = boxes.length;
  const pos = new Float32Array(n * 24 * 3);
  const nor = new Float32Array(n * 24 * 3);
  const col = new Float32Array(n * 24 * 3);
  const idx = new (n * 24 > 65535 ? Uint32Array : Uint16Array)(n * 36);
  let v = 0, ii = 0;
  for (const b of boxes) {
    const [cx, y0, cz, w, h, d, c, shade = 1] = b;
    const x0 = (cx - w / 2) * scale, x1 = (cx + w / 2) * scale;
    const yA = y0 * scale, yB = (y0 + h) * scale;
    const z0 = (cz - d / 2) * scale, z1 = (cz + d / 2) * scale;
    tmp.setHex(c);
    const r = tmp.r * shade, g = tmp.g * shade, bl = tmp.b * shade;
    // faces: +x, -x, +y, -y, +z, -z
    const faces = [
      [1, 0, 0, [x1, yA, z1], [x1, yA, z0], [x1, yB, z0], [x1, yB, z1]],
      [-1, 0, 0, [x0, yA, z0], [x0, yA, z1], [x0, yB, z1], [x0, yB, z0]],
      [0, 1, 0, [x0, yB, z1], [x1, yB, z1], [x1, yB, z0], [x0, yB, z0]],
      [0, -1, 0, [x0, yA, z0], [x1, yA, z0], [x1, yA, z1], [x0, yA, z1]],
      [0, 0, 1, [x0, yA, z1], [x1, yA, z1], [x1, yB, z1], [x0, yB, z1]],
      [0, 0, -1, [x1, yA, z0], [x0, yA, z0], [x0, yB, z0], [x1, yB, z0]],
    ];
    for (const f of faces) {
      for (let k = 0; k < 4; k++) {
        const p = f[3 + k];
        pos[v * 3] = p[0]; pos[v * 3 + 1] = p[1]; pos[v * 3 + 2] = p[2];
        nor[v * 3] = f[0]; nor[v * 3 + 1] = f[1]; nor[v * 3 + 2] = f[2];
        col[v * 3] = r; col[v * 3 + 1] = g; col[v * 3 + 2] = bl;
        v++;
      }
      const s = v - 4;
      idx[ii++] = s; idx[ii++] = s + 1; idx[ii++] = s + 2;
      idx[ii++] = s; idx[ii++] = s + 2; idx[ii++] = s + 3;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  return geo;
}

// ---------------------------------------------------------------- themes
export const THEMES = {
  classic: {
    sky: 0x9fd6f0, grass: [0xa6e35f, 0x9bd957], grassSide: 0x6f9e3a, road: 0x5b5f6b, roadSide: 0x43464f, line: 0xf3f3f3,
    water: 0x47b9f5, waterDeep: 0x2f9fe0, rail: 0x8d8077, tie: 0x6b4a33, steel: 0xb8bcc6,
    trunk: 0x8a5a33, leaves: [0x5fbf3c, 0x4fae34, 0x6ccc48, 0x7fd65a], rock: [0xa3a7ad, 0x8e9298],
    log: 0x9a6236, logEnd: 0xd8a56c, pad: 0x58b84a, hemi: [0xffffff, 0x8fa7b8, 1.35], sun: 2.4, fog: 0x9fd6f0,
  },
  snow: {
    sky: 0xcfe6f5, grass: [0xf4f8fb, 0xe8f0f6], grassSide: 0xbacbd9, road: 0x6c7280, roadSide: 0x4f5462, line: 0xf9fbff,
    water: 0x7fd0f2, waterDeep: 0x5fb6e0, rail: 0x9a9aa3, tie: 0x5f4535, steel: 0xc9ced8,
    trunk: 0x6b4a33, leaves: [0x2f7d5a, 0x2a6e50, 0x3a8c66, 0x2f7d5a], snowcap: 0xffffff, rock: [0xb6c0cc, 0xa3adb8],
    log: 0x8a5a3a, logEnd: 0xd9b48a, pad: 0xbfe8ff, ice: true, hemi: [0xffffff, 0x9fb3c8, 1.45], sun: 2.2, fog: 0xdbeaf5,
  },
  autumn: {
    sky: 0xf6d7a8, grass: [0xd9c35a, 0xccb64f], grassSide: 0x9a7f32, road: 0x5f5a5c, roadSide: 0x464143, line: 0xf7efe0,
    water: 0x3faad9, waterDeep: 0x2a8fbf, rail: 0x8f7a6a, tie: 0x5f3f2a, steel: 0xb7b2ae,
    trunk: 0x6e4428, leaves: [0xe8742c, 0xd9452b, 0xf2b53a, 0xc9612a], rock: [0xa59a8f, 0x8f857b],
    log: 0x8d5530, logEnd: 0xdaa26a, pad: 0x8fb84a, hemi: [0xfff3e0, 0xa08a78, 1.35], sun: 2.4, fog: 0xf3d9b0,
  },
  night: {
    sky: 0x1d2a4a, grass: [0x3d7a55, 0x37704e], grassSide: 0x24503a, road: 0x3c3f4c, roadSide: 0x2a2c36, line: 0xd8d8a0,
    water: 0x2a5f9e, waterDeep: 0x1f4d85, rail: 0x5f5a66, tie: 0x3f3030, steel: 0x9aa0b4,
    trunk: 0x4f3a2a, leaves: [0x2f6e5a, 0x2a6152, 0x377a66, 0x2b5f4d], rock: [0x6e7486, 0x5f6577],
    log: 0x7a5236, logEnd: 0xb08a62, pad: 0x3f8f5a, hemi: [0xb8c8ff, 0x55557a, 1.35], sun: 1.9, fog: 0x1d2a4a,
  },
  candy: {
    sky: 0xffd6ec, grass: [0xffc4e1, 0xffb8da], grassSide: 0xe58fbc, road: 0x8a76b8, roadSide: 0x6c5a99, line: 0xfff6a8,
    water: 0x8fe3f0, waterDeep: 0x6fd0e3, rail: 0xc9a6d8, tie: 0x8a5ab0, steel: 0xffffff,
    trunk: 0xfff4f8, leaves: [0xff6fa8, 0x8fe39a, 0xffd36f, 0xa98bff], rock: [0xffffff, 0xf0e6ff],
    log: 0xc98a5a, logEnd: 0xffe3b8, pad: 0x9ff0b0, candy: true, hemi: [0xffffff, 0xd8a8c8, 1.45], sun: 2.2, fog: 0xffdcef,
  },
  desert: {
    sky: 0xffe0a8, grass: [0xf0d28a, 0xe8c87c], grassSide: 0xc29a52, road: 0x6e6058, roadSide: 0x544840, line: 0xfff1c8,
    water: 0x3fc2d9, waterDeep: 0x2aa8c2, rail: 0xa08a70, tie: 0x6b4a33, steel: 0xc8c0b4,
    trunk: 0x4f9a3f, leaves: [0x5cae48, 0x4f9a3f, 0x68b852, 0x5cae48], rock: [0xd9a066, 0xc48a52], style: 'cactus',
    flowers: [0xff7a8a, 0xffd23f, 0xb9864a], flowerStyle: 'pebble',
    log: 0x9a6236, logEnd: 0xe8b77c, pad: 0x6cc4a0, hemi: [0xfff4dc, 0xc8a070, 1.45], sun: 2.6, fog: 0xffe2b0,
  },
  spooky: {
    sky: 0x3a2350, grass: [0x4f5a3a, 0x475234], grassSide: 0x2f3824, road: 0x34303c, roadSide: 0x24212c, line: 0xff9a2a,
    water: 0x3f6a5a, waterDeep: 0x2f5548, rail: 0x5a5060, tie: 0x3a2a24, steel: 0x8a8a98,
    trunk: 0x3a2a24, leaves: [0x2a2228, 0x332a30], rock: [0x8a8a94, 0x74747e], style: 'spooky',
    flowers: [0xff8a1d, 0xffe08a, 0x9a5ad8], flowerStyle: 'pumpkin',
    log: 0x5a4636, logEnd: 0x9a7a5a, pad: 0x5a7a4a, hemi: [0xc8b0ff, 0x4a3a5a, 1.3], sun: 1.7, fog: 0x3a2350,
  },
  jungle: {
    sky: 0xa8e8c8, grass: [0x4fbf4a, 0x46b242], grassSide: 0x2f7a2f, road: 0x5a5a50, roadSide: 0x40403a, line: 0xf2f2d8,
    water: 0x2fb8a8, waterDeep: 0x1f9a8c, rail: 0x7a6a5a, tie: 0x5a3a24, steel: 0xb4b8b0,
    trunk: 0x8a6236, leaves: [0x2fa83a, 0x3fbf48, 0x25922f, 0x52c85a], rock: [0x8a9a7a, 0x768668], style: 'palm',
    flowers: [0xff4f7a, 0xffa82a, 0xb85aff], flowerStyle: 'fern',
    log: 0x7a5232, logEnd: 0xc89a62, pad: 0x3fae4a, hemi: [0xf0fff0, 0x6a9a7a, 1.35], sun: 2.4, fog: 0xa8e8c8,
  },
  space: {
    sky: 0x14112e, grass: [0x6a6a86, 0x62627e], grassSide: 0x3f3f58, road: 0x2a2840, roadSide: 0x1c1a2e, line: 0x7af0ff,
    water: 0x7a3fd8, waterDeep: 0x6430c0, rail: 0x4a4a64, tie: 0x2a2a40, steel: 0x9ad8ff,
    trunk: 0x8a5aff, leaves: [0x6af0ff, 0xff6ad8, 0x9a7aff, 0x6aff9a], rock: [0x8a8aa4, 0x74748e], style: 'crystal',
    flowers: [0x6af0ff, 0xff6ad8, 0xfff06a], flowerStyle: 'glow',
    log: 0x5a5a74, logEnd: 0x9aa0c8, pad: 0x9a7aff, hemi: [0xc8d0ff, 0x4a3a7a, 1.4], sun: 1.9, fog: 0x14112e,
  },
};
// The order the world cycles through on a long run (starting from the character's own world).
export const BIOME_ORDER = ['classic', 'autumn', 'desert', 'jungle', 'snow', 'spooky', 'night', 'candy', 'space'];
export const BIOME_NAMES = { classic: 'Meadow', autumn: 'Autumn Woods', desert: 'Desert', jungle: 'Jungle', snow: 'Snowfields', spooky: 'Spooky Hollow', night: 'Night Town', candy: 'Candy Land', space: 'Outer Space' };
for (const [k, f, st] of [['classic', [0xff6a8a, 0xffd23f, 0xffffff, 0xa86aff], 'flower'], ['snow', [0xffffff, 0xe8f4ff], 'mound'], ['autumn', [0xe8742c, 0xd9452b, 0xf2b53a], 'leaves'], ['night', [0x6affd8, 0xb8ff6a, 0x8ad8ff], 'glow'], ['candy', [0xff6fa8, 0x8fe39a, 0xffd36f, 0xa98bff], 'gumdrop']]) {
  THEMES[k].flowers = f; THEMES[k].flowerStyle = st;
}

const CAR_COLORS = [0xe8463b, 0x3b8de8, 0xf5c430, 0x40c46a, 0xff8a2a, 0xa85ae8, 0xf2f2f2, 0x30c8c8];

function shadeHex(hex, f) {
  tmp.setHex(hex);
  tmp.r *= f; tmp.g *= f; tmp.b *= f;
  return tmp.getHex();
}

// ---------------------------------------------------------------- lanes
// One merged mesh per lane: ground slab, scenery and markings. Lane centre is at z=0 locally.
export function laneBoxes(lane, next, prev, th) {
  const B = [];
  const edge = COLS + 0.5;
  const span = (y0, h, cBright, cDark, extra = 0) => {
    B.push([0, y0, 0, edge * 2, h, 1 + extra, cBright]);
    B.push([-(edge + (HALF - edge) / 2), y0, 0, HALF - edge, h, 1 + extra, cDark]);
    B.push([edge + (HALF - edge) / 2, y0, 0, HALF - edge, h, 1 + extra, cDark]);
  };
  const dark = 0.66;
  if (lane.type === 'grass') {
    const g = th.grass[((lane.row % 2) + 2) % 2];
    span(-0.7, 0.7, g, shadeHex(g, dark));
    for (const d of lane.deco) treeOrRock(B, d, th, Math.abs(d.c) > COLS ? dark : 1);
    for (const f of lane.flowers || []) flowerBoxes(B, f, th);
  } else if (lane.type === 'road') {
    span(-0.8, 0.68, th.road, shadeHex(th.road, 0.72));
    if (next && next.type === 'road') {
      for (let x = -HALF + 0.6; x < HALF; x += 1.7) B.push([x, -0.12, -0.5, 0.8, 0.02, 0.09, th.line, Math.abs(x) > edge ? 0.66 : 1]);
    }
    if (!prev || prev.type !== 'road') B.push([0, -0.12, 0.46, HALF * 2, 0.03, 0.06, shadeHex(th.road, 1.25)]);
    if (!next || next.type !== 'road') B.push([0, -0.12, -0.46, HALF * 2, 0.03, 0.06, shadeHex(th.road, 1.25)]);
  } else if (lane.type === 'river') {
    span(-0.9, 0.58, th.water, shadeHex(th.water, 0.7));
    // a few lighter ripple streaks
    let seed = (lane.row * 7919) >>> 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
    for (let i = 0; i < 9; i++) {
      const x = -HALF + rnd() * HALF * 2;
      B.push([x, -0.32, -0.35 + rnd() * 0.7, 0.4 + rnd() * 0.6, 0.01, 0.05, shadeHex(th.water, 1.18)]);
    }
  } else if (lane.type === 'rail') {
    span(-0.75, 0.66, th.rail, shadeHex(th.rail, 0.72));
    for (let x = -HALF + 0.3; x < HALF; x += 0.7) B.push([x, -0.09, 0, 0.26, 0.06, 0.92, th.tie, Math.abs(x) > edge ? 0.7 : 1]);
    B.push([0, -0.06, -0.27, HALF * 2, 0.1, 0.07, th.steel]);
    B.push([0, -0.06, 0.27, HALF * 2, 0.1, 0.07, th.steel]);
    // signal post on the left of the playable strip
    const sx = -(COLS + 0.9);
    B.push([sx, -0.09, 0.42, 0.1, 1.2, 0.1, 0x55565c]);
    B.push([sx, 1.0, 0.42, 0.62, 0.32, 0.16, 0x2b2c31]);
    B.push([sx, 0.75, 0.42, 0.5, 0.06, 0.5, 0xf2f2f2]);
  }
  // a chequered flag every 50 rows, on both sides of the playable strip
  if (lane.row > 0 && lane.row % 50 === 0) {
    for (const sx of [-(COLS + 1.4), COLS + 1.4]) {
      B.push([sx, baseOf(lane), 0, 0.1, 1.9, 0.1, 0xeeeeee]);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) B.push([sx + 0.08 + i * 0.16 + 0.08, baseOf(lane) + 1.35 + j * 0.16, 0, 0.16, 0.16, 0.04, (i + j) % 2 ? 0x1d1d22 : 0xffffff]);
    }
  }
  return B;
}
const baseOf = lane => (lane.type === 'road' ? -0.12 : lane.type === 'rail' ? -0.09 : lane.type === 'river' ? -0.34 : 0);

function flowerBoxes(B, f, th) {
  const x = f.c + f.dx, z = f.dz, c = th.flowers[f.v % th.flowers.length];
  switch (th.flowerStyle) {
    case 'flower': B.push([x, 0, z, 0.05, 0.22, 0.05, 0x3f8f2a], [x, 0.2, z, 0.16, 0.08, 0.16, c], [x, 0.22, z, 0.06, 0.06, 0.06, 0xffe24a]); break;
    case 'mound': B.push([x, 0, z, 0.36, 0.1, 0.3, c], [x, 0.1, z, 0.2, 0.06, 0.18, c]); break;
    case 'leaves': B.push([x, 0, z, 0.3, 0.05, 0.22, c], [x + 0.06, 0.04, z + 0.04, 0.2, 0.04, 0.2, shadeHex(c, 1.15)]); break;
    case 'glow': B.push([x, 0, z, 0.06, 0.14, 0.06, 0xd8d8d8], [x, 0.14, z, 0.2, 0.1, 0.2, c]); break;
    case 'gumdrop': B.push([x, 0, z, 0.2, 0.16, 0.2, c], [x, 0.16, z, 0.12, 0.06, 0.12, shadeHex(c, 1.2)]); break;
    case 'pebble': B.push([x, 0, z, 0.2, 0.08, 0.16, f.v % 2 ? 0xc8a070 : 0xb08a5a]); if (f.v === 0) B.push([x, 0, z, 0.36, 0.3, 0.36, 0xb9864a, 0.8]); break;
    case 'pumpkin': if (f.v < 2) B.push([x, 0, z, 0.26, 0.2, 0.26, 0xff8a1d], [x, 0.2, z, 0.04, 0.06, 0.04, 0x3f6a2a]); else B.push([x, 0, z, 0.06, 0.18, 0.06, 0xe8e0c8], [x, 0.18, z, 0.04, 0.05, 0.04, 0xffd23f]); break;
    case 'fern': B.push([x, 0, z, 0.36, 0.12, 0.1, 0x2f9a3a], [x, 0, z, 0.1, 0.12, 0.36, 0x2f9a3a]); if (f.v < 2) B.push([x, 0.12, z, 0.12, 0.1, 0.12, c]); break;
  }
}

function treeOrRock(B, d, th, shade) {
  const x = d.c;
  if (d.kind === 'rock' && th.style === 'spooky') {
    // gravestone
    B.push([x, 0, 0.02, 0.56, 0.62, 0.2, th.rock[d.v % 2], shade], [x, 0.62, 0.02, 0.36, 0.12, 0.2, th.rock[d.v % 2], shade], [x, 0.36, -0.09, 0.06, 0.18, 0.02, 0x4a4a54, shade], [x, 0.42, -0.09, 0.2, 0.05, 0.02, 0x4a4a54, shade]);
    return;
  }
  if (d.kind === 'rock') {
    const c = th.rock[d.v % th.rock.length];
    B.push([x, 0, 0.02, 0.78, 0.42, 0.72, c, shade]);
    B.push([x - 0.06, 0.42, 0, 0.5, 0.18, 0.46, shadeHex(c, 1.08), shade]);
    return;
  }
  const leaf = th.leaves[d.v % th.leaves.length];
  if (th.style === 'cactus') {
    const h = 0.5 + d.h * 0.22;
    B.push([x, 0, 0, 0.32, h, 0.32, leaf, shade]);
    if (d.h > 1) { B.push([x - 0.26, h * 0.45, 0, 0.22, 0.14, 0.18, leaf, shade], [x - 0.32, h * 0.45, 0, 0.14, 0.36, 0.16, leaf, shade]); }
    if (d.h > 2) { B.push([x + 0.26, h * 0.6, 0, 0.22, 0.14, 0.18, leaf, shade], [x + 0.32, h * 0.6, 0, 0.14, 0.3, 0.16, leaf, shade]); }
    if (d.v === 0) B.push([x, h, 0, 0.14, 0.1, 0.14, 0xff7a9a, shade]);
    return;
  }
  if (th.style === 'palm') {
    const h = 0.7 + d.h * 0.3;
    B.push([x, 0, 0, 0.18, h, 0.18, th.trunk, shade]);
    B.push([x, h, 0, 1.0, 0.1, 0.34, leaf, shade], [x, h, 0, 0.34, 0.1, 1.0, leaf, shade], [x, h - 0.12, 0, 0.7, 0.12, 0.7, shadeHex(leaf, 0.85), shade]);
    if (d.v < 2) B.push([x + 0.12, h - 0.2, 0.1, 0.12, 0.12, 0.12, 0x8a5a2a, shade]);
    return;
  }
  if (th.style === 'spooky') {
    const h = 0.6 + d.h * 0.25;
    B.push([x, 0, 0, 0.2, h, 0.2, th.trunk, shade]);
    B.push([x - 0.2, h * 0.6, 0, 0.36, 0.08, 0.08, th.trunk, shade], [x - 0.36, h * 0.6, 0, 0.08, 0.28, 0.08, th.trunk, shade]);
    B.push([x + 0.18, h * 0.8, 0, 0.32, 0.08, 0.08, th.trunk, shade], [x + 0.32, h * 0.8, 0, 0.08, 0.24, 0.08, th.trunk, shade]);
    if (d.v === 1) B.push([x, h, 0, 0.3, 0.26, 0.3, 0xff8a1d, shade]);
    return;
  }
  if (th.style === 'crystal') {
    const h = 0.4 + d.h * 0.25;
    B.push([x, 0, 0, 0.4, h, 0.4, leaf, shade], [x + 0.22, 0, 0.12, 0.22, h * 0.6, 0.22, shadeHex(leaf, 0.85), shade], [x - 0.2, 0, -0.1, 0.2, h * 0.45, 0.2, shadeHex(leaf, 1.1), shade]);
    B.push([x, h, 0, 0.24, 0.16, 0.24, shadeHex(leaf, 1.2), shade]);
    return;
  }
  if (th.candy) {
    // lollipops and candy canes
    B.push([x, 0, 0, 0.12, 0.5 + d.h * 0.2, 0.12, th.trunk, shade]);
    const y = 0.5 + d.h * 0.2;
    B.push([x, y, 0, 0.7, 0.62, 0.3, leaf, shade]);
    B.push([x, y + 0.16, 0, 0.42, 0.3, 0.32, 0xffffff, shade]);
    return;
  }
  B.push([x, 0, 0, 0.3, 0.38, 0.3, th.trunk, shade]);
  const h = 0.45 + d.h * 0.32;
  if (th.snowcap) {
    // pine: stacked shrinking boxes with snow on top
    B.push([x, 0.38, 0, 0.82, h * 0.55, 0.82, leaf, shade]);
    B.push([x, 0.38 + h * 0.55, 0, 0.6, h * 0.45, 0.6, leaf, shade]);
    B.push([x, 0.38 + h, 0, 0.62, 0.1, 0.62, th.snowcap, shade]);
    return;
  }
  B.push([x, 0.38, 0, 0.8, h, 0.8, leaf, shade]);
  B.push([x + 0.12, 0.38 + h * 0.55, -0.41, 0.3, 0.2, 0.02, shadeHex(leaf, 1.12), shade]);
}

// ---------------------------------------------------------------- vehicles (front at +x)
export function vehicleBoxes(kind, colorIdx, th) {
  const c = CAR_COLORS[colorIdx % CAR_COLORS.length];
  const B = [];
  const wheel = 0x24242a, glass = 0x9fd8f2, glassD = 0x3c5f7a;
  const wheels = (len, z = 0.38) => {
    for (const x of [-len * 0.32, len * 0.32]) for (const zz of [-z, z]) B.push([x, 0, zz, 0.36, 0.3, 0.14, wheel]);
  };
  if (kind === 'car' || kind === 'taxi') {
    const len = 1.5;
    const body = kind === 'taxi' ? 0xffcf2e : c;
    wheels(len);
    B.push([0, 0.12, 0, len, 0.38, 0.8, body]);
    B.push([-0.1, 0.5, 0, 0.82, 0.34, 0.72, shadeHex(body, 1.06)]);
    B.push([-0.1, 0.55, 0, 0.84, 0.22, 0.74, glassD]);
    B.push([0.32, 0.55, 0, 0.04, 0.22, 0.6, glass]);
    B.push([len / 2, 0.24, -0.26, 0.04, 0.12, 0.16, 0xfff5b0]);
    B.push([len / 2, 0.24, 0.26, 0.04, 0.12, 0.16, 0xfff5b0]);
    B.push([-len / 2, 0.24, -0.28, 0.04, 0.1, 0.14, 0xd92b2b]);
    B.push([-len / 2, 0.24, 0.28, 0.04, 0.1, 0.14, 0xd92b2b]);
    if (kind === 'taxi') B.push([-0.1, 0.84, 0, 0.3, 0.14, 0.36, 0xfaf3d0]);
  } else if (kind === 'van') {
    const len = 1.9;
    wheels(len);
    B.push([0, 0.12, 0, len, 0.86, 0.84, c]);
    B.push([0.5, 0.56, 0, 0.6, 0.3, 0.86, glassD]);
    B.push([len / 2, 0.58, 0, 0.04, 0.28, 0.7, glass]);
    B.push([-0.3, 0.98, 0, 1.0, 0.04, 0.7, shadeHex(c, 1.15)]);
    B.push([len / 2, 0.26, -0.28, 0.04, 0.12, 0.16, 0xfff5b0]);
    B.push([len / 2, 0.26, 0.28, 0.04, 0.12, 0.16, 0xfff5b0]);
  } else if (kind === 'truck') {
    const len = 2.7;
    for (const x of [-1.0, -0.2, 0.95]) for (const zz of [-0.4, 0.4]) B.push([x, 0, zz, 0.4, 0.34, 0.14, wheel]);
    B.push([0.95, 0.14, 0, 0.8, 0.82, 0.86, c]);
    B.push([1.15, 0.56, 0, 0.42, 0.3, 0.88, glassD]);
    B.push([len / 2, 0.58, 0, 0.04, 0.28, 0.72, glass]);
    B.push([-0.45, 0.14, 0, 1.8, 1.0, 0.9, 0xeceae4]);
    B.push([-0.45, 0.14, 0, 1.82, 0.12, 0.92, 0x8c8f96]);
    B.push([-0.45, 0.62, 0, 1.84, 0.18, 0.94, c]);
    B.push([len / 2, 0.24, -0.3, 0.04, 0.12, 0.16, 0xfff5b0]);
    B.push([len / 2, 0.24, 0.3, 0.04, 0.12, 0.16, 0xfff5b0]);
  } else if (kind === 'police') {
    const len = 1.6;
    wheels(len);
    B.push([0, 0.12, 0, len, 0.38, 0.8, 0xf4f4f4]);
    B.push([0, 0.12, 0, len + 0.01, 0.14, 0.81, 0x1d1d26]);
    B.push([-0.1, 0.5, 0, 0.84, 0.34, 0.72, 0x1d1d26]);
    B.push([-0.1, 0.55, 0, 0.86, 0.22, 0.74, glassD]);
    B.push([-0.1, 0.84, -0.12, 0.26, 0.12, 0.22, 0xff2a2a], [-0.1, 0.84, 0.12, 0.26, 0.12, 0.22, 0x2a6aff]);
    B.push([len / 2, 0.24, -0.26, 0.04, 0.12, 0.16, 0xfff5b0], [len / 2, 0.24, 0.26, 0.04, 0.12, 0.16, 0xfff5b0]);
  } else if (kind === 'icecream') {
    const len = 2.0;
    wheels(len);
    B.push([0, 0.12, 0, len, 0.9, 0.84, 0xffd6ec]);
    B.push([0, 0.36, 0, len + 0.01, 0.12, 0.85, 0x8fe3f0]);
    B.push([0.6, 0.6, 0, 0.6, 0.3, 0.86, glassD]);
    B.push([-0.3, 0.42, -0.43, 0.7, 0.36, 0.02, 0x5a3a2a]);
    B.push([-0.3, 1.02, 0, 0.26, 0.3, 0.26, 0xe8b77c], [-0.3, 1.32, 0, 0.36, 0.3, 0.36, 0xfff4f8], [-0.3, 1.62, 0, 0.12, 0.1, 0.12, 0xe8372f]);
    B.push([len / 2, 0.26, -0.28, 0.04, 0.12, 0.16, 0xfff5b0], [len / 2, 0.26, 0.28, 0.04, 0.12, 0.16, 0xfff5b0]);
  } else if (kind === 'fire') {
    const len = 3.0;
    for (const x of [-1.0, 1.0]) for (const zz of [-0.4, 0.4]) B.push([x, 0, zz, 0.42, 0.34, 0.14, wheel]);
    B.push([0, 0.14, 0, len, 0.86, 0.9, 0xd92b2b]);
    B.push([1.05, 0.6, 0, 0.8, 0.36, 0.92, glassD]);
    B.push([len / 2, 0.62, 0, 0.04, 0.3, 0.74, glass]);
    B.push([-0.3, 1.0, 0, 2.2, 0.08, 0.5, 0xc8ccd4]);
    for (let x = -1.3; x < 0.8; x += 0.3) B.push([x, 1.08, 0, 0.05, 0.08, 0.5, 0xc8ccd4]);
    B.push([0, 0.36, 0, len + 0.02, 0.06, 0.92, 0xf4f4f4]);
    B.push([1.0, 1.0, 0, 0.3, 0.12, 0.3, 0x2a6aff]);
    B.push([len / 2, 0.24, -0.3, 0.04, 0.12, 0.16, 0xfff5b0], [len / 2, 0.24, 0.3, 0.04, 0.12, 0.16, 0xfff5b0]);
  } else if (kind === 'moto') {
    B.push([-0.36, 0, 0, 0.3, 0.3, 0.1, wheel], [0.36, 0, 0, 0.3, 0.3, 0.1, wheel]);
    B.push([0, 0.2, 0, 0.8, 0.22, 0.24, c]);
    B.push([0.32, 0.4, 0, 0.1, 0.24, 0.4, 0x2a2a2a]);
    B.push([-0.06, 0.42, 0, 0.3, 0.42, 0.24, 0x3a3a48], [-0.02, 0.84, 0, 0.26, 0.26, 0.26, shadeHex(c, 0.9)], [0.06, 0.88, 0, 0.14, 0.1, 0.27, 0x2a2a3a]);
    B.push([0.42, 0.3, 0, 0.04, 0.1, 0.12, 0xfff5b0]);
  } else if (kind === 'tractor') {
    B.push([-0.4, 0, -0.4, 0.66, 0.66, 0.18, wheel], [-0.4, 0, 0.4, 0.66, 0.66, 0.18, wheel], [0.5, 0, -0.36, 0.4, 0.4, 0.14, wheel], [0.5, 0, 0.36, 0.4, 0.4, 0.14, wheel]);
    B.push([0.3, 0.2, 0, 0.9, 0.44, 0.56, 0x3f9b2f]);
    B.push([-0.35, 0.3, 0, 0.6, 0.86, 0.66, 0x3f9b2f]);
    B.push([-0.35, 0.66, 0, 0.62, 0.4, 0.68, glassD]);
    B.push([-0.35, 1.16, 0, 0.7, 0.06, 0.74, 0xf5c430]);
    B.push([0.5, 0.64, 0.14, 0.08, 0.36, 0.08, 0x2a2a2a]);
  } else if (kind === 'bus') {
    const len = 3.3;
    const body = colorIdx % 2 ? 0xffc21a : 0x37a3e8;
    for (const x of [-1.15, 1.1]) for (const zz of [-0.4, 0.4]) B.push([x, 0, zz, 0.42, 0.34, 0.14, wheel]);
    B.push([0, 0.14, 0, len, 0.96, 0.9, body]);
    B.push([0, 0.62, 0, len - 0.3, 0.3, 0.92, glassD]);
    B.push([len / 2, 0.56, 0, 0.04, 0.4, 0.74, glass]);
    B.push([0, 1.1, 0, len - 0.2, 0.06, 0.8, shadeHex(body, 1.12)]);
    B.push([0, 0.36, 0, len + 0.02, 0.06, 0.92, 0xf4f4f4]);
    B.push([len / 2, 0.24, -0.3, 0.04, 0.12, 0.16, 0xfff5b0]);
    B.push([len / 2, 0.24, 0.3, 0.04, 0.12, 0.16, 0xfff5b0]);
  }
  return B;
}

export function logBoxes(len, th) {
  const B = [];
  const L = len - 0.08;
  B.push([0, -0.34, 0, L, 0.36, 0.76, th.log]);
  B.push([0, 0.0, 0, L - 0.04, 0.04, 0.6, shadeHex(th.log, 1.1)]);
  for (let x = -L / 2 + 0.4; x < L / 2 - 0.2; x += 0.7) B.push([x, -0.02, 0.0, 0.12, 0.05, 0.78, shadeHex(th.log, 0.8)]);
  B.push([-L / 2, -0.32, 0, 0.04, 0.3, 0.66, th.logEnd]);
  B.push([L / 2, -0.32, 0, 0.04, 0.3, 0.66, th.logEnd]);
  return B;
}

// Turtles: one shell per tile slot, riding exactly like a log.
export function turtleBoxes(len) {
  const B = [];
  for (let i = 0; i < len; i++) {
    const x = -len / 2 + 0.5 + i;
    B.push([x, -0.34, 0, 0.76, 0.24, 0.7, 0x3f8f3a], [x, -0.1, 0, 0.56, 0.12, 0.52, 0x4fa548], [x, -0.02, 0, 0.26, 0.06, 0.26, 0x6cbf5a]);
    B.push([x + 0.44, -0.28, 0, 0.18, 0.16, 0.22, 0x6cbf5a], [x + 0.52, -0.2, -0.05, 0.03, 0.04, 0.04, 0x111111]);
  }
  return B;
}
export function raftBoxes(len) {
  const B = [], L = len - 0.06;
  for (let z = -0.3; z <= 0.31; z += 0.2) B.push([0, -0.34, z, L, 0.3, 0.18, 0xc89a5a]);
  for (const x of [-L / 2 + 0.25, L / 2 - 0.25]) B.push([x, -0.04, 0, 0.12, 0.05, 0.8, 0x8a5a2a]);
  B.push([0, -0.04, 0, 0.08, 0.9, 0.08, 0x8a5a2a], [0.2, 0.4, 0, 0.4, 0.4, 0.02, 0xf4f4f4]);
  return B;
}

export function gemBoxes() {
  return [
    [0, -0.3, 0, 0.2, 0.12, 0.2, 0x2fb8d8], [0, -0.18, 0, 0.42, 0.16, 0.42, 0x4fd8f0],
    [0, -0.02, 0, 0.3, 0.12, 0.3, 0x8ff0ff], [0, 0.1, 0, 0.14, 0.08, 0.14, 0xd8ffff],
  ];
}

// Things that drift across the sky for a bit of life: a hot-air balloon or a little flock of birds.
export function balloonBoxes(c) {
  return [
    [0, 1.0, 0, 1.2, 1.3, 1.2, c], [0, 1.15, 0, 1.3, 1.0, 1.3, c], [0, 2.3, 0, 0.8, 0.25, 0.8, c],
    [0, 1.4, 0, 1.32, 0.2, 1.32, 0xffffff], [0, 0.7, 0, 0.6, 0.3, 0.6, shadeHex(c, 0.8)],
    [-0.2, 0.15, 0, 0.03, 0.55, 0.03, 0x5a3a2a], [0.2, 0.15, 0, 0.03, 0.55, 0.03, 0x5a3a2a],
    [0, -0.2, 0, 0.5, 0.35, 0.5, 0x9a6236],
  ];
}
export function birdBoxes() {
  const B = [];
  for (const [x, z] of [[0, 0], [-0.7, 0.6], [0.7, 0.6], [-1.3, 1.2]]) B.push([x, 0, z, 0.2, 0.12, 0.3, 0x2a2a34], [x - 0.22, 0.06, z, 0.3, 0.04, 0.16, 0x2a2a34], [x + 0.22, 0.06, z, 0.3, 0.04, 0.16, 0x2a2a34]);
  return B;
}

export function padBoxes(th) {
  return [
    [0, -0.32, 0, 0.84, 0.08, 0.84, th.pad],
    [0.24, -0.25, -0.24, 0.3, 0.02, 0.3, shadeHex(th.pad, 1.15)],
    th.ice ? [0, -0.32, 0, 0.9, 0.04, 0.9, 0xffffff] : [-0.2, -0.26, 0.2, 0.18, 0.06, 0.18, 0xff8fc0],
  ];
}

// Train with `cars` carriages, head at x=0, extending toward -x.
export function trainBoxes(cars) {
  const B = [];
  for (let i = 0; i < cars; i++) {
    const x1 = -i * TRAIN_CAR, cx = x1 - TRAIN_CAR / 2;
    const L = TRAIN_CAR - 0.12;
    B.push([cx, 0.02, 0, L, 0.2, 0.88, 0x2c2d33]);
    for (const dx of [-L * 0.32, L * 0.32]) for (const z of [-0.4, 0.4]) B.push([cx + dx, -0.06, z, 0.5, 0.3, 0.12, 0x1a1a1f]);
    if (i === 0) {
      B.push([cx, 0.22, 0, L, 1.05, 0.92, 0xd93636]);
      B.push([cx + 0.6, 1.27, 0, L - 1.4, 0.24, 0.8, 0xb52828]);
      B.push([cx + L / 2 - 0.02, 0.4, 0, 0.06, 0.25, 0.7, 0xfff3b0]);
      B.push([cx + L / 2 - 0.6, 0.78, 0, 0.6, 0.32, 0.94, 0x2f4a66]);
      B.push([cx + L / 2 + 0.05, 0.12, 0, 0.12, 0.2, 0.92, 0xf5c21a]);
      B.push([cx - 0.2, 0.22, 0, L * 0.6, 0.14, 0.94, 0xf4f4f4]);
    } else {
      B.push([cx, 0.22, 0, L, 1.1, 0.92, 0x3d7de0]);
      B.push([cx, 0.72, 0, L - 0.4, 0.34, 0.94, 0x203a5e]);
      B.push([cx, 1.32, 0, L - 0.1, 0.06, 0.86, 0xc8ccd4]);
      B.push([cx, 0.3, 0, L + 0.01, 0.1, 0.93, 0xf4f4f4]);
    }
  }
  return B;
}

export function coinBoxes() {
  return [
    [0, -0.24, 0, 0.5, 0.48, 0.12, 0xffc928],
    [0, -0.14, -0.065, 0.24, 0.28, 0.02, 0xffe27a],
    [0, -0.14, 0.065, 0.24, 0.28, 0.02, 0xffe27a],
    [0, -0.3, 0, 0.36, 0.06, 0.13, 0xe0a612],
  ];
}

// Eagle facing -z; wings separately so they can flap.
export function eagleParts() {
  const body = [
    [0, 0, 0, 0.62, 0.5, 1.2, 0x6b4426],
    [0, 0.1, -0.78, 0.46, 0.46, 0.46, 0xf6f4ef],
    [0, 0.2, -1.08, 0.18, 0.14, 0.2, 0xffc21a],
    [0, 0.12, -1.08, 0.12, 0.1, 0.12, 0xe0a010],
    [-0.24, 0.3, -0.94, 0.04, 0.1, 0.1, 0x111111], [0.24, 0.3, -0.94, 0.04, 0.1, 0.1, 0x111111],
    [0, 0.05, 0.78, 0.5, 0.12, 0.5, 0x5a381f],
    [-0.15, -0.22, -0.05, 0.1, 0.24, 0.1, 0xffc21a], [0.15, -0.22, -0.05, 0.1, 0.24, 0.1, 0xffc21a],
  ];
  const wing = [
    [0.85, 0.2, 0, 1.6, 0.1, 0.78, 0x7a4f2c],
    [1.4, 0.2, 0.2, 0.6, 0.1, 0.5, 0x5a381f],
  ];
  return { body, wing };
}

export function characterGeo(id) {
  return mergeBoxes(characterBoxes(id), 0.085);
}

export function particleGeo() {
  return mergeBoxes([[0, -0.5, 0, 1, 1, 1, 0xffffff]]);
}

export { CAR_COLORS, shadeHex };
