// Tiny static server for Railway. Serves the built game from dist/.
import express from 'express';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';

const app = express();
const dist = path.join(path.dirname(new URL(import.meta.url).pathname), 'dist');
const port = Number(process.env.PORT) || 8080;

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/ is missing. Run "npm run build" first.');
  process.exit(1);
}

app.disable('x-powered-by');
app.use(compression());
app.get('/healthz', (_req, res) => res.type('text').send('ok'));
// The offline build downloads as a file instead of opening in the tab.
app.get('/download', (_req, res) => res.download(path.join(dist, 'blockforge.html'), 'blockforge.html'));
app.use(express.static(dist, {
  extensions: ['html'],
  setHeaders(res, file) {
    res.setHeader('Cache-Control', file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600');
  },
}));
app.use((_req, res) => res.status(404).sendFile(path.join(dist, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`BlockForge listening on :${port}`));
