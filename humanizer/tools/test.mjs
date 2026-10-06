// Unit tests for the browser-side logic. Run: node tools/test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { analyze, scrub, sentences } from '../js/tells.js';
import { parseJudgement, rewritePrompt } from '../js/prompts.js';
import { rankModels } from '../js/engines.js';
import { aiProbability, chunkText, perplexityToAi } from '../js/local-models.js';
import { buildFeedback, humanize } from '../js/pipeline.js';
import { MockEngines, mockDetector } from '../js/mock.js';

let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}\n     ${e.stack.split('\n').slice(0, 3).join('\n     ')}`);
  }
}

const AI = `In today's fast-paced world, artificial intelligence plays a crucial role in shaping how businesses operate. It is important to note that AI is not only transforming industries but also redefining the very nature of work. From healthcare to finance, organizations are leveraging cutting-edge tools to streamline operations, enhance productivity, and unlock new opportunities.

Moreover, the integration of AI fosters innovation across sectors. Companies that embrace these technologies are better positioned to navigate the ever-evolving landscape of the global market. This shift underscores the importance of continuous learning and adaptation—highlighting the need for a skilled workforce.

Ultimately, AI represents a pivotal moment in history. It is not just a tool; it is a catalyst for change. By harnessing its potential, we can create a more efficient, equitable, and sustainable future for all.`;

const HUMAN = `I got the email at 6am, which is never good. My manager wanted the Q3 numbers redone because finance had changed the revenue recognition rules again. Third time this year.

So I opened the spreadsheet. It's a mess. Half the formulas reference a tab someone deleted in March, and the other half are hardcoded because, I'm guessing, somebody gave up. I fixed what I could by nine and sent it over with a note saying the Europe figures were probably still off by a few percent, but I'd need the raw exports from the billing system to know for sure.

He replied with a thumbs up. That's it.`;

await test('every browser file parses (app.js and the worker aren\'t imported below)', () => {
  const dir = new URL('../js/', import.meta.url);
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.js'))) {
    execFileSync(process.execPath, ['--check', new URL(f, dir).pathname], { stdio: 'pipe' });
  }
});

await test('tells: chatbot prose scores high, human prose scores low', () => {
  const a = analyze(AI);
  const h = analyze(HUMAN);
  assert.ok(a.score >= 80, `AI scored ${a.score}`);
  assert.ok(h.score <= 10, `human scored ${h.score}`);
  const kinds = new Set(a.tells.map((t) => t.kind));
  for (const k of ['em-dash', 'ai-words', 'ai-phrases', 'rhythm', 'construction']) assert.ok(kinds.has(k), `missing ${k}`);
});

await test('tells: academic style skips the contraction check', () => {
  const t = 'It is clear. It is known. They are here. We are there. It is done. It is fine.';
  assert.ok(analyze(t, 'natural').tells.some((x) => x.kind === 'contractions'));
  assert.ok(!analyze(t, 'academic').tells.some((x) => x.kind === 'contractions'));
});

await test('sentences: abbreviations and closing quotes', () => {
  assert.deepEqual(sentences('Dr. Smith went home. He said "Hi." Then e.g. stuff happened! OK?'),
    ['Dr. Smith went home.', 'He said "Hi."', 'Then e.g. stuff happened!', 'OK?']);
});

await test('scrub: removes em dashes, utilize and preambles', () => {
  const out = scrub("Here's the rewritten version:\n\nThe plan—if it works—is simple. We utilized it. It's important to note that cats fly.");
  assert.equal(out, 'The plan, if it works, is simple. We used it. Cats fly.');
  assert.ok(!/—/.test(scrub(AI)));
  assert.equal(scrub('Range 2010–2020 stays.'), 'Range 2010–2020 stays.');
});

await test('parseJudgement: clean JSON, fenced JSON, prose, 0-1 scale', () => {
  assert.deepEqual(parseJudgement('{"verdict":"human","ai_probability":12,"tells":[]}'), { verdict: 'human', ai: 12, tells: [] });
  assert.equal(parseJudgement('```json\n{"verdict": "AI", "ai_probability": 88, "tells": ["x"]}\n```').verdict, 'ai');
  assert.equal(parseJudgement('Verdict: human. ai_probability: 20').ai, 20);
  assert.equal(parseJudgement('{"verdict":"ai","ai_probability":0.9}').ai, 90);
  assert.equal(parseJudgement('').verdict, 'ai');
});

await test('rewritePrompt: round 1 vs later rounds', () => {
  assert.ok(rewritePrompt({ original: 'X', style: 'casual', round: 1 }).includes('<text>\nX\n</text>'));
  const p = rewritePrompt({ original: 'X', draft: 'Y', feedback: 'fix it', style: 'academic', round: 2 });
  assert.ok(p.includes('<current_draft>\nY\n</current_draft>') && p.includes('fix it') && p.includes('Academic'));
});

await test('rankModels: Sonnet first for Claude, flagship first for GPT', () => {
  const ids = ['claude-opus-5-5', 'claude-sonnet-4-5', 'claude-sonnet-5-5', 'claude-haiku-4-5', 'claude-sonnet-4-20250514',
    'gpt-5.5', 'gpt-5.5-mini', 'gpt-4o', 'openai/gpt-5.1', 'gpt-5.5-nano', 'gpt-realtime'];
  assert.deepEqual(rankModels(ids, 'claude').slice(0, 3), ['claude-sonnet-5-5', 'claude-sonnet-4-5', 'claude-sonnet-4-20250514']);
  assert.deepEqual(rankModels(ids, 'gpt').slice(0, 3), ['gpt-5.5', 'openai/gpt-5.1', 'gpt-4o']);
});

await test('rankModels: real Puter list (Oct 2026) picks first-party flagships, not gpt-35-turbo', () => {
  const live = ['claude-sonnet-5-5', 'infron:anthropic/claude-sonnet-5.5', 'openrouter:anthropic/claude-sonnet-5.5',
    'openrouter:anthropic/claude-sonnet-5.5:batch', 'claude-sonnet-5', 'claude-sonnet-4-6', 'claude-opus-5-5',
    'infron:openai/gpt-35-turbo', 'gpt-6.1-sol', 'infron:openai/gpt-6.1-sol', 'openrouter:openai/gpt-6.1-sol',
    'infron:openai/gpt-6.1-sol:flex', 'openrouter:openai/gpt-6.1-sol-pro', 'infron:openai/gpt-6.1-sol:priority',
    'gpt-6-sol', 'gpt-6-luna', 'gpt-6-astra', 'gpt-6.1-sol-mini'];
  const claude = rankModels(live, 'claude');
  const gpt = rankModels(live, 'gpt');
  assert.equal(claude[0], 'claude-sonnet-5-5');
  assert.ok(!claude.some((id) => id.endsWith(':batch')));
  assert.equal(gpt[0], 'gpt-6.1-sol');
  assert.ok(!gpt.includes('infron:openai/gpt-35-turbo'));
  assert.ok(!gpt.some((id) => /:flex|:priority|-pro|mini/.test(id)));
  assert.ok(gpt.indexOf('gpt-6.1-sol') < gpt.indexOf('gpt-6-sol'));
});

await test('aiProbability: label conventions', () => {
  assert.equal(aiProbability([{ label: 'Fake', score: 0.8 }, { label: 'Real', score: 0.2 }]), 0.8);
  assert.equal(aiProbability([{ label: 'Human', score: 0.7 }, { label: 'AI', score: 0.3 }]), 0.3);
  assert.equal(aiProbability([{ label: 'LABEL_0', score: 0.6 }, { label: 'LABEL_1', score: 0.4 }]), 0.4);
  assert.ok(Math.abs(aiProbability([{ label: 'human-written', score: 0.9 }]) - 0.1) < 1e-9);
  assert.equal(aiProbability([{ label: 'machine-generated', score: 0.95 }]), 0.95);
  assert.throws(() => aiProbability([{ label: 'POSITIVE', score: 1 }]));
});

await test('chunkText: sentence-aligned chunks under the word cap', () => {
  const chunks = chunkText(sentences(`${AI}\n\n${HUMAN}`), 60);
  assert.ok(chunks.length >= 3);
  for (const c of chunks) assert.ok(c.split(/\s+/).length <= 75, c);
});

await test('perplexityToAi: low perplexity reads as AI, high as human', () => {
  assert.ok(perplexityToAi(12, 0.25) > 0.8);
  assert.ok(perplexityToAi(45, 0.9) < 0.15);
  assert.ok(perplexityToAi(22, NaN) > 0.45 && perplexityToAi(22, NaN) < 0.55);
});

await test('pipeline: loops until every check passes, alternating writers', async () => {
  const events = [];
  const res = await humanize({
    text: AI,
    engines: new MockEngines(),
    detectors: [mockDetector('local:x', 'X'), mockDetector('zerogpt', 'ZeroGPT')],
    maxRounds: 5,
    onEvent: (e) => events.push(e.type),
  });
  assert.equal(res.passed, true, `final checks: ${JSON.stringify(res.final.checks.map((c) => [c.id, c.pass, c.ai]))}`);
  assert.ok(res.rounds.length >= 2, 'mock GPT judge always says AI the first time');
  assert.equal(res.rounds[0].writer, 'claude');
  assert.equal(res.rounds[1].writer, 'gpt', 'GPT failed while Claude passed, so GPT rewrites next');
  assert.ok(!/—/.test(res.final.draft));
  assert.ok(events.includes('draft') && events.includes('round'));
});

await test('pipeline: returns the best round when it runs out, and drops broken detectors', async () => {
  const broken = { id: 'broken', name: 'Broken', run: async () => { throw new Error('down'); } };
  const alwaysAi = { id: 'strict', name: 'Strict', run: async () => ({ ai: 99, flagged: ['x'] }) };
  let calls = 0;
  const counting = { id: 'count', name: 'Count', run: async () => { calls++; return { ai: 1, flagged: [] }; } };
  const res = await humanize({ text: AI, engines: new MockEngines(), detectors: [broken, alwaysAi, counting], maxRounds: 3 });
  assert.equal(res.passed, false);
  assert.equal(res.rounds.length, 3);
  assert.ok(res.dropped.has('broken'));
  assert.equal(res.rounds[1].checks.find((c) => c.id === 'broken'), undefined, 'broken detector not retried');
  assert.equal(calls, 3);
  assert.ok(res.final.fails <= Math.min(...res.rounds.map((r) => r.fails)));
});

await test('pipeline: Stop aborts between steps', async () => {
  const ctrl = new AbortController();
  ctrl.abort();
  await assert.rejects(humanize({ text: AI, engines: new MockEngines(), maxRounds: 2, signal: ctrl.signal }), { name: 'AbortError' });
});

await test('buildFeedback: only failing checks, with fixes and quotes', () => {
  const fb = buildFeedback([
    { kind: 'tells', pass: false, ai: 40, notes: ['Em dash x1'], fixes: ['Remove it.'] },
    { kind: 'judge', name: 'Claude', pass: false, ai: 80, notes: ['too tidy'] },
    { kind: 'judge', name: 'ChatGPT', pass: true, ai: 10, notes: [] },
    { kind: 'detector', name: 'ZeroGPT', pass: false, ai: 70, notes: ['First sentence.'], note: 'x' },
  ]);
  assert.ok(fb.includes('Em dash x1 Fix: Remove it.'));
  assert.ok(fb.includes('Claude judged it AI-written (80% sure). What gave it away: "too tidy"'));
  assert.ok(!fb.includes('ChatGPT'));
  assert.ok(fb.includes('ZeroGPT detector: 70% AI (x).'));
});

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall passed');
