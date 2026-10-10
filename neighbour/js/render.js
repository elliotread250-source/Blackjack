// three.js view of the world: merged static geometry per material, doors/windows/props/traps/
// cameras that follow the simulation, the neighbour's animation, lights, sky, fog, particles and
// the first-person camera with the item in your hand.
import * as THREE from 'three';
import { makeTextures, TEX_SCALE } from './textures.js';
import { GeoBuilder, addDecor, addRoof, propMesh, trapMesh, setTrapState, cameraMesh, buildNeighbour, animateNeighbour, handMesh, primGeo } from './models.js';
import { windowCenter, doorCenter, F1 } from './level.js';
import { lightAt } from './perception.js';

const SUN_DIR = new THREE.Vector3(-0.62, 0.36, 0.7).normalize();

export class Renderer {
  constructor(canvas, world, opts = {}) {
    this.canvas = canvas;
    this.world = world;
    this.touch = !!opts.touch;
    this.quality = opts.quality || 'high';
    const high = this.quality === 'high';
    const r = this.gl = new THREE.WebGLRenderer({ canvas, antialias: high && !this.touch, powerPreference: 'high-performance' });
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.25;
    r.shadowMap.enabled = high;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.autoClear = false;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.05, 260);
    this.camera.rotation.order = 'YXZ';
    this.handScene = new THREE.Scene();
    this.handCam = new THREE.PerspectiveCamera(60, 1, 0.01, 10);
    this.tex = makeTextures(high ? 256 : 128, high ? 4 : 1);
    this.mats = this.makeMaterials();
    this.t = 0;
    this.eyeY = null;
    this.bob = 0;
    this.shake = 0;
    this.buildSky();
    this.buildLights();
    this.buildStatic();
    this.buildDynamic();
    this.buildHand();
    this.particles = [];
    this.resize();
  }

  makeMaterials() {
    const m = {};
    for (const k of Object.keys(TEX_SCALE)) {
      if (!this.tex[k]) continue;
      if (k === 'emissive') m[k] = new THREE.MeshBasicMaterial({ vertexColors: true });
      else if (k === 'glass') m[k] = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false, emissive: 0x1a2430 });
      else m[k] = new THREE.MeshLambertMaterial({ map: this.tex[k], vertexColors: true });
    }
    this.glassMat = new THREE.MeshLambertMaterial({ color: 0xa8cce8, transparent: true, opacity: 0.28, depthWrite: false, emissive: 0x223040 });
    return m;
  }

  // ------------------------------------------------------------------ sky, fog, lights
  buildSky() {
    const s = this.scene;
    s.fog = new THREE.Fog(0x7a6a8c, 22, 125);
    const g = new THREE.SphereGeometry(240, 24, 16);
    const pos = g.attributes.position, cols = [];
    const c = new THREE.Color();
    const top = new THREE.Color(0x1e2450), mid = new THREE.Color(0x6a5c90), hor = new THREE.Color(0xf09a6a), low = new THREE.Color(0x3a3040);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 240, x = pos.getX(i) / 240, z = pos.getZ(i) / 240;
      const sunness = Math.max(0, x * SUN_DIR.x + z * SUN_DIR.z) * 0.5 + 0.5;
      if (y < 0) c.copy(low);
      else if (y < 0.18) c.copy(hor).lerp(mid, y / 0.18 * (1.2 - sunness * 0.6));
      else c.copy(mid).lerp(top, Math.min(1, (y - 0.18) / 0.6));
      if (y >= 0 && y < 0.35) c.lerp(new THREE.Color(0xffb070), (1 - y / 0.35) * Math.pow(sunness, 6) * 0.7);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const sky = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -1;
    this.sky = sky;
    s.add(sky);
    // low sun
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const cg = cv.getContext('2d');
    const grd = cg.createRadialGradient(64, 64, 2, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,240,200,1)'); grd.addColorStop(0.12, 'rgba(255,200,130,0.95)'); grd.addColorStop(0.35, 'rgba(255,140,80,0.35)'); grd.addColorStop(1, 'rgba(255,120,60,0)');
    cg.fillStyle = grd; cg.fillRect(0, 0, 128, 128);
    const st = new THREE.CanvasTexture(cv); st.colorSpace = THREE.SRGBColorSpace;
    this.sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: st, fog: false, depthWrite: false, blending: THREE.AdditiveBlending, transparent: true }));
    this.sun.scale.setScalar(60);
    s.add(this.sun);
  }

  buildLights() {
    const s = this.scene, high = this.quality === 'high';
    this.hemi = new THREE.HemisphereLight(0xb4b8ff, 0x5a5468, 1.55);
    s.add(this.hemi);
    this.sunLight = new THREE.DirectionalLight(0xffb27a, 2.6);
    this.sunLight.position.copy(SUN_DIR).multiplyScalar(60).add(new THREE.Vector3(0, 0, -20));
    this.sunLight.target.position.set(0, 0, -20);
    if (high) {
      this.sunLight.castShadow = true;
      const sc = this.sunLight.shadow.camera;
      sc.left = -42; sc.right = 42; sc.top = 42; sc.bottom = -42; sc.near = 5; sc.far = 140;
      const n = this.touch ? 1024 : 2048;
      this.sunLight.shadow.mapSize.set(n, n);
      this.sunLight.shadow.bias = -0.0006;
      this.sunLight.shadow.normalBias = 0.04;
    }
    s.add(this.sunLight, this.sunLight.target);
    this.points = [];
    const keep = high ? null : new Set(['kitchen', 'basement', 'porch', 'home', 'living']);
    for (const L of this.world.level.lights) {
      if (keep && !keep.has(L.name)) continue;
      const p = new THREE.PointLight(L.color, L.intensity * 2.2, L.dist * 1.25, 1.6);
      p.position.set(L.x, L.y, L.z);
      p.userData = Object.assign({ base: L.intensity * 2.2, seed: Math.random() * 100 }, L);
      s.add(p);
      this.points.push(p);
    }
  }

  // ------------------------------------------------------------------ static world
  buildStatic() {
    const L = this.world.level;
    const B = new GeoBuilder();
    for (const b of L.boxes) {
      if (!b.vis || !b.m) continue;
      let color = b.c;
      if (b.tf) { color = { all: b.c }; for (const f in b.tf) if (b.tf[f] !== undefined) color[f] = b.tf[f]; }
      B.box(b.m, b.x0, b.y0, b.z0, b.x1, b.y1, b.z1, color, { ao: b.m !== 'glass' });
    }
    // grass, minus the building footprints
    const holes = L.holes;
    const xs = new Set([-90, 90]), zs = new Set([-75, 40]);
    for (const [x0, z0, x1, z1] of holes) { xs.add(x0); xs.add(x1); zs.add(z0); zs.add(z1); }
    const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b);
    const gsc = TEX_SCALE.grass;
    const cg = new THREE.Color();
    for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < Z.length - 1; j++) {
      const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
      if (holes.some(([x0, z0, x1, z1]) => cx > x0 && cx < x1 && cz > z0 && cz < z1)) continue;
      const yard = cz < -6.5 && Math.abs(cx) < 26;
      cg.setHex(yard ? 0x6f8a46 : 0x7a9a4c);
      const x0 = X[i], x1 = X[i + 1], z0 = Z[j], z1 = Z[j + 1], y = -0.02;
      B.quad('grass', [[x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]], [0, 1, 0], [[x0 / gsc, -z1 / gsc], [x1 / gsc, -z1 / gsc], [x1 / gsc, -z0 / gsc], [x0 / gsc, -z0 / gsc]], [[cg.r, cg.g, cg.b]]);
    }
    for (const r of L.roofs) addRoof(B, r);
    for (const d of L.decor) addDecor(B, d);
    this.addOpeningTrim(B);
    this.addBackdrop(B);
    this.staticGroup = B.build(this.mats, { shadows: this.quality === 'high' });
    this.scene.add(this.staticGroup);
  }

  // frames, sills and shutters around windows and door frames
  addOpeningTrim(B) {
    const W = this.world;
    const TR = 0xf1ead8;
    for (const w of W.windows) {
      const out = w.outside || 1;
      const faces = w.axis === 'x' ? [w.t0, w.t1] : [w.t0, w.t1];
      const a = w.c - w.w / 2, b = w.c + w.w / 2;
      for (const [k, f] of [[-1, faces[0]], [1, faces[1]]]) {
        const o = k > 0 ? f : f - 0.05, o1 = k > 0 ? f + 0.05 : f;
        const isOut = k === out;
        const bx = (s0, s1, y0, y1, d0, d1) => (w.axis === 'x' ? B.box('trim', s0, y0, d0, s1, y1, d1, TR) : B.box('trim', d0, y0, s0, d1, y1, s1, TR));
        bx(a - 0.1, a, w.sill - 0.08, w.top + 0.1, o, o1); bx(b, b + 0.1, w.sill - 0.08, w.top + 0.1, o, o1);
        bx(a - 0.1, b + 0.1, w.top, w.top + 0.12, o, o1);
        if (isOut) {
          const s0 = k > 0 ? f : f - 0.16, s1 = k > 0 ? f + 0.16 : f;
          bx(a - 0.16, b + 0.16, w.sill - 0.1, w.sill, s0, s1);
          // shutters on the neighbour's house
          if (!w.id.startsWith('garage') && w.sill < 6) {
            const sc = 0x2e3a34, so0 = k > 0 ? f + 0.02 : f - 0.06, so1 = k > 0 ? f + 0.06 : f - 0.02;
            const sh = (s0b, s1b) => (w.axis === 'x' ? B.box('fence', s0b, w.sill, so0, s1b, w.top, so1, sc) : B.box('fence', so0, w.sill, s0b, so1, w.top, s1b, sc));
            sh(a - 0.68, a - 0.12); sh(b + 0.12, b + 0.68);
          }
        }
      }
    }
    for (const d of W.doors) {
      if (d.id === 'home') continue;
      const a = d.c - d.w / 2, b = d.c + d.w / 2;
      for (const [k, f] of [[-1, d.t0], [1, d.t1]]) {
        const o = k > 0 ? f : f - 0.04, o1 = k > 0 ? f + 0.04 : f;
        const bx = (s0, s1, y0, y1) => (d.axis === 'x' ? B.box('trim', s0, y0, o, s1, y1, o1, TR) : B.box('trim', o, y0, s0, o1, y1, s1, TR));
        bx(a - 0.1, a, d.y, d.y + d.h + 0.1); bx(b, b + 0.1, d.y, d.y + d.h + 0.1); bx(a - 0.1, b + 0.1, d.y + d.h, d.y + d.h + 0.1);
      }
    }
  }

  // distant tree line and rooftops so the street doesn't end at the fog
  addBackdrop(B) {
    let s = 7;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 90; i++) {
      const a = i / 90 * Math.PI * 2 + r() * 0.05;
      const R = 62 + r() * 26;
      const x = Math.cos(a) * R, z = -18 + Math.sin(a) * R * 0.95;
      const h = 7 + r() * 9, w = 3 + r() * 3;
      const m = new THREE.Matrix4().compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, w));
      B.geom('hedge', primGeo('cone'), m, [0x2c3a2a, 0x334430, 0x283426][i % 3]);
      if (i % 3 === 0) B.geom('hedge', primGeo('sphere'), new THREE.Matrix4().compose(new THREE.Vector3(x + 3, 4, z + 2), new THREE.Quaternion(), new THREE.Vector3(4, 4.5, 4)), 0x2e3c2a);
    }
  }

  // ------------------------------------------------------------------ dynamic objects
  setWorld(world) {
    this.world = world;
    this.scene.remove(this.dynGroup);
    this.dynGroup.traverse(o => { if (o.isMesh) { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); } });
    this.buildDynamic();
    this.eyeY = null;
  }

  buildDynamic() {
    const W = this.world;
    const s = this.dynGroup = new THREE.Group();
    this.scene.add(s);
    // doors
    this.doorViews = [];
    for (const d of W.doors) {
      const B = new GeoBuilder();
      const lw = d.w - 0.06, lh = d.h - 0.02, th = 0.06;
      let x0, x1, z0, z1;
      if (d.axis === 'x') { const c = -d.hinge * lw / 2; x0 = c - lw / 2; x1 = c + lw / 2; z0 = -th / 2; z1 = th / 2; }
      else { const c = -d.hinge * lw / 2; z0 = c - lw / 2; z1 = c + lw / 2; x0 = -th / 2; x1 = th / 2; }
      const mat = d.id === 'basement' ? { all: 'board', px: 'board', nx: 'board' } : { all: 'trim', px: 'door', nx: 'door', pz: 'door', nz: 'door' };
      B.box(mat, x0, 0.01, z0, x1, lh, z1, d.tint, { local: true, ao: false });
      // knobs on both faces near the free edge
      const fe = -d.hinge * (lw - 0.1);
      for (const k of [-1, 1]) {
        const m = new THREE.Matrix4().compose(d.axis === 'x' ? new THREE.Vector3(fe, 1.0, k * 0.06) : new THREE.Vector3(k * 0.06, 1.0, fe), new THREE.Quaternion(), new THREE.Vector3(0.045, 0.045, 0.045));
        B.geom('metal', primGeo('sphere'), m, 0xc8a050);
      }
      const leaf = B.build(this.mats, { shadows: this.quality === 'high' });
      const pivot = new THREE.Group();
      const hp = d.axis === 'x' ? [d.c + d.hinge * d.w / 2, d.y, (d.t0 + d.t1) / 2] : [(d.t0 + d.t1) / 2, d.y, d.c + d.hinge * d.w / 2];
      pivot.position.set(...hp);
      pivot.add(leaf);
      s.add(pivot);
      const open = d.axis === 'x' ? (d.hinge === d.swing ? 1 : -1) : (-d.hinge === d.swing ? 1 : -1);
      const v = { d, pivot, open: open * Math.PI / 2 * 0.95 };
      // chain + padlock for chained doors (learned) and the basement
      v.chain = this.chainGroup(d, d.id === 'basement' ? 0xd81e1e : 0x8a8e96, d.id === 'basement');
      v.chain.visible = d.id === 'basement' ? d.locked : d.chained;
      s.add(v.chain);
      this.doorViews.push(v);
    }
    // basement glow under the door (pantry side) and the electric lock on the study door
    const glowCv = document.createElement('canvas'); glowCv.width = 64; glowCv.height = 64;
    const gg = glowCv.getContext('2d'); const gr = gg.createLinearGradient(64, 0, 0, 0);
    gr.addColorStop(0, 'rgba(255,40,20,0.9)'); gr.addColorStop(1, 'rgba(255,40,20,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 64, 64);
    const gt = new THREE.CanvasTexture(glowCv); gt.colorSpace = THREE.SRGBColorSpace;
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.3), new THREE.MeshBasicMaterial({ map: gt, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.glow.rotation.x = -Math.PI / 2; this.glow.position.set(9.1, 0.012, -24.5);
    s.add(this.glow);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 1.2), new THREE.MeshBasicMaterial({ color: 0xff3020 }));
    strip.position.set(9.79, 0.015, -24.5); s.add(strip);
    this.lockLed = this.ledBox(1.88, F1 + 1.3, -15.1, -1, 0x30303a);   // study lock, hall side
    this.fuseView = this.ledBox(W.fusebox.x - 0.05, W.fusebox.y, W.fusebox.z, -1, 0x6a6e74, true);
    // windows
    this.winViews = [];
    for (const w of W.windows) {
      const g = new THREE.Group();
      const m = (w.t0 + w.t1) / 2;
      const pane = new THREE.Mesh(primGeo('box'), this.glassMat);
      if (w.axis === 'x') { pane.scale.set(w.w, w.top - w.sill, 0.03); pane.position.set(w.c, (w.sill + w.top) / 2, m); }
      else { pane.scale.set(0.03, w.top - w.sill, w.w); pane.position.set(m, (w.sill + w.top) / 2, w.c); }
      g.add(pane);
      const MB = new GeoBuilder();
      const y0 = w.sill, y1 = w.top, ym = (y0 + y1) / 2;
      if (w.axis === 'x') { MB.box('trim', w.c - 0.03, y0, m - 0.03, w.c + 0.03, y1, m + 0.03, 0xf1ead8); MB.box('trim', w.c - w.w / 2, ym - 0.03, m - 0.03, w.c + w.w / 2, ym + 0.03, m + 0.03, 0xf1ead8); }
      else { MB.box('trim', m - 0.03, y0, w.c - 0.03, m + 0.03, y1, w.c + 0.03, 0xf1ead8); MB.box('trim', m - 0.03, ym - 0.03, w.c - w.w / 2, m + 0.03, ym + 0.03, w.c + w.w / 2, 0xf1ead8); }
      g.add(MB.build(this.mats));
      s.add(g);
      // boards on the outside face
      const bg = new THREE.Group();
      const out = w.outside || 1;
      const face = out > 0 ? w.t1 + 0.04 : w.t0 - 0.04;
      for (let i = 0; i < 3; i++) {
        const plank = new THREE.Mesh(primGeo('box'), new THREE.MeshLambertMaterial({ color: 0xffffff, map: this.tex.board }));
        const yy = w.sill + 0.22 + i * 0.34, tilt = (i - 1) * 0.12 + (i === 1 ? 0.25 : 0);
        if (w.axis === 'x') { plank.scale.set(w.w + 0.35, 0.2, 0.04); plank.position.set(w.c, yy, face); plank.rotation.z = tilt; }
        else { plank.scale.set(0.04, 0.2, w.w + 0.35); plank.position.set(face, yy, w.c); plank.rotation.x = tilt; }
        plank.castShadow = true;
        bg.add(plank);
      }
      s.add(bg);
      this.winViews.push({ w, glass: g, boards: bg, wasBoards: w.boards, fall: 0 });
    }
    // props
    this.propViews = this.world.props.map(p => {
      const m = propMesh(p.type, this.tex);
      s.add(m);
      const mats = [];
      m.traverse(o => { if (o.isMesh) mats.push(o.material); });
      return { p, m, mats, hl: false };
    });
    // the neighbour
    this.nb = buildNeighbour(this.tex);
    this.nb.root.scale.setScalar(1.0);
    s.add(this.nb.root);
    this.trapViews = new Map();
    this.camViews = new Map();
  }

  chainGroup(d, lockColor, big) {
    const g = new THREE.Group();
    const steel = new THREE.MeshLambertMaterial({ color: 0x9a9ea6 });
    const lockM = new THREE.MeshLambertMaterial({ color: lockColor, emissive: big ? 0x400404 : 0x000000 });
    // which side does the lock face? basement: the pantry (-x). others: outside of the house
    const m = (d.t0 + d.t1) / 2;
    let side = d.axis === 'z' ? -1 : (d.inside ? d.inside : 1);
    if (d.id === 'front') side = 1; if (d.id === 'back') side = -1;
    const off = (big ? 0.1 : 0.08) * side;
    const P = (u, y) => (d.axis === 'z' ? new THREE.Vector3(m + off, d.y + y, d.c + u) : new THREE.Vector3(d.c + u, d.y + y, m + off));
    const link = (a, b, n) => {
      for (let i = 0; i <= n; i++) {
        const t = i / n, p = a.clone().lerp(b, t);
        const l = new THREE.Mesh(primGeo('torus'), steel);
        l.scale.setScalar(0.05); l.position.copy(p);
        l.rotation.set(i % 2 ? Math.PI / 2 : 0, d.axis === 'z' ? Math.PI / 2 : 0, Math.atan2(b.y - a.y, 1));
        g.add(l);
      }
    };
    const hw = d.w / 2 - 0.05;
    link(P(-hw, 1.7), P(hw, 0.5), big ? 16 : 10);
    if (big) { link(P(hw, 1.7), P(-hw, 0.5), 16); link(P(-hw, 1.05), P(hw, 1.05), 12); }
    const body = new THREE.Mesh(primGeo('box'), lockM);
    const s = big ? 0.24 : 0.14;
    body.scale.set(d.axis === 'z' ? 0.08 : s, s * 1.1, d.axis === 'z' ? s : 0.08);
    body.position.copy(P(0, 1.05)); g.add(body);
    const shackle = new THREE.Mesh(primGeo('halfTorus'), steel);
    shackle.scale.setScalar(s * 0.36); shackle.position.copy(P(0, 1.05 + s * 0.55));
    if (d.axis === 'z') shackle.rotation.y = Math.PI / 2;
    g.add(shackle);
    if (big) {
      const ring = new THREE.Mesh(primGeo('cyl'), new THREE.MeshBasicMaterial({ color: 0x220000 }));
      ring.scale.set(0.03, 0.02, 0.03); ring.rotation.z = Math.PI / 2; ring.position.copy(P(0, 1.0)); ring.position.x += -0.045 * (d.axis === 'z' ? 1 : 0);
      g.add(ring);
    }
    return g;
  }

  ledBox(x, y, z, face, color, fuse) {
    const g = new THREE.Group();
    const box = new THREE.Mesh(primGeo('box'), new THREE.MeshLambertMaterial({ color, map: this.tex.metal }));
    box.scale.set(0.1, fuse ? 0.6 : 0.26, fuse ? 0.5 : 0.16); g.add(box);
    const led = new THREE.Mesh(primGeo('sphere'), new THREE.MeshBasicMaterial({ color: 0xff2020 }));
    led.scale.setScalar(0.025); led.position.set(face * 0.055, fuse ? 0.22 : 0.06, fuse ? 0.18 : 0); g.add(led);
    if (fuse) {
      for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(primGeo('cyl'), new THREE.MeshLambertMaterial({ color: i === 1 ? 0x222222 : 0xe8e0c8 })); f.scale.set(0.03, 0.12, 0.03); f.position.set(face * 0.06, -0.05, -0.12 + i * 0.12); g.add(f); if (i === 1) g.userData.slot = f; }
    }
    g.position.set(x, y, z);
    this.dynGroup.add(g);
    g.userData.led = led;
    return g;
  }

  buildHand() {
    this.hand = new THREE.Group();
    this.handScene.add(this.hand);
    this.handArm = handMesh();
    this.hand.add(this.handArm);
    this.heldMeshes = {};
    this.handHemi = new THREE.HemisphereLight(0xfff0e0, 0x403028, 1.6);
    const hd = new THREE.DirectionalLight(0xffffff, 1.2); hd.position.set(1, 2, 1);
    this.handScene.add(this.handHemi, hd);
  }

  // ------------------------------------------------------------------ effects
  burst(kind, x, y, z, n = 14) {
    const colors = { glass: 0xcfe8ff, dust: 0x9a8a78, spark: 0xffd070, wood: 0xa07a4a };
    for (let i = 0; i < n; i++) {
      let p = this.particles.find(q => q.life <= 0);
      if (!p) {
        if (this.particles.length > 80) break;
        p = { m: new THREE.Mesh(primGeo('box'), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })), life: 0 };
        this.scene.add(p.m); this.particles.push(p);
      }
      p.m.material.color.setHex(colors[kind] || 0xffffff);
      p.m.material.opacity = kind === 'glass' ? 0.8 : 1;
      const sz = kind === 'glass' ? 0.06 + Math.random() * 0.06 : 0.04 + Math.random() * 0.05;
      p.m.scale.set(sz, kind === 'glass' ? 0.008 : sz, sz);
      p.m.position.set(x + (Math.random() - 0.5) * 0.4, y + (Math.random() - 0.5) * 0.4, z + (Math.random() - 0.5) * 0.4);
      p.v = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4);
      p.spin = new THREE.Vector3(Math.random() * 10, Math.random() * 10, 0);
      p.life = 1 + Math.random() * 0.8; p.m.visible = true;
    }
  }
  updateParticles(dt) {
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.v.y -= 9 * dt;
      p.m.position.addScaledVector(p.v, dt);
      if (p.m.position.y < 0.01) { p.m.position.y = 0.01; p.v.multiplyScalar(0.3); }
      p.m.rotation.x += p.spin.x * dt; p.m.rotation.y += p.spin.y * dt;
      if (p.life <= 0) p.m.visible = false;
    }
  }

  // ------------------------------------------------------------------ per frame
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const cap = this.quality === 'high' ? (this.touch ? 1.5 : 2) : (this.touch ? 1 : 1.25);
    this.gl.setPixelRatio(Math.min(cap, window.devicePixelRatio || 1));
    this.gl.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1.2 ? 80 : 72;
    this.camera.updateProjectionMatrix();
    this.handCam.aspect = w / h; this.handCam.updateProjectionMatrix();
  }

  frame(dt, view) {
    this.t += dt;
    const W = this.world, t = this.t;
    // lights
    for (const p of this.points) {
      const u = p.userData;
      let k = 1;
      if (u.flicker) {
        const n = Math.sin(t * 13 + u.seed) * Math.sin(t * 7.3 + u.seed * 2) * Math.sin(t * 2.1 + u.seed);
        k = n > 0.55 ? 0.15 : 1 - u.flicker * 0.25 * Math.abs(Math.sin(t * 31 + u.seed));
      }
      if (u.pulse) k = 0.75 + 0.25 * Math.sin(t * 2.2);
      if (u.name === 'basement' && !W.doorById.basement.locked) k *= 1.6;
      p.intensity = u.base * k;
    }
    this.glow.material.opacity = 0.7 + 0.3 * Math.sin(t * 2.2);
    // doors
    for (const v of this.doorViews) {
      const a = v.d.angle, e = a * a * (3 - 2 * a);
      v.pivot.rotation.y = e * v.open;
      const want = v.d.id === 'basement' ? v.d.locked : v.d.chained;
      if (want) { v.chain.visible = true; v.chain.position.y = 0; v.chainFall = 0; }
      else if (v.chain.visible) {
        v.chainFall = (v.chainFall || 0) + dt;
        v.chain.position.y = -v.chainFall * v.chainFall * 4;
        if (v.chainFall > 0.5) v.chain.visible = false;
      }
    }
    const powered = W.flags.power;
    this.lockLed.userData.led.material.color.setHex(powered ? 0x30ff50 : (Math.sin(t * 4) > 0 ? 0xff2020 : 0x601010));
    this.fuseView.userData.led.material.color.setHex(powered ? 0x30ff50 : 0xff2020);
    this.fuseView.userData.slot.visible = powered;
    // windows
    for (const v of this.winViews) {
      v.glass.visible = v.w.glass;
      if (v.w.boards) { v.boards.visible = true; v.fall = 0; v.boards.position.set(0, 0, 0); v.boards.rotation.set(0, 0, 0); for (const pl of v.boards.children) pl.material.color.setHex(v.w.learned ? 0xffe0b0 : 0xb89a7a); }
      else if (v.boards.visible) {
        v.fall += dt;
        v.boards.position.y = -v.fall * v.fall * 5;
        v.boards.position.x += (v.w.axis === 'z' ? (v.w.outside || 1) : 0) * dt * 0.8;
        v.boards.position.z += (v.w.axis === 'x' ? (v.w.outside || 1) : 0) * dt * 0.8;
        if (v.fall > 0.7) v.boards.visible = false;
      }
    }
    // props
    const look = W.look && W.look.kind === 'prop' ? W.look.ref : null;
    for (const v of this.propViews) {
      const p = v.p;
      v.m.visible = !p.held && !p.gone;
      if (!v.m.visible) continue;
      v.m.position.set(p.x, p.y, p.z);
      v.m.rotation.set(p.thrown ? p.ry * 1.3 : 0, p.ry, 0);
      const hl = look === p;
      if (hl !== v.hl) { v.hl = hl; for (const m of v.mats) { if (!m.userData.e0) m.userData.e0 = m.emissive.getHex(); m.emissive.setHex(hl ? 0x3a3a2a : m.userData.e0); } }
      if (p.type === 'redkey' || p.type === 'fuse') for (const m of v.mats) m.emissiveIntensity = 1 + Math.sin(t * 4) * 0.6;
    }
    // neighbour
    const ai = W.ai, N = this.nb;
    N.root.position.set(ai.x, ai.y, ai.z);
    N.root.rotation.y = ai.yaw;
    animateNeighbour(N, ai, t, dt);
    // traps
    for (const tr of W.traps) {
      let v = this.trapViews.get(tr.id);
      if (!v) { v = { m: trapMesh(), t: 0 }; this.dynGroup.add(v.m); this.trapViews.set(tr.id, v); }
      v.m.position.set(tr.x, tr.y + 0.005, tr.z);
      v.t = tr.armed ? 0 : v.t + dt;
      setTrapState(v.m, tr.armed, v.t);
      if (tr.armed) v.m.userData.steel.emissive.setRGB(0.12 + 0.1 * Math.sin(t * 3 + tr.x), 0.06, 0.04);
    }
    // cameras
    for (const c of W.cams) {
      let v = this.camViews.get(c.mount);
      const m = W.level.camMounts.find(q => q.id === c.mount);
      if (!v) { v = cameraMesh(); v.position.set(m.x, m.y, m.z); v.rotation.y = m.yaw; v.rotation.x = -0.25; this.dynGroup.add(v); this.camViews.set(c.mount, v); }
      v.userData.led.visible = Math.sin(t * 5) > 0 || c.seeing;
      v.userData.cone.material.opacity = c.seeing ? 0.14 : c.cool > 0 ? 0.02 : 0.05;
      v.rotation.y = m.yaw + Math.sin(t * 0.5) * 0.35;
    }
    this.updateParticles(dt);
    this.updateCamera(dt, view);
  }

  updateCamera(dt, view) {
    const W = this.world, p = W.player, cam = this.camera, t = this.t;
    this.hand.visible = false;
    if (view.mode === 'title') {
      const a = t * 0.04;
      cam.position.set(-6 + Math.sin(a) * 9, 2.1 + Math.sin(a * 1.7) * 0.4, 8.5 + Math.cos(a) * 1.5);
      cam.lookAt(2 + Math.sin(a * 0.7) * 3, 4.2, -20);
      return;
    }
    const eyeH = p.crouch ? 0.88 : 1.62;
    const targetY = p.y + eyeH;
    if (this.eyeY === null || Math.abs(this.eyeY - targetY) > 2) this.eyeY = targetY;
    this.eyeY += (targetY - this.eyeY) * Math.min(1, dt * 14);
    const moving = p.onGround && p.speed > 0.5 && !p.hiding;
    this.bob += moving ? dt * p.speed * 2.2 : 0;
    const bobY = moving ? Math.sin(this.bob * 2) * (p.sprinting ? 0.045 : 0.025) : 0;
    const bobX = moving ? Math.cos(this.bob) * (p.sprinting ? 0.03 : 0.015) : 0;
    let yaw = p.yaw, pitch = p.pitch, roll = 0;
    let x = p.x, y = this.eyeY + bobY, z = p.z;
    if (p.hiding) {
      const h = W.hides.find(s => s.id === p.hiding);
      x = h.x - Math.sin(h.yaw) * 0.25; z = h.z - Math.cos(h.yaw) * 0.25; y = h.y + 1.5;
    }
    if (p.caught) {
      // turn to face him as he grabs you
      const ai = W.ai;
      const hx = ai.x - Math.sin(ai.yaw) * 0.2, hz = ai.z - Math.cos(ai.yaw) * 0.2, hy = ai.y + 1.85;
      const want = Math.atan2(-(hx - x), -(hz - z));
      const k = Math.min(1, p.caught.t * 3);
      let dy = want - yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      yaw += dy * k;
      const wantP = Math.atan2(hy - y, Math.hypot(hx - x, hz - z));
      pitch += (wantP - pitch) * k;
      this.shake = 0.08 * Math.max(0, 1 - p.caught.t / 2);
      y -= Math.min(0.5, p.caught.t * 0.3);
      roll = Math.sin(p.caught.t * 3) * 0.1;
    }
    if (p.stuck > 0) this.shake = Math.max(this.shake, 0.02);
    this.shake *= Math.pow(0.02, dt);
    const sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake;
    cam.position.set(x + Math.cos(yaw) * bobX, y + sy, z - Math.sin(yaw) * bobX);
    cam.rotation.set(pitch + sy * 0.5, yaw + sx, roll);
    // the item in your hand
    const sel = W.selected();
    if (sel && !p.hiding && !p.caught) {
      this.hand.visible = true;
      for (const k in this.heldMeshes) this.heldMeshes[k].visible = false;
      let hm = this.heldMeshes[sel.type];
      if (!hm) { hm = propMesh(sel.type, this.tex); hm.traverse(o => { if (o.isMesh) o.castShadow = false; }); this.hand.add(hm); this.heldMeshes[sel.type] = hm; }
      hm.visible = true;
      const big = sel.type === 'crate';
      const ch = p.charging ? p.charge : 0;
      hm.position.set(big ? 0 : 0.02, big ? -0.35 : -0.02, big ? -0.1 : -0.06);
      hm.scale.setScalar(big ? 0.5 : sel.type === 'crowbar' ? 0.75 : 0.95);
      hm.rotation.set(0, big ? 0.3 : 1.2, sel.type === 'crowbar' ? 0.9 : 0);
      this.handArm.visible = !big;
      this.hand.position.set(0.3 + bobX * 2 - (big ? 0.3 : 0), -0.27 + bobY * 1.5 - ch * 0.05 - (big ? 0.02 : 0), -0.52 + ch * 0.14);
      this.hand.rotation.set(-ch * 0.5, 0, 0);
      const lv = lightAt(W.level, p.x, p.y + 1, p.z);
      this.handHemi.intensity = 0.5 + lv * 1.5;
    }
  }

  render() {
    const g = this.gl;
    g.clear();
    this.sky.position.copy(this.camera.position);
    this.sun.position.copy(this.camera.position).addScaledVector(SUN_DIR, 200);
    g.render(this.scene, this.camera);
    if (this.hand.visible) { g.clearDepth(); g.render(this.handScene, this.handCam); }
  }
}
