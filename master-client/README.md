# Master Client

A companion launcher for Minecraft Bedrock Edition on Windows. Local login,
one-click PLAY, a drag-and-drop HUD editor, an overlay with keystrokes, CPS,
FPS and an external server ping, visual tweaks delivered as an official
resource pack, starter Add-Ons and a safe `.mcpack`/`.mcaddon` importer.

Everything it changes inside the game goes through official Bedrock Add-Ons.
It never injects into Minecraft, never reads or writes game memory, never
touches game traffic, never sends input to the game, and has no combat or
movement features. `test/safety.test.ts` fails the build if code ever reaches
for any of that. Anything that can't be built under those rules ships greyed
out with a one-line reason. The full module table is in [PLAN.md](PLAN.md).

Not an official Minecraft product. Not approved by or associated with Mojang
or Microsoft.

## How it reaches the game

| Engine | What it does | When it applies |
| --- | --- | --- |
| Pack | Writes the "Master Client" resource pack into `development_resource_packs` and puts it first in Global Resources | When you rejoin a world or server |
| Overlay | Transparent, click-through, always-on-top window. Data from Windows and your own input only | Instantly |
| In game | Settings Minecraft already has. Master Client shows the steps | When you set it |
| Own worlds | "Master Client World Tweaks" behaviour pack (time lock, night vision) | When you enable it on a world |

Some servers force their own resource packs, which can override pack modules.
The overlay needs Minecraft in borderless or windowed mode.

## Run it on Windows

You need Node.js 22 LTS and Git.

```powershell
git clone https://github.com/elliotread250-source/Blackjack.git
cd Blackjack\master-client
npm ci
npm run dev
```

`npm run dev` opens the launcher with hot reload. For the FPS module in dev,
drop PresentMon 2.3.0 (`PresentMon-2.3.0-x64.exe` from
github.com/GameTechDev/PresentMon releases) into `resources\bin\PresentMon.exe`.
The release workflow fetches and checksums it automatically.

Checks that also run in CI:

```powershell
npm run typecheck
npm test
npm run build
npm run dist        # builds dist\Master-Client-Setup-<version>.exe
```

## Test it stage by stage

Run `npm run dev` and work down this list. Each stage depends on the one
before it.

1. Release pipeline. Push the branch and open the Actions tab: "Master Client
   CI" should go green, and its `windows-installer` job uploads a preview
   installer you can download from the run page.
2. Login. Sign up, copy the recovery code, tick the box, continue. Close the
   app, reopen it: with "Remember me" ticked you go straight in. Log out from
   Settings, then use "Forgot password?" with the recovery code. You get a new
   code and the old one stops working. The database is
   `%APPDATA%\Master Client\accounts.sqlite`.
3. Launching. Home should say "Minecraft for Windows (GDK) is ready" (or UWP on
   older installs). Press PLAY and the game opens. Settings > Minecraft lists
   the folders it checked and which one it's using.
4. Pack engine. Turn on Fog in Visuals and drag the overworld sliders. Press
   Win+R, paste
   `%APPDATA%\Minecraft Bedrock\Users\Shared\games\com.mojang\development_resource_packs\MasterClient_RP`
   and check `manifest.json` bumps its version each time you change a pack
   setting. In game, Settings > Global Resources should list Master Client at
   the top. Join a world and the fog changes.
5. HUD editor. HUD > Edit HUD Layout. Drag modules, resize from the corner,
   watch the guides snap, make a second layout with the + button and switch
   between them. Turn on Chat and Coordinates, rejoin a world, and they sit
   where you put them.
6. Visuals. Try Low fire (stand in fire), Crosshair (draw one, rejoin), View
   model, Hit color and Dark mode. Full bright: with Graphics Mode on Vibrant
   Visuals the ambient boost brightens caves; in your own world, enable "Master
   Client World Tweaks" in the world's Behavior Packs and turn on night vision.
7. Overlay and Right Shift menu. Put Minecraft in borderless or windowed mode,
   start it, press Right Shift. The module grid opens over the game. Toggle
   Keystrokes and see it react to WASD and clicks. For FPS, press "Allow FPS
   reading" in Settings once, accept the Windows prompt, sign out of Windows
   and back in. Set a server address for Ping. Hold C for zoom.
8. Mods tab. Turn on Master Clean UI and Master Visuals (they appear in Global
   Resources). Turn on Master Tools, then enable it in a world's Behavior
   Packs and craft the magnet. Import any `.mcpack` to see the scan, and try a
   renamed `.exe` to see it rejected.
9. Installer. `npm run dist`, run `dist\Master-Client-Setup-0.1.0.exe`, check
   the desktop and Start Menu shortcuts, and the one-time "Pin to taskbar" tip
   on first launch.

## Releasing

1. Bump `version` in `package.json` (for example `0.2.0`) and commit.
2. Tag and push:

   ```powershell
   git tag master-client-v0.2.0
   git push origin master-client-v0.2.0
   ```

3. "Master Client release" builds the installer on Windows and publishes a
   GitHub Release with `latest.yml`. Installed copies find it within six hours,
   download it, and install it on quit (or from Settings > Updates).

The workflow refuses to run if the tag and `package.json` disagree. Releases
are published as full releases (not drafts), because the updater only sees the
repository's latest release.

## Privacy

The input hook only passes on the keys you've bound for keystrokes, zoom and
the menu, plus click counts for CPS. Nothing is logged, stored or sent
anywhere. Accounts are local: bcrypt-hashed passwords in a SQLite file, and
the "remember me" token encrypted with Windows DPAPI through Electron's
safeStorage. The only network calls are the server ping you configure,
GitHub Releases for updates and News, and nothing else.

## Known limits

Pack-engine HUD modules are JSON UI modifications written against Mojang's
vanilla files (bedrock-samples, September 2026). If a Bedrock update renames
those elements, a module can stop moving its element until Master Client
updates. Turning the module off restores vanilla.

Single-key hotkeys like Right Shift are read by the input hook, so the key
still reaches the game. Electron's own global shortcuts can't bind a modifier
key on its own; combos like Alt+M are registered with Windows instead.

Zoom works from a screen capture, so it's a frame behind the game, and
scrolling to zoom also scrolls your hotbar.
