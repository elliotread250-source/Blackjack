/*
 * Input: the keyboard and the on-screen buttons feed one set of held flags
 * and press counters. Fire and hyperspace act on presses only (no autofire,
 * like the arcade). The touch pad is multi-touch: each finger is tracked on
 * its own and can slide from one button to the next.
 */
(function () {
  'use strict';

  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'thrust', KeyW: 'thrust',
    Space: 'fire', KeyK: 'fire',
    ShiftLeft: 'hyper', ShiftRight: 'hyper', ArrowDown: 'hyper', KeyS: 'hyper', KeyH: 'hyper',
    Enter: 'start', NumpadEnter: 'start',
    KeyP: 'pause', Escape: 'pause',
    KeyM: 'mute',
    KeyT: 'trails',
  };
  const CONTROLS = ['left', 'right', 'thrust', 'fire', 'hyper'];

  class Input {
    /**
     * handlers: onPress(name, source), onType(letter | '\b'), isTyping(),
     *           onTouch(), padActive()
     */
    constructor(handlers, padRoot) {
      this.h = handlers;
      this.keys = {};
      this.pad = {};
      this.edges = {};
      for (const c of CONTROLS) { this.keys[c] = false; this.pad[c] = false; this.edges[c] = 0; }
      this.pointers = new Map();     // pointerId -> button name | null
      this.buttons = [];             // { name, el, cx, cy, r }
      this.padRoot = padRoot;
      for (const el of padRoot.querySelectorAll('[data-btn]')) this.buttons.push({ name: el.dataset.btn, el, cx: 0, cy: 0, r: 0 });

      window.addEventListener('keydown', (e) => this.keydown(e));
      window.addEventListener('keyup', (e) => this.keyup(e));
      window.addEventListener('blur', () => this.clear());

      const opt = { passive: false };
      window.addEventListener('pointerdown', (e) => this.pdown(e), opt);
      window.addEventListener('pointermove', (e) => this.pmove(e), opt);
      window.addEventListener('pointerup', (e) => this.pup(e));
      window.addEventListener('pointercancel', (e) => this.pup(e));
      padRoot.addEventListener('contextmenu', (e) => e.preventDefault());
      // Keep iOS from turning thumbs on the pad into scrolls, zooms or text selection.
      const stop = (e) => { if (e.cancelable) e.preventDefault(); };
      padRoot.addEventListener('touchstart', stop, opt);
      padRoot.addEventListener('touchmove', stop, opt);
      padRoot.addEventListener('touchend', stop, opt);
    }

    held(name) { return this.keys[name] || this.pad[name]; }

    take(name) {
      if (this.edges[name] > 0) { this.edges[name]--; return true; }
      return false;
    }

    /** Controls for one 60 Hz frame. */
    frame() {
      return {
        left: this.held('left'), right: this.held('right'), thrust: this.held('thrust'),
        fire: this.take('fire'), hyper: this.take('hyper'),
      };
    }

    press(name, source) {
      if (name in this.edges) this.edges[name] = Math.min(2, this.edges[name] + 1);
      this.h.onPress(name, source);
    }

    clear() {
      for (const c of CONTROLS) { this.keys[c] = false; this.pad[c] = false; this.edges[c] = 0; }
      this.pointers.clear();
      this.paint();
    }

    /** Let go of every on-screen button (the pad was hidden). */
    releasePad() {
      this.pointers.clear();
      this.sync();
    }

    drain() {
      for (const c of CONTROLS) this.edges[c] = 0;
    }

    // ---- keyboard ----------------------------------------------------------

    keydown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const code = e.code || '';
      if (this.h.isTyping()) {
        if (/^Key[A-Z]$/.test(code)) { e.preventDefault(); if (!e.repeat) this.h.onType(code.slice(3)); return; }
        if (code === 'Backspace') { e.preventDefault(); this.h.onType('\b'); return; }
        if (code === 'ArrowUp') { e.preventDefault(); this.keys.right = true; if (!e.repeat) this.press('right', 'key'); return; }
        if (code === 'ArrowDown') { e.preventDefault(); this.keys.left = true; if (!e.repeat) this.press('left', 'key'); return; }
      }
      const name = KEYMAP[code];
      if (!name) return;
      e.preventDefault();
      if (name in this.keys) this.keys[name] = true;
      if (!e.repeat) this.press(name, 'key');
    }

    keyup(e) {
      const code = e.code || '';
      if (code === 'ArrowUp' || code === 'ArrowDown') { this.keys.left = false; this.keys.right = false; }
      const name = KEYMAP[code];
      if (name && name in this.keys) this.keys[name] = false;
    }

    // ---- touch pad -----------------------------------------------------------

    layoutPad() {
      for (const b of this.buttons) {
        const r = b.el.getBoundingClientRect();
        b.cx = r.left + r.width / 2;
        b.cy = r.top + r.height / 2;
        b.r = r.width / 2;
      }
    }

    hit(x, y) {
      let best = null, bestK = 1.3;
      for (const b of this.buttons) {
        if (!b.r) continue;
        const k = Math.hypot(x - b.cx, y - b.cy) / b.r;
        if (k < bestK) { bestK = k; best = b.name; }
      }
      return best;
    }

    pdown(e) {
      if (e.pointerType === 'touch') this.h.onTouch();
      if (!this.h.padActive()) return;
      const name = this.hit(e.clientX, e.clientY);
      if (!name && !this.padRoot.contains(e.target)) return;
      if (e.cancelable) e.preventDefault();
      this.pointers.set(e.pointerId, name);
      if (name) this.press(name, 'touch');
      this.sync();
    }

    pmove(e) {
      if (!this.pointers.has(e.pointerId)) return;
      if (e.cancelable) e.preventDefault();
      const name = this.hit(e.clientX, e.clientY);
      const was = this.pointers.get(e.pointerId);
      if (name === was) return;
      this.pointers.set(e.pointerId, name);
      if (name) this.press(name, 'touch');
      this.sync();
    }

    pup(e) {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      this.sync();
    }

    sync() {
      for (const c of CONTROLS) this.pad[c] = false;
      for (const name of this.pointers.values()) if (name) this.pad[name] = true;
      this.paint();
    }

    paint() {
      for (const b of this.buttons) b.el.classList.toggle('on', !!this.pad[b.name]);
    }
  }

  window.Input = Input;
})();
