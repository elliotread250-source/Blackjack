# Breakout

A careful browser remake of Atari's 1976 brick-breaker with an Arkanoid-style arcade mode on top: steer the paddle, keep the ball alive and smash every brick. Classic mode follows the original rules (eight coloured rows, two walls, three balls), while Arcade mode adds 12 hand-built levels, tough and indestructible bricks and falling power-ups, all with a neon look, synthesised sound and full touch support. Vanilla JavaScript and a canvas, no build step, no external requests.

## Features

- **Arcade mode** (default): 12 shaped levels (Pyramid, Invader, Heart, Fortress, Mothership...), two- and three-hit bricks that crack as you hit them, steel bricks that never break, and a level-select for any level you have reached.
- **Power-ups** in labelled, colour-coded capsules: Expand, Shrink (avoid!), Multi-ball, Slow, Laser, Catch, Extra life and Fireball, with on-screen timers.
- **Classic mode**: red/orange/green/yellow rows scoring 7/7/5/5/3/3/1/1, speed-ups after 4 and 12 hits and on reaching the orange and red rows, paddle halves after breaking through to the back wall, two walls per game.
- **Paddle aiming**: where the ball meets the paddle sets its angle; angles are clamped so the ball never goes flat or straight up.
- **Solid physics**: fixed 120 Hz steps (same speed on 60/120/144 Hz screens) and swept circle-vs-rectangle collision, so the ball never tunnels through bricks or the paddle.
- **Juice**: particles, brick flashes and ghosts, ball trails, screen shake, score popups, level intros and an attract-mode demo behind the title screen.
- **Sound**: synthesised WebAudio effects (paddle, bricks pitched by row, walls, steel, lasers, power-ups, lives, level clear), mute saved.
- **Mobile**: drag anywhere to steer, tap to launch, a tall playfield on portrait phones, crisp on high-DPI screens, no page scroll or zoom.
- Pause (auto-pauses when the tab is hidden), game-over screen and saved best scores per mode.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | Mouse, or Left/Right, A/D | Drag anywhere |
| Launch / release a caught ball | Click, Space or Up | Tap |
| Fire lasers | Click or Space (hold to auto-fire) | Second finger or the FIRE button |
| Pause | P or Esc (or the pause button) | Pause button |
| Mute | M (or the speaker button) | Speaker button |
| Start / play again | Enter | Play button |

## Run locally

```
python server.py    # http://localhost:8080
```
