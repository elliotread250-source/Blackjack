import { type Body, type Fixture, type Polygon, type Chain, type Circle } from 'planck';
import type { Sim } from '../sim/sim';
import type { Camera } from './camera';

/** Collider outlines. Shown with ?debug, and used before the real art exists. */
export function drawColliders(ctx: CanvasRenderingContext2D, sim: Sim, cam: Camera, bodies?: Body[]): void {
  ctx.save();
  ctx.lineWidth = 1.5;
  const list = bodies ?? [...sim.terrain, sim.player.body, sim.player.hammer];
  for (const b of list) {
    const xf = b.getTransform();
    for (let f: Fixture | null = b.getFixtureList(); f; f = f.getNext()) {
      const shape = f.getShape();
      const type = shape.getType();
      ctx.strokeStyle = b.isStatic() ? 'rgba(255,255,255,0.35)' : 'rgba(255,90,60,0.95)';
      ctx.beginPath();
      if (type === 'circle') {
        const c = shape as Circle;
        const p = c.getCenter();
        const wx = xf.p.x + xf.q.c * p.x - xf.q.s * p.y;
        const wy = xf.p.y + xf.q.s * p.x + xf.q.c * p.y;
        ctx.arc(cam.sx(wx), cam.sy(wy), c.getRadius() * cam.ppm, 0, Math.PI * 2);
      } else {
        const verts = type === 'polygon' ? (shape as Polygon).m_vertices : (shape as Chain).m_vertices;
        verts.forEach((p, i) => {
          const wx = xf.p.x + xf.q.c * p.x - xf.q.s * p.y;
          const wy = xf.p.y + xf.q.s * p.x + xf.q.c * p.y;
          if (i === 0) ctx.moveTo(cam.sx(wx), cam.sy(wy));
          else ctx.lineTo(cam.sx(wx), cam.sy(wy));
        });
        ctx.closePath();
      }
      ctx.stroke();
    }
  }
  // Cursor target relative to the pivot.
  const pv = sim.player.pivotWorld();
  const c = sim.player.cursor;
  ctx.fillStyle = 'rgba(80,220,255,0.9)';
  ctx.beginPath();
  ctx.arc(cam.sx(pv.x + c.x), cam.sy(pv.y + c.y), 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
