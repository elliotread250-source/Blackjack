// Survival and multiplayer UI: the status bars above the hotbar (health, armour, hunger,
// air), the survival inventory with its recipe book, the death screen, chat and the
// multiplayer menu. Laid out on the same GUI-pixel grid as the rest of the UI.
import type { IconSheet } from './icons';
import { U, guiLayout } from './style';
import { Inventory, INV_SIZE, RECIPES, STATION_NAMES, craft, craftable, fuelAvailable } from '../game/inventory';
import type { Recipe, Stack } from '../game/inventory';
import { itemDef, maxStack, thingName } from '../game/items';
import type { Hotbar } from '../game/hotbar';
import { MAX_AIR } from '../game/survival';
import type { Survival } from '../game/survival';
import { matches, HOTBAR_ACTIONS } from '../game/keybinds';

const u = (n: number | string) => `calc(var(--u)*${n})`;

function div(cls: string, parent?: HTMLElement, text?: string): HTMLDivElement {
  const d = document.createElement('div');
  d.className = cls;
  if (text !== undefined) d.textContent = text;
  if (parent) parent.appendChild(d);
  return d;
}

// ---------------------------------------------------------------- pixel art for the bars
const HEART = ['.XX...XX.', 'XXXX.XXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'];
const FOOD = ['....XX...', '..XXXXXX.', '.XXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '.........'];
const SHIELD = ['XXXX.XXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'];
const BUBBLE = ['..XXXXX..', '.X.....X.', 'X..X....X', 'X.X.....X', 'X.......X', 'X.......X', 'X.......X', '.X.....X.', '..XXXXX..'];

/** 0 empty, 1 half, 2 full. */
function barIcon(mask: string[], level: number, col: [number, number, number], empty: [number, number, number]): string {
  const c = document.createElement('canvas');
  c.width = 9; c.height = 9;
  const g = c.getContext('2d')!;
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
    if (mask[y][x] !== 'X') continue;
    const edge = x === 0 || y === 0 || x === 8 || y === 8 || mask[y][x - 1] !== 'X' || mask[y][x + 1] !== 'X' || mask[y - 1]?.[x] !== 'X' || mask[y + 1]?.[x] !== 'X';
    const on = level === 2 || (level === 1 && x < 5);
    const k = edge ? 0.35 : on ? (x + y < 6 ? 1.15 : 1) : 1;
    const base = edge ? [20, 20, 20] : on ? col : empty;
    g.fillStyle = `rgb(${Math.min(255, base[0] * (edge ? 1 : k))},${Math.min(255, base[1] * (edge ? 1 : k))},${Math.min(255, base[2] * (edge ? 1 : k))})`;
    g.fillRect(x, y, 1, 1);
  }
  return c.toDataURL();
}

let cssDone = false;
function injectCss() {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  const vars: string[] = [];
  const set = (name: string, mask: string[], col: [number, number, number], empty: [number, number, number]) => {
    for (let l = 0; l < 3; l++) vars.push(`--bfs-${name}${l}:url(${barIcon(mask, l, col, empty)})`);
  };
  set('heart', HEART, [226, 38, 38], [64, 30, 30]);
  set('food', FOOD, [212, 142, 60], [60, 44, 28]);
  set('armor', SHIELD, [206, 210, 216], [56, 58, 62]);
  set('air', BUBBLE, [120, 180, 255], [0, 0, 0]);
  const st = document.createElement('style');
  st.id = 'bf-survival-css';
  st.textContent = `
:root{${vars.join(';')}}
.bfs-bars{position:absolute;left:${u('(var(--cx) - 91)')};top:${u('(var(--gh) - 44)')};width:${u(182)};height:${u(21)};pointer-events:none}
.bfs-bars.bfs-off{display:none}
.bfs-row{position:absolute;height:${u(9)};display:flex}
.bfs-row.bfs-r{right:0;flex-direction:row-reverse}
.bfs-row i{display:block;width:${u(9)};height:${u(9)};margin-right:${u(-1)};background-size:100% 100%;image-rendering:pixelated}
.bfs-row.bfs-r i{margin-right:0;margin-left:${u(-1)}}
.bfs-shake i:nth-child(odd){transform:translateY(${u(-1)})}
.bfs-hurt{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(200,0,0,0) 45%,rgba(200,0,0,.55) 100%);opacity:0;transition:opacity .25s}
.bfs-n{position:absolute;right:${u(1)};bottom:0;color:#fff;--sh:#3f3f3f;text-shadow:${u(1)} ${u(1)} 0 var(--sh);pointer-events:none;z-index:2}
.bfs-d{position:absolute;left:${u(2)};bottom:${u(2)};height:${u(1)};background:#3fdc3f;pointer-events:none;box-shadow:0 ${u(1)} 0 #000;z-index:2}
.bf-hslot .bfs-n{right:${u(2)};bottom:${u(1)}}
.bf-hslot .bfs-d{left:${u(3)};bottom:${u(3)}}
.bfs-root{display:none;z-index:20}
.bfs-root.bf-open{display:block}
.bfs-panel{position:absolute;height:${u(124)};top:${u('(var(--cy) - 62)')}}
.bfs-inv{width:${u(176)};left:${u('(var(--cx) - 159)')}}
.bfs-rec{width:${u(138)};left:${u('(var(--cx) + 21)')}}
.bfs-title{position:absolute;left:${u(8)};top:${u(6)};text-shadow:none;color:#3f3f3f;white-space:nowrap}
.bfs-info{position:absolute;right:${u(8)};top:${u(17)};text-align:right;text-shadow:none;color:#3f3f3f;line-height:${u(9)};white-space:nowrap}
.bfs-ghost{position:absolute;inset:${u(1)};opacity:.28;background-size:100% 100%;image-rendering:pixelated;pointer-events:none}
.bfs-list{position:absolute;left:${u(6)};top:${u(17)};width:${u(126)};height:${u(100)};overflow:hidden}
.bfs-rrow{position:absolute;left:0;width:${u(122)};height:${u(20)};cursor:pointer}
.bfs-rrow .bf-slot{left:0;top:${u(1)}}
.bfs-rrow.bfs-dim{opacity:.5}
.bfs-rrow:hover{background:rgba(255,255,255,.35)}
.bfs-rname{position:absolute;left:${u(21)};top:${u(1)};width:${u(100)};overflow:hidden;white-space:nowrap;text-shadow:none;color:#262626}
.bfs-rsub{position:absolute;left:${u(21)};top:${u(10)};width:${u(100)};overflow:hidden;white-space:nowrap;text-shadow:none;color:#5a5a5a}
.bfs-thumb{position:absolute;right:${u(1)};width:${u(2)};background:#555}
.bfs-empty{position:absolute;left:${u(8)};right:${u(8)};top:${u(40)};text-align:center;text-shadow:none;color:#3f3f3f;line-height:${u(10)}}
.bfs-death{position:fixed;inset:0;display:none;z-index:30;background:rgba(120,0,0,.5)}
.bfs-death.bf-open{display:block}
.bfs-big{position:absolute;left:0;width:100%;text-align:center;top:${u('(var(--qh) + 4)')};font-size:${u(16)} !important;line-height:${u(18)} !important}
.bfs-cause{position:absolute;left:0;width:100%;text-align:center;top:${u('(var(--qh) + 30)')}}
.bfs-chat{position:absolute;left:${u(2)};top:${u('(var(--gh) - 40)')};width:${u('(var(--gw) - 4)')};height:${u(12)};display:none;z-index:25;
  background:rgba(0,0,0,.6);border:0;outline:0;color:#fff;padding:${u(2)} ${u(3)} 0;margin:0}
.bfs-chat.bf-open{display:block}
.bfs-mp{display:none;z-index:40}
.bfs-mp.bf-open{display:block}
.bfs-mp .bf-label,.bfs-mp .bfs-msg{position:absolute}
.bfs-code{position:fixed;left:${u(2)};top:${u(2)};pointer-events:none;color:#fff;opacity:.85;display:none}
.bfs-code.bf-open{display:block}
`;
  document.head.appendChild(st);
}

// ============================================================================ status bars
export class StatusBars {
  private el: HTMLDivElement;
  private rows: HTMLElement[][] = [];
  private rowEls: HTMLDivElement[] = [];
  private last = ['', '', '', ''];
  private hurt: HTMLDivElement;

  constructor(root: HTMLElement) {
    injectCss();
    this.hurt = div('bfs-hurt', root);
    this.el = div('bfs-bars bf-gui-abs bfs-off', root);
    // order: hearts (bottom left), hunger (bottom right), armour (top left), air (top right)
    const spec: [boolean, number][] = [[false, 12], [true, 12], [false, 1], [true, 1]];
    for (const [right, top] of spec) {
      const r = div('bfs-row' + (right ? ' bfs-r' : ''), this.el);
      r.style.top = U(top);
      const cells: HTMLElement[] = [];
      for (let i = 0; i < 10; i++) cells.push(r.appendChild(document.createElement('i')));
      this.rows.push(cells);
      this.rowEls.push(r);
    }
  }

  setVisible(v: boolean) { this.el.classList.toggle('bfs-off', !v); if (!v) this.hurt.style.opacity = '0'; }

  private fill(row: number, name: string, value: number, hideEmpty: boolean) {
    const key = name + Math.ceil(value) + (hideEmpty ? 'h' : '');
    if (this.last[row] === key) return;
    this.last[row] = key;
    const v = Math.ceil(value);
    this.rows[row].forEach((c, i) => {
      const level = v >= i * 2 + 2 ? 2 : v === i * 2 + 1 ? 1 : 0;
      c.style.backgroundImage = hideEmpty && level === 0 ? 'none' : `var(--bfs-${name}${level})`;
    });
  }

  update(s: Survival, armor: number, underwater: boolean) {
    this.fill(0, 'heart', s.health, false);
    this.fill(1, 'food', s.hunger, false);
    this.fill(2, 'armor', armor, armor <= 0);
    const showAir = underwater || s.air < MAX_AIR - 0.05;
    this.fill(3, 'air', showAir ? (s.air / MAX_AIR) * 20 : 0, true);
    this.rowEls[0].classList.toggle('bfs-shake', s.health <= 4);
    this.rowEls[1].classList.toggle('bfs-shake', s.hunger <= 0);
    this.hurt.style.opacity = s.sinceHurt < 0.35 ? '1' : '0';
  }
}

// ============================================================================ survival inventory
type SlotRef = { kind: 'inv' | 'armor' | 'chest'; i: number };
/** An open chest: its 27 stacks, and a call for when they change. */
export interface ChestView { slots: (Stack | null)[]; changed(): void }
export const CHEST_SIZE = 27;
const ARMOR_GHOST = ['helmet', 'chest', 'legs', 'boots'];

export class SurvivalScreen {
  onClose: (() => void) | null = null;
  /** Called after crafting (sound). */
  onCraft: (() => void) | null = null;
  private _open = false;
  private root: HTMLDivElement;
  private gui: HTMLDivElement;
  private invPanel: HTMLDivElement;
  private recPanel: HTMLDivElement;
  private slotEls: HTMLDivElement[] = [];
  private armorEls: HTMLDivElement[] = [];
  private info: HTMLDivElement;
  private recTitle: HTMLDivElement;
  private list: HTMLDivElement;
  private thumb: HTMLDivElement;
  private empty: HTMLDivElement;
  private tip: HTMLDivElement;
  private heldEl: HTMLDivElement;
  private held: Stack | null = null;
  private stations = [true, false, false];
  private shown: { r: Recipe; times: number }[] = [];
  private scroll = 0;
  private mouse = { x: -100, y: -100 };
  private hover: SlotRef | null = null;
  private hoverRecipe = -1;
  private wheelAcc = 0;
  private chest: ChestView | null = null;
  private chestEls: HTMLDivElement[] = [];

  constructor(root: HTMLElement, private icons: IconSheet, private inv: Inventory, private hotbar: Hotbar) {
    injectCss();
    this.root = div('bfs-root bf-full bf-dim bf-font', root);
    this.gui = div('bf-gui', this.root);
    this.invPanel = div('bfs-panel bfs-inv', this.gui);
    div('bf-inv-bg', this.invPanel);
    div('bfs-title', this.invPanel, 'Inventory');
    this.info = div('bfs-info', this.invPanel);
    for (let i = 0; i < 4; i++) {
      const s = this.makeSlot(this.invPanel, 8 + i * 18, 17, 'a' + i);
      this.armorEls.push(s);
    }
    for (let i = 0; i < INV_SIZE; i++) {
      // 0..8 hotbar (bottom row), 9..35 the three rows above
      const col = i % 9, row = i < 9 ? 3 : Math.floor(i / 9) - 1;
      this.slotEls.push(this.makeSlot(this.invPanel, 8 + col * 18, row === 3 ? 99 : 41 + row * 18, 's' + i));
    }
    this.recPanel = div('bfs-panel bfs-rec', this.gui);
    div('bf-inv-bg', this.recPanel);
    this.recTitle = div('bfs-title', this.recPanel);
    this.list = div('bfs-list', this.recPanel);
    this.thumb = div('bfs-thumb', this.recPanel);
    this.empty = div('bfs-empty', this.recPanel);
    for (let i = 0; i < CHEST_SIZE; i++) this.chestEls.push(this.makeSlot(this.recPanel, 6 + (i % 7) * 18, 23 + Math.floor(i / 7) * 18, 'c' + i));
    const close = div('bf-inv-close', this.recPanel, 'X');
    close.dataset.k = 'close';
    close.style.left = U(123); close.style.top = U(3); close.style.right = 'auto';
    this.tip = div('bf-tip', this.gui);
    this.heldEl = div('bf-held', this.gui);
    div('bf-icon', this.heldEl).style.cssText = 'position:absolute;inset:0';
    div('bfs-n', this.heldEl);

    this.root.addEventListener('pointerdown', (e) => this.onDown(e));
    this.root.addEventListener('pointermove', (e) => this.onMove(e));
    this.root.addEventListener('contextmenu', (e) => e.preventDefault());
    this.root.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.root.addEventListener('dragstart', (e) => e.preventDefault());
    inv.onChange(() => { if (this._open) this.render(); });
  }

  private makeSlot(parent: HTMLElement, x: number, y: number, key: string): HTMLDivElement {
    const s = div('bf-slot', parent);
    s.style.left = U(x); s.style.top = U(y);
    s.dataset.k = key;
    div('bf-icon', s);
    div('bfs-n', s);
    div('bfs-d', s);
    return s;
  }

  get isOpen(): boolean { return this._open; }

  /** stations: which recipe sets are in reach [hand, crafting table, furnace]. */
  open(stations: [boolean, boolean, boolean], chest: ChestView | null = null) {
    if (this._open) return;
    this._open = true;
    this.stations = stations;
    this.chest = chest;
    for (const el of this.chestEls) el.style.display = chest ? '' : 'none';
    this.list.style.display = chest ? 'none' : '';
    this.scroll = 0;
    this.root.classList.add('bf-open');
    this.render();
  }

  close() {
    if (!this._open) return;
    this._open = false;
    if (this.held) { this.inv.add(this.held.id, this.held.n, this.held.d); this.held = null; }
    this.root.classList.remove('bf-open');
    this.tip.classList.remove('bf-on');
    this.chest = null;
    this.onClose?.();
  }

  handleKey(code: string): boolean {
    if (!this._open) return false;
    if (code === 'Escape' || matches('inventory', code)) { this.close(); return true; }
    const n = HOTBAR_ACTIONS.findIndex((a) => matches(a, code));
    if (n >= 0 && this.hover && this.hover.kind === 'inv' && this.hover.i !== n) {
      const a = this.inv.slots[this.hover.i];
      this.inv.slots[this.hover.i] = this.inv.slots[n];
      this.inv.slots[n] = a;
      this.inv.changed();
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------------ rendering
  private paintSlot(el: HTMLElement, s: Stack | null) {
    const icon = el.children[0] as HTMLElement, n = el.children[1] as HTMLElement, d = el.children[2] as HTMLElement | undefined;
    const id = s ? s.id : 0;
    if (icon.dataset.icon !== String(id) || !id) this.icons.apply(icon, id);
    const t = s && s.n > 1 ? String(s.n) : '';
    if (n.textContent !== t) n.textContent = t;
    if (d) {
      const max = s ? itemDef(s.id)?.dur : undefined;
      if (s && s.d !== undefined && max && s.d < max) {
        const f = Math.max(0.05, s.d / max);
        d.style.display = ''; d.style.width = U(Math.max(1, Math.round(13 * f)));
        d.style.background = f > 0.5 ? '#3fdc3f' : f > 0.2 ? '#e0c030' : '#e04030';
      } else d.style.display = 'none';
    }
  }

  private render() {
    for (let i = 0; i < INV_SIZE; i++) this.paintSlot(this.slotEls[i], this.inv.slots[i]);
    for (let i = 0; i < 4; i++) {
      this.paintSlot(this.armorEls[i], this.inv.armor[i]);
      this.armorEls[i].title = '';
    }
    const fuel = fuelAvailable(this.inv);
    this.info.textContent = '';
    div('', this.info, `Armour ${this.inv.armorPoints()}`);
    if (this.stations[2]) div('', this.info, `Fuel ${Math.floor(fuel)}`);
    this.renderHeld();
    if (this.chest) {
      for (let i = 0; i < CHEST_SIZE; i++) this.paintSlot(this.chestEls[i], this.chest.slots[i] ?? null);
      this.recTitle.textContent = 'Chest';
      this.thumb.style.display = 'none';
      this.empty.textContent = '';
    } else this.renderRecipes();
  }

  private renderHeld() {
    if (this.held) {
      this.icons.apply(this.heldEl.children[0] as HTMLElement, this.held.id);
      (this.heldEl.children[1] as HTMLElement).textContent = this.held.n > 1 ? String(this.held.n) : '';
      this.heldEl.classList.add('bf-on');
      this.heldEl.style.left = U(this.mouse.x - 8);
      this.heldEl.style.top = U(this.mouse.y - 8);
    } else this.heldEl.classList.remove('bf-on');
  }

  private renderRecipes() {
    const st = this.stations;
    this.recTitle.textContent = st[1] && st[2] ? 'Crafting + Furnace' : st[2] ? 'Furnace' : st[1] ? STATION_NAMES[1] : STATION_NAMES[0];
    const can: { r: Recipe; times: number }[] = [], partial: { r: Recipe; times: number }[] = [];
    const seen = new Set<string>();
    for (const r of RECIPES) {
      if (!st[r.station]) continue;
      const times = craftable(this.inv, r);
      if (times > 0) can.push({ r, times });
      else if (r.needs.some((g) => this.inv.count(g.ids) > 0)) {
        // one dimmed row per result is enough
        const key = r.out + '|' + r.station;
        if (!seen.has(key)) { seen.add(key); partial.push({ r, times: 0 }); }
      }
    }
    this.shown = can.concat(partial.filter((p) => !can.some((c) => c.r.out === p.r.out)));
    const max = Math.max(0, this.shown.length - 5);
    this.scroll = Math.max(0, Math.min(max, this.scroll));
    this.list.textContent = '';
    for (let k = 0; k < 5; k++) {
      const e = this.shown[this.scroll + k];
      if (!e) break;
      const row = div('bfs-rrow' + (e.times > 0 ? '' : ' bfs-dim'), this.list);
      row.style.top = U(k * 20);
      row.dataset.k = 'r' + (this.scroll + k);
      const slot = div('bf-slot', row);
      const ic = div('bf-icon', slot);
      this.icons.apply(ic, e.r.out);
      div('bfs-n', slot, e.r.n > 1 ? String(e.r.n) : '');
      div('bfs-rname', row, thingName(e.r.out));
      div('bfs-rsub', row, e.r.needs.map((g) => `${g.n} ${g.label}`).join(', '));
    }
    this.empty.textContent = '';
    if (!this.shown.length) {
      div('', this.empty, 'Nothing to make yet.');
      div('', this.empty, 'Punch a tree to get logs,');
      div('', this.empty, 'then make planks here.');
    }
    this.thumb.style.display = max > 0 ? '' : 'none';
    if (max > 0) {
      const h = Math.max(8, Math.round((100 * 5) / this.shown.length));
      this.thumb.style.height = U(h);
      this.thumb.style.top = U(17 + Math.round(((100 - h) * this.scroll) / max));
    }
  }

  private showTip() {
    let lines: string[] = [];
    if (!this.held) {
      if (this.hoverRecipe >= 0 && this.shown[this.hoverRecipe]) {
        const { r, times } = this.shown[this.hoverRecipe];
        lines = [`${thingName(r.out)}${r.n > 1 ? ' x' + r.n : ''}`];
        for (const g of r.needs) lines.push(`${Math.min(999, this.inv.count(g.ids))}/${g.n} ${g.label}`);
        if (r.station === 2) lines.push('Uses 1 fuel');
        lines.push(times > 0 ? 'Click to make. Shift: make all.' : 'Missing ingredients');
      } else if (this.hover) {
        const s = this.hover.kind === 'inv' ? this.inv.slots[this.hover.i] : this.hover.kind === 'chest' ? this.chest?.slots[this.hover.i] ?? null : this.inv.armor[this.hover.i];
        if (s) {
          const d = itemDef(s.id);
          lines = [thingName(s.id)];
          if (d?.dur && s.d !== undefined) lines.push(`Durability ${s.d}/${d.dur}`);
          if (d?.food) lines.push(`Restores ${d.food.hunger / 2} hunger`);
          if (d?.armor) lines.push(`Armour +${d.armor.points}`);
        } else if (this.hover.kind === 'armor') lines = [['Helmet', 'Chestplate', 'Leggings', 'Boots'][this.hover.i] + ' slot'];
      }
    }
    if (!lines.length) { this.tip.classList.remove('bf-on'); return; }
    this.tip.textContent = '';
    lines.forEach((t, i) => { const l = div(i ? 'bf-c-gray' : '', this.tip, t); l.style.whiteSpace = 'nowrap'; });
    this.tip.classList.add('bf-on');
    const l = guiLayout();
    const w = Math.ceil(this.tip.offsetWidth / l.u), h = Math.ceil(this.tip.offsetHeight / l.u);
    let x = this.mouse.x + 12, y = this.mouse.y - 12;
    if (x + w > l.gw - 2) x = Math.max(2, this.mouse.x - 8 - w);
    y = Math.max(2, Math.min(l.gh - h - 2, y));
    this.tip.style.left = U(x); this.tip.style.top = U(y);
  }

  // ------------------------------------------------------------------ input
  private target(e: PointerEvent | WheelEvent): string {
    const t = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (!t || !this.root.contains(t)) return 'outside';
    const s = t.closest('[data-k]') as HTMLElement | null;
    if (s) return s.dataset.k!;
    return this.invPanel.contains(t) || this.recPanel.contains(t) ? 'panel' : 'outside';
  }

  private ref(k: string): SlotRef | null {
    if (k[0] === 's') return { kind: 'inv', i: Number(k.slice(1)) };
    if (k[0] === 'a') return { kind: 'armor', i: Number(k.slice(1)) };
    if (k[0] === 'c' && k !== 'close' && this.chest) return { kind: 'chest', i: Number(k.slice(1)) };
    return null;
  }

  private onMove(e: PointerEvent) {
    if (!this._open) return;
    const l = guiLayout();
    this.mouse = { x: Math.floor(e.clientX / l.u), y: Math.floor(e.clientY / l.u) };
    const k = this.target(e);
    this.hover = this.ref(k);
    this.hoverRecipe = k[0] === 'r' ? Number(k.slice(1)) : -1;
    if (this.held) this.renderHeld();
    this.showTip();
  }

  private fitsArmor(slot: number, s: Stack | null): boolean { return !s || itemDef(s.id)?.armor?.slot === slot; }

  private onDown(e: PointerEvent) {
    if (!this._open) return;
    e.preventDefault();
    this.onMove(e);
    const k = this.target(e);
    if (k === 'close') { this.close(); return; }
    const right = e.button === 2;
    if (e.button !== 0 && !right) return;
    if (k[0] === 'r') {
      const entry = this.shown[Number(k.slice(1))];
      if (!entry) return;
      let made = 0;
      const want = e.shiftKey ? 64 : 1;
      while (made < want && craft(this.inv, entry.r)) made++;
      if (made) this.onCraft?.();
      this.showTip();
      return;
    }
    const ref = this.ref(k);
    if (!ref) {
      if (k === 'outside' && this.held) { this.inv.add(this.held.id, this.held.n, this.held.d); this.held = null; this.render(); }
      return;
    }
    const arr = ref.kind === 'inv' ? this.inv.slots : ref.kind === 'chest' ? this.chest!.slots : this.inv.armor;
    const cur = arr[ref.i];
    const done = () => { this.inv.changed(); if (this.chest) this.chest.changed(); };
    if (e.shiftKey && !this.held && cur && (ref.kind === 'chest' || this.chest)) {
      // quick move between the chest and the pack
      const into = ref.kind === 'chest' ? this.inv.slots : this.chest!.slots;
      const size = ref.kind === 'chest' ? INV_SIZE : CHEST_SIZE;
      const max = maxStack(cur.id);
      let left = cur.n;
      for (let i = 0; i < size && left > 0 && max > 1; i++) { const q = into[i]; if (q && q.id === cur.id && q.n < max) { const m = Math.min(left, max - q.n); q.n += m; left -= m; } }
      for (let i = 0; i < size && left > 0; i++) if (!into[i]) { into[i] = { ...cur, n: left }; left = 0; }
      arr[ref.i] = left > 0 ? { ...cur, n: left } : null;
      done();
      return;
    }
    if (e.shiftKey && !this.held && cur) {
      // quick move: armour goes on, the hotbar and the pack swap sides
      const ad = itemDef(cur.id)?.armor;
      if (ref.kind === 'inv' && ad && !this.inv.armor[ad.slot]) { this.inv.armor[ad.slot] = cur; arr[ref.i] = null; }
      else {
        const from = ref.kind === 'armor' ? -1 : ref.i;
        const lo = from >= 0 && from < 9 ? 9 : 0, hi = from >= 0 && from < 9 ? INV_SIZE : from < 0 ? INV_SIZE : 9;
        arr[ref.i] = null;
        let left = cur.n;
        const max = maxStack(cur.id);
        for (let i = lo; i < hi && left > 0 && max > 1; i++) { const s = this.inv.slots[i]; if (s && s.id === cur.id && s.n < max) { const m = Math.min(left, max - s.n); s.n += m; left -= m; } }
        for (let i = lo; i < hi && left > 0; i++) if (!this.inv.slots[i]) { this.inv.slots[i] = { ...cur, n: left }; left = 0; }
        if (left > 0) arr[ref.i] = { ...cur, n: left };
      }
      this.inv.changed();
      return;
    }
    if (ref.kind === 'armor' && this.held && !this.fitsArmor(ref.i, this.held)) return;
    if (!this.held) {
      if (!cur) return;
      if (right && cur.n > 1) { const half = Math.ceil(cur.n / 2); this.held = { ...cur, n: half }; cur.n -= half; }
      else { this.held = cur; arr[ref.i] = null; }
    } else if (right) {
      // put one down
      if (!cur) { arr[ref.i] = { ...this.held, n: 1 }; this.held.n--; }
      else if (cur.id === this.held.id && cur.n < maxStack(cur.id)) { cur.n++; this.held.n--; }
      if (this.held.n <= 0) this.held = null;
    } else if (cur && cur.id === this.held.id && maxStack(cur.id) > 1) {
      const m = Math.min(this.held.n, maxStack(cur.id) - cur.n);
      cur.n += m; this.held.n -= m;
      if (this.held.n <= 0) this.held = null;
    } else {
      arr[ref.i] = this.held;
      this.held = cur;
    }
    done();
  }

  private onWheel(e: WheelEvent) {
    if (!this._open) return;
    e.preventDefault();
    this.wheelAcc += e.deltaMode === 0 ? e.deltaY : Math.sign(e.deltaY) * 50;
    const steps = Math.trunc(this.wheelAcc / 50);
    if (!steps) return;
    this.wheelAcc -= steps * 50;
    this.scroll += steps;
    if (!this.chest) this.renderRecipes();
  }
}

// ============================================================================ hotbar counts
/** Stack counts and tool wear on the HUD hotbar (survival only). */
export class HotbarCounts {
  private els: { n: HTMLDivElement; d: HTMLDivElement }[] = [];
  private last: string[] = [];
  constructor(root: HTMLElement) {
    injectCss();
    root.querySelectorAll('.bf-hotbar .bf-hslot').forEach((s) => {
      this.els.push({ n: div('bfs-n', s as HTMLElement), d: div('bfs-d', s as HTMLElement) });
      this.last.push('');
    });
  }
  update(inv: Inventory | null) {
    this.els.forEach((e, i) => {
      const s = inv ? inv.slots[i] : null;
      const max = s ? itemDef(s.id)?.dur : undefined;
      const f = s && s.d !== undefined && max && s.d < max ? Math.max(0.05, s.d / max) : -1;
      const key = (s && s.n > 1 ? s.n : '') + '|' + (f < 0 ? '' : Math.round(f * 13));
      if (this.last[i] === key) return;
      this.last[i] = key;
      e.n.textContent = s && s.n > 1 ? String(s.n) : '';
      if (f < 0) e.d.style.display = 'none';
      else { e.d.style.display = ''; e.d.style.width = U(Math.max(1, Math.round(13 * f))); e.d.style.background = f > 0.5 ? '#3fdc3f' : f > 0.2 ? '#e0c030' : '#e04030'; }
    });
  }
}

// ============================================================================ death screen
export class DeathScreen {
  private root: HTMLDivElement;
  private cause: HTMLDivElement;
  private btn: HTMLButtonElement;
  onRespawn: (() => void) | null = null;
  constructor(root: HTMLElement) {
    injectCss();
    this.root = div('bfs-death bf-font', root);
    const gui = div('bf-gui', this.root);
    div('bfs-big', gui, 'You died');
    this.cause = div('bfs-cause', gui);
    this.btn = document.createElement('button');
    this.btn.className = 'bf-btn';
    this.btn.type = 'button';
    this.btn.textContent = 'Respawn';
    this.btn.style.left = U('(var(--cx) - 100)');
    this.btn.style.top = U('(var(--qh) + 60)');
    gui.appendChild(this.btn);
    this.btn.addEventListener('click', () => this.onRespawn?.());
  }
  get isOpen() { return this.root.classList.contains('bf-open'); }
  show(cause: string) { this.cause.textContent = cause; this.root.classList.add('bf-open'); }
  hide() { this.root.classList.remove('bf-open'); }
}

// ============================================================================ chat
export class ChatBox {
  private input: HTMLInputElement;
  onSend: ((text: string) => void) | null = null;
  onClose: (() => void) | null = null;
  constructor(root: HTMLElement) {
    injectCss();
    const gui = div('bf-gui bf-font', root);
    gui.style.pointerEvents = 'none';
    this.input = document.createElement('input');
    this.input.className = 'bfs-chat';
    this.input.type = 'text'; this.input.maxLength = 120; this.input.spellcheck = false; this.input.autocomplete = 'off';
    this.input.placeholder = 'Say something, then press Enter';
    this.input.style.pointerEvents = 'auto';
    gui.appendChild(this.input);
    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { const t = this.input.value.trim(); this.close(); if (t) this.onSend?.(t); e.preventDefault(); }
      else if (e.key === 'Escape') { this.close(); e.preventDefault(); }
    });
    this.input.addEventListener('keyup', (e) => e.stopPropagation());
    this.input.addEventListener('blur', () => { if (this.isOpen) this.close(); });
  }
  get isOpen() { return this.input.classList.contains('bf-open'); }
  open() {
    this.input.value = '';
    this.input.classList.add('bf-open');
    // the key that opened the chat must not land in the box
    setTimeout(() => { try { this.input.focus({ preventScroll: true }); } catch { this.input.focus(); } }, 0);
  }
  close() {
    if (!this.isOpen) return;
    this.input.classList.remove('bf-open');
    this.input.blur();
    this.onClose?.();
  }
}

// ============================================================================ multiplayer menu
export interface MultiplayerHandlers {
  host(name: string, seed: string, mode: 'creative' | 'survival'): Promise<void>;
  join(name: string, code: string): Promise<void>;
  available: boolean;
}

export class MultiplayerMenu {
  private root: HTMLDivElement;
  private name: HTMLInputElement;
  private code: HTMLInputElement;
  private seed: HTMLInputElement;
  private msg: HTMLDivElement;
  private mode: 'creative' | 'survival' = 'survival';
  private busy = false;
  onBack: (() => void) | null = null;

  constructor(root: HTMLElement, private h: MultiplayerHandlers) {
    injectCss();
    this.root = div('bfs-mp bf-full bf-dirt bf-font', root);
    const gui = div('bf-gui', this.root);
    const X = (n: number) => U(`(var(--cx) + ${n})`);
    const label = (text: string, x: number, y: number) => { const l = div('bf-label', gui, text); l.style.left = X(x); l.style.top = U(y); return l; };
    const field = (x: number, y: number, w: number, max: number, ph: string) => {
      const f = document.createElement('input');
      f.className = 'bf-field'; f.type = 'text'; f.maxLength = max; f.spellcheck = false; f.autocomplete = 'off'; f.placeholder = ph;
      f.style.left = X(x); f.style.top = U(y); f.style.width = U(w);
      f.addEventListener('keydown', (e) => { if (e.key !== 'Escape') e.stopPropagation(); });
      gui.appendChild(f);
      return f;
    };
    const button = (text: string, x: number, y: number, w: number, fn: () => void) => {
      const b = document.createElement('button');
      b.className = 'bf-btn'; b.type = 'button'; b.textContent = text;
      b.style.left = X(x); b.style.top = U(y); b.style.width = U(w);
      b.addEventListener('click', (e) => { e.preventDefault(); fn(); });
      gui.appendChild(b);
      return b;
    };
    const title = div('bf-h1', gui, 'Multiplayer');
    title.style.top = U(12);
    label('Your name', -150, 30);
    let saved = '';
    try { saved = localStorage.getItem('blockforge.name') ?? ''; } catch { /* private mode */ }
    this.name = field(-150, 42, 300, 16, 'Player');
    this.name.value = saved;

    label('Join a friend: type their world code', -150, 70);
    this.code = field(-150, 82, 146, 5, 'CODE');
    this.code.style.textTransform = 'uppercase';
    button('Join World', 4, 82, 146, () => void this.run(() => this.h.join(this.playerName(), this.code.value.trim().toUpperCase())));

    label('Or start a world and share its code', -150, 112);
    this.seed = field(-150, 124, 146, 64, 'Seed (blank = random)');
    const modeBtn = button('', 4, 124, 146, () => { this.mode = this.mode === 'survival' ? 'creative' : 'survival'; setMode(); });
    const setMode = () => { modeBtn.textContent = `Mode: ${this.mode === 'survival' ? 'Survival' : 'Creative'}`; };
    setMode();
    button('Host New World', -150, 148, 300, () => void this.run(() => this.h.host(this.playerName(), this.seed.value, this.mode)));
    button('Back', -100, 180, 200, () => this.back());
    this.msg = div('bfs-msg bf-c-yellow', gui);
    this.msg.style.left = '0'; this.msg.style.width = '100%'; this.msg.style.textAlign = 'center'; this.msg.style.top = U(206);
    this.code.addEventListener('keydown', (e) => { if (e.key === 'Enter') void this.run(() => this.h.join(this.playerName(), this.code.value.trim().toUpperCase())); });
  }

  private playerName(): string {
    const n = this.name.value.replace(/[^\w \-]/g, '').trim().slice(0, 16) || 'Player';
    try { localStorage.setItem('blockforge.name', n); } catch { /* private mode */ }
    return n;
  }

  private async run(fn: () => Promise<void>) {
    if (this.busy) return;
    this.busy = true;
    this.msg.textContent = 'Connecting...';
    try { await fn(); this.msg.textContent = ''; }
    catch (e) { this.msg.textContent = e instanceof Error ? e.message : String(e); }
    finally { this.busy = false; }
  }

  get isOpen() { return this.root.classList.contains('bf-open'); }
  show() {
    this.msg.textContent = this.h.available ? '' : 'Multiplayer needs the online version of the game.';
    this.root.classList.add('bf-open');
  }
  hide() { this.root.classList.remove('bf-open'); }
  back() { this.hide(); this.onBack?.(); }
}

/** The room code in the corner while playing online, so it is easy to read out. */
export class RoomBadge {
  private el: HTMLDivElement;
  constructor(root: HTMLElement) { injectCss(); this.el = div('bfs-code bf-font', root); }
  set(text: string | null) { this.el.textContent = text ?? ''; this.el.classList.toggle('bf-open', !!text); }
}
