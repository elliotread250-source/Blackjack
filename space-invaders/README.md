# Space Invaders

A remake of Taito's 1978 arcade board. Everything is drawn from hand-copied
bitmaps on the original 224x256 portrait screen, with the green and red
cellophane overlay, a CRT glow and synthesised sound.

## Faithful bits

- One alien moves per frame, so the rack ripples across the screen and
  speeds up on its own as you thin it out. The last alien runs right at
  3 pixels a frame.
- Four-note bass march that quickens with the rack.
- Three bomb types: the rolling bomb drops from the column above you, the
  plunger and squiggly bombs follow the board's fixed column tables, and
  the plunger stops when one alien is left. Fire rate climbs with your score.
- Bunkers erode pixel by pixel from shots, bombs and invaders flying
  through them. Bombs that miss blow holes in the floor line.
- Alien explosions freeze the rack for a moment, like the original.
- Mystery ship every 25.6 seconds while 8+ aliens remain. Its score comes
  from the board's table indexed by your shot count, so the 23rd shot and
  every 15th after it is worth 300.
- Extra life at 1,500. Later waves start lower down the screen.
- Attract mode: the typed-out title and score advance table, the alien
  that swaps the upside-down Y in PLAY every other cycle, a demo game, and
  the insert coin screens. Credits, 1 or 2 player starts, and two-player
  alternating turns with separate racks and bunkers.

## Difficulty

| Level | Lives | Bomb rate | Bomb speed | March |
|---|---|---|---|---|
| Easy | 5 | 0.6x | 0.8x | normal, 2 bombs max |
| Normal | 3 | arcade | arcade | arcade |
| Hard | 3 | 1.8x | 1.3x | double speed |

A test bot that leads its shots reaches wave 9 on Easy, wave 2 on Normal
and dies in wave 1 on Hard.

## Controls

Left/Right or A/D move, Space/Up/W fire. Enter (or a tap) starts a
1-player game; 5 or C inserts a coin, 1 and 2 start games with credits.
X changes difficulty on the title screens, P pauses, M mutes, O toggles
the colour overlay, T toggles the CRT effect. Phones get on-screen
buttons.

```bash
python server.py    # http://localhost:8080
```
