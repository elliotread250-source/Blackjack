import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  type Material,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as poly2tri from 'poly2tri';
import { cleanPolygon, pointInPolygon, rng } from '../sim/geom';
import type { LevelDef, Solid, SolidStyle, Vec } from '../sim/types';
import { capColor, rockColor } from './palette';
import type { TextureSet } from './textures';

/**
 * Depth layout (z toward the camera): the physics plane is z=0, the barrel
 * sits around it and the pick rides at z≈0.46. Every solid keeps its exact
 * physics silhouette from FRONT_Z backwards; its front is a sculpted surface
 * that bulges toward the camera away from the edges.
 */
export const FRONT_Z = 0.9;

type Kind = 'rock' | 'wood' | 'ice' | 'summit';

interface Look {
  depth: number;
  kind: Kind;
  /** Profile of the front: 'pillow' for rock masses, 'round' for logs. */
  profile: 'pillow' | 'round';
  bulge: number;
  falloff: number;
  noise: number;
  spacing: number;
}

function lookFor(style: SolidStyle, thick: number, detail: number): Look {
  const sp = (s: number) => s / Math.max(0.35, detail);
  switch (style) {
    case 'ground':
    case 'cliff':
      return { depth: 14, kind: 'rock', profile: 'pillow', bulge: 3.2, falloff: 3.2, noise: 0.55, spacing: sp(1.5) };
    case 'boulder':
      return { depth: 2.6, kind: 'rock', profile: 'pillow', bulge: Math.min(1.1, thick * 0.7), falloff: Math.max(0.4, thick * 0.6), noise: 0.06, spacing: sp(0.45) };
    case 'trunk':
      return { depth: 2.4, kind: 'wood', profile: 'round', bulge: thick / 2, falloff: 1, noise: 0.03, spacing: sp(0.5) };
    case 'branch':
      return { depth: 1.5, kind: 'wood', profile: 'round', bulge: thick / 2, falloff: 1, noise: 0.01, spacing: sp(0.25) };
    case 'ice':
      return { depth: 14, kind: 'ice', profile: 'pillow', bulge: 0.25, falloff: 0.6, noise: 0.02, spacing: sp(1.2) };
    case 'summit':
      return { depth: 5, kind: 'summit', profile: 'pillow', bulge: 0.45, falloff: 0.5, noise: 0.04, spacing: sp(0.5) };
    default:
      return { depth: 6, kind: 'rock', profile: 'pillow', bulge: 1, falloff: 1, noise: 0.1, spacing: sp(1) };
  }
}

/** Rough minimum thickness: 2·area / half-perimeter works for limbs and blobs. */
function thickness(pts: Vec[]): number {
  let area = 0;
  let perim = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    area += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
    perim += Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
  }
  return (2 * Math.abs(area / 2)) / Math.max(perim / 2, 1e-3);
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + dx * t - px;
  const qy = ay + dy * t - py;
  return Math.sqrt(qx * qx + qy * qy);
}

function distToBoundary(px: number, py: number, pts: Vec[]): number {
  let best = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const d = distToSegment(px, py, pts[j].x, pts[j].y, pts[i].x, pts[i].y);
    if (d < best) best = d;
  }
  return best;
}

/** Smooth 2D value noise in world space, cheap and deterministic. */
function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number): number {
  return vnoise(x * 0.18, y * 0.18) * 0.55 + vnoise(x * 0.5, y * 0.5) * 0.28 + vnoise(x * 1.4, y * 1.4) * 0.17;
}

/** Densify the outline so the front surface can curve right up to the edge. */
function densify(pts: Vec[], maxSeg: number): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    out.push(a);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.floor(len / maxSeg);
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      // A hair of sideways jitter keeps the triangulator away from exact collinearity.
      const j = (hash2(a.x * 13 + k, a.y * 7 - k) - 0.5) * 0.002;
      out.push({ x: a.x + (b.x - a.x) * t + j, y: a.y + (b.y - a.y) * t - j });
    }
  }
  return out;
}

interface Built {
  geo: BufferGeometry;
  kind: Kind;
}

function colorFor(kind: Kind, y: number, out: Color): Color {
  if (kind === 'rock') return rockColor(out, y);
  if (kind === 'wood') return out.set('#7a4d2b').lerp(new Color('#5e4636'), Math.min(1, Math.max(0, (y - 8) / 40)));
  if (kind === 'ice') return out.set('#d2efff');
  return out.set('#d9b878');
}

function buildSolid(solid: Solid, index: number, detail: number): Built | null {
  const outline = cleanPolygon(solid.pts);
  if (outline.length < 3) return null;
  const thick = thickness(outline);
  const look = lookFor(solid.style, thick, detail);
  const r = rng(index * 977 + 13);
  const tint = 0.9 + r() * 0.2;
  const boundary = densify(outline, Math.max(0.18, look.spacing * 0.8));

  // ---- front surface: constrained triangulation with interior points
  const ptsP2T = boundary.map((p, i) => Object.assign(new poly2tri.Point(p.x, p.y), { _i: i }));
  const steiner: poly2tri.Point[] = [];
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of outline) {
    x0 = Math.min(x0, p.x);
    x1 = Math.max(x1, p.x);
    y0 = Math.min(y0, p.y);
    y1 = Math.max(y1, p.y);
  }
  const s = look.spacing;
  for (let y = y0 + s * 0.5; y < y1; y += s) {
    for (let x = x0 + s * 0.5; x < x1; x += s) {
      const px = x + (r() - 0.5) * s * 0.6;
      const py = y + (r() - 0.5) * s * 0.6;
      if (!pointInPolygon({ x: px, y: py }, outline)) continue;
      if (distToBoundary(px, py, boundary) < s * 0.45) continue;
      steiner.push(new poly2tri.Point(px, py));
    }
  }
  let tris: poly2tri.Triangle[] = [];
  try {
    const ctx = new poly2tri.SweepContext(ptsP2T);
    ctx.addPoints(steiner);
    ctx.triangulate();
    tris = ctx.getTriangles();
  } catch {
    try {
      const ctx = new poly2tri.SweepContext(outline.map((p) => new poly2tri.Point(p.x, p.y)));
      ctx.triangulate();
      tris = ctx.getTriangles();
    } catch {
      return null;
    }
  }

  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const c = new Color();
  const cap = new Color();
  const zOf = (x: number, y: number) => {
    const d = distToBoundary(x, y, boundary);
    let b: number;
    if (look.profile === 'round') {
      const R = Math.max(0.05, look.bulge);
      const t = Math.min(d, R);
      b = Math.sqrt(Math.max(0, R * R - (R - t) * (R - t)));
    } else {
      b = look.bulge * (1 - Math.exp(-d / look.falloff));
    }
    const amp = look.noise * Math.min(1, d / 1.2);
    return FRONT_Z + b + (fbm(x + index * 31.7, y) - 0.5) * 2 * amp;
  };
  for (const t of tris) {
    for (let k = 0; k < 3; k++) {
      const p = t.getPoint(k as 0 | 1 | 2);
      const z = zOf(p.x, p.y);
      pos.push(p.x, p.y, z);
      uv.push(p.x / 6, p.y / 6);
      colorFor(look.kind, p.y, c).multiplyScalar(tint * (0.92 + fbm(p.x * 2, p.y * 2) * 0.16));
      col.push(c.r, c.g, c.b);
    }
  }
  const front = new BufferGeometry();
  front.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  front.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  front.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  // Triangles from poly2tri come back counter-clockwise: front faces +z. Smooth normals
  // via a quick merge of identical positions.
  front.computeVertexNormals();
  smoothNormals(front);

  // ---- side walls: the exact outline extruded straight back
  const back = FRONT_Z - look.depth;
  const sp: number[] = [];
  const su: number[] = [];
  const sc: number[] = [];
  let run = 0;
  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i];
    const b = boundary[(i + 1) % boundary.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    // Outline is CCW, so the outward normal is (dy, -dx).
    const ny = -(b.x - a.x) / (len || 1);
    const za = FRONT_Z;
    // quad a-front, b-front, b-back, a-back
    const quad = [
      [a.x, a.y, za, run, 0],
      [b.x, b.y, za, run + len, 0],
      [b.x, b.y, back, run + len, look.depth],
      [a.x, a.y, back, run, look.depth],
    ];
    for (const idx of [0, 2, 1, 0, 3, 2]) {
      const q = quad[idx];
      sp.push(q[0], q[1], q[2]);
      su.push(q[3] / 6, q[4] / 6);
      colorFor(look.kind, q[1], c).multiplyScalar(tint);
      if (look.kind === 'rock' && ny > 0.5) c.lerp(capColor(cap, q[1]), Math.min(1, (ny - 0.5) / 0.35));
      // Darken toward the back so the mass reads as solid.
      c.multiplyScalar(1 - (q[4] / look.depth) * 0.5);
      sc.push(c.r, c.g, c.b);
    }
    run += len;
  }
  const sides = new BufferGeometry();
  sides.setAttribute('position', new BufferAttribute(new Float32Array(sp), 3));
  sides.setAttribute('uv', new BufferAttribute(new Float32Array(su), 2));
  sides.setAttribute('color', new BufferAttribute(new Float32Array(sc), 3));
  sides.computeVertexNormals();

  // Grass/snow on the front surface where it faces up (top rims of bulges).
  if (look.kind === 'rock') {
    const n = front.getAttribute('normal') as BufferAttribute;
    const p = front.getAttribute('position') as BufferAttribute;
    const cc = front.getAttribute('color') as BufferAttribute;
    for (let i = 0; i < n.count; i++) {
      const ny = n.getY(i);
      if (ny > 0.55) {
        c.setRGB(cc.getX(i), cc.getY(i), cc.getZ(i));
        c.lerp(capColor(cap, p.getY(i)), Math.min(0.85, (ny - 0.55) / 0.3));
        cc.setXYZ(i, c.r, c.g, c.b);
      }
    }
  }

  const merged = mergeGeometries([front, sides], false);
  if (!merged) return null;
  return { geo: merged, kind: look.kind };
}

/** Average normals of coincident vertices so the sculpted surface shades smoothly. */
function smoothNormals(geo: BufferGeometry): void {
  const p = geo.getAttribute('position') as BufferAttribute;
  const n = geo.getAttribute('normal') as BufferAttribute;
  const map = new Map<string, number[]>();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)}`;
    let list = map.get(key);
    if (!list) map.set(key, (list = []));
    list.push(i);
  }
  for (const list of map.values()) {
    let x = 0, y = 0, z = 0;
    for (const i of list) {
      x += n.getX(i);
      y += n.getY(i);
      z += n.getZ(i);
    }
    const l = Math.hypot(x, y, z) || 1;
    for (const i of list) n.setXYZ(i, x / l, y / l, z / l);
  }
}

export interface TerrainMeshes {
  group: Group;
  materials: Material[];
  rockMaterial: Material;
}

export interface TerrainOptions {
  /** 0.35..1.5: density of sculpted detail. */
  detail: number;
  /** Physically based materials with normal maps (GPU), or cheap Lambert (CPU). */
  pbr: boolean;
  shadows: boolean;
}

export function buildTerrain(level: LevelDef, tex: TextureSet, opts: TerrainOptions): TerrainMeshes {
  const buckets: Record<Kind, BufferGeometry[]> = { rock: [], wood: [], ice: [], summit: [] };
  level.solids.forEach((s, i) => {
    const built = buildSolid(s, i, opts.detail);
    if (built) buckets[built.kind].push(built.geo);
  });

  const rockMap = tex.rock.clone();
  const rockNormal = tex.rockNormal.clone();
  const barkMap = tex.bark.clone();
  const barkNormal = tex.barkNormal.clone();
  const iceMap = tex.ice.clone();
  for (const t of [rockMap, rockNormal]) t.repeat.set(1, 1);
  for (const t of [barkMap, barkNormal]) t.repeat.set(2.6, 2.6);
  iceMap.repeat.set(1.4, 1.4);

  let mats: Record<Kind, Material>;
  if (opts.pbr) {
    mats = {
      rock: new MeshStandardMaterial({ map: rockMap, normalMap: rockNormal, vertexColors: true, roughness: 0.93, metalness: 0 }),
      wood: new MeshStandardMaterial({ map: barkMap, normalMap: barkNormal, vertexColors: true, roughness: 0.85, metalness: 0 }),
      ice: new MeshStandardMaterial({ map: iceMap, vertexColors: true, roughness: 0.06, metalness: 0.05, emissive: new Color('#16304a'), emissiveIntensity: 0.5 }),
      summit: new MeshStandardMaterial({ map: rockMap, normalMap: rockNormal, vertexColors: true, roughness: 0.7, metalness: 0.05 }),
    };
  } else {
    mats = {
      rock: new MeshLambertMaterial({ map: rockMap, vertexColors: true }),
      wood: new MeshLambertMaterial({ map: barkMap, vertexColors: true }),
      ice: new MeshLambertMaterial({ map: iceMap, vertexColors: true, emissive: new Color('#1d3d5c') }),
      summit: new MeshLambertMaterial({ map: rockMap, vertexColors: true }),
    };
  }

  const group = new Group();
  for (const kind of Object.keys(buckets) as Kind[]) {
    const list = buckets[kind];
    if (!list.length) continue;
    const merged = mergeGeometries(list, false);
    if (!merged) continue;
    merged.computeBoundingSphere();
    const mesh = new Mesh(merged, mats[kind]);
    mesh.castShadow = opts.shadows;
    mesh.receiveShadow = opts.shadows;
    mesh.frustumCulled = false;
    group.add(mesh);
  }
  return { group, materials: Object.values(mats), rockMaterial: mats.rock };
}
