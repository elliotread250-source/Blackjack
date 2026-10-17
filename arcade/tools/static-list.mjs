// node arcade/tools/static-list.mjs — writes every live registry entry into index.html as a plain link list,
// so the shelf works before (and without) JavaScript. tests/test_registry.mjs checks it stays in sync.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function staticList(games) {
  return games.filter(g => !g.pending).sort((a, b) => a.shelf - b.shelf)
    .map(g => `      <li><a href="${esc(g.url)}"><b>${esc(g.name)}</b> <span>${esc(g.genres.join(' · '))}</span></a></li>`).join('\n');
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const games = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8')).games;
  const file = join(root, 'index.html'), html = readFileSync(file, 'utf8');
  const out = html.replace(/(<!-- STATIC-LIST:START -->)[\s\S]*?(<!-- STATIC-LIST:END -->)/, `$1\n${staticList(games)}\n$2`);
  writeFileSync(file, out);
  console.log(`static list: ${games.filter(g => !g.pending).length} live games`);
}
