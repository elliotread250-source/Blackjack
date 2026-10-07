import type { PlayerState } from './sim/player';

/**
 * Persistence. Not checkpoints: a fall still costs you everything. This only
 * remembers where you were if you close the tab, the way Getting Over It does.
 */
const RUN_KEY = 'oab.run.v1';
const BEST_KEY = 'oab.best.v1';
const SETTINGS_KEY = 'oab.settings.v1';

export interface RunSave {
  state: PlayerState;
  time: number;
  falls: number;
  bigFall: number;
  maxHeight: number;
}

export interface Bests {
  height: number;
  /** Fastest summit, seconds. 0 = never summited. */
  time: number;
  summits: number;
}

export interface Settings {
  volume: number;
  showCursor: boolean;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the game still works, it just forgets */
  }
}

export const loadRun = (): RunSave | null => read<RunSave>(RUN_KEY);
export const saveRun = (r: RunSave | null): void => write(RUN_KEY, r);
export const loadBests = (): Bests => ({ height: 0, time: 0, summits: 0, ...(read<Bests>(BEST_KEY) ?? {}) });
export const saveBests = (b: Bests): void => write(BEST_KEY, b);
export const loadSettings = (): Settings => ({ volume: 0.8, showCursor: false, ...(read<Settings>(SETTINGS_KEY) ?? {}) });
export const saveSettings = (s: Settings): void => write(SETTINGS_KEY, s);

export function formatTime(t: number): string {
  const tenths = Math.floor(t * 10) % 10;
  const s = Math.floor(t) % 60;
  const m = Math.floor(t / 60) % 60;
  const h = Math.floor(t / 3600);
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const core = `${mm}:${String(s).padStart(2, '0')}.${tenths}`;
  return h > 0 ? `${h}:${core}` : core;
}
