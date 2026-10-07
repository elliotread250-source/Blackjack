// Terrain generation worker. Bundled into a string (inline-worker:) and started from a
// blob URL, so it must not import anything that touches the DOM.
//   in : { type: 'init', seed } | { type: 'gen', id, cx, cz }
//   out: { type: 'chunk', id, cx, cz, blocks, biome, tint }   (the three buffers are transferred)
//        { type: 'error', id, cx, cz, message }                (generation threw; keeps the pool's job count honest)
import { Generator } from '../world/generator';

interface InitMsg { type: 'init'; seed: number }
interface GenMsg { type: 'gen'; id: number; cx: number; cz: number }
type InMsg = InitMsg | GenMsg;

interface WorkerScope {
  onmessage: ((e: MessageEvent<InMsg>) => void) | null;
  postMessage(msg: unknown, transfer?: Transferable[]): void;
}
const ctx = self as unknown as WorkerScope;

let gen: Generator | null = null;
let pending: GenMsg[] = [];

function run(m: GenMsg): void {
  try {
    const c = gen!.generate(m.cx, m.cz);
    ctx.postMessage(
      { type: 'chunk', id: m.id, cx: c.cx, cz: c.cz, blocks: c.blocks, biome: c.biome, tint: c.tint },
      [c.blocks.buffer, c.biome.buffer, c.tint.buffer],
    );
  } catch (err) {
    ctx.postMessage({ type: 'error', id: m.id, cx: m.cx, cz: m.cz, message: String((err as Error)?.message ?? err) });
  }
}

ctx.onmessage = (e: MessageEvent<InMsg>) => {
  const m = e.data;
  if (!m) return;
  if (m.type === 'init') {
    if (!gen || gen.seed !== (m.seed | 0)) gen = new Generator(m.seed);
    const q = pending;
    pending = [];
    for (const p of q) run(p);
  } else if (m.type === 'gen') {
    // Messages are ordered, so 'init' always arrives first; queue defensively anyway.
    if (!gen) { pending.push(m); return; }
    run(m);
  }
};
