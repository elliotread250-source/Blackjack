// On-screen touch controls for phones and tablets. They drive the normal Input object:
// movement keys are synthesised as keyboard events, looking adds to the mouse deltas and
// breaking/placing presses the virtual mouse buttons, so the game logic is unchanged.
import type { Input } from '../game/input';
import type { Action } from '../game/keybinds';
import type { Hotbar } from '../game/hotbar';
import type { Settings } from '../settings';

export interface TouchHooks {
  openInventory(): void;
  pause(): void;
  isFlying(): boolean;
  toggleFly(): void;
}

/** True on phones/tablets where the primary pointer is a finger. */
export function isTouchDevice(): boolean {
  try {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const fine = matchMedia('(any-pointer: fine)').matches;
    return coarse && !fine && (navigator.maxTouchPoints || 0) > 0;
  } catch {
    return false;
  }
}

const ICONS: Record<string, string> = {
  jump: '<path d="M12 4l7 8h-4v7H9v-7H5z"/>',
  sneak: '<path d="M12 20l-7-8h4V5h6v7h4z"/>',
  fly: '<path d="M3 14c4-1 6-4 9-9 1 4 0 8-3 11 3 0 6-1 9-4-1 5-6 8-12 8z"/>',
  break: '<path d="M4 6c4-3 10-3 15 1l-2 2c-1-1-3-2-5-2l-7 13-2-1 6-13c-2 0-3 1-4 2z"/>',
  place: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 5.3L6.5 8.4 12 11.5l5.5-3.1zM6 10.2v5.2l5 2.8v-5.2zm12 0l-5 2.8v5.2l5-2.8z"/>',
  pick: '<path d="M17 3l4 4-3 3-1-1-7 7H7v-3l7-7-1-1zM5 19h3v2H3v-5h2z"/>',
  inventory: '<path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/>',
  pause: '<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>',
  prev: '<path d="M15 4l-8 8 8 8z"/>',
  next: '<path d="M9 4l8 8-8 8z"/>',
};

const CSS = `
.bf-touch{position:fixed;inset:0;z-index:15;touch-action:none;user-select:none;-webkit-user-select:none;
  -webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;display:none;--s:1}
.bf-touch.on{display:block}
.bf-touch .bt{position:absolute;width:calc(var(--s)*clamp(48px,13vmin,84px));height:calc(var(--s)*clamp(48px,13vmin,84px));
  border-radius:18%;background:rgba(20,20,24,.42);border:2px solid rgba(255,255,255,.38);box-shadow:inset 0 -3px 0 rgba(0,0,0,.35);
  display:flex;align-items:center;justify-content:center;touch-action:none}
.bf-touch .bt svg{width:58%;height:58%;fill:rgba(255,255,255,.92);filter:drop-shadow(1px 1px 0 rgba(0,0,0,.6))}
.bf-touch .bt.down{background:rgba(255,255,255,.32);border-color:#fff}
.bf-touch .bt.latched{background:rgba(120,200,255,.35);border-color:#bfe6ff}
.bf-touch .bt.small{width:calc(var(--s)*clamp(40px,10vmin,60px));height:calc(var(--s)*clamp(40px,10vmin,60px))}
.bf-touch .stick{position:absolute;width:calc(var(--s)*clamp(110px,30vmin,170px));height:calc(var(--s)*clamp(110px,30vmin,170px));
  border-radius:50%;background:rgba(20,20,24,.28);border:2px solid rgba(255,255,255,.3);transform:translate(-50%,-50%);pointer-events:none}
.bf-touch .knob{position:absolute;left:50%;top:50%;width:42%;height:42%;border-radius:50%;background:rgba(255,255,255,.45);
  border:2px solid rgba(255,255,255,.75);transform:translate(-50%,-50%)}
.bf-touch .stick.idle{opacity:.55}
.bf-touch .hint{position:absolute;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);
  color:#fff;font:14px BlockForge,monospace;text-shadow:2px 2px 0 #000;opacity:.85;pointer-events:none;text-align:center;
  transition:opacity 1s}
`;

type Role = 'stick' | 'look' | string;

interface Track { role: Role; x: number; y: number; sx: number; sy: number; t: number; moved: boolean }

export class TouchControls {
  private el: HTMLDivElement;
  private stick: HTMLDivElement;
  private knob: HTMLDivElement;
  private hint: HTMLDivElement;
  private buttons = new Map<string, HTMLDivElement>();
  private tracks = new Map<number, Track>();
  private keys = new Set<Action>();      // actions currently held by touch
  private stickHome = { x: 0, y: 0 };
  private sneakLatched = false;
  private enabled = false;
  private longPress: { id: number; fired: boolean } | null = null;
  private input: Input;
  private hotbar: Hotbar;
  private hooks: TouchHooks;
  private sens = 1;

  constructor(root: HTMLElement, input: Input, hotbar: Hotbar, settings: Settings, hooks: TouchHooks) {
    this.input = input;
    this.hotbar = hotbar;
    this.hooks = hooks;
    if (!document.getElementById('bf-touch-css')) {
      const st = document.createElement('style');
      st.id = 'bf-touch-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const el = document.createElement('div');
    el.className = 'bf-touch';
    this.el = el;
    this.stick = document.createElement('div');
    this.stick.className = 'stick idle';
    this.knob = document.createElement('div');
    this.knob.className = 'knob';
    this.stick.appendChild(this.knob);
    el.appendChild(this.stick);
    this.hint = document.createElement('div');
    this.hint.className = 'hint';
    this.hint.textContent = 'Left thumb moves. Drag right side to look. Tap to place, hold to break.';
    el.appendChild(this.hint);

    this.addButton('pause', 'small', { top: 'max(10px,env(safe-area-inset-top))', right: 'max(10px,env(safe-area-inset-right))' });
    this.addButton('inventory', 'small', { top: 'max(10px,env(safe-area-inset-top))', right: 'calc(max(10px,env(safe-area-inset-right)) + var(--s)*clamp(48px,12vmin,72px))' });
    this.addButton('jump', '', { right: 'calc(max(14px,env(safe-area-inset-right)) + 2vmin)', bottom: 'calc(var(--s)*clamp(64px,16vmin,110px))' });
    this.addButton('sneak', '', { right: 'calc(max(14px,env(safe-area-inset-right)) + var(--s)*clamp(56px,15vmin,98px) + 2vmin)', bottom: 'calc(var(--s)*clamp(40px,9vmin,70px))' });
    this.addButton('fly', 'small', { right: 'calc(max(14px,env(safe-area-inset-right)) + 2vmin)', bottom: 'calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px))' });
    this.addButton('break', '', { right: 'calc(max(14px,env(safe-area-inset-right)) + 2vmin)', bottom: 'calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px)*2)' });
    this.addButton('place', '', { right: 'calc(max(14px,env(safe-area-inset-right)) + var(--s)*clamp(56px,15vmin,98px) + 2vmin)', bottom: 'calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px)*2)' });
    this.addButton('pick', 'small', { right: 'calc(max(14px,env(safe-area-inset-right)) + var(--s)*clamp(56px,15vmin,98px)*2 + 2vmin)', bottom: 'calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px)*2)' });

    el.addEventListener('pointerdown', (e) => this.onDown(e));
    el.addEventListener('pointermove', (e) => this.onMove(e));
    el.addEventListener('pointerup', (e) => this.onUp(e));
    el.addEventListener('pointercancel', (e) => this.onUp(e));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    root.appendChild(el);
    this.applySettings(settings);
    this.placeStickHome();
    window.addEventListener('resize', () => this.placeStickHome());
  }

  private addButton(name: string, cls: string, pos: Record<string, string>) {
    const b = document.createElement('div');
    b.className = `bt ${cls}`.trim();
    b.dataset.btn = name;
    b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ''}</svg>`;
    b.setAttribute('aria-label', name);
    for (const [k, v] of Object.entries(pos)) (b.style as unknown as Record<string, string>)[k] = v;
    this.el.appendChild(b);
    this.buttons.set(name, b);
  }

  private placeStickHome() {
    const w = innerWidth, h = innerHeight;
    const r = Math.min(Math.max(110, Math.min(w, h) * 0.3), 170) / 2;
    this.stickHome = { x: Math.max(24, w * 0.05) + r * 1.15, y: h - Math.max(24, h * 0.06) - r * 1.25 };
    if (!this.tracksHas('stick')) this.showStick(this.stickHome.x, this.stickHome.y, 0, 0, true);
  }

  private tracksHas(role: Role) {
    for (const t of this.tracks.values()) if (t.role === role) return true;
    return false;
  }

  applySettings(s: Settings) {
    this.sens = s.touchSensitivity ?? 1;
    this.el.style.setProperty('--s', String(s.touchButtonScale ?? 1));
  }

  setEnabled(on: boolean) {
    if (on === this.enabled) return;
    this.enabled = on;
    this.el.classList.toggle('on', on);
    if (!on) this.releaseAll();
    else {
      this.hint.style.opacity = '0.85';
      setTimeout(() => { this.hint.style.opacity = '0'; }, 6000);
    }
  }

  get isEnabled() { return this.enabled; }

  // ------------------------------------------------------------------ keys
  /** Hold or release an action through whatever it is bound to (rebinding keeps touch working). */
  private key(a: Action, down: boolean) {
    if (down === this.keys.has(a)) return;
    if (down) this.keys.add(a); else this.keys.delete(a);
    this.input.setAction(a, down);
  }

  private releaseAll() {
    for (const k of Array.from(this.keys)) this.key(k, false);
    this.tracks.clear();
    this.sneakLatched = false;
    this.buttons.forEach((b) => b.classList.remove('down', 'latched'));
    this.longPress = null;
    this.showStick(this.stickHome.x, this.stickHome.y, 0, 0, true);
  }

  // ------------------------------------------------------------------ pointers
  private stickRadius() {
    return this.stick.getBoundingClientRect().width / 2 || 60;
  }

  private onDown(e: PointerEvent) {
    if (!this.enabled) return;
    e.preventDefault();
    try { this.el.setPointerCapture(e.pointerId); } catch { /* old browsers */ }
    const target = (e.target as HTMLElement).closest('.bt') as HTMLElement | null;
    const now = performance.now();
    // The hotbar sits under this overlay: a tap on a slot selects it.
    if (!target) {
      for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
        const slot = (el as HTMLElement).dataset?.slot;
        if (slot !== undefined && el.closest('.bf-hotbar, .bf-hud, [data-slot]')) {
          this.hotbar.select(Number(slot));
          return;
        }
      }
    }
    if (target) {
      const name = target.dataset.btn!;
      this.tracks.set(e.pointerId, { role: name, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: now, moved: false });
      target.classList.add('down');
      this.buttonDown(name);
      return;
    }
    const leftZone = e.clientX < innerWidth * 0.42 && e.clientY > innerHeight * 0.3;
    if (leftZone && !this.tracksHas('stick')) {
      this.tracks.set(e.pointerId, { role: 'stick', x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: now, moved: false });
      this.showStick(e.clientX, e.clientY, 0, 0, false);
      return;
    }
    this.tracks.set(e.pointerId, { role: 'look', x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: now, moved: false });
    if (!this.longPress) this.longPress = { id: e.pointerId, fired: false };
  }

  private onMove(e: PointerEvent) {
    const t = this.tracks.get(e.pointerId);
    if (!t || !this.enabled) return;
    e.preventDefault();
    const dx = e.clientX - t.x, dy = e.clientY - t.y;
    t.x = e.clientX; t.y = e.clientY;
    if (Math.hypot(t.x - t.sx, t.y - t.sy) > 12) t.moved = true;
    if (t.role === 'stick') {
      this.updateStick(t);
    } else if (t.role === 'look') {
      // Touch pixels are much coarser than mouse counts; 2.2x keeps a 300px swipe near a quarter turn.
      this.input.mouseDX += dx * 2.2 * this.sens;
      this.input.mouseDY += dy * 2.2 * this.sens;
      if (t.moved && this.longPress?.id === e.pointerId && !this.longPress.fired) this.longPress = null;
    }
  }

  private onUp(e: PointerEvent) {
    const t = this.tracks.get(e.pointerId);
    if (!t) return;
    this.tracks.delete(e.pointerId);
    if (t.role === 'stick') {
      for (const k of ['forward', 'left', 'back', 'right', 'sprint'] as Action[]) this.key(k, false);
      this.showStick(this.stickHome.x, this.stickHome.y, 0, 0, true);
      return;
    }
    if (t.role === 'look') {
      const lp = this.longPress;
      if (lp && lp.id === e.pointerId) {
        if (lp.fired) this.key('attack', false);
        else if (!t.moved && performance.now() - t.t < 350) this.input.tapAction('use'); // quick tap: place / use
        this.longPress = null;
      }
      return;
    }
    this.buttons.get(t.role)?.classList.remove('down');
    this.buttonUp(t.role);
  }

  private showStick(x: number, y: number, kx: number, ky: number, idle: boolean) {
    this.stick.style.left = `${x}px`;
    this.stick.style.top = `${y}px`;
    this.knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
    this.stick.classList.toggle('idle', idle);
  }

  private updateStick(t: Track) {
    const r = this.stickRadius();
    let dx = t.x - t.sx, dy = t.y - t.sy;
    const len = Math.hypot(dx, dy);
    // Follow the thumb when it drags past the rim, like a floating stick.
    if (len > r) {
      t.sx += (dx / len) * (len - r);
      t.sy += (dy / len) * (len - r);
      dx = t.x - t.sx; dy = t.y - t.sy;
    }
    const nx = dx / r, ny = dy / r;
    this.showStick(t.sx, t.sy, dx, dy, false);
    const dead = 0.28;
    this.key('forward', ny < -dead);
    this.key('back', ny > dead);
    this.key('left', nx < -dead);
    this.key('right', nx > dead);
    this.key('sprint', ny < -0.88 && Math.abs(nx) < 0.55);
  }

  private buttonDown(name: string) {
    switch (name) {
      case 'jump': this.key('jump', true); break;
      case 'sneak':
        if (this.hooks.isFlying()) this.key('sneak', true);
        else {
          this.sneakLatched = !this.sneakLatched;
          this.key('sneak', this.sneakLatched);
          this.buttons.get('sneak')!.classList.toggle('latched', this.sneakLatched);
        }
        break;
      case 'fly': this.hooks.toggleFly(); break;
      case 'break': this.key('attack', true); break;
      case 'place': this.key('use', true); break;
      case 'pick': this.input.tapAction('pick'); break;
      case 'inventory': this.releaseAll(); this.hooks.openInventory(); break;
      case 'pause': this.releaseAll(); this.hooks.pause(); break;
      case 'prev': this.hotbar.scroll(-1); break;
      case 'next': this.hotbar.scroll(1); break;
    }
  }

  private buttonUp(name: string) {
    switch (name) {
      case 'jump': this.key('jump', false); break;
      case 'sneak': if (!this.sneakLatched) this.key('sneak', false); break;
      case 'break': this.key('attack', false); break;
      case 'place': this.key('use', false); break;
    }
  }

  /** Per frame: long-press to break, release one-frame virtual clicks. */
  update(_dt: number) {
    if (!this.enabled) return;
    const lp = this.longPress;
    if (lp && !lp.fired) {
      const t = this.tracks.get(lp.id);
      if (!t) this.longPress = null;
      else if (!t.moved && performance.now() - t.t > 380) {
        lp.fired = true;
        this.key('attack', true);
        if (navigator.vibrate) { try { navigator.vibrate(12); } catch { /* ignore */ } }
      }
    }
    // Releasing sneak-to-descend if the player landed while holding it is handled by buttonUp.
  }

  dispose() {
    this.releaseAll();
    this.el.remove();
  }
}
