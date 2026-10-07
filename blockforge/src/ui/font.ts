// BlockForge pixel font. Every glyph below is an original 5x7-ish bitmap (rows 0-6 sit on
// the baseline, row 7 is the one-pixel descender). At startup we compile the bitmaps into
// a real TrueType font (each run of pixels becomes a square contour) and register it as
// 'BlockForge' with the FontFace API. One glyph pixel is 1/8 em, so `font-size: 8 * N px`
// draws every glyph pixel as an N x N square: crisp at any whole GUI scale.

const PX = 128;            // font units per glyph pixel
const UPM = PX * 8;        // units per em (8 pixels)
const ASCENT = 8 * PX;     // one empty pixel above the 7-pixel capitals
const DESCENT = 1 * PX;    // one-pixel descender

// Glyph bitmaps: rows separated by '|', '#' = ink. Missing trailing rows are blank.
// Width is the row length; the advance is width + 1 pixel of spacing.
const G: Record<string, string> = {
  ' ': '...',
  '!': '#|#|#|#|#|.|#',
  '"': '#.#|#.#',
  '#': '.#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.',
  '$': '..#..|.####|#....|.###.|....#|####.|..#..',
  '%': '##..#|##.#.|...#.|..#..|.#...|.#.##|#..##',
  '&': '.##..|#..#.|.##..|.##.#|#..#.|#..#.|.##.#',
  "'": '#|#',
  '(': '..#|.#.|#..|#..|#..|.#.|..#',
  ')': '#..|.#.|..#|..#|..#|.#.|#..',
  '*': '.....|..#..|#.#.#|.###.|#.#.#|..#..',
  '+': '.....|..#..|..#..|#####|..#..|..#..',
  ',': '..|..|..|..|..|.#|.#|#.',
  '-': '.....|.....|.....|#####',
  '.': '.|.|.|.|.|.|#',
  '/': '....#|...#.|...#.|..#..|.#...|.#...|#....',
  '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
  '1': '..#..|.##..|..#..|..#..|..#..|..#..|#####',
  '2': '.###.|#...#|....#|..##.|.#...|#....|#####',
  '3': '.###.|#...#|....#|..##.|....#|#...#|.###.',
  '4': '...##|..#.#|.#..#|#...#|#####|....#|....#',
  '5': '#####|#....|####.|....#|....#|#...#|.###.',
  '6': '..##.|.#...|#....|####.|#...#|#...#|.###.',
  '7': '#####|#...#|....#|...#.|..#..|..#..|..#..',
  '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  '9': '.###.|#...#|#...#|.####|....#|...#.|.##..',
  ':': '.|.|#|.|.|.|#',
  ';': '..|..|.#|..|..|..|.#|#.',
  '<': '...#|..#.|.#..|#...|.#..|..#.|...#',
  '=': '.....|.....|#####|.....|.....|#####',
  '>': '#...|.#..|..#.|...#|..#.|.#..|#...',
  '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '@': '.###.|#...#|#.###|#.#.#|#.###|#....|.####',
  'A': '.###.|#...#|#...#|#####|#...#|#...#|#...#',
  'B': '####.|#...#|#...#|####.|#...#|#...#|####.',
  'C': '.###.|#...#|#....|#....|#....|#...#|.###.',
  'D': '###..|#..#.|#...#|#...#|#...#|#..#.|###..',
  'E': '#####|#....|#....|####.|#....|#....|#####',
  'F': '#####|#....|#....|####.|#....|#....|#....',
  'G': '.####|#....|#....|#..##|#...#|#...#|.####',
  'H': '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  'I': '###|.#.|.#.|.#.|.#.|.#.|###',
  'J': '....#|....#|....#|....#|#...#|#...#|.###.',
  'K': '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
  'L': '#....|#....|#....|#....|#....|#....|#####',
  'M': '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
  'N': '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#',
  'O': '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  'P': '####.|#...#|#...#|####.|#....|#....|#....',
  'Q': '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
  'R': '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  'S': '.####|#....|#....|.###.|....#|....#|####.',
  'T': '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  'U': '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  'V': '#...#|#...#|#...#|#...#|.#.#.|.#.#.|..#..',
  'W': '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#',
  'X': '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  'Y': '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
  'Z': '#####|....#|...#.|..#..|.#...|#....|#####',
  '[': '###|#..|#..|#..|#..|#..|###',
  '\\': '#....|.#...|.#...|..#..|...#.|...#.|....#',
  ']': '###|..#|..#|..#|..#|..#|###',
  '^': '..#..|.#.#.|#...#',
  '_': '.....|.....|.....|.....|.....|.....|.....|#####',
  '`': '#.|.#',
  'a': '.....|.....|.###.|....#|.####|#...#|.####',
  'b': '#....|#....|#.##.|##..#|#...#|#...#|####.',
  'c': '.....|.....|.###.|#...#|#....|#...#|.###.',
  'd': '....#|....#|.##.#|#..##|#...#|#...#|.####',
  'e': '.....|.....|.###.|#...#|#####|#....|.###.',
  'f': '..##|.#..|####|.#..|.#..|.#..|.#..',
  'g': '.....|.....|.####|#...#|#...#|.####|....#|####.',
  'h': '#....|#....|#.##.|##..#|#...#|#...#|#...#',
  'i': '#|.|#|#|#|#|#',
  'j': '...#|....|...#|...#|...#|...#|#..#|.##.',
  'k': '#...|#...|#..#|#.#.|##..|#.#.|#..#',
  'l': '#.|#.|#.|#.|#.|#.|.#',
  'm': '.....|.....|##.#.|#.#.#|#.#.#|#...#|#...#',
  'n': '.....|.....|####.|#...#|#...#|#...#|#...#',
  'o': '.....|.....|.###.|#...#|#...#|#...#|.###.',
  'p': '.....|.....|#.##.|##..#|#...#|####.|#....|#....',
  'q': '.....|.....|.##.#|#..##|#...#|.####|....#|....#',
  'r': '.....|.....|#.##.|##..#|#....|#....|#....',
  's': '.....|.....|.####|#....|.###.|....#|####.',
  't': '.#.|.#.|###|.#.|.#.|.#.|..#',
  'u': '.....|.....|#...#|#...#|#...#|#...#|.####',
  'v': '.....|.....|#...#|#...#|#...#|.#.#.|..#..',
  'w': '.....|.....|#...#|#.#.#|#.#.#|#.#.#|.#.#.',
  'x': '.....|.....|#...#|.#.#.|..#..|.#.#.|#...#',
  'y': '.....|.....|#...#|#...#|#...#|.####|....#|####.',
  'z': '.....|.....|#####|...#.|..#..|.#...|#####',
  '{': '..##|.#..|.#..|#...|.#..|.#..|..##',
  '|': '#|#|#|#|#|#|#|#',
  '}': '##..|..#.|..#.|...#|..#.|..#.|##..',
  '~': '......|......|.##..#|#..##.',
  // A few extras the UI uses: no-break space, hair space, middle dot, ellipsis, arrows.
  '\u00a0': '...',
  '\u200a': '',      // hair space: no ink, 1 pixel advance (fixes centring parity)
  '\u00b7': '.|.|.|#',
  '\u2026': '.....|.....|.....|.....|.....|.....|#.#.#',
  '\u2190': '.....|..#..|.#...|#####|.#...|..#..',
  '\u2191': '..#..|.###.|#.#.#|..#..|..#..|..#..|..#..',
  '\u2192': '.....|..#..|...#.|#####|...#.|..#..',
  '\u2193': '..#..|..#..|..#..|..#..|#.#.#|.###.|..#..',
};

// Tiny 3x5 digits in the private use area (U+E000..U+E009) for hotbar slot numbers.
const SMALL_DIGITS = [
  '###|#.#|#.#|#.#|###', '.#.|##.|.#.|.#.|###', '###|..#|###|#..|###', '###|..#|.##|..#|###',
  '#.#|#.#|###|..#|..#', '###|#..|###|..#|###', '###|#..|###|#.#|###', '###|..#|..#|.#.|.#.',
  '###|#.#|###|#.#|###', '###|#.#|###|..#|###',
];
SMALL_DIGITS.forEach((g, i) => { G[String.fromCharCode(0xe000 + i)] = g; });

/** Glyph advance in pixels (width + spacing), for layout code that wants to measure text. */
export function glyphAdvance(ch: string): number {
  const g = G[ch];
  if (g === undefined) return 6;
  return g.split('|')[0].length + 1;
}
/** Width in font pixels of a string drawn with the pixel font (no trailing spacing). */
export function textWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += glyphAdvance(ch);
  return Math.max(0, w - 1);
}

// ---------------------------------------------------------------------------- TTF writer

interface GlyphOut { data: Uint8Array; advance: number; xMin: number; yMin: number; xMax: number; yMax: number; points: number; contours: number }

/** Merge ink pixels into rectangles: horizontal runs, then runs repeated on following rows. */
function rectangles(rows: string[]): [number, number, number, number][] {
  const out: [number, number, number, number][] = []; // x0, row0, x1 (excl), row1 (excl)
  const open = new Map<string, [number, number, number, number]>();
  for (let r = 0; r <= rows.length; r++) {
    const row = rows[r] ?? '';
    const runs: [number, number][] = [];
    let x = 0;
    while (x < row.length) {
      if (row[x] === '#') {
        const s = x;
        while (x < row.length && row[x] === '#') x++;
        runs.push([s, x]);
      } else x++;
    }
    const seen = new Set<string>();
    for (const [a, b] of runs) {
      const k = a + ',' + b;
      seen.add(k);
      const o = open.get(k);
      if (o) o[3] = r + 1;
      else open.set(k, [a, r, b, r + 1]);
    }
    for (const [k, o] of open) if (!seen.has(k)) { out.push(o); open.delete(k); }
  }
  for (const o of open.values()) out.push(o);
  return out;
}

function buildGlyph(src: string): GlyphOut {
  const rows = src.split('|');
  const width = rows[0].length;
  const rects = rectangles(rows);
  if (!rects.length) return { data: new Uint8Array(0), advance: (width + 1) * PX, xMin: 0, yMin: 0, xMax: 0, yMax: 0, points: 0, contours: 0 };
  // Each rectangle is a clockwise contour (TrueType outer contours run clockwise, y up).
  const xs: number[] = [], ys: number[] = [], ends: number[] = [];
  for (const [x0, r0, x1, r1] of rects) {
    const left = x0 * PX, right = x1 * PX;
    const top = (7 - r0) * PX, bottom = (7 - r1) * PX; // row 0 top edge = 7 px above baseline
    xs.push(left, left, right, right);
    ys.push(bottom, top, top, bottom);
    ends.push(xs.length - 1);
  }
  const xMin = Math.min(...xs), xMax = Math.max(...xs), yMin = Math.min(...ys), yMax = Math.max(...ys);
  const n = xs.length;
  const size = 10 + ends.length * 2 + 2 + n + n * 4;
  const buf = new DataView(new ArrayBuffer(size + ((4 - (size % 4)) % 4)));
  let o = 0;
  buf.setInt16(o, ends.length); o += 2;
  buf.setInt16(o, xMin); o += 2; buf.setInt16(o, yMin); o += 2;
  buf.setInt16(o, xMax); o += 2; buf.setInt16(o, yMax); o += 2;
  for (const e of ends) { buf.setUint16(o, e); o += 2; }
  buf.setUint16(o, 0); o += 2; // no instructions
  for (let i = 0; i < n; i++) buf.setUint8(o++, 0x01); // on-curve, 16-bit x and y deltas
  let px = 0, py = 0;
  for (let i = 0; i < n; i++) { buf.setInt16(o, xs[i] - px); px = xs[i]; o += 2; }
  for (let i = 0; i < n; i++) { buf.setInt16(o, ys[i] - py); py = ys[i]; o += 2; }
  return { data: new Uint8Array(buf.buffer), advance: (width + 1) * PX, xMin, yMin, xMax, yMax, points: n, contours: ends.length };
}

class Writer {
  private bytes: number[] = [];
  u8(v: number) { this.bytes.push(v & 255); return this; }
  u16(v: number) { this.bytes.push((v >> 8) & 255, v & 255); return this; }
  i16(v: number) { return this.u16(v < 0 ? v + 65536 : v); }
  u32(v: number) { this.bytes.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255); return this; }
  tag(s: string) { for (let i = 0; i < 4; i++) this.u8(s.charCodeAt(i)); return this; }
  raw(a: Uint8Array | number[]) { for (let i = 0; i < a.length; i++) this.bytes.push(a[i]); return this; }
  get length() { return this.bytes.length; }
  out() { return new Uint8Array(this.bytes); }
}

function checksum(b: Uint8Array): number {
  let sum = 0;
  const n = Math.ceil(b.length / 4) * 4;
  for (let i = 0; i < n; i += 4) {
    sum = (sum + (((b[i] ?? 0) << 24) | ((b[i + 1] ?? 0) << 16) | ((b[i + 2] ?? 0) << 8) | (b[i + 3] ?? 0))) >>> 0;
  }
  return sum >>> 0;
}

function utf16be(s: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); out.push(c >> 8, c & 255); }
  return out;
}

/** Compile the bitmap glyphs into a TrueType font file. */
export function buildFontBinary(): ArrayBuffer {
  const chars = Object.keys(G).map((c) => c.charCodeAt(0)).sort((a, b) => a - b);
  const glyphs: GlyphOut[] = [];
  // Glyph 0 (.notdef): a hollow box.
  glyphs.push(buildGlyph('#####|#...#|#...#|#...#|#...#|#...#|#####'));
  const cmap = new Map<number, number>();
  for (const code of chars) {
    cmap.set(code, glyphs.length);
    glyphs.push(buildGlyph(G[String.fromCharCode(code)]));
  }
  const numGlyphs = glyphs.length;

  // glyf + loca (long offsets)
  const glyf = new Writer();
  const loca = new Writer();
  for (const g of glyphs) { loca.u32(glyf.length); glyf.raw(g.data); }
  loca.u32(glyf.length);

  const inked = glyphs.filter((g) => g.contours > 0);
  const xMin = Math.min(...inked.map((g) => g.xMin)), yMin = Math.min(...inked.map((g) => g.yMin));
  const xMax = Math.max(...inked.map((g) => g.xMax)), yMax = Math.max(...inked.map((g) => g.yMax));
  const advMax = Math.max(...glyphs.map((g) => g.advance));
  const minRsb = Math.min(...inked.map((g) => g.advance - g.xMax));
  const maxPoints = Math.max(...glyphs.map((g) => g.points));
  const maxContours = Math.max(...glyphs.map((g) => g.contours));

  // head
  const head = new Writer();
  head.u32(0x00010000).u32(0x00010000).u32(0).u32(0x5f0f3cf5);
  head.u16(0x000b).u16(UPM);
  // created / modified: 2026-01-01 as seconds since 1904 (64-bit)
  const t = 3849984000;
  head.u32(0).u32(t).u32(0).u32(t);
  head.i16(xMin).i16(yMin).i16(xMax).i16(yMax);
  head.u16(0).u16(8).i16(2).i16(1).i16(0);

  // hhea
  const hhea = new Writer();
  hhea.u32(0x00010000).i16(ASCENT).i16(-DESCENT).i16(0).u16(advMax).i16(0).i16(minRsb).i16(xMax);
  hhea.i16(1).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).u16(numGlyphs);

  // maxp (TrueType, version 1.0)
  const maxp = new Writer();
  maxp.u32(0x00010000).u16(numGlyphs).u16(maxPoints).u16(maxContours).u16(0).u16(0)
    .u16(2).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0);

  // hmtx
  const hmtx = new Writer();
  for (const g of glyphs) hmtx.u16(g.advance).i16(g.contours ? g.xMin : 0);

  // OS/2 version 4
  const avg = Math.round(glyphs.reduce((s, g) => s + g.advance, 0) / numGlyphs);
  const os2 = new Writer();
  os2.u16(4).i16(avg).u16(400).u16(5).u16(0);
  os2.i16(PX * 4).i16(PX * 4).i16(0).i16(PX).i16(PX * 4).i16(PX * 4).i16(0).i16(PX * 3);
  os2.i16(PX).i16(PX * 3); // strikeout size, position
  os2.i16(0);
  os2.raw([2, 0, 5, 0, 0, 0, 0, 0, 0, 0]); // panose: latin text, book weight
  os2.u32(1).u32(0).u32(0).u32(0);         // unicode ranges: basic latin
  os2.tag('BLKF');
  os2.u16(0x00c0);                         // REGULAR | USE_TYPO_METRICS
  os2.u16(chars[0]).u16(Math.min(0xffff, chars[chars.length - 1]));
  os2.i16(ASCENT).i16(-DESCENT).i16(0);
  os2.u16(ASCENT).u16(DESCENT);
  os2.u32(1).u32(0);
  os2.i16(PX * 5).i16(PX * 7).u16(0).u16(32).u16(1);

  // name
  const names: [number, string][] = [
    [1, 'BlockForge'], [2, 'Regular'], [3, 'BlockForge Regular 1.0'], [4, 'BlockForge Regular'],
    [5, 'Version 1.000'], [6, 'BlockForge-Regular'],
  ];
  const name = new Writer();
  const strings: number[] = [];
  name.u16(0).u16(names.length).u16(6 + names.length * 12);
  for (const [id, s] of names) {
    const enc = utf16be(s);
    name.u16(3).u16(1).u16(0x409).u16(id).u16(enc.length).u16(strings.length);
    strings.push(...enc);
  }
  name.raw(strings);

  // cmap: one format 4 subtable (Windows, Unicode BMP)
  const segs: { start: number; end: number; delta: number }[] = [];
  for (const code of chars) {
    const gid = cmap.get(code)!;
    const last = segs[segs.length - 1];
    if (last && code === last.end + 1 && gid === code + last.delta) last.end = code;
    else segs.push({ start: code, end: code, delta: gid - code });
  }
  segs.push({ start: 0xffff, end: 0xffff, delta: 1 });
  const segCount = segs.length;
  const entrySelector = Math.floor(Math.log2(segCount));
  const searchRange = 2 * (1 << entrySelector);
  const sub = new Writer();
  const subLen = 16 + segCount * 8;
  sub.u16(4).u16(subLen).u16(0).u16(segCount * 2).u16(searchRange).u16(entrySelector).u16(segCount * 2 - searchRange);
  for (const s of segs) sub.u16(s.end);
  sub.u16(0);
  for (const s of segs) sub.u16(s.start);
  for (const s of segs) sub.u16((s.delta + 65536) & 0xffff);
  for (let i = 0; i < segCount; i++) sub.u16(0);
  const cmapT = new Writer();
  cmapT.u16(0).u16(1).u16(3).u16(1).u32(12).raw(sub.out());

  // post version 3 (no glyph names)
  const post = new Writer();
  post.u32(0x00030000).u32(0).i16(-PX).i16(PX).u32(0).u32(0).u32(0).u32(0).u32(0);

  const tables: [string, Uint8Array][] = [
    ['OS/2', os2.out()], ['cmap', cmapT.out()], ['glyf', glyf.out()], ['head', head.out()],
    ['hhea', hhea.out()], ['hmtx', hmtx.out()], ['loca', loca.out()], ['maxp', maxp.out()],
    ['name', name.out()], ['post', post.out()],
  ];
  tables.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

  const numTables = tables.length;
  const es = Math.floor(Math.log2(numTables));
  const sr = 16 * (1 << es);
  const dirLen = 12 + numTables * 16;
  let offset = dirLen;
  const offsets: number[] = [];
  for (const [, d] of tables) { offsets.push(offset); offset += Math.ceil(d.length / 4) * 4; }
  const file = new Uint8Array(offset);
  const dv = new DataView(file.buffer);
  dv.setUint32(0, 0x00010000); dv.setUint16(4, numTables); dv.setUint16(6, sr); dv.setUint16(8, es); dv.setUint16(10, numTables * 16 - sr);
  let headOffset = 0;
  tables.forEach(([tag, d], i) => {
    const r = 12 + i * 16;
    for (let k = 0; k < 4; k++) dv.setUint8(r + k, tag.charCodeAt(k));
    dv.setUint32(r + 4, checksum(d));
    dv.setUint32(r + 8, offsets[i]);
    dv.setUint32(r + 12, d.length);
    file.set(d, offsets[i]);
    if (tag === 'head') headOffset = offsets[i];
  });
  dv.setUint32(headOffset + 8, (0xb1b0afba - checksum(file)) >>> 0);
  return file.buffer;
}

let loading: Promise<void> | null = null;

/** Build the font and register it with the document. Resolves (never rejects), even on failure. */
export function loadPixelFont(): Promise<void> {
  if (loading) return loading;
  loading = new Promise<void>((resolve) => {
    const done = () => resolve();
    try {
      if (typeof FontFace === 'undefined' || !document.fonts) { done(); return; }
      const face = new FontFace('BlockForge', buildFontBinary(), { style: 'normal', weight: '400', display: 'block' });
      const timer = setTimeout(done, 4000);
      face.load().then((f) => {
        document.fonts.add(f);
        document.documentElement.classList.add('bf-font-ready');
      }).catch((e) => {
        console.warn('[font] pixel font rejected, using fallback', e);
      }).then(() => { clearTimeout(timer); done(); });
    } catch (e) {
      console.warn('[font] could not build pixel font', e);
      done();
    }
  });
  return loading;
}

/** Total advance of a string in font pixels (what the browser lays out, incl. trailing spacing). */
export function textAdvance(s: string): number {
  let w = 0;
  for (const ch of s) w += glyphAdvance(ch);
  return w;
}

/**
 * Text to put in a box of `boxWidth` GUI pixels with `text-align: center` so that it lands on
 * whole GUI pixels: when the leftover space is odd, a 1-pixel hair space evens it out.
 */
export function centered(s: string, boxWidth: number): string {
  return ((boxWidth - textAdvance(s)) & 1) ? s + ' ' : s;
}
