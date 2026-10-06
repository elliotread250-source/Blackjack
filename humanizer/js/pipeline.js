// The humanize loop: rewrite, run every check, feed what got flagged back into
// the next rewrite, and stop when everything passes or the rounds run out.

import { JUDGE_SYSTEM, REWRITE_SYSTEM, judgePrompt, parseJudgement, rewritePrompt } from './prompts.js';
import { analyze, scrub } from './tells.js';
import { VENDORS } from './engines.js';

export const TELLS_PASS = 20;

function abortIfNeeded(signal) {
  if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
}

function pickWriter(lastRound, vendors, prev) {
  if (vendors.length === 1) return vendors[0];
  if (!lastRound) return vendors.includes('claude') ? 'claude' : vendors[0];
  const failed = (v) => lastRound.checks.find((c) => c.id === `judge-${v}`)?.pass === false;
  // Whoever still calls it AI rewrites it: it knows what it's looking for.
  if (failed('claude') && !failed('gpt')) return 'claude';
  if (failed('gpt') && !failed('claude')) return 'gpt';
  return prev === 'claude' ? 'gpt' : 'claude';
}

async function judge(engines, vendor, text, signal) {
  const out = await engines.ask(vendor, JUDGE_SYSTEM, judgePrompt(text), 'judge', signal);
  return { ...parseJudgement(out.text), model: out.model };
}

// detectors: [{id, name, run(text, signal) -> {ai, flagged, note?, skipped?}}]
async function runChecks(draft, { style, vendors, engines, detectors, dropped, passMark, signal }) {
  const tells = analyze(draft, style);
  const checks = [{
    id: 'tells',
    name: 'Built-in style check',
    kind: 'tells',
    ai: tells.score,
    pass: tells.score <= TELLS_PASS,
    notes: tells.tells.map((t) => t.detail),
    fixes: tells.tells.map((t) => t.fix),
  }];

  const jobs = vendors.map(async (v) => {
    const base = { id: `judge-${v}`, name: VENDORS[v], kind: 'judge', blocking: true };
    try {
      const j = await judge(engines, v, draft, signal);
      return { ...base, ai: j.ai, verdict: j.verdict, pass: j.verdict === 'human' && j.ai < 50, notes: j.tells, model: j.model };
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      return { ...base, error: String(e.message || e), pass: null };
    }
  });

  for (const d of detectors) {
    if (dropped.has(d.id)) continue;
    jobs.push((async () => {
      const base = { id: d.id, name: d.name, kind: 'detector' };
      try {
        const r = await d.run(draft, signal);
        if (r.skipped) return { ...base, skipped: r.skipped, pass: null };
        return { ...base, ai: Math.round(r.ai), pass: r.ai < passMark, notes: r.flagged || [], note: r.note };
      } catch (e) {
        if (e?.name === 'AbortError') throw e;
        // A detector that's down or out of quota shouldn't burn the rest of the rounds.
        dropped.set(d.id, String(e.message || e));
        return { ...base, error: String(e.message || e), pass: null };
      }
    })());
  }

  checks.push(...await Promise.all(jobs));
  abortIfNeeded(signal);
  return checks;
}

const quote = (s) => `"${String(s).replace(/\s+/g, ' ').trim().slice(0, 200)}"`;

export function buildFeedback(checks) {
  const lines = [];
  for (const c of checks) {
    if (c.pass !== false) continue;
    if (c.kind === 'tells') {
      lines.push(`Style check (${c.ai}/100 AI-like). Fix each of these:`);
      c.notes.forEach((n, i) => lines.push(`- ${n} Fix: ${c.fixes[i]}`));
    } else if (c.kind === 'judge') {
      lines.push(`${c.name} judged it AI-written (${c.ai}% sure).${c.notes.length ? ` What gave it away: ${c.notes.map(quote).join('; ')}` : ''}`);
    } else {
      const extra = c.note ? ` (${c.note})` : '';
      lines.push(`${c.name} detector: ${c.ai}% AI${extra}.${c.notes.length ? ` Passages it flagged most: ${c.notes.slice(0, 4).map(quote).join('; ')}` : ''}`);
    }
  }
  return lines.join('\n');
}

function better(a, b) {
  if (a.passed !== b.passed) return a.passed;
  if (a.fails !== b.fails) return a.fails < b.fails;
  return a.score <= b.score;
}

export async function humanize({ text, style = 'natural', maxRounds = 5, engines, detectors = [], passMark = 35, onEvent = () => {}, signal }) {
  const vendors = engines.available();
  if (!vendors.length) {
    throw new Error('No model to rewrite with. Sign in to Puter when asked (free), or turn Claude/ChatGPT back on in Settings.');
  }
  const dropped = new Map();
  const rounds = [];
  let draft = null;
  let feedback = '';
  let writer = null;
  let best = null;

  for (let r = 1; r <= maxRounds; r++) {
    abortIfNeeded(signal);
    writer = pickWriter(rounds.at(-1), vendors, writer);
    onEvent({ type: 'status', round: r, text: `Round ${r} of ${maxRounds}: ${VENDORS[writer]} is rewriting` });
    const out = await engines.ask(writer, REWRITE_SYSTEM, rewritePrompt({ original: text, draft, style, feedback, round: r }), 'rewrite', signal);
    draft = scrub(out.text);
    onEvent({ type: 'draft', round: r, draft });

    const active = detectors.filter((d) => !dropped.has(d.id)).length + vendors.length + 1;
    onEvent({ type: 'status', round: r, text: `Round ${r} of ${maxRounds}: running ${active} checks` });
    const checks = await runChecks(draft, { style, vendors, engines, detectors, dropped, passMark, signal });

    const fails = checks.filter((c) => c.pass === false).length;
    const blocked = checks.some((c) => c.blocking && c.error);
    const scored = checks.filter((c) => typeof c.ai === 'number');
    const round = {
      r,
      writer,
      model: out.model,
      draft,
      checks,
      fails,
      passed: fails === 0 && !blocked,
      score: scored.length ? Math.round(scored.reduce((a, c) => a + c.ai, 0) / scored.length) : 100,
    };
    rounds.push(round);
    if (!best || better(round, best)) best = round;
    onEvent({ type: 'round', round, best });
    if (round.passed) return { final: round, rounds, passed: true, dropped };
    feedback = buildFeedback(checks)
      || 'Nothing specific was flagged, but one of the AI judges could not answer. Make the rhythm and word choice a little less predictable.';
  }
  return { final: best, rounds, passed: false, dropped };
}
