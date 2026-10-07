import { CAMERA } from '../config';
import { clamp } from '../sim/geom';
import type { Vec } from '../sim/types';

export class Camera {
  x = 0;
  y = 0;
  /** CSS pixels per metre. */
  ppm = 60;
  /** Canvas size in CSS pixels. */
  w = 800;
  h = 600;
  private shake = 0;
  private shakeT = 0;
  /** Final offsets including shake, recomputed each frame. */
  ox = 0;
  oy = 0;

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.ppm = Math.min(h / CAMERA.viewHeight, w / CAMERA.minViewWidth);
  }

  snap(target: Vec): void {
    this.x = target.x;
    this.y = target.y;
  }

  /** Ease toward the target with a little velocity lead. */
  follow(target: Vec, vel: Vec, dt: number): void {
    const tx = target.x + vel.x * CAMERA.lead;
    const ty = target.y + 1.2 + clamp(vel.y * CAMERA.lead, -2.5, 2.5);
    const k = 1 - Math.exp(-CAMERA.follow * dt);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
    this.shakeT += dt;
    this.shake *= Math.exp(-CAMERA.shakeDecay * dt);
    const s = this.shake;
    this.ox = this.x + (Math.sin(this.shakeT * 71) + Math.sin(this.shakeT * 37) * 0.6) * s * 0.6;
    this.oy = this.y + (Math.cos(this.shakeT * 63) + Math.sin(this.shakeT * 29) * 0.6) * s * 0.6;
  }

  addShake(amount: number): void {
    this.shake = Math.min(CAMERA.shakeMax, Math.max(this.shake, amount));
  }

  sx(x: number): number {
    return (x - this.ox) * this.ppm + this.w / 2;
  }

  sy(y: number): number {
    return this.h / 2 - (y - this.oy) * this.ppm;
  }

  /** World-space rectangle currently on screen, with a margin in metres. */
  view(margin = 0): { x0: number; x1: number; y0: number; y1: number } {
    const hw = this.w / 2 / this.ppm + margin;
    const hh = this.h / 2 / this.ppm + margin;
    return { x0: this.ox - hw, x1: this.ox + hw, y0: this.oy - hh, y1: this.oy + hh };
  }
}
