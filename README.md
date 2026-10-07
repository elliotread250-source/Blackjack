# Blackjack

A single-page blackjack table with play-money chips. No accounts, no real money,
no backend: the whole game runs in the browser and your bankroll lives in
`localStorage`.

**Play it: https://elliotread250-source.github.io/Blackjack/**

**Geometry Dash replica: https://elliotread250-source.github.io/Blackjack/geometry-dash/**

**Bloons TD 6 replica: https://game-production-6f5d.up.railway.app** (also at https://elliotread250-source.github.io/Blackjack/bloons-td-6/)

**Flappy Bird replica: https://game-production-2b7d2.up.railway.app** (also at https://elliotread250-source.github.io/Blackjack/flappy-bird/)

**Humanizer (AI text to human text, free, no API keys): https://humanizer-production-e796.up.railway.app**

## Rules on the table

Six-deck shoe, reshuffled at the cut card (~25% penetration) so counting it down
gets you nowhere. Blackjack pays 3:2. Dealer stands on all 17s, soft ones
included. Double on any two cards. Split up to four hands; split aces get one
card each and no blackjack bonus.

Keyboard: `H` hit, `S` stand, `D` double, `P` split, `Enter` deal, `R` rebet,
`C` clear.

## Running it locally

```bash
python server.py          # http://localhost:8080
```

Or just open `index.html` in a browser. The server is only there for hosts that
need something listening on `$PORT`.

## Deploying

Every push to `main` publishes to GitHub Pages via `.github/workflows/pages.yml`.
The Dockerfile and `railway.json` are here too, so the same repo deploys to
Railway (or anything that takes a container) without changes.
