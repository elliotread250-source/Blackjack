// Indoor tracks: the building (floor, walls, roof), cheap indoor lighting (emissive strip lights,
// light panels and screens; the only real lights are the hemisphere + one key light the race
// already uses), supports under bridges / mezzanines / ramps, and the props of each venue.
import * as THREE from 'three';
import { SURF } from './trackgen.js';
import { rng } from './data.js';
import { part, merge, canvasTex, placeInstances, colorGeo, Builder } from './trackmesh.js';

export const INDOOR_THEMES = {
  hall: {
    indoor: true, style: 'hall', H: 24,
    skyTop: '#39404d', skyHorizon: '#9aa3b2', fog: '#7d8594', fogNear: 140, fogFar: 520, bg: '#2b2f37',
    sun: '#ffffff', sunI: 1.5, sunDir: [0.25, 1, 0.18], hemiSky: '#f4f6ff', hemiGround: '#70747e', hemiI: 1.7,
    road: '#8a8f99', roadAlt: '#8d929c', line: '#ffd23f', kerb: ['#e3342f', '#f7f7f7'],
    off: { [SURF.GRASS]: '#4f6d8c', [SURF.DIRT]: '#6b7280' },
    wall: ['#26282e', '#2e3138'], wallH: 1.0, ground: '#a3a8b0', ground2: '#959aa3', rock: '#6b6f78',
  },
  arena: {
    indoor: true, style: 'arena', H: 30,
    skyTop: '#0b0820', skyHorizon: '#3a1d5c', fog: '#120d26', fogNear: 120, fogFar: 520, bg: '#07060f',
    sun: '#c8b8ff', sunI: 1.0, sunDir: [0.1, 1, 0.25], hemiSky: '#a99cff', hemiGround: '#2a1640', hemiI: 1.7,
    road: '#24273b', roadAlt: '#272b41', line: '#3fd5ff', kerb: ['#ff3fa4', '#3fd5ff'],
    off: { [SURF.GRASS]: '#1b1932', [SURF.DIRT]: '#2b2445' },
    wall: ['#17162b', '#1e1d36'], neon: ['#20e3ff', '#ff3fa4'], wallH: 1.1, ground: '#100f1e', ground2: '#16142a', rock: '#2a2840',
  },
  toy: {
    indoor: true, style: 'toy', H: 64,
    skyTop: '#ffe2b0', skyHorizon: '#c98b4f', fog: '#f1d9bd', fogNear: 170, fogFar: 640, bg: '#f6e7d2',
    sun: '#fff1d6', sunI: 2.1, sunDir: [-0.55, 0.8, 0.25], hemiSky: '#fff7ea', hemiGround: '#a87048', hemiI: 1.45,
    road: '#5d6370', roadAlt: '#616775', line: '#ffffff', kerb: ['#ff5a5a', '#ffffff'],
    off: { [SURF.GRASS]: '#7cb6e6', [SURF.DIRT]: '#e8a05a' },
    wall: ['#ff5a5a', '#ffd23f'], wallCycle: ['#ff5a5a', '#ffd23f', '#3fa9ff', '#5ecb6b'], wallH: 1.5,
    ground: '#c48b55', ground2: '#b57d4a', rock: '#d9a066',
  },
};

const lam = new Map();
function vcMat(opts = {}) { return new THREE.MeshLambertMaterial({ vertexColors: true, ...opts }); }

export function buildIndoor(tr, th, grid, R, quality, anim) {
  const g = new THREE.Group();
  const hi = quality === 'high';
  // room bounds from the corridor (plus walls) and a margin
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < tr.N; i++) {
    const e = Math.max(tr.EXT_L[i], tr.EXT_R[i]) + 2;
    x0 = Math.min(x0, tr.PX[i] - e); x1 = Math.max(x1, tr.PX[i] + e); z0 = Math.min(z0, tr.PZ[i] - e); z1 = Math.max(z1, tr.PZ[i] + e);
  }
  const M = th.style === 'arena' ? 26 : th.style === 'toy' ? 40 : 16;
  x0 -= M; x1 += M; z0 -= M; z1 += M;
  const H = th.H;
  const room = { x0, x1, z0, z1, H, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 };
  // things on the floor must stay off the course: is (x, z) clear of every corridor at floor level?
  const lowClear = (x, z, margin) => {
    for (let i = 0; i < tr.N; i += 1) {
      const dx = x - tr.PX[i], dz = z - tr.PZ[i];
      const e = Math.max(tr.EXT_L[i], tr.EXT_R[i]) + margin;
      if (dx * dx + dz * dz < e * e && tr.PY[i] < 2.5) return false;
    }
    return true;
  };
  const clearAll = (x, z, margin) => grid.clear(x, z, margin) && lowClear(x, z, margin);

  buildShell(g, th, room, hi, anim);
  buildSupports(g, tr, th, hi, lowClear);
  buildGapWalls(g, tr, th);
  let pitSpots = [];
  if (th.style === 'hall') pitSpots = hallProps(g, tr, th, room, R, hi, clearAll, anim);
  else if (th.style === 'arena') arenaProps(g, tr, th, room, R, hi, clearAll, anim);
  else if (th.style === 'toy') toyProps(g, tr, th, room, R, hi, clearAll, anim);
  return { group: g, pitSpots, room };
}

// ---------- floor, walls, ceiling
function buildShell(g, th, room, hi, anim) {
  const { x0, x1, z0, z1, H, cx, cz, w, d } = room;
  let floorTex, wallTex, ceilColor, wallRepeat = [w / 24, 1];
  if (th.style === 'hall') {
    floorTex = canvasTex(256, 256, (x, W, Hh) => {
      x.fillStyle = '#a3a8b0'; x.fillRect(0, 0, W, Hh);
      const r = rng(4);
      for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,44,52'},${0.05 + r() * 0.06})`; x.fillRect(r() * W, r() * Hh, 2 + r() * 6, 2 + r() * 6); }
      x.strokeStyle = 'rgba(60,64,72,0.35)'; x.lineWidth = 2; x.strokeRect(0, 0, W, Hh);
    }, { repeat: true });
    floorTex.repeat.set(w / 16, d / 16);
    wallTex = canvasTex(256, 256, (x, W, Hh) => {
      for (let i = 0; i < 32; i++) { x.fillStyle = i % 2 ? '#b9c0cb' : '#a7afbb'; x.fillRect(i * 8, 0, 8, Hh); }
      x.fillStyle = '#3a3f4a'; x.fillRect(0, Hh - 40, W, 40);
      x.fillStyle = '#e3342f'; x.fillRect(0, Hh - 52, W, 10);
    }, { repeat: true });
    ceilColor = '#2a2e36';
  } else if (th.style === 'arena') {
    floorTex = canvasTex(256, 256, (x, W, Hh) => {
      x.fillStyle = '#100f1e'; x.fillRect(0, 0, W, Hh);
      x.strokeStyle = 'rgba(63,213,255,0.35)'; x.lineWidth = 2; x.strokeRect(1, 1, W - 2, Hh - 2);
      x.strokeStyle = 'rgba(255,63,164,0.18)'; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, Hh); x.moveTo(0, Hh / 2); x.lineTo(W, Hh / 2); x.stroke();
    }, { repeat: true });
    floorTex.repeat.set(w / 12, d / 12);
    wallTex = canvasTex(256, 256, (x, W, Hh) => {
      x.fillStyle = '#121126'; x.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? 'rgba(255,63,164,0.85)' : 'rgba(32,227,255,0.85)'; x.fillRect(0, 30 + i * 36, W, 3); }
      x.fillStyle = '#1c1b38'; for (let i = 0; i < 8; i++) x.fillRect(i * 32 + 2, 0, 2, Hh);
    }, { repeat: true });
    ceilColor = '#0a0916';
  } else {
    floorTex = canvasTex(256, 256, (x, W, Hh) => {
      const r = rng(8);
      for (let i = 0; i < 8; i++) {
        const c = ['#c48b55', '#b98250', '#cd9660', '#bf8752'][i % 4];
        x.fillStyle = c; x.fillRect(0, i * 32, W, 32);
        x.fillStyle = 'rgba(90,50,20,0.35)'; x.fillRect(0, i * 32, W, 2);
        const off = r() * W; x.fillRect(off, i * 32, 2, 32);
        for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(120,70,30,0.12)'; x.fillRect(r() * W, i * 32 + 6 + r() * 20, 30 + r() * 60, 1); }
      }
    }, { repeat: true });
    floorTex.repeat.set(w / 20, d / 20);
    wallTex = canvasTex(256, 256, (x, W, Hh) => {
      x.fillStyle = '#bfe0f2'; x.fillRect(0, 0, W, Hh);
      x.fillStyle = '#a9d2ea'; for (let i = 0; i < 8; i++) x.fillRect(i * 32, 0, 14, Hh);
      x.fillStyle = '#ffe58a'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.arc(i * 32 + 23, j * 32 + 10, 3.5, 0, 7); x.fill(); }
      x.fillStyle = '#f7f3ea'; x.fillRect(0, Hh - 26, W, 26);
    }, { repeat: true });
    ceilColor = '#e9dfcf';
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: floorTex, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(cx, -0.06, cz); floor.receiveShadow = true;
  g.add(floor);
  // walls: four inward-facing planes, texture repeats per ~24 m
  const wallMat = th.style === 'arena'
    ? new THREE.MeshLambertMaterial({ map: wallTex, emissive: 0xffffff, emissiveMap: wallTex, emissiveIntensity: 0.55 })
    : new THREE.MeshLambertMaterial({ map: wallTex });
  const mkWall = (len, x, z, ry) => {
    const t = wallTex.clone(); t.needsUpdate = true; t.repeat.set(len / 24, 1); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const m = wallMat.clone(); m.map = t; if (m.emissiveMap) m.emissiveMap = t;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(len, H), m);
    p.position.set(x, H / 2 - 0.06, z); p.rotation.y = ry;
    g.add(p);
  };
  mkWall(w, cx, z0, 0); mkWall(w, cx, z1, Math.PI); mkWall(d, x0, cz, Math.PI / 2); mkWall(d, x1, cz, -Math.PI / 2);
  // the ceiling faces down, so a lit material would only pick up the hemisphere's ground colour
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: ceilColor, fog: true }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, H, cz);
  g.add(ceil);
}

// ---------- under elevated road: steel bridge, mezzanine deck, books and a table
function buildSupports(g, tr, th, hi, lowClear) {
  const parts = [], glow = [];
  const style = th.style;
  const bookCols = ['#e3342f', '#3fa9ff', '#ffd23f', '#5ecb6b', '#a66bff', '#ff8fd0', '#f7f7f7'];
  let tableBox = null;
  for (let s = 0; s < tr.L; s += 2.5) {
    if (tr.pitRamp(s + 1.25)) continue;
    const f = tr.frame(s + 1.25);
    if (f.y < 1.0) continue;
    const a = tr.pointAt(s + 1.25, -f.extL - 0.6), c = tr.pointAt(s + 1.25, f.extR + 0.6);
    const width = Math.hypot(c.x - a.x, c.z - a.z), mx = (a.x + c.x) / 2, mz = (a.z + c.z) / 2, ry = Math.atan2(f.fx, f.fz);
    if (style === 'toy') {
      if (f.y > 7.2) { // the table top region: remember where it starts and ends along the course
        if (!tableBox) tableBox = { s0: s + 1.25, s1: s + 1.25, y: f.y, ext: 0 };
        tableBox.s1 = s + 1.25; tableBox.y = Math.min(tableBox.y, f.y); tableBox.ext = Math.max(tableBox.ext, f.extL, f.extR);
        continue;
      }
      // a stack of books under the ramp
      const rr = rng(Math.floor(s * 7));
      let y = 0;
      while (y < f.y - 0.35) {
        const t = Math.min(0.9 + rr() * 0.5, f.y - 0.3 - y);
        if (t < 0.15) break;
        const geo = new THREE.BoxGeometry(width + 2 + rr() * 2, t, 2.7);
        geo.rotateY(ry);
        parts.push(part(geo, bookCols[Math.floor(rr() * bookCols.length)], mx + (rr() - 0.5) * 0.8, y + t / 2, mz));
        y += t;
      }
      continue;
    }
    // deck under the road
    const deckW = style === 'arena' ? width + 8 : width;
    const deck = new THREE.BoxGeometry(deckW, 0.9, 2.6);
    deck.rotateY(ry);
    parts.push(part(deck, style === 'arena' ? '#1d1b33' : '#4a5160', mx, f.y - 0.55, mz));
    if (style === 'arena') {
      // glowing deck edges
      for (const side of [-1, 1]) {
        const e = tr.pointAt(s + 1.25, side * ((side > 0 ? f.extR : f.extL) + 4.6));
        const eg = new THREE.BoxGeometry(0.25, 0.25, 2.6); eg.rotateY(ry);
        glow.push(part(eg, side > 0 ? th.neon[0] : th.neon[1], e.x, f.y - 0.15, e.z));
      }
    }
    // pillars every ~10 m where they don't land on the lower road
    if (Math.floor(s / 2.5) % 4 === 0) {
      for (const side of [-1, 1]) {
        const p = tr.pointAt(s + 1.25, side * ((side > 0 ? f.extR : f.extL) + (style === 'arena' ? 3 : 0.2)));
        if (!lowClear(p.x, p.z, 0.8)) continue;
        const h = f.y - 0.6;
        if (style === 'hall') {
          parts.push(part(new THREE.BoxGeometry(0.7, h, 0.35), '#c0392b', p.x, h / 2, p.z));
          parts.push(part(new THREE.BoxGeometry(0.2, h, 0.9), '#c0392b', p.x, h / 2, p.z));
        } else parts.push(part(new THREE.CylinderGeometry(0.6, 0.7, h, 10), '#2b2945', p.x, h / 2, p.z));
      }
    }
  }
  if (tableBox) {
    // an oriented table: it ends exactly at the jump lip so karts fly off its edge
    const tb = tableBox;
    const lip = tr.ramps.find(r => r.land !== undefined);
    const sEnd = lip ? lip.lip : tb.s1 + 1.25;
    const A = tr.frame(tb.s0 - 2), B = tr.frame(sEnd);
    const dx = B.x - A.x, dz = B.z - A.z, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
    // widest lateral excursion of the course from the A-B line, plus a margin
    let half = tb.ext + 7;
    for (let q = tb.s0; q < sEnd; q += 2) { const f = tr.frame(q); half = Math.max(half, Math.abs((f.x - A.x) * -uz + (f.z - A.z) * ux) + tb.ext + 7); }
    const top = tb.y - 0.08, mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2, ry = Math.atan2(ux, uz);
    parts.push(part(new THREE.BoxGeometry(half * 2, 1.0, len), '#9b5f33', mx, top - 0.5, mz, 0, ry));
    parts.push(part(new THREE.BoxGeometry(half * 2 - 1.2, 0.5, len - 1.2), '#7d4826', mx, top - 1.25, mz, 0, ry));
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const lx = mx + ux * a * (len / 2 - 2.2) + -uz * b * (half - 2.2), lz = mz + uz * a * (len / 2 - 2.2) + ux * b * (half - 2.2);
      if (!lowClear(lx, lz, 0.5)) continue;
      parts.push(part(new THREE.CylinderGeometry(1.0, 0.8, top - 1, 10), '#8a522b', lx, (top - 1) / 2, lz));
    }
  }
  if (parts.length) { const m = new THREE.Mesh(merge(parts), vcMat()); m.castShadow = hi; m.receiveShadow = true; g.add(m); }
  if (glow.length) g.add(new THREE.Mesh(merge(glow), new THREE.MeshBasicMaterial({ vertexColors: true })));
}

// walls along a jump gap that has a floor under it (the road itself is not drawn there)
function buildGapWalls(g, tr, th) {
  const b = new Builder();
  const cyc = (th.wallCycle || th.wall).map(c => new THREE.Color(c));
  for (const r of tr.ramps) {
    if (r.land === undefined) continue;
    for (let s = r.lip; s < r.lip + r.gap; s += 2.5) {
      const s1 = Math.min(r.lip + r.gap, s + 2.5);
      const fa = tr.frame(s), fb = tr.frame(s1);
      for (const side of [-1, 1]) {
        const ea = side > 0 ? fa.extR : fa.extL, eb = side > 0 ? fb.extR : fb.extL;
        const A = { x: fa.x + fa.rx * side * ea, y: r.land, z: fa.z + fa.rz * side * ea }, B = { x: fb.x + fb.rx * side * eb, y: r.land, z: fb.z + fb.rz * side * eb };
        const h = th.wallH, up = p => ({ x: p.x, y: p.y + h, z: p.z });
        b.quad(A, B, up(B), up(A), cyc[Math.floor(s / 2.5) % cyc.length]);
      }
    }
  }
  if (b.p.length) g.add(new THREE.Mesh(b.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
}

// ---------- Kart Hall
function hallProps(g, tr, th, room, R, hi, clearAll, anim) {
  const { x0, x1, z0, z1, H, cx, cz, w, d } = room;
  const steel = [];
  // roof trusses across the short side every 14 m, with braces
  const across = w < d;
  const span = across ? w : d, len = across ? d : w;
  for (let t = 7; t < len; t += 14) {
    const geo = (sx, sy, sz, a, y, b) => { const gg = new THREE.BoxGeometry(across ? sx : sz, sy, across ? sz : sx); return part(gg, '#5d6573', across ? x0 + a : x0 + b, y, across ? z0 + b : z0 + a); };
    steel.push(geo(span, 0.5, 0.5, span / 2, H - 1, t));
    steel.push(geo(span, 0.35, 0.35, span / 2, H - 4, t));
    for (let k = 0; k <= span; k += 6) steel.push(geo(0.25, 3, 0.25, k, H - 2.5, t));
  }
  // longitudinal purlins
  for (let k = 8; k < span; k += 16) {
    const gg = new THREE.BoxGeometry(across ? 0.3 : len, 0.3, across ? len : 0.3);
    steel.push(part(gg, '#4a515d', across ? x0 + k : x0 + len / 2, H - 0.7, across ? z0 + len / 2 : z0 + k));
  }
  g.add(new THREE.Mesh(merge(steel), vcMat()));
  // fluorescent strip lights hung below the trusses
  const lights = [];
  for (let t = 14; t < len; t += 14) for (let k = 10; k < span - 6; k += 12) {
    const gg = new THREE.BoxGeometry(across ? 6 : 0.35, 0.18, across ? 0.35 : 6);
    lights.push(colorGeo(gg.translate(across ? x0 + k : x0 + t, H - 5.2, across ? z0 + t : z0 + k), '#ffffff'));
    const hous = new THREE.BoxGeometry(across ? 6.2 : 0.6, 0.25, across ? 0.6 : 6.2);
    lights.push(colorGeo(hous.translate(across ? x0 + k : x0 + t, H - 5.0, across ? z0 + t : z0 + k), '#9aa0aa'));
  }
  g.add(new THREE.Mesh(merge(lights), new THREE.MeshBasicMaterial({ vertexColors: true })));
  // tyre-stack barriers along the walls (instanced)
  const tyre = merge([
    part(new THREE.CylinderGeometry(0.55, 0.55, 1.15, 10), '#1c1d21', 0, 0.575, 0),
    part(new THREE.CylinderGeometry(0.57, 0.57, 0.22, 10), '#ffffff', 0, 0.95, 0),
    part(new THREE.CylinderGeometry(0.57, 0.57, 0.22, 10), '#ffffff', 0, 0.3, 0),
  ]);
  const stacks = [];
  const step = hi ? 1.2 : 2.4;
  for (let s = 0; s < tr.L; s += step) {
    if (tr.pitRamp(s)) continue;
    const f = tr.frame(s), i = tr.idx(s);
    for (const side of [-1, 1]) {
      if (!(side > 0 ? tr.WR[i] : tr.WL[i])) continue;
      const p = tr.pointAt(s, side * ((side > 0 ? f.extR : f.extL) + 0.45));
      stacks.push({ x: p.x, y: p.y + (f.y > 1 ? 0 : 0), z: p.z, ry: R() * 6, s: 1, c: Math.floor(s / step) % 2 ? '#e3342f' : '#ffffff' });
    }
  }
  g.add(placeInstances(tyre, vcMat(), stacks, false));
  // viewing gallery along the wall nearest the start straight
  const f0 = tr.frame(20);
  const sideToWall = [[z0, 'z0'], [z1, 'z1'], [x0, 'x0'], [x1, 'x1']].map(([v, k]) => ({ k, dist: k[0] === 'z' ? Math.abs(f0.z - v) : Math.abs(f0.x - v) })).sort((a, b) => a.dist - b.dist)[0].k;
  const gal = [], crowd = [];
  const cols = ['#ff5f5f', '#ffd23f', '#3fa9ff', '#8bd448', '#ff8fd0', '#ffffff', '#ff9f43'];
  const glen = (sideToWall[0] === 'z' ? w : d) * 0.6, gy = 7.5, gd = 7;
  const along = sideToWall[0] === 'z';
  const wallPos = { z0, z1, x0, x1 }[sideToWall], inward = sideToWall.endsWith('0') ? 1 : -1;
  const gx = along ? cx : wallPos + inward * gd / 2, gz = along ? wallPos + inward * gd / 2 : cz;
  const B = (sx, sy, sz, x, y, z, c) => gal.push(part(new THREE.BoxGeometry(along ? sx : sz, sy, along ? sz : sx), c, along ? x : z, y, along ? z : x));
  B(glen, 0.6, gd, along ? gx : gz, gy, along ? gz : gx, '#6b7280');
  for (let k = -glen / 2; k <= glen / 2; k += 10) B(0.6, gy, 0.6, (along ? gx : gz) + k, gy / 2, (along ? gz : gx) + inward * (gd / 2 - 0.5), '#5d6573');
  const rail = new THREE.Mesh(new THREE.PlaneGeometry(glen, 1.3), new THREE.MeshLambertMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  rail.position.set(along ? gx : gx + inward * gd / 2, gy + 0.95, along ? gz + inward * gd / 2 : gz);
  rail.rotation.y = along ? 0 : Math.PI / 2;
  g.add(rail);
  const rc = rng(31);
  for (let k = -glen / 2 + 1; k < glen / 2 - 1; k += 1.2) if (rc() < 0.65) {
    const geo = new THREE.BoxGeometry(0.6, 1.5, 0.5);
    const off = inward * (gd / 2 - 1.2 - rc() * 3);
    crowd.push(part(geo, cols[Math.floor(rc() * cols.length)], along ? gx + k : gx + off, gy + 1.05, along ? gz + off : gz + k));
  }
  g.add(new THREE.Mesh(merge([...gal, ...crowd]), vcMat()));
  // big banner on the gallery wall
  const banner = canvasTex(512, 96, (x, W, Hh) => {
    x.fillStyle = '#e3342f'; x.fillRect(0, 0, W, Hh);
    x.fillStyle = '#fff'; x.font = 'bold italic 60px system-ui, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('KART HALL', W / 2, Hh / 2 + 3);
    for (let i = 0; i < 32; i++) { x.fillStyle = i % 2 ? '#111' : '#fff'; x.fillRect(i * 16, 0, 16, 8); x.fillStyle = i % 2 ? '#fff' : '#111'; x.fillRect(i * 16, Hh - 8, 16, 8); }
  });
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(28, 5.2), new THREE.MeshBasicMaterial({ map: banner }));
  bm.position.set(along ? gx : wallPos + inward * 0.2, gy + 7, along ? wallPos + inward * 0.2 : gz);
  bm.rotation.y = along ? (inward > 0 ? 0 : Math.PI) : (inward > 0 ? Math.PI / 2 : -Math.PI / 2);
  g.add(bm);
  // pit area: painted box, pit wall and parked karts (added by the game)
  const pitSpots = [];
  const pf = tr.frame(tr.L - 60);
  const pside = tr.EXT_L[tr.idx(tr.L - 60)] < tr.EXT_R[tr.idx(tr.L - 60)] ? -1 : 1;
  const pext = pside > 0 ? pf.extR : pf.extL;
  const pitParts = [];
  for (let k = 0; k < 3; k++) {
    const p = tr.pointAt(tr.L - 70 + k * 9, pside * (pext + 6.5));
    if (!clearAll(p.x, p.z, 2.5)) continue;
    pitSpots.push({ x: p.x, y: 0, z: p.z, yaw: Math.atan2(-pf.rx * pside, -pf.rz * pside) });
    const box = new THREE.BoxGeometry(4.6, 0.04, 6.4); box.rotateY(Math.atan2(pf.fx, pf.fz));
    pitParts.push(part(box, '#ffd23f', p.x, 0.0, p.z));
    const tool = tr.pointAt(tr.L - 70 + k * 9 + 3, pside * (pext + 10));
    pitParts.push(part(new THREE.BoxGeometry(1.2, 1.4, 0.8), '#e3342f', tool.x, 0.7, tool.z, 0, R() * 3));
  }
  if (pitParts.length) g.add(new THREE.Mesh(merge(pitParts), vcMat({ polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));
  return pitSpots;
}

// ---------- Neon Arena
function arenaProps(g, tr, th, room, R, hi, clearAll, anim) {
  const { x0, x1, z0, z1, H, cx, cz, w, d } = room;
  // neon strips along the barriers
  const strips = [];
  for (let s = 0; s < tr.L; s += 2.5) {
    if (tr.pitRamp(s + 1.25)) continue;
    const s1 = Math.min(tr.L - 0.01, s + 2.5), i = tr.idx(s);
    for (const side of [-1, 1]) {
      if (!(side > 0 ? tr.WR[i] : tr.WL[i])) continue;
      const fa = tr.frame(s), fb = tr.frame(s1);
      const a = tr.pointAt(s, side * ((side > 0 ? fa.extR : fa.extL) - 0.05)), c = tr.pointAt(s1, side * ((side > 0 ? fb.extR : fb.extL) - 0.05));
      const geo = new THREE.BufferGeometry();
      const y0 = th.wallH - 0.32, y1 = th.wallH - 0.05;
      geo.setAttribute('position', new THREE.Float32BufferAttribute([a.x, a.y + y0, a.z, c.x, c.y + y0, c.z, c.x, c.y + y1, c.z, a.x, a.y + y0, a.z, c.x, c.y + y1, c.z, a.x, a.y + y1, a.z], 3));
      strips.push(colorGeo(geo, side > 0 ? th.neon[0] : th.neon[1]));
    }
  }
  g.add(new THREE.Mesh(merge(strips), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
  // giant screens on the long walls
  const screenTex = canvasTex(512, 288, (x, W, Hh) => {
    const gr = x.createLinearGradient(0, 0, W, Hh); gr.addColorStop(0, '#2a0b4a'); gr.addColorStop(0.5, '#ff3fa4'); gr.addColorStop(1, '#20e3ff');
    x.fillStyle = gr; x.fillRect(0, 0, W, Hh);
    x.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < Hh; i += 4) x.fillRect(0, i, W, 1);
    x.fillStyle = '#fff'; x.font = 'bold italic 76px system-ui, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = '#20e3ff'; x.shadowBlur = 18; x.fillText('NEON ARENA', W / 2, Hh / 2 - 18);
    x.font = 'bold 30px system-ui, Arial'; x.shadowBlur = 8; x.fillText('LIVE  ·  LAP 1  ·  GO GO GO', W / 2, Hh / 2 + 52);
  });
  const tickerTex = canvasTex(512, 64, (x, W, Hh) => {
    x.fillStyle = '#0b0820'; x.fillRect(0, 0, W, Hh);
    x.fillStyle = '#ffd23f'; x.font = 'bold 40px system-ui, Arial'; x.textBaseline = 'middle';
    x.fillText('★ DRIFT FOR MINI-TURBOS ★ PURPLE SPARKS = BIG BOOST ', 6, Hh / 2 + 2);
  }, { repeat: true });
  const screens = [];
  const addScreen = (x, z, ry, sw) => {
    const sh = sw * 9 / 16;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: screenTex }));
    m.position.set(x, H * 0.55, z); m.rotation.y = ry; g.add(m);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(sw + 1.2, sh + 1.2, 0.4), new THREE.MeshLambertMaterial({ color: '#101020' }));
    frame.position.copy(m.position); frame.rotation.y = ry; frame.translateZ(-0.3); g.add(frame);
    const tk = new THREE.Mesh(new THREE.PlaneGeometry(sw, 2.2), new THREE.MeshBasicMaterial({ map: tickerTex }));
    tk.position.set(x, H * 0.55 - sh / 2 - 2, z); tk.rotation.y = ry; g.add(tk);
    screens.push(m);
  };
  const sw = Math.min(46, w * 0.3);
  addScreen(cx, z0 + 0.3, 0, sw); addScreen(cx, z1 - 0.3, Math.PI, sw);
  addScreen(x0 + 0.3, cz, Math.PI / 2, Math.min(36, d * 0.3)); addScreen(x1 - 0.3, cz, -Math.PI / 2, Math.min(36, d * 0.3));
  anim.push(dt => { tickerTex.offset.x = (tickerTex.offset.x + dt * 0.08) % 1; });
  // stands with a crowd along the walls, below the screens
  const cols = ['#ff3fa4', '#20e3ff', '#ffd23f', '#a66bff', '#ffffff', '#5ee08a'];
  const standParts = [];
  const rc = rng(12);
  const addStand = (ax, az, along, inward, len) => {
    for (let r = 0; r < 5; r++) {
      const geo = along ? new THREE.BoxGeometry(len, 1.1, 2.4) : new THREE.BoxGeometry(2.4, 1.1, len);
      const off = inward * (2 + r * 2.3);
      standParts.push(part(geo, '#24223d', along ? ax : ax + off, 0.55 + r * 1.1, along ? az + off : az));
      for (let k = -len / 2 + 0.8; k < len / 2 - 0.5; k += 1.1) if (rc() < 0.8) {
        const c = new THREE.BoxGeometry(0.6, 0.9, 0.5);
        standParts.push(part(c, cols[Math.floor(rc() * cols.length)], along ? ax + k : ax + off, 1.55 + r * 1.1, along ? az + off : az + k));
      }
    }
  };
  const lenX = Math.min(70, w * 0.55), lenZ = Math.min(50, d * 0.45);
  // only where the stand is clear of the course
  const tryStand = (ax, az, along, inward, len) => {
    for (let k = -len / 2; k <= len / 2; k += 6) for (let r = 0; r < 3; r++) {
      const off = inward * (2 + r * 5);
      if (!clearAll(along ? ax + k : ax + off, along ? az + off : az + k, 1)) return;
    }
    addStand(ax, az, along, inward, len);
  };
  tryStand(cx - w * 0.22, z0, true, 1, lenX); tryStand(cx + w * 0.22, z1, true, -1, lenX);
  tryStand(x0, cz - d * 0.2, false, 1, lenZ); tryStand(x1, cz + d * 0.2, false, -1, lenZ);
  if (standParts.length) g.add(new THREE.Mesh(merge(standParts), vcMat()));
  // ceiling rigs with spotlights and soft light cones
  const rig = [], spots = [];
  for (let gx = x0 + w * 0.2; gx < x1; gx += w * 0.3) for (let gz = z0 + d * 0.25; gz < z1; gz += d * 0.5) {
    rig.push(part(new THREE.BoxGeometry(18, 0.6, 0.6), '#2c2b44', gx, H - 3, gz - 9), part(new THREE.BoxGeometry(18, 0.6, 0.6), '#2c2b44', gx, H - 3, gz + 9));
    rig.push(part(new THREE.BoxGeometry(0.6, 0.6, 18), '#2c2b44', gx - 9, H - 3, gz), part(new THREE.BoxGeometry(0.6, 0.6, 18), '#2c2b44', gx + 9, H - 3, gz));
    for (const [ox, oz] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) spots.push({ x: gx + ox, z: gz + oz });
  }
  g.add(new THREE.Mesh(merge(rig), vcMat()));
  const discs = spots.map((p, i) => colorGeo(new THREE.CircleGeometry(0.9, 12).rotateX(Math.PI / 2).translate(p.x, H - 3.4, p.z), i % 2 ? th.neon[0] : th.neon[1]));
  g.add(new THREE.Mesh(merge(discs), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
  if (hi) {
    const cone = new THREE.ConeGeometry(7, H - 3.5, 16, 1, true);
    cone.translate(0, -(H - 3.5) / 2, 0);
    const cones = spots.map((p, i) => colorGeo(cone.clone().translate(p.x, H - 3.4, p.z), i % 2 ? '#1a5f78' : '#6a1a48'));
    const cm = new THREE.Mesh(merge(cones), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    g.add(cm);
  }
}

// ---------- Toy Room
function toyProps(g, tr, th, room, R, hi, clearAll, anim) {
  const { x0, x1, z0, z1, H, cx, cz, w, d } = room;
  // a big rug in the infield (under the course)
  const rug = canvasTex(256, 256, (x, W, Hh) => {
    x.fillStyle = '#5b8fd6'; x.fillRect(0, 0, W, Hh);
    const cs = ['#ffd23f', '#ff8fd0', '#ffffff', '#5ecb6b'];
    for (let r = 7; r >= 1; r--) { x.fillStyle = cs[r % cs.length]; x.globalAlpha = 0.9; x.beginPath(); x.ellipse(W / 2, Hh / 2, r * 17, r * 17, 0, 0, 7); x.fill(); }
    x.globalAlpha = 1; x.strokeStyle = '#2f5fa8'; x.lineWidth = 10; x.strokeRect(5, 5, W - 10, Hh - 10);
  });
  let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9;
  for (let i = 0; i < tr.N; i++) { mnx = Math.min(mnx, tr.PX[i]); mxx = Math.max(mxx, tr.PX[i]); mnz = Math.min(mnz, tr.PZ[i]); mxz = Math.max(mxz, tr.PZ[i]); }
  const rm = new THREE.Mesh(new THREE.PlaneGeometry((mxx - mnx) * 0.7, (mxz - mnz) * 0.62), new THREE.MeshLambertMaterial({ map: rug, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
  rm.rotation.x = -Math.PI / 2; rm.position.set((mnx + mxx) / 2, -0.03, (mnz + mxz) / 2); rm.receiveShadow = true;
  g.add(rm);
  // giant toy blocks with letters
  const letters = canvasTex(256, 256, (x, W, Hh) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, Hh);
    x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 18; x.strokeRect(9, 9, W - 18, Hh - 18);
    x.fillStyle = '#222'; x.font = 'bold 170px system-ui, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('A', W / 2, Hh / 2 + 10);
  });
  const blockMat = new THREE.MeshLambertMaterial({ map: letters });
  const blockGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const blocks = [];
  const bcol = ['#ff5a5a', '#ffd23f', '#3fa9ff', '#5ecb6b', '#a66bff', '#ff9f43'];
  for (let t = 0; t < 400 && blocks.length < 16; t++) {
    const x = x0 + 10 + R() * (w - 20), z = z0 + 10 + R() * (d - 20), sz = 5 + R() * 5;
    if (!clearAll(x, z, sz * 0.8 + 2)) continue;
    blocks.push({ x, z, s: sz, c: bcol[blocks.length % bcol.length], ry: R() * 0.6 });
  }
  const bm = new THREE.InstancedMesh(blockGeo, blockMat, Math.max(1, blocks.length));
  const o = new THREE.Object3D();
  blocks.forEach((b, i) => { o.position.set(b.x, -0.05, b.z); o.rotation.set(0, b.ry, 0); o.scale.setScalar(b.s); o.updateMatrix(); bm.setMatrixAt(i, o.matrix); bm.setColorAt(i, new THREE.Color(b.c)); });
  bm.count = blocks.length; bm.castShadow = hi; bm.receiveShadow = true;
  g.add(bm);
  // toy-train track crossing the start straight (rails + sleepers right across the room)
  const cs = 70;
  const cf = tr.frame(cs);
  const rails = [], sleepers = [];
  const dirx = cf.rx, dirz = cf.rz;
  for (let k = -260; k <= 260; k += 1.6) {
    const px = cf.x + dirx * k, pz = cf.z + dirz * k;
    if (px < x0 + 1 || px > x1 - 1 || pz < z0 + 1 || pz > z1 - 1) continue;
    sleepers.push(part(new THREE.BoxGeometry(3.2, 0.12, 0.6), '#8a5a3c', px, 0.1, pz, 0, Math.atan2(dirx, dirz) + Math.PI / 2));
  }
  for (const off of [-0.8, 0.8]) {
    for (let k = -260; k <= 260; k += 8) {
      const px = cf.x + dirx * k + cf.fx * off, pz = cf.z + dirz * k + cf.fz * off;
      if (px < x0 + 1 || px > x1 - 1 || pz < z0 + 1 || pz > z1 - 1) continue;
      rails.push(part(new THREE.BoxGeometry(0.22, 0.2, 8.05), '#c9ced8', px, 0.22, pz, 0, Math.atan2(dirx, dirz)));
    }
  }
  g.add(new THREE.Mesh(merge([...sleepers, ...rails]), vcMat({ polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
  // a toy train parked on the rails beside the course
  for (const k of [-1, 1]) {
    const ext = k > 0 ? cf.extR : cf.extL;
    const base = ext + 9;
    const px = cf.x + dirx * k * base, pz = cf.z + dirz * k * base;
    if (!clearAll(px, pz, 3)) continue;
    const ry = Math.atan2(dirx, dirz);
    const tp = [
      part(new THREE.BoxGeometry(2.6, 2.2, 4.2), '#e3342f', 0, 1.5, 0),
      part(new THREE.CylinderGeometry(1.1, 1.1, 3.2, 12), '#3fa9ff', 0, 1.8, 2.6, Math.PI / 2),
      part(new THREE.CylinderGeometry(0.4, 0.5, 1.4, 10), '#222', 0, 3.2, 3.6),
      part(new THREE.BoxGeometry(2.2, 1.6, 3.6), '#ffd23f', 0, 1.2, -4.6),
      part(new THREE.BoxGeometry(2.2, 1.6, 3.6), '#5ecb6b', 0, 1.2, -8.8),
    ];
    for (const z of [1.6, -0.8, -3.4, -5.8, -7.6, -10]) for (const x of [-1.3, 1.3]) tp.push(part(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 10), '#222', x, 0.55, z, 0, 0, Math.PI / 2));
    const m = new THREE.Mesh(merge(tp), vcMat());
    m.position.set(px, 0, pz); m.rotation.y = ry; m.castShadow = hi;
    g.add(m);
    break;
  }
  // giant sofa against the far wall, window with sunlight on the side wall
  const sofa = [
    part(new THREE.BoxGeometry(70, 9, 16), '#2f8f87', 0, 4.5, 0),
    part(new THREE.BoxGeometry(70, 16, 6), '#2a7f78', 0, 12, -5),
    part(new THREE.BoxGeometry(8, 13, 16), '#2a7f78', -39, 6.5, 0), part(new THREE.BoxGeometry(8, 13, 16), '#2a7f78', 39, 6.5, 0),
    part(new THREE.BoxGeometry(20, 4, 14), '#3aa69c', -22, 10.5, 0.5), part(new THREE.BoxGeometry(20, 4, 14), '#3aa69c', 0, 10.5, 0.5), part(new THREE.BoxGeometry(20, 4, 14), '#3aa69c', 22, 10.5, 0.5),
    part(new THREE.BoxGeometry(9, 9, 3), '#ffd23f', -26, 15, -1, 0.2), part(new THREE.BoxGeometry(9, 9, 3), '#ff8fd0', 24, 15, -1, -0.15),
  ];
  const sm = new THREE.Mesh(merge(sofa), vcMat());
  sm.position.set(cx, 0, z1 - 9); sm.rotation.y = Math.PI; sm.castShadow = hi; sm.receiveShadow = true;
  if (clearAll(cx, z1 - 9, 12)) g.add(sm);
  const winTex = canvasTex(256, 256, (x, W, Hh) => {
    const gr = x.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, '#bfe9ff'); gr.addColorStop(1, '#fff8dc'); x.fillStyle = gr; x.fillRect(0, 0, W, Hh);
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, 12); x.fillRect(0, Hh - 12, W, 12); x.fillRect(0, 0, 12, Hh); x.fillRect(W - 12, 0, 12, Hh); x.fillRect(W / 2 - 6, 0, 12, Hh); x.fillRect(0, Hh / 2 - 6, W, 12);
  });
  const ww = Math.min(54, d * 0.32), wh = 30;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ map: winTex }));
  win.position.set(x0 + 0.2, 10 + wh / 2, cz); win.rotation.y = Math.PI / 2;
  g.add(win);
  // sun shaft: a light volume from the window to a warm patch on the floor (additive, vertex-faded, no real light)
  const wy0 = 10, wy1 = 10 + wh, px0 = x0 + 0.4 + wy0 * 1.25, px1 = x0 + 0.4 + wy1 * 1.25;
  const sh = [], sc = [];
  const bright = new THREE.Color('#3a3020'), dim = new THREE.Color('#000000');
  const quadV = (a, b, c, d2, ca, cb) => { sh.push(...a, ...b, ...c, ...a, ...c, ...d2); sc.push(...ca, ...cb, ...cb, ...ca, ...cb, ...ca); };
  for (const zz of [[cz - ww / 2, cz + ww / 2]]) {
    const [za, zb] = zz;
    const B = bright.toArray(), D = dim.toArray();
    quadV([x0 + 0.4, wy1, za], [px1, 0.05, za], [px1, 0.05, zb], [x0 + 0.4, wy1, zb], B, D); // upper sheet
    quadV([x0 + 0.4, wy0, za], [px0, 0.05, za], [px0, 0.05, zb], [x0 + 0.4, wy0, zb], B, D); // lower sheet
  }
  const shg = new THREE.BufferGeometry();
  shg.setAttribute('position', new THREE.Float32BufferAttribute(sh, 3));
  shg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  g.add(new THREE.Mesh(shg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })));
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(px1 - px0, ww), new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  patch.rotation.x = -Math.PI / 2; patch.position.set((px0 + px1) / 2, 0.02, cz);
  g.add(patch);
  // a few more toys: a ball, crayons, a spinning top
  const toys = [];
  const put = (gen, rad) => { for (let t = 0; t < 80; t++) { const x = x0 + 8 + R() * (w - 16), z = z0 + 8 + R() * (d - 16); if (clearAll(x, z, rad)) { toys.push(gen(x, z)); return; } } };
  put((x, z) => part(new THREE.IcosahedronGeometry(4, 1), '#ff5a5a', x, 4, z), 6);
  put((x, z) => part(new THREE.IcosahedronGeometry(3, 1), '#3fa9ff', x, 3, z), 5);
  for (let k = 0; k < 4; k++) put((x, z) => part(new THREE.CylinderGeometry(0.7, 0.7, 12, 8), ['#ff5a5a', '#ffd23f', '#5ecb6b', '#a66bff'][k], x, 0.7, z, Math.PI / 2, R() * 3), 7);
  put((x, z) => merge([part(new THREE.ConeGeometry(3, 4, 12), '#ff9f43', x, 2, z, Math.PI), part(new THREE.CylinderGeometry(0.4, 0.4, 3, 8), '#222', x, 4.5, z)]), 5);
  if (toys.length) { const tm = new THREE.Mesh(merge(toys), vcMat()); tm.castShadow = hi; g.add(tm); }
  // ceiling lamp
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 10), new THREE.MeshBasicMaterial({ color: '#fff6d8' }));
  lamp.position.set(cx, H - 6, cz); g.add(lamp);
}
