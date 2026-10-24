# Fruit Ninja

Swipe to slice the fruit thrown up from the bottom of the screen; don't slice the bombs.

- **Classic**: three missed fruit or one bomb ends the game. **Arcade**: 60 seconds; bombs cost 10 points;
  Frenzy bananas double points and Freeze bananas slow time. **Zen**: 90 seconds, no bombs.
- Slice a fruit on the menu to pick a mode, like the original.
- Ten fruit drawn in code (watermelon, pineapple, apple, orange, lemon, kiwi, plum, peach, coconut,
  strawberry) that split into two halves along your cut, juice splats that fade from the wooden board,
  combos for three or more fruit in one swipe, a glowing blade trail, synthesised sounds.
- Best score per mode is saved. Works with mouse or touch.

`node tools/test.mjs` checks the slicing geometry, flight, scoring, combos, bombs, lives, the clock and
both bananas.
