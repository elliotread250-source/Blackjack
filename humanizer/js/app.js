import { Engines, VENDORS, ensurePuterSignIn, loadPuterModels, loadServerConfig } from './engines.js';
import { PAID_DETECTORS, buildDetectors, serverHas } from './detectors.js';
import { LOCAL_DETECTORS } from './local-models.js';
import { localSupported, onLocalProgress } from './local-detectors.js';
import { humanize } from './pipeline.js';
import { words } from './tells.js';

const $ = (id) => document.getElementById(id);
const MOCK = new URLSearchParams(location.search).has('mock');
const MAX_CHARS = 15000;
const STORE = 'humanizer.settings.v1';

const DEFAULTS = {
  style: 'natural',
  rounds: 5,
  passMark: 35,
  claude: 'auto',
  gpt: 'auto',
  claudeModel: '',
  gptModel: '',
  local: Object.fromEntries(Object.entries(LOCAL_DETECTORS).map(([k, d]) => [k, d.on])),
  zerogpt: true,
  paid: {},
  keys: {},
  password: '',
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
    return { ...DEFAULTS, ...saved, local: { ...DEFAULTS.local, ...saved.local }, paid: { ...saved.paid }, keys: { ...saved.keys } };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

const S = {
  settings: loadSettings(),
  server: null,
  puterModels: { claude: [], gpt: [] },
  controller: null,
  result: null,
  shownRound: null,
  downloads: {},
};

function save() {
  try { localStorage.setItem(STORE, JSON.stringify(S.settings)); } catch { /* private mode */ }
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function makeEngines() {
  if (MOCK) {
    const { MockEngines } = await import('./mock.js');
    return new MockEngines();
  }
  return new Engines({ server: S.server, prefs: S.settings, password: S.settings.password, puterModels: S.puterModels });
}

function makeEnginesSync() {
  return new Engines({ server: S.server, prefs: S.settings, password: S.settings.password, puterModels: S.puterModels });
}

async function makeDetectors() {
  if (MOCK) {
    const { mockDetector } = await import('./mock.js');
    return [mockDetector('local:raid-roberta', 'RAID RoBERTa'), mockDetector('zerogpt', 'ZeroGPT')];
  }
  return buildDetectors({ settings: S.settings, server: S.server, password: S.settings.password });
}

// ---------- header bits ----------

function banner(html, kind = '') {
  const b = $('banner');
  if (!html) {
    b.hidden = true;
    return;
  }
  b.className = `banner ${kind}`;
  b.innerHTML = html;
  b.hidden = false;
}

function countWords(text) {
  const n = words(text).length;
  return `${n} word${n === 1 ? '' : 's'}`;
}

function renderEngineLine() {
  if (MOCK) {
    $('engines').textContent = 'Mock mode: offline stand-ins for every model and detector.';
    return;
  }
  const eng = makeEnginesSync();
  const parts = Object.keys(VENDORS).map((v) => {
    const via = eng.route(v);
    if (!via) return `${VENDORS[v]}: off`;
    const how = via === 'server' ? 'server key' : 'free via Puter';
    return `${VENDORS[v]}: ${how} (${eng.modelLabel(v)})`;
  });
  const n = buildDetectors({ settings: S.settings, server: S.server, password: S.settings.password }).length;
  parts.push(`${n + 1} detector${n ? 's' : ''}`);
  $('engines').textContent = parts.join(' · ');
}

// ---------- settings panel ----------

function routeSelect(vendor) {
  const val = S.settings[vendor];
  const serverReady = !!S.server?.llm?.[vendor]?.ready;
  const opts = [
    ['auto', serverReady ? 'Auto (server key)' : 'Auto (free via Puter)'],
    ['puter', 'Free via Puter'],
    ...(serverReady ? [['server', 'Server API key']] : []),
    ['off', 'Off'],
  ];
  return `<select data-set="${vendor}">${opts.map(([v, l]) => `<option value="${v}"${v === val ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
}

function modelSelect(vendor) {
  const key = `${vendor}Model`;
  const ids = S.puterModels[vendor] || [];
  const cur = S.settings[key];
  const opts = [['', `Auto${ids[0] ? ` (${ids[0]})` : ''}`], ...ids.slice(0, 30).map((id) => [id, id])];
  if (cur && !ids.includes(cur)) opts.push([cur, cur]);
  return `<select data-set="${key}">${opts.map(([v, l]) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
}

function renderSettings() {
  $('model-settings').innerHTML = Object.keys(VENDORS).map((v) => `
    <div class="field">${VENDORS[v]}
      ${routeSelect(v)}
      ${modelSelect(v)}
    </div>`).join('');

  const local = localSupported()
    ? Object.entries(LOCAL_DETECTORS).map(([k, d]) => `
      <label class="det">
        <input type="checkbox" data-local="${k}"${S.settings.local[k] ? ' checked' : ''}>
        <span class="name">${esc(d.name)} <span class="badge">in your browser · ${d.size}</span></span>
        <span class="desc">${esc(d.blurb)}</span>
      </label>`).join('')
    : '<p class="hint">This browser can\'t run the in-browser detectors (no Web Workers or WebAssembly).</p>';
  $('free-detectors').innerHTML = `${local}
    <label class="det">
      <input type="checkbox" data-zerogpt${S.settings.zerogpt ? ' checked' : ''}>
      <span class="name">ZeroGPT <span class="badge">free public checker</span></span>
      <span class="desc">Uses ZeroGPT's own free web checker. Unofficial, so it can be rate limited or switched off on their end; if it fails the run carries on without it.</span>
    </label>`;

  $('paid-detectors').innerHTML = PAID_DETECTORS.map((d) => {
    const onServer = serverHas(S.server, d.id);
    const status = onServer ? '<span class="badge ok">key on server</span>' : '';
    const inputs = onServer ? '' : `<span class="keys">${d.keys.map((k) => `
      <input type="${/EMAIL/.test(k) ? 'text' : 'password'}" placeholder="${k}" data-key="${k}" value="${esc(S.settings.keys[k] || '')}" autocomplete="off">`).join('')}</span>`;
    return `
      <label class="det">
        <input type="checkbox" data-paid="${d.id}"${S.settings.paid[d.id] !== false ? ' checked' : ''}${S.server ? '' : ' disabled'}>
        <span class="name">${esc(d.name)} ${status}</span>
        <span class="desc">${S.server ? `Paid API. <a href="${d.link}" target="_blank" rel="noopener">Get a key</a>.` : "Needs this app's optional Python server, which isn't running on the free GitHub Pages version."}</span>
        ${S.server ? inputs : ''}
      </label>`;
  }).join('');

  $('passmark').value = S.settings.passMark;
  $('password-wrap').hidden = !S.server?.password;
  $('password').value = S.settings.password || '';
}

function bindSettings() {
  $('settings').addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.set) S.settings[t.dataset.set] = t.value;
    else if (t.dataset.local) S.settings.local[t.dataset.local] = t.checked;
    else if ('zerogpt' in t.dataset) S.settings.zerogpt = t.checked;
    else if (t.dataset.paid) S.settings.paid[t.dataset.paid] = t.checked;
    else if (t.dataset.key) S.settings.keys[t.dataset.key] = t.value.trim();
    else if (t.id === 'passmark') S.settings.passMark = Math.max(5, Math.min(95, Number(t.value) || DEFAULTS.passMark));
    else if (t.id === 'password') {
      S.settings.password = t.value;
      save();
      refreshServer();
      return;
    }
    save();
    renderEngineLine();
  });
}

// ---------- results ----------

function chip(c) {
  if (!c) return '<span class="chip">n/a</span>';
  const title = esc([c.error, c.skipped, c.note, ...(c.notes || [])].filter(Boolean).join('\n'));
  if (c.error) return `<span class="chip" title="${title}">error</span>`;
  if (c.skipped) return `<span class="chip" title="${title}">skipped</span>`;
  const cls = c.pass ? 'pass' : 'fail';
  const label = c.kind === 'judge' ? `${c.verdict === 'human' ? 'Human' : 'AI'} ${c.ai}%` : c.kind === 'tells' ? `${c.ai}/100` : `${c.ai}% AI`;
  return `<span class="chip ${cls}" title="${title}">${c.pass ? '✓' : '✗'} ${label}</span>`;
}

function renderTable(rounds) {
  const order = [];
  const names = {};
  for (const r of rounds) {
    for (const c of r.checks) {
      if (!names[c.id]) {
        order.push(c.id);
        names[c.id] = c.name;
      }
    }
  }
  const shown = S.shownRound ?? rounds.at(-1)?.r;
  const head = `<tr><th>Check</th>${rounds.map((r) => `
    <th class="${r.r === shown ? 'current' : ''}">Round ${r.r}<br><button class="ghost small" type="button" data-view="${r.r}">${r.r === shown ? 'Showing' : 'View'}</button></th>`).join('')}</tr>`;
  const writerRow = `<tr><td>Rewritten by</td>${rounds.map((r) => `<td>${esc(VENDORS[r.writer] || r.writer)}</td>`).join('')}</tr>`;
  const rows = order.map((id) => `<tr><td>${esc(names[id])}</td>${rounds.map((r) => `<td>${chip(r.checks.find((c) => c.id === id))}</td>`).join('')}</tr>`).join('');
  $('checks').innerHTML = `<thead>${head}</thead><tbody>${writerRow}${rows}</tbody>`;
}

function renderFlags(round) {
  if (!round) {
    $('flags').innerHTML = '';
    return;
  }
  const blocks = round.checks
    .filter((c) => c.pass === false || c.error)
    .map((c) => {
      const items = c.error ? [c.error] : (c.notes || []).slice(0, 6);
      const head = c.error ? `${c.name}: couldn't run` : `${c.name} still flags`;
      return `<h3>${esc(head)}${c.note ? ` <span class="badge">${esc(c.note)}</span>` : ''}</h3>${items.length ? `<ul>${items.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}`;
    });
  $('flags').innerHTML = blocks.join('');
}

function showRound(r) {
  const round = S.result?.rounds.find((x) => x.r === r) || S.liveRounds?.find((x) => x.r === r);
  if (!round) return;
  S.shownRound = r;
  setOutput(round.draft);
  renderTable(S.result?.rounds || S.liveRounds);
  renderFlags(round);
}

function setOutput(text) {
  $('output').value = text || '';
  $('output-meta').textContent = text ? countWords(text) : '';
  $('copy').disabled = !text;
}

function renderVerdict(result) {
  const { final, rounds, passed } = result;
  const failing = final.checks.filter((c) => c.pass === false).map((c) => c.name);
  const errored = final.checks.filter((c) => c.error).map((c) => c.name);
  let html;
  if (passed) {
    const judges = final.checks.filter((c) => c.kind === 'judge').map((c) => c.name);
    html = `Passed every check on round ${final.r}.<span class="sub">${judges.length ? `${judges.join(' and ')} read it as human. ` : ''}Every detector that ran scored it under ${S.settings.passMark}% AI.${errored.length ? ` (${errored.join(', ')} couldn't run.)` : ''}</span>`;
  } else {
    html = `Best version after ${rounds.length} round${rounds.length === 1 ? '' : 's'} is round ${final.r}.<span class="sub">${failing.length ? `Still flagged by: ${failing.join(', ')}. ` : ''}${errored.length ? `Couldn't run: ${errored.join(', ')}. ` : ''}Run it again on this output to keep pushing, or raise the round limit.</span>`;
  }
  $('verdict').innerHTML = `${html}<div class="verdict-actions"><button class="ghost small" type="button" id="again">Run again on this output</button></div>`;
  $('again').addEventListener('click', () => {
    $('input').value = $('output').value;
    updateInputMeta();
    start();
  });
}

// ---------- run ----------

function setRunning(on) {
  $('go').disabled = on;
  $('stop').hidden = !on;
  $('input').readOnly = on;
  $('progress').hidden = !on;
}

function updateDownloads() {
  const items = Object.entries(S.downloads).filter(([, pct]) => pct < 100);
  $('downloads').textContent = items.length
    ? `First-run download (cached after this): ${items.map(([k, pct]) => `${LOCAL_DETECTORS[k]?.name || k} ${pct}%`).join(', ')}`
    : '';
}

async function start() {
  const text = $('input').value.trim();
  if (!text) {
    banner('Paste some text first.');
    return;
  }
  if (text.length > MAX_CHARS) {
    banner(`That's ${text.length.toLocaleString()} characters. Keep it under ${MAX_CHARS.toLocaleString()} (about 2,500 words) per run, or split it into sections.`, 'error');
    return;
  }

  // Puter's sign-in popup must open straight from the click, before any await.
  if (!MOCK) {
    const eng = makeEnginesSync();
    if (eng.needsPuter()) {
      try {
        await ensurePuterSignIn();
      } catch {
        banner('Claude and ChatGPT run free through Puter, which opens a small window to set up a free guest account. Allow pop-ups for this page, then click Humanize again.', 'error');
        return;
      }
    }
  }

  banner('');
  const engines = await makeEngines();
  const detectors = await makeDetectors();
  const maxRounds = Number(S.settings.rounds) || 5;
  S.controller = new AbortController();
  S.result = null;
  S.liveRounds = [];
  S.shownRound = null;
  setRunning(true);
  setOutput('');
  $('results').hidden = true;
  $('bar').style.width = '2%';
  $('status').textContent = 'Starting…';

  try {
    const result = await humanize({
      text,
      style: S.settings.style,
      maxRounds,
      engines,
      detectors,
      passMark: S.settings.passMark,
      signal: S.controller.signal,
      onEvent: (ev) => {
        if (ev.type === 'status') {
          $('status').textContent = ev.text;
          $('bar').style.width = `${Math.max(4, ((ev.round - 1) / maxRounds) * 100 + 4)}%`;
        } else if (ev.type === 'draft') {
          setOutput(ev.draft);
        } else if (ev.type === 'round') {
          S.liveRounds.push(ev.round);
          $('results').hidden = false;
          $('verdict').innerHTML = `Round ${ev.round.r}: ${ev.round.passed ? 'everything passed' : `${ev.round.fails} check${ev.round.fails === 1 ? '' : 's'} still say AI`}…`;
          renderTable(S.liveRounds);
          renderFlags(ev.round);
          $('bar').style.width = `${(ev.round.r / maxRounds) * 100}%`;
        }
      },
    });
    S.result = result;
    S.shownRound = result.final.r;
    setOutput(result.final.draft);
    renderTable(result.rounds);
    renderFlags(result.final);
    renderVerdict(result);
    if (result.dropped?.size) {
      banner(`Skipped after an error: ${[...result.dropped.entries()].map(([id, why]) => `${esc(detectors.find((d) => d.id === id)?.name || id)} (${esc(why)})`).join('; ')}`);
    }
  } catch (e) {
    if (e?.name === 'AbortError') {
      banner('Stopped. The last finished draft is in the output box.');
    } else {
      banner(esc(e.message || String(e)), 'error');
    }
  } finally {
    setRunning(false);
    S.controller = null;
  }
}

function updateInputMeta() {
  const v = $('input').value;
  $('input-meta').textContent = `${countWords(v)}${v.length > MAX_CHARS ? ` · too long (max ${MAX_CHARS.toLocaleString()} chars)` : ''}`;
}

async function copyOutput() {
  const text = $('output').value;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    $('output').select();
    document.execCommand('copy');
  }
  $('copy').textContent = 'Copied';
  setTimeout(() => { $('copy').textContent = 'Copy'; }, 1500);
}

async function refreshServer() {
  S.server = MOCK ? null : await loadServerConfig(S.settings.password);
  if (S.server?.password && !S.server.authorized) {
    $('settings').open = true;
    banner('This copy of the app has a password. Enter it under Settings.');
  }
  renderSettings();
  renderEngineLine();
}

async function init() {
  $('style').value = S.settings.style;
  $('rounds').value = String(S.settings.rounds);
  $('style').addEventListener('change', (e) => { S.settings.style = e.target.value; save(); });
  $('rounds').addEventListener('change', (e) => { S.settings.rounds = Number(e.target.value); save(); });
  $('input').addEventListener('input', updateInputMeta);
  $('input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) start();
  });
  $('go').addEventListener('click', start);
  $('stop').addEventListener('click', () => S.controller?.abort());
  $('copy').addEventListener('click', copyOutput);
  $('checks').addEventListener('click', (e) => {
    const r = e.target.closest('[data-view]')?.dataset.view;
    if (r) showRound(Number(r));
  });
  onLocalProgress((detector, pct) => {
    S.downloads[detector] = pct;
    updateDownloads();
  });
  bindSettings();
  updateInputMeta();

  if (!MOCK && !Engines.puterLoaded()) {
    banner('Couldn\'t load Puter (js.puter.com), which is how Claude and ChatGPT run for free. Check an ad blocker or network filter, then reload.', 'error');
  }
  await refreshServer();
  if (!MOCK) {
    S.puterModels = await loadPuterModels();
    renderSettings();
    renderEngineLine();
  }
}

init();
