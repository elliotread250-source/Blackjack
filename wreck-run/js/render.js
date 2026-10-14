// three.js view of Wreck Run. Static town geometry is merged; smashables are instanced per kind;
// people, animals and pickups are one mesh each; debris, smoke and skid marks come from pools.
import * as THREE from 'three';
import { N, PITCH, ROAD, WALK, SIZE, SMASH, RAMP_LEN, RAMP_H, ANIMALS } from './logic.js';

// ---------------------------------------------------------------- geometry helpers
const tmpC = new THREE.Color();
// Merge primitives into one vertex-coloured geometry. parts: [geometry, colour, matrix?]
function merge(parts) {
  let count = 0;
  const geos = parts.map(([g, c, m]) => {
    let x = g.index ? g.toNonIndexed() : g.clone();
    if (m) x.applyMatrix4(m);
    count += x.attributes.position.count;
    return [x, c];
  });
  const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), col = new Float32Array(count * 3);
  let o = 0;
  for (const [g, c] of geos) {
    pos.set(g.attributes.position.array, o * 3);
    g.computeVertexNormals();
    nor.set(g.attributes.normal.array, o * 3);
    tmpC.set(c);
    for (let i = 0; i < g.attributes.position.count; i++) col.set([tmpC.r, tmpC.g, tmpC.b], (o + i) * 3);
    o += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}
const M = (x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));
const box = (w, h, d, c, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) => [new THREE.BoxGeometry(w, h, d), c, M(x, y + h / 2, z, ry, rx, rz)];
const cyl = (rt, rb, h, c, x = 0, y = 0, z = 0, seg = 12, rx = 0, rz = 0) => [new THREE.CylinderGeometry(rt, rb, h, seg), c, M(x, y + h / 2, z, 0, rx, rz)];
const ball = (r, c, x = 0, y = 0, z = 0, sy = 1) => [new THREE.SphereGeometry(r, 12, 8), c, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(1, sy, 1))];
const ico = (r, c, x = 0, y = 0, z = 0) => [new THREE.IcosahedronGeometry(r, 0), c, M(x, y, z)];

// ---------------------------------------------------------------- canvas textures
function facadeTexture(style) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
  const g = cv.getContext('2d');
  const walls = ['#b5523b', '#d8c8a8', '#6a8aa8', '#4fa39a', '#e0b84a', '#9a9aa4'];
  const frames = ['#f2e2c8', '#8a7a5a', '#dfe8f0', '#f4f4ec', '#ffffff', '#5a5a64'];
  g.fillStyle = walls[style]; g.fillRect(0, 0, 128, 128);
  if (style === 0) { g.strokeStyle = 'rgba(80,20,10,.35)'; g.lineWidth = 1; for (let y = 0; y < 128; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); for (let x = (y / 8) % 2 * 8; x < 128; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 8); g.stroke(); } } }
  if (style === 2) { g.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 2, 128); }
  for (let y = 12; y < 128; y += 42) for (let x = 10; x < 128; x += 42) {
    g.fillStyle = frames[style]; g.fillRect(x - 3, y - 3, 28, 30);
    const lit = Math.random() < 0.3;
    const gr = g.createLinearGradient(x, y, x + 22, y + 24);
    gr.addColorStop(0, lit ? '#ffe9a8' : '#9cc4e4'); gr.addColorStop(1, lit ? '#ffc864' : '#3a5a7a');
    g.fillStyle = gr; g.fillRect(x, y, 22, 24);
    g.fillStyle = frames[style]; g.fillRect(x + 10, y, 2, 24); g.fillRect(x, y + 11, 22, 2);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 3, y + 27, 28, 3);
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function shopTexture() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = '#3a3a42'; g.fillRect(0, 0, 128, 64);
  const gr = g.createLinearGradient(0, 8, 0, 60); gr.addColorStop(0, '#bfe4ff'); gr.addColorStop(1, '#5a8ab0');
  g.fillStyle = gr; g.fillRect(6, 8, 74, 52);
  g.fillStyle = '#7a4a2a'; g.fillRect(90, 14, 30, 50); g.fillStyle = '#d8a84a'; g.fillRect(114, 38, 3, 3);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(10, 56); g.lineTo(40, 10); g.lineTo(50, 10); g.lineTo(20, 56); g.fill();
  const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function scaleBoxUV(geo, w, h, d, tw, th) {
  const uv = geo.attributes.uv;
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k, su = f < 2 ? d / tw : f > 3 ? w / tw : 0, sv = f < 2 || f > 3 ? h / th : 0;
    uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  }
}

// ---------------------------------------------------------------- models
const CAR_COLORS = { red: 0xe0262c, blue: 0x2a6ad8, lime: 0x7ad83a, gold: 0xf2b81a, pink: 0xff5aa8, black: 0x24242a };
export const CARS = Object.keys(CAR_COLORS);
function smashModel(kind) {
  switch (kind) {
    case 'cone': return [cyl(0.05, 0.32, 0.8, 0xff6a1a), cyl(0.18, 0.24, 0.14, 0xffffff, 0, 0.32), box(0.7, 0.06, 0.7, 0xff6a1a)];
    case 'barrel': return [cyl(0.45, 0.45, 1.1, 0xff6a1a, 0, 0, 0, 14), cyl(0.46, 0.46, 0.14, 0xffffff, 0, 0.3, 0, 14), cyl(0.46, 0.46, 0.14, 0xffffff, 0, 0.7, 0, 14)];
    case 'trashcan': return [cyl(0.4, 0.34, 0.95, 0x3a7a4a, 0, 0, 0, 14), cyl(0.44, 0.44, 0.1, 0x2a5a3a, 0, 0.95, 0, 14), box(0.2, 0.06, 0.06, 0x1d1d22, 0, 1.06)];
    case 'mailbox': return [box(0.15, 0.9, 0.15, 0x3a3a42), box(0.55, 0.45, 0.8, 0x2a5ad8, 0, 0.9), cyl(0.27, 0.27, 0.8, 0x2a5ad8, 0, 1.33, -0.4, 14, Math.PI / 2), box(0.05, 0.3, 0.12, 0xe8302a, 0.3, 1.25, 0.2)];
    case 'hydrant': return [cyl(0.22, 0.26, 0.75, 0xe0262c), ball(0.24, 0xe0262c, 0, 0.78), cyl(0.08, 0.08, 0.5, 0xd8b84a, 0, 0.42, 0, 8, 0, Math.PI / 2), cyl(0.3, 0.3, 0.08, 0xc01818)];
    case 'newsbox': return [box(0.6, 1.0, 0.5, 0xe8c43a, 0, 0.1), box(0.5, 0.3, 0.02, 0xbfe4ff, 0, 0.7, 0.26), box(0.05, 0.1, 0.05, 0x3a3a42, -0.25), box(0.05, 0.1, 0.05, 0x3a3a42, 0.25)];
    case 'meter': return [box(0.1, 1.0, 0.1, 0x6a6a72), box(0.28, 0.42, 0.22, 0x8a8a92, 0, 1.0), box(0.2, 0.12, 0.02, 0x3ad86a, 0, 1.2, 0.12)];
    case 'bench': return [box(1.8, 0.1, 0.5, 0x8a5a32, 0, 0.45), box(1.8, 0.5, 0.08, 0x8a5a32, 0, 0.55, -0.24), box(0.08, 0.45, 0.45, 0x2a2a30, -0.8), box(0.08, 0.45, 0.45, 0x2a2a30, 0.8)];
    case 'sign': return [box(0.08, 2.2, 0.08, 0x9a9aa4), [new THREE.CylinderGeometry(0.4, 0.4, 0.05, 8), 0xe0262c, M(0, 2.2, 0, 0, Math.PI / 2)], box(0.5, 0.12, 0.06, 0xffffff, 0, 2.14)];
    case 'planter': return [box(1.0, 0.6, 1.0, 0xb8a88a), ico(0.55, 0x3a9a3a, 0, 0.95), ball(0.15, 0xff5a8a, 0.25, 1.2, 0.2), ball(0.15, 0xffd23f, -0.2, 1.15, -0.2)];
    case 'crate': return [box(1.0, 1.0, 1.0, 0xb8864a), box(1.02, 0.12, 1.02, 0x8a5a2a, 0, 0.44), box(0.12, 1.02, 1.02, 0x8a5a2a)];
    case 'vending': return [box(1.2, 2.0, 0.8, 0xe0262c), box(0.75, 1.3, 0.02, 0x9cc4e4, -0.15, 0.5, 0.41), box(0.25, 0.6, 0.02, 0x2a2a30, 0.4, 0.9, 0.41)];
    case 'phonebooth': return [box(1.1, 2.5, 1.1, 0xc81818), box(0.8, 1.6, 0.02, 0xbfe4ff, 0, 0.6, 0.56), box(1.2, 0.2, 1.2, 0xa01010, 0, 2.5), box(0.9, 0.2, 0.02, 0xffffff, 0, 2.2, 0.56)];
    case 'fruitstand': return [box(2.2, 0.9, 1.0, 0x8a5a32), box(2.4, 0.08, 1.4, 0xff5a5a, 0, 2.0), box(0.08, 2.0, 0.08, 0x6a4a2a, -1.1, 0, -0.5), box(0.08, 2.0, 0.08, 0x6a4a2a, 1.1, 0, -0.5),
      ...[0xff3b3b, 0xff9a1f, 0xffe23a, 0x7ad83a].map((c, i) => ball(0.22, c, -0.75 + i * 0.5, 1.05, 0.1)), ball(0.2, 0x7ad83a, -0.5, 1.05, -0.25), ball(0.2, 0xff3b3b, 0.5, 1.05, -0.25)];
    case 'gnome': return [cyl(0.2, 0.25, 0.4, 0x2a6ad8), ball(0.17, 0xf0c49a, 0, 0.55), cyl(0.0, 0.2, 0.45, 0xe0262c, 0, 0.62), ball(0.13, 0xffffff, 0, 0.42, 0.1, 1.3)];
    case 'snowman': return [ball(0.65, 0xffffff, 0, 0.6), ball(0.45, 0xffffff, 0, 1.45), ball(0.32, 0xffffff, 0, 2.05), cyl(0.04, 0.08, 0.35, 0xff8a1d, 0, 2.05, 0.3, 8, Math.PI / 2), cyl(0.25, 0.25, 0.35, 0x1d1d22, 0, 2.3), box(0.7, 0.1, 0.12, 0xe0262c, 0, 1.75, 0.3)];
    case 'beachball': return [ball(0.5, 0xff3b3b, 0, 0.5), ball(0.505, 0xffffff, 0, 0.5, 0.35), ball(0.2, 0x2a6ad8, 0, 0.92)];
    case 'haybale': return [cyl(0.7, 0.7, 1.4, 0xe8c45a, 0, 0.7, -0.7, 14, Math.PI / 2), cyl(0.72, 0.72, 0.08, 0xc8a03a, 0, 0.66, 0, 14, Math.PI / 2)];
    case 'pumpkin': return [ball(0.48, 0xff8a1d, 0, 0.42, 0, 0.8), cyl(0.06, 0.08, 0.2, 0x3a7a2a, 0, 0.75)];
    case 'pinata': return [box(0.9, 0.6, 0.4, 0xff5aa8, 0, 0.9), box(0.25, 0.6, 0.25, 0xffd23f, 0.35, 1.3), box(0.15, 0.25, 0.15, 0x3ad8ff, 0.42, 1.9), box(0.12, 0.9, 0.12, 0x8a5a32, -0.3), box(0.12, 0.9, 0.12, 0x8a5a32, 0.3), box(0.6, 0.1, 0.42, 0x7ad83a, 0, 1.1)];
    case 'flamingo': return [box(0.04, 0.8, 0.04, 0x1d1d22), ball(0.25, 0xff7ab8, 0, 1.0, 0, 0.8), cyl(0.04, 0.05, 0.5, 0xff7ab8, 0.1, 1.1, 0, 6, 0, -0.3), ball(0.1, 0xff7ab8, 0.22, 1.6)];
    case 'dino': return [ball(1.0, 0x5ad86a, 0, 1.2, 0, 0.8), ball(0.55, 0x5ad86a, 0.9, 2.3), cyl(0.3, 0.4, 1.0, 0x5ad86a, 0.5, 1.4, 0, 8, 0, -0.5), cyl(0.15, 0.4, 1.2, 0x5ad86a, -1.1, 0.8, 0, 8, 0, 1.2),
      cyl(0.25, 0.25, 0.6, 0x4ac05a, -0.4), cyl(0.25, 0.25, 0.6, 0x4ac05a, 0.4), ball(0.08, 0x1d1d22, 1.2, 2.45, 0.3), ball(0.08, 0x1d1d22, 1.2, 2.45, -0.3)];
    case 'statue': return [box(1.6, 1.0, 1.6, 0xc8c4b8), box(1.3, 0.2, 1.3, 0xb8b4a8, 0, 1.0), cyl(0.3, 0.4, 1.6, 0x7aa898, 0, 1.2), ball(0.35, 0x7aa898, 0, 3.1), cyl(0.1, 0.1, 1.0, 0x7aa898, 0.4, 2.2, 0, 6, 0, -0.8)];
    case 'donut': return [box(0.2, 3.0, 0.2, 0x6a6a72), [new THREE.TorusGeometry(1.0, 0.42, 10, 20), 0xd8a05a, M(0, 3.9)], [new THREE.TorusGeometry(1.0, 0.3, 10, 20), 0xff7ab8, M(0, 3.9, 0.15)]];
    case 'tv': return [box(0.9, 0.7, 0.6, 0x3a3a42, 0, 0.3), box(0.7, 0.5, 0.02, 0x2a3a4a, 0, 0.4, 0.31), box(0.6, 0.3, 0.5, 0x8a5a32)];
    case 'piano': return [box(2.0, 1.3, 0.8, 0x1d1d22, 0, 0.3), box(1.8, 0.08, 0.3, 0xffffff, 0, 1.05, 0.5), box(0.12, 0.3, 0.6, 0x1d1d22, -0.9), box(0.12, 0.3, 0.6, 0x1d1d22, 0.9)];
  }
  return [box(0.6, 0.6, 0.6, 0xff00ff)];
}
const MAIN_COLORS = { cone: [0xff6a1a, 0xffffff], barrel: [0xff6a1a, 0xffffff], trashcan: [0x3a7a4a, 0x2a2a30], mailbox: [0x2a5ad8], hydrant: [0xe0262c], newsbox: [0xe8c43a], meter: [0x8a8a92], bench: [0x8a5a32], sign: [0xe0262c, 0x9a9aa4],
  planter: [0xb8a88a, 0x3a9a3a], crate: [0xb8864a], vending: [0xe0262c, 0x9cc4e4], phonebooth: [0xc81818, 0xbfe4ff], fruitstand: [0x8a5a32, 0xff3b3b, 0xffe23a, 0x7ad83a], gnome: [0x2a6ad8, 0xe0262c],
  snowman: [0xffffff], beachball: [0xff3b3b, 0xffffff, 0x2a6ad8], haybale: [0xe8c45a], pumpkin: [0xff8a1d], pinata: [0xff5aa8, 0xffd23f, 0x3ad8ff, 0x7ad83a], flamingo: [0xff7ab8], dino: [0x5ad86a],
  statue: [0x7aa898, 0xc8c4b8], donut: [0xd8a05a, 0xff7ab8], tv: [0x3a3a42, 0x8a5a32], piano: [0x1d1d22, 0xffffff] };

function personModel(kind, look) {
  const shirts = [0xe0262c, 0x2a6ad8, 0x3ad86a, 0xffd23f, 0xb85aff, 0xff8a1d], skins = [0xf0c49a, 0xc8905a, 0x8a5a3a, 0xf6d2b0, 0x6a4028, 0xe0b080];
  const shirt = shirts[look % 6], skin = skins[(look * 7) % 6], pants = [0x2f4a8a, 0x3a3a42, 0x6a4a2a][look % 3];
  if (kind === 'dog') return [box(0.35, 0.3, 0.8, 0xb8864a, 0, 0.3), box(0.3, 0.3, 0.35, 0xb8864a, 0, 0.55, 0.45), box(0.1, 0.15, 0.12, 0x6a4a2a, 0.12, 0.85, 0.45), box(0.1, 0.15, 0.12, 0x6a4a2a, -0.12, 0.85, 0.45),
    ...[[-0.12, -0.25], [0.12, -0.25], [-0.12, 0.25], [0.12, 0.25]].map(([x, z]) => box(0.08, 0.3, 0.08, 0x8a5a32, x, 0, z)), box(0.06, 0.06, 0.3, 0xb8864a, 0, 0.6, -0.5), box(0.12, 0.08, 0.1, 0x1d1d22, 0, 0.6, 0.66)];
  if (kind === 'cat') return [box(0.25, 0.25, 0.6, 0x5a5a64, 0, 0.22), box(0.25, 0.22, 0.25, 0x5a5a64, 0, 0.4, 0.32), box(0.07, 0.1, 0.05, 0x5a5a64, 0.08, 0.62, 0.32), box(0.07, 0.1, 0.05, 0x5a5a64, -0.08, 0.62, 0.32),
    ...[[-0.08, -0.2], [0.08, -0.2], [-0.08, 0.2], [0.08, 0.2]].map(([x, z]) => box(0.06, 0.22, 0.06, 0x4a4a54, x, 0, z)), box(0.05, 0.4, 0.05, 0x5a5a64, 0, 0.3, -0.32)];
  if (kind === 'duck') return [ball(0.22, 0xffffff, 0, 0.25, 0, 0.8), ball(0.13, 0x3a8a3a, 0, 0.5, 0.15), box(0.1, 0.05, 0.12, 0xff9a1f, 0, 0.47, 0.3), box(0.06, 0.12, 0.06, 0xff9a1f, 0.06), box(0.06, 0.12, 0.06, 0xff9a1f, -0.06)];
  if (kind === 'rabbit') return [ball(0.2, 0xd8c8b8, 0, 0.22, 0, 0.9), ball(0.13, 0xd8c8b8, 0, 0.42, 0.15), box(0.05, 0.25, 0.04, 0xd8c8b8, 0.05, 0.5, 0.12), box(0.05, 0.25, 0.04, 0xd8c8b8, -0.05, 0.5, 0.12), ball(0.06, 0xffffff, 0, 0.25, -0.2)];
  const P = [box(0.18, 0.8, 0.2, pants, -0.12), box(0.18, 0.8, 0.2, pants, 0.12), box(0.5, 0.65, 0.3, shirt, 0, 0.8), box(0.12, 0.6, 0.14, shirt, -0.32, 0.85), box(0.12, 0.6, 0.14, shirt, 0.32, 0.85),
    box(0.34, 0.34, 0.32, skin, 0, 1.47), box(0.36, 0.1, 0.34, [0x3a2414, 0x1d1d22, 0xd8a84a, 0x8a3a1a][look % 4], 0, 1.8), box(0.06, 0.06, 0.02, 0x1d1d22, -0.08, 1.62, 0.16), box(0.06, 0.06, 0.02, 0x1d1d22, 0.08, 1.62, 0.16)];
  if (kind === 'skater') P.push(box(0.3, 0.06, 0.9, 0xff5a3a, 0, -0.08), cyl(0.05, 0.05, 0.28, 0xffffff, 0, -0.14, 0.3, 8, 0, Math.PI / 2), cyl(0.05, 0.05, 0.28, 0xffffff, 0, -0.14, -0.3, 8, 0, Math.PI / 2), box(0.36, 0.14, 0.34, 0xe0262c, 0, 1.8));
  if (kind === 'cyclist') {
    const bike = [[new THREE.TorusGeometry(0.35, 0.04, 6, 16), 0x1d1d22, M(0, 0.35, 0.55, Math.PI / 2)], [new THREE.TorusGeometry(0.35, 0.04, 6, 16), 0x1d1d22, M(0, 0.35, -0.55, Math.PI / 2)],
      box(0.05, 0.05, 1.1, [0xe0262c, 0x2a6ad8, 0x3ad86a][look % 3], 0, 0.65), box(0.05, 0.4, 0.05, 0x9a9aa4, 0, 0.35, -0.2), box(0.5, 0.04, 0.04, 0x1d1d22, 0, 1.05, 0.45), box(0.2, 0.06, 0.25, 0x1d1d22, 0, 0.85, -0.25)];
    return [...bike, ...P.map(p => [p[0], p[1], p[2].clone().premultiply(M(0, 0.45, 0))]), ball(0.2, 0xffffff, 0, 2.3, 0, 0.7)];
  }
  return P;
}

function carModel(color) {
  const c = CAR_COLORS[color] || CAR_COLORS.red, dark = new THREE.Color(c).multiplyScalar(0.6).getHex();
  const body = merge([
    box(1.9, 0.5, 4.2, c, 0, 0.3),                                   // lower body
    box(1.86, 0.18, 4.1, dark, 0, 0.25),                             // side skirt shade
    box(1.7, 0.18, 1.35, c, 0, 0.8, 1.35, 0, -0.08),                 // bonnet
    box(1.6, 0.55, 1.8, c, 0, 0.8, -0.3),                            // cabin
    box(1.52, 0.46, 0.06, 0x1d2a3a, 0, 0.84, 0.62, 0, -0.5),         // windscreen
    box(1.52, 0.4, 0.06, 0x1d2a3a, 0, 0.86, -1.22, 0, 0.45),         // rear window
    box(0.04, 0.38, 1.4, 0x1d2a3a, 0.81, 0.86, -0.3), box(0.04, 0.38, 1.4, 0x1d2a3a, -0.81, 0.86, -0.3),
    box(1.7, 0.08, 1.6, dark, 0, 1.35, -0.3),                         // roof
    box(0.42, 0.16, 0.06, 0xfff6c8, 0.6, 0.55, 2.1), box(0.42, 0.16, 0.06, 0xfff6c8, -0.6, 0.55, 2.1),     // headlights
    box(0.8, 0.2, 0.05, 0x2a2a30, 0, 0.45, 2.11),                      // grille
    box(0.4, 0.14, 0.06, 0xff2a2a, 0.65, 0.58, -2.1), box(0.4, 0.14, 0.06, 0xff2a2a, -0.65, 0.58, -2.1),   // tail lights
    box(1.95, 0.16, 0.2, 0x2a2a30, 0, 0.22, 2.1), box(1.95, 0.16, 0.2, 0x2a2a30, 0, 0.22, -2.1),       // bumpers
    box(0.12, 0.1, 0.2, dark, 0.98, 0.95, 0.55), box(0.12, 0.1, 0.2, dark, -0.98, 0.95, 0.55),            // mirrors
    box(1.8, 0.06, 0.4, dark, 0, 1.25, -2.0), box(0.08, 0.3, 0.1, dark, 0.7, 0.95, -2.0), box(0.08, 0.3, 0.1, dark, -0.7, 0.95, -2.0), // spoiler
    box(1.0, 0.04, 2.5, 0xffffff, 0, 1.06, 0.6), box(0.25, 0.042, 4.25, 0xffffff, 0, 0.8, 0),           // racing stripes
    cyl(0.07, 0.07, 0.25, 0x6a6a72, 0.5, 0.2, -2.18, 8, Math.PI / 2),
  ]);
  const wheel = merge([[new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16), 0x1d1d22, M(0, 0, 0, 0, 0, Math.PI / 2)], [new THREE.CylinderGeometry(0.22, 0.22, 0.32, 10), 0xc8ccd4, M(0, 0, 0, 0, 0, Math.PI / 2)], box(0.33, 0.06, 0.42, 0x8a8e96, 0, -0.03)]);
  return { body, wheel };
}

// ---------------------------------------------------------------- the renderer
export class Renderer {
  constructor(canvas, run, opts = {}) {
    this.low = !!opts.low;
    this.carColor = opts.car || 'red';
    const r = this.gl = new THREE.WebGLRenderer({ canvas, antialias: !this.low, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(this.low ? 1.5 : 2, devicePixelRatio || 1));
    r.shadowMap.enabled = !this.low; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9fd8ff);
    this.scene.fog = new THREE.Fog(0xc8e8ff, 90, 230);
    this.camera = new THREE.PerspectiveCamera(65, 1, 0.3, 500);
    this.vmat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x7a8a6a, 1.4);
    const sun = this.sun = new THREE.DirectionalLight(0xfff0d8, 2.4);
    sun.castShadow = !this.low; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
    this.popups = opts.popups;
    this.build(run);
  }

  build(run) {
    this.run = run;
    const C = run.city, S = this.scene;
    S.clear();
    S.add(this.hemi, this.sun, this.sun.target);
    // ---- ground, roads, sidewalks, parks and plazas (merged)
    const G = [box(SIZE + 120, 0.2, SIZE + 120, 0x6a9a4a, SIZE / 2, -0.21, SIZE / 2)];
    for (let k = 0; k <= N; k++) {
      const p = k * PITCH;
      G.push(box(SIZE + ROAD, 0.02, ROAD, 0x3d4048, SIZE / 2, -0.02, p), box(ROAD, 0.02, SIZE + ROAD, 0x3d4048, p, -0.021, SIZE / 2));
      for (let d = 4; d < SIZE; d += 6) {
        const near = Math.abs(((d + PITCH / 2) % PITCH) - PITCH / 2) < ROAD / 2 + 1;
        if (near) continue;
        G.push(box(0.2, 0.01, 2.6, 0xf2f2ea, p, 0.0, d), box(2.6, 0.01, 0.2, 0xf2f2ea, d, 0.0, p));
      }
    }
    for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) {               // zebra crossings at each junction
      const x = a * PITCH, z = b * PITCH;
      for (let s = -ROAD / 2 + 0.8; s < ROAD / 2 - 0.5; s += 1.2) {
        G.push(box(0.6, 0.012, 2.4, 0xffffff, x + s, 0.0, z - ROAD / 2 - 1.4), box(0.6, 0.012, 2.4, 0xffffff, x + s, 0.0, z + ROAD / 2 + 1.4));
        G.push(box(2.4, 0.012, 0.6, 0xffffff, x - ROAD / 2 - 1.4, 0.0, z + s), box(2.4, 0.012, 0.6, 0xffffff, x + ROAD / 2 + 1.4, 0.0, z + s));
      }
    }
    for (const b of C.blocks) {
      const w = b.x1 - b.x0 + 2 * WALK, d = b.z1 - b.z0 + 2 * WALK, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
      G.push(box(w, 0.16, d, 0xc8c4bc, cx, -0.02, cz));                     // sidewalk slab with a curb
      G.push(box(w - 0.3, 0.02, d - 0.3, 0xb8b4ac, cx, 0.14, cz));
      if (b.type === 'park') {
        G.push(box(b.x1 - b.x0, 0.05, b.z1 - b.z0, 0x5aae4a, cx, 0.14, cz), box(2, 0.06, b.z1 - b.z0, 0xd8c8a0, cx, 0.15, cz), box(b.x1 - b.x0, 0.06, 2, 0xd8c8a0, cx, 0.15, cz));
        G.push(cyl(2.4, 2.6, 0.5, 0xb8b4ac, cx, 0.15, cz, 20), cyl(2.1, 2.1, 0.05, 0x5ab4e0, cx, 0.6, cz, 20), cyl(0.2, 0.3, 1.4, 0xb8b4ac, cx, 0.6, cz));
      } else if (b.type === 'plaza') {
        for (let x = b.x0; x < b.x1 - 0.1; x += 3) for (let z = b.z0; z < b.z1 - 0.1; z += 3) G.push(box(2.9, 0.03, 2.9, ((x + z) / 3) % 2 ? 0xd8d0c0 : 0xc8bca8, x + 1.5, 0.14, z + 1.5));
      }
    }
    const ground = new THREE.Mesh(merge(G), this.vmat); ground.receiveShadow = true; S.add(ground);
    // ---- buildings with window textures, shopfronts and rooftop clutter
    const facades = [0, 1, 2, 3, 4, 5].map(facadeTexture), roofMat = new THREE.MeshLambertMaterial({ color: 0x5a5a62 });
    const shopTex = shopTexture();
    const extras = [];
    for (const b of C.buildings) {
      const w = b.x1 - b.x0, d = b.z1 - b.z0, h = b.h;
      const geo = new THREE.BoxGeometry(w, h, d); scaleBoxUV(geo, w, h, d, 4.2, 4.2);
      const fm = new THREE.MeshLambertMaterial({ map: facades[b.style] });
      const m = new THREE.Mesh(geo, [fm, fm, roofMat, roofMat, fm, fm]);
      m.position.set((b.x0 + b.x1) / 2, h / 2, (b.z0 + b.z1) / 2); m.castShadow = true; m.receiveShadow = true;
      S.add(m);
      extras.push(box(w + 0.3, 0.4, d + 0.3, 0xd8d0c0, m.position.x, h, m.position.z));                 // parapet
      extras.push(box(2, 1.2, 1.6, 0x9aa0a8, m.position.x - w / 4, h, m.position.z), box(1.2, 0.8, 1.2, 0x8a9098, m.position.x + w / 5, h, m.position.z + d / 5));
      if (h > 18) extras.push(cyl(1.1, 1.1, 2.2, 0x8a5a32, m.position.x + w / 4, h + 1.4, m.position.z - d / 5, 10), box(0.15, 1.4, 0.15, 0x6a6a72, m.position.x + w / 4, h, m.position.z - d / 5));
      if (h > 24) extras.push(box(0.1, 5, 0.1, 0x9a9aa4, m.position.x, h, m.position.z), ball(0.25, 0xff2a2a, m.position.x, h + 5.1, m.position.z));
      if (b.shop) {
        // a shopfront and striped awning on the side facing the nearest road
        const sides = [[b.z0, 'n'], [b.z1, 's'], [b.x0, 'w'], [b.x1, 'e']];
        const near = sides.map(([v, k]) => [Math.abs(((v + PITCH / 2) % PITCH) - PITCH / 2) - ROAD / 2, k]).sort((a, c) => a[0] - c[0])[0][1];
        const along = near === 'n' || near === 's', len = Math.min(along ? w : d, 10) - 1;
        const sm = new THREE.Mesh(new THREE.PlaneGeometry(len, 3.2), new THREE.MeshLambertMaterial({ map: shopTex }));
        const off = 0.06, awn = [0xe0262c, 0x2a6ad8, 0x3ad86a, 0xffd23f, 0xb85aff][b.style % 5];
        if (near === 'n') { sm.position.set(m.position.x, 1.75, b.z0 - off); sm.rotation.y = Math.PI; }
        if (near === 's') { sm.position.set(m.position.x, 1.75, b.z1 + off); }
        if (near === 'w') { sm.position.set(b.x0 - off, 1.75, m.position.z); sm.rotation.y = -Math.PI / 2; }
        if (near === 'e') { sm.position.set(b.x1 + off, 1.75, m.position.z); sm.rotation.y = Math.PI / 2; }
        S.add(sm);
        const n = Math.max(2, Math.floor(len / 1.2));
        for (let i = 0; i < n; i++) {
          const t = -len / 2 + (i + 0.5) * len / n, cc = i % 2 ? 0xffffff : awn;
          if (near === 'n') extras.push(box(len / n, 0.12, 1.6, cc, m.position.x + t, 3.5, b.z0 - 0.8, 0, -0.3));
          if (near === 's') extras.push(box(len / n, 0.12, 1.6, cc, m.position.x + t, 3.5, b.z1 + 0.8, 0, 0.3));
          if (near === 'w') extras.push(box(1.6, 0.12, len / n, cc, b.x0 - 0.8, 3.5, m.position.z + t, 0, 0, 0.3));
          if (near === 'e') extras.push(box(1.6, 0.12, len / n, cc, b.x1 + 0.8, 3.5, m.position.z + t, 0, 0, -0.3));
        }
      }
    }
    // ---- trees, lamp posts, traffic lights
    for (const p of C.posts) {
      if (p.kind === 'tree') extras.push(cyl(0.22, 0.3, 2.2 * p.s, 0x7a5232, p.x, 0.15, p.z, 8), ico(1.6 * p.s, 0x3a9a3a, p.x, 3.2 * p.s, p.z), ico(1.2 * p.s, 0x4aae44, p.x + 0.6, 3.9 * p.s, p.z - 0.3), ico(1.0 * p.s, 0x2f8a34, p.x - 0.6, 3.6 * p.s, p.z + 0.5));
      else extras.push(cyl(0.1, 0.14, 5.5, 0x4a4a52, p.x, 0.15, p.z, 8), box(1.4, 0.12, 0.2, 0x4a4a52, p.x, 5.5, p.z), box(0.5, 0.18, 0.4, 0xfff2c0, p.x + 0.6, 5.35, p.z));
    }
    for (let a = 1; a < N; a++) for (let b = 1; b < N; b++) {
      const x = a * PITCH + ROAD / 2 + 0.8, z = b * PITCH - ROAD / 2 - 0.8;
      extras.push(cyl(0.1, 0.1, 3.4, 0x2a2a30, x, 0.15, z, 8), box(0.4, 1.1, 0.4, 0x2a2a30, x, 3.4, z), ball(0.13, 0xff2a2a, x, 4.25, z + 0.21), ball(0.13, 0xffc82a, x, 3.95, z + 0.21), ball(0.13, 0x2aff6a, x, 3.65, z + 0.21));
    }
    for (const rp of C.ramps) {
      const parts = [];
      for (let i = 0; i < 10; i++) {
        const t = (i + 0.5) / 10, along = -RAMP_LEN / 2 + t * RAMP_LEN, y = RAMP_H * Math.min(1, (1 - Math.abs(t - 0.5) * 2) * 1.0) ;
        parts.push(box(4.6, Math.max(0.1, y), RAMP_LEN / 10 + 0.02, i % 2 ? 0xffd23f : 0x2a2a30, 0, 0, along));
      }
      const g = merge(parts); g.applyMatrix4(M(rp.x, 0.15, rp.z, rp.dir));
      const m = new THREE.Mesh(g, this.vmat); m.castShadow = true; m.receiveShadow = true; S.add(m);
    }
    const ex = new THREE.Mesh(merge(extras), this.vmat); ex.castShadow = true; ex.receiveShadow = true; S.add(ex);
    // ---- smashables: one instanced mesh per kind
    this.inst = {};
    const byKind = {};
    for (const s of C.smash) (byKind[s.kind] ||= []).push(s);
    const mtx = new THREE.Matrix4();
    for (const [kind, list] of Object.entries(byKind)) {
      const im = new THREE.InstancedMesh(merge(smashModel(kind)), this.vmat, list.length);
      im.castShadow = true; im.receiveShadow = true;
      list.forEach((s, i) => { s._i = i; im.setMatrixAt(i, mtx.compose(new THREE.Vector3(s.x, 0.15, s.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.rot || 0, 0)), new THREE.Vector3(1, 1, 1))); });
      im.instanceMatrix.needsUpdate = true;
      S.add(im); this.inst[kind] = { im, list };
    }
    // ---- people and animals
    this.agentMeshes = C.agents.map(a => { const m = new THREE.Mesh(merge(personModel(a.kind, a.look || 0)), this.vmat); m.castShadow = true; S.add(m); return m; });
    const exc = document.createElement('canvas'); exc.width = exc.height = 64; const eg = exc.getContext('2d');
    eg.fillStyle = '#ffd23f'; eg.beginPath(); eg.arc(32, 32, 28, 0, 7); eg.fill(); eg.fillStyle = '#1d1d22'; eg.font = 'bold 44px Arial'; eg.textAlign = 'center'; eg.fillText('!', 32, 48);
    this.exMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(exc), depthTest: false });
    this.exSprites = C.agents.map(() => { const sp = new THREE.Sprite(this.exMat); sp.scale.set(0.9, 0.9, 1); sp.visible = false; S.add(sp); return sp; });
    // ---- pickups
    const star = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, rr = i % 2 ? 0.35 : 0.8; i ? star.lineTo(Math.sin(a) * rr, Math.cos(a) * rr) : star.moveTo(0, rr); }
    const pgeo = {
      star: merge([[new THREE.ExtrudeGeometry(star, { depth: 0.25, bevelEnabled: false }), 0xffd23f, M(0, 0, -0.12)]]),
      clock: merge([[new THREE.CylinderGeometry(0.6, 0.6, 0.2, 20), 0xffffff, M(0, 0, 0, 0, Math.PI / 2)], [new THREE.TorusGeometry(0.62, 0.08, 6, 20), 0x2a6ad8, M()], box(0.08, 0.45, 0.04, 0x1d1d22, 0, 0, 0.12), box(0.3, 0.07, 0.04, 0x1d1d22, 0.15, 0, 0.12)]),
      nitro: merge([cyl(0.35, 0.35, 1.1, 0x2a8aff, 0, -0.55, 0, 12), cyl(0.15, 0.15, 0.25, 0xc8ccd4, 0, 0.55), box(0.72, 0.3, 0.02, 0xffffff, 0, -0.1, 0.35)]),
    };
    this.pickMeshes = C.pickups.map(p => { const m = new THREE.Mesh(pgeo[p.kind], new THREE.MeshLambertMaterial({ vertexColors: true, emissive: p.kind === 'star' ? 0x664400 : 0x112244 })); S.add(m); return m; });
    // ---- the car
    this.carGroup = new THREE.Group(); S.add(this.carGroup);
    this.setCar(this.carColor);
    // ---- pools: debris, smoke, skid marks, sparks
    this.debris = Array.from({ length: 160 }, () => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial()); m.visible = false; m.castShadow = true; S.add(m); return { m, life: 0, v: new THREE.Vector3(), spin: new THREE.Vector3() }; });
    const sc = document.createElement('canvas'); sc.width = sc.height = 64; const sg = sc.getContext('2d'); const grd = sg.createRadialGradient(32, 32, 2, 32, 32, 30); grd.addColorStop(0, 'rgba(255,255,255,.9)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); sg.fillStyle = grd; sg.fillRect(0, 0, 64, 64);
    const smokeTex = new THREE.CanvasTexture(sc);
    this.smoke = Array.from({ length: 60 }, () => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, color: 0xdddddd })); sp.visible = false; S.add(sp); return { sp, life: 0, v: new THREE.Vector3() }; });
    this.skidGeo = new THREE.PlaneGeometry(0.3, 0.9).rotateX(-Math.PI / 2);
    this.skidMat = new THREE.MeshBasicMaterial({ color: 0x1d1d22, transparent: true, opacity: 0.5, depthWrite: false });
    this.skids = Array.from({ length: 300 }, () => { const m = new THREE.Mesh(this.skidGeo, this.skidMat); m.visible = false; S.add(m); return m; });
    this.skidI = 0; this.smokeAcc = 0; this.shake = 0;
    this.camPos = new THREE.Vector3(run.car.x, 6, run.car.z - 10); this.camLook = new THREE.Vector3();
    this.resize();
  }

  setCar(color) {
    this.carColor = color;
    const g = this.carGroup; g.clear();
    const { body, wheel } = carModel(color);
    this.carBody = new THREE.Mesh(body, this.vmat); this.carBody.castShadow = true; g.add(this.carBody);
    this.wheels = [[0.92, 1.35], [-0.92, 1.35], [0.92, -1.3], [-0.92, -1.3]].map(([x, z]) => { const w = new THREE.Group(), m = new THREE.Mesh(wheel, this.vmat); m.castShadow = true; w.add(m); w.position.set(x, 0.38, z); this.carBody.add(w); return w; });
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.4, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5ac8ff, transparent: true, opacity: 0.85 }));
    fl.position.set(0.5, 0.29, -2.85); this.flame = fl; this.carBody.add(fl);
    const lamp = new THREE.PointLight(0xffe8b0, 0, 18); lamp.position.set(0, 1, 3); this.carBody.add(lamp);
  }

  smashFx(e) {
    const cols = MAIN_COLORS[e.kind] || [0xffffff];
    const inst = this.inst[e.kind];
    if (inst) { const s = inst.list.find(o => o.id === e.id); if (s) { inst.im.setMatrixAt(s._i, new THREE.Matrix4().makeScale(0, 0, 0)); inst.im.instanceMatrix.needsUpdate = true; } }
    const n = 7 + Math.round((SMASH[e.kind]?.r || 0.5) * 6);
    for (let k = 0; k < n; k++) {
      const d = this.debris.find(x => x.life <= 0); if (!d) break;
      const sz = 0.15 + Math.random() * 0.35 * (SMASH[e.kind]?.r || 0.5) * 2;
      d.m.scale.set(sz, sz * (0.5 + Math.random()), sz); d.m.material.color.setHex(cols[k % cols.length]);
      d.m.position.set(e.x + (Math.random() - 0.5), 0.6 + Math.random(), e.z + (Math.random() - 0.5));
      d.v.set(e.vx * (0.5 + Math.random() * 0.6) + (Math.random() - 0.5) * 8, 4 + Math.random() * 7, e.vz * (0.5 + Math.random() * 0.6) + (Math.random() - 0.5) * 8);
      d.spin.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);
      d.life = 2.5 + Math.random(); d.m.visible = true;
    }
    this.puff(e.x, 0.8, e.z, 4, 0xffffff);
  }
  respawn(id) {
    for (const { im, list } of Object.values(this.inst)) {
      const s = list.find(o => o.id === id); if (!s) continue;
      im.setMatrixAt(s._i, new THREE.Matrix4().compose(new THREE.Vector3(s.x, 0.15, s.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.rot || 0, 0)), new THREE.Vector3(1, 1, 1)));
      im.instanceMatrix.needsUpdate = true;
    }
  }
  puff(x, y, z, n, color = 0xdddddd) {
    for (let k = 0; k < n; k++) {
      const s = this.smoke.find(q => q.life <= 0); if (!s) return;
      s.sp.position.set(x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.6); s.sp.material.color.setHex(color);
      s.v.set((Math.random() - 0.5) * 1.5, 1 + Math.random(), (Math.random() - 0.5) * 1.5); s.life = s.max = 0.9 + Math.random() * 0.6; s.sp.visible = true;
    }
  }

  update(dt, t, input = {}, attract = false) {
    const run = this.run, c = run.car, C = run.city;
    // car
    const g = this.carGroup;
    g.position.set(c.x, 0.15 + c.y, c.z);
    g.rotation.y = c.h;
    const fx = Math.sin(c.h), fz = Math.cos(c.h), vr = c.vx * Math.cos(c.h) - c.vz * Math.sin(c.h), vf = c.vx * fx + c.vz * fz;
    this.carBody.rotation.z += ((-vr * 0.02) - this.carBody.rotation.z) * Math.min(1, dt * 6);
    this.carBody.rotation.x += (((c.air ? -0.12 : 0) - (input.throttle || 0) * 0.025 * Math.min(1, Math.abs(vf) / 10)) - this.carBody.rotation.x) * Math.min(1, dt * 5);
    if (c.onRamp) this.carBody.rotation.x = -0.32;
    this.wheels.forEach((w, i) => { w.children[0].rotation.x += vf * dt / 0.38; if (i < 2) w.rotation.y = (c.steerVis || 0) * 0.45; });
    const boosting = input.boost && c.nitro > 0.01;
    this.flame.visible = boosting; this.flame.scale.set(1, 1, 0.7 + Math.random() * 0.6);
    // smoke and skid marks while sliding
    const sliding = !c.air && Math.abs(vr) > 3.5 && Math.hypot(c.vx, c.vz) > 10;
    if (sliding) {
      this.smokeAcc += dt * 30;
      for (const [x, z] of [[0.92, -1.3], [-0.92, -1.3]]) {
        const wx = c.x + Math.cos(c.h) * x + fx * z, wz = c.z - Math.sin(c.h) * x + fz * z;
        const m = this.skids[this.skidI++ % this.skids.length]; m.visible = true; m.position.set(wx, 0.17 + (this.skidI % 7) * 0.0005, wz); m.rotation.y = Math.atan2(c.vx, c.vz);
        if (this.smokeAcc > 1) { this.puff(wx, 0.4, wz, 1); }
      }
      if (this.smokeAcc > 1) this.smokeAcc = 0;
    }
    // smashables bob? no: static. Debris and smoke
    for (const d of this.debris) {
      if (d.life <= 0) continue;
      d.life -= dt; d.v.y -= 22 * dt; d.m.position.addScaledVector(d.v, dt);
      if (d.m.position.y < 0.2) { d.m.position.y = 0.2; d.v.y *= -0.3; d.v.x *= 0.7; d.v.z *= 0.7; d.spin.multiplyScalar(0.7); }
      d.m.rotation.x += d.spin.x * dt; d.m.rotation.y += d.spin.y * dt; d.m.rotation.z += d.spin.z * dt;
      if (d.life < 0.5) d.m.scale.multiplyScalar(1 - dt * 3);
      if (d.life <= 0) d.m.visible = false;
    }
    for (const s of this.smoke) {
      if (s.life <= 0) continue;
      s.life -= dt; s.sp.position.addScaledVector(s.v, dt);
      const k = s.life / s.max; s.sp.material.opacity = k * 0.6; s.sp.scale.setScalar(1 + (1 - k) * 2.5);
      if (s.life <= 0) s.sp.visible = false;
    }
    // people and animals
    C.agents.forEach((a, i) => {
      const m = this.agentMeshes[i], walk = a.kind !== 'cyclist' && a.kind !== 'skater';
      const hop = a.startle > 0 ? Math.abs(Math.sin(a.startle * 9)) * 0.5 : walk ? Math.abs(Math.sin(t * 8 + i)) * 0.06 : 0;
      m.position.set(a.x, 0.15 + hop, a.z); m.rotation.y = a.ang;
      if (ANIMALS.includes(a.kind) && a.startle > 0) m.rotation.y += Math.sin(t * 20) * 0.3;
      const ex = this.exSprites[i]; ex.visible = a.startle > 0; if (ex.visible) ex.position.set(a.x, ANIMALS.includes(a.kind) ? 1.4 : 2.6, a.z);
    });
    // pickups
    C.pickups.forEach((p, i) => { const m = this.pickMeshes[i]; m.visible = !p.taken; if (m.visible) { m.position.set(p.x, 1.4 + Math.sin(t * 3 + i) * 0.2, p.z); m.rotation.y = t * 2 + i; } });
    // camera: chase from behind the direction of travel, wider at speed
    const sp = Math.hypot(c.vx, c.vz);
    const dirx = sp > 3 ? c.vx / sp * 0.4 + fx * 0.6 : fx, dirz = sp > 3 ? c.vz / sp * 0.4 + fz * 0.6 : fz;
    const back = attract ? 13 : 9 + sp * 0.08, up = attract ? 7 : 4.2 + sp * 0.03;
    const want = new THREE.Vector3(c.x - dirx * back, up + c.y * 0.6, c.z - dirz * back);
    this.camPos.lerp(want, 1 - Math.exp(-dt * (attract ? 1 : 4.5)));
    this.camLook.set(c.x + dirx * 4, 1.2 + c.y * 0.8, c.z + dirz * 4);
    this.camera.position.copy(this.camPos);
    if (this.shake > 0) { this.shake -= dt; this.camera.position.x += (Math.random() - 0.5) * this.shake; this.camera.position.y += (Math.random() - 0.5) * this.shake; }
    this.camera.lookAt(this.camLook);
    const fov = 62 + Math.min(18, sp * 0.35) + (boosting ? 6 : 0);
    if (Math.abs(this.camera.fov - fov) > 0.1) { this.camera.fov += (fov - this.camera.fov) * Math.min(1, dt * 3); this.camera.updateProjectionMatrix(); }
    this.sun.position.set(c.x + 30, 60, c.z + 20); this.sun.target.position.set(c.x, 0, c.z);
    this.gl.render(this.scene, this.camera);
  }

  // screen position of a world point (for point pop-ups)
  project(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, behind: v.z > 1 };
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.gl.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
}
