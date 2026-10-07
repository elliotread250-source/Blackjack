import { GRAPHICS, type QualityLevel } from '../config';

const KEY = 'oab.quality';

export interface GpuInfo {
  renderer: string;
  software: boolean;
  integrated: boolean;
}

/** What is actually drawing our pixels? Software rasterisers mean "no GPU". */
export function probeGpu(): GpuInfo {
  let renderer = 'unknown';
  let software = false;
  try {
    const c = document.createElement('canvas');
    const fast = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ?? c.getContext('webgl', { failIfMajorPerformanceCaveat: true });
    const gl = (fast ?? document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return { renderer: 'none', software: true, integrated: false };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    software = !fast || /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen|warp/i.test(renderer);
  } catch {
    software = true;
  }
  const integrated = /intel(?!.*arc)|uhd|iris|mali|adreno|powervr|videocore/i.test(renderer);
  return { renderer, software, integrated };
}

export function detectQuality(info = probeGpu()): QualityLevel {
  if (info.software) return 'low';
  if (info.integrated) return 'medium';
  return 'high';
}

/** Saved choice, or what the hardware suggests. */
export function loadQuality(): { level: QualityLevel; chosen: boolean } {
  try {
    const q = new URLSearchParams(location.search).get('quality') ?? localStorage.getItem(KEY);
    if (q && q in GRAPHICS) return { level: q as QualityLevel, chosen: true };
  } catch {
    /* storage blocked */
  }
  return { level: detectQuality(), chosen: false };
}

export function saveQuality(level: QualityLevel): void {
  try {
    localStorage.setItem(KEY, level);
  } catch {
    /* ignore */
  }
}
