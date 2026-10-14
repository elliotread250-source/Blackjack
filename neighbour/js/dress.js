// Interior dressing: turns plain boxes into finished rooms. Each map lists its rooms as
//   { x0, z0, x1, z1, y, h, wall, floor, ceil, trim, rail, name }
// (the clear space inside the walls). For every room this pass:
//   - gives the room-facing face of every wall around it the room's wallpaper (full-colour
//     materials get a white tint), splitting a wall that runs past the room so neighbouring rooms
//     keep their own paper — the split pieces cover exactly the same space, so collisions,
//     sight lines and navigation don't change;
//   - gives the floor slabs inside the room their floor material (stairwell holes stay holes);
//   - adds skirting boards, crown moulding and an optional dado rail as thin decorative boxes
//     (no collision), only on wall pieces that reach the floor / ceiling, so doorways stay clear.
import { makeBox } from './geom.js';

const EPS = 0.02;
export const WHITE = 0xffffff;

const FACES = { x0: 'px', x1: 'nx', z0: 'pz', z1: 'nz' };   // the face of a wall that looks into the room

function asFaces(b) {
  if (typeof b.m === 'string' || !b.m) b.m = { all: b.m || 'trim' };
  if (!b.tf) b.tf = {};
}
function clone(b, over) {
  const c = Object.assign(Object.create(Object.getPrototypeOf(b)), b, over);
  if (b.m && typeof b.m === 'object') c.m = { ...b.m };
  if (b.tf) c.tf = { ...b.tf };
  return c;
}
// cut box b into pieces along `axis` at the given coordinates (only cuts inside it)
function splitAt(b, axis, cuts) {
  const lo = axis === 'x' ? b.x0 : b.z0, hi = axis === 'x' ? b.x1 : b.z1;
  const cs = [...new Set(cuts.filter(c => c > lo + EPS && c < hi - EPS))].sort((a, c) => a - c);
  if (!cs.length) return [b];
  const out = [];
  let a = lo;
  for (const c of [...cs, hi]) {
    out.push(clone(b, axis === 'x' ? { x0: a, x1: c } : { z0: a, z1: c }));
    a = c;
  }
  return out;
}
const overlap = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);

export function dressRooms(L) {
  const rooms = L.rooms || [];
  if (!rooms.length) return;
  const detail = (x0, y0, z0, x1, y1, z1, m, c) => L.boxes.push(makeBox(x0, y0, z0, x1, y1, z1, { m, c, col: false, op: false, vis: true }));
  for (const R of rooms) {
    const top = R.y + R.h;
    const wallMat = R.wall, full = !!R.full;
    // ---- walls: find wall pieces on each side of the room
    const sides = [
      ['x0', b => b.x1 >= R.x0 - 0.06 && b.x1 <= R.x0 + 0.08 && b.x1 - b.x0 <= 0.45, 'z'],
      ['x1', b => b.x0 <= R.x1 + 0.06 && b.x0 >= R.x1 - 0.08 && b.x1 - b.x0 <= 0.45, 'z'],
      ['z0', b => b.z1 >= R.z0 - 0.06 && b.z1 <= R.z0 + 0.08 && b.z1 - b.z0 <= 0.45, 'x'],
      ['z1', b => b.z0 <= R.z1 + 0.06 && b.z0 >= R.z1 - 0.08 && b.z1 - b.z0 <= 0.45, 'x'],
    ];
    for (const [side, onSide, along] of sides) {
      const lo = along === 'x' ? R.x0 : R.z0, hi = along === 'x' ? R.x1 : R.z1;
      for (let i = 0; i < L.boxes.length; i++) {
        const b = L.boxes[i];
        if (!b.col || !b.vis || b.tag === 'stair' || b.noDress) continue;
        if (!onSide(b)) continue;
        if (overlap(b.y0, b.y1, R.y, top) < 0.3) continue;
        const b0 = along === 'x' ? b.x0 : b.z0, b1 = along === 'x' ? b.x1 : b.z1;
        if (overlap(b0, b1, lo, hi) < 0.1) continue;
        // walls only: tall-ish pieces (door headers count), not furniture standing against the wall
        if (b.y1 - b.y0 < 0.25 && b.y0 > R.y + 0.3 && b.y1 < top - 0.3) continue;
        const pieces = splitAt(b, along, [lo, hi]);
        L.boxes.splice(i, 1, ...pieces);
        for (const p of pieces) {
          const p0 = along === 'x' ? p.x0 : p.z0, p1 = along === 'x' ? p.x1 : p.z1;
          if (overlap(p0, p1, lo, hi) < 0.05) continue;
          asFaces(p);
          const f = FACES[side];
          p.m[f] = wallMat;
          p.tf[f] = full ? WHITE : (R.tint ?? p.tf[f] ?? p.c);
          // skirting, rail and moulding on the room side of this piece
          const out = side === 'x0' ? 1 : side === 'x1' ? -1 : side === 'z0' ? 1 : -1;
          const face = side === 'x0' ? p.x1 : side === 'x1' ? p.x0 : side === 'z0' ? p.z1 : p.z0;
          const strip = (y0, y1, d) => {
            const a = Math.max(p0, lo), c = Math.min(p1, hi);
            if (c - a < 0.05) return;
            const t0 = Math.min(face, face + out * d), t1 = Math.max(face, face + out * d);
            if (along === 'x') detail(a, y0, t0, c, y1, t1, 'trim', R.trim ?? 0xf2ead8);
            else detail(t0, y0, a, t1, y1, c, 'trim', R.trim ?? 0xf2ead8);
          };
          if (p.y0 <= R.y + 0.02) strip(R.y, R.y + 0.14, 0.03);
          if (R.rail && p.y0 <= R.y + 0.85 && p.y1 >= R.y + 0.95) strip(R.y + 0.86, R.y + 0.93, 0.025);
          if (p.y1 >= top - 0.02 && p.y0 <= top - 0.2) strip(top - 0.11, top, 0.05);
        }
        i += pieces.length - 1;
      }
    }
    // ---- floor slabs (top face at R.y inside the room) and ceilings (bottom face at the top)
    if (R.floor || R.ceil) {
      for (let i = 0; i < L.boxes.length; i++) {
        const b = L.boxes[i];
        if (!b.vis || b.tag === 'stair' || b.noDress) continue;
        if (overlap(b.x0, b.x1, R.x0, R.x1) < 0.1 || overlap(b.z0, b.z1, R.z0, R.z1) < 0.1) continue;
        const isFloor = R.floor && Math.abs(b.y1 - R.y) < 0.02 && b.y1 - b.y0 <= 0.45 && (b.x1 - b.x0 > 0.9 || b.z1 - b.z0 > 0.9);
        const isCeil = R.ceil && Math.abs(b.y0 - top) < 0.12 && b.y1 - b.y0 <= 0.45 && (b.x1 - b.x0 > 0.9 || b.z1 - b.z0 > 0.9);
        if (!isFloor && !isCeil) continue;
        let pieces = splitAt(b, 'x', [R.x0, R.x1]);
        pieces = pieces.flatMap(p => splitAt(p, 'z', [R.z0, R.z1]));
        L.boxes.splice(i, 1, ...pieces);
        for (const p of pieces) {
          if (overlap(p.x0, p.x1, R.x0, R.x1) < 0.05 || overlap(p.z0, p.z1, R.z0, R.z1) < 0.05) continue;
          asFaces(p);
          if (isFloor) { p.m.py = R.floor; p.tf.py = R.floorTint ?? WHITE; }
          if (isCeil) { p.m.ny = R.ceil; p.tf.ny = R.ceilTint ?? 0xf0ead8; }
        }
        i += pieces.length - 1;
      }
    }
  }
}

// Footstep material for the new floor names (world.js uses this for sounds).
export function stepMaterial(name) {
  if (!name) return null;
  if (name === 'fl_kitchen' || name === 'fl_bath') return 'tile';
  if (name.startsWith('rug_')) return 'carpet';
  if (name.startsWith('fl_')) return 'wood';
  if (name === 'stone' || name === 'rust') return name === 'rust' ? 'metal' : 'concrete';
  return null;
}

// Make an existing collision box (or several) invisible and put a furniture model in its place.
// faces: which way the front looks: '+z' (default), '-z', '+x', '-x'.
const RY = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 };
export function furnish(L, kind, boxes, o = {}) {
  const bs = Array.isArray(boxes) ? boxes : [boxes];
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (const b of bs) { x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); z0 = Math.min(z0, b.z0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1); z1 = Math.max(z1, b.z1); b.vis = false; b.noDress = true; }
  const ry = RY[o.faces || '+z'] ?? 0, side = Math.abs(Math.sin(ry)) > 0.5;
  const w = side ? z1 - z0 : x1 - x0, d = side ? x1 - x0 : z1 - z0;
  L.decor.push({ t: 'f_' + kind, x: (x0 + x1) / 2, y: y0, z: (z0 + z1) / 2, w, d, h: o.h ?? (y1 - y0), ry, ...o });
}
// A piece of furniture with no collision of its own (wall decorations, rugs of clutter...).
export function prop(L, kind, x, y, z, w, d, h, o = {}) {
  L.decor.push({ t: 'f_' + kind, x, y, z, w, d, h, ry: RY[o.faces || '+z'] ?? 0, ...o });
}

// Exterior trim for a house block: corner boards and downpipes from the gutters (visual only).
//   o = { x0, z0, x1, z1, y0, y1, c, pipes: [[x or z along the wall, side ('x0'|'x1'|'z0'|'z1'), eave height, overhang, bottom]] }
export function trimShell(L, o) {
  const y0 = o.y0 ?? 0, c = o.c ?? 0xf1ead8;
  const detail = (x0, y0_, z0, x1, y1, z1, m, col) => L.boxes.push(makeBox(Math.min(x0, x1), y0_, Math.min(z0, z1), Math.max(x0, x1), y1, Math.max(z0, z1), { m, c: col, col: false, op: false, vis: true }));
  for (const [cx, sx] of [[o.x0, -1], [o.x1, 1]]) for (const [cz, sz] of [[o.z0, -1], [o.z1, 1]]) {
    detail(cx + sx * 0.05, y0, cz + sz * 0.05, cx - sx * 0.14, o.y1, cz - sz * 0.02, 'trim', c);
    detail(cx + sx * 0.05, y0, cz + sz * 0.05, cx - sx * 0.02, o.y1, cz - sz * 0.14, 'trim', c);
  }
  for (const [a, side, top, over = 0.7, bottom] of o.pipes || []) {
    const y0 = bottom ?? o.y0 ?? 0, PC = 0x5c6066, s = side === 'x0' || side === 'z0' ? -1 : 1;
    const wall = side === 'x0' ? o.x0 : side === 'x1' ? o.x1 : side === 'z0' ? o.z0 : o.z1;
    const at = (n0, n1, y0_, y1, a0, a1) => side[0] === 'z'
      ? detail(a + a0, y0_, wall + s * n0, a + a1, y1, wall + s * n1, 'metal', PC)
      : detail(wall + s * n0, y0_, a + a0, wall + s * n1, y1, a + a1, 'metal', PC);
    at(over, over + 0.12, top - 0.6, top - 0.18, -0.05, 0.05);       // drop from the gutter
    at(0.06, over + 0.12, top - 0.7, top - 0.58, -0.05, 0.05);       // elbow back to the wall
    at(0.06, 0.18, y0 + 0.12, top - 0.6, -0.06, 0.06);               // down the wall
    at(0.06, 0.38, y0, y0 + 0.14, -0.07, 0.07);                      // shoe at the bottom
  }
}
