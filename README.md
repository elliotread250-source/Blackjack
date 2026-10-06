# Mini games

Small browser games, one folder each. No accounts, no backend state, no build
step: every game is static files you can open straight from disk.

Every push to `main` publishes the repo to GitHub Pages, so each folder is live at
`https://elliotread250-source.github.io/mini-games/<folder>/`.

## Games

1. [Blackjack](blackjack/): six-deck play-money table, 3:2 blackjack, splits and doubles.
   [Play it](https://elliotread250-source.github.io/mini-games/blackjack/)
2. [Geometry Dash replica](geometry-dash/): the Dash level, with practice difficulties and a shop.
   [Play it](https://elliotread250-source.github.io/mini-games/geometry-dash/)

## Also in here

[Humanizer](humanizer/): AI text to human text, free, no API keys.
[Use it](https://elliotread250-source.github.io/mini-games/humanizer/)

## Adding a game

Make a new folder with an `index.html` and add it to the list above and to the
root `index.html`. If it needs its own Railway service, copy a `Dockerfile`,
`server.py` and `railway.json` from `blackjack/` and set the service's root
directory to the new folder.
