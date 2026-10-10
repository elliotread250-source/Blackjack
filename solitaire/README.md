# Solitaire

Klondike Solitaire for the browser, played the way Windows taught everyone:
seven columns, a stock and waste, four foundations, Draw 1 or Draw 3, and the
bouncing-cards finale when you win. Every card is drawn as SVG (corner indices,
proper pip layouts, framed double-ended court cards and patterned backs), every
sound is synthesised live with WebAudio, and the game works the same with a
mouse or a finger. No build step, no dependencies, nothing downloaded.

## Features

- Standard Klondike rules: only kings (or king-led runs) go to empty columns,
  the exposed card turns over automatically, unlimited passes through the stock.
- Draw 1 or Draw 3, chosen from the New menu or Options and remembered.
- Windows standard scoring (waste to tableau +5, to foundation +10, turning a
  card +5, foundation back to tableau -15, recycling the waste -100 / -20) with
  the classic time bonus on a win. Vegas scoring (-$52 a deal, +$5 a card, one
  pass in Draw 1, three in Draw 3) or no scoring are options.
- Drag and drop single cards or whole runs, with a highlighted drop target and
  invalid drops gliding home. Tap or click a card to send it to the best legal
  spot (foundation first); double-click works too.
- Smooth animations: the deal, cards flying to their destinations, card flips,
  and the bouncing-cards cascade on a win.
- Unlimited undo, hints that cycle through useful moves, auto-complete once
  every card is face up, a "no more moves" notice, and New game or Restart this
  deal from the New menu (the deal number is shown there and on the win screen).
- Optional "winnable deals only": deals picked from a list that an offline
  solver (`js/solver.js`) has proven solvable.
- Responsive layout from a 360px phone to a desktop monitor: cards scale, long
  columns compress so nothing runs off the screen, compact large-index faces on
  small cards, and a side layout for phones in landscape.
- Statistics per draw mode (played, won, win rate, best time, best score,
  current and best streak) and the game in progress survive a refresh.
- Table colours and card backs to choose from.

## Controls

Mouse: drag cards between piles, click a card to move it to the best spot,
double-click to send it to the foundations, click the stock to turn cards and
click the empty stock to turn the waste back over. Touch: the same with taps and
drags; New, Undo and Hint sit in a bar at the bottom of the screen on phones.
Keys: N new game, U or Ctrl/Cmd+Z undo, H hint, Space or D draw, A
auto-complete, M sound on/off, Esc close menus.

```bash
python server.py    # http://localhost:8080
```
