# Wreck Run

A 3D arcade driving game: two minutes in a souped-up hatchback in a busy little town, smashing everything
that isn't alive.

- **26 kinds of smashable things** (cones, barrels, bins, mailboxes, hydrants, newspaper boxes, parking
  meters, benches, signs, planters, crates, vending machines, phone booths, fruit stands, gnomes, snowmen,
  beach balls, hay bales, pumpkins, piñatas, flamingos, inflatable dinosaurs, statues, giant donut signs,
  TVs and pianos), worth 10 to 150 points, more the faster you hit them.
- **Combos** up to ×10 for smashing things within three seconds of each other; **drift points** for
  handbrake slides; **air time** points off the ramps in the plazas; **stars** worth 500; **clocks** for
  +8 seconds; **nitro** refills. Smashed things come back after a while.
- **People, cyclists, skaters and animals** walk the streets and parks. They are never hurt: bump one and
  your car stops dead, you lose 250 points and your combo, and they get a fright.
- Detail: textured buildings with shopfronts and awnings, rooftop clutter, parks with fountains and trees,
  plazas, zebra crossings, traffic lights and street lamps, flying debris, tyre smoke, skid marks, a nitro
  flame, a rotating minimap and a speed-sensitive chase camera.
- **Global leaderboard** (world top 20, your rank after each run), stored on a Railway volume at `/data`.
- Keyboard (WASD / arrows, Space to drift, Shift for nitro) or on-screen touch controls on phones.

`node tools/test.mjs` checks the town layout, driving, smashing and combos, drifting, ramps, pickups, that
people and animals are never harmed, and that the car never ends up inside a building.
