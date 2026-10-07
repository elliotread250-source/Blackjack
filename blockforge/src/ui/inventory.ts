// Creative inventory (E): category tabs, a 9x5 scrolling grid, search, tooltips and the
// hotbar row. Item handling follows the creative screen of the classic block games:
//   click an item          -> it sticks to the cursor (click another item to swap what you hold)
//   click a hotbar slot    -> drop the held item there (picking up what was there);
//                             with nothing held, picks the slot's item up
//   drag and drop          -> grid or hotbar item onto a hotbar slot (hotbar to hotbar swaps)
//   shift-click an item    -> first free hotbar slot (or the selected slot when full)
//   shift / right-click a hotbar slot -> clear it
//   click outside the panel (or drop there), or click the grid while holding -> discard held item
//   1-9 while hovering     -> put the hovered item in that hotbar slot (hotbar: swap slots)
//   mouse wheel / scrollbar drag -> scroll; T, / or Ctrl+F -> search; E / Esc -> close
import { matches, HOTBAR_ACTIONS } from '../game/keybinds';
import type { IconSheet } from './icons';
import { EXTRA_ICONS } from './icons';
import type { Hotbar } from '../game/hotbar';
import { BLOCKS, COUNT, ID, isItem } from '../blocks/registry';
import type { Category } from '../blocks/registry';
import { U, guiLayout } from './style';

type TabKey = Category | 'search';
interface TabDef { key: TabKey; title: string; tip: string; icon: number }

const ROWS = 5, COLS = 9;
const GRID_X = 8, GRID_Y = 17, HOTBAR_Y = 111;
const THUMB_TRAVEL = 112 - 17; // thumb y range inside the track (MC: 95)

export const TABS: TabDef[] = [
  { key: 'building', title: 'Building Blocks', tip: 'Building', icon: ID.bricks },
  { key: 'colored', title: 'Coloured Blocks', tip: 'Coloured', icon: ID.cyan_wool },
  { key: 'natural', title: 'Natural Blocks', tip: 'Natural', icon: ID.grass_block },
  { key: 'ores', title: 'Ores & Minerals', tip: 'Ores & Minerals', icon: ID.diamond_ore },
  { key: 'wood', title: 'Wood', tip: 'Wood', icon: ID.oak_log },
  { key: 'light', title: 'Lighting', tip: 'Lighting', icon: ID.lantern },
  { key: 'decor', title: 'Decoration', tip: 'Decoration', icon: ID.poppy },
  { key: 'fluids', title: 'Fluids', tip: 'Fluids', icon: ID.water },
  { key: 'search', title: 'Search Items', tip: 'Search', icon: EXTRA_ICONS.search },
];
// Panel-relative tab positions: five on top, search top-right, three underneath.
const TAB_POS: [number, number, boolean][] = [
  [0, -28, false], [29, -28, false], [58, -28, false], [87, -28, false], [116, -28, false],
  [0, 132, true], [29, 132, true], [58, 132, true],
  [167, -28, false],
];
const CAT_LABEL: Record<Category, string> = {
  building: 'Building', colored: 'Coloured', natural: 'Natural', ores: 'Ores & Minerals',
  wood: 'Wood', light: 'Lighting', decor: 'Decoration', fluids: 'Fluids',
};

const ALL_ITEMS: number[] = [];
const BY_CAT = new Map<Category, number[]>();
for (let id = 1; id < COUNT; id++) {
  if (!isItem(id)) continue;
  ALL_ITEMS.push(id);
  const c = BLOCKS[id].cat;
  let l = BY_CAT.get(c);
  if (!l) { l = []; BY_CAT.set(c, l); }
  l.push(id);
}
const LOWER_NAMES = BLOCKS.map((b) => b.display.toLowerCase());

/** Items matching a search query: every word must appear in the display name. */
export function searchItems(query: string): number[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return ALL_ITEMS.slice();
  return ALL_ITEMS.filter((id) => words.every((w) => LOWER_NAMES[id].includes(w)));
}

type Hover = { kind: 'grid' | 'hotbar'; index: number } | null;
interface Drag { from: 'grid' | 'hotbar'; index: number; id: number; x: number; y: number; moved: boolean; pointer: number }

function div(cls: string, parent?: HTMLElement): HTMLDivElement {
  const d = document.createElement('div');
  d.className = cls;
  if (parent) parent.appendChild(d);
  return d;
}

export class InventoryScreen {
  onClose: (() => void) | null = null;
  private _open = false;
  private root: HTMLDivElement;
  private gui: HTMLDivElement;
  private panel: HTMLDivElement;
  private titleEl: HTMLDivElement;
  private search: HTMLInputElement;
  private tabEls: HTMLDivElement[] = [];
  private gridSlots: HTMLDivElement[] = [];
  private gridIcons: HTMLDivElement[] = [];
  private gridIds: number[] = [];
  private barSlots: HTMLDivElement[] = [];
  private barIcons: HTMLDivElement[] = [];
  private barIds: number[] = [];
  private thumb: HTMLDivElement;
  private track: HTMLDivElement;
  private emptyEl: HTMLDivElement;
  private tip: HTMLDivElement;
  private heldEl: HTMLDivElement;
  private tab = 0;
  private scroll = 0;
  private items: number[] = [];
  private query = '';
  private held = 0;
  private hover: Hover = null;
  private hoverEl: HTMLElement | null = null;
  private drag: Drag | null = null;
  private thumbDrag: number | null = null;
  private mouse = { x: -100, y: -100 };   // GUI pixels
  private wheelAcc = 0;

  constructor(root: HTMLElement, private icons: IconSheet, private hotbar: Hotbar) {
    this.root = div('bf-inv-root bf-full bf-dim bf-font', root);
    this.gui = div('bf-gui', this.root);
    this.panel = div('bf-inv-panel', this.gui);

    TABS.forEach((t, i) => {
      const [x, y, bottom] = TAB_POS[i];
      const el = div('bf-tab' + (bottom ? ' bf-bottom' : ''), this.panel);
      el.style.left = U(x);
      el.style.top = U(y);
      el.dataset.k = 't' + i;
      const ic = div('bf-icon', el);
      icons.apply(ic, t.icon);
      this.tabEls.push(el);
    });
    div('bf-inv-bg', this.panel);
    this.titleEl = div('bf-inv-title bf-c-dark', this.panel);
    this.search = document.createElement('input');
    this.search.className = 'bf-inv-search';
    this.search.type = 'text';
    this.search.spellcheck = false;
    this.search.autocomplete = 'off';
    this.search.maxLength = 50;
    this.search.placeholder = 'Search...';
    this.search.setAttribute('aria-label', 'Search items');
    this.panel.appendChild(this.search);
    this.search.addEventListener('input', () => this.setQuery(this.search.value));
    this.search.addEventListener('keydown', (e) => {
      // Keep keys typed into the search box away from the game (it still sees Escape).
      if (e.key !== 'Escape' && !/^(Digit|Numpad)[1-9]$/.test(e.code)) e.stopPropagation();
    });

    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const k = r * COLS + c;
      const s = div('bf-slot', this.panel);
      s.style.left = U(GRID_X + c * 18);
      s.style.top = U(GRID_Y + r * 18);
      s.dataset.k = 'g' + k;
      this.gridSlots.push(s);
      this.gridIcons.push(div('bf-icon', s));
      this.gridIds.push(-1);
    }
    for (let c = 0; c < COLS; c++) {
      const s = div('bf-slot', this.panel);
      s.style.left = U(GRID_X + c * 18);
      s.style.top = U(HOTBAR_Y);
      s.dataset.k = 'h' + c;
      this.barSlots.push(s);
      this.barIcons.push(div('bf-icon', s));
      this.barIds.push(-1);
    }
    this.emptyEl = div('bf-inv-empty bf-c-dark', this.panel);
    this.emptyEl.textContent = 'No blocks match';
    this.track = div('bf-inv-track', this.panel);
    this.track.dataset.k = 'track';
    this.thumb = div('bf-inv-thumb', this.track);
    // Tappable close button: phones have no E or Esc key.
    const closeBtn = div('bf-inv-close', this.panel);
    closeBtn.dataset.k = 'close';
    closeBtn.textContent = 'X';
    closeBtn.setAttribute('aria-label', 'Close inventory');
    this.tip = div('bf-tip', this.gui);
    this.heldEl = div('bf-held', this.gui);

    this.root.addEventListener('pointerdown', (e) => this.onDown(e));
    this.root.addEventListener('pointermove', (e) => this.onMove(e));
    this.root.addEventListener('pointerup', (e) => this.onUp(e));
    this.root.addEventListener('pointercancel', () => { this.drag = null; this.thumbDrag = null; });
    this.root.addEventListener('pointerleave', () => { this.setHover(null, null); });
    this.root.addEventListener('contextmenu', (e) => e.preventDefault());
    this.root.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.root.addEventListener('dragstart', (e) => e.preventDefault());

    hotbar.onChange(() => { if (this._open) this.renderHotbar(); });
    this.selectTab(0);
  }

  get isOpen(): boolean { return this._open; }

  open(): void {
    if (this._open) return;
    this._open = true;
    this.held = 0;
    this.drag = null;
    this.root.classList.add('bf-open');
    this.renderAll();
    if (TABS[this.tab].key === 'search') this.focusSearch();
  }

  close(): void {
    if (!this._open) return;
    this._open = false;
    this.held = 0;
    this.drag = null;
    this.thumbDrag = null;
    this.setHover(null, null);
    this.search.blur();
    this.root.classList.remove('bf-open');
    this.renderHeld();
    this.onClose?.();
  }

  toggle(): void { if (this._open) this.close(); else this.open(); }

  handleKey(code: string): boolean {
    if (!this._open) return false;
    if (code === 'Escape') { this.close(); return true; }
    const bindSlot = HOTBAR_ACTIONS.findIndex((a) => matches(a, code));
    const digit = /^Numpad([1-9])$/.exec(code);
    const slotKey = bindSlot >= 0 ? bindSlot : digit ? Number(digit[1]) - 1 : -1;
    if (slotKey >= 0 && this.hover) {
      const n = slotKey;
      if (this.hover.kind === 'grid') {
        const id = this.items[this.scroll * COLS + this.hover.index] ?? 0;
        if (id) this.hotbar.set(n, id);
      } else if (this.hover.index !== n) {
        const a = this.hotbar.slots[this.hover.index], b = this.hotbar.slots[n];
        this.hotbar.set(n, a);
        this.hotbar.set(this.hover.index, b);
      }
      this.updateTooltip();
      return true;
    }
    if (document.activeElement === this.search) return false; // typing in the search box
    if (matches('inventory', code)) { this.close(); return true; }
    if (code === 'KeyT' || code === 'Slash' || code === 'KeyF') {
      this.selectTab(TABS.length - 1);
      this.focusSearch();
      return true;
    }
    if (TABS[this.tab].key === 'search' && /^(Key[A-Z]|Digit\d|Space|Minus|Quote)$/.test(code)) {
      this.focusSearch();
      return false; // let the character land in the box
    }
    if (code === 'ArrowDown' || code === 'PageDown') { this.setScroll(this.scroll + (code === 'PageDown' ? ROWS : 1)); return true; }
    if (code === 'ArrowUp' || code === 'PageUp') { this.setScroll(this.scroll - (code === 'PageUp' ? ROWS : 1)); return true; }
    return false;
  }

  // ------------------------------------------------------------------ test/debug helpers
  /** Item ids currently listed (after tab + search filtering). */
  get visibleItems(): number[] { return this.items.slice(); }
  /** Block id on the cursor (0 = none). */
  get heldItem(): number { return this.held; }
  get currentTab(): number { return this.tab; }

  selectTab(i: number): void {
    i = Math.max(0, Math.min(TABS.length - 1, i));
    this.tab = i;
    const t = TABS[i];
    this.tabEls.forEach((el, k) => el.classList.toggle('bf-sel', k === i));
    this.titleEl.textContent = t.title;
    const isSearch = t.key === 'search';
    this.search.style.display = isSearch ? '' : 'none';
    this.items = isSearch ? searchItems(this.query) : (BY_CAT.get(t.key as Category) ?? []).slice();
    this.scroll = 0;
    if (isSearch) { if (this._open) this.focusSearch(); } else if (document.activeElement === this.search) this.search.blur();
    this.renderGrid();
  }

  setQuery(q: string): void {
    this.query = q;
    if (this.search.value !== q) this.search.value = q;
    if (TABS[this.tab].key !== 'search') { this.selectTab(TABS.length - 1); return; }
    this.items = searchItems(q);
    this.scroll = 0;
    this.renderGrid();
  }

  private focusSearch() {
    this.search.style.display = '';
    try { this.search.focus({ preventScroll: true }); } catch { this.search.focus(); }
  }

  private maxScroll() { return Math.max(0, Math.ceil(this.items.length / COLS) - ROWS); }

  private setScroll(s: number) {
    const n = Math.max(0, Math.min(this.maxScroll(), Math.round(s)));
    if (n === this.scroll) return;
    this.scroll = n;
    this.renderGrid();
    this.updateTooltip();
  }

  // ------------------------------------------------------------------ rendering
  private renderAll() {
    this.renderGrid();
    this.renderHotbar();
    this.renderHeld();
  }

  private renderGrid() {
    const base = this.scroll * COLS;
    for (let k = 0; k < ROWS * COLS; k++) {
      const id = this.items[base + k] ?? 0;
      if (this.gridIds[k] !== id) { this.gridIds[k] = id; this.icons.apply(this.gridIcons[k], id); }
    }
    const max = this.maxScroll();
    this.thumb.classList.toggle('bf-off', max === 0);
    this.thumb.style.top = U(max ? Math.round((THUMB_TRAVEL * this.scroll) / max) : 0);
    this.emptyEl.style.display = this.items.length ? 'none' : '';
  }

  private renderHotbar() {
    for (let c = 0; c < COLS; c++) {
      const id = this.hotbar.slots[c] ?? 0;
      if (this.barIds[c] !== id) { this.barIds[c] = id; this.icons.apply(this.barIcons[c], id); }
    }
  }

  private renderHeld() {
    if (this.held) {
      this.icons.apply(this.heldEl, this.held);
      this.heldEl.classList.add('bf-on');
      this.placeHeld();
    } else this.heldEl.classList.remove('bf-on');
    this.updateTooltip();
  }

  private placeHeld() {
    this.heldEl.style.left = U(this.mouse.x - 8);
    this.heldEl.style.top = U(this.mouse.y - 8);
  }

  private setHover(h: Hover, el: HTMLElement | null) {
    if (this.hoverEl && this.hoverEl !== el) this.hoverEl.classList.remove('bf-hover');
    this.hover = h;
    this.hoverEl = el;
    if (el && h) el.classList.add('bf-hover');
    this.updateTooltip();
  }

  private tipTarget: string | null = null;
  private updateTooltip() {
    let text: string | null = null;
    let sub: string | null = null;
    if (!this.held && !this.drag) {
      if (this.hover) {
        const id = this.slotId(this.hover);
        if (id) { text = BLOCKS[id].display; sub = CAT_LABEL[BLOCKS[id].cat]; }
      } else if (this.hoverTab >= 0) text = TABS[this.hoverTab].tip;
    }
    if (!text) { this.tip.classList.remove('bf-on'); this.tipTarget = null; return; }
    const key = text + '|' + sub;
    if (this.tipTarget !== key) {
      this.tipTarget = key;
      this.tip.textContent = '';
      const a = document.createElement('div');
      a.textContent = text;
      this.tip.appendChild(a);
      if (sub) {
        const b = document.createElement('div');
        b.className = 'bf-c-gray';
        b.textContent = sub;
        this.tip.appendChild(b);
      }
    }
    this.tip.classList.add('bf-on');
    // Position like the classic tooltip: up and to the right of the cursor, flipped at the edge.
    const l = guiLayout();
    const w = Math.ceil(this.tip.offsetWidth / l.u);
    let x = this.mouse.x + 12, y = this.mouse.y - 12;
    if (x + w > l.gw - 2) x = Math.max(2, this.mouse.x - 16 - w);
    y = Math.max(2, Math.min(l.gh - 26, y));
    this.tip.style.left = U(x);
    this.tip.style.top = U(y);
  }

  private slotId(h: NonNullable<Hover>): number {
    return h.kind === 'grid' ? this.items[this.scroll * COLS + h.index] ?? 0 : this.hotbar.slots[h.index] ?? 0;
  }

  // ------------------------------------------------------------------ input
  private hoverTab = -1;

  private toGui(e: PointerEvent | WheelEvent) {
    const u = guiLayout().u;
    return { x: Math.floor(e.clientX / u), y: Math.floor(e.clientY / u) };
  }

  /** What is under a viewport point: a slot, tab, scrollbar, the panel or the backdrop. */
  private hit(clientX: number, clientY: number): { k: string; el: HTMLElement | null } {
    const t = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!t || !this.root.contains(t)) return { k: 'outside', el: null };
    const s = t.closest('[data-k]') as HTMLElement | null;
    if (s && this.root.contains(s)) return { k: s.dataset.k!, el: s };
    if (t === this.search) return { k: 'search', el: t };
    if (this.panel.contains(t)) return { k: 'panel', el: null };
    return { k: 'outside', el: null };
  }

  private trackHover(clientX: number, clientY: number) {
    const { k, el } = this.hit(clientX, clientY);
    this.hoverTab = k[0] === 't' && k !== 'track' ? Number(k.slice(1)) : -1;
    if (k[0] === 'g') this.setHover({ kind: 'grid', index: Number(k.slice(1)) }, el);
    else if (k[0] === 'h') this.setHover({ kind: 'hotbar', index: Number(k.slice(1)) }, el);
    else this.setHover(null, null);
  }

  private onDown(e: PointerEvent) {
    if (!this._open) return;
    const g = this.toGui(e);
    this.mouse = g;
    const { k, el } = this.hit(e.clientX, e.clientY);
    if (k === 'search') return;                   // let the text box take the click
    e.preventDefault();
    if (k === 'close') { this.close(); return; }
    if (document.activeElement === this.search && TABS[this.tab].key !== 'search') this.search.blur();
    if (k === 'track') {
      this.thumbDrag = e.pointerId;
      try { this.root.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
      this.scrollToPointer(g.y);
      return;
    }
    if (k[0] === 't') { this.selectTab(Number(k.slice(1))); return; }
    const right = e.button === 2;
    if (e.button !== 0 && !right) return;
    if (k[0] === 'g') {
      const idx = Number(k.slice(1));
      const id = this.items[this.scroll * COLS + idx] ?? 0;
      if (e.shiftKey && id) {
        const free = this.hotbar.firstFree();
        this.hotbar.set(free >= 0 ? free : this.hotbar.selected, id);
      } else if (!id) {
        this.held = 0;                            // clicking an empty grid cell puts the held item back
      } else if (this.held && this.held !== id && !right) {
        this.held = id;                           // swap what we hold
      } else {
        this.held = id;
        this.drag = { from: 'grid', index: idx, id, x: e.clientX, y: e.clientY, moved: false, pointer: e.pointerId };
      }
    } else if (k[0] === 'h') {
      const idx = Number(k.slice(1));
      const cur = this.hotbar.slots[idx] ?? 0;
      if (e.shiftKey || right) {
        this.hotbar.set(idx, 0);
      } else if (this.held) {
        this.hotbar.set(idx, this.held);
        this.held = cur;                          // pick up whatever was there (swap)
      } else if (cur) {
        this.hotbar.set(idx, 0);
        this.held = cur;
        this.drag = { from: 'hotbar', index: idx, id: cur, x: e.clientX, y: e.clientY, moved: false, pointer: e.pointerId };
      }
    } else if (k === 'outside') {
      this.held = 0;                              // dropped outside the window: gone (creative)
    }
    if (this.drag) { try { this.root.setPointerCapture(e.pointerId); } catch { /* synthetic events */ } }
    this.renderHeld();
    if (el) this.trackHover(e.clientX, e.clientY);
  }

  private onMove(e: PointerEvent) {
    if (!this._open) return;
    this.mouse = this.toGui(e);
    if (this.thumbDrag === e.pointerId) { this.scrollToPointer(this.mouse.y); return; }
    if (this.drag && e.pointerId === this.drag.pointer && !this.drag.moved) {
      const u = guiLayout().u;
      if (Math.hypot(e.clientX - this.drag.x, e.clientY - this.drag.y) > 3 * u) this.drag.moved = true;
    }
    if (this.held) this.placeHeld();
    this.trackHover(e.clientX, e.clientY);
  }

  private onUp(e: PointerEvent) {
    if (!this._open) return;
    if (this.thumbDrag === e.pointerId) { this.thumbDrag = null; return; }
    const d = this.drag;
    if (!d || d.pointer !== e.pointerId) return;
    this.drag = null;
    if (!d.moved) { this.renderHeld(); return; }  // a plain click: the item stays on the cursor
    const { k } = this.hit(e.clientX, e.clientY);
    if (k[0] === 'h') {
      const idx = Number(k.slice(1));
      if (d.from === 'hotbar' && d.index !== idx) this.hotbar.set(d.index, this.hotbar.slots[idx] ?? 0);
      this.hotbar.set(idx, d.id);
    }
    // Dropped anywhere else (grid, panel, outside): creative discards it.
    this.held = 0;
    this.renderHeld();
    this.trackHover(e.clientX, e.clientY);
  }

  private onWheel(e: WheelEvent) {
    if (!this._open) return;
    e.preventDefault();
    if (e.deltaMode === 0) {
      this.wheelAcc += e.deltaY;
      const steps = Math.trunc(this.wheelAcc / 50);
      if (steps) { this.wheelAcc -= steps * 50; this.setScroll(this.scroll + steps); }
    } else if (e.deltaY) this.setScroll(this.scroll + Math.sign(e.deltaY));
  }

  private scrollToPointer(gy: number) {
    const l = guiLayout();
    const panelTop = l.cy - 68;
    const frac = (gy - panelTop - 18 - 7) / THUMB_TRAVEL;
    this.setScroll(Math.max(0, Math.min(1, frac)) * this.maxScroll());
  }
}
