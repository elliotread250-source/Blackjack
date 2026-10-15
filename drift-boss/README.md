# Drift Boss

A one-button drifting game for the browser, remade for Open Arcade. Your car drives itself along a narrow
zig-zag road floating above the clouds; hold to swing it round to the other direction and let go to straighten
up. Time every corner, because turn too early or too late and you slide off the edge and drop into the sky.
It is drawn in canvas 2D in a flat-shaded isometric style, every sound is synthesised with WebAudio, and there is
no build step: the folder is the game.

## Features

- **One-button drifting**: the car's heading swings towards the target direction while its velocity lags behind
  it, so it slides through every corner, leaving skid marks and tyre smoke. The physics runs per distance
  travelled, so a corner has the same shape at every speed: it only gets tighter on timing as you speed up.
- **Endless road** of straight runs that zig-zag at 90 degrees, with chunky blocks, kerbs on the corners and lane
  markings. Runs get shorter and the car gets faster the further you go, and the sky drifts from day through
  sunset and dusk to night.
- **Score** = blocks driven. **Coins** sit on the road; collect them to spend in the garage.
- **Power-ups**: **Fever** (the car drives itself at high speed with a coin magnet for five seconds, then hands
  back control once your button matches the road), **Double score** for ten seconds, and **Shield**, which
  catches one fall.
- **Second chance**: once per run you can spend 25 coins to carry on from where you fell.
- **Garage** with eight procedurally modelled cars: Hatchback, Taxi, Police (with flashing lights), Sports,
  Van, Pickup, Formula and Monster truck.
- **Saved on your device**: best score, coins, cars, selected car and sound setting.
- Fixed 60 Hz simulation (identical on 60/120 Hz screens), sharp on high-DPI screens, fills portrait and
  landscape, pauses when the tab is hidden, a short tutorial on the first runs.

## Controls

| Action | Keyboard | Mouse / touch |
| --- | --- | --- |
| Turn (hold) / go straight (release) | Space | Hold anywhere |
| Start / retry | Space or Enter | Tap |
| Pause | P or Esc | Pause button |
| Sound on/off | M | Speaker button |

## Run locally

```sh
python server.py    # http://localhost:8080
```
