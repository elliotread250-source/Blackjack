# Stickman Hook

A remake of the rope-swinging stickman game. Hold to grab the nearest pink hook, swing, let go at the right moment and fly to the finish podium. Everything is drawn with code on a canvas in a bright pastel style, and every sound is synthesised with WebAudio. It's plain HTML, canvas and vanilla JS, with no build step, no libraries and no network requests.

Features:

- 30 hand-made levels in six themed worlds (Meadow, Bubblegum, Mint, Lavender, Sunset, Starlight), each with its own sky colours and parallax hills. Bounce pads, bouncy pink walls, moving hooks, spinning bars, narrow gaps, long jumps, and levels where you have to build up speed over several swings first.
- Rope physics: the rope is a rigid line, so you can swing right round a hook, and the stickman pumps a little on every swing so holding longer builds speed. Letting go keeps your exact momentum.
- The stickman is a verlet ragdoll. He hangs from the rope by one hand, his free arm and legs flail, and he somersaults when you let go (faster release, more flips).
- The hook you would grab lights up and pulses when it is in reach.
- Camera with look-ahead that zooms out a little at speed, and a motion trail.
- A timer, a best time and up to three stars per level (beat the target time for three). Level select with locks, stars and best times.
- Eight skins with their own trails (bubbles, sparkles, neon, rainbow, fire, a ninja headband, a crown). One unlocks every 5 levels, and the last one at 75 stars.
- Progress, best times, stars, skin and mute are saved in your browser.
- The physics always runs at a fixed 120 steps a second (240 Hz substeps), so it plays the same on 60 Hz and 120 Hz screens. The game pauses when you switch tabs. It fits phones in portrait and landscape, and desktop. It renders sharply on high-DPI screens.
- Every level is proven finishable: `node tools/solve.cjs` is an autoplayer that searches press and release timings with the game's own physics and finishes all 30. `node tools/test.cjs` runs the physics unit tests.

## Controls

- Grab / swing: hold the mouse button, a finger anywhere on the screen, or Space. Let go to fly.
- Restart level: R. Pause: P or Esc (or the pause button). Mute: M (or the speaker button).
- Menus: Enter or Space starts / continues and goes to the next level.

```
python server.py    # http://localhost:8080
```
