# Pool

English pool (UK 8-ball / blackball) in the browser: seven reds, seven yellows and the black on a 7ft pub table, with careful physics, bots from Easy to Pro, pass-and-play on one device and online rooms with share links and quick match. Choose classic pub rules (two shots after a foul) or Blackball (WPA/EPA) rules with ball in hand anywhere. Vanilla JavaScript and a canvas: no build step, no libraries, no external requests.

## Features

- **Real physics**: fixed 240 Hz steps with continuous collision detection inside every step, so nothing tunnels even at full power. Sliding and rolling friction with the natural slide-to-roll transition, follow, draw and stun, side spin that changes cushion rebounds, rounded pocket knuckles that swallow slow balls and rattle fast ones out, simultaneous impacts so the break spreads the pack. Deterministic: the same shot always plays out the same way.
- **English table**: 2:1 pub table with wooden rails and sights, cushions with rounded noses, tight round pockets, baulk line, D and black spot, green or blue cloth. Glossy shaded balls rendered per pixel, with surface marks that roll and spin.
- **Two rule sets**: Pub rules (default) and Blackball (WPA/EPA), remembered between visits. Optional "call the black's pocket".
- **Bots**: Easy, Medium, Hard and Pro. They pick pots with the ghost-ball method, test the best options in the physics engine (pace, spin, position for the next shot, in-off risk, the black), replay them with their own aim error, play safe or snooker when nothing is on, kick off cushions when snookered, exploit the free shot and play out of baulk. Stats per level are saved.
- **2 players** on one device (pass and play).
- **Online**: create a room and share the 4-letter code or link, join by code, open a link to join straight away, or use quick match. Names, turn and connection indicators, your opponent's cue moves live while they aim, rematch, and "continue vs bot" if your opponent leaves.
- **Aiming help**: aim line, ghost ball, object-ball and cue-ball paths (long on Easy, shorter on harder levels), red cross when the ball you are aiming at would be a foul.
- **Sound**: synthesised cue strike, clacks, cushions, pocket drops, foul buzz and jingles. Mute is saved.
- **Responsive**: landscape and desktop show the table across the screen; portrait phones get it upright. Crisp on high-DPI screens, smooth on 60 and 120 Hz, no page scroll or zoom.

## Rules

Break from anywhere behind the baulk line; at least two balls must reach a cushion (or one be potted). A black potted on the break means a re-rack and the same player breaks again. The table is open after the break and the first player to legally pot a red or yellow takes that colour. Clear your colour, then pot the black to win.

Fouls: in-off (or the cue ball leaving the table), missing every ball, hitting an opponent's ball or the black first when not on the black, potting an opponent's ball, no ball reaching a cushion after contact when nothing is potted. Potting the black before your colour is cleared, or fouling while potting it, loses the frame.

- **Pub rules**: after a foul the opponent has two shots (two visits), and the first is a free shot on which any ball may be hit first. Potting one of your own keeps you at the table and you keep the remaining visit. Only one visit on the black. After an in-off the cue ball is in hand behind the baulk line and must be played out of baulk.
- **Blackball (WPA/EPA)**: after any foul the opponent has the cue ball in hand anywhere and one visit.

## Controls

| Action | Mouse / keyboard | Touch |
| --- | --- | --- |
| Aim | Move the mouse over the table (Shift for fine aim), Left/Right arrows | Drag anywhere on the table, or tap a ball |
| Fine aim | Arrow keys (Shift for tiny steps), fine-aim wheel | Fine-aim wheel |
| Shoot | Press on the table, pull back, release; or Up/Down for power and Space | Drag the power bar and let go |
| Spin | Click the cue-ball button and place the tip | Tap the cue-ball button and place the tip |
| Ball in hand | Drag the cue ball | Drag the cue ball |
| Call the black's pocket | Click a pocket (when calling is on) | Tap a pocket |
| Menu / mute | Esc / M (or the buttons) | Buttons |

## How online play works

`server.py` serves the game and a small WebSocket relay at `/ws` on the same port (Railway terminates TLS and proxies the socket). It pairs two players by room code or through the quick-match queue (one queue per rule set), deals the rack seed and who breaks, runs the rematch vote, expires rooms nobody joins and relays game messages. Play is turn-based and shooter-authoritative: the player at the table sends the shot (direction, speed, spin and the cue-ball spot when in hand), both browsers run the same deterministic simulation for the animation, then the shooter sends where the balls stopped and the rules state, and the other side snaps to it (in practice there is nothing to correct). While someone aims, their cue angle and power stream about ten times a second so you can watch them line up. All incoming messages are validated.

## Run locally

```
python server.py    # http://localhost:8080
```
