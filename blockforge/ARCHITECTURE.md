# BlockForge architecture and module contracts

BlockForge is a creative-mode voxel sandbox in the browser. TypeScript, bundled by
esbuild (`node build.mjs`) into `dist/index.html` + `dist/assets/blockforge.js` and a
single self-contained `dist/blockforge.html`. Three.js **0.162.0** (the last release
whose `WebGLRenderer` falls back to WebGL1). No CDN, no runtime downloads, no Mojang
names/assets. Target: 60 fps on integrated Intel graphics in the Low preset at render
distance 4, Chrome/Edge on Windows laptops and Chromebooks.

This file is the contract between modules. Each module owner implements exactly the
exported API below (extra exports are fine, renaming is not). When something is
ambiguous, pick the Minecraft-like behaviour and document it in a comment.

Already written (read them, do not rewrite):

| file | what |
|---|---|
| `src/blocks/registry.ts` | 400+ block definitions, derived lookup tables (`SHAPE`, `LAYER`, `EMIT`, `OPACITY`, `OCCLUDES`, `SOLID`, `FLUID`, `CULLSELF`, `REPLACEABLE`, `TINT`, `TINTMASK`, `ORIENT`, `WAVE`, `LEAVES`, `FAMILY`, `TARGETABLE`, `FACE_TEX`, `TEXTURE_NAMES`, `TEX_KIND`), `ID` name->id map, `S` shape->number, `L` layer->number, `pack/idOf/metaOf` |
| `src/blocks/textures.ts` | `generateTexture(name)` -> 16x16 RGBA `Uint8ClampedArray`, `DEFAULT_TINT` |
| `src/world/constants.ts` | dimensions, index helpers, direction tables, keys |
| `src/types.ts` | shared interfaces (`GenChunk`, `PaddedSection`, `MeshLayer`, `SectionMesh`, `Box`, `RayHit`, `WorldMeta`, ...) |
| `src/settings.ts` | `Settings`, presets, load/save |
| `src/game/hotbar.ts` | `Hotbar` (9 slots, select/scroll/pick/set/onChange) |
| `build.mjs`, `server.js` | build + Express static server |

## Conventions (everyone)

* Coordinates: x east, y up, z south. Block (x,y,z) occupies [x,x+1)x[y,y+1)x[z,z+1).
  World y range 0..255. `SEA_LEVEL = 62` (water fills y <= 62 in oceans).
* A stored block is a `Uint16`: `id | meta << 10` (`pack`, `idOf`, `metaOf`). Air is 0.
* Faces: 0 +X east, 1 -X west, 2 +Y up, 3 -Y down, 4 +Z south, 5 -Z north.
  Horizontal dirs: 0 N(-Z) 1 E(+X) 2 S(+Z) 3 W(-X). Tables in `constants.ts`.
* Column arrays are indexed `colIndex(x,y,z) = y<<8 | z<<4 | x` (sections contiguous).
* Light is a byte: `sky << 4 | block`, both 0..15.
* Player look: `yaw` 0 looks north (-Z); positive yaw turns left (counter-clockwise seen
  from above), so the look vector is `(-sin(yaw)cos(pitch), sin(pitch), -cos(yaw)cos(pitch))`.
  three.js camera uses `rotation.order = 'YXZ'`, `rotation.y = yaw`, `rotation.x = pitch`.
  Pitch is clamped to +-(PI/2 - 0.001). Moving the mouse right decreases yaw.
* Day time `dayTime` in [0,1): 0 sunrise, 0.25 noon, 0.5 sunset, 0.75 midnight.
  `DAY_LENGTH` seconds per full cycle.
* Never use `localStorage`/`indexedDB` without try/catch (file:// and locked-down
  school browsers). Never fetch anything at runtime.
* Code style: TypeScript strict, no `any` unless at a boundary, small comments only
  where they add information. Hot loops use typed arrays and no allocation.

### Block state ("meta", 6 bits)

| shape / orient | meta meaning |
|---|---|
| `ORIENT=1` axis (logs, pillars, basalt, hay, froglights, bone, barrel, deepslate) | 0 = Y axis, 1 = X axis, 2 = Z axis |
| `ORIENT=2` horizontal (furnace, pumpkin faces, chest, glazed terracotta, crafting table) | 0..3 = horizontal dir the **front** faces (N,E,S,W). Placed facing the player. Base textures (`FACE_TEX`) are for meta 0 (front on the north face). |
| slab | 0 bottom, 1 top, 2 double (full block, occludes like a cube) |
| stairs | bits 0-1 facing (dir of the tall back half, = the player's look dir when placed), bit 2 upside-down |
| torch | 0 standing; 1..4 wall torch leaning towards dir (meta-1) (wall is on the opposite side) |
| door | bits 0-1 facing (player's look dir when placed), bit 2 open, bit 3 upper half, bit 4 hinge on right |
| trapdoor | bits 0-1 facing, bit 2 open, bit 3 top half |
| lantern | bit 0 hanging |
| rod (end rod) | 0 = Y, 1 = X, 2 = Z |
| fluid | bits 0-2 level (0 source, 1..7 flowing), bit 3 falling |
| everything else | 0 |

Fences, walls, panes and stair corner shapes are derived from neighbours at mesh/collision
time, never stored. Fences connect to the same `FAMILY` and to `OCCLUDES` blocks; panes and
iron bars connect to panes, glass, stained glass and `OCCLUDES` blocks; walls connect to
walls, fence gates (none yet) and `OCCLUDES` blocks.

---

## WS1 World generation: `src/world/noise.ts`, `src/world/generator.ts`, `src/workers/gen.worker.ts`

```ts
// noise.ts: seeded simplex noise
export class Noise { constructor(seed: number); noise2(x: number, y: number): number; noise3(x: number, y: number, z: number): number; } // both in about [-1,1]
export function fbm2(n: Noise, x: number, y: number, octaves: number, lacunarity?: number, gain?: number): number

// generator.ts
export const BIOME_NAMES: string[];   // index = biome id
export const BIOME: { ocean: number; deep_ocean: number; beach: number; plains: number; forest: number; birch_forest: number; desert: number; snowy_tundra: number; mountains: number; snowy_peaks: number; swamp: number; cherry_grove: number; river: number; stony_shore: number };
export class Generator {
  constructor(seed: number);
  generate(cx: number, cz: number): GenChunk;   // deterministic, pure function of (seed, cx, cz)
  heightAt(x: number, z: number): number;       // terrain surface y before caves
  biomeAt(x: number, z: number): number;
  findSpawn(): { x: number; z: number };        // dry land near (0,0), prefers plains/forest, never ocean/river
}
```
Worker protocol (`gen.worker.ts`, bundled as a string via `import code from 'inline-worker:../workers/gen.worker.ts'`):
in `{ type: 'init', seed }`, `{ type: 'gen', id, cx, cz }`; out `{ type: 'chunk', id, cx, cz, blocks, biome, tint }`
with the three buffers transferred.

Requirements:
* Infinite seeded terrain, 16x16x256 columns. Biomes: plains, forest, birch forest, desert,
  snowy tundra, mountains (+ snowy peaks), ocean (+ deep ocean), beach, swamp, cherry grove,
  river, stony shore. Smooth climate noise (temperature, humidity, continentalness,
  erosion/peaks) so the height field is continuous across biome borders: biomes choose
  surface blocks, decoration and tints, never the raw height discontinuously.
* Sea level y=62 with real oceans (floor 35..58, deep ocean lower), sand/gravel/clay floors.
  Beaches are sand, stony shores gravel/stone where mountains meet water.
* Caves: 3D noise "cheese" chambers + "spaghetti" tunnels, sampled on a coarse grid
  (4x4x4 or 4x8x4) and trilinearly interpolated for speed. Do not carve within ~4 blocks
  under water-covered surfaces (no floating oceans) and keep most of the surface intact.
  Lava fills cave air at y <= 10. Some caves should open to the surface.
* Strata: bedrock floor at y=0 plus random bedrock to y=4; deepslate below ~y=16 with a
  dithered transition; blobs of granite, diorite, andesite, tuff, gravel, dirt, clay.
* Ores by height (stone variants above the deepslate line, `deepslate_*_ore` below):
  coal 5..128 common, copper 20..96, iron 5..72, gold 5..32, redstone 5..16, lapis 5..32,
  diamond 5..16 rare, emerald single blocks in mountains only. Veins via random walks.
* Trees per biome, deterministic across chunk borders (iterate candidate trees in a 3x3
  chunk neighbourhood using a position hash, write only the blocks inside this column):
  oak (plains sparse, forest dense, swamp with wider canopy), birch (birch forest, some in
  forest), spruce (tundra, mountains lower slopes), cherry (cherry grove, pink leaves),
  occasional large/dark oak in forest. Leaves never replace logs or solid ground.
* Decoration: short grass, ferns, flowers (biome appropriate), pumpkins (rare),
  sugar cane next to water on sand/grass/dirt, cactus + dead bush in desert, mushrooms
  in forest shade and swamp, lily pads on swamp water, seagrass on shallow ocean floors,
  snow layers + snowy grass + ice on water in tundra/peaks, snow above y~120 in mountains,
  gravel/stone peaks, packed ice patches in tundra, mud + water puddles in swamp,
  podzol patches in spruce areas, cherry grove pink petals optional.
* Tints: per column grass/foliage/water rgb from temperature & humidity (smooth), swamp
  darker olive, cherry grove brighter green, snowy bluish. Water tint swamp murky green,
  ocean blue, cold ocean deeper blue.
* Speed: `generate` must take under ~15 ms per column in Chrome on a mid laptop.

## WS2 World state, lighting, fluids, persistence: `src/world/chunk.ts`, `src/world/world.ts`, `src/world/light.ts`, `src/world/fluids.ts`, `src/world/storage.ts`

```ts
// chunk.ts
export class Chunk {
  readonly cx: number; readonly cz: number;
  blocks: Uint16Array;   // COLUMN_VOLUME
  light: Uint8Array;     // COLUMN_VOLUME, sky<<4|block
  biome: Uint8Array;     // 256
  tint: Uint8Array;      // 256*9
  counts: Uint16Array;   // 16: non-air blocks per section (kept up to date by set())
  modified: boolean;     // edited since generation/load -> must be saved
  lit: boolean;          // initial light computed
  constructor(g: GenChunk);
  get(x: number, y: number, z: number): number;   // local coords
  set(x: number, y: number, z: number, v: number): void;
  recount(): void;
}

// world.ts
export class World {
  readonly seed: number;
  chunks: Map<number, Chunk>;          // key chunkKey(cx,cz)
  dirtySections: Set<number>;          // sectionKey(cx,sy,cz) needing a remesh; consumer deletes keys
  onBlockChange: ((x: number, y: number, z: number, oldV: number, newV: number) => void) | null;
  constructor(seed: number);
  getChunk(cx: number, cz: number): Chunk | undefined;
  get(x: number, y: number, z: number): number;   // y < 0 -> pack(ID.bedrock); y > 255 or unloaded -> 0
  getLight(x: number, y: number, z: number): number; // packed; y > 255 or unloaded -> 0xF0 (full sky)
  getSky(x: number, y: number, z: number): number;
  getBlockLight(x: number, y: number, z: number): number;
  set(x: number, y: number, z: number, v: number): void; // full update: light (incremental BFS add+remove for sky and block light), dirty sections (+ neighbours when the block is on a section border, including the diagonal ones touched by AO/smooth light), chunk.modified, fluid scheduling, onBlockChange
  addChunk(c: Chunk): void;   // inserts, computes initial sky+block light including light flowing in from and out to already loaded neighbours; marks affected sections dirty
  removeChunk(cx: number, cz: number): Chunk | undefined;
  topY(x: number, z: number): number; // highest non-air y, -1 if none/unloaded
  tick(dt: number): void;     // runs fluid simulation (bounded work per call)
}

// fluids.ts (used by World)
export class FluidSim { constructor(world: World); schedule(x: number, y: number, z: number): void; tick(dt: number): void; }

// storage.ts (IndexedDB with in-memory fallback; every call try/catch'd)
export const storage: {
  listWorlds(): Promise<WorldMeta[]>;          // newest lastPlayed first
  getWorld(id: string): Promise<WorldMeta | null>;
  saveWorld(meta: WorldMeta): Promise<void>;
  deleteWorld(id: string): Promise<void>;      // also deletes its chunks
  savedChunkKeys(worldId: string): Promise<Set<number>>; // chunkKeys with saved data
  loadChunk(worldId: string, cx: number, cz: number): Promise<{ blocks: Uint16Array; biome: Uint8Array; tint: Uint8Array } | null>;
  saveChunk(worldId: string, c: Chunk): Promise<void>;   // RLE-compressed blocks + biome + tint
  remap(blocks: Uint16Array, palette: string[]): void;   // remap ids saved with an older palette to current ids (unknown -> air)
};
```
Lighting rules: `OPACITY[id]` light eaten per block (opaque 15, leaves/water/ice 1, else 0).
Sky light 15 travels straight down without loss through opacity-0 blocks; everywhere
else light drops by `max(1, opacity)` per step. Emitters (`EMIT`) seed block light. Use
the standard BFS add/remove queues (Seed of Andromeda style) with typed-array ring
buffers; removal must handle the vertical-sunlight special case. Cross-chunk BFS writes
into loaded neighbours and marks their sections dirty. Initial column light must be
fast (< 8 ms): vertical fill, then seed only cells that can spread sideways (below a
neighbour column's sunlight height or with partial light), plus pull light from loaded
neighbours' border cells.

Fluids (MC-like): water source spreads to air below (falling) or sideways with level+1
up to 7 when it cannot fall, flowing towards the nearest drop within 4 blocks; lava the
same with step 2 up to level 6 (overworld) and slower ticks; water ticks every 0.25 s,
lava every 1.5 s. Two water sources adjacent to an air block over a solid/source block
create a new source. Lava source meeting water -> obsidian, flowing lava meeting water ->
cobblestone, water flowing onto lava -> stone. Removing a source drains the flow.
Bound the work per tick (e.g. 512 updates) so an ocean pouring into a cave never stalls.
Fluids replace `REPLACEABLE` non-fluid blocks (plants, snow layers).

## WS3 Shapes and meshing: `src/blocks/shapes.ts`, `src/render/mesher.ts`, `src/workers/mesh.worker.ts`

```ts
// shapes.ts
export type NeighborFn = (dx: number, dy: number, dz: number) => number; // packed neighbour value
export interface ModelBox {
  box: Box;                       // block units, may extend outside 0..1 only for collision
  tex: number[];                  // 6 atlas tile ids per face (-1 = no face)
  uv?: ([number, number, number, number] | null)[]; // per face override in texture pixels [u0,v0,u1,v1]
  rotate?: { axis: 'x' | 'y' | 'z'; angle: number; origin: [number, number, number] }; // radians, block units
  shade?: boolean;                // apply directional face shade (default true)
}
export function cubeFaceTile(v: number, face: number): { tile: number; rot: number }; // orientation-aware cube texture (axis/horizontal meta), rot in quarter turns
export function modelFor(v: number, nb: NeighborFn): ModelBox[];  // render boxes for every non-cube, non-cross, non-fluid shape
export function collisionBoxes(v: number, nb: NeighborFn): Box[];  // [] for non-solid; fences/walls 1.5 tall
export function selectionBoxes(v: number, nb: NeighborFn): Box[];  // what the cursor outlines and rays hit
export function stairShape(v: number, nb: NeighborFn): 'straight' | 'inner_left' | 'inner_right' | 'outer_left' | 'outer_right';
export function connectsTo(v: number, other: number, dir: number): boolean; // fence/pane/wall connection logic
export function isFullCube(v: number): boolean;   // OCCLUDES, or double slab
```
`modelFor` must cover: slab (top/bottom/double), stairs (all 5 shapes x 4 facings x
upright/upside-down), fence (post + connecting double bars), wall (post + connecting
lower walls, tall post when ends), pane (post + arms, a + cross when unconnected),
torch (standing; wall torch leaning 22.5 degrees off the wall, bottom ~2px from the wall),
door (3px panel, open/closed, hinge, top/bottom texture by half), trapdoor (3px slab,
top/bottom half, open against the facing side), layer (snow, 2px), carpet (1px), cactus
(sides inset 1px), lantern (standing and hanging), chest (14px tall, inset 1px), rod,
lily pad (a flat 16x16 quad 0.1px above the bottom of its own block; the pad sits in the air block on top of a water block).

```ts
// mesher.ts
export function newPadded(): PaddedSection;
export function gatherSection(world: World, cx: number, sy: number, cz: number, out: PaddedSection): void; // fills blocks/light/tint incl. 1-block border from neighbour columns
export function meshSection(p: PaddedSection, opts: MeshOptions): SectionMesh;   // 5 layers
export function meshBlockItem(v: number): SectionMesh;  // a single block at the origin (0..1), full sky light, no neighbours: used for the first-person held block
```
`mesh.worker.ts` protocol: in `{ id, blocks, light, tint, opts }` (buffers transferred),
out `{ id, mesh: SectionMesh }` with all typed-array buffers transferred.

Mesher requirements:
* Vertex format exactly as documented on `MeshLayer` in `src/types.ts`.
  Atlas pixel coords: tile `t` sits at `((t % 32) * 16, Math.floor(t / 32) * 16)` in a
  512x512 atlas; image row 0 is the top of the texture (v grows downward).
* Face culling: a face is skipped when the neighbour `isFullCube`, or both blocks are the
  same id with `CULLSELF` (glass, water, ice...), or (fast leaves) both are leaves.
  Fluids: faces between a fluid and the same fluid are skipped; fluid surface is 14/16 high
  (or full height when the same fluid is above); flowing levels lower the surface by
  level/9 with per-corner heights averaged from neighbours (MC style).
* Smooth lighting + AO for cube faces and box faces that lie on the block boundary:
  per vertex average sky/block light of the 4 cells touching the vertex in the layer in
  front of the face (skip `OCCLUDES` cells; corner ignored when both sides occlude),
  AO = 3 - (side1 + side2 + corner) with side1&&side2 -> 0, brightness
  [0.45, 0.65, 0.82, 1.0]. Flip the quad diagonal when AO is anisotropic. With
  `smoothLighting` off use flat light from the neighbour cell and no AO.
* Face shade (MC style): up 1.0, down 0.5, N/S 0.8, E/W 0.6 (not for cross plants).
* Tints: `TINT` 1 grass, 2 foliage, 3 water -> rgb from the padded tint array for the
  block's column; others white. `TINTMASK` blocks (grass block) use tint mode 255 (mask by
  texture alpha) on all faces; every other tinted face uses mode 0.
* Fast leaves (`fancyLeaves=false`): leaves go in the **opaque** layer (layer 0) with full
  tint mode, and leaf-leaf faces are culled. Fancy: cutout layer, all faces drawn.
* Cross plants: two diagonal quads, emitted with both windings (no backface trick),
  random xz jitter from a position hash for short grass/fern/flowers (+-3px), wave flag 1
  with the top-vertex bit set on the upper vertices. Leaves get wave flag 2. Water top
  faces get wave flag 3.
* Render layers: `LAYER[id]` except fast leaves (above) and water/lava (3/4).
* Use growable scratch buffers; output exactly-sized arrays; Uint16 indices when
  vertexCount <= 65535 else Uint32. Return null for empty layers.
* Performance: a typical surface section in < 1.5 ms.

## WS4 Rendering: `src/render/atlas.ts`, `src/render/materials.ts`, `src/render/sky.ts`, `src/render/renderer.ts`, `src/render/particles.ts`, `src/render/hand.ts`, `src/render/highlight.ts`

```ts
// atlas.ts
export const ATLAS_SIZE = 512;
export interface Atlas { texture: THREE.DataTexture; tiles: Uint8ClampedArray[]; } // tiles[t] = level-0 16x16 RGBA
export function buildAtlas(mipmaps: boolean): Atlas;   // all TEXTURE_NAMES; manual mip chain down to 1x1
//   (WebGL1 completeness); per-tile box filter using TEX_KIND: opaque plain average (alpha = tint mask),
//   cutout alpha-weighted colour + boosted alpha, translucent plain average.
//   magFilter Nearest, minFilter NearestMipmapLinear (or Nearest when mipmaps off), flipY false.

// materials.ts
export interface SharedUniforms { [k: string]: THREE.IUniform } // uTime, uAtlas, uAtlasSize, uSunDir, uDaylight, uFogColor,
//   uFogNear, uFogFar, uSkyTop, uSkyHorizon, uBrightness, uBlockLightColor, uWaving, uUnderwater, uShadowMap, uShadowMatrix, uShadowTexel ...
export interface Materials { opaque: THREE.ShaderMaterial; cutout: THREE.ShaderMaterial; translucent: THREE.ShaderMaterial; water: THREE.ShaderMaterial; lava: THREE.ShaderMaterial; uniforms: SharedUniforms; byLayer: THREE.ShaderMaterial[]; setShadows(on: boolean): void; }
export function createMaterials(atlas: Atlas): Materials;

// renderer.ts
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
export class Renderer {
  constructor(canvas: HTMLCanvasElement, atlas: Atlas, settings: Settings);
  readonly info: { webgl2: boolean; renderer: string; vendor: string };   // renderer string via WEBGL_debug_renderer_info when available
  readonly camera: THREE.PerspectiveCamera;
  setSection(cx: number, sy: number, cz: number, mesh: SectionMesh | null): void; // replace/remove that section's meshes (dispose old geometry)
  removeColumn(cx: number, cz: number): void;
  clear(): void;
  applySettings(s: Settings): void;       // render distance -> fog + far plane, shadows, waving, clouds, pixel ratio, mipmaps
  setHighlight(boxes: Box[] | null, x: number, y: number, z: number): void; // thin dark outline (MC style) around selection boxes
  breakParticles(x: number, y: number, z: number, v: number): void;         // ~24 textured cube bits with gravity
  setHeldBlock(v: number): void;          // 0 = empty hand (draw a simple arm)
  swing(): void;                          // arm swing on break/place
  render(s: RenderState): void;
  resize(): void;
  screenshot(): Promise<Blob>;            // PNG of the next rendered frame
  stats(): { drawCalls: number; triangles: number; sections: number; visibleSections: number };
  dispose(): void;
}
```
Shaders (GLSL ES 1.00 written for `ShaderMaterial`, so three.js converts for WebGL2):
* Terrain: atlas lookup (`auv / uAtlasSize`), tint (mode by `atint.a`), sky light scaled
  by `uDaylight`, block light warm-coloured, light curve like MC (`b(l) = l/(4-3l)` style
  with a floor), brightness option, face shade * AO from `alight.z`, distance fog to the
  sky colour, cutout `discard` when alpha < 0.5 (only in the cutout material), waving
  (vertex shader, world-space sin noise) for plants (top vertices only) and leaves when
  `uWaving` = 1, underwater blue fog.
* Water: translucent, biome tint, animated pixel-quantised ripples (16 per block),
  fresnel blend to a sky reflection colour, sun specular, small vertex waves on top faces.
* Lava: opaque, emissive, animated pixel-quantised noise.
* Sky (`sky.ts`): gradient dome with sunrise/sunset glow, square sun and moon (original
  look), stars at night; flat blocky cloud layer at y=192 drifting, faded by distance.
  Exports `class Sky { constructor(scene, uniforms); update(dayTime, time, eye): { fog: THREE.Color; daylight: number } }`.
* Shadows (High preset, `settings.shadows`): orthographic sun shadow map following the
  player (snap to texels), depth packed into RGBA8 (works on WebGL1), PCF in the terrain
  shader, applied to the sky-light term. Only opaque+cutout cast shadows.
* Section meshes: `THREE.Mesh` per non-empty layer, `position` = section origin,
  `scale` = 1/256, manual bounding sphere (center 2048,2048,2048 r 3547), frustum culled.
  Translucent/water sorted back to front (three does this per object).
* Performance budget: Low preset at render distance 4 must hold 60 fps on integrated
  graphics: no shadows, no extra passes, pixel ratio 1, cheap shaders.

## WS5 Player, physics, interaction, audio: `src/game/input.ts`, `src/game/player.ts`, `src/game/raycast.ts`, `src/game/interact.ts`, `src/game/audio.ts`

```ts
// input.ts
export class Input {
  constructor(target: HTMLElement);       // listens on window for keys, target for mouse
  enabled: boolean;                       // false while a menu is open (ignore game input)
  readonly locked: boolean;               // pointer lock active
  down(code: string): boolean;            // KeyboardEvent.code currently held
  pressed(code: string): boolean;         // went down since last endFrame()
  mouseDX: number; mouseDY: number;       // accumulated movement since last endFrame()
  wheel: number;                          // accumulated notches (+ = down/next)
  buttons: [boolean, boolean, boolean];   // left, middle, right held
  clicked: [boolean, boolean, boolean];   // pressed since last endFrame()
  requestLock(): Promise<boolean>;        // uses unadjustedMovement when supported, falls back; resolves false on failure
  exitLock(): void;
  onLockChange: ((locked: boolean) => void) | null;
  onKey: ((code: string, e: KeyboardEvent) => void) | null;  // every keydown (for E, Esc, F1-F3, digits) even when !enabled
  endFrame(): void;
}
```
Prevent defaults: F1, F2, F3, Tab, Space, arrow keys, Ctrl+S/Ctrl+D/Ctrl+W-style combos where
the browser allows, context menu, middle-click autoscroll, Ctrl+wheel zoom. Ignore absurd
mouse spikes (>500 px in one event) right after locking (known Chrome quirk).

```ts
// player.ts
export class Player {
  x: number; y: number; z: number;        // feet centre
  vx: number; vy: number; vz: number;
  yaw: number; pitch: number;
  flying: boolean; sprinting: boolean; sneaking: boolean;
  onGround: boolean; inWater: boolean; inLava: boolean; headInWater: boolean;
  readonly width: 0.6; readonly height: 1.8;
  eyeHeight(): number;                    // 1.62, 1.27 when sneaking on ground
  update(dt: number, input: Input, world: World, settings: Settings): void;
  eye(): { x: number; y: number; z: number };
  look(): [number, number, number];
  fovScale(): number;                     // 1, 1.1 sprinting, 1.15 sprint-flying (smoothed)
  bob(): { phase: number; amount: number };
  serialize(): PlayerState; restore(s: PlayerState): void;
}
```
Movement (Minecraft creative feel): WASD; mouse look (sensitivity, invert); Space jump;
double-tap Space (< 300 ms) toggles flying; while flying Space rises and Shift descends;
Ctrl or double-tap W sprints (sprint stops when W released, or on collision head-on);
Shift sneaks on ground (slower, eye lower, will not walk off edges). Walk 4.317 m/s,
sneak 1.31, sprint 5.612, fly 10.92, sprint-fly 21.6, vertical fly 7.5. Gravity 32 m/s2,
jump to 1.25 blocks, terminal velocity ~78 m/s, ground acceleration snappy, air control
reduced, flying has slight glide (inertia). Landing on the ground while flying turns
flying off (MC creative). Swimming: slower, Space swims up, gravity reduced, lava slower
still. AABB collision against `collisionBoxes` (axis-separated sweep y, x, z), auto
step-up 0.6 blocks on ground (slabs/stairs), never fall through the world when chunks
are not loaded yet (freeze until loaded). No fall damage (creative).

```ts
// raycast.ts
export function raycast(world: World, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxDist: number): RayHit | null;
//   DDA voxel walk; tests `selectionBoxes` of each non-air, non-fluid block (TARGETABLE); returns nearest hit.

// interact.ts
export interface InteractHooks {
  onBreak(x: number, y: number, z: number, oldV: number): void;      // particles + sound
  onPlace(x: number, y: number, z: number, v: number): void;         // sound
  onSwing(): void;
  onUse(x: number, y: number, z: number, v: number): void;           // door/trapdoor toggled (sound)
}
export class Interaction {
  constructor(world: World, player: Player, hotbar: Hotbar, hooks: InteractHooks);
  update(dt: number, input: Input, hit: RayHit | null): void;  // left: break instantly, repeat every 0.25 s while held;
  //   right: use door/trapdoor (unless sneaking) else place, repeat every 0.2 s while held; middle: pick block into hotbar
}
export function placementFor(id: number, hit: RayHit, player: Player, world: World): { x: number; y: number; z: number; v: number; extra?: { x: number; y: number; z: number; v: number } } | null;
```
Placement rules: place at `hit + face normal`, or into the hit block itself if it is
`REPLACEABLE` (grass, snow layer, fluids); never place a `SOLID` block intersecting the
player's AABB; plants need support (`support` field in registry: soil = grass/dirt/podzol/
mycelium/moss/mud/rooted dirt/coarse dirt, sand = sand/red sand, cactus = sand + no solid
horizontal neighbours, cane = soil or sand with water adjacent or cane below, water = lily
pad on water); slabs: top/bottom from the hit point, a second matching slab completes a double;
stairs: facing = player look dir, upside-down when clicking the underside or the upper half
of a side; axis blocks from the clicked face's axis; horizontal blocks face the player;
torches: on a side face -> wall torch, on top -> standing, never on the underside;
lanterns hang when placed on an underside; doors need 2 free blocks and a solid block below,
hinge from which half of the block was clicked; trapdoor half from the hit point.
Breaking a door breaks both halves. Breaking a block under a plant/torch/door/snow layer
pops the dependent block too (no drops, creative).

```ts
// audio.ts: procedural WebAudio, no samples
export class Sounds {
  constructor();
  unlock(): void;                       // resume AudioContext on first user gesture
  setVolume(v: number): void;
  play(kind: 'break' | 'place' | 'step' | 'use' | 'splash' | 'click', material: SoundName, pitch?: number): void;
}
```
Materials sound different (stone click, wood knock, grass/gravel/sand crunch, glass
chime, wool thud, metal clink, snow soft, slime squish, liquid splash).

## WS6 UI: `src/ui/style.ts`, `src/ui/font.ts`, `src/ui/icons.ts`, `src/ui/screens.ts`, `src/ui/hud.ts`, `src/ui/inventory.ts`

```ts
export function injectStyles(guiScale: number): void;          // style.ts: all CSS; re-callable when gui scale changes
export function loadPixelFont(): Promise<void>;                // font.ts: original 5x7-ish pixel font built at runtime
//   (TTF generated in JS and registered with FontFace as 'BlockForge'); resolves even on failure (CSS falls back to monospace)
export interface IconSheet { url: string; size: number; cols: number; apply(el: HTMLElement, id: number): void; }
export function buildIcons(atlas: Atlas): IconSheet;           // icons.ts: one sprite sheet canvas, isometric 3D icons for
//   cubes/slabs/stairs/fences/walls/chests/cactus etc. (top light, left 0.8, right 0.6 shade), flat sprites for cross plants,
//   torches, doors (both halves), panes, rods; biome-neutral DEFAULT_TINT for tinted textures. Built at startup < 300 ms.

// screens.ts
export interface MenuHandlers {
  listWorlds(): Promise<WorldMeta[]>;
  createWorld(name: string, seed: string): Promise<void>;
  playWorld(id: string): Promise<void>;
  deleteWorld(id: string): Promise<void>;
  resume(): void;
  saveAndQuit(): Promise<void>;
  settingsChanged(s: Settings): void;     // called on every change (live apply)
  getTimeMode(): TimeMode; setTimeMode(m: TimeMode): void;
  offlineDownloadUrl: string | null;      // '/download' over http(s), null on file://
  version: string;
}
export class Menus {
  constructor(root: HTMLElement, handlers: MenuHandlers, settings: Settings);
  showTitle(): void; showWorlds(): void; showPause(): void; showOptions(back: () => void): void; showControls(back: () => void): void;
  showLoading(text: string, progress?: number): void; // progress 0..1, over a dark dirt-style background
  hide(): void;
  isOpen(): boolean;                      // any menu/loading screen visible
  current(): 'title' | 'worlds' | 'create' | 'pause' | 'options' | 'controls' | 'loading' | null;
  back(): void;                           // Esc inside menus: options/controls -> previous, pause -> resume
}

// hud.ts
export class Hud {
  constructor(root: HTMLElement, icons: IconSheet, hotbar: Hotbar);
  setVisible(v: boolean): void;           // F1
  update(dt: number): void;               // fades item-name label and messages
  showItemName(name: string): void;       // above hotbar, fades after ~2 s (call on slot change)
  message(text: string): void;            // bottom-left chat-style toasts
  setDebugVisible(v: boolean): void; readonly debugVisible: boolean;
  setDebug(left: string[], right: string[]): void;  // F3 overlay, MC-like two columns
  setFps(text: string | null): void;      // small corner fps when showFps and F3 hidden
  setUnderwaterTint(v: boolean): void;
}

// inventory.ts
export class InventoryScreen {
  constructor(root: HTMLElement, icons: IconSheet, hotbar: Hotbar);
  readonly isOpen: boolean;
  open(): void; close(): void; toggle(): void;
  onClose: (() => void) | null;
  handleKey(code: string): boolean;       // digits 1-9 while hovering an item -> put it in that hotbar slot; E/Esc close; returns true if consumed
}
```
UI requirements:
* Original look: chunky bevelled grey buttons, dark translucent panels, pixel font,
  hard 2px text shadows, crisp `image-rendering: pixelated` icons; scaled by `guiScale`.
  No Minecraft logo, fonts, textures or wording copied. Title shows a "BlockForge" logo
  drawn from block textures + a rotating splash line, buttons: Singleplayer, Options,
  Controls, Download offline version (hidden when `offlineDownloadUrl` is null).
* Worlds screen: list (name, seed, last played), Play, Create New World (name + optional
  seed, blank = random, text seeds hashed), Delete with confirm.
* Options: Graphics preset Low/Medium/High (+ Custom when edited), render distance 2-12,
  FOV, sensitivity, invert Y, brightness, view bobbing, fancy leaves, smooth lighting,
  shadows, waving, clouds, mipmaps, resolution scale, GUI scale, fullscreen on play,
  volume, show FPS. Saves via `saveSettings` and calls `settingsChanged` live.
* Controls screen lists every key binding.
* Pause: Back to Game, Options, Time of day (cycles Day cycle/Sunrise/Noon/Sunset/Midnight),
  Save and Quit to Title, plus the "Ctrl+W closes the tab in browsers: use double-tap W,
  or enable Fullscreen" tip.
* HUD: crosshair (difference blend), hotbar of 9 slots with 3D icons and selected frame,
  slot numbers, item name fade, messages, F3 overlay, underwater tint.
* Inventory (E): category tabs (Building, Coloured, Natural, Ores & Minerals, Wood,
  Lighting, Decoration, Fluids, Search), scrolling grid, search box (filters by display
  name, focus with typing), tooltip with block name, the hotbar row inside the screen.
  Click an item -> it sticks to the cursor; click a hotbar slot to drop it there (swap
  with what was there); drag-and-drop works too; shift-click an item sends it to the first
  free hotbar slot (or the selected slot when full); shift-click a hotbar slot clears it;
  dropping outside clears the held item; right-click hotbar slot clears it.

## WS7 Integration (written last): `src/game/chunkManager.ts`, `src/game/game.ts`, `src/main.ts`
Worker pools (generation, meshing; fall back to main thread if `Worker` fails), load
order nearest-first within render distance + 1, unload beyond + 3 (saving modified
chunks), time-budgeted lighting/meshing per frame, a section is meshed only once its
column and all 8 neighbours are lit, edits remesh synchronously the same frame, day
cycle, autosave every 30 s and on pause/unload, `beforeunload` guard while in game,
F2 screenshot download, F1 hide HUD, F3 debug.

## WS8 Touch controls (mobile): `src/ui/touch.ts` (+ small hooks in hud/inventory/screens/game)

`settings.controls` is `'keyboard'` (default, keyboard + mouse) or `'touch'`. It is chosen in
Options > Controls ("Controls: Keyboard & Mouse / Touch"), together with `touchSensitivity` and
`touchButtonScale`. When a touch-only device is detected (`matchMedia('(pointer: coarse)')` and no
fine pointer) the title screen shows a one-line hint pointing at that option; it never switches
the default by itself.

```ts
export class TouchControls {
  constructor(root: HTMLElement, input: Input, hotbar: Hotbar, settings: Settings, hooks: {
    openInventory(): void; pause(): void; isFlying(): boolean;
  });
  setEnabled(on: boolean): void;   // show/hide the overlay (only while playing and settings.controls === 'touch')
  applySettings(s: Settings): void;
  update(dt: number): void;        // per frame: feeds Input
  dispose(): void;
}
```
Touch drives the existing `Input` without changing the game logic: movement keys are synthesised
as `KeyboardEvent('keydown'/'keyup', { code })` on `window` (KeyW/A/S/D from a left-thumb
joystick, Space, ShiftLeft, ControlLeft), look is added to `input.mouseDX/mouseDY`, and break/place
set `input.buttons` / `input.clicked`. The game treats touch mode as "locked" (no pointer lock;
interaction runs; pausing is the on-screen pause button). Layout (landscape and portrait):
left joystick (pushing to the rim sprints), right-side drag to look, buttons: Jump (double-tap
toggles flying, hold to rise when flying), Sneak/Descend, Break (hold repeats), Place/Use (hold
repeats), Pick, Inventory, Pause; the HUD hotbar slots are tappable. All with `touch-action: none`,
multi-touch (move + look + button at once), no page zoom/scroll, and readable at phone sizes.
