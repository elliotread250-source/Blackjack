import { Chain, Contact, Vec2, World, type Body, type Fixture } from 'planck';
import { MATERIALS, PHYSICS, type MaterialId } from '../config';
import { cleanPolygon } from './geom';
import { Player, type PartData, type PartKind } from './player';
import type { LevelDef, Vec } from './types';

export interface TerrainData {
  mat: MaterialId;
  solid: number;
}

export interface ImpactEvent {
  part: PartKind;
  mat: MaterialId;
  x: number;
  y: number;
  nx: number;
  ny: number;
  /** Closing speed along the contact normal, m/s. */
  speed: number;
}

/** Sliding speeds this step, for scrape sounds and dust trails. */
export interface ScrapeInfo {
  head: number;
  headMat: MaterialId;
  headAt: Vec;
  barrel: number;
  barrelMat: MaterialId;
  barrelAt: Vec;
  /** True when anything on the player touches terrain. */
  touching: boolean;
  barrelTouching: boolean;
}

function partOf(f: Fixture): PartData | null {
  const d = f.getUserData() as PartData | TerrainData | null;
  return d && 'part' in d ? d : null;
}

function terrainOf(f: Fixture): TerrainData | null {
  const d = f.getUserData() as PartData | TerrainData | null;
  return d && 'mat' in d ? d : null;
}

export class Sim {
  readonly world: World;
  readonly player: Player;
  readonly level: LevelDef;
  readonly dt = 1 / PHYSICS.hz;
  readonly terrain: Body[] = [];
  time = 0;
  steps = 0;
  /** Impacts since the last drain. The renderer/audio side empties this. */
  events: ImpactEvent[] = [];
  /** Set false in headless runs to skip event bookkeeping. */
  recordEvents = true;
  scrape: ScrapeInfo = {
    head: 0,
    headMat: 'rock',
    headAt: { x: 0, y: 0 },
    barrel: 0,
    barrelMat: 'rock',
    barrelAt: { x: 0, y: 0 },
    touching: false,
    barrelTouching: false,
  };

  constructor(level: LevelDef) {
    this.level = level;
    this.world = new World({ gravity: Vec2(0, -PHYSICS.gravity) });

    level.solids.forEach((solid, i) => {
      const pts = cleanPolygon(solid.pts);
      if (pts.length < 3) return;
      const body = this.world.createBody({ type: 'static' });
      const mat = MATERIALS[solid.mat];
      body.createFixture({
        shape: new Chain(
          pts.map((p) => Vec2(p.x, p.y)),
          true,
        ),
        friction: mat.friction,
        restitution: mat.restitution,
        userData: { mat: solid.mat, solid: i } satisfies TerrainData,
      });
      this.terrain.push(body);
    });

    this.player = new Player(this.world, level.spawn);
    this.world.on('begin-contact', (c) => this.onBegin(c));
  }

  private onBegin(c: Contact): void {
    if (!this.recordEvents) return;
    const fa = c.getFixtureA();
    const fb = c.getFixtureB();
    let part = partOf(fa);
    let ter = terrainOf(fb);
    if (!part || !ter) {
      part = partOf(fb);
      ter = terrainOf(fa);
    }
    if (!part || !ter) return;
    const wm = c.getWorldManifold(null);
    if (!wm || c.getManifold().pointCount === 0) return;
    const p = wm.points[0];
    const n = wm.normal;
    const ba = fa.getBody();
    const bb = fb.getBody();
    const va = ba.getLinearVelocityFromWorldPoint(p);
    const vb = bb.getLinearVelocityFromWorldPoint(p);
    const closing = -((vb.x - va.x) * n.x + (vb.y - va.y) * n.y);
    if (closing < 0.3) return;
    // Normal pointing from the terrain toward the player, for particle spray.
    const sign = partOf(fa) ? -1 : 1;
    this.events.push({
      part: part.part,
      mat: ter.mat,
      x: p.x,
      y: p.y,
      nx: n.x * sign,
      ny: n.y * sign,
      speed: closing,
    });
  }

  private applyDrag(): void {
    const k = PHYSICS.airDrag;
    for (const b of [this.player.body, this.player.hammer]) {
      const vel = b.getLinearVelocity();
      const s = Math.hypot(vel.x, vel.y);
      if (s < 0.01) continue;
      b.applyForceToCenter(Vec2(-k * s * vel.x, -k * s * vel.y), true);
    }
  }

  private measureScrape(): void {
    const sc = this.scrape;
    sc.head = 0;
    sc.barrel = 0;
    sc.touching = false;
    sc.barrelTouching = false;
    for (let c = this.world.getContactList(); c; c = c.getNext()) {
      if (!c.isTouching()) continue;
      const fa = c.getFixtureA();
      const fb = c.getFixtureB();
      const pa = partOf(fa);
      const pb = partOf(fb);
      const part = pa ?? pb;
      const ter = terrainOf(pa ? fb : fa);
      if (!part || !ter) continue;
      sc.touching = true;
      const wm = c.getWorldManifold(null);
      if (!wm || c.getManifold().pointCount === 0) continue;
      const p = wm.points[0];
      const n = wm.normal;
      const va = fa.getBody().getLinearVelocityFromWorldPoint(p);
      const vb = fb.getBody().getLinearVelocityFromWorldPoint(p);
      const rx = vb.x - va.x;
      const ry = vb.y - va.y;
      const vn = rx * n.x + ry * n.y;
      const slide = Math.hypot(rx - vn * n.x, ry - vn * n.y);
      if (part.part === 'head') {
        if (slide > sc.head) {
          sc.head = slide;
          sc.headMat = ter.mat;
          sc.headAt = { x: p.x, y: p.y };
        }
      } else {
        sc.barrelTouching = true;
        if (slide > sc.barrel) {
          sc.barrel = slide;
          sc.barrelMat = ter.mat;
          sc.barrelAt = { x: p.x, y: p.y };
        }
      }
    }
  }

  step(): void {
    this.player.control();
    this.applyDrag();
    this.world.step(this.dt, PHYSICS.velocityIterations, PHYSICS.positionIterations);
    this.time += this.dt;
    this.steps++;
    if (this.recordEvents) this.measureScrape();
  }

  /** Height of the barrel's base above the level's zero line. */
  height(): number {
    return this.player.body.getPosition().y - 0.42 - this.level.groundY;
  }

  atSummit(): boolean {
    const p = this.player.body.getPosition();
    const s = this.level.summit;
    return p.x >= s.x0 && p.x <= s.x1 && p.y >= s.y0 && p.y <= s.y1;
  }
}
