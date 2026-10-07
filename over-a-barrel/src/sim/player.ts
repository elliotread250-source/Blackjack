import { Body, Circle, Polygon, PrismaticJoint, RevoluteJoint, Vec2, World } from 'planck';
import { CONTAINER, HAMMER } from '../config';
import { clamp, signedArea, wrapPi } from './geom';
import type { Vec } from './types';

/** All player fixtures share a negative group so they never collide with each other. */
export const PLAYER_GROUP = -1;

export type PartKind = 'barrel' | 'frog' | 'head' | 'handle';

export interface PartData {
  part: PartKind;
}

/** Barrel collider: bulging sides, rounded bottom corners. Local frame, centred. */
export const BARREL_SHAPE: Vec[] = [
  { x: -0.3, y: -0.42 },
  { x: 0.3, y: -0.42 },
  { x: 0.39, y: -0.36 },
  { x: 0.44, y: -0.18 },
  { x: 0.45, y: 0.0 },
  { x: 0.44, y: 0.18 },
  { x: 0.38, y: 0.42 },
  { x: -0.38, y: 0.42 },
  { x: -0.44, y: 0.18 },
  { x: -0.45, y: 0.0 },
  { x: -0.44, y: -0.18 },
  { x: -0.39, y: -0.36 },
];

/** Iron hoop bulge on the right side; mirrored for the left. */
export const HOOP_SHAPE: Vec[] = [
  { x: 0.38, y: -0.24 },
  { x: 0.47, y: -0.2 },
  { x: 0.48, y: 0.0 },
  { x: 0.47, y: 0.2 },
  { x: 0.38, y: 0.24 },
];

/** Where the shaft meets the head, along the hammer's local x (it tucks into the eye). */
export const HANDLE_START = -0.06;

export const FROG_CENTER: Vec = { x: 0, y: 0.58 };
export const FROG_RADIUS = 0.27;

/**
 * Pickaxe head in the hammer's local frame: +x runs from the handle toward
 * the head, the head's eye sits on the origin. Two picks curve back toward
 * the handle on either side, so the head hooks over an edge whichever way
 * it's facing. Each entry is one convex piece.
 */
export function headPieces(): Vec[][] {
  const pieces: Vec[][] = [
    // The eye: a squat block the handle plugs into. Its +x face is the striking face.
    [
      { x: -0.07, y: -0.075 },
      { x: 0.075, y: -0.06 },
      { x: 0.075, y: 0.06 },
      { x: -0.07, y: 0.075 },
    ],
  ];
  // Centreline of one pick, from the eye out to the tip, with tapering width.
  const line: Vec[] = [
    { x: 0.0, y: 0.04 },
    { x: -0.02, y: 0.17 },
    { x: -0.07, y: 0.28 },
    { x: -0.155, y: 0.355 },
  ];
  const widths = [0.12, 0.095, 0.065, 0.022];
  for (const side of [1, -1]) {
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i];
      const b = line[i + 1];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      const nx = -dy;
      const ny = dx;
      const wa = widths[i] / 2;
      const wb = widths[i + 1] / 2;
      const quad = [
        { x: a.x + nx * wa, y: a.y + ny * wa },
        { x: b.x + nx * wb, y: b.y + ny * wb },
        { x: b.x - nx * wb, y: b.y - ny * wb },
        { x: a.x - nx * wa, y: a.y - ny * wa },
      ].map((p) => ({ x: p.x, y: p.y * side }));
      if (signedArea(quad) < 0) quad.reverse();
      pieces.push(quad);
    }
  }
  return pieces;
}

export interface BodyState {
  x: number;
  y: number;
  a: number;
  vx: number;
  vy: number;
  w: number;
}

export interface PlayerState {
  body: BodyState;
  slider: BodyState;
  hammer: BodyState;
  cursor: Vec;
  targetAngle: number;
}

function readBody(b: Body): BodyState {
  const p = b.getPosition();
  const vel = b.getLinearVelocity();
  return { x: p.x, y: p.y, a: b.getAngle(), vx: vel.x, vy: vel.y, w: b.getAngularVelocity() };
}

function writeBody(b: Body, s: BodyState): void {
  b.setTransform(Vec2(s.x, s.y), s.a);
  b.setLinearVelocity(Vec2(s.vx, s.vy));
  b.setAngularVelocity(s.w);
  b.setAwake(true);
}

export class Player {
  readonly body: Body;
  readonly slider: Body;
  readonly hammer: Body;
  readonly rev: RevoluteJoint;
  readonly pri: PrismaticJoint;

  /** Where the mouse wants the hammer head, relative to the pivot (m). */
  cursor: Vec = { x: 1.1, y: -0.35 };
  targetAngle = Math.atan2(-0.35, 1.1);
  targetReach = 1.15;

  constructor(world: World, spawn: Vec) {
    const filter = { filterGroupIndex: PLAYER_GROUP };

    // --- Barrel + frog -----------------------------------------------------
    this.body = world.createBody({
      type: 'dynamic',
      position: Vec2(spawn.x, spawn.y),
      fixedRotation: true,
      bullet: true,
      allowSleep: false,
    });
    const barrelArea = signedArea(BARREL_SHAPE);
    const frogArea = Math.PI * FROG_RADIUS * FROG_RADIUS;
    const frogMass = 2.4;
    this.body.createFixture({
      shape: new Polygon(BARREL_SHAPE.map((p) => Vec2(p.x, p.y))),
      density: (CONTAINER.mass - frogMass) / barrelArea,
      friction: CONTAINER.friction,
      restitution: CONTAINER.restitution,
      userData: { part: 'barrel' } satisfies PartData,
      ...filter,
    });
    for (const side of [1, -1]) {
      const pts = HOOP_SHAPE.map((p) => Vec2(p.x * side, p.y));
      if (side < 0) pts.reverse();
      this.body.createFixture({
        shape: new Polygon(pts),
        density: 0,
        friction: CONTAINER.hoopFriction,
        restitution: CONTAINER.restitution,
        userData: { part: 'barrel' } satisfies PartData,
        ...filter,
      });
    }
    this.body.createFixture({
      shape: new Circle(Vec2(FROG_CENTER.x, FROG_CENTER.y), FROG_RADIUS),
      density: frogMass / frogArea,
      friction: CONTAINER.friction,
      restitution: 0,
      userData: { part: 'frog' } satisfies PartData,
      ...filter,
    });

    // --- Hidden slider body at the pivot ------------------------------------
    const pivot = this.pivotWorld();
    const a0 = this.targetAngle;
    this.slider = world.createBody({
      type: 'dynamic',
      position: Vec2(pivot.x, pivot.y),
      angle: a0,
      allowSleep: false,
    });
    const sliderR = 0.06;
    this.slider.createFixture({
      shape: new Circle(sliderR),
      density: 1,
      filterGroupIndex: PLAYER_GROUP,
      filterMaskBits: 0,
      filterCategoryBits: 0,
    });
    this.slider.setMassData({ mass: HAMMER.sliderMass, center: Vec2(0, 0), I: HAMMER.sliderInertia });

    // --- Hammer: origin at the head's eye, +x toward the head --------------
    const r0 = this.targetReach;
    this.hammer = world.createBody({
      type: 'dynamic',
      position: Vec2(pivot.x + Math.cos(a0) * r0, pivot.y + Math.sin(a0) * r0),
      angle: a0,
      bullet: true,
      allowSleep: false,
    });
    // One fixed-length shaft back from the eye. It carries mass (so the pick
    // swings like a long tool) but never collides: as in the original, only
    // the head touches the world and the shaft passes through rock.
    const handleLen = HAMMER.handleLength;
    const ht = HAMMER.handleThickness / 2;
    const x1 = HANDLE_START;
    const x0 = x1 - handleLen;
    this.hammer.createFixture({
      shape: new Polygon([Vec2(x0, -ht), Vec2(x1, -ht), Vec2(x1, ht), Vec2(x0, ht)]),
      density: HAMMER.handleMass / (handleLen * ht * 2),
      userData: { part: 'handle' } satisfies PartData,
      filterGroupIndex: PLAYER_GROUP,
      filterCategoryBits: 0,
      filterMaskBits: 0,
    });
    const pieces = headPieces();
    const headArea = pieces.reduce((s, p) => s + signedArea(p), 0);
    for (const piece of pieces) {
      this.hammer.createFixture({
        shape: new Polygon(piece.map((p) => Vec2(p.x, p.y))),
        density: HAMMER.headMass / headArea,
        friction: HAMMER.headFriction,
        restitution: HAMMER.restitution,
        userData: { part: 'head' } satisfies PartData,
        ...filter,
      });
    }

    // --- Joints --------------------------------------------------------------
    this.rev = world.createJoint(
      new RevoluteJoint({
        bodyA: this.body,
        bodyB: this.slider,
        localAnchorA: Vec2(CONTAINER.pivot.x, CONTAINER.pivot.y),
        localAnchorB: Vec2(0, 0),
        referenceAngle: 0,
        enableMotor: true,
        maxMotorTorque: HAMMER.maxTorque,
        motorSpeed: 0,
        collideConnected: false,
      }),
    )!;
    this.pri = world.createJoint(
      new PrismaticJoint({
        bodyA: this.slider,
        bodyB: this.hammer,
        localAnchorA: Vec2(0, 0),
        localAnchorB: Vec2(0, 0),
        localAxisA: Vec2(1, 0),
        referenceAngle: 0,
        enableLimit: true,
        lowerTranslation: HAMMER.minReach,
        upperTranslation: HAMMER.maxReach,
        enableMotor: true,
        maxMotorForce: HAMMER.maxForce,
        motorSpeed: 0,
        collideConnected: false,
      }),
    )!;
  }

  pivotWorld(): Vec {
    const p = this.body.getPosition();
    return { x: p.x + CONTAINER.pivot.x, y: p.y + CONTAINER.pivot.y };
  }

  /** Current joint readings. */
  angle(): number {
    return this.rev.getJointAngle();
  }

  reach(): number {
    return this.pri.getJointTranslation();
  }

  headWorld(): Vec {
    const p = this.hammer.getPosition();
    return { x: p.x, y: p.y };
  }

  /** Nudge the virtual cursor by a world-space delta (m). */
  moveCursor(dx: number, dy: number): void {
    this.setCursor(this.cursor.x + dx, this.cursor.y + dy);
  }

  setCursor(x: number, y: number): void {
    const len = Math.hypot(x, y);
    const max = HAMMER.maxReach;
    if (len > max) {
      x *= max / len;
      y *= max / len;
    }
    this.cursor.x = x;
    this.cursor.y = y;
  }

  /** Drive both joint motors toward the cursor. Called once per physics step. */
  control(): void {
    const c = this.cursor;
    const len = Math.hypot(c.x, c.y);
    // Right on top of the pivot the angle is meaningless; hold the last one.
    if (len > 0.05) this.targetAngle = Math.atan2(c.y, c.x);
    this.targetReach = clamp(len, HAMMER.minReach, HAMMER.maxReach);

    const angErr = wrapPi(this.targetAngle - this.rev.getJointAngle());
    this.rev.setMotorSpeed(clamp(HAMMER.angleGain * angErr, -HAMMER.maxAngularSpeed, HAMMER.maxAngularSpeed));

    const reachErr = this.targetReach - this.pri.getJointTranslation();
    this.pri.setMotorSpeed(clamp(HAMMER.reachGain * reachErr, -HAMMER.maxLinearSpeed, HAMMER.maxLinearSpeed));
  }

  getState(): PlayerState {
    return {
      body: readBody(this.body),
      slider: readBody(this.slider),
      hammer: readBody(this.hammer),
      cursor: { ...this.cursor },
      targetAngle: this.targetAngle,
    };
  }

  setState(s: PlayerState): void {
    writeBody(this.body, s.body);
    writeBody(this.slider, s.slider);
    writeBody(this.hammer, s.hammer);
    this.cursor = { ...s.cursor };
    this.targetAngle = s.targetAngle;
  }

  /** Put the whole rig at a new spot, at rest, hammer pointing where the cursor is. */
  teleport(x: number, y: number): void {
    const a = Math.atan2(this.cursor.y, this.cursor.x);
    const r = clamp(Math.hypot(this.cursor.x, this.cursor.y), HAMMER.minReach, HAMMER.maxReach);
    const px = x + CONTAINER.pivot.x;
    const py = y + CONTAINER.pivot.y;
    this.targetAngle = a;
    this.setState({
      body: { x, y, a: 0, vx: 0, vy: 0, w: 0 },
      slider: { x: px, y: py, a, vx: 0, vy: 0, w: 0 },
      hammer: { x: px + Math.cos(a) * r, y: py + Math.sin(a) * r, a, vx: 0, vy: 0, w: 0 },
      cursor: this.cursor,
      targetAngle: a,
    });
  }
}
