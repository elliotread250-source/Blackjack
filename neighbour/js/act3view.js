// three.js side of the nightmare house: the tram and its elevated track, the mannequins, the giant
// mannequin, the Eye, the control-room lever and button, the wardrobe, the windmill, station signs,
// the Fear-door lights and the per-dream fog and lighting.
import * as THREE from 'three';
import { GeoBuilder, primGeo } from './models.js';
import { tramPose, dockedAt } from './act3.js';

const BLUE = 0x2f6fd0, YELLOW = 0xf2c84a, WHITE = 0xf4f2ea;

export class Act3View {
  constructor(R) {
    this.R = R;
    const W = R.world, A = W.a3, L = W.level.act3, s = R.dynGroup;
    this.group = new THREE.Group(); s.add(this.group);
    const shadows = R.gfx.shadows;
    // ---------------------------------------------------------------- the track (built once)
    {
      const B = new GeoBuilder(), loop = A.loop, y = L.tram.y;
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), E3 = new THREE.Euler();
      const put = (m, x, yy, z, yaw, sx, sy, sz, c) => { Q.setFromAxisAngle(up, yaw); P.set(x, yy, z); S.set(sx, sy, sz); M.compose(P, Q, S); B.geom(m, primGeo('box'), M, c); };
      for (let s0 = 0; s0 < loop.len; s0 += 1) {
        const a = loop.at(s0), b = loop.at(s0 + 1), mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, yaw = Math.atan2(-(b.x - a.x), -(b.z - a.z));
        const l = Math.hypot(b.x - a.x, b.z - a.z) + 0.05;
        put('metal', mx, y - 1.0, mz, yaw, 1.0, 0.5, l, 0x3a4a5a);                       // girder
        put('wood', mx, y - 0.7, mz, yaw, 2.2, 0.1, 0.22, 0x5a4030);                      // sleeper
        for (const sd of [-0.72, 0.72]) {
          const ox = Math.cos(yaw) * sd, oz = -Math.sin(yaw) * sd;
          put('metal', mx + ox, y - 0.58, mz + oz, yaw, 0.1, 0.14, l, 0xb8bcc4);       // rails
        }
        // a lattice truss under the deck: lower chord and alternating diagonals on both faces
        for (const sd of [-0.45, 0.45]) {
          const ox = Math.cos(yaw) * sd, oz = -Math.sin(yaw) * sd;
          put('metal', mx + ox, y - 2.05, mz + oz, yaw, 0.12, 0.12, l, 0x2e3a48);
          const pitch = ((Math.floor(s0) % 2) ? 1 : -1) * Math.atan2(l, 0.8);
          E3.set(pitch, yaw, 0, 'YXZ'); Q.setFromEuler(E3); P.set(mx + ox, y - 1.65, mz + oz); S.set(0.08, Math.hypot(l, 0.8), 0.08); M.compose(P, Q, S);
          B.geom('metal', primGeo('box'), M, 0x34424f);
        }
        if (Math.floor(s0) % 4 === 0) put('metal', mx, y - 2.05, mz, yaw, 1.0, 0.1, 0.1, 0x2e3a48);   // cross ties
      }
      this.track = B.build(R.mats, { shadows });
      this.group.add(this.track);
    }
    // ---------------------------------------------------------------- the tram
    {
      const B = new GeoBuilder();
      const len = 7, hl = len / 2, w = 1.3, h = 2.6;
      B.box('metal', -w + 0.1, -0.55, -hl + 0.3, w - 0.1, -0.05, hl - 0.3, 0x2a2e36);            // chassis
      B.box('diamond', -w, -0.05, -hl, w, 0.02, hl, 0xd0d4d8);                                     // floor
      const side = (sx) => {
        const x0 = sx > 0 ? w - 0.06 : -w, x1 = sx > 0 ? w : -w + 0.06;
        const m = { all: 'paint' }, col = sx > 0 ? { px: BLUE, nx: YELLOW, all: BLUE } : { nx: BLUE, px: YELLOW, all: BLUE };
        B.box(m, x0, 0.02, -hl, x1, 1.0, -0.8, col); B.box(m, x0, 0.02, 0.8, x1, 1.0, hl, col);   // doorway in the middle
        B.box(m, x0, 1.9, -hl, x1, h, hl, col);
        for (const z of [-hl, -1.9, -0.8, 0.8, 1.9, hl - 0.2]) B.box(m, x0, 1.0, z, x1, 1.9, z + 0.2, col);
        B.box('glass', x0 + 0.02, 1.0, -1.7, x1 - 0.02, 1.9, -0.8, 0x9ad0f0); B.box('glass', x0 + 0.02, 1.0, 0.8, x1 - 0.02, 1.9, 1.9, 0x9ad0f0);
        B.box('glass', x0 + 0.02, 1.0, -hl + 0.2, x1 - 0.02, 1.9, -1.9, 0x9ad0f0); B.box('glass', x0 + 0.02, 1.0, 2.1, x1 - 0.02, 1.9, hl - 0.2, 0x9ad0f0);
        B.box('paint', x0 - (sx > 0 ? 0 : 0.01), 0.55, -hl, x1 + (sx > 0 ? 0.01 : 0), 0.7, hl, 0xf8f4ea);                     // stripe
      };
      side(1); side(-1);
      for (const ez of [-1, 1]) {
        const z0 = ez < 0 ? -hl : hl - 0.06, z1 = ez < 0 ? -hl + 0.06 : hl;
        const col = ez < 0 ? { nz: BLUE, pz: YELLOW, all: BLUE } : { pz: BLUE, nz: YELLOW, all: BLUE };
        B.box({ all: 'paint' }, -w, 0.02, z0, w, 1.0, z1, col); B.box({ all: 'paint' }, -w, 2.05, z0, w, h, z1, col);
        B.box({ all: 'paint' }, -w, 1.0, z0, -w + 0.2, 2.05, z1, col); B.box({ all: 'paint' }, w - 0.2, 1.0, z0, w, 2.05, z1, col);
        B.box('glass', -w + 0.2, 1.0, z0 + 0.02, w - 0.2, 2.05, z1 - 0.02, 0xbfe0ff);
        for (const sx of [-0.8, 0.8]) B.box('emissive', sx - 0.18, 0.3, ez < 0 ? -hl - 0.03 : hl, sx + 0.18, 0.5, ez < 0 ? -hl : hl + 0.03, ez < 0 ? 0xfff2c0 : 0xff3020);
      }
      B.box({ ny: 'plaster', py: 'paint', all: 'paint' }, -w - 0.08, h, -hl - 0.08, w + 0.08, h + 0.14, hl + 0.08, { ny: WHITE, all: BLUE });   // roof, white inside
      B.box('paint', -0.5, h + 0.14, -1.2, 0.5, h + 0.34, 1.2, 0x2a4a8a);
      // driver's console and the bench at the back
      B.box('metal', -0.7, 0.02, -hl + 0.12, 0.7, 0.95, -hl + 0.7, 0x3a4048);
      B.box('emissive', -0.5, 0.95, -hl + 0.2, -0.1, 0.97, -hl + 0.5, 0x40e070);
      B.box('wood', -w + 0.1, 0.02, hl - 0.75, w - 0.1, 0.45, hl - 0.15, 0x8a4a2a); B.box('wood', -w + 0.1, 0.45, hl - 0.25, w - 0.1, 1.1, hl - 0.12, 0x8a4a2a);
      for (const z of [-2.2, 2.2]) for (const sx of [-0.85, 0.85]) {
        const m = new THREE.Matrix4().compose(new THREE.Vector3(sx, -0.45, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), new THREE.Vector3(0.32, 0.14, 0.32));
        B.geom('metal', primGeo('cyl'), m, 0x1a1a1a);
      }
      const body = B.build(R.mats, { shadows });
      this.tram = new THREE.Group(); this.tram.add(body);
      // the red driving lever on the console
      this.lever = new THREE.Group(); this.lever.position.set(0.35, 0.95, -hl + 0.42);
      const stick = new THREE.Mesh(primGeo('cyl'), new THREE.MeshLambertMaterial({ color: 0x8a8a8a })); stick.scale.set(0.025, 0.42, 0.025); stick.position.y = 0.21; this.lever.add(stick);
      const knob = new THREE.Mesh(primGeo('sphere'), new THREE.MeshLambertMaterial({ color: 0xe02020, emissive: 0x400000 })); knob.scale.setScalar(0.06); knob.position.y = 0.44; this.lever.add(knob);
      this.tram.add(this.lever);
      this.head = new THREE.PointLight(0xfff0c0, 0, 14, 1.6); this.head.position.set(0, 1.2, -hl - 0.6); this.tram.add(this.head);
      this.group.add(this.tram);
    }
    // ---------------------------------------------------------------- mannequins
    const skin = new THREE.MeshToonMaterial({ color: 0xe8d8c0, gradientMap: R.toonRamp });
    const joint = new THREE.MeshToonMaterial({ color: 0x9a8a78, gradientMap: R.toonRamp });
    const apron = new THREE.MeshToonMaterial({ color: 0x3a7ad8, gradientMap: R.toonRamp });
    const tie = new THREE.MeshToonMaterial({ color: 0xc02a2a, gradientMap: R.toonRamp });
    const part = (g, geo, mat, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(primGeo(geo), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = shadows; g.add(m); return m; };
    const makeDummy = (look) => {
      const root = new THREE.Group(), g = new THREE.Group(); root.add(g);
      const legs = [], arms = [];
      for (const sx of [-0.12, 0.12]) { const leg = new THREE.Group(); leg.position.set(sx, 0.95, 0); part(leg, 'cyl', skin, 0, -0.47, 0, 0.075, 0.92, 0.075); part(leg, 'sphere', joint, 0, -0.47, 0, 0.08, 0.06, 0.08); g.add(leg); legs.push(leg); }
      part(g, 'sphere', skin, 0, 1.3, 0, 0.24, 0.4, 0.15);
      if (look === 'shop') part(g, 'box', apron, 0, 1.15, -0.12, 0.36, 0.5, 0.04);
      if (look === 'school') part(g, 'box', tie, 0, 1.38, -0.15, 0.06, 0.28, 0.02);
      for (const sx of [-0.3, 0.3]) { const arm = new THREE.Group(); arm.position.set(sx, 1.58, 0); part(arm, 'cyl', skin, 0, -0.33, 0, 0.055, 0.66, 0.055); g.add(arm); arms.push(arm); }
      part(g, 'cyl', skin, 0, 1.72, 0, 0.06, 0.12, 0.06);
      part(g, 'sphere', skin, 0, 1.92, 0, 0.13, 0.17, 0.13);
      const eyes = [];
      for (const sx of [-0.05, 0.05]) eyes.push(part(g, 'sphere', new THREE.MeshBasicMaterial({ color: look === 'school' ? 0xff1a10 : 0x202020 }), sx, 1.95, -0.115, 0.022, 0.022, 0.012));
      return { root, g, legs, arms, eyes };
    };
    this.dummies = A.mannequins.map(m => { const d = makeDummy(m.look); d.m = m; this.group.add(d.root); return d; });
    // the giant mannequin in the gym
    if (L.giant) {
      const d = makeDummy('school');
      d.g.scale.setScalar(2.4);
      d.root.position.set(L.giant.x, L.giant.y, L.giant.z);
      for (const e of d.eyes) e.material.color.setHex(0xff2a10);
      this.giant = d; this.group.add(d.root);
    }
    // ---------------------------------------------------------------- the Eye
    {
      const E = L.eye, g = new THREE.Group();
      g.position.set(E.x, E.y, E.z);
      const white = new THREE.Mesh(primGeo('sphere2'), new THREE.MeshToonMaterial({ color: 0xf8f4ea, gradientMap: R.toonRamp, emissive: 0x201818 }));
      white.scale.set(0.95, 0.95, 0.5); g.add(white);
      const lid = new THREE.Mesh(primGeo('torus'), new THREE.MeshToonMaterial({ color: 0x6a2a3a, gradientMap: R.toonRamp })); lid.scale.set(1.0, 1.0, 1.6); g.add(lid);
      const iris = new THREE.Group(); g.add(iris);
      const ir = new THREE.Mesh(primGeo('sphere'), new THREE.MeshBasicMaterial({ color: 0x2a8ad8 })); ir.scale.set(0.38, 0.38, 0.1); ir.position.z = 0.45; iris.add(ir);
      const pu = new THREE.Mesh(primGeo('sphere'), new THREE.MeshBasicMaterial({ color: 0x080808 })); pu.scale.set(0.17, 0.17, 0.06); pu.position.z = 0.52; iris.add(pu);
      this.eye = { g, iris, ir, white };
      this.eyeLight = new THREE.PointLight(0xff3020, 0, 9, 1.6); this.eyeLight.position.set(E.x, E.y, E.z + 1.2);
      this.group.add(g, this.eyeLight);
    }
    // ---------------------------------------------------------------- gadgets: lever, button, call posts, fear doors
    this.gadgetViews = [];
    for (const gd of A.gadgets) {
      const v = { g: gd };
      if (gd.kind === 'lever') {
        v.obj = new THREE.Group(); v.obj.position.set(gd.x, gd.y - 0.3, gd.z);
        const st = new THREE.Mesh(primGeo('cyl'), new THREE.MeshLambertMaterial({ color: 0x9a9a9a })); st.scale.set(0.035, 0.6, 0.035); st.position.y = 0.3; v.obj.add(st);
        const kb = new THREE.Mesh(primGeo('sphere'), new THREE.MeshLambertMaterial({ color: 0xe02020, emissive: 0x300000 })); kb.scale.setScalar(0.09); kb.position.y = 0.62; v.obj.add(kb);
        this.group.add(v.obj);
      } else if (gd.kind === 'button') {
        v.mat = new THREE.MeshLambertMaterial({ color: 0xd01818, emissive: 0x200000 });
        v.obj = new THREE.Mesh(primGeo('cyl'), v.mat); v.obj.scale.set(0.2, 0.1, 0.2); v.obj.position.set(gd.x, gd.y - 0.1, gd.z);
        this.group.add(v.obj);
      } else if (gd.kind === 'tramcall' || gd.kind === 'fear' || gd.kind === 'checkout' || gd.kind === 'switch') {
        v.mat = new THREE.MeshBasicMaterial({ color: 0xffd040 });
        v.obj = new THREE.Mesh(primGeo('sphere'), v.mat);
        v.obj.scale.setScalar(gd.kind === 'fear' ? 0.11 : 0.08);
        v.obj.position.set(gd.x, gd.kind === 'fear' ? gd.y + 1.05 : gd.y + 0.15, gd.z);
        if (gd.kind === 'fear') { v.light = new THREE.PointLight(0xff3020, 1.2, 4, 1.6); v.light.position.copy(v.obj.position); this.group.add(v.light); }
        this.group.add(v.obj);
      }
      this.gadgetViews.push(v);
    }
    // ---------------------------------------------------------------- the wardrobe in front of the basement door
    {
      const b = L.blocker, B = new GeoBuilder(), wd = b.x1 - b.x0, ht = b.y1 - b.y0, dp = b.z1 - b.z0;
      B.box({ all: 'wood', pz: 'door' }, -wd / 2, 0, -dp, wd / 2, ht, 0, 0x6a3a2a, { local: false });
      B.box('trim', -0.03, 0.2, -0.02, 0.03, ht - 0.2, 0.01, 0x3a2a1a);
      B.box('wood', -wd / 2 - 0.05, ht, -dp - 0.05, wd / 2 + 0.05, ht + 0.15, 0.05, 0x5a2a1a);
      this.blocker = new THREE.Group(); this.blocker.add(B.build(R.mats, { shadows }));
      this.blocker.position.set((b.x0 + b.x1) / 2, b.y0, b.z1);
      this.group.add(this.blocker);
    }
    // ---------------------------------------------------------------- windmill blades
    if (L.windmill) {
      const g = new THREE.Group(), wm = L.windmill;
      g.position.set(wm.x, wm.y, wm.z);
      const mat = new THREE.MeshToonMaterial({ color: 0xf4ecd8, gradientMap: R.toonRamp });
      const hub = new THREE.Mesh(primGeo('cyl'), new THREE.MeshToonMaterial({ color: 0x8a2c26, gradientMap: R.toonRamp })); hub.rotation.x = Math.PI / 2; hub.scale.set(0.35, 0.4, 0.35); g.add(hub);
      // four lattice sails: a stock, a frame of rails and bars, and a patched canvas over most of it
      const wood = new THREE.MeshToonMaterial({ color: 0x5a3a26, gradientMap: R.toonRamp });
      const canvas = new THREE.MeshToonMaterial({ color: 0xf4ecd8, gradientMap: R.toonRamp, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
      const bar = (parent, m, sx, sy, sz, x, y, z) => { const b = new THREE.Mesh(primGeo('box'), m); b.scale.set(sx, sy, sz); b.position.set(x, y, z); b.castShadow = shadows; parent.add(b); return b; };
      for (let i = 0; i < 4; i++) {
        const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2;
        bar(arm, wood, 0.14, 4.6, 0.12, 0, 2.5, 0.18);                                  // stock
        for (const x of [0.12, 1.0]) bar(arm, wood, 0.05, 3.9, 0.05, x, 2.75, 0.2);     // rails
        for (let k = 0; k < 9; k++) bar(arm, wood, 0.95, 0.04, 0.04, 0.56, 0.9 + k * 0.45, 0.2);
        const sail = bar(arm, i % 2 ? canvas : mat, 0.82, i === 2 ? 2.6 : 3.4, 0.02, 0.56, i === 2 ? 3.3 : 2.9, 0.23);
        sail.material = i === 1 ? canvas : sail.material;
        g.add(arm);
      }
      this.windmill = g; this.group.add(g);
    }
    // ---------------------------------------------------------------- station signs with real lettering
    for (const sg of L.signs || []) {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
      const c = cv.getContext('2d');
      c.fillStyle = '#f2c84a'; c.fillRect(0, 0, 256, 64); c.strokeStyle = '#2a1a10'; c.lineWidth = 8; c.strokeRect(4, 4, 248, 56);
      c.fillStyle = '#2a1a10'; c.font = '900 40px Arial Black, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(sg.text, 128, 35);
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide }));
      m.position.set(sg.x, sg.y, sg.z); m.rotation.y = sg.ry || 0;
      this.group.add(m);
    }
    // ---------------------------------------------------------------- the closet's light
    if (L.closetLight) {
      this.closetLight = new THREE.PointLight(0xfff0d0, 0, 30, 1.2);
      this.closetLight.position.set(L.closetLight.x, L.closetLight.y, L.closetLight.z);
      this.group.add(this.closetLight);
    }
    this.fog0 = { color: R.scene.fog.color.getHex(), near: R.scene.fog.near, far: R.scene.fog.far };
    this.hemi0 = R.hemi.intensity; this.sun0 = R.sunLight.intensity;
    this.lastZone = undefined;
  }

  update(dt, t) {
    const R = this.R, W = R.world, A = W.a3, L = W.level.act3, p = W.player;
    // tram
    const pose = tramPose(W);
    this.tram.position.set(pose.x, pose.y, pose.z); this.tram.rotation.y = pose.yaw;
    this.lever.rotation.x = -(A.tram.v / 8) * 0.7;
    this.head.intensity = A.tram.on ? 3 : 0;
    if (this.windmill) this.windmill.rotation.z += dt * (A.tram.on ? 1.6 : 0.35);
    // mannequins: frozen mid-step whenever they stop
    for (const d of this.dummies) {
      const m = d.m;
      d.root.position.set(m.x, m.y, m.z); d.root.rotation.y = m.yaw;
      if (m.moving) {
        const k = Math.sin(m.walkT * 3.2) * 0.6;
        d.legs[0].rotation.x = k; d.legs[1].rotation.x = -k; d.arms[0].rotation.x = -k * 0.8; d.arms[1].rotation.x = k * 0.8;
      }
      const sleepy = m.zone === 'school' && A.bell;
      for (const e of d.eyes) e.visible = !sleepy;
      if (sleepy) { d.arms[0].rotation.x = d.arms[1].rotation.x = -1.2; }
    }
    if (this.giant) {
      const k = A.giantT < 0 ? 0 : Math.min(1, A.giantT / 1.1), e = k * k;
      this.giant.root.rotation.x = -e * Math.PI / 2 * 0.98;
      this.giant.root.position.z = L.giant.z - e * 0.3;
      if (!A.giantDown) { this.giant.root.rotation.y = Math.sin(t * 0.4) * 0.15; }
    }
    // the Eye follows you round its hall
    {
      const E = L.eye, ey = this.eye;
      const inHall = p.x > E.box.x0 - 3 && p.x < E.box.x1 + 1 && p.z > E.box.z0 && p.z < E.box.z1 + 2 && Math.abs(p.y - (E.y - 1.9)) < 2;
      const tx = inHall ? p.x : E.x + Math.sin(t * 0.6) * 3, ty = inHall ? p.y + 1.2 : E.y, tz = inHall ? p.z : E.z + 6;
      const yaw = Math.atan2(tx - E.x, tz - E.z), pitch = Math.atan2(ty - E.y, Math.hypot(tx - E.x, tz - E.z));
      ey.iris.rotation.y += (Math.max(-0.7, Math.min(0.7, yaw)) - ey.iris.rotation.y) * Math.min(1, dt * 6);
      ey.iris.rotation.x += (Math.max(-0.5, Math.min(0.5, -pitch)) - ey.iris.rotation.x) * Math.min(1, dt * 6);
      const angry = A.eyeT > 0.05;
      ey.ir.material.color.setHex(angry ? 0xff2010 : 0x2a8ad8);
      this.eyeLight.intensity = angry ? 2 + A.eyeT * 6 : 0.4;
      const blink = (t % 5) < 0.12 ? 0.15 : 1;
      ey.g.scale.y = blink;
    }
    // gadgets
    const dock = dockedAt(W);
    for (const v of this.gadgetViews) {
      const g = v.g;
      if (g.kind === 'lever') v.obj.rotation.x += ((A.tram.lever ? 0.7 : -0.7) - v.obj.rotation.x) * Math.min(1, dt * 8);
      else if (g.kind === 'button') { v.mat.emissive.setHex(A.tram.on ? 0xff2020 : A.tram.lever ? ((t * 3) % 1 < 0.5 ? 0xa01010 : 0x200000) : 0x200000); v.obj.position.y = g.y - (A.tram.on ? 0.14 : 0.1); }
      else if (g.kind === 'tramcall') v.mat.color.setHex(!A.tram.on ? 0x502020 : dock && dock.id === g.station ? 0x40ff60 : A.tram.auto === g.station ? ((t * 4) % 1 < 0.5 ? 0xffd040 : 0x604010) : 0xffd040);
      else if (g.kind === 'fear') {
        const done = A.powers[g.power];
        v.mat.color.setHex(done ? 0x40ff60 : 0xff3020);
        v.light.color.setHex(done ? 0x40ff60 : 0xff3020);
        v.light.intensity = done ? 0.8 : 1 + Math.sin(t * 3) * 0.6;
      } else if (g.kind === 'checkout') v.mat.color.setHex(A.groceries >= 5 ? 0x40ff60 : 0xffd040);
      else if (g.kind === 'switch') v.mat.color.setHex(A.closetLight ? 0xffffff : (t * 2) % 1 < 0.5 ? 0xffd040 : 0x806020);
    }
    // the wardrobe falls over, then breaks apart
    if (A.blockerT >= 0) {
      const k = Math.min(1, A.blockerT / 0.7);
      this.blocker.rotation.x = k * k * Math.PI / 2;
      if (A.blockerT > 0.75 && !this.broke) { this.broke = true; const b = L.blocker; R.burst('wood', (b.x0 + b.x1) / 2, b.y0 + 0.4, b.z1 + 1.4, 30); R.shake = 0.12; }
      this.blocker.visible = A.blockerT < 0.8;
    } else this.blocker.visible = !A.blocker;
    if (this.closetLight) this.closetLight.intensity = A.closetLight ? 9 : 0;
    // each dream has its own air
    const zone = A.zone;
    const key = zone + (zone === 'closet' && A.closetLight ? '+lit' : '');
    if (key !== this.lastZone) {
      this.lastZone = key;
      const f = R.scene.fog, zd = zone && L.zones[zone];
      if (zd) {
        const lit = zone === 'closet' && A.closetLight;
        f.color.setHex(lit ? 0x5a4a6a : zd.fog[0]); f.near = lit ? 12 : zd.fog[1]; f.far = lit ? 60 : zd.fog[2];
        R.sunLight.intensity = 0; R.hemi.intensity = zd.dark && !lit ? 0.12 : 0.9;
        R.sky.visible = false;
      } else {
        f.color.setHex(this.fog0.color); f.near = this.fog0.near; f.far = this.fog0.far;
        R.sunLight.intensity = this.sun0; R.hemi.intensity = this.hemi0; R.sky.visible = true;
      }
    }
  }
}
