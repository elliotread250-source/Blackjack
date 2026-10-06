# Blackjack

A single-page blackjack table with play-money chips. No accounts, no real money,
no backend: the whole game runs in the browser and your bankroll lives in
`localStorage`.

**Play it: https://elliotread250-source.github.io/mini-games/blackjack/**

## Rules on the table

Six-deck shoe, reshuffled at the cut card (~25% penetration) so counting it down
gets you nowhere. Blackjack pays 3:2. Dealer stands on all 17s, soft ones
included. Double on any two cards. Split up to four hands; split aces get one
card each and no blackjack bonus.

Keyboard: `H` hit, `S` stand, `D` double, `P` split, `Enter` deal, `R` rebet,
`C` clear.

## Running it locally

```bash
cd blackjack
python server.py          # http://localhost:8080
```

Or just open `index.html` in a browser. The server is only there for hosts that
need something listening on `$PORT`.

## Deploying

Every push to `main` publishes the whole repo to GitHub Pages via
`.github/workflows/pages.yml`, so this folder lands at `/blackjack/`.
The Dockerfile and `railway.json` are here too: point a Railway service at this
repo with its root directory set to `/blackjack` and it deploys without changes.
