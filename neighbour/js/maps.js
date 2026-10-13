// Levels 2 and 3: two separate collision maps. Basement floors sit at y=0; a house's ground floor and
// the cellar hatch landing sit at y=3.2 (and an upper floor at 6.4), so the shared stair, item and
// navigation physics work unchanged. Both maps use the extraction rules in world.js: collect the
// target, restore power, then reach `exit`.
import { makeBox } from './geom.js';

const H = 3.2, U = 6.4;

function kit(L) {
  const box = (x0, y0, z0, x1, y1, z1, m = 'concrete', c = 0xffffff, extra = {}) => {
    const b = makeBox(x0, y0, z0, x1, y1, z1, { m, c, col: true, vis: true, op: true, ...extra }); L.boxes.push(b); return b;
  };
  const detail = (...args) => { const b = box(...args); b.col = false; b.op = false; return b; };
  // A wall with any number of openings; each opening is [centre, width, bottom, top].
  function wall(axis, t, a, b, y, h, openings = [], mat = 'brick', color = 0x8c8276) {
    const seg = (u, v, lo, hi) => {
      if (v - u < 0.01 || hi - lo < 0.01) return;
      if (axis === 'x') box(u, lo, t, v, hi, t + 0.2, mat, color); else box(t, lo, u, t + 0.2, hi, v, mat, color);
    };
    const ops = openings.filter(Boolean).sort((p, q) => p[0] - q[0]);
    let u = a;
    for (const [c, w, lo, hi] of ops) {
      seg(u, c - w / 2, y, y + h); seg(c - w / 2, c + w / 2, y, lo); seg(c - w / 2, c + w / 2, hi, y + h); u = c + w / 2;
    }
    seg(u, b, y, y + h);
  }
  function door(id, axis, t, c, y, lock = null, name = 'Door', inside = -1, tint) {
    L.doors.push({ id, axis, c, t0: t, t1: t + 0.2, y, w: 1.6, h: 2.2, swing: 1, hinge: -1, lock, open: false, name, mat: 'door',
      tint: tint ?? (lock === 'red' ? 0x922e32 : lock === 'power' ? 0x3d4f73 : 0x7a5a3c), inside, chained: false });
    return [c, 1.6, y, y + 2.2];
  }
  function win(id, axis, t, c, sill, w, name, opts = {}) {
    L.windows.push({ id, axis, c, t0: t, t1: t + 0.2, sill, top: sill + (opts.h || 1.2), w, glass: opts.glass !== false, boards: !!opts.boards,
      breakable: opts.breakable !== false, name, outside: opts.outside || 1, learned: false, entry: opts.entry || null });
    return [c, w, sill, sill + (opts.h || 1.2)];
  }
  function lamp(name, x, y, z, color = 0xffce8b, power = false, intensity = 3.5) {
    detail(x - 0.3, y - 0.06, z - 0.3, x + 0.3, y + 0.06, z + 0.3, 'emissive', color);
    L.lights.push({ name, x, y: y - 0.15, z, color, intensity, dist: 9, power });
  }
  function table(x, y, z, color = 0x775b3f, w = 1, d = 0.48) {
    box(x - w, y + 0.72, z - d, x + w, y + 0.86, z + d, 'woodfloor', color);
    for (const dx of [-w + 0.18, w - 0.18]) for (const dz of [-d + 0.14, d - 0.14]) box(x + dx - 0.06, y, z + dz - 0.06, x + dx + 0.06, y + 0.72, z + dz + 0.06, 'wood', color);
  }
  function shelves(x, y, z, axis = 'x', tint = 0x92765a) {
    const [hx, hz] = axis === 'x' ? [0.8, 0.34] : [0.34, 0.8];
    if (axis === 'x') { box(x - hx, y, z - hz, x - hx + 0.1, y + 2.1, z + hz, 'metal', 0x45565b); box(x + hx - 0.1, y, z - hz, x + hx, y + 2.1, z + hz, 'metal', 0x45565b); }
    else { box(x - hx, y, z - hz, x + hx, y + 2.1, z - hz + 0.1, 'metal', 0x45565b); box(x - hx, y, z + hz - 0.1, x + hx, y + 2.1, z + hz, 'metal', 0x45565b); }
    for (const sy of [0.15, 0.8, 1.5, 2.05]) box(x - hx, y + sy, z - hz, x + hx, y + sy + 0.08, z + hz, 'board', tint);
  }
  const item = (id, type, x, y, z, name) => L.items.push({ id, type, x, y, z, missionName: name });
  // Open-fronted locker; `face` is the side the opening points to: '+z', '-z', '+x' or '-x'.
  function hide(id, x, y, z, face = '+z', tint = 0x476469) {
    const s = face[0] === '+' ? 1 : -1;
    if (face[1] === 'z') {
      box(x - 0.55, y, z - 0.5, x - 0.47, y + 2.05, z + 0.45, 'board', tint); box(x + 0.47, y, z - 0.5, x + 0.55, y + 2.05, z + 0.45, 'board', tint);
      box(x - 0.55, y, z - s * 0.5 - 0.04, x + 0.55, y + 2.05, z - s * 0.5 + 0.04, 'board', tint);
      box(x - 0.55, y + 2.05, z - 0.5, x + 0.55, y + 2.15, z + 0.5, 'board', tint);
      L.hides.push({ id, name: 'Locker', x, y, z, face: [x, z + s] });
    } else {
      box(x - 0.5, y, z - 0.55, x + 0.45, y + 2.05, z - 0.47, 'board', tint); box(x - 0.5, y, z + 0.47, x + 0.45, y + 2.05, z + 0.55, 'board', tint);
      box(x - s * 0.5 - 0.04, y, z - 0.55, x - s * 0.5 + 0.04, y + 2.05, z + 0.55, 'board', tint);
      box(x - 0.5, y + 2.05, z - 0.55, x + 0.5, y + 2.15, z + 0.55, 'board', tint);
      L.hides.push({ id, name: 'Locker', x, y, z, face: [x + s, z] });
    }
  }
  const poi = (id, x, y, z, w = 1, anim = 'idle') => L.pois.push({ id, x, y, z, look: 0, dur: 5, anim, w });
  // Sixteen 20 cm risers on 40 cm treads, rising from y0 at zStart towards dir (+1 south / -1 north).
  function stairs(x0, x1, zStart, dir, y0, tint = 0x858b90, mat = 'concrete') {
    for (let i = 0; i < 16; i++) {
      const za = zStart + dir * i * 0.4, zb = zStart + dir * (i + 1) * 0.4;
      box(x0, y0, Math.min(za, zb), x1, y0 + (i + 1) * 0.2, Math.max(za, zb), mat, tint, { tag: 'stair' });
      detail(x0 + 0.02, y0 + (i + 1) * 0.2, Math.min(za, zb) + (dir > 0 ? 0 : 0.34), x1 - 0.02, y0 + (i + 1) * 0.2 + 0.012, Math.min(za, zb) + (dir > 0 ? 0.06 : 0.4), 'trim', 0xd9bc72);
    }
  }
  function room(x0, y0, z0, x1, y1, z1, light = 0.4) { L.regions.push(makeBox(x0, y0, z0, x1, y1, z1)); L.lightZones.push({ box: makeBox(x0, y0, z0, x1, y1, z1), level: light }); }
  const mount = (id, x, y, z, tx, tz, name) => L.camMounts.push({ id, x, y, z, yaw: Math.atan2(-(tx - x), -(tz - z)), name });
  return { box, detail, wall, door, win, lamp, table, shelves, item, hide, poi, stairs, room, mount };
}

function base(mission, extra) {
  return Object.assign({
    mission, boxes: [], doors: [], windows: [], items: [], decor: [], lights: [], lightZones: [], hides: [], pois: [], camMounts: [],
    roofs: [], regions: [], holes: [], entries: {}, safeZones: [], collectTargets: true, requirePower: true,
    basementTrigger: makeBox(500, -100, 500, 501, -99, 501), // off-map: these levels win through `exit` instead
  }, extra);
}

// ------------------------------------------------------------------------------------------------
// Level 2: The Cold Cellar. You come down a hatch into the basement under his house.
//   bolted laundry (break its corridor window, or slide the bolt from inside) -> fuse ->
//   fuse box in the pump room -> the cold room's electric door opens -> red key ->
//   red-padlocked vault -> the jar -> back up the stairs to the hatch.
function buildCellar() {
  const L = base(1, {
    targets: ['jar'], indoor: true, outdoorLight: 0.25, groundVisualY: -0.05,
    titleCamera: { from: [10, 4.7, 2.6], to: [4, 0.6, -12] },
  });
  const { box, detail, wall, door, win, lamp, table, shelves, item, hide, poi, stairs, room, mount } = kit(L);
  const wallH = 3.05, stone = 0x7d7468, damp = 0x6d6a62;

  // Shell: floor, outer walls and a ceiling slab with the stair shaft cut out.
  box(-14, -0.3, -26, 14, 0, 3.2, 'concrete', 0x6f7377);
  wall('x', -26, -14, 14, 0, wallH, [], 'block', stone);
  wall('x', 3, -14, 14, 0, wallH, [], 'block', stone);
  wall('z', -14, -26, 3.2, 0, wallH, [], 'block', stone);
  wall('z', 13.8, -26, 3.2, 0, wallH, [], 'block', stone);
  box(-14, 3.05, -26, 9, 3.3, 3.2, 'concrete', 0x5f6264);
  box(11, 3.05, -26, 14, 3.3, 3.2, 'concrete', 0x5f6264);
  box(9, 3.05, -26, 11, 3.3, -6.4, 'concrete', 0x5f6264);
  L.holes = [[-15, -27, 15, 5]];

  // Hatch stairs: landing at y=3.2 in the south-east, descending north into the corridor.
  stairs(9, 11, -6.4, 1, 0, 0x6f655a, 'wood');
  box(9, 3.0, 0, 11, H, 3, 'woodfloor', 0x6c5238);
  wall('z', 8.8, -6.8, 3, 0, 5.9, [], 'block', damp);
  wall('z', 11, -6.8, 3, 0, 5.9, [], 'block', damp);
  wall('x', -6.6, 9, 11, 3.05, 2.85, [], 'block', damp);
  box(8.8, 3.05, 3, 11.2, 5.9, 3.2, 'block', damp);
  box(8.8, 5.9, -6.6, 11.2, 6.1, 3.2, 'plaster', 0x8d8a80);
  // The hatch itself: a lit square of evening sky above the landing.
  detail(9.2, 5.86, 0.6, 10.8, 5.9, 2.6, 'emissive', 0x9fb7cf);
  lamp('hatch', 10, 5.7, 1.6, 0xb9d3e6, false, 2.5);
  L.spawn = { x: 10, y: H, z: 1.6, yaw: 0 };
  L.exit = makeBox(9.1, 3.0, 0.3, 10.9, 5.5, 2.9);
  L.safeZones.push(makeBox(8.95, 2.95, -0.1, 11.05, 5.9, 3.05));

  // Corridor (z -10..-7) runs the full width. South side: laundry (bolted) and workshop.
  wall('x', -7, -14, 8.8, 0, wallH, [
    door('laundry', 'x', -7, -11, 0, 'bolt', 'Laundry door', 1),
    win('laundryW', 'x', -7, -7, 0.9, 1.4, 'Laundry hatch window', { outside: -1 }),
    door('workshop', 'x', -7, 3, 0, null, 'Workshop door'),
  ], 'block', stone);
  wall('x', -7, 11.2, 13.8, 0, wallH, [], 'block', stone);
  wall('z', -4, -6.8, 3, 0, wallH, [], 'block', stone);
  // North side: the vault (red padlock), the cold room (electric lock) and the pump room.
  wall('x', -10.2, -14, 13.8, 0, wallH, [
    door('basement', 'x', -10.2, -9, 0, 'red', 'Vault door'),
    door('study', 'x', -10.2, 0, 0, 'power', 'Cold room electric door'),
    door('pump', 'x', -10.2, 9, 0, null, 'Pump room door'),
  ], 'block', stone);
  wall('z', -4, -26, -10.2, 0, wallH, [], 'block', stone);
  wall('z', 4, -18, -10.2, 0, wallH, [], 'block', stone);
  wall('x', -18.2, -3.8, 13.8, 0, wallH, [door('crawl', 'x', -18.2, 9, 0, null, 'Crawlspace door')], 'block', stone);

  // Laundry: two washing machines, a mangle, hanging sheets, and the fuse on the folding table.
  for (const x of [-13.2, -12.2]) { box(x, 0, 2.1, x + 0.9, 0.9, 2.95, 'metal', 0xd7d9d2); detail(x + 0.2, 0.35, 2.08, x + 0.7, 0.75, 2.1, 'glass', 0x7d97a6); }
  box(-6.5, 0, 1.9, -4.3, 0.9, 2.95, 'counter', 0x9aa79a);
  for (const x of [-12, -10, -8]) detail(x, 1.2, -2.6, x + 1.4, 2.4, -2.55, 'fabric', 0xe2ddd0);
  detail(-13.8, 2.45, -2.6, -4.2, 2.5, -2.55, 'metal', 0x555b5f);
  table(-9, 0, 0.6, 0x8a7457);
  item('fuse', 'fuse', -9, 0.87, 0.6, 'Fuse');
  lamp('laundry', -9, 2.95, -1, 0xfff0c8);

  // Workshop: the boiler, a workbench, paint tins, pipes, and a locker to hide in.
  box(-3.4, 0, 1.4, -1.6, 2.3, 2.95, 'metal', 0x5a7681); detail(-3.2, 1.1, 1.38, -1.8, 1.25, 1.4, 'emissive', 0xf0a040);
  for (const x of [-3, -2]) detail(x, 2.3, 1.9, x + 0.14, 3.05, 2.04, 'metal', 0x8e5c42);
  table(2, 0, 2.3, 0x6b5136, 1.3, 0.5);
  box(5.6, 0, 2.2, 8.6, 1.4, 2.95, 'board', 0x6d5a45);
  hide('workLocker', 7.6, 0, -5.9, '+z');
  lamp('stove', 1, 2.95, -2);
  poi('stove', 1, 0, -2, 3);

  // Corridor clutter and things to throw.
  for (const x of [-13.5, 13.4]) detail(x, 2.55, -10, x + 0.12, 2.7, -7, 'metal', 0x8e5c42);
  detail(-13.9, 2.6, -8.6, 13.7, 2.74, -8.46, 'metal', 0x8e5c42);
  item('can1', 'can', -2, 0, -8.4); item('bottle1', 'bottle', 5.5, 0, -8.3); item('can2', 'can', -12.5, 0, -9.2);
  lamp('corridor', -7, 2.95, -8.5, 0xffd9a0); lamp('corridor2', 6, 2.95, -8.5, 0xffd9a0);
  poi('corridor', -5, 0, -8.5, 3); poi('stairfoot', 10, 0, -8.6, 1);

  // Vault (red padlock): wine racks, a chained chest, and the jar on a draped table.
  for (const [x, z] of [[-12.6, -22], [-12.6, -17], [-5.3, -22], [-5.3, -17]]) shelves(x, 0, z, 'z', 0x5c3a2e);
  for (const [x, z] of [[-12.6, -22], [-12.6, -17], [-5.3, -22], [-5.3, -17]]) for (const dy of [0.25, 0.9, 1.6]) detail(x - 0.25, dy, z - 0.7, x + 0.25, dy + 0.12, z + 0.7, 'glass', 0x3c5a3a);
  table(-9, 0, -23.5, 0x4a3226);
  detail(-10, 0.86, -24, -8, 0.88, -23, 'fabric', 0x6e1f1f);
  item('jar', 'vase', -9, 0.87, -23.5, 'The jar with his name on it');
  box(-13.5, 0, -14, -11.5, 0.7, -12.6, 'wood', 0x5a4030);
  lamp('basement', -9, 2.95, -18, 0xe0604a);

  // Cold room (electric lock): steel shelving, hanging hooks, and the red key on the counter.
  for (const x of [-3, 3]) shelves(x, 0, -14, 'z', 0x9aa8b0);
  for (const x of [-1.5, 0, 1.5]) detail(x - 0.04, 2.1, -17.5, x + 0.04, 3.05, -17.4, 'metal', 0xb6bec4);
  table(0, 0, -16.6, 0xa9b4ba, 1.1, 0.5);
  item('redkey', 'redkey', 0, 0.87, -16.6, 'Red key');
  lamp('cold', 0, 2.95, -14, 0x9fd6ff, true);

  // Pump room: sump pump, pressure tank, and the fuse box on the east wall.
  box(6, 0, -17.6, 7.6, 1.2, -16.2, 'metal', 0x4f6e6a); box(10.8, 0, -17.6, 12.4, 2.2, -16, 'metal', 0x6b7d86);
  detail(7.6, 0.9, -16.95, 10.8, 1.05, -16.8, 'metal', 0x8e5c42);
  L.fusebox = { x: 13.6, y: 1.35, z: -13.5 };
  lamp('pump', 9, 2.95, -14, 0xffc890);
  poi('pump', 9.5, 0, -13, 2);
  hide('pumpLocker', 5, 0, -13, '+x');

  // Crawlspace: crates, old furniture under sheets, and a dripping pipe.
  for (const [x, z] of [[0, -21], [6, -24], [11, -21.5]]) { box(x - 0.9, 0, z - 0.6, x + 0.9, 0.9, z + 0.6, 'fabric', 0xb9b2a2); }
  item('crate1', 'crate', 3.5, 0, -20); item('crate2', 'crate', 8.5, 0, -24.6); item('ball1', 'ball', -2, 0, -24);
  hide('crawlLocker', -1.6, 0, -25.2, '+z');
  detail(-3.8, 2.6, -22.1, 13.8, 2.74, -21.95, 'metal', 0x8e5c42);
  lamp('crawl', 5, 2.95, -22, 0xd8b583, false, 2.4);
  poi('crawl', 5, 0, -19.6, 2);

  room(-14, -0.1, -26, 14, 3.05, 3.2, 0.34);
  room(8.8, 2.9, -6.6, 11.2, 5.9, 3.2, 0.6);
  L.places = [['the laundry', -9, 0, -1], ['the workshop', 2, 0, -2], ['the corridor', 0, 0, -8.5], ['the stair foot', 10, 0, -6],
    ['the vault door', -9, 0, -11], ['the cold room', 0, 0, -14], ['the pump room', 9, 0, -14], ['the crawlspace', 5, 0, -22]];
  mount('corridorCam', 13.5, 2.7, -8.5, 0, -8.5, 'the corridor');
  mount('stairCam', 8.6, 2.7, -9.6, 10, -4, 'the stair foot');
  L.navBounds = { x0: -13.7, z0: -25.7, x1: 13.7, z1: 2.9 }; L.reachBounds = L.navBounds;
  L.objective = w => {
    if (w.steps.jar !== undefined) return 'You have the jar. Get back UP the stairs to the hatch.';
    if (!w.flags.power) return w.hasItem('fuse') ? 'Put the fuse in the fuse box in the pump room (north-east).' : 'Find a fuse. The laundry is bolted — maybe its window will break.';
    if (!w.hasItem('redkey') && w.doorById.basement.locked) return 'The cold room has power. Take the red key from its counter.';
    if (w.doorById.basement.locked) return 'Unlock the red padlock on the vault door (north-west).';
    return 'Take the jar from the vault.';
  };
  return L;
}

// ------------------------------------------------------------------------------------------------
// Level 3: Mulberry Close. The street from level 1 (same road, your same little brick house, the
// houses either side), with a new neighbour opposite: a single-storey house with an attached garage
// and a basement under all of it. Everything above ground sits at y=H so the basement can be at y=0.
//   crowbar (greenhouse) -> garage stairs -> pry the boarded storage hatch in the basement -> fuse ->
//   fuse box (boiler room) -> his study's electric door opens -> red key -> basement vault ->
//   photo album -> home across the road.
const SIDING = 0x4d6b58, TRIM = 0xece6d6, ROOF = 0x2c333c;

// Level 1's street and your house, lifted to ground height y.
function street(L, K, y) {
  const { box } = K;
  const vis = (x0, y0, z0, x1, y1, z1, m, c) => box(x0, y0, z0, x1, y1, z1, m, c, { col: false, op: false });
  const inv = (x0, y0, z0, x1, y1, z1) => box(x0, y0, z0, x1, y1, z1, null, 0, { vis: false, op: false });
  const faces = (side, negF, posF, axis) => (axis === 'x'
    ? { nz: negF, pz: posF, nx: side, px: side, py: side, ny: side }
    : { nx: negF, px: posF, nz: side, pz: side, py: side, ny: side });
  function wall(axis, t0, t1, a, b, y0, y1, negF, posF, ops, tintN, tintP) {
    const f = faces('trim', negF, posF, axis), tint = axis === 'x' ? { nz: tintN, pz: tintP } : { nx: tintN, px: tintP };
    const seg = (s0, s1, ya, yb) => {
      if (s1 - s0 < 1e-3 || yb - ya < 1e-3) return;
      const bb = axis === 'x' ? box(s0, ya, t0, s1, yb, t1, f, 0xffffff) : box(t0, ya, s0, t1, yb, s1, f, 0xffffff);
      bb.tf = tint;
    };
    let s = a;
    for (const o of ops.slice().sort((p, q) => p.c - q.c)) {
      seg(s, o.c - o.w / 2, y0, y1); seg(o.c - o.w / 2, o.c + o.w / 2, y0, o.lo); seg(o.c - o.w / 2, o.c + o.w / 2, o.hi, y1); s = o.c + o.w / 2;
    }
    seg(s, b, y0, y1);
  }
  const picket = (a, b, z, h, c) => {
    inv(a, y, z - 0.07, b, y + h, z + 0.07);
    for (let x = a + 0.07; x < b - 0.03; x += 0.17) {
      vis(x - 0.045, y, z - 0.025, x + 0.045, y + h - 0.06, z + 0.025, 'trim', c);
      vis(x - 0.03, y + h - 0.06, z - 0.02, x + 0.03, y + h, z + 0.02, 'trim', c);
    }
    vis(a, y + h * 0.22, z - 0.06, b, y + h * 0.22 + 0.07, z - 0.025, 'trim', c);
    vis(a, y + h * 0.72, z - 0.06, b, y + h * 0.72 + 0.07, z - 0.025, 'trim', c);
  };
  const light = (x, ly, z, color, intensity, dist, o = {}) => L.lights.push(Object.assign({ x, y: y + ly, z, color, intensity, dist }, o));
  const asphalt = { py: 'asphalt', nx: 'asphalt', px: 'asphalt', ny: 'asphalt', nz: 'asphalt', pz: 'asphalt' };

  // road, dashed centre line, raised pavements and kerbs
  vis(-34.5, y - 0.1, -4, 34.5, y + 0.005, 4, asphalt, 0x9a9aa2);
  for (let x = -33; x < 33; x += 6) vis(x, y + 0.005, -0.08, x + 3, y + 0.01, 0.08, 'paint', 0xe8dd9a);
  box(-34.5, y - 0.1, -6, 34.5, y + 0.12, -4, 'paving', 0xc9c3b8);
  box(-34.5, y - 0.1, 4, 34.5, y + 0.12, 6, 'paving', 0xc9c3b8);
  vis(-34.5, y - 0.1, -4.12, 34.5, y + 0.13, -4, 'concrete', 0xa8a39a);
  vis(-34.5, y - 0.1, 4, 34.5, y + 0.13, 4.12, 'concrete', 0xa8a39a);
  for (const [x, z, ry] of [[-14, 5.4, Math.PI], [14, 5.4, Math.PI], [-3, -5.4, 0], [-24, -5.4, 0], [24, -5.4, 0]]) {
    box(x - 0.09, y + 0.12, z - 0.09, x + 0.09, y + 4.6, z + 0.09, 'metal', 0x3a3d44);
    L.decor.push({ t: 'streetlamp', x, y, z, ry });
  }
  light(-3, 4.3, -4.6, 0xffc777, 9, 14, { name: 'street' });
  light(14, 4.3, 4.6, 0xffc777, 7, 12, { name: 'street2' });

  // your house: exactly level 1's
  const z0 = 10, z1 = 18, x0 = -5, x1 = 5, h = 2.8, T = 0.2;
  const op = (c, lo, hi, w = 1.3) => ({ c, w, lo, hi });
  box(x0, y - 0.1, z0, x1, y, z1, { py: 'woodfloor', ny: 'trim', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, 0xb07a4a);
  wall('x', z0, z0 + T, x0, x1, y, y + h, 'brick', 'paper3', [op(0, y, y + 2.1), op(-3, y + 1, y + 2.1), op(3, y + 1, y + 2.1)], 0xa04a3a, 0xc9d7e8);
  wall('x', z1 - T, z1, x0, x1, y, y + h, 'paper3', 'brick', [op(2.5, y + 1, y + 2.1)], 0xc9d7e8, 0xa04a3a);
  wall('z', x0, x0 + T, z0, z1, y, y + h, 'brick', 'paper3', [], 0xa04a3a, 0xc9d7e8);
  wall('z', x1 - T, x1, z0, z1, y, y + h, 'paper3', 'brick', [op(14, y + 1, y + 2.1)], 0xc9d7e8, 0xa04a3a);
  box(x0 - 0.1, y + h, z0 - 0.1, x1 + 0.1, y + h + 0.2, z1 + 0.1, { ny: 'plaster', py: 'trim', nx: 'trim', px: 'trim', nz: 'trim', pz: 'trim' }, 0xeeeae2);
  L.roofs.push({ x0: x0 - 0.5, x1: x1 + 0.5, z0: z0 - 0.6, z1: z1 + 0.6, y: y + h + 0.2, h: 2.2, ridge: 'x', tint: 0x4b4f5c, gable: 0xa04a3a });
  const glass = (a, b, c, d, e, f) => box(a, b, c, d, e, f, 'glass', 0xbfe0ff, { op: false });
  for (const c of [-3, 3]) glass(c - 0.65, y + 1, z0 + 0.08, c + 0.65, y + 2.1, z0 + 0.12);
  glass(1.85, y + 1, z1 - 0.12, 3.15, y + 2.1, z1 - 0.08);
  glass(x1 - 0.12, y + 1, 13.35, x1 - 0.08, y + 2.1, 14.65);
  L.doors.push({ id: 'home', axis: 'x', c: 0, t0: z0, t1: z0 + T, y, w: 1.3, h: 2.1, swing: 1, hinge: -1, lock: null, open: true,
    name: 'Front door', mat: 'door', tint: 0x2f5a8a, entry: null, inside: null, chained: false, room: null });
  box(-4.8, y, 15.6, -2.9, y + 0.5, 17.8, 'fabric', 0x3d6fb0);
  box(-4.8, y + 0.5, 17.1, -2.9, y + 0.62, 17.8, 'fabric', 0xf2efe6);
  box(-4.8, y, 17.65, -2.9, y + 1.1, 17.8, 'wood', 0x7a5236);
  box(2.6, y, 16.9, 4.8, y + 0.78, 17.8, 'wood', 0x9b6b43);
  box(3.6, y, 10.2, 4.8, y + 2.1, 10.9, 'wood', 0x6f4a30);
  vis(-2.5, y + 0.001, 12.5, 1.5, y + 0.012, 15.5, 'fabric', 0xb5523b);
  L.decor.push({ t: 'lamp', x: 4.4, y: y + 0.78, z: 17.4 });
  L.decor.push({ t: 'poster', x: -1, y: y + 1.7, z: 17.79, ry: Math.PI, c: 0x2b6c5a });
  L.decor.push({ t: 'poster', x: x0 + 0.21, y: y + 1.6, z: 13, ry: Math.PI / 2, c: 0x8a3b56 });
  L.decor.push({ t: 'binoculars', x: 3.7, y: y + 0.78, z: 17.2 });
  light(0.5, 1.9, 14.6, 0xffe6c4, 3.2, 8, { name: 'home' });
  L.lightZones.push({ box: makeBox(x0, y - 1, z0, x1, y + 3, z1), level: 0.8 });
  vis(-0.8, y, 6, 0.8, y + 0.02, 10, 'paving', 0xb9b2a6);
  L.decor.push({ t: 'mailbox', x: 1.6, y, z: 6.6, ry: Math.PI, c: 0x2f5a8a });
  box(5.6, y, 6.6, 9.8, y + 1.3, 9.2, null, 0, { vis: false, tag: 'car' });
  L.decor.push({ t: 'car', x: 7.7, y, z: 7.9, ry: Math.PI / 2, c: 0xb83a32 });
  for (const xs of [[-10, -1], [1, 10]]) picket(xs[0], xs[1], 6.35, 0.85, 0xf0ece2);

  // the other houses on the street (solid, with lit windows facing the road)
  const filler = (fx0, fz0, fx1, fz1, fh, siding, roof) => {
    box(fx0, y, fz0, fx1, y + fh, fz1, 'siding', siding);
    L.roofs.push({ x0: fx0 - 0.4, x1: fx1 + 0.4, z0: fz0 - 0.4, z1: fz1 + 0.4, y: y + fh, h: 2.4, ridge: 'x', tint: roof, gable: siding });
    const fz = fz0 > 0 ? fz0 : fz1;
    for (let x = fx0 + 1.5; x < fx1 - 1; x += 3) L.decor.push({ t: 'litwindow', x, y: y + 1.6, z: fz + (fz0 > 0 ? -0.02 : 0.02), ry: fz0 > 0 ? Math.PI : 0, lit: ((x * 7) | 0) % 3 === 0 });
  };
  filler(-20, 11, -10, 19, 5.6, 0xc7b38a, 0x5a3f3a);
  filler(11, 11, 21, 19, 3.2, 0x9fb4c7, 0x3d4250);
  filler(25, 11, 33, 18, 5.6, 0xd6c6c0, 0x5a4a44);
  filler(-33, 11, -25, 18, 3.2, 0xa8c49a, 0x46423c);
  filler(-34, -26, -25, -10, 6, 0xbfafa0, 0x40363a);
  filler(25, -26, 34, -10, 6, 0xc0c8b0, 0x3b3f48);
  filler(-34, -46, -25, -32, 3.2, 0xd1c2a4, 0x4a3b36);
  filler(25, -46, 34, -32, 5.6, 0xa9b7a8, 0x3a3f44);
  // map edges
  inv(-35, -1, -50.5, -34.5, 14, 23); inv(34.5, -1, -50.5, 35, 14, 23);
  inv(-35, -1, 22.5, 35, 14, 23); inv(-35, -1, -51, 35, 14, -50.5);
  return { picket, inv };
}

function buildMulberry() {
  const L = base(2, {
    targets: ['album'], indoor: false, outdoorLight: 0.62, groundVisualY: H - 0.02,
    titleCamera: { from: [-14, H + 6, 9], to: [0, H + 1.5, -18] },
  });
  const K = kit(L);
  const { box, detail, wall, door, win, lamp, table, shelves, item, hide, poi, stairs, room, mount } = K;

  // Lawn everywhere at y=H, open over his house so the basement can sit beneath it.
  for (const [a, b, c, d] of [[-34.5, -50.5, -12, 23], [12, -50.5, 34.5, 23], [-12, -50.5, 12, -26], [-12, -12, 12, 23]]) box(a, 0, b, c, H, d, 'grass', 0x6c8c50);
  L.holes = [[-12, -26, 12, -12]];
  const { picket, inv } = street(L, K, H);

  // ---- his plot: picket front (climbable), tall fences around the side and back gardens
  for (const [a, b] of [[-22, -3], [-1, 5], [12, 22]]) picket(a, b, -6.55, 1.1, 0xf3efe4);
  box(-22.2, H, -49.8, -22, H + 2, -6.5, 'fence', 0x7a5a40); box(22, H, -49.8, 22.2, H + 2, -6.5, 'fence', 0x7a5a40);
  box(-22.2, H, -50, 22.2, H + 2, -49.8, 'fence', 0x7a5a40);
  inv(-22.8, H + 2, -50, -22.2, 14, -6.5); inv(22.2, H + 2, -50, 22.8, 14, -6.5); inv(-22.8, H + 2, -50.5, 22.8, 14, -50);
  detail(-2.8, H, -12, -1.2, H + 0.02, -6.5, 'paving', 0xb6ad9f);
  detail(5, H, -12, 12, H + 0.02, -6, 'concrete', 0xaaa59c);
  box(7.3, H, -11.9, 9.7, H + 1.35, -6.6, null, 0, { vis: false, tag: 'car' });
  L.decor.push({ t: 'car', x: 8.5, y: H, z: -9.25, ry: 0, c: 0x2e2e33 });
  L.decor.push({ t: 'mailbox', x: -3.6, y: H, z: -7.1, ry: 0, c: 0x2f4a3a });
  box(-14.4, H, -10.4, -13.6, H + 4.4, -9.6, 'bark', 0x5a4030, { tag: 'tree' }); L.decor.push({ t: 'tree', x: -14, y: H + 4, z: -10, s: 1.2 });
  box(-11.6, H, -12.9, -4.6, H + 0.8, -12.2, 'hedge', 0x3f6b32, { tag: 'hedge' });

  // ---- basement (y 0..3) under the whole house
  box(-12, -0.25, -26, 12, 0, -12, 'concrete', 0x6e7377);
  const bw = (axis, t, a, b, ops = []) => wall(axis, t, a, b, 0, 3, ops, 'block', 0x7a756c);
  bw('x', -26, -12, 12); bw('x', -12.2, -12, 12); bw('z', -12, -26, -12); bw('z', 11.8, -26, -12);
  bw('z', 5, -25.8, -12.2, [door('workshop', 'z', 5, -17, 0, null, 'Workshop door')]);
  bw('z', -3, -25.8, -12.2, [
    door('basement', 'z', -3, -22.5, 0, 'red', 'Vault door'),
    door('storage', 'z', -3, -16, 0, 'bolt', 'Storage door', -1),
    win('storeHatch', 'z', -3, -13.5, 0.9, 1.4, 'Storage hatch', { boards: true, glass: false, outside: 1 }),
  ]);
  bw('x', -19.2, -11.8, -3);
  // Workshop under the garage: the stairs come down here.
  stairs(9.8, 11.8, -20.4, 1, 0, 0x6d5a45, 'wood');
  table(7, 0, -25.2, 0x6b5136, 1.4, 0.45);
  L.decor.push({ t: 'pegboard', x: 7, y: 1.7, z: -25.78, ry: 0 });
  shelves(5.6, 0, -13.5, 'z');
  item('paint1', 'paint', 6.5, 0.86, -25.1); item('can1', 'can', 8, 0, -16);
  lamp('workshop', 7.5, 2.85, -18, 0xffd9a0);
  poi('workshop', 7.5, 0, -22, 2);
  // Boiler room: the boiler, an oil tank, the fuse box, a locker.
  box(-2.4, 0, -25.5, -0.6, 2.3, -24, 'metal', 0x5a7681); detail(-2.2, 1.1, -24.02, -0.8, 1.25, -23.98, 'emissive', 0xf0a040);
  box(1.5, 0, -25.6, 4.6, 1.3, -24.2, 'metal', 0x6b5a3a);
  for (const x of [-2, -1.2]) detail(x, 2.3, -25, x + 0.14, 3, -24.86, 'metal', 0x8e5c42);
  detail(-2.8, 2.6, -17.1, 4.8, 2.74, -16.96, 'metal', 0x8e5c42);
  L.fusebox = { x: 4.95, y: 1.35, z: -21.5 };
  hide('boilerLocker', 3.5, 0, -12.9, '-z');
  item('bottle1', 'bottle', 0.5, 0, -14); item('can2', 'can', -1.5, 0, -20);
  lamp('boiler', 1, 2.85, -19, 0xffc890);
  poi('boiler', 1, 0, -18.5, 3);
  // Storage (bolted from inside; the hatch beside the door is boarded up): the fuse.
  shelves(-10.9, 0, -17.5, 'z'); shelves(-10.9, 0, -14.2, 'z');
  for (const [x, z] of [[-6, -18.4], [-5, -18.4], [-5.5, -17.6]]) box(x - 0.45, 0, z - 0.4, x + 0.45, 0.8, z + 0.4, 'cardboard', 0xb08a5c);
  table(-7.5, 0, -13.2, 0x8a7457, 1, 0.45);
  item('fuse', 'fuse', -7.5, 0.87, -13.2, 'Fuse');
  lamp('storage', -7.5, 2.85, -15.5, 0xffe6b0, false, 2.6);
  // Vault (red padlock): photos of your house pinned everywhere, and the album.
  table(-7.5, 0, -24.8, 0x4a3226, 1.2, 0.5);
  detail(-8.6, 0.86, -25.2, -6.4, 0.88, -24.4, 'fabric', 0x6e1f1f);
  item('album', 'book', -7.5, 0.87, -24.8, 'His photo album');
  for (let i = 0; i < 12; i++) detail(-11.4 + (i % 6) * 1.2, 1.3 + Math.floor(i / 6) * 0.6, -25.79, -10.9 + (i % 6) * 1.2, 1.7 + Math.floor(i / 6) * 0.6, -25.77, 'paper1', 0xf0ead8);
  L.decor.push({ t: 'corkboard', x: -11.78, y: 1.6, z: -22, ry: Math.PI / 2 });
  box(-11.7, 0, -20.6, -10.9, 1.4, -19.4, 'metal', 0x6d7a6f);
  lamp('basement', -7.5, 2.85, -22.5, 0xe0604a);

  // ---- ground floor (y 3.2..6.2); the slab has the garage stairwell cut out
  box(-12, 3, -26, 9.6, H, -12, 'woodfloor', 0x9b7a55);
  box(9.6, 3, -26, 12, H, -20.4, 'concrete', 0x8a8c88);
  box(9.6, 3, -14, 12, H, -12, 'concrete', 0x8a8c88);
  detail(5.2, H, -26, 9.6, H + 0.015, -12.2, 'concrete', 0x8a8c88);
  box(9.5, H, -20.5, 9.6, H + 0.95, -14, 'metal', 0x4a5258);
  box(9.5, H, -20.6, 11.8, H + 0.95, -20.4, 'metal', 0x4a5258);
  // Outside walls: house (3 m) and garage (2.8 m, flat roof).
  wall('x', -12.2, -12, 5, H, 3, [
    win('livingW', 'x', -12.2, -8, H + 0.9, 1.8, 'Living-room window', { entry: 'livingWindow' }),
    door('front', 'x', -12.2, -2, H, null, 'Front door', -1, 0x7a2a2a),
    win('studyW', 'x', -12.2, 2.6, H + 0.9, 1.4, 'Study window', { breakable: false }),
  ], 'siding', SIDING);
  wall('x', -12.2, 5, 12, H, 2.8, [], 'siding', SIDING);
  detail(5.6, H, -11.99, 11.4, H + 2.5, -11.9, 'garagedoor', 0xd9d4c6);
  wall('x', -26, -12, 5, H, 3, [
    door('back', 'x', -26, -9, H, null, 'Back door', 1, 0x7a2a2a),
    win('kitchenW', 'x', -26, -5, H + 1, 1.4, 'Kitchen window', { entry: 'kitchenWindow', outside: -1 }),
    win('bedroomW', 'x', -26, 1, H + 0.9, 1.4, 'Bedroom window', { entry: 'bedroomWindow', outside: -1 }),
  ], 'siding', SIDING);
  wall('x', -26, 5, 12, H, 2.8, [], 'siding', SIDING);
  wall('z', -12, -26, -12, H, 3, [], 'siding', SIDING);
  wall('z', 11.8, -26, -12, H, 2.8, [door('garageSide', 'z', 11.8, -23, H, null, 'Garage side door', -1, 0x8a8a80)], 'siding', SIDING);
  // corner boards, porch, chimney, roofs
  for (const [x, z] of [[-12.1, -12.1], [11.9, -12.1], [-12.1, -26.1], [11.9, -26.1]]) detail(x - 0.06, H, z - 0.06, x + 0.06, H + 3, z + 0.06, 'trim', TRIM);
  box(-3.5, H, -10.7, -3.3, H + 2.8, -10.5, 'trim', TRIM); box(-0.7, H, -10.7, -0.5, H + 2.8, -10.5, 'trim', TRIM);
  detail(-3.8, H + 2.8, -12, -0.2, H + 2.95, -10.3, 'roofflat', ROOF);
  detail(-3.6, H, -12, -0.4, H + 0.12, -10.4, 'paving', 0xb6ad9f);
  box(-10, 6.4, -20, -9, 10.2, -19, 'brick', 0x7a4a3a);
  box(-12, 6.2, -26, 5, 6.4, -12, 'plaster', 0xe8e3d6);
  L.roofs.push({ x0: -12.6, x1: 5.4, z0: -26.6, z1: -11.4, y: 6.4, h: 3, ridge: 'x', tint: ROOF, gable: SIDING });
  box(5, 6, -26.2, 12.2, 6.25, -11.8, 'roofflat', ROOF);
  lamp('porch', -2, H + 2.6, -11.2, 0xffe2a8, false, 2.5);
  L.decor.push({ t: 'weathervane', x: -9.5, y: 10.2, z: -19.5 });
  // Inside walls: front rooms / corridor / back rooms, and the garage.
  const iw = (axis, t, a, b, ops = [], tint = 0xd6cfb6, m = 'paper1') => wall(axis, t, a, b, H, 3, ops, m, tint);
  iw('z', -4.2, -17, -12.2);
  iw('z', 0, -17, -12.2, [door('study', 'z', 0, -14.6, H, 'power', 'Study electric door', 1)], 0xcfd6cc, 'paper2');
  iw('z', 5, -26, -12.2, [door('garageDoor', 'z', 5, -18.1, H, null, 'Garage door')], 0xbcb5a4);
  iw('x', -17.2, -11.8, 5, [door('livingDoor', 'x', -17.2, -6, H, null, 'Living-room door'), [-2, 1.6, H, H + 2.3]]);
  iw('x', -19.2, -11.8, 5, [door('kitchenDoor', 'x', -19.2, -7, H, null, 'Kitchen door'), door('bedroomDoor', 'x', -19.2, 1.5, H, null, 'Bedroom door')]);
  iw('z', -3, -26, -19.2, [], 0xcfc6d9, 'paper3');
  // Living room: sofa, armchair, TV, standing lamp, a wardrobe to hide in.
  box(-11.4, H, -16.6, -8.2, H + 0.45, -15.6, 'fabric', 0x7d5a3a); box(-11.4, H + 0.45, -16.95, -8.2, H + 1.15, -16.55, 'fabric', 0x6e4c30);
  box(-11.85, H, -15, -11.35, H + 0.5, -13.4, 'wood', 0x4a3a2c);
  L.decor.push({ t: 'tvscreen', x: -11.4, y: H + 1.0, z: -14.2, ry: Math.PI / 2 });
  box(-9.6, H, -14.4, -8.4, H + 0.42, -13.6, 'wood', 0x6b4f37); item('vase1', 'vase', -9, H + 0.42, -14);
  L.decor.push({ t: 'standlamp', x: -7.2, y: H, z: -16.5 });
  hide('livingWardrobe', -5, H, -13.1, '-x', 0x5b4330);
  lamp('living', -8, H + 2.85, -14.6, 0xffd59a);
  poi('living', -7.5, H, -15, 2);
  // Hall: coat rack and a clock.
  L.decor.push({ t: 'coatrack', x: -3.6, y: H, z: -12.8 });
  L.decor.push({ t: 'clock', x: -0.22, y: H + 1.9, z: -16.2, ry: -Math.PI / 2, tall: true });
  lamp('hall', -2, H + 2.85, -14.6, 0xffe1b0);
  // Study (electric lock): desk with the red key, filing cabinet, a corkboard of your comings and goings.
  table(2.6, H, -16.3, 0x4a3a2c, 1.2, 0.5);
  item('redkey', 'redkey', 2.6, H + 0.87, -16.3, 'Red key');
  L.decor.push({ t: 'desklamp', x: 3.4, y: H + 0.86, z: -16.4 });
  box(4.1, H, -13.4, 4.8, H + 1.3, -12.5, 'metal', 0x6d7a6f);
  L.decor.push({ t: 'corkboard', x: 0.22, y: H + 1.6, z: -15.8, ry: Math.PI / 2 });
  lamp('study', 2.6, H + 2.85, -14.6, 0xc8e0ff, true);
  // Corridor
  lamp('corridor', -4, H + 2.85, -18.1, 0xffe1b0, false, 2.6);
  L.decor.push({ t: 'portrait', x: -8, y: H + 1.9, z: -17.02, ry: 0 });
  // Kitchen: counters, stove, fridge, table, pantry cupboard.
  box(-11.8, H, -25.8, -10, H + 0.9, -25, 'counter', 0xb7c2b0);
  box(-7.9, H, -25.8, -3.2, H + 0.9, -25, 'counter', 0xb7c2b0);
  box(-11.8, H, -24.2, -11, H + 0.92, -23.2, 'metal', 0x2a2c2f);
  box(-11.8, H, -21.4, -11, H + 2, -20.4, 'metal', 0xe8e8e2);
  table(-7, H, -22.2, 0x8a6a48);
  item('plate1', 'plate', -7.3, H + 0.86, -22); item('apple1', 'apple', -6.5, H + 0.86, -22.4);
  hide('pantry', -3.8, H, -20.5, '-x', 0x6b5136);
  lamp('kitchen', -7, H + 2.85, -22.5, 0xfff0d0);
  poi('stove', -10.3, H, -23.7, 3);
  // Bedroom: bed, nightstand, rocking chair, wardrobe.
  box(2.4, H, -25.6, 4.7, H + 0.5, -22.6, 'wood', 0x6b4f37); box(2.4, H + 0.5, -25.6, 4.7, H + 0.72, -22.6, 'fabric', 0x8a6d9a);
  box(2.4, H, -25.8, 4.7, H + 1.2, -25.6, 'wood', 0x5b4330);
  L.decor.push({ t: 'rockingchair', x: -1.5, y: H, z: -24.5, ry: 0.6 });
  hide('bedWardrobe', -2.3, H, -21, '+x', 0x5b4330);
  lamp('bedroom', 1.5, H + 2.85, -22.5, 0xffd2a0);
  poi('bedroom', 0.5, H, -21.5, 1);
  // Garage: workbench, shelves, tyres, crates, a locker.
  table(7.3, H, -25.3, 0x6b5136, 1.6, 0.45);
  L.decor.push({ t: 'pegboard', x: 7.3, y: H + 1.7, z: -25.78, ry: 0 });
  L.decor.push({ t: 'tires', x: 6, y: H, z: -13.2 });
  shelves(11.3, H, -24.2, 'z');
  item('crate1', 'crate', 7.5, H, -21); item('crate2', 'crate', 6.2, H, -15.5);
  hide('garageLocker', 5.7, H, -23, '+x', 0x476469);
  lamp('garage', 7.5, H + 2.6, -18, 0xf2f2e0);
  poi('garage', 7.5, H, -17.5, 2);

  // ---- back garden: greenhouse (the crowbar), vegetable beds, washing line, a tree
  const gx0 = -8, gx1 = -2, gz0 = -41, gz1 = -35;
  const pane = (a, b, c, d) => box(a, H, b, c, H + 2.4, d, 'glass', 0xcfe8e0, { op: false });
  pane(gx0, gz0, gx1, gz0 + 0.06); pane(gx0, gz0, gx0 + 0.06, gz1); pane(gx1 - 0.06, gz0, gx1, gz1);
  pane(gx0, gz1 - 0.06, -5.8, gz1); pane(-4.2, gz1 - 0.06, gx1, gz1);
  detail(gx0, H + 2.4, gz0, gx1, H + 2.46, gz1, 'glass', 0xcfe8e0);
  for (const x of [gx0, -5.8, -4.2, gx1 - 0.08]) detail(x, H, gz1 - 0.08, x + 0.08, H + 2.46, gz1, 'trim', TRIM);
  table(-5, H, -40.2, 0x6d5a45, 2, 0.45);
  for (let x = -6.6; x <= -3.4; x += 0.8) L.decor.push({ t: 'pots', x, y: H + 0.86, z: -40.3 });
  item('crowbar', 'crowbar', -5, H + 0.87, -40.1, 'Crowbar');
  lamp('greenhouse', -5, H + 2.3, -38, 0xd8ffd0, false, 2);
  for (let x = 4; x <= 10; x += 1.2) for (const z of [-36.3, -34.8]) L.decor.push({ t: (x + z) % 2 > -1 ? 'cabbage' : 'pumpkin', x, y: H + 0.22, z });
  detail(3.4, H, -37, 10.8, H + 0.2, -34, 'dirt', 0x5a4632);
  L.decor.push({ t: 'clothesline', x: 0, y: H + 2.1, z: -45 });
  box(14.6, H, -42.4, 15.4, H + 4.5, -41.6, 'bark', 0x5a4030, { tag: 'tree' }); L.decor.push({ t: 'tree', x: 15, y: H + 4, z: -42, s: 1.4 });
  item('ball1', 'ball', 2, H, -30); item('crate3', 'crate', -14, H, -30);
  detail(-1.2, H, -31, 2.4, H + 0.02, -26, 'paving', 0xb6ad9f);
  poi('greenhouse', -5, H, -33, 1, 'stare');
  poi('frontyard', -2, H, -8.5, 1, 'stare');

  // ---- rules
  L.spawn = { x: -1.6, y: H, z: 15.4, yaw: Math.atan2(-1.6, 5.2) };
  L.exit = makeBox(-4.6, H - 0.15, 10.4, 4.6, H + 2.5, 17.6);
  L.safeZones.push(makeBox(-34.5, H - 0.2, 6, 34.5, 30, 23));   // your side of the street
  room(-12, 0, -26, 12, 3, -12, 0.3);
  room(-12, H, -26, 5, 6.2, -12, 0.62);
  room(5, H, -26, 12, 6, -12, 0.55);
  L.entries = {
    frontDoor: { name: 'front door', kind: 'door', ref: 'front', x: -2, z: -11 },
    backDoor: { name: 'back door', kind: 'door', ref: 'back', x: -9, z: -27 },
    garageSide: { name: 'garage side door', kind: 'door', ref: 'garageSide', x: 13, z: -23 },
    livingWindow: { name: 'living-room window', kind: 'window', ref: 'livingW', x: -8, z: -11 },
    kitchenWindow: { name: 'kitchen window', kind: 'window', ref: 'kitchenW', x: -5, z: -27 },
    bedroomWindow: { name: 'bedroom window', kind: 'window', ref: 'bedroomW', x: 1, z: -27 },
  };
  L.places = [['the workshop', 7.5, 0, -20], ['the boiler room', 1, 0, -19], ['the storage room', -7.5, 0, -15.5], ['the vault door', -2, 0, -22.5],
    ['the living room', -8, H, -14.6], ['the hall', -2, H, -14.6], ['the corridor', -4, H, -18.1], ['the kitchen', -7, H, -22.5],
    ['the bedroom', 1.5, H, -22.5], ['the garage', 7.5, H, -18], ['the front yard', -2, H, -8.5], ['the drive', 8.5, H, -8],
    ['the back garden', 0, H, -32], ['the greenhouse', -5, H, -38], ['the street', 0, H, 0]];
  mount('porchCam', -3.9, H + 2.7, -11.9, -2, -6, 'the porch');
  mount('gardenCam', -11.9, H + 2.6, -26.3, -5, -34, 'the back garden');
  mount('garageCam', 11.6, H + 2.4, -12.5, 7, -20, 'the garage');
  mount('boilerCam', 4.8, 2.6, -12.5, 0, -20, 'the boiler room');
  L.navBounds = { x0: -34.2, z0: -50.2, x1: 34.2, z1: 22.2 }; L.reachBounds = L.navBounds;
  // Some prop models are built from ground level 0; raise everything above the basement onto the lawn.
  for (const d of L.decor) if (d.y >= H - 0.01) d.lift = H;
  L.objective = w => {
    if (w.steps.album !== undefined) return 'You have his album. Get home — across the road to your own front door.';
    if (!w.flags.power) {
      if (w.hasItem('fuse')) return 'Put the fuse in the fuse box in the basement boiler room.';
      if (!w.hasItem('crowbar') && w.windows.find(x => x.id === 'storeHatch').boards) return 'There is a boarded hatch in his basement. Find something to pry it open — try the greenhouse out back.';
      return 'The basement stairs are in his garage. Pry open the storage hatch and find the fuse.';
    }
    if (!w.hasItem('redkey') && w.doorById.basement.locked) return 'Power is on: his study (off the hall) is unlocked. Take the red key from the desk.';
    if (w.doorById.basement.locked) return 'Unlock the red padlock on the basement vault.';
    return 'Take the photo album from the vault.';
  };
  return L;
}

export function buildMap(mission) {
  return mission === 1 ? buildCellar() : buildMulberry();
}
