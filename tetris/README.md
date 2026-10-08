# Tetris

A modern-guideline Tetris for the browser. The playfield, pieces and logo are drawn on a canvas from bevelled blocks generated at the exact device-pixel cell size, so they stay crisp on any screen, and every sound (including a chiptune Korobeiniki) is synthesised with WebAudio. Nothing is downloaded beyond the page and its scripts. The title screen runs an attract demo: an AI plays a real game behind the menu.

Faithful bits:

- 10x20 matrix with a hidden buffer above it; pieces spawn in the middle columns in guideline colours (I cyan, O yellow, T purple, S green, Z red, J blue, L orange)
- 7-bag randomiser, 5-piece next queue, hold (once per drop), ghost piece
- SRS rotation with the full J/L/S/T/Z and I wall-kick tables (checked against the offset-table form of SRS), plus 180° rotation using the SRS+ kicks
- DAS 170 ms / ARR 50 ms, soft drop at 20x gravity, hard drop, 500 ms lock delay with up to 15 move/rotate resets per lowest row
- Guideline gravity `(0.8 - (level-1) * 0.007)^(level-1)` seconds per row, level up every 10 lines, start level 1-15
- Scoring: 100/300/500/800 x level, T-spins and T-spin minis by the 3-corner rule (with the TST kick upgrade), back-to-back x1.5, combos 50 x combo x level, perfect clear bonus, soft drop 1 per cell and hard drop 2 per cell
- Line clears flash, then collapse; block-out and lock-out top-outs
- Marathon (endless) and 40 Lines sprint, with best score and best time saved

Controls: Left/Right move, Down soft drop, Space hard drop, Up or X rotate clockwise, Z or Ctrl rotate counter-clockwise, A rotate 180°, C or Shift hold, P or Esc pause, M mute, N music on/off, Enter start or restart. On a phone, tap to rotate, drag sideways to move one cell per cell dragged, drag down to soft drop, flick down to hard drop and swipe up to hold. A row of buttons (◀ ▶ ⟲ ⟳ ▼ HOLD DROP) does the same. The game pauses itself when the tab is hidden.

```
python server.py    # http://localhost:8080
```
