// Runs the open-source detectors off the main thread so the page stays
// responsive while ~100 MB models load and score text.

import { AutoModelForCausalLM, AutoTokenizer, Tensor, env, pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';
import { LOCAL_DETECTORS, aiProbability, chunkText, perplexityToAi } from './local-models.js';
import { sentences } from './tells.js';

env.allowLocalModels = false;

// Repos don't all ship the same quantizations; take the smallest that exists.
const DTYPES = ['q8', 'int8', 'uint8', 'fp16'];
const cache = new Map();

function progressReporter(detector) {
  const files = new Map();
  return (info) => {
    if (!info || !info.file) return;
    if (info.status === 'progress' && info.total) files.set(info.file, [info.loaded, info.total]);
    if (info.status === 'done' && files.has(info.file)) {
      const [, total] = files.get(info.file);
      files.set(info.file, [total, total]);
    }
    let loaded = 0;
    let total = 0;
    for (const [l, t] of files.values()) {
      loaded += l;
      total += t;
    }
    if (total) postMessage({ type: 'progress', detector, pct: Math.round((loaded / total) * 100) });
  };
}

async function withDtypes(load) {
  let lastErr;
  for (const dtype of DTYPES) {
    try {
      return await load(dtype);
    } catch (e) {
      lastErr = e;
      if (!/could not locate|404|not found/i.test(String(e?.message || e))) throw e;
    }
  }
  throw lastErr;
}

function load(id) {
  if (!cache.has(id)) {
    const det = LOCAL_DETECTORS[id];
    const progress_callback = progressReporter(id);
    const loading = det.kind === 'perplexity'
      ? (async () => ({
        tokenizer: await AutoTokenizer.from_pretrained(det.model, { progress_callback }),
        model: await withDtypes((dtype) => AutoModelForCausalLM.from_pretrained(det.model, {
          dtype, model_file_name: 'decoder_model_merged', progress_callback,
        })),
      }))()
      : withDtypes((dtype) => pipeline('text-classification', det.model, { dtype, progress_callback }));
    const p = loading.catch((e) => {
      // A failed download shouldn't poison later attempts.
      cache.delete(id);
      throw new Error(`couldn't download the ${det.name} model from Hugging Face (${e?.message || e})`);
    });
    cache.set(id, p);
  }
  return cache.get(id);
}

async function classify(id, text) {
  const clf = await load(id);
  const chunks = chunkText(sentences(text));
  let weighted = 0;
  let total = 0;
  const scored = [];
  for (const chunk of chunks) {
    const out = await clf(chunk, { top_k: null });
    const ai = aiProbability(Array.isArray(out[0]) ? out[0] : out);
    const words = chunk.split(/\s+/).length;
    weighted += ai * words;
    total += words;
    scored.push([ai, chunk]);
  }
  const flagged = scored
    .filter(([ai]) => ai >= 0.5)
    .sort((a, b) => b[0] - a[0])
    .map(([, c]) => (c.length > 220 ? `${c.slice(0, 220)}…` : c));
  return { ai: total ? (weighted / total) * 100 : 0, flagged };
}

const MAX_TOKENS = 2048;
const WINDOW = 384;
const OVERLAP = 64;

async function perplexity(text) {
  const { tokenizer, model } = await load('perplexity');
  const eos = tokenizer.model?.tokens_to_ids?.get?.('<|endoftext|>') ?? 50256;
  const body = tokenizer.encode(text, { add_special_tokens: false }).slice(0, MAX_TOKENS - 1);
  const ids = [eos, ...body];
  const nll = new Array(ids.length).fill(null);

  for (let start = 0, done = 1; done < ids.length; start = done - OVERLAP) {
    const win = ids.slice(Math.max(0, start), Math.max(0, start) + WINDOW);
    const s = Math.max(0, start);
    const n = win.length;
    const input_ids = new Tensor('int64', BigInt64Array.from(win, (x) => BigInt(x)), [1, n]);
    const attention_mask = new Tensor('int64', new BigInt64Array(n).fill(1n), [1, n]);
    const { logits } = await model({ input_ids, attention_mask });
    const V = logits.dims[2];
    const data = logits.data;
    for (let t = 0; t < n - 1; t++) {
      const target = s + t + 1;
      if (target < done) continue;
      const off = t * V;
      let max = -Infinity;
      for (let v = 0; v < V; v++) if (data[off + v] > max) max = data[off + v];
      let sum = 0;
      for (let v = 0; v < V; v++) sum += Math.exp(data[off + v] - max);
      nll[target] = Math.log(sum) + max - data[off + win[t + 1]];
    }
    done = s + n;
    if (logits.dispose) logits.dispose();
  }

  // Map tokens back to sentences through their decoded lengths.
  const sents = sentences(text);
  const spans = [];
  let cursor = 0;
  for (const sent of sents) {
    const at = text.indexOf(sent.slice(0, 20), cursor);
    const begin = at === -1 ? cursor : at;
    spans.push([begin, begin + sent.length]);
    cursor = begin + sent.length;
  }
  const perSentence = sents.map(() => []);
  let pos = 0;
  for (let i = 1; i < ids.length; i++) {
    const piece = tokenizer.decode([ids[i]], { clean_up_tokenization_spaces: false });
    const tokStart = pos + (piece.length - piece.trimStart().length);
    pos += piece.length;
    if (nll[i] === null) continue;
    const k = spans.findIndex(([a, b]) => tokStart >= a && tokStart < b);
    if (k !== -1) perSentence[k].push(nll[i]);
  }

  const all = nll.filter((x) => x !== null);
  const ppl = Math.exp(all.reduce((a, b) => a + b, 0) / Math.max(all.length, 1));
  const sentPpl = perSentence
    .map((xs, k) => [xs.length >= 4 ? Math.exp(xs.reduce((a, b) => a + b, 0) / xs.length) : null, sents[k]])
    .filter(([p]) => p !== null);
  let burstiness = NaN;
  if (sentPpl.length >= 3) {
    const vals = sentPpl.map(([p]) => p);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    burstiness = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) / mean;
  }
  const flagged = sentPpl
    .filter(([p]) => p < 15)
    .sort((a, b) => a[0] - b[0])
    .map(([, s]) => s);
  return {
    ai: perplexityToAi(ppl, burstiness) * 100,
    flagged,
    note: `perplexity ${ppl.toFixed(1)}${Number.isFinite(burstiness) ? `, burstiness ${burstiness.toFixed(2)}` : ''}`,
  };
}

self.onmessage = async ({ data }) => {
  const { id, detector, text } = data;
  try {
    const det = LOCAL_DETECTORS[detector];
    if (!det) throw new Error(`unknown local detector ${detector}`);
    const result = det.kind === 'perplexity' ? await perplexity(text) : await classify(detector, text);
    postMessage({ type: 'result', id, result });
  } catch (e) {
    postMessage({ type: 'error', id, error: String(e?.message || e) });
  }
};
