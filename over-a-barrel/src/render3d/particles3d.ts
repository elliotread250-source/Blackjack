import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending, Points, ShaderMaterial, type Texture } from 'three';

const vert = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
varying float vAlpha;
varying vec3 vColor;
uniform float uScale;
void main() {
  vAlpha = aAlpha;
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const frag = /* glsl */ `
uniform sampler2D uMap;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec4 t = texture2D(uMap, gl_PointCoord);
  gl_FragColor = vec4(vColor, t.a * vAlpha);
  if (gl_FragColor.a < 0.01) discard;
  #include <colorspace_fragment>
}`;

export interface Spawn {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  life: number;
  color: Color;
  gravity?: number;
  drag?: number;
  /** Fade in over the first part of life (for weather) instead of starting opaque. */
  fadeIn?: boolean;
  alpha?: number;
}

/** A fixed pool of point sprites, CPU-simulated. */
export class ParticlePool {
  readonly points: Points;
  private n: number;
  private pos: Float32Array;
  private vel: Float32Array;
  private col: Float32Array;
  private size: Float32Array;
  private alpha: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private grav: Float32Array;
  private drag: Float32Array;
  private baseAlpha: Float32Array;
  private fadeIn: Uint8Array;
  private next = 0;
  private mat: ShaderMaterial;

  constructor(max: number, map: Texture, additive = false) {
    this.n = max;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.baseAlpha = new Float32Array(max);
    this.fadeIn = new Uint8Array(max);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(this.pos, 3));
    geo.setAttribute('aColor', new BufferAttribute(this.col, 3));
    geo.setAttribute('aSize', new BufferAttribute(this.size, 1));
    geo.setAttribute('aAlpha', new BufferAttribute(this.alpha, 1));
    this.mat = new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: { uMap: { value: map }, uScale: { value: 600 } },
      transparent: true,
      depthWrite: false,
      blending: additive ? AdditiveBlending : NormalBlending,
    });
    this.points = new Points(geo, this.mat);
    this.points.frustumCulled = false;
  }

  /** Pixel scale so `size` is roughly metres on screen. */
  setScale(pixelsPerMetreAtUnitDepth: number): void {
    this.mat.uniforms.uScale.value = pixelsPerMetreAtUnitDepth;
  }

  spawn(s: Spawn): void {
    const i = this.next;
    this.next = (this.next + 1) % this.n;
    this.pos[i * 3] = s.x;
    this.pos[i * 3 + 1] = s.y;
    this.pos[i * 3 + 2] = s.z;
    this.vel[i * 3] = s.vx;
    this.vel[i * 3 + 1] = s.vy;
    this.vel[i * 3 + 2] = s.vz;
    this.col[i * 3] = s.color.r;
    this.col[i * 3 + 1] = s.color.g;
    this.col[i * 3 + 2] = s.color.b;
    this.size[i] = s.size;
    this.life[i] = s.life;
    this.maxLife[i] = s.life;
    this.grav[i] = s.gravity ?? 0;
    this.drag[i] = s.drag ?? 1.5;
    this.baseAlpha[i] = s.alpha ?? 1;
    this.fadeIn[i] = s.fadeIn ? 1 : 0;
  }

  update(dt: number, wind = 0): void {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) {
        this.alpha[i] = 0;
        continue;
      }
      this.life[i] -= dt;
      const k = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] = (this.vel[i * 3] + wind * dt) * k;
      this.vel[i * 3 + 1] = (this.vel[i * 3 + 1] - this.grav[i] * dt) * k;
      this.vel[i * 3 + 2] *= k;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const t = Math.max(0, this.life[i] / this.maxLife[i]);
      const fade = this.fadeIn[i] ? Math.min(1, (1 - t) * 6) * Math.min(1, t * 4) : t;
      this.alpha[i] = fade * this.baseAlpha[i];
    }
    const g = this.points.geometry;
    g.getAttribute('position').needsUpdate = true;
    g.getAttribute('aAlpha').needsUpdate = true;
    g.getAttribute('aColor').needsUpdate = true;
    g.getAttribute('aSize').needsUpdate = true;
  }
}
