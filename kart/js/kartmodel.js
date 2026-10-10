// Kart meshes: loads the baked Kenney models (models/karts.glb) and builds a customised kart.
// Vertices carry a role (body / accent / driver / helmet / glass / rim) so each player's colours
// are written into a per-kart colour buffer: one draw call for the body, one for the driver.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { BODY_META, WHEEL_META, cleanConfig } from './data.js';

const geos = {};
let ready = null;
const mats = {};

export function loadKartAssets(url = 'models/karts.glb') {
  if (ready) return ready;
  ready = new GLTFLoader().loadAsync(url).then(gltf => {
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry;
      if (o.name.startsWith('body_')) {
        // split glass (role 5) out into its own geometry for a transparent material
        const role = g.getAttribute('_role');
        const idx = g.index.array;
        const solid = [], glass = [];
        for (let i = 0; i < idx.length; i += 3) {
          const isGlass = role.getX(idx[i]) === 5 && role.getX(idx[i + 1]) === 5 && role.getX(idx[i + 2]) === 5;
          (isGlass ? glass : solid).push(idx[i], idx[i + 1], idx[i + 2]);
        }
        const gs = g.clone(); gs.setIndex(solid);
        geos[o.name] = gs;
        if (glass.length) { const gg = g.clone(); gg.setIndex(glass); gg.deleteAttribute('color'); geos[o.name + '_glass'] = gg; }
      } else geos[o.name] = g;
      g.computeBoundingSphere();
    });
    return geos;
  });
  return ready;
}
export const kartGeos = () => geos;

function material(kind, quality) {
  const key = kind + quality;
  if (mats[key]) return mats[key];
  let m;
  if (kind === 'glass') m = new THREE.MeshLambertMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.42, depthWrite: false });
  else if (kind === 'flat') m = quality === 'high' ? new THREE.MeshStandardMaterial({ vertexColors: false, roughness: 0.55, metalness: 0.05 }) : new THREE.MeshLambertMaterial();
  else m = quality === 'high' ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.08 }) : new THREE.MeshLambertMaterial({ vertexColors: true });
  return (mats[key] = m);
}

const tmpC = new THREE.Color();
function paint(geo, colors) {
  const g = geo.clone();
  const base = geo.getAttribute('color'), role = geo.getAttribute('_role');
  const out = new Float32Array(base.count * 3);
  for (let i = 0; i < base.count; i++) {
    const r = role.getX(i);
    const c = r && colors[r];
    if (c) {
      const s = base.getX(i);
      out[i * 3] = c.r * s; out[i * 3 + 1] = c.g * s; out[i * 3 + 2] = c.b * s;
    } else {
      out[i * 3] = base.getX(i); out[i * 3 + 1] = base.getY(i); out[i * 3 + 2] = base.getZ(i);
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(out, 3));
  g.deleteAttribute('_role');
  return g;
}

function numberTexture(num, bg, fg) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fill();
  x.lineWidth = 4; x.strokeStyle = fg; x.stroke();
  x.fillStyle = fg; x.font = 'bold 36px system-ui, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(String(num), 32, 35);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let blobTex = null;
function blobTexture() {
  if (blobTex) return blobTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 4, 32, 32, 32);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.6, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  blobTex = new THREE.CanvasTexture(c);
  return blobTex;
}

const WHEEL_KEYS = ['fl', 'fr', 'bl', 'br'];

export class KartView {
  constructor(cfg, quality = 'high', opts = {}) {
    this.quality = quality;
    this.root = new THREE.Group();
    this.tilt = new THREE.Group();
    this.root.add(this.tilt);
    this.wheelSpin = 0;
    this.steerVis = 0;
    this.bob = 0;
    this.flagT = Math.random() * 10;
    this.castShadow = !!opts.castShadow;
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2;
    blob.renderOrder = 1;
    this.blob = blob;
    this.root.add(blob);
    this.setConfig(cfg);
  }

  setConfig(cfg) {
    cfg = cleanConfig(cfg);
    this.cfg = cfg;
    // throw away the old parts
    for (const o of [...this.tilt.children]) {
      this.tilt.remove(o);
      o.traverse(m => { if (m.isMesh) { if (m.userData.own) m.geometry.dispose(); if (m.userData.ownMat) { m.material.map && m.material.map.dispose(); m.material.dispose(); } } });
    }
    const meta = BODY_META[cfg.type];
    this.meta = meta;
    const col = h => new THREE.Color(h);
    const colors = { 1: col(cfg.body), 2: col(cfg.accent), 3: col(cfg.suit), 4: col(cfg.helmet), 6: col(cfg.accent) };
    const shadow = this.castShadow;
    const mk = (geo, mat, own = true) => { const m = new THREE.Mesh(geo, mat); m.userData.own = own; m.castShadow = shadow; return m; };
    this.body = mk(paint(geos['body_' + cfg.type], colors), material('vc', this.quality));
    this.tilt.add(this.body);
    if (geos['body_' + cfg.type + '_glass']) {
      const g = mk(geos['body_' + cfg.type + '_glass'], material('glass', this.quality), false);
      g.castShadow = false;
      g.renderOrder = 2;
      this.tilt.add(g);
    }
    // driver
    const drv = mk(paint(geos['driver_' + cfg.driver], colors), material('vc', this.quality));
    drv.position.fromArray(meta.seat);
    drv.scale.setScalar(meta.driverScale);
    this.driver = drv;
    this.tilt.add(drv);
    // wheels: steer pivot -> spinning wheel
    const wgeo = paint(geos['wheel_' + cfg.wheel], colors);
    const wm = WHEEL_META[cfg.wheel];
    this.wheels = [];
    for (const k of WHEEL_KEYS) {
      const p = meta.wheels[k];
      const pivot = new THREE.Group();
      pivot.position.fromArray(p);
      const w = mk(wgeo, material('vc', this.quality), k === 'fl');
      const r = meta.wheelR;
      w.scale.set((meta.wheelW / (2 * wm.halfW * r)) * r * (p[0] > 0 ? 1 : -1), r, r);
      pivot.add(w);
      this.tilt.add(pivot);
      this.wheels.push({ pivot, mesh: w, front: k[0] === 'f' });
    }
    // number plate
    const tex = numberTexture(cfg.num, '#ffffff', '#15161c');
    const plate = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), new THREE.MeshBasicMaterial({ map: tex }));
    plate.userData.own = true; plate.userData.ownMat = true;
    plate.position.set(meta.plate[0], meta.plate[1], meta.plate[2]);
    plate.rotation.x = meta.plate[3];
    this.tilt.add(plate);
    // spoiler
    if (cfg.spoiler) {
      const g = new THREE.Group();
      const m1 = new THREE.MeshLambertMaterial({ color: col(cfg.accent) });
      const m2 = new THREE.MeshLambertMaterial({ color: 0x2a2c36 });
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.07, 0.42), m1);
      wing.rotation.x = -0.12;
      wing.position.y = 0.3;
      const endL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.46), m1); endL.position.set(0.69, 0.28, 0);
      const endR = endL.clone(); endR.position.x = -0.69;
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.1), m2); postL.position.set(0.32, 0.13, 0);
      const postR = postL.clone(); postR.position.x = -0.32;
      for (const o of [wing, endL, endR, postL, postR]) { o.userData.own = true; o.castShadow = shadow; g.add(o); }
      wing.userData.ownMat = true; postL.userData.ownMat = true;
      g.position.fromArray(meta.spoiler);
      this.tilt.add(g);
    }
    // antenna flag
    this.flag = null;
    if (cfg.flag) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 5), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
      pole.position.y = 0.65; pole.userData.own = true; pole.userData.ownMat = true;
      const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0, -0.34); shape.lineTo(-0.55, -0.17); shape.closePath();
      const fl = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshLambertMaterial({ color: col(cfg.accent), side: THREE.DoubleSide }));
      fl.position.y = 1.28; fl.rotation.y = Math.PI / 2; fl.userData.own = true; fl.userData.ownMat = true;
      g.add(pole, fl);
      g.position.fromArray(meta.flag);
      this.flag = fl;
      this.tilt.add(g);
    }
    const len = meta.max[2] - meta.min[2], wid = meta.max[0] - meta.min[0];
    this.blob.scale.set(wid * 1.35, len * 1.15, 1);
    this.blob.position.set(0, 0.06, (meta.max[2] + meta.min[2]) / 2);
  }

  // state: { speed, steer, drift (−1/0/1), spin (radians), air (bool), pitch, roll, dt, boosting }
  update(dt, st) {
    const r = this.meta.wheelR;
    this.wheelSpin += (st.speed || 0) * dt / r;
    this.steerVis += ((st.steer || 0) * 0.45 - this.steerVis) * Math.min(1, dt * 12);
    for (const w of this.wheels) {
      w.mesh.rotation.x = this.wheelSpin;
      w.pivot.rotation.y = w.front ? this.steerVis : 0;
    }
    this.bob += dt * (6 + Math.abs(st.speed || 0) * 0.3);
    const bounce = st.air ? 0 : Math.sin(this.bob) * 0.015 * Math.min(1, Math.abs(st.speed || 0) / 10);
    this.tilt.position.y = bounce + (st.hop || 0);
    this.tilt.rotation.order = 'YXZ';
    this.tilt.rotation.y = (st.driftYaw || 0) + (st.spin || 0);
    this.tilt.rotation.x = st.pitch || 0;
    this.tilt.rotation.z = st.roll || 0;
    if (this.flag) { this.flagT += dt * (4 + Math.abs(st.speed || 0) * 0.2); this.flag.rotation.y = Math.PI / 2 + Math.sin(this.flagT) * 0.25; }
    this.blob.visible = !st.air || (st.airH || 0) < 6;
    if (st.airH !== undefined) { this.blob.position.y = 0.06 - st.airH; const k = Math.max(0.3, 1 - st.airH / 8); this.blob.material.opacity = k; }
  }

  dispose() {
    this.root.traverse(m => { if (m.isMesh && m.userData.own) m.geometry.dispose(); if (m.isMesh && m.userData.ownMat) { m.material.map && m.material.map.dispose(); m.material.dispose(); } });
    this.blob.geometry.dispose(); this.blob.material.dispose();
    this.root.removeFromParent();
  }
}
