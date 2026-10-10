// Keyboard, taps and swipes -> 'up' | 'down' | 'left' | 'right'.
// A tap hops forward; a swipe hops the way you swiped (fires as soon as the finger has moved far
// enough, so it feels instant). Hops queue in the game, so quick taps are never lost.
const KEYS = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
};

export class Input {
  constructor(target, onMove, onKey) {
    this.onMove = onMove;
    this.onKey = onKey;
    this.touch = null;
    window.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const dir = KEYS[e.code];
      if (dir) {
        e.preventDefault();
        if (!e.repeat) this.onMove(dir, 'key');
        return;
      }
      if (this.onKey(e)) e.preventDefault();
    });
    target.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button > 0) return;
      this.touch = { id: e.pointerId, x: e.clientX, y: e.clientY, done: false, t: performance.now() };
      try { target.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    });
    target.addEventListener('pointermove', e => {
      const t = this.touch;
      if (!t || t.id !== e.pointerId || t.done) return;
      const dx = e.clientX - t.x, dy = e.clientY - t.y;
      const th = Math.max(24, Math.min(window.innerWidth, window.innerHeight) * 0.06);
      if (dx * dx + dy * dy < th * th) return;
      t.done = true;
      this.onMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'), 'swipe');
    });
    const end = e => {
      const t = this.touch;
      if (!t || t.id !== e.pointerId) return;
      this.touch = null;
      if (!t.done && e.type === 'pointerup') this.onMove('up', 'tap');
    };
    target.addEventListener('pointerup', end);
    target.addEventListener('pointercancel', end);
  }
}
