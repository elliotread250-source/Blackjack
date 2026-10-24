// node arcade/tools/art/build.mjs — writes every logo and thumbnail plus assets/manifest.json.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THUMBS as T1 } from './thumbs1.mjs';
import { THUMBS as T2 } from './thumbs2.mjs';
import { THUMBS as T3 } from './thumbs3.mjs';
import { LOGOS } from './logos.mjs';
import { MOMENTS } from './moments.mjs';
import { IO_LOGOS, IO_THUMBS, IO_MOMENTS } from './io.mjs';
Object.assign(LOGOS, IO_LOGOS);
Object.assign(MOMENTS, IO_MOMENTS);

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const reg = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8')), games = reg.games;
const hash = createHash('sha256');
const THUMBS = { ...T1, ...T2, ...T3, ...IO_THUMBS };
mkdirSync(join(root, 'assets/game-logos'), { recursive: true });
mkdirSync(join(root, 'assets/game-thumbnails'), { recursive: true });
mkdirSync(join(root, 'assets/game-moments'), { recursive: true });
const manifest = { generated: 'tools/art/build.mjs', note: 'Original vector artwork; every registry entry has its own logo and thumbnail.', games: {} };
const missing = [];
for (const gm of games) {
  if (!LOGOS[gm.id]) missing.push('logo ' + gm.id);
  if (!THUMBS[gm.id]) missing.push('thumbnail ' + gm.id);
  if (!MOMENTS[gm.id]) missing.push('moment ' + gm.id);
  if (!LOGOS[gm.id] || !THUMBS[gm.id]) continue;
  const logo = LOGOS[gm.id](), thumb = THUMBS[gm.id]();
  const mom = MOMENTS[gm.id] || '';
  hash.update(logo).update(thumb).update(mom);
  if (mom) writeFileSync(join(root, `assets/game-moments/${gm.id}.svg`), mom);
  writeFileSync(join(root, `assets/game-logos/${gm.id}.svg`), logo);
  writeFileSync(join(root, `assets/game-thumbnails/${gm.id}.svg`), thumb);
  manifest.games[gm.id] = { name: gm.name, logo: `assets/game-logos/${gm.id}.svg`, thumbnail: `assets/game-thumbnails/${gm.id}.svg`, moment: `assets/game-moments/${gm.id}.svg`, logoBytes: logo.length, thumbnailBytes: thumb.length, momentBytes: mom.length };
}
for (const id of Object.keys(THUMBS)) if (!games.some(gm => gm.id === id)) missing.push('art for unknown id ' + id);
// stamp the artwork version into the registry so browsers refetch changed art at once (assets are cached)
const artVersion = hash.digest('hex').slice(0, 10);
manifest.artVersion = artVersion;
if (reg.artVersion !== artVersion) { reg.artVersion = artVersion; writeFileSync(join(root, 'registry.json'), JSON.stringify(reg, null, 1) + '\n'); }
writeFileSync(join(root, 'assets/manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
if (missing.length) { console.error('MISSING: ' + missing.join(', ')); process.exit(1); }
const total = Object.values(manifest.games).reduce((s, m) => s + m.logoBytes + m.thumbnailBytes, 0);
console.log(`${Object.keys(manifest.games).length} logos + thumbnails + hover moments, ${(total / 1024).toFixed(0)} KB total`);
