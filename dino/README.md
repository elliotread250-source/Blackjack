# Dino Run

A remake of Chrome's offline T-Rex runner, played on the original 600x150 strip at a fixed 60 steps a second and scaled up with square pixels to fill the screen. The T-Rex, the pterodactyls and the text are hand-made pixel bitmaps typed into the source. The cacti, clouds, moon and ground are built from a few numbers. The physics, the obstacle table, the gap formula and the day/night timing use the original runner's numbers. All three sounds are synthesised with WebAudio. Plain HTML, canvas and vanilla JS: no build step, no libraries, no network requests.

Faithful bits:

- The T-Rex blinks while it waits. The first jump starts the intro: it jumps in place, the ground rolls out from under it, and it walks in to its spot. The first cacti arrive three seconds later.
- Running and ducking each have two frames, there is a jump pose, and the crash pose has X eyes and a dropped jaw.
- Gravity is 0.6 and the jump velocity is -10 minus speed/10, with the original's minimum hop and height cap. A short tap gives a short hop and holding gives the full jump. Pressing down in the air fast-falls, and a held key keeps jumping on landing, as it does in Chrome.
- Speed starts at 6 and rises by 0.001 a frame to 13. Small and large cacti come in groups of one to three, and large groups only appear from speed 7. Pterodactyls flap at three heights and only appear from speed 8.5 (around 450 points). The gap after each obstacle is width x speed plus a minimum, times 1 to 1.5. No type appears more than twice in a row.
- Collision uses a dozen boxes per sprite (per animation frame), all cut from solid pixels, so a crash always means the pixels touched. The pterodactyl's wings don't count, as in the original.
- The score counter in the top right has leading zeros, with HI beside it. Every 100 points it blinks and chimes. Night falls every 700 points for 12 seconds, fading in and out, with the moon (a new phase each night) and stars. Game over shows G A M E  O V E R and the restart arrow, and a jump only restarts after 0.75 s. Clouds drift at a slower parallax, and the ground line has bumps and pebbles.

Extras: a "classic grey / colour" palette toggle, a run-stats line on game over (distance, jumps, time), a short jump buffer just before landing, and pausing. High score, mute and palette are saved in your browser.

Controls: Space, Up or W to jump (hold for higher). Down or S to duck, or to fast-fall in the air. Enter restarts, P or Esc pauses, M mutes, C switches colours. On a phone, tap anywhere to jump (hold for higher), and swipe down or hold the duck button at the bottom left to duck. The game pauses itself when you switch tabs. Gamepads work too: A to jump, down to duck, Start to pause.

```
python server.py    # http://localhost:8080
```
