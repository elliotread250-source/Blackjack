// Every tunable number in the game lives here. Units are SI: metres,
// kilograms, seconds, newtons. Physics uses y-up; the renderer flips it.

/**
 * The clock. Gravity, the step rate and every speed, force and gain below
 * were scaled together (speeds and gains x1.25, forces x1.5625, rate x1.25)
 * from an older, floatier tune. That keeps every jump and swing the exact same
 * shape, just quicker, and puts gravity where the original game has it (30).
 */
export const PHYSICS = {
  /** Downward acceleration in m/s². Earth is 9.81; the player is ~1.3 m tall. */
  gravity: 29.7,
  /** Fixed simulation rate. Rendering interpolates between steps. */
  hz: 150,
  velocityIterations: 14,
  positionIterations: 8,
  /** Quadratic air drag, N per (m/s)². Tiny at walking speed, caps long falls. */
  airDrag: 0.11,
  /** Longest real frame we'll simulate in one go (s); protects against tab-switch stalls. */
  maxFrameTime: 0.1,
};

export const CONTAINER = {
  /** Barrel + frog, kg. The hammer is extra. */
  mass: 12,
  /**
   * Wooden base on rock works out to ~0.61 after mixing: the barrel sits on
   * slopes up to ~31° and slides on anything steeper.
   */
  friction: 0.45,
  /**
   * The iron hoops bulge a few cm past the staves at mid-height, so anything
   * vertical touches metal, not wood. Low friction there is what lets you
   * shove yourself up a chimney while the pick holds the opposite wall.
   */
  hoopFriction: 0.08,
  restitution: 0,
  /** Shoulder pivot the hammer rotates around, in the barrel's local frame (m). */
  pivot: { x: 0, y: 0.32 },
};

export const HAMMER = {
  /**
   * Closest the head can come to the pivot (m). The pivot sits on the barrel
   * rim, so 0.3 still lets the head reach the frog's chest or the middle of
   * the barrel, in front of the body. Much lower and chimney bracing suffers.
   */
  minReach: 0.3,
  /** Furthest the head can get from the pivot (m). */
  maxReach: 2.0,
  /**
   * One fixed length, like a real tool. The shaft slides through the frog's
   * hands: pull the head in and the butt sticks out behind. A little longer
   * than maxReach so the hands never run off the end.
   */
  handleLength: 2.25,
  handleThickness: 0.07,
  headMass: 1.5,
  handleMass: 0.5,
  /** The hidden body between the revolute and prismatic joints. Sits at the pivot. */
  sliderMass: 1.0,
  /**
   * Its rotational inertia (kg·m²). Must be in the same ballpark as the
   * hammer's own (~0.7) or the solver can't pass torque through it and the
   * hammer goes limp. It adds a little swing weight, which is fine.
   */
  sliderInertia: 0.5,
  /**
   * A pick bites. ~1.57 on rock after mixing, still useless on ice (~0.11).
   * Only the head collides; the shaft passes through rock, as in the original.
   */
  headFriction: 3.0,
  restitution: 0.0,

  /** Strength caps. These are the "technique, not brute force" knobs. */
  maxTorque: 1250, // N·m at the pivot
  maxForce: 1094, // N along the handle

  /** Proportional gains: commanded joint speed = gain × error. */
  angleGain: 30, // 1/s
  /**
   * High on purpose: the push keeps full speed until the last few cm of the
   * stroke instead of easing in, so shoving off the ground pops.
   */
  reachGain: 60, // 1/s
  /** Speed caps on the joint motors. */
  maxAngularSpeed: 16.25, // rad/s
  maxLinearSpeed: 10.6, // m/s
};

/** Friction per terrain material. Box2D mixes pairs as sqrt(a·b). */
export const MATERIALS = {
  rock: { friction: 0.82, restitution: 0 },
  wood: { friction: 0.9, restitution: 0 },
  ice: { friction: 0.004, restitution: 0 },
  metal: { friction: 0.5, restitution: 0.05 },
  snow: { friction: 0.7, restitution: 0 },
} as const;

export type MaterialId = keyof typeof MATERIALS;

export const INPUT = {
  /** 1.0 means the hammer head tracks the mouse 1:1 with screen pixels. */
  defaultSensitivity: 1.0,
  minSensitivity: 0.25,
  maxSensitivity: 3.0,
};

export const CAMERA = {
  /** World metres visible vertically. Width follows the aspect ratio. */
  viewHeight: 14,
  /** 3D camera distance from the play plane (m). Long lens = little perspective skew. */
  distance: 52,
  /** How far above the target the 3D camera sits (m), so rock tops show. */
  elevation: 1.5,
  /** Narrow (portrait) screens show at least this many metres across. */
  minViewWidth: 11,
  /** Follow stiffness (1/s). Lower = lazier camera. */
  follow: 6.9,
  /** How far ahead of the player's velocity the camera leads (s). */
  lead: 0.096,
  /** Screen shake from a landing: metres of shake per m/s of impact above the threshold. */
  shakePerSpeed: 0.0096,
  shakeThreshold: 11.25,
  shakeMax: 0.35,
  shakeDecay: 7,
};

export const FX = {
  /** Impact speed (m/s) needed for dust to puff. */
  dustThreshold: 2.75,
  /** Impact speed needed for an audible clank. */
  clankThreshold: 1.25,
  /** Barrel landing speed needed for a thud. */
  thudThreshold: 2.5,
};

/**
 * Graphics presets. Physics never changes between them: same 150 Hz sim,
 * same feel. "low" is built to run on machines with no GPU at all (software
 * WebGL); "high"/"ultra" turn on the expensive GPU effects.
 */
export interface GraphicsPreset {
  label: string;
  /** Cap on devicePixelRatio, then scaled by renderScale. */
  pixelRatioCap: number;
  renderScale: number;
  shadows: boolean;
  shadowMapSize: number;
  /** Physically based materials + normal maps, vs cheap Lambert. */
  pbr: boolean;
  /** Post-processing chain (ambient occlusion, bloom). */
  post: boolean;
  ao: boolean;
  bloom: boolean;
  msaa: boolean;
  /** Sculpted terrain mesh density, 0.35..1.5. */
  detail: number;
  /** Fraction of particles kept. */
  particles: number;
  clouds: number;
  towers: number;
  pines: number;
}

export const GRAPHICS: Record<'low' | 'medium' | 'high' | 'ultra', GraphicsPreset> = {
  low: { label: 'CPU (no GPU)', pixelRatioCap: 1, renderScale: 0.5, shadows: false, shadowMapSize: 0, pbr: false, post: false, ao: false, bloom: false, msaa: false, detail: 0.45, particles: 0.35, clouds: 10, towers: 5, pines: 30 },
  medium: { label: 'Balanced', pixelRatioCap: 1.25, renderScale: 1, shadows: true, shadowMapSize: 1024, pbr: true, post: false, ao: false, bloom: false, msaa: true, detail: 0.75, particles: 0.7, clouds: 28, towers: 10, pines: 45 },
  high: { label: 'High (GPU)', pixelRatioCap: 1.75, renderScale: 1, shadows: true, shadowMapSize: 2048, pbr: true, post: true, ao: true, bloom: true, msaa: true, detail: 1, particles: 1, clouds: 40, towers: 14, pines: 70 },
  ultra: { label: 'Ultra (GPU)', pixelRatioCap: 2, renderScale: 1, shadows: true, shadowMapSize: 4096, pbr: true, post: true, ao: true, bloom: true, msaa: true, detail: 1.35, particles: 1, clouds: 52, towers: 18, pines: 90 },
};

export type QualityLevel = keyof typeof GRAPHICS;
