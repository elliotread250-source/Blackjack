// Levels 2 and 3: two separate collision maps. Basement floors sit at y=0; a house's ground floor and
// the cellar hatch landing sit at y=3.2 (and an upper floor at 6.4), so the shared stair, item and
// navigation physics work unchanged. Both maps use the extraction rules in world.js: collect the
// target, restore power, then reach `exit`.
import { makeBox } from './geom.js';
import { roundedLoop, act3Objective } from './act3.js';
import { dressRooms, furnish, prop, trimShell } from './dress.js';

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
  // Furniture models over collision boxes (see dress.js); the boxes keep doing the physics.
  const fur = (kind, b, o) => furnish(L, kind, b, o);
  const pr = (kind, x, y, z, w, d, h, o) => prop(L, kind, x, y, z, w, d, h, o);
  // A ceiling light: the fitting is a model (L.lampStyle 'bulb' for basements, else a glass dome).
  function lamp(name, x, y, z, color = 0xffce8b, power = false, intensity = 3.5, o = {}) {
    const fx = o.fixture || L.lampStyle || 'dome';
    if (fx === 'bulb') pr('bulb', x, y + 0.1, z, 0.3, 0.3, 0.4, { c: color, drop: 0.22 });
    else if (fx === 'pendant') pr('pendant', x, y + 0.08, z, 0.6, 0.6, 0.8, { c: color, drop: o.drop ?? 0.5 });
    else if (fx === 'dome') pr('ceilinglamp', x, y + 0.06, z, 0.6, 0.6, 0.2, { c: color });
    else detail(x - 0.3, y - 0.06, z - 0.3, x + 0.3, y + 0.06, z + 0.3, 'emissive', color);
    L.lights.push({ name, x, y: y - 0.15, z, color, intensity, dist: 9, power, ...(o.flicker ? { flicker: o.flicker } : {}) });
  }
  function table(x, y, z, color = 0x775b3f, w = 1, d = 0.48, o = {}) {
    const parts = [box(x - w, y + 0.72, z - d, x + w, y + 0.86, z + d, 'woodfloor', color)];
    for (const dx of [-w + 0.18, w - 0.18]) for (const dz of [-d + 0.14, d - 0.14]) parts.push(box(x + dx - 0.06, y, z + dz - 0.06, x + dx + 0.06, y + 0.72, z + dz + 0.06, 'wood', color));
    fur(o.kind || 'table', parts, { c: color, ...o });
  }
  function shelves(x, y, z, axis = 'x', tint = 0x92765a, o = {}) {
    const [hx, hz] = axis === 'x' ? [0.8, 0.34] : [0.34, 0.8], parts = [];
    if (axis === 'x') { parts.push(box(x - hx, y, z - hz, x - hx + 0.1, y + 2.1, z + hz, 'metal', 0x45565b), box(x + hx - 0.1, y, z - hz, x + hx, y + 2.1, z + hz, 'metal', 0x45565b)); }
    else { parts.push(box(x - hx, y, z - hz, x + hx, y + 2.1, z - hz + 0.1, 'metal', 0x45565b), box(x - hx, y, z + hz - 0.1, x + hx, y + 2.1, z + hz, 'metal', 0x45565b)); }
    for (const sy of [0.15, 0.8, 1.5, 2.05]) parts.push(box(x - hx, y + sy, z - hz, x + hx, y + sy + 0.08, z + hz, 'board', tint));
    fur(o.kind || 'shelving', parts, { faces: axis === 'x' ? '+z' : '+x', h: 2.15, c: tint, ...o });
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
  // The same stairs running along x, rising from y0 at xStart towards dir.
  function stairsX(z0, z1, xStart, dir, y0, tint = 0x858b90, mat = 'concrete') {
    for (let i = 0; i < 16; i++) {
      const xa = xStart + dir * i * 0.4, xb = xStart + dir * (i + 1) * 0.4;
      box(Math.min(xa, xb), y0, z0, Math.max(xa, xb), y0 + (i + 1) * 0.2, z1, mat, tint, { tag: 'stair' });
      detail(Math.min(xa, xb) + (dir > 0 ? 0 : 0.34), y0 + (i + 1) * 0.2, z0 + 0.02, Math.min(xa, xb) + (dir > 0 ? 0.06 : 0.4), y0 + (i + 1) * 0.2 + 0.012, z1 - 0.02, 'trim', 0xd9bc72);
    }
  }
  return { box, detail, wall, door, win, lamp, table, shelves, item, hide, poi, stairs, stairsX, room, mount, fur, pr };
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
    targets: ['jar'], indoor: true, outdoorLight: 0.25, groundVisualY: -0.05, lampStyle: 'bulb',
    titleCamera: { from: [10, 4.7, 2.6], to: [4, 0.6, -12] },
  });
  const { box, detail, wall, door, win, lamp, table, shelves, item, hide, poi, stairs, room, mount, fur, pr } = kit(L);
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
  for (const x of [-13.2, -12.2]) fur('washer', box(x, 0, 2.1, x + 0.9, 0.9, 2.95, 'metal', 0xd7d9d2), { faces: '-z' });
  fur('counter', box(-6.5, 0, 1.9, -4.3, 0.9, 2.95, 'counter', 0x9aa79a), { faces: '-z', sink: true, c: 0x7a8a7a });
  pr('basin', -10.6, 0, 2.7, 0.7, 0.5, 0.9, { faces: '-z' });
  pr('pipes', -8.9, 2.75, 2.8, 9.6, 0.4, 0.2, { n: 2 });
  for (const x of [-12, -10, -8]) detail(x, 1.2, -2.6, x + 1.4, 2.4, -2.55, 'fabric', 0xe2ddd0);
  detail(-13.8, 2.45, -2.6, -4.2, 2.5, -2.55, 'metal', 0x555b5f);
  table(-9, 0, 0.6, 0x8a7457);
  item('fuse', 'fuse', -9, 0.87, 0.6, 'Fuse');
  lamp('laundry', -9, 2.95, -1, 0xfff0c8, false, 3.5, { flicker: 0.3 });
  pr('crates', -13.1, 0, -5.8, 1.2, 1.2, 1, {});

  // Workshop: the boiler, a workbench, paint tins, pipes, and a locker to hide in.
  fur('boiler', box(-3.4, 0, 1.4, -1.6, 2.3, 2.95, 'metal', 0x5a7681), { faces: '-z' });
  pr('pipes', -2.5, 2.8, 0.6, 2.4, 0.4, 0.2, { faces: '+x', n: 2, valve: true });
  table(2, 0, 2.3, 0x6b5136, 1.3, 0.5, { kind: 'workbench', faces: '-z' });
  L.decor.push({ t: 'pegboard', x: 2, y: 1.7, z: 2.98, ry: Math.PI });
  fur('shelving', box(5.6, 0, 2.2, 8.6, 1.4, 2.95, 'board', 0x6d5a45), { faces: '-z' });
  pr('barrel', -3.2, 0, -5.9, 0.7, 0.7, 0.95, { c: 0x5a6a3a });
  hide('workLocker', 7.6, 0, -5.9, '+z');
  lamp('stove', 1, 2.95, -2, 0xffce8b, false, 3.5, { flicker: 0.2 });
  poi('stove', 1, 0, -2, 3);

  // Corridor clutter and things to throw.
  pr('pipes', -0.1, 2.7, -8.55, 27.6, 0.5, 0.2, { n: 3 });
  for (const x of [-13.45, 13.45]) pr('pipes', x, 2.62, -8.5, 3, 0.3, 0.2, { faces: '+x', n: 1 });
  pr('pipes', 4, 2.4, -7.1, 7.6, 0.2, 0.2, { n: 1, valve: true });
  item('can1', 'can', -2, 0, -8.4); item('bottle1', 'bottle', 5.5, 0, -8.3); item('can2', 'can', -12.5, 0, -9.2);
  lamp('corridor', -7, 2.95, -8.5, 0xffd9a0, false, 3.5, { flicker: 0.7 }); lamp('corridor2', 6, 2.95, -8.5, 0xffd9a0);
  poi('corridor', -5, 0, -8.5, 3); poi('stairfoot', 10, 0, -8.6, 1);

  // Vault (red padlock): wine racks, a chained chest, and the jar on a draped table.
  for (const [x, z] of [[-12.6, -22], [-12.6, -17], [-5.3, -22], [-5.3, -17]]) shelves(x, 0, z, 'z', 0x5c3a2e, { kind: 'winerack', faces: x < -9 ? '+x' : '-x' });
  table(-9, 0, -23.5, 0x4a3226);
  detail(-10, 0.86, -24, -8, 0.88, -23, 'fabric', 0x6e1f1f);
  item('jar', 'vase', -9, 0.87, -23.5, 'The jar with his name on it');
  fur('chest', box(-13.5, 0, -14, -11.5, 0.7, -12.6, 'wood', 0x5a4030), { faces: '+x', chain: true, c: 0x5a4030 });
  lamp('basement', -9, 2.95, -18, 0xe0604a);

  // Cold room (electric lock): steel shelving, hanging hooks, and the red key on the counter.
  for (const x of [-3, 3]) shelves(x, 0, -14, 'z', 0x9aa8b0);
  for (const x of [-1.5, 0, 1.5]) detail(x - 0.04, 2.1, -17.5, x + 0.04, 3.05, -17.4, 'metal', 0xb6bec4);
  table(0, 0, -16.6, 0xa9b4ba, 1.1, 0.5);
  item('redkey', 'redkey', 0, 0.87, -16.6, 'Red key');
  lamp('cold', 0, 2.95, -14, 0x9fd6ff, true);

  // Pump room: sump pump, pressure tank, and the fuse box on the east wall.
  fur('tank', box(6, 0, -17.6, 7.6, 1.2, -16.2, 'metal', 0x4f6e6a), { c: 0x4f6e6a });
  fur('boiler', box(10.8, 0, -17.6, 12.4, 2.2, -16, 'metal', 0x6b7d86), { faces: '+z' });
  pr('pipes', 9.2, 0.97, -16.9, 3.2, 0.3, 0.2, { n: 1, valve: true });
  pr('elecbox', 13.66, 0.6, -15.2, 0.6, 0.24, 0.7, { faces: '-x' });
  pr('pipes', 9, 2.75, -10.9, 9.4, 0.4, 0.2, { n: 2 });
  L.fusebox = { x: 13.6, y: 1.35, z: -13.5 };
  lamp('pump', 9, 2.95, -14, 0xffc890);
  poi('pump', 9.5, 0, -13, 2);
  hide('pumpLocker', 5, 0, -13, '+x');

  // Crawlspace: crates, old furniture under sheets, and a dripping pipe.
  for (const [x, z] of [[0, -21], [6, -24], [11, -21.5]]) { box(x - 0.9, 0, z - 0.6, x + 0.9, 0.9, z + 0.6, 'fabric', 0xb9b2a2); }
  item('crate1', 'crate', 3.5, 0, -20); item('crate2', 'crate', 8.5, 0, -24.6); item('ball1', 'ball', -2, 0, -24);
  hide('crawlLocker', -1.6, 0, -25.2, '+z');
  pr('pipes', 5, 2.67, -22.03, 17.6, 0.4, 0.2, { n: 2, valve: true });
  pr('crates', 12.6, 0, -24.7, 1.8, 1.6, 1.2, {}); pr('barrel', -3, 0, -19, 0.7, 0.7, 0.95, { c: 0x6a4a2a });
  lamp('crawl', 5, 2.95, -22, 0xd8b583, false, 2.4, { flicker: 1 });
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
  const R = (name, x0, z0, x1, z1, wall, floor, ceil, o = {}) => ({ name, x0, z0, x1, z1, y: 0, h: 3.05, wall, floor, ceil, ...o });
  L.rooms = [
    R('laundry', -13.8, -6.8, -4, 3, 'wp_basement', 'tile', 'planks', { full: true, trim: 0x8a8070, floorTint: 0x8a867a }),
    R('workshop', -3.8, -6.8, 8.8, 3, 'block', 'concrete', 'planks', { tint: 0x8a8478, trim: 0x6a5a48, floorTint: 0x8a8a84 }),
    R('corridor', -13.8, -10, 13.8, -7, 'stone', 'concrete', 'concrete', { tint: 0x8a8274, trim: 0x5a5248, floorTint: 0x7a7c7e }),
    R('vault', -13.8, -25.8, -4, -10.2, 'brick', 'stone', 'concrete', { tint: 0x7a4a3e, trim: 0x3a2a22, floorTint: 0x8a8070 }),
    R('cold', -3.8, -18, 4, -10.2, 'tile', 'tile', 'concrete', { tint: 0xc8dde6, trim: 0x8aa0aa, floorTint: 0xaab8c0 }),
    R('pump', 4.2, -18, 13.8, -10.2, 'concrete', 'concrete', 'concrete', { tint: 0x7a8078, trim: 0x4a4e4a, floorTint: 0x6e7270 }),
    R('crawl', -3.8, -25.8, 13.8, -18.2, 'stone', 'concrete', 'planks', { tint: 0x6e665a, trim: 0x4a4238, floorTint: 0x6a645a }),
  ];
  dressRooms(L);
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
function street(L, K, y, back = -50.5) {
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
  inv(-35, -1, back, -34.5, 14, 23); inv(34.5, -1, back, 35, 14, 23);
  inv(-35, -1, 22.5, 35, 14, 23); inv(-35, -1, back - 0.5, 35, 14, back);
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

// ------------------------------------------------------------------------------------------------
// Level 4: The Mansion. A huge three-storey house with an attic and a basement, on its own walled
// estate across your street, with a fountain out front and a hedge maze in the back garden.
//   crowbar (centre of the hedge maze) -> attic stairs in the trophy room -> pry the boarded attic
//   hatch -> fuse -> fuse box in the wine cellar (stairs in the kitchen) -> his study's electric door
//   opens (first floor, off the gallery) -> red key -> basement vault -> golden trophy -> home.
function buildMansion() {
  const A = 9.6;
  const L = base(3, {
    targets: ['trophy'], indoor: false, outdoorLight: 0.58, groundVisualY: H - 0.02,
    titleCamera: { from: [-28, H + 15, 4], to: [0, H + 4, -32] },
  });
  const K = kit(L);
  const { box, detail, wall, door, win, lamp, table, shelves, item, hide, poi, stairs, stairsX, room, mount } = K;
  const STONE = 0xd8cdb8, STONE2 = 0xc4b79e, SLATE = 0x2f3440, WOOD = 0x5b3a26, GOLD = 0xd4a53a;

  // ---- ground: lawn at y=H everywhere, open over the basement (under the centre and east wing)
  for (const [a0, b0, a1, b1] of [[-34.5, -70.5, -18, 23], [18, -70.5, 34.5, 23], [-18, -70.5, 18, -40], [-18, -20, 18, 23]]) box(a0, 0, b0, a1, H, b1, 'grass', 0x5f8a48);
  box(-18, 0, -40, -6, 3, -20, 'concrete', 0x8a8478);              // no cellar under the west wing
  L.holes = [[-18, -40, 18, -20]];
  const { inv } = street(L, K, H, -70.5);

  // ---- the estate: low iron railings and gate at the front, tall walls around the rest
  for (const [x0, x1] of [[-24, -2.5], [2.5, 24]]) {
    inv(x0, H, -8, x1, H + 1.3, -7.8);
    for (let x = x0 + 0.2; x < x1; x += 0.35) detail(x - 0.03, H, -7.93, x + 0.03, H + 1.3, -7.87, 'metal', 0x26282e);
    detail(x0, H + 1.05, -7.95, x1, H + 1.12, -7.85, 'metal', 0x26282e);
  }
  for (const x of [-2.9, 2.5]) box(x, H, -8.2, x + 0.4, H + 2.6, -7.6, 'block', STONE2);
  box(-24.2, H, -66, -24, H + 2.6, -7.8, 'brick', 0x8a6a56); box(24, H, -66, 24.2, H + 2.6, -7.8, 'brick', 0x8a6a56);
  box(-24.2, H, -66.2, 24.2, H + 2.6, -66, 'brick', 0x8a6a56);
  inv(-24.6, H + 2.6, -66.4, -24, 14, -7.8); inv(24, H + 2.6, -66.4, 24.6, 14, -7.8); inv(-24.6, H + 2.6, -66.6, 24.6, 14, -66);
  // drive, front court and fountain
  detail(-2.5, H, -20, 2.5, H + 0.02, -7.8, 'paving', 0xcfc6b4);
  detail(-9, H, -20, 9, H + 0.02, -16, 'paving', 0xcfc6b4);
  box(-2.2, H, -15.2, 2.2, H + 0.6, -11.8, 'block', STONE);
  detail(-1.9, H + 0.6, -14.9, 1.9, H + 0.62, -12.1, 'glass', 0x5ab4e0);
  box(-0.3, H + 0.6, -13.8, 0.3, H + 1.9, -13.2, 'block', STONE); box(-0.7, H + 1.9, -14.2, 0.7, H + 2.1, -12.8, 'block', STONE);
  for (const x of [-11, 11]) { box(x - 0.4, H, -12.4, x + 0.4, H + 4.6, -11.6, 'bark', 0x5a4030, { tag: 'tree' }); L.decor.push({ t: 'tree', x, y: H + 4.2, z: -12, s: 1.3 }); }
  for (const x of [-20, 20]) { box(x - 0.4, H, -30.4, x + 0.4, H + 4.6, -29.6, 'bark', 0x5a4030, { tag: 'tree' }); L.decor.push({ t: 'tree', x, y: H + 4.2, z: -30, s: 1.4 }); }

  // ---- basement (y 0..3) under the centre and east wing
  box(-6, -0.25, -40, 18, 0, -20, 'concrete', 0x6c6a66);
  const bw = (axis, t, a, b, ops = []) => wall(axis, t, a, b, 0, 3, ops, 'block', 0x7d756a);
  bw('x', -40, -6, 18); bw('x', -20.2, -6, 18); bw('z', -6, -40, -20); bw('z', 17.8, -40, -20);
  bw('x', -30.2, -5.8, 17.8, [door('basement', 'x', -30.2, -1, 0, 'red', 'Vault door'), door('cellarStore', 'x', -30.2, 11, 0, null, 'Store-room door')]);
  bw('z', 4, -30, -20.2);
  stairs(15.8, 17.8, -38, 1, 0, 0x6d5a45, 'wood');
  L.fusebox = { x: 17.6, y: 1.35, z: -39.1 };
  // wine cellar: racks and barrels
  for (const z of [-39.2, -36.4]) for (const x of [-4, 0, 4]) { shelves(x, 0, z, 'x', 0x5c3a2e); for (const dy of [0.25, 0.9, 1.6]) detail(x - 0.7, dy, z - 0.25, x + 0.7, dy + 0.12, z + 0.25, 'glass', 0x3c5a3a); }
  for (const x of [8, 9.4, 10.8]) box(x - 0.6, 0, -39.6, x + 0.6, 1.1, -38.4, 'wood', 0x7a5232);
  hide('cellarLocker', 13, 0, -31, '-z');
  item('bottle1', 'bottle', 6, 0, -33); item('bottle2', 'bottle', 2, 0, -33.5);
  lamp('cellar', 4, 2.85, -35, 0xffc890); lamp('cellar2', 12, 2.85, -35, 0xffc890, false, 2.6);
  poi('cellar', 8, 0, -34, 2);
  // vault (red padlock): the golden trophy on a velvet plinth, paintings, safe
  box(-1.6, 0, -24.6, 1.6, 0.9, -22.6, 'wood', 0x3a2418); detail(-1.5, 0.9, -24.5, 1.5, 0.92, -22.7, 'fabric', 0x7a1f2a);
  item('trophy', 'vase', 0, 0.92, -23.6, 'His golden trophy');
  box(-5.6, 0, -21.4, -4.2, 1.3, -20.4, 'metal', 0x4a4f56);
  for (const x of [-4, 0, 2.5]) detail(x - 0.6, 1.2, -20.42, x + 0.6, 2.1, -20.4, 'paper1', 0xd8c89a);
  lamp('basement', 0, 2.85, -25, 0xe0604a);
  // store room
  shelves(16.8, 0, -24, 'z'); shelves(16.8, 0, -27.5, 'z');
  item('crate1', 'crate', 8, 0, -24); item('crate2', 'crate', 10, 0, -22); item('paint1', 'paint', 6, 0, -27);
  lamp('store', 11, 2.85, -25, 0xffe6b0, false, 2.6);

  // ---- ground floor (y 3.2..6.2); the slab has the kitchen's cellar stairwell cut out
  box(-18, 3, -40, 15.6, H, -20, 'woodfloor', 0x8a6440);
  box(15.6, 3, -40, 18, H, -38, 'woodfloor', 0x8a6440); box(15.6, 3, -31.6, 18, H, -20, 'woodfloor', 0x8a6440);
  box(15.5, H, -38, 15.6, H + 0.95, -31.6, 'trim', 0xe9e2cf); box(15.5, H, -38.2, 17.8, H + 0.95, -38, 'trim', 0xe9e2cf);
  detail(-5.8, H + 0.005, -32, 5.8, H + 0.02, -21, 'carpet', 0x7a1f2a);                    // red carpet in the hall
  const ext = (axis, t, a, b, y, ops) => wall(axis, t, a, b, y, 3, ops, 'block', STONE);
  ext('x', -20.2, -18, 18, H, [
    win('libraryW', 'x', -20.2, -12, H + 0.9, 1.8, 'Library window', { entry: 'libraryWindow' }),
    door('front', 'x', -20.2, 0, H, null, 'Front doors', -1, 0x3a2418),
    win('ballroomW', 'x', -20.2, 12, H + 0.9, 1.8, 'Ballroom window', { entry: 'ballroomWindow' }),
  ]);
  ext('x', -40, -18, 18, H, [
    win('diningW', 'x', -40, -12, H + 0.9, 1.8, 'Dining-room window', { entry: 'diningWindow', outside: -1 }),
    door('back', 'x', -40, 10, H, null, 'Back door', 1, 0x3a2418),
    win('kitchenW', 'x', -40, 14, H + 1, 1.2, 'Kitchen window', { entry: 'kitchenWindow', outside: -1 }),
  ]);
  ext('z', -18, -40, -20, H, [win('libSideW', 'z', -18, -25, H + 0.9, 1.6, 'Library window', { outside: -1, breakable: false })]);
  ext('z', 17.8, -40, -20, H, [win('ballSideW', 'z', 17.8, -25, H + 0.9, 1.6, 'Ballroom window', { breakable: false })]);
  const iw = (axis, t, a, b, y, ops = [], m = 'paper1', c = 0xd8ccb0) => wall(axis, t, a, b, y, 3, ops, m, c);
  iw('z', -6.2, -39.8, -20.2, H, [door('libDoor', 'z', -6.2, -25, H, null, 'Library door'), door('dinDoor', 'z', -6.2, -35, H, null, 'Dining-room door')], 'paper2', 0xc9b48e);
  iw('z', 6, -39.8, -20.2, H, [door('ballDoor', 'z', 6, -25, H, null, 'Ballroom door'), door('kitDoor', 'z', 6, -35, H, null, 'Kitchen door')], 'paper2', 0xc9b48e);
  iw('x', -30.2, -17.8, -6.2, H, [door('libDin', 'x', -30.2, -12, H, null, 'Door')]);
  iw('x', -30.2, 6.2, 17.8, H, [door('ballKit', 'x', -30.2, 9, H, null, 'Door')]);
  // grand hall: staircase up to the gallery, chandelier, tall clock, portraits, statues
  stairs(-1.5, 1.5, -27, -1, H, 0x6b4430, 'wood');
  detail(-1.4, H + 0.01, -27, 1.4, H + 0.02, -21, 'carpet', 0x7a1f2a);
  for (const x of [-1.6, 1.5]) box(x, H, -33.4, x + 0.1, H + 0.9, -27, 'wood', WOOD);
  L.decor.push({ t: 'chandelier', x: 0, y: 9.2, z: -27, hang: true });
  L.decor.push({ t: 'clock', x: -5.75, y: H + 1.9, z: -30, ry: Math.PI / 2, tall: true });
  for (const z of [-24, -36]) { L.decor.push({ t: 'portrait', x: 5.78, y: H + 2, z, ry: -Math.PI / 2 }); L.decor.push({ t: 'portrait', x: -5.98, y: H + 2, z: z + 1, ry: Math.PI / 2 }); }
  for (const x of [-4.6, 4.6]) { box(x - 0.4, H, -21.4, x + 0.4, H + 0.9, -20.6, 'block', STONE); box(x - 0.25, H + 0.9, -21.25, x + 0.25, H + 2.2, -20.75, 'block', 0xeeeae0); }
  item('vase1', 'vase', -4.6, H + 0.9, -23); item('vase2', 'vase', 4, H, -38);
  lamp('hall', 0, 9.1, -24, 0xffe1b0, false, 4.5); lamp('hall2', 0, 6, -37, 0xffe1b0);
  poi('hall', 0, H, -23, 3); poi('hallBack', 3, H, -37, 1);
  // library: bookcases, reading chairs, a fireplace, wardrobe
  for (const x of [-16.5, -14, -11.5, -9]) shelves(x, H, -29.6, 'x', 0x6b4430);
  for (let i = 0; i < 12; i++) detail(-17.3 + i * 0.7, H + 0.95, -29.75, -16.9 + i * 0.7, H + 1.45, -29.7, 'paper1', [0x8a2a2a, 0x2a4a8a, 0x2a6a3a, 0x8a6a2a][i % 4]);
  box(-17.8, H, -24, -17.2, H + 1.3, -22, 'brick', 0x7a4a3a); detail(-17.25, H + 0.2, -23.6, -17.2, H + 0.9, -22.4, 'emissive', 0xff8a3a);
  box(-12.5, H, -23.5, -11.3, H + 0.5, -22.3, 'fabric', 0x6a2a3a); box(-9.5, H, -23.5, -8.3, H + 0.5, -22.3, 'fabric', 0x6a2a3a);
  table(-10.4, H, -25.5, 0x5b3a26, 0.8, 0.5); item('book1', 'book', -10.4, H + 0.86, -25.5);
  hide('libWardrobe', -7, H, -28.6, '-x', WOOD);
  lamp('library', -12, H + 2.85, -25, 0xffd59a);
  poi('library', -11, H, -26.5, 2);
  // dining room: long table, chairs, sideboard
  box(-15.5, H + 0.72, -36, -8.5, H + 0.86, -34, 'woodfloor', 0x5b3a26);
  for (const x of [-15, -8.9]) for (const z of [-35.8, -34.2]) box(x, H, z, x + 0.12, H + 0.72, z + 0.12, 'wood', WOOD);
  for (let x = -14.6; x <= -9.4; x += 1.3) for (const z of [-36.9, -33.1]) box(x - 0.25, H, z - 0.25, x + 0.25, H + 0.5, z + 0.25, 'wood', 0x6b4430);
  for (const x of [-14, -12, -10]) item('plate' + x, 'plate', x, H + 0.86, -35);
  box(-17.8, H, -38.4, -17.2, H + 0.9, -33.6, 'wood', WOOD);
  lamp('dining', -12, H + 2.85, -35, 0xffd59a);
  // ballroom: polished floor, piano, curtains, chandelier
  detail(6.4, H + 0.005, -29.8, 17.6, H + 0.02, -20.4, 'checker', 0xffffff);
  box(14.2, H, -29.2, 16.8, H + 1, -27.4, 'wood', 0x1d1d22); box(14.2, H + 1, -29.2, 15, H + 1.4, -27.4, 'wood', 0x1d1d22);
  L.decor.push({ t: 'chandelier', x: 12, y: 6.0, z: -25, hang: true });
  hide('ballCurtain', 7, H, -21.1, '+x', 0x7a1f2a);
  item('ball1', 'ball', 10, H, -23);
  lamp('ballroom', 12, H + 2.6, -25, 0xffe8c0);
  poi('ballroom', 11, H, -24, 2);
  // kitchen: counters, range, big table, pantry; the cellar stairs are in the east corner
  box(6.4, H, -39.8, 9.2, H + 0.9, -39, 'counter', 0xb7c2b0); box(10.8, H, -39.8, 15.4, H + 0.9, -39, 'counter', 0xb7c2b0);
  box(6.4, H, -38, 7.2, H + 0.92, -36.4, 'metal', 0x2a2c2f); L.decor.push({ t: 'hood', x: 6.8, y: H + 1.9, z: -37.2 });
  table(11, H, -34.5, 0x8a6a48, 1.4, 0.6);
  item('can1', 'can', 10.4, H + 0.86, -34.4); item('apple1', 'apple', 11.6, H + 0.86, -34.6);
  hide('pantry', 6.9, H, -31.4, '+x', 0x6b5136);
  lamp('kitchen', 11, H + 2.85, -35, 0xfff0d0);
  poi('stove', 7.9, H, -37.2, 3);

  // ---- first floor (y 6.4..9.4): wings plus the gallery across the back of the hall
  box(-18, 6.2, -40, -6, U, -20, 'carpet', 0x6a4a5a); box(6, 6.2, -40, 18, U, -20, 'carpet', 0x4a5a6a);
  box(-6, 6.2, -40, 6, U, -33.4, 'woodfloor', 0x7a5636);
  box(-6, U, -33.5, -1.5, U + 0.95, -33.4, 'wood', WOOD); box(1.5, U, -33.5, 6, U + 0.95, -33.4, 'wood', WOOD);
  for (let x = -5.6; x < 5.8; x += 0.5) if (Math.abs(x) > 1.6) detail(x, U, -33.46, x + 0.06, U + 0.95, -33.44, 'wood', WOOD);
  ext('x', -20.2, -18, -6, U, [win('bedWW', 'x', -20.2, -12, U + 0.9, 1.6, 'Bedroom window', { breakable: false })]);
  ext('x', -20.2, -6, 6, U, [win('hallW', 'x', -20.2, 0, U + 0.4, 3, 'Great window', { breakable: false, h: 2.2 })]);
  ext('x', -20.2, 6, 18, U, [win('bedEW', 'x', -20.2, 12, U + 0.9, 1.6, 'Bedroom window', { breakable: false })]);
  ext('x', -40, -18, 18, U, [win('studyW', 'x', -40, -12, U + 0.9, 1.6, 'Study window', { breakable: false, outside: -1 })]);
  ext('z', -18, -40, -20, U, []); ext('z', 17.8, -40, -20, U, []);
  iw('z', -6.2, -39.8, -20.2, U, [door('study', 'z', -6.2, -36.5, U, 'power', 'Study electric door', -1)], 'paper3', 0xcfc6d9);
  iw('z', 6, -39.8, -20.2, U, [door('trophyDoor', 'z', 6, -34.5, U, null, 'Trophy-room door')], 'paper3', 0xcfc6d9);
  iw('x', -30.2, -17.8, -6.2, U, [door('studyBed', 'x', -30.2, -12, U, null, 'Door')], 'paper3', 0xcfc6d9);
  iw('x', -30.2, 6.2, 17.8, U, [door('trophyBed', 'x', -30.2, 9, U, null, 'Door')], 'paper3', 0xcfc6d9);
  lamp('gallery', 0, U + 2.85, -37, 0xffe1b0);
  poi('gallery', 0, U, -37, 2);
  // the study (electric lock): desk with the red key, globe, filing cabinets, corkboard
  table(-12, U, -38.4, 0x3a2418, 1.4, 0.6);
  item('redkey', 'redkey', -12, U + 0.87, -38.4, 'Red key');
  L.decor.push({ t: 'desklamp', x: -11.2, y: U + 0.86, z: -38.6 });
  for (const x of [-17.2, -16.2]) box(x - 0.4, U, -39.7, x + 0.4, U + 1.4, -38.9, 'metal', 0x6d7a6f);
  box(-9, U, -32, -7.6, U + 0.9, -31, 'wood', WOOD); detail(-8.7, U + 0.9, -31.8, -7.9, U + 1.5, -31.2, 'glass', 0x5ab4e0);
  L.decor.push({ t: 'corkboard', x: -17.76, y: U + 1.6, z: -34.5, ry: Math.PI / 2 });
  lamp('study', -12, U + 2.85, -35, 0xc8e0ff, true);
  // bedrooms
  box(-16.5, U, -25.6, -13.5, U + 0.5, -21.4, 'wood', WOOD); box(-16.5, U + 0.5, -25.6, -13.5, U + 0.75, -21.4, 'fabric', 0x8a3a5a); box(-16.5, U, -21.6, -13.5, U + 1.4, -21.4, 'wood', WOOD);
  hide('bedWWardrobe', -7, U, -24, '-x', WOOD); item('ballW', 'ball', -10, U, -26);
  lamp('bedW', -12, U + 2.85, -25, 0xffd2a0);
  box(13.5, U, -25.6, 16.5, U + 0.5, -21.4, 'wood', WOOD); box(13.5, U + 0.5, -25.6, 16.5, U + 0.75, -21.4, 'fabric', 0x3a5a8a); box(13.5, U, -21.6, 16.5, U + 1.4, -21.4, 'wood', WOOD);
  hide('bedEWardrobe', 7, U, -24, '+x', WOOD);
  L.decor.push({ t: 'rockingchair', x: 9, y: U, z: -22, ry: 0.4 });
  lamp('bedE', 12, U + 2.85, -25, 0xffd2a0);
  poi('bedroom', 11, U, -26, 1);
  // trophy room: cabinets of cups and the stairs up to the attic along the north wall
  stairsX(-39.6, -37.6, 7, 1, U, 0x6b4430, 'wood');
  for (const x of [10, 14]) { box(x - 0.9, U, -31.2, x + 0.9, U + 1.8, -30.4, 'wood', WOOD); for (const dx of [-0.5, 0, 0.5]) detail(x + dx - 0.12, U + 1.0, -31.25, x + dx + 0.12, U + 1.35, -31.2, 'metal', GOLD); }
  for (const z of [-36, -33]) L.decor.push({ t: 'portrait', x: 17.78, y: U + 1.9, z, ry: -Math.PI / 2 });
  lamp('trophy', 12, U + 2.85, -35, 0xffe1b0);

  // ---- ceiling over the first floor, with the attic stairwell cut out
  box(-18, 9.4, -40, 6.8, A, -20, 'plaster', 0xe8e3d6); box(13.6, 9.4, -40, 18, A, -20, 'plaster', 0xe8e3d6);
  box(6.8, 9.4, -37.4, 13.6, A, -20, 'plaster', 0xe8e3d6); box(6.8, 9.4, -40, 13.6, A, -39.8, 'plaster', 0xe8e3d6);
  box(6.8, A, -37.5, 13.6, A + 0.95, -37.4, 'wood', WOOD);
  // ---- attic over the east wing (y 9.6..12.4): the store behind the boarded hatch has the fuse
  const aw = (axis, t, a, b, ops = []) => wall(axis, t, a, b, A, 2.8, ops, 'board', 0x7a6248);
  aw('x', -20.2, 6, 18); aw('x', -40, 6, 18); aw('z', 6, -40, -20); aw('z', 17.8, -40, -20);
  aw('x', -30.2, 6.2, 17.8, [win('atticHatch', 'x', -30.2, 12, A + 0.5, 1.4, 'Boarded attic hatch', { boards: true, glass: false, h: 1.2, outside: 1 })]);
  box(6, 12.4, -40, 18, 12.6, -20, 'board', 0x6a5238);
  for (const [x, z] of [[9, -34], [15, -35], [11, -32]]) box(x - 0.6, A, z - 0.5, x + 0.6, A + 0.8, z + 0.5, 'cardboard', 0xb08a5c);
  L.decor.push({ t: 'rockinghorse', x: 15.5, y: A, z: -24 }); L.decor.push({ t: 'mannequin', x: 8, y: A, z: -22 });
  table(12, A, -21.4, 0x6b5136, 1, 0.45);
  item('fuse', 'fuse', 12, A + 0.87, -21.4, 'Fuse');
  hide('atticTrunk', 16.9, A, -32.5, '-x', 0x6b5136);
  lamp('attic', 12, A + 2.5, -35, 0xffd9a0, false, 2.4); lamp('atticStore', 12, A + 2.5, -25, 0xffd9a0, false, 2);
  poi('attic', 15, A, -38.6, 1);

  // ---- roofs, chimneys, porch columns
  L.roofs.push({ x0: -18.8, x1: 6, z0: -40.8, z1: -19.4, y: A, h: 4.2, ridge: 'x', tint: SLATE, gable: STONE });
  L.roofs.push({ x0: 6, x1: 18.8, z0: -40.8, z1: -19.4, y: 12.6, h: 2.6, ridge: 'x', tint: SLATE, gable: STONE });
  for (const x of [-15, 15]) box(x - 0.6, A, -31, x + 0.6, A + 5.6, -29.8, 'brick', 0x7a4a3a);
  for (const x of [-3, 3]) box(x - 0.25, H, -17.6, x + 0.25, H + 3.1, -17.1, 'block', 0xeeeae0);
  detail(-3.6, H + 3.1, -20, 3.6, H + 3.3, -16.8, 'block', STONE);
  detail(-3.6, H, -20, 3.6, H + 0.15, -16.8, 'paving', 0xe2dccd);
  lamp('porch', 0, H + 2.9, -18.4, 0xffe2a8, false, 3);
  for (const x of [-18.1, 17.9]) for (const y of [H, U]) detail(x, y + 3, -40.1, x + 0.2, y + 3.2, -19.9, 'trim', 0xeeeae0);

  // ---- the hedge maze behind the house (9 x 9 cells of 2 m); the crowbar waits in the middle
  const MX = -23, MZ = -64, N = 9, CELL = 2, hh = 2.2;
  {
    let seed = 20261013;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
    const right = [], down = [], seen = [];
    for (let i = 0; i < N; i++) { right.push(Array(N).fill(true)); down.push(Array(N).fill(true)); seen.push(Array(N).fill(false)); }
    const stack = [[4, 4]]; seen[4][4] = true;
    while (stack.length) {
      const [cx, cz] = stack[stack.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [cx + dx, cz + dz, dx, dz]).filter(([x, z]) => x >= 0 && z >= 0 && x < N && z < N && !seen[x][z]);
      if (!nb.length) { stack.pop(); continue; }
      const [nx, nz, dx, dz] = nb[Math.floor(rnd() * nb.length)];
      if (dx === 1) right[cx][cz] = false; if (dx === -1) right[nx][nz] = false;
      if (dz === 1) down[cx][cz] = false; if (dz === -1) down[nx][nz] = false;
      seen[nx][nz] = true; stack.push([nx, nz]);
    }
    const hedge = (x0, z0, x1, z1) => box(x0, H, z0, x1, H + hh, z1, 'hedge', 0x3f6b3a);
    hedge(MX - 0.2, MZ - 0.2, MX + N * CELL + 0.2, MZ + 0.2);                                  // north edge
    hedge(MX - 0.2, MZ, MX + 0.2, MZ + N * CELL); hedge(MX + N * CELL - 0.2, MZ, MX + N * CELL + 0.2, MZ + N * CELL);
    for (let i = 0; i < N; i++) if (i !== 4) hedge(MX + i * CELL - 0.2, MZ + N * CELL - 0.2, MX + (i + 1) * CELL + 0.2, MZ + N * CELL + 0.2); // south edge, gap at the entrance
    for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
      if (x < N - 1 && right[x][z]) hedge(MX + (x + 1) * CELL - 0.2, MZ + z * CELL - 0.2, MX + (x + 1) * CELL + 0.2, MZ + (z + 1) * CELL + 0.2);
      if (z < N - 1 && down[x][z]) hedge(MX + x * CELL - 0.2, MZ + (z + 1) * CELL - 0.2, MX + (x + 1) * CELL + 0.2, MZ + (z + 1) * CELL + 0.2);
    }
    const cxm = MX + 4.5 * CELL, czm = MZ + 4.5 * CELL;
    box(cxm - 0.5, H, czm - 0.5, cxm + 0.5, H + 0.7, czm + 0.5, 'block', STONE);
    item('crowbar', 'crowbar', cxm, H + 0.7, czm, 'Crowbar');
    lamp('maze', cxm, H + 2.6, czm, 0xd8ffd0, false, 2);
    poi('maze', MX + 4.5 * CELL, H, MZ + N * CELL + 1.5, 1, 'stare');
  }
  // garden: gazebo, pond, washing line, benches
  for (const [x, z] of [[8, -50], [14, -50], [8, -56], [14, -56]]) box(x - 0.15, H, z - 0.15, x + 0.15, H + 2.6, z + 0.15, 'trim', 0xeeeae0);
  detail(7.4, H + 2.6, -56.6, 14.6, H + 2.8, -49.4, 'roofflat', SLATE);
  detail(15, H + 0.005, -62, 21, H + 0.02, -58, 'glass', 0x5ab4e0);
  L.decor.push({ t: 'clothesline', x: 4, y: H + 2.1, z: -62 });
  item('crate3', 'crate', 3, H, -45); item('crate4', 'crate', 18, H, -44);
  poi('garden', 11, H, -53, 1);
  poi('court', 5, H, -10, 1, 'stare');

  // ---- rules
  L.spawn = { x: -1.6, y: H, z: 15.4, yaw: Math.atan2(-1.6, 5.2) };
  L.exit = makeBox(-4.6, H - 0.15, 10.4, 4.6, H + 2.5, 17.6);
  L.safeZones.push(makeBox(-34.5, H - 0.2, 6, 34.5, 30, 23));
  room(-6, 0, -40, 18, 3, -20, 0.3);
  room(-18, H, -40, 18, 6.2, -20, 0.6);
  room(-18, U, -40, 18, 9.4, -20, 0.6);
  room(6, A, -40, 18, 12.4, -20, 0.4);
  L.entries = {
    frontDoor: { name: 'front doors', kind: 'door', ref: 'front', x: 0, z: -19 },
    backDoor: { name: 'back door', kind: 'door', ref: 'back', x: 10, z: -41 },
    libraryWindow: { name: 'library window', kind: 'window', ref: 'libraryW', x: -12, z: -19 },
    ballroomWindow: { name: 'ballroom window', kind: 'window', ref: 'ballroomW', x: 12, z: -19 },
    diningWindow: { name: 'dining-room window', kind: 'window', ref: 'diningW', x: -12, z: -41 },
    kitchenWindow: { name: 'kitchen window', kind: 'window', ref: 'kitchenW', x: 14, z: -41 },
  };
  L.places = [['the wine cellar', 6, 0, -35], ['the vault door', -1, 0, -31], ['the store room', 11, 0, -25], ['the grand hall', 0, H, -26],
    ['the library', -12, H, -25], ['the dining room', -12, H, -35], ['the ballroom', 12, H, -25], ['the kitchen', 11, H, -35],
    ['the gallery', 0, U, -37], ['the study door', -5, U, -36.5], ['the bedroom', 12, U, -25], ['the trophy room', 12, U, -35],
    ['the attic', 12, A, -35], ['the front court', 0, H, -12], ['the hedge maze', -14, H, -55], ['the garden', 11, H, -53], ['the street', 0, H, 0]];
  mount('hallCam', -5.6, H + 2.8, -20.6, 0, -30, 'the grand hall');
  mount('galleryCam', 5.6, U + 2.6, -39.4, -3, -35, 'the gallery');
  mount('cellarCam', -5.6, 2.6, -39.4, 6, -34, 'the wine cellar');
  mount('mazeCam', -24.6, H + 2.4, -44, -14, -46, 'the hedge maze');
  mount('courtCam', 3.2, H + 2.6, -17, 0, -10, 'the front court');
  L.navBounds = { x0: -34.2, z0: -70.2, x1: 34.2, z1: 22.2 }; L.reachBounds = L.navBounds;
  for (const d of L.decor) if (d.y >= H - 0.01) d.lift = H;
  L.objective = w => {
    if (w.steps.trophy !== undefined) return 'You have his golden trophy! Get out and run home across the road.';
    if (!w.flags.power) {
      if (w.hasItem('fuse')) return 'Put the fuse in the fuse box in the wine cellar (stairs in the kitchen).';
      if (!w.hasItem('crowbar') && w.windows.find(x => x.id === 'atticHatch').boards) return 'The fuse is behind a boarded hatch in the attic. Find a crowbar — try the middle of the hedge maze out back.';
      return 'Climb to the attic (stairs in the trophy room, first floor east) and pry open the hatch.';
    }
    if (!w.hasItem('redkey') && w.doorById.basement.locked) return 'Power is on: his study (first floor, off the gallery, west) is unlocked. Take the red key.';
    if (w.doorById.basement.locked) return 'Unlock the red vault door in the wine cellar.';
    return 'Take the golden trophy from the vault.';
  };
  return L;
}

// ------------------------------------------------------------------------------------------------
// Level 5: The Nightmare House (in the style of Hello Neighbor's Act 3). The biggest house yet: a
// wonky tower of five floors stacked crooked on top of each other over a basement, with a tram that
// loops round it on an elevated track (Depot, Windmill and Water Room stations) and three Fear doors
// that lead to dream rooms where you win powers.
//   Supermarket (5 groceries past the mannequins)  -> crouch invisibility -> past the Eye -> fuse
//   Closet (climb in the dark to the light switch) -> double jump -> up the 2.3 m ledge to the
//     control room -> fuse in the fuse box, pull the lever, press the red button -> tram runs
//   tram -> the Water Room (only reachable by tram) -> red key
//   School (lockers, the bell, the giant mannequin) -> push -> shove the wardrobe off the basement
//     door -> red key opens it -> the music box -> home.
const F1x = 6.4, F2x = 9.6, F3x = 12.8, F4x = 16;

// floor slab [x0,x1]x[z0,z1] (top at y) with rectangular holes cut out
function slab(K, x0, z0, x1, z1, y, holes, m, c) {
  const xs = new Set([x0, x1]), zs = new Set([z0, z1]);
  for (const [a, b, cc, d] of holes) { xs.add(Math.max(x0, Math.min(x1, a))); xs.add(Math.max(x0, Math.min(x1, cc))); zs.add(Math.max(z0, Math.min(z1, b))); zs.add(Math.max(z0, Math.min(z1, d))); }
  const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b);
  // merge cells into strips along x for fewer boxes
  for (let j = 0; j < Z.length - 1; j++) {
    let run = null;
    for (let i = 0; i < X.length - 1; i++) {
      const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
      const hole = holes.some(([a, b, cc, d]) => cx > a && cx < cc && cz > b && cz < d);
      if (!hole) { if (run === null) run = X[i]; }
      if ((hole || i === X.length - 2) && run !== null) { K.box(run, y - 0.2, Z[j], hole ? X[i] : X[i + 1], y, Z[j + 1], m, c); run = null; }
    }
  }
}

function buildAct3() {
  const L = base(4, {
    targets: ['musicbox'], indoor: false, outdoorLight: 0.5, groundVisualY: H - 0.02,
    titleCamera: { from: [-30, 17, 6], to: [0, 10, -32] },
  });
  const K = kit(L);
  const { box, detail, wall, door, win, lamp, table, shelves, item, hide, poi, stairs, room, mount } = K;
  // Act 3 palette: every floor a different clashing colour, patched with planks
  const TEAL = 0x3f93b8, MUSTARD = 0xe0a83a, BRICKR = 0xb24a30, MINT = 0x62bd8c, PURPLE = 0x8a5ac0, TRIM = 0xf4ecd8, ROOFR = 0x9a2c26, ROOFB = 0x2c4a6a;
  const RAIL = 0xf0e6cc;
  const rail = (axis, t, a, b, y, c = RAIL) => (axis === 'x' ? box(a, y, t, b, y + 0.95, t + 0.08, 'trim', c) : box(t, y, a, t + 0.08, y + 0.95, b, 'trim', c));
  const gad = (o) => { (L.act3.gadgets).push(Object.assign({ hx: 0.3, hy: 0.4, hz: 0.3 }, o)); };
  L.act3 = { gadgets: [], mannequins: [], groceries: [], zones: {}, signs: [], tram: null, eye: null, blocker: null };

  // ---- ground: lawn at y=H, open over the house so its basement can sit under it
  for (const [a0, b0, a1, b1] of [[-34.5, -70.5, -14, 23], [14, -70.5, 34.5, 23], [-14, -70.5, 14, -44], [-14, -18, 14, 23]]) box(a0, 0, b0, a1, H, b1, 'grass', 0x5f8a48);
  for (const [a0, b0, a1, b1] of [[-14, -44, -10, -18], [10, -44, 14, -18], [-10, -28, 10, -18]]) box(a0, 0, b0, a1, 3, b1, 'concrete', 0x8a8478);
  L.holes = [[-14, -44, 14, -18]];
  const { picket, inv } = street(L, K, H, -70.5);

  // ---- his plot: picket front, tall fences round the rest, a crooked path, a dead tree
  for (const [a, b] of [[-23, -1.6], [1.6, 23]]) picket(a, b, -6.55, 1.1, 0xf3efe4);
  box(-23.2, H, -66, -23, H + 2, -6.5, 'fence', 0x7a5a40); box(23, H, -66, 23.2, H + 2, -6.5, 'fence', 0x7a5a40);
  box(-23.2, H, -66.2, 23.2, H + 2, -66, 'fence', 0x7a5a40);
  inv(-23.6, H + 2, -66.4, -23.2, 11.5, -6.5); inv(23.2, H + 2, -66.4, 23.6, 11.5, -6.5); inv(-23.6, H + 2, -66.8, 23.6, 11.5, -66.2);
  for (let i = 0; i < 6; i++) detail(-1 + Math.sin(i) * 0.6, H, -7 - i * 1.8, 1 + Math.sin(i) * 0.6, H + 0.02, -8.6 - i * 1.8, 'paving', 0xc9c0ae);
  box(-16.4, H, -12.4, -15.6, H + 5, -11.6, 'bark', 0x4a3a2a, { tag: 'tree' }); L.decor.push({ t: 'tree', x: -16, y: H + 4.5, z: -12, s: 1.1 });
  L.decor.push({ t: 'mailbox', x: -2.6, y: H, z: -7.1, ry: 0, c: 0xd23a3a });
  box(6.8, H, -15.9, 9.2, H + 1.35, -10.6, null, 0, { vis: false, tag: 'car' }); L.decor.push({ t: 'car', x: 8, y: H, z: -13.25, ry: 0, c: 0x3a5ad0 });
  item('crate1', 'crate', -18, H, -48); item('crate2', 'crate', 17, H, -60); item('ball1', 'ball', 12, H, -12);
  L.decor.push({ t: 'clothesline', x: -8, y: H + 2.1, z: -60 });
  poi('frontyard', -4, H, -10, 1, 'stare'); poi('backyard', 8, H, -52, 1);

  // ---- the elevated tram track: a rounded loop round the whole house at 12.8 m
  const loop = roundedLoop(-21, -57, 21, -9, 5);
  L.act3.tram = {
    y: F3x, pts: loop, start: 'depot',
    stations: [
      { id: 'depot', name: 'the Depot', at: [21, -29], exit: { x: 18.2, y: F3x, z: -29, yaw: Math.PI / 2 } },
      { id: 'windmill', name: 'the Windmill', at: [0, -57], exit: { x: -1.2, y: F3x, z: -53.4, yaw: Math.PI } },
      { id: 'water', name: 'the Water Room', at: [-21, -33], exit: { x: -23.9, y: F3x, z: -33, yaw: Math.PI / 2 } },
    ],
  };
  // steel pillars (skip the front path and the station platforms)
  for (const [x, z] of [[-21, -15], [-21, -22], [-21, -45], [-21, -51], [21, -15], [21, -22], [21, -38], [21, -45], [21, -51], [-12, -9], [-6, -9], [6, -9], [12, -9], [-12, -57], [-6, -57], [6, -57], [12, -57]]) {
    box(x - 0.25, H, z - 0.25, x + 0.25, F3x - 0.6, z + 0.25, 'metal', 0x3a4a5a);
    detail(x - 0.45, F3x - 0.75, z - 0.45, x + 0.45, F3x - 0.6, z + 0.45, 'metal', 0x2a3440);
  }

  // ================================================================================== BASEMENT
  box(-10, -0.25, -44, 10, 0, -28, 'concrete', 0x5a5650);
  const bw = (axis, t, a, b, ops = []) => wall(axis, t, a, b, 0, 3, ops, 'block', 0x6d665c);
  bw('x', -44, -10, 10); bw('x', -28.2, -10, 10); bw('z', -10, -44, -28); bw('z', 9.8, -44, -28);
  bw('z', 0.8, -42.6, -28.2); bw('z', 3, -42.6, -28.2);
  stairs(1, 3, -42.6, 1, 0, 0x5a4a3a, 'wood');
  // the kid's room: the music box on a little stage, drawings, a tiny bed, a red bulb
  box(-5.6, 0, -38.6, -4.4, 0.9, -37.4, 'wood', 0x6a2a3a); detail(-5.5, 0.9, -38.5, -4.5, 0.92, -37.5, 'fabric', 0x8a1f2a);
  item('musicbox', 'radio', -5, 0.92, -38, 'His music box');
  box(-9.6, 0, -43.6, -7.6, 0.45, -41.6, 'wood', 0x5a3a2a); box(-9.6, 0.45, -43.6, -7.6, 0.6, -41.6, 'fabric', 0x4a6a9a);
  for (let i = 0; i < 9; i++) detail(-9.8 + i * 1.1, 1.3 + (i % 2) * 0.35, -43.79, -9.2 + i * 1.1, 1.75 + (i % 2) * 0.35, -43.77, 'paper1', [0xffe7a0, 0xbfe3ff, 0xffc0c8][i % 3]);
  L.decor.push({ t: 'blocks', x: -3, y: 0, z: -31 }); L.decor.push({ t: 'rockinghorse', x: -8, y: 0, z: -31 });
  lamp('basement', -5, 2.85, -36, 0xff4030);
  // the boiler side
  box(5, 0, -43.6, 7, 2.4, -41.6, 'metal', 0x5a7681); detail(5.2, 1.1, -41.62, 6.8, 1.25, -41.58, 'emissive', 0xf0a040);
  shelves(9, 0, -33, 'z'); item('can1', 'can', 6, 0, -30); item('bottle1', 'bottle', 7.5, 0, -36);
  lamp('boiler', 6.5, 2.85, -35, 0xffc890, false, 2.4);
  room(-10, 0, -44, 10, 3, -28, 0.25);

  // ================================================================================== GROUND FLOOR (H)
  slab(K, -14, -44, 14, -18, H, [[1, -42.6, 3, -36.2]], 'woodfloor', 0x9b6a40);
  const ext = (axis, t, a, b, y, ops, m, c, h = 3) => wall(axis, t, a, b, y, h, ops, m, c);
  ext('x', -18.2, -14, 14, H, [
    win('livingW', 'x', -18.2, -9, H + 0.9, 1.8, 'Living-room window', { entry: 'livingWindow' }),
    door('front', 'x', -18.2, 0, H, null, 'Front door', -1, 0xd23a3a),
    win('kitchenW', 'x', -18.2, 9, H + 1, 1.6, 'Kitchen window', { entry: 'kitchenWindow' }),
  ], 'siding', TEAL);
  ext('x', -44, -14, 14, H, [
    win('partyW', 'x', -44, -9, H + 0.9, 1.6, 'Birthday-room window', { entry: 'partyWindow', outside: -1 }),
    door('back', 'x', -44, 9, H, null, 'Back door', 1, 0xe0a83a),
  ], 'siding', TEAL);
  ext('z', -14, -44, -18, H, [win('livingSideW', 'z', -14, -21.5, H + 0.9, 1.4, 'Living-room side window', { outside: -1, entry: 'sideWindow' })], 'siding', TEAL);
  ext('z', 13.8, -44, -18, H, [win('kitchenSideW', 'z', 13.8, -24, H + 1, 1.4, 'Kitchen side window', { breakable: false }), door('sideDoor', 'z', 13.8, -38, H, null, 'Side door', -1, 0x3a8a5a)], 'siding', TEAL);
  for (const [x, z] of [[-14.1, -18.1], [13.9, -18.1], [-14.1, -44.1], [13.9, -44.1]]) detail(x - 0.08, H, z - 0.08, x + 0.08, H + 3, z + 0.08, 'trim', TRIM);
  // porch with a sagging roof
  for (const x of [-1.6, 1.6]) box(x - 0.12, H, -16.6, x + 0.12, H + 2.7, -16.36, 'trim', TRIM);
  detail(-2.2, H + 2.7, -18, 2.2, H + 2.85, -16.1, 'roofflat', ROOFR);
  detail(-2.2, H, -18, 2.2, H + 0.12, -16.2, 'board', 0x8a6a4a);
  lamp('porch', 0, H + 2.5, -17, 0xffe2a8, false, 2.6);
  // inside walls
  const iw = (axis, t, a, b, y, ops = [], m = 'paper1', c = 0xe8d8b0) => wall(axis, t, a, b, y, 3, ops, m, c);
  iw('z', -4.2, -43.8, -18.2, H, [door('livDoor', 'z', -4.2, -22, H, null, 'Living-room door'), door('partyDoor', 'z', -4.2, -38, H, null, 'Birthday-room door', -1, 0xd85aa0)], 'paper2', 0xf0c070);
  iw('z', 4, -43.8, -18.2, H, [door('kitDoor', 'z', 4, -22, H, null, 'Kitchen door'), door('utilDoor', 'z', 4, -38, H, null, 'Utility door')], 'paper2', 0xf0c070);
  iw('x', -30.2, -13.8, -4.2, H, [door('livParty', 'x', -30.2, -9, H, null, 'Door')], 'paper3', 0xb8d8f0);
  iw('x', -30.2, 4.2, 13.8, H, [door('kitUtil', 'x', -30.2, 9, H, null, 'Door')], 'paper1', 0xc8e8a8);
  iw('x', -36.2, -4, 4, H, [door('basement', 'x', -36.2, 2, H, 'red', 'Basement door', -1, 0x4a2a2a)], 'paper2', 0xf0c070);
  iw('z', 0.8, -43.8, -36.2, H, [], 'block', 0x8a8070); iw('z', 3, -43.8, -36.2, H, [], 'block', 0x8a8070);
  // the giant wardrobe shoved in front of the basement door (push power knocks it over)
  L.act3.blocker = { x0: 1.0, y0: H, z0: -35.95, x1: 3.0, y1: H + 2.7, z1: -34.95 };
  // hall: crooked stairs up, clock, portraits, rug
  stairs(-2, 0, -24, -1, H, 0x7a4a2a, 'wood');
  detail(-3.6, H + 0.005, -35.6, 3.6, H + 0.02, -19, 'carpet', 0xa83a3a);
  L.decor.push({ t: 'clock', x: -3.75, y: H + 1.9, z: -33, ry: Math.PI / 2, tall: true });
  L.decor.push({ t: 'portrait', x: 3.78, y: H + 2, z: -27, ry: -Math.PI / 2 }); L.decor.push({ t: 'portrait', x: 3.78, y: H + 2, z: -32, ry: -Math.PI / 2 });
  L.decor.push({ t: 'coatrack', x: -3.4, y: H, z: -19 });
  lamp('hall', 0, H + 2.85, -28, 0xffe1b0);
  poi('hall', 1.5, H, -33, 2);
  // living room: the Supermarket Fear door on the west wall
  box(-12.6, H, -20, -8.6, H + 0.45, -19, 'fabric', 0x3a7ac0); box(-12.6, H + 0.45, -19.2, -8.6, H + 1.15, -18.8, 'fabric', 0x2f6aa8);
  box(-11, H, -25, -9.4, H + 0.42, -23.8, 'wood', 0x7a4a2a); item('vase1', 'vase', -10.2, H + 0.42, -24.4);
  L.decor.push({ t: 'tvscreen', x: -10.5, y: H + 1.05, z: -29.6, ry: 0 }); box(-11.5, H, -29.9, -9.5, H + 0.5, -29.3, 'wood', 0x4a3a2c);
  L.decor.push({ t: 'standlamp', x: -5, y: H, z: -19.2 });
  L.decor.push({ t: 'feardoor', x: -13.79, y: H, z: -26.5, ry: Math.PI / 2, c: 0xe03a3a, sym: 'cart' });
  gad({ id: 'fearMarket', kind: 'fear', zone: 'market', power: 'invis', name: 'Fear Door: Supermarket', x: -13.45, y: H + 1.1, z: -26.5, hx: 0.3, hy: 1.1, hz: 0.75 });
  hide('livWardrobe', -5, H, -28.8, '-x', 0x6a3a8a);
  lamp('living', -9, H + 2.85, -24, 0xffd59a);
  poi('living', -8, H, -22, 2);
  // kitchen: where he spends his time
  box(4.4, H, -19.4, 9, H + 0.9, -18.4, 'counter', 0xf0e0b0); box(10.6, H, -19.4, 13.6, H + 0.9, -18.4, 'counter', 0xf0e0b0);
  box(12.6, H, -23, 13.6, H + 0.92, -21.8, 'metal', 0x2a2c2f); L.decor.push({ t: 'hood', x: 13.2, y: H + 1.9, z: -22.4 });
  box(12.6, H, -27, 13.6, H + 2, -25.8, 'metal', 0xf0f0e8);
  table(8, H, -25, 0xd0a060, 1.3, 0.6);
  item('apple1', 'apple', 7.5, H + 0.86, -25); item('plate1', 'plate', 8.6, H + 0.86, -24.8); item('can2', 'can', 6, H + 0.9, -18.9);
  hide('pantry', 4.7, H, -28.6, '+x', 0x8a5a2a);
  lamp('kitchen', 9, H + 2.85, -24, 0xfff0d0);
  poi('stove', 11.9, H, -22.4, 3);
  // the birthday room: mannequins at a party that never ends
  table(-9, H, -37, 0xf0d0e0, 2.2, 0.7); detail(-11.2, H + 0.86, -37.7, -6.8, H + 0.88, -36.3, 'fabric', 0xffa0c8);
  L.decor.push({ t: 'cake', x: -9, y: H + 0.88, z: -37 });
  for (const [x, z, ry] of [[-11.6, -35.8, 2.6], [-6.4, -35.8, 3.6], [-11.6, -38.2, 0.5], [-6.4, -38.2, -0.5], [-9, -39.2, 0]]) L.decor.push({ t: 'mannequin', x, y: H, z, ry, hat: true });
  for (const [x, z] of [[-13, -32], [-5.2, -42.5], [-12.6, -43], [-5.4, -31.4]]) L.decor.push({ t: 'balloons', x, y: H, z });
  for (const [x, z, c] of [[-12.6, -41.6, 0x3a8ad8], [-11.8, -42.6, 0xe0c03a], [-6, -40.4, 0xd83a6a]]) L.decor.push({ t: 'present', x, y: H, z, c });
  L.decor.push({ t: 'banner', x: -9, y: H + 2.5, z: -43.78, ry: 0 });
  lamp('party', -9, H + 2.85, -37, 0xff9ad0);
  L.lights[L.lights.length - 1].pulse = true;
  poi('party', -9, H, -33.2, 2, 'stare');
  // utility room: washing machine, crates, a locker
  for (const x of [12.4, 13.4]) { box(x - 0.45, H, -43.6, x + 0.45, H + 0.9, -42.8, 'metal', 0xe8e8e0); detail(x - 0.25, H + 0.35, -42.82, x + 0.25, H + 0.75, -42.8, 'glass', 0x7d97a6); }
  shelves(4.8, H, -33, 'z', 0x7a6a4a); item('crate3', 'crate', 9, H, -34); item('paint1', 'paint', 6.5, H, -42);
  hide('utilLocker', 13.1, H, -33, '-x', 0x3a7a8a);
  lamp('utility', 9, H + 2.85, -37, 0xf2f2e0);
  poi('utility', 9, H, -36, 1);
  room(-14, H, -44, 14, H + 3, -18, 0.62);

  // ================================================================================== FIRST FLOOR (F1x), shoved 2 m west
  slab(K, -16, -44, 12, -18, F1x, [[-2, -30.4, 0, -24]], 'woodfloor', 0xa87a4a);
  box(12, F1x - 0.2, -44, 14, F1x, -18, 'roofflat', ROOFR);                     // ground-floor roof strip
  rail('z', 13.9, -44, -18, F1x);
  ext('x', -18.2, -16, 12, F1x, [win('kidW', 'x', -18.2, -10, F1x + 0.9, 1.6, 'Bedroom window', { breakable: false }), win('toyW', 'x', -18.2, 8, F1x + 0.9, 1.6, 'Toy-room window', { breakable: false })], 'siding', MUSTARD);
  ext('x', -44, -16, 12, F1x, [win('bathW', 'x', -44, -10, F1x + 1.1, 1.2, 'Bathroom window', { breakable: false, outside: -1 }), win('studyBW', 'x', -44, 8, F1x + 0.9, 1.6, 'Study window', { breakable: false, outside: -1 })], 'siding', MUSTARD);
  ext('z', -16, -44, -18, F1x, [win('kidSideW', 'z', -16, -24, F1x + 0.9, 1.4, 'Bedroom window', { breakable: false, outside: -1 })], 'siding', MUSTARD);
  ext('z', 11.8, -44, -18, F1x, [win('studySideW', 'z', 11.8, -38, F1x + 0.9, 1.4, 'Study window', { breakable: false })], 'siding', MUSTARD);
  for (let i = 0; i < 7; i++) detail(-16.06, F1x + 0.4 + i * 0.37, -43 + i * 3.1, -16, F1x + 0.62 + i * 0.37, -40.6 + i * 3.1, 'board', [0x9a6a3a, 0xb24a30, 0x3f93b8][i % 3]); // patched planks
  iw('z', -4.2, -43.8, -18.2, F1x, [door('kidDoor', 'z', -4.2, -22, F1x, null, 'Bedroom door', -1, 0x5aa0e0), door('bathDoor', 'z', -4.2, -37, F1x, null, 'Bathroom door')], 'paper3', 0xd8c0f0);
  iw('z', 4, -43.8, -18.2, F1x, [door('toyDoor', 'z', 4, -22, F1x, null, 'Toy-room door', 1, 0xe0c03a), door('study', 'z', 4, -37, F1x, 'power', 'Study electric door', 1)], 'paper3', 0xd8c0f0);
  iw('x', -30.2, -15.8, -4.2, F1x, [], 'paper1', 0xa8e0c8); iw('x', -30.2, 4.2, 11.8, F1x, [], 'paper1', 0xffd0a0);
  // stairwell: rails round the hole, then the next flight up beside it
  rail('x', -24.08, -2, 0, F1x); rail('z', -2.08, -30.4, -24, F1x); rail('z', -0.04, -30.4, -24, F1x);
  stairs(0, 2, -30.4, 1, F1x, 0x7a4a2a, 'wood');
  lamp('landing1', 0, F1x + 2.85, -36, 0xffe1b0);
  L.decor.push({ t: 'portrait', x: -3.98, y: F1x + 2, z: -32, ry: Math.PI / 2 });
  poi('landing1', -1, F1x, -34, 1);
  // kid's bedroom
  box(-15.6, F1x, -21.4, -13.4, F1x + 0.45, -18.6, 'wood', 0x5a8ad0); box(-15.6, F1x + 0.45, -21.4, -13.4, F1x + 0.62, -18.6, 'fabric', 0xffd040);
  L.decor.push({ t: 'mobile', x: -14.5, y: F1x + 2.9, z: -20 }); L.decor.push({ t: 'blocks', x: -9, y: F1x, z: -25 }); L.decor.push({ t: 'rockinghorse', x: -6.5, y: F1x, z: -20 });
  hide('kidWardrobe', -15.1, F1x, -28, '+x', 0x5aa0e0);
  item('ball2', 'ball', -10, F1x, -22);
  lamp('kidroom', -10, F1x + 2.85, -24, 0xffd8a0);
  poi('kidroom', -9, F1x, -26, 1);
  // bathroom
  box(-15.6, F1x, -43.6, -12.6, F1x + 0.6, -41.8, 'tile', 0xf4f4f0); detail(-15.4, F1x + 0.6, -43.4, -12.8, F1x + 0.62, -42, 'glass', 0x5ab4e0);
  box(-8, F1x, -43.6, -7.2, F1x + 0.5, -42.8, 'tile', 0xf4f4f0); box(-6, F1x, -43.7, -4.8, F1x + 0.9, -43.1, 'tile', 0xf4f4f0);
  detail(-16, F1x, -44, -4.2, F1x + 1.2, -43.8, 'tile', 0x8ad0e0);
  hide('showerCurtain', -14.5, F1x, -32, '+x', 0xd85aa0);
  lamp('bath', -10, F1x + 2.85, -37, 0xe8f4ff, false, 2.6);
  // toy room: the School Fear door
  L.decor.push({ t: 'feardoor', x: 11.79, y: F1x, z: -24, ry: -Math.PI / 2, c: 0xf0c020, sym: 'bell' });
  gad({ id: 'fearSchool', kind: 'fear', zone: 'school', power: 'push', name: 'Fear Door: School', x: 11.45, y: F1x + 1.1, z: -24, hx: 0.3, hy: 1.1, hz: 0.75 });
  L.decor.push({ t: 'blocks', x: 7, y: F1x, z: -27 }); L.decor.push({ t: 'present', x: 5.2, y: F1x, z: -19.2, c: 0x3ac0a0 });
  table(7.5, F1x, -20.4, 0xe07a3a, 1, 0.5); item('book1', 'book', 7.3, F1x + 0.86, -20.4);
  lamp('toyroom', 8, F1x + 2.85, -24, 0xfff0c0);
  poi('toyroom', 7, F1x, -25, 1);
  // study (electric lock, power from the control room's fuse box)
  table(8, F1x, -42.8, 0x4a3a2c, 1.4, 0.5); L.decor.push({ t: 'desklamp', x: 8.8, y: F1x + 0.86, z: -42.9 });
  shelves(11, F1x, -33, 'z', 0x6b4430); item('radio1', 'radio', 7.2, F1x + 0.86, -42.8); item('bottle2', 'bottle', 6, F1x, -32);
  L.decor.push({ t: 'corkboard', x: 4.22, y: F1x + 1.6, z: -40.5, ry: Math.PI / 2 });
  lamp('study', 8, F1x + 2.85, -37, 0xc8e0ff, true);
  room(-16, F1x, -44, 12, F1x + 3, -18, 0.6);

  // ================================================================================== SECOND FLOOR (F2x), shoved east and back
  slab(K, -12, -46, 16, -20, F2x, [[0, -30.4, 2, -24]], 'woodfloor', 0x8a5a3a);
  box(-16, F2x - 0.2, -44, -12, F2x, -18, 'roofflat', ROOFB); box(-12, F2x - 0.2, -20, 12, F2x, -18, 'roofflat', ROOFB);  // first-floor roof strips
  rail('z', -16.04, -44, -18, F2x); rail('x', -18.04, -16, 12, F2x);
  ext('x', -20.2, -12, 16, F2x, [win('galleryW', 'x', -20.2, -8, F2x + 0.9, 1.6, 'Gallery window', { breakable: false }), win('musicW', 'x', -20.2, 10, F2x + 0.9, 1.6, 'Music-room window', { breakable: false })], 'brick', BRICKR);
  ext('x', -46, -12, 16, F2x, [win('bedBW', 'x', -46, 10, F2x + 0.9, 1.6, 'Bedroom window', { breakable: false, outside: -1 })], 'brick', BRICKR);
  ext('z', -12, -46, -20, F2x, [win('gallerySideW', 'z', -12, -26, F2x + 0.9, 1.4, 'Gallery window', { breakable: false, outside: -1 })], 'brick', BRICKR);
  ext('z', 15.8, -46, -20, F2x, [win('musicSideW', 'z', 15.8, -26, F2x + 0.9, 1.4, 'Music-room window', { breakable: false }), win('bedSideW', 'z', 15.8, -39, F2x + 0.9, 1.4, 'Bedroom window', { breakable: false })], 'brick', BRICKR);
  iw('z', -4.2, -45.8, -20.2, F2x, [door('galleryDoor', 'z', -4.2, -26, F2x, null, 'Gallery door'), door('eyeDoor', 'z', -4.2, -35, F2x, null, 'Door with an eye painted on it', -1, 0x8a1f2a)], 'paper2', 0x9ad0f0);
  iw('z', 4, -45.8, -20.2, F2x, [door('musicDoor', 'z', 4, -26, F2x, null, 'Music-room door'), door('bedDoor', 'z', 4, -39, F2x, null, 'Bedroom door')], 'paper2', 0x9ad0f0);
  iw('x', -32.2, -11.8, -4.2, F2x, [], 'paper3', 0xf0b0b0); iw('x', -32.2, 4.2, 15.8, F2x, [], 'paper1', 0xf0e0a0);
  rail('x', -30.48, 0, 2, F2x); rail('z', 2, -30.4, -24.6, F2x); rail('z', -0.04, -30.4, -24.6, F2x);
  stairs(-2, 0, -24, -1, F2x, 0x7a4a2a, 'wood');
  lamp('landing2', 0, F2x + 2.85, -38, 0xffe1b0);
  poi('landing2', 1, F2x, -40, 1);
  // gallery: portraits of him everywhere, statues
  for (const z of [-22, -25, -28]) L.decor.push({ t: 'portrait', x: -11.78, y: F2x + 2, z, ry: Math.PI / 2 });
  for (const x of [-10, -6.4]) { box(x - 0.35, F2x, -31.4, x + 0.35, F2x + 0.9, -30.7, 'block', 0xe8e0d0); L.decor.push({ t: 'mannequin', x, y: F2x + 0.9, z: -31, ry: 0 }); }
  item('vase2', 'vase', -8, F2x, -22);
  lamp('gallery', -8, F2x + 2.85, -26, 0xffe0b0);
  poi('gallery', -8, F2x, -25, 2);
  // the Eye hall: a giant eye watches the whole room, the fuse waits at its feet
  detail(-11.8, F2x + 0.005, -45.8, -4.4, F2x + 0.02, -32.4, 'carpet', 0x5a1a2a);
  box(-8.5, F2x, -44.8, -7.5, F2x + 0.9, -43.8, 'block', 0x2a2a30);
  item('fuse', 'fuse', -8, F2x + 0.9, -44.3, 'Fuse');
  L.act3.eye = { box: makeBox(-12, F2x - 0.1, -46, -4.2, F2x + 3, -32.2), x: -8, y: F2x + 1.9, z: -45.4, back: { x: -2.6, y: F2x, z: -35, yaw: Math.PI / 2 } };
  lamp('eyehall', -8, F2x + 2.85, -40, 0xff5040, false, 2.4);
  // music room: piano and gramophone
  box(12.6, F2x, -23.6, 15.4, F2x + 1, -21.4, 'wood', 0x1d1d22); box(12.6, F2x + 1, -23.6, 13.4, F2x + 1.4, -21.4, 'wood', 0x1d1d22);
  detail(13.4, F2x + 1, -23.4, 13.5, F2x + 1.02, -21.6, 'trim', 0xf8f8f0);
  box(6, F2x, -21, 6.8, F2x + 0.8, -20.4, 'wood', 0x5a3a26); L.decor.push({ t: 'pots', x: 6.4, y: F2x + 0.8, z: -20.7 });
  lamp('music', 10, F2x + 2.85, -26, 0xffd0a0);
  poi('music', 9, F2x, -27, 2);
  // his bedroom
  box(10.5, F2x, -45.6, 14.5, F2x + 0.5, -41.4, 'wood', 0x4a2e1e); box(10.5, F2x + 0.5, -45.6, 14.5, F2x + 0.75, -41.4, 'fabric', 0x3a5a2a);
  hide('bedWardrobe', 5, F2x, -44.8, '+z', 0x4a2e1e);
  L.decor.push({ t: 'rockingchair', x: 7, y: F2x, z: -35, ry: 0.4 });
  lamp('bedroom', 10, F2x + 2.85, -39, 0xffd2a0);
  poi('bedroom', 9, F2x, -38, 1);
  room(-12, F2x, -46, 16, F2x + 3, -20, 0.6);
  L.lightZones.push({ box: makeBox(-12, F2x, -46, -4.2, F2x + 3, -32.2), level: 0.35 });

  // ================================================================================== THIRD FLOOR (F3x) + the engine hall
  slab(K, -14, -44, 10, -20, F3x, [[-2, -30.4, 0, -24]], 'woodfloor', 0x9a7048);
  // second-floor roof: the east terrace (to the Depot) and a back strip
  box(10, F3x - 0.2, -46, 16, F3x, -20, 'roofflat', ROOFB); box(-12, F3x - 0.2, -46, 10, F3x, -44, 'roofflat', ROOFB);
  rail('z', 15.92, -46, -33.2, F3x); rail('z', 15.92, -24.8, -20, F3x); rail('x', -20.08, 10, 16, F3x); rail('x', -46, -12, 16, F3x); rail('z', -12.08, -46, -44, F3x);
  // depot platform and shed
  box(16, F3x - 0.2, -33, 19.6, F3x, -25, 'concrete', 0xb8b0a0);
  rail('x', -25.08, 16, 19.6, F3x); rail('x', -33, 16, 19.6, F3x);
  box(19.6, F3x, -33, 19.72, F3x + 2.6, -25, null, 0, { vis: false, op: false });
  for (const [x, z] of [[16.1, -32.9], [16.1, -25.1]]) box(x - 0.1, F3x, z - 0.1, x + 0.1, F3x + 2.8, z + 0.1, 'trim', TRIM);
  detail(15.8, F3x + 2.8, -33.4, 19.9, F3x + 3, -24.6, 'roofflat', ROOFR);
  L.act3.signs.push({ x: 17.8, y: F3x + 3.4, z: -24.7, ry: 0, text: 'DEPOT' });
  detail(16.2, F3x + 0.002, -33, 19.5, F3x + 0.012, -32.8, 'paint', 0xffd040); detail(19.3, F3x + 0.002, -33, 19.5, F3x + 0.012, -25, 'paint', 0xffd040);
  gad({ id: 'callDepot', kind: 'tramcall', station: 'depot', name: 'the Depot', x: 17, y: F3x + 1.2, z: -25.5, hx: 0.25, hy: 0.3, hz: 0.25 });
  box(16.85, F3x, -25.3, 17.15, F3x + 0.95, -25.15, 'metal', 0xd8b030);
  lamp('depot', 17.8, F3x + 2.6, -29, 0xffe0a0, false, 3);
  poi('depot', 17.5, F3x, -29, 1, 'stare');
  // outside walls (the engine hall's corner rises to 18.8)
  const EH = 6;
  ext('x', -20.2, -14, -4, F3x, [win('engineW', 'x', -20.2, -9, F3x + 3.6, 2, 'Control-room window', { breakable: false, h: 1.4 })], 'siding', MINT, EH);
  ext('x', -20.2, -4, 10, F3x, [win('clockW', 'x', -20.2, 7, F3x + 0.9, 1.6, 'Window', { breakable: false })], 'siding', MINT);
  ext('x', -44, -14, 10, F3x, [win('darkW', 'x', -44, -9, F3x + 0.9, 1.4, 'Window', { breakable: false, outside: -1, boards: true, glass: false }), win('clock2W', 'x', -44, 7, F3x + 0.9, 1.6, 'Window', { breakable: false, outside: -1 })], 'siding', MINT);
  ext('z', -14, -30, -20, F3x, [], 'siding', MINT, EH);
  ext('z', -14, -44, -30, F3x, [], 'siding', MINT);
  ext('z', 9.8, -44, -20, F3x, [[-29, 1.6, F3x, F3x + 2.2]], 'siding', MINT);
  L.decor.push({ t: 'udoor', x: 9.9, y: F3x, z: -29, ry: -Math.PI / 2 });
  iw('z', -4.2, -29.8, -20.2, F3x, [[-25, 1.6, F3x, F3x + 2.2]], 'panel', 0x8a6a4a); box(-4.2, F3x + 3, -30, -4, F3x + EH, -20, 'panel', 0x8a6a4a);
  iw('x', -30.2, -13.8, -4, F3x, [], 'panel', 0x8a6a4a); box(-14, F3x + 3, -30.2, -4, F3x + EH, -30, 'panel', 0x8a6a4a);
  iw('z', -4.2, -43.8, -30.2, F3x, [door('darkDoor', 'z', -4.2, -37, F3x, null, 'Door', -1, 0x5a3a8a)], 'paper2', 0x6a5a9a);
  iw('z', 4, -43.8, -20.2, F3x, [door('depotHall', 'z', 4, -25, F3x, null, 'Door'), door('clockDoor', 'z', 4, -37, F3x, null, 'Clock-room door')], 'paper1', 0xd0f0c0);
  iw('x', -30.2, 4.2, 9.8, F3x, [], 'paper1', 0xd0f0c0);
  rail('x', -24.08, -2, 0, F3x); rail('z', -2.08, -30.4, -24, F3x); rail('z', 0, -30.4, -24, F3x);
  stairs(0, 2, -30.4, -1, F3x, 0x7a4a2a, 'wood');
  lamp('landing3', 0, F3x + 2.85, -40, 0xffe1b0);
  poi('landing3', -1, F3x, -38, 1);
  // engine hall: pipes and gears on the walls; the control room stands on a 2.3 m ledge
  const LEDGE = F3x + 2.3;
  box(-14, F3x, -30, -8.6, LEDGE, -20, 'block', 0x6a7a7a);
  detail(-8.62, LEDGE - 0.15, -30, -8.58, LEDGE, -20, 'paint', 0xffd040);
  for (let z = -29.5; z < -20.2; z += 1) detail(-8.62, F3x + 0.2, z, -8.58, LEDGE - 0.3, z + 0.12, 'paint', 0x3a3a3a);
  box(-14, F3x + EH - 0.2, -30.2, -4, F3x + EH, -20, 'plaster', 0xd8d0c0);              // its high ceiling
  for (const [x, y, z] of [[-6, F3x + 3.5, -20.25], [-5, F3x + 4.6, -20.25], [-4.6, F3x + 2.2, -29.75]]) L.decor.push({ t: 'gear', x, y, z, ry: 0 });
  for (const y of [F3x + 4.2, F3x + 4.8]) detail(-8.4, y, -29.9, -4.4, y + 0.18, -29.72, 'metal', 0x8e5c42);
  detail(-4.38, F3x + 0.3, -29.8, -4.22, F3x + 5.6, -29.64, 'metal', 0x8e5c42);
  // control room on the ledge: fuse box, lever, red button, a map of the line
  box(-13.2, LEDGE, -21.8, -11.8, LEDGE + 0.9, -20.6, 'metal', 0x4a5a6a); box(-13.2, LEDGE, -29.4, -11.8, LEDGE + 0.9, -28.2, 'metal', 0x4a5a6a);
  gad({ id: 'lever', kind: 'lever', x: -12.5, y: LEDGE + 1.15, z: -21.2, hx: 0.3, hy: 0.3, hz: 0.3 });
  gad({ id: 'button', kind: 'button', x: -12.5, y: LEDGE + 1.0, z: -28.8, hx: 0.3, hy: 0.2, hz: 0.3 });
  L.fusebox = { x: -13.6, y: LEDGE + 1.3, z: -25 };
  L.decor.push({ t: 'tramMap', x: -13.79, y: LEDGE + 1.1, z: -22.8, ry: Math.PI / 2 });
  lamp('control', -11, F3x + EH - 0.3, -25, 0x9fd8ff, true, 3);
  lamp('engine', -6, F3x + EH - 0.3, -25, 0xffc890, false, 3);
  // the dark bedroom with the Closet Fear door
  box(-12, F3x, -43.6, -9, F3x + 0.5, -41, 'wood', 0x2a2a3a); box(-12, F3x + 0.5, -43.6, -9, F3x + 0.7, -41, 'fabric', 0x4a3a6a);
  hide('darkWardrobe', -5, F3x, -42.8, '+z', 0x3a2a4a);
  L.decor.push({ t: 'feardoor', x: -13.79, y: F3x, z: -37, ry: Math.PI / 2, c: 0x8a4ad8, sym: 'bulb' });
  gad({ id: 'fearCloset', kind: 'fear', zone: 'closet', power: 'double', name: 'Fear Door: Closet', x: -13.45, y: F3x + 1.1, z: -37, hx: 0.3, hy: 1.1, hz: 0.75 });
  lamp('darkroom', -9, F3x + 2.85, -37, 0xb090ff, false, 2.2);
  L.lights[L.lights.length - 1].flicker = 1;
  // depot hall (the upside-down door) and the clock room
  L.act3.signs.push({ x: 9.7, y: F3x + 2.6, z: -29, ry: -Math.PI / 2, text: 'TRAM' });
  item('can3', 'can', 6, F3x, -22);
  lamp('depothall', 7, F3x + 2.85, -25, 0xfff0c0);
  poi('depothall', 7, F3x, -26, 1);
  L.decor.push({ t: 'clock', x: 9.58, y: F3x + 1.9, z: -37, ry: -Math.PI / 2, tall: true });
  L.decor.push({ t: 'clock', x: 4.22, y: F3x + 1.9, z: -34, ry: Math.PI / 2, tall: true });
  L.decor.push({ t: 'gear', x: 7, y: F3x + 2.2, z: -43.75, ry: 0 });
  lamp('clockroom', 7, F3x + 2.85, -37, 0xffd8a0);
  poi('clockroom', 7, F3x, -38, 1);
  room(-14, F3x, -44, 10, F3x + 3, -20, 0.55);
  room(-14, F3x, -30, -4, F3x + EH, -20, 0.55);

  // ================================================================================== ROOF + ATTIC (F4x)
  slab(K, -14, -44, 10, -20, F4x, [[-14, -30.2, -4, -20], [0, -36.8, 2, -30.4]], 'roofflat', ROOFR);
  rail('x', -20.08, -4, 10, F4x); rail('z', 9.92, -44, -20, F4x); rail('z', -14.08, -44, -30.2, F4x); rail('x', -44, -14, 0, F4x); rail('x', -44, 2, 10, F4x);
  const aw = (axis, t, a, b, ops = []) => wall(axis, t, a, b, F4x, 2.8, ops, 'board', PURPLE);
  aw('x', -30.2, -3, 9, [door('atticFront', 'x', -30.2, 6, F4x, null, 'Roof door')]);
  aw('x', -44, -3, 9, [door('atticBack', 'x', -44, 1, F4x, null, 'Door to the windmill bridge', -1)]);
  aw('z', -3, -44, -30.2); aw('z', 8.8, -44, -30.2);
  box(-3, F4x + 2.8, -44, 9, F4x + 3, -30.2, 'board', 0x5a4a6a);
  L.roofs.push({ x0: -3.5, x1: 9.5, z0: -44.6, z1: -29.6, y: F4x + 3, h: 3.2, ridge: 'z', tint: ROOFB, gable: PURPLE });
  rail('x', -30.48, 0, 2, F4x); rail('z', -0.08, -36.8, -30.4, F4x); rail('z', 2, -36.8, -30.4, F4x);
  for (const [x, z] of [[5, -40], [7, -33], [-1.5, -41]]) box(x - 0.6, F4x, z - 0.5, x + 0.6, F4x + 0.8, z + 0.5, 'cardboard', 0xb08a5c);
  L.decor.push({ t: 'mannequin', x: 7.5, y: F4x, z: -42.5, ry: 2.4 });
  hide('atticTrunk', 7.9, F4x, -37.5, '-x', 0x6b5136);
  lamp('attic', 3, F4x + 2.6, -37, 0xffd9a0, false, 2.4);
  poi('attic', 4, F4x, -38.5, 1);
  room(-3, F4x, -44, 9, F4x + 2.8, -30.2, 0.4);
  // the windmill on the north-west corner of the roof
  box(-12.5, F4x, -43.5, -9.5, F4x + 7, -40.5, 'board', 0xf0e0c0);
  L.roofs.push({ x0: -13, x1: -9, z0: -44, z1: -40, y: F4x + 7, h: 1.6, spire: true, tint: ROOFR, gable: 0xf0e0c0 });
  L.act3.windmill = { x: -11, y: F4x + 6, z: -40.3 };
  // chimney stacks leaning every which way
  box(6, F4x, -24, 7.2, F4x + 3.5, -22.8, 'brick', 0x8a3a2a); box(6.2, F4x + 3.5, -23.8, 7.6, F4x + 4.2, -22.4, 'brick', 0x7a2a22);
  // bridge + stairs down to the Windmill station platform
  box(0, F4x - 0.2, -45.2, 2, F4x, -44, 'woodfloor', 0x7a5a3a);
  stairs(0, 2, -51.6, 1, F3x, 0x6a5a4a, 'wood');
  rail('z', -0.08, -45.2, -44, F4x); rail('z', 2, -45.2, -44, F4x);
  box(-3, F3x - 0.2, -55.6, 3, F3x, -51.6, 'concrete', 0xb8b0a0);
  rail('z', -3.08, -55.6, -51.6, F3x); rail('z', 3, -55.6, -51.6, F3x); rail('x', -51.68, -3, 0, F3x); rail('x', -51.68, 2, 3, F3x);
  box(-3, F3x, -55.72, 3, F3x + 2.6, -55.6, null, 0, { vis: false, op: false });
  for (const [x, z] of [[-2.8, -55.4], [2.8, -55.4], [-2.8, -51.8], [2.8, -51.8], [1, -48.5]]) box(x - 0.2, H, z - 0.2, x + 0.2, F3x - 0.2, z + 0.2, 'metal', 0x3a4a5a);
  detail(-3.2, F3x + 2.8, -55.8, 3.2, F3x + 3, -51.4, 'roofflat', ROOFB);
  for (const x of [-2.9, 2.9]) box(x - 0.1, F3x, -51.8, x + 0.1, F3x + 2.8, -51.6, 'trim', TRIM);
  L.act3.signs.push({ x: 0, y: F3x + 3.4, z: -51.5, ry: Math.PI, text: 'WINDMILL' });
  gad({ id: 'callWindmill', kind: 'tramcall', station: 'windmill', name: 'the Windmill', x: 2.5, y: F3x + 1.2, z: -52.1, hx: 0.25, hy: 0.3, hz: 0.25 });
  box(2.35, F3x, -52.25, 2.65, F3x + 0.95, -51.95, 'metal', 0xd8b030);
  lamp('windmill', 0, F3x + 2.6, -53.6, 0xffe0a0, false, 2.6);
  poi('windmill', 0, F3x, -53, 1, 'stare');

  // ================================================================================== THE WATER ROOM (tram only)
  const WX0 = -33, WX1 = -22.6, WZ0 = -39, WZ1 = -27;
  box(-25.4, F3x - 0.2, WZ0, WX1, F3x, WZ1, 'concrete', 0x8a9aa0);
  box(WX0, F3x - 0.8, WZ0, -25.4, F3x - 0.4, WZ1, 'tile', 0x4a8aa0);
  detail(WX0 + 0.2, F3x - 0.12, WZ0 + 0.2, -25.42, F3x - 0.1, WZ1 - 0.2, 'glass', 0x3aa0d8);   // the flood
  const ww = (axis, t, a, b, ops = []) => wall(axis, t, a, b, F3x - 0.4, 3.4, ops, 'block', 0x5a8a9a);
  ww('z', WX0, WZ0, WZ1); ww('x', WZ0 - 0.2, WX0, WX1, [win('waterNW', 'x', WZ0 - 0.2, -29, F3x + 0.8, 1.4, 'Window', { breakable: false, outside: -1 })]);
  ww('x', WZ1, WX0, WX1, [win('waterSW', 'x', WZ1, -29, F3x + 0.8, 1.4, 'Window', { breakable: false })]);
  ww('z', WX1 - 0.2, WZ0, WZ1, [[-33, 6, F3x - 0.4, F3x + 2.6]]);
  box(WX1 - 0.12, F3x, -36, WX1, F3x + 2.6, -30, null, 0, { vis: false, op: false });
  box(WX0, F3x + 3, WZ0 - 0.2, WX1, F3x + 3.2, WZ1 + 0.2, 'roofflat', ROOFB);
  for (const [x, z] of [[WX0 + 0.3, WZ0 + 0.3], [WX0 + 0.3, WZ1 - 0.3], [WX1 - 0.4, WZ0 + 0.3], [WX1 - 0.4, WZ1 - 0.3], [-28, -33]]) box(x - 0.25, H, z - 0.25, x + 0.25, F3x - 0.8, z + 0.25, 'wood', 0x5a4030);
  box(-30, F3x - 0.4, -34, -28, F3x + 0.3, -32, 'block', 0x8a8a7a);
  item('redkey', 'redkey', -29, F3x + 0.3, -33, 'Red key');
  for (const [x, z] of [[-31.5, -29], [-27, -37.5], [-32, -37]]) detail(x - 0.4, F3x - 0.15, z - 0.4, x + 0.4, F3x + 0.25, z + 0.4, 'crate', 0xc89a62);
  L.act3.signs.push({ x: -22.7, y: F3x + 2.9, z: -33, ry: -Math.PI / 2, text: 'WATER' });
  gad({ id: 'callWater', kind: 'tramcall', station: 'water', name: 'the Water Room', x: -23.4, y: F3x + 1.2, z: -29.6, hx: 0.25, hy: 0.3, hz: 0.25 });
  box(-23.55, F3x, -29.75, -23.25, F3x + 0.95, -29.45, 'metal', 0xd8b030);
  lamp('water', -28, F3x + 2.7, -33, 0x7ad0ff, false, 3);
  room(WX0, F3x - 0.5, WZ0, WX1, F3x + 3, WZ1, 0.45);

  // ================================================================================== FEAR ROOMS (far away: dreams)
  const Z = L.act3.zones;
  const shell = (x0, z0, x1, z1, h, wallM, wallC, floorM, floorC) => {
    detail(x0, -0.06, z0, x1, 0.002, z1, floorM, floorC);
    box(x0 - 0.3, 0, z0 - 0.3, x1 + 0.3, h, z0, wallM, wallC); box(x0 - 0.3, 0, z1, x1 + 0.3, h, z1 + 0.3, wallM, wallC);
    box(x0 - 0.3, 0, z0, x0, h, z1, wallM, wallC); box(x1, 0, z0, x1 + 0.3, h, z1, wallM, wallC);
    box(x0 - 0.3, h, z0 - 0.3, x1 + 0.3, h + 0.3, z1 + 0.3, 'plaster', 0xe8e8e0);
  };
  const leave = (zone, x, y, z, ry) => {
    L.decor.push({ t: 'feardoor', x, y, z, ry, c: 0xf0f0f0, sym: 'exit' });
    const s = Math.round(Math.sin(ry)), c = Math.round(Math.cos(ry));
    gad({ id: 'leave_' + zone, kind: 'leave', zone, x: x + s * 0.35, y: y + 1.1, z: z + c * 0.35, hx: c ? 0.75 : 0.3, hy: 1.1, hz: c ? 0.3 : 0.75 });
  };
  // ---- SUPERMARKET (fear of being seen): 5 groceries into the trolley, mannequins in the aisles
  {
    const X0 = 150, X1 = 174, Z0 = -36, Z1 = -10;
    shell(X0, Z0, X1, Z1, 5, 'paint', 0xe8f0e8, 'tile', 0xf0f0f0);
    Z.market = { box: makeBox(X0, -1, Z0, X1, 6, Z1), start: { x: 162, y: 0, z: -11.4, yaw: 0 }, back: { x: -12.3, y: H, z: -26.5, yaw: -Math.PI / 2 },
      intro: 'THE SUPERMARKET. Find the 5 groceries. The mannequins move when you look away — crouch and they cannot see you.', fog: [0xe6efe6, 16, 70] };
    leave('market', 152, 0, Z1 - 0.01, Math.PI);
    box(156, 0, -13.6, 160, 1, -12.8, 'counter', 0xd04040); detail(156.2, 1, -13.5, 157.4, 1.3, -12.9, 'metal', 0x3a3a3a);
    gad({ id: 'checkout', kind: 'checkout', x: 158.6, y: 1.25, z: -13.2, hx: 0.6, hy: 0.35, hz: 0.5 });
    L.decor.push({ t: 'cart', x: 164.5, y: 0, z: -12.4, ry: 0.3 });
    const cols = [0xe04040, 0x40a0e0, 0xf0c030, 0x50c060, 0xe080c0, 0xf08a30];
    for (const sx of [155, 159, 165, 169]) {
      box(sx - 0.5, 0, -30, sx + 0.5, 1.6, -16, 'metal', 0xd8d8d0);
      for (let z = -29.6; z < -16.2; z += 0.7) for (const y of [0.3, 0.85, 1.35]) for (const sd of [-1, 1]) detail(sx + sd * 0.5 - (sd > 0 ? 0 : 0.03), y, z, sx + sd * 0.5 + (sd > 0 ? 0.03 : 0), y + 0.35, z + 0.5, 'paint', cols[((z * 3 + y * 7 + sx) | 0) % cols.length]);
      detail(sx - 0.55, 2.4, -23.3, sx + 0.55, 2.9, -22.7, 'emissive', 0xfff0a0);
    }
    for (let x = 151; x < 173; x += 3) box(x, 0, Z0 + 0.1, x + 2.6, 0.9, Z0 + 1.2, 'metal', 0xe8f4ff);
    for (let x = 151; x < 173; x += 3) detail(x + 0.1, 0.9, Z0 + 0.2, x + 2.5, 0.92, Z0 + 1.1, 'glass', 0x9ad0f0);
    table(171.5, 0, -22, 0x8a6a48, 1.1, 0.6);
    for (const x of [153, 161, 167, 171]) for (const z of [-14, -22, -32]) detail(x - 1.2, 4.9, z - 0.15, x + 1.2, 4.98, z + 0.15, 'emissive', 0xf8fff8);
    const groc = [['g1', 'can', 155, 1.6, -19, 'Tin of beans'], ['g2', 'bottle', 162, 0.9, -35.3, 'Bottle of milk'], ['g3', 'apple', 171.5, 0.86, -22, 'Red apple'], ['g4', 'book', 165, 1.6, -27, 'Box of cereal'], ['g5', 'paint', 151, 0, -33.5, 'Tin of paint']];
    for (const [id, type, x, y, z, name] of groc) { item(id, type, x, y, z, name); L.act3.groceries.push(id); }
    for (const [id, x, z, yaw] of [['mq1', 157, -24, 0], ['mq2', 162, -29, 0], ['mq3', 167, -18, Math.PI], ['mq4', 171.5, -31, 0], ['mq5', 152.2, -21, Math.PI / 2]]) L.act3.mannequins.push({ id, zone: 'market', x, y: 0, z, yaw, look: 'shop' });
    lamp('market1', 157, 4.6, -20, 0xf4fff4, false, 4); lamp('market2', 167, 4.6, -28, 0xf4fff4, false, 4);
    L.lightZones.push({ box: makeBox(X0, -1, Z0, X1, 6, Z1), level: 0.9 });
  }
  // ---- SCHOOL (fear of school): lockers, the bell, the giant mannequin in the gym
  {
    const X0 = 150, X1 = 176, Z0 = -106, Z1 = -60;
    shell(X0, Z0, X1, Z1, 4.2, 'paper1', 0xd8c890, 'woodfloor', 0xb08a5a);
    Z.school = { box: makeBox(X0, -1, Z0, X1, 6, Z1), start: { x: 161, y: 0, z: -61.6, yaw: 0 }, back: { x: 10.6, y: F1x, z: -24, yaw: Math.PI / 2 },
      intro: 'THE SCHOOL. Reach the bell at the end of the corridor. Hide in the lockers — the mannequins move when you look away.', fog: [0x9a8a70, 18, 60] };
    leave('school', 159, 0, Z1 - 0.01, Math.PI);
    const sw = (axis, t, a, b, ops = []) => wall(axis, t, a, b, 0, 4.2, ops, 'paper1', 0xc8b880);
    sw('z', 157.8, -90, -60, [[-67.5, 1.6, 0, 2.3], [-82.5, 1.6, 0, 2.3]]);
    sw('z', 164, -90, -60, [[-67.5, 1.6, 0, 2.3], [-82.5, 1.6, 0, 2.3]]);
    sw('x', -75.2, X0, 157.8); sw('x', -75.2, 164.2, X1);
    sw('x', -90.2, X0, X1, [[161, 3, 0, 3]]);
    for (const z of [-64.5, -71, -78, -86]) { hide('lockW' + z, 158.55, 0, z, '+x', 0x3a6ab0); hide('lockE' + z, 163.45, 0, z, '-x', 0xb03a3a); }
    gad({ id: 'bell', kind: 'bell', x: 158.75, y: 2.0, z: -89.7, hx: 0.4, hy: 0.4, hz: 0.3 });
    L.decor.push({ t: 'bell', x: 158.75, y: 2.0, z: -89.97 });
    // classrooms: desks and blackboards
    for (const [cx, cz] of [[154, -67.5], [154, -82.5], [170, -67.5], [170, -82.5]]) {
      for (let i = 0; i < 6; i++) { const dx = cx - 2.5 + (i % 3) * 2.5, dz = cz - 2 + ((i / 3) | 0) * 3; box(dx - 0.5, 0, dz - 0.35, dx + 0.5, 0.75, dz + 0.35, 'wood', 0xc89a62); }
      L.decor.push({ t: 'blackboard', x: cx, y: 1.2, z: cz - 7.3, ry: 0 });
    }
    // gym: the giant mannequin on its plinth
    detail(151, 0.003, -105, 175, 0.012, -91, 'woodfloor', 0xd8a860);
    box(161.8, 0, -99.2, 164.2, 0.6, -96.8, 'block', 0xe8e0d0);
    gad({ id: 'giant', kind: 'giant', x: 163, y: 2.6, z: -98, hx: 1.1, hy: 2.2, hz: 1.1 });
    L.act3.giant = { x: 163, y: 0.6, z: -98 };
    for (const x of [152, 174]) { box(x - 0.6, 0, -104, x + 0.6, 3.6, -103.6, 'metal', 0xe0e0d8); }
    for (const [id, x, z, yaw] of [['ms1', 161, -79, 0], ['ms2', 154, -70, Math.PI], ['ms3', 170, -84, 0], ['ms4', 156, -97, -Math.PI / 2]]) L.act3.mannequins.push({ id, zone: 'school', x, y: 0, z, yaw, look: 'school' });
    lamp('school1', 161, 3.9, -70, 0xfff0d0, false, 3); lamp('school2', 161, 3.9, -85, 0xfff0d0, false, 3); lamp('gym', 163, 3.9, -98, 0xfff0d0, false, 4);
    L.lightZones.push({ box: makeBox(X0, -1, Z0, X1, 6, Z1), level: 0.75 });
  }
  // ---- CLOSET (fear of the dark): climb the shelves to the light switch
  {
    const X0 = 200, X1 = 216, Z0 = -26, Z1 = -10;
    shell(X0, Z0, X1, Z1, 24, 'woodfloor', 0x6a4a3a, 'woodfloor', 0x4a3428);
    Z.closet = { box: makeBox(X0, -1, Z0, X1, 25, Z1), start: { x: 202.4, y: 0, z: -11.2, yaw: 0 }, back: { x: -12.4, y: F3x, z: -37, yaw: -Math.PI / 2 },
      intro: 'THE CLOSET. It is dark. Climb the giant shelves up to the light switch at the top.', fog: [0x06060c, 4, 26], dark: true };
    leave('closet', 201.5, 0, Z1 - 0.01, Math.PI);
    const plats = [[202, -16, 205, -14, 1], [206, -16, 209, -14, 2], [210, -16, 213, -13, 3], [210.5, -20, 214, -17.5, 4], [210, -24.5, 213, -21.5, 5],
      [205, -24.5, 208.5, -22, 6], [200.5, -24, 203.5, -21, 7], [200.5, -19.5, 203, -17, 8], [200.5, -15.5, 203, -12.2, 9], [204.5, -13, 207.5, -10.5, 10],
      [209, -13, 212, -10.5, 11], [213, -14, 215.8, -11, 12], [212.5, -18.5, 215.8, -15.5, 13], [206, -20, 211, -15.5, 14]];
    for (const [a, b, c, d, y] of plats) {
      box(a, y - 0.3, b, c, y, d, 'board', 0x8a6a4a);
      detail(a, y - 0.02, b - 0.02, c, y + 0.01, b + 0.04, 'emissive', 0x6a4aa0); detail(a, y - 0.02, d - 0.04, c, y + 0.01, d + 0.02, 'emissive', 0x6a4aa0);
      for (const [px, pz] of [[a + 0.1, b + 0.1], [c - 0.1, d - 0.1]]) detail(px - 0.06, 0, pz - 0.06, px + 0.06, y - 0.3, pz + 0.06, 'wood', 0x3a2a20);
    }
    box(208.2, 14, -18, 208.8, 15.6, -17.4, 'wood', 0x5a3a2a);
    gad({ id: 'switch', kind: 'switch', x: 208.5, y: 15.1, z: -17.2, hx: 0.3, hy: 0.35, hz: 0.25 });
    for (let i = 0; i < 12; i++) detail(201 + i * 1.2, 16 + (i % 3), -25.6, 201.6 + i * 1.2, 22, -25.4, 'fabric', [0x4a3a6a, 0x3a4a5a, 0x5a3a3a][i % 3]);
    box(212, 0, -25.5, 215.5, 0.6, -23, 'cardboard', 0x7a6a50); box(204, 0, -20, 206, 0.4, -18.5, 'fabric', 0x3a2a3a);
    L.act3.closetLight = { x: 208, y: 20, z: -18 };
    L.lightZones.push({ box: makeBox(X0, -1, Z0, X1, 25, Z1), level: 0.12 });
  }

  // ---- rules, rooms, his routine
  L.spawn = { x: -1.6, y: H, z: 15.4, yaw: Math.atan2(-1.6, 5.2) };
  L.exit = makeBox(-4.6, H - 0.15, 10.4, 4.6, H + 2.5, 17.6);
  L.safeZones.push(makeBox(-34.5, H - 0.2, 6, 34.5, 30, 23));
  L.entries = {
    frontDoor: { name: 'front door', kind: 'door', ref: 'front', x: 0, z: -17 },
    backDoor: { name: 'back door', kind: 'door', ref: 'back', x: 9, z: -45 },
    sideDoor: { name: 'side door', kind: 'door', ref: 'sideDoor', x: 15, z: -38 },
    livingWindow: { name: 'living-room window', kind: 'window', ref: 'livingW', x: -9, z: -17 },
    kitchenWindow: { name: 'kitchen window', kind: 'window', ref: 'kitchenW', x: 9, z: -17 },
    partyWindow: { name: 'birthday-room window', kind: 'window', ref: 'partyW', x: -9, z: -45 },
    sideWindow: { name: 'living-room side window', kind: 'window', ref: 'livingSideW', x: -15, z: -21.5 },
  };
  L.places = [['the basement', 0, 0, -36], ['the hall', 0, H, -28], ['the living room', -9, H, -24], ['the kitchen', 9, H, -24], ['the birthday room', -9, H, -37],
    ['the utility room', 9, H, -37], ['the bedroom', -10, F1x, -24], ['the bathroom', -10, F1x, -37], ['the toy room', 8, F1x, -24], ['the study', 8, F1x, -37],
    ['the gallery', -8, F2x, -26], ['the Eye hall', -8, F2x, -39], ['the music room', 10, F2x, -26], ['his bedroom', 10, F2x, -39], ['the engine hall', -9, F3x, -25],
    ['the dark bedroom', -9, F3x, -37], ['the tram hall', 7, F3x, -25], ['the clock room', 7, F3x, -37], ['the Depot', 17.8, F3x, -29], ['the attic', 3, F4x, -37],
    ['the Windmill station', 0, F3x, -53.6], ['the front yard', 0, H, -12], ['the back yard', 0, H, -55], ['the street', 0, H, 0]];
  mount('hallCam', -3.8, H + 2.8, -19, 0, -30, 'the hall');
  mount('porchCam', 2, H + 2.6, -18.5, 0, -10, 'the porch');
  mount('landingCam', 3.8, F2x + 2.7, -44, 0, -30, 'the second-floor landing');
  mount('terraceCam', 10.4, F3x + 2.6, -21, 16, -30, 'the terrace');
  mount('yardCam', 13.6, H + 2.6, -44.4, 5, -55, 'the back yard');
  L.navBounds = { x0: -34.2, z0: -70.2, x1: 34.2, z1: 22.2 }; L.reachBounds = L.navBounds;
  // models built from floor level sit on whichever floor they are on
  for (const d of L.decor) if (d.y >= H - 0.01) d.lift = [F4x, F3x, F2x, F1x, H].find(f => d.y >= f - 0.01);
  L.pois.sort((a, b) => (b.id === 'stove') - (a.id === 'stove'));
  L.keepLights = ['party', 'market1', 'school1', 'gym', 'water', 'control', 'depot', 'eyehall'];
  L.objective = w => act3Objective(w);
  return L;
}

export function buildMap(mission) {
  return mission === 1 ? buildCellar() : mission === 3 ? buildMansion() : mission === 4 ? buildAct3() : buildMulberry();
}
