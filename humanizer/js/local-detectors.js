// Main-thread side of the in-browser detectors: one shared worker, promise per request.

let worker = null;
let seq = 0;
const pending = new Map();
const listeners = new Set();

function failAll(message) {
  for (const { reject } of pending.values()) reject(new Error(message));
  pending.clear();
  worker = null;
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./local-detectors.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (data.type === 'progress') {
      for (const fn of listeners) fn(data.detector, data.pct);
      return;
    }
    const p = pending.get(data.id);
    if (!p) return;
    pending.delete(data.id);
    if (data.type === 'result') p.resolve(data.result);
    else p.reject(new Error(data.error));
  };
  worker.onerror = (e) => {
    e.preventDefault?.();
    failAll(`in-browser detectors couldn't start (${e.message || 'script failed to load'})`);
  };
  return worker;
}

export function localSupported() {
  return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined';
}

export function onLocalProgress(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function runLocal(detector, text) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    try {
      getWorker().postMessage({ id, detector, text });
    } catch (e) {
      pending.delete(id);
      reject(e);
    }
  });
}
