// Checks the app against the real services: Puter (Claude + GPT), the
// Hugging Face detector models, and ZeroGPT. Meant for CI, which has open
// internet; see .github/workflows/humanizer-live.yml.
//
//   node tools/live-check.mjs <url> [--full]
//
// --full also runs a complete humanize loop through the UI.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const url = process.argv[2];
const full = process.argv.includes('--full');
const outDir = process.env.OUT_DIR || 'live-check-out';
fs.mkdirSync(outDir, { recursive: true });
const here = path.dirname(new URL(import.meta.url).pathname);
const AI = fs.readFileSync(path.join(here, 'samples/ai.txt'), 'utf8').trim();
const HUMAN = fs.readFileSync(path.join(here, 'samples/human.txt'), 'utf8').trim();

const report = { url, startedAt: new Date().toISOString(), steps: [] };
let failures = 0;
function step(name, ok, detail) {
  report.steps.push({ name, ok, detail });
  if (!ok) failures++;
  const d = detail === undefined ? '' : `\n    ${typeof detail === 'string' ? detail : JSON.stringify(detail, null, 1).replace(/\n/g, '\n    ')}`;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${d}`);
}
const save = () => fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') pageErrors.push(`console: ${m.text()}`);
});

try {
  // 1. Page and Puter load.
  const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  step('page loads', resp.ok() && (await page.title()) === 'Humanizer', `${resp.status()} "${await page.title()}"`);
  await page.waitForFunction(() => !!window.puter?.ai?.chat, null, { timeout: 30000 }).catch(() => {});
  step('Puter.js loads from js.puter.com', await page.evaluate(() => !!window.puter?.ai?.chat));

  // 2. Model list, and what the app would pick.
  const models = await page.evaluate(async () => {
    const eng = await import('./js/engines.js');
    const m = await eng.loadPuterModels();
    const e = new eng.Engines({ server: null, prefs: {}, puterModels: m });
    return { claude: m.claude.slice(0, 10), gpt: m.gpt.slice(0, 10), pickClaude: e.puterCandidates('claude')[0], pickGpt: e.puterCandidates('gpt')[0] };
  });
  step('Puter lists Claude and GPT models', models.claude.length > 0 && models.gpt.length > 0, models);

  // 3. ZeroGPT straight from the browser (CORS from this origin).
  const zg = await page.evaluate(async (text) => {
    try {
      const r = await fetch('https://api.zerogpt.com/api/detect/detectText', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input_text: text }),
      });
      const body = await r.text();
      return { status: r.status, body: body.slice(0, 500) };
    } catch (e) {
      return { error: String(e) };
    }
  }, AI);
  step('ZeroGPT callable from the browser', !zg.error && zg.status === 200 && /fakePercentage/.test(zg.body), zg);

  // 4. Each in-browser detector on an AI sample and a human sample.
  for (const id of ['raid-roberta', 'modernbert', 'perplexity', 'openai-roberta']) {
    const t0 = Date.now();
    const res = await page.evaluate(async ({ id, ai, human }) => {
      const m = await import('./js/local-detectors.js');
      const out = {};
      for (const [k, t] of [['ai', ai], ['human', human]]) {
        try {
          const r = await m.runLocal(id, t);
          out[k] = { ai: Math.round(r.ai), note: r.note, flagged: r.flagged.length };
        } catch (e) {
          out[k] = { error: e.message };
        }
      }
      return out;
    }, { id, ai: AI, human: HUMAN });
    res.seconds = Math.round((Date.now() - t0) / 1000);
    const ok = !res.ai.error && !res.human.error;
    step(`in-browser detector ${id} runs${ok ? ` (AI sample ${res.ai.ai}%, human sample ${res.human.ai}%)` : ''}`, ok, res);
  }

  // 5. Puter guest account, the same way the app does it (from a click).
  await page.evaluate(async () => {
    const eng = await import('./js/engines.js');
    const b = document.createElement('button');
    b.id = '__signin';
    b.textContent = 'sign in';
    b.onclick = async () => {
      try {
        await eng.ensurePuterSignIn();
        window.__auth = 'ok';
      } catch (e) {
        window.__auth = `error: ${e?.message || JSON.stringify(e)}`;
      }
    };
    document.body.prepend(b);
  });
  const popupP = page.waitForEvent('popup', { timeout: 15000 }).catch(() => null);
  await page.click('#__signin');
  const popup = await popupP;
  if (popup) {
    await popup.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
    console.log(`    popup: ${popup.url()}`);
  }
  await page.waitForFunction(() => window.__auth, null, { timeout: 90000 }).catch(() => {});
  const auth = await page.evaluate(async () => ({
    result: window.__auth || 'still waiting',
    signedIn: window.puter.auth.isSignedIn(),
    user: window.puter.auth.isSignedIn() ? await window.puter.auth.getUser().then((u) => ({ username: u.username, temp: u.is_temp })).catch((e) => String(e)) : null,
  }));
  if (popup && !popup.isClosed() && auth.result !== 'ok') {
    await popup.screenshot({ path: path.join(outDir, 'puter-popup.png') }).catch(() => {});
    auth.popupText = (await popup.evaluate(() => document.body.innerText).catch(() => '')).slice(0, 600);
  }
  step('Puter guest account created without a sign-up form', auth.result === 'ok' && auth.signedIn, auth);

  // 6. One real call to each model through the app's own engine code.
  if (auth.signedIn) {
    for (const vendor of ['claude', 'gpt']) {
      const t0 = Date.now();
      const r = await page.evaluate(async (vendor) => {
        const eng = await import('./js/engines.js');
        const e = new eng.Engines({ server: null, prefs: { [vendor]: 'puter' }, puterModels: await eng.loadPuterModels() });
        try {
          return await e.ask(vendor, 'You answer in one short sentence.', 'In one sentence: what is a haiku?', 'judge');
        } catch (err) {
          return { error: err.message };
        }
      }, vendor);
      r.seconds = Math.round((Date.now() - t0) / 1000);
      step(`${vendor === 'claude' ? 'Claude' : 'ChatGPT'} answers through Puter`, !r.error && r.text?.length > 5, r);
    }
  }

  // 7. The whole loop through the UI.
  if (full && auth.signedIn) {
    await page.evaluate(() => document.getElementById('__signin')?.remove());
    await page.selectOption('#rounds', '3');
    await page.fill('#input', AI);
    const t0 = Date.now();
    await page.click('#go');
    await page.waitForSelector('#verdict .verdict-actions, #banner.error:not([hidden])', { timeout: 25 * 60 * 1000 });
    const result = await page.evaluate(() => ({
      verdict: document.getElementById('verdict').innerText,
      banner: document.getElementById('banner').hidden ? '' : document.getElementById('banner').innerText,
      table: document.getElementById('checks').innerText,
      flags: document.getElementById('flags').innerText,
      output: document.getElementById('output').value,
      engines: document.getElementById('engines').innerText,
    }));
    result.minutes = Math.round((Date.now() - t0) / 6000) / 10;
    fs.writeFileSync(path.join(outDir, 'output.txt'), result.output);
    await page.screenshot({ path: path.join(outDir, 'full-run.png'), fullPage: true });
    report.fullRun = result;
    step('full humanize run finishes', !!result.verdict && !/error/i.test(result.banner || '') && result.output.length > 100, result);
    console.log(`\n--- verdict ---\n${result.verdict}\n--- checks ---\n${result.table}\n--- still flagged ---\n${result.flags}\n--- output ---\n${result.output}\n`);
  }
} catch (e) {
  step('unexpected error', false, e.stack);
  await page.screenshot({ path: path.join(outDir, 'crash.png'), fullPage: true }).catch(() => {});
} finally {
  const real = pageErrors.filter((e) => !/Failed to load resource/.test(e));
  step('no page errors', real.length === 0, real.slice(0, 15));
  save();
  await browser.close();
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [`### ${url}`, '', ...report.steps.map((s) => `- ${s.ok ? 'PASS' : 'FAIL'} ${s.name}`)];
  if (report.fullRun) lines.push('', '```', report.fullRun.verdict, '', report.fullRun.table, '```', '', '**Output**', '', report.fullRun.output);
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n\n`);
}
process.exit(failures ? 1 : 0);
