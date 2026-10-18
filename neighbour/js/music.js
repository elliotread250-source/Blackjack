/* Background music, off until the player turns it on in settings.
   The track is fetched as a blob so playback works on hosts without Range
   support (Safari insists on it for <audio src>). A missing file just means
   silence; the toggle still saves. */
(function () {
  'use strict';

  function create(opts) {
    var key = opts.storageKey;
    var on = false;
    var unlocked = false;
    var audio = null, loading = false, missing = false;
    var volume = opts.volume == null ? 0.5 : opts.volume;
    var listeners = [];
    try { on = window.localStorage.getItem(key) === '1'; } catch (e) { on = false; }

    function load() {
      if (audio || loading || missing || !window.fetch) return;
      loading = true;
      fetch(opts.src).then(function (r) {
        if (!r.ok) throw new Error('missing');
        return r.blob();
      }).then(function (blob) {
        audio = new Audio(URL.createObjectURL(blob));
        audio.loop = true;
        audio.volume = volume;
        loading = false;
        sync();
      }).catch(function () { loading = false; missing = true; notify(); });
    }

    function sync() {
      var want = on && unlocked && !document.hidden;
      if (want) {
        if (!audio) { load(); return; }
        var p = audio.play();
        if (p && p.catch) p.catch(function () {});
      } else if (audio) {
        audio.pause();
      }
    }

    function notify() { for (var i = 0; i < listeners.length; i++) listeners[i](on, missing); }

    function set(v) {
      on = !!v;
      try { window.localStorage.setItem(key, on ? '1' : '0'); } catch (e) { /* blocked */ }
      if (on) unlocked = true; // set() always runs from a click or key press
      sync();
      notify();
    }

    ['pointerdown', 'keydown', 'touchend', 'click'].forEach(function (t) {
      window.addEventListener(t, function () { if (!unlocked) { unlocked = true; sync(); } }, { capture: true, passive: true });
    });
    document.addEventListener('visibilitychange', sync);

    return {
      isOn: function () { return on; },
      isMissing: function () { return missing; },
      set: set,
      setVolume: function (v) { volume = v; if (audio) audio.volume = v; },
      onChange: function (fn) { listeners.push(fn); }
    };
  }

  window.GameMusic = { create: create };
})();
