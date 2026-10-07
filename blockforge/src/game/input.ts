// Keyboard + mouse input for the game view: held keys, per-frame edges, mouse deltas under
// pointer lock, wheel notches and the browser default-action suppression a game needs.
//
// Behaviour notes (Chrome/Edge are the targets):
// * Pointer lock is requested with { unadjustedMovement: true } (raw mouse input, like the
//   reference game's "Raw Input" option). Linux and older builds reject that with
//   NotSupportedError, so we fall back to a plain request and remember the answer.
// * After the user leaves pointer lock with Esc, Chrome refuses a new lock for ~1.25 s.
//   requestLock() waits out that window (the click that triggered it keeps its transient
//   user activation for 5 s) and never throws: it resolves false when the lock is refused.
// * Right after locking Chrome sometimes reports one huge movementX/Y (the jump from the
//   cursor position to the centre). Single events over 500 px that come out of nowhere are
//   dropped.

const GAME_PREVENT = new Set([
  'Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Slash', 'Quote', 'Backspace',
]);
// Ctrl/Cmd + key combos the browser lets a page cancel (Ctrl+W/T/N are reserved and cannot be).
const CTRL_PREVENT = new Set([
  'KeyA', 'KeyB', 'KeyD', 'KeyE', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'KeyO', 'KeyP',
  'KeyQ', 'KeyS', 'KeyU', 'KeyW', 'KeyY', 'KeyZ', 'Space', 'Equal', 'Minus', 'NumpadAdd',
  'NumpadSubtract', 'Digit0', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7',
  'Digit8', 'Digit9',
]);
const NON_TEXT_INPUTS = new Set(['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'color', 'file', 'image']);

/** Chrome's cooldown after the user exits pointer lock with Esc (MouseLockController: 1250 ms). */
const ESC_COOLDOWN_MS = 1300;
const SPIKE_PX = 500;

type LockOptions = { unadjustedMovement?: boolean };
type LockableElement = HTMLElement & { requestPointerLock(options?: LockOptions): Promise<void> | void };

function isTextField(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') return !NON_TEXT_INPUTS.has((el as HTMLInputElement).type);
  return el.isContentEditable === true;
}

function isInteractive(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName;
  return tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'A' || el.isContentEditable === true;
}

/** KeyboardEvent.code, with a fallback for synthetic or very old events that only carry key. */
function codeOf(e: KeyboardEvent): string {
  if (e.code) return e.code;
  const k = e.key;
  if (!k) return '';
  if (k === ' ') return 'Space';
  if (k.length === 1) {
    const c = k.toUpperCase();
    if (c >= 'A' && c <= 'Z') return 'Key' + c;
    if (c >= '0' && c <= '9') return 'Digit' + c;
  }
  if (k === 'Shift') return 'ShiftLeft';
  if (k === 'Control') return 'ControlLeft';
  if (k === 'Alt') return 'AltLeft';
  if (k === 'Esc') return 'Escape';
  return k;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class Input {
  readonly target: HTMLElement;
  /** Mouse movement accumulated since the last endFrame() (touch controls add to these too). */
  mouseDX = 0;
  mouseDY = 0;
  /** Accumulated wheel notches since the last endFrame(): + = down / next slot. */
  wheel = 0;
  /** Left, middle, right held. Mutated in place (touch controls write into it). */
  buttons: [boolean, boolean, boolean] = [false, false, false];
  /** Left, middle, right pressed since the last endFrame(). Mutated in place. */
  clicked: [boolean, boolean, boolean] = [false, false, false];
  onLockChange: ((locked: boolean) => void) | null = null;
  /** Every non-repeat keydown (E, Esc, F1-F3, digits...), even while !enabled. */
  onKey: ((code: string, e: KeyboardEvent) => void) | null = null;
  /** Last pointer lock failure, for the debug console. */
  lastLockError: string | null = null;

  private _enabled = true;
  private _virtualLock = false;
  private held = new Set<string>();
  private edges = new Set<string>();
  private wasLocked = false;
  private selfExit = false;
  private userExitAt = -1e9;
  private anyExitAt = -1e9;
  private lockedAt = -1e9;
  private lastMoveAt = -1e9;
  private lastMoveMag = 0;
  private wheelAcc = 0;
  private wheelAt = 0;
  private unadjusted: boolean | null = null;   // null = unknown, false = rejected by this browser
  private pending: Promise<boolean> | null = null;

  constructor(target: HTMLElement) {
    this.target = target;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.releaseAll);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.releaseAll(); });
    target.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    target.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => { if (this.locked || this._enabled && e.target === target) e.preventDefault(); });
    target.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
    // Middle-click autoscroll starts on mousedown anywhere on the page.
    window.addEventListener('mousedown', (e) => {
      if (e.button === 1 && (this.locked || e.target === target || !isInteractive(e.target))) e.preventDefault();
    });
    document.addEventListener('pointerlockchange', this.onLockEvent);
    document.addEventListener('pointerlockerror', () => { this.lastLockError = 'pointerlockerror'; });
  }

  /** False while a menu or the inventory is open: game input is ignored. */
  get enabled(): boolean { return this._enabled; }
  set enabled(v: boolean) {
    if (v === this._enabled) return;
    this._enabled = v;
    // Whatever happened in the menu must not leak into the game (the click on "Back to Game"
    // must not break a block), but keys still physically held keep counting once enabled.
    this.edges.clear();
    this.clearMouse();
  }

  /** Pointer lock active (or the touch scheme's virtual lock). */
  get locked(): boolean {
    return this._virtualLock || (typeof document !== 'undefined' && document.pointerLockElement === this.target);
  }

  /**
   * Touch controls have no pointer lock; they set this so the game treats the view as
   * captured (interaction runs, Esc-style pause comes from the on-screen button).
   */
  get virtualLock(): boolean { return this._virtualLock; }
  set virtualLock(v: boolean) {
    if (v === this._virtualLock) return;
    const before = this.locked;
    this._virtualLock = v;
    if (this.locked !== before) this.onLockChange?.(this.locked);
  }

  down(code: string): boolean { return this._enabled && this.held.has(code); }
  pressed(code: string): boolean { return this._enabled && this.edges.has(code); }

  requestLock(): Promise<boolean> {
    if (this.locked) return Promise.resolve(true);
    if (this.pending) return this.pending;
    const p = this.lock().catch((e) => { this.lastLockError = String(e); return false; });
    this.pending = p;
    void p.then(() => { if (this.pending === p) this.pending = null; });
    return p;
  }

  exitLock(): void {
    if (typeof document === 'undefined') return;
    if (document.pointerLockElement === this.target) {
      this.selfExit = true;
      try { document.exitPointerLock(); } catch { /* ignore */ }
    }
  }

  endFrame(): void {
    this.edges.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
    this.clicked[0] = this.clicked[1] = this.clicked[2] = false;
  }

  // ------------------------------------------------------------------ pointer lock
  private async lock(): Promise<boolean> {
    const el = this.target as LockableElement;
    if (typeof el.requestPointerLock !== 'function') { this.lastLockError = 'pointer lock unsupported'; return false; }
    const wait = this.userExitAt + ESC_COOLDOWN_MS - now();
    if (wait > 0) {
      // Chrome would reject now; the triggering click's activation outlives the wait.
      await sleep(wait);
      if (!this._enabled || this.locked) return this.locked;
    }
    let r = await this.attempt(this.unadjusted !== false);
    if (r === 'unsupported') {
      this.unadjusted = false;
      r = await this.attempt(false);
    }
    if (r === 'ok') {
      if (this.unadjusted === null) this.unadjusted = true;
      return true;
    }
    // A request right after any exit can bounce; try once more after the cooldown.
    const since = now() - this.anyExitAt;
    if (r === 'failed' && since < ESC_COOLDOWN_MS && this._enabled) {
      await sleep(ESC_COOLDOWN_MS - since);
      if (!this._enabled) return this.locked;
      if (this.locked) return true;
      return (await this.attempt(this.unadjusted !== false)) === 'ok';
    }
    return this.locked;
  }

  private attempt(unadjusted: boolean): Promise<'ok' | 'unsupported' | 'failed'> {
    const el = this.target as LockableElement;
    return new Promise((resolve) => {
      let done = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = (r: 'ok' | 'unsupported' | 'failed') => {
        if (done) return;
        done = true;
        if (timer !== undefined) clearTimeout(timer);
        document.removeEventListener('pointerlockchange', onChange);
        document.removeEventListener('pointerlockerror', onError);
        resolve(r);
      };
      const onChange = () => { if (document.pointerLockElement === el) finish('ok'); };
      const onError = () => { this.lastLockError = 'pointerlockerror'; finish('failed'); };
      document.addEventListener('pointerlockchange', onChange);
      document.addEventListener('pointerlockerror', onError);
      timer = setTimeout(() => finish(document.pointerLockElement === el ? 'ok' : 'failed'), 2000);
      let ret: Promise<void> | void;
      try {
        ret = unadjusted ? el.requestPointerLock({ unadjustedMovement: true }) : el.requestPointerLock();
      } catch (e) {
        this.lastLockError = String(e);
        const name = (e as { name?: string } | null)?.name;
        finish(unadjusted && (name === 'NotSupportedError' || e instanceof TypeError) ? 'unsupported' : 'failed');
        return;
      }
      if (ret && typeof (ret as Promise<void>).then === 'function') {
        (ret as Promise<void>).then(
          () => finish('ok'),
          (e: unknown) => {
            this.lastLockError = String(e);
            const name = (e as { name?: string } | null)?.name;
            finish(unadjusted && name === 'NotSupportedError' ? 'unsupported' : 'failed');
          },
        );
      }
    });
  }

  private onLockEvent = () => {
    const isLocked = document.pointerLockElement === this.target;
    if (isLocked === this.wasLocked) return;
    this.wasLocked = isLocked;
    const t = now();
    if (isLocked) {
      this.lockedAt = t;
      this.lastMoveMag = 0;
      this.clearMouse();
    } else {
      this.anyExitAt = t;
      if (!this.selfExit) this.userExitAt = t;
      this.selfExit = false;
      this.buttons[0] = this.buttons[1] = this.buttons[2] = false;
    }
    if (!this._virtualLock) this.onLockChange?.(isLocked);
  };

  // ------------------------------------------------------------------ keyboard
  private onKeyDown = (e: KeyboardEvent) => {
    const code = codeOf(e);
    if (!code) return;
    const text = isTextField(e.target);
    if (!text) {
      if (!this.held.has(code)) {
        this.held.add(code);
        if (this._enabled && !e.repeat) this.edges.add(code);
      }
    }
    const inGame = this._enabled || this.locked;
    if (code === 'F1' || code === 'F2' || code === 'F3') e.preventDefault();
    else if (!text) {
      if (inGame && GAME_PREVENT.has(code)) e.preventDefault();
      else if (!inGame && (code === 'Space' || code.startsWith('Arrow')) && !isInteractive(e.target)) e.preventDefault();
      if (inGame && (e.ctrlKey || e.metaKey) && CTRL_PREVENT.has(code)) e.preventDefault();
    }
    if (!e.repeat && this.onKey) this.onKey(code, e);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const code = codeOf(e);
    this.held.delete(code);
    // Releasing Meta on macOS swallows the keyups of keys pressed with it.
    if (code === 'MetaLeft' || code === 'MetaRight') this.held.clear();
  };

  private releaseAll = () => {
    this.held.clear();
    this.edges.clear();
    this.buttons[0] = this.buttons[1] = this.buttons[2] = false;
  };

  // ------------------------------------------------------------------ mouse
  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 1) e.preventDefault();
    if (e.button < 0 || e.button > 2) return;
    // The click that captures the mouse must not also break a block.
    if (!this._enabled || document.pointerLockElement !== this.target) return;
    this.buttons[e.button] = true;
    this.clicked[e.button] = true;
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button >= 0 && e.button <= 2) this.buttons[e.button] = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== this.target || !this._enabled) return;
    const dx = e.movementX || 0, dy = e.movementY || 0;
    const t = now();
    const mag = Math.max(Math.abs(dx), Math.abs(dy));
    if (mag > SPIKE_PX) {
      // Real flicks ramp up over several events; a lone giant step is the lock-entry glitch.
      const fresh = t - this.lockedAt < 400;
      const sudden = t - this.lastMoveAt > 50 || this.lastMoveMag < SPIKE_PX * 0.25;
      if (fresh || sudden) { this.lastMoveAt = t; this.lastMoveMag = 0; return; }
    }
    this.lastMoveAt = t;
    this.lastMoveMag = mag;
    this.mouseDX += dx;
    this.mouseDY += dy;
  };

  private onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) e.preventDefault();   // Ctrl+wheel and touchpad pinch would zoom the page
    if (!this._enabled || !this.locked) return;
    e.preventDefault();
    const d = e.deltaY;
    if (!d) return;
    if (e.deltaMode === 1) { this.wheel += Math.sign(d) * Math.max(1, Math.round(Math.abs(d) / 3)); return; }
    if (e.deltaMode === 2) { this.wheel += Math.sign(d); return; }
    const t = now();
    if (Math.abs(d) >= 50) {
      // A mouse wheel notch (100 or 120 px in Chrome, ~53 on some Linux setups).
      this.wheel += Math.sign(d) * Math.max(1, Math.round(Math.abs(d) / 100));
      this.wheelAcc = 0;
    } else {
      // Touchpad: many small deltas, one notch per 50 px of travel.
      if (t - this.wheelAt > 250 || Math.sign(this.wheelAcc) !== Math.sign(d)) this.wheelAcc = 0;
      this.wheelAcc += d;
      while (Math.abs(this.wheelAcc) >= 50) {
        const s = Math.sign(this.wheelAcc);
        this.wheel += s;
        this.wheelAcc -= s * 50;
      }
    }
    this.wheelAt = t;
  };

  private clearMouse() {
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
    this.buttons[0] = this.buttons[1] = this.buttons[2] = false;
    this.clicked[0] = this.clicked[1] = this.clicked[2] = false;
  }
}
