// Mesh worker: in { id, blocks, light, tint, opts } (buffers transferred),
// out { id, mesh: SectionMesh } with every typed-array buffer transferred.
import { meshSection } from '../render/mesher';
import type { MeshOptions, SectionMesh } from '../types';

interface MeshRequest {
  id: number;
  blocks: Uint16Array;
  light: Uint8Array;
  tint: Uint8Array;
  opts: MeshOptions;
}

interface WorkerScope {
  onmessage: ((e: MessageEvent<MeshRequest>) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = (e) => {
  const d = e.data;
  if (!d || typeof d.id !== 'number') return;
  let mesh: SectionMesh;
  try {
    mesh = meshSection({ blocks: d.blocks, light: d.light, tint: d.tint }, d.opts);
  } catch (err) {
    // Always answer so the pool's busy count stays right; an empty mesh clears the section.
    console.error('[mesh.worker]', err);
    mesh = [null, null, null, null, null];
  }
  const transfer: Transferable[] = [];
  for (const l of mesh) {
    if (!l) continue;
    transfer.push(l.positions.buffer, l.uvs.buffer, l.tints.buffer, l.lights.buffer, l.indices.buffer);
  }
  scope.postMessage({ id: d.id, mesh }, transfer);
};
