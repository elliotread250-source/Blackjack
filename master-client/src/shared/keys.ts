// Key names shared by the keystrokes module, the zoom key and the menu hotkey.
// Keyboard names match uiohook-napi's UiohookKey; mouse buttons are Mouse1..Mouse5
// (1 left, 2 right, 3 middle).

export const MOUSE_KEYS = ['Mouse1', 'Mouse2', 'Mouse3', 'Mouse4', 'Mouse5'] as const

export const KEY_CODES: Record<string, number> = {
  Backspace: 14, Tab: 15, Enter: 28, CapsLock: 58, Escape: 1, Space: 57,
  PageUp: 3657, PageDown: 3665, End: 3663, Home: 3655,
  ArrowLeft: 57419, ArrowUp: 57416, ArrowRight: 57421, ArrowDown: 57424,
  Insert: 3666, Delete: 3667,
  '0': 11, '1': 2, '2': 3, '3': 4, '4': 5, '5': 6, '6': 7, '7': 8, '8': 9, '9': 10,
  A: 30, B: 48, C: 46, D: 32, E: 18, F: 33, G: 34, H: 35, I: 23, J: 36, K: 37, L: 38, M: 50,
  N: 49, O: 24, P: 25, Q: 16, R: 19, S: 31, T: 20, U: 22, V: 47, W: 17, X: 45, Y: 21, Z: 44,
  Numpad0: 82, Numpad1: 79, Numpad2: 80, Numpad3: 81, Numpad4: 75, Numpad5: 76, Numpad6: 77, Numpad7: 71, Numpad8: 72, Numpad9: 73,
  F1: 59, F2: 60, F3: 61, F4: 62, F5: 63, F6: 64, F7: 65, F8: 66, F9: 67, F10: 68, F11: 87, F12: 88,
  Semicolon: 39, Equal: 13, Comma: 51, Minus: 12, Period: 52, Slash: 53, Backquote: 41,
  BracketLeft: 26, Backslash: 43, BracketRight: 27, Quote: 40,
  Ctrl: 29, CtrlRight: 3613, Alt: 56, AltRight: 3640, Shift: 42, ShiftRight: 54
}

export const CODE_TO_KEY: Record<number, string> = Object.fromEntries(Object.entries(KEY_CODES).map(([k, v]) => [v, k]))

export function mouseKey(button: unknown): string | null {
  const b = Number(button)
  return b >= 1 && b <= 5 ? `Mouse${b}` : null
}

/** An Electron accelerator ("Alt+M") rather than a single key the input hook watches. */
export function isAccelerator(binding: string): boolean {
  return binding.includes('+')
}

export function keyLabel(name: string): string {
  const special: Record<string, string> = {
    Mouse1: 'LMB', Mouse2: 'RMB', Mouse3: 'MMB', Mouse4: 'M4', Mouse5: 'M5',
    ShiftRight: 'Right Shift', CtrlRight: 'Right Ctrl', AltRight: 'Right Alt',
    Shift: 'Shift', Ctrl: 'Ctrl', Alt: 'Alt', Space: 'Space'
  }
  return special[name] ?? name
}

/** Maps a browser KeyboardEvent.code to the key names above. */
export function fromBrowserCode(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (/^F([1-9]|1[0-2])$/.test(code)) return code
  if (/^Numpad[0-9]$/.test(code)) return code
  const map: Record<string, string> = {
    ShiftLeft: 'Shift', ShiftRight: 'ShiftRight', ControlLeft: 'Ctrl', ControlRight: 'CtrlRight',
    AltLeft: 'Alt', AltRight: 'AltRight', Space: 'Space', Tab: 'Tab', CapsLock: 'CapsLock', Enter: 'Enter',
    Backspace: 'Backspace', Escape: 'Escape', Insert: 'Insert', Delete: 'Delete', Home: 'Home', End: 'End',
    PageUp: 'PageUp', PageDown: 'PageDown', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight', Semicolon: 'Semicolon', Equal: 'Equal', Comma: 'Comma', Minus: 'Minus',
    Period: 'Period', Slash: 'Slash', Backquote: 'Backquote', BracketLeft: 'BracketLeft', Backslash: 'Backslash',
    BracketRight: 'BracketRight', Quote: 'Quote'
  }
  return map[code] ?? null
}

/** Maps a browser MouseEvent.button to Mouse1..Mouse5. */
export function fromBrowserButton(button: number): string | null {
  return ({ 0: 'Mouse1', 2: 'Mouse2', 1: 'Mouse3', 3: 'Mouse4', 4: 'Mouse5' } as Record<number, string>)[button] ?? null
}
