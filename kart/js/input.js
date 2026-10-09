// Keyboard, gamepad (standard mapping) and touch controls merged into one driving state.
export class Input {
  constructor() {
    this.keys = new Set();
    this.touch = { left: false, right: false, steer: 0, accel: false, brake: false, drift: false, item: false, back: false };
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
    window.addEventListener('blur', () => { this.keys.clear(); for (const k in this.touch) if (typeof this.touch[k] === 'boolean') this.touch[k] = false; this.touch.steer = 0; });
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
    let steer = 0, throttle = 0;
    const left = K('KeyA') || K('ArrowLeft') || this.touch.left;
    const right = K('KeyD') || K('ArrowRight') || this.touch.right;
    if (left) steer -= 1;
    if (right) steer += 1;
    if (this.touch.steer) steer = this.touch.steer;
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
      if (Math.abs(ax) > 0.15) steer = Math.sign(ax) * (Math.abs(ax) - 0.15) / 0.85;
      const b = i => p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.35);
      const val = i => (p.buttons[i] ? p.buttons[i].value : 0);
      if (b(14)) steer = -1;
      if (b(15)) steer = 1;
      const rt = Math.max(val(7), b(0) ? 1 : 0), lt = Math.max(val(6), b(1) ? 1 : 0);
      if (rt > 0.1 || lt > 0.1) thr = rt - lt;
      if (b(5) || b(2)) drift = true;
      if (b(4) || b(3)) item = true;
      if (b(10) || b(11)) back = true;
      if (b(8)) reset = true;
      if (b(9)) pause = true;
    }
    steer = Math.max(-1, Math.min(1, steer));
    return { steer, throttle: thr, drift, item, back, reset, pause, mute };
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
