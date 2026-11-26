// Things in the world that are not terrain: creatures, other players, and the cracks on a
// block being mined. Simple box models built in code, lit per entity from the world light.
import {
  BoxGeometry, CanvasTexture, Color, Group, Mesh, MeshBasicMaterial, NearestFilter, Sprite, SpriteMaterial,
} from 'three';
import { MOB_TYPES } from '../game/mobs';
import type { Mob } from '../game/mobs';

export interface RemotePlayerView { id: number; name: string; x: number; y: number; z: number; yaw: number; pitch: number; moving: number; walk: number; swing: number; sneaking: boolean }

interface Limb { g: Group; phase: number; amp: number }
interface Model { root: Group; limbs: Limb[]; mats: { m: MeshBasicMaterial; base: Color }[]; head?: Group }

const unit = new BoxGeometry(1, 1, 1);
const tmp = new Color();

function builder() {
  const model: Model = { root: new Group(), limbs: [], mats: [] };
  const box = (parent: Group, w: number, h: number, d: number, x: number, y: number, z: number, color: number): Mesh => {
    const m = new MeshBasicMaterial({ color });
    const mesh = new Mesh(unit, m);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    model.mats.push({ m, base: new Color(color) });
    return mesh;
  };
  /** A limb hangs from a pivot and swings forwards and backwards. */
  const limb = (w: number, h: number, d: number, x: number, y: number, z: number, color: number, phase: number, amp = 0.7): Group => {
    const g = new Group();
    g.position.set(x, y, z);
    model.root.add(g);
    box(g, w, h, d, 0, -h / 2, 0, color);
    model.limbs.push({ g, phase, amp });
    return g;
  };
  return { model, box, limb };
}

// Every model faces -Z (yaw 0), feet at y = 0.
function mobModel(key: string): Model {
  const { model, box, limb } = builder();
  const r = model.root;
  const quad = (lw: number, lh: number, sx: number, sz: number, c: number) => {
    limb(lw, lh, lw, -sx, lh, -sz, c, 0); limb(lw, lh, lw, sx, lh, -sz, c, Math.PI);
    limb(lw, lh, lw, -sx, lh, sz, c, Math.PI); limb(lw, lh, lw, sx, lh, sz, c, 0);
  };
  switch (key) {
    case 'woolly':
      quad(0.18, 0.45, 0.25, 0.38, 0x3f362f);
      box(r, 0.8, 0.62, 1.1, 0, 0.74, 0, 0xe9e5da);
      box(r, 0.86, 0.3, 0.7, 0, 0.98, 0.05, 0xf4f1e8);
      box(r, 0.42, 0.42, 0.4, 0, 0.92, -0.72, 0x4b4038);
      box(r, 0.1, 0.08, 0.02, -0.11, 0.98, -0.93, 0x111111); box(r, 0.1, 0.08, 0.02, 0.11, 0.98, -0.93, 0x111111);
      break;
    case 'tusker':
      quad(0.16, 0.34, 0.24, 0.34, 0x4a3020);
      box(r, 0.7, 0.5, 1.0, 0, 0.58, 0, 0x7b5337);
      box(r, 0.2, 0.14, 0.9, 0, 0.88, 0.02, 0x5a3a24);
      box(r, 0.5, 0.44, 0.44, 0, 0.6, -0.7, 0x86603f);
      box(r, 0.26, 0.2, 0.16, 0, 0.5, -0.98, 0xb08a68);
      box(r, 0.06, 0.16, 0.06, -0.17, 0.52, -0.98, 0xf2efe2); box(r, 0.06, 0.16, 0.06, 0.17, 0.52, -0.98, 0xf2efe2);
      box(r, 0.08, 0.06, 0.02, -0.13, 0.7, -0.93, 0x111111); box(r, 0.08, 0.06, 0.02, 0.13, 0.7, -0.93, 0x111111);
      break;
    case 'longhorn':
      quad(0.2, 0.6, 0.28, 0.46, 0x4d3521);
      box(r, 0.85, 0.7, 1.3, 0, 0.95, 0, 0x6c4b2f);
      box(r, 0.87, 0.4, 0.5, 0, 1.02, 0.2, 0xe8e2d2);
      box(r, 0.5, 0.5, 0.5, 0, 1.15, -0.85, 0x6c4b2f);
      box(r, 0.34, 0.22, 0.14, 0, 1.0, -1.14, 0xd7b79a);
      box(r, 0.5, 0.08, 0.08, -0.48, 1.42, -0.85, 0xf2efe2); box(r, 0.5, 0.08, 0.08, 0.48, 1.42, -0.85, 0xf2efe2);
      box(r, 0.08, 0.2, 0.08, -0.7, 1.52, -0.85, 0xf2efe2); box(r, 0.08, 0.2, 0.08, 0.7, 1.52, -0.85, 0xf2efe2);
      box(r, 0.08, 0.08, 0.02, -0.14, 1.24, -1.11, 0x111111); box(r, 0.08, 0.08, 0.02, 0.14, 1.24, -1.11, 0x111111);
      break;
    case 'shambler': {
      limb(0.25, 0.75, 0.25, -0.14, 0.75, 0, 0x34493f, 0); limb(0.25, 0.75, 0.25, 0.14, 0.75, 0, 0x34493f, Math.PI);
      box(r, 0.55, 0.72, 0.3, 0, 1.11, 0, 0x4f6f5c);
      box(r, 0.5, 0.2, 0.31, 0, 0.86, 0, 0x3e5547);
      const la = limb(0.2, 0.7, 0.2, -0.38, 1.42, 0, 0x7d9a80, 0, 0.15); la.rotation.x = -1.45;
      const ra = limb(0.2, 0.7, 0.2, 0.38, 1.42, 0, 0x7d9a80, Math.PI, 0.15); ra.rotation.x = -1.45;
      la.userData.rest = -1.45; ra.userData.rest = -1.45;
      box(r, 0.5, 0.5, 0.5, 0, 1.72, 0, 0x7d9a80);
      box(r, 0.12, 0.1, 0.02, -0.12, 1.76, -0.26, 0x16201a); box(r, 0.12, 0.1, 0.02, 0.12, 1.76, -0.26, 0x16201a);
      box(r, 0.26, 0.06, 0.02, 0, 1.58, -0.26, 0x2a3a30);
      break;
    }
    case 'skitter':
      for (let i = 0; i < 3; i++) {
        const z = -0.28 + i * 0.28;
        const l = limb(0.08, 0.42, 0.08, -0.34, 0.4, z, 0x241a30, i * 2.1, 0.5); l.rotation.z = -0.7; l.userData.restZ = -0.7;
        const q = limb(0.08, 0.42, 0.08, 0.34, 0.4, z, 0x241a30, i * 2.1 + Math.PI, 0.5); q.rotation.z = 0.7; q.userData.restZ = 0.7;
      }
      box(r, 0.66, 0.3, 0.9, 0, 0.36, 0.08, 0x3b2b4c);
      box(r, 0.5, 0.22, 0.5, 0, 0.52, 0.2, 0x4a3760);
      box(r, 0.4, 0.26, 0.3, 0, 0.36, -0.5, 0x2c2038);
      box(r, 0.08, 0.08, 0.02, -0.1, 0.42, -0.66, 0xff3030); box(r, 0.08, 0.08, 0.02, 0.1, 0.42, -0.66, 0xff3030);
      box(r, 0.05, 0.05, 0.02, -0.16, 0.32, -0.66, 0xff3030); box(r, 0.05, 0.05, 0.02, 0.16, 0.32, -0.66, 0xff3030);
      break;
    default:   // brute
      limb(0.36, 0.9, 0.36, -0.22, 0.9, 0, 0x3f3833, 0); limb(0.36, 0.9, 0.36, 0.22, 0.9, 0, 0x3f3833, Math.PI);
      box(r, 0.9, 1.0, 0.5, 0, 1.4, 0, 0x5b5149);
      box(r, 0.7, 0.3, 0.52, 0, 1.75, 0, 0x6b6057);
      limb(0.3, 1.0, 0.3, -0.62, 1.86, 0, 0x6b6057, Math.PI, 0.5); limb(0.3, 1.0, 0.3, 0.62, 1.86, 0, 0x6b6057, 0, 0.5);
      box(r, 0.5, 0.42, 0.46, 0, 2.1, -0.04, 0x7a6e63);
      box(r, 0.1, 0.07, 0.02, -0.12, 2.14, -0.28, 0xffb020); box(r, 0.1, 0.07, 0.02, 0.12, 2.14, -0.28, 0xffb020);
      box(r, 0.5, 0.1, 0.5, 0, 2.34, -0.04, 0x4a4039);
  }
  return model;
}

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

function playerModel(name: string): Model {
  const { model, box, limb } = builder();
  const r = model.root;
  const h = hash(name);
  const shirt = new Color().setHSL((h % 360) / 360, 0.55, 0.5).getHex();
  const legs = new Color().setHSL(((h >> 9) % 360) / 360, 0.35, 0.3).getHex();
  const skin = [0xf1c9a5, 0xd9a577, 0xa8744e, 0x7a4f32][(h >> 18) & 3];
  limb(0.24, 0.72, 0.24, -0.13, 0.72, 0, legs, 0); limb(0.24, 0.72, 0.24, 0.13, 0.72, 0, legs, Math.PI);
  box(r, 0.5, 0.72, 0.26, 0, 1.08, 0, shirt);
  limb(0.2, 0.7, 0.2, -0.36, 1.42, 0, skin, Math.PI); limb(0.2, 0.7, 0.2, 0.36, 1.42, 0, skin, 0);
  const head = new Group();
  head.position.set(0, 1.44, 0);
  r.add(head);
  box(head, 0.46, 0.46, 0.46, 0, 0.23, 0, skin);
  box(head, 0.48, 0.14, 0.48, 0, 0.42, 0, [0x3a2a1c, 0x1c1c1c, 0xb9862f, 0x7a3a1e][(h >> 22) & 3]);
  box(head, 0.09, 0.08, 0.02, -0.1, 0.24, -0.24, 0x1b1b1b); box(head, 0.09, 0.08, 0.02, 0.1, 0.24, -0.24, 0x1b1b1b);
  model.head = head;
  return model;
}

function nameTag(name: string): Sprite {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  g.font = 'bold 28px monospace';
  const w = Math.ceil(g.measureText(name).width) + 16;
  c.width = w; c.height = 40;
  g.font = 'bold 28px monospace';
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, w, 40);
  g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(name, 8, 21);
  const tex = new CanvasTexture(c);
  tex.magFilter = NearestFilter;
  const s = new Sprite(new SpriteMaterial({ map: tex, depthTest: true, transparent: true }));
  s.scale.set(w / 110, 40 / 110, 1);
  s.position.set(0, 2.2, 0);
  return s;
}

function crackTextures(): CanvasTexture[] {
  const out: CanvasTexture[] = [];
  // one random walk of cracks, drawn a bit further at every stage
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const paths: number[][] = [];
  for (let k = 0; k < 9; k++) {
    let x = 8, y = 8;
    const p: number[] = [];
    const a = (k / 9) * 6.283 + rnd();
    for (let i = 0; i < 9; i++) {
      p.push(Math.round(x), Math.round(y));
      x += Math.cos(a + (rnd() - 0.5) * 1.6); y += Math.sin(a + (rnd() - 0.5) * 1.6);
    }
    paths.push(p);
  }
  for (let stage = 0; stage < 8; stage++) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(0,0,0,.62)';
    const len = 2 + stage;
    paths.forEach((p, k) => {
      if (k > 2 + stage) return;
      for (let i = 0; i < Math.min(len, p.length / 2); i++) g.fillRect(p[i * 2], p[i * 2 + 1], 1, 1);
    });
    const t = new CanvasTexture(c);
    t.magFilter = NearestFilter; t.minFilter = NearestFilter;
    out.push(t);
  }
  return out;
}

function dispose(m: Model) { for (const q of m.mats) q.m.dispose(); }

function shade(m: Model, light: number, hurt: boolean) {
  for (const q of m.mats) {
    tmp.copy(q.base).multiplyScalar(light);
    if (hurt) { tmp.r = Math.min(1, tmp.r + 0.55); tmp.g *= 0.45; tmp.b *= 0.45; }
    q.m.color.copy(tmp);
  }
}

function animate(m: Model, walk: number, moving: number) {
  for (const l of m.limbs) {
    const s = Math.sin(walk + l.phase) * l.amp * moving;
    if (l.g.userData.restZ !== undefined) l.g.rotation.x = s;
    else l.g.rotation.x = (l.g.userData.rest ?? 0) + s;
  }
}

export class Entities {
  readonly group = new Group();
  private mobs = new Map<number, Model>();
  private players = new Map<number, Model & { tag: Sprite; name: string }>();
  private crack: Mesh | null = null;
  private crackTex: CanvasTexture[] | null = null;

  constructor(parent: Group) { parent.add(this.group); }

  syncMobs(list: Mob[], lightAt: (x: number, y: number, z: number) => number) {
    const seen = new Set<number>();
    for (const mob of list) {
      seen.add(mob.id);
      let m = this.mobs.get(mob.id);
      if (!m) { m = mobModel(MOB_TYPES[mob.t].key); this.mobs.set(mob.id, m); this.group.add(m.root); }
      m.root.position.set(mob.x, mob.y, mob.z);
      m.root.rotation.y = mob.yaw;
      animate(m, mob.walk, mob.moving);
      shade(m, lightAt(mob.x, mob.y + 0.6, mob.z), mob.hurt > 0);
    }
    for (const [id, m] of this.mobs) if (!seen.has(id)) { this.group.remove(m.root); dispose(m); this.mobs.delete(id); }
  }

  syncPlayers(list: RemotePlayerView[], lightAt: (x: number, y: number, z: number) => number) {
    const seen = new Set<number>();
    for (const p of list) {
      seen.add(p.id);
      let m = this.players.get(p.id);
      if (m && m.name !== p.name) { this.group.remove(m.root); dispose(m); this.players.delete(p.id); m = undefined; }
      if (!m) {
        const base = playerModel(p.name);
        const tag = nameTag(p.name);
        base.root.add(tag);
        m = Object.assign(base, { tag, name: p.name });
        this.players.set(p.id, m);
        this.group.add(m.root);
      }
      m.root.position.set(p.x, p.y, p.z);
      m.root.rotation.y = p.yaw;
      if (m.head) m.head.rotation.x = p.pitch;
      animate(m, p.walk, p.moving);
      // the right arm swings when they dig or hit
      const arm = m.limbs[3];
      if (arm && p.swing > 0) arm.g.rotation.x = -1.6 * Math.sin(p.swing * Math.PI);
      shade(m, lightAt(p.x, p.y + 1, p.z), false);
    }
    for (const [id, m] of this.players) if (!seen.has(id)) { this.group.remove(m.root); dispose(m); m.tag.material.map?.dispose(); m.tag.material.dispose(); this.players.delete(id); }
  }

  /** Cracks on the block at (x, y, z); progress 0..1, or null to hide them. */
  setCrack(x: number, y: number, z: number, progress: number | null) {
    if (progress === null || progress <= 0) { if (this.crack) this.crack.visible = false; return; }
    if (!this.crackTex) this.crackTex = crackTextures();
    if (!this.crack) {
      this.crack = new Mesh(new BoxGeometry(1.006, 1.006, 1.006), new MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      this.crack.renderOrder = 5;
      this.group.add(this.crack);
    }
    const stage = Math.max(0, Math.min(7, Math.floor(progress * 8)));
    const mat = this.crack.material as MeshBasicMaterial;
    if (mat.map !== this.crackTex[stage]) { mat.map = this.crackTex[stage]; mat.needsUpdate = true; }
    this.crack.position.set(x + 0.5, y + 0.5, z + 0.5);
    this.crack.visible = true;
  }

  clear() {
    for (const m of this.mobs.values()) { this.group.remove(m.root); dispose(m); }
    for (const m of this.players.values()) { this.group.remove(m.root); dispose(m); m.tag.material.map?.dispose(); m.tag.material.dispose(); }
    this.mobs.clear(); this.players.clear();
    if (this.crack) this.crack.visible = false;
  }
}
