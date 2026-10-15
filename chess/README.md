# Chess

Full chess in the browser: play the computer on **Easy**, **Medium** or **Hard** as White or Black, or a
friend on the same device.

- Every rule: castling, en passant, promotion (pick the piece), check, checkmate, stalemate, threefold
  repetition, the fifty-move rule and insufficient material.
- Tap a piece then a square, or drag it. Legal moves are dotted, the last move and check are highlighted.
- Move list in standard notation, captured pieces with the material count, undo, flip the board, sounds.
- The computer is an alpha-beta search with quiescence and piece-square tables, running in a Web Worker so
  the page never freezes; Easy and Medium sometimes pick a slightly weaker move so they can be beaten.
- The game in progress is saved on your device.

`node tools/test.mjs` checks move generation against the standard perft counts (five positions), every
draw rule, notation, and that the computer finds mate and takes free material.
