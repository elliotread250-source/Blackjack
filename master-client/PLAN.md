# Master Client: build plan

A companion launcher for Minecraft Bedrock Edition on Windows. Everything it changes
in-game goes through official Add-Ons (resource packs, behaviour packs, JSON UI).
Everything else is either a separate overlay window fed by Windows and your own
input, or a pointer to the setting Minecraft already has.

## Hard rules the code follows

No DLLs, no hooks into `Minecraft.Windows.exe`, no memory reads or writes, no
touching game traffic, no login or ownership bypass, no combat or movement
features, no simulated input. If a feature needs any of that, the module ships
greyed out with a one-line reason instead of a workaround.

## Folder structure

```
master-client/
├── package.json               scripts: dev, build, typecheck, test, dist
├── electron.vite.config.ts    main / preload / renderer (two pages: app + overlay)
├── electron-builder.yml       NSIS installer, GitHub publish, extra resources
├── build/                     icon.ico, icon.png (drawn by scripts/make-icons.mjs)
├── resources/                 tray icon; bin/PresentMon.exe is fetched in CI
├── addons/                    starter Add-Ons shipped with the app
│   ├── master_clean_ui/         resource pack
│   ├── master_tools_bp/         behaviour pack, Script API (magnet, recall charm, glow wand)
│   ├── master_tools_rp/         textures + names for the tools
│   └── master_visuals/          vanilla-compatible visuals pack
├── scripts/                   icon renderer, add-on asset generator, vanilla snapshot
├── src/
│   ├── shared/                module catalog, settings schema, HUD types, IPC contract
│   ├── main/
│   │   ├── index.ts             lifecycle, single instance, tray, updater
│   │   ├── windows/             main window, overlay window
│   │   ├── auth/                SQLite (sql.js) accounts, bcrypt, recovery codes, safeStorage
│   │   ├── bedrock/             install detection, UWP + GDK data folders, launch
│   │   ├── packs/               pack engine and every generator (JSON UI, fog, particles,
│   │   │                        render controllers, animations, textures, behaviour pack)
│   │   ├── addons/              starter add-on install, .mcpack/.mcaddon import + scan
│   │   └── overlay/             uiohook input, PresentMon, server ping, CPU/GPU/RAM, hotkeys
│   ├── preload/               contextBridge API (window.mc)
│   └── renderer/
│       ├── index.html           launcher window
│       ├── overlay.html         transparent overlay window
│       └── src/                 pages, HUD editor, module UIs, overlay app
└── test/                      unit tests (vitest) for auth, packs, importer, catalog
```

Repo root gets `.github/workflows/master-client-release.yml` (tag `master-client-v*`
builds the NSIS installer on `windows-latest` and publishes a GitHub Release with
`latest.yml` for electron-updater) and `master-client-ci.yml` (typecheck, tests and
a build on every push that touches `master-client/`).

## Engines

| Engine | What it is | When changes apply |
| --- | --- | --- |
| Pack | Generated "Master Client" resource pack in `development_resource_packs`, added to global packs | When you rejoin a world or server |
| Overlay | Frameless, transparent, click-through, always-on-top window. Data from Windows and your own input only | Instantly |
| Vanilla link | The setting already exists in Minecraft. Toggle is a reminder with steps | When you set it in game |
| Behaviour | Generated behaviour pack for your own worlds only | When you enable it on a world and load it |

## HUD modules

| # | Module | Engine | Available | Notes |
| --- | --- | --- | --- | --- |
| 1 | Speed display | none | No | Needs player position from game memory |
| 2 | Potion HUD | Pack | Yes | Moves the vanilla effect renderer; background style only |
| 3 | Reach display | none | No | Reads combat data |
| 4 | Ping | Overlay | Yes | "Server ping (external)": RakNet status ping to the address you enter, ICMP fallback |
| 5 | Packet display | none | No | Needs game traffic interception |
| 6 | Paper doll | Pack | Yes | Position and size; needs Show Paper Doll on in game |
| 7 | Scoreboard | Pack | Yes | Position, text colours, hide score numbers |
| 8 | Chat | Pack | Yes | Position, width, background opacity, line count, text style |
| 9 | Boss bar | Pack | Yes | Position; size is fixed by the game |
| 10 | Keystrokes | Overlay | Yes | WASD, Space, Shift, LMB, RMB, rebindable, press animations |
| 11 | Player list | Pack | Yes | Restyles the pause-screen player list; not on the HUD |
| 12 | Item counter | Pack | Partial | Restyles stack counts. Inventory-wide totals aren't exposed to JSON UI |
| 13 | FPS | Overlay | Yes | PresentMon (ETW). Needs admin or Performance Log Users once |
| 14 | CPS | Overlay | Yes | Left and right, from your own clicks |
| 15 | Armor HUD | Pack | Partial | Moves the vanilla armour bar. Per-slot items and durability aren't exposed to the HUD |
| 16 | Coordinates | Vanilla link + Pack | Yes | Turn on Show Coordinates in game; pack moves and restyles it |
| 17 | Debug menu | Overlay | Yes | FPS, frame time, ping, CPS, CPU, GPU, RAM. No game data |

## Visuals modules

| # | Module | Engine | Available | Notes |
| --- | --- | --- | --- | --- |
| 1 | Zoom | Overlay | Yes | Screen-capture magnifier, hold or toggle, scroll zoom |
| 2 | View model | Pack | Yes | Held-item position, rotation, scale via first-person animation override |
| 3 | XP info | Pack | Yes | Level and progress text by the XP bar |
| 4 | Time changer | Behaviour | Yes | Own worlds only |
| 5 | Snap look | Vanilla link | Yes | Perspective toggle key; no simulated input |
| 6 | Post processing | Vanilla link | Yes | Graphics mode, Vibrant Visuals |
| 7 | Motion blur | none | No | No supported hook |
| 8 | No death rotation | none | No | The death tilt is applied by the engine, not by an animation packs can override |
| 9 | Projectile scalar | Pack | Yes | Client-entity scale for arrows, tridents, pearls, snowballs, eggs |
| 10 | Minimal view bobbing | Vanilla link | Yes | View bobbing and camera shake |
| 11 | Low fire | Pack | Yes | Regenerated flame atlas with height and opacity |
| 12 | Hitboxes | none | No | Needs entity data from game memory |
| 13 | Left hand | none | No | Packs can move the arm but can't mirror the model or swing |
| 14 | Hit particles | Pack | Yes | Recolour and resize crit particles |
| 15 | Hit color | Pack | Yes | `is_hurt_color` on player and common mob render controllers |
| 16 | Full bright | Vanilla link + Pack + Behaviour | Yes | Brightness slider everywhere; ambient light boost with Vibrant Visuals; night vision in own worlds |
| 17 | GUI scale | Vanilla link | Yes | |
| 18 | Free look | none | No | Needs camera control from game memory |
| 19 | FOV changer | Vanilla link | Yes | |
| 20 | Dark mode | Pack | Yes | Dark menu and inventory textures with your accent |
| 21 | Fog | Pack | Yes | Per-dimension distance and colour via fog definitions |
| 22 | Crosshair | Pack + Overlay | Yes | Pixel editor and presets for the texture, optional overlay crosshair |
| 23 | Crystal optimizer | none | No | Changes entity removal and hit processing |
| 24 | Chunk borders | none | No | No supported hook |
| 25 | Client-side hit register | none | No | Changes hit registration |
| 26 | Block outline | Vanilla link | Yes | Colour and thickness can't be changed by packs under RenderDragon; links to Outline Selection |
| 27 | Better name tags | none | No | Name tags are drawn by the engine; packs can't change their background or shadow |

## Build order

1. GitHub Actions release workflow and CI
2. Launcher shell and local login
3. Bedrock launching and folder detection
4. Pack engine
5. HUD editor and HUD modules
6. Visuals modules
7. Overlay and Right Shift menu
8. Mods tab
9. Installer, tray, auto-update, first-run pin tip
