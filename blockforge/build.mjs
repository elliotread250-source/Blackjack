// Build script: bundles the game with esbuild and writes two outputs.
//   dist/index.html + dist/assets/*   served by server.js (Railway)
//   dist/blockforge.html              one self-contained file for offline / USB use
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const watch = process.argv.includes('--watch');
const root = path.dirname(new URL(import.meta.url).pathname);
const dist = path.join(root, 'dist');

// Lets `import code from 'inline-worker:./path.ts'` bundle a worker into a string,
// so the same build works over http and from file:// (blob URL workers).
const inlineWorker = {
  name: 'inline-worker',
  setup(build) {
    build.onResolve({ filter: /^inline-worker:/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.slice('inline-worker:'.length)),
      namespace: 'inline-worker',
    }));
    build.onLoad({ filter: /.*/, namespace: 'inline-worker' }, async (args) => {
      const r = await esbuild.build({
        entryPoints: [args.path], bundle: true, write: false, format: 'iife',
        minify: true, target: 'es2019', metafile: true,
      });
      return {
        contents: `export default ${JSON.stringify(r.outputFiles[0].text)};`,
        loader: 'js',
        watchFiles: Object.keys(r.metafile.inputs).map((f) => path.resolve(root, f)),
      };
    });
  },
};

function html({ css, scriptTag }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BlockForge</title>
<meta name="description" content="BlockForge: a creative-mode voxel sandbox that runs in your browser.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%23795436'/%3E%3Crect width='16' height='5' fill='%235fa43c'/%3E%3Crect y='5' width='3' height='2' fill='%235fa43c'/%3E%3Crect x='9' y='5' width='4' height='1' fill='%235fa43c'/%3E%3C/svg%3E">
<style>${css}</style>
</head>
<body>
<div id="boot">Loading BlockForge…</div>
<noscript>BlockForge needs JavaScript enabled.</noscript>
${scriptTag}
</body>
</html>
`;
}

async function writeOutputs(result) {
  const js = result.outputFiles.find((f) => f.path.endsWith('.js')).text;
  const css = fs.readFileSync(path.join(root, 'src/ui/boot.css'), 'utf8');
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'assets/blockforge.js'), js);
  fs.writeFileSync(path.join(dist, 'index.html'), html({ css, scriptTag: '<script src="assets/blockforge.js"></script>' }));
  // Inline build: escape anything that could close the script tag early.
  const safe = js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  fs.writeFileSync(path.join(dist, 'blockforge.html'), html({ css, scriptTag: `<script>${safe}</script>` }));
  const kb = (n) => (n / 1024).toFixed(0) + ' KB';
  const single = fs.statSync(path.join(dist, 'blockforge.html')).size;
  console.log(`[build] blockforge.js ${kb(js.length)}, blockforge.html ${kb(single)}`);
  if (single > 5 * 1024 * 1024) throw new Error('Build exceeds 5MB budget');
}

const options = {
  entryPoints: [path.join(root, 'src/main.ts')],
  bundle: true,
  write: false,
  format: 'iife',
  minify: !watch,
  sourcemap: false,
  target: 'es2019',
  outfile: path.join(dist, 'assets/blockforge.js'),
  plugins: [inlineWorker],
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context({
    ...options,
    plugins: [...options.plugins, { name: 'out', setup(b) { b.onEnd((r) => { if (!r.errors.length) writeOutputs(r); }); } }],
  });
  await ctx.watch();
  console.log('[build] watching…');
} else {
  const r = await esbuild.build(options);
  await writeOutputs(r);
}
