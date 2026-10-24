// input.js — shared controls. Games read a small state object; nothing here talks to the server
// except sender(), which sends a game's steering message only when it changes (plus a slow keepalive),
// so a held key or a still mouse costs nothing.

const KEY_DIR = { ArrowRight: 0, KeyD: 0, ArrowDown: 1, KeyS: 1, ArrowLeft: 2, KeyA: 2, ArrowUp: 3, KeyW: 3 };

// Free steering (Wormhole Run, Sinkhole): mouse angle from the screen centre, WASD/arrows, or a touch
// joystick that appears wherever the thumb lands. `action` is mouse button / Space / the touch button.
export function steering(api, { action: actionLabel } = {}) {
  const st = { angle: 0, mag: 0, action: false, active: false };
  const { canvas, touch } = api;
  const keys = new Set();
  let keyMode = false;
  canvas.addEventListener('mousemove', e => {
    const [w, h] = api.size();
    const dx = e.clientX - w / 2, dy = e.clientY - h / 2;
    st.angle = Math.atan2(dy, dx);
    st.mag = Math.min(1, Math.hypot(dx, dy) / 140);
    st.active = true; keyMode = false;
  });
  canvas.addEventListener('mousedown', () => { st.action = true; });
  addEventListener('mouseup', () => { st.action = false; });
  const fromKeys = () => {
    let x = 0, y = 0;
    for (const k of keys) { const d = KEY_DIR[k]; if (d === 0) x++; if (d === 2) x--; if (d === 1) y++; if (d === 3) y--; }
    if (x || y) { st.angle = Math.atan2(y, x); st.mag = 1; st.active = true; keyMode = true; }
    else if (keyMode) st.mag = 0;
  };
  addEventListener('keydown', e => {
    if (e.code in KEY_DIR) { keys.add(e.code); fromKeys(); e.preventDefault(); }
    if (e.code === 'Space') { st.action = true; e.preventDefault(); }
  });
  addEventListener('keyup', e => {
    if (e.code in KEY_DIR) { keys.delete(e.code); fromKeys(); }
    if (e.code === 'Space') st.action = false;
  });
  if (touch) {
    const stick = document.createElement('div');
    stick.className = 'stick hidden';
    stick.innerHTML = '<i></i>';
    document.body.append(stick);
    let id = null, ox = 0, oy = 0;
    canvas.addEventListener('touchstart', e => {
      const t = e.changedTouches[0];
      if (id === null) { id = t.identifier; ox = t.clientX; oy = t.clientY; stick.style.left = ox + 'px'; stick.style.top = oy + 'px'; stick.classList.remove('hidden'); }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (t.identifier !== id) continue;
        const dx = t.clientX - ox, dy = t.clientY - oy, d = Math.hypot(dx, dy);
        if (d > 6) { st.angle = Math.atan2(dy, dx); st.mag = Math.min(1, d / 55); st.active = true; }
        const k = Math.min(d, 46) / (d || 1);
        stick.firstChild.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      }
      e.preventDefault();
    }, { passive: false });
    const up = e => {
      for (const t of e.changedTouches) if (t.identifier === id) { id = null; stick.classList.add('hidden'); stick.firstChild.style.transform = ''; st.mag = 0; }
    };
    canvas.addEventListener('touchend', up); canvas.addEventListener('touchcancel', up);
    if (actionLabel) {
      const b = document.createElement('button');
      b.className = 'touch-btn'; b.textContent = actionLabel;
      const set = on => e => { st.action = on; b.classList.toggle('on', on); e.preventDefault(); };
      b.addEventListener('touchstart', set(true), { passive: false });
      b.addEventListener('touchend', set(false)); b.addEventListener('touchcancel', set(false));
      document.body.append(b);
      st.button = b;
    }
  }
  return st;
}

// Four-way steering (Turf Wars). Mouse/touch-drag pick the direction from where the player is drawn
// (`origin()` returns its screen position); swipes work too. Keys always win while held.
export function fourWay(api, origin) {
  const st = { dir: null };
  const { canvas, touch } = api;
  const axis = (dx, dy) => Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);
  addEventListener('keydown', e => { if (e.code in KEY_DIR) { st.dir = KEY_DIR[e.code]; e.preventDefault(); } });
  canvas.addEventListener('mousemove', e => {
    const [x, y] = origin();
    const dx = e.clientX - x, dy = e.clientY - y;
    if (Math.hypot(dx, dy) > 24) st.dir = axis(dx, dy);
  });
  if (touch) {
    let id = null, ox = 0, oy = 0;
    canvas.addEventListener('touchstart', e => { const t = e.changedTouches[0]; if (id === null) { id = t.identifier; ox = t.clientX; oy = t.clientY; } e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (t.identifier !== id) continue;
        const dx = t.clientX - ox, dy = t.clientY - oy;
        if (Math.hypot(dx, dy) > 22) { st.dir = axis(dx, dy); ox = t.clientX; oy = t.clientY; }   // every 22 px of swipe can turn again
      }
      e.preventDefault();
    }, { passive: false });
    const up = e => { for (const t of e.changedTouches) if (t.identifier === id) id = null; };
    canvas.addEventListener('touchend', up); canvas.addEventListener('touchcancel', up);
  }
  return st;
}

// Send build() to the server whenever it changes (at most every `gap` ms), and every 500 ms regardless.
export function sender(api, build, gap = 50) {
  let last = '', at = 0;
  setInterval(() => {
    if (!api.playing()) { last = ''; return; }
    const msg = build();
    if (!msg) return;
    const s = JSON.stringify(msg), now = performance.now();
    if (s !== last || now - at > 500) { api.net.send(msg); last = s; at = now; }
  }, gap);
}
