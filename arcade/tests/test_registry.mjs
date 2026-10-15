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
// online multiplayer only where networking code was verified (this repo's net.js / server sockets, or Apex GP's live net.js)
const ONLINE_VERIFIED = new Set(['pool', 'kart-racer', 'pong', 'connect-4', 'apex-gp']);

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
ok(games.some(g => g.pending), 'pending entries stay marked pending');

// the page only references files that exist; no admin secret in client code
const html = read('index.html');
for (const m of html.matchAll(/(?:src|href)="((?:css|js|assets)\/[^"?#]+)"/g)) ok(existsSync(join(root, m[1])), `index.html → ${m[1]} exists`);
for (const f of readdirSync(join(root, 'js'))) {
  const s = read('js/' + f);
  ok(!/SUGGESTIONS_CODE|ADMIN_CODE/.test(s), `js/${f}: no admin secrets`);
  for (const m of s.matchAll(/from '\.\/([\w-]+\.js)'/g)) ok(existsSync(join(root, 'js', m[1])), `js/${f} imports ${m[1]}`);
}
for (const b of ['emblem.svg', 'emblem-mark.svg', 'emblem-mono.svg', 'emblem-inverse.svg', 'wordmark.svg', 'favicon.svg', 'apple-touch-icon.png', 'og-image.jpg'])
  ok(existsSync(join(root, 'assets/branding', b)), `branding/${b} exists`);

if (fails.length) { for (const f of fails) console.log('FAIL ' + f); console.log(`${n} passed, ${fails.length} failed`); process.exit(1); }
console.log(`${n} registry/asset checks passed`);
