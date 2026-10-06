// Where model calls go.
//
// Each vendor (claude, gpt) goes to the Railway server when the server has an
// API key for it, otherwise to Puter (https://puter.com), which gives every
// visitor free Claude and GPT access billed to their own free Puter account.
// The settings panel can force either route.

// Sonnet first on the free route: it writes nearly as well as Opus for this job
// and costs half as much, so the free Puter allowance lasts twice as long.
// Opus is one click away in Settings.
const PUTER_FALLBACKS = {
  claude: ['claude-sonnet-5-5', 'claude-sonnet-5', 'claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-sonnet-4', 'claude-opus-5-5', 'claude-opus-4-6'],
  gpt: ['gpt-5.5', 'gpt-5.1', 'gpt-5', 'gpt-4.1', 'gpt-4o'],
};

export const VENDORS = {
  claude: 'Claude',
  gpt: 'ChatGPT',
};

function versionOf(id) {
  const nums = String(id).replace(/\d{8}/g, '').match(/\d+/g) || [];
  return nums.slice(0, 2).map(Number).filter((n) => n < 100);
}

function cmpVersion(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] || 0) - (b[i] || 0);
    if (d) return d;
  }
  return 0;
}

// Newest Sonnet first, then Opus; for GPT the newest plain flagship (no mini/nano/audio...).
export function rankModels(ids, vendor) {
  const seen = new Set();
  const list = ids.filter((id) => id && !seen.has(id) && seen.add(id));
  if (vendor === 'claude') {
    const tier = (id) => (/sonnet/i.test(id) ? 0 : /opus/i.test(id) ? 1 : /haiku/i.test(id) ? 3 : 2);
    return list
      .filter((id) => /claude/i.test(id) && !/thinking|instant|-v\d|bedrock|vertex/i.test(id))
      .sort((a, b) => tier(a) - tier(b) || cmpVersion(versionOf(b), versionOf(a)) || a.length - b.length);
  }
  const plain = (id) => /^(?:openai\/)?gpt-\d+(?:[.-]\d+)?$/i.test(id);
  return list
    .filter((id) => /gpt-\d/i.test(id) && !/mini|nano|audio|realtime|image|search|transcribe|tts|codex|oss|instruct|vision|embedding/i.test(id))
    .sort((a, b) => cmpVersion(versionOf(b), versionOf(a)) || Number(plain(b)) - Number(plain(a)) || a.length - b.length);
}

function errMessage(e) {
  if (!e) return 'unknown error';
  if (typeof e === 'string') return e;
  if (e.error) return errMessage(e.error);
  if (e.message) return String(e.message);
  try { return JSON.stringify(e).slice(0, 300); } catch { return String(e); }
}

function puterText(res) {
  if (typeof res === 'string') return res;
  const c = res?.message?.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map((b) => (typeof b === 'string' ? b : b?.text || '')).join('');
  if (typeof res?.text === 'string') return res.text;
  return res && typeof res.toString === 'function' ? res.toString() : '';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Engines {
  // server: /api/config payload or null; prefs: {claude: 'auto'|'server'|'puter'|'off', gpt: ..., claudeModel, gptModel}
  constructor({ server, prefs, password, puterModels }) {
    this.server = server;
    this.prefs = prefs || {};
    this.password = password || '';
    this.puterModels = puterModels || { claude: [], gpt: [] };
    this.badPuterModels = new Set();
  }

  static puterLoaded() {
    return typeof window !== 'undefined' && !!window.puter?.ai?.chat;
  }

  route(vendor) {
    const pref = this.prefs[vendor] || 'auto';
    const serverReady = !!this.server?.llm?.[vendor]?.ready && this.server.authorized !== false;
    if (pref === 'off') return null;
    if (pref === 'server') return serverReady ? 'server' : null;
    if (pref === 'puter') return Engines.puterLoaded() ? 'puter' : null;
    if (serverReady) return 'server';
    return Engines.puterLoaded() ? 'puter' : null;
  }

  available() {
    return Object.keys(VENDORS).filter((v) => this.route(v));
  }

  needsPuter() {
    return this.available().some((v) => this.route(v) === 'puter');
  }

  puterCandidates(vendor) {
    const chosen = this.prefs[`${vendor}Model`];
    const ranked = rankModels(this.puterModels[vendor] || [], vendor);
    const list = [chosen, ...ranked, ...PUTER_FALLBACKS[vendor]].filter(Boolean);
    return [...new Set(list)].filter((m) => !this.badPuterModels.has(m));
  }

  modelLabel(vendor) {
    const via = this.route(vendor);
    if (via === 'server') return this.server.llm[vendor].model;
    if (via === 'puter') return this.puterCandidates(vendor)[0] || 'auto';
    return 'off';
  }

  async ask(vendor, system, prompt, kind, signal) {
    const via = this.route(vendor);
    if (!via) throw new Error(`${VENDORS[vendor]} is switched off or unavailable`);
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
      try {
        return via === 'server'
          ? await this.askServer(vendor, system, prompt, kind, signal)
          : await this.askPuter(vendor, system, prompt);
      } catch (e) {
        if (e?.name === 'AbortError') throw e;
        lastErr = e;
        const msg = errMessage(e);
        // Don't retry things that won't fix themselves.
        if (/password|rejected|declined|insufficient|funds|credit|quota|limit reached|sign.?in|auth/i.test(msg)) break;
        await sleep(2000);
      }
    }
    throw new Error(`${VENDORS[vendor]}: ${errMessage(lastErr)}`);
  }

  async askServer(vendor, system, prompt, kind, signal) {
    const res = await fetch('api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Password': this.password },
      body: JSON.stringify({ vendor, system, prompt, kind }),
      signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `server returned ${res.status}`);
    return { text: data.text, model: data.model, via: 'server' };
  }

  async askPuter(vendor, system, prompt) {
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ];
    let lastErr;
    for (const model of this.puterCandidates(vendor)) {
      try {
        const res = await window.puter.ai.chat(messages, { model, max_tokens: 8000 });
        const text = puterText(res).trim();
        if (!text) throw new Error('empty response');
        return { text, model, via: 'puter' };
      } catch (e) {
        lastErr = e;
        const msg = errMessage(e);
        // Unknown model id: try the next one. Anything else is a real failure.
        if (/model|not found|unknown|unsupported|not available|invalid/i.test(msg) && !/funds|credit|quota/i.test(msg)) {
          this.badPuterModels.add(model);
          continue;
        }
        if (/insufficient|funds|credit|quota|usage limit/i.test(msg)) {
          throw new Error('your free Puter allowance ran out. Add API keys to the server, or top up at puter.com.');
        }
        throw e;
      }
    }
    throw lastErr || new Error('no usable model on Puter');
  }
}

export async function loadServerConfig(password) {
  try {
    const res = await fetch('api/config', {
      headers: { 'X-App-Password': password || '' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.server ? data : null;
  } catch {
    return null;
  }
}

export async function loadPuterModels() {
  const out = { claude: [], gpt: [] };
  if (!Engines.puterLoaded() || typeof window.puter.ai.listModels !== 'function') return out;
  try {
    const models = await window.puter.ai.listModels();
    const ids = (models || []).map((m) => (typeof m === 'string' ? m : m?.id)).filter(Boolean);
    out.claude = rankModels(ids, 'claude');
    out.gpt = rankModels(ids, 'gpt');
  } catch {
    // Fallback model ids still work.
  }
  return out;
}

export async function ensurePuterSignIn() {
  const auth = window.puter?.auth;
  if (!auth || typeof auth.isSignedIn !== 'function') return;
  if (auth.isSignedIn()) return;
  // A temporary guest account: free usage straight away, no sign-up form.
  await auth.signIn({ attempt_temp_user_creation: true });
}

export async function runDetector(id, text, keys, password, signal) {
  const res = await fetch('api/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-App-Password': password || '' },
    body: JSON.stringify({ id, text, keys }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `server returned ${res.status}`);
  return data;
}
