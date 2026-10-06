// Offline stand-ins for the models and detectors, used with ?mock=1 so the
// whole loop can be exercised in tests (and demoed) without any network.

import { analyze, scrub, sentences } from './tells.js';

const PLAIN = {
  leverage: 'use', leveraging: 'using', leverages: 'uses', utilize: 'use', crucial: 'important',
  pivotal: 'big', vital: 'important', enhance: 'improve', enhancing: 'improving', foster: 'build',
  fosters: 'builds', streamline: 'simplify', robust: 'solid', seamless: 'smooth', landscape: 'market',
  unlock: 'open', harnessing: 'using', underscores: 'shows', catalyst: 'trigger', 'cutting-edge': 'new',
  'ever-evolving': 'changing', navigate: 'handle', comprehensive: 'full', moreover: 'also',
};

const FILLERS = ['Simple as that.', 'That part matters.', 'Big difference.', 'Not always, though.'];

function body(prompt) {
  const m = prompt.match(/<current_draft>\n([\s\S]*?)\n<\/current_draft>/) || prompt.match(/<text>\n([\s\S]*?)\n<\/text>/)
    || prompt.match(/<passage>\n([\s\S]*?)\n<\/passage>/);
  return m ? m[1] : prompt;
}

function rewrite(text) {
  let t = scrub(text);
  t = t.replace(/\b(?:in today's fast-paced world|it is important to note that|ultimately|in conclusion),?\s*/gi, '');
  t = t.replace(/\bnot only ([^.!?]+?) but also\b/gi, '$1 and');
  t = t.replace(/\bit is not just ([^.;]+?); it is\b/gi, 'it is more than $1. It is');
  for (const [k, v] of Object.entries(PLAIN)) t = t.replace(new RegExp(`\\b${k}\\b`, 'gi'), v);
  t = t.replace(/\b(it|that|there) is\b/gi, (m, w) => `${w}'s`).replace(/\bdo not\b/gi, "don't");
  return t.split(/\n\s*\n/).map((p, i) => {
    const s = sentences(p);
    if (s.length > 1 && !FILLERS.some((f) => p.includes(f))) s.splice(1, 0, FILLERS[i % FILLERS.length]);
    return s.join(' ').replace(/^\w/, (c) => c.toUpperCase());
  }).join('\n\n');
}

export class MockEngines {
  constructor() {
    this.gptAsks = 0;
  }

  available() { return ['claude', 'gpt']; }
  route() { return 'mock'; }
  needsPuter() { return false; }
  modelLabel(v) { return `mock-${v}`; }

  async ask(vendor, system, prompt, kind) {
    await new Promise((r) => setTimeout(r, 30));
    const text = body(prompt);
    if (kind === 'rewrite') return { text: rewrite(text), model: `mock-${vendor}`, via: 'mock' };
    const score = analyze(text).score;
    let human = score <= 20;
    if (vendor === 'gpt') human = human && ++this.gptAsks > 1;
    return {
      text: JSON.stringify({ verdict: human ? 'human' : 'ai', ai_probability: human ? 18 : 80, tells: human ? [] : ['even sentence rhythm'] }),
      model: `mock-${vendor}`,
      via: 'mock',
    };
  }
}

export function mockDetector(id, name) {
  return {
    id,
    name,
    run: async (text) => ({ ai: Math.max(5, analyze(text).score - 5), flagged: sentences(text).slice(0, 1) }),
  };
}
