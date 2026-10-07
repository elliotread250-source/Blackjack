# Blackjack

A single-page blackjack table with play-money chips. No accounts, no real money,
no backend: the whole game runs in the browser and your bankroll lives in
`localStorage`.

## All the games

**Blackjack (this table):** https://blackjack-production-0312.up.railway.app, also on [GitHub Pages](https://elliotread250-source.github.io/Blackjack/)

**Geometry Dash replica:** https://game-production-8782.up.railway.app (online levels, leaderboard and cloud saves), offline copy on [GitHub Pages](https://elliotread250-source.github.io/Blackjack/geometry-dash/)

**Apex GP (first-person F1 racing, solo or peer-to-peer multiplayer):** https://elliotread250-source.github.io/Blackjack/apex-gp/

**2 Weeks (build-and-shoot battle royale against 24 bots):** https://elliotread250-source.github.io/Blackjack/2-weeks/

**BlockForge (creative-mode voxel sandbox, 400+ blocks):** https://blockforge-web-production.up.railway.app, also on [GitHub Pages](https://elliotread250-source.github.io/Blackjack/blockforge/dist/)

**Humanizer (AI text to human text, free, no API keys):** https://humanizer-production-e796.up.railway.app, also on [GitHub Pages](https://elliotread250-source.github.io/Blackjack/humanizer/) (no ZeroGPT, no sign-in-free mode)

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

Apex GP is at `/apex-gp/` and 2 Weeks at `/2-weeks/`. Both load three.js from
jsDelivr and use ES modules, so they need the server (opening the file directly
won't work). Blackjack is fine opened straight from `index.html`. The server is
only there for hosts that need something listening on `$PORT`.

## Deploying

Every push to `main` publishes to GitHub Pages via `.github/workflows/pages.yml`.
The Dockerfile and `railway.json` are here too, so the same repo deploys to
Railway (or anything that takes a container) without changes.
