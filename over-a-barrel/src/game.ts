import { CAMERA, GRAPHICS, PHYSICS, type QualityLevel } from './config';
import { AudioEngine } from './audio/audio';
import { Input } from './input/input';
import { Camera } from './render/camera';
import { drawColliders } from './render/debug';
import { detectQuality, loadQuality, probeGpu, saveQuality } from './render3d/quality';
import { Renderer3D } from './render3d/renderer3d';
import { loadBests, loadRun, loadSettings, saveBests, saveRun, saveSettings, type Bests, type Settings } from './save';
import { mountainLevel } from './sim/levels/mountain';
import { testLevel } from './sim/levels/test';
import { Sim } from './sim/sim';
import type { LevelDef } from './sim/types';
import { UI } from './ui/ui';

/** Everything the renderer needs from one physics step, for interpolation. */
export interface Frame {
  bx: number;
  by: number;
  hx: number;
  hy: number;
  ha: number;
  reach: number;
  vx: number;
  vy: number;
}

type Mode = 'title' | 'playing' | 'paused' | 'ending' | 'summit';

function capture(sim: Sim): Frame {
  const p = sim.player;
  const b = p.body.getPosition();
  const h = p.hammer.getPosition();
  const v = p.body.getLinearVelocity();
  return { bx: b.x, by: b.y, hx: h.x, hy: h.y, ha: p.hammer.getAngle(), reach: p.reach(), vx: v.x, vy: v.y };
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function mix(a: Frame, b: Frame, t: number): Frame {
  return {
    bx: a.bx + (b.bx - a.bx) * t,
    by: a.by + (b.by - a.by) * t,
    hx: a.hx + (b.hx - a.hx) * t,
    hy: a.hy + (b.hy - a.hy) * t,
    ha: lerpAngle(a.ha, b.ha, t),
    reach: a.reach + (b.reach - a.reach) * t,
    vx: a.vx + (b.vx - a.vx) * t,
    vy: a.vy + (b.vy - a.vy) * t,
  };
}

export class Game {
  readonly canvas: HTMLCanvasElement;
  readonly cam = new Camera();
  readonly input: Input;
  readonly r3d: Renderer3D;
  readonly audio = new AudioEngine();
  readonly ui: UI;
  level: LevelDef;
  sim: Sim;
  mode: Mode = 'title';
  dpr = 1;
  private acc = 0;
  private last = 0;
  prev: Frame;
  curr: Frame;
  view: Frame;
  debug: boolean;
  private overlay: HTMLCanvasElement | null = null;
  quality: QualityLevel;
  qualityChosen: boolean;
  private gpu = probeGpu();
  private settings: Settings = loadSettings();
  private bests: Bests = loadBests();
  private runTime = 0;
  private falls = 0;
  private bigFall = 0;
  private maxHeight = 0;
  private fallPeak = 0;
  private saveTimer = 0;
  private stillTime = 0;
  private fpsSamples: number[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.input = new Input(canvas);
    const params = new URLSearchParams(location.search);
    this.debug = params.has('debug');
    this.level = params.get('map') === 'test' ? testLevel() : mountainLevel();
    this.sim = new Sim(this.level);
    this.placeAtStart();
    this.prev = this.curr = this.view = capture(this.sim);
    this.cam.snap({ x: this.curr.bx, y: this.curr.by + 1.2 });

    const q = loadQuality();
    this.quality = q.level;
    this.qualityChosen = q.chosen;
    this.r3d = new Renderer3D(canvas, this.level, GRAPHICS[this.quality]);
    this.audio.setVolume(this.settings.volume);

    if (this.debug) {
      this.overlay = document.createElement('canvas');
      this.overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none';
      document.body.appendChild(this.overlay);
    }

    this.ui = new UI(
      {
        newClimb: () => this.newClimb(),
        continueClimb: () => this.continueClimb(),
        resume: () => this.resume(),
        restart: () => this.newClimb(),
        quitToTitle: () => this.toTitle(),
        stayAtSummit: () => this.stayAtSummit(),
        setSensitivity: (v) => this.input.setSensitivity(v),
        setVolume: (v) => {
          this.settings.volume = v;
          this.audio.setVolume(v);
          saveSettings(this.settings);
        },
        setQuality: (lvl) => this.setQuality(lvl),
        setShowCursor: (b) => {
          this.settings.showCursor = b;
          saveSettings(this.settings);
        },
      },
      () => ({
        sensitivity: this.input.sensitivity,
        volume: this.settings.volume,
        quality: this.quality,
        qualityChosen: this.qualityChosen,
        detected: detectQuality(this.gpu),
        gpu: this.gpu.renderer,
        showCursor: this.settings.showCursor,
      }),
    );

    window.addEventListener('resize', () => this.resize());
    this.resize();
    canvas.addEventListener('mousedown', () => {
      if (this.mode === 'playing' || this.mode === 'summit') void this.input.requestLock();
    });
    this.input.onLockChange = (locked) => {
      if (!locked && this.mode === 'playing' && matchMedia('(pointer: fine)').matches) this.pause();
    };
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && (this.mode === 'playing' || this.mode === 'summit')) this.pause();
    });
    window.addEventListener('blur', () => {
      if (this.mode === 'playing') this.pause();
    });
    window.addEventListener('beforeunload', () => this.persist());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.persist();
    });

    if (params.has('play')) this.newClimb();
    else this.toTitle();
    (window as unknown as { __oab: unknown }).__oab = this;
  }

  // ---------------------------------------------------------------- modes
  private placeAtStart(): void {
    this.sim.player.setCursor(1.0, 0.2);
    this.sim.player.teleport(this.level.spawn.x, this.level.spawn.y);
  }

  private resetStats(): void {
    this.runTime = 0;
    this.falls = 0;
    this.bigFall = 0;
    this.maxHeight = 0;
    this.fallPeak = 0;
  }

  private toTitle(): void {
    this.persist();
    this.mode = 'title';
    this.input.releaseLock();
    this.ui.setHUDVisible(false);
    this.ui.showTitle(!!loadRun(), this.bests);
  }

  private begin(): void {
    this.audio.init();
    this.mode = 'playing';
    this.ui.hideMenus();
    this.ui.setHUDVisible(true);
    this.acc = 0;
    this.prev = this.curr = capture(this.sim);
    void this.input.requestLock();
    this.input.consume();
  }

  newClimb(): void {
    saveRun(null);
    this.placeAtStart();
    this.resetStats();
    this.cam.snap({ x: this.level.spawn.x, y: this.level.spawn.y + 1.2 });
    this.begin();
  }

  continueClimb(): void {
    const run = loadRun();
    if (!run) return this.newClimb();
    this.sim.player.setState(run.state);
    this.runTime = run.time;
    this.falls = run.falls;
    this.bigFall = run.bigFall;
    this.maxHeight = run.maxHeight;
    this.fallPeak = this.sim.height();
    this.cam.snap({ x: run.state.body.x, y: run.state.body.y + 1.2 });
    this.begin();
  }

  pause(): void {
    if (this.mode !== 'playing' && this.mode !== 'summit') return;
    this.mode = 'paused';
    this.persist();
    this.input.releaseLock();
    this.ui.showPause();
  }

  resume(): void {
    if (this.mode !== 'paused') return;
    this.begin();
  }

  private stayAtSummit(): void {
    this.mode = 'summit';
    this.ui.hideMenus();
    this.ui.setHUDVisible(true);
    void this.input.requestLock();
  }

  private setQuality(q: QualityLevel | 'auto'): void {
    this.persist();
    if (q === 'auto') {
      try {
        localStorage.removeItem('oab.quality');
      } catch {
        /* ignore */
      }
    } else saveQuality(q);
    // Graphics presets rebuild the whole GPU pipeline; a reload is the clean way.
    const url = new URL(location.href);
    url.searchParams.delete('quality');
    location.replace(url.toString());
  }

  /** Remember where you are, so closing the tab doesn't cost you the climb. */
  private persist(): void {
    if (this.mode !== 'playing' && this.mode !== 'paused') return;
    saveRun({
      state: this.sim.player.getState(),
      time: this.runTime,
      falls: this.falls,
      bigFall: this.bigFall,
      maxHeight: this.maxHeight,
    });
    saveBests(this.bests);
  }

  private reachSummit(): void {
    this.mode = 'ending';
    this.input.releaseLock();
    const newBest = this.bests.time === 0 || this.runTime < this.bests.time;
    if (newBest) this.bests.time = this.runTime;
    this.bests.summits++;
    saveBests(this.bests);
    saveRun(null);
    this.audio.fanfare();
    this.ui.showEnding({
      time: this.runTime,
      falls: this.falls,
      bigFall: this.bigFall,
      bestTime: this.bests.time,
      newBest,
      summits: this.bests.summits,
    });
  }

  // --------------------------------------------------------------- frame
  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.cam.resize(w, h);
    this.r3d.resize(w, h, this.dpr);
    if (this.overlay) {
      this.overlay.width = Math.round(w * this.dpr);
      this.overlay.height = Math.round(h * this.dpr);
      this.overlay.style.width = `${w}px`;
      this.overlay.style.height = `${h}px`;
    }
  }

  start(): void {
    this.last = performance.now();
    const loop = (t: number) => {
      this.frame(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /** Advance the simulation by whole fixed steps; leftover time drives interpolation. */
  private step(realDt: number): void {
    const dt = this.sim.dt;
    this.acc += Math.min(realDt, PHYSICS.maxFrameTime);
    const steps = Math.floor(this.acc / dt);
    if (steps > 0) {
      const move = this.input.consume();
      const k = 1 / (steps * this.cam.ppm);
      for (let i = 0; i < steps; i++) {
        this.sim.player.moveCursor(move.dx * k, -move.dy * k);
        this.prev = this.curr;
        this.sim.step();
        this.curr = capture(this.sim);
      }
      this.acc -= steps * dt;
    }
    this.view = mix(this.prev, this.curr, this.acc / dt);
  }

  private track(realDt: number): void {
    const height = this.sim.height();
    if (height > this.maxHeight) this.maxHeight = height;
    if (height > this.bests.height) this.bests.height = height;
    // A "fall" is losing 12 m or more before coming to rest.
    const v = this.sim.player.body.getLinearVelocity();
    this.stillTime = Math.hypot(v.x, v.y) < 0.6 ? this.stillTime + realDt : 0;
    if (height > this.fallPeak) this.fallPeak = height;
    if (this.stillTime > 0.6) {
      const drop = this.fallPeak - height;
      if (drop >= 12) {
        this.falls++;
        this.bigFall = Math.max(this.bigFall, drop);
        if (drop > 40) this.ui.toast(drop > 100 ? 'All the way down.' : `Lost ${drop.toFixed(0)} m.`);
      }
      this.fallPeak = height;
    }
    this.saveTimer += realDt;
    if (this.saveTimer > 3) {
      this.saveTimer = 0;
      this.persist();
    }
  }

  private frame(t: number): void {
    const realDt = Math.min((t - this.last) / 1000, 0.1);
    this.last = t;

    const live = this.mode === 'playing' || this.mode === 'summit';
    if (live) {
      this.step(realDt);
      if (this.mode === 'playing') {
        this.runTime += realDt;
        this.track(realDt);
        if (this.sim.atSummit()) this.reachSummit();
      }
    } else {
      this.input.consume();
    }

    for (const e of this.sim.events) {
      this.r3d.impact(e);
      this.audio.impact(e);
      if (e.part === 'barrel' && e.speed > CAMERA.shakeThreshold) this.cam.addShake((e.speed - CAMERA.shakeThreshold) * CAMERA.shakePerSpeed);
    }
    this.sim.events.length = 0;
    this.r3d.scrape(live ? this.sim.scrape : { ...this.sim.scrape, head: 0, barrel: 0 }, realDt);

    this.cam.follow({ x: this.view.bx, y: this.view.by }, { x: this.view.vx, y: this.view.vy }, realDt);
    const pv = this.sim.player.pivotWorld();
    const c = this.sim.player.cursor;
    this.r3d.setAim(this.settings.showCursor && live, pv.x + c.x, pv.y + c.y);
    this.r3d.render(this.view, this.cam, realDt);
    if (this.r3d.signals.thunder > 0) this.audio.thunder(this.r3d.signals.thunder);
    const v = this.sim.player.body.getLinearVelocity();
    this.audio.update(realDt, this.sim.scrape, this.sim.height(), this.r3d.atmos.storm, Math.hypot(v.x, v.y), live);

    if (this.mode !== 'title') {
      const height = this.sim.height();
      const sec = [...this.level.sections].reverse().find((s) => height >= s.y0 - 0.5)?.name ?? '';
      this.ui.updateHUD(height, this.bests.height, this.runTime, sec, height / this.level.topY, this.bests.height / this.level.topY);
    } else {
      this.watchFps(realDt);
    }

    if (this.overlay) {
      const ctx = this.overlay.getContext('2d')!;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.cam.w, this.cam.h);
      drawColliders(ctx, this.sim, this.cam);
    }
  }

  /**
   * On the title screen, if the auto-picked quality can't hold ~38 fps,
   * step down one level (only when the player hasn't chosen one).
   */
  private watchFps(dt: number): void {
    if (this.qualityChosen || this.quality === 'low') return;
    this.fpsSamples.push(dt);
    if (this.fpsSamples.length < 150) return;
    const sorted = [...this.fpsSamples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    this.fpsSamples = [];
    if (median > 1 / 38) {
      const order: QualityLevel[] = ['low', 'medium', 'high', 'ultra'];
      const lower = order[Math.max(0, order.indexOf(this.quality) - 1)];
      saveQuality(lower);
      location.reload();
    }
  }
}
