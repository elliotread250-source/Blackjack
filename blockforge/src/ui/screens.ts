// Menus: title, world list, create world, options, controls, pause and loading screens.
// Every screen is laid out like the classic block games: on the GUI-pixel grid, relative to
// the screen centre, and rebuilt (re-positioned) whenever the GUI size changes.
import type { Settings, Preset, ShaderPack, ResourcePackId } from '../settings';
import { saveSettings, applyPreset, restoreDefaults, syncShaderFlags, PRESETS } from '../settings';
import type { TimeMode, WorldMeta } from '../types';
import { injectStyles, guiLayout, onGuiLayout, U } from './style';
import type { GuiLayout } from './style';
import { centered, textAdvance } from './font';
import { blockIconCanvas } from './icons';
import { packTexture, packTile, RESOURCE_PACKS, setCustomPack, customPackInfo } from '../blocks/packs';
import { importResourcePack, saveCustomPack, deleteCustomPack } from '../blocks/importer';
import { forgetKey } from '../blocks/unlock';
import { ACTIONS, bound, keyName, setBinding, resetBindings, conflicts, UNBINDABLE } from '../game/keybinds';
import type { Action } from '../game/keybinds';
import { ID, COUNT } from '../blocks/registry';

export interface MenuHandlers {
  listWorlds(): Promise<WorldMeta[]>;
  createWorld(name: string, seed: string): Promise<void>;
  playWorld(id: string): Promise<void>;
  deleteWorld(id: string): Promise<void>;
  resume(): void;
  saveAndQuit(): Promise<void>;
  settingsChanged(s: Settings): void;     // called on every change (live apply)
  getTimeMode(): TimeMode; setTimeMode(m: TimeMode): void;
  offlineDownloadUrl: string | null;      // '/download' over http(s), null on file://
  version: string;
  /** Redraw textures for the current resource pack even if its id did not change (re-imported pack). */
  reapplyResourcePack?(): void;
}

type ScreenName = 'title' | 'worlds' | 'create' | 'pause' | 'options' | 'controls' | 'loading' | 'shaders' | 'packs';
/** Screens that are part of Options (shown over the paused game when opened from the pause menu). */
const OPTION_SCREENS: ScreenName[] = ['options', 'controls', 'shaders', 'packs'];

// ============================================================================ helpers

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
const div = (cls: string, parent?: HTMLElement, text?: string) => el('div', cls, parent, text);

/** Position an element in GUI pixels. */
function at(e: HTMLElement, x: number, y: number, w?: number, h?: number) {
  e.style.left = U(x);
  e.style.top = U(y);
  if (w !== undefined) e.style.width = U(w);
  if (h !== undefined) e.style.height = U(h);
}

/** Split text into lines no wider than `maxW` font pixels. */
export function wrapText(text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (line && textAdvance(t) - 1 > maxW) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
  }
  return out;
}

/** Shorten text with an ellipsis so it fits in `maxW` font pixels. */
function fit(text: string, maxW: number): string {
  if (textAdvance(text) - 1 <= maxW) return text;
  let s = text;
  while (s.length > 1 && textAdvance(s + '...') - 1 > maxW) s = s.slice(0, -1);
  return s.trimEnd() + '...';
}

/** A centred single line of text across the whole GUI width. */
function line(parent: HTMLElement, text: string, y: number, cls = ''): HTMLDivElement {
  const d = div('bf-h1 ' + cls, parent);
  d.textContent = centered(text, 0);
  d.style.top = U(y - 1); // y is where the capitals start (line box has 1 empty pixel on top)
  return d;
}

interface Btn { el: HTMLButtonElement | HTMLAnchorElement; w: number; set(text: string): void; enable(on: boolean): void }

function button(parent: HTMLElement, text: string, w: number, onClick: () => void, tip?: string): Btn {
  const b = el('button', 'bf-btn', parent);
  b.type = 'button';
  b.style.width = U(w);
  const btn: Btn = {
    el: b, w,
    set(t: string) { const c = centered(t, w); if (b.textContent !== c) b.textContent = c; },
    enable(on: boolean) { b.disabled = !on; },
  };
  btn.set(text);
  if (tip) b.dataset.tip = tip;
  b.addEventListener('click', (e) => { e.preventDefault(); if (!b.disabled) onClick(); });
  return btn;
}

function linkButton(parent: HTMLElement, text: string, w: number, href: string): Btn {
  const a = el('a', 'bf-btn', parent);
  a.href = href;
  a.setAttribute('download', 'blockforge.html');
  a.style.width = U(w);
  a.textContent = centered(text, w);
  return { el: a, w, set(t) { a.textContent = centered(t, w); }, enable() { /* always on */ } };
}

interface Slider { el: HTMLDivElement; refresh(): void }

/** A labelled slider. `get`/`set` work in the slider's own units; `label` formats the text. */
function slider(parent: HTMLElement, w: number, min: number, max: number, step: number,
  get: () => number, set: (v: number) => void, label: (v: number) => string, tip?: string): Slider {
  const s = div('bf-slider', parent);
  s.tabIndex = 0;
  s.style.width = U(w);
  div('bf-track', s);
  const knob = div('bf-knob', s);
  const lbl = div('bf-lbl', s);
  if (tip) s.dataset.tip = tip;
  const snap = (v: number) => Math.max(min, Math.min(max, Math.round((v - min) / step) * step + min));
  const refresh = () => {
    const v = get();
    const f = (Math.max(min, Math.min(max, v)) - min) / (max - min || 1);
    knob.style.left = U(Math.round(f * (w - 8)));
    lbl.textContent = centered(label(v), w);
  };
  const fromPointer = (clientX: number) => {
    const r = s.getBoundingClientRect();
    const u = guiLayout().u;
    const f = (clientX - r.left - 4 * u) / (r.width - 8 * u);
    const v = snap(min + Math.max(0, Math.min(1, f)) * (max - min));
    if (v !== get()) { set(v); refresh(); }
  };
  s.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    s.focus({ preventScroll: true });
    s.classList.add('bf-drag');
    try { s.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
    fromPointer(e.clientX);
  });
  s.addEventListener('pointermove', (e) => { if (s.classList.contains('bf-drag')) fromPointer(e.clientX); });
  const end = () => s.classList.remove('bf-drag');
  s.addEventListener('pointerup', end);
  s.addEventListener('pointercancel', end);
  s.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : 0;
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();
    const v = snap(get() + d * step);
    if (v !== get()) { set(v); refresh(); }
  });
  refresh();
  return { el: s, refresh };
}

/** Vertical scrolling list with a classic thin scrollbar. Content is laid out in GUI pixels. */
class ScrollList {
  el: HTMLDivElement;
  inner: HTMLDivElement;
  private bar: HTMLDivElement;
  private thumb: HTMLDivElement;
  private top = 0;
  private height = 0;
  private content = 0;
  private scroll = 0;
  private acc = 0;
  private dragThumb: { y: number; s: number } | null = null;
  private touch: { id: number; y: number; s: number; moved: boolean } | null = null;
  private swallowClick = false;

  constructor(parent: HTMLElement, sunk: boolean) {
    this.el = div('bf-list' + (sunk ? ' bf-sunk' : ''), parent);
    this.inner = div('bf-list-in', this.el);
    if (sunk) { div('bf-shade-t', this.el); div('bf-shade-b', this.el); }
    this.bar = div('bf-sbar', this.el);
    this.thumb = div('bf-thumb', this.bar);
    this.el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 300 : e.deltaY;
      this.acc += px * 0.2;
      const steps = Math.trunc(this.acc);
      if (steps) { this.acc -= steps; this.scrollTo(this.scroll + steps); }
    }, { passive: false });
    this.thumb.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      this.dragThumb = { y: e.clientY, s: this.scroll };
      try { this.thumb.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
    });
    this.thumb.addEventListener('pointermove', (e) => {
      if (!this.dragThumb) return;
      const u = guiLayout().u;
      const range = this.height - this.thumbH();
      const max = Math.max(0, this.content - this.height);
      if (range > 0) this.scrollTo(this.dragThumb.s + ((e.clientY - this.dragThumb.y) / u) * (max / range));
    });
    this.thumb.addEventListener('pointerup', () => { this.dragThumb = null; });
    this.bar.addEventListener('pointerdown', (e) => {
      if (e.target !== this.bar) return;
      const r = this.bar.getBoundingClientRect();
      const f = (e.clientY - r.top) / r.height;
      this.scrollTo(f * (this.content - this.height));
    });
    // Finger scrolling (a drag that moved does not click the button under it).
    this.el.addEventListener('pointerdown', (e) => {
      // A scrolling drag usually fires no click at all, so a leftover "swallow" must not eat
      // the next real tap (any click from the drag itself arrives before this pointerdown).
      this.swallowClick = false;
      if (e.pointerType === 'mouse') return;
      this.touch = { id: e.pointerId, y: e.clientY, s: this.scroll, moved: false };
    }, true);
    this.el.addEventListener('pointermove', (e) => {
      const t = this.touch;
      if (!t || t.id !== e.pointerId) return;
      const u = guiLayout().u;
      if (Math.abs(e.clientY - t.y) > 6 * u) t.moved = true;
      if (t.moved) this.scrollTo(t.s - (e.clientY - t.y) / u);
    }, true);
    const endTouch = () => { if (this.touch?.moved) this.swallowClick = true; this.touch = null; };
    this.el.addEventListener('pointerup', endTouch, true);
    this.el.addEventListener('pointercancel', endTouch, true);
    this.el.addEventListener('click', (e) => { if (this.swallowClick) { e.stopPropagation(); e.preventDefault(); this.swallowClick = false; } }, true);
    this.el.addEventListener('focusin', (e) => {
      const t = e.target as HTMLElement;
      const y = parseFloat(t.dataset.y ?? 'NaN'), h = parseFloat(t.dataset.h ?? '20');
      if (!Number.isNaN(y)) this.ensureVisible(y, h);
    });
  }

  /** Place the list: full GUI width, from `top` down `height` px, scrollbar at `barX`. */
  place(l: GuiLayout, top: number, height: number, barX: number) {
    this.top = top;
    this.height = Math.max(20, height);
    at(this.el, 0, top, l.gw, this.height);
    at(this.bar, barX, 0, 6, this.height);
    this.scrollTo(this.scroll);
  }

  setContent(h: number) { this.content = h; this.scrollTo(this.scroll); }

  private thumbH() { return Math.max(32, Math.min(this.height - 8, Math.round((this.height * this.height) / Math.max(1, this.content)))); }

  scrollTo(s: number) {
    const max = Math.max(0, this.content - this.height);
    this.scroll = Math.max(0, Math.min(max, Math.round(s)));
    this.inner.style.top = U(-this.scroll);
    this.bar.classList.toggle('bf-none', max <= 0);
    if (max > 0) {
      const th = this.thumbH();
      at(this.thumb, 0, Math.round(((this.height - th) * this.scroll) / max), 6, th);
    }
  }

  ensureVisible(y: number, h: number) {
    if (y < this.scroll) this.scrollTo(y - 4);
    else if (y + h > this.scroll + this.height) this.scrollTo(y + h - this.height + 4);
  }

  get scrollTop() { return this.scroll; }
  get offsetTop() { return this.top; }
}

/** A tiny screen object: a full-screen layer with a background and a GUI-grid container. */
class Screen {
  root: HTMLDivElement;
  bg: HTMLDivElement;
  gui: HTMLDivElement;
  constructor(parent: HTMLElement, public name: ScreenName, bgClass: string, public layout: (l: GuiLayout) => void = () => undefined) {
    this.root = div('bf-screen', parent);
    this.root.style.display = 'none';
    this.bg = div('bf-full ' + bgClass, this.root);
    this.bg.style.position = 'absolute';
    this.gui = div('bf-gui', this.root);
    this.gui.style.position = 'absolute';
  }
  setBg(cls: string) { this.bg.className = 'bf-full ' + cls; this.bg.style.position = 'absolute'; }
}

// ============================================================================ art

/** A block icon drawn with a resource pack, as a data URL (cached). */
const iconCache = new Map<string, string>();
function clearPackIcons(pack: ResourcePackId) {
  for (const k of Array.from(iconCache.keys())) if (k.startsWith(pack + ':')) iconCache.delete(k);
}
function packIcon(id: number, pack: ResourcePackId): string {
  const key = pack + ':' + id;
  let url = iconCache.get(key);
  if (url === undefined) {
    try { url = blockIconCanvas(id, (t) => packTile(t, pack)).toDataURL(); } catch { url = ''; }
    iconCache.set(key, url);
  }
  return url;
}

const THUMB_BLOCKS = ['grass_block', 'oak_log', 'cherry_leaves', 'sand', 'snowy_grass_block', 'stone_bricks', 'birch_log', 'mossy_cobblestone', 'spruce_planks', 'podzol'];
function worldThumb(seed: number, pack: ResourcePackId): string {
  const name = THUMB_BLOCKS[(((seed | 0) % THUMB_BLOCKS.length) + THUMB_BLOCKS.length) % THUMB_BLOCKS.length];
  return packIcon(ID[name] ?? ID.grass_block, pack);
}

/** Blocks shown in each resource pack's preview strip. */
const PACK_PREVIEW = ['grass_block', 'oak_planks', 'stone_bricks', 'oak_leaves', 'bricks', 'diamond_ore', 'poppy'];

// Chunky logo letters (6x7), drawn as textured blocks. Original lettering.
const LOGO_GLYPHS: Record<string, string[]> = {
  B: ['#####.', '##..##', '##..##', '#####.', '##..##', '##..##', '#####.'],
  L: ['##....', '##....', '##....', '##....', '##....', '##....', '######'],
  O: ['.####.', '##..##', '##..##', '##..##', '##..##', '##..##', '.####.'],
  C: ['.#####', '##....', '##....', '##....', '##....', '##....', '.#####'],
  K: ['##..##', '##.##.', '####..', '###...', '####..', '##.##.', '##..##'],
  F: ['######', '##....', '##....', '#####.', '##....', '##....', '##....'],
  R: ['#####.', '##..##', '##..##', '#####.', '##.##.', '##..##', '##..##'],
  G: ['.#####', '##....', '##....', '##.###', '##..##', '##..##', '.#####'],
  E: ['######', '##....', '##....', '#####.', '##....', '##....', '######'],
};
const LOGO_TEXT = 'BLOCKFORGE';
const LOGO_CELL = 8;           // canvas px per letter block (texture texels)
const LOGO_DEPTH = 10;         // extrusion in canvas px
export const LOGO_W = (LOGO_TEXT.length * 7 - 1) * LOGO_CELL + LOGO_DEPTH + 4;
export const LOGO_H = 7 * LOGO_CELL + LOGO_DEPTH + 4;

let logoArt: { pack: ResourcePackId; url: string } | null = null;
function drawLogo(pack: ResourcePackId): string {
  if (logoArt && logoArt.pack === pack) return logoArt.url;
  let logoURL = '';
  try {
    const c = document.createElement('canvas');
    c.width = LOGO_W; c.height = LOGO_H;
    const g = c.getContext('2d')!;
    const img = g.createImageData(LOGO_W, LOGO_H);
    const d = img.data;
    const stone = packTexture('stone_bricks', pack), cobble = packTexture('cobblestone', pack);
    const hot = packTexture('gold_block', pack), ember = packTexture('magma', pack);
    const solid = new Uint8Array(LOGO_W * LOGO_H);
    const front = new Int8Array(LOGO_W * LOGO_H).fill(-1); // letter index painting the front face
    let x0 = 2;
    for (let li = 0; li < LOGO_TEXT.length; li++) {
      const gl = LOGO_GLYPHS[LOGO_TEXT[li]];
      for (let r = 0; r < 7; r++) for (let col = 0; col < 6; col++) {
        if (gl[r][col] !== '#') continue;
        for (let y = 0; y < LOGO_CELL; y++) for (let x = 0; x < LOGO_CELL; x++) {
          const X = x0 + col * LOGO_CELL + x, Y = 2 + r * LOGO_CELL + y;
          front[Y * LOGO_W + X] = li;
          for (let k = 1; k <= LOGO_DEPTH; k++) solid[(Y + k) * LOGO_W + X + (k >> 2)] = 1;
        }
      }
      x0 += 7 * LOGO_CELL;
    }
    const put = (i: number, r: number, gg: number, b: number) => { d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; };
    const sample = (t: Uint8ClampedArray, x: number, y: number) => ((y & 15) * 16 + (x & 15)) * 4;
    for (let y = 0; y < LOGO_H; y++) for (let x = 0; x < LOGO_W; x++) {
      const i = y * LOGO_W + x;
      const li = front[i];
      if (li >= 0) {
        const forge = li >= 5;
        const t = forge ? (((x >> 3) + (y >> 3)) % 5 === 0 ? ember : hot) : (((x >> 4) + (y >> 4)) & 1 ? cobble : stone);
        const s = sample(t, x, y);
        // top edge of each letter block row catches the light, bottom edge is a touch darker
        const above = y > 0 ? front[i - LOGO_W] : -1, below = y < LOGO_H - 1 ? front[i + LOGO_W] : -1;
        const left = x > 0 ? front[i - 1] : -1;
        let f = 1;
        if (above < 0 || left < 0) f = 1.28;
        else if (below < 0) f = 0.82;
        let r = t[s] * f, gg = t[s + 1] * f, b = t[s + 2] * f;
        if (forge) { r = r * 1.05 + 10; gg = gg * 0.82; b = b * 0.55; }
        put(i, Math.min(255, r), Math.min(255, gg), Math.min(255, b));
      } else if (solid[i]) {
        // Extruded sides: dark, slightly warmer towards the bottom.
        let k = 0;
        while (k < LOGO_DEPTH && y - k - 1 >= 0 && front[(y - k - 1) * LOGO_W + x - ((k + 1) >> 2)] < 0) k++;
        const t = x < 5 * 7 * LOGO_CELL ? stone : hot;
        const s = sample(t, x, y);
        const f = 0.36 - k * 0.012;
        put(i, t[s] * f + 6, t[s + 1] * f + 4, t[s + 2] * f + 4);
      }
    }
    // 1 px dark outline around everything.
    const ink = new Uint8Array(LOGO_W * LOGO_H);
    for (let i = 0; i < ink.length; i++) ink[i] = d[i * 4 + 3] ? 1 : 0;
    for (let y = 0; y < LOGO_H; y++) for (let x = 0; x < LOGO_W; x++) {
      const i = y * LOGO_W + x;
      if (ink[i]) continue;
      const n = (x > 0 && ink[i - 1]) || (x < LOGO_W - 1 && ink[i + 1]) || (y > 0 && ink[i - LOGO_W]) || (y < LOGO_H - 1 && ink[i + LOGO_W]);
      if (n) { d[i * 4] = 12; d[i * 4 + 1] = 10; d[i * 4 + 2] = 10; d[i * 4 + 3] = 255; }
    }
    g.putImageData(img, 0, 0);
    logoURL = c.toDataURL();
  } catch {
    logoURL = '';
  }
  logoArt = { pack, url: logoURL };
  return logoURL;
}

// Side-on pixel landscape for the title screen, seamless over PANO_W pixels.
const PANO_W = 1024, PANO_H = 256;
let panoArt: { pack: ResourcePackId; url: string } | null = null;
function drawPanorama(pack: ResourcePackId): string {
  if (panoArt && panoArt.pack === pack) return panoArt.url;
  let panoURL = '';
  try {
    const c = document.createElement('canvas');
    c.width = PANO_W; c.height = PANO_H;
    const g = c.getContext('2d')!;
    const img = g.createImageData(PANO_W, PANO_H);
    const d = img.data;
    const set = (x: number, y: number, r: number, gg: number, b: number, a = 255) => {
      if (y < 0 || y >= PANO_H) return;
      const i = (y * PANO_W + (((x % PANO_W) + PANO_W) % PANO_W)) * 4;
      const sa = a / 255;
      d[i] = d[i] * (1 - sa) + r * sa; d[i + 1] = d[i + 1] * (1 - sa) + gg * sa; d[i + 2] = d[i + 2] * (1 - sa) + b * sa; d[i + 3] = 255;
    };
    // Sky
    for (let y = 0; y < PANO_H; y++) {
      const t = y / PANO_H;
      const r = 104 + t * 110, gg = 160 + t * 70, b = 236 + t * 14;
      for (let x = 0; x < PANO_W; x++) set(x, y, r, gg, b);
    }
    const wave = (x: number, terms: [number, number, number][]) => terms.reduce((s, [a, p, ph]) => s + a * Math.sin((x / PANO_W) * Math.PI * 2 * p + ph), 0);
    // Distant ranges (flat colours, blocky steps of 4 px)
    const ranges: [number, [number, number, number], [number, number, number][]][] = [
      [118, [150, 176, 206], [[22, 3, 0.4], [10, 7, 1.3], [6, 13, 2.1]]],
      [138, [116, 146, 170], [[18, 2, 2.2], [9, 5, 0.3], [5, 11, 4.0]]],
    ];
    for (const [base, col, terms] of ranges) {
      for (let x = 0; x < PANO_W; x += 4) {
        const h = Math.round((base - wave(x, terms)) / 4) * 4;
        for (let y = h; y < PANO_H; y++) for (let k = 0; k < 4; k++) set(x + k, y, col[0], col[1], col[2]);
      }
    }
    // Clouds
    for (let i = 0; i < 9; i++) {
      const cx = (i * 113 + 37) % PANO_W, cy = 18 + ((i * 53) % 46), w = 40 + ((i * 29) % 50);
      for (let y = 0; y < 8; y++) for (let x = 0; x < w; x++) {
        if ((y < 4 && (x < 8 || x > w - 12)) || (y > 5 && x > w - 20)) continue;
        set(cx + x, cy + y, 255, 255, 255, 215);
      }
    }
    // Block terrain, 16 px columns
    const tile = (name: string) => packTexture(name, pack);
    const grassSide = tile('grass_side'), dirt = tile('dirt'), stone = tile('stone'), sand = tile('sand');
    const water = tile('water'), log = tile('oak_log'), leaves = tile('oak_leaves'), birch = tile('birch_log');
    const coal = tile('ore_stone_coal'), poppy = tile('flower_poppy'), dand = tile('flower_dandelion'), grass = tile('tall_grass');
    const GT = [123, 189, 86], FT = [95, 171, 54], WT = [63, 118, 228];
    const blit = (t: Uint8ClampedArray, bx: number, by: number, tint?: number[], maskTint = false, alpha = 1, cut = false) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const s = (y * 16 + x) * 4;
        let r = t[s], gg = t[s + 1], b = t[s + 2];
        const a = t[s + 3];
        if (cut && a < 128) continue;
        if (tint && (!maskTint || a < 128)) { r = r * tint[0] / 255; gg = gg * tint[1] / 255; b = b * tint[2] / 255; }
        set(bx + x, by + y, r, gg, b, Math.round(alpha * (cut ? 255 : alpha < 1 ? Math.max(a, 150) : 255)));
      }
    };
    const SEA = 12;                      // in blocks from the top
    const cols = PANO_W / 16;
    const heights: number[] = [];
    for (let i = 0; i < cols; i++) {
      const h = 11 - wave(i * 16, [[2.2, 2, 0.7], [1.4, 5, 2.4], [0.8, 9, 0.2]]);
      heights.push(Math.round(h));
    }
    for (let i = 0; i < cols; i++) {
      const top = heights[i], bx = i * 16;
      const beach = top >= SEA - 1;
      for (let row = top; row < 16; row++) {
        const by = row * 16;
        if (row === top) blit(beach ? sand : grassSide, bx, by, beach ? undefined : GT, true);
        else if (row < top + 3) blit(beach ? sand : dirt, bx, by);
        else blit((i * 7 + row * 3) % 11 === 0 ? coal : stone, bx, by);
      }
      for (let row = SEA; row < top; row++) blit(water, bx, row * 16, WT, false, 0.75);
      if (!beach && i % 9 === 3) {
        const trunk = i % 2 ? birch : log;
        for (let k = 1; k <= 4; k++) blit(trunk, bx, (top - k) * 16);
        for (let dx = -2; dx <= 2; dx++) for (let dy = 3; dy <= 6; dy++) {
          if ((Math.abs(dx) === 2 && (dy === 6 || dy === 3)) || (dy === 6 && Math.abs(dx) === 1 && i % 3 === 0)) continue;
          if (dx === 0 && dy < 5) continue;
          blit(leaves, bx + dx * 16, (top - dy) * 16, FT, false, 1, true);
        }
      } else if (!beach && (i * 5) % 7 === 1) {
        blit(i % 3 ? grass : (i % 2 ? poppy : dand), bx, (top - 1) * 16, i % 3 ? GT : undefined, false, 1, true);
      }
    }
    g.putImageData(img, 0, 0);
    panoURL = c.toDataURL();
  } catch {
    panoURL = '';
  }
  panoArt = { pack, url: panoURL };
  return panoURL;
}

const SPLASHES = [
  `${COUNT - 1} blocks!`, 'Made of 16x16 pixels!', 'Runs in a browser tab!', 'Infinite worlds!',
  'Double-tap W to sprint!', 'Visit a cherry grove!', 'Every texture drawn by code!', 'No downloads needed!',
  'Works offline too!', 'Build a castle!', 'Mind the Ctrl+W!', 'Cubes all the way down!',
  'Fly with a double-tap!', 'Lava + water = obsidian!', 'Press F3 for numbers!', 'Square sun, square moon!',
  'Forged in TypeScript!', 'Sixty frames, hopefully!', 'Snowy peaks!', 'Built for Chromebooks!',
  'Plant a flower!', 'Glass panes connect!', 'Pixel perfect!', 'Hello, builder!', 'Fancy leaves!',
  'Stairs face you!', 'Try a sunset!', 'Shift-click to the hotbar!', 'Seeds can be words!', 'Watch the clouds!',
];

const HINTS = [
  'Double-tap Space to start or stop flying.',
  'Middle-click a block to put it in your hotbar.',
  'Press E for the creative inventory. Type to search.',
  'Double-tap W to sprint without touching Ctrl.',
  'Press F1 to hide the HUD for screenshots, F2 to take one.',
  'Press F3 to see coordinates, chunk and GPU info.',
  'Shift-click an item to send it to your hotbar.',
  'Pick a time of day from the pause menu.',
  'Worlds are saved in this browser automatically.',
  'Low graphics runs best on school laptops and Chromebooks.',
];

const TIME_LABEL: Record<TimeMode, string> = { cycle: 'Day Cycle', sunrise: 'Sunrise', noon: 'Noon', sunset: 'Sunset', midnight: 'Midnight' };
const TIME_ORDER: TimeMode[] = ['cycle', 'sunrise', 'noon', 'sunset', 'midnight'];
const PRESET_LABEL: Record<Preset, string> = { low: 'Low', medium: 'Medium', high: 'High', custom: 'Custom' };
const SHADER_LABEL: Record<ShaderPack, string> = { off: 'Off', fancy: 'Fancy', ultra: 'Ultra' };
const SHADER_ORDER: ShaderPack[] = ['off', 'fancy', 'ultra'];
const SHADER_INFO: { id: ShaderPack; desc: string }[] = [
  { id: 'off', desc: 'Fastest, for school laptops and Chromebooks.' },
  { id: 'fancy', desc: 'Sun shadows, waving plants, reflective water.' },
  { id: 'ultra', desc: 'Adds bloom, god rays, fog and mirror water. Needs a strong graphics chip.' },
];

/** The preset whose every value matches the current options, else 'custom'. */
export function matchPreset(st: Settings): Preset {
  for (const p of ['low', 'medium', 'high'] as const) {
    const vals = PRESETS[p] as Record<string, unknown>;
    if (Object.keys(vals).every((k) => (st as unknown as Record<string, unknown>)[k] === vals[k])) return p;
  }
  return 'custom';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatDate(ms: number): string {
  if (!ms) return 'never';
  const d = new Date(ms), now = new Date();
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return `today, ${hm}`;
  if (diff === 1) return `yesterday, ${hm}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hm}`;
}

function isTouchOnly(): boolean {
  try {
    return matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches && (navigator.maxTouchPoints || 0) > 0;
  } catch { return false; }
}

// Key bindings shown on the Controls screen (the game's bindings are fixed).
const FIXED_KEYS: [string, string][] = [
  ['Pause menu', 'Esc'], ['Toggle flying', 'Jump x2'], ['Sprint', 'Forward x2'],
  ['Next / previous slot', 'Mouse Wheel'], ['Item to hotbar (inventory)', 'Shift+Click'], ['Search blocks (inventory)', 'T'],
];
const TOUCH_KEYS: [string, string][] = [
  ['Move (push far to sprint)', 'Left stick'], ['Look around', 'Drag right'], ['Jump, x2 to fly', 'Jump'],
  ['Sneak, fly down', 'Sneak'], ['Break block (hold)', 'Break'], ['Place block, use', 'Place'],
  ['Pick block', 'Pick'], ['Change slot', 'Tap hotbar'], ['Inventory', 'Grid button'], ['Pause', 'Pause button'],
];

// ============================================================================ Menus

export class Menus {
  private root: HTMLDivElement;
  private screens = new Map<ScreenName, Screen>();
  private cur: ScreenName | null = null;
  private optionsBack: () => void = () => undefined;
  private overGame = false;              // options/controls opened from the pause menu: show the game behind
  private controlsBack: () => void = () => undefined;
  private tip: HTMLDivElement;
  private tipTimer = 0;
  private settingsUI: { refresh(): void } | null = null;

  // per-screen state
  private worlds: WorldMeta[] = [];
  private selected: string | null = null;
  private confirmDelete: WorldMeta | null = null;
  private busy = false;
  private lastWorld: WorldMeta | null = null;   // most recently played world, for Continue
  private titleRefresh = 0;
  private loadingState = { text: '', progress: -2 };

  constructor(root: HTMLElement, private handlers: MenuHandlers, private settings: Settings) {
    this.root = div('bf-menus bf-full bf-font', root);
    this.buildTitle();
    this.buildWorlds();
    this.buildCreate();
    this.buildOptions();
    this.buildControls();
    this.buildPause();
    this.buildLoading();
    this.buildShaders();
    this.buildPacks();
    this.tip = div('bf-tip', this.root);
    this.tip.style.position = 'absolute';
    this.root.addEventListener('pointerover', (e) => this.onTipOver(e));
    this.root.addEventListener('pointerdown', () => this.hideTip());
    onGuiLayout((l) => { if (this.cur) this.screens.get(this.cur)!.layout(l); });
  }

  // ------------------------------------------------------------------ public API
  private noticeEl: HTMLDivElement | null = null;
  private noticeTimer = 0;
  /** A short message at the top of the screen (over menus or the game), gone after a while. */
  notice(text: string, seconds = 7): void {
    if (!this.noticeEl) this.noticeEl = div('bf-notice bf-font bf-c-yellow', document.body);
    const n = this.noticeEl;
    n.textContent = text;
    n.style.opacity = '1';
    clearTimeout(this.noticeTimer);
    this.noticeTimer = window.setTimeout(() => { n.style.opacity = '0'; }, seconds * 1000);
  }
  /** The imported pack slot changed outside this screen: redraw its preview icons next time. */
  importedPackChanged(): void { clearPackIcons('custom'); }
  showTitle(): void { this.show('title'); }
  showWorlds(): void { this.confirmDelete = null; this.show('worlds'); void this.reloadWorlds(); }
  showPause(): void { this.busy = false; this.show('pause'); }
  showOptions(back: () => void): void {
    this.optionsBack = back;
    this.screens.get('options')!.setBg(this.overGame ? 'bf-pause-bg' : 'bf-dirt');
    this.show('options');
  }
  showControls(back: () => void): void {
    this.controlsBack = back;
    this.screens.get('controls')!.setBg(this.overGame ? 'bf-pause-bg' : 'bf-dirt');
    this.show('controls');
  }
  /** Options > Shaders (Off / Fancy / Ultra). Done returns to Options. */
  showShaders(): void {
    this.screens.get('shaders')!.setBg(this.overGame ? 'bf-pause-bg' : 'bf-dirt');
    this.show('shaders');
  }
  /** Options > Resource Packs. Done returns to Options. */
  showPacks(): void {
    this.screens.get('packs')!.setBg(this.overGame ? 'bf-pause-bg' : 'bf-dirt');
    this.show('packs');
  }
  showLoading(text: string, progress?: number): void {
    const p = progress === undefined ? -1 : Math.max(0, Math.min(1, progress));
    if (this.cur !== 'loading') { this.loadingState = { text: '', progress: -2 }; this.pickHint(); this.show('loading'); }
    this.updateLoading(text, p);
  }
  hide(): void {
    if (this.cur) this.screens.get(this.cur)!.root.style.display = 'none';
    if (this.noticeEl) this.noticeEl.style.opacity = '0';   // menu notices do not follow into the game
    this.cur = null;
    this.root.classList.remove('bf-open');
    this.hideTip();
  }
  isOpen(): boolean { return this.cur !== null; }
  current(): ScreenName | null { return this.cur; }
  back(): void {
    switch (this.cur) {
      case 'options': saveSettings(this.settings); this.optionsBack(); break;
      case 'controls': this.controlsBack(); break;
      case 'shaders':
      case 'packs': saveSettings(this.settings); this.keepOptionsScroll = true; this.showOptions(this.optionsBack); break;
      case 'create': this.showWorlds(); break;
      case 'worlds':
        if (this.confirmDelete) { this.confirmDelete = null; this.renderWorlds(); } else this.showTitle();
        break;
      case 'pause': this.handlers.resume(); break;
      default: break;
    }
  }

  // ------------------------------------------------------------------ plumbing
  private show(name: ScreenName) {
    if (name === 'pause') this.overGame = true;
    else if (!OPTION_SCREENS.includes(name)) this.overGame = false;
    const prev = this.cur;
    if (prev && prev !== name) this.screens.get(prev)!.root.style.display = 'none';
    const s = this.screens.get(name)!;
    this.cur = name;
    this.root.classList.add('bf-open');
    s.root.style.display = '';
    this.hideTip();
    s.layout(guiLayout());
    if (document.activeElement instanceof HTMLElement && this.root.contains(document.activeElement)) document.activeElement.blur();
    const onShow = (s as Screen & { onShow?: () => void }).onShow;
    if (onShow) onShow();
  }

  private add(name: ScreenName, bg: string): Screen {
    const s = new Screen(this.root, name, bg);
    this.screens.set(name, s);
    return s;
  }

  private onTipOver(e: PointerEvent) {
    const t = (e.target as HTMLElement).closest('[data-tip]') as HTMLElement | null;
    clearTimeout(this.tipTimer);
    this.tip.classList.remove('bf-on');
    if (!t || e.pointerType !== 'mouse') return;
    this.tipTimer = window.setTimeout(() => {
      if (!t.isConnected || !this.cur) return;
      const l = guiLayout();
      this.tip.textContent = '';
      for (const ln of wrapText(t.dataset.tip!, 200)) div('', this.tip, ln);
      this.tip.classList.add('bf-on');
      const r = t.getBoundingClientRect();
      const w = Math.ceil(this.tip.offsetWidth / l.u), h = Math.ceil(this.tip.offsetHeight / l.u);
      let x = Math.floor(r.left / l.u), y = Math.floor(r.bottom / l.u) + 4;
      if (x + w > l.gw - 4) x = l.gw - 4 - w;
      if (y + h > l.gh - 4) y = Math.floor(r.top / l.u) - h - 4;
      at(this.tip, Math.max(4, x), Math.max(4, y));
    }, 550);
  }
  private hideTip() { clearTimeout(this.tipTimer); this.tip.classList.remove('bf-on'); }

  // ------------------------------------------------------------------ title
  private buildTitle() {
    const s = this.add('title', 'bf-dirt');
    const pano = div('bf-pano', s.bg);
    div('bf-vignette', s.bg);
    const logo = el('img', 'bf-logo', s.gui);
    logo.alt = 'BlockForge';
    logo.draggable = false;
    const splash = div('bf-splash bf-font', s.gui);
    const cont = button(s.gui, 'Continue', 200, () => this.continueLast());
    cont.el.classList.add('bf-continue');
    cont.el.style.display = 'none';
    const single = button(s.gui, 'Singleplayer', 200, () => this.showWorlds(), 'Create a world or continue one you have played before.');
    const dl = this.handlers.offlineDownloadUrl
      ? linkButton(s.gui, 'Download offline version', 200, this.handlers.offlineDownloadUrl)
      : null;
    if (dl) dl.el.dataset.tip = 'One HTML file that plays without internet. Handy when a school network blocks the site.';
    const opts = button(s.gui, 'Options...', 98, () => this.showOptions(() => this.showTitle()));
    const ctrl = button(s.gui, 'Controls', 98, () => this.showControls(() => this.showTitle()));
    const ver = div('bf-abs', s.gui, `BlockForge ${this.handlers.version}`);
    const credit = div('bf-abs bf-right', s.gui, 'An original game. Every pixel made in code.');
    const hint = isTouchOnly() ? div('bf-h1 bf-c-yellow', s.gui) : null;
    if (hint) hint.textContent = centered('On a touchscreen? Turn on Touch in Options.', 0);
    let splashText = '';

    this.titleUI = { cont };
    s.layout = (l) => {
      const pack = this.settings.resourcePack;
      const art = drawPanorama(pack);
      if (art) {
        // Scale the strip to the screen height; animate one period to the left, forever.
        const hPx = window.innerHeight;
        const period = (PANO_W * hPx) / PANO_H;
        pano.style.backgroundImage = `url(${art})`;
        pano.style.backgroundSize = `${period}px ${hPx}px`;
        pano.style.width = `${Math.ceil(window.innerWidth + period) + 2}px`;
        pano.style.setProperty('--pano-w', `${-period}px`);
        pano.style.animationDuration = `${Math.round(period / 12)}s`;
      }
      const lg = drawLogo(pack);
      if (lg && logo.src !== lg) logo.src = lg;
      const lw = Math.round(LOGO_W / 2), lh = Math.round(LOGO_H / 2);
      at(logo, l.cx - (lw >> 1), 28, lw, lh);
      if (!splashText) splashText = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];
      splash.textContent = splashText;
      at(splash, l.cx + 104, 28 + lh - 2);
      splash.style.setProperty('--ss', String(Math.min(1.8, (1.8 * 100) / (textAdvance(splashText) + 32))));
      const y0 = l.qh + 48;
      let y = y0;
      const last = this.lastWorld;
      cont.el.style.display = last ? '' : 'none';
      if (last) {
        const label = 'Continue: ';
        cont.set(label + fit(last.name || 'World', 200 - 10 - textAdvance(label)));
        cont.el.dataset.tip = `Jump straight back into ${last.name || 'your world'}. Last played ${formatDate(last.lastPlayed)}.`;
        at(cont.el, l.cx - 100, y);
        y += 24;
      }
      at(single.el, l.cx - 100, y);
      y += 24;
      if (dl) { at(dl.el, l.cx - 100, y); y += 24; }
      y += 12;
      at(opts.el, l.cx - 100, y);
      at(ctrl.el, l.cx + 2, y);
      at(ver, 2, l.gh - 10);
      at(credit, l.gw - 2 - textAdvance(credit.textContent!), l.gh - 10);
      if (hint) {
        hint.style.top = U(Math.min(l.gh - 24, y + 30));
        // phones start on touch controls; the hint is only for someone who switched them off
        hint.style.display = this.settings.controls === 'touch' ? 'none' : '';
      }
    };
    (s as Screen & { onShow?: () => void }).onShow = () => {
      splashText = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];
      cont.enable(true);
      s.layout(guiLayout());
      void this.refreshContinue();
    };
  }

  private titleUI!: { cont: Btn };

  /** Look up the most recently played world for the Continue button. */
  private async refreshContinue() {
    const ticket = ++this.titleRefresh;
    let worlds: WorldMeta[] = [];
    try { worlds = await this.handlers.listWorlds(); } catch (e) { console.warn('[menus] listWorlds failed', e); }
    if (ticket !== this.titleRefresh) return;
    worlds.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
    this.lastWorld = worlds[0] ?? null;
    if (this.cur === 'title') this.screens.get('title')!.layout(guiLayout());
  }

  /** Continue: play the most recently played world directly. */
  private continueLast() {
    const w = this.lastWorld;
    if (!w || this.busy) return;
    this.busy = true;
    this.titleUI.cont.enable(false);
    this.handlers.playWorld(w.id)
      .catch((e) => { console.warn('[menus] playWorld failed', e); this.showTitle(); })
      .finally(() => { this.busy = false; this.titleUI.cont.enable(true); });
  }

  // ------------------------------------------------------------------ worlds
  private worldsUI!: {
    list: ScrollList; title: HTMLDivElement; empty: HTMLDivElement;
    play: Btn; create: Btn; del: Btn; back: Btn;
    confirm: HTMLDivElement; confirmLines: HTMLDivElement; yes: Btn; no: Btn;
    rows: HTMLDivElement[];
  };

  private buildWorlds() {
    const s = this.add('worlds', 'bf-dirt');
    const title = line(s.gui, 'Select World', 8);
    const list = new ScrollList(s.gui, true);
    const empty = div('bf-h1 bf-c-gray', list.inner);
    const play = button(s.gui, 'Play Selected World', 150, () => this.playSelected());
    const create = button(s.gui, 'Create New World', 150, () => this.showCreate());
    const del = button(s.gui, 'Delete', 150, () => {
      const w = this.worlds.find((x) => x.id === this.selected);
      if (w) { this.confirmDelete = w; this.renderWorlds(); }
    });
    const back = button(s.gui, 'Back', 150, () => this.showTitle());
    const confirm = div('bf-abs', s.gui);
    confirm.style.inset = '0';
    const confirmLines = div('bf-abs', confirm);
    confirmLines.style.inset = '0';
    const yes = button(confirm, 'Delete', 150, () => void this.deleteConfirmed());
    const no = button(confirm, 'Cancel', 150, () => { this.confirmDelete = null; this.renderWorlds(); });
    this.worldsUI = { list, title, empty, play, create, del, back, confirm, confirmLines, yes, no, rows: [] };
    s.layout = (l) => {
      list.place(l, 32, l.gh - 64 - 32, l.cx + 140);
      at(play.el, l.cx - 154, l.gh - 52);
      at(create.el, l.cx + 4, l.gh - 52);
      at(del.el, l.cx - 154, l.gh - 28);
      at(back.el, l.cx + 4, l.gh - 28);
      at(yes.el, l.cx - 154, l.cy + 24);
      at(no.el, l.cx + 4, l.cy + 24);
      this.renderWorlds();
    };
    list.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.playSelected(); }
      else if (e.key === 'Delete' && this.selected) { e.preventDefault(); del.el.click(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const i = this.worlds.findIndex((w) => w.id === this.selected);
        const n = Math.max(0, Math.min(this.worlds.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
        if (this.worlds[n]) { this.selected = this.worlds[n].id; this.renderWorlds(); this.worldsUI.rows[n]?.focus({ preventScroll: true }); }
      }
    });
  }

  private async reloadWorlds() {
    this.worlds = [];
    this.worldsUI.empty.textContent = centered('Loading worlds...', 0);
    this.renderWorlds(false);
    try {
      this.worlds = await this.handlers.listWorlds();
    } catch (e) {
      console.warn('[menus] listWorlds failed', e);
      this.worlds = [];
      this.worldsUI.empty.textContent = centered('Could not read saved worlds in this browser.', 0);
      this.renderWorlds(false);
      return;
    }
    this.worlds.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
    if (!this.worlds.some((w) => w.id === this.selected)) this.selected = this.worlds[0]?.id ?? null;
    this.worldsUI.empty.textContent = centered('No worlds yet. Create one to start building!', 0);
    if (this.cur === 'worlds') this.renderWorlds();
  }

  private renderWorlds(showEmpty = true) {
    const ui = this.worldsUI;
    const l = guiLayout();
    const confirming = !!this.confirmDelete;
    ui.confirm.style.display = confirming ? '' : 'none';
    for (const e of [ui.list.el, ui.play.el, ui.create.el, ui.del.el, ui.back.el, ui.title]) e.style.display = confirming ? 'none' : '';
    if (confirming) {
      const w = this.confirmDelete!;
      ui.confirmLines.textContent = '';
      let y = l.cy - 40;
      line(ui.confirmLines, 'Delete this world?', y);
      y += 20;
      for (const ln of wrapText(`"${fit(w.name, 200)}" and everything built in it will be gone for good.`, 300)) {
        line(ui.confirmLines, ln, y, 'bf-c-gray');
        y += 10;
      }
      ui.yes.el.classList.add('bf-c-red');
      return;
    }
    // Rebuild rows (the list is short; this runs on open and after changes only).
    for (const r of ui.rows) r.remove();
    ui.rows = [];
    ui.empty.style.display = this.worlds.length || !showEmpty ? (this.worlds.length ? 'none' : '') : '';
    ui.empty.style.top = U(12);
    this.worlds.forEach((w, i) => {
      const row = div('bf-row', ui.list.inner);
      row.tabIndex = 0;
      row.dataset.y = String(4 + i * 36);
      row.dataset.h = '36';
      at(row, l.cx - 135, 4 + i * 36, 270, 36);
      row.classList.toggle('bf-sel', w.id === this.selected);
      const img = el('img', 'bf-thumbimg', row);
      img.src = worldThumb(w.seed, this.settings.resourcePack);
      img.alt = '';
      img.draggable = false;
      const play = div('bf-play', row);
      play.addEventListener('click', (e) => { e.stopPropagation(); this.selected = w.id; this.playSelected(); });
      const name = div('bf-abs', row, fit(w.name || 'World', 228));
      at(name, 35, 0);
      const l2 = div('bf-abs bf-c-gray', row, fit(`Last played ${formatDate(w.lastPlayed)}`, 228));
      at(l2, 35, 11);
      const l3 = div('bf-abs bf-c-gray', row, fit(`Creative mode, seed ${w.seed}`, 228));
      at(l3, 35, 22);
      row.addEventListener('click', () => {
        if (this.selected === w.id) return;
        this.selected = w.id;
        for (const r of ui.rows) r.classList.toggle('bf-sel', r === row);
        this.updateWorldButtons();
      });
      row.addEventListener('dblclick', () => { this.selected = w.id; this.playSelected(); });
      ui.rows.push(row);
    });
    ui.list.setContent(this.worlds.length * 36 + 8);
    this.updateWorldButtons();
  }

  private updateWorldButtons() {
    const has = !!this.selected && this.worlds.some((w) => w.id === this.selected);
    this.worldsUI.play.enable(has && !this.busy);
    this.worldsUI.del.enable(has && !this.busy);
    this.worldsUI.create.enable(!this.busy);
  }

  private playSelected() {
    const id = this.selected;
    if (!id || this.busy) return;
    this.busy = true;
    this.updateWorldButtons();
    this.handlers.playWorld(id).catch((e) => { console.warn('[menus] playWorld failed', e); this.showWorlds(); }).finally(() => { this.busy = false; });
  }

  private async deleteConfirmed() {
    const w = this.confirmDelete;
    if (!w) return;
    this.worldsUI.yes.enable(false);
    try { await this.handlers.deleteWorld(w.id); } catch (e) { console.warn('[menus] deleteWorld failed', e); }
    this.worldsUI.yes.enable(true);
    this.confirmDelete = null;
    if (this.selected === w.id) this.selected = null;
    await this.reloadWorlds();
    this.renderWorlds();
  }

  // ------------------------------------------------------------------ create
  private createUI!: { name: HTMLInputElement; seed: HTMLInputElement; go: Btn };

  private showCreate() {
    this.createUI.name.value = 'New World';
    this.createUI.seed.value = '';
    this.createUI.go.enable(true);
    this.show('create');
    this.createUI.name.focus({ preventScroll: true });
    this.createUI.name.select();
  }

  private buildCreate() {
    const s = this.add('create', 'bf-dirt');
    line(s.gui, 'Create New World', 20);
    const nameLbl = div('bf-label', s.gui, 'World Name');
    const name = el('input', 'bf-field', s.gui);
    name.type = 'text'; name.maxLength = 32; name.spellcheck = false; name.autocomplete = 'off';
    const seedLbl = div('bf-label', s.gui, 'Seed for the world generator');
    const seed = el('input', 'bf-field', s.gui);
    seed.type = 'text'; seed.maxLength = 64; seed.spellcheck = false; seed.autocomplete = 'off';
    seed.placeholder = 'Leave blank for a random seed';
    const seedHint = div('bf-label', s.gui, 'Numbers and words both work.');
    const mode = button(s.gui, 'Game Mode: Creative', 200, () => undefined, 'Unlimited blocks, flying and instant breaking. The only mode in BlockForge.');
    mode.el.classList.add('bf-off');
    const modeHint = div('bf-label', s.gui);
    const go = button(s.gui, 'Create New World', 150, () => void this.doCreate());
    const cancel = button(s.gui, 'Cancel', 150, () => this.showWorlds());
    this.createUI = { name, seed, go };
    for (const f of [name, seed]) {
      f.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); void this.doCreate(); }
        else if (e.key !== 'Escape') e.stopPropagation();
      });
    }
    s.layout = (l) => {
      const top = Math.max(36, Math.min(60, l.qh));
      at(nameLbl, l.cx - 100, top - 13);
      at(name, l.cx - 100, top);
      at(seedLbl, l.cx - 100, top + 31);
      at(seed, l.cx - 100, top + 44);
      at(seedHint, l.cx - 100, top + 67);
      at(mode.el, l.cx - 100, top + 84);
      modeHint.textContent = '';
      at(modeHint, l.cx - 100, top + 107);
      at(go.el, l.cx - 154, l.gh - 28);
      at(cancel.el, l.cx + 4, l.gh - 28);
    };
  }

  private async doCreate() {
    if (this.busy) return;
    this.busy = true;
    this.createUI.go.enable(false);
    const name = this.createUI.name.value.trim() || 'New World';
    try {
      await this.handlers.createWorld(name, this.createUI.seed.value);
    } catch (e) {
      console.warn('[menus] createWorld failed', e);
      this.showWorlds();
    } finally {
      this.busy = false;
      this.createUI.go.enable(true);
    }
  }

  // ------------------------------------------------------------------ options
  /** Save, apply live, and keep the preset label honest after an option changed. */
  private settingsEdited(presetKey: boolean) {
    const st = this.settings;
    syncShaderFlags(st);
    if (presetKey) st.preset = matchPreset(st);
    saveSettings(st);
    try { this.handlers.settingsChanged(st); } catch (e) { console.warn('[menus] settingsChanged failed', e); }
  }

  private buildOptions() {
    const s = this.add('options', 'bf-dirt');
    const title = line(s.gui, 'Options', 13);
    void title;
    const list = new ScrollList(s.gui, false);
    const done = button(s.gui, 'Done', 200, () => this.back());
    const st = this.settings;
    const PRESET_KEYS: (keyof Settings)[] = ['renderDistance', 'fancyLeaves', 'smoothLighting', 'shaderPack', 'shadowQuality', 'clouds', 'resolutionScale', 'mipmaps'];

    const changed = (key?: keyof Settings) => {
      this.settingsEdited(!!key && PRESET_KEYS.includes(key));
      if (key === 'guiScale') injectStyles(st.guiScale);
      refreshAll();
    };
    const onOff = (b: boolean) => (b ? 'ON' : 'OFF');
    type Item = { kind: 'header'; text: string } | { kind: 'pair'; a: HTMLElement | null; b: HTMLElement | null } | { kind: 'wide'; el: HTMLElement; gap?: number };
    const items: Item[] = [];
    const refreshers: (() => void)[] = [];
    const refreshAll = () => { for (const f of refreshers) f(); };
    const W = 150;

    const toggle = (label: string, key: keyof Settings, tip: string, after?: () => void) => {
      const b = button(list.inner, '', W, () => { (st as unknown as Record<string, unknown>)[key] = !st[key]; after?.(); changed(key); }, tip);
      refreshers.push(() => b.set(`${label}: ${onOff(!!st[key])}`));
      return b.el;
    };
    const cycle = <T>(label: string, values: T[], get: () => T, set: (v: T) => void, fmt: (v: T) => string, key: keyof Settings, tip: string, enabled?: () => boolean) => {
      const b = button(list.inner, '', W, () => {
        const i = values.indexOf(get());
        set(values[(i + 1) % values.length]);
        changed(key);
      }, tip);
      refreshers.push(() => { b.set(`${label}: ${fmt(get())}`); if (enabled) b.enable(enabled()); });
      return b.el;
    };
    const slide = (key: keyof Settings, min: number, max: number, step: number, label: (v: number) => string, tip: string, scale = 1) => {
      const sl = slider(list.inner, W, min, max, step,
        () => Math.round(((st[key] as number) * scale) / step) * step,
        (v) => { (st as unknown as Record<string, number>)[key] = v / scale; changed(key); },
        label, tip);
      refreshers.push(sl.refresh);
      return sl.el;
    };
    const pair = (a: HTMLElement | null, b: HTMLElement | null) => items.push({ kind: 'pair', a, b });
    const wide = (e: HTMLElement, gap = 0) => items.push({ kind: 'wide', el: e, gap });
    const header = (text: string) => items.push({ kind: 'header', text });

    header('Graphics');
    const shaders = button(list.inner, '', 310, () => this.showShaders(),
      'Off is the fastest. Fancy adds sun shadows, waving plants and reflective water. Ultra adds bloom, god rays and mirror water.');
    shaders.el.classList.add('bf-feature');
    refreshers.push(() => shaders.set(`Shaders: ${SHADER_LABEL[st.shaderPack] ?? 'Off'}...`));
    wide(shaders.el);
    pair(
      cycle<Preset>('Graphics', ['low', 'medium', 'high'], () => st.preset, (p) => applyPreset(st, p as Exclude<Preset, 'custom'>),
        (p) => PRESET_LABEL[p], 'preset', 'Low runs at 60 fps on most school laptops. Medium turns on Fancy shaders and see-through leaves. High uses Ultra shaders and sees further.'),
      slide('renderDistance', 2, 12, 1, (v) => `Render Distance: ${v} chunks`, 'How far you can see. Lower is faster.'),
    );
    const packs = button(list.inner, 'Resource Packs...', W, () => this.showPacks(), 'Change the look of every block: smooth, retro, vivid or pastel.');
    packs.el.classList.add('bf-feature');
    pair(
      packs.el,
      slide('fov', 50, 110, 1, (v) => `FOV: ${v === 70 ? 'Normal' : v}`, 'Field of view in degrees.'),
    );
    pair(
      slide('brightness', 0, 100, 1, (v) => `Brightness: ${v === 0 ? 'Moody' : v === 100 ? 'Bright' : v + '%'}`, 'Lifts dark caves and nights.', 100),
      toggle('Smooth Lighting', 'smoothLighting', 'Soft light and shadows in corners (ambient occlusion).'),
    );
    pair(
      toggle('Fancy Leaves', 'fancyLeaves', 'See-through leaves. Off draws solid leaves, which is faster.'),
      toggle('Clouds', 'clouds', 'Blocky clouds drifting overhead.'),
    );
    pair(
      toggle('Mipmaps', 'mipmaps', 'Smooths distant textures and stops shimmering.'),
      slide('resolutionScale', 50, 100, 5, (v) => `Resolution: ${v}%`, 'Renders fewer pixels and scales up. Lower is faster.', 100),
    );
    pair(
      toggle('View Bobbing', 'viewBobbing', 'The camera bobs while you walk.'),
      slide('maxFps', 0, 240, 10, (v) => `Max Framerate: ${v === 0 ? 'VSync' : v + ' fps'}`, 'Cap the frame rate to save battery. VSync follows the screen.'),
    );
    header('Controls');
    pair(
      cycle<'keyboard' | 'touch'>('Controls', ['keyboard', 'touch'], () => st.controls, (v) => { st.controls = v; st.controlsChosen = true; }, (v) => (v === 'touch' ? 'Touch' : 'Keyboard & Mouse'),
        'controls', 'Touch shows on-screen sticks and buttons for phones and tablets.'),
      slide('sensitivity', 10, 200, 5, (v) => `Sensitivity: ${v}%`, 'Mouse look speed.', 100),
    );
    pair(
      toggle('Invert Mouse', 'invertY', 'Moving the mouse up looks down.'),
      toggle('Fullscreen on Play', 'fullscreen', 'Go fullscreen when a world starts. In fullscreen the game can keep Ctrl+W from closing the tab.'),
    );
    pair(
      slide('touchSensitivity', 25, 300, 5, (v) => `Touch Look: ${v}%`, 'How fast dragging turns the camera.', 100),
      slide('touchButtonScale', 75, 150, 5, (v) => `Touch Buttons: ${v}%`, 'Size of the on-screen buttons.', 100),
    );
    const keys = button(list.inner, 'Key Bindings...', W, () => this.showControls(() => this.showOptions(this.optionsBack)), 'Every key and mouse button.');
    pair(keys.el, null);
    header('Interface and Sound');
    pair(
      cycle<number>('GUI Scale', [2, 3, 4], () => st.guiScale, (v) => { st.guiScale = v; }, (v) => {
        const l = guiLayout();
        const eff = Math.round(l.uDev / l.dpr);
        return eff < v ? `${v} (fits ${eff})` : String(v);
      }, 'guiScale', 'Size of menus and the HUD. Small screens use the largest size that fits.'),
      toggle('Show FPS', 'showFps', 'Frames per second in the corner (F3 shows more).'),
    );
    pair(
      slide('volume', 0, 100, 1, (v) => `Volume: ${v === 0 ? 'OFF' : v + '%'}`, 'Sound effects volume.', 100),
      null,
    );

    // Restore Defaults: the first click arms it for 3 seconds, the second one resets everything.
    let armTimer = 0;
    const disarm = () => {
      clearTimeout(armTimer);
      armTimer = 0;
      restore.set('Restore Defaults');
      restore.el.classList.remove('bf-warn');
    };
    const restore = button(list.inner, 'Restore Defaults', 310, () => {
      if (!armTimer) {
        restore.set('Click again to restore defaults');
        restore.el.classList.add('bf-warn');
        armTimer = window.setTimeout(disarm, 3000);
        return;
      }
      disarm();
      restoreDefaults(st);
      saveSettings(st);
      injectStyles(st.guiScale);
      try { this.handlers.settingsChanged(st); } catch (e) { console.warn('[menus] settingsChanged failed', e); }
      refreshAll();
    }, 'Put every option back the way it was the first time you played. Your worlds are not touched.');
    restore.el.classList.add('bf-restore');
    wide(restore.el, 8);

    const headers: HTMLDivElement[] = [];
    for (const it of items) if (it.kind === 'header') {
      const h = div('bf-h1 bf-c-yellow', list.inner);
      h.textContent = centered(it.text, 0);
      headers.push(h);
    }
    this.settingsUI = { refresh: refreshAll };
    refreshAll();

    s.layout = (l) => {
      list.place(l, 32, l.gh - 64, l.cx + 160);
      let y = 4, hi = 0;
      for (const it of items) {
        if (it.kind === 'header') {
          const h = headers[hi++];
          h.style.top = U(y + 5);
          y += 18;
        } else if (it.kind === 'wide') {
          y += it.gap ?? 0;
          at(it.el, l.cx - 155, y);
          it.el.dataset.y = String(y);
          y += 24;
        } else {
          if (it.a) { at(it.a, l.cx - 155, y); it.a.dataset.y = String(y); }
          if (it.b) { at(it.b, l.cx + 5, y); it.b.dataset.y = String(y); }
          y += 24;
        }
      }
      list.setContent(y + 4);
      at(done.el, l.cx - 100, l.gh - 26);
      refreshAll();
    };
    (s as Screen & { onShow?: () => void }).onShow = () => {
      if (!this.keepOptionsScroll) list.scrollTo(0);
      this.keepOptionsScroll = false;
      disarm();
      refreshAll();
    };
  }
  private keepOptionsScroll = false;

  // ------------------------------------------------------------------ shaders
  private buildShaders() {
    const s = this.add('shaders', 'bf-dirt');
    const title = line(s.gui, 'Shaders', 13);
    const st = this.settings;
    const cards = SHADER_INFO.map((info) => {
      const b = el('button', 'bf-btn bf-card', s.gui);
      b.type = 'button';
      const radio = div('bf-radio', b);
      const name = div('bf-abs bf-card-name', b);
      const desc = div('bf-abs bf-c-gray bf-card-desc', b);
      b.addEventListener('click', (e) => {
        e.preventDefault();
        if (st.shaderPack === info.id) return;
        st.shaderPack = info.id;
        this.settingsEdited(true);
        refresh();
      });
      return { info, b, radio, name, desc };
    });
    const quality = button(s.gui, '', 200, () => {
      st.shadowQuality = st.shadowQuality === 2048 ? 1024 : 2048;
      this.settingsEdited(true);
      refresh();
    }, 'Sharper shadows cost more graphics memory.');
    const note = div('bf-h1 bf-c-gray', s.gui);
    const done = button(s.gui, 'Done', 200, () => this.back());
    const refresh = () => {
      for (const c of cards) {
        const on = st.shaderPack === c.info.id;
        c.b.classList.toggle('bf-on', on);
        c.b.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      quality.set(`Shadow Quality: ${st.shadowQuality === 2048 ? 'High' : 'Normal'}`);
      quality.enable(st.shaderPack !== 'off');
    };
    s.layout = (l) => {
      const w = Math.min(300, l.gw - 16);
      const lines = cards.map((c) => wrapText(c.info.desc, w - 34));
      const h = 19 + Math.max(...lines.map((x) => x.length)) * 10 + 4;
      const block = cards.length * (h + 4) + 4 + 20;
      const top = Math.max(28, Math.min(l.qh + 4, Math.round((l.gh - 30 - block) / 2)));
      title.style.top = U(Math.max(8, top - 18) - 1);
      cards.forEach((c, i) => {
        at(c.b, l.cx - (w >> 1), top + i * (h + 4), w, h);
        c.b.style.height = U(h);
        at(c.radio, 7, Math.round(h / 2) - 5, 10, 10);
        c.name.textContent = SHADER_LABEL[c.info.id];
        at(c.name, 26, 5);
        c.desc.textContent = '';
        lines[i].forEach((ln, k) => { const d = div('', c.desc, ln); d.style.height = U(10); void k; });
        at(c.desc, 26, 16);
      });
      const qy = top + cards.length * (h + 4) + 4;
      at(quality.el, l.cx - 100, qy);
      const ny = qy + 28;
      note.style.display = ny + 10 < l.gh - 30 ? '' : 'none';
      note.textContent = centered('Changes show right away. Off is the fastest.', 0);
      note.style.top = U(ny);
      at(done.el, l.cx - 100, l.gh - 26);
      refresh();
    };
    (s as Screen & { onShow?: () => void }).onShow = () => refresh();
  }

  // ------------------------------------------------------------------ resource packs
  private buildPacks() {
    const s = this.add('packs', 'bf-dirt');
    line(s.gui, 'Resource Packs', 13);
    const list = new ScrollList(s.gui, true);
    const done = button(s.gui, 'Done', 98, () => this.back());
    const st = this.settings;
    const ROW = 48;
    // Importing a pack: the player picks a .zip; it is read in this browser and kept here only.
    const file = el('input', '', s.root);
    file.type = 'file';
    // Phone file pickers label zips several ways, and phone players often have Bedrock .mcpack
    // files (the importer explains those instead of the picker greying them out).
    file.accept = '.zip,.mcpack,application/zip,application/x-zip-compressed,application/x-zip';
    file.style.display = 'none';
    const status = div('bf-abs bf-c-gray', s.gui);
    let busy = false;
    let savedOk = true;          // false when this browser would not store the imported pack
    let lastLayout: GuiLayout | null = null;
    /** Status line under the list: wrapped to at most two lines so phones show all of it. */
    const say = (t: string) => {
      const lines = t ? wrapText(t, curW).slice(0, 2) : [];
      status.textContent = lines.join('\n');
      if (lastLayout) at(status, lastLayout.cx - (curW >> 1), lastLayout.gh - 30 - 10 * Math.max(1, lines.length));
    };
    const importBtn = button(s.gui, 'Import Pack...', 98, () => { if (!busy) file.click(); },
      'Load a resource pack .zip from this device. It stays in this browser and is never uploaded.');
    const removeBtn = button(s.gui, 'Remove Import', 98, () => {
      if (busy || !customPackInfo()) return;
      setCustomPack(null);
      void deleteCustomPack();
      forgetKey();          // a pack link's pack must not come back by itself after this
      savedOk = true;
      clearPackIcons('custom');
      if (st.resourcePack === 'custom') this.pickPack('default', () => refresh());
      resetPreview();
      refresh();
    }, 'Forget the imported pack.');
    file.addEventListener('change', async () => {
      const f = file.files && file.files[0];
      file.value = '';
      if (!f || busy) return;
      busy = true;
      importBtn.enable(false);
      say(fit('Reading ' + f.name, curW));
      try {
        const pack = await importResourcePack(f, f.name, (d, n) => { say(`Importing textures: ${Math.round((d / n) * 100)}%`); });
        // Show it first: storing it can stall or fail on some phones and must not hold it back.
        setCustomPack(pack);
        clearPackIcons('custom');
        resetPreview();
        if (st.resourcePack === 'custom') {
          try { this.handlers.reapplyResourcePack?.(); } catch (e) { console.warn(e); }
        } else this.pickPack('custom', () => refresh());
        say(`Imported ${pack.tiles.size} textures from ${pack.name}`);
        savedOk = await Promise.race([
          saveCustomPack(pack).then(() => true, (e) => { console.warn('[packs] could not store the imported pack', e); return false; }),
          new Promise<boolean>((r) => setTimeout(() => r(false), 8000)),
        ]);
        if (!savedOk) say('Imported for this visit only: this browser would not save it, so import it again next time.');
      } catch (e) {
        say((e instanceof Error ? e.message : String(e)).slice(0, 160));
      } finally {
        busy = false;
        importBtn.enable(true);
        refresh();
      }
    });
    const rows = RESOURCE_PACKS.map((p, i) => {
      const row = div('bf-row bf-packrow', list.inner);
      row.tabIndex = 0;
      row.dataset.pack = p.id;
      row.dataset.y = String(4 + i * ROW);
      row.dataset.h = String(ROW);
      const name = div('bf-abs', row, p.name);
      const used = div('bf-abs bf-c-green bf-right', row, 'Selected');
      const desc = div('bf-abs bf-c-gray', row);
      const strip = div('bf-abs bf-strip', row);
      const imgs = PACK_PREVIEW.map(() => {
        const im = el('img', 'bf-stripimg', strip);
        im.alt = ''; im.draggable = false;
        return im;
      });
      const pick = () => {
        // The imported pack slot opens the file picker until something has been imported.
        if (p.id === 'custom' && !customPackInfo()) { if (!busy) file.click(); return; }
        this.pickPack(p.id, refresh);
      };
      row.addEventListener('click', pick);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const n = Math.max(0, Math.min(RESOURCE_PACKS.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
          rows[n]?.row.focus({ preventScroll: true });
          list.ensureVisible(4 + n * ROW, ROW);
        }
      });
      return { p, row, name, used, desc, strip, imgs };
    });
    const resetPreview = () => {
      const r = rows.find((x) => x.p.id === 'custom');
      if (r) r.imgs.forEach((im, k) => { im.src = customPackInfo() ? packIcon(ID[PACK_PREVIEW[k]] ?? 0, 'custom') : ''; im.style.visibility = customPackInfo() ? '' : 'hidden'; });
    };
    const refresh = () => {
      const info = customPackInfo();
      for (const r of rows) {
        const on = st.resourcePack === r.p.id;
        r.row.classList.toggle('bf-sel', on);
        r.name.classList.toggle('bf-c-yellow', on);
        r.used.style.display = on ? '' : 'none';
        if (r.p.id === 'custom') {
          r.name.textContent = info ? info.name : 'Imported Pack';
          r.desc.textContent = fit(!info ? 'Load a resource pack .zip from this device.'
            : savedOk ? `${info.count} textures, kept in this browser only.` : `${info.count} textures, not saved: import again next time.`, curW - 12);
        }
      }
      removeBtn.enable(!!info && !busy);
    };
    let curW = 300;
    s.layout = (l) => {
      const w = Math.min(300, l.gw - 20);
      curW = w;
      lastLayout = l;
      // room for a two-line status message between the list and the buttons
      list.place(l, 30, l.gh - 30 - 56, l.cx + (w >> 1) + 4);
      rows.forEach((r, i) => {
        at(r.row, l.cx - (w >> 1), 4 + i * ROW, w, ROW - 4);
        at(r.name, 6, 4);
        at(r.used, w - 8 - textAdvance('Selected'), 4);
        r.desc.textContent = fit(r.p.description, w - 12);
        at(r.desc, 6, 14);
        at(r.strip, 6, 25, PACK_PREVIEW.length * 18, 16);
        r.imgs.forEach((im, k) => at(im, k * 18, 0, 16, 16));
      });
      list.setContent(RESOURCE_PACKS.length * ROW + 8);
      const nLines = status.textContent ? status.textContent.split('\n').length : 1;
      at(status, l.cx - (w >> 1), l.gh - 30 - 10 * nLines);
      at(importBtn.el, l.cx - 151, l.gh - 26);
      at(removeBtn.el, l.cx - 49, l.gh - 26);
      at(done.el, l.cx + 53, l.gh - 26);
      refresh();
    };
    (s as Screen & { onShow?: () => void }).onShow = () => {
      // Preview icons are drawn the first time the screen opens (a few ms per pack).
      for (const r of rows) {
        if (r.p.id === 'custom') continue;
        r.imgs.forEach((im, k) => {
          const id = ID[PACK_PREVIEW[k]] ?? 0;
          if (!im.src) im.src = packIcon(id, r.p.id);
        });
      }
      resetPreview();
      say('');
      refresh();
    };
  }

  /** Select a resource pack: highlight it now, rebuild the textures on the next frame. */
  private pickPack(id: ResourcePackId, refresh: () => void) {
    const st = this.settings;
    if (st.resourcePack === id) return;
    st.resourcePack = id;
    refresh();
    saveSettings(st);
    const apply = () => {
      if (st.resourcePack !== id) return;
      this.settingsEdited(false);
      // Title art and world thumbnails are redrawn from the new pack when shown next.
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => setTimeout(apply, 0));
    else setTimeout(apply, 0);
  }

  // ------------------------------------------------------------------ controls
  private buildControls() {
    const s = this.add('controls', 'bf-dirt');
    line(s.gui, 'Controls', 13);
    const list = new ScrollList(s.gui, false);
    const done = button(s.gui, 'Done', 98, () => { stopCapture(); this.back(); });
    const resetAll = button(s.gui, 'Reset Keys', 98, () => {
      stopCapture();
      resetBindings(this.settings);
      saveSettings(this.settings);
      render();
    }, 'Put every key back the way it started.');
    const content = div('bf-abs', list.inner);
    content.style.left = '0'; content.style.right = '0';
    let capturing: Action | null = null;
    let lastLayout: GuiLayout | null = null;

    // While waiting for a key, grab the next key or mouse button before the game sees it.
    const onKey = (e: KeyboardEvent) => {
      if (!capturing) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.repeat) return;
      const code = e.code || '';
      if (code !== 'Escape' && code && !UNBINDABLE.has(code)) assign(capturing, code);
      stopCapture();
      render();
    };
    const onMouse = (e: MouseEvent) => {
      if (!capturing || e.button < 0 || e.button > 4) return;
      e.preventDefault(); e.stopImmediatePropagation();
      assign(capturing, 'Mouse' + e.button);
      // A left click is followed by a click event: swallow it so it does not press another button.
      if (e.button === 0) {
        const swallow = (c: Event) => { c.preventDefault(); c.stopImmediatePropagation(); };
        window.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => window.removeEventListener('click', swallow, true), 500);
      }
      stopCapture();
      render();
    };
    const assign = (a: Action, code: string) => { setBinding(this.settings, a, code); saveSettings(this.settings); };
    const startCapture = (a: Action) => {
      capturing = a;
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('mousedown', onMouse, true);
      render();
    };
    function stopCapture() {
      capturing = null;
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('mousedown', onMouse, true);
    }

    const render = () => {
      const l = lastLayout;
      if (!l) return;
      content.textContent = '';
      const bad = conflicts();
      let y = 4;
      const head = (t: string) => {
        const h = div('bf-h1 bf-c-yellow', content);
        h.textContent = centered(t, 0);
        h.style.top = U(y + 5);
        y += 18;
      };
      const touchFirst = this.settings.controls === 'touch';
      const touchRows = () => {
        head('Touch controls');
        for (const [label, key] of TOUCH_KEYS) {
          at(div('bf-abs', content, fit(label, 170)), l.cx - 155, y + 5);
          const k = div('bf-keycap', content);
          k.textContent = centered(key, 90);
          at(k, l.cx + 20, y, 90, 20);
          y += 22;
        }
        y += 4;
      };
      if (touchFirst) touchRows();
      for (const group of ['Movement', 'Gameplay', 'Interface', 'Hotbar'] as const) {
        head(group === 'Gameplay' ? 'Gameplay' : group);
        for (const info of ACTIONS) {
          if (info.group !== group) continue;
          const lab = div('bf-abs', content, fit(info.label, 170));
          at(lab, l.cx - 155, y + 5);
          const code = bound(info.id);
          const waiting = capturing === info.id;
          const key = button(content, waiting ? '> Press a key <' : keyName(code), 90, () => {
            if (capturing === info.id) { stopCapture(); render(); } else startCapture(info.id);
          }, waiting ? 'Press any key or mouse button. Esc cancels.' : 'Click, then press the new key or mouse button.');
          if (waiting) key.el.classList.add('bf-c-yellow');
          else if (bad.has(info.id)) key.el.classList.add('bf-c-red');
          at(key.el, l.cx + 20, y);
          const reset = button(content, 'Reset', 44, () => {
            stopCapture();
            setBinding(this.settings, info.id, info.def);
            saveSettings(this.settings);
            render();
          }, 'Back to ' + keyName(info.def) + '.');
          reset.enable(code !== info.def);
          at(reset.el, l.cx + 114, y);
          y += 22;
        }
        y += 4;
      }
      head('Fixed');
      for (const [label, key] of FIXED_KEYS) {
        at(div('bf-abs', content, fit(label, 170)), l.cx - 155, y + 5);
        const k = div('bf-keycap', content);
        k.textContent = centered(key, 90);
        at(k, l.cx + 20, y, 90, 20);
        y += 22;
      }
      y += 4;
      if (!touchFirst) touchRows();
      list.setContent(y + 4);
    };
    s.layout = (l) => {
      lastLayout = l;
      list.place(l, 32, l.gh - 64, l.cx + 160);
      render();
      at(resetAll.el, l.cx - 100, l.gh - 26);
      at(done.el, l.cx + 2, l.gh - 26);
    };
    (s as Screen & { onShow?: () => void }).onShow = () => { stopCapture(); render(); list.scrollTo(0); };
  }

  // ------------------------------------------------------------------ pause
  private buildPause() {
    const s = this.add('pause', 'bf-pause-bg');
    const title = line(s.gui, 'Game Menu', 40);
    const resume = button(s.gui, 'Back to Game', 204, () => this.handlers.resume());
    const opts = button(s.gui, 'Options...', 98, () => this.showOptions(() => this.showPause()));
    const ctrl = button(s.gui, 'Controls', 98, () => this.showControls(() => this.showPause()));
    const time = button(s.gui, '', 204, () => {
      const m = this.handlers.getTimeMode();
      this.handlers.setTimeMode(TIME_ORDER[(TIME_ORDER.indexOf(m) + 1) % TIME_ORDER.length]);
      refreshTime();
    }, 'Keep the sun moving, or stop the clock at a time you like.');
    const shaders = button(s.gui, '', 204, () => {
      const st = this.settings;
      st.shaderPack = SHADER_ORDER[(SHADER_ORDER.indexOf(st.shaderPack) + 1) % SHADER_ORDER.length];
      this.settingsEdited(true);
      refreshShaders();
    }, 'Off is the fastest. Fancy adds sun shadows, waving plants and reflective water. Ultra adds bloom, god rays and mirror water.');
    const refreshShaders = () => shaders.set(`Shaders: ${SHADER_LABEL[this.settings.shaderPack] ?? 'Off'}`);
    const quit = button(s.gui, 'Save and Quit to Title', 204, () => {
      if (this.busy) return;
      this.busy = true;
      quit.enable(false);
      this.handlers.saveAndQuit().catch((e) => { console.warn('[menus] saveAndQuit failed', e); this.showTitle(); })
        .finally(() => { this.busy = false; quit.enable(true); });
    });
    const tip = div('bf-abs', s.gui);
    tip.style.left = '0';
    const refreshTime = () => time.set(`Time of Day: ${TIME_LABEL[this.handlers.getTimeMode()] ?? 'Day Cycle'}`);
    s.layout = (l) => {
      const y0 = Math.max(56, l.qh + 8);
      title.style.top = U(Math.min(40, y0 - 22) - 1);
      at(resume.el, l.cx - 102, y0);
      at(opts.el, l.cx - 102, y0 + 24);
      at(ctrl.el, l.cx + 4, y0 + 24);
      at(time.el, l.cx - 102, y0 + 48);
      at(shaders.el, l.cx - 102, y0 + 72);
      at(quit.el, l.cx - 102, y0 + 108);
      tip.textContent = '';
      let y = y0 + 140;
      const lines = wrapText('Ctrl+W closes the tab in browsers: sprint with a double-tap of W, or turn on Fullscreen on Play in Options.', Math.min(300, l.gw - 20));
      // The tip is only shown when it fits under the buttons (small screens skip it).
      if (y + 11 + lines.length * 10 <= l.gh - 4) {
        line(tip, 'Tip', y, 'bf-c-yellow');
        y += 11;
        for (const ln of lines) { line(tip, ln, y, 'bf-c-gray'); y += 10; }
      }
      refreshTime();
      refreshShaders();
    };
    (s as Screen & { onShow?: () => void }).onShow = () => { quit.enable(true); refreshTime(); refreshShaders(); };
  }

  // ------------------------------------------------------------------ loading
  private loadingUI!: { text: HTMLDivElement; bar: HTMLDivElement; fill: HTMLDivElement; pct: HTMLDivElement; hint: HTMLDivElement };

  private buildLoading() {
    const s = this.add('loading', 'bf-dirt');
    const text = div('bf-h1', s.gui);
    const bar = div('bf-progress', s.gui);
    const fill = div('bf-fill', bar);
    const pct = div('bf-h1 bf-c-gray', s.gui);
    const hint = div('bf-h1 bf-c-gray', s.gui);
    this.loadingUI = { text, bar, fill, pct, hint };
    s.layout = (l) => {
      text.style.top = U(l.cy - 26);
      at(bar, l.cx - 101, l.cy - 6, 202, 10);
      pct.style.top = U(l.cy + 10);
      hint.style.top = U(l.gh - 24);
    };
  }

  private pickHint() {
    const h = HINTS[Math.floor(Math.random() * HINTS.length)];
    this.loadingUI.hint.textContent = centered(h, 0);
  }

  private updateLoading(text: string, p: number) {
    const ui = this.loadingUI, st = this.loadingState;
    if (text !== st.text) { st.text = text; ui.text.textContent = centered(text, 0); }
    if (p !== st.progress) {
      st.progress = p;
      const show = p >= 0;
      ui.bar.style.display = show ? '' : 'none';
      ui.pct.style.display = show ? '' : 'none';
      if (show) {
        ui.fill.style.width = U(Math.round(p * 198));
        ui.pct.textContent = centered(`${Math.round(p * 100)}%`, 0);
      }
    }
  }
}

