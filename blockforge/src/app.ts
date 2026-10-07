// Boot: textures -> atlas -> icons -> font -> renderer -> UI -> title screen -> frame loop.
import { loadSettings, saveSettings, applyPreset } from './settings';
import type { Settings } from './settings';
import { injectStyles } from './ui/style';
import { loadPixelFont } from './ui/font';
import { buildIcons } from './ui/icons';
import { Menus } from './ui/screens';
import type { MenuHandlers } from './ui/screens';
import { Hud } from './ui/hud';
import { InventoryScreen } from './ui/inventory';
import { TouchControls } from './ui/touch';
import { buildAtlas } from './render/atlas';
import { Renderer } from './render/renderer';
import { Input } from './game/input';
import { Sounds } from './game/audio';
import { Hotbar, DEFAULT_HOTBAR } from './game/hotbar';
import { Game } from './game/game';
import { storage } from './world/storage';
import { BLOCKS, ID } from './blocks/registry';
import type { WorldMeta } from './types';

const VERSION = '1.0.0';

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function bootText(text: string) {
  const el = document.getElementById('boot');
  if (el) el.textContent = text;
}

function fatal(title: string, detail: string) {
  const el = document.getElementById('boot') ?? document.body.appendChild(document.createElement('div'));
  el.id = 'boot';
  el.innerHTML = '';
  const box = document.createElement('div');
  box.style.cssText = 'max-width:640px;padding:24px;line-height:1.5;text-align:center';
  const h = document.createElement('div');
  h.style.cssText = 'font-size:24px;margin-bottom:12px';
  h.textContent = title;
  const p = document.createElement('div');
  p.style.cssText = 'font-size:16px;opacity:.85;white-space:pre-line';
  p.textContent = detail;
  box.append(h, p);
  el.appendChild(box);
}

/** Text seeds hash like a string hashCode; numeric seeds are used as-is; blank is random. */
export function parseSeed(input: string): number {
  const s = input.trim();
  if (!s) {
    const a = new Uint32Array(1);
    try { crypto.getRandomValues(a); } catch { a[0] = (Math.random() * 2 ** 32) >>> 0; }
    return a[0] | 0;
  }
  if (/^-?\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isSafeInteger(n)) return n | 0;
  }
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function newWorldId(): string {
  const a = new Uint32Array(2);
  try { crypto.getRandomValues(a); } catch { a[0] = Date.now(); a[1] = (Math.random() * 1e9) | 0; }
  return 'w' + a[0].toString(36) + a[1].toString(36);
}

async function boot() {
  const settings: Settings = loadSettings();
  injectStyles(settings.guiScale);
  bootText('Painting textures…');
  await nextFrame();

  const fontReady = loadPixelFont().catch(() => undefined);
  const atlas = buildAtlas(settings.mipmaps);
  bootText('Carving block icons…');
  await nextFrame();
  const icons = buildIcons(atlas);
  await Promise.race([fontReady, sleep(1500)]);

  const canvas = document.createElement('canvas');
  canvas.id = 'game';
  canvas.tabIndex = 0;
  document.body.prepend(canvas);

  let renderer: Renderer;
  try {
    renderer = new Renderer(canvas, atlas, settings);
  } catch (e) {
    console.error(e);
    fatal(
      'BlockForge could not start 3D graphics',
      'Your browser did not give the page a WebGL context.\n\n' +
      'Try: Chrome or Edge settings > System > turn on "Use graphics acceleration when available", then restart the browser. ' +
      'On a managed school device, WebGL may be blocked by policy.',
    );
    return;
  }

  const uiRoot = document.createElement('div');
  uiRoot.id = 'ui';
  document.body.appendChild(uiRoot);

  const hotbar = new Hotbar();
  const input = new Input(canvas);
  input.enabled = false;
  const hud = new Hud(uiRoot, icons, hotbar);
  hud.setVisible(false);
  const inventory = new InventoryScreen(uiRoot, icons, hotbar);
  const sounds = new Sounds();
  sounds.setVolume(settings.volume);

  // Created before the game so it can be handed in; hooks reach the game lazily.
  let gameRef: Game | null = null;
  const touch = new TouchControls(uiRoot, input, hotbar, settings, {
    openInventory: () => gameRef?.openInventory(),
    pause: () => gameRef?.pause(),
    isFlying: () => !!gameRef?.player.flying,
    toggleFly: () => gameRef?.player.toggleFlight(),
  });
  const game = new Game({ renderer, input, hud, inventory, hotbar, sounds, settings, touch });
  gameRef = game;

  const handlers: MenuHandlers = {
    listWorlds: () => storage.listWorlds(),
    async createWorld(name: string, seedText: string) {
      sounds.unlock();
      const meta: WorldMeta = {
        id: newWorldId(),
        name: name.trim() || 'New World',
        seed: parseSeed(seedText),
        created: Date.now(),
        lastPlayed: Date.now(),
        player: null,
        hotbar: DEFAULT_HOTBAR.slice(),
        hotbarNames: DEFAULT_HOTBAR.map((id) => (id ? BLOCKS[id].name : '')),
        selected: 0,
        dayTime: 0.05,
        timeMode: 'cycle',
        palette: BLOCKS.map((b) => b.name),
        version: 1,
      };
      hotbar.load(DEFAULT_HOTBAR, 0);
      await storage.saveWorld(meta);
      await game.startWorld(meta);
    },
    async playWorld(id: string) {
      sounds.unlock();
      const meta = await storage.getWorld(id);
      if (!meta) { menus.showWorlds(); return; }
      await game.startWorld(meta);
    },
    deleteWorld: (id: string) => storage.deleteWorld(id),
    resume: () => game.resume(),
    saveAndQuit: () => game.saveAndQuit(),
    settingsChanged(s: Settings) {
      saveSettings(s);
      injectStyles(s.guiScale);
      game.applySettings(s);
    },
    getTimeMode: () => game.timeMode,
    setTimeMode: (m) => game.setTimeMode(m),
    offlineDownloadUrl: /^https?:$/.test(location.protocol) ? 'download' : null,
    version: VERSION,
  };
  const menus = new Menus(uiRoot, handlers, settings);
  game.menus = menus;

  // Click on the game view to grab the mouse again.
  canvas.addEventListener('mousedown', () => {
    if (game.state === 'playing' && !input.locked && !inventory.isOpen && !menus.isOpen()) void input.requestLock();
  });
  window.addEventListener('resize', () => renderer.resize());
  // Closing the tab mid-game (Ctrl+W is next to the sprint key) asks first, and we save.
  window.addEventListener('beforeunload', (e) => {
    if (game.state === 'playing' || game.state === 'paused') {
      void game.saveAll();
      e.preventDefault();
      e.returnValue = '';
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (game.state === 'playing' || game.state === 'paused')) {
      void game.saveAll();
      if (game.state === 'playing') game.pause();
    }
  });
  window.addEventListener('pointerdown', () => sounds.unlock(), { once: true });

  document.getElementById('boot')?.remove();
  menus.showTitle();

  const loop = (now: number) => {
    requestAnimationFrame(loop);
    try {
      game.frame(now);
    } catch (e) {
      console.error('[frame]', e);
    }
  };
  requestAnimationFrame(loop);

  // Handle for the e2e tests and for curious players poking at the console.
  (window as unknown as { blockforge: unknown }).blockforge = {
    game, renderer, settings, storage, handlers, hud, inventory, menus, hotbar, touch, input, ID, BLOCKS,
    applyPreset(p: 'low' | 'medium' | 'high') { applyPreset(settings, p); handlers.settingsChanged(settings); },
    debug: {
      /** Enter play state without pointer lock (headless tests). */
      play() { menus.hide(); game.state = 'playing'; input.enabled = true; },
    },
  };
}

boot().catch((e) => {
  console.error(e);
  fatal('BlockForge failed to start', String(e && (e as Error).message || e));
});
