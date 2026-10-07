// Test harness: mounts Menus, Hud and InventoryScreen with stub handlers (no game, no WebGL).
import { injectStyles, guiLayout } from '../../src/ui/style';
import { loadPixelFont } from '../../src/ui/font';
import { buildIcons } from '../../src/ui/icons';
import { Menus } from '../../src/ui/screens';
import type { MenuHandlers } from '../../src/ui/screens';
import { Hud } from '../../src/ui/hud';
import { InventoryScreen, searchItems, TABS } from '../../src/ui/inventory';
import { Hotbar } from '../../src/game/hotbar';
import { DEFAULT_SETTINGS } from '../../src/settings';
import type { Settings } from '../../src/settings';
import { TEXTURE_NAMES, BLOCKS, ID } from '../../src/blocks/registry';
import { generateTexture } from '../../src/blocks/textures';
import type { TimeMode, WorldMeta } from '../../src/types';

function fakeGameBackdrop() {
  // A stand-in for the 3D view: sky, distant hills and a field of grass blocks.
  const c = document.createElement('canvas');
  c.id = 'game';
  c.width = innerWidth; c.height = innerHeight;
  c.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%';
  const g = c.getContext('2d')!;
  const sky = g.createLinearGradient(0, 0, 0, c.height * 0.55);
  sky.addColorStop(0, '#78a7ff'); sky.addColorStop(1, '#c3d9ff');
  g.fillStyle = sky; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#6f8fb0';
  for (let x = 0; x < c.width; x += 24) g.fillRect(x, c.height * 0.5 - 40 - 30 * Math.sin(x / 140), 24, 200);
  const grass = generateTexture('grass_top');
  const t = document.createElement('canvas'); t.width = 16; t.height = 16;
  const tg = t.getContext('2d')!;
  const img = tg.createImageData(16, 16);
  for (let i = 0; i < 256; i++) { img.data[i * 4] = grass[i * 4] * 0.48; img.data[i * 4 + 1] = grass[i * 4 + 1] * 0.74; img.data[i * 4 + 2] = grass[i * 4 + 2] * 0.34; img.data[i * 4 + 3] = 255; }
  tg.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = false;
  for (let y = c.height * 0.55, s = 24; y < c.height; y += s, s += 6) for (let x = 0; x < c.width; x += s) g.drawImage(t, x, y, s, s);
  document.body.prepend(c);
}

const w = window as unknown as Record<string, unknown>;
w.bfTest = async (opts: { guiScale?: number } = {}) => {
  const settings: Settings = { ...DEFAULT_SETTINGS, guiScale: opts.guiScale ?? 2 };
  injectStyles(settings.guiScale);
  await loadPixelFont();
  fakeGameBackdrop();
  const t0 = performance.now();
  const icons = buildIcons({ tiles: TEXTURE_NAMES.map(generateTexture) });
  const iconMs = performance.now() - t0;
  const root = document.createElement('div');
  root.id = 'ui';
  document.body.appendChild(root);
  const hotbar = new Hotbar();
  const hud = new Hud(root, icons, hotbar);
  const inv = new InventoryScreen(root, icons, hotbar);
  const now = Date.now();
  const mk = (id: string, name: string, seed: number, ago: number): WorldMeta => ({
    id, name, seed, created: now - ago - 1e6, lastPlayed: now - ago, player: null, hotbar: [], selected: 0,
    dayTime: 0, timeMode: 'cycle', palette: [], version: 1,
  });
  let worlds: WorldMeta[] = [
    mk('w1', 'My First World', 1234567, 3600e3),
    mk('w2', 'Castle on the Cliffs', -987654321, 26 * 3600e3),
    mk('w3', 'Snowy Mountains Expedition With A Very Long Name That Does Not Fit', 42, 40 * 86400e3),
  ];
  const log: unknown[][] = [];
  let time: TimeMode = 'cycle';
  const handlers: MenuHandlers = {
    async listWorlds() { log.push(['listWorlds']); return worlds.slice(); },
    async createWorld(name, seed) { log.push(['createWorld', name, seed]); menus.showLoading('Generating terrain', 0.4); },
    async playWorld(id) { log.push(['playWorld', id]); menus.showLoading('Building terrain', 0.6); },
    async deleteWorld(id) { log.push(['deleteWorld', id]); worlds = worlds.filter((x) => x.id !== id); },
    resume() { log.push(['resume']); menus.hide(); },
    async saveAndQuit() { log.push(['saveAndQuit']); menus.showTitle(); },
    settingsChanged(s) { log.push(['settingsChanged', JSON.stringify(s)]); injectStyles(s.guiScale); },
    getTimeMode: () => time,
    setTimeMode(m) { log.push(['setTimeMode', m]); time = m; },
    offlineDownloadUrl: 'download',
    version: '1.0.0',
  };
  const menus = new Menus(root, handlers, settings);
  // Same key routing as Game.onKey.
  window.addEventListener('keydown', (e) => {
    if (inv.isOpen) { if (inv.handleKey(e.code)) e.preventDefault(); return; }
    if (menus.isOpen()) { if (e.code === 'Escape') { menus.back(); e.preventDefault(); } return; }
    if (e.code === 'KeyE') { inv.open(); e.preventDefault(); }
  });
  w.bf = { menus, hud, inv, hotbar, log, settings, icons, guiLayout, searchItems, TABS, ID, names: BLOCKS.map((b) => b.display) };
  return { iconMs };
};
