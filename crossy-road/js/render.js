// three.js view of the game: lanes are built when they come into view and dropped behind,
// moving things are placed from the pure time functions in logic.js (so they interpolate
// smoothly between simulation ticks), plus the player's hop animation, deaths, the eagle,
// particles and the character carousel.
import * as THREE from 'three';
import { TICK, HOP_TICKS, COLS, entityX, trainState, CHARACTERS, lerp, clamp } from './logic.js';
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
    this.coinGeo = M.mergeBoxes(M.coinBoxes());
    this.lightOn = new THREE.MeshBasicMaterial({ color: 0xff3020 });
    this.lightOff = new THREE.MeshBasicMaterial({ color: 0x4a1a18 });
    this.lightGeo = new THREE.BoxGeometry(0.16, 0.16, 0.04);

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

  setTheme(name) {
    if (name === this.themeName) return;
    this.themeName = name;
    this.th = M.THEMES[name] || M.THEMES.classic;
    const th = this.th;
    this.scene.background = new THREE.Color(th.sky);
    this.scene.fog = new THREE.Fog(th.fog, 50, 70);
    this.hemi.color.setHex(th.hemi[0]);
    this.hemi.groundColor.setHex(th.hemi[1]);
    this.hemi.intensity = th.hemi[2];
    this.sun.intensity = th.sun;
    this.clearLanes();
    this.updateFog();
  }

  setCharacter(id) {
    if (this.charId === id) return;
    this.charId = id;
    this.playerMesh.geometry = this.charGeo(id);
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
    this.game = game;
    this.camRow = 1; this.camX = 0;
    this.eagle.visible = false;
    this.player.visible = true;
    for (const p of this.particles) { p.life = 0; p.m.visible = false; }
    this.face = 0;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.gl.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.gl.setSize(w, h, false);
    const aspect = w / h;
    this.portrait = aspect < 0.77;
    let halfW, halfH;
    if (this.portrait) { halfW = 5.3; halfH = halfW / aspect; } else { halfH = 5.9; halfW = halfH * aspect; }
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
    const g = this.game, th = this.th;
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
        const key = it.kind === 'pad' ? 'pad:' + this.themeName : 'log:' + it.len + ':' + this.themeName;
        const m = new THREE.Mesh(this.cached(key, () => (it.kind === 'pad' ? M.padBoxes(th) : M.logBoxes(it.len, th))), this.mat);
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
      const sx = -(COLS + 0.9);
      v.lights = [-0.15, 0.15].map(dx => {
        const l = new THREE.Mesh(this.lightGeo, this.lightOff);
        l.position.set(sx + dx, 1.16, 0.51);
        group.add(l);
        return l;
      });
    }
    if (lane.coin !== null && lane.coin !== undefined && lane.type !== 'river' && !g.taken.has(lane.row + ':' + lane.coin)) {
      const c = new THREE.Mesh(this.coinGeo, this.mat);
      c.castShadow = true;
      c.position.set(lane.coin, baseY(lane) + 0.5, 0);
      group.add(c);
      v.coin = c;
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
    if (d.type === 'drown' || d.type === 'drift') {
      this.burst(x, -0.2, z, 22, [0xffffff, 0xd8f3ff, 0x9fdcff], 2.2, 0.16, 0.8, 1.4);
    } else if (d.type === 'car' || d.type === 'train') {
      const cols = this.charColors();
      this.burst(x, 0.4, z, 16, cols, 3.5, 0.13, 0.9);
    }
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
    this.stepParticles(dt);
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
      const flash = s.phase !== 'idle';
      const on = Math.floor(t * 4) % 2 === 0;
      v.lights[0].material = flash && on ? this.lightOn : this.lightOff;
      v.lights[1].material = flash && !on ? this.lightOn : this.lightOff;
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
    this.eagle.visible = false;
    P.visible = true;
    mesh.rotation.set(0, 0, 0);
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
        const u = pose.u;
        sy = 1 + 0.2 * Math.sin(Math.PI * u) - (u < 0.2 ? 0.28 * (1 - u / 0.2) : 0);
      } else {
        const since = (g.tick - p.landTick) / 7;
        if (since < 1) sy = 1 - 0.22 * Math.sin(Math.PI * since);
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
    const s = (g.tick - d.tick) * TICK + 0; // seconds since death
    const z = -d.row;
    if (d.type === 'car') {
      P.position.set(d.x, baseY(g.lane(d.row)) + 0.01, z);
      const k = Math.min(1, s * 12);
      mesh.scale.set(lerp(1, 1.45, k), lerp(1, 0.1, k), lerp(1, 1.45, k));
    } else if (d.type === 'train') {
      const dir = d.dir || 1;
      P.position.set(d.x + dir * s * 24, baseY(g.lane(d.row)) + 0.4 + s * 7 - s * s * 5, z + s * 1.5);
      mesh.rotation.set(s * 9, 0, s * 13 * dir);
      mesh.scale.setScalar(1);
      if (s > 1.4) P.visible = false;
    } else if (d.type === 'drown' || d.type === 'drift') {
      const k = Math.min(1, s * 2.2);
      P.position.set(d.x, -0.3 - k * 1.2, z);
      mesh.scale.set(1, 1, 1);
      mesh.rotation.z = d.side ? -d.side * k : 0;
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
      c.m.rotation.y = on ? t * 1.3 : lerp(c.m.rotation.y, -0.5, 1 - Math.exp(-dt * 4));
      c.m.position.y = on ? Math.abs(Math.sin(t * 3)) * 0.12 : 0;
    }
    const portrait = this.pCam.aspect < 1;
    this.pCam.position.set(this.pPos, portrait ? 2.3 : 2.0, portrait ? 9.5 : 11);
    this.pCam.lookAt(this.pPos, portrait ? 0.8 : 0.5, 0);
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
