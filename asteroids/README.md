# Asteroids

A remake of Atari's 1979 vector arcade game, played on the arcade's 4:3 screen of 1024 x 768 units at a fixed 60 ticks a second, so it runs at the same speed on 60 Hz and 120 Hz displays. Everything on screen is a line or a dot. Ships, rocks, saucers and the arcade-style vector lettering go through one batched path, which is stroked with a soft bloom so the lines glow like a phosphor tube. There's an optional persistence trail as well. On phones the playfield takes the shape of the room left beside or below the on-screen controls. The sound is synthesised with WebAudio. It's plain HTML, canvas and vanilla JS: no build step, no libraries, no network requests.

Faithful bits:

- The ship turns through 256 headings, three per frame. Thrust builds up inertia and is capped at a top speed, and friction slows it gently. The flame flickers on alternate frames, and everything wraps around the screen edges.
- Up to four shots on screen at once, one per press with no autofire. Shots carry the ship's own speed, wrap around the screen, and burn out after about a second.
- Hyperspace drops you somewhere random with a small chance of blowing up when you come back, and the chance grows as the screen fills with rocks. After a death you respawn only once the centre is clear, then blink through a short grace period.
- The four classic rock outlines come in three sizes: large rocks are worth 20, medium 50 and small 100. Large rocks split into two mediums and mediums into two smalls, each piece flying off at a random speed and heading. Wave 1 has 4 large rocks, and each wave adds 2 more up to 11.
- The large saucer shoots at random and is worth 200. The small saucer aims at you, gets more accurate as your score climbs, and is worth 1000. Small saucers appear more often as the score goes up, and they're the only kind after 40,000. Saucers turn up more often late in a wave. Saucer shots break rocks too, and a saucer that runs into a rock is destroyed.
- You start with 3 ships and get an extra one every 10,000 points. Your score is drawn top-left in the vector font with your remaining ships beneath it, and the high score sits top-centre.
- The ship breaks apart into tumbling line fragments, while rocks and saucers burst into dots.
- Sound: the two-note heartbeat thump, which speeds up as the wave thins out; the falling "pew"; the thrust rumble; three sizes of explosion; the low siren of the large saucer and the higher one of the small saucer; and the extra-life chime.
- Attract mode shows drifting rocks and wandering saucers, the title, a blinking PUSH START, "1 COIN 1 PLAY", and the high-score table on rotation.
- A top-10 table with arcade-style three-letter initials: rotate picks the letter and hyperspace confirms it. The table and your sound and trail settings are saved in your browser.

Controls: Left/Right or A/D rotate, Up or W thrust, Space or K fire, Shift, Down, S or H hyperspace. Enter starts, P or Esc pauses, M mutes and T toggles phosphor trails. On the initials screen you can also type the letters directly. On a phone, tap to start. The on-screen buttons are multi-touch, so you can rotate, thrust and fire at once. They sit at the sides in landscape and under the playfield in portrait. Gamepads work too: use the d-pad or stick to rotate, A to fire, B for hyperspace, up or RT to thrust, and Start. The game pauses itself when you switch tabs.

```
python server.py    # http://localhost:8080
```
