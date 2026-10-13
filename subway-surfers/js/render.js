// three.js view of the run. Everything is built from boxes merged into vertex-coloured meshes.
// World z (distance) maps to three.js -z, so the runner heads into the screen.
import * as THREE from 'three';
import { LANE_W, TRAIN_H, RAMP_LEN, HURDLE_H, BAR_LOW, BAR_HIGH, laneX, trainSpan } from './logic.js';

const tmp = new THREE.Color();
// Box: [cx, y0, cz, w, h, d, colour] (bottom-anchored)
export function mergeBoxes(boxes) {
  const n = boxes.length, pos = new Float32Array(n * 72), nor = new Float32Array(n * 72), col = new Float32Array(n * 72), idx = new Uint32Array(n * 36);
  let v = 0, ii = 0;
  for (const [cx, y0, cz, w, h, d, c, shade = 1] of boxes) {
    const x0 = cx - w / 2, x1 = cx + w / 2, yA = y0, yB = y0 + h, z0 = cz - d / 2, z1 = cz + d / 2;
    tmp.setHex(c); const r = tmp.r * shade, g = tmp.g * shade, b = tmp.b * shade;
    for (const f of [[1, 0, 0, [x1, yA, z1], [x1, yA, z0], [x1, yB, z0], [x1, yB, z1]], [-1, 0, 0, [x0, yA, z0], [x0, yA, z1], [x0, yB, z1], [x0, yB, z0]],
      [0, 1, 0, [x0, yB, z1], [x1, yB, z1], [x1, yB, z0], [x0, yB, z0]], [0, -1, 0, [x0, yA, z0], [x1, yA, z0], [x1, yA, z1], [x0, yA, z1]],
      [0, 0, 1, [x0, yA, z1], [x1, yA, z1], [x1, yB, z1], [x0, yB, z1]], [0, 0, -1, [x1, yA, z0], [x0, yA, z0], [x0, yB, z0], [x1, yB, z0]]]) {
      for (let k = 0; k < 4; k++) { const p = f[3 + k]; pos.set(p, v * 3); nor.set([f[0], f[1], f[2]], v * 3); col.set([r, g, b], v * 3); v++; }
      const s = v - 4; idx.set([s, s + 1, s + 2, s, s + 2, s + 3], ii); ii += 6;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  return geo;
}

export const SKINS = {
  jake: { name: 'Jake', price: 0, hoodie: 0xd8262c, pants: 0x2f4a8a, cap: 0x2a6ad8, skin: 0xf0c49a, shoes: 0xf4f4f4, hair: 0x5a3a1a },
  tricky: { name: 'Tricky', price: 300, hoodie: 0xff6fa8, pants: 0x3a3a48, cap: 0xd8262c, skin: 0xf6d2b0, shoes: 0x2a2a30, hair: 0xd8762a },
  fresh: { name: 'Fresh', price: 600, hoodie: 0x2ab8a8, pants: 0x1d1d26, cap: 0xffd23f, skin: 0x8a5a3a, shoes: 0xff5a3a, hair: 0x1a1a1a },
  yutani: { name: 'Yutani', price: 1200, hoodie: 0x7ae36b, pants: 0x4a3a9d, cap: 0x9a7aff, skin: 0x9ff08a, shoes: 0xfff06a, hair: 0x5ac04a },
};

const TILE = 24, NTILES = 10, VIEW = 170;
const TRAIN_COLORS = [[0xd8d8d0, 0x2a6ad8], [0xe8c43a, 0x3a3a48], [0xc8302a, 0xf4f4f4], [0x3a8a5a, 0xf2e2a8], [0x5a6ad8, 0xffd23f]];

export class Renderer {
  constructor(canvas) {
    const r = this.gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8fd3ff);
    this.scene.fog = new THREE.Fog(0xbfe6ff, 70, VIEW);
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);
    this.mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.5));
    const sun = this.sun = new THREE.DirectionalLight(0xfff2dc, 2.3);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 30, bottom: -14, near: 1, far: 80 });
    sun.shadow.bias = -0.0006;
    this.scene.add(sun, sun.target);
    // track tiles that leapfrog forward as you run
    this.tiles = [];
    for (let i = 0; i < NTILES; i++) { const m = new THREE.Mesh(this.tileGeo(i), this.mat); m.receiveShadow = true; this.scene.add(m); this.tiles.push(m); }
    this.objs = new Map();
    this.coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 18).rotateX(Math.PI / 2);
    this.coinMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0x8a5a00, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.35 });
    this.player = this.makeRunner('jake'); this.scene.add(this.player.group);
    this.chaser = this.makeInspector(); this.scene.add(this.chaser.group);
    this.camX = 0; this.camY = 4;
    this.resize();
  }

  tileGeo(seed) {
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const B = [];
    B.push([0, -0.6, -TILE / 2, 9, 0.6, TILE, 0x8a7a6a]);                      // gravel bed
    for (const lane of [-1, 0, 1]) {
      const x = laneX(lane);
      for (let z = 0.6; z < TILE; z += 1.2) B.push([x, -0.05, -z, 1.9, 0.12, 0.34, 0x6a4a32]);
      for (const dx of [-0.62, 0.62]) B.push([x + dx, 0.05, -TILE / 2, 0.14, 0.14, TILE, 0xb8bcc6]);
    }
    // concrete walls with graffiti blocks, then buildings
    for (const side of [-1, 1]) {
      B.push([side * 5.4, -0.6, -TILE / 2, 1.2, 2.4, TILE, 0xb8b0a4]);
      for (let z = 1; z < TILE - 1; z += 4 + rnd() * 3) if (rnd() < 0.55) B.push([side * 4.78, 0.2, -z - 1, 0.04, 0.6 + rnd() * 1.1, 1.5 + rnd() * 2, [0xff5a8a, 0x3ab8ff, 0xffd23f, 0x7ae36b, 0xb85aff][Math.floor(rnd() * 5)]]);
      for (let z = 0; z < TILE; ) {
        const w = 5 + rnd() * 5, h = 6 + rnd() * 16, c = [0xe8d8c0, 0xd8a890, 0xa8b8c8, 0xc8c0a0, 0xe0c8a8, 0x98a8a0][Math.floor(rnd() * 6)];
        const cx = side * (9 + rnd() * 2);
        B.push([cx, -0.6, -z - w / 2, 7, h, w - 0.4, c]);
        for (let y = 2; y < h - 1.5; y += 2.4) for (let k = -w / 2 + 1.2; k < w / 2 - 0.8; k += 1.6) B.push([cx - side * 3.52, y, -z - w / 2 + k, 0.06, 1.2, 0.8, rnd() < 0.2 ? 0xffe8a0 : 0x4a6a8a]);
        z += w;
      }
      for (let z = 4; z < TILE; z += 12) { B.push([side * 4.7, 1.8, -z, 0.15, 3.6, 0.15, 0x5a5a62]); B.push([side * 4.4, 5.3, -z, 0.7, 0.15, 0.3, 0x5a5a62]); }
    }
    return mergeBoxes(B);
  }

  makeRunner(skin) {
    const S = SKINS[skin] || SKINS.jake;
    const part = boxes => { const m = new THREE.Mesh(mergeBoxes(boxes), this.mat); m.castShadow = true; return m; };
    const group = new THREE.Group(), body = new THREE.Group();
    group.add(body);
    const torso = part([[0, 0.95, 0, 0.62, 0.72, 0.38, S.hoodie], [0, 1.45, 0.17, 0.5, 0.22, 0.06, S.hoodie, 0.85], [0, 0.95, -0.2, 0.3, 0.22, 0.04, 0xffffff, 0.9]]);
    const head = part([[0, 1.67, 0, 0.46, 0.46, 0.44, S.skin], [0, 2.09, 0.02, 0.5, 0.14, 0.48, S.cap], [0, 2.09, -0.3, 0.46, 0.06, 0.24, S.cap], [0, 1.93, 0.2, 0.48, 0.2, 0.08, S.hair],
      [-0.1, 1.86, -0.23, 0.07, 0.07, 0.02, 0x1a1a1a], [0.1, 1.86, -0.23, 0.07, 0.07, 0.02, 0x1a1a1a], [0, 1.73, -0.23, 0.14, 0.03, 0.02, 0x8a3a2a]]);
    const limb = (c, foot) => { const g = new THREE.Group(); g.add(part([[0, -0.62, 0, 0.2, 0.62, 0.22, c], ...(foot ? [[0, -0.76, -0.06, 0.24, 0.14, 0.36, foot]] : [[0, -0.7, 0, 0.16, 0.12, 0.16, S.skin]])])); return g; };
    const legL = limb(S.pants, S.shoes), legR = limb(S.pants, S.shoes), armL = limb(S.hoodie), armR = limb(S.hoodie);
    legL.position.set(-0.16, 0.76, 0); legR.position.set(0.16, 0.76, 0); armL.position.set(-0.42, 1.36, 0); armR.position.set(0.42, 1.36, 0);
    body.add(torso, head, legL, legR, armL, armR);
    return { group, body, legL, legR, armL, armR, skin };
  }
  setSkin(skin) {
    if (this.player.skin === skin) return;
    this.scene.remove(this.player.group);
    this.player = this.makeRunner(skin); this.scene.add(this.player.group);
  }
  makeInspector() {
    const group = new THREE.Group();
    const m = new THREE.Mesh(mergeBoxes([
      [-0.17, 0, 0, 0.24, 0.8, 0.26, 0x1d2a4a], [0.17, 0, 0, 0.24, 0.8, 0.26, 0x1d2a4a], [0, 0.8, 0, 0.8, 0.85, 0.5, 0x2a3a6a], [0, 1.65, 0, 0.5, 0.5, 0.46, 0xf0c49a],
      [0, 2.15, 0, 0.6, 0.14, 0.56, 0x1d2a4a], [0, 2.15, -0.32, 0.52, 0.06, 0.2, 0x1d2a4a], [0, 1.6, -0.24, 0.3, 0.1, 0.04, 0x6a4a2a], [-0.5, 0.95, 0, 0.18, 0.7, 0.22, 0x2a3a6a], [0.5, 0.95, 0, 0.18, 0.7, 0.22, 0x2a3a6a],
      // the dog
      [1.0, 0.25, -0.2, 0.36, 0.36, 0.8, 0x9a6a3a], [1.0, 0.45, -0.7, 0.32, 0.32, 0.34, 0x9a6a3a], [1.0, 0.0, -0.4, 0.3, 0.25, 0.1, 0x6a4a2a], [1.0, 0.0, 0.05, 0.3, 0.25, 0.1, 0x6a4a2a],
    ]), this.mat);
    m.castShadow = true; group.add(m); group.visible = false;
    return { group };
  }

  // ---- obstacles, coins and power-ups near the runner
  objFor(thing) {
    let o = this.objs.get(thing); if (o) return o;
    let geo;
    if (thing.kind === 'train') geo = this.trainGeo(thing);
    else if (thing.kind === 'hurdle') geo = mergeBoxes([[-0.85, 0, 0, 0.12, HURDLE_H, 0.12, 0x8a8a92], [0.85, 0, 0, 0.12, HURDLE_H, 0.12, 0x8a8a92], ...[-0.66, -0.22, 0.22, 0.66].map((x, i) => [x, HURDLE_H - 0.42, 0, 0.44, 0.36, 0.1, i % 2 ? 0xffffff : 0xe8302a])]);
    else if (thing.kind === 'bar') geo = mergeBoxes([[-0.95, 0, 0, 0.14, BAR_HIGH, 0.14, 0x8a8a92], [0.95, 0, 0, 0.14, BAR_HIGH, 0.14, 0x8a8a92], ...[-0.72, -0.24, 0.24, 0.72].map((x, i) => [x, BAR_LOW + 0.2, 0, 0.48, BAR_HIGH - BAR_LOW - 0.3, 0.1, i % 2 ? 0xffd23f : 0x2a2a30]), [0, BAR_HIGH - 0.05, 0, 2, 0.12, 0.16, 0xe8302a]]);
    const mesh = new THREE.Mesh(geo, this.mat); mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);
    o = { mesh }; this.objs.set(thing, o);
    return o;
  }
  trainGeo(t) {
    const len = t.z1 - t.z0, [body, stripe] = TRAIN_COLORS[Math.floor((t.z0 * 7) % TRAIN_COLORS.length)];
    const off = t.ramp ? RAMP_LEN : 0, B = [];
    for (let s = off; s < len - 0.1; s += 10) {                                // carriages
      const L = Math.min(10, len - s) - 0.3, c = -(s + L / 2 + 0.15);
      B.push([0, 0.15, c, 2.0, TRAIN_H - 0.15, L, body]);
      B.push([0, 1.25, c, 2.04, 0.18, L, stripe]);
      for (let k = -L / 2 + 0.8; k < L / 2 - 0.6; k += 1.6) for (const sx of [-1.02, 1.02]) B.push([sx, 1.6, c + k, 0.02, 0.8, 1.0, 0x2a3a4a]);
      B.push([0, TRAIN_H, c, 1.8, 0.08, L - 0.2, 0x9aa0a8]);
      for (const dz of [-L / 2 + 1.2, L / 2 - 1.2]) for (const sx of [-0.72, 0.72]) B.push([sx, 0, c + dz, 0.3, 0.3, 0.6, 0x1d1d22]);
    }
    // the front, facing the runner: windscreen and headlights
    const f = -off + 0.02;
    B.push([0, 1.7, f, 1.6, 0.9, 0.04, 0x2a4a6a], [-0.6, 0.6, f, 0.3, 0.2, 0.04, 0xfff6c8], [0.6, 0.6, f, 0.3, 0.2, 0.04, 0xfff6c8]);
    if (t.ramp) {
      // a striped ramp from the rails up to the roof
      for (let i = 0; i < 10; i++) { const z = (i + 0.5) * RAMP_LEN / 10, y = TRAIN_H * z / RAMP_LEN; B.push([0, y - 0.14, -z, 1.9, 0.16, RAMP_LEN / 10 + 0.05, i % 2 ? 0xffd23f : 0x3a3a42]); }
      for (const z of [RAMP_LEN * 0.5, RAMP_LEN * 0.85]) for (const sx of [-0.85, 0.85]) B.push([sx, 0, -z, 0.12, TRAIN_H * z / RAMP_LEN - 0.12, 0.12, 0x6a6a72]);
    }
    return mergeBoxes(B);
  }

  coinMesh(c) {
    let o = this.objs.get(c); if (o) return o;
    const mesh = new THREE.Mesh(this.coinGeo, this.coinMat); mesh.castShadow = true;
    this.scene.add(mesh); o = { mesh }; this.objs.set(c, o); return o;
  }
  powerMesh(w) {
    let o = this.objs.get(w); if (o) return o;
    const B = w.kind === 'magnet' ? [[-0.3, 0, 0, 0.18, 0.7, 0.2, 0xe8302a], [0.3, 0, 0, 0.18, 0.7, 0.2, 0xe8302a], [0, 0.6, 0, 0.78, 0.18, 0.2, 0xe8302a], [-0.3, -0.1, 0, 0.19, 0.14, 0.21, 0xd8d8e0], [0.3, -0.1, 0, 0.19, 0.14, 0.21, 0xd8d8e0]]
      : w.kind === 'sneakers' ? [[0, 0, 0, 0.36, 0.22, 0.7, 0x3ad86a], [0, 0.2, 0.15, 0.32, 0.26, 0.36, 0x3ad86a], [0, -0.05, 0, 0.38, 0.06, 0.74, 0xffffff], [0.2, 0.15, -0.1, 0.02, 0.08, 0.3, 0xffffff]]
        : [[-0.22, 0, 0, 0.32, 0.6, 0.12, 0xffd23f], [0.24, 0, 0, 0.36, 0.6, 0.12, 0xffd23f], [-0.22, 0.2, -0.07, 0.2, 0.2, 0.02, 0x8a5a00], [0.24, 0.2, -0.07, 0.24, 0.2, 0.02, 0x8a5a00]];
    const mesh = new THREE.Mesh(mergeBoxes(B), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x333333 }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }));
    halo.position.y = 0.25; mesh.add(halo);
    this.scene.add(mesh); o = { mesh }; this.objs.set(w, o); return o;
  }

  update(run, dt, t, title = false) {
    const p = run.p, Z = -p.z;
    // tiles
    const first = Math.floor((p.z - 30) / TILE);
    this.tiles.forEach((m, i) => { const k = first + ((i - first) % NTILES + NTILES) % NTILES; m.position.z = -k * TILE; });
    // obstacles etc.
    const seen = new Set();
    for (const th of run.track.things) {
      const [a, b] = th.kind === 'train' ? trainSpan(th, p.z) : [th.z0, th.z1];
      if (b < p.z - 12 || a > p.z + VIEW) continue;
      const o = this.objFor(th); seen.add(th);
      o.mesh.position.set(laneX(th.lane), 0, th.kind === 'train' ? -a : -(a + b) / 2);
    }
    for (const c of run.track.coins) {
      if (c.taken || c.z < p.z - 6 || c.z > p.z + VIEW * 0.7) continue;
      const o = this.coinMesh(c); seen.add(c);
      o.mesh.position.set(laneX(c.lane), c.y, -c.z); o.mesh.rotation.y = t * 4 + c.z;
    }
    for (const w of run.track.powers) {
      if (w.taken || w.z < p.z - 6 || w.z > p.z + VIEW * 0.7) continue;
      const o = this.powerMesh(w); seen.add(w);
      o.mesh.position.set(laneX(w.lane), w.y + Math.sin(t * 3) * 0.15, -w.z); o.mesh.rotation.y = t * 2;
    }
    for (const [k, o] of this.objs) if (!seen.has(k)) { this.scene.remove(o.mesh); if (k.kind === 'train' || k.kind === 'hurdle' || k.kind === 'bar') o.mesh.geometry.dispose(); this.objs.delete(k); }
    // runner
    const R = this.player, rolling = p.roll > 0, air = !p.ground;
    R.group.position.set(p.x, p.y, Z);
    const sp = title ? 0 : run.speed, ph = t * (6 + sp * 0.45);
    const swing = air ? 0.5 : Math.sin(ph) * 0.95;
    R.legL.rotation.x = rolling ? -1.2 : swing; R.legR.rotation.x = rolling ? -1.2 : -swing;
    R.armL.rotation.x = rolling ? -2 : -swing * 0.9; R.armR.rotation.x = rolling ? -2 : swing * 0.9;
    R.body.rotation.x = rolling ? -(t * 14 % (Math.PI * 2)) : air ? -0.15 : -0.1;
    R.body.position.y = rolling ? 0.55 : air ? 0 : Math.abs(Math.sin(ph)) * 0.08;
    R.body.scale.setScalar(rolling ? 0.75 : 1);
    R.body.rotation.z = (p.x - laneX(p.lane)) * -0.12;
    if (p.dead) { R.body.rotation.x = -1.4; R.body.position.y = 0.3; }
    R.group.rotation.y = title ? Math.PI + Math.sin(t) * 0.3 : 0;
    // inspector + dog close in after a stumble (or when caught)
    const C = this.chaser.group;
    C.visible = run.chased || p.dead?.why === 'caught';
    if (C.visible) { const gap = p.dead ? 1.3 : 3.2; C.position.set(p.x * 0.8, 0, Z + gap); }
    // camera
    const k = 1 - Math.exp(-dt * 7);
    this.camX += (p.x * 0.75 - this.camX) * k;
    this.camY += (Math.max(p.y, 0) * 0.75 + 4.2 - this.camY) * (1 - Math.exp(-dt * 4));
    if (title) { this.camera.position.set(2.2, 2.6, Z - 4.8); this.camera.lookAt(0, 1.4, Z); }
    else { this.camera.position.set(this.camX, this.camY, Z + 7.2); this.camera.lookAt(this.camX * 0.9, this.camY - 2.6, Z - 7); }
    this.sun.position.set(p.x + 6, 18, Z + 4); this.sun.target.position.set(p.x, 0, Z - 6);
    this.gl.render(this.scene, this.camera);
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.gl.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 72 : 60;
    this.camera.updateProjectionMatrix();
  }
}
