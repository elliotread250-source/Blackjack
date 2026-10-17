// Levels 2 (The Cold Cellar) and 3 (Mulberry Close): reachability, locks, patrols, stairs, safety, saves, escape.
const assert = require('node:assert/strict');
const { buildLevel, MISSIONS } = require('../js/level.js');
const { World } = require('../js/world.js');
const { solveLevel } = require('../js/puzzle.js');
const { boxesOverlap } = require('../js/geom.js');
let count = 0;
const ok = (v, msg) => { assert(v, msg); count++; };
const STAIRS = {
  1: { top: { x: 10, y: 3.2, z: 1.2, yaw: 0 }, downTo: 0.3, upFrom: 3.15 },                 // hatch stairs, north = down
  2: { top: { x: 10.8, y: 3.2, z: -13.2, yaw: 0 }, downTo: 0.3, upFrom: 3.15 },             // garage -> basement
  3: { top: { x: 16.8, y: 3.2, z: -30.8, yaw: 0 }, downTo: 0.3, upFrom: 3.15 },             // mansion kitchen -> cellar
};
for (const mission of [1, 2, 3]) {
  const l = buildLevel(mission), name = MISSIONS[mission].name;
  ok(l.mission === mission && l.exit, name + ': map identity and exit');
  ok(l.boxes.length !== buildLevel(0).boxes.length, name + ': its own geometry');
  for (const id of ['basement', 'study']) ok(l.doors.some(d => d.id === id), name + ': has door ' + id);
  const solved = solveLevel(l);
  for (const id of [...l.targets, 'fuse', 'redkey']) ok(solved.have.has(id), name + ': ' + id + ' physically reachable');
  for (const disable of [['power'], ['item:redkey'], ['item:fuse']]) ok(!solveLevel(l, { disable }).have.has(l.targets[0]), name + ': cannot bypass ' + disable);
  if (mission === 1) ok(!solveLevel(l, { disable: ['break:laundryW'] }).have.has('fuse'), name + ': laundry needs its window broken first');
  if (mission === 3) for (const disable of [['boards:atticHatch'], ['item:crowbar']]) ok(!solveLevel(l, { disable }).have.has('fuse'), name + ': attic needs the hatch pried open (' + disable + ')');
  if (mission === 2) for (const disable of [['boards:storeHatch'], ['item:crowbar']]) ok(!solveLevel(l, { disable }).have.has('fuse'), name + ': storage needs the hatch pried open (' + disable + ')');

  let w = new World({ mission, seed: 7 });
  for (const p of w.pois) ok(w.path(w.ai.x, w.ai.y, w.ai.z, p.x, p.y, p.z)?.complete, name + ': patrol reaches ' + p.id);
  w.ai.update = () => {};
  w.step(1 / 60, {}); ok(!w.flags.won, name + ': no win at spawn');
  ok(!w.level.boxes.some(b => b.col && boxesOverlap(w.playerBox(), b, 0.005)), name + ': spawn has standing room');
  ok(w.isSafe(w.player.x, w.player.y, w.player.z), name + ': spawn is safe');
  // walk the stairs both ways with real 60 Hz physics
  Object.assign(w.player, STAIRS[mission].top);
  for (let i = 0; i < 200; i++) w.step(1 / 60, { mz: 1 });
  ok(w.player.y < STAIRS[mission].downTo, name + ': walks down to the basement (y=' + w.player.y.toFixed(2) + ')');
  w.player.yaw = Math.PI;
  for (let i = 0; i < 200; i++) w.step(1 / 60, { mz: 1 });
  ok(w.player.y > STAIRS[mission].upFrom, name + ': climbs back up (y=' + w.player.y.toFixed(2) + ')');
  // caught: wake at the spawn, keep the fuse in the world
  w.pickUp(w.propById.fuse); w.catchPlayer(); for (let i = 0; i < 170; i++) w.step(1 / 60, {});
  ok(!w.player.caught && !w.propById.fuse.gone, name + ': caught recovery keeps the fuse');
  const target = l.targets[0];
  w.pickUp(w.propById[target]); w.setPower(true);
  const saved = w.serialize(); w = new World({ mission: saved.mission }); ok(w.load(saved), name + ': save reloads');
  w.ai.update = () => {};
  ok(w.propById[target].gone && w.steps[target] !== undefined && w.flags.power, name + ': save keeps progress');
  Object.assign(w.player, { x: 0, y: 0, z: -15 }); w.step(1 / 60, {}); ok(!w.flags.won, name + ': no win away from the exit');
  Object.assign(w.player, l.spawn); w.flags.power = false; w.step(1 / 60, {}); ok(!w.flags.won, name + ': power required');
  w.setPower(true); w.step(1 / 60, {}); ok(w.flags.won, name + ': target + power + exit wins');
  ok(typeof w.objective() === 'string', name + ': objective text');
  console.log(name + ': passed');
}
// Mulberry Close: he reaches every part of his property, never your side, and you can walk out of your house.
{
  const w = new World({ mission: 2, seed: 3 });
  for (const [x, y, z] of [[-7.5, 0, -15.5], [-1.5, 0, -22.5], [7.5, 0, -20], [2.6, 3.2, -14.6], [-5, 3.2, -38], [8.5, 3.2, -14]]) ok(w.path(w.ai.x, w.ai.y, w.ai.z, x, y, z)?.complete, `Mulberry Close: he reaches ${x},${y},${z}`);
  ok(!w.path(w.ai.x, w.ai.y, w.ai.z, 0, 3.2, 14)?.complete, 'Mulberry Close: he cannot path into your house');
  w.ai.update = () => {};
  Object.assign(w.player, { x: 0, z: 14, yaw: 0 });
  for (let i = 0; i < 300; i++) w.step(1 / 60, { mz: 1 });
  ok(w.player.z < 9.5, 'Mulberry Close: player walks out of their front door (z=' + w.player.z.toFixed(2) + ')');
  ok(w.level.doors.some(d => d.id === 'home' && d.open), 'Mulberry Close: your front door from level 1');
}
// The Mansion: every floor connects for him, and the player can climb the grand stairs and the attic stairs.
{
  const w = new World({ mission: 3, seed: 4 });
  for (const [x, y, z] of [[6, 0, -35], [0, 3.2, -26], [13.5, 3.2, -37], [0, 6.4, -37], [12, 6.4, -25], [12, 9.6, -35], [-5, 3.2, -45], [11, 3.2, -53]]) ok(w.path(w.ai.x, w.ai.y, w.ai.z, x, y, z)?.complete, `Mansion: he reaches ${x},${y},${z}`);
  w.ai.update = () => {};
  Object.assign(w.player, { x: 0, y: 3.2, z: -26.4, yaw: 0 });
  for (let i = 0; i < 200; i++) w.step(1 / 60, { mz: 1 });
  ok(w.player.y > 6.3, 'Mansion: grand staircase reaches the gallery (y=' + w.player.y.toFixed(2) + ')');
  Object.assign(w.player, { x: 6.6, y: 6.4, z: -38.6, yaw: -Math.PI / 2 });
  for (let i = 0; i < 200; i++) w.step(1 / 60, { mz: 1 });
  ok(w.player.y > 9.5, 'Mansion: attic stairs reach the attic (y=' + w.player.y.toFixed(2) + ')');
  ok(w.level.boxes.length > 800, 'Mansion: it really is huge (' + w.level.boxes.length + ' boxes)');
}
// The Nightmare House (level 5): biggest map, gates that really need the powers, the Fear rooms,
// the tram and a full scripted playthrough with real physics where it matters.
{
  const { buildGrid, findNode, playerReach } = require('../js/nav.js');
  const { makeBox } = require('../js/geom.js');
  const DT = 1 / 60;
  const L5 = buildLevel(4), N = 'Nightmare House';
  // measured by interior volume and solid geometry, not raw box count (room dressing adds trim boxes)
  const vol = L => L.regions.reduce((s, r) => s + (r.x1 - r.x0) * (r.y1 - r.y0) * (r.z1 - r.z0), 0), L4 = buildLevel(3);
  ok(vol(L5) > vol(L4) * 1.5, N + ': the biggest house yet (' + Math.round(vol(L5)) + ' m3 inside vs ' + Math.round(vol(L4)) + ')');
  ok(L5.boxes.filter(b => b.col).length > L4.boxes.filter(b => b.col).length, N + ': more solid geometry than the Mansion');
  ok(MISSIONS[4] && MISSIONS[4].name === 'The Nightmare House', N + ': listed as level 5');
  let w = new World({ mission: 4, seed: 9 });
  for (const p of w.pois) ok(w.path(w.ai.x, w.ai.y, w.ai.z, p.x, p.y, p.z)?.complete, N + ': patrol reaches ' + p.id);
  ok(w.pois[0].id === 'stove', N + ': he starts in the kitchen');
  // what you can reach on foot from the street (locked doors shut, wardrobe in place)
  const extra = [w.a3.blockerBox, ...w.doors.filter(d => d.lock).map(d => d.closed)];
  const g = buildGrid(L5.boxes, { bounds: L5.reachBounds, cell: 0.5, radius: 0.3, clear: 1.0, extra });
  const st = findNode(g, L5.spawn.x, L5.spawn.y, L5.spawn.z);
  const reach = (x, y, z, cr = 0) => { const id = findNode(g, x, y, z, 1); return id >= 0 && !!playerReach(g, st, cr, 0.7).seen[id]; };
  ok(reach(-8, 9.6, -43) && reach(18, 12.8, -29) && reach(4, 16, -38) && reach(0, 12.8, -53.6), N + ': Eye hall, Depot, attic and Windmill platform are on foot');
  ok(!reach(-11, 15.1, -25) && !reach(-11, 15.1, -25, 1), N + ': the control-room ledge needs more than a jump (or one crate)');
  ok(!reach(-24, 12.8, -33, 3), N + ': the Water Room is only reachable by tram');
  ok(!reach(-5, 0, -36, 3), N + ': the basement is sealed');
  // the ledge: a jump falls short, a double jump makes it
  const ledge = (dbl) => {
    const v = new World({ mission: 4, seed: 7 }); v.ai.update = () => {}; v.a3.powers.double = dbl;
    Object.assign(v.player, { x: -6.5, y: 12.8, z: -25, yaw: Math.PI / 2 });
    for (let i = 0; i < 150; i++) v.step(DT, { mz: 1, sprint: true, jump: i === 20 || i === 38 });
    return v.player.y;
  };
  ok(ledge(false) < 13, N + ': no double jump, no control room');
  ok(Math.abs(ledge(true) - 15.1) < 0.02, N + ': double jump lands on the control-room ledge');

  w = new World({ mission: 4, seed: 11 });
  w.ai.update = () => {}; w.ai.x = 300; w.ai.z = 300;
  const A = w.a3, G = id => A.gadgetById[id], use = id => { w.interact({ kind: 'gadget', ref: G(id) }); w.step(DT, {}); };
  const run = (sec, inp = {}) => { for (let i = 0; i < sec * 60; i++) w.step(DT, typeof inp === 'function' ? inp(i) : inp); };
  // --- Supermarket: groceries, the mannequins, the checkout -> invisibility
  use('fearMarket'); ok(A.zone === 'market', N + ': the Supermarket door takes you into the dream');
  use('checkout'); ok(!A.powers.invis, N + ': no paying with an empty trolley');
  const mq = A.mannequins.find(m => m.id === 'mq2');
  Object.assign(w.player, { x: 162, y: 0, z: -24, yaw: 0, pitch: 0, crouch: false });      // facing it: it stays put
  const z0 = mq.z; run(1); ok(Math.abs(mq.z - z0) < 1e-6, N + ': a watched mannequin does not move');
  w.player.yaw = Math.PI; run(0.6, { crouch: true }); ok(Math.abs(mq.z - z0) < 1e-6, N + ': crouching in the shop, they cannot see you');
  run(3); ok(Math.abs(w.player.z - L5.act3.zones.market.start.z) < 0.01 && A.zone === 'market', N + ': turn your back standing up and it grabs you (back to the start)');
  for (const id of L5.act3.groceries) w.pickUp(w.propById[id]);
  ok(A.groceries === 5, N + ': five groceries in the trolley');
  use('checkout'); ok(A.powers.invis, N + ': pay -> invisibility');
  run(2.5); ok(A.zone === null && Math.abs(w.player.x - -12.3) < 0.01, N + ': you wake by the Supermarket door');
  // --- the Eye guards the fuse
  Object.assign(w.player, { x: -5, y: 9.6, z: -35, yaw: Math.PI / 2 });
  run(1.2, { mz: 0 }); ok(Math.abs(w.player.x - -2.6) < 0.01, N + ': standing in the Eye hall gets you thrown out');
  Object.assign(w.player, { x: -5, y: 9.6, z: -35, yaw: Math.PI / 2 });
  run(1.2, { crouch: true }); ok(Math.abs(w.player.x - -5) < 0.2, N + ': invisible while crouching, the Eye cannot see you');
  ok(w.sightRate(w.ai) === 0, N + ': he cannot see you either');
  Object.assign(w.player, { x: -8, y: 9.6, z: -43.2, yaw: 0, crouch: true }); w.pickUp(w.propById.fuse); ok(w.hasItem('fuse'), N + ': fuse taken from the Eye hall');
  // --- School: bell, giant -> push
  use('fearSchool'); ok(A.zone === 'school', N + ': into the School');
  use('giant'); ok(!A.powers.push, N + ': the giant will not fall before the bell');
  use('bell'); use('giant'); ok(A.powers.push && A.giantDown, N + ': bell, then push the giant over -> push');
  run(2.5); ok(A.zone === null, N + ': back from school');
  // --- Closet: the switch -> double jump
  use('fearCloset'); ok(A.zone === 'closet', N + ': into the Closet');
  use('switch'); ok(A.powers.double && A.closetLight, N + ': light switch -> double jump');
  run(2.5); ok(A.zone === null, N + ': back from the closet');
  ok(w.objective().length > 5, N + ': objective text');
  // --- control room: fuse, lever, button
  use('lever'); ok(!A.tram.lever, N + ': lever is dead without power');
  Object.assign(w.player, { x: -13, y: 15.1, z: -25, yaw: Math.PI / 2 });
  w.interact({ kind: 'fusebox', ref: w.fusebox }); ok(w.flags.power, N + ': fuse into the control-room fuse box');
  use('button'); ok(!A.tram.on, N + ': button needs the lever first');
  use('lever'); use('button'); ok(A.tram.on, N + ': lever + red button start the tram');
  // --- the tram: board at the Depot, drive, get off at the Water Room, call it from the Windmill
  Object.assign(w.player, { x: 17.5, y: 12.8, z: -25.8 });
  use('callDepot'); ok(A.tram.riding, N + ': board the tram at the Depot');
  const s0 = A.tram.s; run(2, { mz: 1 }); ok(Math.abs(A.loop.delta(s0, A.tram.s)) > 3 && A.tram.riding, N + ': it drives');
  const water = A.stations.find(x => x.id === 'water');
  A.tram.s = water.s + 1; A.tram.v = 0; w.step(DT, { interact: true });
  ok(!A.tram.riding && Math.abs(w.player.x - -23.9) < 0.01, N + ': get off at the Water Room');
  w.pickUp(w.propById.redkey); ok(w.hasItem('redkey'), N + ': red key from the Water Room');
  use('callWater'); ok(A.tram.riding, N + ': board again'); A.tram.s = A.stations.find(x => x.id === 'windmill').s; w.step(DT, { interact: true });
  ok(!A.tram.riding && Math.abs(w.player.z - -53.4) < 0.01, N + ': off at the Windmill');
  A.tram.s = water.s; Object.assign(w.player, { x: 2, y: 12.8, z: -52.6 });
  use('callWindmill'); ok(A.tram.auto === 'windmill', N + ': call the tram');
  run(30); ok(!A.tram.auto && A.stations.find(x => x.id === 'windmill') === require('../js/act3.js').dockedAt(w), N + ': it comes and docks at the Windmill');
  // --- push: the wardrobe and him
  Object.assign(w.player, { x: 2, y: 3.2, z: -33.4, yaw: 0, crouch: false });
  w.step(DT, { push: true }); ok(A.blocker, N + ': R shoves the wardrobe off the basement door');
  run(1.5);
  const ai = w.ai; delete ai.update; Object.assign(ai, { x: 2.2, y: 3.2, z: -25, state: 'patrol' });
  Object.assign(w.player, { x: 2.2, y: 3.2, z: -22.6, yaw: 0 }); A.pushCd = 0;
  w.step(DT, { push: true }); ok(ai.stunT > 1 && ai.z < -26, N + ': push shoves him back and stuns him');
  ai.x = 300; ai.z = 300; ai.update = () => {};
  // --- basement, music box, home
  Object.assign(w.player, { x: 2, y: 3.2, z: -34.8, yaw: 0 }); w.useDoor(w.doorById.basement);
  ok(!w.doorById.basement.locked, N + ': red key opens the basement');
  Object.assign(w.player, { x: -5, y: 0, z: -37 }); w.pickUp(w.propById.musicbox); ok(w.steps.musicbox !== undefined, N + ': the music box');
  const saved = w.serialize(), w2 = new World({ mission: 4 }); ok(w2.load(saved) && w2.a3.powers.double && w2.a3.tram.on && w2.a3.blocker, N + ': save keeps powers, tram and wardrobe');
  Object.assign(w.player, L5.spawn); w.step(DT, {}); ok(w.flags.won, N + ': home with the music box wins');
  console.log(N + ': passed');
}
console.log(count + ' map checks passed');
