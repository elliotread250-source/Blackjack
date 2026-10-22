// Tiny SVG authoring kit for the hub artwork. Everything is plain strings; no dependencies.
export const f = n => +(+n).toFixed(2);
export function svg(w, h, defs, body, { title = '', pixel = false } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}"${pixel ? ' shape-rendering="crispEdges"' : ''}${title ? ` role="img" aria-label="${title}"` : ''}>` +
    (defs ? `<defs>${defs}</defs>` : '') + body + '</svg>\n';
}
const stopList = stops => stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null && a !== 1 ? ` stop-opacity="${a}"` : ''}/>`).join('');
export const lg = (id, x1, y1, x2, y2, stops) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopList(stops)}</linearGradient>`;
export const rg = (id, cx, cy, r, stops, extra = '') => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${extra}>${stopList(stops)}</radialGradient>`;
export const blur = (id, sd) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
export const rect = (x, y, w, h, fill, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
export const circ = (cx, cy, r, fill, extra = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
export const ell = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
export const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
export const line = (x1, y1, x2, y2, stroke, w = 2, extra = '') => `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="${stroke}" stroke-width="${w}" fill="none"${extra ? ' ' + extra : ''}/>`;
export const g = (attrs, body) => `<g ${attrs}>${body}</g>`;
export const text = (x, y, s, size, fill, extra = '') => `<text x="${f(x)}" y="${f(y)}" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
export const poly = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';

// shared finishing: soft key light and a vignette, so every thumbnail has depth and a focal centre
export function finish(id = 'v', strength = .62, cx = .5, cy = .45) {
  return { defs: rg(id, cx, cy, .75, [[0, '#000', 0], [.62, '#000', 0], [1, '#000', strength]]), body: rect(0, 0, 640, 360, `url(#${id})`) };
}
export function glow(id, cx, cy, r, color, a = .6) { return { defs: rg(id, .5, .5, .5, [[0, color, a], [1, color, 0]]), body: circ(cx, cy, r, `url(#${id})`) }; }
export function stars(n, seed, w = 640, h = 360, col = '#fff') {
  const r = rng(seed); let s = '';
  for (let i = 0; i < n; i++) s += circ(r() * w, r() * h, r() < .9 ? .6 + r() * .7 : 1.4 + r(), col, `opacity="${f(.25 + r() * .7)}"`);
  return s;
}

// isometric voxels: x to the right-down, y to the left-down, z up
export function iso(ox, oy, k) {
  const P = (x, y, z) => [ox + (x - y) * k * .866, oy + (x + y) * k * .5 - z * k];
  const box = (x, y, z, w, d, h, top, left, right, extra = '') => {
    const a = P(x, y, z + h), b = P(x + w, y, z + h), c = P(x + w, y + d, z + h), dd = P(x, y + d, z + h);
    const e = P(x + w, y, z), ff = P(x + w, y + d, z), gg = P(x, y + d, z);
    return path(poly([a, b, c, dd]), top, extra) + path(poly([dd, c, ff, gg]), left, extra) + path(poly([c, b, e, ff]), right, extra);
  };
  return { P, box };
}
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  const m = v => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return '#' + ((1 << 24) | (m(r) << 16) | (m(gg) << 8) | m(b)).toString(16).slice(1);
}
export const voxel = (I, x, y, z, w, d, h, c, extra) => I.box(x, y, z, w, d, h, shade(c, .18), shade(c, -.12), shade(c, -.32), extra);

// card suits (unit size, centred)
export const SUIT = {
  heart: 'M0 .38C-.55 .02-.6-.42-.28-.5C-.12-.54 0-.44 0-.3C0-.44 .12-.54 .28-.5C.6-.42 .55 .02 0 .38Z',
  spade: 'M0-.52C.52-.16 .58 .22 .27 .3C.13 .33 .05 .27 .03 .2L.12 .48H-.12L-.03 .2C-.05 .27-.13 .33-.27 .3C-.58 .22-.52-.16 0-.52Z',
  diamond: 'M0-.52L.36 0L0 .52L-.36 0Z',
  club: 'M0-.5A.2 .2 0 1 1 .01-.1A.2 .2 0 1 1 .2 .26A.2 .2 0 0 1 .03 .12L.12 .48H-.12L-.03 .12A.2 .2 0 0 1-.2 .26A.2 .2 0 1 1-.01-.1A.2 .2 0 1 1 0-.5Z',
};
export const suit = (kind, x, y, s, fill, extra = '') => `<path d="${SUIT[kind]}" fill="${fill}" transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"${extra ? ' ' + extra : ''}/>`;
export const SERIF = `font-family="Georgia,'Times New Roman',serif" font-weight="700"`;
export const SANS = `font-family="'Space Grotesk','Segoe UI',Arial,sans-serif" font-weight="700"`;
export const MONO = `font-family="'JetBrains Mono',Menlo,Consolas,monospace"`;
