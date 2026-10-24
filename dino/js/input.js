/* Dino Run: keyboard, touch/mouse, the duck button and gamepads, turned into
 * a handful of actions. Every source that can hold jump or duck is tracked
 * by id, so letting go of one key while a finger is still down doesn't drop
 * the hold.
 */
(function (root) {
  'use strict';

  var JUMP_KEYS = { Space: 1, ArrowUp: 1, KeyW: 1 };
  var DUCK_KEYS = { ArrowDown: 1, KeyS: 1 };
  var KEY_NAMES = { ' ': 'Space', Spacebar: 'Space', Up: 'ArrowUp', Down: 'ArrowDown', Esc: 'Escape' };
  var SWIPE_PX = 28;

  function codeOf(e) {
    if (e.code) return e.code;
    var k = e.key || '';
    if (KEY_NAMES[k]) return KEY_NAMES[k];
    if (k.length === 1) return 'Key' + k.toUpperCase();
    return k;
  }

  function attach(a) {
    // a: { jump(id, repeat), unjump(id), duck(id), unduck(id), enter(id) -> holds?,
    //      mute(), palette(), togglePause(), paused(), resume(), touch(on), unlock(), running() }
    var held = {};   // key code -> 'jump' | 'duck'

    window.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var code = codeOf(e);
      if (JUMP_KEYS[code] || DUCK_KEYS[code] || code === 'Enter') {
        if (e.target && e.target.tagName === 'A' && code === 'Enter') return; // let the link work
        e.preventDefault();
      }
      if (e.repeat) return;
      a.unlock();
      a.touch(false);
      if (code === 'KeyM') { a.mute(); return; }
      if (code === 'KeyC') { a.palette(); return; }
      if (code === 'KeyP' || code === 'Escape') { a.togglePause(); return; }
      if (a.paused()) {
        if (JUMP_KEYS[code] || code === 'Enter') a.resume();
        return;
      }
      if (JUMP_KEYS[code]) {
        held[code] = 'jump';
        a.jump('k' + code, true);
      } else if (DUCK_KEYS[code]) {
        held[code] = 'duck';
        a.duck('k' + code);
      } else if (code === 'Enter') {
        if (a.enter('k' + code)) held[code] = 'jump';
      }
    });

    window.addEventListener('keyup', function (e) {
      var code = codeOf(e);
      var h = held[code];
      if (!h) return;
      delete held[code];
      if (h === 'jump') a.unjump('k' + code);
      else a.unduck('k' + code);
    });

    // Pointers anywhere but the buttons: tap or hold to jump, swipe down to duck.
    var pointers = {};
    function isControl(t) { return t && t.closest && t.closest('a, button'); }

    document.addEventListener('pointerdown', function (e) {
      if (isControl(e.target)) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.cancelable) e.preventDefault();
      a.unlock();
      if (e.pointerType !== 'mouse') a.touch(true);
      if (a.paused()) { a.resume(); return; }
      var id = 'p' + e.pointerId;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY, mode: 'jump', id: id };
      a.jump(id, false);
    }, { passive: false });

    document.addEventListener('pointermove', function (e) {
      var p = pointers[e.pointerId];
      if (!p || p.mode !== 'jump' || !a.running()) return;
      var dy = e.clientY - p.y, dx = e.clientX - p.x;
      if (dy > SWIPE_PX && dy > Math.abs(dx)) {
        p.mode = 'duck';
        a.unjump(p.id);
        a.duck(p.id);
      }
    });

    function pointerEnd(e) {
      var p = pointers[e.pointerId];
      if (!p) return;
      delete pointers[e.pointerId];
      if (p.mode === 'jump') a.unjump(p.id);
      else a.unduck(p.id);
    }
    document.addEventListener('pointerup', pointerEnd);
    document.addEventListener('pointercancel', pointerEnd);

    // Stop iOS from scrolling or zooming the page under a finger.
    document.addEventListener('touchmove', function (e) {
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); });
    document.addEventListener('contextmenu', function (e) {
      if (!isControl(e.target)) e.preventDefault();
    });

    // The duck button holds duck for as long as it is pressed.
    var duckBtn = document.getElementById('duck');
    if (duckBtn) {
      var duckIds = {};
      duckBtn.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        a.unlock();
        a.touch(e.pointerType !== 'mouse');
        if (a.paused()) { a.resume(); return; }
        try { duckBtn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        duckIds[e.pointerId] = true;
        duckBtn.classList.add('down');
        a.duck('b' + e.pointerId);
      });
      var duckEnd = function (e) {
        if (!duckIds[e.pointerId]) return;
        delete duckIds[e.pointerId];
        if (!Object.keys(duckIds).length) duckBtn.classList.remove('down');
        a.unduck('b' + e.pointerId);
      };
      duckBtn.addEventListener('pointerup', duckEnd);
      duckBtn.addEventListener('pointercancel', duckEnd);
      duckBtn.addEventListener('lostpointercapture', duckEnd);
      duckBtn.addEventListener('click', function (e) { e.preventDefault(); });
    }

    // Lose every hold, e.g. when the tab is hidden and key-ups never arrive.
    return {
      reset: function () {
        held = {};
        pointers = {};
        if (duckBtn) duckBtn.classList.remove('down');
      }
    };
  }

  // Gamepads: A or d-pad up to jump, down (d-pad or stick) to duck, Start to
  // pause or restart. Polled once per animation frame.
  var padState = {};
  function pollPads(a) {
    var pads;
    try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { return; }
    if (!pads) return;
    for (var i = 0; i < pads.length; i++) {
      var p = pads[i];
      if (!p || !p.connected) continue;
      var btn = function (n) { var b = p.buttons[n]; return !!b && (b.pressed || b.value > 0.5); };
      var jump = btn(0) || btn(12);
      var duck = btn(13) || (p.axes && p.axes[1] > 0.6);
      var start = btn(9);
      var prev = padState[i] || { jump: false, duck: false, start: false };
      var id = 'g' + i;
      if (start && !prev.start) {
        a.unlock();
        if (a.paused() || a.running()) a.togglePause();
        else if (a.enter(id + 's')) a.unjump(id + 's');
      }
      if (jump && !prev.jump) {
        a.unlock();
        a.touch(false);
        if (a.paused()) a.resume();
        else a.jump(id, true);
      } else if (!jump && prev.jump) {
        a.unjump(id);
      }
      if (duck && !prev.duck && !a.paused()) a.duck(id);
      else if (!duck && prev.duck) a.unduck(id);
      padState[i] = { jump: jump, duck: duck, start: start };
    }
  }

  root.DinoInput = { attach: attach, pollPads: pollPads };
}(typeof self !== 'undefined' ? self : this));
