// Everything visible is built in code from boxes and a few simple primitives: a geometry builder
// that merges thousands of boxes into one mesh per material, the decor (lamps, trees, cars...),
// the props you can carry, the bear trap, the camera and the neighbour himself.
import * as THREE from 'three';
import { TEX_SCALE } from './textures.js';

const tmpC = new THREE.Color();
const tmpV = new THREE.Vector3();
const tmpN = new THREE.Vector3();
const tmpM3 = new THREE.Matrix3();

// ---------------------------------------------------------------- geometry builder
export class GeoBuilder {
  constructor() { this.groups = new Map(); }
  grp(mat) {
    let g = this.groups.get(mat);
    if (!g) { g = { pos: [], nor: [], uv: [], col: [], idx: [], n: 0 }; this.groups.set(mat, g); }
    return g;
  }
  // 4 vertices (CCW from the front), normal, 4 uvs, 4 colours ([r,g,b] linear)
  quad(mat, v, n, uv, cols) {
    const g = this.grp(mat), s = g.n;
    for (let i = 0; i < 4; i++) {
      g.pos.push(v[i][0], v[i][1], v[i][2]); g.nor.push(n[0], n[1], n[2]);
      g.uv.push(uv[i][0], uv[i][1]);
      const c = cols[i] || cols[0]; g.col.push(c[0], c[1], c[2]);
    }
    g.idx.push(s, s + 1, s + 2, s, s + 2, s + 3);
    g.n += 4;
  }
  tri(mat, v, n, uv, col) {
    const g = this.grp(mat), s = g.n;
    for (let i = 0; i < 3; i++) { g.pos.push(v[i][0], v[i][1], v[i][2]); g.nor.push(n[0], n[1], n[2]); g.uv.push(uv[i][0], uv[i][1]); g.col.push(col[0], col[1], col[2]); }
    g.idx.push(s, s + 1, s + 2);
    g.n += 3;
  }
  // Axis-aligned box. mat: string or {px,nx,py,ny,pz,nz}; color: hex or per-face {face: hex}.
  // opts: { local: per-face 0..1 uvs, ao: darken the bottom of tall sides, skip: Set of faces }
  box(mat, x0, y0, z0, x1, y1, z1, color = 0xffffff, opts = {}) {
    const F = [
      ['px', [1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], p => [-p[2], p[1]]],
      ['nx', [-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], p => [p[2], p[1]]],
      ['py', [0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], p => [p[0], -p[2]]],
      ['ny', [0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], p => [p[0], p[2]]],
      ['pz', [0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], p => [p[0], p[1]]],
      ['nz', [0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], p => [-p[0], p[1]]],
    ];
    const LUV = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const tall = y1 - y0 > 0.9 && opts.ao !== false;
    for (const [face, n, v, uvf] of F) {
      if (opts.skip && opts.skip.has(face)) continue;
      const m = typeof mat === 'string' ? mat : (mat[face] || mat.all || 'trim');
      if (!m) continue;
      const hex = typeof color === 'number' ? color : (color[face] !== undefined ? color[face] : color.all !== undefined ? color.all : 0xffffff);
      tmpC.setHex(hex);
      const base = [tmpC.r, tmpC.g, tmpC.b];
      const sc = TEX_SCALE[m] || 1;
      const uv = opts.local ? LUV : v.map(p => { const q = uvf(p); return [q[0] / sc, q[1] / sc]; });
      let cols;
      if (tall && n[1] === 0) {
        const lo = opts.aoAmt || 0.72;
        cols = v.map(p => (p[1] <= y0 + 1e-6 ? [base[0] * lo, base[1] * lo, base[2] * lo] : base));
      } else cols = [base];
      this.quad(m, v, n, uv, cols);
    }
  }
  // append any three.js geometry (with its own uvs) transformed by matrix, in one colour
  geom(mat, geo, matrix, color = 0xffffff) {
    const g = this.grp(mat);
    const P = geo.attributes.position, Nn = geo.attributes.normal, U = geo.attributes.uv;
    tmpM3.getNormalMatrix(matrix);
    tmpC.setHex(color);
    const s = g.n;
    for (let i = 0; i < P.count; i++) {
      tmpV.fromBufferAttribute(P, i).applyMatrix4(matrix);
      tmpN.fromBufferAttribute(Nn, i).applyMatrix3(tmpM3).normalize();
      g.pos.push(tmpV.x, tmpV.y, tmpV.z); g.nor.push(tmpN.x, tmpN.y, tmpN.z);
      g.uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0);
      g.col.push(tmpC.r, tmpC.g, tmpC.b);
    }
    if (geo.index) for (let i = 0; i < geo.index.count; i++) g.idx.push(s + geo.index.getX(i));
    else for (let i = 0; i < P.count; i++) g.idx.push(s + i);
    g.n += P.count;
  }
  build(materials, opts = {}) {
    const group = new THREE.Group();
    for (const [mat, g] of this.groups) {
      if (!g.n) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(g.pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.nor, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uv, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(g.col, 3));
      geo.setIndex(g.n > 65535 ? new THREE.Uint32BufferAttribute(g.idx, 1) : new THREE.Uint16BufferAttribute(g.idx, 1));
      geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, materials[mat] || materials.trim);
      m.name = mat;
      const noShadow = mat === 'glass' || mat === 'emissive';
      m.castShadow = !!opts.shadows && !noShadow;
      m.receiveShadow = !!opts.shadows && !noShadow;
      m.matrixAutoUpdate = false;
      group.add(m);
    }
    return group;
  }
}

// ---------------------------------------------------------------- primitives
const M4 = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const S = new THREE.Vector3();
function mat(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  E.set(rx, ry, rz); Q.setFromEuler(E); S.set(sx, sy, sz); tmpV.set(x, y, z);
  return M4.clone().compose(tmpV, Q, S);
}
const GEO = {};
function geo(name) {
  if (GEO[name]) return GEO[name];
  let g;
  switch (name) {
    case 'sphere': g = new THREE.IcosahedronGeometry(1, 1); break;
    case 'sphere2': g = new THREE.IcosahedronGeometry(1, 2); break;
    case 'cyl': g = new THREE.CylinderGeometry(1, 1, 1, 10); break;
    case 'cyl6': g = new THREE.CylinderGeometry(1, 1, 1, 6); break;
    case 'cone': g = new THREE.ConeGeometry(1, 1, 8); break;
    case 'box': g = new THREE.BoxGeometry(1, 1, 1); break;
    case 'torus': g = new THREE.TorusGeometry(1, 0.12, 6, 14); break;
    case 'halfTorus': g = new THREE.TorusGeometry(1, 0.08, 5, 12, Math.PI); break;
    case 'plane': g = new THREE.PlaneGeometry(1, 1); break;
  }
  g.userData.shared = true;
  GEO[name] = g;
  return g;
}
export { geo as primGeo };

// rotate a local box (centered on cx,cz, at y) around y by ry: emitted as a transformed unit box
function rbox(B, m, cx, y0, cz, w, h, d, ry, color) {
  B.geom(m, geo('box'), mat(cx, y0 + h / 2, cz, 0, ry, 0, w, h, d), color);
}
function rbz(B, m, xz, y0, w, h, d, ry, color) { rbox(B, m, xz[0], y0, xz[1], w, h, d, ry, color); }
function local(ox, oz, ry) { const c = Math.cos(ry), s = Math.sin(ry); return (x, z) => [ox + x * c + z * s, oz - x * s + z * c]; }

// ---------------------------------------------------------------- decor
export function addDecor(B, d) {
  const ry = d.ry || 0, L = local(d.x, d.z, ry);
  const at = (x, z) => L(x, z);
  switch (d.t) {
    case 'streetlamp': {
      const [hx, hz] = at(0, -0.9);
      rbz(B, 'metal', at(0, -0.45), 4.45, 0.08, 0.08, 0.95, ry, 0x3a3d44);
      rbox(B, 'metal', hx, 4.2, hz, 0.36, 0.14, 0.5, ry, 0x2a2c33);
      rbox(B, 'emissive', hx, 4.14, hz, 0.28, 0.06, 0.4, ry, 0xffd99a);
      break;
    }
    case 'lamp': {
      B.geom('wood', geo('cyl'), mat(d.x, d.y + 0.2, d.z, 0, 0, 0, 0.06, 0.4, 0.06), 0x5a3a26);
      B.geom('emissive', geo('cone'), mat(d.x, d.y + 0.5, d.z, 0, 0, 0, 0.18, 0.25, 0.18), 0xffd9a0);
      break;
    }
    case 'standlamp': {
      B.geom('metal', geo('cyl'), mat(d.x, d.y + 0.8, d.z, 0, 0, 0, 0.03, 1.6, 0.03), 0x3a3030);
      B.geom('metal', geo('cyl'), mat(d.x, d.y + 0.02, d.z, 0, 0, 0, 0.18, 0.04, 0.18), 0x3a3030);
      B.geom('emissive', geo('cone'), mat(d.x, d.y + 1.72, d.z, 0, 0, 0, 0.28, 0.32, 0.28), 0xffcf8a);
      break;
    }
    case 'desklamp': {
      B.geom('metal', geo('cyl'), mat(d.x, d.y + 0.02, d.z, 0, 0, 0, 0.08, 0.04, 0.08), 0x2a5a3a);
      B.geom('metal', geo('cyl'), mat(d.x, d.y + 0.2, d.z, 0, 0, 0.3, 0.015, 0.36, 0.015), 0x2a5a3a);
      B.geom('emissive', geo('cone'), mat(d.x + 0.08, d.y + 0.38, d.z, 0, 0, 0.5, 0.1, 0.12, 0.1), 0xfff0b0);
      break;
    }
    case 'bulb': {
      if (d.hang) B.geom('metal', geo('cyl'), mat(d.x, d.y + 0.15, d.z, 0, 0, 0, 0.01, 0.3, 0.01), 0x222222);
      B.geom('emissive', geo('sphere'), mat(d.x, d.y - (d.hang ? 0.05 : 0), d.z, 0, 0, 0, 0.08, 0.1, 0.08), 0xfff1c0);
      break;
    }
    case 'chandelier': {
      B.geom('metal', geo('cyl'), mat(d.x, d.y, d.z, 0, 0, 0, 0.01, 0.3, 0.01), 0x6a5a3a);
      B.geom('metal', geo('torus'), mat(d.x, d.y - 0.2, d.z, Math.PI / 2, 0, 0, 0.35, 0.35, 0.35), 0x7a6a3a);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; B.geom('emissive', geo('sphere'), mat(d.x + Math.cos(a) * 0.35, d.y - 0.12, d.z + Math.sin(a) * 0.35, 0, 0, 0, 0.04, 0.06, 0.04), 0xffe0a0); }
      break;
    }
    case 'poster': rbox(B, 'paint', d.x, d.y - 0.45, d.z, 0.6, 0.9, 0.02, ry, d.c || 0x446688); rbz(B, 'paint', at(0, 0.012), d.y - 0.25, 0.4, 0.4, 0.01, ry, 0xf0e0b0); break;
    case 'portrait': {
      rbox(B, 'wood', d.x, d.y - 0.45, d.z, 0.7, 0.9, 0.05, ry, 0x6a4a1a);
      rbz(B, 'paint', at(0, 0.03), d.y - 0.37, 0.52, 0.74, 0.01, ry, 0x3a3a30);
      rbz(B, 'paint', at(0, 0.036), d.y - 0.12, 0.22, 0.26, 0.01, ry, 0xc9a080);  // a face
      rbz(B, 'paint', at(0, 0.04), d.y - 0.2, 0.2, 0.04, 0.01, ry, 0x1a1a1a);    // moustache
      break;
    }
    case 'corkboard': {
      rbox(B, 'wood', d.x, d.y - 0.5, d.z, 1.6, 1.0, 0.04, ry, 0xa07a4a);
      const pins = [[-0.5, 0.2], [0.1, 0.25], [0.5, -0.1], [-0.3, -0.25], [0.3, 0.3]];
      for (const [px, py] of pins) rbz(B, 'paint', at(px, -0.025), d.y + py - 0.12, 0.22, 0.22, 0.01, ry, 0xe8e0d0);
      for (let i = 0; i < pins.length - 1; i++) {
        const [ax, ay] = pins[i], [bx, by] = pins[i + 1];
        const len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax);
        const [cx, cz] = at((ax + bx) / 2, -0.035);
        B.geom('emissive', geo('box'), mat(cx, d.y + (ay + by) / 2, cz, 0, ry, ang, len, 0.012, 0.005), 0xb01818);
      }
      break;
    }
    case 'clock': {
      if (d.tall) { rbz(B, 'wood', at(0, 0.1), 0, 0.5, 1.95, 0.32, ry, 0x4a2e1e); B.geom('paint', geo('cyl'), mat(...vecAt(at(0, 0.27), d.y), Math.PI / 2, ry, 0, 0.17, 0.02, 0.17), 0xf0e8d0); break; }
      B.geom('paint', geo('cyl'), mat(...vecAt(at(0, 0.02), d.y), Math.PI / 2, ry, 0, 0.22, 0.03, 0.22), 0xf2ead8);
      break;
    }
    case 'hood': rbox(B, 'metal', d.x - 0.05, d.y, d.z, 0.5, 0.35, 0.9, 0, 0x8a8f96); break;
    case 'pots': B.geom('metal', geo('cyl'), mat(d.x - 0.2, d.y + 0.08, d.z + 0.2, 0, 0, 0, 0.14, 0.16, 0.14), 0x3a3a3a); B.geom('metal', geo('cyl'), mat(d.x - 0.2, d.y + 0.06, d.z - 0.25, 0, 0, 0, 0.12, 0.12, 0.12), 0x6a3a2a); break;
    case 'jars': for (let i = 0; i < 18; i++) { const x = d.x - 3.5 + i * 0.42, y = [0.95, 1.55][i % 2] + 0.12; B.geom('glass', geo('cyl'), mat(x, y, d.z, 0, 0, 0, 0.07, 0.24, 0.07), [0xc8e8a0, 0xe8c070, 0xd07050][i % 3]); } for (const y of [0.9, 1.5, 2.1]) rbox(B, 'wood', d.x, y - 0.03, d.z + 0.02, 7.6, 0.04, 0.5, 0, 0x6a4a2c); break;
    case 'tvscreen': rbox(B, 'emissive', d.x, d.y - 0.32, d.z, 1.2, 0.66, 0.01, 0, 0x9ab8d8); break;
    case 'coatrack': B.geom('wood', geo('cyl'), mat(d.x, d.y + 0.9, d.z, 0, 0, 0, 0.03, 1.8, 0.03), 0x4a2e1e); B.geom('fabric', geo('box'), mat(d.x, d.y + 1.3, d.z + 0.12, 0.1, 0, 0, 0.4, 0.8, 0.12), 0x3a4a3a); break;
    case 'mailbox': rbox(B, 'wood', d.x, 0, d.z, 0.1, 1.0, 0.1, ry, 0x5a3a26); rbox(B, 'metal', d.x, 1.0, d.z, 0.28, 0.24, 0.45, ry, d.c || 0x444); break;
    case 'sign': {
      rbox(B, 'wood', d.x, 0, d.z, 0.08, 1.1, 0.08, ry, 0x5a3a26);
      rbox(B, 'board', d.x, 0.85, d.z + 0.05, 0.9, 0.42, 0.04, ry, 0xd8cfb0);
      rbox(B, 'emissive', d.x, 1.0, d.z + 0.075, 0.7, 0.06, 0.01, ry, 0x7a1010);
      rbox(B, 'emissive', d.x, 0.9, d.z + 0.075, 0.55, 0.05, 0.01, ry, 0x7a1010);
      break;
    }
    case 'car': {
      const c = d.c || 0x37506e;
      rbox(B, 'paint', d.x, 0.28, d.z, 4.0, 0.62, 1.8, ry + Math.PI / 2, c);
      rbz(B, 'paint', at(0.0, -0.2), 0.9, 2.2, 0.5, 1.6, ry + Math.PI / 2, c);
      rbz(B, 'glass', at(0.0, -0.2), 0.92, 2.1, 0.46, 1.64, ry + Math.PI / 2, 0x9ac8e8);
      for (const [wx, wz] of [[-0.85, -1.3], [0.85, -1.3], [-0.85, 1.3], [0.85, 1.3]]) {
        const [cx, cz] = at(wz, wx);
        B.geom('metal', geo('cyl'), mat(cx, 0.32, cz, Math.PI / 2, ry + Math.PI / 2, 0, 0.32, 0.22, 0.32), 0x1a1a1a);
      }
      rbz(B, 'emissive', at(-2.0, 0.6), 0.55, 0.05, 0.14, 0.3, ry + Math.PI / 2, 0xffe8b0);
      rbz(B, 'emissive', at(-2.0, -0.6), 0.55, 0.05, 0.14, 0.3, ry + Math.PI / 2, 0xffe8b0);
      break;
    }
    case 'litwindow': {
      const w = d.small ? 0.6 : 1.1, h = d.small ? 0.8 : 1.2;
      rbox(B, 'trim', d.x, d.y - h / 2 - 0.06, d.z, w + 0.16, h + 0.12, 0.04, ry, 0xf0ead8);
      rbz(B, 'emissive', at(0, 0.025), d.y - h / 2, w, h, 0.01, ry, d.lit ? 0xffc870 : 0x2a3040);
      rbz(B, 'trim', at(0, 0.035), d.y - h / 2, 0.05, h, 0.01, ry, 0xf0ead8);
      break;
    }
    case 'logs': for (let i = 0; i < 9; i++) { const r = i % 3, row = (i / 3) | 0; B.geom('bark', geo('cyl6'), mat(d.x - 0.4 + r * 0.4, 0.2 + row * 0.38, d.z, Math.PI / 2, 0, 0, 0.19, 1.9, 0.19), 0x8a6040); } break;
    case 'pegboard': rbox(B, 'board', d.x, d.y - 0.5, d.z, 1.4, 0.9, 0.03, ry, 0xb89a70); for (let i = 0; i < 4; i++) rbz(B, 'metal', at(-0.45 + i * 0.3, 0.04), d.y - 0.4 + (i % 2) * 0.2, 0.05, 0.35, 0.03, ry, 0x666a70); break;
    case 'tires': for (let i = 0; i < 3; i++) B.geom('metal', geo('torus'), mat(d.x, 0.12 + i * 0.22, d.z, Math.PI / 2, 0, 0, 0.32, 0.32, 0.9), 0x1a1a1a); break;
    case 'cabbage': B.geom('hedge', geo('sphere'), mat(d.x, d.y + 0.12, d.z, 0, d.x, 0, 0.2, 0.15, 0.2), 0x7aa84a); break;
    case 'pumpkin': B.geom('paint', geo('sphere2'), mat(d.x, d.y + 0.15, d.z, 0, 0, 0, 0.24, 0.17, 0.24), 0xd8742a); B.geom('wood', geo('cyl'), mat(d.x, d.y + 0.33, d.z, 0, 0, 0, 0.025, 0.08, 0.025), 0x4a6a2a); break;
    case 'shovel': B.geom('wood', geo('cyl'), mat(d.x, 0.75, d.z, 0.1, 0, 0.12, 0.025, 1.3, 0.025), 0x8a6040); rbox(B, 'metal', d.x - 0.08, 0.02, d.z, 0.22, 0.28, 0.03, 0.2, 0x6a6e74); break;
    case 'tree': {
      const s = d.s || 1;
      const blobs = [[0, 0.6, 0, 1.9], [0.9, 0.2, 0.4, 1.4], [-0.8, 0.3, -0.5, 1.5], [0.2, 1.6, -0.2, 1.4], [-0.3, 0.1, 0.9, 1.3]];
      for (const [bx, by, bz, r] of blobs) B.geom('hedge', geo('sphere'), mat(d.x + bx * s, d.y + by * s, d.z + bz * s, by, bx, 0, r * s, r * s * 0.85, r * s), [0x3c5a2c, 0x45642f, 0x34502a][Math.abs((bx * 10) | 0) % 3]);
      break;
    }
    case 'doghouse': rbox(B, 'wood', d.x, 1.2, d.z, 1.7, 0.1, 1.5, 0, 0x6a2a22); rbox(B, 'emissive', d.x, 0.1, d.z + 0.71, 0.5, 0.6, 0.02, 0, 0x0a0606); break;
    case 'clothesline': {
      B.geom('metal', geo('cyl'), mat(d.x, d.y, d.z, 0, 0, Math.PI / 2, 0.008, 6, 0.008), 0xdddddd);
      const cl = [[-1.6, 0xd8d0c0, 0.6], [-0.6, 0x8a2a2a, 0.5], [0.5, 0xe6dfcc, 0.75], [1.5, 0x4a5a7a, 0.55]];
      for (const [x, c, h] of cl) B.geom('fabric', geo('box'), mat(d.x + x, d.y - h / 2, d.z, 0, 0.1, 0, 0.6, h, 0.02), c);
      break;
    }
    case 'rockinghorse': {
      rbox(B, 'wood', d.x, 0.35, d.z, 0.25, 0.3, 0.8, ry, 0xd8c8b0);
      rbz(B, 'wood', at(0, -0.4), 0.55, 0.18, 0.4, 0.22, ry, 0xd8c8b0);
      B.geom('wood', geo('halfTorus'), mat(d.x, 0.36, d.z, 0, Math.PI / 2 + ry, Math.PI, 0.5, 0.35, 1), 0x8a3a2a);
      rbz(B, 'emissive', at(0.06, -0.48), 0.65, 0.04, 0.04, 0.04, ry, 0x000000);
      break;
    }
    case 'blocks': for (let i = 0; i < 6; i++) { const a = i * 1.7; rbox(B, 'paint', d.x + Math.cos(a) * 0.5, d.y + (i > 3 ? 0.18 : 0), d.z + Math.sin(a) * 0.4, 0.18, 0.18, 0.18, a, [0xd84a4a, 0x4a7ad8, 0xe8c84a, 0x5ab85a][i % 4]); } break;
    case 'mobile': for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; B.geom('metal', geo('cyl'), mat(d.x + Math.cos(a) * 0.25, d.y - 0.2, d.z + Math.sin(a) * 0.25, 0, 0, 0, 0.004, 0.4, 0.004), 0x999999); B.geom('paint', geo('sphere'), mat(d.x + Math.cos(a) * 0.25, d.y - 0.42, d.z + Math.sin(a) * 0.25, 0, 0, 0, 0.06, 0.06, 0.06), [0xe8a0b0, 0xa0c0e8, 0xe8e0a0, 0xb0e8a0][i]); } break;
    case 'mannequin': {
      B.geom('paint', geo('cyl'), mat(d.x, d.y + 0.5, d.z, 0, 0, 0, 0.03, 1, 0.03), 0x3a3a3a);
      B.geom('fabric', geo('sphere'), mat(d.x, d.y + 1.3, d.z, 0, ry, 0, 0.22, 0.38, 0.15), 0xd8cdb8);
      B.geom('paint', geo('sphere'), mat(d.x, d.y + 1.82, d.z, 0, 0, 0, 0.11, 0.14, 0.11), 0xe6dccb);
      break;
    }
    case 'rockingchair': {
      rbox(B, 'wood', d.x, 0.42, d.z, 0.5, 0.06, 0.5, ry, 0x5a3a26);
      rbz(B, 'wood', at(0, 0.24), 0.45, 0.5, 0.75, 0.05, ry, 0x5a3a26);
      for (const s of [-0.22, 0.22]) B.geom('wood', geo('halfTorus'), mat(...vecAt(at(s, 0), d.y + 0.42), 0, ry + Math.PI / 2, Math.PI, 0.42, 0.42, 0.6), 0x4a2e1e);
      break;
    }
    case 'binoculars': for (const s of [-0.05, 0.05]) B.geom('metal', geo('cyl'), mat(d.x + s, d.y + 0.05, d.z, Math.PI / 2, 0, 0, 0.035, 0.14, 0.035), 0x222222); break;
    case 'dish': B.geom('metal', geo('sphere'), mat(d.x, d.y, d.z, -0.6, 0.4, 0, 0.5, 0.18, 0.5), 0xd8d8d0); B.geom('metal', geo('cyl'), mat(d.x, d.y - 0.4, d.z, 0, 0, 0, 0.03, 0.8, 0.03), 0x888888); break;
    case 'weathervane': B.geom('metal', geo('cyl'), mat(d.x, d.y + 0.5, d.z, 0, 0, 0, 0.02, 1, 0.02), 0x2a2a2a); rbox(B, 'metal', d.x, d.y + 0.9, d.z, 0.7, 0.04, 0.04, 0.6, 0x2a2a2a); B.geom('metal', geo('cone'), mat(d.x + 0.3, d.y + 1.0, d.z - 0.2, 0, 0.6, -Math.PI / 2, 0.06, 0.2, 0.02), 0x2a2a2a); break;
  }
}
function vecAt(xz, y) { return [xz[0], y, xz[1]]; }

// ---------------------------------------------------------------- roofs
// gable roof over [x0,x1]x[z0,z1] from height y, ridge h above, along x (or z); a spire is a pyramid
export function addRoof(B, r) {
  tmpC.setHex(r.tint); const rc = [tmpC.r, tmpC.g, tmpC.b];
  tmpC.setHex(r.gable); const gc = [tmpC.r, tmpC.g, tmpC.b];
  const sc = TEX_SCALE.shingle;
  if (r.spire) {
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, ap = [cx, r.y + r.h * 1.6, cz];
    const c = [[r.x0, r.y, r.z1], [r.x1, r.y, r.z1], [r.x1, r.y, r.z0], [r.x0, r.y, r.z0]];
    for (let i = 0; i < 4; i++) {
      const a = c[i], b = c[(i + 1) % 4];
      const n = new THREE.Vector3().subVectors(new THREE.Vector3(...b), new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...ap), new THREE.Vector3(...a))).normalize();
      B.tri('shingle', [a, b, ap], [n.x, n.y, n.z], [[0, 0], [3 / sc, 0], [1.5 / sc, 4 / sc]], rc);
    }
    return;
  }
  if (r.ridge === 'x') {
    const zm = (r.z0 + r.z1) / 2, yt = r.y + r.h, slope = Math.hypot(zm - r.z0, r.h);
    const n1 = new THREE.Vector3(0, zm - r.z0, r.h).normalize();   // +z facing slope
    B.quad('shingle', [[r.x0, r.y, r.z1], [r.x1, r.y, r.z1], [r.x1, yt, zm], [r.x0, yt, zm]], [0, n1.y, n1.z],
      [[r.x0 / sc, 0], [r.x1 / sc, 0], [r.x1 / sc, slope / sc], [r.x0 / sc, slope / sc]], [rc]);
    B.quad('shingle', [[r.x1, r.y, r.z0], [r.x0, r.y, r.z0], [r.x0, yt, zm], [r.x1, yt, zm]], [0, n1.y, -n1.z],
      [[r.x1 / sc, 0], [r.x0 / sc, 0], [r.x0 / sc, slope / sc], [r.x1 / sc, slope / sc]], [rc]);
    // gable ends (inset a little so they sit under the overhang)
    const gx0 = r.x0 + 0.45, gx1 = r.x1 - 0.45, gz0 = r.z0 + 0.5, gz1 = r.z1 - 0.5;
    const gy = r.y + 0.02, gt = r.y + r.h * ((zm - gz0) / (zm - r.z0));
    const ss = TEX_SCALE.siding;
    B.tri('siding', [[gx1, gy, gz1], [gx1, gy, gz0], [gx1, gt, zm]], [1, 0, 0], [[-gz1 / ss, gy / ss], [-gz0 / ss, gy / ss], [-zm / ss, gt / ss]], gc);
    B.tri('siding', [[gx0, gy, gz0], [gx0, gy, gz1], [gx0, gt, zm]], [-1, 0, 0], [[gz0 / ss, gy / ss], [gz1 / ss, gy / ss], [zm / ss, gt / ss]], gc);
    // fascia boards along the eaves
    B.box('trim', r.x0, r.y - 0.12, r.z1 - 0.04, r.x1, r.y + 0.02, r.z1 + 0.02, 0xf1ead8);
    B.box('trim', r.x0, r.y - 0.12, r.z0 - 0.02, r.x1, r.y + 0.02, r.z0 + 0.04, 0xf1ead8);
    // soffit
    B.quad('plaster', [[r.x0, r.y - 0.02, r.z0], [r.x1, r.y - 0.02, r.z0], [r.x1, r.y - 0.02, r.z1], [r.x0, r.y - 0.02, r.z1]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0.35, 0.3, 0.3]]);
  } else {
    const xm = (r.x0 + r.x1) / 2, yt = r.y + r.h, slope = Math.hypot(xm - r.x0, r.h);
    const n1 = new THREE.Vector3(xm - r.x0, r.h, 0).normalize();
    B.quad('shingle', [[r.x1, r.y, r.z1], [r.x1, r.y, r.z0], [xm, yt, r.z0], [xm, yt, r.z1]], [n1.x / 1, n1.y, 0], [[0, 0], [5 / sc, 0], [5 / sc, slope / sc], [0, slope / sc]], [rc]);
    B.quad('shingle', [[r.x0, r.y, r.z0], [r.x0, r.y, r.z1], [xm, yt, r.z1], [xm, yt, r.z0]], [-n1.x, n1.y, 0], [[0, 0], [5 / sc, 0], [5 / sc, slope / sc], [0, slope / sc]], [rc]);
    B.tri('siding', [[r.x0 + 0.4, r.y, r.z1 - 0.4], [r.x1 - 0.4, r.y, r.z1 - 0.4], [xm, yt - 0.3, r.z1 - 0.4]], [0, 0, 1], [[0, 0], [1, 0], [0.5, 1]], gc);
    B.tri('siding', [[r.x1 - 0.4, r.y, r.z0 + 0.4], [r.x0 + 0.4, r.y, r.z0 + 0.4], [xm, yt - 0.3, r.z0 + 0.4]], [0, 0, -1], [[0, 0], [1, 0], [0.5, 1]], gc);
  }
}

// ---------------------------------------------------------------- props
const LAMB = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
export function propMesh(type, tex) {
  const g = new THREE.Group();
  const add = (geometry, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const B = geo('box'), C = geo('cyl');
  switch (type) {
    case 'crate': add(B, LAMB(0xc89a62, { map: tex.crate }), 0, 0.35, 0, 0, 0, 0, 0.7, 0.7, 0.7); break;
    case 'crowbar': {
      const m = LAMB(0xb8262a);
      add(C, m, 0, 0.035, 0, 0, 0, Math.PI / 2, 0.022, 0.62, 0.022);
      add(C, m, 0.33, 0.07, 0, 0, 0, 0.6, 0.022, 0.14, 0.022);
      add(C, LAMB(0x6a6e74), -0.33, 0.03, 0, 0, 0, Math.PI / 2 + 0.3, 0.02, 0.1, 0.02);
      break;
    }
    case 'redkey': {
      const m = LAMB(0xe02424, { emissive: 0x500808 });
      add(geo('torus'), m, -0.06, 0.025, 0, Math.PI / 2, 0, 0, 0.045, 0.045, 0.045);
      add(B, m, 0.04, 0.02, 0, 0, 0, 0, 0.14, 0.022, 0.022);
      add(B, m, 0.09, 0.02, 0.018, 0, 0, 0, 0.02, 0.02, 0.04);
      add(B, m, 0.06, 0.02, 0.015, 0, 0, 0, 0.015, 0.02, 0.03);
      break;
    }
    case 'fuse': {
      add(C, LAMB(0xe8e0c8, { emissive: 0x1a1606 }), 0, 0.12, 0, 0, 0, 0, 0.045, 0.16, 0.045);
      add(C, LAMB(0xb0b4bc), 0, 0.025, 0, 0, 0, 0, 0.05, 0.05, 0.05);
      add(C, LAMB(0xb0b4bc), 0, 0.215, 0, 0, 0, 0, 0.05, 0.05, 0.05);
      break;
    }
    case 'can': add(C, LAMB(0xb8bcc4, { map: tex.metal }), 0, 0.09, 0, 0, 0, 0, 0.07, 0.18, 0.07); add(C, LAMB(0xc8402a), 0, 0.09, 0, 0, 0, 0, 0.072, 0.1, 0.072); break;
    case 'bottle': { const m = LAMB(0x2e7a3a, { transparent: true, opacity: 0.85 }); add(C, m, 0, 0.11, 0, 0, 0, 0, 0.045, 0.22, 0.045); add(C, m, 0, 0.26, 0, 0, 0, 0, 0.016, 0.1, 0.016); break; }
    case 'apple': add(geo('sphere'), LAMB(0xc8322a), 0, 0.06, 0, 0, 0, 0, 0.06, 0.06, 0.06); add(C, LAMB(0x4a3a20), 0, 0.125, 0, 0, 0, 0, 0.006, 0.03, 0.006); break;
    case 'vase': add(geo('sphere2'), LAMB(0x3a6a9a), 0, 0.14, 0, 0, 0, 0, 0.11, 0.14, 0.11); add(C, LAMB(0x3a6a9a), 0, 0.3, 0, 0, 0, 0, 0.05, 0.12, 0.05); break;
    case 'radio': add(B, LAMB(0x7a4a2a, { map: tex.wood }), 0, 0.12, 0, 0, 0, 0, 0.36, 0.24, 0.18); add(B, LAMB(0xd8c8a0, { map: tex.fabric }), -0.05, 0.12, 0.091, 0, 0, 0, 0.18, 0.16, 0.005); add(C, LAMB(0x222222), 0.12, 0.12, 0.092, Math.PI / 2, 0, 0, 0.025, 0.02, 0.025); break;
    case 'ball': add(geo('sphere2'), LAMB(0xd83a3a), 0, 0.11, 0, 0, 0, 0, 0.11, 0.11, 0.11); add(geo('torus'), LAMB(0xf0f0f0), 0, 0.11, 0, Math.PI / 2, 0, 0, 0.11, 0.11, 0.1); break;
    case 'book': add(B, LAMB([0x7a2a2a, 0x2a4a7a, 0x3a5a2a][(Math.random() * 3) | 0]), 0, 0.03, 0, 0, 0, 0, 0.24, 0.06, 0.18); add(B, LAMB(0xf0e8d0), 0.005, 0.03, 0, 0, 0, 0, 0.23, 0.05, 0.17); break;
    case 'paint': add(C, LAMB(0xd8d8d0, { map: tex.metal }), 0, 0.12, 0, 0, 0, 0, 0.11, 0.24, 0.11); add(C, LAMB(0x3a8ac8), 0, 0.245, 0, 0, 0, 0, 0.105, 0.012, 0.105); break;
    case 'plate': add(C, LAMB(0xf2f0ea), 0, 0.015, 0, 0, 0, 0, 0.12, 0.03, 0.12); break;
  }
  return g;
}

// ---------------------------------------------------------------- bear trap, camera
export function trapMesh() {
  const g = new THREE.Group();
  const steel = LAMB(0xa8acb4, { emissive: 0x181010 });
  const dark = LAMB(0x3a3a40);
  const base = new THREE.Mesh(geo('cyl'), dark); base.scale.set(0.16, 0.03, 0.16); base.position.y = 0.015; g.add(base);
  const plate = new THREE.Mesh(geo('cyl'), LAMB(0x9a7a3a)); plate.scale.set(0.08, 0.035, 0.08); plate.position.y = 0.02; g.add(plate);
  const jaws = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(0, 0.03, 0); g.add(pivot);
    const jaw = new THREE.Mesh(geo('halfTorus'), steel); jaw.scale.set(0.3, 0.3, 1.1); jaw.rotation.set(-Math.PI / 2, 0, s > 0 ? 0 : Math.PI); pivot.add(jaw);
    for (let k = 0; k < 6; k++) {
      const a = (k + 0.5) / 6 * Math.PI;
      const t = new THREE.Mesh(geo('cone'), steel); t.scale.set(0.025, 0.09, 0.025);
      t.position.set(Math.cos(a) * 0.29, 0.035, -Math.sin(a) * 0.29 * s);
      pivot.add(t);
    }
    pivot.userData.s = s;
    jaws.push(pivot);
  }
  for (const m of g.children) m.castShadow = true;
  g.userData.jaws = jaws;
  g.userData.steel = steel;
  return g;
}
export function setTrapState(g, armed, t) {
  for (const p of g.userData.jaws) p.rotation.x = armed ? 0 : p.userData.s * (Math.PI / 2 - 0.15) * Math.min(1, t * 8);
}

export function cameraMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo('box'), LAMB(0xe8e8e0)); body.scale.set(0.16, 0.14, 0.32); body.position.z = -0.12; g.add(body);
  const arm = new THREE.Mesh(geo('box'), LAMB(0x4a4a4a)); arm.scale.set(0.04, 0.04, 0.22); arm.position.set(0, 0.08, 0.06); g.add(arm);
  const lens = new THREE.Mesh(geo('cyl'), LAMB(0x111111)); lens.scale.set(0.05, 0.04, 0.05); lens.rotation.x = Math.PI / 2; lens.position.z = -0.3; g.add(lens);
  const led = new THREE.Mesh(geo('sphere'), new THREE.MeshBasicMaterial({ color: 0xff2020 })); led.scale.setScalar(0.022); led.position.set(0.05, 0.05, -0.28); g.add(led);
  const coneGeo = new THREE.ConeGeometry(Math.tan(37 * Math.PI / 180) * 9, 9, 18, 1, true);
  coneGeo.translate(0, -4.5, 0); coneGeo.rotateX(-Math.PI / 2);
  const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xff3a2a, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  cone.position.z = -0.3; g.add(cone);
  g.userData = { led, cone, body };
  return g;
}

// ---------------------------------------------------------------- the neighbour
// An original character: tall, bald with grey side tufts, a huge black moustache, bushy brows,
// round glasses, a mustard shirt with rolled sleeves and a long, stained butcher's apron.
export function buildNeighbour(tex) {
  const SKIN = 0xe0a882, SHIRT = 0xc59a34, APRON = 0xe8e0cc, TROUSER = 0x4a3a2c, BOOT = 0x241c18, HAIR = 0x9a9a96, MOUST = 0x1c1614;
  const mSkin = LAMB(SKIN), mShirt = LAMB(SHIRT, { map: tex.fabric }), mApron = LAMB(APRON, { map: tex.fabric }), mTrou = LAMB(TROUSER, { map: tex.fabric });
  const mBoot = LAMB(BOOT), mHair = LAMB(HAIR), mMoust = LAMB(MOUST), mBlack = LAMB(0x111111), mWhite = LAMB(0xf4f4f0), mStain = LAMB(0x7a2e1e), mGlass = LAMB(0x2a2a2a);
  const box = (parent, m, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geo('box'), m); mesh.scale.set(w, h, d); mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);              // bobs and leans
  const hips = new THREE.Group(); hips.position.y = 0.98; body.add(hips);
  // legs (pivot at the hip)
  const leg = s => {
    const p = new THREE.Group(); p.position.set(s * 0.15, 0, 0); hips.add(p);
    box(p, mTrou, 0.2, 0.86, 0.22, 0, -0.43, 0);
    box(p, mBoot, 0.22, 0.14, 0.34, 0, -0.91, -0.05);
    return p;
  };
  const legL = leg(-1), legR = leg(1);
  // torso
  const torso = new THREE.Group(); hips.add(torso);
  box(torso, mShirt, 0.62, 0.72, 0.38, 0, 0.36, 0);
  box(torso, mShirt, 0.58, 0.32, 0.46, 0, 0.18, -0.03);                 // belly
  box(torso, mApron, 0.54, 0.62, 0.04, 0, 0.32, -0.27);                 // bib + front
  const apronLow = box(hips, mApron, 0.6, 0.72, 0.04, 0, -0.34, -0.28); // hangs over the legs
  box(torso, mApron, 0.04, 0.5, 0.04, -0.2, 0.72, -0.15, 0.5); box(torso, mApron, 0.04, 0.5, 0.04, 0.2, 0.72, -0.15, 0.5);
  for (const [x, y, w, h] of [[-0.12, 0.25, 0.12, 0.08], [0.1, 0.42, 0.08, 0.14], [0.04, 0.1, 0.16, 0.06]]) box(torso, mStain, w, h, 0.01, x, y, -0.295);
  box(hips, mStain, 0.14, 0.1, 0.01, 0.14, -0.4, -0.305); box(hips, mStain, 0.08, 0.2, 0.01, -0.18, -0.55, -0.305);
  box(torso, mTrou, 0.64, 0.08, 0.4, 0, 0.0, 0);                         // belt line
  // arms (pivot at the shoulder)
  const arm = s => {
    const p = new THREE.Group(); p.position.set(s * 0.4, 0.66, 0); torso.add(p);
    box(p, mShirt, 0.19, 0.4, 0.2, 0, -0.18, 0);
    const fore = new THREE.Group(); fore.position.set(0, -0.38, 0); p.add(fore);
    box(fore, mSkin, 0.15, 0.36, 0.15, 0, -0.17, 0);
    box(fore, mSkin, 0.17, 0.16, 0.12, 0, -0.42, -0.02);                 // big hands
    return { p, fore };
  };
  const A = arm(-1), Bm = arm(1);
  // head
  const neck = new THREE.Group(); neck.position.set(0, 0.74, 0); torso.add(neck);
  box(neck, mSkin, 0.16, 0.12, 0.16, 0, 0.04, 0);
  const head = new THREE.Group(); head.position.set(0, 0.1, 0); neck.add(head);
  box(head, mSkin, 0.38, 0.42, 0.36, 0, 0.21, 0);
  box(head, mSkin, 0.4, 0.06, 0.38, 0, 0.43, 0);                          // bald dome
  box(head, mHair, 0.06, 0.16, 0.26, -0.21, 0.24, 0.04); box(head, mHair, 0.06, 0.16, 0.26, 0.21, 0.24, 0.04);
  box(head, mHair, 0.3, 0.14, 0.05, 0, 0.24, 0.19);
  box(head, mSkin, 0.06, 0.1, 0.06, -0.21, 0.2, -0.02); box(head, mSkin, 0.06, 0.1, 0.06, 0.21, 0.2, -0.02); // ears
  box(head, mSkin, 0.08, 0.12, 0.1, 0, 0.17, -0.22);                     // nose
  box(head, mMoust, 0.34, 0.08, 0.08, 0, 0.09, -0.2);                    // moustache
  box(head, mMoust, 0.1, 0.06, 0.06, -0.19, 0.06, -0.19, 0, 0, 0.6); box(head, mMoust, 0.1, 0.06, 0.06, 0.19, 0.06, -0.19, 0, 0, -0.6);
  box(head, mMoust, 0.13, 0.04, 0.05, -0.09, 0.32, -0.19, 0, 0, -0.15); box(head, mMoust, 0.13, 0.04, 0.05, 0.09, 0.32, -0.19, 0, 0, 0.15); // brows
  for (const s of [-1, 1]) {
    box(head, mWhite, 0.08, 0.06, 0.02, s * 0.085, 0.25, -0.185);
    box(head, mBlack, 0.035, 0.04, 0.02, s * 0.085, 0.25, -0.193);
    box(head, mGlass, 0.12, 0.012, 0.012, s * 0.085, 0.29, -0.2); box(head, mGlass, 0.12, 0.012, 0.012, s * 0.085, 0.21, -0.2);
    box(head, mGlass, 0.012, 0.09, 0.012, s * 0.145, 0.25, -0.2); box(head, mGlass, 0.012, 0.09, 0.012, s * 0.025, 0.25, -0.2);
  }
  const mouth = box(head, mBlack, 0.12, 0.02, 0.02, 0, 0.03, -0.185);
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { root, body, hips, torso, head, neck, legL, legR, armL: A.p, armR: Bm.p, foreL: A.fore, foreR: Bm.fore, mouth, apronLow };
}

export function animateNeighbour(N, ai, t, dt) {
  const anim = ai.anim, spd = ai.speed;
  const phase = (N.phase = (N.phase || 0) + dt * (anim === 'run' ? 11 : 6.5) * Math.max(0.4, Math.min(1.3, spd / 2)));
  let legA = 0, armA = 0, lean = 0, bob = 0, armLx = 0, armRx = 0, foreL = -0.15, foreR = -0.15, armLz = 0.08, armRz = -0.08, bend = 0, headX = 0, mouth = 0.02;
  const sw = Math.sin(phase);
  if (anim === 'walk' || (spd > 0.2 && anim !== 'run')) { legA = sw * 0.55; armA = -sw * 0.4; bob = Math.abs(Math.cos(phase)) * 0.04; }
  else if (anim === 'run') { legA = sw * 0.95; armA = -sw * 0.9; lean = 0.22; bob = Math.abs(Math.cos(phase)) * 0.08; foreL = foreR = -1.1; mouth = 0.06; }
  else if (anim === 'cook') { armLx = -1.0 + Math.sin(t * 5) * 0.12; armRx = -0.9; foreL = foreR = -0.7; armLz = 0.25 + Math.cos(t * 5) * 0.1; }
  else if (anim === 'dig') { bend = 0.55 + Math.sin(t * 2.2) * 0.12; armLx = armRx = -0.9 + Math.sin(t * 2.2) * 0.4; foreL = foreR = -0.3; }
  else if (anim === 'guard' || anim === 'stare') { armLx = armRx = -0.55; armLz = 0.75; armRz = -0.75; foreL = foreR = -1.6; headX = anim === 'stare' ? -0.05 : 0; }
  else if (anim === 'watch') { armLx = armRx = -0.1; headX = 0.05; }
  else if (anim === 'search') { armLx = -0.2; armRx = -0.35; foreR = -0.9; headX = Math.sin(t * 1.3) * 0.08; mouth = 0.04; }
  else if (anim === 'grab') { armLx = armRx = -1.55; armLz = 0.18; armRz = -0.18; foreL = foreR = -0.1; lean = 0.32; mouth = 0.1; }
  else if (anim === 'open') { armRx = -1.4; foreR = -0.2; lean = 0.1; }
  else if (anim === 'kick') { legA = Math.sin(t * 14) > 0 ? -1.1 : 0.2; armLx = 0.3; }
  else if (anim === 'stunned') { headX = Math.sin(t * 9) * 0.25; armLx = 0.3; armRx = -0.3; lean = -0.1; }
  else { bob = Math.sin(t * 1.8) * 0.008; armLx = Math.sin(t * 1.8) * 0.03; armRx = armLx; }
  const k = Math.min(1, dt * 12);
  const L = (o, p, v) => { o[p] += (v - o[p]) * k; };
  L(N.legL.rotation, 'x', legA); L(N.legR.rotation, 'x', -legA);
  if (anim === 'kick') N.legL.rotation.x = legA;
  L(N.armL.rotation, 'x', armLx + armA); L(N.armR.rotation, 'x', armRx - armA);
  L(N.armL.rotation, 'z', -armLz); L(N.armR.rotation, 'z', -armRz);
  L(N.foreL.rotation, 'x', foreL); L(N.foreR.rotation, 'x', foreR);
  L(N.torso.rotation, 'x', -(lean + bend));
  L(N.head.rotation, 'x', headX + bend * 0.4);
  N.head.rotation.y = ai.head || 0;
  N.body.position.y = bob;
  N.mouth.scale.y += (mouth - N.mouth.scale.y) * k;
  N.apronLow.rotation.x = -Math.abs(legA) * 0.25;
}

export function handMesh() {
  const g = new THREE.Group();
  const sleeve = new THREE.Mesh(geo('box'), LAMB(0x3d5a7a)); sleeve.scale.set(0.09, 0.09, 0.42); sleeve.position.set(0.06, -0.08, 0.22); g.add(sleeve);
  const hand = new THREE.Mesh(geo('box'), LAMB(0xe8b896)); hand.scale.set(0.075, 0.065, 0.1); hand.position.set(0.04, -0.035, -0.02); g.add(hand);
  return g;
}
