// Builds the visible world for a Track: road, kerbs, off-road, walls, terrain, sky and themed
// scenery (instanced). Everything is low-poly with vertex colours: a handful of draw calls.
import * as THREE from 'three';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';
import { SURF, SHOULDER } from './trackgen.js';
import { rng } from './data.js';

export const THEMES = {
  meadow: {
    skyTop: '#2f86e0', skyHorizon: '#cdeeff', fog: '#d6eeff', fogNear: 140, fogFar: 640,
    sun: '#fff4dc', sunI: 2.4, sunDir: [0.5, 0.85, 0.35], hemiSky: '#e6f4ff', hemiGround: '#6b8f3e', hemiI: 1.25,
    road: '#5d606b', roadAlt: '#61646f', line: '#ffffff', kerb: ['#e23b3b', '#f7f7f7'],
    off: { [SURF.GRASS]: '#69b84a', [SURF.SAND]: '#e6c27a', [SURF.DIRT]: '#a97a4f' },
    wall: ['#e04545', '#f4f4f4'], wallH: 1.1, ground: '#62ad46', ground2: '#7cc456', rock: '#8c8f86',
  },
  canyon: {
    skyTop: '#3d8fd8', skyHorizon: '#ffe2b8', fog: '#f4d6ae', fogNear: 160, fogFar: 700,
    sun: '#fff0d0', sunI: 2.6, sunDir: [-0.4, 0.8, 0.45], hemiSky: '#ffeccc', hemiGround: '#a8613a', hemiI: 1.2,
    road: '#6e6159', roadAlt: '#72655c', line: '#f6e7c8', kerb: ['#d9542b', '#f7efe0'],
    off: { [SURF.SAND]: '#e3b06c', [SURF.DIRT]: '#b7764a', [SURF.GRASS]: '#c9a15a' },
    wall: ['#9a5536', '#b8693f'], wallH: 1.3, ground: '#cf8a55', ground2: '#b8693f', rock: '#a65a38',
  },
  snow: {
    skyTop: '#5d8fd6', skyHorizon: '#e8f2ff', fog: '#e4eefa', fogNear: 110, fogFar: 560,
    sun: '#ffffff', sunI: 2.2, sunDir: [0.3, 0.7, -0.6], hemiSky: '#eef6ff', hemiGround: '#8aa0b8', hemiI: 1.35,
    road: '#646b78', roadAlt: '#687080', line: '#ffffff', kerb: ['#2f6fdc', '#f7f9ff'],
    off: { [SURF.SNOW]: '#f1f6fc', [SURF.DIRT]: '#9a8d84', [SURF.ICE]: '#bfe4fb' },
    wall: ['#dfe9f5', '#c7d6e8'], wallH: 1.2, ground: '#eef4fb', ground2: '#dce7f3', rock: '#7c8796', ice: '#bfe6ff',
  },
  city: {
    skyTop: '#070a1e', skyHorizon: '#3a2763', fog: '#241a45', fogNear: 90, fogFar: 520, night: true,
    sun: '#9fb4ff', sunI: 0.9, sunDir: [-0.3, 0.8, 0.4], hemiSky: '#8a8cff', hemiGround: '#3a2a55', hemiI: 1.5,
    road: '#2c2f3c', roadAlt: '#30333f', line: '#ffd23f', kerb: ['#ff3fa4', '#e8e8f4'],
    off: { [SURF.GRASS]: '#545a6e', [SURF.DIRT]: '#4d4560' },
    wall: ['#5b6075', '#4a4f62'], wallH: 1.1, neon: ['#20e3ff', '#ff3fa4'], ground: '#1d2030', ground2: '#262a3c', rock: '#3a3f52',
  },
  volcano: {
    skyTop: '#3b1e2e', skyHorizon: '#ff9a5a', fog: '#8a4a3a', fogNear: 120, fogFar: 600,
    sun: '#ffd0a0', sunI: 2.0, sunDir: [0.6, 0.6, -0.5], hemiSky: '#ffb08a', hemiGround: '#401a12', hemiI: 1.25,
    road: '#4b4548', roadAlt: '#504a4d', line: '#ffb347', kerb: ['#ffb000', '#2a2224'],
    off: { [SURF.LAVA]: '#ff5a12', [SURF.SAND]: '#4a3a36', [SURF.DIRT]: '#6a4a3a' },
    wall: ['#2e2628', '#3a3033'], wallH: 1.1, ground: '#3a2e2c', ground2: '#2a2120', rock: '#2f2729', lava: '#ff5a12',
  },
};

const tmpC = new THREE.Color();
function colorGeo(geo, hex) {
  const n = geo.attributes.position.count;
  const c = new Float32Array(n * 3);
  tmpC.set(hex);
  for (let i = 0; i < n; i++) { c[i * 3] = tmpC.r; c[i * 3 + 1] = tmpC.g; c[i * 3 + 2] = tmpC.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  if (geo.index) return geo.toNonIndexed();
  return geo;
}
function part(geo, hex, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  geo.rotateX(rx); geo.rotateY(ry); geo.rotateZ(rz);
  geo.scale(sx, sy, sz);
  geo.translate(x, y, z);
  if (geo.attributes.uv) geo.deleteAttribute('uv');
  return colorGeo(geo, hex);
}
const merge = parts => { const g = mergeGeometries(parts, false); g.computeVertexNormals(); return g; };

// ---------- geometry builder for ribbons (flat-shaded quads with per-quad colour)
class Builder {
  constructor() { this.p = []; this.c = []; }
  quad(a, b, c, d, col, col2) {
    // a-b-c-d counter-clockwise seen from the visible side
    const cc = col2 || col;
    this.p.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
    for (let i = 0; i < 3; i++) this.c.push(col.r, col.g, col.b);
    for (let i = 0; i < 3; i++) this.c.push(cc.r, cc.g, cc.b);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeVertexNormals();
    return g;
  }
}

function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  return t;
}

export function softTexture() {
  return canvasTex(64, 64, (x) => {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.65)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  });
}

// Spatial hash of centre-line samples for "how far from the track is this point"
class SampleGrid {
  constructor(tr, cell = 16) {
    this.tr = tr; this.cell = cell; this.map = new Map();
    for (let i = 0; i < tr.N; i++) {
      const k = this.key(Math.floor(tr.PX[i] / cell), Math.floor(tr.PZ[i] / cell));
      let a = this.map.get(k); if (!a) this.map.set(k, a = []); a.push(i);
    }
  }
  key(a, b) { return a * 100003 + b; }
  // nearest sample within `rad` metres (or -1)
  nearest(x, z, rad = 60, filter = null) {
    const c = this.cell, r = Math.ceil(rad / c), cx = Math.floor(x / c), cz = Math.floor(z / c);
    let best = -1, bd = rad * rad;
    for (let a = cx - r; a <= cx + r; a++) for (let b = cz - r; b <= cz + r; b++) {
      const arr = this.map.get(this.key(a, b)); if (!arr) continue;
      for (const i of arr) {
        if (filter && !filter(i)) continue;
        const dx = this.tr.PX[i] - x, dz = this.tr.PZ[i] - z, d2 = dx * dx + dz * dz;
        if (d2 < bd) { bd = d2; best = i; }
      }
    }
    return best;
  }
  // is (x,z) clear of the corridor by `margin`?
  clear(x, z, margin) {
    const tr = this.tr;
    const i = this.nearest(x, z, tr.maxExt + margin + 20);
    if (i < 0) return true;
    const dx = x - tr.PX[i], dz = z - tr.PZ[i];
    const d = dx * tr.RX[i] + dz * tr.RZ[i];
    const ext = d > 0 ? tr.EXT_R[i] : tr.EXT_L[i];
    return Math.hypot(dx, dz) > ext + margin;
  }
}

function noise2(x, z) {
  return Math.sin(x * 0.031 + Math.sin(z * 0.017) * 2) * 0.5 + Math.sin(z * 0.027 + x * 0.011) * 0.35 + Math.sin((x + z) * 0.063) * 0.15;
}

export function buildTrackScene(tr, quality = 'high') {
  const th = THEMES[tr.theme] || THEMES.meadow;
  const R = rng(tr.L * 1000 | 0);
  const root = new THREE.Group();
  const anim = [];
  const col = h => new THREE.Color(h);
  const lambertVC = new THREE.MeshLambertMaterial({ vertexColors: true });
  const grid = new SampleGrid(tr);

  // ---- rows of s for the ribbon (samples + ramp key points)
  const sl = [];
  for (let i = 0; i <= tr.N; i++) sl.push(i * tr.ds);
  for (const r of tr.ramps) { sl.push(r.lip - 0.02, r.lip + 0.02, r.lip - r.len, r.lip + r.gap + 0.02); for (let a = 1; a < 6; a++) sl.push(r.lip - r.len + (r.len * a) / 6); }
  const sList = [...new Set(sl.map(s => Math.max(0, Math.min(tr.L, s))))].sort((a, b) => a - b);
  const P = (s, d) => tr.pointAt(s >= tr.L ? s - 1e-3 : s, d);
  const lift = (p, y) => ({ x: p.x, y: p.y + y, z: p.z });
  const surfSide = (i, side) => (side > 0 ? tr.SOR[i] : tr.SOL[i]);
  const iOf = s => tr.idx(Math.min(tr.L - 1e-3, s));

  const road = new Builder(), off = new Builder(), kerb = new Builder(), wall = new Builder(), line = new Builder(), lava = new Builder();
  const cRoad = col(th.road), cRoad2 = col(th.roadAlt), cLine = col(th.line), cK1 = col(th.kerb[0]), cK2 = col(th.kerb[1]);
  const cW1 = col(th.wall[0]), cW2 = col(th.wall[1]);
  const cIce = col(th.ice || '#bfe6ff'), cShoulder = col('#2a2224');
  const offCol = sf => col(th.off[sf] || th.off[SURF.GRASS] || th.ground);
  const rampCol = [col('#ffd23f'), col('#2a2a33')];
  for (let n = 0; n < sList.length - 1; n++) {
    const s0 = sList[n], s1 = sList[n + 1];
    if (s1 - s0 < 1e-3) continue;
    const sm = (s0 + s1) / 2;
    const i = iOf(sm);
    if (tr.inPit(sm)) continue;
    const f0 = tr.frame(s0), f1 = tr.frame(s1);
    const hw0 = f0.hw, hw1 = f1.hw;
    const stripe = Math.floor(sm / 2.5) % 2;
    // road (2 lateral pieces so banking reads)
    let inRamp = null;
    for (const r of tr.ramps) { const x = sm - (r.lip - r.len); if (x >= 0 && x <= r.len) inRamp = r; }
    const rc = inRamp ? rampCol[Math.floor(sm / 1.5) % 2] : tr.SR[i] === SURF.ICE ? cIce : stripe ? cRoad : cRoad2;
    road.quad(P(s0, -hw0), P(s0, 0), P(s1, 0), P(s1, -hw1), rc);
    road.quad(P(s0, 0), P(s0, hw0), P(s1, hw1), P(s1, 0), rc);
    // centre dashes
    if (!inRamp && tr.SR[i] !== SURF.ICE && Math.floor(sm / 5) % 2 === 0) line.quad(lift(P(s0, -0.18), 0.02), lift(P(s0, 0.18), 0.02), lift(P(s1, 0.18), 0.02), lift(P(s1, -0.18), 0.02), cLine);
    // edge lines
    for (const side of [-1, 1]) {
      const a0 = side * (hw0 - 0.55), b0 = side * (hw0 - 0.3), a1 = side * (hw1 - 0.55), b1 = side * (hw1 - 0.3);
      if (!inRamp) line.quad(lift(P(s0, Math.min(a0, b0)), 0.02), lift(P(s0, Math.max(a0, b0)), 0.02), lift(P(s1, Math.max(a1, b1)), 0.02), lift(P(s1, Math.min(a1, b1)), 0.02), cLine);
    }
    for (const side of [-1, 1]) {
      const ext0 = side > 0 ? f0.extR : f0.extL, ext1 = side > 0 ? f1.extR : f1.extL;
      const curved = Math.abs(tr.K[i]) > 0.011;
      let d0 = hw0, d1 = hw1;
      // kerbs on corners
      if (curved && tr.LANE[i] !== side) {
        const c = Math.floor(sm / 2.5) % 2 ? cK1 : cK2;
        const k0 = Math.min(ext0, hw0 + 1.3), k1 = Math.min(ext1, hw1 + 1.3);
        if (side > 0) kerb.quad(lift(P(s0, d0), 0.03), lift(P(s0, k0), 0.1), lift(P(s1, k1), 0.1), lift(P(s1, d1), 0.03), c);
        else kerb.quad(lift(P(s0, -k0), 0.1), lift(P(s0, -d0), 0.03), lift(P(s1, -d1), 0.03), lift(P(s1, -k1), 0.1), c);
        d0 = k0; d1 = k1;
      }
      // off-road band
      const sf = tr.LANE[i] === side ? SURF.DIRT : surfSide(i, side);
      if (ext0 > d0 + 0.05) {
        if (sf === SURF.LAVA) {
          // rock shoulder, then glowing lava
          const m0 = Math.min(ext0, hw0 + SHOULDER), m1 = Math.min(ext1, hw1 + SHOULDER);
          const sq = (B, a0, b0, a1, b1, c, y = 0) => side > 0 ? B.quad(lift(P(s0, a0), y), lift(P(s0, b0), y), lift(P(s1, b1), y), lift(P(s1, a1), y), c) : B.quad(lift(P(s0, -b0), y), lift(P(s0, -a0), y), lift(P(s1, -a1), y), lift(P(s1, -b1), y), c);
          sq(off, d0, m0, d1, m1, cShoulder);
          const lc = col(th.lava).multiplyScalar(0.85 + 0.3 * R());
          sq(lava, m0, ext0, m1, ext1, lc, -0.15);
        } else {
          const c = offCol(sf).multiplyScalar(0.94 + 0.1 * R());
          const mid0 = (d0 + ext0) / 2, mid1 = (d1 + ext1) / 2;
          if (side > 0) { off.quad(P(s0, d0), P(s0, mid0), P(s1, mid1), P(s1, d1), c); off.quad(P(s0, mid0), P(s0, ext0), P(s1, ext1), P(s1, mid1), c); }
          else { off.quad(P(s0, -mid0), P(s0, -d0), P(s1, -d1), P(s1, -mid1), c); off.quad(P(s0, -ext0), P(s0, -mid0), P(s1, -mid1), P(s1, -ext1), c); }
        }
      }
      // wall
      const hasWall = side > 0 ? tr.WR[i] : tr.WL[i];
      if (hasWall) {
        const h = th.wallH;
        const a = P(s0, side * ext0), b = P(s1, side * ext1);
        const c = Math.floor(sm / 5) % 2 ? cW1 : cW2;
        const t = 0.5;
        const a2 = P(s0, side * (ext0 + t)), b2 = P(s1, side * (ext1 + t));
        if (side < 0) {
          wall.quad(a, b, lift(b, h), lift(a, h), c);
          wall.quad(lift(a, h), lift(b, h), lift(b2, h), lift(a2, h), c);
        } else {
          wall.quad(b, a, lift(a, h), lift(b, h), c);
          wall.quad(lift(b, h), lift(a, h), lift(a2, h), lift(b2, h), c);
        }
      }
    }
  }
  // dividers between road and shortcut lanes
  for (const dv of tr.dividers) {
    const c = col(th.wall[0]), c2 = col(th.wall[1]);
    for (let s = dv.s0; s < dv.s1; s += 2.5) {
      const s1 = Math.min(dv.s1, s + 2.5);
      const fa = tr.frame(s), fb = tr.frame(s1);
      const a0 = dv.side * fa.hw, a1 = dv.side * fb.hw, b0 = dv.side * (fa.hw + dv.div), b1 = dv.side * (fb.hw + dv.div);
      const h = 1.0;
      const cc = Math.floor(s / 5) % 2 ? c : c2;
      const lo0 = Math.min(a0, b0), hi0 = Math.max(a0, b0), lo1 = Math.min(a1, b1), hi1 = Math.max(a1, b1);
      wall.quad(lift(P(s, lo0), h), lift(P(s, hi0), h), lift(P(s1, hi1), h), lift(P(s1, lo1), h), cc);
      wall.quad(P(s1, lo1), P(s, lo0), lift(P(s, lo0), h), lift(P(s1, lo1), h), cc);
      wall.quad(P(s, hi0), P(s1, hi1), lift(P(s1, hi1), h), lift(P(s, hi0), h), cc);
    }
    // end caps
    for (const s of [dv.s0, dv.s1]) {
      const f = tr.frame(s);
      const lo = Math.min(dv.side * f.hw, dv.side * (f.hw + dv.div)), hi = Math.max(dv.side * f.hw, dv.side * (f.hw + dv.div));
      const h = 1.0;
      if (s === dv.s0) wall.quad(P(s, hi), P(s, lo), lift(P(s, lo), h), lift(P(s, hi), h), col(th.kerb[0]));
      else wall.quad(P(s, lo), P(s, hi), lift(P(s, hi), h), lift(P(s, lo), h), col(th.kerb[0]));
    }
  }
  const mk = (b, mat, shadow = true) => { const m = new THREE.Mesh(b.geometry(), mat); m.receiveShadow = shadow; return m; };
  const roadMesh = mk(road, lambertVC);
  const offMesh = mk(off, lambertVC);
  const kerbMesh = mk(kerb, lambertVC);
  const wallMesh = mk(wall, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); wallMesh.castShadow = quality === 'high';
  const lineMat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const lineMesh = mk(line, lineMat);
  root.add(roadMesh, offMesh, kerbMesh, wallMesh, lineMesh);
  if (lava.p.length) {
    const lm = new THREE.Mesh(lava.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true }));
    root.add(lm);
  }

  // ---- start line: chequered strip + gantry
  {
    const tex = canvasTex(128, 16, (x, w, h) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#fff'; x.fillRect(i * 8, j * 8, 8, 8); } });
    const f = tr.frame(0.01);
    const hw = f.hw;
    const geo = new THREE.PlaneGeometry(hw * 2, 1.6);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    m.rotation.order = 'YXZ';
    m.rotation.y = Math.atan2(f.fx, f.fz);
    m.rotation.x = -Math.PI / 2;
    m.position.set(f.x, f.y + 0.04, f.z);
    m.receiveShadow = true;
    root.add(m);
    // gantry
    const parts = [];
    const pc = tr.theme === 'city' ? '#2b2f45' : '#e8e8ee';
    const ph = 7.5;
    for (const side of [-1, 1]) {
      const p = tr.pointAt(0, side * ((side > 0 ? f.extR : f.extL) + 1.0));
      parts.push(part(new THREE.BoxGeometry(0.8, ph, 0.8), pc, p.x, p.y + ph / 2, p.z));
    }
    const g = new THREE.Mesh(merge(parts), lambertVC);
    g.castShadow = quality === 'high';
    root.add(g);
    const bannerTex = canvasTex(512, 64, (x, w, h) => {
      x.fillStyle = tr.theme === 'city' ? '#140d2e' : '#1d4fb8'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 64; i++) { x.fillStyle = i % 2 ? '#111' : '#fff'; x.fillRect(i * 8, 0, 8, 8); x.fillStyle = i % 2 ? '#fff' : '#111'; x.fillRect(i * 8, h - 8, 8, 8); }
      x.fillStyle = tr.theme === 'city' ? '#20e3ff' : '#fff'; x.font = 'bold 40px system-ui, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(tr.name.toUpperCase(), w / 2, h / 2 + 2);
    });
    const banner = new THREE.Mesh(new THREE.BoxGeometry(f.extL + f.extR + 2, 1.6, 0.4), new THREE.MeshLambertMaterial({ map: bannerTex, emissive: tr.theme === 'city' ? 0x333355 : 0x000000, emissiveMap: tr.theme === 'city' ? bannerTex : null }));
    { const mid = tr.pointAt(0, (f.extR - f.extL) / 2); banner.position.set(mid.x, f.y + ph - 0.6, mid.z); }
    banner.rotation.y = Math.atan2(f.fx, f.fz);
    root.add(banner);
  }

  // ---- boost pads (animated chevrons)
  const padTex = canvasTex(64, 128, (x, w, h) => {
    x.fillStyle = '#ff8a00'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ffe14d';
    for (let k = 0; k < 2; k++) { const y = k * 64; x.beginPath(); x.moveTo(6, y + 56); x.lineTo(32, y + 14); x.lineTo(58, y + 56); x.lineTo(46, y + 56); x.lineTo(32, y + 33); x.lineTo(18, y + 56); x.closePath(); x.fill(); }
  }, { repeat: true });
  const padMat = new THREE.MeshBasicMaterial({ map: padTex, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  for (const p of tr.pads) {
    const geo = new THREE.BufferGeometry();
    const pos = [], uv = [];
    const n = 4;
    for (let k = 0; k <= n; k++) {
      const s = p.s - p.len / 2 + (p.len * k) / n;
      const a = lift(P(s, p.d - p.w / 2), 0.05), c = lift(P(s, p.d + p.w / 2), 0.05);
      pos.push(a.x, a.y, a.z, c.x, c.y, c.z);
      uv.push(0, (k / n) * 1.5, 1, (k / n) * 1.5);
    }
    const idx = [];
    for (let k = 0; k < n; k++) { const a = k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, padMat);
    root.add(m);
  }
  anim.push((dt, t) => { padTex.offset.y = -(t * 2.2) % 1; });

  // ---- item boxes (instanced)
  const boxTex = canvasTex(64, 64, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#ff5f9e'); g.addColorStop(0.33, '#ffd23f'); g.addColorStop(0.66, '#3fe0ff'); g.addColorStop(1, '#8f6bff');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 5; x.strokeRect(3, 3, w - 6, h - 6);
    x.fillStyle = '#fff'; x.font = 'bold 42px system-ui, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = 'rgba(0,0,0,0.5)'; x.shadowBlur = 4; x.fillText('?', w / 2, h / 2 + 2);
  });
  const boxMat = new THREE.MeshLambertMaterial({ map: boxTex, transparent: true, opacity: 0.88, emissive: 0x332244 });
  const nBoxes = tr.boxRows.reduce((a, r) => a + r.ds.length, 0);
  const boxMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), boxMat, Math.max(1, nBoxes));
  boxMesh.castShadow = quality === 'high';
  root.add(boxMesh);

  // ---- terrain heightfield
  const terrain = buildTerrain(tr, th, grid, R, quality);
  root.add(terrain.mesh);
  if (terrain.extra) root.add(terrain.extra);

  // ---- sky + lights handled by the renderer, but the sky dome lives with the track
  const sky = buildSky(th);
  root.add(sky);

  // ---- scenery
  const scen = buildScenery(tr, th, grid, R, terrain.heightAt, quality, anim);
  root.add(scen);

  // obstacles (rocks / pillars on the course)
  if (tr.obstacles.length) {
    const parts = [];
    for (const o of tr.obstacles) {
      const g = new THREE.DodecahedronGeometry(o.r * 1.05, 0);
      parts.push(part(g, th.rock, o.x, o.y + o.r * 0.6, o.z, 0, R() * 3, 0, 1, 0.85, 1));
    }
    const m = new THREE.Mesh(merge(parts), lambertVC); m.castShadow = quality === 'high'; m.receiveShadow = true;
    root.add(m);
  }

  // minimap polyline
  let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9;
  for (let i = 0; i < tr.N; i++) { mnx = Math.min(mnx, tr.PX[i]); mxx = Math.max(mxx, tr.PX[i]); mnz = Math.min(mnz, tr.PZ[i]); mxz = Math.max(mxz, tr.PZ[i]); }

  return {
    group: root, theme: th, boxMesh, bounds: { mnx, mxx, mnz, mxz },
    update(dt, t) { for (const f of anim) f(dt, t); },
    dispose() {
      root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { if (m.map) m.map.dispose(); if (m.emissiveMap && m.emissiveMap !== m.map) m.emissiveMap.dispose(); m.dispose(); } } });
    },
  };
}

function buildSky(th) {
  const geo = new THREE.SphereGeometry(1400, 24, 14);
  const top = new THREE.Color(th.skyTop), hor = new THREE.Color(th.skyHorizon);
  const pos = geo.attributes.position;
  const c = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 1400;
    const t = Math.pow(Math.max(0, y), 0.55);
    const cc = hor.clone().lerp(top, t);
    if (y < 0) cc.copy(hor).multiplyScalar(0.92);
    c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -10;
  m.frustumCulled = false;
  m.name = 'sky';
  const g = new THREE.Group();
  g.add(m);
  if (th.night) {
    // stars
    const n = 700, p = new Float32Array(n * 3);
    const r = rng(77);
    for (let i = 0; i < n; i++) {
      const u = r() * Math.PI * 2, v = 0.08 + r() * 0.9;
      const y = Math.sin(v), rr = Math.cos(v);
      p[i * 3] = Math.cos(u) * rr * 1300; p[i * 3 + 1] = y * 1300; p[i * 3 + 2] = Math.sin(u) * rr * 1300;
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const st = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
    st.frustumCulled = false;
    g.add(st);
    // moon
    const moon = new THREE.Mesh(new THREE.CircleGeometry(40, 24), new THREE.MeshBasicMaterial({ color: 0xfff6dd, fog: false }));
    moon.position.set(-500, 600, -900); moon.lookAt(0, 0, 0);
    g.add(moon);
  } else {
    const sun = new THREE.Mesh(new THREE.CircleGeometry(55, 24), new THREE.MeshBasicMaterial({ color: 0xfffbe8, fog: false, transparent: true, opacity: 0.9 }));
    const d = new THREE.Vector3(...th.sunDir).normalize().multiplyScalar(1250);
    sun.position.copy(d); sun.lookAt(0, 0, 0);
    g.add(sun);
  }
  g.name = 'skygroup';
  return g;
}

// Terrain: grid heightfield. Near the corridor it sits just under the road; further out it
// blends into the theme's own landscape (hills, canyon plateau, mountains, volcano and lava sea).
function buildTerrain(tr, th, grid, R, quality) {
  const b = { mnx: 1e9, mxx: -1e9, mnz: 1e9, mxz: -1e9 };
  for (let i = 0; i < tr.N; i++) { b.mnx = Math.min(b.mnx, tr.PX[i]); b.mxx = Math.max(b.mxx, tr.PX[i]); b.mnz = Math.min(b.mnz, tr.PZ[i]); b.mxz = Math.max(b.mxz, tr.PZ[i]); }
  const M = tr.theme === 'city' ? 120 : 260;
  const cell = quality === 'high' ? 7 : 9.5;
  const x0 = b.mnx - M, z0 = b.mnz - M;
  const nx = Math.ceil((b.mxx + M - x0) / cell), nz = Math.ceil((b.mxz + M - z0) / cell);
  const x1 = x0 + nx * cell, z1 = z0 + nz * cell;
  const cxm = (b.mnx + b.mxx) / 2, czm = (b.mnz + b.mxz) / 2;
  const heights = new Float32Array((nx + 1) * (nz + 1));
  const kinds = new Uint8Array((nx + 1) * (nz + 1)); // 0 ground, 1 rock/steep, 2 under-road
  const themeH = (x, z) => {
    switch (tr.theme) {
      case 'meadow': return 3 + noise2(x, z) * 7 + Math.sin(x * 0.013) * 4;
      case 'canyon': return 24 + noise2(x * 1.3, z * 1.3) * 5;
      case 'snow': { const r = Math.hypot(x - cxm, z - czm); return 6 + noise2(x, z) * 10 + Math.max(0, r - 160) * 0.25; }
      case 'city': return 0;
      case 'volcano': { const r = Math.hypot(x - cxm, z - czm); return r < 110 ? 18 + 50 * Math.pow(1 - r / 110, 1.4) : 18 - (r - 110) * 0.3; }
    }
    return 0;
  };
  const sea = tr.theme === 'volcano' ? -5 : -1e9;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + i * cell, z = z0 + j * cell;
    const k = j * (nx + 1) + i;
    let h;
    const n = grid.nearest(x, z, 120);
    if (n < 0) { h = themeH(x, z); kinds[k] = 0; }
    else {
      const dx = x - tr.PX[n], dz = z - tr.PZ[n];
      const d = dx * tr.RX[n] + dz * tr.RZ[n];
      const side = d > 0 ? 1 : -1;
      const ext = side > 0 ? tr.EXT_R[n] : tr.EXT_L[n];
      const dist = Math.hypot(dx, dz);
      const e = dist - ext;
      const ty = tr.PY[n] + tr.yOffset(tr.S[n]);
      const wall = side > 0 ? tr.WR[n] : tr.WL[n];
      if (tr.theme === 'city') { h = Math.min(0, ty - 0.6); kinds[k] = e < 0 ? 2 : 0; }
      else if (e < 1.5) {
        h = ty - (e < 0 ? 0.9 : 0.6);
        if (tr.inPit(tr.S[n])) h = ty - 28;
        kinds[k] = 2;
      } else if (!wall) {
        h = ty - 1.5 - e * 1.2; kinds[k] = 1;
      } else {
        const fall = tr.theme === 'canyon' ? 14 : tr.theme === 'volcano' ? 22 : 38;
        const w = Math.min(1, e / fall);
        const ww = w * w * (3 - 2 * w);
        let target = themeH(x, z);
        if (tr.theme === 'volcano') {
          // outside of the island ring: drop to the lava sea
          const rp = Math.hypot(x - cxm, z - czm), rt = Math.hypot(tr.PX[n] - cxm, tr.PZ[n] - czm);
          if (rp > rt) target = sea - 2;
        }
        if (tr.theme === 'canyon') target = Math.max(target, ty + 10);
        h = ty - 0.6 + (target - (ty - 0.6)) * ww;
        kinds[k] = Math.abs(target - ty) * ww > 6 && tr.theme !== 'meadow' ? 1 : 0;
      }
    }
    if (tr.theme === 'volcano') h = Math.max(h, sea - 3);
    heights[k] = h;
  }
  // geometry
  const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cG = new THREE.Color(th.ground), cG2 = new THREE.Color(th.ground2), cRk = new THREE.Color(th.rock), cc = new THREE.Color();
  for (let v = 0; v < pos.count; v++) {
    // PlaneGeometry after rotateX: rows go from z0 (top) ... mapping by position
    const x = pos.getX(v) + (x0 + x1) / 2, z = pos.getZ(v) + (z0 + z1) / 2;
    const i = Math.round((x - x0) / cell), j = Math.round((z - z0) / cell);
    const k = Math.max(0, Math.min(heights.length - 1, j * (nx + 1) + i));
    pos.setXYZ(v, x, heights[k], z);
    const t = 0.5 + 0.5 * noise2(x * 2.1, z * 2.1);
    cc.copy(cG).lerp(cG2, t);
    if (kinds[k] === 1) cc.lerp(cRk, 0.75);
    if (tr.theme === 'snow' && heights[k] > 14) cc.lerp(new THREE.Color('#ffffff'), 0.4);
    if (tr.theme === 'canyon') cc.lerp(cRk, Math.max(0, Math.min(1, (heights[k] - 6) / 18)) * 0.6 + 0.08 * Math.sin(heights[k] * 1.7));
    if (tr.theme === 'volcano' && heights[k] < sea + 0.5) cc.set('#ff5a12');
    colors[v * 3] = cc.r; colors[v * 3 + 1] = cc.g; colors[v * 3 + 2] = cc.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const ng = geo.toNonIndexed();
  ng.computeVertexNormals();
  const mesh = new THREE.Mesh(ng, new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  let extra = null;
  if (tr.theme === 'volcano') {
    const lavaSea = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 1, 1), new THREE.MeshBasicMaterial({ color: '#ff4a0a' }));
    lavaSea.rotation.x = -Math.PI / 2; lavaSea.position.y = sea; lavaSea.position.x = cxm; lavaSea.position.z = czm;
    extra = lavaSea;
  } else if (tr.theme !== 'city') {
    const far = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 1, 1), new THREE.MeshLambertMaterial({ color: tr.theme === 'canyon' ? '#c47a48' : th.ground2 }));
    far.rotation.x = -Math.PI / 2; far.position.set(cxm, tr.theme === 'canyon' ? 18 : -2, czm);
    extra = far;
  } else {
    const far = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 1, 1), new THREE.MeshLambertMaterial({ color: th.ground }));
    far.rotation.x = -Math.PI / 2; far.position.set(cxm, -0.3, czm);
    extra = far;
  }
  const heightAt = (x, z) => {
    const fx = (x - x0) / cell, fz = (z - z0) / cell;
    const i = Math.floor(fx), j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= nx || j >= nz) return themeH(x, z);
    const u = fx - i, v = fz - j, H = (a, b) => heights[b * (nx + 1) + a];
    // follow the same triangle split as PlaneGeometry (a-b-d / b-c-d)
    const h00 = H(i, j), h10 = H(i + 1, j), h01 = H(i, j + 1), h11 = H(i + 1, j + 1);
    return u + v <= 1 ? h00 + (h10 - h00) * u + (h01 - h00) * v : h11 + (h01 - h11) * (1 - u) + (h10 - h11) * (1 - v);
  };
  return { mesh, extra, heightAt, center: [cxm, czm] };
}

// ---------- scenery
function treeGeo(trunk = '#7a5230', leaf = '#3f9b3a') {
  return merge([
    part(new THREE.CylinderGeometry(0.35, 0.5, 2.6, 6), trunk, 0, 1.3, 0),
    part(new THREE.IcosahedronGeometry(2.3, 0), leaf, 0, 4.1, 0),
    part(new THREE.IcosahedronGeometry(1.6, 0), leaf, 0.9, 5.3, 0.3),
  ]);
}
function pineGeo(snow = true) {
  const g = '#2f6b4f', w = '#f4f8ff';
  const p = [part(new THREE.CylinderGeometry(0.3, 0.4, 1.6, 5), '#6a4a32', 0, 0.8, 0)];
  for (let k = 0; k < 3; k++) {
    p.push(part(new THREE.ConeGeometry(2.6 - k * 0.7, 2.6, 7), g, 0, 2.2 + k * 1.6, 0));
    if (snow) p.push(part(new THREE.ConeGeometry(1.25 - k * 0.32, 1.1, 7), w, 0, 2.95 + k * 1.6 + 0.35, 0));
  }
  return merge(p);
}
function cactusGeo() {
  const c = '#4f9a4a';
  return merge([
    part(new THREE.CylinderGeometry(0.55, 0.6, 5, 7), c, 0, 2.5, 0),
    part(new THREE.CylinderGeometry(0.35, 0.35, 2.2, 6), c, 1.0, 2.6, 0, 0, 0, Math.PI / 2),
    part(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 6), c, 1.9, 3.4, 0),
    part(new THREE.CylinderGeometry(0.3, 0.3, 1.6, 6), c, -0.9, 3.3, 0, 0, 0, Math.PI / 2),
    part(new THREE.CylinderGeometry(0.3, 0.3, 1.4, 6), c, -1.6, 3.9, 0),
  ]);
}
function rockGeo(color) { return merge([part(new THREE.DodecahedronGeometry(1.6, 0), color, 0, 0.8, 0, 0, 0, 0, 1.2, 0.8, 1)]); }
function palmGeo() {
  const p = [];
  for (let k = 0; k < 5; k++) p.push(part(new THREE.CylinderGeometry(0.3, 0.36, 1.5, 6), '#8a6a44', k * 0.18, 0.75 + k * 1.45, 0, 0, 0, -0.06));
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; p.push(part(new THREE.BoxGeometry(3.2, 0.12, 0.8), '#3c9a48', Math.cos(a) * 1.6 + 0.9, 7.3, Math.sin(a) * 1.6, 0, -a, -0.35)); }
  return merge(p);
}
function lampGeo(th) {
  return merge([
    part(new THREE.CylinderGeometry(0.12, 0.16, 7, 6), '#3a3e52', 0, 3.5, 0),
    part(new THREE.BoxGeometry(0.2, 0.2, 2.2), '#3a3e52', 0, 6.9, 1.0),
    part(new THREE.BoxGeometry(0.6, 0.18, 0.9), '#ffe9b0', 0, 6.75, 2.0),
  ]);
}

function placeInstances(geo, mat, list, castShadow) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
  const o = new THREE.Object3D();
  list.forEach((it, i) => {
    o.position.set(it.x, it.y, it.z); o.rotation.set(0, it.ry || 0, 0); o.scale.setScalar(it.s || 1);
    if (it.sy) o.scale.y = it.sy;
    o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    if (it.c) m.setColorAt(i, new THREE.Color(it.c));
  });
  m.count = list.length;
  m.castShadow = !!castShadow;
  m.receiveShadow = true;
  m.computeBoundingSphere();
  return m;
}

function buildScenery(tr, th, grid, R, heightAt, quality, anim) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const b = { mnx: 1e9, mxx: -1e9, mnz: 1e9, mxz: -1e9 };
  for (let i = 0; i < tr.N; i++) { b.mnx = Math.min(b.mnx, tr.PX[i]); b.mxx = Math.max(b.mxx, tr.PX[i]); b.mnz = Math.min(b.mnz, tr.PZ[i]); b.mxz = Math.max(b.mxz, tr.PZ[i]); }
  const cx = (b.mnx + b.mxx) / 2, cz = (b.mnz + b.mxz) / 2;
  // lowest ground under a footprint, so things on slopes don't float on the downhill side
  const groundUnder = (x, z, r) => Math.min(heightAt(x, z), heightAt(x + r, z), heightAt(x - r, z), heightAt(x, z + r), heightAt(x, z - r));
  const settle = (list, r) => { for (const it of list) it.y = groundUnder(it.x, it.z, r * (it.s || 1)) - 0.15 * (it.s || 1); return list; };
  const scatter = (n, margin, pad = 90, filter) => {
    const out = [];
    for (let t = 0; t < n * 6 && out.length < n; t++) {
      const x = b.mnx - pad + R() * (b.mxx - b.mnx + pad * 2), z = b.mnz - pad + R() * (b.mxz - b.mnz + pad * 2);
      if (!grid.clear(x, z, margin)) continue;
      if (filter && !filter(x, z)) continue;
      out.push({ x, z, y: heightAt(x, z), ry: R() * 6.28, s: 0.8 + R() * 0.6 });
    }
    return out;
  };
  // trackside: points along the outside of the walls
  const trackside = (every, off, fn) => {
    const out = [];
    for (let s = R() * every; s < tr.L; s += every * (0.7 + R() * 0.6)) {
      const i = tr.idx(s);
      for (const side of [-1, 1]) {
        if (R() < 0.35) continue;
        const ext = side > 0 ? tr.EXT_R[i] : tr.EXT_L[i];
        const p = tr.pointAt(s, side * (ext + off + R() * 4));
        if (!grid.clear(p.x, p.z, off - 1)) continue;
        const it = { x: p.x, z: p.z, y: heightAt(p.x, p.z), ry: R() * 6.28, s: 0.8 + R() * 0.5, side, s0: s };
        if (fn) fn(it, i);
        out.push(it);
      }
    }
    return out;
  };
  const hi = quality === 'high';
  const dens = hi ? 1 : 0.55;
  switch (tr.theme) {
    case 'meadow': {
      const trees = [...scatter(130 * dens, 9), ...trackside(28, 5)];
      trees.forEach(t => { t.c = ['#ffffff', '#d8f0c0', '#c8f0a8', '#f0f8d0'][Math.floor(R() * 4)]; });
      g.add(placeInstances(treeGeo(), mat, settle(trees, 0.6), hi));
      const bushes = scatter(80 * dens, 6).map(t => ({ ...t, s: 0.5 + R() * 0.5 }));
      g.add(placeInstances(merge([part(new THREE.IcosahedronGeometry(1.4, 0), '#4f9e3c', 0, 0.7, 0, 0, 0, 0, 1.3, 0.8, 1.1)]), mat, bushes, false));
      // flowers
      const fl = scatter(260 * dens, 4, 60).map(t => ({ ...t, s: 1, c: ['#ffe14d', '#ff6fa8', '#ffffff', '#b38cff'][Math.floor(R() * 4)] }));
      g.add(placeInstances(merge([part(new THREE.IcosahedronGeometry(0.35, 0), '#ffffff', 0, 0.3, 0)]), mat, fl, false));
      // windmill in the infield
      const wm = buildWindmill(anim);
      let spot = null;
      for (let t = 0; t < 200 && !spot; t++) { const x = cx + (R() - 0.5) * 120, z = cz + (R() - 0.5) * 120; if (grid.clear(x, z, 18)) spot = { x, z }; }
      if (spot) { wm.position.set(spot.x, heightAt(spot.x, spot.z) - 0.5, spot.z); wm.rotation.y = R() * 6; g.add(wm); }
      // fence posts + hay bales near the start
      addClouds(g, cx, cz, R, anim);
      addGrandstand(g, tr, th, mat, quality);
      break;
    }
    case 'canyon': {
      const cacti = [...scatter(70 * dens, 8), ...trackside(40, 4)];
      g.add(placeInstances(cactusGeo(), mat, settle(cacti, 0.7), hi));
      const rocks = [...scatter(60 * dens, 6), ...trackside(22, 3)].map(t => ({ ...t, s: 0.8 + R() * 1.8, c: ['#ffffff', '#e0c0a0', '#c8a080'][Math.floor(R() * 3)] }));
      g.add(placeInstances(rockGeo('#b0683e'), mat, settle(rocks, 1.9), hi));
      // mesas in the distance
      const mesas = [];
      for (let k = 0; k < 14; k++) { const a = R() * 6.28, r = 420 + R() * 300; mesas.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, y: 16, ry: R() * 6, s: 1, sy: 0.8 + R() * 1.2 }); }
      const mg = merge([part(new THREE.CylinderGeometry(38, 52, 40, 7), '#b5653a', 0, 20, 0), part(new THREE.CylinderGeometry(39, 39, 4, 7), '#d68a52', 0, 41, 0)]);
      g.add(placeInstances(mg, mat, mesas, false));
      // bridge planks across the gap edges + warning signs
      for (const r of tr.ramps) {
        const parts = [];
        for (const side of [-1, 1]) {
          for (const at of [r.lip, r.lip + r.gap]) {
            const f = tr.frame(at);
            const p = tr.pointAt(at, side * (f.hw + 1.5));
            parts.push(part(new THREE.CylinderGeometry(0.25, 0.25, 3, 6), '#6b4a2e', p.x, p.y + 1.5, p.z));
          }
        }
        const m = new THREE.Mesh(merge(parts), mat); g.add(m);
        // canyon floor far below the gap
        const f = tr.frame(r.lip + r.gap / 2);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ color: '#5a3020' }));
        floor.rotation.x = -Math.PI / 2; floor.position.set(f.x, f.y - 24, f.z);
        g.add(floor);
      }
      addGrandstand(g, tr, th, mat, quality);
      break;
    }
    case 'snow': {
      const pines = [...scatter(170 * dens, 8), ...trackside(18, 4)];
      g.add(placeInstances(pineGeo(true), mat, settle(pines, 0.6), hi));
      const rocks = scatter(40 * dens, 6).map(t => ({ ...t, s: 0.6 + R() * 1.2 }));
      g.add(placeInstances(rockGeo('#7c8796'), mat, settle(rocks, 1.9), hi));
      // distant mountains
      const mts = [];
      for (let k = 0; k < 16; k++) { const a = (k / 16) * 6.28 + R() * 0.3, r = 520 + R() * 260; mts.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, y: -5, ry: R() * 6, s: 0.8 + R() * 0.7, sy: 0.8 + R() * 0.8 }); }
      g.add(placeInstances(mountainGeo(), mat, mts, false));
      // snowmen
      const sm = trackside(90, 3).slice(0, 8).map(t => ({ ...t, s: 1 }));
      g.add(placeInstances(merge([part(new THREE.IcosahedronGeometry(1, 1), '#ffffff', 0, 1, 0), part(new THREE.IcosahedronGeometry(0.7, 1), '#ffffff', 0, 2.3, 0), part(new THREE.IcosahedronGeometry(0.48, 1), '#ffffff', 0, 3.2, 0), part(new THREE.ConeGeometry(0.1, 0.5, 5), '#ff7a2f', 0, 3.2, 0.6, Math.PI / 2), part(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 8), '#222', 0, 3.7, 0)]), mat, sm, hi));
      addSnowfall(g, cx, cz, anim, quality);
      addGrandstand(g, tr, th, mat, quality);
      break;
    }
    case 'city': {
      buildCity(g, tr, th, grid, R, quality, anim, b);
      break;
    }
    case 'volcano': {
      const palms = trackside(30, 4).filter(t => { const i = tr.idx(t.s0); return (t.side > 0 ? tr.SOR[i] : tr.SOL[i]) !== SURF.LAVA; });
      g.add(placeInstances(palmGeo(), mat, settle(palms, 0.5), hi));
      const rocks = [...scatter(80 * dens, 6), ...trackside(16, 2)].map(t => ({ ...t, s: 0.6 + R() * 1.6 }));
      g.add(placeInstances(rockGeo('#2f2729'), mat, settle(rocks, 1.9), hi));
      // crater glow + smoke
      const crater = new THREE.Mesh(new THREE.CylinderGeometry(14, 10, 2, 16), new THREE.MeshBasicMaterial({ color: '#ff7a1a' }));
      crater.position.set(cx, heightAt(cx, cz) - 0.5, cz);
      g.add(crater);
      addSmoke(g, cx, heightAt(cx, cz) + 2, cz, anim);
      addGrandstand(g, tr, th, mat, quality);
      break;
    }
  }
  return g;
}

function mountainGeo() {
  const geo = new THREE.ConeGeometry(120, 160, 7, 3);
  geo.translate(0, 80, 0);
  const pos = geo.attributes.position, c = new Float32Array(pos.count * 3);
  const rock = new THREE.Color('#7c8aa0'), snow = new THREE.Color('#ffffff');
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); const cc = y > 95 ? snow : rock; c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const g = geo.toNonIndexed(); g.deleteAttribute('uv'); g.computeVertexNormals();
  return g;
}

function buildWindmill(anim) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const body = merge([
    part(new THREE.CylinderGeometry(2.2, 3.4, 13, 8), '#f4efe6', 0, 6.5, 0),
    part(new THREE.ConeGeometry(3, 3.5, 8), '#c94a3a', 0, 14.7, 0),
    part(new THREE.BoxGeometry(1.4, 2.4, 0.3), '#7a5230', 0, 1.2, 3.25),
  ]);
  const bm = new THREE.Mesh(body, mat); bm.castShadow = true; g.add(bm);
  const hub = new THREE.Group(); hub.position.set(0, 12, 3.2);
  const blades = merge([0, 1, 2, 3].map(k => part(new THREE.BoxGeometry(1.3, 8.5, 0.15), k % 2 ? '#fff6e8' : '#e8dccb', 0, 4.6, 0, 0, 0, (k * Math.PI) / 2)).map((p, k) => { p.rotateZ((k * Math.PI) / 2); return p; }));
  const bl = new THREE.Mesh(blades, mat); bl.castShadow = true; hub.add(bl);
  g.add(hub);
  anim.push(dt => { hub.rotation.z += dt * 0.8; });
  return g;
}

function addClouds(g, cx, cz, R, anim) {
  const parts = [];
  for (let k = 0; k < 14; k++) {
    const a = R() * 6.28, r = 250 + R() * 450, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, y = 90 + R() * 70;
    for (let j = 0; j < 5; j++) parts.push(part(new THREE.IcosahedronGeometry(9 + R() * 8, 1), '#ffffff', x + j * 11 - 22, y + R() * 4 - (j % 2) * 3, z + R() * 10, 0, 0, 0, 1.3, 0.55, 1));
  }
  const m = new THREE.Mesh(merge(parts), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0xc8d4e4, fog: false, transparent: true, opacity: 0.92 }));
  g.add(m);
  anim.push(dt => { m.rotation.y += dt * 0.004; });
}

function addGrandstand(g, tr, th, mat, quality) {
  // a stand of spectators beside the start straight
  const f = tr.frame(25);
  const side = tr.EXT_L[tr.idx(25)] > tr.EXT_R[tr.idx(25)] ? -1 : 1;
  const ext = side > 0 ? tr.EXT_R[tr.idx(25)] : tr.EXT_L[tr.idx(25)];
  const p = tr.pointAt(25, side * (ext + 6));
  const parts = [];
  const len = 34;
  for (let r = 0; r < 4; r++) parts.push(part(new THREE.BoxGeometry(len, 1, 2.2), th.theme === 'city' ? '#3a3f55' : '#9aa0b4', 0, 0.5 + r * 1.0, r * 2.0));
  parts.push(part(new THREE.BoxGeometry(len, 0.4, 9), th.kerb[0], 0, 7.5, 3.5));
  for (const x of [-len / 2, len / 2]) parts.push(part(new THREE.BoxGeometry(0.4, 7.5, 0.4), '#555a6a', x, 3.75, 7.5));
  const crowd = [];
  const cr = rng(5);
  const cols = ['#ff5f5f', '#ffd23f', '#3fa9ff', '#8bd448', '#ff8fd0', '#ffffff', '#ff9f43'];
  for (let r = 0; r < 4; r++) for (let x = -len / 2 + 1; x < len / 2 - 0.5; x += 1.1) if (cr() < 0.8) crowd.push(part(new THREE.BoxGeometry(0.6, 0.9, 0.5), cols[Math.floor(cr() * cols.length)], x, 1.45 + r * 1.0, r * 2.0 + 0.2));
  const m = new THREE.Mesh(merge([...parts, ...crowd]), mat);
  m.position.set(p.x, p.y - 0.4, p.z);
  m.rotation.y = Math.atan2(f.fx, f.fz) + (side > 0 ? -Math.PI / 2 : Math.PI / 2);
  m.castShadow = quality === 'high';
  g.add(m);
}

function addSnowfall(g, cx, cz, anim, quality) {
  const n = quality === 'high' ? 1400 : 600;
  const p = new Float32Array(n * 3);
  const r = rng(9);
  for (let i = 0; i < n; i++) { p[i * 3] = (r() - 0.5) * 160; p[i * 3 + 1] = r() * 60; p[i * 3 + 2] = (r() - 0.5) * 160; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.9, depthWrite: false }));
  pts.frustumCulled = false;
  pts.name = 'snowfall';
  g.add(pts);
  anim.push((dt, t, cam) => {
    const a = geo.attributes.position;
    for (let i = 0; i < n; i++) {
      let y = a.array[i * 3 + 1] - dt * 4;
      if (y < 0) y += 60;
      a.array[i * 3 + 1] = y;
      a.array[i * 3] += Math.sin(t + i) * dt * 0.4;
    }
    a.needsUpdate = true;
    if (cam) pts.position.set(cam.position.x, cam.position.y - 25, cam.position.z);
  });
}

function addSmoke(g, x, y, z, anim) {
  const n = 40;
  const tex = softTexture();
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(n * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const mat = new THREE.PointsMaterial({ color: 0x5a4a4a, size: 40, map: tex, transparent: true, opacity: 0.55, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  g.add(pts);
  const life = Array.from({ length: n }, (_, i) => i / n);
  anim.push(dt => {
    for (let i = 0; i < n; i++) {
      life[i] += dt * 0.06; if (life[i] > 1) life[i] -= 1;
      const l = life[i];
      p[i * 3] = x + Math.sin(i * 7.1) * 10 * l + l * 30; p[i * 3 + 1] = y + l * 140; p[i * 3 + 2] = z + Math.cos(i * 3.3) * 10 * l;
    }
    geo.attributes.position.needsUpdate = true;
  });
}

function buildCity(g, tr, th, grid, R, quality, anim, b) {
  // buildings: instanced boxes with a lit-window texture
  const winTex = canvasTex(64, 128, (x, w, h) => {
    x.fillStyle = '#23263a'; x.fillRect(0, 0, w, h);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 4; i++) {
      const r = Math.random();
      x.fillStyle = r < 0.4 ? '#ffe9a0' : r < 0.5 ? '#7ff6ff' : r < 0.57 ? '#ff9ad6' : '#121420';
      x.fillRect(4 + i * 15, 4 + j * 8, 10, 5);
    }
  });
  winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping;
  const mat = new THREE.MeshLambertMaterial({ map: winTex, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0.75, color: 0xb0b4d0 });
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  // scale UVs so windows tile on big boxes: done per instance via a shader-free trick (uv * 3)
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 3);
  const list = [];
  const tryPlace = (x, z, w, d, h) => {
    if (!grid.clear(x, z, Math.max(w, d) * 0.75 + 3)) return false;
    list.push({ x, z, w, d, h, ry: 0 });
    return true;
  };
  for (let x = b.mnx - 120; x < b.mxx + 120; x += 26) for (let z = b.mnz - 120; z < b.mxz + 120; z += 26) {
    const w = 12 + R() * 10, d = 12 + R() * 10, h = 14 + Math.pow(R(), 1.6) * 70;
    tryPlace(x + (R() - 0.5) * 6, z + (R() - 0.5) * 6, w, d, h);
  }
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  const o = new THREE.Object3D();
  const tints = ['#8a90c8', '#c08ad0', '#7ab0d0', '#a0a8c0', '#d0a080'];
  list.forEach((it, i) => { o.position.set(it.x, 0, it.z); o.rotation.set(0, 0, 0); o.scale.set(it.w, it.h, it.d); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, new THREE.Color(tints[i % tints.length])); });
  m.receiveShadow = true;
  g.add(m);
  // neon rooftop signs
  const neon = [];
  list.forEach((it, i) => { if (i % 3 === 0) neon.push(part(new THREE.BoxGeometry(it.w * 0.8, 1.2, 0.3), i % 2 ? th.neon[0] : th.neon[1], it.x, it.h + 1.2, it.z + it.d / 2)); });
  if (neon.length) g.add(new THREE.Mesh(merge(neon), new THREE.MeshBasicMaterial({ vertexColors: true })));
  // neon strips along the walls + street lamps
  const strips = [], lamps = [], glows = [];
  for (let s = 0; s < tr.L; s += 2.5) {
    const i = tr.idx(s);
    const s1 = Math.min(tr.L - 0.01, s + 2.5);
    for (const side of [-1, 1]) {
      const ext0 = side > 0 ? tr.EXT_R[i] : tr.EXT_L[i], ext1 = side > 0 ? tr.EXT_R[tr.idx(s1)] : tr.EXT_L[tr.idx(s1)];
      const a = tr.pointAt(s, side * (ext0 - 0.05)), c = tr.pointAt(s1, side * (ext1 - 0.05));
      const geoS = new THREE.BufferGeometry();
      const y0 = 0.75, y1 = 1.0;
      geoS.setAttribute('position', new THREE.Float32BufferAttribute([a.x, a.y + y0, a.z, c.x, c.y + y0, c.z, c.x, c.y + y1, c.z, a.x, a.y + y0, a.z, c.x, c.y + y1, c.z, a.x, a.y + y1, a.z], 3));
      strips.push(colorGeo(geoS, side > 0 ? th.neon[0] : th.neon[1]));
    }
  }
  for (let s = 6; s < tr.L; s += 28) {
    const i = tr.idx(s);
    for (const side of [-1, 1]) {
      const ext = side > 0 ? tr.EXT_R[i] : tr.EXT_L[i];
      const p = tr.pointAt(s, side * (ext + 1.0));
      const ry = Math.atan2(tr.RX[i] * -side, tr.RZ[i] * -side);
      lamps.push({ x: p.x, y: p.y, z: p.z, ry });
      const head = tr.pointAt(s, side * (ext - 1.0));
      glows.push(head.x, p.y + 6.6, head.z);
    }
  }
  const sm = new THREE.Mesh(mergeGeometries(strips), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  g.add(sm);
  g.add(placeInstances(lampGeo(th), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x111111 }), lamps, quality === 'high'));
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(glows, 3));
  const glowPts = new THREE.Points(gg, new THREE.PointsMaterial({ color: 0xffe9a8, size: 5, map: softTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(glowPts);
  // light pools on the road under lamps
  const pools = [];
  for (let k = 0; k < glows.length; k += 3) {
    const pg = new THREE.CircleGeometry(4.5, 12); pg.rotateX(-Math.PI / 2); pg.translate(glows[k], glows[k + 1] - 6.5, glows[k + 2]);
    pools.push(pg);
  }
  if (pools.length) {
    const pm = new THREE.Mesh(mergeGeometries(pools), new THREE.MeshBasicMaterial({ color: 0x8a7a50, map: softTexture(), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }));
    g.add(pm);
  }
  // pillars under the flyover
  const pil = [];
  for (let s = 0; s < tr.L; s += 12) {
    const f = tr.frame(s);
    if (f.y < 3) continue;
    for (const side of [-1, 1]) {
      const p = tr.pointAt(s, side * (f.hw * 0.7));
      pil.push(part(new THREE.BoxGeometry(1.2, f.y, 1.2), '#4a4f66', p.x, f.y / 2 - 0.3, p.z));
    }
    // deck underside
    const a = tr.pointAt(s, -f.extL - 0.5), c = tr.pointAt(s, f.extR + 0.5);
    const deck = new THREE.BoxGeometry(Math.hypot(c.x - a.x, c.z - a.z), 0.8, 12.5);
    deck.rotateY(Math.atan2(f.fx, f.fz));
    pil.push(part(deck, '#3a3f55', (a.x + c.x) / 2, f.y - 0.55, (a.z + c.z) / 2, 0, 0, 0));
  }
  if (pil.length) { const pm = new THREE.Mesh(merge(pil), new THREE.MeshLambertMaterial({ vertexColors: true })); pm.castShadow = quality === 'high'; g.add(pm); }
}
