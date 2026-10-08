# Pac-Man

A remake of Namco's 1980 arcade board, played on the original 224x288 portrait screen at a fixed 60 ticks a second. The maze is built from the arcade's 28x31 tile map: a distance field over the corridors gives the rounded blue double-line walls, and the sprites and the font are hand-copied pixel bitmaps scaled with smoothing off. The ghost logic follows Jamey Pittman's *Pac-Man Dossier*, so the patterns and the personalities behave the way they did in the arcade. All the sound is synthesised with WebAudio. Plain HTML, canvas and vanilla JS: no build step, no libraries.

Faithful bits:

- 240 dots and 4 flashing energizers, side tunnels that slow ghosts, the pink house door, and fruit twice a level (after 70 and 170 dots) for 9 to 10 seconds: cherry, strawberry, orange, apple, melon, Galaxian, bell, key.
- Pac-Man cuts corners (pre- and post-turns) and stalls one frame per dot, three per energizer, which is where the dossier's slower "eating" speeds come from.
- Ghosts plan at tile centres, pick the neighbour closest to their target (ties go up, left, down, right), never reverse on their own, and can't turn up at the four restricted tiles above the house and above Pac-Man's start.
- Blinky chases Pac-Man's tile, Pinky aims 4 tiles ahead (4 up and 4 left when facing up, the original overflow bug), Inky doubles the vector from Blinky through the tile 2 ahead, and Clyde gives up and heads for his corner within 8 tiles.
- The per-level scatter/chase schedule, with forced reversals on every mode change; per-level speed tables for Pac-Man and the ghosts, including tunnel and frightened speeds.
- Frightened time and flash counts from the dossier table (6 s on level 1, nothing from level 19 on), 200/400/800/1600 for a chain of ghosts with the one-second freeze, and eyes that race home and revive.
- Ghost house release by personal dot counters, the global counter after a death, and the idle timer that forces a ghost out when you stop eating; Cruise Elroy speed-ups for Blinky, suspended after a death until Clyde leaves.
- Extra life at 10,000, the death animation, the white/blue maze flash between levels, the coffee-break intermission after levels 2, 5, 9, 13 and 17, and the attract-mode roll call and energizer chase.
- High score saved in your browser; sound mute remembered.

Controls: arrow keys or WASD to steer (a turn pressed early is held until the next opening), Enter or Space to start, P or Esc to pause, M to mute. On a phone, swipe anywhere to steer (the turn registers mid-swipe) or use the d-pad under the maze; tap to start. The game pauses itself when you switch tabs. Gamepads work too.

```
python server.py    # http://localhost:8080
```
