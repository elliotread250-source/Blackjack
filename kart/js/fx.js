// Particles (drift sparks, boost flames, dust, explosions) and item / rescue-drone meshes.
import * as THREE from 'three';

const VS = `
attribute float psize;
attribute float palpha;
attribute vec3 pcolor;
varying vec3 vColor;
varying float vAlpha;
uniform float scale;
void main() {
  vColor = pcolor;
  vAlpha = palpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = psize * scale / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const FS = `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.12, d) * vAlpha;
  gl_FragColor = vec4(vColor, a);
}`;

export class Particles {
  constructor(max, additive) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.s0 = new Float32Array(max);
    this.s1 = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.a0 = new Float32Array(max);
    this.next = 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('pcolor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('palpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS, uniforms: { scale: { value: 400 } },
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.geo = g;
    this.alive = 0;
  }
  emit(x, y, z, vx, vy, vz, life, size, color, opt = {}) {
    const i = this.next; this.next = (this.next + 1) % this.max;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.maxLife[i] = life;
    this.s0[i] = size; this.s1[i] = opt.size1 ?? size * 0.3;
    this.grav[i] = opt.grav ?? 0; this.drag[i] = opt.drag ?? 1;
    this.a0[i] = opt.alpha ?? 1;
    this.col[i * 3] = color.r; this.col[i * 3 + 1] = color.g; this.col[i * 3 + 2] = color.b;
  }
  update(dt) {
    const n = this.max;
    for (let i = 0; i < n; i++) {
      if (this.life[i] <= 0) { this.size[i] = 0; this.alpha[i] = 0; continue; }
      this.life[i] -= dt;
      const k = Math.max(0, this.life[i] / this.maxLife[i]);
      const dr = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= dr; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * dr - this.grav[i] * dt; this.vel[i * 3 + 2] *= dr;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] = this.s1[i] + (this.s0[i] - this.s1[i]) * k;
      this.alpha[i] = this.a0[i] * Math.min(1, k * 1.6);
    }
    for (const a of ['position', 'pcolor', 'psize', 'palpha']) this.geo.attributes[a].needsUpdate = true;
  }
  clear() { this.life.fill(0); }
}

const C = h => new THREE.Color(h);
export const SPARK = [C('#ffffff'), C('#3fb8ff'), C('#ff9a1f'), C('#d65cff')];
const FLAME = [C('#ffe36b'), C('#ff8a1f'), C('#ff4a1a')];

export class Effects {
  constructor(scene, quality) {
    this.scene = scene;
    this.add = new Particles(quality === 'high' ? 1400 : 700, true);
    this.norm = new Particles(quality === 'high' ? 900 : 450, false);
    scene.add(this.add.points, this.norm.points);
    this.items = new Map();
    this.quality = quality;
    // shared item meshes
    const banana = new THREE.TorusGeometry(0.42, 0.16, 6, 10, Math.PI * 1.1);
    banana.rotateZ(-Math.PI * 0.05);
    this.bananaGeo = banana;
    this.bananaMat = new THREE.MeshLambertMaterial({ color: '#ffd93b', emissive: '#3a2a00' });
    const spikes = [];
    this.shellGroupProto = (() => {
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), new THREE.MeshLambertMaterial({ color: '#e8313c', emissive: '#4a0000' }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.1, 6, 16), new THREE.MeshLambertMaterial({ color: '#ffffff' }));
      ring.rotation.x = Math.PI / 2;
      g.add(core, ring);
      for (let k = 0; k < 6; k++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 5), new THREE.MeshLambertMaterial({ color: '#ffffff' }));
        const a = (k / 6) * Math.PI * 2;
        sp.position.set(Math.cos(a) * 0.55, 0.25, Math.sin(a) * 0.55);
        sp.lookAt(Math.cos(a) * 2, 1, Math.sin(a) * 2);
        sp.rotateX(Math.PI / 2);
        g.add(sp);
        spikes.push(sp);
      }
      return g;
    })();
    this.shieldGeo = new THREE.SphereGeometry(1, 20, 14);
    this.shieldMat = new THREE.MeshBasicMaterial({ color: '#7fdcff', transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending });
    this.droneProto = (() => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.45, 12), new THREE.MeshLambertMaterial({ color: '#f4f4fa' }));
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: '#2bc4d8' }));
      eye.position.set(0, -0.05, 0.62);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.22), new THREE.MeshLambertMaterial({ color: '#444a5a' }));
      blade.position.y = 0.4; blade.name = 'blade';
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 4), new THREE.MeshBasicMaterial({ color: '#222' }));
      cable.position.y = -1.3;
      g.add(body, eye, blade, cable);
      return g;
    })();
    this.shields = new Map();
    this.drones = new Map();
  }
  setScale(h, fov) { const s = h / (2 * Math.tan((fov * Math.PI) / 360)); this.add.mat.uniforms.scale.value = s; this.norm.mat.uniforms.scale.value = s; }

  // ---- items in the world
  addBanana(ent) {
    const m = new THREE.Mesh(this.bananaGeo, this.bananaMat);
    m.position.set(ent.x, ent.y + 0.35, ent.z);
    m.rotation.set(0.2, Math.random() * 6, 0);
    m.castShadow = this.quality === 'high';
    this.scene.add(m);
    this.items.set(ent.id, { m, ent, kind: 'banana' });
  }
  addShell(ent) {
    const m = this.shellGroupProto.clone();
    m.position.set(ent.x, ent.y, ent.z);
    this.scene.add(m);
    this.items.set(ent.id, { m, ent, kind: 'shell' });
  }
  removeItem(id, x, y, z, why) {
    const it = this.items.get(id);
    if (it) { this.scene.remove(it.m); this.items.delete(id); }
    if (x !== undefined && why !== 'expire') this.explode(x, y + 0.5, z, why === 'hit' ? 1 : 0.6);
  }
  syncItems(race, dt, t) {
    for (const it of this.items.values()) {
      if (it.kind === 'shell') {
        it.m.position.set(it.ent.x, it.ent.y + 0.15, it.ent.z);
        it.m.rotation.y += dt * 12;
        if (Math.random() < 0.5) this.add.emit(it.ent.x, it.ent.y + 0.3, it.ent.z, 0, 0.5, 0, 0.25, 0.7, FLAME[1], { size1: 0.1 });
      } else {
        it.m.position.y = it.ent.y + 0.35 + Math.sin(t * 3 + it.m.rotation.y) * 0.04;
      }
    }
  }

  explode(x, y, z, power = 1) {
    const n = Math.round(30 * power);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, sp = 4 + Math.random() * 9 * power;
      const r = Math.sqrt(1 - u * u);
      this.add.emit(x, y, z, Math.cos(a) * r * sp, Math.abs(u) * sp + 2, Math.sin(a) * r * sp, 0.4 + Math.random() * 0.4, 1.4, FLAME[i % 3], { grav: 10, drag: 2 });
    }
    for (let i = 0; i < n / 2; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
      this.norm.emit(x, y, z, Math.cos(a) * sp, 2 + Math.random() * 2, Math.sin(a) * sp, 0.9 + Math.random() * 0.5, 2.2, C('#6b6470'), { size1: 3.5, drag: 1.5, alpha: 0.6 });
    }
  }
  sparks(x, y, z, n = 10, color = SPARK[0]) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 6;
      this.add.emit(x, y, z, Math.cos(a) * sp, 2 + Math.random() * 4, Math.sin(a) * sp, 0.3 + Math.random() * 0.2, 0.5, color, { grav: 18, drag: 1 });
    }
  }
  confetti(x, y, z) {
    const cols = ['#ff5f5f', '#ffd23f', '#3fa9ff', '#8bd448', '#ff8fd0', '#ffffff'].map(C);
    for (let i = 0; i < 160; i++) {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 7;
      this.norm.emit(x, y, z, Math.cos(a) * sp, 6 + Math.random() * 9, Math.sin(a) * sp, 2 + Math.random() * 1.5, 0.5, cols[i % cols.length], { grav: 6, drag: 1.2, size1: 0.5 });
    }
  }

  // Per-kart visual effects. view = KartView, k = kart physics/net state
  kartFx(view, k, dt, t) {
    const yaw = k.yaw;
    const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = -fz, rz = fx;
    const meta = view.meta;
    const back = meta.min[2] + 0.1;
    const wx = meta.wheels.bl[0];
    const sp = Math.abs(k.speed || 0);
    const airborne = k.air;
    // drift sparks from the rear wheels, coloured by mini-turbo stage
    if (k.drift && !airborne) {
      const col = SPARK[k.driftStage || 0];
      const n = k.driftStage ? 3 : 1;
      for (let s = -1; s <= 1; s += 2) {
        const px = k.x + fx * back + rx * wx * s, pz = k.z + fz * back + rz * wx * s;
        for (let i = 0; i < n; i++) this.add.emit(px, k.y + 0.15, pz, -fx * 3 + (Math.random() - 0.5) * 4 + rx * s * 2, 1 + Math.random() * 3, -fz * 3 + (Math.random() - 0.5) * 4 + rz * s * 2, 0.22 + Math.random() * 0.15, k.driftStage ? 0.55 : 0.32, col, { grav: 14 });
      }
    }
    // boost flames from the exhausts
    if (k.boost) {
      for (const e of meta.exhaust) {
        const ex = e[0], ey = e[1], ez = e[2];
        const px = k.x + fx * ez + rx * -ex, py = k.y + ey, pz = k.z + fz * ez + rz * -ex;
        for (let i = 0; i < 2; i++) this.add.emit(px, py, pz, -fx * (6 + Math.random() * 4) + (Math.random() - 0.5), (Math.random() - 0.2) * 1.2, -fz * (6 + Math.random() * 4) + (Math.random() - 0.5), 0.14 + Math.random() * 0.08, 0.9, FLAME[(Math.random() * 3) | 0], { size1: 0.2 });
      }
    }
    // dust / grass / snow kick-up off-road
    if (k.offCol && sp > 6 && !airborne && Math.random() < 0.7) {
      for (let s = -1; s <= 1; s += 2) {
        const px = k.x + fx * back + rx * wx * s, pz = k.z + fz * back + rz * wx * s;
        this.norm.emit(px, k.y + 0.2, pz, -fx * 2 + (Math.random() - 0.5) * 2, 1.5 + Math.random() * 2, -fz * 2 + (Math.random() - 0.5) * 2, 0.5 + Math.random() * 0.3, 0.7, k.offCol, { size1: 1.6, grav: 3, drag: 2, alpha: 0.75 });
      }
    }
    // spin-out stars
    if (k.spin && Math.random() < 0.4) this.add.emit(k.x + (Math.random() - 0.5) * 1.5, k.y + 1.8, k.z + (Math.random() - 0.5) * 1.5, 0, 1.5, 0, 0.5, 0.6, C('#ffe14d'));
    // shield bubble
    let sh = this.shields.get(view);
    if (k.shield) {
      if (!sh) { sh = new THREE.Mesh(this.shieldGeo, this.shieldMat); this.scene.add(sh); this.shields.set(view, sh); }
      const r = (meta.max[2] - meta.min[2]) * 0.62;
      sh.scale.set(r * 0.85, r * 0.75, r);
      sh.position.set(k.x, k.y + 0.7, k.z);
      sh.rotation.y = yaw;
      sh.visible = true;
    } else if (sh) sh.visible = false;
    // rescue drone
    let dr = this.drones.get(view);
    if (k.rescue) {
      if (!dr) { dr = this.droneProto.clone(); this.scene.add(dr); this.drones.set(view, dr); }
      dr.visible = true;
      dr.position.set(k.x, k.y + 3.6, k.z);
      dr.rotation.y = yaw;
      dr.getObjectByName('blade').rotation.y += dt * 30;
    } else if (dr) dr.visible = false;
  }
  dropKart(view) {
    const sh = this.shields.get(view); if (sh) { this.scene.remove(sh); this.shields.delete(view); }
    const dr = this.drones.get(view); if (dr) { this.scene.remove(dr); this.drones.delete(view); }
  }
  update(dt) { this.add.update(dt); this.norm.update(dt); }
  dispose() {
    for (const it of this.items.values()) this.scene.remove(it.m);
    this.items.clear();
    for (const v of [...this.shields.keys()]) this.dropKart(v);
    for (const v of [...this.drones.keys()]) this.dropKart(v);
    this.scene.remove(this.add.points, this.norm.points);
    this.add.geo.dispose(); this.norm.geo.dispose(); this.add.mat.dispose(); this.norm.mat.dispose();
  }
}
