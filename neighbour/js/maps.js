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
    L.windows.push({ id, axis, c, t0: t, t1: t + 0.2, sill, top: sill + (opts.h || 1.2), w, glass: true, boards: !!opts.boards,
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
// Level 3: Hollow Lane. A new two-storey house with a basement, across the road from your home.
//   fuse (upstairs bedroom) -> fuse box (basement rec room) -> the upstairs office opens ->
//   red key -> basement vault -> his tape recorder -> home across the road.
function buildHollowLane() {
  const L = base(2, {
    targets: ['tapes'], indoor: false, outdoorLight: 0.6, groundVisualY: H - 0.02,
    titleCamera: { from: [18, 11, 10], to: [0, 6, -12] },
  });
  const { box, detail, wall, door, win, lamp, table, shelves, item, hide, poi, stairs, room, mount } = kit(L);
  const brick = 0x8a5446, cream = 0xd9cfb4, slate = 0x3b4150;

  // Ground: raised lawn everywhere except the house footprint, which drops to the basement.
  box(-24, 0, -34, -10, H, 16, 'grass', 0x6f8f55); box(10, 0, -34, 24, H, 16, 'grass', 0x6f8f55);
  box(-10, 0, -34, 10, H, -20, 'grass', 0x6f8f55); box(-10, 0, -4, 10, H, 16, 'grass', 0x6f8f55);
  L.holes = [[-10, -20, 10, -4]];

  // ---- basement (y 0..3)
  box(-10, -0.25, -20, 10, 0, -4, 'concrete', 0x6c7378);
  wall('x', -20, -10, 10, 0, 3, [], 'block', 0x77736c);
  wall('x', -4.2, -10, 10, 0, 3, [], 'block', 0x77736c);
  wall('z', -10, -20, -4, 0, 3, [], 'block', 0x77736c);
  wall('z', 9.8, -20, -4, 0, 3, [], 'block', 0x77736c);
  wall('z', 0, -19.8, -4.2, 0, 3, [
    door('basement', 'z', 0, -16, 0, 'red', 'Vault door'),
    door('storage', 'z', 0, -8, 0, null, 'Storage door'),
  ], 'block', 0x77736c);
  wall('x', -12.2, -9.8, 0, 0, 3, [], 'block', 0x77736c);
  stairs(7.8, 9.8, -12, 1, 0, 0x7a6450, 'wood');
  // Rec room: old sofa, a dead TV, a pool table, and the fuse box on the east wall.
  box(1, 0, -6, 4.5, 0.45, -5, 'fabric', 0x6b5a4a); box(1, 0.45, -5.35, 4.5, 1.1, -5, 'fabric', 0x5d4c3e);
  box(1.8, 0, -10.6, 3.8, 0.6, -10, 'wood', 0x4a3a2c); box(2.1, 0.6, -10.5, 3.5, 1.5, -10.1, 'metal', 0x2a2d30);
  box(2.5, 0, -18.5, 6.5, 0.85, -16.5, 'fabric', 0x2f6b45); detail(2.4, 0.85, -18.6, 6.6, 0.95, -16.4, 'wood', 0x5b3b25);
  L.fusebox = { x: 9.6, y: 1.35, z: -15 };
  lamp('rec', 4, 2.85, -12, 0xffd9a0);
  poi('rec', 4, 0, -13.5, 3);
  hide('recLocker', 1, 0, -19.2, '+z');
  // Vault (red padlock): filing cabinets, a camera on a tripod, and the tape recorder.
  for (const z of [-19, -17.6]) box(-9.7, 0, z, -8.9, 1.4, z + 1.2, 'metal', 0x6d7a6f);
  shelves(-5, 0, -19.3, 'x', 0x5c3a2e);
  for (const [x, z] of [[-4, -13.5], [-7, -13.5]]) for (let i = 0; i < 5; i++) detail(x + i * 0.3 - 0.6, 1.4, z, x + i * 0.3 - 0.45, 1.9, z + 0.04, 'paper1', 0xe8e0c8);
  table(-4.5, 0, -16, 0x4a3226);
  item('tapes', 'radio', -4.5, 0.87, -16, 'His tape recorder');
  lamp('basement', -5, 2.85, -16, 0xe0604a);
  // Storage: boxes, a chest freezer, paint tins.
  box(-9.6, 0, -11.8, -7.6, 0.9, -10.8, 'metal', 0xdedfd9);
  for (const [x, z] of [[-3, -6], [-5, -5], [-8.5, -6]]) box(x - 0.5, 0, z - 0.5, x + 0.5, 0.8, z + 0.5, 'cardboard', 0xb08a5c);
  item('paint1', 'paint', -6, 0, -9); item('crate1', 'crate', -2.5, 0, -10.5);
  hide('storageLocker', -9.3, 0, -8, '+x');
  lamp('storage', -5, 2.85, -8, 0xffcf96, false, 2.6);

  // ---- ground floor (y 3.2..6.2): slab with the basement stairwell cut out
  box(-10, 3, -20, 7.6, H, -4, 'woodfloor', 0x9b7a55);
  box(7.6, 3, -20, 10, H, -12, 'woodfloor', 0x9b7a55);
  box(7.6, 3, -5.6, 10, H, -4, 'woodfloor', 0x9b7a55);
  box(7.5, H, -12, 7.6, H + 0.9, -5.6, 'trim', 0xe9e2cf);
  for (let z = -11.6; z < -5.6; z += 0.8) detail(7.52, H, z, 7.58, H + 0.9, z + 0.06, 'trim', 0xe9e2cf);
  // Outer walls: front door, lounge and kitchen windows, back door, utility side window.
  wall('x', -4.2, -10, 10, H, 3, [
    door('front', 'x', -4.2, -6.5, H, null, 'Front door', -1, 0x2f4f6b),
    win('loungeW', 'x', -4.2, 3, H + 0.9, 2, 'Lounge window', { entry: 'loungeWindow' }),
  ], 'brick', brick);
  wall('x', -20, -10, 10, H, 3, [
    door('back', 'x', -20, -6, H, null, 'Back door', 1, 0x2f4f6b),
    win('kitchenW', 'x', -20, -1, H + 0.9, 1.6, 'Kitchen window', { entry: 'kitchenWindow', outside: -1 }),
  ], 'brick', brick);
  wall('z', -10, -20, -4, H, 3, [], 'brick', brick);
  wall('z', 9.8, -20, -4, H, 3, [win('utilityW', 'z', 9.8, -16, H + 0.9, 1.4, 'Utility window', { entry: 'utilityWindow' })], 'brick', brick);
  // Inside: hall | lounge, and the kitchen + utility behind.
  wall('z', -3, -12, -4.2, H, 3, [door('hallLounge', 'z', -3, -8.5, H, null, 'Lounge door')], 'paper1', 0xd8d0b4);
  wall('x', -12.2, -9.8, 9.8, H, 3, [
    door('hallKitchen', 'x', -12.2, -5, H, null, 'Kitchen door'),
    door('loungeUtil', 'x', -12.2, 5.5, H, null, 'Utility door'),
  ], 'paper2', 0xc9d3c0);
  wall('z', 2, -19.8, -12.2, H, 3, [door('kitchenUtil', 'z', 2, -16, H, null, 'Utility door')], 'paper2', 0xc9d3c0);
  // Stairs up to the first floor along the hall's west wall.
  stairs(-9.8, -7.8, -6, -1, H, 0x8a6a48, 'wood');
  // Hall: coat rack, umbrella stand, a console table.
  box(-3.6, H, -6, -3.2, H + 0.8, -5, 'wood', 0x5b4330); item('vase1', 'vase', -3.4, H + 0.8, -5.5);
  lamp('hall', -5.5, H + 2.85, -8, 0xffe1b0);
  // Lounge: sofa, armchair, coffee table, bookcase, rug.
  box(-0.8, H, -11.6, 3.4, H + 0.45, -10.6, 'fabric', 0x7d4a3a); box(-0.8, H + 0.45, -11.9, 3.4, H + 1.15, -11.5, 'fabric', 0x6e3e30);
  box(5, H, -9.5, 6.3, H + 0.45, -8.2, 'fabric', 0x4f6c6a);
  box(0, H, -9, 2, H + 0.42, -8, 'wood', 0x6b4f37); item('apple1', 'apple', 1, H + 0.42, -8.5);
  detail(-1.5, H + 0.005, -10, 4, H + 0.015, -6.5, 'carpet', 0x8a5a4a);
  shelves(-2.4, H, -5.5, 'z', 0x6b4f37);
  lamp('lounge', 2, H + 2.85, -8, 0xffd59a);
  poi('lounge', 2.5, H, -6.5, 2);
  hide('loungeLocker', -1.9, H, -10.9, '+x', 0x6b4f37);
  // Kitchen: counters, a stove, a fridge, the table.
  box(-9.8, H, -19.8, -7.6, H + 0.9, -19, 'counter', 0xb7c2b0);
  box(-2.4, H, -19.8, 0, H + 0.9, -19, 'counter', 0xb7c2b0);
  box(-9.8, H, -19, -9, H + 0.9, -14, 'counter', 0xb7c2b0);
  box(-9.8, H, -17, -9, H + 0.92, -16, 'metal', 0x2a2c2f);
  box(1, H, -19.8, 1.9, H + 2, -18.9, 'metal', 0xe8e8e2);
  table(-3.5, H, -15.5, 0x8a6a48);
  item('plate1', 'plate', -3.5, H + 0.86, -15.3); item('bottle1', 'bottle', -4.4, H + 0.86, -15.7);
  lamp('kitchen', -4, H + 2.85, -16, 0xfff0d0);
  poi('stove', -8.2, H, -16.5, 3);
  // Utility room: washing machine, boiler, shelves.
  box(8.8, H, -19.8, 9.7, H + 0.9, -18.9, 'metal', 0xd7d9d2);
  box(2.4, H, -19.8, 3.6, H + 2.3, -18.8, 'metal', 0x5a7681);
  shelves(5.5, H, -19.4, 'x');
  lamp('utility', 6, H + 2.85, -16, 0xfff0d0, false, 2.6);

  // ---- first floor (y 6.4..9.4): slab with the stairwell cut out
  box(-7.6, 6.2, -20, 10, U, -4, 'carpet', 0x7a6a8a);
  box(-10, 6.2, -20, -7.6, U, -12.4, 'carpet', 0x7a6a8a);
  box(-10, 6.2, -5.8, -7.6, U, -4, 'carpet', 0x7a6a8a);
  box(-7.6, U, -12.4, -7.5, U + 0.95, -5.8, 'trim', 0xe9e2cf);
  box(-10, U, -5.9, -7.5, U + 0.95, -5.8, 'trim', 0xe9e2cf);
  wall('x', -4.2, -10, 10, U, 3, [win('bedW', 'x', -4.2, 4, U + 0.9, 1.6, 'Bedroom window', { breakable: false })], 'brick', brick);
  wall('x', -20, -10, 10, U, 3, [win('landingW', 'x', -20, -6, U + 0.9, 1.2, 'Landing window', { breakable: false, outside: -1 })], 'brick', brick);
  wall('z', -10, -20, -4, U, 3, [], 'brick', brick);
  wall('z', 9.8, -20, -4, U, 3, [], 'brick', brick);
  wall('z', -3, -19.8, -4.2, U, 3, [
    door('study', 'z', -3, -16, U, 'power', 'Office electric door', 1),
    door('bedroom', 'z', -3, -8, U, null, 'Bedroom door'),
  ], 'paper3', 0xcfc6d9);
  wall('x', -12.2, -2.8, 9.8, U, 3, [], 'paper3', 0xcfc6d9);
  box(-10, 9.4, -20, 10, 9.6, -4, 'plaster', 0xe6e1d4);
  L.roofs.push({ x0: -10.7, x1: 10.7, z0: -20.7, z1: -3.3, y: 9.6, h: 3.2, ridge: 'x', tint: slate, gable: brick });
  // Bedroom: bed, wardrobe, nightstand with the fuse.
  box(3, U, -11.8, 6, U + 0.5, -8.6, 'wood', 0x6b4f37); box(3, U + 0.5, -11.8, 6, U + 0.75, -8.6, 'fabric', 0xa9b6c9);
  box(3, U, -11.9, 6, U + 1.2, -11.7, 'wood', 0x5b4330);
  table(7.8, U, -10.8, 0x6b4f37, 0.6, 0.4);
  item('fuse', 'fuse', 7.8, U + 0.87, -10.8, 'Fuse');
  hide('wardrobe', -1.9, U, -5.2, '+x', 0x5b4330);
  lamp('bedroom', 4, U + 2.85, -8, 0xffd2a0);
  poi('bedroom', 1.5, U, -7, 2);
  // Office (electric lock): desk, filing cabinet, corkboard of photos of your house, and the red key.
  table(4, U, -18.6, 0x4a3a2c, 1.2, 0.55);
  item('redkey', 'redkey', 4, U + 0.87, -18.6, 'Red key');
  box(8.6, U, -19.7, 9.6, U + 1.4, -18.5, 'metal', 0x6d7a6f);
  detail(0, U + 1.2, -19.82, 5, U + 2.4, -19.8, 'cardboard', 0xb08a5c);
  for (let i = 0; i < 8; i++) detail(0.3 + i * 0.6, U + 1.4 + (i % 2) * 0.45, -19.8, 0.7 + i * 0.6, U + 1.75 + (i % 2) * 0.45, -19.78, 'paper1', 0xf0ead8);
  lamp('office', 4, U + 2.85, -16, 0xc8e0ff, true);
  // Landing: a linen cupboard to hide in.
  hide('landingLocker', -5, U, -19.2, '+z', 0x5b4330);
  lamp('landing', -5.5, U + 2.85, -10, 0xffe1b0);
  poi('landing', -5, U, -14.5, 1);

  // ---- garden: a shed with a crowbar, a picket fence, the road and your house opposite.
  box(-20, H, -31, -15, H + 2.4, -30.8, 'board', 0x6d5a45);
  box(-20, H, -30.8, -19.8, H + 2.4, -27, 'board', 0x6d5a45); box(-15.2, H, -30.8, -15, H + 2.4, -27, 'board', 0x6d5a45);
  box(-20.2, H + 2.4, -31.2, -14.8, H + 2.55, -26.8, 'roofflat', 0x3b3f44);
  detail(-19.8, H + 2.1, -27.1, -15.2, H + 2.4, -26.95, 'board', 0x6d5a45); // open-fronted shed
  table(-17.5, H, -30, 0x6d5a45, 1, 0.45);
  item('crowbar', 'crowbar', -17.5, H + 0.87, -30, 'Crowbar');
  item('crate2', 'crate', -12.5, H, -24); item('crate3', 'crate', 13, H, -26); item('ball1', 'ball', 6, H, -27);
  poi('garden', 2, H, -26, 1, 'stare');
  poi('frontyard', -2, H, -0.5, 1, 'stare');
  for (const x of [-10, 10]) for (let z = -3.8; z < 2.6; z += 0.5) detail(x - 0.04, H, z, x + 0.04, H + 0.85, z + 0.08, 'fence', 0xefeee6);
  // Road, pavements and a dashed line separate the two properties.
  detail(-23.7, H + 0.024, 3.25, 23.7, H + 0.04, 5.25, 'asphalt', 0x464c54);
  for (const z of [3, 5.25]) detail(-23.7, H + 0.025, z, 23.7, H + 0.06, z + 0.25, 'paving', 0xc3c4bb);
  for (let x = -22; x < 23; x += 4) detail(x, H + 0.041, 4.2, x + 1.8, H + 0.046, 4.3, 'trim', 0xefdfaa);
  detail(-7.3, H + 0.006, -4, -5.7, H + 0.02, 3, 'paving', 0xb8b3a1);
  // Your house: a small cream cottage with an open front door facing his.
  box(-8, H - 0.12, 7, 0, H, 14, 'woodfloor', 0xb69972);
  wall('x', 7, -8, 0, H, 2.9, [[-4, 2, H, H + 2.35]], 'siding', cream);
  wall('x', 13.8, -8, 0, H, 2.9, [], 'siding', cream);
  wall('z', -8, 7, 14, H, 2.9, [], 'siding', cream);
  wall('z', -0.2, 7, 14, H, 2.9, [], 'siding', cream);
  box(-8, H + 2.9, 7, 0, H + 3.05, 14, 'plaster', 0xe9e1cc);
  L.roofs.push({ x0: -8.5, x1: 0.5, z0: 6.5, z1: 14.4, y: H + 3.05, h: 1.65, ridge: 'x', tint: 0x965b49, gable: cream });
  detail(-5, H + 0.006, 5.6, -3, H + 0.025, 7, 'fabric', 0x5b8875);
  box(-7.5, H, 10, -6, H + 0.45, 13, 'fabric', 0x548784); box(-7.5, H + 0.45, 10, -7.15, H + 1.1, 13, 'fabric', 0x446f73);
  shelves(-1.3, H, 9, 'z');
  lamp('playerHome', -4, H + 2.65, 10.5, 0xffd6a0); lamp('playerPorch', -4, H + 2.5, 6.8, 0xffdfa6);
  L.spawn = { x: -4, y: H, z: 11, yaw: 0 };
  L.exit = makeBox(-6, H - 0.15, 8, -2, H + 2.5, 13);
  // Your side of the road is out of bounds for him.
  L.safeZones.push(makeBox(-24, H - 0.1, 5.25, 24, 20, 16));
  // Hedges around the whole plot keep every reachable surface on the map.
  wall('x', -34, -24, 24, H, 2.2, [], 'hedge', 0x45634a); wall('x', 15.8, -24, 24, H, 2.2, [], 'hedge', 0x45634a);
  wall('z', -24, -34, 16, H, 2.2, [], 'hedge', 0x45634a); wall('z', 23.8, -34, 16, H, 2.2, [], 'hedge', 0x45634a);
  lamp('porch', -6.5, H + 2.6, -3.4, 0xffe2a8, false, 2.5);

  room(-10, 0, -20, 10, 3, -4, 0.3);
  room(-10, H, -20, 10, 6.2, -4, 0.62);
  room(-10, U, -20, 10, 9.4, -4, 0.58);
  room(-8, H, 7, 0, H + 2.9, 14, 0.85);
  L.entries = {
    frontDoor: { name: 'front door', kind: 'door', ref: 'front', x: -6.5, z: -3 },
    backDoor: { name: 'back door', kind: 'door', ref: 'back', x: -6, z: -21 },
    loungeWindow: { name: 'lounge window', kind: 'window', ref: 'loungeW', x: 3, z: -3 },
    kitchenWindow: { name: 'kitchen window', kind: 'window', ref: 'kitchenW', x: -1, z: -21 },
    utilityWindow: { name: 'utility window', kind: 'window', ref: 'utilityW', x: 11, z: -16 },
  };
  L.places = [['the basement', 4, 0, -14], ['the storage room', -5, 0, -8], ['the hall', -5.5, H, -8], ['the lounge', 2, H, -8],
    ['the kitchen', -4, H, -16], ['the utility room', 6, H, -16], ['the bedroom', 4, U, -8], ['the landing', -5.5, U, -15],
    ['the front yard', -2, H, 0], ['the back garden', 0, H, -27], ['the shed', -17.5, H, -29], ['the street', 0, H, 4]];
  mount('porchCam', -8.6, H + 2.6, -3.6, -4, 2, 'the porch');
  mount('gardenCam', 9.6, H + 2.6, -20.4, 0, -27, 'the back garden');
  mount('hallCam', -3.4, H + 2.7, -11.8, -6, -5, 'the hall');
  L.navBounds = { x0: -23.5, z0: -33.5, x1: 23.5, z1: 15.5 }; L.reachBounds = L.navBounds;
  L.objective = w => {
    if (w.steps.tapes !== undefined) return 'You have his tape recorder. Get home — across the road.';
    if (!w.flags.power) return w.hasItem('fuse') ? 'The fuse box is in the basement rec room (stairs in the lounge).' : 'Find a fuse. Try upstairs.';
    if (!w.hasItem('redkey') && w.doorById.basement.locked) return 'The upstairs office has power. Take the red key from his desk.';
    if (w.doorById.basement.locked) return 'Unlock the red padlock on the basement vault.';
    return 'Take the tape recorder from the vault.';
  };
  return L;
}

export function buildMap(mission) {
  return mission === 1 ? buildCellar() : buildHollowLane();
}
