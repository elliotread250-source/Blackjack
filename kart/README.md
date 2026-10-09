# Kart

A 3D kart racer for the browser: five tracks, five karts you can paint and dress up, drifting with
three-stage mini-turbos, item boxes, bots on three difficulties, a five-race Grand Prix, time trials
against your own ghost, and online races for up to eight players with share links and quick match.
It runs on three.js with low-poly karts from Kenney (CC0), everything else is generated in code, and
there is no build step: the folder is the game.

## Features

- **Five karts**, each a different model with its own stats (top speed, acceleration, handling, weight):
  - **Standard**: a classic go-kart, balanced.
  - **Speedster**: futuristic racer, highest top speed, slow off the line.
  - **Drifter**: open-wheel racer, best handling, charges mini-turbos fastest, light.
  - **Heavy**: monster truck, shoves everyone around and shrugs off hits.
  - **Rally**: hot hatch with rally tyres, fastest acceleration, barely slowed by dirt and grass.
- **Garage** with a live, rotating 3D preview: body colour and accent colour (16-colour palette or any custom colour),
  four wheel styles (Sport, Classic, Stealth, Off-road), five drivers (Oobi, Oodi, Ooli, Oopi, Oozi) with driver and
  helmet colours, a race number from 0 to 99, a spoiler and an antenna flag. Saved on your device and shown to everyone
  you race online.
- **Arcade handling**: grip and slides, hop and drift (hold drift while steering) with a mini-turbo that charges blue,
  orange then purple, boost pads, rocket starts, off-road slowdown, ice, jumps with air control, banked corners,
  walls you slide along, kart-to-kart bumps where heavier karts win, and a rescue drone that puts you back on the
  track if you fall, land in lava or get stuck (or press R).
- **Items** from rainbow item boxes, with odds that favour whoever is behind: **Turbo** (a boost), **Banana**
  (drop behind you), **Bouncer** (a shell that flies ahead, or behind if you hold brake, and bounces off walls) and
  **Shield** (blocks one hit).
- **Bots** follow a racing line computed from the track, brake for corners they see coming, drift through long
  bends for mini-turbos, take shortcuts, dodge karts and bananas, use items sensibly and recover when hit. Easy,
  Normal and Hard change their pace and skill; a little rubber-banding keeps races close.
- **Modes**: Single Race (you and seven bots, 1 to 5 laps), Grand Prix (all five tracks, points 15/12/10/8/6/4/2/1,
  standings after each race), Time Trial (three turbos, best times and a ghost of your best lap per track) and Online.
- **Looks and sound**: sky gradients and fog per track, a sun with a small shadow map that follows you (High
  graphics), drift sparks in the mini-turbo colours, boost flames, dust, grass and snow kick-up, explosions,
  confetti on the podium, a chase camera with a speed and boost FOV kick and a look-back button. All sound is
  synthesised: engines that follow your speed (and the karts near you), tyre screech, boosts, items, countdown beeps,
  lap chimes, a finish fanfare and a little chiptune per track. Sound and music toggles are remembered.
- **Phones**: on-screen steering buttons (or a slider), gas, brake, drift, item and look-back buttons,
  auto-accelerate, works in landscape and asks you to rotate in portrait. Low graphics are picked automatically
  on touch devices (no shadow map, fewer props, capped resolution); you can switch in Settings.

## Tracks

1. **Sunny Meadow**: a wide, gentle circuit over rolling green hills with a windmill, a grandstand and a dirt
   shortcut lane on the long left-hander.
2. **Desert Canyon**: red rock walls, cactus flats and a jump over a gorge (with a boost pad to help you clear it),
   plus a shortcut lane through the long left bend.
3. **Snow Peak**: climbs 22 m up a mountain pass between snowy pines, then drops onto a frozen lake where the
   road turns to slippery ice. Snowfall and a shortcut on the top hairpin.
4. **Neon City**: night streets lined with lit towers, neon barriers and street lamps, tight corners, and a
   flyover that crosses the lower road in a figure eight.
5. **Lava Island**: climbs the volcano past fields of lava (touch it and the drone fishes you out), along an
   open ridge with no barriers, then leaps down its flank.

Each track is a closed Catmull-Rom spline. From it the game builds the road with banking and elevation, kerbs
on corners, off-road bands, walls or open edges, boost pads, item box rows, shortcut lanes behind dividers,
jumps, the racing line the bots use, the checkpoints for lap counting, the minimap and the track card.

## Controls

| Action | Keyboard | Gamepad | Touch |
| --- | --- | --- | --- |
| Steer | A / D or Left / Right | Left stick, d-pad | Arrow buttons or slider (left) |
| Accelerate / brake and reverse | W / S or Up / Down | RT / LT (or A / B) | GAS / BRAKE (auto-accelerate optional) |
| Hop and drift | Space or Shift (hold while steering) | RB or X | DRIFT |
| Use item | E or Ctrl (hold brake to throw back) | LB or Y | ITEM |
| Look back | C | Stick click | BACK |
| Reset kart | R | Back / Select | Pause > Reset (online) |
| Pause | P or Esc | Start | Pause button |
| Mute | M | | Speaker button |

Tip: hold accelerate as "1" appears in the countdown for a rocket start.

## How online works

`server.py` serves the game and a small WebSocket service at `/ws` on the same port (Railway terminates TLS and
proxies the socket). It is standard-library Python only.

- **Rooms**: up to 8 players behind a 4-letter code. Create a room and share the code or the `?room=CODE` link
  (copy and share buttons), join by code, or use **Quick match**, which puts you in the fullest open public lobby or
  opens a new one. The creator is the host; if the host leaves, the next player takes over.
- **Lobby**: everyone's name, kart colours, kart type, number and ready flag. The host picks the track, the lap
  count (1 to 5) and whether bots fill the empty places, and starts the race once everyone is ready. You can open the
  garage from the lobby and your new look is sent to the room straight away.
- **Start**: the server sends a start time on its own clock. Clients sync to the server clock with ping/pong
  (they keep the lowest-latency samples), so the 3-2-1-GO countdown lines up on every screen.
- **Racing**: each browser simulates its own kart and sends its state about 15 times a second (position,
  heading, velocity, steering, drift and mini-turbo stage, boost, spin, shield, airborne, lap and course progress,
  held item). Other karts are drawn about 100 ms in the past, interpolated between updates and extrapolated briefly if
  updates go missing. The host's browser also drives the bots and streams them. Item boxes, thrown bananas and
  shells, and hits are sent as events; each client checks hits only against the karts it drives and reports them,
  so everyone sees the same item disappear and the victim spin. Positions come from laps plus distance along the
  course.
- **Finish**: finish times go to the server, which sends the same results to everyone when all racers have
  finished (or 30 seconds after the first finisher) and puts the room back in the lobby. Players who drop out are
  shown as left; if the host drops, the new host's browser picks up the bots where they were.
- **Safety**: names and kart designs are sanitised, every relayed message is type- and range-checked, messages are
  size-capped and rate-limited per socket, rooms are capped, and empty or idle rooms are cleaned up.

## Asset credits and licences

- Kart, car, truck, wheel and driver models: **Kenney** (www.kenney.nl), *Car Kit* and *Starter Kit Racing*,
  **CC0 1.0** (public domain). Details, sources and what was changed: [models/CREDITS.md](models/CREDITS.md).
- **three.js** r170 (`vendor/`), MIT licence, see `vendor/LICENSE-three.txt`.
- Everything else (tracks, scenery, items, effects, sounds, music, UI) is made in code for this game.

## Run locally

```
python server.py    # http://localhost:8080
```
