# Blackjack

A single-page blackjack table with play-money chips. No accounts, no real money,
no backend: the whole game runs in the browser and your bankroll lives in
`localStorage`.

**All the games in one place: https://open-arcade.up.railway.app**

| Game | Live on Railway | Code |
| --- | --- | --- |
| Blackjack | https://blackjack-production-0312.up.railway.app | this folder |
| Geometry Dash replica | https://game-production-8782.up.railway.app | `geometry-dash/` |
| Getting Over It | https://over-a-barrel-production.up.railway.app | separate project (`over-a-barrel` on Railway) |
| BlockForge | https://blockforge-web-production.up.railway.app | `blockforge/` |
| Apex GP (F1) | https://apex-gp-production.up.railway.app | [apex-gp](https://github.com/elliotread250-source/apex-gp) |
| 2 Weeks | https://two-weeks-production.up.railway.app | [2-weeks](https://github.com/elliotread250-source/2-weeks) |
| The Humanizer | https://humanizer-production-e796.up.railway.app | `humanizer/` |

The hub itself lives in `arcade/`. Add a game by adding one entry to `ITEMS`
in `arcade/index.html`.

**Play it: https://elliotread250-source.github.io/Blackjack/**

**Geometry Dash replica: https://elliotread250-source.github.io/Blackjack/geometry-dash/**

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
