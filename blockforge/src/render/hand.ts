// First-person hand: the held block (meshed by the mesher, shaded like the world) or, with an
// empty hand, a plain arm. Drawn in its own scene with a fixed 70 degree camera after the
// world (depth cleared), so it never clips into walls. Swing on break/place, equip dip when
// the selection changes, view bobbing and a little lag behind fast mouse turns.
import {
  Scene, PerspectiveCamera, Group, Mesh, BufferGeometry, BufferAttribute, ShaderMaterial, Vector2, FrontSide,
} from 'three';
import type { WebGLRenderer, IUniform } from 'three';
import type { SharedUniforms } from './materials';
import { createHandMaterials, createLayerGeometry, LIGHT_FN_GLSL } from './materials';
import { meshBlockItem } from './mesher';
import { idOf } from '../blocks/registry';

const SWING_TIME = 0.3;   // seconds for a full swing (6 ticks)
const EQUIP_TIME = 0.14;  // seconds to lower or raise the hand

const ARM_VS = `
attribute float aShade;
attribute vec2 aPix;
uniform vec2 uHandLight;
uniform vec3 uSkyLightColor;
uniform vec3 uBlockLightColor;
uniform float uBrightness;
varying vec2 vPix;
varying vec3 vColor;
${LIGHT_FN_GLSL}
void main() {
  vPix = aPix;
  float sb = lightCurve(uHandLight.x);
  float bb = lightCurve(uHandLight.y);
  vec3 blk = vec3(bb, bb * ((bb * 0.6 + 0.4) * 0.6 + 0.4), bb * (bb * bb * 0.6 + 0.4)) * uBlockLightColor;
  vColor = finishLight(sb * uSkyLightColor + blk) * aShade;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
// Original arm look: warm skin with per-pixel variation and a knitted green cuff near the top.
const ARM_FS = `
precision mediump float;
varying vec2 vPix;
varying vec3 vColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(37.1, 171.7))) * 43758.5453); }
void main() {
  vec2 p = floor(vPix);
  vec3 skin = vec3(0.84, 0.62, 0.47);
  vec3 c = skin * (0.93 + 0.07 * hash(p));
  if (p.y < 3.0) {
    vec3 cloth = vec3(0.24, 0.47, 0.33);
    c = cloth * (0.86 + 0.14 * hash(p + 5.0)) * (p.y > 1.5 ? 0.85 : 1.0);
  }
  gl_FragColor = vec4(c * vColor, 1.0);
}
`;

/** Box with per-face shade and pixel coordinates: x/z 4 px wide, y 12 px long (shoulder at y=0). */
function armGeometry(): BufferGeometry {
  const w = 4 / 16, l = 12 / 16;
  // box from (-w/2, -l, -w/2) to (w/2, 0, w/2): the shoulder end is at y = 0
  const x0 = -w / 2, x1 = w / 2, y0 = -l, y1 = 0, z0 = -w / 2, z1 = w / 2;
  const pos: number[] = [], shade: number[] = [], pix: number[] = [], idx: number[] = [];
  const face = (v: number[], s: number, uvs: number[]) => {
    const b = pos.length / 3;
    pos.push(...v);
    shade.push(s, s, s, s);
    pix.push(...uvs);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  // pixel coords: u across (0..4), v along the arm from the shoulder (0) to the hand (12)
  const side = [0, 12, 4, 12, 4, 0, 0, 0];
  face([x1, y0, z1, x1, y0, z0, x1, y1, z0, x1, y1, z1], 0.6, side);   // +X
  face([x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0], 0.6, side);   // -X
  face([x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1], 0.8, side);   // +Z
  face([x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0], 0.8, side);   // -Z
  face([x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z0], 1.0, [0, 0, 4, 0, 4, 2, 0, 2]); // top (shoulder)
  face([x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1], 0.5, [0, 11, 4, 11, 4, 12, 0, 12]); // hand end
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('aShade', new BufferAttribute(new Float32Array(shade), 1));
  g.setAttribute('aPix', new BufferAttribute(new Float32Array(pix), 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

export interface HandFrame {
  dt: number;
  aspect: number;
  yaw: number; pitch: number;
  bob: { phase: number; amount: number };
  light: { sky: number; block: number };
}

export class Hand {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(70, 1, 0.05, 10);
  private root = new Group();      // bob + sway
  private pivot = new Group();     // swing + equip
  private item = new Group();      // held block (centred, scaled)
  private arm: Mesh;
  private mats: ReturnType<typeof createHandMaterials>;
  private armMat: ShaderMaterial;
  private light: IUniform;
  private current = -1;
  private pending = 0;
  private equip = 1;              // 1 = fully raised
  private lowering = false;
  private swingT = -1;            // < 0: not swinging
  private lagYaw = 0; private lagPitch = 0; private lagInit = false;
  private lightCur = new Vector2(1, 0);

  constructor(shared: SharedUniforms) {
    this.mats = createHandMaterials(shared);
    this.light = this.mats.light;
    this.armMat = new ShaderMaterial({
      name: 'hand-arm',
      uniforms: { ...shared, uHandLight: this.light },
      vertexShader: ARM_VS,
      fragmentShader: ARM_FS,
      side: FrontSide,
    });
    this.arm = new Mesh(armGeometry(), this.armMat);
    this.scene.add(this.root);
    this.root.add(this.pivot);
    this.pivot.add(this.item);
    this.pivot.add(this.arm);
    this.scene.matrixWorldAutoUpdate = true;
    this.setBlock(0);
  }

  /** v = packed block (0 = empty hand). The model swaps at the bottom of the equip dip. */
  setBlock(v: number): void {
    const id = idOf(v);
    if (this.current === -1) { this.apply(id); return; }
    if (id === this.current && !this.lowering) return;
    this.pending = id;
    this.lowering = true;
  }

  swing(): void {
    if (this.swingT < 0 || this.swingT > SWING_TIME * 0.5) this.swingT = 0;
  }

  private apply(id: number): void {
    this.current = id;
    for (const c of this.item.children.slice()) {
      const m = c as Mesh;
      m.geometry.dispose();
      this.item.remove(m);
    }
    this.arm.visible = id === 0;
    this.item.visible = id !== 0;
    if (!id) return;
    let mesh: ReturnType<typeof meshBlockItem> | null = null;
    try { mesh = meshBlockItem(id); } catch (e) { console.warn('[hand] meshBlockItem failed', e); }
    if (!mesh) return;
    for (let layer = 0; layer < mesh.length; layer++) {
      const l = mesh[layer];
      if (!l || !l.indexCount) continue;
      const m = new Mesh(createLayerGeometry(l, null), this.mats.byLayer[layer] ?? this.mats.byLayer[0]);
      m.scale.setScalar(1 / 256);
      m.position.set(-0.5, -0.5, -0.5);
      m.renderOrder = layer;
      m.frustumCulled = false;
      this.item.add(m);
    }
  }

  update(f: HandFrame): void {
    const dt = Math.min(0.1, Math.max(0, f.dt));
    if (this.camera.aspect !== f.aspect) { this.camera.aspect = f.aspect; this.camera.updateProjectionMatrix(); }
    // light follows the eye smoothly
    const k = 1 - Math.exp(-dt * 12);
    this.lightCur.x += (f.light.sky / 15 - this.lightCur.x) * k;
    this.lightCur.y += (f.light.block / 15 - this.lightCur.y) * k;
    (this.light.value as Vector2).copy(this.lightCur);

    // equip dip
    if (this.lowering) {
      this.equip -= dt / EQUIP_TIME;
      if (this.equip <= 0) { this.equip = 0; this.lowering = false; this.apply(this.pending); }
    } else if (this.equip < 1) this.equip = Math.min(1, this.equip + dt / EQUIP_TIME);

    // swing progress
    let sp = 0;
    if (this.swingT >= 0) {
      this.swingT += dt;
      sp = this.swingT / SWING_TIME;
      if (sp >= 1) { this.swingT = -1; sp = 0; }
    }

    // lag behind fast turns
    if (!this.lagInit) { this.lagYaw = f.yaw; this.lagPitch = f.pitch; this.lagInit = true; }
    let dy = f.yaw - this.lagYaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    const lk = 1 - Math.exp(-dt * 14);
    this.lagYaw += dy * lk;
    this.lagPitch += (f.pitch - this.lagPitch) * lk;
    const swayX = Math.max(-0.12, Math.min(0.12, (f.pitch - this.lagPitch) * 0.6));
    const swayY = Math.max(-0.12, Math.min(0.12, dy * 0.6));

    // bobbing (same curve as the camera bob, applied to the hand)
    const ph = f.bob.phase * Math.PI, am = f.bob.amount;
    this.root.position.set(Math.sin(ph) * am * 0.5 * 0.6, -Math.abs(Math.cos(ph) * am) * 0.6, 0);
    this.root.rotation.set(swayX, swayY, Math.sin(ph) * am * 0.05);

    const sq = Math.sqrt(sp);
    const f1 = Math.sin(sq * Math.PI);
    const f2 = Math.sin(sp * sp * Math.PI);
    const down = (1 - this.equip) * -0.6;
    const p = this.pivot;
    if (this.current) {
      // held block: lower right, turned 45 degrees, swings in a short arc towards the crosshair
      p.position.set(0.56 - 0.4 * f1, -0.52 + down + 0.2 * Math.sin(sq * Math.PI * 2), -0.72 - 0.2 * Math.sin(sp * Math.PI));
      p.rotation.set(-f1 * 1.3, -f2 * 0.35, -f1 * 0.35, 'YXZ');
      this.item.position.set(0, 0, 0);
      this.item.rotation.set(0, Math.PI / 4, 0);
      this.item.scale.setScalar(0.4);
    } else {
      // empty hand: arm reaching in from the lower right, punching forward on swing
      p.position.set(0.5 - 0.3 * f1, -0.42 + down + 0.12 * Math.sin(sq * Math.PI * 2), -0.62 - 0.35 * Math.sin(sp * Math.PI));
      p.rotation.set(0.0 - f1 * 0.9, 0.1 + f2 * 0.3, 0, 'YXZ');
      this.arm.position.set(0.08, 0.38, 0.32);
      this.arm.rotation.set(-1.95, 0.35, 0.28, 'XYZ');
    }
  }

  render(r: WebGLRenderer): void {
    r.clearDepth();
    r.render(this.scene, this.camera);
  }

  dispose(): void {
    for (const c of this.item.children) (c as Mesh).geometry.dispose();
    this.arm.geometry.dispose();
    this.armMat.dispose();
    this.mats.dispose();
  }
}
