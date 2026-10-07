// Block selection outline: thin dark lines (constant width in pixels) around the outline of
// the union of the selection boxes, so stairs show an L shape instead of two boxes.
import { Mesh, BufferGeometry, BufferAttribute, ShaderMaterial, Vector2, DoubleSide } from 'three';
import type { IUniform } from 'three';
import type { Box } from '../types';

const INFLATE = 0.002;

const VS = `
attribute vec3 aA;
attribute vec3 aB;
attribute vec2 aCorner;   // x: 0 = start, 1 = end; y: side -1 / 1
uniform vec2 uResolution;
uniform float uWidth;
uniform float uNear;
void main() {
  vec4 a = modelViewMatrix * vec4(aA, 1.0);
  vec4 b = modelViewMatrix * vec4(aB, 1.0);
  float nz = -uNear * 1.05;
  if (a.z > nz && b.z > nz) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  if (a.z > nz) a = mix(a, b, (a.z - nz) / (a.z - b.z));
  if (b.z > nz) b = mix(b, a, (b.z - nz) / (b.z - a.z));
  vec4 ca = projectionMatrix * a;
  vec4 cb = projectionMatrix * b;
  vec2 sa = ca.xy / ca.w * uResolution * 0.5;
  vec2 sb = cb.xy / cb.w * uResolution * 0.5;
  vec2 dir = sb - sa;
  float len = length(dir);
  dir = len > 0.0001 ? dir / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  vec4 c = aCorner.x < 0.5 ? ca : cb;
  vec2 off = (nrm * aCorner.y + dir * (aCorner.x < 0.5 ? -1.0 : 1.0)) * uWidth * 0.5;
  c.xy += off / uResolution * 2.0 * c.w;
  c.z -= 0.0004 * c.w;
  gl_Position = c;
}
`;
const FS = `
precision mediump float;
uniform vec4 uColor;
void main() { gl_FragColor = uColor; }
`;

/**
 * Edges of the union of axis-aligned boxes: an edge piece is kept when the four quadrants
 * around it are not "flat" (1 or 3 filled, or 2 filled diagonally). Returns flat segments
 * [x0,y0,z0,x1,y1,z1,...] in the boxes' coordinate frame.
 */
export function outlineSegments(boxesIn: Box[], inflate = INFLATE): number[] {
  const boxes = boxesIn.map((b) => [
    b[0] - inflate, b[1] - inflate, b[2] - inflate, b[3] + inflate, b[4] + inflate, b[5] + inflate,
  ]);
  const inside = (p: number[]) => {
    for (const b of boxes) {
      if (p[0] > b[0] && p[0] < b[3] && p[1] > b[1] && p[1] < b[4] && p[2] > b[2] && p[2] < b[5]) return true;
    }
    return false;
  };
  const out: number[] = [];
  const seen = new Set<string>();
  const eps = 1e-4;
  for (let a = 0; a < 3; a++) {
    const b = (a + 1) % 3, c = (a + 2) % 3;
    // split points along axis a
    const cuts = new Set<number>();
    for (const bx of boxes) { cuts.add(bx[a]); cuts.add(bx[a + 3]); }
    const sorted = Array.from(cuts).sort((p, q) => p - q);
    // candidate lines: every (b, c) bound pair
    const bs = new Set<number>(), cs = new Set<number>();
    for (const bx of boxes) { bs.add(bx[b]); bs.add(bx[b + 3]); cs.add(bx[c]); cs.add(bx[c + 3]); }
    for (const vb of bs) for (const vc of cs) {
      let runStart = NaN, runEnd = NaN;
      const flush = () => {
        if (runStart === runStart) {
          const key = `${a}:${vb}:${vc}:${runStart}`;
          if (!seen.has(key)) {
            seen.add(key);
            const p0 = [0, 0, 0], p1 = [0, 0, 0];
            p0[a] = runStart; p1[a] = runEnd; p0[b] = p1[b] = vb; p0[c] = p1[c] = vc;
            out.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2]);
          }
        }
        runStart = runEnd = NaN;
      };
      for (let i = 0; i + 1 < sorted.length; i++) {
        const s0 = sorted[i], s1 = sorted[i + 1];
        if (s1 - s0 < 1e-9) continue;
        const m = (s0 + s1) / 2;
        const q = [0, 0, 0, 0];
        let k = 0;
        for (const db of [-eps, eps]) for (const dc of [-eps, eps]) {
          const p = [0, 0, 0];
          p[a] = m; p[b] = vb + db; p[c] = vc + dc;
          q[k++] = inside(p) ? 1 : 0;
        }
        const n = q[0] + q[1] + q[2] + q[3];
        const edge = n === 1 || n === 3 || (n === 2 && q[0] === q[3]);
        if (edge) {
          if (runEnd === s0) runEnd = s1; else { flush(); runStart = s0; runEnd = s1; }
        } else flush();
      }
      flush();
    }
  }
  return out;
}

export class Highlight {
  readonly mesh: Mesh;
  private mat: ShaderMaterial;
  private res: IUniform;
  private width: IUniform;
  private near: IUniform;
  private lastKey: number[] = [];
  private lastNull = true;

  constructor() {
    this.res = { value: new Vector2(1280, 720) };
    this.width = { value: 2 };
    this.near = { value: 0.05 };
    this.mat = new ShaderMaterial({
      name: 'highlight',
      uniforms: { uResolution: this.res, uWidth: this.width, uNear: this.near, uColor: { value: new Float32Array([0, 0, 0, 0.45]) } },
      vertexShader: VS,
      fragmentShader: FS,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    });
    this.mesh = new Mesh(new BufferGeometry(), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.mesh.renderOrder = 50;
    this.mesh.matrixAutoUpdate = false;
  }

  /** Drawing-buffer size in pixels (line width is in pixels). */
  setResolution(w: number, h: number, near: number): void {
    (this.res.value as Vector2).set(w, h);
    this.width.value = Math.max(1.5, Math.min(4, h / 420));
    this.near.value = near;
  }

  set(boxes: Box[] | null, x: number, y: number, z: number): void {
    if (!boxes || boxes.length === 0) {
      this.mesh.visible = false;
      this.lastNull = true;
      return;
    }
    // Rebuild only when the target changes (the game calls this every frame).
    const key = this.lastKey;
    let same = !this.lastNull && key.length === boxes.length * 6 + 3 && key[0] === x && key[1] === y && key[2] === z;
    if (same) {
      for (let i = 0; i < boxes.length && same; i++) for (let j = 0; j < 6; j++) if (key[3 + i * 6 + j] !== boxes[i][j]) { same = false; break; }
    }
    this.mesh.visible = true;
    this.mesh.position.set(x, y, z);
    this.mesh.updateMatrix();
    this.mesh.matrixWorld.copy(this.mesh.matrix);
    if (same) return;
    this.lastNull = false;
    key.length = 0;
    key.push(x, y, z);
    for (const b of boxes) key.push(b[0], b[1], b[2], b[3], b[4], b[5]);

    const seg = outlineSegments(boxes);
    const n = seg.length / 6;
    const A = new Float32Array(n * 12), B = new Float32Array(n * 12), C = new Float32Array(n * 8);
    const idx = new Uint16Array(n * 6);
    const corners = [0, -1, 0, 1, 1, 1, 1, -1];
    for (let i = 0; i < n; i++) {
      for (let v = 0; v < 4; v++) {
        for (let k = 0; k < 3; k++) { A[(i * 4 + v) * 3 + k] = seg[i * 6 + k]; B[(i * 4 + v) * 3 + k] = seg[i * 6 + 3 + k]; }
        C[(i * 4 + v) * 2] = corners[v * 2]; C[(i * 4 + v) * 2 + 1] = corners[v * 2 + 1];
      }
      const b = i * 4;
      idx.set([b, b + 1, b + 2, b, b + 2, b + 3], i * 6);
    }
    const g = new BufferGeometry();
    g.setAttribute('aA', new BufferAttribute(A, 3));
    g.setAttribute('aB', new BufferAttribute(B, 3));
    g.setAttribute('aCorner', new BufferAttribute(C, 2));
    // three needs a 'position' attribute to size non-indexed draws; ours is indexed but keep one for safety
    g.setAttribute('position', new BufferAttribute(A, 3));
    g.setIndex(new BufferAttribute(idx, 1));
    this.mesh.geometry.dispose();
    this.mesh.geometry = g;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}
