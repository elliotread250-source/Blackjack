# Model credits

Every 3D model in `karts.glb` comes from Kenney's free asset packs. Kenney releases these packs under
**CC0 1.0 Universal** (public domain dedication): <https://creativecommons.org/publicdomain/zero/1.0/>.
Credit is not required, but here it is anyway: thank you, Kenney (www.kenney.nl).

| Used for | Source file(s) | Pack | Author | Licence | Downloaded from |
| --- | --- | --- | --- | --- | --- |
| Standard kart body, and the five drivers Oobi, Oodi, Ooli, Oopi and Oozi | `kart-oobi.glb`, `kart-oodi.glb`, `kart-ooli.glb`, `kart-oopi.glb`, `kart-oozi.glb` | Car Kit 3.1 | Kenney | CC0 1.0 | <https://github.com/series-ai/jam-ready-assets/tree/main/kenney-car-kit/3D/vehicles-racing/Models/GLB%20format> |
| Speedster body | `race-future.glb` | Car Kit 3.1 | Kenney | CC0 1.0 | same as above |
| Drifter body | `race.glb` | Car Kit 3.1 | Kenney | CC0 1.0 | same as above |
| Rally body | `hatchback-sports.glb` | Car Kit 3.1 | Kenney | CC0 1.0 | same as above |
| Sport, Classic and Stealth wheels | `wheel-racing.glb`, `wheel-default.glb`, `wheel-dark.glb` | Car Kit 3.1 | Kenney | CC0 1.0 | same as above |
| Traffic cone (prop) | `cone.glb` | Car Kit 3.1 | Kenney | CC0 1.0 | same as above |
| Car Kit colour palette texture (baked into vertex colours) | `Textures/colormap.png` | Car Kit 3.1 | Kenney | CC0 1.0 | same as above |
| Heavy body and Off-road wheels | `models/vehicle-truck-yellow.glb` (+ its `Textures/colormap.png`) | Starter Kit Racing | Kenney | Models CC0 1.0 (the kit's code is MIT; no code is used) | <https://github.com/KenneyNL/Starter-Kit-Racing/tree/main/models> |

Licence evidence:

- Car Kit: `kenney-car-kit/3D/vehicles-racing/License.txt` in the repository above: "Car Kit (3.1) Created/distributed by Kenney
  (www.kenney.nl) ... License: (Creative Commons Zero, CC0)". The official pack page is <https://kenney.nl/assets/car-kit>.
- Starter Kit Racing: the repository README states "Assets included in this package (2D sprites, 3D models and sound effects) are
  CC0 licensed". The official page is <https://kenney.nl/starter-kits>.

## What was changed

The original GLB files are not shipped as-is. A build script (Node, `@gltf-transform/core`) combined the pieces above into a single
`karts.glb` (about 640 KB):

- the palette texture was sampled at each vertex and baked into vertex colours (linear), and UVs, tangents and the texture were dropped;
- each vertex got a small `_ROLE` attribute (body, accent, driver, helmet, glass, rim) so the game can repaint a kart in each player's
  colours, and windows were split out so they can be drawn see-through;
- the bodies were scaled to a common size, placed with the wheels on the ground, and wheel positions were recorded;
- the wheels were normalised to radius 1 with the rim facing outwards; the drivers were taken from the five kart variants.

Everything else you see (tracks, scenery, item boxes, items, the rescue drone, particles, the UI) is generated in code.

## Software

- three.js r170 (`vendor/three.module.min.js`, `vendor/GLTFLoader.js`, `vendor/BufferGeometryUtils.js`), MIT licence, see
  `vendor/LICENSE-three.txt`. From the npm package `three@0.170.0`.
