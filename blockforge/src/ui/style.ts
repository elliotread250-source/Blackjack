// All BlockForge UI CSS, plus the GUI scale model.
//
// Like the classic sandbox games we lay the interface out on a grid of "GUI pixels".
// One GUI pixel is `--u` CSS pixels, chosen so it covers a whole number of *device*
// pixels (crisp pixel font and icons at 100%, 125%, 150% Windows scaling) and shrunk
// when the window is too small (the GUI always gets at least 320x240 GUI pixels, so a
// 1280x720 Chromebook runs scale 3 even when the setting asks for 4).
// Layout code positions things with whole GUI pixels relative to these CSS variables:
//   --u   CSS px per GUI pixel      --gw/--gh  GUI size (even numbers)
//   --cx/--cy  centre (gw/2, gh/2)  --qh  floor(gh/4)
import { packTexture } from '../blocks/packs';
import type { ResourcePackId } from '../settings';

export interface GuiLayout { u: number; uDev: number; gw: number; gh: number; cx: number; cy: number; qh: number; dpr: number }

let wantedScale = 2;
let layout: GuiLayout = { u: 2, uDev: 2, gw: 640, gh: 360, cx: 320, cy: 180, qh: 90, dpr: 1 };
let installed = false;
const listeners = new Set<(l: GuiLayout) => void>();

/** `calc(var(--u)*n)`: n GUI pixels. */
export const U = (n: number | string) => `calc(var(--u)*${n})`;

export function computeLayout(guiScale: number, cssW: number, cssH: number, dpr: number): GuiLayout {
  const wDev = Math.round(cssW * dpr), hDev = Math.round(cssH * dpr);
  const fit = Math.max(1, Math.floor(Math.min(wDev / 320, hDev / 240)));
  const uDev = Math.max(1, Math.min(Math.round(Math.max(1, guiScale) * dpr), fit));
  let gw = Math.floor(wDev / uDev), gh = Math.floor(hDev / uDev);
  gw -= gw & 1; gh -= gh & 1;
  return { u: uDev / dpr, uDev, gw, gh, cx: gw / 2, cy: gh / 2, qh: Math.floor(gh / 4), dpr };
}

/** Current GUI layout (unit size and GUI dimensions). */
export function guiLayout(): GuiLayout { return layout; }
/** Called whenever the GUI unit or size changes (resize, zoom, GUI scale option). */
export function onGuiLayout(fn: (l: GuiLayout) => void): () => void { listeners.add(fn); return () => listeners.delete(fn); }

function relayout() {
  if (typeof window === 'undefined') return;
  const l = computeLayout(wantedScale, window.innerWidth || 1280, window.innerHeight || 720, window.devicePixelRatio || 1);
  const changed = l.u !== layout.u || l.gw !== layout.gw || l.gh !== layout.gh;
  layout = l;
  const st = document.documentElement.style;
  st.setProperty('--u', `${l.u}px`);
  st.setProperty('--gw', String(l.gw));
  st.setProperty('--gh', String(l.gh));
  st.setProperty('--cx', String(l.cx));
  st.setProperty('--cy', String(l.cy));
  st.setProperty('--qh', String(l.qh));
  if (changed) for (const f of listeners) { try { f(l); } catch (e) { console.warn(e); } }
}

// ---------------------------------------------------------------------- generated images

function canvasURL(w: number, h: number, draw: (d: Uint8ClampedArray) => void): string {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (!g) return '';
  const img = g.createImageData(w, h);
  draw(img.data);
  g.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

let uiPack: ResourcePackId = 'default';

/** Darkened dirt tile for menu backgrounds (factor 0.25 like a dim cellar wall). */
function dirtURL(f: number): string {
  const t = packTexture('dirt', uiPack);
  return canvasURL(16, 16, (d) => {
    for (let i = 0; i < 256; i++) {
      d[i * 4] = t[i * 4] * f; d[i * 4 + 1] = t[i * 4 + 1] * f; d[i * 4 + 2] = t[i * 4 + 2] * f; d[i * 4 + 3] = 255;
    }
  });
}

function hash(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Stone-ish noise tile used on button faces. */
function noiseURL(base: [number, number, number], amp: number, seed: number): string {
  return canvasURL(16, 16, (d) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = (hash(x, y, seed) - 0.5) * 2 * amp + (hash(x >> 2, y >> 1, seed + 7) - 0.5) * amp;
      const i = (y * 16 + x) * 4;
      d[i] = base[0] + n; d[i + 1] = base[1] + n; d[i + 2] = base[2] + n; d[i + 3] = 255;
    }
  });
}

type Px = [number, number, number, number];
/** Paint a small pixel-art image from a template: each char is looked up in `pal`. */
function artURL(rows: string[], pal: Record<string, Px>): string {
  const h = rows.length, w = rows[0].length;
  return canvasURL(w, h, (d) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = pal[rows[y][x]] ?? [0, 0, 0, 0];
      const i = (y * w + x) * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3];
    }
  });
}

const PANEL_PAL: Record<string, Px> = {
  '.': [0, 0, 0, 0], K: [0, 0, 0, 255], W: [255, 255, 255, 255], S: [85, 85, 85, 255], c: [198, 198, 198, 255],
};
// 9-slice panel (4 px corners): black outline with cut corners, 2 px white / dark bevel.
const PANEL = [
  '..KKKKK..',
  '.KWWWWWK.',
  'KWWWWWWcK',
  'KWWccccSK',
  'KWWccccSK',
  'KWWccccSK',
  'KWcSSSSSK',
  '.KSSSSSK.',
  '..KKKKK..',
];
// Creative tab (28x32), top row, open at the bottom so the selected one merges with the panel.
function tabArt(selected: boolean, bottom: boolean): string {
  const rows: string[] = [];
  const H = 32, W = 28;
  for (let y = 0; y < H; y++) {
    let r = '';
    for (let x = 0; x < W; x++) {
      const cut = (y === 0 && (x < 2 || x > W - 3)) || (y === 1 && (x < 1 || x > W - 2));
      let ch = 'c';
      if (cut) ch = '.';
      else if (y === 0 || (y === 1 && (x === 1 || x === W - 2)) || x === 0 || x === W - 1) ch = 'K';
      else if (y === 1 && (x === 2 || x === W - 3)) ch = 'K';
      else if (y <= 2 || x <= 2) ch = 'W';
      else if (x >= W - 3) ch = 'S';
      if (!selected && ch === 'c') ch = 'd';
      if (!selected && ch === 'W') ch = 'w';
      if (!selected && ch === 'S') ch = 's';
      if (!selected && y >= H - 4 && ch !== '.') ch = y === H - 1 ? 'K' : ch;
      r += ch;
    }
    rows.push(r);
  }
  if (bottom) rows.reverse();
  return artURL(rows, {
    ...PANEL_PAL,
    d: [158, 158, 158, 255], w: [214, 214, 214, 255], s: [70, 70, 70, 255],
  });
}

// Hotbar strip (182x22) and the selected-slot frame (24x24): our own pixel art.
function hotbarArt(): string {
  const W = 182, H = 22;
  return canvasURL(W, H, (d) => {
    const set = (x: number, y: number, c: Px) => { const i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3]; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1;
      if (edge) { set(x, y, [10, 10, 10, 230]); continue; }
      const cx = (x - 1) % 20, cy = y - 1;          // position inside the 20x20 cell
      if (cx === 0 || cx === 19 || cy === 0 || cy === 19) set(x, y, [72, 72, 72, 225]);
      else if (cx === 1 || cy === 1) set(x, y, [24, 24, 24, 200]);
      else if (cx === 18 || cy === 18) set(x, y, [118, 118, 118, 200]);
      else set(x, y, [36, 36, 36, 150]);
    }
  });
}
function selectArt(): string {
  const W = 24;
  return canvasURL(W, W, (d) => {
    const set = (x: number, y: number, c: Px) => { const i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3]; };
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const r = Math.min(x, y, W - 1 - x, W - 1 - y);
      const corner = (x === 0 || x === W - 1) && (y === 0 || y === W - 1);
      if (corner) continue;
      if (r === 0) set(x, y, [0, 0, 0, 255]);
      else if (r === 1) set(x, y, x === 1 || y === 1 ? [255, 255, 255, 255] : [208, 208, 208, 255]);
      else if (r === 2) set(x, y, x === 2 || y === 2 ? [232, 232, 232, 255] : [168, 168, 168, 255]);
      else if (r === 3) set(x, y, [0, 0, 0, 160]);
    }
  });
}
// Dark tooltip box (9-slice, 3 px corners) with an ember-gold inner border.
const TIP = [
  '.KKKKKKK.',
  'KKGGGGGKK',
  'KGKKKKKgK',
  'KGKKKKKgK',
  'KGKKKKKgK',
  'KGKKKKKgK',
  'KGKKKKKgK',
  'KKgggggKK',
  '.KKKKKKK.',
];

// ---------------------------------------------------------------------- the stylesheet

function css(): string {
  const u = U;
  const shadow = `${u(1)} ${u(1)} 0 var(--sh)`;
  return `
:root{--u:2px;--gw:640;--gh:360;--cx:320;--cy:180;--qh:90;--sh:#3f3f3f}
#game{display:block;outline:none}
.bf-gui,.bf-full{position:fixed;left:0;top:0}
.bf-gui{width:${u('var(--gw)')};height:${u('var(--gh)')}}
.bf-full{right:0;bottom:0}
.bf-font,.bf-font input,.bf-font button{font-family:BlockForge,monospace;font-size:${u(8)};line-height:${u(9)};font-weight:normal;font-style:normal;
  letter-spacing:0;word-spacing:0;font-kerning:none;font-variant-ligatures:none;font-feature-settings:"kern" 0,"liga" 0;
  text-rendering:optimizeSpeed;-webkit-font-smoothing:none;-moz-osx-font-smoothing:unset;color:#fff;--sh:#3f3f3f;text-shadow:${shadow};
  white-space:pre;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
.bf-font *{box-sizing:border-box}
.bf-abs{position:absolute}
.bf-notice{position:fixed;left:50%;top:max(${u(6)},env(safe-area-inset-top));transform:translateX(-50%);z-index:60;
  max-width:calc(100% - ${u(8)});padding:${u(3)} ${u(6)};background:rgba(0,0,0,.72);text-align:center;white-space:pre-wrap;
  pointer-events:none;transition:opacity .4s}
.bf-c-white{color:#fff;--sh:#3f3f3f}
.bf-c-gray{color:#a0a0a0;--sh:#282828}
.bf-c-dim{color:#808080;--sh:#202020}
.bf-c-yellow{color:#ffff55;--sh:#3f3f15}
.bf-c-gold{color:#ffaa00;--sh:#2a1c00}
.bf-c-green{color:#55ff55;--sh:#153f15}
.bf-c-red{color:#ff5555;--sh:#3f1515}
.bf-btn.bf-c-red,.bf-btn.bf-c-red:hover{color:#ff5555}
.bf-btn.bf-c-yellow,.bf-btn.bf-c-yellow:hover{color:#ffff55}
.bf-c-dark{color:#404040;text-shadow:none}
.bf-noshadow{text-shadow:none}
.bf-center{text-align:center}
.bf-right{text-align:right}
.bf-pixel{image-rendering:pixelated;image-rendering:crisp-edges}

/* ---------------- backgrounds */
.bf-dirt{background:#2b2219 var(--bf-dirt) repeat;background-size:${u(32)} ${u(32)};image-rendering:pixelated}
.bf-dirt-dark{background:#16110c var(--bf-dirt-dark) repeat;background-size:${u(32)} ${u(32)};image-rendering:pixelated}
.bf-dim{background:linear-gradient(rgba(16,16,16,.75),rgba(16,16,16,.82))}

/* ---------------- buttons */
.bf-btn{position:absolute;display:block;height:${u(20)};width:${u(200)};margin:0;padding:${u(4)} 0 0;border:${u(1)} solid #000;border-radius:0;
  background:#717171 var(--bf-btn) repeat;background-size:${u(16)} ${u(16)};image-rendering:pixelated;
  box-shadow:inset ${u(1)} ${u(1)} 0 rgba(255,255,255,.36),inset ${u(-1)} ${u(-2)} 0 rgba(0,0,0,.38);
  color:#fff;--sh:#3f3f3f;text-align:center;cursor:default;outline:none;overflow:hidden;-webkit-appearance:none;appearance:none;text-decoration:none}
.bf-btn:hover,.bf-btn:focus-visible,.bf-btn.bf-hot{border-color:#fff;background-color:#8a8f99;background-image:var(--bf-btn-hot);color:#ffffa0;--sh:#3f3f28}
.bf-btn:active{box-shadow:inset ${u(1)} ${u(1)} 0 rgba(0,0,0,.3),inset ${u(-1)} ${u(-1)} 0 rgba(255,255,255,.18)}
.bf-btn:disabled,.bf-btn.bf-off{background:#2e2e2e var(--bf-btn-off) repeat;background-size:${u(16)} ${u(16)};border-color:#000;color:#a0a0a0;--sh:#282828;
  box-shadow:inset ${u(1)} ${u(1)} 0 rgba(255,255,255,.08),inset ${u(-1)} ${u(-1)} 0 rgba(0,0,0,.3)}
a.bf-btn{color:#fff}

/* ---------------- sliders */
.bf-slider{position:absolute;height:${u(20)};width:${u(150)};touch-action:none;outline:none}
.bf-slider .bf-track{position:absolute;inset:0;border:${u(1)} solid #000;background:#2e2e2e var(--bf-btn-off) repeat;background-size:${u(16)} ${u(16)};
  box-shadow:inset ${u(1)} ${u(1)} 0 rgba(0,0,0,.45),inset ${u(-1)} ${u(-1)} 0 rgba(255,255,255,.1)}
.bf-slider .bf-knob{position:absolute;top:0;width:${u(8)};height:${u(20)};border:${u(1)} solid #000;background:#8d8d8d var(--bf-btn) repeat;background-size:${u(16)} ${u(16)};
  box-shadow:inset ${u(1)} ${u(1)} 0 rgba(255,255,255,.45),inset ${u(-1)} ${u(-2)} 0 rgba(0,0,0,.4)}
.bf-slider .bf-lbl{position:absolute;left:0;top:${u(5)};width:100%;text-align:center;pointer-events:none}
.bf-slider:hover .bf-knob,.bf-slider:focus-visible .bf-knob,.bf-slider.bf-drag .bf-knob{border-color:#fff;background-image:var(--bf-btn-hot)}
.bf-slider:hover .bf-lbl,.bf-slider:focus-visible .bf-lbl,.bf-slider.bf-drag .bf-lbl{color:#ffffa0;--sh:#3f3f28}

/* ---------------- text fields */
.bf-field{position:absolute;height:${u(20)};width:${u(200)};margin:0;padding:${u(5)} ${u(4)} 0;border:${u(1)} solid #a0a0a0;border-radius:0;background:#000;
  color:#e0e0e0;--sh:#383838;outline:none;caret-color:#e0e0e0;-webkit-user-select:text;user-select:text;-webkit-appearance:none;appearance:none}
.bf-field:focus{border-color:#fff}
.bf-field::placeholder{color:#575757;text-shadow:none;opacity:1}
.bf-field::selection{background:#3050c0;color:#fff}
.bf-label{position:absolute;color:#a0a0a0;--sh:#282828}

/* ---------------- scroll lists */
.bf-list{position:absolute;overflow:hidden;touch-action:none}
.bf-list.bf-sunk{background:#16110c var(--bf-dirt-dark) repeat;background-size:${u(32)} ${u(32)}}
.bf-list .bf-list-in{position:absolute;left:0;right:0;top:0}
.bf-list .bf-shade-t,.bf-list .bf-shade-b{position:absolute;left:0;right:0;height:${u(4)};pointer-events:none;z-index:2}
.bf-list .bf-shade-t{top:0;background:linear-gradient(rgba(0,0,0,.85),rgba(0,0,0,0))}
.bf-list .bf-shade-b{bottom:0;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.85))}
.bf-sbar{position:absolute;width:${u(6)};background:#000;z-index:3;touch-action:none}
.bf-sbar .bf-thumb{position:absolute;left:0;width:${u(6)};background:#808080;box-shadow:inset ${u(-1)} ${u(-1)} 0 #c0c0c0;box-shadow:inset 0 0 0 0 transparent}
.bf-sbar .bf-thumb::after{content:"";position:absolute;left:0;top:0;right:${u(1)};bottom:${u(1)};background:#c0c0c0}
.bf-sbar.bf-none{display:none}

/* ---------------- menus */
.bf-menus{z-index:30;display:none}
.bf-menus.bf-open{display:block}
.bf-screen{position:fixed;inset:0;overflow:hidden}
.bf-screen .bf-gui{position:absolute}
.bf-h1{position:absolute;left:0;width:${u('var(--gw)')};text-align:center}
.bf-hline{position:absolute;left:0;width:${u('var(--gw)')};height:${u(2)};background:linear-gradient(rgba(0,0,0,.6) 50%,rgba(255,255,255,.12) 50%)}
.bf-logo{position:absolute;image-rendering:pixelated}
.bf-splash{position:absolute;color:#ffff00;--sh:#3f3f00;transform-origin:50% 50%;animation:bf-splash .5s ease-in-out infinite alternate;white-space:pre;pointer-events:none}
@keyframes bf-splash{from{transform:translate(-50%,-50%) rotate(-20deg) scale(var(--ss,1.8))}to{transform:translate(-50%,-50%) rotate(-20deg) scale(calc(var(--ss,1.8)*.93))}}
.bf-pano{position:absolute;left:0;top:0;height:100%;background-repeat:repeat-x;image-rendering:pixelated;will-change:transform;
  animation:bf-pano-move 90s linear infinite}
@keyframes bf-pano-move{from{transform:translateX(0)}to{transform:translateX(var(--pano-w,-2048px))}}
.bf-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(0,0,0,0) 30%,rgba(0,0,0,.55) 100%),linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.05) 40%,rgba(0,0,0,.4))}
.bf-pause-bg{position:absolute;inset:0;background:linear-gradient(rgba(16,16,16,.66),rgba(16,16,16,.78))}
.bf-row{position:absolute;box-sizing:border-box;border:${u(1)} solid transparent;outline:none}
.bf-row:hover{background:rgba(255,255,255,.06)}
.bf-row.bf-sel{border-color:#c0c0c0;background:rgba(0,0,0,.55)}
.bf-row.bf-sel:focus-visible,.bf-row:focus-visible{border-color:#fff}
.bf-row .bf-thumbimg{position:absolute;left:${u(1)};top:${u(1)};width:${u(32)};height:${u(32)};image-rendering:pixelated}
.bf-row:hover .bf-thumbimg::after{content:"";position:absolute;inset:0;background:rgba(255,255,255,.15)}
.bf-row .bf-play{position:absolute;left:${u(1)};top:${u(1)};width:${u(32)};height:${u(32)};display:none;background:rgba(0,0,0,.45)}
.bf-row:hover .bf-play,.bf-row.bf-sel .bf-play{display:block}
.bf-play::after{content:"";position:absolute;left:${u(12)};top:${u(8)};border-style:solid;border-color:transparent transparent transparent #fff;border-width:${u(8)} 0 ${u(8)} ${u(10)}}
.bf-keycap{position:absolute;height:${u(20)};width:${u(90)};border:${u(1)} solid #000;padding-top:${u(4)};text-align:center;
  background:#3a3a3a var(--bf-btn-off) repeat;background-size:${u(16)} ${u(16)};box-shadow:inset ${u(1)} ${u(1)} 0 rgba(255,255,255,.14),inset ${u(-1)} ${u(-2)} 0 rgba(0,0,0,.35)}
.bf-progress{position:absolute;height:${u(10)};border:${u(1)} solid #000;background:#262626;box-shadow:inset ${u(1)} ${u(1)} 0 #111,inset ${u(-1)} ${u(-1)} 0 #4a4a4a}
.bf-progress .bf-fill{position:absolute;left:${u(1)};top:${u(1)};bottom:${u(1)};width:0;background:#5bbf3a;box-shadow:inset 0 ${u(2)} 0 #8ee060,inset 0 ${u(-2)} 0 #3a8a22}
/* feature / warning buttons (Shaders..., Resource Packs..., Restore Defaults armed) */
.bf-btn.bf-feature:not(:hover):not(:focus-visible):not(:disabled){color:#ffe36e;--sh:#3f3410}
.bf-btn.bf-warn,.bf-btn.bf-warn:hover,.bf-btn.bf-warn:focus-visible{color:#ff6b6b;--sh:#3f1515}
/* shader choice cards */
.bf-card{position:absolute;display:block;margin:0;padding:0;text-align:left;border:${u(1)} solid #000;border-radius:0;outline:none;cursor:default;
  background:rgba(0,0,0,.5);box-shadow:inset 0 0 0 ${u(1)} #4a4a4a;color:#fff;-webkit-appearance:none;appearance:none;overflow:hidden}
.bf-card:hover,.bf-card:focus-visible{box-shadow:inset 0 0 0 ${u(1)} #a0a0a0;background:rgba(30,30,30,.62)}
.bf-card.bf-on{box-shadow:inset 0 0 0 ${u(1)} #fff;background:rgba(0,0,0,.68)}
.bf-card .bf-card-name{color:#fff;--sh:#3f3f3f}
.bf-card:hover .bf-card-name,.bf-card:focus-visible .bf-card-name{color:#ffffa0;--sh:#3f3f28}
.bf-card.bf-on .bf-card-name{color:#ffff55;--sh:#3f3f15}
.bf-card .bf-card-desc{color:#b8b8b8;--sh:#282828}
.bf-radio{position:absolute;background:#8b8b8b;box-shadow:inset ${u(1)} ${u(1)} 0 #373737,inset ${u(-1)} ${u(-1)} 0 #fff}
.bf-card.bf-on .bf-radio::after{content:"";position:absolute;left:${u(3)};top:${u(3)};width:${u(4)};height:${u(4)};background:#55ff55;box-shadow:inset ${u(-1)} ${u(-1)} 0 #2a9a2a}
/* resource pack rows */
.bf-packrow{cursor:default}
.bf-packrow .bf-strip{pointer-events:none}
.bf-stripimg{position:absolute;image-rendering:pixelated;image-rendering:crisp-edges}
.bf-blink{animation:bf-blink 1s steps(1) infinite}
@keyframes bf-blink{50%{opacity:0}}

/* ---------------- HUD */
.bf-hud{z-index:16;pointer-events:none}
.bf-hud.bf-hidden,.bf-cross.bf-hidden{display:none}
.bf-cross{position:fixed;z-index:16;pointer-events:none;mix-blend-mode:difference;width:${u(9)};height:${u(9)};
  left:${u('(var(--cx) - 4)')};top:${u('(var(--cy) - 4)')}}
.bf-cross::before,.bf-cross::after{content:"";position:absolute;background:#fff}
.bf-cross::before{left:0;top:${u(4)};width:${u(9)};height:${u(1)}}
.bf-cross::after{left:${u(4)};top:0;width:${u(1)};height:${u(9)}}
.bf-hotbar{position:absolute;width:${u(182)};height:${u(22)};left:${u('(var(--cx) - 91)')};top:${u('(var(--gh) - 22)')};
  background:var(--bf-hotbar) no-repeat;background-size:100% 100%;image-rendering:pixelated}
.bf-hotbar .bf-hslot{position:absolute;top:${u(1)};width:${u(20)};height:${u(20)}}
.bf-hotbar .bf-hslot .bf-icon{position:absolute;left:${u(2)};top:${u(2)};width:${u(16)};height:${u(16)}}
.bf-hotbar .bf-num{position:absolute;left:${u(1)};top:0;color:rgba(255,255,255,.62);--sh:rgba(0,0,0,.7)}
.bf-hotbar .bf-hsel{position:absolute;top:${u(-1)};width:${u(24)};height:${u(24)};background:var(--bf-select) no-repeat;background-size:100% 100%;image-rendering:pixelated}
.bf-itemname{position:absolute;left:0;width:${u('var(--gw)')};top:${u('(var(--gh) - 45)')};text-align:center;opacity:0}
.bf-chat{position:absolute;left:${u(2)};bottom:${u(40)};width:${u(320)}}
.bf-chat .bf-msg{position:relative;width:${u(320)};min-height:${u(9)};padding:0 ${u(2)};background:rgba(0,0,0,.5);white-space:pre-wrap;word-break:break-word}
.bf-debug{position:absolute;left:${u(2)};top:${u(2)};right:${u(2)};display:none}
.bf-debug.bf-on{display:block}
.bf-debug .bf-col{position:absolute;top:0}
.bf-debug .bf-col.bf-r{right:0;text-align:right}
.bf-debug .bf-line{height:${u(9)};color:#e0e0e0;text-shadow:none}
.bf-debug .bf-line span{display:inline-block;height:${u(9)};padding:0 ${u(1)};background:rgba(80,80,80,.56)}
.bf-fps{position:absolute;left:${u(2)};top:${u(2)};display:none;color:#e0e0e0}
.bf-fps.bf-on{display:block}
.bf-water{position:fixed;inset:0;z-index:15;pointer-events:none;opacity:0;transition:opacity .25s;
  background:radial-gradient(ellipse at 50% 50%,rgba(20,60,140,.16) 40%,rgba(5,20,70,.5) 100%)}
.bf-water.bf-on{opacity:1}
@media (pointer:coarse){.bf-hotbar .bf-hslot{pointer-events:auto;touch-action:none}}

/* ---------------- icons and slots */
.bf-icon{background-image:var(--bf-icons);background-size:var(--bf-icons-size);background-repeat:no-repeat;image-rendering:pixelated}
.bf-slot{position:absolute;width:${u(18)};height:${u(18)};background:#8b8b8b;box-shadow:inset ${u(1)} ${u(1)} 0 #373737,inset ${u(-1)} ${u(-1)} 0 #fff}
.bf-slot .bf-icon{position:absolute;left:${u(1)};top:${u(1)};width:${u(16)};height:${u(16)};pointer-events:none}
.bf-slot.bf-hover::after{content:"";position:absolute;left:${u(1)};top:${u(1)};width:${u(16)};height:${u(16)};background:rgba(255,255,255,.5);pointer-events:none}

/* ---------------- creative inventory */
.bf-inv-root{z-index:20;display:none;touch-action:none}
.bf-inv-root.bf-open{display:block}
.bf-inv-panel{position:absolute;width:${u(195)};height:${u(136)};left:${u('(var(--cx) - 98)')};top:${u('(var(--cy) - 68)')}}
.bf-inv-close{position:absolute;left:${u(198)};top:${u(4)};width:${u(16)};height:${u(16)};display:flex;align-items:center;justify-content:center;
  background:#8b8b8b;color:#fff;font-size:${u(9)};line-height:1;text-shadow:${u(1)} ${u(1)} 0 #3f3f3f;cursor:pointer;
  box-shadow:inset ${u(1)} ${u(1)} 0 #d8d8d8,inset ${u(-1)} ${u(-1)} 0 #565656,0 0 0 ${u(1)} #000}
.bf-inv-close:hover{background:#9aa6d4}
.bf-inv-bg{position:absolute;inset:0;border-style:solid;border-width:${u(4)};border-image:var(--bf-panel) 4 fill stretch;image-rendering:pixelated}
.bf-inv-title{position:absolute;left:${u(8)};top:${u(5)}}
.bf-tab{position:absolute;width:${u(28)};height:${u(32)};background:var(--bf-tab) no-repeat;background-size:100% 100%;image-rendering:pixelated}
.bf-tab.bf-bottom{background-image:var(--bf-tab-b)}
.bf-tab.bf-sel{background-image:var(--bf-tab-sel);z-index:2}
.bf-tab.bf-bottom.bf-sel{background-image:var(--bf-tab-b-sel)}
.bf-tab .bf-icon{position:absolute;left:${u(6)};width:${u(16)};height:${u(16)};pointer-events:none}
.bf-tab:not(.bf-bottom) .bf-icon{top:${u(9)}}
.bf-tab.bf-bottom .bf-icon{top:${u(7)}}
.bf-tab:not(.bf-sel):hover{filter:brightness(1.12)}
.bf-inv-search{position:absolute;left:${u(81)};top:${u(4)};width:${u(90)};height:${u(12)};padding:${u(1)} ${u(2)} 0;border:${u(1)} solid #000;
  background:#000;box-shadow:inset 0 0 0 ${u(1)} #3d3d3d;color:#fff;outline:none;caret-color:#fff;-webkit-user-select:text;user-select:text;border-radius:0;margin:0}
.bf-inv-search:focus{box-shadow:inset 0 0 0 ${u(1)} #a0a0a0}
.bf-inv-search::placeholder{color:#6c6c6c;text-shadow:none}
.bf-inv-track{position:absolute;left:${u(174)};top:${u(17)};width:${u(14)};height:${u(112)};background:#8b8b8b;
  box-shadow:inset ${u(1)} ${u(1)} 0 #373737,inset ${u(-1)} ${u(-1)} 0 #fff;touch-action:none}
.bf-inv-thumb{position:absolute;left:${u(1)};width:${u(12)};height:${u(15)};border:${u(1)} solid #000;background:#c6c6c6;
  box-shadow:inset ${u(1)} ${u(1)} 0 #fff,inset ${u(-1)} ${u(-1)} 0 #555}
.bf-inv-thumb.bf-off{background:#9a9a9a;box-shadow:inset ${u(1)} ${u(1)} 0 #b8b8b8,inset ${u(-1)} ${u(-1)} 0 #5a5a5a}
.bf-inv-empty{position:absolute;left:${u(9)};top:${u(54)};width:${u(162)};text-align:center}
.bf-tip{position:absolute;z-index:5;padding:${u(4)} ${u(5)} ${u(3)};border-style:solid;border-width:${u(3)};margin:0;
  border-image:var(--bf-tip) 3 fill stretch;image-rendering:pixelated;pointer-events:none;display:none;line-height:${u(10)}}
.bf-tip.bf-on{display:block}
.bf-held{position:absolute;z-index:6;width:${u(16)};height:${u(16)};pointer-events:none;display:none}
.bf-held.bf-on{display:block}
`;
}

/** Redraw the menu backgrounds that come from block textures with a resource pack. */
export function setUiPack(pack: ResourcePackId): void {
  if (pack === uiPack && installed) return;
  uiPack = pack;
  if (typeof document === 'undefined' || !installed) return;
  try {
    const st = document.documentElement.style;
    st.setProperty('--bf-dirt', `url(${dirtURL(0.27)})`);
    st.setProperty('--bf-dirt-dark', `url(${dirtURL(0.14)})`);
  } catch (e) {
    console.warn('[ui] could not repaint menu backgrounds', e);
  }
}

/** Inject (or refresh) all UI CSS and apply a GUI scale. Safe to call repeatedly. */
export function injectStyles(guiScale: number): void {
  wantedScale = Number.isFinite(guiScale) ? Math.max(1, Math.min(6, guiScale)) : 2;
  if (typeof document === 'undefined') return;
  if (!installed) {
    installed = true;
    let el = document.getElementById('bf-ui-css') as HTMLStyleElement | null;
    if (!el) { el = document.createElement('style'); el.id = 'bf-ui-css'; document.head.appendChild(el); }
    el.textContent = css();
    const st = document.documentElement.style;
    try {
      st.setProperty('--bf-dirt', `url(${dirtURL(0.27)})`);
      st.setProperty('--bf-dirt-dark', `url(${dirtURL(0.14)})`);
      st.setProperty('--bf-btn', `url(${noiseURL([112, 112, 112], 7, 1)})`);
      st.setProperty('--bf-btn-hot', `url(${noiseURL([128, 136, 152], 7, 2)})`);
      st.setProperty('--bf-btn-off', `url(${noiseURL([44, 44, 44], 4, 3)})`);
      st.setProperty('--bf-panel', `url(${artURL(PANEL, PANEL_PAL)})`);
      st.setProperty('--bf-tab', `url(${tabArt(false, false)})`);
      st.setProperty('--bf-tab-sel', `url(${tabArt(true, false)})`);
      st.setProperty('--bf-tab-b', `url(${tabArt(false, true)})`);
      st.setProperty('--bf-tab-b-sel', `url(${tabArt(true, true)})`);
      st.setProperty('--bf-hotbar', `url(${hotbarArt()})`);
      st.setProperty('--bf-select', `url(${selectArt()})`);
      st.setProperty('--bf-tip', `url(${artURL(TIP, { '.': [0, 0, 0, 0], K: [16, 10, 6, 240], G: [214, 150, 48, 255], g: [120, 72, 18, 255] })})`);
    } catch (e) {
      console.warn('[ui] could not paint UI textures', e);
    }
    window.addEventListener('resize', relayout);
    // Zoom and moving the window between monitors change devicePixelRatio.
    const watchDpr = () => {
      try {
        const mq = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
        const h = () => { mq.removeEventListener('change', h); relayout(); watchDpr(); };
        mq.addEventListener('change', h);
      } catch { /* old browser: resize still fires on zoom */ }
    };
    watchDpr();
  }
  relayout();
}
