// Keyboard, gamepad (standard mapping) and touch controls merged into one driving state.
export class Input {
  constructor() {
    this.keys = new Set();
    this.touch = { steer: null, tilt: false, accel: false, brake: false, drift: false, item: false, back: false };
    this.autoAccel = false;
    this.edges = {};
    this.prev = {};
    this.padIndex = -1;
    this.enabled = true;
    this.onKey = null; // menu hook
    window.addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
      const k = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(k)) e.preventDefault();
      if (!this.keys.has(k) && this.onKey) this.onKey(k, e);
      this.keys.add(k);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); for (const k of ['accel', 'brake', 'drift', 'item', 'back']) this.touch[k] = false; if (!this.touch.tilt) this.touch.steer = null; });
    window.addEventListener('gamepadconnected', e => { this.padIndex = e.gamepad.index; });
  }
  pad() {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    if (this.padIndex >= 0 && pads[this.padIndex]) return pads[this.padIndex];
    for (const p of pads) if (p && p.connected) { this.padIndex = p.index; return p; }
    return null;
  }
  // Raw held state for this frame.
  read() {
    const K = c => this.keys.has(c);
    // keyboard steering is digital (the physics ramps it in); pad, touch pad and tilt are analog
    let steer = 0, analog = false;
    const left = K('KeyA') || K('ArrowLeft');
    const right = K('KeyD') || K('ArrowRight');
    if (left) steer -= 1;
    if (right) steer += 1;
    const accel = K('KeyW') || K('ArrowUp') || this.touch.accel;
    const brake = K('KeyS') || K('ArrowDown') || this.touch.brake;
    let drift = K('Space') || K('ShiftLeft') || K('ShiftRight') || this.touch.drift;
    let item = K('KeyE') || K('ControlLeft') || K('ControlRight') || K('KeyX') || this.touch.item;
    let back = K('KeyC') || this.touch.back;
    let reset = K('KeyR');
    let pause = K('Escape') || K('KeyP');
    let mute = K('KeyM');
    let thr = (accel ? 1 : 0) - (brake ? 1 : 0);
    if (this.autoAccel && !brake && !accel) thr = 1;
    const p = this.pad();
    if (p) {
      const ax = p.axes[0] || 0;
      // Apex GP: deadzone 0.06 and a ^1.3 curve for fine control around centre
      if (Math.abs(ax) > 0.06) { steer = Math.sign(ax) * ((Math.abs(ax) - 0.06) / 0.94) ** 1.3; analog = true; }
      const b = i => p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.35);
      const val = i => (p.buttons[i] ? p.buttons[i].value : 0);
      if (b(14)) { steer = -1; analog = false; }
      if (b(15)) { steer = 1; analog = false; }
      const rt = Math.max(val(7), b(0) ? 1 : 0), lt = Math.max(val(6), b(1) ? 1 : 0);
      if (rt > 0.1 || lt > 0.1) thr = rt - lt;
      if (b(5) || b(2)) drift = true;
      if (b(4) || b(3)) item = true;
      if (b(10) || b(11)) back = true;
      if (b(8)) reset = true;
      if (b(9)) pause = true;
    }
    if (this.touch.steer !== null && this.touch.steer !== undefined) { steer = this.touch.steer; analog = true; }
    steer = Math.max(-1, Math.min(1, steer));
    return { steer, analog, throttle: thr, drift, item, back, reset, pause, mute };
  }
  // State plus rising edges since last call (hop on drift press, item press, reset, pause).
  poll() {
    const s = this.read();
    const edge = n => s[n] && !this.prev[n];
    const out = { ...s, hop: edge('drift'), itemPress: edge('item'), resetPress: edge('reset'), pausePress: edge('pause'), mutePress: edge('mute') };
    this.prev = s;
    return out;
  }
}
