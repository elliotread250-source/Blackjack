import { INPUT } from '../config';
import { clamp } from '../sim/geom';

const SENS_KEY = 'oab.sensitivity';

/**
 * Mouse-only control. With pointer lock we read raw movement deltas, so the
 * cursor can't escape the window mid-swing. Without it (lock refused, or a
 * touch screen) we fall back to deltas from absolute positions.
 */
export class Input {
  readonly canvas: HTMLCanvasElement;
  locked = false;
  /** Accumulated movement since the last consume(), CSS pixels. */
  private dx = 0;
  private dy = 0;
  private lastX: number | null = null;
  private lastY: number | null = null;
  private touchId: number | null = null;
  sensitivity: number;
  onLockChange: (locked: boolean) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.sensitivity = INPUT.defaultSensitivity;
    try {
      const saved = Number(localStorage.getItem(SENS_KEY));
      if (saved > 0) this.sensitivity = clamp(saved, INPUT.minSensitivity, INPUT.maxSensitivity);
    } catch {
      /* storage blocked: keep the default */
    }

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
      this.lastX = this.lastY = null;
      this.onLockChange(this.locked);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.locked) {
        // Some browsers emit a huge spurious delta right after locking.
        if (Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
        this.dx += e.movementX;
        this.dy += e.movementY;
        return;
      }
      if (this.lastX !== null && this.lastY !== null) {
        this.dx += e.clientX - this.lastX;
        this.dy += e.clientY - this.lastY;
      }
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });

    // Touch: drag anywhere to move the hammer, same as relative mouse movement.
    canvas.addEventListener(
      'touchstart',
      (e) => {
        const t = e.changedTouches[0];
        this.touchId = t.identifier;
        this.lastX = t.clientX;
        this.lastY = t.clientY;
        e.preventDefault();
      },
      { passive: false },
    );
    canvas.addEventListener(
      'touchmove',
      (e) => {
        for (const t of Array.from(e.changedTouches)) {
          if (t.identifier !== this.touchId || this.lastX === null || this.lastY === null) continue;
          this.dx += t.clientX - this.lastX;
          this.dy += t.clientY - this.lastY;
          this.lastX = t.clientX;
          this.lastY = t.clientY;
        }
        e.preventDefault();
      },
      { passive: false },
    );
    canvas.addEventListener('touchend', () => {
      this.touchId = null;
      this.lastX = this.lastY = null;
    });
  }

  async requestLock(): Promise<void> {
    if (this.locked || !this.canvas.requestPointerLock) return;
    try {
      // Raw, un-accelerated movement where supported.
      await (this.canvas.requestPointerLock as (o?: object) => Promise<void>)({ unadjustedMovement: true });
    } catch {
      try {
        await this.canvas.requestPointerLock();
      } catch {
        /* lock refused: absolute-position fallback still works */
      }
    }
  }

  releaseLock(): void {
    if (this.locked) document.exitPointerLock();
  }

  setSensitivity(s: number): void {
    this.sensitivity = clamp(s, INPUT.minSensitivity, INPUT.maxSensitivity);
    try {
      localStorage.setItem(SENS_KEY, String(this.sensitivity));
    } catch {
      /* ignore */
    }
  }

  /** Drain accumulated movement, scaled by sensitivity (still CSS pixels). */
  consume(): { dx: number; dy: number } {
    const out = { dx: this.dx * this.sensitivity, dy: this.dy * this.sensitivity };
    this.dx = 0;
    this.dy = 0;
    return out;
  }

  /** Add synthetic movement (debug/testing hook). */
  inject(dx: number, dy: number): void {
    this.dx += dx;
    this.dy += dy;
  }
}
