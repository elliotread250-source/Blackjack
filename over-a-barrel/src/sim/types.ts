import type { MaterialId } from '../config';

export interface Vec {
  x: number;
  y: number;
}

/** Visual treatment for a solid. Physics ignores it. */
export type SolidStyle =
  | 'ground'
  | 'boulder'
  | 'cliff'
  | 'trunk'
  | 'branch'
  | 'ice'
  | 'pillar'
  | 'plank'
  | 'crate'
  | 'summit';

export interface Solid {
  /** Closed outline, either winding. Concave is fine. */
  pts: Vec[];
  mat: MaterialId;
  style: SolidStyle;
}

export interface Section {
  name: string;
  /** Height (m) where this section starts. Used for the palette and the HUD. */
  y0: number;
}

/** Non-colliding scenery drawn behind or in front of the terrain. */
export type Decor =
  | { kind: 'tree'; x: number; y: number; h: number; seed: number; back?: boolean }
  | { kind: 'grass'; x: number; y: number; w: number }
  | { kind: 'flag'; x: number; y: number }
  | { kind: 'cairn'; x: number; y: number }
  | { kind: 'sign'; x: number; y: number; text: string }
  | { kind: 'bones'; x: number; y: number }
  | { kind: 'crystal'; x: number; y: number; s: number }
  | { kind: 'lantern'; x: number; y: number }
  /** Visual-only rock set back behind the play plane, so cracks read as recesses. */
  | { kind: 'backdrop'; pts: Vec[]; mat?: 'rock' | 'wood'; z?: number };

export interface LevelDef {
  name: string;
  spawn: Vec;
  solids: Solid[];
  decor: Decor[];
  sections: Section[];
  /** Reaching this box ends the run. */
  summit: { x0: number; x1: number; y0: number; y1: number };
  /** Height the meter treats as 0 m. */
  groundY: number;
  /** Total climb in metres, for the HUD progress bar. */
  topY: number;
}
