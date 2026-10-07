// Rebindable controls. Every action has one binding: a KeyboardEvent.code ("KeyW", "Space",
// "ShiftLeft"...) or a mouse button ("Mouse0" left, "Mouse1" middle, "Mouse2" right,
// "Mouse3"/"Mouse4" side buttons). Player choices live in settings.keybinds (only the ones
// that differ from the defaults). Esc always pauses and is not rebindable.
import type { Settings } from '../settings';

export type Action =
  | 'forward' | 'back' | 'left' | 'right' | 'jump' | 'sneak' | 'sprint'
  | 'attack' | 'use' | 'pick' | 'inventory'
  | 'hideHud' | 'screenshot' | 'debug'
  | 'hotbar1' | 'hotbar2' | 'hotbar3' | 'hotbar4' | 'hotbar5' | 'hotbar6' | 'hotbar7' | 'hotbar8' | 'hotbar9';

export interface ActionInfo { id: Action; label: string; group: 'Movement' | 'Gameplay' | 'Interface' | 'Hotbar'; def: string }

export const ACTIONS: ActionInfo[] = [
  { id: 'forward', label: 'Walk Forward', group: 'Movement', def: 'KeyW' },
  { id: 'back', label: 'Walk Backward', group: 'Movement', def: 'KeyS' },
  { id: 'left', label: 'Strafe Left', group: 'Movement', def: 'KeyA' },
  { id: 'right', label: 'Strafe Right', group: 'Movement', def: 'KeyD' },
  { id: 'jump', label: 'Jump / Fly Up', group: 'Movement', def: 'Space' },
  { id: 'sneak', label: 'Sneak / Fly Down', group: 'Movement', def: 'ShiftLeft' },
  { id: 'sprint', label: 'Sprint', group: 'Movement', def: 'ControlLeft' },
  { id: 'attack', label: 'Break Block', group: 'Gameplay', def: 'Mouse0' },
  { id: 'use', label: 'Place / Use', group: 'Gameplay', def: 'Mouse2' },
  { id: 'pick', label: 'Pick Block', group: 'Gameplay', def: 'Mouse1' },
  { id: 'inventory', label: 'Inventory', group: 'Gameplay', def: 'KeyE' },
  { id: 'hideHud', label: 'Hide HUD', group: 'Interface', def: 'F1' },
  { id: 'screenshot', label: 'Screenshot', group: 'Interface', def: 'F2' },
  { id: 'debug', label: 'Debug Screen', group: 'Interface', def: 'F3' },
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ id: `hotbar${n}` as Action, label: `Hotbar Slot ${n}`, group: 'Hotbar' as const, def: `Digit${n}` })),
];

const DEFAULTS = Object.fromEntries(ACTIONS.map((a) => [a.id, a.def])) as Record<Action, string>;
export const HOTBAR_ACTIONS: Action[] = ['hotbar1', 'hotbar2', 'hotbar3', 'hotbar4', 'hotbar5', 'hotbar6', 'hotbar7', 'hotbar8', 'hotbar9'];

let live: Settings | null = null;

/** Read bindings from the live settings object (call once at boot). */
export function useKeybindSettings(s: Settings): void {
  if (!s.keybinds || typeof s.keybinds !== 'object') s.keybinds = {};
  live = s;
}

/** The code bound to an action. */
export function bound(a: Action): string {
  return (live && live.keybinds && live.keybinds[a]) || DEFAULTS[a];
}

/** True when `code` triggers `a`. Shift and Ctrl count for either side when bound to the left one. */
export function matches(a: Action, code: string): boolean {
  const b = bound(a);
  if (b === code) return true;
  if (b === 'ShiftLeft' && code === 'ShiftRight') return true;
  if (b === 'ControlLeft' && code === 'ControlRight') return true;
  return false;
}

/** The action bound to `code`, if any (first match). */
export function actionFor(code: string): Action | null {
  for (const a of ACTIONS) if (matches(a.id, code)) return a.id;
  return null;
}

export function setBinding(s: Settings, a: Action, code: string): void {
  useKeybindSettings(s);
  if (code === DEFAULTS[a]) delete s.keybinds[a];
  else s.keybinds[a] = code;
}

export function resetBindings(s: Settings): void {
  s.keybinds = {};
}

/** Actions sharing a key with another action (shown in red, like the reference game). */
export function conflicts(): Set<Action> {
  const by = new Map<string, Action[]>();
  for (const a of ACTIONS) {
    const k = bound(a.id);
    const list = by.get(k) ?? [];
    list.push(a.id);
    by.set(k, list);
  }
  const out = new Set<Action>();
  for (const list of by.values()) if (list.length > 1) for (const a of list) out.add(a);
  return out;
}

/** Codes nobody may bind (Esc is the pause key; the rest belong to the browser or OS). */
export const UNBINDABLE = new Set(['Escape', 'MetaLeft', 'MetaRight', 'OSLeft', 'OSRight', 'ContextMenu']);

const NAMES: Record<string, string> = {
  Space: 'Space', ShiftLeft: 'Left Shift', ShiftRight: 'Right Shift', ControlLeft: 'Left Ctrl', ControlRight: 'Right Ctrl',
  AltLeft: 'Left Alt', AltRight: 'Right Alt', Enter: 'Enter', Tab: 'Tab', Backspace: 'Backspace', CapsLock: 'Caps Lock',
  ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', Backquote: '`', Minus: '-', Equal: '=',
  BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
  Insert: 'Insert', Delete: 'Delete', Home: 'Home', End: 'End', PageUp: 'Page Up', PageDown: 'Page Down',
  Mouse0: 'Left Click', Mouse1: 'Middle Click', Mouse2: 'Right Click', Mouse3: 'Mouse Back', Mouse4: 'Mouse Forward',
};

/** Human-readable name of a key or mouse button code. */
export function keyName(code: string): string {
  if (NAMES[code]) return NAMES[code];
  let m: RegExpMatchArray | null;
  if ((m = code.match(/^Key([A-Z])$/))) return m[1];
  if ((m = code.match(/^Digit(\d)$/))) return m[1];
  if ((m = code.match(/^Numpad(.+)$/))) return 'Num ' + m[1];
  if ((m = code.match(/^Mouse(\d+)$/))) return 'Mouse ' + (Number(m[1]) + 1);
  return code;
}
