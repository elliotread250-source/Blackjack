# Pong

A remake of Atari's 1972 arcade Pong: white blocks on black, a dashed net,
big block-digit scores and the original three beeps (459 Hz paddle, 226 Hz
wall, 490 Hz point).

The paddle is split into eight segments like the original, so where the
ball hits decides its angle. The ball never stops speeding up during a
rally: 7% faster on every paddle hit plus a steady creep while it's in
play, so long rallies turn frantic fast. It resets on every serve. First to 11 wins.

- 1 player against the CPU (Easy, Normal, Hard). Normal goes either way
  against a decent player; Hard is tough but beatable.
- 2 players on one keyboard (W/S and Up/Down) or one touch screen (each
  half of the screen drives its own paddle).
- Online: Play Online, then Create Room gives a 4-letter code and an
  invite link (tap the lobby to copy or share it). The other player picks
  Join Room and types the code, or just opens the link. The host plays the
  left paddle and runs the game; the guest's paddle and the ball stay in
  sync over a WebSocket. Leaving or losing the connection drops both
  players back to the menu.
- Optional CRT look: glow, scanlines and vignette.

P or Esc pauses offline (Esc leaves the room online); Q from the pause screen goes back to the menu.

```bash
python server.py    # http://localhost:8080, includes the /ws rooms
```

The server is stdlib Python: static files plus a small WebSocket relay that
pairs two players by room code. The GitHub Pages copy connects to the Railway
server for online games.
