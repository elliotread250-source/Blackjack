// three.js view of the game: lanes are built when they come into view and dropped behind,
// moving things are placed from the pure time functions in logic.js (so they interpolate
// smoothly between simulation ticks), plus the player's hop animation, deaths, the eagle,
// particles and the character carousel.
import * as THREE from 'three';
import { TICK, COLS, TRAIN_WARN, entityX, trainState, CHARACTERS, lerp, clamp } from './logic.js';
import * as M from './models.js';

const VIEW_BEHIND = 13;
const VIEW_AHEAD = 24;
const CAM_DIR = new THREE.Vector3(-0.26, 1.15, 0.8).normalize();
const CAM_DIST = 40;
const SUN_OFFSET = new THREE.Vector3(5, 12, 3.5);

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    const r = this.gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    this.scene = new THREE.Scene();
    this.mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 1, 120);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1.3);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.4);
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera;
    sc.left = -13; sc.right = 13; sc.top = 15; sc.bottom = -15; sc.near = 1; sc.far = 50;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun, this.sun.target);

    this.views = new Map();
    this.geo = new Map();
    this.themeName = null;
    this.camRow = 0; this.camX = 0;
    this.target = new THREE.Vector3();

    this.player = new THREE.Group();
    this.playerMesh = new THREE.Mesh(undefined, this.mat);
    this.playerMesh.castShadow = true;
    this.player.add(this.playerMesh);
    this.scene.add(this.player);
    // the invincibility force field
    this.shield = 0;
    this.shieldMesh = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 28), new THREE.MeshBasicMaterial({ color: 0x9ff4ff, transparent: true, opacity: 0.8, depthWrite: false }));
    this.shieldMesh.rotation.x = Math.PI / 2; this.shieldMesh.visible = false;
    this.player.add(this.shieldMesh);
    this.shieldMesh2 = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 12), new THREE.MeshBasicMaterial({ color: 0xffc93a, transparent: true, opacity: 0.16, depthWrite: false }));
    this.shieldMesh2.position.y = 0.45; this.shieldMesh2.visible = false;
    this.player.add(this.shieldMesh2);
    // dizzy stars (bonked off a car) and a ripple ring (fell in the water)
    this.stars = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
      st.position.set(Math.cos(i / 4 * Math.PI * 2) * 0.38, Math.sin(i * 2.1) * 0.06, Math.sin(i / 4 * Math.PI * 2) * 0.38);
      this.stars.add(st);
    }
    this.stars.visible = false; this.scene.add(this.stars);
    this.ripple = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 6, 30), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false }));
    this.ripple.rotation.x = Math.PI / 2; this.ripple.visible = false; this.scene.add(this.ripple);
    this.face = 0;

    const ep = M.eagleParts();
    this.eagle = new THREE.Group();
    const eb = new THREE.Mesh(M.mergeBoxes(ep.body), this.mat);
    const wingGeo = M.mergeBoxes(ep.wing);
    this.wingL = new THREE.Mesh(wingGeo, this.mat);
    this.wingR = new THREE.Mesh(wingGeo, this.mat);
    this.wingR.scale.x = -1;
    for (const m of [eb, this.wingL, this.wingR]) { m.castShadow = true; this.eagle.add(m); }
    this.eagle.scale.setScalar(1.15);
    this.eagle.visible = false;
    this.scene.add(this.eagle);

    // particles
    this.particles = [];
    const pg = M.particleGeo();
    for (let i = 0; i < 70; i++) {
      const m = new THREE.Mesh(pg, new THREE.MeshLambertMaterial({ color: 0xffffff }));
      m.visible = false;
      this.scene.add(m);
      this.particles.push({ m, life: 0 });
    }
    // falling snow / leaves for the snowy and autumn worlds
    const N = 260;
    const wg = new THREE.BufferGeometry();
    this.wPos = new Float32Array(N * 3);
    this.wSeed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      this.wPos[i * 3] = (Math.random() - 0.5) * 26;
      this.wPos[i * 3 + 1] = Math.random() * 9;
      this.wPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      this.wSeed[i] = Math.random() * 100;
    }
    wg.setAttribute('position', new THREE.BufferAttribute(this.wPos, 3));
    this.weatherMat = new THREE.PointsMaterial({ color: 0xffffff, size: 4, sizeAttenuation: false, fog: false });
    this.weather = new THREE.Points(wg, this.weatherMat);
    this.weather.frustumCulled = false;
    this.weather.visible = false;
    this.scene.add(this.weather);
    this.coinGeo = M.mergeBoxes(M.coinBoxes());
    this.gemGeo = M.mergeBoxes(M.gemBoxes());
    // balloons and birds drifting across the sky
    this.flyers = [];
    for (let i = 0; i < 3; i++) {
      const group = new THREE.Group();
      group.visible = false;
      this.scene.add(group);
      this.flyers.push({ group, t: -1 - i * 6 });
    }
    this.lightOn = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
    this.lightOff = new THREE.MeshBasicMaterial({ color: 0x4a1a18 });
    this.lightGeo = new THREE.BoxGeometry(0.24, 0.24, 0.05);
    // crossing warning extras: light halos, barrier arms, glowing rails and a floating sign
    const halo = document.createElement('canvas'); halo.width = halo.height = 64;
    { const g = halo.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,90,60,1)'); gr.addColorStop(0.35, 'rgba(255,40,20,.55)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    this.haloMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(halo), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.armGeo = M.mergeBoxes([...Array(6)].map((_, i) => [0.32 + i * 0.36, -0.06, 0, 0.36, 0.12, 0.08, i % 2 ? 0xffffff : 0xe8262a]));
    this.railGlowMat = new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0, depthWrite: false });
    this.railGlowGeo = new THREE.BoxGeometry(36, 0.04, 0.12);
    const sign = document.createElement('canvas'); sign.width = 256; sign.height = 112;
    { const g = sign.getContext('2d'); g.fillStyle = '#d4141e'; g.beginPath(); g.roundRect(6, 6, 244, 100, 22); g.fill(); g.lineWidth = 8; g.strokeStyle = '#fff'; g.stroke();
      g.fillStyle = '#fff'; g.font = '900 46px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🚆 TRAIN!', 128, 60); }
    this.signMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(sign), transparent: true, depthTest: false });
    this.opts = { quality: 'high', reducedMotion: false, shake: true, trainWarning: 'strong' };
    // the champion's crown: gold band, five points, red/blue/purple jewels
    this.crown = new THREE.Group();
    {
      const gold = new THREE.MeshLambertMaterial({ color: 0xffc93a, emissive: 0x6a4a00 });
      this.crownGold = gold;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.12, 10, 1, true), gold);
      band.material.side = THREE.DoubleSide;
      this.crown.add(band);
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 4), gold);
        tip.position.set(Math.cos(a) * 0.19, 0.13, Math.sin(a) * 0.19);
        this.crown.add(tip);
        const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.04), new THREE.MeshBasicMaterial({ color: [0xe8263a, 0x2a6aff, 0xa05aff][i % 3] }));
        jewel.position.set(Math.cos(a + 0.6) * 0.205, 0, Math.sin(a + 0.6) * 0.205);
        this.crown.add(jewel);
      }
      const sparkle = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), new THREE.MeshBasicMaterial({ color: 0xfff4b0 }));
      sparkle.position.set(0.12, 0.26, -0.1); this.crown.add(sparkle); this.crownSparkle = sparkle;
      this.crown.visible = false;
      this.playerMesh.add(this.crown);
    }
    // the Royal Phoenix glows
    this.phoenixLight = new THREE.PointLight(0xffa040, 0, 3.2, 1.6);
    this.phoenixLight.position.set(0, 0.7, 0);
    this.player.add(this.phoenixLight);

    // character carousel scene
    this.pScene = new THREE.Scene();
    this.pCam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.pScene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.5));
    const ps = new THREE.DirectionalLight(0xffffff, 2.2);
    ps.position.set(-3, 6, 5);
    this.pScene.add(ps);
    this.carousel = [];
    this.silhouette = new THREE.MeshBasicMaterial({ color: 0x1b1d2a });
    this.pSel = 0; this.pPos = 0;
    this.resize();
  }

  cached(key, make) {
    let g = this.geo.get(key);
    if (!g) { g = M.mergeBoxes(make()); this.geo.set(key, g); }
    return g;
  }

  // The character's world is where every run starts; further on the world cycles through biomes.
  setTheme(name) {
    if (name === this.themeName) return;
    this.themeName = name;
    this.th = M.THEMES[name] || M.THEMES.classic;
    if (!this.scene.background) this.scene.background = new THREE.Color();
    if (!this.scene.fog) this.scene.fog = new THREE.Fog(0xffffff, 50, 70);
    this.clearLanes();
    this.applyEnv(name, true);
    this.updateFog();
  }

  themeForZone(zone) {
    if (!zone) return this.themeName || 'classic';
    const i = Math.max(0, M.BIOME_ORDER.indexOf(this.themeName));
    let name = M.BIOME_ORDER[(i + zone) % M.BIOME_ORDER.length];
    if (name === this.themeName) name = M.BIOME_ORDER[(i + zone + 1) % M.BIOME_ORDER.length];
    return name;
  }

  // Sky, fog, light and weather for a biome; blended over ~1.5 s unless `now`.
  applyEnv(name, now = false) {
    const th = M.THEMES[name] || M.THEMES.classic;
    this.envName = name;
    const cur = { sky: this.scene.background.clone(), fog: this.scene.fog.color.clone(), hc: this.hemi.color.clone(), hg: this.hemi.groundColor.clone(), hi: this.hemi.intensity, sun: this.sun.intensity };
    this.envFrom = now ? null : cur;
    this.envTo = { sky: new THREE.Color(th.sky), fog: new THREE.Color(th.fog), hc: new THREE.Color(th.hemi[0]), hg: new THREE.Color(th.hemi[1]), hi: th.hemi[2], sun: th.sun };
    this.envT = now ? 1 : 0;
    this.stepEnv(0);
    const snowy = !!th.ice, leafy = name === 'autumn', spooky = name === 'spooky', stars = name === 'space';
    this.weather.visible = !this.weatherOff && (snowy || leafy || spooky || stars);
    this.weatherMat.color.setHex(snowy ? 0xffffff : leafy ? 0xe8742c : spooky ? 0xb88aff : 0xfff6c8);
    this.weatherMat.size = (snowy ? 4 : stars ? 3 : 5) * Math.min(2, window.devicePixelRatio || 1) * 0.75;
    this.weatherFall = snowy ? 1.1 : leafy ? 0.8 : spooky ? 0.35 : 0.05;
  }

  stepEnv(dt) {
    if (this.envT >= 1 && this.envFrom === null && dt) return;
    this.envT = Math.min(1, this.envT + dt / 1.5);
    const k = this.envT * this.envT * (3 - 2 * this.envT), a = this.envFrom || this.envTo, b = this.envTo;
    this.scene.background.copy(a.sky).lerp(b.sky, k);
    this.scene.fog.color.copy(a.fog).lerp(b.fog, k);
    this.hemi.color.copy(a.hc).lerp(b.hc, k);
    this.hemi.groundColor.copy(a.hg).lerp(b.hg, k);
    this.hemi.intensity = lerp(a.hi, b.hi, k);
    this.sun.intensity = lerp(a.sun, b.sun, k);
    if (this.envT >= 1) this.envFrom = null;
  }

  stepWeather(dt) {
    if (!this.weather.visible) return;
    const P = this.wPos, T = this.target, t = performance.now() / 1000;
    for (let i = 0; i < P.length; i += 3) {
      const sd = this.wSeed[i / 3];
      P[i + 1] -= this.weatherFall * dt * (0.7 + (sd % 1) * 0.6);
      P[i] += Math.sin(t * 1.3 + sd) * dt * 0.5;
      if (P[i + 1] < -0.2) P[i + 1] += 9;
      if (P[i] - T.x > 13) P[i] -= 26; else if (P[i] - T.x < -13) P[i] += 26;
      if (P[i + 2] - T.z > 15) P[i + 2] -= 30; else if (P[i + 2] - T.z < -15) P[i + 2] += 30;
    }
    this.weather.geometry.attributes.position.needsUpdate = true;
  }

  setCharacter(id) {
    if (this.charId === id) return;
    this.charId = id;
    const g = this.playerMesh.geometry = this.charGeo(id);
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox, w = Math.max(0.3, Math.min(bb.max.x - bb.min.x, bb.max.z - bb.min.z));
    this.crown.position.set((bb.max.x + bb.min.x) / 2 * 0.3, bb.max.y + 0.01, (bb.max.z + bb.min.z) / 2 * 0.2);
    this.crown.scale.setScalar(clamp(w / 0.55, 0.75, 1.25));
    this.phoenixLight.intensity = id === 'royalphoenix' && this.opts.quality !== 'low' ? 1.6 : 0;
  }
  setCrown(on) { this.crown.visible = !!on; }

  applySettings(o) {
    Object.assign(this.opts, o);
    const q = this.opts.quality;
    const pr = q === 'low' ? 1 : q === 'medium' ? Math.min(1.5, window.devicePixelRatio || 1) : Math.min(2, window.devicePixelRatio || 1);
    this.pixelRatio = pr;
    const shadows = q !== 'low';
    if (this.gl.shadowMap.enabled !== shadows) {
      this.gl.shadowMap.enabled = shadows;
      this.mat.needsUpdate = true;
      this.scene.traverse(m => { if (m.material) m.material.needsUpdate = true; });
    }
    const size = q === 'high' ? 1024 : 512;
    if (this.sun.shadow.mapSize.x !== size) { this.sun.shadow.mapSize.set(size, size); if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; } }
    this.weatherOff = q === 'low';
    this.phoenixLight.intensity = this.charId === 'royalphoenix' && q !== 'low' ? 1.6 : 0;
    this.resize();
  }

  // A small picture of a character for the shop list (cached).
  thumbnail(id, owned = true) {
    this.thumbs = this.thumbs || new Map();
    const key = id + (owned ? '' : ':locked');
    if (this.thumbs.has(key)) return this.thumbs.get(key);
    if (!this.tR) {
      this.tCanvas = document.createElement('canvas'); this.tCanvas.width = this.tCanvas.height = 160;
      this.tR = new THREE.WebGLRenderer({ canvas: this.tCanvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.tScene = new THREE.Scene();
      this.tScene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.5));
      const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(2, 4, 3); this.tScene.add(d);
      this.tCam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
      this.tMesh = new THREE.Mesh(undefined, this.mat); this.tScene.add(this.tMesh);
    }
    const g = this.charGeo(id);
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox, cy = (bb.max.y + bb.min.y) / 2, size = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z);
    this.tMesh.geometry = g; this.tMesh.material = owned ? this.mat : this.silhouette;
    this.tMesh.rotation.y = -0.55;
    this.tCam.position.set(0, cy + size * 0.55, size * 2.9); this.tCam.lookAt(0, cy, 0);
    this.tR.render(this.tScene, this.tCam);
    const url = this.tCanvas.toDataURL('image/png');
    this.thumbs.set(key, url);
    return url;
  }

  charGeo(id) {
    const key = 'char:' + id;
    let g = this.geo.get(key);
    if (!g) { g = M.characterGeo(id); this.geo.set(key, g); }
    return g;
  }

  clearLanes() {
    for (const v of this.views.values()) this.dropLane(v);
    this.views.clear();
  }

  dropLane(v) {
    this.scene.remove(v.group);
    v.ground.geometry.dispose();
  }

  reset(game) {
    this.clearLanes();
    if (this.themeName) this.applyEnv(this.themeName, true);
    this.game = game;
    this.camRow = 1; this.camX = 0;
    this.eagle.visible = false;
    this.player.visible = true;
    for (const p of this.particles) { p.life = 0; p.m.visible = false; }
    this.face = 0;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.gl.setPixelRatio(this.pixelRatio || Math.min(2, window.devicePixelRatio || 1));
    this.gl.setSize(w, h, false);
    if (this.weatherMat) this.weatherMat.size = (this.themeName === 'snow' ? 4 : 5) * Math.min(2, window.devicePixelRatio || 1) * 0.75;
    const aspect = w / h;
    this.portrait = aspect < 0.77;
    let halfW, halfH;
    if (this.portrait) { halfW = 5.0; halfH = halfW / aspect; } else { halfH = 5.9; halfW = halfH * aspect; }
    this.halfH = halfH;
    const c = this.camera;
    c.left = -halfW; c.right = halfW; c.top = halfH; c.bottom = -halfH;
    c.updateProjectionMatrix();
    this.pCam.aspect = aspect;
    this.pCam.fov = aspect < 1 ? 38 : 26;
    this.pCam.updateProjectionMatrix();
    this.updateFog();
  }

  updateFog() {
    if (!this.scene.fog) return;
    const h = this.halfH || 8;
    this.scene.fog.near = CAM_DIST + h * 0.18;
    this.scene.fog.far = CAM_DIST + h * 0.85;
  }

  // ------------------------------------------------------------ lanes
  makeLane(lane) {
    const g = this.game, themeName = this.themeForZone(lane.zone || 0), th = M.THEMES[themeName] || this.th;
    const group = new THREE.Group();
    group.position.z = -lane.row;
    const ground = new THREE.Mesh(M.mergeBoxes(M.laneBoxes(lane, g.lanes.get(lane.row + 1), g.lanes.get(lane.row - 1), th)), this.mat);
    ground.receiveShadow = true;
    ground.castShadow = lane.type === 'grass';
    group.add(ground);
    const v = { lane, group, ground, items: [], coin: null, train: null, lights: null, passKey: [] };
    if (lane.type === 'road') {
      for (const it of lane.items) {
        const m = new THREE.Mesh(this.cached('veh:' + it.kind + ':' + it.color, () => M.vehicleBoxes(it.kind, it.color, th)), this.mat);
        m.castShadow = true;
        m.position.y = -0.12;
        m.rotation.y = lane.dir > 0 ? 0 : Math.PI;
        group.add(m);
        v.items.push(m);
      }
    } else if (lane.type === 'river') {
      for (const it of lane.items) {
        const key = it.kind === 'pad' ? 'pad:' + themeName : it.kind === 'log' ? 'log:' + it.len + ':' + themeName : it.kind + ':' + it.len;
        const m = new THREE.Mesh(this.cached(key, () => (it.kind === 'pad' ? M.padBoxes(th) : it.kind === 'turtles' ? M.turtleBoxes(it.len) : it.kind === 'raft' ? M.raftBoxes(it.len) : M.logBoxes(it.len, th))), this.mat);
        m.castShadow = it.kind !== 'pad';
        m.receiveShadow = true;
        if (it.kind === 'pad') m.rotation.y = (lane.row * 1.7 + it.x0) % 3;
        group.add(m);
        v.items.push(m);
      }
    } else if (lane.type === 'rail') {
      const m = new THREE.Mesh(this.cached('train:' + lane.cars, () => M.trainBoxes(lane.cars)), this.mat);
      m.castShadow = true;
      m.visible = false;
      m.position.y = -0.09;
      m.rotation.y = lane.dir > 0 ? 0 : Math.PI;
      group.add(m);
      v.train = m;
      v.lights = []; v.halos = []; v.arms = [];
      for (const sx of [-(COLS + 0.9), COLS + 0.9]) {
        for (const dx of [-0.2, 0.2]) {
          const l = new THREE.Mesh(this.lightGeo, this.lightOff);
          l.position.set(sx + dx, 1.28, 0.51);
          group.add(l); v.lights.push(l);
          const h = new THREE.Sprite(this.haloMat); h.scale.setScalar(1.1); h.position.set(sx + dx, 1.28, 0.56); h.visible = false;
          group.add(h); v.halos.push(h);
        }
        // barrier arm hinged at the post, swinging out over the crossing
        const arm = new THREE.Group(); arm.position.set(sx, 0.62, 0.5);
        const m = new THREE.Mesh(this.armGeo, this.mat); m.scale.x = sx < 0 ? 1 : -1; arm.add(m);
        arm.rotation.z = sx < 0 ? 1.45 : -1.45; arm.userData.up = arm.rotation.z;
        group.add(arm); v.arms.push(arm);
      }
      v.glow = [-0.27, 0.27].map(z => { const g2 = new THREE.Mesh(this.railGlowGeo, this.railGlowMat); g2.position.set(0, 0.01, z); group.add(g2); return g2; });
      v.sign = new THREE.Sprite(this.signMat); v.sign.scale.set(1.9, 0.83, 1); v.sign.position.set(0, 1.9, 0.6); v.sign.visible = false; group.add(v.sign);
    }
    if (lane.coin !== null && lane.coin !== undefined && lane.type !== 'river' && !g.taken.has(lane.row + ':' + lane.coin)) {
      const c = new THREE.Mesh(lane.gem ? this.gemGeo : this.coinGeo, this.mat);
      c.castShadow = true;
      c.position.set(lane.coin, baseY(lane) + 0.5, 0);
      group.add(c);
      v.coin = c;
      if (lane.gem) {
        // the blue jewel (worth 3) glows so it reads as different from a coin
        if (!this.gemHaloMat) {
          const cv = document.createElement('canvas'); cv.width = cv.height = 64;
          const g2 = cv.getContext('2d'), gr = g2.createRadialGradient(32, 32, 2, 32, 32, 32);
          gr.addColorStop(0, 'rgba(160,240,255,.95)'); gr.addColorStop(0.4, 'rgba(60,180,255,.45)'); gr.addColorStop(1, 'rgba(0,120,255,0)');
          g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
          this.gemHaloMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        }
        const h = new THREE.Sprite(this.gemHaloMat); h.scale.setScalar(1.1); c.add(h); v.gemHalo = h;
      }
    }
    this.scene.add(group);
    return v;
  }

  syncLanes() {
    const g = this.game;
    const lo = Math.floor(this.camRow) - VIEW_BEHIND, hi = Math.ceil(this.camRow) + VIEW_AHEAD;
    for (const [row, v] of this.views) {
      if (row < lo || row > hi || g.lanes.get(row) !== v.lane) { this.dropLane(v); this.views.delete(row); }
    }
    for (let row = lo; row <= hi; row++) {
      if (this.views.has(row)) continue;
      const lane = g.lanes.get(row);
      if (!lane || !g.lanes.get(row + 1)) continue;
      this.views.set(row, this.makeLane(lane));
    }
  }

  collectCoin(row) {
    const v = this.views.get(row);
    if (v && v.coin) {
      const p = v.coin.position;
      this.burst(p.x, p.y, -row, 10, [0xffd84a, 0xffc928, 0xfff2a0], 3.2, 0.12, 0.6);
      v.group.remove(v.coin);
      v.coin = null;
    }
  }

  // ------------------------------------------------------------ particles
  burst(x, y, z, n, colors, speed, size, life, up = 1, grav = 9) {
    let made = 0;
    for (const p of this.particles) {
      if (p.life > 0) continue;
      p.life = p.max = life * (0.7 + Math.random() * 0.6);
      p.m.visible = true;
      p.m.position.set(x + (Math.random() - 0.5) * 0.3, y, z + (Math.random() - 0.5) * 0.3);
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      p.v = new THREE.Vector3(Math.cos(a) * s, (2 + Math.random() * 3) * up, Math.sin(a) * s);
      p.grav = grav;
      p.size = size * (0.6 + Math.random() * 0.8);
      p.m.scale.setScalar(p.size);
      p.m.material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
      p.spin = (Math.random() - 0.5) * 12;
      if (++made >= n) break;
    }
  }

  stepParticles(dt) {
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.m.visible = false; continue; }
      p.v.y -= p.grav * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.rotation.x += p.spin * dt;
      p.m.rotation.z += p.spin * dt * 0.7;
      p.m.scale.setScalar(p.size * Math.min(1, p.life / p.max * 2));
    }
  }

  onDeath(game) {
    const d = game.player.dead;
    const x = d.x, z = -d.row;
    const cols = this.charColors();
    if (d.type === 'drown') this.burst(x, -0.2, z, 30, [0xffffff, 0xd8f3ff, 0x9fdcff], 2.6, 0.17, 0.9, 1.6);
    else if (d.type === 'drift') this.burst(x, -0.2, z, 10, [0xffffff, 0xd8f3ff], 1.2, 0.12, 0.6, 1);
    else if (d.type === 'train') { this.burst(x, 0.4, z, 30, cols, 6, 0.15, 1.1, 1.4); this.burst(x, 0.3, z, 10, [0xffd23f, 0xff8a2a, 0xffffff], 4, 0.1, 0.5); }
    else if (d.type === 'car' && d.how === 'side') this.burst(x, 0.6, z, 8, [0xffd23f, 0xffffff], 2.4, 0.09, 0.5);
    else if (d.type === 'car' && d.how === 'launch') this.burst(x, 0.4, z, 12, cols, 3, 0.12, 0.8);
    else if (d.type === 'car') this.burst(x, 0.1, z, 20, cols, 2.6, 0.12, 0.7, 0.6);
  }

  charColors() {
    const pos = this.playerMesh.geometry.getAttribute('color');
    const out = [];
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i += 24 * 3) { c.setRGB(pos.getX(i), pos.getY(i), pos.getZ(i)); out.push(c.getHex()); }
    return out.length ? out : [0xffffff];
  }

  // ------------------------------------------------------------ per frame
  update(alpha, dt) {
    const g = this.game;
    if (!g) return;
    const t = (g.tick + alpha) * TICK;
    const p = g.player;
    const pose = g.pose(alpha);

    // camera: follow forward smoothly, never behind the creeping push line
    const focus = p.dead ? this.camRow : Math.max(pose.z, g.scroll + 1, 1);
    const k = 1 - Math.exp(-dt * 5);
    this.camRow += (focus - this.camRow) * k;
    const fx = p.dead ? this.camX : clamp(pose.x * 0.55, -2, 2);
    this.camX += (fx - this.camX) * (1 - Math.exp(-dt * 3));
    this.target.set(this.camX + 0.6, 0, -(this.camRow + (this.portrait ? 3.2 : 2.2)));
    this.camera.position.copy(this.target).addScaledVector(CAM_DIR, CAM_DIST);
    this.camera.lookAt(this.target);
    // sun + shadow box follow, snapped to shadow texels to avoid shimmering
    const snap = 26 / 1024;
    const sx = Math.round(this.target.x / snap) * snap, sz = Math.round(this.target.z / snap) * snap;
    this.sun.target.position.set(sx, 0, sz + 2);
    this.sun.position.set(sx, 0, sz + 2).add(SUN_OFFSET);

    this.syncLanes();
    for (const v of this.views.values()) this.updateLane(v, t);

    // player
    this.updatePlayer(g, pose, t, dt);
    if (this.crown.visible) {
      this.crownGold.emissive.setRGB(0.42 + 0.12 * Math.sin(t * 3), 0.29 + 0.08 * Math.sin(t * 3), 0);
      this.crownSparkle.rotation.y = t * 4; this.crownSparkle.scale.setScalar(0.6 + 0.6 * Math.abs(Math.sin(t * 2.3)));
    }
    this.stepParticles(dt);
    this.stepWeather(dt);
    // the sky follows the biome the camera is in
    const here = g.lanes.get(Math.round(this.camRow));
    if (here) { const name = this.themeForZone(here.zone || 0); if (name !== this.envName) this.applyEnv(name); }
    this.stepEnv(dt);
    this.stepFlyers(dt);
  }

  stepFlyers(dt) {
    const T = this.target;
    for (const f of this.flyers) {
      if (!f.group.visible) {
        f.t += dt;
        if (f.t < 0) continue;
        // launch from one side, a few rows ahead of the camera
        f.group.clear();
        const balloon = Math.random() < 0.45;
        const c = [0xff5a5a, 0x5ab4ff, 0xffd23f, 0x8be36b, 0xc77dff][Math.floor(Math.random() * 5)];
        f.group.add(new THREE.Mesh(balloon ? this.cached('balloon:' + c, () => M.balloonBoxes(c)) : this.cached('birds', () => M.birdBoxes()), this.mat));
        f.balloon = balloon;
        f.dir = Math.random() < 0.5 ? 1 : -1;
        f.speed = balloon ? 0.9 + Math.random() * 0.5 : 3.2 + Math.random() * 1.5;
        f.group.position.set(T.x - f.dir * 16, balloon ? 4.6 + Math.random() * 1.6 : 3.8 + Math.random(), T.z - 4 - Math.random() * 12);
        f.group.rotation.y = balloon ? 0 : f.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
        f.group.visible = true;
        f.t = 0;
        continue;
      }
      f.t += dt;
      f.group.position.x += f.dir * f.speed * dt;
      f.group.position.y += (f.balloon ? Math.cos(f.t) * 0.08 : Math.cos(f.t * 6) * 0.3) * dt;
      if (Math.abs(f.group.position.x - T.x) > 17) { f.group.visible = false; f.t = -(8 + Math.random() * 14); }
    }
  }


  updateLane(v, t) {
    const lane = v.lane;
    if (lane.type === 'road' || lane.type === 'river') {
      for (let i = 0; i < v.items.length; i++) {
        const it = lane.items[i];
        v.items[i].position.x = entityX(lane, it, t);
        if (lane.type === 'river' && it.kind === 'log') v.items[i].position.y = Math.sin(t * 2.4 + i * 1.7 + lane.row) * 0.015;
      }
    } else if (lane.type === 'rail') {
      const s = trainState(lane, t);
      v.train.visible = s.phase === 'pass';
      if (v.train.visible) v.train.position.x = s.head;
      // warning from the moment the cycle leaves "idle" until the last carriage has passed
      const warn = s.phase !== 'idle';
      const steady = this.opts.reducedMotion || this.opts.trainWarning === 'steady';
      const ab = Math.floor(t * 3) % 2 === 0;          // ~1.5 alternations a second, never strobing
      for (let i = 0; i < v.lights.length; i++) {
        const lit = warn && (steady || (i % 2 === 0) === ab);
        v.lights[i].material = lit ? this.lightOn : this.lightOff;
        v.halos[i].visible = lit;
      }
      // barrier arms lower over the first 0.6 s of the warning and rise when the train has gone
      const down = s.phase === 'pass' ? 1 : s.phase === 'warn' ? clamp((TRAIN_WARN - s.until) / 0.6, 0, 1) : 0;
      for (const arm of v.arms) arm.rotation.z = arm.userData.up * (1 - down);
      for (const gl of v.glow) gl.visible = warn;
      if (warn) this.railGlowMat.opacity = steady ? 0.75 : 0.45 + 0.35 * (ab ? 1 : 0);
      v.sign.visible = s.phase === 'warn';
      if (v.sign.visible) { v.sign.position.x = clamp(this.target.x, -COLS + 1, COLS - 1); v.sign.position.y = 1.9 + (steady ? 0 : Math.sin(t * 6) * 0.06); }
    }
    if (v.coin) {
      v.coin.rotation.y = t * 3 + lane.row;
      v.coin.position.y = baseY(lane) + 0.5 + Math.sin(t * 4 + lane.row) * 0.05;
    }
  }

  standY(row, x, t, onFloat, waterAllowed) {
    const lane = this.game.lane(row);
    if (lane.type === 'river') {
      if (!onFloat) return waterAllowed ? -0.34 : 0.04;
      return onFloat.pad ? -0.24 : 0.05 + Math.sin(t * 2.4 + onFloat.idx * 1.7 + row) * 0.015;
    }
    return baseY(lane);
  }

  updatePlayer(g, pose, t, dt) {
    const p = g.player;
    const P = this.player, mesh = this.playerMesh;
    {
      const on = this.shield > 0 && !p.dead && (this.shield > 3 || Math.floor(t * 8) % 2 === 0);
      this.shieldMesh.visible = this.shieldMesh2.visible = on;
      if (on) {
        this.shieldMesh.position.y = 0.1 + (Math.sin(t * 5) * 0.5 + 0.5) * 0.8;
        this.shieldMesh.scale.setScalar(1 + Math.sin(t * 9) * 0.08);
        this.shieldMesh2.material.opacity = 0.12 + Math.sin(t * 6) * 0.06;
      }
    }
    this.eagle.visible = false;
    P.visible = true;
    mesh.rotation.set(0, 0, 0);
    if (!p.dead) { this.stars.visible = false; this.ripple.visible = false; }
    if (!p.dead) {
      // facing
      let d = p.face - this.face;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.face += d * Math.min(1, dt * 22);
      P.rotation.y = this.face;
      let y;
      if (p.hop) {
        const h = p.hop;
        const fromLane = g.lane(h.fromRow), toLane = g.lane(h.toRow);
        const y0 = fromLane.type === 'river' ? this.standY(h.fromRow, 0, t, { pad: fromLane.speed === 0, idx: 0 }) : baseY(fromLane);
        const y1 = toLane.type === 'river'
          ? (h.float ? (toLane.speed === 0 ? -0.24 : 0.05) : -0.34)
          : baseY(toLane);
        y = lerp(y0, y1, pose.u) + pose.y;
      } else if (p.onLog) {
        const lane = g.lane(p.row);
        y = this.standY(p.row, pose.x, t, { pad: lane.speed === 0, idx: p.onLog.idx });
      } else y = baseY(g.lane(p.row));
      P.position.set(pose.x, y, -pose.z);
      // squash and stretch
      let sy = 1;
      if (p.hop) {
        const u = pose.u, arc = Math.sin(Math.PI * u);
        if (this.hopRef !== p.hop) { this.hopRef = p.hop; this.waddle = -(this.waddle || 1); }
        sy = 1 + 0.26 * arc - (u < 0.25 ? 0.32 * (1 - u / 0.25) : 0);
        // a cheeky hop: lean into it, rock to one side (alternating), a little twist, tuck at the top
        mesh.rotation.x = -0.42 * arc;
        mesh.rotation.z = this.waddle * 0.32 * arc;
        mesh.rotation.y = this.waddle * 0.25 * Math.sin(2 * Math.PI * u);
      } else {
        const since = (g.tick - p.landTick) / 5;
        if (since < 1) { sy = 1 - 0.26 * Math.sin(Math.PI * since); mesh.rotation.z = -(this.waddle || 1) * 0.12 * Math.sin(Math.PI * since); }
        else sy = 1 + Math.sin(t * 3.2) * 0.025;
        const bump = (g.tick - p.bumpTick) / 8;
        if (bump < 1) { mesh.rotation.x = -Math.sin(bump * Math.PI) * 0.25; sy *= 1 - 0.1 * Math.sin(bump * Math.PI); }
      }
      const sxz = 1 / Math.sqrt(sy);
      mesh.scale.set(sxz, sy, sxz);
      return;
    }
    // ---- deaths
    const d = p.dead;
    this.stars.visible = false; this.ripple.visible = false;
    const s = (g.tick - d.tick) * TICK + 0; // seconds since death
    const z = -d.row;
    const by = baseY(g.lane(d.row));
    if (d.type === 'car' && d.how === 'side') {
      // bonk! bounced off the side of the car, tumble backwards, land on your back seeing stars
      const back = { up: [0, -1], down: [0, 1], left: [1, 0], right: [-1, 0] }[d.hopDir] || [0, -1];
      const fly = Math.min(s, 0.45), u = fly / 0.45;
      P.position.set(d.x + back[0] * u * 1.1, by + (d.y || 0) + Math.sin(Math.PI * u) * 0.9, z - back[1] * u * 1.1);
      const lie = Math.min(1, s / 0.45);
      mesh.rotation.set(lie * 1.45, 0, 0);   // flat on your back (the model faces -z)
      mesh.scale.set(1, 1, 1);
      if (s > 0.45) { const w = Math.sin((s - 0.45) * 14) * 0.08 * Math.max(0, 1 - (s - 0.45)); P.position.y = by + 0.05 + Math.abs(w); }
      this.stars.visible = s > 0.4;
      this.stars.position.set(P.position.x, by + 0.9, P.position.z);
      this.stars.rotation.y = s * 6;
    } else if (d.type === 'car' && d.how === 'launch') {
      // smacked by a little car: launched spinning into the air, bounce, flop
      const dir = d.dir || 1, air = 0.75;
      const u = Math.min(s, air);
      const bounce = s > air ? Math.abs(Math.sin((s - air) * 9)) * 0.35 * Math.max(0, 1 - (s - air) * 1.5) : 0;
      P.position.set(d.x + dir * (u * 4.2 + Math.max(0, s - air) * 0.8 * Math.max(0, 1 - (s - air))), by + Math.max(0, u * 6 - u * u * 8) + bounce + 0.02, z);
      mesh.rotation.set(s < air ? s * 3 : 0, 0, s < air ? -dir * s * 16 : -dir * Math.PI / 2);
      mesh.scale.setScalar(1);
    } else if (d.type === 'car') {
      // run over by something big: squashed flat, then stuck there like a sticker
      P.position.set(d.x, by + 0.01, z);
      const k = Math.min(1, s * 14);
      const wob = s > 0.08 ? Math.sin(s * 30) * 0.06 * Math.max(0, 1 - s * 2) : 0;
      mesh.scale.set(lerp(1, 1.6, k) + wob, lerp(1, 0.07, k), lerp(1, 1.6, k) - wob);
      mesh.rotation.y = k * 0.4 * (d.dir || 1);
    } else if (d.type === 'train') {
      // blasted off the tracks and out of sight
      const dir = d.dir || 1;
      P.position.set(d.x + dir * s * 24, by + 0.4 + s * 7 - s * s * 5, z + s * 1.5);
      mesh.rotation.set(s * 9, 0, s * 13 * dir);
      mesh.scale.setScalar(1 + s * 0.3);
      if (s > 1.4) P.visible = false;
    } else if (d.type === 'drown') {
      // splash, flail with arms up for a moment, then glug glug down
      const flail = Math.min(s, 0.7);
      const sink = Math.max(0, s - 0.7);
      P.position.set(d.x + Math.sin(s * 11) * 0.04, -0.25 + Math.sin(flail * 14) * 0.1 * (1 - flail / 0.7) - sink * sink * 2.4, z);
      mesh.rotation.set(Math.sin(s * 9) * 0.25, s * 2, Math.sin(s * 13) * 0.35);
      mesh.scale.set(1, 1, 1);
      this.ripple.visible = s < 1.6;
      this.ripple.position.set(d.x, -0.2, z);
      this.ripple.scale.setScalar(0.4 + s * 1.4);
      this.ripple.material.opacity = Math.max(0, 0.7 - s * 0.45);
      if (sink > 0.7) P.visible = false;
      if (Math.floor(s * 10) !== this.bubbleT && sink > 0) { this.bubbleT = Math.floor(s * 10); this.burst(d.x, -0.25, z, 2, [0xffffff, 0xd8f3ff], 0.4, 0.07, 0.6, 0.6, -2); }
    } else if (d.type === 'drift') {
      // swept off the edge on your log: spin away into the distance
      const k = Math.min(1, s * 1.6), side = d.side || 1;
      P.position.set(d.x + side * s * 5, -0.2 - k * 0.6, z + Math.sin(s * 3) * 0.3);
      mesh.rotation.set(0, s * 10, side * k * 1.2);
      mesh.scale.setScalar(1 - k * 0.5);
      if (k >= 1) P.visible = false;
    } else if (d.type === 'eagle') {
      this.eagle.visible = true;
      const swoop = 0.55;
      const px = d.x, pz = z;
      const by = baseY(g.lane(d.row));
      if (s < swoop) {
        const u = s / swoop;
        this.eagle.position.set(px, lerp(4.5, by + 0.85, u * u * (3 - 2 * u)), lerp(pz - 13, pz, u));
        P.position.set(px, by, pz);
        mesh.scale.set(1, 1, 1);
      } else {
        const u = s - swoop;
        this.eagle.position.set(px, by + 0.85 + u * 3.2, pz + u * 15);
        P.position.set(px, this.eagle.position.y - 0.85, this.eagle.position.z - 0.1);
        mesh.scale.set(0.9, 1.1, 0.9);
      }
      this.eagle.rotation.set(s < swoop ? 0.25 : -0.2, Math.PI, 0);
      const f = Math.sin(s * (s < swoop ? 10 : 24)) * 0.6;
      this.wingL.rotation.z = f;
      this.wingR.rotation.z = -f;
    }
  }

  render() {
    this.gl.render(this.scene, this.camera);
  }

  // ------------------------------------------------------------ character carousel
  buildCarousel(owned) {
    for (const c of this.carousel) this.pScene.remove(c.group);
    this.carousel = CHARACTERS.map((ch, i) => {
      const group = new THREE.Group();
      const base = new THREE.Mesh(this.cached('pedestal', () => [
        [0, -0.26, 0, 1.1, 0.26, 1.1, 0x8fd35a], [0, -0.36, 0, 1.14, 0.1, 1.14, 0x5f9c35],
      ]), this.mat);
      const m = new THREE.Mesh(this.charGeo(ch.id), owned.has(ch.id) ? this.mat : this.silhouette);
      group.add(base, m);
      group.position.x = i * 2.2;
      this.pScene.add(group);
      return { id: ch.id, group, m };
    });
  }

  setCarouselOwned(owned) {
    for (const c of this.carousel) c.m.material = owned.has(c.id) ? this.mat : this.silhouette;
  }

  renderCarousel(sel, dt, theme) {
    const th = M.THEMES[theme] || M.THEMES.classic;
    if (!this.pBg || this.pBgTheme !== theme) { this.pBg = new THREE.Color(th.sky); this.pBgTheme = theme; }
    this.pScene.background = this.pBg;
    this.pPos += (sel * 2.2 - this.pPos) * (1 - Math.exp(-dt * 9));
    const t = performance.now() / 1000;
    for (let i = 0; i < this.carousel.length; i++) {
      const c = this.carousel[i];
      const on = i === sel;
      const s = on ? 1.35 : 0.9;
      c.group.scale.setScalar(lerp(c.group.scale.x || 1, s, 1 - Math.exp(-dt * 10)));
      // the Royal Phoenix gets a showier turn: it rises, spins faster and flutters
      const royal = on && c.id === 'royalphoenix';
      c.m.rotation.y = on ? t * (royal ? 2.4 : 1.3) : lerp(c.m.rotation.y, -0.5, 1 - Math.exp(-dt * 4));
      c.m.position.y = on ? (royal ? 0.25 + Math.sin(t * 5) * 0.08 : Math.abs(Math.sin(t * 3)) * 0.12) : 0;
      c.m.rotation.z = royal ? Math.sin(t * 9) * 0.05 : 0;
    }
    const portrait = this.pCam.aspect < 1, short = window.innerHeight < 560;
    if (portrait) { this.pCam.position.set(this.pPos, 2.4, 11); this.pCam.lookAt(this.pPos, 0.2, 0); }
    else if (short) { this.pCam.position.set(this.pPos, 1.6, 13); this.pCam.lookAt(this.pPos, -0.25, 0); }
    else { this.pCam.position.set(this.pPos, 2.0, 11); this.pCam.lookAt(this.pPos, 0.3, 0); }
    this.gl.render(this.pScene, this.pCam);
  }
}

export function baseY(lane) {
  switch (lane.type) {
    case 'road': return -0.12;
    case 'rail': return -0.09;
    case 'river': return -0.34;
    default: return 0;
  }
}
