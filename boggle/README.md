# Boggle

The letter-cube word game: shake the tray, then find as many words as you can
in adjacent letters before the sand runs out. It uses the real dice: the 16
cubes of modern Boggle for the classic 4x4 board and the 25 cubes of Big
Boggle for 5x5. Each shake drops every cube in a random cell showing a random
face. Plain HTML, CSS and vanilla JS, with no build step and no libraries. The
sounds are synthesised with WebAudio, and the only download is the word list.

- **Rules as on the box**: words follow touching cubes (sideways, up, down or
  diagonal), each cube used once per word. Minimum length is 3 letters (4 in
  Big Boggle). **Qu** is one cube that counts as two letters for length and
  score. Scoring: 3-4 letters 1, 5 letters 2, 6 letters 3, 7 letters 5, 8 or
  more 11.
- **3:00 rounds** (4:00 for Big Boggle) with a ticking last ten seconds, or a
  relaxed mode with no clock (Solo only).
- **Three ways to enter words**. Drag across the cubes with a mouse or finger.
  Hit areas are circles, so a diagonal swipe on a phone doesn't clip the cubes
  beside it, and sliding back onto the previous cube takes it off again. Or tap
  cubes one at a time and tap the last one again (or press Submit). Or type on
  a keyboard: the path lights up as you type and `Enter` submits.
- A line traces the path, the word builds up above the board, and every
  submission gets an answer: points for a good word, or "Already found", "Not
  a word", "Not on the board" or "Too short", with small animations and
  sounds.
- **Solo or against the CPU** (Easy, Normal or Hard). The CPU picks its words
  from the board's real solutions, short familiar words on Easy and longer,
  rarer ones on Hard. Its word count ticks up as it goes. At the end, words you
  both found are crossed out and score for neither, as in the real game.
- **Results**: your words with points, the CPU's words, the cancelled words,
  and every word on the board from the solver, grouped by length, with the
  longest starred and the share you found. Tap any word to trace it on the
  board.
- **Daily board**: one 4x4 and one 5x5 board a day, seeded by the date, so
  everyone gets the same letters. The first score each day is kept. Random
  boards are unlimited. Boards with fewer than 30 words are reshaken.
- **Turn** rotates the board a quarter turn, like turning the tray to see the
  words differently.
- Best scores, averages, words found, the longest word you've found and your
  record against the CPU are kept per board size in `localStorage`. The game
  still works if storage is blocked. It pauses if you switch tabs, and hides
  the board while paused.

**Controls.** Drag, tap or type. `Enter` submits, `Backspace` removes a
letter, `Esc` clears the word (or pauses when there is nothing to clear), and
`←`/`→` turn the board.

**Word list.** `words.txt` is the public-domain ENABLE list (172,724 words of
3 to 25 letters). The server sends the gzipped copy, `words.txt.gz` (~450 KB),
to browsers that accept gzip and lets them cache it for a week. The page
loads it once into a sorted array and a `Set`. The solver needs no trie
because each prefix is a contiguous run of the sorted list: a depth-first
search over the board narrows that run with two binary searches per cube and
drops the branch when it empties. That takes a few milliseconds per board.

The rules (dice, shaking, adjacency, solver, scoring, cancellation, the daily
seed and the CPU) are in `js/logic.js`, which has no DOM code and is tested
from Node:

```bash
node tools/test.cjs   # unit tests, no dependencies
python server.py      # http://localhost:8080
```

Boggle is a trademark of Hasbro. This is a fan remake and is not affiliated
with Hasbro.
