// Raw DEFLATE decoder (RFC 1951) for browsers whose DecompressionStream cannot read zip entries:
// iPhones before iOS 16.4 have no DecompressionStream at all, and Chrome before 103 has one
// without the 'deflate-raw' format. Small and dependency free, after zlib's puff.c; plenty fast
// for the few hundred small PNG entries a resource pack import reads.

const LBASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
const LEXT = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const DBASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
const DEXT = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
const CLORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

/** Canonical Huffman table: how many codes of each length, and the symbols in code order. */
interface Huff { counts: Uint16Array; symbols: Uint16Array }

function huff(lengths: Uint8Array): Huff {
  const counts = new Uint16Array(16);
  const offs = new Uint16Array(16);
  const symbols = new Uint16Array(lengths.length);
  for (let i = 0; i < lengths.length; i++) counts[lengths[i]]++;
  counts[0] = 0;
  for (let i = 1; i < 16; i++) offs[i] = offs[i - 1] + counts[i - 1];
  for (let i = 0; i < lengths.length; i++) if (lengths[i]) symbols[offs[lengths[i]]++] = i;
  return { counts, symbols };
}

let FIXED: { lit: Huff; dist: Huff } | null = null;
function fixed(): { lit: Huff; dist: Huff } {
  if (!FIXED) {
    const l = new Uint8Array(288);
    for (let i = 0; i < 288; i++) l[i] = i < 144 ? 8 : i < 256 ? 9 : i < 280 ? 7 : 8;
    const d = new Uint8Array(30).fill(5);
    FIXED = { lit: huff(l), dist: huff(d) };
  }
  return FIXED;
}

/**
 * Inflate a raw DEFLATE stream. `sizeHint` (the zip's uncompressed size) sizes the output
 * buffer up front; the buffer grows if the hint is missing or wrong.
 */
export function inflateRaw(src: Uint8Array, sizeHint = 0): Uint8Array {
  let pos = 0, bitbuf = 0, bitcnt = 0;
  let out = new Uint8Array(Math.max(64, sizeHint));
  let op = 0;
  const need = (n: number) => {
    if (op + n <= out.length) return;
    const bigger = new Uint8Array(Math.max(out.length * 2, op + n));
    bigger.set(out.subarray(0, op));
    out = bigger;
  };
  const bits = (n: number): number => {
    while (bitcnt < n) {
      if (pos >= src.length) throw new Error('Damaged zip data (ended early).');
      bitbuf |= src[pos++] << bitcnt;
      bitcnt += 8;
    }
    const v = bitbuf & ((1 << n) - 1);
    bitbuf >>>= n;
    bitcnt -= n;
    return v;
  };
  const decode = (h: Huff): number => {
    let code = 0, first = 0, index = 0;
    for (let len = 1; len < 16; len++) {
      code |= bits(1);
      const count = h.counts[len];
      if (code - count < first) return h.symbols[index + (code - first)];
      index += count;
      first = (first + count) << 1;
      code <<= 1;
    }
    throw new Error('Damaged zip data (bad code).');
  };
  const codes = (lit: Huff, dist: Huff) => {
    for (;;) {
      let sym = decode(lit);
      if (sym < 256) { need(1); out[op++] = sym; continue; }
      if (sym === 256) return;
      sym -= 257;
      if (sym >= 29) throw new Error('Damaged zip data (bad length).');
      const len = LBASE[sym] + bits(LEXT[sym]);
      const ds = decode(dist);
      if (ds >= 30) throw new Error('Damaged zip data (bad distance).');
      const d = DBASE[ds] + bits(DEXT[ds]);
      if (d > op) throw new Error('Damaged zip data (distance too far).');
      need(len);
      for (let k = 0; k < len; k++, op++) out[op] = out[op - d];
    }
  };

  let last = 0;
  do {
    last = bits(1);
    const type = bits(2);
    if (type === 0) {
      // stored block: drop the rest of the current byte, then LEN, NLEN and the raw bytes
      bitbuf = 0; bitcnt = 0;
      if (pos + 4 > src.length) throw new Error('Damaged zip data (stored block).');
      const len = src[pos] | (src[pos + 1] << 8);
      pos += 4;
      if (pos + len > src.length) throw new Error('Damaged zip data (stored block).');
      need(len);
      out.set(src.subarray(pos, pos + len), op);
      pos += len; op += len;
    } else if (type === 1) {
      const f = fixed();
      codes(f.lit, f.dist);
    } else if (type === 2) {
      const nlen = bits(5) + 257, ndist = bits(5) + 1, ncode = bits(4) + 4;
      if (nlen > 286 || ndist > 30) throw new Error('Damaged zip data (table size).');
      const cl = new Uint8Array(19);
      for (let i = 0; i < ncode; i++) cl[CLORDER[i]] = bits(3);
      const clh = huff(cl);
      const lens = new Uint8Array(nlen + ndist);
      let i = 0;
      while (i < nlen + ndist) {
        const sym = decode(clh);
        if (sym < 16) { lens[i++] = sym; continue; }
        let len = 0, rep: number;
        if (sym === 16) {
          if (i === 0) throw new Error('Damaged zip data (repeat with nothing before).');
          len = lens[i - 1];
          rep = 3 + bits(2);
        } else if (sym === 17) rep = 3 + bits(3);
        else rep = 11 + bits(7);
        if (i + rep > nlen + ndist) throw new Error('Damaged zip data (too many lengths).');
        while (rep--) lens[i++] = len;
      }
      codes(huff(lens.subarray(0, nlen)), huff(lens.subarray(nlen)));
    } else {
      throw new Error('Damaged zip data (block type).');
    }
  } while (!last);
  return op === out.length ? out : out.slice(0, op);
}
