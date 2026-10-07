import {
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  type Material,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  type Texture,
} from 'three';
import { CONTAINER, HAMMER } from '../config';
import { HANDLE_START, headPieces } from '../sim/player';
import type { TextureSet } from './textures';

/**
 * The pick rides in front of the frog and the barrel (their front surfaces
 * stop short of z 0.51), so the head and shaft can pass across the body.
 */
export const PICK_Z = 0.6;

const UP = new Vector3(0, 1, 0);
const tmpQ = new Quaternion();
const tmpV = new Vector3();

/** Stretch a y-aligned unit mesh between two points. */
function placeBetween(mesh: Mesh, a: Vector3, b: Vector3, unitLength: boolean): void {
  tmpV.subVectors(b, a);
  const len = tmpV.length();
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  tmpQ.setFromUnitVectors(UP, tmpV.normalize());
  mesh.quaternion.copy(tmpQ);
  if (unitLength) mesh.scale.set(1, Math.max(0.0001, len), 1);
}

/** Classic two-bone IK: elbow on the side the pole points to. */
function solveIK(s: Vector3, t: Vector3, l1: number, l2: number, pole: Vector3, outElbow: Vector3, outHand: Vector3): void {
  const dir = new Vector3().subVectors(t, s);
  let d = dir.length();
  dir.normalize();
  const max = l1 + l2 - 1e-3;
  const min = Math.abs(l1 - l2) + 1e-3;
  d = Math.min(max, Math.max(min, d));
  outHand.copy(s).addScaledVector(dir, d);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const side = pole.clone().addScaledVector(dir, -pole.dot(dir));
  if (side.lengthSq() < 1e-6) side.set(0, -1, 0);
  side.normalize();
  outElbow.copy(s).addScaledVector(dir, a).addScaledVector(side, h);
}

/** Crescent pick outline from the same centreline the physics uses. */
function pickShape(): Shape {
  // Walk the outer edge of the upper pick (tip to eye), round the striking
  // face, the outer edge of the lower pick out to its tip, then back along
  // the inner edges. Using the convex pieces' hulls keeps visuals honest.
  const pieces = headPieces();
  const upper = pieces.slice(1, 4);
  const lower = pieces.slice(4, 7);
  const s = new Shape();
  const tipU = upper[2][1];
  s.moveTo(tipU.x, tipU.y);
  // Outer (convex) side of the upper pick: second and third verts of each quad, reversed order.
  s.lineTo(upper[2][2].x, upper[2][2].y);
  s.quadraticCurveTo(upper[1][2].x + 0.01, upper[1][2].y, upper[1][3].x, upper[1][3].y);
  s.quadraticCurveTo(upper[0][2].x + 0.02, upper[0][2].y, 0.085, 0.05);
  s.lineTo(0.085, -0.05);
  s.quadraticCurveTo(lower[0][1].x + 0.02, lower[0][1].y, lower[1][0].x, lower[1][0].y);
  s.quadraticCurveTo(lower[1][1].x + 0.01, lower[1][1].y, lower[2][1].x, lower[2][1].y);
  s.lineTo(lower[2][2].x, lower[2][2].y);
  // Inner (concave) side of the lower pick back to the eye.
  s.quadraticCurveTo(lower[1][3].x - 0.005, lower[1][3].y, lower[0][3].x, lower[0][3].y);
  s.lineTo(-0.075, -0.07);
  s.lineTo(-0.075, 0.07);
  s.lineTo(upper[0][0].x, upper[0][0].y);
  s.quadraticCurveTo(upper[1][0].x - 0.005, upper[1][0].y, upper[2][0].x, upper[2][0].y);
  s.lineTo(tipU.x, tipU.y);
  return s;
}

export class PlayerModel {
  readonly root = new Group();
  readonly barrel = new Group();
  readonly frog = new Group();
  readonly pick = new Group();
  private eyes: { white: Mesh; pupil: Mesh; lid: Mesh; base: Vector3 }[] = [];
  private mouth: Mesh;
  private arms: { upper: Mesh; lower: Mesh; hand: Mesh; shoulder: Vector3; side: 1 | -1 }[] = [];
  private blinkT = 2;
  private blink = 0;
  private time = 0;
  private lean = 0;
  readonly metalMats: MeshStandardMaterial[] = [];
  private pbr: boolean;

  /** PBR on the GPU presets; Lambert/Phong (much cheaper per pixel) on the CPU preset. */
  private mat(o: { color: string; roughness?: number; metalness?: number; map?: Texture; normalMap?: Texture; transparent?: boolean; opacity?: number }): Material {
    const color = new Color(o.color);
    if (this.pbr) {
      const m = new MeshStandardMaterial({ color, roughness: o.roughness ?? 0.6, metalness: o.metalness ?? 0, map: o.map ?? null, normalMap: o.normalMap ?? null, transparent: o.transparent ?? false, opacity: o.opacity ?? 1 });
      if ((o.metalness ?? 0) > 0.5) this.metalMats.push(m);
      return m;
    }
    if ((o.metalness ?? 0) > 0.5) return new MeshPhongMaterial({ color, shininess: 70, specular: new Color('#cfcfcf') });
    return new MeshLambertMaterial({ color, map: o.map ?? null, transparent: o.transparent ?? false, opacity: o.opacity ?? 1 });
  }

  constructor(tex: TextureSet, shadows = true, pbr = true) {
    this.pbr = pbr;
    this.root.add(this.barrel, this.frog, this.pick);

    // ------------------------------------------------------------ barrel
    const prof = [
      [0.001, -0.42], [0.3, -0.42], [0.37, -0.395], [0.415, -0.32], [0.445, -0.17], [0.455, 0], [0.445, 0.17],
      [0.415, 0.32], [0.385, 0.415], [0.36, 0.43], [0.345, 0.4], [0.335, 0.2], [0.33, -0.1], [0.001, -0.12],
    ].map(([x, y]) => new Vector2(x, y));
    const staves = tex.staves.clone();
    staves.repeat.set(1, 1);
    const stavesN = tex.stavesNormal.clone();
    const woodMat = this.mat({ map: staves, normalMap: stavesN, roughness: 0.78, color: '#e8c49a' });
    const barrelMesh = new Mesh(new LatheGeometry(prof, 48), woodMat);
    barrelMesh.castShadow = true;
    barrelMesh.receiveShadow = true;
    this.barrel.add(barrelMesh);
    const iron = this.mat({ color: '#3d4148', metalness: 0.75, roughness: 0.42 });
    for (const [y, r, tube] of [
      [0.12, 0.462, 0.026],
      [-0.12, 0.462, 0.026],
      [0.34, 0.405, 0.02],
      [-0.34, 0.405, 0.02],
    ]) {
      const hoop = new Mesh(new TorusGeometry(r, tube, 8, 56), iron);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = y;
      hoop.castShadow = true;
      this.barrel.add(hoop);
    }
    // Rivets on the front hoops: tiny detail that sells the scale.
    for (const y of [0.12, -0.12]) {
      for (const a of [-0.5, 0, 0.5]) {
        const rv = new Mesh(new SphereGeometry(0.018, 8, 6), iron);
        rv.position.set(Math.sin(a) * 0.488, y, Math.cos(a) * 0.488);
        this.barrel.add(rv);
      }
    }

    // -------------------------------------------------------------- frog
    const green = this.mat({ color: '#58b24e', roughness: 0.45 });
    const darkGreen = this.mat({ color: '#2f6e2c', roughness: 0.5 });
    const cream = this.mat({ color: '#f1e6ad', roughness: 0.55 });
    const white = this.mat({ color: '#fbfbf6', roughness: 0.25 });
    const black = this.mat({ color: '#101014', roughness: 0.15 });
    const pink = this.mat({ color: '#f08a8a', roughness: 0.6, transparent: true, opacity: 0.75 });
    const body = new Mesh(new SphereGeometry(0.3, 40, 28), green);
    body.scale.set(1.08, 0.88, 0.95);
    body.position.set(0, 0.5, 0);
    body.castShadow = true;
    this.frog.add(body);
    const belly = new Mesh(new SphereGeometry(0.24, 32, 20), cream);
    belly.scale.set(1.0, 0.78, 0.55);
    belly.position.set(0, 0.45, 0.17);
    this.frog.add(belly);
    // Back spots.
    for (const [x, y, z, r] of [
      [-0.16, 0.66, -0.12, 0.05],
      [0.12, 0.7, -0.16, 0.04],
      [0.2, 0.55, -0.15, 0.035],
      [-0.05, 0.74, -0.18, 0.03],
    ]) {
      const sp = new Mesh(new SphereGeometry(r, 12, 8), darkGreen);
      sp.scale.set(1, 1, 0.4);
      sp.position.set(x, y, z);
      sp.lookAt(x * 3, y * 1.5, z * 3);
      this.frog.add(sp);
    }
    // Eyes: bumps on top of the head, white globes, black pupils, lids.
    for (const side of [-1, 1]) {
      const bump = new Mesh(new SphereGeometry(0.11, 24, 16), green);
      bump.position.set(side * 0.135, 0.73, 0.05);
      bump.castShadow = true;
      this.frog.add(bump);
      const base = new Vector3(side * 0.135, 0.765, 0.105);
      const w = new Mesh(new SphereGeometry(0.088, 24, 16), white);
      w.position.copy(base);
      this.frog.add(w);
      const p = new Mesh(new SphereGeometry(0.042, 16, 12), black);
      p.position.copy(base);
      this.frog.add(p);
      const lid = new Mesh(new SphereGeometry(0.093, 24, 16), green);
      lid.position.copy(base);
      lid.visible = false;
      this.frog.add(lid);
      this.eyes.push({ white: w, pupil: p, lid, base });
    }
    // Wide frog smile.
    this.mouth = new Mesh(new TorusGeometry(0.17, 0.013, 6, 24, Math.PI * 0.62), darkGreen);
    this.mouth.position.set(0, 0.62, 0.21);
    this.mouth.rotation.set(0.25, 0, Math.PI + Math.PI * 0.19);
    this.frog.add(this.mouth);
    for (const side of [-1, 1]) {
      const ch = new Mesh(new SphereGeometry(0.045, 12, 8), pink);
      ch.scale.set(1, 0.6, 0.3);
      ch.position.set(side * 0.21, 0.58, 0.2);
      this.frog.add(ch);
    }
    // Arms (IK targets set every frame).
    for (const side of [-1, 1] as const) {
      const upper = new Mesh(new CapsuleGeometry(0.048, 1, 4, 10), green);
      const lower = new Mesh(new CapsuleGeometry(0.043, 1, 4, 10), green);
      const hand = new Mesh(new SphereGeometry(0.065, 14, 10), green);
      hand.scale.set(1.15, 0.85, 1);
      upper.castShadow = lower.castShadow = hand.castShadow = true;
      this.frog.add(upper, lower, hand);
      this.arms.push({ upper, lower, hand, shoulder: new Vector3(side * 0.23, 0.5, 0.16), side });
    }
    // Capsule geometry is length 1 between cap centres; we scale y per frame,
    // so re-centre caps out of the scale by using a thin cylinder look instead.
    for (const a of this.arms) {
      a.upper.geometry = new CylinderGeometry(0.048, 0.045, 1, 10);
      a.lower.geometry = new CylinderGeometry(0.044, 0.04, 1, 10);
    }
    const elbowGeo = new SphereGeometry(0.047, 10, 8);
    for (const a of this.arms) {
      const elbow = new Mesh(elbowGeo, green);
      elbow.name = 'elbow';
      this.frog.add(elbow);
      (a as unknown as { elbow: Mesh }).elbow = elbow;
      const shoulder = new Mesh(new SphereGeometry(0.06, 10, 8), green);
      shoulder.position.copy(a.shoulder);
      this.frog.add(shoulder);
    }

    // -------------------------------------------------------------- pick
    const steel = this.mat({ color: '#c3cad2', metalness: 0.9, roughness: 0.28 });
    const brass = this.mat({ color: '#d0a64e', metalness: 0.85, roughness: 0.35 });
    const grip = this.mat({ color: '#3a2a22', roughness: 0.9 });
    const headGeo = new ExtrudeGeometry(pickShape(), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.012, bevelSegments: 2, curveSegments: 6 });
    headGeo.translate(0, 0, -0.05);
    const head = new Mesh(headGeo, steel);
    head.castShadow = true;
    this.pick.add(head);
    // Collar where the shaft meets the head.
    const collar = new Mesh(new CylinderGeometry(0.05, 0.05, 0.1, 14), brass);
    collar.rotation.z = Math.PI / 2;
    collar.position.set(-0.1, 0, 0);
    this.pick.add(collar);
    // One fixed-length ash shaft, a touch thicker toward the butt, with a
    // leather grip, a brass butt cap and two thin bands that make it easy to
    // see the shaft sliding through the hands.
    const ash = this.mat({ color: '#b98a55', roughness: 0.62 });
    const butt = HANDLE_START - HAMMER.handleLength;
    const along = (x0: number, x1: number, rButt: number, rHead: number, m: Material): void => {
      const mesh = new Mesh(new CylinderGeometry(rButt, rHead, x1 - x0, 14), m);
      // Cylinders run along +y; a quarter turn lays the top (butt end) along -x.
      mesh.rotation.z = Math.PI / 2;
      mesh.position.x = (x0 + x1) / 2;
      mesh.castShadow = true;
      this.pick.add(mesh);
    };
    along(butt, HANDLE_START - 0.08, 0.037, 0.031, ash);
    along(butt + 0.03, butt + 0.47, 0.042, 0.041, grip);
    along(butt, butt + 0.04, 0.044, 0.044, brass);
    for (const x of [-0.72, -1.38]) along(x - 0.012, x + 0.012, 0.036, 0.035, brass);
    this.pick.position.z = PICK_Z;
    this.root.traverse((o) => {
      if ((o as Mesh).isMesh) {
        o.castShadow = shadows && o.castShadow;
        o.receiveShadow = shadows;
      }
    });
  }

  /** Envmap for the metal parts, so steel and brass actually shine. */
  setEnvMap(env: Texture): void {
    for (const m of this.metalMats) {
      m.envMap = env;
      m.envMapIntensity = 0.9;
      m.needsUpdate = true;
    }
  }

  /**
   * Pose everything from the interpolated physics frame.
   * bx,by: barrel centre. hx,hy,ha: pick head and angle. reach: head-to-pivot.
   */
  update(dt: number, bx: number, by: number, hx: number, hy: number, ha: number, reach: number, vx: number, vy: number): void {
    this.time += dt;
    this.root.position.set(bx, by, 0);

    // Pick: the whole rigid tool sits on the physics body.
    const px = bx + CONTAINER.pivot.x;
    const py = by + CONTAINER.pivot.y;
    this.pick.position.set(hx - bx, hy - by, PICK_Z);
    this.pick.rotation.set(0, 0, ha);

    // Lean a little toward the pick and with the motion.
    const dirx = Math.cos(ha);
    const diry = Math.sin(ha);
    const targetLean = -dirx * 0.12 - vx * 0.0096;
    this.lean += (targetLean - this.lean) * Math.min(1, dt * 6);
    this.frog.rotation.z = this.lean;
    this.frog.position.y = Math.sin(this.time * 2.2) * 0.008;

    // Arms: the hands stay at the chest and the shaft slides through them.
    // Pull the head right in and they shuffle back down the shaft so they
    // never close on the head itself.
    const g1 = Math.min(0.16, Math.max(-0.05, reach - 0.24));
    const g2 = g1 - 0.2;
    const handOuter = new Vector3(px + dirx * g1 - bx, py + diry * g1 - by, PICK_Z);
    const handInner = new Vector3(px + dirx * g2 - bx, py + diry * g2 - by, PICK_Z);
    // The frog group is rotated by lean; work in its local frame.
    const toLocal = (v: Vector3) => {
      const c = Math.cos(-this.lean);
      const s = Math.sin(-this.lean);
      return new Vector3(v.x * c - (v.y - this.frog.position.y) * s, v.x * s + (v.y - this.frog.position.y) * c, v.z);
    };
    for (const a of this.arms) {
      const outer = a.side === (dirx >= 0 ? 1 : -1);
      const target = toLocal(outer ? handOuter : handInner);
      const pole = new Vector3(a.side * 1.0, -0.7, 0.3);
      const elbow = new Vector3();
      const hand = new Vector3();
      solveIK(a.shoulder, target, 0.33, 0.33, pole, elbow, hand);
      placeBetween(a.upper, a.shoulder, elbow, true);
      placeBetween(a.lower, elbow, hand, true);
      (a as unknown as { elbow: Mesh }).elbow.position.copy(elbow);
      a.hand.position.copy(hand);
    }

    // Eyes follow the pick head; blink now and then; go wide when falling.
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blink = 0.16;
      this.blinkT = 1.8 + Math.random() * 4.2;
    }
    this.blink = Math.max(0, this.blink - dt);
    const closed = this.blink > 0 ? Math.sin((1 - this.blink / 0.16) * Math.PI) : 0;
    const scared = Math.min(1, Math.max(0, (-vy - 8.75) / 10));
    const lookX = hx - bx;
    const lookY = hy - (by + 0.77);
    const ll = Math.hypot(lookX, lookY) || 1;
    for (const e of this.eyes) {
      const ws = 1 + scared * 0.18;
      e.white.scale.setScalar(ws);
      const ps = 1 - scared * 0.35;
      e.pupil.scale.setScalar(ps);
      e.pupil.position.set(e.base.x + (lookX / ll) * 0.038, e.base.y + (lookY / ll) * 0.034, e.base.z + 0.058 * ws);
      e.lid.visible = closed > 0.02;
      e.lid.scale.set(ws * 1.03, Math.max(0.02, closed) * ws * 1.03, ws * 1.03);
    }
    this.mouth.scale.set(1, 1 + scared * 1.6, 1);
  }
}
