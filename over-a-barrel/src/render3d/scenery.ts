import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  MeshLambertMaterial,
  type Material,
  Euler,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Quaternion,
  ShaderMaterial,
  Shape,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cleanPolygon, rng } from '../sim/geom';
import type { LevelDef } from '../sim/types';
import type { GraphicsPreset } from '../config';
import { capColor, rockColor, type Atmos } from './palette';
import type { TextureSet } from './textures';

// ------------------------------------------------------------------ sky
const skyVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`;

const skyFrag = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uBottom;
uniform vec3 uSun;
uniform vec2 uSunPos;
uniform float uSunSize;
uniform float uMoon;
uniform float uStars;
uniform float uTime;
uniform float uFlash;
uniform float uAspect;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float y = vUv.y;
  vec3 col = mix(uHorizon, uTop, smoothstep(0.2, 1.05, y));
  col = mix(uBottom, col, smoothstep(-0.05, 0.28, y));
  vec2 d = vUv - uSunPos;
  d.x *= uAspect;
  float r = length(d);
  float disc = smoothstep(uSunSize, uSunSize * 0.82, r);
  // Moon: carve a crescent out of the disc.
  vec2 d2 = d - vec2(uSunSize * 0.45, uSunSize * 0.2);
  float carve = uMoon * smoothstep(uSunSize * 0.86, uSunSize * 0.7, length(d2));
#ifdef LOW
  col += uSun * (disc * (1.0 - carve) * 1.3 + max(0.0, 1.0 - r * 3.0) * 0.25);
#else
  col += uSun * (disc * (1.0 - carve) * 1.3 + exp(-r * 7.0) * 0.32 + exp(-r * 2.2) * 0.08);
  vec2 g = floor(gl_FragCoord.xy / 2.5);
  float h = hash(g);
  float tw = 0.55 + 0.45 * sin(uTime * 1.7 + h * 90.0);
  col += vec3(step(0.9982, h) * tw * uStars * smoothstep(0.25, 0.85, y));
#endif
  col += vec3(0.72, 0.78, 1.0) * uFlash;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function makeSky(low: boolean): { mesh: Mesh; mat: ShaderMaterial } {
  const mat = new ShaderMaterial({
    defines: low ? { LOW: 1 } : {},
    vertexShader: skyVert,
    fragmentShader: skyFrag,
    uniforms: {
      uTop: { value: new Color() },
      uHorizon: { value: new Color() },
      uBottom: { value: new Color() },
      uSun: { value: new Color() },
      uSunPos: { value: new Vector2(0.75, 0.6) },
      uSunSize: { value: 0.035 },
      uMoon: { value: 0 },
      uStars: { value: 0 },
      uTime: { value: 0 },
      uFlash: { value: 0 },
      uAspect: { value: 1.7 },
    },
    depthWrite: false,
    // Drawn last at the far plane: the depth test discards every sky pixel that
    // terrain already covers, so we only pay for sky you can actually see.
    depthTest: true,
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1000;
  return { mesh, mat };
}

// ------------------------------------------------------------- ranges
interface RangeOpts {
  seed: number;
  z: number;
  x0: number;
  x1: number;
  base: number;
  /** Peak envelope: [x, low, high] control points, linearly interpolated. */
  env: [number, number, number][];
  step: number;
  snow: number;
  tint: string;
}

function ridgeNoise(r: () => number, n: number): number[] {
  // Sum of a few random sines with a ridged look.
  const waves = Array.from({ length: 5 }, (_, i) => ({ f: (0.6 + r() * 1.4) * (i + 1), p: r() * 6.28, a: 1 / (i + 1.2) }));
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let v = 0;
    let tot = 0;
    for (const w of waves) {
      v += (1 - Math.abs(Math.sin(t * Math.PI * 2 * w.f * 3 + w.p))) * w.a;
      tot += w.a;
    }
    out.push(v / tot);
  }
  return out;
}

function envelope(env: [number, number, number][], x: number): [number, number] {
  if (x <= env[0][0]) return [env[0][1], env[0][2]];
  for (let i = 0; i < env.length - 1; i++) {
    const [xa, la, ha] = env[i];
    const [xb, lb, hb] = env[i + 1];
    if (x <= xb) {
      const t = (x - xa) / (xb - xa);
      return [la + (lb - la) * t, ha + (hb - ha) * t];
    }
  }
  const last = env[env.length - 1];
  return [last[1], last[2]];
}

function makeRange(o: RangeOpts, solidMat: (opt: { vertexColors?: boolean; flatShading?: boolean }) => Material): Mesh {
  const r = rng(o.seed);
  const cols = Math.round((o.x1 - o.x0) / o.step) + 1;
  const rows = 7;
  const noise = ridgeNoise(r, cols);
  const heights = noise.map((v, i) => {
    const [lo, hi] = envelope(o.env, o.x0 + i * o.step);
    return lo + (hi - lo) * Math.pow(v, 1.8);
  });
  const pos: number[] = [];
  const col: number[] = [];
  const c = new Color();
  const tint = new Color(o.tint);
  const snow = new Color('#eef2f8');
  for (let i = 0; i < cols; i++) {
    const x = o.x0 + i * o.step;
    for (let j = 0; j <= rows; j++) {
      const t = j / rows;
      const y = o.base + (heights[i] - o.base) * Math.pow(t, 0.85);
      const z = o.z - (1 - t) * 40 - r() * 14 * (0.3 + t);
      pos.push(x + (r() - 0.5) * o.step * 0.5 * (j > 0 && j < rows ? 1 : 0), y, z);
      c.copy(tint).multiplyScalar(0.75 + r() * 0.3);
      if (y > o.snow + (r() - 0.5) * 18) c.lerp(snow, 0.85);
      col.push(c.r, c.g, c.b);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < cols - 1; i++) {
    for (let j = 0; j < rows; j++) {
      const a = i * (rows + 1) + j;
      const b = (i + 1) * (rows + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  let geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  geo.setIndex(idx);
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  const mesh = new Mesh(geo, solidMat({ vertexColors: true }));
  mesh.frustumCulled = false;
  return mesh;
}

/** Rolling ground behind the play plane, so the climb doesn't float in a void. */
function valleyHeight(x: number, z: number): number {
  const d = Math.max(0, -z - 14);
  const roll = Math.sin(x * 0.035 + z * 0.02) * 2.2 + Math.sin(x * 0.011 - z * 0.017) * 4 + Math.sin(x * 0.09 + z * 0.05) * 0.7;
  return -2.5 + roll * Math.min(1, d / 40) + d * 0.015;
}

function makeValley(solidMat: (opt: { vertexColors?: boolean; flatShading?: boolean }) => Material, smooth: boolean): Mesh {
  const x0 = -320;
  const x1 = 520;
  const z0 = -13.5;
  const z1 = -260;
  const nx = 84;
  const nz = 30;
  const pos: number[] = [];
  const col: number[] = [];
  const c = new Color();
  const a = new Color('#5d7a3c');
  const b = new Color('#3e5a33');
  const dry = new Color('#9a8a5a');
  for (let j = 0; j <= nz; j++) {
    // Rows bunch up near the play plane where detail matters.
    const t = Math.pow(j / nz, 1.6);
    const z = z0 + (z1 - z0) * t;
    for (let i = 0; i <= nx; i++) {
      const x = x0 + ((x1 - x0) * i) / nx;
      pos.push(x, valleyHeight(x, z), z);
      const n = Math.sin(x * 0.13) * Math.sin(z * 0.11) * 0.5 + 0.5;
      c.copy(a).lerp(b, n).lerp(dry, Math.max(0, Math.sin(x * 0.02 + 1.3)) * 0.35);
      col.push(c.r, c.g, c.b);
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const p = j * (nx + 1) + i;
      const q = p + nx + 1;
      idx.push(p, p + 1, q, p + 1, q + 1, q);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new Mesh(geo, solidMat({ vertexColors: true }));
  void smooth;
  m.receiveShadow = true;
  m.frustumCulled = false;
  return m;
}

/** A faceted rock tower for the stone forest behind the climb. */
function makeTower(r: () => number, x: number, z: number, top: number, solidMat: (opt: { vertexColors?: boolean; flatShading?: boolean }) => Material): Mesh {
  const rad = 3 + r() * 5;
  const h = top + 60;
  const geo = new CylinderGeometry(rad * (0.45 + r() * 0.25), rad, h, 7, 6, false).toNonIndexed();
  const p = geo.getAttribute('position') as BufferAttribute;
  const colors = new Float32Array(p.count * 3);
  const c = new Color();
  const cap = new Color();
  for (let i = 0; i < p.count; i++) {
    const wy = p.getY(i) + h / 2 - 60;
    const jit = 1 + Math.sin(p.getX(i) * 3.1 + p.getY(i) * 0.9 + p.getZ(i) * 2.3) * 0.12;
    p.setX(i, p.getX(i) * jit);
    p.setZ(i, p.getZ(i) * jit);
    rockColor(c, wy);
    if (p.getY(i) > h / 2 - 0.5) c.lerp(capColor(cap, wy), 0.7);
    c.multiplyScalar(0.8);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const m = new Mesh(geo, solidMat({ vertexColors: true }));
  m.position.set(x, -60 + h / 2, z);
  m.rotation.y = r() * Math.PI;
  return m;
}

// -------------------------------------------------------------- decor
/** Faceted, vertex-coloured copy of a geometry: merges with others into one draw call. */
function colored(geo: BufferGeometry, color: Color, m: Matrix4): BufferGeometry {
  const g = geo.toNonIndexed();
  g.applyMatrix4(m);
  g.computeVertexNormals(); // non-indexed → face normals → faceted look, no derivatives
  const n = g.getAttribute('position').count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([color.r, color.g, color.b], i * 3);
  g.setAttribute('color', new BufferAttribute(col, 3));
  g.deleteAttribute('uv');
  return g;
}

const M = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) =>
  new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(rx, ry, rz)), new Vector3(1, 1, 1));

function autumnTreeParts(r: () => number, h: number, x: number, y: number, z: number): BufferGeometry[] {
  const out = [colored(new CylinderGeometry(0.18, 0.32, h * 0.55, 7), new Color('#5a3a26'), M(x, y + h * 0.27, z))];
  const leafCols = ['#d9822b', '#c4532f', '#e8b23c', '#b8452f', '#d96f2a'];
  for (let i = 0; i < 5; i++) {
    const rad = h * (0.16 + r() * 0.1);
    out.push(
      colored(
        new IcosahedronGeometry(rad, 0),
        new Color(leafCols[Math.floor(r() * leafCols.length)]),
        M(x + (r() - 0.5) * h * 0.35, y + h * (0.6 + r() * 0.3), z + (r() - 0.5) * h * 0.25, r() * 3, r() * 3, r() * 3),
      ),
    );
  }
  return out;
}

function pineParts(r: () => number, h: number, color: Color, x: number, y: number, z: number): BufferGeometry[] {
  const ry = r() * 3;
  const out: BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) out.push(colored(new ConeGeometry(h * (0.32 - i * 0.07), h * 0.45, 7), color, M(x, y + h * (0.35 + i * 0.22), z, 0, ry)));
  out.push(colored(new CylinderGeometry(h * 0.04, h * 0.05, h * 0.3, 5), new Color('#4a3020'), M(x, y + h * 0.12, z)));
  return out;
}

function flagTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 80;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d63c2f';
  ctx.fillRect(0, 0, 128, 80);
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(0, 30, 128, 20);
  // A little barrel emblem.
  ctx.fillStyle = '#7a4d2b';
  ctx.beginPath();
  ctx.ellipse(64, 40, 16, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2b30';
  ctx.fillRect(48, 30, 32, 3);
  ctx.fillRect(48, 47, 32, 3);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export class Scenery {
  readonly group = new Group();
  readonly sky: Mesh;
  private skyMat: ShaderMaterial;
  private clouds: { s: Sprite; speed: number; base: Color }[] = [];
  private flag?: { geo: BufferGeometry; rest: Float32Array };
  lantern?: PointLight;
  private time = 0;

  constructor(level: LevelDef, tex: TextureSet, rockMat: Material, preset: GraphicsPreset) {
    const solidMat = (o: { vertexColors?: boolean; color?: Color; flatShading?: boolean }) =>
      preset.pbr ? new MeshStandardMaterial({ roughness: 1, metalness: 0, ...o }) : new MeshLambertMaterial({ ...o });
    const { mesh, mat } = makeSky(!preset.pbr);
    this.sky = mesh;
    this.skyMat = mat;

    // Distant ranges: real depth, so parallax comes free with the camera.
    // A valley floor fills the space behind the climb; the mountains sit
    // far out where a long lens makes them read as real distant ranges.
    // The great snowy range rises off to the right, where the climb heads.
    this.group.add(makeValley(solidMat, preset.pbr));
    this.group.add(
      makeRange({ seed: 2, z: -240, x0: -360, x1: 620, base: -40, env: [[-300, 2, 14], [60, 6, 22], [170, 30, 70], [420, 50, 100]], step: 11, snow: 999, tint: '#62705a' }, solidMat),
      makeRange({ seed: 3, z: -420, x0: -560, x1: 860, base: -60, env: [[-400, 8, 34], [50, 18, 48], [150, 90, 190], [520, 150, 260]], step: 16, snow: 150, tint: '#5f6678' }, solidMat),
      makeRange({ seed: 4, z: -700, x0: -900, x1: 1300, base: -80, env: [[-700, 20, 60], [40, 30, 80], [190, 260, 430], [900, 280, 470]], step: 24, snow: 190, tint: '#5a6580' }, solidMat),
    );
    // A handful of stone spires far off near the summit, for drama up top.
    const r = rng(99);
    for (let i = 0; i < Math.min(preset.towers, 8); i++) {
      const x = 90 + i * 34 + (r() - 0.5) * 20;
      const z = -260 - r() * 160;
      this.group.add(makeTower(r, x, z, 120 + r() * 180, solidMat));
    }
    // Pines on the valley floor behind the start: one merged mesh, one draw call.
    const pineCol = new Color('#3f5a37');
    const pineGeos: BufferGeometry[] = [];
    for (let i = 0; i < preset.pines; i++) {
      const x = -50 + r() * 160;
      const z = -16 - r() * 70;
      pineGeos.push(...pineParts(r, 2.5 + r() * 4.5, pineCol.clone().multiplyScalar(0.7 + r() * 0.4), x, valleyHeight(x, z) - 0.3, z));
    }
    if (pineGeos.length) {
      const pines = new Mesh(mergeGeometries(pineGeos, false)!, solidMat({ vertexColors: true }));
      pines.castShadow = preset.shadows;
      this.group.add(pines);
    }

    // Clouds at many depths and heights.
    const cr = rng(5);
    for (let i = 0; i < preset.clouds; i++) {
      const m = new SpriteMaterial({ map: tex.cloud, transparent: true, depthWrite: false, opacity: 0.75 + cr() * 0.2, fog: true });
      const s = new Sprite(m);
      const w = 60 + cr() * 110;
      s.scale.set(w, w * (0.42 + cr() * 0.2), 1);
      s.position.set(-250 + cr() * 650, -30 + cr() * 380, -110 - cr() * 360);
      this.group.add(s);
      this.clouds.push({ s, speed: 1 + cr() * 2.5, base: new Color() });
    }

    // Backdrops behind cracks and the tunnel.
    for (const d of level.decor) {
      if (d.kind !== 'backdrop') continue;
      const pts = cleanPolygon(d.pts);
      const shape = new Shape(pts.map((p) => new Vector2(p.x, p.y)));
      const geo = new ExtrudeGeometry(shape, { depth: 10, bevelEnabled: false }).toNonIndexed();
      geo.translate(0, 0, -15);
      const p = geo.getAttribute('position') as BufferAttribute;
      const colors = new Float32Array(p.count * 3);
      const c = new Color();
      for (let i = 0; i < p.count; i++) {
        rockColor(c, p.getY(i)).multiplyScalar(0.45);
        colors.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute('color', new BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      const m = new Mesh(geo, rockMat);
      m.receiveShadow = true;
      this.group.add(m);
    }

    // Level decor.
    const dr = rng(321);
    const stone = new MeshStandardMaterial({ color: new Color('#8d8780'), roughness: 0.95, flatShading: true });
    const iron = new MeshStandardMaterial({ color: new Color('#3d4148'), metalness: 0.6, roughness: 0.5 });
    const staveMat = new MeshStandardMaterial({ map: tex.staves, color: new Color('#d8b088'), roughness: 0.85 });
    const treeGeos: BufferGeometry[] = [];
    for (const d of level.decor) {
      switch (d.kind) {
        case 'tree': {
          treeGeos.push(...autumnTreeParts(dr, d.h, d.x, d.y - 0.3, d.back ? -4 - dr() * 4 : -1.5));
          break;
        }
        case 'grass': {
          const blade = new BufferGeometry();
          blade.setAttribute('position', new BufferAttribute(new Float32Array([-0.03, 0, 0, 0.03, 0, 0, 0, 1, 0]), 3));
          blade.computeVertexNormals();
          const n = Math.round(d.w * 30);
          const gc = capColor(new Color(), d.y);
          const im = new InstancedMesh(blade, new MeshStandardMaterial({ color: gc, side: DoubleSide, roughness: 1 }), n);
          const mtx = new Matrix4();
          const q = new Quaternion();
          for (let i = 0; i < n; i++) {
            const h = 0.12 + dr() * 0.22;
            q.setFromAxisAngle(new Vector3(0, 0, 1), (dr() - 0.5) * 0.6);
            mtx.compose(new Vector3(d.x + dr() * d.w, d.y - 0.02, -1.2 + dr() * 2.0), q, new Vector3(1, h, 1));
            im.setMatrixAt(i, mtx);
          }
          this.group.add(im);
          break;
        }
        case 'cairn': {
          let y = d.y;
          for (let i = 0; i < 6; i++) {
            const s = 0.42 - i * 0.055;
            const st = new Mesh(new IcosahedronGeometry(s, 1), stone);
            st.scale.set(1.2, 0.55, 1);
            y += s * 0.55;
            st.position.set(d.x + (dr() - 0.5) * 0.08, y, -0.3);
            st.rotation.y = dr() * 3;
            st.castShadow = true;
            y += s * 0.45;
            this.group.add(st);
          }
          break;
        }
        case 'lantern': {
          const post = new Mesh(new CylinderGeometry(0.05, 0.06, 1.3, 8), iron);
          post.position.set(d.x, d.y + 0.65, -0.4);
          const box = new Mesh(new BoxGeometry(0.28, 0.36, 0.28), new MeshStandardMaterial({ color: new Color('#ffd27a'), emissive: new Color('#ffb347'), emissiveIntensity: 2.2 }));
          box.position.set(d.x, d.y + 1.45, -0.4);
          const roof = new Mesh(new ConeGeometry(0.24, 0.18, 4), iron);
          roof.position.set(d.x, d.y + 1.72, -0.4);
          roof.rotation.y = Math.PI / 4;
          const glow = new Sprite(new SpriteMaterial({ map: tex.soft, color: new Color('#ffb347'), transparent: true, blending: AdditiveBlending, depthWrite: false }));
          glow.scale.set(2.6, 2.6, 1);
          glow.position.copy(box.position);
          this.lantern = new PointLight(new Color('#ffb057'), 6, 14, 1.6);
          this.lantern.position.set(d.x, d.y + 1.5, 0.6);
          this.group.add(post, box, roof, glow, this.lantern);
          break;
        }
        case 'flag': {
          const pole = new Mesh(new CylinderGeometry(0.035, 0.04, 2.6, 8), iron);
          pole.position.set(d.x, d.y + 1.3, -0.5);
          const geo = new PlaneGeometry(1.3, 0.8, 12, 6);
          geo.translate(0.65, 0, 0);
          const cloth = new Mesh(geo, new MeshStandardMaterial({ map: flagTexture(), side: DoubleSide, roughness: 0.9 }));
          cloth.position.set(d.x + 0.03, d.y + 2.2, -0.5);
          cloth.castShadow = true;
          this.flag = { geo, rest: (geo.getAttribute('position').array as Float32Array).slice() };
          this.group.add(pole, cloth);
          break;
        }
        case 'bones': {
          // Somebody else's barrel, broken open at the foot of the climb.
          for (let i = 0; i < 5; i++) {
            const st = new Mesh(new BoxGeometry(0.16, 0.8, 0.05), staveMat);
            st.position.set(d.x + (dr() - 0.5) * 1.6, d.y + 0.04, -0.6 + dr() * 0.9);
            st.rotation.set(Math.PI / 2 + (dr() - 0.5) * 0.4, 0, dr() * 3);
            st.castShadow = true;
            this.group.add(st);
          }
          const hoop = new Mesh(new TorusGeometry(0.42, 0.024, 6, 30), iron);
          hoop.position.set(d.x + 0.4, d.y + 0.03, -0.2);
          hoop.rotation.x = Math.PI / 2 + 0.1;
          this.group.add(hoop);
          break;
        }
        default:
          break;
      }
    }
    if (treeGeos.length) {
      const trees = new Mesh(mergeGeometries(treeGeos, false)!, solidMat({ vertexColors: true }));
      trees.castShadow = preset.shadows;
      this.group.add(trees);
    }
  }

  update(dt: number, atmos: Atmos, aspect: number, flash: number): void {
    this.time += dt;
    const u = this.skyMat.uniforms;
    u.uTop.value.copy(atmos.skyTop);
    u.uHorizon.value.copy(atmos.skyHorizon);
    u.uBottom.value.copy(atmos.skyBottom);
    u.uSun.value.copy(atmos.sun).multiplyScalar(0.9);
    u.uSunPos.value.set(0.78, 0.18 + atmos.sunElevation * 1.3);
    u.uMoon.value = atmos.stars > 0.3 ? 1 : 0;
    u.uSunSize.value = atmos.stars > 0.3 ? 0.03 : 0.04;
    u.uStars.value = atmos.stars;
    u.uTime.value = this.time;
    u.uFlash.value = flash;
    u.uAspect.value = aspect;

    for (const c of this.clouds) {
      c.s.position.x += c.speed * dt * (1 + atmos.storm * 3);
      if (c.s.position.x > 420) c.s.position.x -= 680;
      const m = c.s.material as SpriteMaterial;
      m.color.copy(atmos.skyHorizon).lerp(atmos.sun, 0.35).multiplyScalar(1.05 - atmos.storm * 0.35);
    }

    if (this.flag) {
      const p = this.flag.geo.getAttribute('position') as BufferAttribute;
      const rest = this.flag.rest;
      for (let i = 0; i < p.count; i++) {
        const x = rest[i * 3];
        const wave = Math.sin(x * 5 - this.time * 7) * 0.09 * x + Math.sin(x * 9 - this.time * 11) * 0.03 * x;
        p.setZ(i, rest[i * 3 + 2] + wave);
        p.setY(i, rest[i * 3 + 1] + wave * 0.3);
      }
      p.needsUpdate = true;
      this.flag.geo.computeVertexNormals();
    }
    if (this.lantern) this.lantern.intensity = 6 + Math.sin(this.time * 9) * 0.6 + Math.sin(this.time * 23) * 0.4;
  }
}
