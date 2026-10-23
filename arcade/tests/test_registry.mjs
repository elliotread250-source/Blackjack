// node arcade/tests/test_registry.mjs — registry, artwork and page integrity for the hub.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
let n = 0; const fails = [];
const ok = (c, m) => { if (c) n++; else fails.push(m); };

const reg = JSON.parse(read('registry.json')), games = reg.games;
const legacyUrls = JSON.parse(read('tests/legacy-urls.json'));
const slug = s => s.toLowerCase().replace(/replica|extreme/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
const KEY = /^[a-z0-9][a-z0-9-]{0,47}$/;
const CATS = new Set(['arcade', 'action', 'racing', 'puzzle', 'strategy', 'platformer', 'multiplayer', 'classic', 'casual', 'board', '3d', 'tool']);
const FEATS = new Set(['online', 'local2p', 'coop', 'bots', 'touch', 'daily', 'saves', 'leaderboard']);
// online multiplayer only where networking was verified with two live clients (tools/mp-turn-test.mjs, tools/mp-probe.mjs) or Apex GP's live net.js;
// Trap Race: verified by its own two-browser e2e run (Trap_race repo, tests/e2e/run.mjs)
// FNAF Replica: verified by its four-browser e2e runs in CI (FNAF-Replica repo, e2e/fourPlayers.spec.ts and e2e/freeRoam.spec.ts)
const ONLINE_VERIFIED = new Set(['pool', 'kart-racer', 'pong', 'connect-4', 'apex-gp', 'chess', 'tic-tac-toe', 'trap-race', 'fnaf']);

ok(games.length >= 39, `all ${games.length} entries present`);
ok(new Set(games.map(g => g.id)).size === games.length, 'ids are unique');
for (const g of games) {
  ok(KEY.test(g.id), `${g.id}: valid id`);
  ok(g.id === slug(g.name), `${g.id}: id equals the legacy slug, so its play history is kept`);
  ok(legacyUrls[g.id] === g.url, `${g.id}: URL unchanged (${g.url})`);
  ok(/^https:\/\/[a-z0-9-]+\.up\.railway\.app$/.test(g.url), `${g.id}: Railway https URL`);
  ok(g.categories.length && g.categories.every(c => CATS.has(c)), `${g.id}: known categories`);
  ok(g.features.every(f => FEATS.has(f)), `${g.id}: known features`);
  ok(!g.features.includes('online') || ONLINE_VERIFIED.has(g.id), `${g.id}: online multiplayer only if verified`);
  ok(!g.categories.includes('multiplayer') || g.features.some(f => ['online', 'local2p', 'coop'].includes(f)), `${g.id}: in Multiplayer only with a real multiplayer feature`);
  ok(g.kind === 'tool' ? g.categories.includes('tool') : !g.categories.includes('tool'), `${g.id}: tools are categorised as tools`);
  ok(g.genres.length >= 1 && g.blurb.length > 20, `${g.id}: genres and blurb`);
  for (const [dir, max] of [['game-logos', 40000], ['game-thumbnails', 120000]]) {
    const p = `assets/${dir}/${g.id}.svg`;
    if (!existsSync(join(root, p))) { ok(false, `${p} exists`); continue; }
    const s = read(p), size = statSync(join(root, p)).size;
    ok(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 (96 96|640 360)"/.test(s), `${p}: SVG with the right canvas`);
    ok(size < max, `${p}: small enough (${size} bytes)`);
    ok(!/href="https?:/.test(s) && !/url\(https?:/.test(s), `${p}: no remote dependencies`);
    ok((s.match(/<svg/g) || []).length === 1 && s.trim().endsWith('</svg>'), `${p}: well formed`);
  }
}
// every artwork pair is unique (no copies)
const thumbs = games.map(g => read(`assets/game-thumbnails/${g.id}.svg`)), logos = games.map(g => read(`assets/game-logos/${g.id}.svg`));
ok(new Set(thumbs).size === games.length && new Set(logos).size === games.length, 'every thumbnail and logo is distinct');
ok(readdirSync(join(root, 'assets/game-thumbnails')).length === games.length, 'no stray thumbnails');
const manifest = JSON.parse(read('assets/manifest.json'));
ok(Object.keys(manifest.games).length === games.length && manifest.artVersion === reg.artVersion, 'manifest covers every entry and matches the registry art version');
ok(games.filter(g => g.featured).every(g => !g.pending) && games.filter(g => g.featured).length >= 3, 'featured games are live');
ok(games.every(g => !g.pending || g.pending === true), 'pending is only ever true when set');

// every page only references files that exist
for (const page of ['index.html', 'styleguide.html', '404.html']) {
  const html = read(page);
  for (const m of html.matchAll(/(?:src|href)="\/?((?:css|js|assets)\/[^"?#]+)"/g)) ok(existsSync(join(root, m[1])), `${page} → ${m[1]} exists`);
}
// every JS module (recursively) resolves its relative imports; no admin secrets in client code
const walk = d => readdirSync(join(root, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const jsFiles = walk('js').filter(f => f.endsWith('.js'));
for (const f of jsFiles) {
  const s = read(f);
  ok(!/SUGGESTIONS_CODE|ADMIN_CODE/.test(s), `${f}: no admin secrets`);
  for (const m of s.matchAll(/(?:from|import)\s*\(?\s*'(\.{1,2}\/[^']+)'/g)) ok(existsSync(join(root, dirname(f), m[1])), `${f} imports ${m[1]}`);
  ok(!/https?:\/\/(?!open-arcade\.up\.railway\.app|github\.com)[a-z]/i.test(s.replace(/\/\/.*$/gm, '')), `${f}: no remote code or data dependencies`);
}
// the no-JavaScript fallback lists every live game, in sync with the registry
{
  const html = read('index.html'), block = /<!-- STATIC-LIST:START -->([\s\S]*?)<!-- STATIC-LIST:END -->/.exec(html);
  const links = block ? [...block[1].matchAll(/href="([^"]+)"/g)].map(m => m[1]) : [];
  const liveUrls = games.filter(g => !g.pending).map(g => g.url);
  ok(links.length === liveUrls.length && liveUrls.every(u => links.includes(u)), `static fallback lists all ${liveUrls.length} live games (run node tools/static-list.mjs)`);
  ok(!games.filter(g => g.pending).some(g => links.includes(g.url)), 'static fallback leaves pending entries out');
}
// hover moments: one per entry, self-contained animated SVG that honours reduced motion
for (const g of games) {
  const p = `assets/game-moments/${g.id}.svg`;
  if (!existsSync(join(root, p))) { ok(false, `${p} exists`); continue; }
  const s = read(p);
  ok(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 640 360">/.test(s) && s.trim().endsWith('</svg>'), `${p}: 640×360 SVG`);
  ok(s.length < 6000 && /@keyframes/.test(s) && /prefers-reduced-motion/.test(s), `${p}: small, animated, reduced-motion aware`);
  ok(!/href="https?:/.test(s) && !/url\(https?:/.test(s) && !/<script/i.test(s), `${p}: no remote refs or scripts`);
}
ok(readdirSync(join(root, 'assets/game-moments')).length === games.length, 'no stray hover moments');
// brand rule: the palette values never change, and the CSS adds no new hues
{
  const tokens = read('css/tokens.css');
  const FIXED = { ink: '#080b10', surface: '#10151d', panel: '#171e28', raised: '#202937', line: '#2a3440', orange: '#ff7518', 'orange-hover': '#ff8c32', amber: '#ffb347', gold: '#ffd08a',
    text: '#f2f5fa', muted: '#a6adba', faint: '#6f7886', ok: '#48d6a1', warn: '#f4d35e', err: '#ff5c7a', unknown: '#8a93a3' };
  for (const [k, v] of Object.entries(FIXED)) ok(new RegExp(`--${k}:\\s*${v};`, 'i').test(tokens), `token --${k} is still ${v}`);
  const hue = hex => { let [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return { h: 0, s: 0, l }; const s2 = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: (h * 60 + 360) % 360, s: s2, l }; };
  const stateHex = new Set(Object.values(FIXED));
  for (const f of walk('css').filter(f => f.endsWith('.css'))) {
    const bad = [...read(f).matchAll(/#[0-9a-f]{6}\b/gi)].map(m => m[0].toLowerCase()).filter(h => { if (stateHex.has(h)) return false; const c = hue(h); return c.s > .35 && c.l > .08 && c.l < .92 && (c.h < 8 || c.h > 52); });
    ok(!bad.length, `${f}: only brand hues (${bad.join(', ')})`);
  }
}
for (const b of ['emblem.svg', 'emblem-mark.svg', 'emblem-mono.svg', 'emblem-inverse.svg', 'wordmark.svg', 'favicon.svg', 'apple-touch-icon.png', 'og-image.jpg'])
  ok(existsSync(join(root, 'assets/branding', b)), `branding/${b} exists`);

if (fails.length) { for (const f of fails) console.log('FAIL ' + f); console.log(`${n} passed, ${fails.length} failed`); process.exit(1); }
console.log(`${n} registry/asset checks passed`);
