/* Keyboard, swipe and on-screen d-pad input. Directions are buffered: the
   last direction asked for is held until Pac-Man can take it. */
'use strict';
(function (PM) {
  var KEYS = {
    ArrowUp: PM.UP, KeyW: PM.UP,
    ArrowLeft: PM.LEFT, KeyA: PM.LEFT,
    ArrowDown: PM.DOWN, KeyS: PM.DOWN,
    ArrowRight: PM.RIGHT, KeyD: PM.RIGHT
  };

  PM.Input = function (h) {
    // h: { dir(d), start(), pause(), mute(), tap(), gesture(), touchSeen() }
    window.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      h.gesture();
      var code = e.code || '';
      var k = e.key;
      if (KEYS.hasOwnProperty(code)) {
        h.dir(KEYS[code]);
        e.preventDefault();
        return;
      }
      if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space' || k === 'Enter' || k === ' ') {
        if (!e.repeat) h.start();
        e.preventDefault();
      } else if (code === 'KeyP' || code === 'Escape' || k === 'Escape') {
        if (!e.repeat) h.pause();
        e.preventDefault();
      } else if (code === 'KeyM') {
        if (!e.repeat) h.mute();
      }
    });

    // Swipes anywhere outside the buttons. The direction fires as soon as the
    // finger has travelled far enough, and the origin resets so a long drag
    // can steer through several turns without lifting.
    var swipe = null;
    var THRESH = 14;
    function isControl(el) {
      return el && el.closest && el.closest('button, a, #dpad');
    }
    window.addEventListener('pointerdown', function (e) {
      h.gesture();
      if (e.pointerType === 'touch') h.touchSeen();
      if (isControl(e.target)) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, t: performance.now(), mouse: e.pointerType === 'mouse' };
    }, { passive: true });
    window.addEventListener('pointermove', function (e) {
      if (!swipe || e.pointerId !== swipe.id || swipe.mouse) return;
      var dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < THRESH) return;
      if (Math.abs(dx) > Math.abs(dy)) h.dir(dx < 0 ? PM.LEFT : PM.RIGHT);
      else h.dir(dy < 0 ? PM.UP : PM.DOWN);
      swipe.x = e.clientX; swipe.y = e.clientY; swipe.moved = true;
    }, { passive: true });
    function end(e) {
      if (!swipe || e.pointerId !== swipe.id) return;
      var s = swipe;
      swipe = null;
      if (e.type === 'pointerup' && !s.moved && performance.now() - s.t < 500) h.tap();
    }
    window.addEventListener('pointerup', end, { passive: true });
    window.addEventListener('pointercancel', end, { passive: true });

    // D-pad: direction from the dominant axis relative to the pad centre.
    var pad = document.getElementById('dpad');
    var padId = null;
    function padDir(e) {
      var r = pad.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      if (Math.max(Math.abs(dx), Math.abs(dy)) < r.width * 0.08) return;
      var d = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? PM.LEFT : PM.RIGHT) : (dy < 0 ? PM.UP : PM.DOWN);
      h.dir(d);
      pad.setAttribute('data-dir', ['up', 'left', 'down', 'right'][d]);
    }
    pad.addEventListener('pointerdown', function (e) {
      h.gesture();
      if (e.pointerType === 'touch') h.touchSeen();
      padId = e.pointerId;
      try { pad.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      padDir(e);
      e.preventDefault();
    });
    pad.addEventListener('pointermove', function (e) { if (e.pointerId === padId) padDir(e); });
    function padEnd(e) {
      if (e.pointerId !== padId) return;
      padId = null;
      pad.removeAttribute('data-dir');
    }
    pad.addEventListener('pointerup', padEnd);
    pad.addEventListener('pointercancel', padEnd);
    pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  };
})(window.PM);
