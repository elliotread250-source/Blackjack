# Wordle

A faithful remake of the daily word game: find the hidden five-letter word in
six guesses, with each guess coloured to show which letters are in the right
spot (green), in the word but elsewhere (yellow) or not in it at all (grey).
It looks and plays like the NYT original, with the same tile flips, shakes and
toasts. On top of that there is an Unlimited mode for when one puzzle a day
isn't enough, separate statistics for each mode, and high-contrast colours.
Everything is plain HTML, CSS and JavaScript with no libraries and no network
requests. The sounds are synthesised in the browser with WebAudio.

- **Daily**: one word a day, the same for everyone, picked from the answer list
  by your local date. It changes at local midnight, with a countdown to the next
  one. Your game is saved, so a reload (or closing the tab) picks up where you
  left off, and a finished day stays finished.
- **Unlimited**: a new random word whenever you like (recent words are not
  repeated). Press **New** for another word, or tap it twice mid-game to give up
  and see the answer.
- Correct duplicate-letter handling: green letters are matched first, then
  yellows from left to right, only as many as the word actually contains
  (answer ABBEY, guess BABES: yellow, yellow, green, green, grey).
- **Hard mode**: revealed hints must be used. Greens stay put and every green or
  yellow letter must appear again (twice if two copies were revealed), with
  the usual "1st letter must be C" / "Guess must contain O" messages. It can
  only be switched on at the start of a round, and shared results get a `*`.
- The original look: pop as you type, staggered 3D flips on reveal, a shake
  with "Not in word list" or "Not enough letters", a bounce on a win with
  Genius / Magnificent / Impressive / Splendid / Great / Phew, and the answer
  shown if you run out of guesses.
- An on-screen keyboard whose keys take the best colour each letter has
  earned. It works alongside a physical keyboard.
- Statistics like the original (played, win %, current and max streak, guess
  distribution with your latest result highlighted), kept separately for
  Daily and Unlimited. The daily streak only continues from yesterday's win.
- **Share** copies the familiar emoji grid, e.g. `Wordle (Open Arcade) 281 4/6`,
  using the phone's share sheet or the clipboard. It respects dark mode (⬛)
  and high contrast (🟧🟦).
- Dark theme (follows your system until you choose) and a high-contrast mode
  with orange and blue for colour-blind players.
- Quiet synthesised sounds for key taps, tile flips, invalid guesses and wins,
  with a mute button. Settings, statistics and games in progress are kept in
  `localStorage`, and the game still works if storage is blocked.
- Fits any screen without scrolling, from a 360x640 phone up to a desktop.
  The tiles and keys scale to the space available, and landscape phones get
  the keyboard beside the board.

**Controls.** Type letters on your keyboard or tap the on-screen keys. `Enter`
submits a guess and `Backspace` deletes a letter. After an Unlimited game,
`Enter` starts the next word. `Esc` closes a window. The header buttons open
How to play (?), Statistics, Sound and Settings (hard mode, dark theme, high
contrast).

**Word lists.** `js/words.js` holds 2,333 possible answers and 8,786 accepted
guesses. The answers are common words chosen for this game: the most common
levels (10-35) of [SCOWL](http://wordlist.aspell.net/), minus plurals, `-ed`
forms, odd comparatives, slang and anything crude, plus a hand-picked set of
familiar words. They are not the NYT list. The accepted guesses are every answer
plus the five-letter words of the public-domain ENABLE word list and SCOWL
levels 10-70, with slurs and strong profanity removed. SCOWL is Copyright
2000-2018 Kevin Atkinson and used under its permissive licence. The full
notice is in `js/words.js`. Not affiliated with The New York Times.

```bash
python server.py    # http://localhost:8080
```
