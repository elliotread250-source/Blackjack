// Visual lighting harness: generated terrain + edits, meshed by the real mesher and drawn with
// the real terrain materials and sky. Bundled as an IIFE, driven by visual.browser.cjs.
// Also checks dirty-section marking end to end: after edits only `dirtySections` are remeshed,
// then the frame must be pixel-identical to a frame where every section was remeshed.
import { WebGLRenderer, Scene, PerspectiveCamera, Mesh, Vector3 } from 'three';
import { buildAtlas } from '../../src/render/atlas';
import { createMaterials, createLayerGeometry } from '../../src/render/materials';
import type { Materials } from '../../src/render/materials';
import { Sky } from '../../src/render/sky';
import { gatherSection, meshSection, newPadded } from '../../src/render/mesher';
import { Generator } from '../../src/world/generator';
import { World } from '../../src/world/world';
import { Chunk } from '../../src/world/chunk';
import { ID, pack } from '../../src/blocks/registry';
import { sectionKey, sectionKeyChunk, sectionKeyY, chunkKeyX, chunkKeyZ, SECTIONS } from '../../src/world/constants';

const W = 960, H = 540;
let renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, mats: Materials, sky: Sky;
let world: World;
let sx = 0, sz = 0, gy = 64;
const meshes = new Map<number, Mesh[]>();
const padded = newPadded();
const R = 3;
let ccx = 0, ccz = 0;

function remesh(k: number): void {
  const old = meshes.get(k);
  if (old) for (const m of old) { scene.remove(m); m.geometry.dispose(); }
  meshes.delete(k);
  const ck = sectionKeyChunk(k), cx = chunkKeyX(ck), cz = chunkKeyZ(ck), sy = sectionKeyY(k);
  const c = world.getChunk(cx, cz);
  if (!c || c.counts[sy] === 0) return;
  // only mesh sections whose 8 neighbours are loaded (like the chunk manager)
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!world.getChunk(cx + dx, cz + dz)) return;
  gatherSection(world, cx, sy, cz, padded);
  const sm = meshSection(padded, { fancyLeaves: true, smoothLighting: true });
  const list: Mesh[] = [];
  sm.forEach((layer, li) => {
    if (!layer) return;
    const m = new Mesh(createLayerGeometry(layer), mats.byLayer[li]);
    m.position.set(cx * 16, sy * 16, cz * 16);
    m.scale.setScalar(1 / 256);
    scene.add(m);
    list.push(m);
  });
  meshes.set(k, list);
}

function remeshDirty(): number {
  const keys = Array.from(world.dirtySections);
  world.dirtySections.clear();
  for (const k of keys) remesh(k);
  return keys.length;
}

function remeshAll(): void {
  for (const c of world.chunks.values()) for (let sy = 0; sy < SECTIONS; sy++) remesh(sectionKey(c.cx, sy, c.cz));
  world.dirtySections.clear();
}

const B = (n: string, m = 0) => pack(ID[n], m);

function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, v: number): void {
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) world.set(x, y, z, v);
}

const api = {
  init(seed: number): { sx: number; sz: number; gy: number; ms: number } {
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    document.body.style.margin = '0';
    document.body.appendChild(canvas);
    renderer = new WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    scene = new Scene();
    camera = new PerspectiveCamera(70, W / H, 0.05, 1000);
    camera.rotation.order = 'YXZ';
    const atlas = buildAtlas(true);
    mats = createMaterials(atlas);
    mats.uniforms.uFogNear.value = 70;
    mats.uniforms.uFogFar.value = 110;
    sky = new Sky(scene, mats.uniforms);
    const gen = new Generator(seed);
    const sp = gen.findSpawn();
    sx = sp.x; sz = sp.z;
    ccx = Math.floor(sx / 16); ccz = Math.floor(sz / 16);
    world = new World(seed);
    const t0 = performance.now();
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) world.addChunk(new Chunk(gen.generate(ccx + dx, ccz + dz)));
    const ms = performance.now() - t0;
    gy = world.topY(sx, sz);
    remeshAll();
    return { sx, sz, gy, ms };
  },

  /** Builds the test scene with world.set (incremental light + dirty marking). */
  edit(stage: number): number {
    const x = sx, z = sz;
    if (stage === 0) {
      // flatten a 30x30 area and clear what is above it
      box(x - 12, gy + 1, z - 12, x + 18, gy + 20, z + 18, 0);
      box(x - 12, gy, z - 12, x + 18, gy, z + 18, B('grass_block'));
      // overhang: stone roof 9x9 on 4 pillars, east of spawn
      box(x + 6, gy + 1, z - 4, x + 6, gy + 4, z - 4, B('oak_log'));
      box(x + 14, gy + 1, z - 4, x + 14, gy + 4, z - 4, B('oak_log'));
      box(x + 6, gy + 1, z + 4, x + 6, gy + 4, z + 4, B('oak_log'));
      box(x + 14, gy + 1, z + 4, x + 14, gy + 4, z + 4, B('oak_log'));
      box(x + 6, gy + 5, z - 4, x + 14, gy + 5, z + 4, B('stone_bricks'));
      // a closed house with a door hole and a torch inside, north-west of spawn
      box(x - 10, gy + 1, z - 10, x - 2, gy + 5, z - 2, B('oak_planks'));
      box(x - 9, gy + 1, z - 9, x - 3, gy + 4, z - 3, 0);
      box(x - 6, gy + 1, z - 2, x - 6, gy + 2, z - 2, 0);   // doorway on the south wall
      world.set(x - 9, gy + 1, z - 9, B('torch'));
      // slab roof shelter
      box(x - 10, gy + 4, z + 6, x - 2, gy + 4, z + 14, B('oak_slab', 1));
      box(x - 10, gy + 1, z + 6, x - 10, gy + 3, z + 6, B('oak_log'));
      box(x - 2, gy + 1, z + 14, x - 2, gy + 3, z + 14, B('oak_log'));
      // leaves canopy
      box(x + 4, gy + 6, z + 8, x + 12, gy + 6, z + 16, B('oak_leaves'));
      box(x + 8, gy + 1, z + 12, x + 8, gy + 5, z + 12, B('oak_log'));
    } else if (stage === 1) {
      // night features: grid of torches, a lava pool, glowstone pillar
      for (let i = -8; i <= 16; i += 8) for (let j = -8; j <= 16; j += 8) if (!(i === -8 && j === -8)) world.set(x + i + 1, gy + 1, z + j + 1, B('torch'));
      box(x + 1, gy, z + 1, x + 3, gy, z + 3, B('lava'));
      world.set(x - 1, gy + 1, z + 4, B('glowstone'));
      world.set(x - 1, gy + 2, z + 4, B('glowstone'));
      world.set(x + 10, gy + 1, z, B('lantern'));
    } else if (stage === 2) {
      // remove some of it again (removal BFS) and drop water on the roof edge
      world.set(x - 1, gy + 2, z + 4, 0);
      world.set(x + 10, gy + 1, z, 0);
      world.set(x + 10, gy + 6, z - 4, B('water'));
      for (let i = 0; i < 160; i++) world.tick(0.05);
      // dig a 2x2 hole through the roof
      box(x + 9, gy + 5, z - 1, x + 10, gy + 5, z, 0);
    }
    return remeshDirty();
  },

  render(view: { x: number; y: number; z: number; yaw: number; pitch: number; dayTime: number }): void {
    camera.position.set(view.x, view.y, view.z);
    camera.rotation.y = view.yaw;
    camera.rotation.x = view.pitch;
    camera.updateMatrixWorld();
    const eye = new Vector3(view.x, view.y, view.z);
    sky.update(view.dayTime, 10, eye);
    mats.uniforms.uTime.value = 10;
    (mats.uniforms.uCamWrap.value as Vector3).copy(eye);
    renderer.render(scene, camera);
  },

  pixels(): Uint8Array {
    const gl = renderer.getContext();
    const px = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return px;
  },

  /** Renders the view, then remeshes everything and renders again: number of differing pixels. */
  dirtyCheck(view: { x: number; y: number; z: number; yaw: number; pitch: number; dayTime: number }): number {
    api.render(view);
    const a = api.pixels();
    remeshAll();
    api.render(view);
    const b = api.pixels();
    let diff = 0;
    for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) diff++;
    return diff;
  },

  info() {
    return { webgl2: renderer.capabilities.isWebGL2, sections: meshes.size };
  },
};
(globalThis as unknown as { __vis: typeof api }).__vis = api;
