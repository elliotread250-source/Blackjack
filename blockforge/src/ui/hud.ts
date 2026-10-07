// In-game HUD: crosshair, hotbar, item name, chat-style messages, F3 debug overlay,
// fps corner and the underwater tint. Laid out on the GUI-pixel grid from style.ts.
import type { IconSheet } from './icons';
import type { Hotbar } from '../game/hotbar';
import { U } from './style';
import { centered } from './font';

const NAME_TIME = 2.0;      // seconds the item name stays up (fades over the last 0.5 s)
const MSG_TIME = 10.0;      // seconds a message stays up (fades over the last 1 s)
const MAX_MESSAGES = 10;

interface Msg { el: HTMLDivElement; age: number; opacity: number }

function div(cls: string, parent?: HTMLElement): HTMLDivElement {
  const d = document.createElement('div');
  d.className = cls;
  if (parent) parent.appendChild(d);
  return d;
}

export class Hud {
  private el: HTMLDivElement;
  private cross: HTMLDivElement;
  private water: HTMLDivElement;
  private hotbarEl: HTMLDivElement;
  private slotIcons: HTMLDivElement[] = [];
  private slotIds: number[] = [];
  private sel: HTMLDivElement;
  private nameEl: HTMLDivElement;
  private nameTime = 0;
  private nameOpacity = -1;
  private chat: HTMLDivElement;
  private msgs: Msg[] = [];
  private debugEl: HTMLDivElement;
  private debugCols: [HTMLDivElement, HTMLDivElement];
  private debugLines: [HTMLDivElement[], HTMLDivElement[]] = [[], []];
  private fpsEl: HTMLDivElement;
  private _debugVisible = false;
  private visible = true;

  constructor(root: HTMLElement, private icons: IconSheet, private hotbar: Hotbar) {
    this.water = div('bf-water', root);
    this.cross = div('bf-cross', root);
    this.el = div('bf-gui bf-hud bf-font', root);

    this.hotbarEl = div('bf-hotbar', this.el);
    for (let i = 0; i < 9; i++) {
      const s = div('bf-hslot', this.hotbarEl);
      s.style.left = U(1 + i * 20);
      s.dataset.slot = String(i);
      const ic = div('bf-icon', s);
      this.slotIcons.push(ic);
      this.slotIds.push(-1);
      const n = div('bf-num', s);
      n.textContent = String.fromCharCode(0xe001 + i);
      // Touch: tapping a slot selects it (pointer events are only enabled for coarse pointers).
      s.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.hotbar.select(i); });
    }
    this.sel = div('bf-hsel', this.hotbarEl);
    this.nameEl = div('bf-itemname', this.el);
    this.chat = div('bf-chat', this.el);
    this.debugEl = div('bf-debug', this.el);
    this.debugCols = [div('bf-col', this.debugEl), div('bf-col bf-r', this.debugEl)];
    this.fpsEl = div('bf-fps', this.el);

    hotbar.onChange(() => this.refreshHotbar());
    this.refreshHotbar();
  }

  get debugVisible(): boolean { return this._debugVisible; }

  private refreshHotbar() {
    for (let i = 0; i < 9; i++) {
      const id = this.hotbar.slots[i] ?? 0;
      if (this.slotIds[i] !== id) { this.slotIds[i] = id; this.icons.apply(this.slotIcons[i], id); }
    }
    this.sel.style.left = U(-1 + this.hotbar.selected * 20);
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.el.classList.toggle('bf-hidden', !v);
    this.cross.classList.toggle('bf-hidden', !v);
  }

  update(dt: number): void {
    if (this.nameTime > 0) {
      this.nameTime = Math.max(0, this.nameTime - dt);
      const o = Math.min(1, this.nameTime / 0.5);
      const q = Math.round(o * 20) / 20;
      if (q !== this.nameOpacity) { this.nameOpacity = q; this.nameEl.style.opacity = String(q); }
    }
    for (let i = this.msgs.length - 1; i >= 0; i--) {
      const m = this.msgs[i];
      m.age += dt;
      const o = Math.max(0, Math.min(1, MSG_TIME - m.age));
      const q = Math.round(o * 20) / 20;
      if (q !== m.opacity) { m.opacity = q; m.el.style.opacity = String(q); }
      if (m.age >= MSG_TIME) { m.el.remove(); this.msgs.splice(i, 1); }
    }
  }

  showItemName(name: string): void {
    if (!name) { this.nameTime = 0; this.nameOpacity = 0; this.nameEl.style.opacity = '0'; return; }
    this.nameEl.textContent = centered(name, guiWidthParity());
    this.nameTime = NAME_TIME;
    this.nameOpacity = 1;
    this.nameEl.style.opacity = '1';
  }

  message(text: string): void {
    const el = div('bf-msg');
    el.textContent = text;
    this.chat.appendChild(el);
    this.msgs.push({ el, age: 0, opacity: 1 });
    while (this.msgs.length > MAX_MESSAGES) this.msgs.shift()!.el.remove();
  }

  setDebugVisible(v: boolean): void {
    this._debugVisible = v;
    this.debugEl.classList.toggle('bf-on', v);
    if (v) this.setFps(null);
  }

  setDebug(left: string[], right: string[]): void {
    this.fillColumn(0, left);
    this.fillColumn(1, right);
  }

  private fillColumn(c: 0 | 1, lines: string[]) {
    const col = this.debugCols[c], els = this.debugLines[c];
    while (els.length < lines.length) {
      const l = div('bf-line', col);
      l.appendChild(document.createElement('span'));
      els.push(l);
    }
    while (els.length > lines.length) els.pop()!.remove();
    for (let i = 0; i < lines.length; i++) {
      const span = els[i].firstChild as HTMLSpanElement;
      const t = lines[i];
      if (span.textContent !== t) {
        span.textContent = t;
        span.style.display = t ? '' : 'none';
      }
    }
  }

  setFps(text: string | null): void {
    if (text && !this._debugVisible) {
      if (this.fpsEl.textContent !== text) this.fpsEl.textContent = text;
      this.fpsEl.classList.add('bf-on');
    } else this.fpsEl.classList.remove('bf-on');
  }

  setUnderwaterTint(v: boolean): void {
    if (this.water.classList.contains('bf-on') !== v) this.water.classList.toggle('bf-on', v);
  }

  /** True while the HUD is shown (F1 toggles it). */
  get isVisible(): boolean { return this.visible; }
}

/** The GUI width is always even, so centred labels only need even text widths. */
function guiWidthParity(): number { return 0; }
