/*
 * Input: keyboard, touch gestures on the playfield, and the on-screen button
 * row. Everything is turned into named actions handed to the app:
 *   left right soft cw ccw r180 hard hold pause mute music enter
 * plus the gesture-only steps shiftL/shiftR/softStep (one cell each).
 */
(function () {
  'use strict';

  const KEYS = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'soft', ArrowUp: 'cw',
    KeyX: 'cw', KeyZ: 'ccw', ControlLeft: 'ccw', ControlRight: 'ccw', KeyA: 'r180',
    Space: 'hard', KeyC: 'hold', ShiftLeft: 'hold', ShiftRight: 'hold',
    KeyP: 'pause', Escape: 'pause', KeyM: 'mute', KeyN: 'music',
    Enter: 'enter', NumpadEnter: 'enter',
    Numpad4: 'left', Numpad6: 'right', Numpad2: 'soft', Numpad8: 'hard',
    Numpad1: 'ccw', Numpad5: 'cw', Numpad9: 'cw', Numpad0: 'hold',
  };
  const BY_KEY = { ' ': 'hard', Left: 'left', Right: 'right', Up: 'cw', Down: 'soft', Esc: 'pause' };
  const HELD = { left: 1, right: 1, soft: 1 };

  class Input {
    constructor(app, canvas, touchRoot) {
      this.app = app;
      this.canvas = canvas;
      this.down = new Set();
      this.gesture = null;

      window.addEventListener('keydown', (e) => this.onKeyDown(e), true);
      window.addEventListener('keyup', (e) => this.onKeyUp(e), true);
      window.addEventListener('blur', () => this.releaseAll());

      canvas.addEventListener('pointerdown', (e) => this.gDown(e));
      canvas.addEventListener('pointermove', (e) => this.gMove(e));
      canvas.addEventListener('pointerup', (e) => this.gUp(e));
      canvas.addEventListener('pointercancel', () => { this.gesture = null; });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      for (const btn of touchRoot.querySelectorAll('[data-act]')) this.bindButton(btn);
      touchRoot.addEventListener('contextmenu', (e) => e.preventDefault());
      // iOS pinch-zoom and double-tap zoom guards.
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      document.addEventListener('dblclick', (e) => e.preventDefault());
      document.addEventListener('touchmove', (e) => { if (e.touches.length > 1 || e.target === canvas) e.preventDefault(); }, { passive: false });
    }

    actionFor(e) {
      if (e.metaKey || e.altKey) return null;
      return KEYS[e.code] || BY_KEY[e.key] || null;
    }

    onKeyDown(e) {
      const a = this.actionFor(e);
      if (!a) return;
      // Ctrl+key browser shortcuts (Ctrl+R etc.) are left alone; plain Ctrl rotates.
      if (e.ctrlKey && a !== 'ccw' && e.code !== 'ArrowLeft' && e.code !== 'ArrowRight' && e.code !== 'ArrowDown' && e.code !== 'ArrowUp' && e.code !== 'Space') return;
      e.preventDefault();
      if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) document.activeElement.blur();
      const id = e.code || e.key;
      if (e.repeat || this.down.has(id)) { this.app.onAction(a, true, true); return; }
      this.down.add(id);
      this.app.onAction(a, true, false);
    }

    onKeyUp(e) {
      const id = e.code || e.key;
      const a = KEYS[e.code] || BY_KEY[e.key];
      if (!this.down.has(id)) return;
      this.down.delete(id);
      if (a && HELD[a]) {
        // Another key bound to the same action may still be down.
        for (const k of this.down) if ((KEYS[k] || BY_KEY[k]) === a) return;
        this.app.onAction(a, false, false);
      }
    }

    releaseAll() {
      this.down.clear();
      this.gesture = null;
      this.app.onReleaseAll();
    }

    bindButton(btn) {
      const act = btn.dataset.act;
      let pid = null;
      const up = (e) => {
        if (pid === null || (e && e.pointerId !== pid)) return;
        pid = null;
        btn.classList.remove('on');
        if (HELD[act]) this.app.onAction(act, false, false);
      };
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (pid !== null) return;
        pid = e.pointerId;
        try { btn.setPointerCapture(pid); } catch (err) { /* ignore */ }
        btn.classList.add('on');
        this.app.noteTouch(e);
        this.app.onAction(act, true, false);
      });
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('lostpointercapture', up);
    }

    // ---- playfield gestures -------------------------------------------------
    // tap = rotate CW; drag sideways = one cell per cell-width; slow drag down =
    // soft drop one cell per cell-height; fast flick down = hard drop; swipe up = hold.
    gDown(e) {
      this.app.noteTouch(e);
      if (e.pointerType === 'mouse' || this.gesture) return;
      if (!this.app.gesturesEnabled()) return;
      e.preventDefault();
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      const t = performance.now();
      this.gesture = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ax: e.clientX, ay: e.clientY, t0: t, axis: null, moved: false, held: false, samples: [[e.clientX, e.clientY, t]] };
    }

    gMove(e) {
      const g = this.gesture;
      if (!g || e.pointerId !== g.id) return;
      e.preventDefault();
      const t = performance.now();
      g.samples.push([e.clientX, e.clientY, t]);
      while (g.samples.length > 2 && t - g.samples[0][2] > 120) g.samples.shift();
      const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
      if (!g.axis && Math.hypot(dx, dy) > 10) g.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : dy > 0 ? 'down' : 'up';
      if (!g.axis || !this.app.gesturesEnabled()) return;
      const step = Math.max(12, this.app.cellCss() * 0.9);
      if (g.axis === 'h' || (g.axis === 'down' && Math.abs(e.clientX - g.ax) > step * 1.6)) {
        if (g.axis === 'down') { g.axis = 'h'; }
        while (e.clientX - g.ax >= step) { g.ax += step; g.moved = true; this.app.onGesture('shiftR'); }
        while (g.ax - e.clientX >= step) { g.ax -= step; g.moved = true; this.app.onGesture('shiftL'); }
      }
      if (g.axis === 'down') {
        while (e.clientY - g.ay >= step) { g.ay += step; g.moved = true; this.app.onGesture('softStep'); }
      } else if (g.axis === 'up' && !g.held && g.sy - e.clientY > step * 1.3) {
        g.held = true; g.moved = true;
        this.app.onGesture('hold');
      }
    }

    gUp(e) {
      const g = this.gesture;
      if (!g || e.pointerId !== g.id) return;
      this.gesture = null;
      if (!this.app.gesturesEnabled()) return;
      const t = performance.now();
      const dy = e.clientY - g.sy;
      // Release velocity from the move samples; a finger that paused before lifting is not a flick.
      const last = g.samples[g.samples.length - 1];
      let vy = 0;
      if (t - last[2] < 90) {
        let old = last;
        for (const sm of g.samples) if (last[2] - sm[2] <= 110) { old = sm; break; }
        vy = (last[1] - old[1]) / Math.max(16, last[2] - old[2]);   // px per ms
      }
      const step = Math.max(12, this.app.cellCss() * 0.9);
      if (g.axis === 'down' && vy > 0.6 && dy > step * 0.8) { this.app.onGesture('hard'); return; }
      if (g.axis === 'up' && !g.held && -dy > step * 0.8) { this.app.onGesture('hold'); return; }
      if (!g.axis && !g.moved && t - g.t0 < 400) this.app.onGesture('cw');
    }
  }

  window.TetrisInput = Input;
}());
