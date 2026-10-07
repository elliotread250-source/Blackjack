// Menus: title, world list, create world, options, controls, pause and loading screens.
// Every screen is laid out like the classic block games: on the GUI-pixel grid, relative to
// the screen centre, and rebuilt (re-positioned) whenever the GUI size changes.
import type { Settings, Preset } from '../settings';
import { saveSettings, applyPreset } from '../settings';
import type { TimeMode, WorldMeta } from '../types';
import { injectStyles, guiLayout, onGuiLayout, U } from './style';
import type { GuiLayout } from './style';
import { centered, textAdvance } from './font';
import { blockIconCanvas } from './icons';
import { generateTexture } from '../blocks/textures';
import { ID, COUNT, TEXTURE_NAMES } from '../blocks/registry';

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
}

type ScreenName = 'title' | 'worlds' | 'create' | 'pause' | 'options' | 'controls' | 'loading';

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

let tileCache: Map<number, Uint8ClampedArray> | null = null;
const genTile = (t: number) => {
  if (!tileCache) tileCache = new Map();
  let d = tileCache.get(t);
  if (!d) { d = generateTexture(TEXTURE_NAMES[t] ?? 'missing'); tileCache.set(t, d); }
  return d;
};

const thumbCache = new Map<number, string>();
const THUMB_BLOCKS = ['grass_block', 'oak_log', 'cherry_leaves', 'sand', 'snowy_grass_block', 'stone_bricks', 'birch_log', 'mossy_cobblestone', 'spruce_planks', 'podzol'];
function worldThumb(seed: number): string {
  const name = THUMB_BLOCKS[(((seed | 0) % THUMB_BLOCKS.length) + THUMB_BLOCKS.length) % THUMB_BLOCKS.length];
  const id = ID[name] ?? ID.grass_block;
  let url = thumbCache.get(id);
  if (!url) {
    try { url = blockIconCanvas(id, genTile).toDataURL(); } catch { url = ''; }
    thumbCache.set(id, url);
  }
  return url;
}

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

let logoURL: string | null = null;
function drawLogo(): string {
  if (logoURL !== null) return logoURL;
  try {
    const c = document.createElement('canvas');
    c.width = LOGO_W; c.height = LOGO_H;
    const g = c.getContext('2d')!;
    const img = g.createImageData(LOGO_W, LOGO_H);
    const d = img.data;
    const stone = generateTexture('stone_bricks'), cobble = generateTexture('cobblestone');
    const hot = generateTexture('gold_block'), ember = generateTexture('magma');
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
  return logoURL;
}

// Side-on pixel landscape for the title screen, seamless over PANO_W pixels.
const PANO_W = 1024, PANO_H = 256;
let panoURL: string | null = null;
function drawPanorama(): string {
  if (panoURL !== null) return panoURL;
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
    const tile = (name: string) => generateTexture(name);
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
const KEYS: [string, [string, string][]][] = [
  ['Movement', [
    ['Walk forward / back', 'W / S'], ['Strafe left / right', 'A / D'], ['Jump, fly up', 'Space'],
    ['Toggle flying', 'Space x2'], ['Sneak, fly down', 'Shift'], ['Sprint', 'Ctrl or W x2'],
  ]],
  ['Building', [
    ['Break block (hold)', 'Left Click'], ['Place block, open door', 'Right Click'], ['Pick block', 'Middle Click'],
    ['Choose hotbar slot', '1 to 9'], ['Next / previous slot', 'Mouse Wheel'],
  ]],
  ['Inventory', [
    ['Creative inventory', 'E'], ['Hovered item to slot', '1 to 9'], ['Item to hotbar', 'Shift+Click'],
    ['Clear hotbar slot', 'Right Click'], ['Search blocks', 'T'], ['Close', 'E or Esc'],
  ]],
  ['Interface', [
    ['Pause menu', 'Esc'], ['Hide HUD', 'F1'], ['Screenshot', 'F2'], ['Debug screen', 'F3'],
  ]],
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
    this.tip = div('bf-tip', this.root);
    this.tip.style.position = 'absolute';
    this.root.addEventListener('pointerover', (e) => this.onTipOver(e));
    this.root.addEventListener('pointerdown', () => this.hideTip());
    onGuiLayout((l) => { if (this.cur) this.screens.get(this.cur)!.layout(l); });
  }

  // ------------------------------------------------------------------ public API
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
  showLoading(text: string, progress?: number): void {
    const p = progress === undefined ? -1 : Math.max(0, Math.min(1, progress));
    if (this.cur !== 'loading') { this.loadingState = { text: '', progress: -2 }; this.pickHint(); this.show('loading'); }
    this.updateLoading(text, p);
  }
  hide(): void {
    if (this.cur) this.screens.get(this.cur)!.root.style.display = 'none';
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
    else if (name !== 'options' && name !== 'controls') this.overGame = false;
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

    s.layout = (l) => {
      const art = drawPanorama();
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
      const lg = drawLogo();
      if (lg && logo.src !== lg) logo.src = lg;
      const lw = Math.round(LOGO_W / 2), lh = Math.round(LOGO_H / 2);
      at(logo, l.cx - (lw >> 1), 28, lw, lh);
      if (!splashText) splashText = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];
      splash.textContent = splashText;
      at(splash, l.cx + 104, 28 + lh - 2);
      splash.style.setProperty('--ss', String(Math.min(1.8, (1.8 * 100) / (textAdvance(splashText) + 32))));
      const y0 = l.qh + 48;
      at(single.el, l.cx - 100, y0);
      let y = y0 + 24;
      if (dl) { at(dl.el, l.cx - 100, y); y += 24; }
      y += 12;
      at(opts.el, l.cx - 100, y);
      at(ctrl.el, l.cx + 2, y);
      at(ver, 2, l.gh - 10);
      at(credit, l.gw - 2 - textAdvance(credit.textContent!), l.gh - 10);
      if (hint) hint.style.top = U(Math.min(l.gh - 24, y + 30));
    };
    (s as Screen & { onShow?: () => void }).onShow = () => {
      splashText = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];
      s.layout(guiLayout());
    };
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
      img.src = worldThumb(w.seed);
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
  private buildOptions() {
    const s = this.add('options', 'bf-dirt');
    const title = line(s.gui, 'Options', 13);
    void title;
    const list = new ScrollList(s.gui, false);
    const done = button(s.gui, 'Done', 200, () => this.back());
    const st = this.settings;
    const PRESET_KEYS: (keyof Settings)[] = ['renderDistance', 'fancyLeaves', 'smoothLighting', 'shadows', 'shadowQuality', 'waving', 'clouds', 'resolutionScale', 'mipmaps'];

    const changed = (key?: keyof Settings) => {
      if (key && PRESET_KEYS.includes(key)) st.preset = 'custom';
      saveSettings(st);
      try { this.handlers.settingsChanged(st); } catch (e) { console.warn('[menus] settingsChanged failed', e); }
      if (key === 'guiScale') injectStyles(st.guiScale);
      refreshAll();
    };
    const onOff = (b: boolean) => (b ? 'ON' : 'OFF');
    type Item = { kind: 'header'; text: string } | { kind: 'pair'; a: HTMLElement | null; b: HTMLElement | null };
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
    const header = (text: string) => items.push({ kind: 'header', text });

    header('Graphics');
    pair(
      cycle<Preset>('Graphics', ['low', 'medium', 'high'], () => st.preset, (p) => applyPreset(st, p as Exclude<Preset, 'custom'>),
        (p) => PRESET_LABEL[p], 'preset', 'Low runs at 60 fps on most school laptops. Medium adds see-through leaves and waving plants, High adds sun shadows.'),
      slide('renderDistance', 2, 12, 1, (v) => `Render Distance: ${v} chunks`, 'How far you can see. Lower is faster.'),
    );
    pair(
      slide('fov', 50, 110, 1, (v) => `FOV: ${v === 70 ? 'Normal' : v}`, 'Field of view in degrees.'),
      slide('brightness', 0, 100, 1, (v) => `Brightness: ${v === 0 ? 'Moody' : v === 100 ? 'Bright' : v + '%'}`, 'Lifts dark caves and nights.', 100),
    );
    pair(
      toggle('Smooth Lighting', 'smoothLighting', 'Soft light and shadows in corners (ambient occlusion).'),
      toggle('Fancy Leaves', 'fancyLeaves', 'See-through leaves. Off draws solid leaves, which is faster.'),
    );
    pair(
      toggle('Shadows', 'shadows', 'Real-time sun shadows. Needs a strong graphics chip.'),
      cycle<1024 | 2048>('Shadow Quality', [1024, 2048], () => st.shadowQuality, (v) => { st.shadowQuality = v; }, (v) => (v === 2048 ? 'High' : 'Normal'),
        'shadowQuality', 'Sharper shadows cost more graphics memory.', () => st.shadows),
    );
    pair(
      toggle('Waving Plants', 'waving', 'Grass, leaves and water move in the wind.'),
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
      cycle<'keyboard' | 'touch'>('Controls', ['keyboard', 'touch'], () => st.controls, (v) => { st.controls = v; }, (v) => (v === 'touch' ? 'Touch' : 'Keyboard & Mouse'),
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
    (s as Screen & { onShow?: () => void }).onShow = () => { list.scrollTo(0); refreshAll(); };
  }

  // ------------------------------------------------------------------ controls
  private buildControls() {
    const s = this.add('controls', 'bf-dirt');
    line(s.gui, 'Controls', 13);
    const list = new ScrollList(s.gui, false);
    const done = button(s.gui, 'Done', 200, () => this.back());
    const content = div('bf-abs', list.inner);
    content.style.left = '0'; content.style.right = '0';
    s.layout = (l) => {
      list.place(l, 32, l.gh - 64, l.cx + 160);
      content.textContent = '';
      let y = 4;
      const sections: [string, [string, string][]][] = this.settings.controls === 'touch'
        ? [['Touch controls', TOUCH_KEYS], ...KEYS]
        : [...KEYS, ['Touch controls', TOUCH_KEYS]];
      for (const [head, rows] of sections) {
        const h = div('bf-h1 bf-c-yellow', content);
        h.textContent = centered(head, 0);
        h.style.top = U(y + 5);
        y += 18;
        for (const [action, key] of rows) {
          const a = div('bf-abs', content, fit(action, 200));
          at(a, l.cx - 155, y + 5);
          const k = div('bf-keycap', content);
          k.textContent = centered(key, 90);
          at(k, l.cx + 65, y, 90, 20);
          y += 22;
        }
        y += 4;
      }
      list.setContent(y + 4);
      at(done.el, l.cx - 100, l.gh - 26);
    };
    (s as Screen & { onShow?: () => void }).onShow = () => list.scrollTo(0);
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
      at(quit.el, l.cx - 102, y0 + 84);
      tip.textContent = '';
      let y = y0 + 118;
      const lines = wrapText('Ctrl+W closes the tab in browsers: sprint with a double-tap of W, or turn on Fullscreen on Play in Options.', Math.min(300, l.gw - 20));
      line(tip, 'Tip', y, 'bf-c-yellow');
      y += 11;
      for (const ln of lines) { line(tip, ln, y, 'bf-c-gray'); y += 10; }
      refreshTime();
    };
    (s as Screen & { onShow?: () => void }).onShow = () => { quit.enable(true); refreshTime(); };
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

