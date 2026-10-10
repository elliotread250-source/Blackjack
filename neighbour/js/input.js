// Keyboard + mouse (pointer lock) and touch controls merged into one per-frame input for World.step.
// Touch: left half = floating joystick (push to the edge to sprint), right half = drag to look,
// buttons for jump / crouch / use / throw (hold to charge) / drop.
export class Input {
  constructor(canvas, touchLayer) {
    this.canvas = canvas;
    this.keys = new Set();
    this.edges = new Set();
    this.dx = 0; this.dy = 0; this.wheel = 0;
    this.lmb = false; this.lmbPress = false; this.rmbPress = false;
    this.sens = 1; this.invertY = false;
    this.crouchToggle = false;
    this.active = false;          // gameplay is running (keys go to the game)
    this.locked = false;
    this.onKey = null;            // menu hook: (code) => void
    this.onUnlock = null;         // pointer lock lost (pause)
    this.slot = null;
    this.t = { stick: null, look: null, mx: 0, mz: 0, sprint: false, jump: false, use: false, throwHeld: false, throwPress: false, drop: false, crouch: false };
    window.addEventListener('keydown', e => {
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      const k = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(k)) e.preventDefault();
      if (this.active && (k === 'ControlLeft' || k === 'ControlRight')) e.preventDefault();
      if (!this.keys.has(k)) {
        this.edges.add(k);
        if (this.onKey) this.onKey(k, e);
        if (this.active && k === 'KeyC') this.crouchToggle = !this.crouchToggle;
        if (this.active && /^Digit[1-4]$/.test(k)) this.slot = +k.slice(5) - 1;
      }
      this.keys.add(k);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.lmb = false; });
    document.addEventListener('mousemove', e => {
      if (!this.locked) return;
      this.dx += e.movementX || 0; this.dy += e.movementY || 0;
    });
    canvas.addEventListener('mousedown', e => {
      if (!this.active) return;
      if (!this.locked) { this.lock(); return; }
      if (e.button === 0) { this.lmb = true; this.lmbPress = true; }
      if (e.button === 2) this.rmbPress = true;
    });
    window.addEventListener('mouseup', e => { if (e.button === 0) this.lmb = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => { if (this.active) { this.wheel += Math.sign(e.deltaY); e.preventDefault(); } }, { passive: false });
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === canvas;
      if (was && !this.locked && this.onUnlock) this.onUnlock();
    });
    if (touchLayer) this.bindTouch(touchLayer);
  }

  lock() {
    if (this.isTouch) return;
    try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch { /* not allowed */ }
  }
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); }

  bindTouch(layer) {
    this.isTouch = true;
    const T = this.t;
    const stickEl = layer.querySelector('#stick'), knob = layer.querySelector('#knob');
    const R = 58;
    const btn = id => layer.querySelector(`[data-b="${id}"]`);
    const setOn = (id, on) => { const b = btn(id); if (b) b.classList.toggle('on', on); };
    const onStart = e => {
      if (!this.active) return;
      for (const tch of e.changedTouches) {
        const el = document.elementFromPoint(tch.clientX, tch.clientY);
        const b = el && el.closest && el.closest('[data-b]');
        if (b) {
          const id = b.dataset.b;
          tch.target.__b = id;
          this.btnTouch = this.btnTouch || {};
          this.btnTouch[tch.identifier] = id;
          if (id === 'jump') T.jump = true;
          if (id === 'use') T.use = true;
          if (id === 'drop') T.drop = true;
          if (id === 'crouch') { this.crouchToggle = !this.crouchToggle; }
          if (id === 'throw') { T.throwHeld = true; T.throwPress = true; }
          setOn(id, true);
          e.preventDefault();
          continue;
        }
        if (el && el.closest && el.closest('.hotbar, .ibtn, button, a')) continue;
        e.preventDefault();
        if (tch.clientX < window.innerWidth * 0.42 && !T.stick) {
          T.stick = { id: tch.identifier, x: tch.clientX, y: tch.clientY };
          stickEl.style.left = tch.clientX + 'px'; stickEl.style.top = tch.clientY + 'px';
          stickEl.classList.add('on'); knob.style.transform = 'translate(-50%,-50%)';
        } else if (!T.look) {
          T.look = { id: tch.identifier, x: tch.clientX, y: tch.clientY };
        }
      }
    };
    const onMove = e => {
      for (const tch of e.changedTouches) {
        if (T.stick && tch.identifier === T.stick.id) {
          let dx = tch.clientX - T.stick.x, dy = tch.clientY - T.stick.y;
          const d = Math.hypot(dx, dy);
          if (d > R) { dx *= R / d; dy *= R / d; }
          T.mx = dx / R; T.mz = -dy / R;
          T.sprint = d > R * 0.96 && -dy > Math.abs(dx) * 0.6;
          knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
          stickEl.classList.toggle('sprint', T.sprint);
          e.preventDefault();
        } else if (T.look && tch.identifier === T.look.id) {
          this.dx += (tch.clientX - T.look.x) * 2.2; this.dy += (tch.clientY - T.look.y) * 2.2;
          T.look.x = tch.clientX; T.look.y = tch.clientY;
          e.preventDefault();
        }
      }
    };
    const onEnd = e => {
      for (const tch of e.changedTouches) {
        if (T.stick && tch.identifier === T.stick.id) { T.stick = null; T.mx = T.mz = 0; T.sprint = false; stickEl.classList.remove('on', 'sprint'); }
        if (T.look && tch.identifier === T.look.id) T.look = null;
        const id = this.btnTouch && this.btnTouch[tch.identifier];
        if (id) {
          delete this.btnTouch[tch.identifier];
          if (id === 'throw') T.throwHeld = false;
          setOn(id, false);
        }
      }
    };
    layer.addEventListener('touchstart', onStart, { passive: false });
    layer.addEventListener('touchmove', onMove, { passive: false });
    layer.addEventListener('touchend', onEnd);
    layer.addEventListener('touchcancel', onEnd);
  }

  // per-frame input for the world; clears edges and deltas
  poll() {
    const K = c => this.keys.has(c), E = c => this.edges.has(c), T = this.t;
    let mx = 0, mz = 0;
    if (K('KeyW') || K('ArrowUp')) mz += 1;
    if (K('KeyS') || K('ArrowDown')) mz -= 1;
    if (K('KeyA') || K('ArrowLeft')) mx -= 1;
    if (K('KeyD') || K('ArrowRight')) mx += 1;
    if (T.stick) { mx = T.mx; mz = T.mz; }
    const base = 0.0022 * this.sens;
    const out = {
      mx, mz,
      lookX: this.dx * base, lookY: this.dy * base * (this.invertY ? -1 : 1),
      sprint: K('ShiftLeft') || K('ShiftRight') || T.sprint,
      crouch: this.crouchToggle || K('ControlLeft') || K('ControlRight'),
      jump: E('Space') || T.jump,
      interact: E('KeyE') || T.use,
      hide: E('KeyF'),
      primary: this.lmb || T.throwHeld,
      primaryPress: this.lmbPress || T.throwPress,
      drop: this.rmbPress || E('KeyQ') || E('KeyG') || T.drop,
      slot: this.slot,
      wheel: this.wheel,
    };
    this.edges.clear();
    this.dx = this.dy = 0; this.wheel = 0;
    this.lmbPress = this.rmbPress = false;
    this.slot = null;
    T.jump = T.use = T.drop = T.throwPress = false;
    return out;
  }
  // forget held state (when pausing)
  reset() { this.keys.clear(); this.lmb = false; this.edges.clear(); this.dx = this.dy = 0; const T = this.t; T.throwHeld = false; T.mx = T.mz = 0; }
}
