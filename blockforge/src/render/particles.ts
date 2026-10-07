// Block break particles: small camera-facing squares cut from a random 4x4 pixel window of
// the broken block's texture, thrown outwards, falling with gravity and drag, landing on the
// ground, lit like the world and fogged. One dynamic mesh, one draw call.
import { Mesh, BufferGeometry, BufferAttribute, ShaderMaterial, Vector2, DynamicDrawUsage } from 'three';
import type { IUniform } from 'three';
import type { SharedUniforms } from './materials';
import { LIGHT_FN_GLSL, SKY_FN_GLSL, SKY_UNIFORMS_GLSL } from './materials';
import { tileOrigin } from './atlas';
import { FACE_TEX, LAYER, TINT, TINTMASK, SHAPE, S, L, idOf } from '../blocks/registry';
import { DEFAULT_TINT } from '../blocks/textures';

const MAX = 1024;
const PER_BREAK = 26;
const GRAVITY = 16;      // blocks/s^2
const DRAG = 0.667;      // velocity kept per second in the air (0.98 per 1/20 s tick)

const VS = `
#define HP highp
attribute vec3 aCenter;
attribute vec2 aCorner;
attribute vec2 aUv;
attribute vec4 aTint;
attribute float aSize;
uniform float uAtlasSize;
uniform vec2 uParticleLight;
uniform vec3 uSkyLightColor;
uniform vec3 uBlockLightColor;
uniform float uBrightness;
uniform float uFogNear;
uniform float uFogFar;
${SKY_UNIFORMS_GLSL}
varying vec2 vUv;
varying vec4 vTint;
varying vec3 vColor;
varying vec4 vFog;
${SKY_FN_GLSL}
${LIGHT_FN_GLSL}
void main() {
  vec4 mv = modelViewMatrix * vec4(aCenter, 1.0);
  mv.xy += aCorner * aSize;
  gl_Position = projectionMatrix * mv;
  vUv = aUv / uAtlasSize;
  vTint = aTint;
  float sb = lightCurve(uParticleLight.x);
  float bb = lightCurve(uParticleLight.y);
  vec3 blk = vec3(bb, bb * ((bb * 0.6 + 0.4) * 0.6 + 0.4), bb * (bb * bb * 0.6 + 0.4)) * uBlockLightColor;
  vColor = finishLight(sb * uSkyLightColor + blk) * 0.9;
  vec3 rel = mv.xyz * mat3(viewMatrix);
  float dist = max(length(rel.xz), abs(rel.y));
  vFog = vec4(skyColor(rel / max(length(rel), 0.0001)), clamp((dist - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0));
}
`;
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define HP highp
#else
#define HP mediump
#endif
precision mediump float;
uniform sampler2D uAtlas;
varying HP vec2 vUv;
varying vec4 vTint;
varying vec3 vColor;
varying vec4 vFog;
void main() {
  vec4 t = texture2D(uAtlas, vUv, -16.0);
  float masked = step(0.5, vTint.a);
  if (masked < 0.5 && t.a < 0.5) discard;
  vec3 c = t.rgb * mix(vTint.rgb, mix(vTint.rgb, vec3(1.0), t.a), masked) * vColor;
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), 1.0);
}
`;

export type Collider = (x: number, y: number, z: number) => boolean;

export class Particles {
  readonly mesh: Mesh;
  private mat: ShaderMaterial;
  private light: IUniform;
  private n = 0;
  // simulation state (world space, doubles)
  private px = new Float64Array(MAX); private py = new Float64Array(MAX); private pz = new Float64Array(MAX);
  private vx = new Float32Array(MAX); private vy = new Float32Array(MAX); private vz = new Float32Array(MAX);
  private age = new Float32Array(MAX); private life = new Float32Array(MAX);
  private floorY = new Float32Array(MAX);
  private size = new Float32Array(MAX);
  private uv = new Float32Array(MAX * 2);
  private tint = new Uint8Array(MAX * 4);
  // GPU buffers
  private aCenter = new Float32Array(MAX * 12);
  private aUv = new Float32Array(MAX * 8);
  private aTint = new Uint8Array(MAX * 16);
  private aSize = new Float32Array(MAX * 4);
  private geo: BufferGeometry;
  private attrs: BufferAttribute[];
  private collider: Collider | null = null;
  private seed = 12345;

  constructor(uniforms: SharedUniforms) {
    this.light = { value: new Vector2(1, 0) };
    this.mat = new ShaderMaterial({
      name: 'particles',
      uniforms: { ...uniforms, uParticleLight: this.light },
      vertexShader: VS,
      fragmentShader: FS,
    });
    const g = new BufferGeometry();
    const corner = new Float32Array(MAX * 8);
    const idx = new Uint16Array(MAX * 6);
    for (let i = 0; i < MAX; i++) {
      corner.set([-1, -1, 1, -1, 1, 1, -1, 1], i * 8);
      const b = i * 4;
      idx.set([b, b + 1, b + 2, b, b + 2, b + 3], i * 6);
    }
    const mk = (a: Float32Array | Uint8Array, size: number, norm = false) => {
      const at = new BufferAttribute(a, size, norm);
      at.setUsage(DynamicDrawUsage);
      return at;
    };
    const aCenter = mk(this.aCenter, 3), aUv = mk(this.aUv, 2), aTint = mk(this.aTint, 4, true), aSize = mk(this.aSize, 1);
    g.setAttribute('aCenter', aCenter);
    g.setAttribute('position', aCenter);
    g.setAttribute('aCorner', new BufferAttribute(corner, 2));
    g.setAttribute('aUv', aUv);
    g.setAttribute('aTint', aTint);
    g.setAttribute('aSize', aSize);
    g.setIndex(new BufferAttribute(idx, 1));
    g.setDrawRange(0, 0);
    this.attrs = [aCenter, aUv, aTint, aSize];
    this.geo = g;
    this.mesh = new Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.mesh.matrixAutoUpdate = false;
  }

  get count(): number { return this.n; }

  /** Optional block collision (true = solid). Without it particles land on the broken block's floor. */
  setCollider(fn: Collider | null): void { this.collider = fn; }

  /** Light at the player (0..15 each), used for all particles. */
  setLight(sky: number, block: number): void { (this.light.value as Vector2).set(sky / 15, block / 15); }

  private rnd(): number {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  spawnBreak(x: number, y: number, z: number, v: number): void {
    const id = idOf(v);
    if (!id) return;
    const layer = LAYER[id];
    const shape = SHAPE[id];
    // Small shapes throw their bits from a smaller volume.
    const small = shape === S.cross || shape === S.torch || shape === S.lantern || shape === S.rod;
    const thin = shape === S.carpet || shape === S.layer || shape === S.lily;
    const ext = small ? 0.3 : 0.5;
    const height = thin ? 0.15 : small ? 0.7 : 1;
    let tr = 255, tg = 255, tb = 255;
    const tm = TINT[id];
    if (tm) {
      const c = tm === 1 ? DEFAULT_TINT.grass : tm === 2 ? DEFAULT_TINT.foliage : DEFAULT_TINT.water;
      tr = c[0]; tg = c[1]; tb = c[2];
    }
    // Opaque-layer textures use alpha as a tint mask, so they never discard.
    const masked = layer === L.opaque || layer === L.lava ? 255 : 0;
    for (let k = 0; k < PER_BREAK; k++) {
      if (this.n >= MAX) this.kill(0);
      const i = this.n++;
      const ox = (this.rnd() - 0.5) * 2 * ext, oy = this.rnd() * height, oz = (this.rnd() - 0.5) * 2 * ext;
      this.px[i] = x + 0.5 + ox; this.py[i] = y + oy; this.pz[i] = z + 0.5 + oz;
      const sp = 1.4 + this.rnd() * 1.8;
      this.vx[i] = ox * sp * 2 + (this.rnd() - 0.5) * 1.2;
      this.vy[i] = (oy - height * 0.35) * sp + 1.2 + this.rnd() * 2.2;
      this.vz[i] = oz * sp * 2 + (this.rnd() - 0.5) * 1.2;
      this.age[i] = 0;
      this.life[i] = Math.min(1.6, 0.2 / (this.rnd() * 0.9 + 0.1)) + 0.15;
      this.size[i] = 0.05 + this.rnd() * 0.05;
      this.floorY[i] = y;
      // texture: mostly the side, sometimes the top (dirt particles from grass blocks, MC style)
      const face = TINTMASK[id] ? 4 : this.rnd() < 0.2 ? 2 : 4;
      const tile = FACE_TEX[id * 6 + face];
      const [tx, ty] = tileOrigin(tile);
      this.uv[i * 2] = tx + Math.floor(this.rnd() * 13);
      this.uv[i * 2 + 1] = ty + Math.floor(this.rnd() * 13);
      this.tint[i * 4] = tr; this.tint[i * 4 + 1] = tg; this.tint[i * 4 + 2] = tb; this.tint[i * 4 + 3] = masked;
    }
  }

  private kill(i: number): void {
    const j = --this.n;
    if (i === j) return;
    this.px[i] = this.px[j]; this.py[i] = this.py[j]; this.pz[i] = this.pz[j];
    this.vx[i] = this.vx[j]; this.vy[i] = this.vy[j]; this.vz[i] = this.vz[j];
    this.age[i] = this.age[j]; this.life[i] = this.life[j]; this.size[i] = this.size[j];
    this.floorY[i] = this.floorY[j];
    this.uv[i * 2] = this.uv[j * 2]; this.uv[i * 2 + 1] = this.uv[j * 2 + 1];
    for (let c = 0; c < 4; c++) this.tint[i * 4 + c] = this.tint[j * 4 + c];
  }

  /** Step the simulation and refresh the GPU buffers. `ox,oy,oz` = integer render origin. */
  update(dt: number, ox: number, oy: number, oz: number): void {
    const drag = Math.pow(DRAG, dt);
    const col = this.collider;
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) { this.kill(i); i--; continue; }
      this.vy[i] -= GRAVITY * dt;
      this.vx[i] *= drag; this.vy[i] *= drag; this.vz[i] *= drag;
      const nx = this.px[i] + this.vx[i] * dt;
      const ny = this.py[i] + this.vy[i] * dt;
      const nz = this.pz[i] + this.vz[i] * dt;
      const r = this.size[i];
      let ground = false;
      if (col) {
        if (col(Math.floor(nx), Math.floor(this.py[i]), Math.floor(this.pz[i]))) this.vx[i] = 0; else this.px[i] = nx;
        if (col(Math.floor(this.px[i]), Math.floor(this.py[i]), Math.floor(nz))) this.vz[i] = 0; else this.pz[i] = nz;
        if (this.vy[i] < 0 && col(Math.floor(this.px[i]), Math.floor(ny - r), Math.floor(this.pz[i]))) {
          this.py[i] = Math.floor(ny - r) + 1 + r; ground = true;
        } else if (this.vy[i] > 0 && col(Math.floor(this.px[i]), Math.floor(ny + r), Math.floor(this.pz[i]))) {
          this.vy[i] = 0;
        } else this.py[i] = ny;
      } else {
        this.px[i] = nx; this.pz[i] = nz;
        if (ny - r < this.floorY[i] && this.vy[i] < 0) { this.py[i] = this.floorY[i] + r; ground = true; } else this.py[i] = ny;
      }
      if (ground) { this.vy[i] = 0; this.vx[i] *= Math.pow(0.05, dt); this.vz[i] *= Math.pow(0.05, dt); }
    }
    const n = this.n;
    this.mesh.visible = n > 0;
    if (!n) return;
    const C = this.aCenter, U = this.aUv, T = this.aTint, Z = this.aSize;
    for (let i = 0; i < n; i++) {
      const cx = this.px[i] - ox, cy = this.py[i] - oy, cz = this.pz[i] - oz;
      const u0 = this.uv[i * 2], v0 = this.uv[i * 2 + 1];
      const s = this.size[i];
      for (let v = 0; v < 4; v++) {
        const o = i * 4 + v;
        C[o * 3] = cx; C[o * 3 + 1] = cy; C[o * 3 + 2] = cz;
        Z[o] = s;
        for (let c = 0; c < 4; c++) T[o * 4 + c] = this.tint[i * 4 + c];
      }
      // corners (-1,-1) (1,-1) (1,1) (-1,1); image v grows downward, so the top uses v0
      U[i * 8] = u0; U[i * 8 + 1] = v0 + 4;
      U[i * 8 + 2] = u0 + 4; U[i * 8 + 3] = v0 + 4;
      U[i * 8 + 4] = u0 + 4; U[i * 8 + 5] = v0;
      U[i * 8 + 6] = u0; U[i * 8 + 7] = v0;
    }
    const sizes = [3, 2, 4, 1];
    for (let k = 0; k < this.attrs.length; k++) {
      const a = this.attrs[k];
      a.clearUpdateRanges();
      a.addUpdateRange(0, n * 4 * sizes[k]);
      a.needsUpdate = true;
    }
    this.geo.setDrawRange(0, n * 6);
    this.mesh.position.set(ox, oy, oz);
    this.mesh.updateMatrix();
    this.mesh.matrixWorld.copy(this.mesh.matrix);
  }

  clear(): void { this.n = 0; this.mesh.visible = false; this.geo.setDrawRange(0, 0); }

  dispose(): void { this.geo.dispose(); this.mat.dispose(); }
}
