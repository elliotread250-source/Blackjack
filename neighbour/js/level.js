// The whole map as plain data: boxes (collision + what render.js draws), doors, windows, items,
// the neighbour's routine, lights, hiding spots, camera mounts and entry points.
// Pure JS (no three.js) so the tests walk exactly the level the game plays.
//
// Units are metres, y is up, the ground is y = 0. The street runs along x. Your little house is
// south of the road (+z), the neighbour's house is north of it (-z). yaw 0 looks toward -z.
//
// Every opening is 1.3 m wide and centred on a multiple of 0.5 so the 0.5 m navigation grid always
// has a full cell column through it.

import { makeBox } from './geom.js';
import { buildMap } from './maps.js';

export const T = 0.2;          // wall thickness
export const F1 = 3.2;         // upper floor height
export const F2 = 6.4;         // attic floor height
export const DOOR_W = 1.3, DOOR_H = 2.1, WIN_W = 1.3;
export const CRATE = 0.7;      // crate edge (stack height step)

export const ITEM_TYPES = {
  crate:   { name: 'Wooden crate', size: [0.7, 0.7, 0.7], mass: 3, throwMul: 0.5, noise: 11, big: true },
  crowbar: { name: 'Crowbar', size: [0.72, 0.07, 0.1], mass: 1.2, throwMul: 0.85, noise: 10, tool: 'crowbar' },
  redkey:  { name: 'Red key', size: [0.2, 0.05, 0.08], mass: 0.2, throwMul: 1, noise: 3, key: 'red' },
  fuse:    { name: 'Fuse', size: [0.12, 0.24, 0.12], mass: 0.4, throwMul: 1, noise: 4 },
  can:     { name: 'Tin can', size: [0.14, 0.18, 0.14], mass: 0.4, throwMul: 1, noise: 9 },
  bottle:  { name: 'Glass bottle', size: [0.1, 0.32, 0.1], mass: 0.5, throwMul: 1, noise: 13 },
  apple:   { name: 'Apple', size: [0.12, 0.12, 0.12], mass: 0.2, throwMul: 1, noise: 5 },
  vase:    { name: 'Vase', size: [0.22, 0.36, 0.22], mass: 0.8, throwMul: 0.9, noise: 14 },
  radio:   { name: 'Old radio', size: [0.36, 0.24, 0.18], mass: 1, throwMul: 0.8, noise: 12 },
  ball:    { name: 'Ball', size: [0.22, 0.22, 0.22], mass: 0.3, throwMul: 1.1, noise: 6 },
  book:    { name: 'Book', size: [0.24, 0.06, 0.18], mass: 0.5, throwMul: 0.9, noise: 7 },
  paint:   { name: 'Paint can', size: [0.22, 0.24, 0.22], mass: 1.1, throwMul: 0.85, noise: 11 },
  plate:   { name: 'Plate', size: [0.24, 0.03, 0.24], mass: 0.3, throwMul: 1, noise: 12 },
};

export const MISSIONS = [
  { name: 'The Basement', brief: 'Find the red key and get into his basement.', win: 'What’s he hiding?' },
  { name: 'The Cold Cellar', brief: 'You’re in his cellar. Find a fuse, restore power, get the red key from the cold room, take the jar from his vault and escape up the stairs.', win: 'You got out with the jar.' },
  { name: 'Mulberry Close', brief: 'Back on your street, but a new neighbour has moved in opposite. Find the crowbar, get into his basement through the garage, restore power, take the red key from his study and steal his photo album from the vault. Then get home.', win: 'You made it home with his photo album.' },
];

export function buildLevel(mission = 0) {
  if (mission === 1 || mission === 2) return buildMap(mission);
  const boxes = [];      // static boxes
  const doors = [];
  const windows = [];
  const items = [];
  const decor = [];      // purely visual extras drawn by render.js
  const lights = [];     // point lights (render) and light sources (perception)
  const lightZones = []; // {box, level} ambient light level for perception
  const hides = [];
  const pois = [];
  const camMounts = [];
  const roofs = [];      // gable roofs (visual prisms)
  const regions = [];    // "inside the neighbour's house" boxes
  const holes = [];      // grass plane cut-outs

  // ------------------------------------------------------------- helpers
  const box = (x0, y0, z0, x1, y1, z1, m, c, o) => {
    const b = makeBox(x0, y0, z0, x1, y1, z1, { m, c: c === undefined ? 0xffffff : c, col: true, vis: true, op: true });
    if (o) Object.assign(b, o);
    boxes.push(b);
    return b;
  };
  const vis = (x0, y0, z0, x1, y1, z1, m, c, o) => box(x0, y0, z0, x1, y1, z1, m, c, Object.assign({ col: false, op: false }, o));
  const inv = (x0, y0, z0, x1, y1, z1) => box(x0, y0, z0, x1, y1, z1, null, 0, { vis: false, op: false });
  // a see-through picket fence along x: invisible collision + individual pickets and two rails
  const picket = (a, b, z, h, c) => {
    inv(a, 0, z - 0.07, b, h, z + 0.07);
    for (let x = a + 0.07; x < b - 0.03; x += 0.17) {
      vis(x - 0.045, 0, z - 0.025, x + 0.045, h - 0.06, z + 0.025, 'trim', c);
      vis(x - 0.03, h - 0.06, z - 0.02, x + 0.03, h, z + 0.02, 'trim', c);
    }
    vis(a, h * 0.22, z - 0.06, b, h * 0.22 + 0.07, z - 0.025, 'trim', c);
    vis(a, h * 0.72, z - 0.06, b, h * 0.72 + 0.07, z - 0.025, 'trim', c);
  };
  const faces = (side, negF, posF, axis) => (axis === 'x'
    ? { nz: negF, pz: posF, nx: side, px: side, py: side, ny: side }
    : { nx: negF, px: posF, nz: side, pz: side, py: side, ny: side });

  // A wall along x (thin in z) from x=a..b, or along z (thin in x) from z=a..b. Openings
  // [{c, w, lo, hi}] are cut out of it. negF/posF are the materials/tints facing -z/+z (or -x/+x).
  function wall(axis, t0, t1, a, b, y0, y1, negF, posF, ops = [], trim = 'trim', tintN, tintP) {
    const f = faces(trim, negF, posF, axis);
    const tint = axis === 'x' ? { nz: tintN, pz: tintP } : { nx: tintN, px: tintP };
    const seg = (s0, s1, ya, yb) => {
      if (s1 - s0 < 1e-3 || yb - ya < 1e-3) return;
      const bb = axis === 'x' ? box(s0, ya, t0, s1, yb, t1, f, 0xffffff) : box(t0, ya, s0, t1, yb, s1, f, 0xffffff);
      bb.tf = tint;
    };
    const list = ops.slice().sort((p, q) => p.c - q.c);
    let s = a;
    for (const o of list) {
      const oa = o.c - o.w / 2, ob = o.c + o.w / 2;
      seg(s, oa, y0, y1);
      seg(oa, ob, y0, o.lo);
      seg(oa, ob, o.hi, y1);
      s = ob;
    }
    seg(s, b, y0, y1);
  }
  const op = (c, lo, hi, w = DOOR_W) => ({ c, w, lo, hi });
  const dOp = (c, y = 0) => op(c, y, y + DOOR_H);
  const wOp = (c, sill, h = 1.1) => op(c, sill, sill + h, WIN_W);

  // A door in a wall. axis = the wall's axis. swing = +1 opens toward +z (axis x) or +x (axis z).
  function door(id, axis, c, t0, t1, y, o = {}) {
    const d = { id, axis, c, t0, t1, y, w: DOOR_W, h: DOOR_H, swing: o.swing || 1, hinge: o.hinge || -1, lock: o.lock || null,
      open: !!o.open, name: o.name || 'Door', mat: o.mat || 'door', tint: o.tint || 0x8a5a3c, entry: o.entry || null,
      inside: o.inside || null, chained: false, room: o.room || null };
    doors.push(d);
    return d;
  }
  function win(id, axis, c, t0, t1, sill, o = {}) {
    const w = { id, axis, c, t0, t1, sill, top: sill + (o.h || 1.1), w: WIN_W, glass: o.glass !== false, boards: !!o.boards,
      breakable: o.breakable !== false, entry: o.entry || null, name: o.name || 'Window', outside: o.outside || 0, learned: false };
    windows.push(w);
    return w;
  }
  const item = (type, x, y, z, id) => { items.push({ id: id || type + items.length, type, x, y, z }); };
  const zone = (x0, y0, z0, x1, y1, z1, level) => lightZones.push({ box: makeBox(x0, y0, z0, x1, y1, z1), level });
  const light = (x, y, z, color, intensity, dist, o = {}) => lights.push(Object.assign({ x, y, z, color, intensity, dist }, o));

  // ------------------------------------------------------------- the street
  // road + pavements (the grass is one plane drawn by render.js with holes under buildings)
  vis(-70, -0.1, -4, 70, 0.005, 4, { py: 'asphalt', nx: 'asphalt', px: 'asphalt', ny: 'asphalt', nz: 'asphalt', pz: 'asphalt' }, 0x9a9aa2);
  for (let x = -66; x < 66; x += 6) vis(x, 0.005, -0.08, x + 3, 0.01, 0.08, 'paint', 0xe8dd9a);
  box(-70, -0.1, -6, 70, 0.12, -4, 'paving', 0xc9c3b8);
  box(-70, -0.1, 4, 70, 0.12, 6, 'paving', 0xc9c3b8);
  vis(-70, -0.1, -4.12, 70, 0.13, -4, 'concrete', 0xa8a39a);
  vis(-70, -0.1, 4, 70, 0.13, 4.12, 'concrete', 0xa8a39a);
  // street lamps
  for (const [x, z, ry] of [[-14, 5.4, Math.PI], [14, 5.4, Math.PI], [6, -5.4, 0], [-24, -5.4, 0], [30, -5.4, 0]]) {
    box(x - 0.09, 0.12, z - 0.09, x + 0.09, 4.6, z + 0.09, 'metal', 0x3a3d44);
    decor.push({ t: 'streetlamp', x, y: 0, z, ry });
  }
  light(6, 4.3, -4.6, 0xffc777, 9, 14, { name: 'street' });

  // map boundaries (invisible)
  inv(-34.5, -1, -60, -34, 12, 24); inv(34, -1, -60, 34.5, 12, 24);
  inv(-34.5, -1, 22, 34.5, 12, 22.5); inv(-34.5, -1, -60, 34.5, 12, -59.5);

  // ------------------------------------------------------------- your house (south)
  {
    const z0 = 10, z1 = 18, x0 = -5, x1 = 5, H = 2.8;
    const ext = 'brick', inn = 'paper3';
    box(x0, -0.1, z0, x1, 0, z1, { py: 'woodfloor', ny: 'trim', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, 0xb07a4a);
    wall('x', z0, z0 + T, x0, x1, 0, H, ext, inn, [dOp(0), wOp(-3, 1.0), wOp(3, 1.0)], 'trim', 0xa04a3a, 0xc9d7e8);
    wall('x', z1 - T, z1, x0, x1, 0, H, inn, ext, [wOp(2.5, 1.0)], 'trim', 0xc9d7e8, 0xa04a3a);
    wall('z', x0, x0 + T, z0, z1, 0, H, ext, inn, [], 'trim', 0xa04a3a, 0xc9d7e8);
    wall('z', x1 - T, x1, z0, z1, 0, H, inn, ext, [wOp(14, 1.0)], 'trim', 0xc9d7e8, 0xa04a3a);
    box(x0 - 0.1, H, z0 - 0.1, x1 + 0.1, H + 0.2, z1 + 0.1, { ny: 'plaster', py: 'trim', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, 0xeeeae2);
    roofs.push({ x0: x0 - 0.5, x1: x1 + 0.5, z0: z0 - 0.6, z1: z1 + 0.6, y: H + 0.2, h: 2.2, ridge: 'x', tint: 0x4b4f5c, gable: 0xa04a3a });
    // static glass in your own windows
    for (const [c, zz] of [[-3, z0], [3, z0]]) vis(c - 0.65, 1.0, zz + 0.08, c + 0.65, 2.1, zz + 0.12, 'glass', 0xbfe0ff, { col: true });
    vis(1.85, 1.0, z1 - 0.12, 3.15, 2.1, z1 - 0.08, 'glass', 0xbfe0ff, { col: true });
    vis(x1 - 0.12, 1.0, 13.35, x1 - 0.08, 2.1, 14.65, 'glass', 0xbfe0ff, { col: true });
    door('home', 'x', 0, z0, z0 + T, 0, { swing: 1, open: true, name: 'Front door', tint: 0x2f5a8a });
    // bed, desk, wardrobe, rug, lamp
    box(-4.8, 0, 15.6, -2.9, 0.5, 17.8, 'fabric', 0x3d6fb0);
    box(-4.8, 0.5, 17.1, -2.9, 0.62, 17.8, 'fabric', 0xf2efe6);
    box(-4.8, 0, 17.65, -2.9, 1.1, 17.8, 'wood', 0x7a5236);
    box(2.6, 0, 16.9, 4.8, 0.78, 17.8, 'wood', 0x9b6b43);
    box(3.6, 0, 10.2, 4.8, 2.1, 10.9, 'wood', 0x6f4a30);
    vis(-2.5, 0.001, 12.5, 1.5, 0.012, 15.5, 'fabric', 0xb5523b);
    decor.push({ t: 'lamp', x: 4.4, y: 0.78, z: 17.4 });
    decor.push({ t: 'poster', x: -1, y: 1.7, z: 17.79, ry: Math.PI, c: 0x2b6c5a });
    decor.push({ t: 'poster', x: x0 + 0.21, y: 1.6, z: 13, ry: Math.PI / 2, c: 0x8a3b56 });
    decor.push({ t: 'binoculars', x: 3.7, y: 0.78, z: 17.2 });
    light(0.5, 1.9, 14.6, 0xffe6c4, 3.2, 8, { name: 'home' });
    zone(x0, -1, z0, x1, 3, z1, 0.8);
    // lawn path, mailbox, fence, car
    vis(-0.8, 0.0, 6, 0.8, 0.02, 10, 'paving', 0xb9b2a6);
    decor.push({ t: 'mailbox', x: 1.6, y: 0, z: 6.6, ry: Math.PI, c: 0x2f5a8a });
    box(5.6, 0, 6.6, 9.8, 1.3, 9.2, null, 0, { vis: false, tag: 'car' });
    decor.push({ t: 'car', x: 7.7, y: 0, z: 7.9, ry: Math.PI / 2, c: 0xb83a32 });
    for (const xs of [[-10, -1], [1, 10]]) picket(xs[0], xs[1], 6.35, 0.85, 0xf0ece2);
  }

  // ------------------------------------------------------------- filler houses (visual + solid)
  const filler = (x0, z0, x1, z1, h, siding, roof) => {
    box(x0, 0, z0, x1, h, z1, 'siding', siding);
    roofs.push({ x0: x0 - 0.4, x1: x1 + 0.4, z0: z0 - 0.4, z1: z1 + 0.4, y: h, h: 2.4, ridge: 'x', tint: roof, gable: siding });
    const fz = z0 > 0 ? z0 : z1; // facade toward the street
    for (let x = x0 + 1.5; x < x1 - 1; x += 3) decor.push({ t: 'litwindow', x, y: 1.6, z: fz + (z0 > 0 ? -0.02 : 0.02), ry: z0 > 0 ? Math.PI : 0, lit: ((x * 7) | 0) % 3 === 0 });
    holes.push([x0, z0, x1, z1]);
  };
  filler(-20, 11, -10, 19, 5.6, 0xc7b38a, 0x5a3f3a);
  filler(11, 11, 21, 19, 3.2, 0x9fb4c7, 0x3d4250);
  filler(25, 11, 33, 18, 5.6, 0xd6c6c0, 0x5a4a44);
  filler(-33, 11, -25, 18, 3.2, 0xa8c49a, 0x46423c);
  filler(-46, -24, -30, -10, 6, 0xbfaFa0, 0x40363a);
  filler(30, -24, 46, -10, 6, 0xc0c8b0, 0x3b3f48);

  // ------------------------------------------------------------- the neighbour's yard
  // front picket fence (climbable), tall privacy fences around the rest
  for (const [a, b] of [[-26, -1], [1, 10], [18, 26]]) picket(a, b, -6.55, 1.1, 0xf3efe4);
  box(-26.2, 0, -56, -26, 2.0, -6.5, 'fence', 0x7a5a40);
  box(26, 0, -56, 26.2, 2.0, -6.5, 'fence', 0x7a5a40);
  box(-26.2, 0, -56.2, 26.2, 2.0, -56, 'fence', 0x7a5a40);
  inv(-26.8, 2, -57, -26.2, 12, -6.5); inv(26.2, 2, -57, 26.8, 12, -6.5); inv(-26.8, 2, -57, 26.8, 12, -56.2);
  // the fence walls stop sideways escapes at pavement level too
  inv(-34, -1, -6.4, -33.5, 12, -6); inv(33.5, -1, -6.4, 34, 12, -6);
  // paths and drive
  vis(-0.9, 0.0, -9.8, 0.9, 0.02, -6.5, 'paving', 0xb6ad9f);
  vis(10, 0.0, -12, 18, 0.02, -6, 'concrete', 0xaaa59c);
  vis(-1.2, 0.0, -31, 2.4, 0.02, -29.5, 'paving', 0xb6ad9f);
  decor.push({ t: 'mailbox', x: -2.4, y: 0, z: -7.1, ry: 0, c: 0x6e2a2a });
  decor.push({ t: 'sign', x: 3.2, y: 0, z: -7.3, ry: 0 });
  // hedges under the front windows (solid, waist high)
  box(-9.6, 0, -11.9, -3.4, 0.85, -11.0, 'hedge', 0x3f6b32, { tag: 'hedge' });
  box(3.4, 0, -11.9, 4.6, 0.85, -11.0, 'hedge', 0x3f6b32, { tag: 'hedge' });
  box(7.6, 0, -11.9, 9.6, 0.85, -11.0, 'hedge', 0x3f6b32, { tag: 'hedge' });
  zone(-10, -1, -12, -3, 2, -10.5, 0.3);
  // trash bins by the drive
  box(18.4, 0, -8.2, 19.1, 1.05, -7.5, 'paint', 0x2e5a3a); box(19.3, 0, -8.2, 20, 1.05, -7.5, 'paint', 0x3a3d44);

  // ------------------------------------------------------------- the house
  const X0 = -10, X1 = 10, Z0 = -28, Z1 = -12;   // main block footprint (front is Z1)
  const SID = 'siding', SIDC = 0x6f9a8e, TRIM = 0xf1ead8;
  const P_HALL = 0x8e3b3b, P_LIV = 0x5f7d4f, P_KIT = 0xe6d7a8, P_DIN = 0x6b5a8a, P_BATH = 0xbfe0dc,
    P_BED = 0x6d8fb8, P_KID = 0xd99aa5, P_STUDY = 0x6a4a32, P_STORE = 0xa49a86, P_ATTIC = 0x8c7356, P_PANTRY = 0xb9b08a;
  regions.push(makeBox(X0, -1, Z0, X1, 9.5, Z1), makeBox(10, -1, -20.5, 18, 3.0, -12), makeBox(10, -1, -27.6, 13, 3.4, -21));
  // foundation band + floors (ground floor slabs carry per-room floor materials)
  const band = (y0, y1, m, c) => {
    const o = 0.07;
    vis(X0 - o, y0, Z1, X1 + o, y1, Z1 + o, m, c); vis(X0 - o, y0, Z0 - o, X1 + o, y1, Z0, m, c);
    vis(X0 - o, y0, Z0, X0, y1, Z1, m, c); vis(X1, y0, Z0, X1 + o, y1, Z1, m, c);
  };
  band(-0.1, 0.3, 'brick', 0x7a5446);
  const CEIL = 0xe4ddd0;
  const floor = (x0, z0, x1, z1, y, mat, c) => Object.assign(box(x0, y - 0.2, z0, x1, y, z1, { py: mat, ny: 'plaster', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, c), { tf: { ny: CEIL, nx: TRIM, px: TRIM, nz: TRIM, pz: TRIM } });
  floor(-2, Z0, 2, Z1, 0.0, 'woodfloor', 0x8a5a36);         // hall
  floor(X0, -21, -2, Z1, 0.0, 'woodfloor', 0x9b6a40);        // living
  floor(2, -21, X1, Z1, 0.0, 'checker', 0xffffff);           // kitchen
  floor(2, Z0, X1, -21, 0.0, 'tile', 0xcfc6a8);              // pantry
  floor(X0, Z0, -2, -21, 0.0, 'woodfloor', 0x7d5232);        // dining + bath
  vis(X0 + 0.2, 0.001, Z0 + 0.2, -6.6, 0.006, -24.6, 'tile', 0xe8f2f0); // bathroom tiles over it
  holes.push([X0 - 0.05, Z0 - 0.05, X1 + 0.05, Z1 + 0.05], [10, -20.6, 18.05, -11.95], [10, -27.65, 13.05, -20.95]);

  // ---- ground floor walls (y 0..3), split per room so each room keeps its own wallpaper
  const H0 = 3.0;
  // front (z = -12): living window (-6), front door (0), kitchen window (6)
  wall('x', Z1 - T, Z1, X0, -2, 0, H0, 'paper2', SID, [wOp(-6, 1.0)], 'trim', P_LIV, SIDC);
  wall('x', Z1 - T, Z1, -2, 2, 0, H0, 'paper1', SID, [dOp(0)], 'trim', P_HALL, SIDC);
  wall('x', Z1 - T, Z1, 2, X1, 0, H0, 'paper3', SID, [wOp(6, 1.0)], 'trim', P_KIT, SIDC);
  // back (z = -28): bathroom high window (-8.5), back door (0.5)
  wall('x', Z0, Z0 + T, X0, -6.5, 0, H0, SID, 'tile', [op(-8.5, 1.9, 2.95)], 'trim', SIDC, P_BATH);
  wall('x', Z0, Z0 + T, -6.5, -2, 0, H0, SID, 'paper2', [], 'trim', SIDC, P_DIN);
  wall('x', Z0, Z0 + T, -2, 2, 0, H0, SID, 'paper1', [dOp(0.5)], 'trim', SIDC, P_HALL);
  wall('x', Z0, Z0 + T, 2, X1, 0, H0, SID, 'paper3', [], 'trim', SIDC, P_PANTRY);
  // west (x = -10): boarded living side window (-14)
  wall('z', X0, X0 + T, Z0, -24.5, 0, H0, SID, 'tile', [], 'trim', SIDC, P_BATH);
  wall('z', X0, X0 + T, -24.5, -21, 0, H0, SID, 'paper2', [], 'trim', SIDC, P_DIN);
  wall('z', X0, X0 + T, -21, Z1, 0, H0, SID, 'paper2', [wOp(-14, 1.0)], 'trim', SIDC, P_LIV);
  // east (x = 10): garage door (-15), basement door (-24.5)
  wall('z', X1 - T, X1, Z0, -21, 0, H0, 'paper3', 'block', [dOp(-24.5)], 'trim', P_PANTRY, 0xb8b2a6);
  wall('z', X1 - T, X1, -21, Z1, 0, H0, 'paper3', 'block', [dOp(-15)], 'trim', P_KIT, 0xb8b2a6);
  // hall partitions: living (-14) / dining (-23.5) on the west, kitchen (-14) / pantry (-24) on the east
  wall('z', -2.1, -1.9, Z0, -21, 0, H0, 'paper2', 'paper1', [dOp(-23.5)], 'trim', P_DIN, P_HALL);
  wall('z', -2.1, -1.9, -21, Z1, 0, H0, 'paper2', 'paper1', [dOp(-14)], 'trim', P_LIV, P_HALL);
  wall('z', 1.9, 2.1, Z0, -21, 0, H0, 'paper1', 'paper3', [dOp(-24)], 'trim', P_HALL, P_PANTRY);
  wall('z', 1.9, 2.1, -21, Z1, 0, H0, 'paper1', 'paper3', [dOp(-14)], 'trim', P_HALL, P_KIT);
  // living | dining, kitchen | pantry (open doorway)
  wall('x', -21.1, -20.9, X0, -2, 0, H0, 'paper2', 'paper2', [], 'trim', P_DIN, P_LIV);
  wall('x', -21.1, -20.9, 2, X1, 0, H0, 'paper3', 'paper3', [dOp(7)], 'trim', P_PANTRY, P_KIT);
  // bathroom
  wall('x', -24.6, -24.4, X0, -6.5, 0, H0, 'tile', 'paper2', [], 'trim', P_BATH, P_DIN);
  wall('z', -6.6, -6.4, Z0, -24.4, 0, H0, 'tile', 'paper2', [dOp(-26.5)], 'trim', P_BATH, P_DIN);

  // ---- upper floor slab with stairwell holes
  const slab = (x0, z0, x1, z1, y, topMat, topC) => Object.assign(box(x0, y - 0.2, z0, x1, y, z1, { py: topMat, ny: 'plaster', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, topC), { tf: { ny: CEIL, nx: TRIM, px: TRIM, nz: TRIM, pz: TRIM } });
  // hole over flight 1: x -1.9..-0.7, z -16..-19.3
  slab(X0, Z0, X1, -19.3, F1, 'woodfloor', 0x7d5232);
  slab(X0, -16, X1, Z1, F1, 'woodfloor', 0x7d5232);
  slab(X0, -19.3, -1.9, -16, F1, 'woodfloor', 0x7d5232);
  slab(-0.7, -19.3, X1, -16, F1, 'woodfloor', 0x7d5232);
  band(F1 - 0.28, F1 + 0.06, 'trim', TRIM);
  // carpets
  vis(-9.8, F1 + 0.003, -20.8, -2.2, F1 + 0.008, -12.2, 'carpet', 0x6b2f3a);
  vis(2.2, F1 + 0.003, -20.8, 9.8, F1 + 0.008, -12.2, 'carpet', 0x3d3a5a);
  // flight 1: ground -> upper, x -1.9..-0.7, z -16 -> -19.6 (rising toward -z)
  for (let i = 0; i < 12; i++) {
    const top = (i + 1) * (F1 / 12);
    box(-1.9, 0, -16 - 0.3 * (i + 1), -0.7, top, -16 - 0.3 * i, { py: 'woodfloor', nz: 'paint', pz: 'paint', nx: 'paint', px: 'paint', ny: 'paint' }, 0x6a4128, { tag: 'stair' });
  }
  vis(-0.72, 0, -19.6, -0.66, 1.0, -16, 'wood', 0x5a3a26); // stringer
  // railings upstairs around the hole
  box(-0.76, F1, -19.3, -0.64, F1 + 1.0, -16, 'wood', 0x5a3a26);
  box(-1.9, F1, -16.06, -0.64, F1 + 1.0, -15.94, 'wood', 0x5a3a26);

  // ---- upper walls (y 3.2..6.2)
  const U0 = F1, U1 = 6.2;
  // front: bedroom window (-6), landing window (0, above the porch roof), study window (6)
  wall('x', Z1 - T, Z1, X0, -2, U0, U1, 'paper3', SID, [wOp(-6, F1 + 1.0)], 'trim', P_BED, SIDC);
  wall('x', Z1 - T, Z1, -2, 2, U0, U1, 'paper1', SID, [wOp(0, F1 + 1.0)], 'trim', P_HALL, SIDC);
  wall('x', Z1 - T, Z1, 2, X1, U0, U1, 'panel', SID, [wOp(6, F1 + 1.0)], 'trim', P_STUDY, SIDC);
  // back: nursery window (-6), storage window (6)
  wall('x', Z0, Z0 + T, X0, -2, U0, U1, SID, 'paper3', [wOp(-6, F1 + 1.0)], 'trim', SIDC, P_KID);
  wall('x', Z0, Z0 + T, -2, 2, U0, U1, SID, 'paper1', [], 'trim', SIDC, P_HALL);
  wall('x', Z0, Z0 + T, 2, X1, U0, U1, SID, 'paper2', [wOp(6, F1 + 1.0)], 'trim', SIDC, P_STORE);
  wall('z', X0, X0 + T, Z0, -21, U0, U1, SID, 'paper3', [], 'trim', SIDC, P_KID);
  wall('z', X0, X0 + T, -21, Z1, U0, U1, SID, 'paper3', [], 'trim', SIDC, P_BED);
  // east: study window over the garage roof (-16.5)
  wall('z', X1 - T, X1, Z0, -21, U0, U1, 'paper2', SID, [], 'trim', P_STORE, SIDC);
  wall('z', X1 - T, X1, -21, Z1, U0, U1, 'panel', SID, [wOp(-16.5, F1 + 1.0)], 'trim', P_STUDY, SIDC);
  wall('z', -2.1, -1.9, Z0, -21, U0, U1, 'paper3', 'paper1', [dOp(-23.5, F1)], 'trim', P_KID, P_HALL);
  wall('z', -2.1, -1.9, -21, Z1, U0, U1, 'paper3', 'paper1', [dOp(-14, F1)], 'trim', P_BED, P_HALL);
  wall('z', 1.9, 2.1, Z0, -21, U0, U1, 'paper1', 'paper2', [dOp(-26.5, F1)], 'trim', P_HALL, P_STORE);
  wall('z', 1.9, 2.1, -21, Z1, U0, U1, 'paper1', 'panel', [dOp(-14, F1)], 'trim', P_HALL, P_STUDY);
  wall('x', -21.1, -20.9, X0, -2, U0, U1, 'paper3', 'paper3', [], 'trim', P_KID, P_BED);
  wall('x', -21.1, -20.9, 2, X1, U0, U1, 'paper2', 'panel', [], 'trim', P_STORE, P_STUDY);

  // ---- attic slab with a hole over flight 2 (x 0.7..1.9, z -21..-24.3)
  slab(X0, Z0, X1, -24.3, F2, 'attic', 0x8a6a48);
  slab(X0, -21, X1, Z1, F2, 'attic', 0x8a6a48);
  slab(X0, -24.3, 0.7, -21, F2, 'attic', 0x8a6a48);
  slab(1.9, -24.3, X1, -21, F2, 'attic', 0x8a6a48);
  band(F2 - 0.28, F2 + 0.02, 'trim', TRIM);
  for (let i = 0; i < 12; i++) {
    const top = F1 + (i + 1) * ((F2 - F1) / 12);
    box(0.7, F1, -21 - 0.3 * (i + 1), 1.9, top, -21 - 0.3 * i, { py: 'woodfloor', nz: 'paint', pz: 'paint', nx: 'paint', px: 'paint', ny: 'paint' }, 0x5e3a24, { tag: 'stair' });
  }
  box(0.6, F2, -24.3, 0.7, F2 + 1.0, -21, 'wood', 0x5a3a26);
  box(0.6, F2, -21.06, 1.9, F2 + 1.0, -20.94, 'wood', 0x5a3a26);
  // attic room x -5..5, z -17..-27 under the roof
  const A1 = 8.6;
  wall('x', -17.1, -16.9, -5, 5, F2, A1, 'attic', 'attic', [], 'trim', P_ATTIC, P_ATTIC);
  wall('x', -27.1, -26.9, -5, 5, F2, A1, 'attic', 'attic', [], 'trim', P_ATTIC, P_ATTIC);
  wall('z', -5.1, -4.9, -27, -17, F2, A1, 'attic', 'attic', [], 'trim', P_ATTIC, P_ATTIC);
  wall('z', 4.9, 5.1, -27, -17, F2, A1, 'attic', 'attic', [], 'trim', P_ATTIC, P_ATTIC);
  box(-5.1, A1, -27.1, 5.1, A1 + 0.1, -16.9, { ny: 'attic', py: 'trim', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, 0x6e5338);
  for (let x = -4.5; x <= 4.5; x += 1.5) vis(x - 0.08, A1 - 0.22, -27, x + 0.08, A1, -17, 'wood', 0x4a3424);
  // the rest of the roof space is sealed off
  inv(X0, F2, Z0, X1, 10, -27.1); inv(X0, F2, -16.9, X1, 10, Z1); inv(X0, F2, -27.1, -5.1, 10, -16.9); inv(5.1, F2, -27.1, X1, 10, -16.9);
  roofs.push({ x0: X0 - 0.6, x1: X1 + 0.6, z0: Z0 - 0.7, z1: Z1 + 0.7, y: F2 - 0.05, h: 5.0, ridge: 'z', tint: 0x5a3a4a, gable: SIDC });
  // chimney + odd bits on the roof
  box(-7.5, F2, -26, -6.3, 11.2, -24.8, 'brick', 0x8a5a48);
  decor.push({ t: 'dish', x: 6.5, y: 8.4, z: -15.2 });
  decor.push({ t: 'weathervane', x: 0, y: F2 + 4.95, z: -12.4 });

  // the odd tower on the west side (solid, decorative)
  box(-13.6, 0, -24.2, -10, 9.6, -19.8, 'siding', 0x7f8f78);
  roofs.push({ x0: -14, x1: -9.6, z0: -24.6, z1: -19.4, y: 9.6, h: 2.8, ridge: 'z', tint: 0x4a3040, gable: 0x7f8f78, spire: true });
  for (const y of [1.6, 4.6, 7.6]) decor.push({ t: 'litwindow', x: -13.62, y, z: -22, ry: -Math.PI / 2, small: true, lit: y > 7 });
  holes.push([-13.6, -24.2, -10, -19.8]);

  // ---- porch (front)
  box(-3, 0, -12, 3, 0.15, -9.8, 'woodfloor', 0x7a5a40);
  for (const x of [-2.9, 2.9]) box(x - 0.09, 0.15, -10.0, x + 0.09, 2.85, -9.82, 'trim', TRIM);
  for (const [a, b] of [[-3, -1.0], [1.0, 3]]) {
    box(a, 0.15, -10.0, b, 0.95, -9.92, null, 0, { vis: false, op: false, tag: 'rail' });
    vis(a, 0.87, -10.03, b, 0.95, -9.89, 'trim', TRIM);
    for (let x = a + 0.1; x < b - 0.05; x += 0.16) vis(x - 0.025, 0.15, -9.985, x + 0.025, 0.87, -9.935, 'trim', TRIM);
  }
  box(-3.2, 2.85, -12, 3.2, 3.05, -9.6, { py: 'shingle', ny: 'plaster', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, 0x5a3a4a).tf = { ny: 0xd8d0c4, nx: TRIM, px: TRIM, nz: TRIM, pz: TRIM };
  light(0, 2.6, -10.9, 0xffb866, 4, 7, { name: 'porch', flicker: 0.15 });
  zone(-3, -1, -12, 3, 3, -9.6, 0.85);
  // back step
  box(-1, 0, -29.4, 2, 0.15, -28, 'concrete', 0xa29d94);

  // ---- doors (ground)
  door('front', 'x', 0, Z1 - T, Z1, 0, { swing: -1, hinge: -1, name: 'Front door', tint: 0x7a2a2a, entry: 'frontDoor', inside: -1 });
  door('back', 'x', 0.5, Z0, Z0 + T, 0, { swing: 1, hinge: 1, name: 'Back door', tint: 0x7a2a2a, entry: 'backDoor', inside: 1 });
  door('living', 'z', -14, -2.1, -1.9, 0, { swing: -1, hinge: 1, name: 'Living room door' });
  door('dining', 'z', -23.5, -2.1, -1.9, 0, { swing: -1, hinge: -1, name: 'Dining room door' });
  door('kitchen', 'z', -14, 1.9, 2.1, 0, { swing: 1, hinge: 1, name: 'Kitchen door' });
  door('pantry', 'z', -24, 1.9, 2.1, 0, { swing: 1, hinge: -1, name: 'Pantry door' });
  door('bath', 'z', -26.5, -6.6, -6.4, 0, { swing: -1, hinge: 1, name: 'Bathroom door', tint: 0xe8e2d4 });
  door('garage', 'z', -15, X1 - T, X1, 0, { swing: 1, hinge: -1, lock: 'bolt', name: 'Garage door', tint: 0x6b6f78, inside: 1 });
  door('basement', 'z', -24.5, X1 - T, X1, 0, { swing: 1, hinge: -1, lock: 'red', name: 'Basement door', tint: 0xa8846a, mat: 'board' });
  // upper
  door('bedroom', 'z', -14, -2.1, -1.9, F1, { swing: -1, hinge: 1, name: 'Bedroom door' });
  door('kid', 'z', -23.5, -2.1, -1.9, F1, { swing: -1, hinge: -1, name: 'Nursery door', tint: 0xd8b9c0 });
  door('study', 'z', -14, 1.9, 2.1, F1, { swing: 1, hinge: 1, lock: 'power', name: 'Study door', tint: 0x3a2a22, inside: 1 });
  door('storage', 'z', -26.5, 1.9, 2.1, F1, { swing: 1, hinge: -1, name: 'Storage door' });

  // ---- windows
  win('kitchenW', 'x', 6, Z1 - T, Z1, 1.0, { entry: 'kitchenWindow', name: 'Kitchen window', outside: 1 });
  win('livingW', 'x', -6, Z1 - T, Z1, 1.0, { entry: 'livingWindow', name: 'Living room window', outside: 1 });
  win('livingSide', 'z', -14, X0, X0 + T, 1.0, { entry: 'livingSide', name: 'Side window', boards: true, outside: -1 });
  win('bathW', 'x', -8.5, Z0, Z0 + T, 1.9, { h: 1.05, entry: 'bathWindow', name: 'High bathroom window', outside: -1 });
  win('hallUpW', 'x', 0, Z1 - T, Z1, F1 + 1.0, { entry: 'porchRoof', name: 'Landing window', outside: 1 });
  win('bedW', 'x', -6, Z1 - T, Z1, F1 + 1.0, { entry: 'bedroomWindow', name: 'Bedroom window', outside: 1 });
  win('studyFW', 'x', 6, Z1 - T, Z1, F1 + 1.0, { entry: 'studyFront', name: 'Study window', outside: 1 });
  win('studyEW', 'z', -16.5, X1 - T, X1, F1 + 1.0, { entry: 'studyWindow', name: 'Study window', outside: 1 });
  win('kidW', 'x', -6, Z0, Z0 + T, F1 + 1.0, { entry: 'nurseryWindow', name: 'Nursery window', outside: -1 });
  win('storeW', 'x', 6, Z0, Z0 + T, F1 + 1.0, { entry: 'storageWindow', name: 'Storage window', outside: -1 });

  // ---- garage (x 10..18, z -20.5..-12), flat walkable roof
  box(10, -0.1, -20.5, 18, 0, -12, { py: 'concrete', ny: 'trim', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, 0x8f8a82);
  wall('x', -12.2, -12, 10, 18, 0, 3.0, 'block', SID, [op(14, 0, 2.6, 6)], 'trim', 0xb8b2a6, SIDC);
  box(11, 0, -12.14, 17, 2.6, -12.06, 'garagedoor', 0xe8e0d0, { tag: 'garagedoor' });
  wall('z', 17.8, 18, -20.5, -12, 0, 3.0, 'block', SID, [wOp(-16, 1.0)], 'trim', 0xb8b2a6, SIDC);
  wall('x', -20.5, -20.3, 10, 18, 0, 3.0, SID, 'block', [], 'trim', SIDC, 0xb8b2a6);
  box(9.8, 3.0, -20.6, 18.2, 3.2, -11.9, { py: 'roofflat', ny: 'plaster', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, 0x6b6460).tf = { ny: 0xb8b2a6, nx: TRIM, px: TRIM, nz: TRIM, pz: TRIM };
  for (const [a, b, c, d] of [[10, -12.02, 18.2, -11.9], [18.08, -20.6, 18.2, -11.9], [10, -20.6, 18.2, -20.48]]) box(a, 3.2, b, c, 3.32, d, 'trim', TRIM);
  win('garageW', 'z', -16, 17.8, 18, 1.0, { entry: 'garageWindow', name: 'Garage window', boards: true, outside: 1 });
  zone(10, -1, -20.5, 18, 3, -12, 0.35);
  // woodpile by the garage (a step up toward the roof)
  box(18.1, 0, -20.4, 19.3, 1.2, -18.4, null, 0, { vis: false, tag: 'woodpile' });
  decor.push({ t: 'logs', x: 18.7, y: 0, z: -19.4 });
  // garage contents: car, workbench (the fuse), shelves, locker (hide)
  box(12.2, 0, -18.8, 14.6, 1.35, -13.4, null, 0, { vis: false, tag: 'car' });
  decor.push({ t: 'car', x: 13.4, y: 0, z: -16.1, ry: 0, c: 0x37506e });
  box(15.3, 0, -20.3, 17.8, 0.95, -19.4, 'wood', 0x8a6a48);
  box(17.3, 0, -18.5, 17.8, 2.2, -17.2, 'metal', 0x5d6470);
  box(15.6, 0, -13.2, 17.8, 1.9, -12.25, 'wood', 0x6f5a44);
  decor.push({ t: 'pegboard', x: 16.5, y: 1.7, z: -20.28, ry: 0 });
  decor.push({ t: 'tires', x: 14.6, y: 0, z: -12.9 });

  // ---- basement extension (x 10..13, z -21..-27.6): the goal
  wall('z', 12.8, 13, -27.6, -21, 0, 3.4, 'block', SID, [], 'trim', 0x4a4440, SIDC);
  wall('x', -27.6, -27.4, 10, 13, 0, 3.4, SID, 'block', [], 'trim', SIDC, 0x4a4440);
  wall('x', -21.2, -21.0, 10, 13, 0, 3.4, 'block', SID, [], 'trim', 0x4a4440, SIDC);
  box(9.9, 3.4, -27.7, 13.1, 3.6, -20.9, { py: 'roofflat', ny: 'plaster', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, 0x4a3a40).tf = { ny: 0x3a3030, nx: TRIM, px: TRIM, nz: TRIM, pz: TRIM };
  vis(10, -0.1, -27.4, 11.2, 0, -21.2, 'concrete', 0x5a5450);
  for (let i = 0; i < 6; i++) vis(11.2 + i * 0.27, -2, -25.3, 11.47 + i * 0.27, -0.22 - i * 0.24, -23.7, 'concrete', 0x3a3430);
  vis(11.2, -3, -27.4, 12.8, -0.15, -21.2, 'emissive', 0x120404, { tag: 'pit' });
  light(11.4, 0.5, -24.5, 0xff2a1a, 3.2, 6, { name: 'basement', pulse: true });
  zone(10, -1, -27.6, 13, 3, -21, 0.25);
  regions.push(makeBox(10.2, -1, -27.4, 12.8, 3, -21.2));

  // ---- shed in the back yard (x 14..20, z -46..-41)
  box(14, -0.05, -46, 20, 0.08, -41, 'woodfloor', 0x6a5038);
  wall('z', 14, 14.15, -46, -41, 0, 2.6, 'fence', 'wood', [dOp(-43.5)], 'trim', 0x7a4a34, 0x9a7a58);
  wall('z', 19.85, 20, -46, -41, 0, 2.6, 'wood', 'fence', [], 'trim', 0x9a7a58, 0x7a4a34);
  wall('x', -46, -45.85, 14, 20, 0, 2.6, 'fence', 'wood', [], 'trim', 0x7a4a34, 0x9a7a58);
  wall('x', -41.15, -41, 14, 20, 0, 2.6, 'wood', 'fence', [wOp(17, 1.1, 0.8)], 'trim', 0x9a7a58, 0x7a4a34);
  vis(16.35, 1.1, -41.1, 17.65, 1.9, -41.05, 'glass', 0xbfe0ff, { col: true });
  box(13.8, 2.6, -46.2, 20.2, 2.8, -40.8, { py: 'shingle', ny: 'wood', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, 0x3e3a3a).tf = { ny: 0x9a7a58, nx: 0x6e4a32, px: 0x6e4a32, nz: 0x6e4a32, pz: 0x6e4a32 };
  door('shed', 'z', -43.5, 14, 14.15, 0.08, { swing: -1, hinge: 1, name: 'Shed door', tint: 0x6e4a32 });
  box(18.6, 0.08, -45.85, 19.85, 0.95, -43.4, 'wood', 0x8a6a48);  // workbench
  box(14.15, 0.08, -45.85, 16.2, 2.0, -45.4, 'wood', 0x6f5a44);   // shelves
  decor.push({ t: 'pegboard', x: 19.84, y: 1.6, z: -44.6, ry: -Math.PI / 2 });
  zone(14, -1, -46, 20, 3, -41, 0.3);
  zone(20, -1, -48, 26, 3, -39, 0.22);   // dark gap behind the shed

  // ---- back yard: garden, tree, swing, doghouse
  box(-11, 0, -41, -5, 0.22, -38, 'dirt', 0x5a4030, { tag: 'garden' });
  for (let x = -10.4; x <= -5.6; x += 1.2) for (const z of [-40.3, -38.8]) decor.push({ t: (x + z) % 2 > -1 ? 'cabbage' : 'pumpkin', x, y: 0.22, z });
  decor.push({ t: 'shovel', x: -4.6, y: 0, z: -38.4 });
  box(-14.4, 0, -42.4, -13.6, 4.5, -41.6, 'bark', 0x5a4030, { tag: 'tree' });
  decor.push({ t: 'tree', x: -14, y: 4.0, z: -42, s: 1.4 });
  zone(-18, -1, -46, -10, 3, -38, 0.25);
  decor.push({ t: 'tree', x: 22, y: 3.5, z: -52, s: 1.1 });
  box(21.6, 0, -52.4, 22.4, 4, -51.6, 'bark', 0x5a4030, { tag: 'tree' });
  decor.push({ t: 'tree', x: -21, y: 3.5, z: -9.5, s: 1.0 });
  box(-21.35, 0, -9.85, -20.65, 3.6, -9.15, 'bark', 0x5a4030, { tag: 'tree' });
  box(5.2, 0, -48.8, 6.8, 1.2, -47.4, 'wood', 0x9a4a3a, { tag: 'doghouse' });
  decor.push({ t: 'doghouse', x: 6, y: 0, z: -48.1 });
  for (const x of [-3, 3]) box(x - 0.06, 0, -45.06, x + 0.06, 2.2, -44.94, 'metal', 0x7a7f88);
  decor.push({ t: 'clothesline', x: 0, y: 2.1, z: -45 });
  box(-20.5, 0, -30.5, -18.5, 0.5, -29.9, 'wood', 0x6a5038, { tag: 'bench' });
  zone(-16, -1, -27, -10, 3, -18, 0.25);  // shadowy side passage by the tower

  // ---- furniture: kitchen
  const W = 'wood', ctr = (x0, z0, x1, z1) => {
    box(x0, 0, z0, x1, 0.9, z1, { py: 'counter', nx: 'wood', px: 'wood', nz: 'wood', pz: 'wood', ny: 'wood' }, 0xd9cfb8);
  };
  ctr(4.3, -12.8, 7.7, -12.2);           // sink under the kitchen window
  ctr(9.2, -20.3, 9.8, -16.4);           // east counter + stove
  ctr(2.1, -20.9, 6.2, -20.3); ctr(7.8, -20.9, 9.8, -20.3);
  box(9.05, 0, -19.3, 9.8, 0.92, -18.5, 'metal', 0x2e2e33, { tag: 'stove' });
  box(8.9, 0, -13.3, 9.75, 2.0, -12.25, 'paint', 0xe8e4da, { tag: 'fridge' });
  box(4.6, 0, -17.2, 6.6, 0.8, -15.6, W, 0x8a5a3a, { tag: 'table' });
  for (const [x, z] of [[4.2, -16.4], [7.0, -16.4]]) box(x - 0.22, 0, z - 0.22, x + 0.22, 0.48, z + 0.22, W, 0x6a4128);
  decor.push({ t: 'hood', x: 9.5, y: 1.9, z: -18.9 });
  decor.push({ t: 'clock', x: 6, y: 2.4, z: -20.88, ry: 0 });
  decor.push({ t: 'pots', x: 9.45, y: 0.92, z: -18.9 });
  light(6, 2.75, -16, 0xffe2a8, 7, 11, { name: 'kitchen', flicker: 0.6 });
  decor.push({ t: 'bulb', x: 6, y: 2.95, z: -16 });
  zone(2, -1, -21, 10, 3, -12, 0.95);

  // pantry: shelves, fuse box, washing machine
  box(2.1, 0, -27.8, 9.8, 2.2, -27.25, W, 0x7a5a3c, { tag: 'shelf' });
  decor.push({ t: 'jars', x: 6, y: 0, z: -27.5 });
  box(2.1, 0, -22, 2.9, 0.95, -21.1, 'paint', 0xe8e4da);
  zone(2, -1, -28, 10, 3, -21, 0.5);
  const fusebox = { x: 9.78, y: 1.45, z: -22.4, nx: -1, powered: false };

  // living room
  box(-7.6, 0, -14.6, -4.4, 0.75, -13.7, 'fabric', 0x7a3b3b, { tag: 'sofa' });
  box(-7.6, 0.75, -14.6, -4.4, 1.15, -14.3, 'fabric', 0x6a3030);
  box(-7, 0, -20.9, -5, 0.6, -20.35, W, 0x4a3022);
  box(-6.7, 0.6, -20.82, -5.3, 1.45, -20.62, 'paint', 0x26262a, { tag: 'tv' });
  decor.push({ t: 'tvscreen', x: -6, y: 1.02, z: -20.61 });
  box(-3.7, 0, -18.4, -2.6, 0.9, -17.3, 'fabric', 0x4a5a3a, { tag: 'armchair' });
  box(-9.8, 0, -19.2, -9.3, 1.2, -17.6, 'brick', 0x8a5a48, { tag: 'fireplace' });
  box(-9.8, 0, -20.8, -9.35, 2.2, -19.7, W, 0x5a3a26, { tag: 'bookshelf' });
  vis(-8, 0.003, -19.5, -4, 0.01, -15.5, 'carpet', 0x8a6a3a);
  decor.push({ t: 'standlamp', x: -2.6, y: 0, z: -12.7 });
  decor.push({ t: 'portrait', x: -9.78, y: 1.9, z: -18.4, ry: Math.PI / 2 });
  light(-4.5, 2.2, -16.5, 0xffc98a, 5, 10, { name: 'living', flicker: 0.25 });
  zone(-10, -1, -21, -2, 3, -12, 0.75);

  // dining + bathroom
  box(-6, 0, -23.3, -4, 0.8, -22.3, W, 0x6a4128, { tag: 'table' });
  box(-9.8, 0, -24.3, -9.2, 1.4, -21.3, W, 0x5a3a26);
  box(-5.6, 0, -27.8, -4.4, 2.2, -27.15, W, 0x4e3524, { tag: 'cupboard' });
  hides.push({ id: 'cupboard', name: 'Cupboard', x: -5, y: 0, z: -27.45, yaw: Math.PI, face: [-5, -26.7] });
  decor.push({ t: 'chandelier', x: -5, y: 2.9, z: -22.8 });
  zone(-10, -1, -24.5, -2, 3, -21, 0.55); zone(-6.5, -1, -28, -2, 3, -24.5, 0.55);
  box(-9.8, 0, -27.8, -7.6, 0.6, -27.0, 'paint', 0xf2f2ee, { tag: 'bath' });
  box(-9.7, 0, -25.4, -9.2, 0.45, -24.8, 'paint', 0xf2f2ee);
  box(-7.6, 0, -25.2, -7.0, 0.85, -24.65, 'paint', 0xf2f2ee);
  zone(-10, -1, -28, -6.5, 3, -24.5, 0.5);

  // hall
  box(1.3, 0, -19, 1.9, 0.85, -17.5, W, 0x5a3a26);
  decor.push({ t: 'coatrack', x: 1.5, y: 0, z: -12.8 });
  decor.push({ t: 'clock', x: -1.88, y: 1.9, z: -25.5, ry: Math.PI / 2, tall: true });
  vis(-0.6, 0.003, -27.5, 1.6, 0.009, -12.5, 'carpet', 0x5a2a2e);
  light(0.4, 2.8, -22, 0xffd5a0, 3, 8, { name: 'hall' });
  zone(-2, -1, -28, 2, 3, -12, 0.65);
  zone(-1.9, -1, -19.6, -0.7, 3.2, -16, 0.35);

  // ---- upper floor furniture
  // bedroom
  box(-9.8, F1, -19, -7.8, F1 + 0.6, -16, 'fabric', 0x5a6a8a, { tag: 'bed' });
  box(-9.8, F1, -19, -9.6, F1 + 1.2, -16, W, 0x4e3524);
  box(-5, F1, -20.9, -3.6, F1 + 2.2, -20.2, W, 0x4e3524, { tag: 'wardrobe' });
  hides.push({ id: 'wardrobe', name: 'Wardrobe', x: -4.3, y: F1, z: -20.55, yaw: 0, face: [-4.3, -19.7] });
  box(-9.8, F1, -13.8, -9.2, F1 + 0.9, -12.3, W, 0x6a4128);
  decor.push({ t: 'lamp', x: -9.5, y: F1 + 0.9, z: -13 });
  zone(-10, F1 - 0.5, -21, -2, 6.2, -12, 0.45);
  // nursery (creepy)
  box(-9.8, F1, -24, -9.1, F1 + 2.1, -22.8, W, 0x8a6a6a, { tag: 'closet' });
  hides.push({ id: 'closet', name: 'Closet', x: -9.45, y: F1, z: -23.4, yaw: -Math.PI / 2, face: [-8.6, -23.4] });
  box(-5, F1, -27.8, -3.4, F1 + 1.0, -26.9, W, 0xe8e0d8, { tag: 'crib' });
  decor.push({ t: 'rockinghorse', x: -7.5, y: F1, z: -26.5 });
  decor.push({ t: 'blocks', x: -6, y: F1, z: -24 });
  decor.push({ t: 'mobile', x: -4.2, y: F1 + 2.3, z: -27.3 });
  zone(-10, F1 - 0.5, -28, -2, 6.2, -21, 0.4);
  // study (the red key)
  box(6, F1, -20.6, 8.2, F1 + 0.8, -19.6, W, 0x4a2e1e, { tag: 'desk' });
  box(2.2, F1, -20.9, 5.4, F1 + 2.4, -20.4, W, 0x3e2618, { tag: 'bookshelf' });
  box(9.3, F1, -14.8, 9.8, F1 + 2.4, -12.4, W, 0x3e2618, { tag: 'bookshelf' });
  decor.push({ t: 'corkboard', x: 4.5, y: F1 + 1.6, z: -12.22, ry: Math.PI });
  decor.push({ t: 'desklamp', x: 7.7, y: F1 + 0.8, z: -20.2 });
  zone(2, F1 - 0.5, -21, 10, 6.2, -12, 0.4);
  // storage
  box(9.0, F1, -24, 9.8, F1 + 2.2, -22.8, W, 0x5a4a3a, { tag: 'wardrobe' });
  hides.push({ id: 'storewardrobe', name: 'Old wardrobe', x: 9.4, y: F1, z: -23.4, yaw: Math.PI / 2, face: [8.5, -23.4] });
  box(2.4, F1, -27.8, 4.4, F1 + 1.4, -26.8, 'cardboard', 0xb08a5a);
  box(5.2, F1, -27.8, 6.6, F1 + 0.9, -27.0, 'cardboard', 0xa07a4a);
  decor.push({ t: 'mannequin', x: 8.6, y: F1, z: -26.6, ry: Math.PI * 0.8 });
  zone(2, F1 - 0.5, -28, 10, 6.2, -21, 0.3);
  // upper hall
  light(0, 5.9, -15, 0xffcf90, 2.5, 8, { name: 'upper', flicker: 0.4, high: true });
  zone(-2, F1 - 0.5, -28, 2, 6.2, -12, 0.5);
  decor.push({ t: 'portrait', x: -1.88, y: F1 + 1.8, z: -18, ry: Math.PI / 2 });
  // attic
  box(-4.9, F2, -21, -4.1, F2 + 2.0, -19.8, W, 0x4a3a2a, { tag: 'wardrobe' });
  hides.push({ id: 'atticwardrobe', name: 'Old wardrobe', x: -4.5, y: F2, z: -20.4, yaw: -Math.PI / 2, face: [-3.6, -20.4] });
  box(2.5, F2, -26.9, 4.2, F2 + 0.7, -26.1, W, 0x6a4a2a, { tag: 'trunk' });
  box(-4.9, F2, -26.9, -3.5, F2 + 1.0, -25.5, 'cardboard', 0xa07a4a);
  decor.push({ t: 'mannequin', x: 3.5, y: F2, z: -18, ry: Math.PI });
  decor.push({ t: 'rockingchair', x: -2.5, y: F2, z: -25.5, ry: 0.6 });
  decor.push({ t: 'bulb', x: 0, y: A1 - 0.05, z: -22, hang: true });
  light(0, A1 - 0.4, -22, 0xffd08a, 2.6, 9, { name: 'attic', flicker: 0.5, high: true });
  zone(-5, F2 - 0.5, -27, 5, A1, -17, 0.35);

  // ---- hiding spots outside
  box(15.6, 0.08, -42.4, 16.4, 2.1, -41.3, W, 0x5a4030, { tag: 'locker' });
  hides.push({ id: 'shedlocker', name: 'Tool cupboard', x: 16, y: 0.08, z: -41.85, yaw: Math.PI, face: [16, -42.8] });
  box(11.0, 0, -20.3, 12.2, 2.1, -19.6, 'metal', 0x5d6470, { tag: 'locker' });
  hides.push({ id: 'garagelocker', name: 'Locker', x: 11.6, y: 0, z: -19.95, yaw: Math.PI, face: [11.6, -19.2] });

  // ---- items
  item('crate', 20.2, 0, -10.6, 'crateFront');
  item('crate', -4, 0, -50, 'crateBack');
  item('crate', 16.4, 0.08, -44.6, 'crateShed');
  item('crate', 4.2, 0, -26.4, 'cratePantry');
  item('crowbar', 19.2, 0.95, -44.4, 'crowbar');
  item('fuse', 16.6, 0.95, -19.85, 'fuse');
  item('redkey', 7.1, F1 + 0.8, -20.1, 'redkey');
  // throwables
  item('can', 8.2, 0.12, -7.0); item('bottle', 19.6, 1.05, -7.8); item('can', -1.6, 0.15, -10.4);
  item('apple', -6.5, 0.22, -38.6); item('apple', -8.7, 0.22, -39.7); item('ball', 4, 0, -42);
  item('plate', 5.2, 0.8, -16.4); item('bottle', 6.6, 0.9, -12.5); item('can', 9.5, 0.9, -17);
  item('vase', -9.55, 1.2, -18.4); item('book', -6.5, 0.75, -14.2);
  item('paint', 15.8, 0.95, -19.9); item('can', 13.3, 1.35, -15.2);
  item('radio', 3.4, F2 + 0.7, -26.5); item('ball', -6.3, F1, -24.6); item('book', -8.3, F1 + 0.6, -17.6);
  item('bottle', 2.6, 0.95, -21.5); item('can', 3.4, 0, -10.8, 'canLawn');
  item('vase', 1.6, 0.85, -18.3); item('book', 5.5, F1 + 0.8, -20.1);
  item('can', 4.5, 0.12, 5.1); item('ball', -2.2, 0, 8.2);

  // ---- the neighbour's routine (points of interest)
  const poi = (id, x, y, z, look, dur, anim, w = 1) => pois.push({ id, x, y, z, look, dur, anim, w });
  poi('stove', 8.3, 0, -18.9, -Math.PI / 2, 10, 'cook', 3);
  poi('tv', -4.4, 0, -16.2, 0, 11, 'watch', 2);
  poi('garden', -8, 0, -37.2, 0, 11, 'dig', 2);
  poi('bedroom', -6.6, F1, -16.5, Math.PI / 2, 8, 'idle', 1.5);
  poi('attic', -1.2, F2, -22.4, 0, 6, 'idle', 1);
  poi('frontyard', 0.4, 0, -8.6, Math.PI, 7, 'stare', 1.5);
  poi('basement', 8.6, 0, -24.5, -Math.PI / 2, 6, 'guard', 2);
  poi('study', 5.5, F1, -17.5, 0, 6, 'idle', 1);
  poi('garage', 16.4, 0, -16.2, Math.PI / 2, 6, 'idle', 1);
  poi('shed', 12.6, 0, -43.5, -Math.PI / 2, 5, 'idle', 1);

  // ---- security camera mounts the neighbour can use once he learns
  const mount = (id, x, y, z, tx, tz, name) => camMounts.push({ id, x, y, z, yaw: Math.atan2(-(tx - x), -(tz - z)), name });
  mount('porch', 2.85, 2.6, -11.75, 0, -4, 'the porch');
  mount('back', -1.2, 2.7, -28.25, 0, -42, 'the back yard');
  mount('kitchen', 9.65, 2.6, -20.75, 4, -13, 'the kitchen');
  mount('hall', 1.75, 2.75, -12.35, 0, -24, 'the hallway');
  mount('upper', 1.75, 5.95, -12.35, 0, -24, 'the landing');
  mount('garageside', 18.25, 2.8, -12.4, 22, -22, 'the garage');
  mount('pantry', 2.35, 2.7, -27.65, 9, -22, 'the pantry');
  mount('west', -10.25, 2.8, -12.4, -14, -28, 'the side passage');
  mount('shed', 13.85, 2.4, -41.2, 6, -36, 'the shed');

  // ---- entry points (for learning). pos is the outside approach point.
  const entries = {
    frontDoor: { name: 'front door', kind: 'door', ref: 'front', x: 0, z: -11.2 },
    backDoor: { name: 'back door', kind: 'door', ref: 'back', x: 0.5, z: -29 },
    kitchenWindow: { name: 'kitchen window', kind: 'window', ref: 'kitchenW', x: 6, z: -11.2 },
    livingWindow: { name: 'living room window', kind: 'window', ref: 'livingW', x: -6, z: -11.2 },
    livingSide: { name: 'side window', kind: 'window', ref: 'livingSide', x: -10.8, z: -14 },
    bathWindow: { name: 'bathroom window', kind: 'window', ref: 'bathW', x: -8.5, z: -28.8 },
    garageWindow: { name: 'garage window', kind: 'window', ref: 'garageW', x: 18.8, z: -16 },
    porchRoof: { name: 'landing window', kind: 'window', ref: 'hallUpW', x: 0, z: -11.2, high: true },
    studyWindow: { name: 'study window', kind: 'window', ref: 'studyEW', x: 10.8, z: -16.5, high: true },
    studyFront: { name: 'study window', kind: 'window', ref: 'studyFW', x: 6, z: -11.2, high: true },
    bedroomWindow: { name: 'bedroom window', kind: 'window', ref: 'bedW', x: -6, z: -11.2, high: true },
    nurseryWindow: { name: 'nursery window', kind: 'window', ref: 'kidW', x: -6, z: -28.8, high: true },
    storageWindow: { name: 'storage window', kind: 'window', ref: 'storeW', x: 6, z: -28.8, high: true },
  };

  mission = 0;
  const targets = [];

  // where you wake up after being caught
  const spawn = { x: -1.6, y: 0, z: 15.4, yaw: Math.atan2(-1.6, 5.2) };  // facing your front door

  return {
    boxes, doors, windows, items, decor, lights, lightZones, hides, pois, camMounts, roofs, regions, holes,
    entries, spawn, fusebox, mission, targets,
    navBounds: { x0: -28, z0: -57.5, x1: 28, z1: 8 },
    reachBounds: { x0: -34, z0: -59.5, x1: 34, z1: 22 },
    basementTrigger: makeBox(10.45, -1, -25.3, 12.8, 2.5, -23.7),
    outdoorLight: 0.7,
  };
}

// ---------------------------------------------------------------- door / window geometry
// Closed leaf, open leaf and opening boxes; shared by physics, perception and render.
export function doorBoxes(d) {
  const half = d.w / 2;
  if (d.axis === 'x') {
    const opening = makeBox(d.c - half, d.y, d.t0, d.c + half, d.y + d.h, d.t1);
    const closed = makeBox(d.c - half, d.y, (d.t0 + d.t1) / 2 - 0.04, d.c + half, d.y + d.h, (d.t0 + d.t1) / 2 + 0.04);
    const hx = d.c + d.hinge * half - d.hinge * 0.05;
    const face = d.swing > 0 ? d.t1 : d.t0;
    const open = makeBox(hx - 0.04, d.y, face, hx + 0.04, d.y + d.h, face + d.swing * (d.w - 0.1));
    return { opening, closed, openBox: open, hingePos: [d.c + d.hinge * half, (d.t0 + d.t1) / 2] };
  }
  const opening = makeBox(d.t0, d.y, d.c - half, d.t1, d.y + d.h, d.c + half);
  const closed = makeBox((d.t0 + d.t1) / 2 - 0.04, d.y, d.c - half, (d.t0 + d.t1) / 2 + 0.04, d.y + d.h, d.c + half);
  const hz = d.c + d.hinge * half - d.hinge * 0.05;
  const face = d.swing > 0 ? d.t1 : d.t0;
  const open = makeBox(face, d.y, hz - 0.04, face + d.swing * (d.w - 0.1), d.y + d.h, hz + 0.04);
  return { opening, closed, openBox: open, hingePos: [(d.t0 + d.t1) / 2, d.c + d.hinge * half] };
}

export function windowBox(w) {
  const half = w.w / 2;
  return w.axis === 'x' ? makeBox(w.c - half, w.sill, w.t0, w.c + half, w.top, w.t1) : makeBox(w.t0, w.sill, w.c - half, w.t1, w.top, w.c + half);
}
export function windowCenter(w) {
  const m = (w.t0 + w.t1) / 2, y = (w.sill + w.top) / 2;
  return w.axis === 'x' ? [w.c, y, m] : [m, y, w.c];
}
export function doorCenter(d) {
  const m = (d.t0 + d.t1) / 2, y = d.y + 1.0;
  return d.axis === 'x' ? [d.c, y, m] : [m, y, d.c];
}
