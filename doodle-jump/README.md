# Doodle Jump

A remake of the classic vertical jumper. Bounce up an endless sheet of graph paper. Steer onto platforms, grab springs and jetpacks, and stomp or shoot the monsters. Everything is drawn with code in a hand-sketched style: wobbly ink outlines, flat fills, cream paper with faint blue grid lines. All sounds are synthesised with WebAudio. It's plain HTML, canvas and vanilla JS, with no build step, no libraries and no network requests.

Features:

- The doodler: a four-legged green-yellow creature with a trumpet nose. It faces the way it moves, squashes when it lands, points its nose up to shoot, flips on trampolines and wraps around the screen edges.
- Platforms:
  - green: normal
  - blue: slide side to side
  - brown: crumble when you land on them, no bounce
  - white: vanish after one bounce
  - yellow: drift up and down, appear higher up
- Springs and trampolines give big bounces. The propeller hat and the jetpack carry you up for a few seconds. While flying you smash any monster in your way.
- Monsters, some of which move: a fuzzy blob, a bat, a one-eyed horned cyclops (2 hits) and a big many-legged blue one (3 hits). Touch one from the side or from below and you fall. Land on one from above to stomp it, or shoot it from below.
- Black holes suck you in. UFOs abduct you if you pass through their beam, but you can stomp them or shoot them (3 hits).
- Difficulty rises with height: wider gaps, more moving, breaking and vanishing platforms, more monsters. The generator guarantees a reachable route at every height. Every gap stays well inside the jump height, horizontal distance is limited by how far you can travel in the air, and hazards are kept clear of the route. Unit tests check this, and an autopilot that plays the real physics climbs 25,000 px on 30 layouts across all difficulties.
- The score is the height you've climbed, shown on a torn paper strip. Your previous best is pencilled on the side of the page as you pass it. When you fall off the bottom, the page scrolls after you and a game-over note shows your score and best.
- High score, mute, steering mode and tilt sensitivity are saved in your browser.
- The game always simulates 60 fixed steps per second, so it plays the same on 60 Hz and 120 Hz screens. It pauses itself when you switch tabs. Portrait layout: on desktop it's a centred column scaled to the window height, on phones it fills the screen in portrait, and in landscape it's a centred column. It renders sharply on high-DPI screens.

## Controls

- Move: Left / Right or A / D (with smooth acceleration and air control)
- Shoot: Space, Up, W or click
- Pause: P or Esc. Mute: M. Start or play again: Enter or Space.
- Phones: tilt the device to steer, like the original. On iPhone, the first play asks for motion permission through a button. The level is calibrated each time a game starts. If tilt isn't available or permission is denied, you get touch controls instead: hold the left or right half of the screen to steer, and tap the upper part of the screen, or tap with a second finger, to shoot. In tilt mode, any tap shoots. Switch between tilt and touch, change tilt sensitivity or reset the level in settings (the gear on the menu, or pause, then settings).

```
python server.py    # http://localhost:8080
```
