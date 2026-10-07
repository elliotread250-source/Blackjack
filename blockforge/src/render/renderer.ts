// World renderer: WebGL2 with automatic WebGL1 fallback (three r162), section mesh
// management with manual bounding spheres and our own frustum + distance culling, fog
// matched to the sky, sun/moon shadow map on the High preset, underwater/lava fog, view
// bobbing, held item, selection outline and break particles.
//
// Frame: [shadow pass (High only)] -> main pass (sky first, then terrain by layer) -> hand
// pass (depth cleared). Low preset: one main pass plus the tiny hand pass.
import {
  WebGLRenderer, Scene, PerspectiveCamera, OrthographicCamera, Mesh, Group, Frustum, Matrix4, Sphere, Vector3,
  Color, WebGLRenderTarget, RGBAFormat, UnsignedByteType, NearestFilter, LinearSRGBColorSpace, ClampToEdgeWrapping,
} from 'three';
import type { ShaderMaterial, Material } from 'three';
import type { Atlas } from './atlas';
import { setAtlasMipmaps } from './atlas';
import { createMaterials, createLayerGeometry } from './materials';
import type { Materials } from './materials';
import { Sky } from './sky';
import { Particles } from './particles';
import type { Collider } from './particles';
import { Hand } from './hand';
import { Highlight } from './highlight';
import type { Settings } from '../settings';
import type { SectionMesh, Box } from '../types';
import { sectionKey, chunkKey } from '../world/constants';

export interface RenderState {
  dt: number; time: number;               // seconds, time drives animation
  dayTime: number;                        // 0..1
  eye: { x: number; y: number; z: number };
  yaw: number; pitch: number;
  fov: number;                            // final degrees incl. sprint widening
  underwater: boolean; inLava: boolean;
  handLight: { sky: number; block: number }; // light at the player's eye, 0..15
  bob: { phase: number; amount: number }; // view bobbing (amount 0 when disabled/airborne)
  showHand: boolean;
}

interface SectionEntry {
  cx: number; sy: number; cz: number;
  wx: number; wy: number; wz: number;     // world centre
  meshes: (Mesh | null)[];
  visible: boolean;
}

const LAYERS = 5;
const SECTION_RADIUS = 8 * Math.sqrt(3);   // 13.86 blocks (3547 / 256)
const NEAR = 0.05;
const WRAP = 1024;
const wrap = (v: number) => v - Math.floor(v / WRAP) * WRAP;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export class Renderer {
  readonly info: { webgl2: boolean; renderer: string; vendor: string };
  readonly camera: PerspectiveCamera;
  private gl: WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private atlas: Atlas;
  private scene = new Scene();
  private layerGroups: Group[] = [];
  private sections = new Map<number, SectionEntry>();
  private columns = new Map<number, Set<number>>();
  private mats: Materials;
  private sky: Sky;
  private particles: Particles;
  private hand: Hand;
  private highlight: Highlight;
  private settings: Settings;
  private frustum = new Frustum();
  private projScreen = new Matrix4();
  private sphere = new Sphere(new Vector3(), SECTION_RADIUS);
  private fogFar = 64;
  private visibleSections = 0;
  private shotQueue: Array<{ resolve: (b: Blob) => void; reject: (e: unknown) => void }> = [];
  private shadowRT: WebGLRenderTarget | null = null;
  private shadowCam = new OrthographicCamera(-64, 64, 64, -64, 0.5, 320);
  private shadowRadius = 64;
  private white = new Color(1, 1, 1);
  private tmpV = new Vector3();
  private tmpM = new Matrix4();
  private flicker = 1;
  private flickerTarget = 1;
  private flickerT = 0;
  private lastFov = -1;
  private lastAspect = -1;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, atlas: Atlas, settings: Settings) {
    this.canvas = canvas;
    this.atlas = atlas;
    this.settings = { ...settings };
    // three r162 warns once that WebGL1 is deprecated; the fallback is intentional here.
    const warn = console.warn;
    console.warn = (...a: unknown[]) => { if (typeof a[0] === 'string' && a[0].includes('WebGL 1 support was deprecated')) return; warn.apply(console, a as []); };
    try {
      this.gl = new WebGLRenderer({
        canvas, antialias: false, alpha: false, depth: true, stencil: false,
        powerPreference: 'high-performance', preserveDrawingBuffer: false, premultipliedAlpha: true,
      });
    } finally {
      console.warn = warn;
    }
    const gl = this.gl;
    gl.outputColorSpace = LinearSRGBColorSpace;   // shaders write display values directly
    gl.autoClear = false;
    gl.info.autoReset = false;
    gl.sortObjects = true;
    gl.shadowMap.enabled = false;

    const ctx = gl.getContext();
    let rendererName = String(ctx.getParameter(ctx.RENDERER) ?? 'unknown');
    let vendor = String(ctx.getParameter(ctx.VENDOR) ?? 'unknown');
    try {
      const ext = ctx.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        const r = ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        const v = ctx.getParameter(ext.UNMASKED_VENDOR_WEBGL);
        if (r) rendererName = String(r);
        if (v) vendor = String(v);
      }
    } catch { /* extension blocked */ }
    this.info = { webgl2: gl.capabilities.isWebGL2, renderer: rendererName, vendor };

    this.camera = new PerspectiveCamera(settings.fov, 1, NEAR, 400);
    this.camera.rotation.order = 'YXZ';

    this.mats = createMaterials(atlas);
    this.scene.matrixWorldAutoUpdate = true;
    for (let i = 0; i < LAYERS; i++) {
      const g = new Group();
      g.name = `layer${i}`;
      g.matrixAutoUpdate = false;
      this.layerGroups.push(g);
      this.scene.add(g);
    }
    this.sky = new Sky(this.scene, this.mats.uniforms);
    this.particles = new Particles(this.mats.uniforms);
    this.scene.add(this.particles.mesh);
    this.highlight = new Highlight();
    this.scene.add(this.highlight.mesh);
    this.hand = new Hand(this.mats.uniforms);

    this.applySettings(settings);
    this.resize();
  }

  // ------------------------------------------------------------------ sections
  setSection(cx: number, sy: number, cz: number, mesh: SectionMesh | null): void {
    const key = sectionKey(cx, sy, cz);
    let e = this.sections.get(key);
    const empty = !mesh || !mesh.some((l) => l && l.indexCount > 0);
    if (empty) {
      if (e) this.dropSection(key, e);
      return;
    }
    if (!e) {
      e = { cx, sy, cz, wx: cx * 16 + 8, wy: sy * 16 + 8, wz: cz * 16 + 8, meshes: [null, null, null, null, null], visible: true };
      this.sections.set(key, e);
      const ck = chunkKey(cx, cz);
      let col = this.columns.get(ck);
      if (!col) { col = new Set(); this.columns.set(ck, col); }
      col.add(key);
    }
    for (let layer = 0; layer < LAYERS; layer++) {
      const l = mesh![layer] ?? null;
      const old = e.meshes[layer];
      if (!l || l.indexCount === 0) {
        if (old) { old.geometry.dispose(); this.layerGroups[layer].remove(old); e.meshes[layer] = null; }
        continue;
      }
      const geo = createLayerGeometry(l);
      if (old) {
        old.geometry.dispose();
        old.geometry = geo;
      } else {
        const m = new Mesh(geo, this.mats.byLayer[layer]);
        m.matrixAutoUpdate = false;
        m.matrixWorldAutoUpdate = false;
        m.frustumCulled = false;            // culled per section below
        m.position.set(cx * 16, sy * 16, cz * 16);
        m.scale.setScalar(1 / 256);
        m.updateMatrix();
        m.matrixWorld.copy(m.matrix);
        m.visible = e.visible;
        this.layerGroups[layer].add(m);
        e.meshes[layer] = m;
      }
    }
  }

  private dropSection(key: number, e: SectionEntry): void {
    for (let layer = 0; layer < LAYERS; layer++) {
      const m = e.meshes[layer];
      if (m) { m.geometry.dispose(); this.layerGroups[layer].remove(m); }
    }
    this.sections.delete(key);
    const ck = chunkKey(e.cx, e.cz);
    const col = this.columns.get(ck);
    if (col) { col.delete(key); if (!col.size) this.columns.delete(ck); }
  }

  removeColumn(cx: number, cz: number): void {
    const ck = chunkKey(cx, cz);
    const col = this.columns.get(ck);
    if (!col) return;
    for (const key of Array.from(col)) {
      const e = this.sections.get(key);
      if (e) this.dropSection(key, e);
    }
    this.columns.delete(ck);
  }

  clear(): void {
    for (const [key, e] of Array.from(this.sections)) this.dropSection(key, e);
    this.sections.clear();
    this.columns.clear();
    this.particles.clear();
    this.highlight.set(null, 0, 0, 0);
  }

  // ------------------------------------------------------------------ settings
  applySettings(s: Settings): void {
    this.settings = { ...s };
    const u = this.mats.uniforms;
    this.fogFar = Math.max(2, s.renderDistance) * 16;
    u.uBrightness.value = Math.min(1, Math.max(0, s.brightness));
    const cloudR = Math.min(320, Math.max(160, this.fogFar * 2));
    this.sky.setClouds(s.clouds, cloudR);
    // far plane: terrain plus margin, and far enough for the clouds at y=192
    this.camera.far = Math.max(this.fogFar * 1.25 + 32, cloudR + 140);
    this.lastFov = -1;
    this.mats.setWaving(!!s.waving);
    this.setShadows(!!s.shadows, s.shadowQuality || 2048);
    setAtlasMipmaps(this.atlas, !!s.mipmaps);
    this.resize();
  }

  private setShadows(on: boolean, size: number): void {
    if (on) {
      if (!this.shadowRT || this.shadowRT.width !== size) {
        this.shadowRT?.dispose();
        const rt = new WebGLRenderTarget(size, size, {
          format: RGBAFormat, type: UnsignedByteType, minFilter: NearestFilter, magFilter: NearestFilter,
          wrapS: ClampToEdgeWrapping, wrapT: ClampToEdgeWrapping, depthBuffer: true, stencilBuffer: false,
          generateMipmaps: false,
        });
        rt.texture.name = 'shadow';
        this.shadowRT = rt;
      }
      // 128 blocks across at most: one shadow texel per texture pixel on 2048
      this.shadowRadius = Math.min(64, Math.max(32, this.fogFar * 0.75));
      this.mats.uniforms.uShadowMap.value = this.shadowRT.texture;
      this.mats.uniforms.uShadowTexel.value = 1 / size;
    } else if (this.shadowRT) {
      this.shadowRT.dispose();
      this.shadowRT = null;
      this.mats.uniforms.uShadowMap.value = null;
    }
    this.mats.setShadows(on);
  }

  resize(): void {
    const w = Math.max(1, Math.floor(window.innerWidth || this.canvas.clientWidth || 1));
    const h = Math.max(1, Math.floor(window.innerHeight || this.canvas.clientHeight || 1));
    const pr = Math.min(window.devicePixelRatio || 1, 2) * Math.min(1, Math.max(0.25, this.settings.resolutionScale || 1));
    this.gl.setPixelRatio(pr);
    this.gl.setSize(w, h, true);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const ctx = this.gl.getContext();
    this.highlight.setResolution(ctx.drawingBufferWidth, ctx.drawingBufferHeight, NEAR);
    this.sky.setPixelRatio(pr);
  }

  // ------------------------------------------------------------------ effects
  setHighlight(boxes: Box[] | null, x: number, y: number, z: number): void { this.highlight.set(boxes, x, y, z); }
  breakParticles(x: number, y: number, z: number, v: number): void { this.particles.spawnBreak(x, y, z, v); }
  /** Extra: let particles collide with the world (solid test at a block position). */
  setParticleCollider(fn: Collider | null): void { this.particles.setCollider(fn); }
  setHeldBlock(v: number): void { this.hand.setBlock(v); }
  swing(): void { this.hand.swing(); }

  // ------------------------------------------------------------------ frame
  render(s: RenderState): void {
    if (this.disposed) return;
    const gl = this.gl;
    const u = this.mats.uniforms;
    const cam = this.camera;
    gl.info.reset();

    // camera + view bobbing (MC style: translate in view space, small roll and pitch)
    cam.position.set(s.eye.x, s.eye.y, s.eye.z);
    cam.rotation.set(s.pitch, s.yaw, 0, 'YXZ');
    const amt = s.bob.amount || 0;
    if (amt > 0) {
      const ph = s.bob.phase * Math.PI;
      cam.updateMatrix();
      cam.translateX(Math.sin(ph) * amt * 0.5);
      cam.translateY(-Math.abs(Math.cos(ph) * amt));
      cam.rotation.z = -Math.sin(ph) * amt * 3 * Math.PI / 180;
      cam.rotation.x = s.pitch - Math.abs(Math.cos(ph - 0.2) * amt) * 5 * Math.PI / 180;
    }
    if (s.fov !== this.lastFov || cam.aspect !== this.lastAspect) {
      cam.fov = s.fov; cam.updateProjectionMatrix();
      this.lastFov = s.fov; this.lastAspect = cam.aspect;
    }
    cam.updateMatrixWorld(true);

    // time, light flicker
    u.uTime.value = s.time % 14400;
    this.flickerT -= s.dt;
    if (this.flickerT <= 0) { this.flickerT = 0.08 + Math.random() * 0.12; this.flickerTarget = 0.96 + Math.random() * 0.06; }
    this.flicker += (this.flickerTarget - this.flicker) * Math.min(1, s.dt * 10);
    (u.uBlockLightColor.value as Color).setRGB(this.flicker, this.flicker * 0.995, this.flicker * 0.985);

    // sky and fog
    const sky = this.sky.update(s.dayTime, s.time, cam.position);
    const fog = u.uFogColor.value as Color;
    if (s.inLava) {
      this.overrideFog(0.62, 0.12, 0.01, 0, 1.6);
      u.uUnderwater.value = 0;
      this.sky.setHidden(true);
    } else if (s.underwater) {
      const eyeSky = Math.min(1, Math.max(0, s.handLight.sky / 15));
      const l = 0.2 + 0.8 * Math.max(sky.daylight * eyeSky, s.handLight.block / 30);
      this.overrideFog(0.07 * l, 0.19 * l, 0.42 * l, 0, 12 + 22 * sky.daylight * eyeSky);
      u.uUnderwater.value = 1;
      this.sky.setHidden(true);
    } else {
      u.uFogNear.value = this.fogFar * 0.62;
      u.uFogFar.value = this.fogFar * 0.98;
      u.uUnderwater.value = 0;
      this.sky.setHidden(false);
    }
    u.uCamWrap.value.set(wrap(cam.position.x), wrap(cam.position.y), wrap(cam.position.z));

    // effects
    const ox = Math.floor(cam.position.x), oy = Math.floor(cam.position.y), oz = Math.floor(cam.position.z);
    this.particles.setLight(s.handLight.sky, s.handLight.block);
    this.particles.update(s.dt, ox, oy, oz);
    this.hand.update({ dt: s.dt, aspect: cam.aspect, yaw: s.yaw, pitch: s.pitch, bob: s.bob, light: s.handLight });

    // shadow pass (High preset)
    const shadowOn = !!this.shadowRT && (u.uShadowStrength.value as number) > 0.001 && !s.underwater && !s.inLava;
    if (this.shadowRT && !shadowOn) u.uShadowStrength.value = 0;
    if (shadowOn) this.renderShadows(cam.position);

    // main pass
    this.cull(cam, true);
    gl.setRenderTarget(null);
    gl.setClearColor(fog, 1);
    gl.clear(true, true, false);
    gl.render(this.scene, cam);
    if (s.showHand) this.hand.render(gl);

    if (this.shotQueue.length) this.capture();
  }

  private overrideFog(r: number, g: number, b: number, near: number, far: number): void {
    const u = this.mats.uniforms;
    for (const k of ['uFogColor', 'uSkyTop', 'uSkyHorizon']) (u[k].value as Color).setRGB(r, g, b);
    u.uGlow.value = 0;
    u.uFogNear.value = near;
    u.uFogFar.value = far;
  }

  /** Per-section visibility: frustum (perspective or the ortho shadow box) + render distance. */
  private cull(camera: PerspectiveCamera | OrthographicCamera, distance: boolean): void {
    this.projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreen);
    const cx = this.camera.position.x, cz = this.camera.position.z;
    const maxD = this.fogFar + 12;
    const maxD2 = maxD * maxD;
    let visible = 0;
    const sph = this.sphere;
    for (const e of this.sections.values()) {
      let vis = true;
      if (distance) {
        const dx = e.wx - cx, dz = e.wz - cz;
        vis = dx * dx + dz * dz <= maxD2;
      }
      if (vis) { sph.center.set(e.wx, e.wy, e.wz); vis = this.frustum.intersectsSphere(sph); }
      if (vis !== e.visible) {
        e.visible = vis;
        for (let i = 0; i < LAYERS; i++) { const m = e.meshes[i]; if (m) m.visible = vis; }
      }
      if (vis) visible++;
    }
    if (distance) this.visibleSections = visible;
  }

  private renderShadows(eye: Vector3): void {
    const gl = this.gl;
    const u = this.mats.uniforms;
    const rt = this.shadowRT!;
    const L = u.uLightDir.value as Vector3;
    const R = this.shadowRadius;
    const D = 160;
    const sc = this.shadowCam;
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = D * 2;
    sc.updateProjectionMatrix();
    // orientation: looking along -L, a stable up vector
    const up = Math.abs(L.y) > 0.99 ? this.tmpV.set(0, 0, -1) : this.tmpV.set(0, 1, 0);
    sc.up.copy(up);
    sc.position.set(0, 0, 0);
    sc.lookAt(-L.x, -L.y, -L.z);
    sc.updateMatrixWorld(true);
    // centre a bit ahead of the eye, snapped to whole shadow texels in light space
    const texel = (2 * R) / rt.width;
    const right = new Vector3().setFromMatrixColumn(sc.matrixWorld, 0);
    const upv = new Vector3().setFromMatrixColumn(sc.matrixWorld, 1);
    const fwd = new Vector3().setFromMatrixColumn(sc.matrixWorld, 2);
    const cxr = eye.x * right.x + eye.y * right.y + eye.z * right.z;
    const cyu = eye.x * upv.x + eye.y * upv.y + eye.z * upv.z;
    const czf = eye.x * fwd.x + eye.y * fwd.y + eye.z * fwd.z;
    const sx = Math.floor(cxr / texel) * texel, sy = Math.floor(cyu / texel) * texel;
    const center = new Vector3().addScaledVector(right, sx).addScaledVector(upv, sy).addScaledVector(fwd, czf);
    sc.position.copy(center).addScaledVector(L, D);
    sc.updateMatrixWorld(true);

    // shadow matrix for camera-relative world positions (built in doubles)
    const bias = this.tmpM.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    const m = (u.uShadowMatrix.value as Matrix4);
    m.multiplyMatrices(bias, sc.projectionMatrix).multiply(sc.matrixWorldInverse)
      .multiply(new Matrix4().makeTranslation(this.camera.position.x, this.camera.position.y, this.camera.position.z));
    u.uShadowBias.value = 0.03 / (sc.far - sc.near);

    // draw only opaque + cutout terrain with the depth materials
    const hide: { visible: boolean }[] = [...this.sky.objects, this.particles.mesh, this.highlight.mesh,
      this.layerGroups[2], this.layerGroups[3], this.layerGroups[4]];
    const was = hide.map((o) => o.visible);
    for (const o of hide) o.visible = false;
    const swap = (g: Group, mat: ShaderMaterial) => { for (const c of g.children) (c as Mesh).material = mat; };
    swap(this.layerGroups[0], this.mats.depth.opaque);
    swap(this.layerGroups[1], this.mats.depth.cutout);
    this.cull(sc, false);
    u.uCamWrap.value.set(wrap(sc.position.x), wrap(sc.position.y), wrap(sc.position.z));

    gl.setRenderTarget(rt);
    gl.setClearColor(this.white, 1);
    gl.clear(true, true, false);
    gl.render(this.scene, sc);
    gl.setRenderTarget(null);

    swap(this.layerGroups[0], this.mats.opaque);
    swap(this.layerGroups[1], this.mats.cutout);
    hide.forEach((o, i) => { o.visible = was[i]; });
    const cp = this.camera.position;
    u.uCamWrap.value.set(wrap(cp.x), wrap(cp.y), wrap(cp.z));
  }

  // ------------------------------------------------------------------ misc
  screenshot(): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => { this.shotQueue.push({ resolve, reject }); });
  }

  private capture(): void {
    const q = this.shotQueue.splice(0);
    try {
      this.canvas.toBlob((b) => {
        for (const p of q) { if (b) p.resolve(b); else p.reject(new Error('toBlob failed')); }
      }, 'image/png');
    } catch (e) {
      for (const p of q) p.reject(e);
    }
  }

  stats(): { drawCalls: number; triangles: number; sections: number; visibleSections: number } {
    const r = this.gl.info.render;
    return { drawCalls: r.calls, triangles: r.triangles, sections: this.sections.size, visibleSections: this.visibleSections };
  }

  /** Extra: the underlying three.js renderer (tests, tools). */
  get three(): WebGLRenderer { return this.gl; }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clear();
    this.sky.dispose();
    this.particles.dispose();
    this.highlight.dispose();
    this.hand.dispose();
    this.mats.dispose();
    this.shadowRT?.dispose();
    this.gl.dispose();
    for (const p of this.shotQueue.splice(0)) p.reject(new Error('renderer disposed'));
    void (null as unknown as Material);
  }
}
