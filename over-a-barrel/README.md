# Over a Barrel

A frog is stuck in a barrel. It has a long pickaxe. There is a mountain.

A mouse-only physics climbing game in the spirit of *Getting Over It*: the
pick is one rigid tool of fixed length, hinged at the frog's shoulders and
sliding through its hands, and the only thing you control is where the pick's
head wants to be. When the head is blocked, *you* move instead. Push, pull,
hook, vault, brace, fall.

All mechanics, no borrowed assets: original character, original container,
original level, synthesised sound, no narration.

## Play

- Move the mouse to move the pickaxe. That's the whole control scheme.
- Esc pauses (sensitivity, volume, graphics are in there).
- There are no checkpoints. Closing the tab remembers where you were; falling
  does not care.

The climb, bottom to top: **The Rubble**, **Old Crooked** (a leaning tree you
climb by its stubs), **The Flue** (a chimney you brace and hop up, ledge to
ledge), **Glass Slope**
(ice with rock studs), **The Eaves** (overhanging ledges you hook around) and
**The Spine** (21 leaning teeth: hook each peak from the notch below, all the
way to the summit's lip). Fall off the top half and the
ice funnels you a very long way down.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm start            # serve dist/ on $PORT (what Railway runs)
```

Useful URL flags: `?quality=low|medium|high|ultra`, `?debug` (collider
overlay), `?map=test` (the flat proving ground), `?play` (skip the title).

## How it's built

- **Physics:** [Planck.js](https://piqnt.com/planck.js/) (Box2D) on a fixed
  150 Hz step with interpolated rendering, so it plays the same at any refresh
  rate. Continuous collision on the barrel and the pick.
- **The rig** (`src/sim/player.ts`): barrel body (fixed rotation) → revolute
  joint at the shoulder → hidden slider body → prismatic joint → pickaxe.
  Each frame the mouse target (relative to the shoulder) becomes a target
  angle and a target reach; both joint motors are driven toward them with a
  proportional controller and hard caps on torque and force. Equal and
  opposite forces do the rest.
- **The pick** is one fixed-length rigid body (2.25 m), like the original's
  hammer. The prismatic joint slides the whole shaft through the frog's
  hands: reach out and the hands end up near the butt, pull the head in to
  your chest and the shaft sticks out behind you. Only the head collides;
  the shaft passes through rock, as in the original.
- **Rendering** (`src/render3d/`): Three.js, 3D models over the 2D physics
  plane like the original. Sculpted rock (constrained triangulation with
  interior points, bulged toward the camera) keeps the exact physics
  silhouette at the play plane. Two-bone IK arms, altitude-banded rock,
  parallax ranges at real depth, weather, dust, sparks.
- **Graphics presets** (`GRAPHICS` in `src/config.ts`): *CPU* runs on
  software WebGL with no GPU; *Balanced*, *High* (ambient occlusion, bloom,
  MSAA, soft shadows) and *Ultra* use the GPU. Auto-detected on first load,
  with an fps watchdog; changeable in Settings. Physics is identical in all
  of them.
- **Sound** (`src/audio/audio.ts`): all synthesised with Web Audio.
- **Proof it's climbable** (`tools/route.ts`): a cross-entropy-method bot
  searches mouse paths on the real physics, waypoint to waypoint, from the
  bottom to the summit: 126 resting spots, about six minutes of perfect
  climbing. `npx tsx tools/route.ts` re-runs the search (about 20 minutes);
  `npx tsx tools/replay.ts` replays the saved route in
  `tools/route-progress.json` in a couple of minutes and names the first
  waypoint a level edit broke.

## Tuning the physics

Every physics constant lives in **`src/config.ts`**. The ones that change the
feel the most:

| Constant | Default | What it does |
| --- | --- | --- |
| `PHYSICS.gravity` | 29.7 m/s² | Heavier = snappier and less floaty, lower vaults. The original runs at 30. |
| `PHYSICS.airDrag` | 0.11 | Quadratic drag. Caps long falls; barely touches normal motion. |
| `PHYSICS.hz` | 150 | Fixed simulation rate. Raise it for stiffer contacts, at CPU cost. |
| `CONTAINER.mass` | 12 kg | Barrel + frog. Heavier = harder to lift yourself. |
| `CONTAINER.friction` | 0.45 | Barrel base. Decides the steepest slope you can rest on (~31°). |
| `CONTAINER.hoopFriction` | 0.08 | The iron hoops on the barrel's sides. Low = chimney bracing works. |
| `HAMMER.maxTorque` | 1250 N·m | Rotational strength. The main "brute force vs technique" knob. |
| `HAMMER.maxForce` | 1094 N | Push/pull strength along the handle. Drives vault height. |
| `HAMMER.angleGain`, `reachGain` | 30, 60 | How hard the motors chase the mouse. Lower = laggier, softer pick; a lower `reachGain` makes push-offs ease in instead of popping. |
| `HAMMER.maxAngularSpeed`, `maxLinearSpeed` | 16.25 rad/s, 10.6 m/s | Top swing and extend speeds. Caps how violent a fling can be. |
| `HAMMER.minReach`, `maxReach` | 0.3, 2.0 m | How close and far the pick head can get from the shoulder. |
| `HAMMER.handleLength` | 2.25 m | The pick's fixed length. Keep it a bit over `maxReach`. |
| `HAMMER.headFriction` | 3.0 | How well the pick bites. Rock ≈ 1.57 after mixing, ice ≈ 0.11. |
| `MATERIALS.*.friction` | | Per-surface grip (rock, wood, ice...). Box2D mixes as √(a·b). |
| `INPUT.defaultSensitivity` | 1.0 | 1.0 = the pick tracks the mouse 1:1 with screen pixels. |

What the defaults allow a perfect player (measured by the bot): a straight
shove off flat ground leaves it in 67 ms and lifts the barrel 2.6 m; it can
climb a plain 3.0 m wall by hooking its top and brace up a 1.6–1.9 m chimney,
but not a 3.4 m wall and not a smooth ice ramp. A hooked swing can still fling
you 8 m up, as in the original; landing it is the hard part. If you change
the strength or friction numbers, rerun `npx tsx tools/walls.ts`,
`npx tsx tools/chimney.ts` and `npx tsx tools/route.ts` to see what's still
possible. `TUNE='{"HAMMER":{"maxForce":900}}'` in front of any of them tries
a change without editing `config.ts`.

One number looks odd but matters: `HAMMER.sliderInertia` must stay close to
the pick's own inertia or the solver can't pass torque through the hidden
slider body (the pick goes limp).

To make the whole game quicker or slower without changing what's possible,
scale the clock: multiply `PHYSICS.hz`, every speed and every gain by k,
`PHYSICS.gravity`, `maxForce` and `maxTorque` by k². Every jump keeps its
exact shape. The current numbers are a k = 1.25 speed-up of an older,
floatier tune. `npx tsx tools/launch.ts` prints how fast a push-off leaves the
ground and how high it goes.

## Deploy

Railway builds with Railpack using `railway.json`: `npm run build`, then
`npm start` (`serve -s dist` on `$PORT`). Every push to `main` redeploys.
