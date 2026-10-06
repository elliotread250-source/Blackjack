// Open-source AI detectors that run entirely in the browser through
// Transformers.js. Free, no key, no server: the weights download once from the
// Hugging Face CDN and the browser caches them.

export const LOCAL_DETECTORS = {
  'raid-roberta': {
    name: 'RAID RoBERTa',
    model: 'onnx-community/tmr-ai-text-detector-ONNX',
    kind: 'classifier',
    size: '~125 MB',
    on: true,
    blurb: 'Open-source detector trained on the RAID benchmark (text from GPT-4, ChatGPT, Llama, Mistral and others, plus adversarial rewrites).',
  },
  modernbert: {
    name: 'ModernBERT detector',
    model: 'onnx-community/answerdotai-ModernBERT-base-ai-detector-ONNX',
    kind: 'classifier',
    size: '~150 MB',
    on: true,
    blurb: 'A newer ModernBERT-based AI-vs-human classifier.',
  },
  perplexity: {
    name: 'Perplexity + burstiness',
    model: 'Xenova/gpt2',
    kind: 'perplexity',
    size: '~130 MB',
    on: true,
    blurb: "GPTZero's original method: how predictable each sentence is to GPT-2, and how much that varies sentence to sentence.",
  },
  'openai-roberta': {
    name: 'OpenAI RoBERTa',
    model: 'onnx-community/roberta-base-openai-detector-ONNX',
    kind: 'classifier',
    size: '~125 MB',
    on: true,
    blurb: "OpenAI's classic GPT-2 output detector. Older, but it still flags typical chatbot prose.",
  },
};

// Works for "AI"/"Human", "Fake"/"Real", "LABEL_1"/"LABEL_0", "machine"/"human"...
export function aiProbability(scores) {
  let ai = null;
  let human = null;
  for (const { label, score } of scores || []) {
    const l = String(label).toLowerCase().trim();
    if (/human|real|^label_0$|^0$/.test(l)) human = score;
    else if (/(^|[^a-z])(ai|fake|machine|generated|gpt|chatgpt|llm)([^a-z]|$)|^label_1$|^1$/.test(l)) ai = score;
  }
  if (ai !== null) return ai;
  if (human !== null) return 1 - human;
  throw new Error(`unrecognised labels: ${(scores || []).map((s) => s.label).join(', ')}`);
}

// ~110-word chunks on sentence boundaries: inside the 512-token limit of these
// models, and small enough that a flagged chunk points at a specific passage.
export function chunkText(sents, maxWords = 110) {
  const chunks = [];
  let cur = [];
  let n = 0;
  for (const s of sents) {
    const w = s.split(/\s+/).filter(Boolean).length;
    if (cur.length && n + w > maxWords) {
      chunks.push(cur.join(' '));
      cur = [];
      n = 0;
    }
    cur.push(s);
    n += w;
  }
  if (cur.length) chunks.push(cur.join(' '));
  return chunks.slice(0, 16);
}

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

// Map GPT-2 perplexity and burstiness to a 0-1 "AI" estimate. Modern chatbot
// prose usually scores a perplexity of 10-20 on GPT-2; people mostly land
// above 25 and swing a lot more between sentences.
export function perplexityToAi(ppl, burstiness) {
  const pPpl = sigmoid((22 - ppl) / 5);
  if (!Number.isFinite(burstiness)) return pPpl;
  const pBurst = sigmoid((0.5 - burstiness) / 0.12);
  return 0.65 * pPpl + 0.35 * pBurst;
}
