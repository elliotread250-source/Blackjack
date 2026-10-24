#!/usr/bin/env node
/**
 * Makes "blank back" copies of the four merch back photos by lifting the
 * sample READ / 14 print off the fabric, so the order form can print the
 * customer's own surname and number on the real garment photo.
 *
 * How: the print is near-black letters with a grey keyline, so find the
 * big black letter shapes, widen them past the keyline, then fill each row
 * of that area with a blend of the clean fabric either side of it.
 *
 * Where the club's print sits on each photo (used to place the customer's
 * name and number) is recorded by hand in src/content/site.ts.
 *
 * Run: node scripts/blank-backs.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "images");

const BACKS = ["merch-kids-tee-back.jpg", "merch-adult-tee-back.jpg", "merch-kids-hoody-back.jpg", "merch-adult-hoody-back.jpg"];

async function blank(file) {
  const src = path.join(DIR, file);
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const lum = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  const sat = (i) => Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);

  // The print sits in the middle of the back; leave sleeves, hood and hem alone.
  const x0 = Math.round(w * 0.2), x1 = Math.round(w * 0.8);
  const y0 = Math.round(h * 0.1), y1 = Math.round(h * 0.85);

  // 1. Letter fill: near-black, unsaturated pixels (skin and shadows are warmer).
  let ink = new Uint8Array(w * h);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const p = y * w + x, i = p * 3;
    if (lum(i) < 38 && sat(i) < 28) ink[p] = 1;
  }
  // Keep only big connected shapes (the letters); drops armpit shadows and creases.
  {
    const seen = new Uint8Array(w * h);
    const minArea = w * h * 0.0015;
    for (let p0 = 0; p0 < w * h; p0++) {
      if (!ink[p0] || seen[p0]) continue;
      const stack = [p0], comp = [];
      seen[p0] = 1;
      while (stack.length) {
        const p = stack.pop();
        comp.push(p);
        for (const q of [p - 1, p + 1, p - w, p + w]) if (ink[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
      let cx = 0, top = h;
      for (const p of comp) { cx += p % w; top = Math.min(top, Math.floor(p / w)); }
      cx /= comp.length;
      // Letters are big, sit away from the sleeves, and start below the
      // neckline (dark hair at the collar isn't print).
      if (comp.length < minArea || cx < w * 0.3 || cx > w * 0.75 || top < h * 0.15) for (const p of comp) ink[p] = 0;
    }
  }
  // Measure the print before widening it.
  const rowInk = new Array(h).fill(0);
  let bx0 = w, bx1 = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (ink[y * w + x]) { rowInk[y]++; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); }
  const bands = [];
  let on = false, start = 0;
  for (let y = y0; y <= y1; y++) {
    const isInk = rowInk[y] > w * 0.006;
    if (isInk && !on) { on = true; start = y; }
    if (!isInk && on) { on = false; if (y - start > h * 0.025) bands.push([start, y]); }
  }

  // 2. Widen by the outline thickness so the grey keyline goes too.
  const grow = Math.max(6, Math.round(w * 0.024));
  for (let pass = 0; pass < grow; pass++) {
    const next = ink.slice();
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const p = y * w + x;
      if (!ink[p] && (ink[p - 1] || ink[p + 1] || ink[p - w] || ink[p + w])) next[p] = 1;
    }
    ink = next;
  }

  // 3. Normalised blur: average only real fabric pixels (not ink, not the
  //    white studio background), so the fill takes the garment's own shading.
  // A further safety ring that is filled but never sampled, so leftover keyline
  // grey can't bleed back into the fill.
  let halo = ink.slice();
  for (let pass = 0; pass < Math.round(w * 0.012); pass++) {
    const next = halo.slice();
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const p = y * w + x;
      if (!halo[p] && (halo[p - 1] || halo[p + 1] || halo[p - w] || halo[p + w])) next[p] = 1;
    }
    halo = next;
  }
  // Row by row: replace the print span with a blend between the clean fabric
  // just left and right of it. Samples sit right next to the print, so skin
  // and background can't leak in, and the garment's vertical shading survives.
  const out = Buffer.from(data);
  const fill = new Uint8Array(w * h);
  // Fabric is unsaturated grey; skin, background and shadow aren't.
  const isFabric = (i) => sat(i) < 20 && lum(i) > 50 && !(lum(i) > 240);
  const sample = (y, xa, xb) => {
    let r = 0, g = 0, b = 0, n = 0;
    for (let x = Math.max(0, xa); x <= Math.min(w - 1, xb); x++) {
      const i = (y * w + x) * 3;
      if (!isFabric(i)) continue;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
    return n ? [r / n, g / n, b / n] : null;
  };
  for (let y = y0; y < y1; y++) {
    let L = -1, R = -1;
    // Clamp to the letters' own extent (plus keyline) so spans never reach the arms.
    const lo = Math.max(x0, bx0 - grow * 2), hi = Math.min(x1, bx1 + grow * 2);
    for (let x = lo; x < hi; x++) if (halo[y * w + x]) { if (L < 0) L = x; R = x; }
    if (L < 0) continue;
    const pad = Math.round(w * 0.012);
    const left = sample(y, L - pad * 2 - 6, L - 3), right = sample(y, R + 3, R + pad * 2 + 6);
    const a = left ?? right, b = right ?? left;
    if (!a) continue;
    for (let x = L; x <= R; x++) {
      const t = R === L ? 0.5 : (x - L) / (R - L);
      const i = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) out[i + c] = a[c] + (b[c] - a[c]) * t;
      fill[y * w + x] = 1;
    }
  }
  // Smooth vertically inside the patch so neighbouring rows don't streak,
  // then a little grain so it reads as fabric, not airbrush.
  const rad = Math.round(h * 0.012);
  const smooth = Buffer.from(out);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const p = y * w + x;
    if (!fill[p]) continue;
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -rad; dy <= rad; dy++) {
      const q = p + dy * w;
      if (q < 0 || q >= w * h || !fill[q]) continue;
      r += out[q * 3]; g += out[q * 3 + 1]; b += out[q * 3 + 2]; n++;
    }
    const grain = ((p * 2654435761) >>> 0) % 11 - 5;
    smooth[p * 3] = r / n + grain; smooth[p * 3 + 1] = g / n + grain; smooth[p * 3 + 2] = b / n + grain;
  }
  // Feather the patch edge into the real fabric over a few pixels.
  const feather = Math.max(3, Math.round(w * 0.008));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const p = y * w + x;
    if (!fill[p]) continue;
    let d = feather;
    for (let k = 1; k < feather; k++) {
      if (!fill[p - k] || !fill[p + k] || !fill[p - k * w] || !fill[p + k * w]) { d = k; break; }
    }
    if (d >= feather) continue;
    const t = d / feather;
    for (let c = 0; c < 3; c++) smooth[p * 3 + c] = data[p * 3 + c] * (1 - t) + smooth[p * 3 + c] * t;
  }
  out.set(smooth);

  const name = file.replace(".jpg", "-blank.jpg");
  await sharp(out, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(DIR, name));

  const f = (v, d) => +(v / d).toFixed(4);
  const nameBand = bands[0], numBand = bands[bands.length - 1];
  return {
    file: name,
    centerX: f((bx0 + bx1) / 2, w),
    width: f(bx1 - bx0, w),
    name: nameBand && bands.length > 1 ? { top: f(nameBand[0], h), bottom: f(nameBand[1], h) } : null,
    number: numBand ? { top: f(numBand[0], h), bottom: f(numBand[1], h) } : null,
  };
}

const layout = {};
for (const f of BACKS) {
  layout[f] = await blank(f);
  console.log(f, JSON.stringify(layout[f]));
}
