// Builds the list of detectors a run will use, from settings + what's available.

import { LOCAL_DETECTORS } from './local-models.js';
import { localSupported, runLocal } from './local-detectors.js';
import { runDetector } from './engines.js';

// The paid ones the server knows how to call. Kept here too so the settings
// panel can list them even when the page is hosted without the server.
export const PAID_DETECTORS = [
  { id: 'gptzero', name: 'GPTZero', keys: ['GPTZERO_API_KEY'], link: 'https://gptzero.me/api' },
  { id: 'originality', name: 'Originality.ai', keys: ['ORIGINALITY_API_KEY'], link: 'https://originality.ai/api' },
  { id: 'copyleaks', name: 'Copyleaks', keys: ['COPYLEAKS_EMAIL', 'COPYLEAKS_API_KEY'], link: 'https://copyleaks.com/api' },
  { id: 'winston', name: 'Winston AI', keys: ['WINSTON_API_KEY'], link: 'https://gowinston.ai/ai-content-detection-api/' },
  { id: 'sapling', name: 'Sapling', keys: ['SAPLING_API_KEY'], link: 'https://sapling.ai/ai-content-detector' },
  { id: 'huggingface', name: 'Hugging Face Inference', keys: ['HF_TOKEN'], link: 'https://huggingface.co/settings/tokens' },
];

export function serverHas(server, id) {
  return !!server?.detectors?.find((d) => d.id === id)?.server_ready;
}

export function buildDetectors({ settings, server, password }) {
  const list = [];

  if (localSupported()) {
    for (const [key, det] of Object.entries(LOCAL_DETECTORS)) {
      if (settings.local[key]) list.push({ id: `local:${key}`, name: det.name, run: (text) => runLocal(key, text) });
    }
  }

  // ZeroGPT's free checker answers servers but not browsers (no CORS headers,
  // confirmed against the live API), so it only runs when this app's server does.
  if (settings.zerogpt && serverHas(server, 'zerogpt')) {
    list.push({
      id: 'zerogpt',
      name: 'ZeroGPT',
      run: (text, signal) => runDetector('zerogpt', text, settings.keys, password, signal),
    });
  }

  if (server) {
    for (const det of PAID_DETECTORS) {
      const ready = serverHas(server, det.id) || det.keys.every((k) => settings.keys[k]);
      if (ready && settings.paid[det.id] !== false) {
        list.push({ id: det.id, name: det.name, run: (text, signal) => runDetector(det.id, text, settings.keys, password, signal) });
      }
    }
  }
  return list;
}
