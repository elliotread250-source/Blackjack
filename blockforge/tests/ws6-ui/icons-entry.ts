import { TEXTURE_NAMES, COUNT, BLOCKS } from '../../src/blocks/registry';
import { generateTexture } from '../../src/blocks/textures';
import { buildIcons, renderIconPixels } from '../../src/ui/icons';
import { injectStyles } from '../../src/ui/style';

const w = window as unknown as Record<string, unknown>;
w.runIcons = () => {
  injectStyles(2);
  const t0 = performance.now();
  const tiles = TEXTURE_NAMES.map(generateTexture);
  const tTex = performance.now() - t0;
  const t1 = performance.now();
  const sheet = buildIcons({ tiles });
  const tIcons = performance.now() - t1;
  const t2 = performance.now();
  renderIconPixels((t) => tiles[t]);
  const tRender = performance.now() - t2;
  return { tTex, tIcons, tRender, count: COUNT, url: sheet.url, cols: sheet.cols, size: sheet.size, names: BLOCKS.map((b) => b.name) };
};
w.iconSheet = () => {
  const tiles = TEXTURE_NAMES.map(generateTexture);
  return buildIcons({ tiles });
};
