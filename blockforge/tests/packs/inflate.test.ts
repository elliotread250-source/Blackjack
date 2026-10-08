// The built-in DEFLATE decoder (used on phones without DecompressionStream('deflate-raw')) must
// match zlib byte for byte. Run:
//   npx esbuild tests/packs/inflate.test.ts --bundle --platform=node --format=esm --outfile=$OUT/inflate.mjs && node $OUT/inflate.mjs
import { deflateRawSync, constants } from 'node:zlib';
import { inflateRaw } from '../../src/blocks/inflate';

let failures = 0, passes = 0;
function check(cond: boolean, msg: string) { if (cond) passes++; else { failures++; console.log('FAIL:', msg); } }

let seed = 12345;
const rand = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };

const samples: Array<[string, Uint8Array]> = [];
samples.push(['empty', new Uint8Array(0)]);
samples.push(['one byte', new Uint8Array([42])]);
const random = new Uint8Array(70000); for (let i = 0; i < random.length; i++) random[i] = (rand() * 256) | 0;
samples.push(['random 70k', random]);
const runs = new Uint8Array(200000); for (let i = 0; i < runs.length; i++) runs[i] = ((i / 1000) | 0) & 3;
samples.push(['long runs', runs]);
const text = new TextEncoder().encode('The quick brown fox jumps over the lazy dog. '.repeat(3000) + 'end');
samples.push(['text', text]);
// a fake 16x16 RGBA tile sheet: small palette, lots of repeats at distance 4 and 64
const tiles = new Uint8Array(1024 * 300);
for (let i = 0; i < tiles.length; i += 4) { const c = (rand() * 6) | 0; tiles[i] = c * 40; tiles[i + 1] = 255 - c * 30; tiles[i + 2] = c * 17; tiles[i + 3] = rand() < 0.1 ? 0 : 255; }
samples.push(['tile-like', tiles]);
// long-distance matches (up to the 32 KB window)
const far = new Uint8Array(100000); for (let i = 0; i < far.length; i++) far[i] = i < 32768 ? (rand() * 256) | 0 : far[i - 32768 + ((i >> 7) & 7)];
samples.push(['far matches', far]);

for (const [name, data] of samples) {
  for (const level of [0, 1, 6, 9]) {
    for (const strategy of [constants.Z_DEFAULT_STRATEGY, constants.Z_FIXED, constants.Z_HUFFMAN_ONLY, constants.Z_RLE]) {
      const packed = new Uint8Array(deflateRawSync(data, { level, strategy }));
      let out: Uint8Array | null = null;
      try { out = inflateRaw(packed, data.length); } catch (e) { check(false, `${name} level ${level} strategy ${strategy}: threw ${e}`); continue; }
      check(out.length === data.length && Buffer.compare(Buffer.from(out), Buffer.from(data)) === 0, `${name} level ${level} strategy ${strategy}: output differs`);
      // also without a size hint (buffer has to grow)
      const grown = inflateRaw(packed);
      check(Buffer.compare(Buffer.from(grown), Buffer.from(data)) === 0, `${name} level ${level} strategy ${strategy}: differs without size hint`);
    }
  }
}

// damaged input must throw, never hang
const good = new Uint8Array(deflateRawSync(text));
let threw = false;
try { inflateRaw(good.subarray(0, good.length >> 1)); } catch { threw = true; }
check(threw, 'truncated stream throws');
threw = false;
try { inflateRaw(new Uint8Array([0xff, 0xff, 0xff, 0xff])); } catch { threw = true; }
check(threw, 'garbage throws');

console.log(failures ? `${failures} FAILED, ${passes} passed` : `ALL PASSED (${passes} checks)`);
process.exit(failures ? 1 : 0);
