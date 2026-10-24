# Tic Tac Toe

Noughts and crosses with neon marks that draw themselves in and a strike-through on the winning line.

- Play the computer on **Easy** (makes mistakes), **Medium** (always wins or blocks when it can) or
  **Impossible** (perfect play: it never loses), as ✕ or ◯ — or play a friend on the same device.
- Who goes first swaps every round. Scores are kept per mode and difficulty, and saved.
- Keys 1–9 play the squares (top-left to bottom-right); Enter or N starts the next round.
- Synthesised sounds, no libraries, no build step.

`node tools/test.mjs` checks the rules and plays the Impossible bot against every possible game to
prove it never loses.
