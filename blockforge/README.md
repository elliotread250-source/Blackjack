# BlockForge

A creative-mode voxel sandbox that runs entirely in the browser. Infinite seeded worlds, 400+ blocks, real shaders, and every texture painted by code at 16x16 so it keeps that chunky pixel look. No installs, no plugins, no downloads at runtime.

**Play:** https://blockforge-web-production.up.railway.app

**Offline copy:** open the title screen and pick "Download offline version", or grab `dist/blockforge.html` from this repo. It's one self-contained file, so it runs from a USB stick or a downloads folder when a school network blocks the site.

## Controls

| Key | Action |
|---|---|
| W A S D | Move |
| Mouse | Look (click the game to capture the mouse) |
| Space | Jump. Double-tap to toggle flying, hold to rise while flying |
| Shift | Sneak, or descend while flying |
| Ctrl, or double-tap W | Sprint |
| Left click | Break a block (hold to keep breaking) |
| Right click | Place a block, open doors and trapdoors |
| Middle click | Pick the block you're looking at |
| 1 to 9, scroll wheel | Choose a hotbar slot |
| E | Creative inventory (search, tabs, drag or shift-click into the hotbar) |
| Esc | Pause menu |
| F1 | Hide the HUD |
| F2 | Screenshot (downloads a PNG) |
| F3 | Debug overlay: fps, coordinates, chunks, GPU |

Every key and mouse button above (except Esc) can be rebound under Options > Controls. Click a binding, press the new key or mouse button, and keys used twice show up in red. Reset Keys puts everything back.

Ctrl+W closes a browser tab, and it sits right next to the sprint key. BlockForge asks before the tab closes and saves your world, but double-tap W or the "Fullscreen on play" option (which lets the game keep Ctrl+W) avoids the problem entirely.

## Graphics presets and shader packs

Low is the default and targets 60 fps on integrated Intel graphics and Chromebooks at render distance 4: fast leaves, no shadow pass, pixel ratio 1. Medium switches to the Fancy shader pack at render distance 6, High to Ultra at render distance 8. Every option can be changed on its own under Options.

Shader packs live under Options > Shaders (or the button on the pause menu). Off is the plain fast look. Fancy adds sun and moon shadows, waving plants and leaves, and reflective water with ripples and sun glints. Ultra adds HDR bloom on torches, lava and glowstone, god rays around the sun, height fog, and mirror reflections of the world on lakes and oceans. Ultra wants a proper graphics card.

## Resource packs

Options > Resource Packs has a few built-in looks (Smooth, Retro, Vivid, Pastel) painted from the same procedural textures. Import Pack loads a standard 16x16 texture pack .zip from your own computer. The textures are read in the browser and stored only there (IndexedDB), never uploaded, and the imported pack switches itself back on every time you open the game. Remove Import deletes it again.

## Running it yourself

```bash
npm install
npm run build      # writes dist/index.html, dist/assets/blockforge.js and dist/blockforge.html
npm start          # serves dist/ on $PORT (default 8080)
```

`npm run watch` rebuilds on save. The server is a few lines of Express (`server.js`) with a `/healthz` route for Railway and `/download` for the offline file.

## Deployment

Railway builds the `Dockerfile` (Node 22, `npm ci`, `npm run build`) and runs `node server.js`. Every push to the deploy branch redeploys automatically once the Railway GitHub app has access to the repo; until then a deploy can be started from the Railway dashboard.

## How it's put together

`ARCHITECTURE.md` is the contract between modules. The short version: the block registry (`src/blocks/registry.ts`) is pure data, so adding a block is one entry. Terrain generates in Web Workers, lighting is a flood-fill engine on the main thread, meshing runs in workers with smooth lighting and ambient occlusion, and everything renders through Three.js 0.162 (WebGL2 with a WebGL1 fallback) using custom shaders for terrain, water, lava, sky and shadows. Ultra renders the scene into a half-float target and runs bloom, god ray and fog passes over it, plus a half-resolution mirror pass for water at sea level. Worlds save to IndexedDB in your browser. Restore Defaults on the Options screen resets every option and key binding, and Continue on the title screen jumps back into your last world.

BlockForge is an original project. It isn't affiliated with any other game and uses no third-party game assets.
