// Sky: gradient dome with sunrise/sunset glow, square pixel-art sun and moon (original
// designs drawn in the shader), twinkling square stars, and a blocky 3D cloud layer at
// y = 192 that drifts east and fades out with distance.
//
// The Sky owns the time-of-day colours: every update writes the shared uniforms the terrain
// shaders read (sun direction, daylight, sky/horizon/glow colours, sky light colour, shadow
// light direction and strength, glint colour). The renderer may override the fog/sky colours
// afterwards (underwater, in lava).
import {
  Scene, Mesh, Points, Group, BufferGeometry, BufferAttribute, ShaderMaterial, Color, Vector3,
  DoubleSide, FrontSide, AdditiveBlending, NoBlending,
} from 'three';
import type { IUniform } from 'three';
import type { SharedUniforms } from './materials';
import { SKY_UNIFORMS_GLSL, SKY_FN_GLSL } from './materials';

const HP = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define HP highp
#else
#define HP mediump
#endif
`;

export const CLOUD_Y = 192;
const CLOUD_THICK = 4;
const CLOUD_CELL = 12;
const CLOUD_MAP = 128;           // cloud map period in cells (128 * 12 = 1536 blocks)
const CLOUD_SPEED = 0.6;         // blocks per second, drifting towards +X (east)
const SUN_TILT = 0.38;           // the sun path leans south by ~22 degrees (nicer shadows)
const SKY_R = 45;                // celestial bodies / dome are drawn at this distance (depth test off)

const DOME_VS = `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const DOME_FS = `
${HP}
${SKY_UNIFORMS_GLSL}
uniform vec3 uSunDir;
uniform vec3 uHaze;
varying vec3 vDir;
${SKY_FN_GLSL}
void main() {
  vec3 d = normalize(vDir);
  vec3 c = skyColor(d);
  float s = max(dot(d, uSunDir), 0.0);
  float s2 = s * s; float s4 = s2 * s2; float s8 = s4 * s4;
  c += uHaze * (s8 * 0.6 + s8 * s8 * s8 * 0.8);
  // 1/255 dither: no banding in the dusk gradient
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  gl_FragColor = vec4(c + (n - 0.5) / 255.0, 1.0);
}
`;

const BODY_VS = `
varying vec2 vUv;
void main() {
  vUv = uv * 2.0 - 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
// Original square sun: bright 10x10 core, warm rim, stepped square halo.
const SUN_FS = `
${HP}
uniform vec3 uTint;
uniform float uAlpha;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
void main() {
  vec2 a = abs(vUv);
  float m = max(a.x, a.y);
  vec2 px = floor((vUv * 0.5 + 0.5) * 32.0);
  float pm = max(abs(px.x - 15.5), abs(px.y - 15.5));  // square distance in pixels (0.5 .. 15.5)
  vec3 col = vec3(0.0);
  if (pm < 5.0) {
    col = vec3(1.0, 0.99, 0.9) - hash(px) * vec3(0.0, 0.03, 0.08);
  } else if (pm < 7.0) {
    col = vec3(1.0, 0.86, 0.42) + (hash(px) - 0.5) * vec3(0.0, 0.06, 0.1);
  } else {
    // stepped halo, one ring per two pixels, fading out
    float ring = floor((pm - 7.0) / 2.0);
    col = uTint * 0.42 * pow(0.62, ring) * (1.0 - smoothstep(0.75, 1.0, m));
  }
  gl_FragColor = vec4(col * uAlpha, 1.0);
}
`;
// Original square moon: pale disc with a few blocky maria and a bright rim pixel row.
const MOON_FS = `
${HP}
uniform float uAlpha;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 px = floor((vUv * 0.5 + 0.5) * 24.0);
  float pm = max(abs(px.x - 11.5), abs(px.y - 11.5));
  vec3 col = vec3(0.0);
  if (pm < 6.0) {
    vec2 q = px - 6.0;
    float mare = step(0.72, hash(floor(q / 2.0) + 3.0));
    float spot = step(0.86, hash(q + 17.0));
    col = vec3(0.86, 0.89, 0.96) * (1.0 - 0.28 * mare - 0.16 * spot);
    if (pm >= 5.0) col *= 0.9;
  } else if (pm < 9.0) {
    col = vec3(0.16, 0.19, 0.3) * (9.0 - pm) / 3.0;
  }
  gl_FragColor = vec4(col * uAlpha, 1.0);
}
`;

const STAR_VS = `
attribute float aSize;
attribute float aPhase;
uniform float uAlpha;
uniform float uTime;
uniform float uPixelRatio;
varying float vB;
void main() {
  vec3 dir = normalize(position);
  vec3 wd = normalize(mat3(modelMatrix) * position);
  // hidden behind the moon (which sits at local -X) and faded near the horizon
  float behindMoon = step(dir.x, -0.992);
  float tw = 0.78 + 0.22 * sin(uTime * (1.3 + aPhase) + aPhase * 40.0);
  vB = uAlpha * tw * smoothstep(-0.02, 0.22, wd.y) * (1.0 - behindMoon) * (0.55 + 0.45 * fract(aPhase * 7.31));
  gl_PointSize = aSize * uPixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  if (vB <= 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`;
const STAR_FS = `
${HP}
varying float vB;
void main() { gl_FragColor = vec4(vec3(0.92, 0.94, 1.0) * vB, 1.0); }
`;

const CLOUD_VS = `
#define HP highp
attribute float aShade;
${SKY_UNIFORMS_GLSL}
uniform vec3 uFogColor;
uniform float uCloudFar;
uniform vec3 uCloudColor;
varying vec4 vC;
${SKY_FN_GLSL}
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 rel = mv.xyz * mat3(viewMatrix);
  float dist = length(rel.xz);
  float fog = smoothstep(uCloudFar * 0.45, uCloudFar, dist);
  vec3 sky = skyColor(rel / max(length(rel), 0.001));
  // a hint of the sky shows through (the clouds read as slightly translucent)
  vec3 c = mix(uCloudColor * aShade, sky, 0.12);
  vC = vec4(mix(c, sky, fog), 1.0);
  gl_Position = projectionMatrix * mv;
}
`;
const CLOUD_FS = `
precision mediump float;
varying vec4 vC;
void main() { gl_FragColor = vC; }
`;

function quad(size: number): BufferGeometry {
  // A quad in the local YZ plane at x = SKY_R, facing the centre (-X).
  const g = new BufferGeometry();
  const p = new Float32Array([
    SKY_R, -size, -size, SKY_R, -size, size, SKY_R, size, size, SKY_R, size, -size,
  ]);
  const uv = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
  g.setAttribute('position', new BufferAttribute(p, 3));
  g.setAttribute('uv', new BufferAttribute(uv, 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

function cube(h: number): BufferGeometry {
  const g = new BufferGeometry();
  const p = new Float32Array([
    -h, -h, -h, h, -h, -h, h, h, -h, -h, h, -h,
    -h, -h, h, h, -h, h, h, h, h, -h, h, h,
  ]);
  g.setAttribute('position', new BufferAttribute(p, 3));
  g.setIndex([
    0, 1, 2, 0, 2, 3, 5, 4, 7, 5, 7, 6, 4, 0, 3, 4, 3, 7,
    1, 5, 6, 1, 6, 2, 3, 2, 6, 3, 6, 7, 4, 5, 1, 4, 1, 0,
  ]);
  return g;
}

/** Deterministic tileable cloud map (CLOUD_MAP^2 cells, 1 = cloud). */
export function buildCloudMap(seed = 1337): Uint8Array {
  const N = CLOUD_MAP;
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const field = new Float32Array(N * N);
  // Sum of tileable value-noise octaves.
  for (const [cells, w] of [[8, 0.55], [16, 0.3], [32, 0.15]] as const) {
    const g = new Float32Array(cells * cells);
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    const step = N / cells;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const fx = x / step, fy = y / step;
      const ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const x0 = ix % cells, x1 = (ix + 1) % cells, y0 = iy % cells, y1 = (iy + 1) % cells;
      const a = g[y0 * cells + x0] + (g[y0 * cells + x1] - g[y0 * cells + x0]) * sx;
      const b = g[y1 * cells + x0] + (g[y1 * cells + x1] - g[y1 * cells + x0]) * sx;
      field[y * N + x] += (a + (b - a) * sy) * w;
    }
  }
  const map = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) map[i] = field[i] > 0.56 ? 1 : 0;
  // Remove lonely single cells, they look like noise from below.
  const out = map.slice();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (!map[i]) continue;
    const n = map[y * N + ((x + 1) % N)] + map[y * N + ((x + N - 1) % N)] + map[((y + 1) % N) * N + x] + map[((y + N - 1) % N) * N + x];
    if (n === 0) out[i] = 0;
  }
  return out;
}

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface SkyState { fog: Color; daylight: number }

export class Sky {
  readonly group = new Group();
  private u: SharedUniforms;
  private dome: Mesh;
  private celestial = new Group();
  private sun: Mesh;
  private moon: Mesh;
  private stars: Points;
  private clouds: Mesh;
  private cloudMat: ShaderMaterial;
  private cloudMap = buildCloudMap();
  private cloudKey = '';
  private cloudRadius = 192;
  private cloudsOn = true;
  private hidden = false;
  private sunU: { uTint: IUniform; uAlpha: IUniform };
  private moonU: { uAlpha: IUniform };
  private starU: { uAlpha: IUniform; uTime: IUniform; uPixelRatio: IUniform };
  private cloudU: { uCloudFar: IUniform; uCloudColor: IUniform };
  private hazeU: IUniform;
  private fog = new Color();
  private axis = new Vector3(0, -Math.sin(SUN_TILT), Math.cos(SUN_TILT));

  constructor(scene: Scene, uniforms: SharedUniforms) {
    this.u = uniforms;
    this.group.name = 'sky';
    scene.add(this.group);

    this.hazeU = { value: new Color(0, 0, 0) };
    const domeMat = new ShaderMaterial({
      name: 'sky-dome',
      uniforms: { ...uniforms, uHaze: this.hazeU },
      vertexShader: DOME_VS, fragmentShader: DOME_FS,
      side: DoubleSide, depthTest: false, depthWrite: false, blending: NoBlending,
    });
    this.dome = new Mesh(cube(SKY_R + 5), domeMat);
    this.dome.renderOrder = -100;
    this.dome.frustumCulled = false;
    this.group.add(this.dome);

    this.sunU = { uTint: { value: new Color(1, 0.8, 0.4) }, uAlpha: { value: 1 } };
    this.sun = new Mesh(quad(9), new ShaderMaterial({
      name: 'sky-sun', uniforms: this.sunU, vertexShader: BODY_VS, fragmentShader: SUN_FS,
      side: FrontSide, depthTest: false, depthWrite: false, blending: AdditiveBlending,
    }));
    this.moonU = { uAlpha: { value: 1 } };
    this.moon = new Mesh(quad(5.2), new ShaderMaterial({
      name: 'sky-moon', uniforms: this.moonU, vertexShader: BODY_VS, fragmentShader: MOON_FS,
      side: FrontSide, depthTest: false, depthWrite: false, blending: AdditiveBlending,
    }));
    this.moon.rotation.y = Math.PI; // to local -X, still facing the centre
    this.starU = { uAlpha: { value: 0 }, uTime: { value: 0 }, uPixelRatio: { value: 1 } };
    this.stars = new Points(this.buildStars(), new ShaderMaterial({
      name: 'sky-stars', uniforms: this.starU, vertexShader: STAR_VS, fragmentShader: STAR_FS,
      depthTest: false, depthWrite: false, blending: AdditiveBlending,
    }));
    for (const o of [this.sun, this.moon, this.stars]) { o.frustumCulled = false; this.celestial.add(o); }
    this.stars.renderOrder = -99;
    this.moon.renderOrder = -98;
    this.sun.renderOrder = -97;
    this.group.add(this.celestial);

    this.cloudU = { uCloudFar: { value: 192 }, uCloudColor: { value: new Color(1, 1, 1) } };
    this.cloudMat = new ShaderMaterial({
      name: 'sky-clouds', uniforms: { ...uniforms, ...this.cloudU },
      vertexShader: CLOUD_VS, fragmentShader: CLOUD_FS, side: FrontSide,
    });
    this.clouds = new Mesh(new BufferGeometry(), this.cloudMat);
    this.clouds.frustumCulled = false;
    this.clouds.renderOrder = 10;
    scene.add(this.clouds); // depth tested with the world, not part of the background group
  }

  /** Clouds on/off and how far they reach (blocks). */
  setClouds(on: boolean, radius = this.cloudRadius): void {
    this.cloudsOn = on;
    const r = Math.max(96, Math.min(384, radius));
    if (r !== this.cloudRadius) { this.cloudRadius = r; this.cloudKey = ''; }
    this.clouds.visible = on && !this.hidden;
  }

  /** Underwater / in lava: only the dome stays (its colours are overridden to the fog). */
  setHidden(h: boolean): void {
    this.hidden = h;
    this.celestial.visible = !h;
    this.clouds.visible = this.cloudsOn && !h;
  }

  setPixelRatio(pr: number): void { this.starU.uPixelRatio.value = pr; }

  /** Things that should not be drawn into the shadow map or reflections. */
  get objects(): (Group | Mesh)[] { return [this.group, this.clouds]; }

  update(dayTime: number, time: number, eye: { x: number; y: number; z: number }): SkyState {
    const u = this.u;
    const a = dayTime * Math.PI * 2;
    const h = Math.sin(a);                    // sun height without the tilt (timing)
    const sunDir = u.uSunDir.value as Vector3;
    sunDir.set(Math.cos(a), Math.sin(a) * Math.cos(SUN_TILT), Math.sin(a) * Math.sin(SUN_TILT)).normalize();

    // --- time of day factors
    const day = smooth(-0.22, 0.28, h);                    // 0 night .. 1 day
    const f = Math.min(1, Math.max(0, h / 0.4 * 0.5 + 0.5));
    const glow = Math.abs(h) < 0.4 ? Math.pow(Math.sin(f * Math.PI), 2) : 0; // sunrise/sunset strength
    const glowR = f * 0.3 + 0.7, glowG = f * f * 0.62 + 0.22, glowB = 0.2;

    // --- sky colours
    const top = u.uSkyTop.value as Color;
    top.setRGB(lerp(0.012, 0.45, day), lerp(0.018, 0.64, day), lerp(0.05, 1.0, day));
    const hor = u.uSkyHorizon.value as Color;
    hor.setRGB(lerp(0.035, 0.74, day), lerp(0.045, 0.84, day), lerp(0.09, 1.0, day));
    // a warm band all around the horizon at dawn and dusk, much stronger towards the sun
    hor.setRGB(lerp(hor.r, glowR * 0.95, glow * 0.25), lerp(hor.g, glowG * 0.9, glow * 0.25), lerp(hor.b, 0.42, glow * 0.25));
    (u.uGlowColor.value as Color).setRGB(glowR, glowG, glowB);
    u.uGlow.value = glow * 0.85;
    const gd = u.uGlowDir.value as Vector3;
    gd.set(sunDir.x >= 0 ? 1 : -1, 0, 0);
    this.fog.copy(hor);
    (u.uFogColor.value as Color).copy(hor);
    this.hazeU.value.setRGB(1.0, 0.92, 0.75).multiplyScalar(0.18 * smooth(-0.1, 0.2, sunDir.y) * (0.5 + 0.5 * day));

    // --- light
    u.uDaylight.value = day;
    const skyB = lerp(0.2, 1.0, day);
    const nightTint = 1 - day;
    const sl = u.uSkyLightColor.value as Color;
    sl.setRGB(
      skyB * lerp(1, 0.6, nightTint) * lerp(1, 1.0, glow),
      skyB * lerp(1, 0.68, nightTint) * lerp(1, 0.86, glow * day),
      skyB * lerp(1, 1.0, nightTint) * lerp(1, 0.74, glow * day),
    );
    // Shadow/glint light: the sun by day, the moon by night, faded out around the switch.
    const sunUp = sunDir.y > 0;
    const ld = u.uLightDir.value as Vector3;
    if (sunUp) ld.copy(sunDir); else ld.copy(sunDir).multiplyScalar(-1);
    const lh = Math.abs(sunDir.y);
    const lightFade = smooth(0.04, 0.16, lh);
    u.uShadowStrength.value = (sunUp ? 0.5 : 0.22) * lightFade;
    const sc = u.uSunColor.value as Color;
    if (sunUp) sc.setRGB(1.0, lerp(0.62, 0.95, f), lerp(0.35, 0.82, f)).multiplyScalar(lightFade);
    else sc.setRGB(0.45, 0.52, 0.7).multiplyScalar(lightFade * 0.6);

    // --- celestial bodies follow the eye
    this.group.position.set(eye.x, eye.y, eye.z);
    this.celestial.quaternion.setFromAxisAngle(this.axis, a);
    this.sunU.uAlpha.value = smooth(-0.12, 0.02, sunDir.y);
    (this.sunU.uTint.value as Color).setRGB(1, lerp(0.55, 0.85, f), lerp(0.25, 0.5, f));
    this.moonU.uAlpha.value = smooth(-0.12, 0.02, -sunDir.y) * lerp(1, 0.35, day);
    this.starU.uAlpha.value = Math.min(1, Math.max(0, (0.12 - h) * 2.6)) * 0.95;
    this.starU.uTime.value = time % 3600;
    this.group.updateMatrixWorld(true);

    // --- clouds
    if (this.cloudsOn && !this.hidden) this.updateClouds(time, eye, day, glow, glowR, glowG);
    return { fog: this.fog, daylight: day };
  }

  private updateClouds(time: number, eye: { x: number; z: number }, day: number, glow: number, gr: number, gg: number) {
    const cc = this.cloudU.uCloudColor.value as Color;
    const b = lerp(0.1, 1.0, day);
    cc.setRGB(
      b * lerp(1, gr, glow * 0.55) * lerp(1, 0.75, 1 - day),
      b * lerp(1, gg * 1.05, glow * 0.55) * lerp(1, 0.8, 1 - day),
      b * lerp(1, 0.72, glow * 0.55),
    );
    const drift = (time * CLOUD_SPEED) % (CLOUD_MAP * CLOUD_CELL);
    // cloud-space x = world x - drift; the mesh is built around the eye's cell in cloud space
    const ccx = Math.floor((eye.x - drift) / CLOUD_CELL), ccz = Math.floor(eye.z / CLOUD_CELL);
    const key = `${ccx},${ccz},${this.cloudRadius}`;
    if (key !== this.cloudKey) { this.cloudKey = key; this.buildClouds(ccx, ccz); }
    this.clouds.position.set(ccx * CLOUD_CELL + drift, CLOUD_Y, ccz * CLOUD_CELL);
    this.cloudU.uCloudFar.value = this.cloudRadius;
    this.clouds.updateMatrixWorld(true);
  }

  private buildClouds(ccx: number, ccz: number) {
    const R = Math.ceil(this.cloudRadius / CLOUD_CELL) + 1;
    const N = CLOUD_MAP;
    const map = this.cloudMap;
    const at = (x: number, z: number) => map[(((z % N) + N) % N) * N + (((x % N) + N) % N)];
    const pos: number[] = [];
    const shade: number[] = [];
    const idx: number[] = [];
    const C = CLOUD_CELL, T = CLOUD_THICK;
    const pushQuad = (v: number[], s: number) => {
      const b = pos.length / 3;
      pos.push(...v);
      shade.push(s, s, s, s);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dz * dz > R * R) continue;
      const gx = ccx + dx, gz = ccz + dz;
      if (!at(gx, gz)) continue;
      const x0 = dx * C, x1 = x0 + C, z0 = dz * C, z1 = z0 + C;
      pushQuad([x0, T, z0, x0, T, z1, x1, T, z1, x1, T, z0], 1.0);             // top
      pushQuad([x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z1], 0.72);            // bottom
      if (!at(gx + 1, gz)) pushQuad([x1, 0, z0, x1, T, z0, x1, T, z1, x1, 0, z1], 0.86); // east
      if (!at(gx - 1, gz)) pushQuad([x0, 0, z0, x0, 0, z1, x0, T, z1, x0, T, z0], 0.86); // west
      if (!at(gx, gz + 1)) pushQuad([x0, 0, z1, x1, 0, z1, x1, T, z1, x0, T, z1], 0.93); // south
      if (!at(gx, gz - 1)) pushQuad([x0, 0, z0, x0, T, z0, x1, T, z0, x1, 0, z0], 0.93); // north
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('aShade', new BufferAttribute(new Float32Array(shade), 1));
    const n = pos.length / 3;
    g.setIndex(new BufferAttribute(n > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
    this.clouds.geometry.dispose();
    this.clouds.geometry = g;
  }

  private buildStars(): BufferGeometry {
    const n = 1400;
    const p = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n);
    let s = 90210;
    const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
    for (let i = 0; i < n; i++) {
      let x = 0, y = 0, z = 0, l = 0;
      do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; l = x * x + y * y + z * z; } while (l > 1 || l < 0.01);
      l = Math.sqrt(l);
      p[i * 3] = x / l * (SKY_R - 1); p[i * 3 + 1] = y / l * (SKY_R - 1); p[i * 3 + 2] = z / l * (SKY_R - 1);
      const r = rnd();
      size[i] = r < 0.7 ? 1.0 : r < 0.95 ? 2.0 : 3.0;
      phase[i] = rnd();
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(p, 3));
    g.setAttribute('aSize', new BufferAttribute(size, 1));
    g.setAttribute('aPhase', new BufferAttribute(phase, 1));
    return g;
  }

  dispose(): void {
    for (const m of [this.dome, this.sun, this.moon, this.clouds]) { m.geometry.dispose(); (m.material as ShaderMaterial).dispose(); }
    this.stars.geometry.dispose();
    (this.stars.material as ShaderMaterial).dispose();
    this.group.removeFromParent();
    this.clouds.removeFromParent();
  }
}
