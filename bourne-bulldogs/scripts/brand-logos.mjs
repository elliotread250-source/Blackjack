#!/usr/bin/env node
/**
 * Derived logo files, built from public/images/logo-main.png:
 *
 *   logo-on-dark.png  the club badge with its black ring lettering turned bone,
 *                     so "BASKETBALL CLUB" stays readable on the dark site
 *   logo-ball.png     just the bulldog-in-the-ball centre, for tiny sizes
 *   favicon set       favicon.ico (16/32/48), 16/32 PNGs, apple-touch-icon,
 *                     192/512 and a maskable 512 for the web manifest
 *
 * The bulldog's own black outlines sit inside the ball and are left alone;
 * only dark pixels outside the ball's outline ring get recoloured.
 *
 * Run: node scripts/brand-logos.mjs   (fetch-assets.mjs also calls it)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "images");
const PUBLIC = path.join(ROOT, "public");
const APP = path.join(ROOT, "src", "app");
const MANIFEST = path.join(ROOT, "src", "content", "image-manifest.json");

const BONE = [242, 236, 225];
const CHARCOAL = { r: 20, g: 20, b: 22, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

const isOrange = (r, g, b) => r > 170 && g > 60 && g < 140 && b < 90;
const isDark = (r, g, b) => r < 90 && g < 90 && b < 90;

/** ICO that embeds PNGs (supported by every browser that matters). */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, buf }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
}

async function square(input, size, background, padding) {
  const inner = Math.round(size * (1 - padding * 2));
  const fitted = await sharp(input).resize(inner, inner, { fit: "contain", background: CLEAR }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: fitted, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function blur(file) {
  const buf = await sharp(file).resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

export async function buildBrandLogos() {
  const src = path.join(OUT, "logo-main.png");
  // Work at 1200px: plenty for a nav badge and the OG card, a fraction of the bytes.
  const base = await sharp(src).trim({ threshold: 10 }).resize(1200, 1200, { fit: "contain", background: CLEAR }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = base;
  const { width: w, height: h } = info;

  // Ball centre and radius. The dog's head covers the top of the ball, so an
  // average of orange pixels sits too low; fit from the left, right and bottom
  // edges instead (percentiles so stray orange in the lettering doesn't count).
  const xs = [], ys = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (data[i + 3] > 200 && isOrange(data[i], data[i + 1], data[i + 2])) { xs.push(x); ys.push(y); }
  }
  xs.sort((a, b) => a - b);
  ys.sort((a, b) => a - b);
  const pct = (arr, q) => arr[Math.min(arr.length - 1, Math.floor(arr.length * q))];
  const x0 = pct(xs, 0.001), x1 = pct(xs, 0.999), y1 = pct(ys, 0.999);
  const ballR = Math.round((x1 - x0) / 2);
  const cx = (x0 + x1) / 2, cy = y1 - ballR;

  // Walk outward from the ball edge until the dark outline ring ends.
  let ringEnd = ballR;
  for (let r = ballR; r < ballR * 1.25; r++) {
    let dark = 0, samples = 0;
    for (let a = 0; a < 360; a += 2) {
      const x = Math.round(cx + r * Math.cos((a * Math.PI) / 180));
      const y = Math.round(cy + r * Math.sin((a * Math.PI) / 180));
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = (y * w + x) * 4;
      samples++;
      if (data[i + 3] > 128 && isDark(data[i], data[i + 1], data[i + 2])) dark++;
    }
    if (dark / samples < 0.5) { ringEnd = r; break; }
  }
  console.log(`  ball centre ${cx.toFixed(0)},${cy.toFixed(0)}  radius ${ballR}  outline ends ${ringEnd}`);

  // logo-on-dark: recolour dark lettering outside the ring.
  const dark = Buffer.from(data);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (dark[i + 3] === 0) continue;
    if (Math.hypot(x - cx, y - cy) <= ringEnd + 1) continue;
    const r = dark[i], g = dark[i + 1], b = dark[i + 2];
    // Treat anything darker than mid grey and low in saturation as "black ink".
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max < 120 && max - min < 40) {
      const t = 1 - max / 120; // anti-aliased edges blend toward bone smoothly
      dark[i] = Math.round(r + (BONE[0] - r) * t);
      dark[i + 1] = Math.round(g + (BONE[1] - g) * t);
      dark[i + 2] = Math.round(b + (BONE[2] - b) * t);
    }
  }
  await sharp(dark, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(OUT, "logo-on-dark.png"));

  // logo-ball: crop to the ball plus its outline.
  const pad = Math.round(ringEnd * 1.02);
  const left = Math.max(0, Math.round(cx - pad)), top = Math.max(0, Math.round(cy - pad));
  const side = Math.min(pad * 2, w - left, h - top);
  const ballBuf = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).extract({ left, top, width: side, height: side }).png().toBuffer();
  // Mask to a circle so the ring lettering that pokes into the crop corners disappears.
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}"><circle cx="${side / 2}" cy="${side / 2}" r="${side / 2}" fill="#fff"/></svg>`);
  // sharp resizes before it composites within one pipeline, so mask first, then resize.
  const masked = await sharp(ballBuf).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const ball = await sharp(masked).resize(600, 600).png({ compressionLevel: 9 }).toBuffer();
  await fs.writeFile(path.join(OUT, "logo-ball.png"), ball);

  // Favicons: the ball reads at 16px, the full badge doesn't.
  for (const [file, size] of [["favicon-16x16.png", 16], ["favicon-32x32.png", 32]]) {
    await fs.writeFile(path.join(PUBLIC, file), await square(ball, size, CLEAR, 0));
  }
  const darkPng = await sharp(dark, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  await fs.writeFile(path.join(PUBLIC, "icon-192.png"), await square(darkPng, 192, CHARCOAL, 0.06));
  await fs.writeFile(path.join(PUBLIC, "icon-512.png"), await square(darkPng, 512, CHARCOAL, 0.06));
  await fs.writeFile(path.join(PUBLIC, "icon-maskable-512.png"), await square(darkPng, 512, CHARCOAL, 0.16));
  // iOS fills transparency with black and rounds the corners itself.
  await fs.writeFile(path.join(PUBLIC, "apple-touch-icon.png"), await square(darkPng, 180, CHARCOAL, 0.08));
  await fs.writeFile(
    path.join(APP, "favicon.ico"),
    buildIco([
      { size: 16, buf: await square(ball, 16, CLEAR, 0) },
      { size: 32, buf: await square(ball, 32, CLEAR, 0) },
      { size: 48, buf: await square(ball, 48, CLEAR, 0) },
    ])
  );

  // Register the new files in the image manifest.
  let manifest = {};
  try { manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8")); } catch {}
  for (const name of ["logo-on-dark.png", "logo-ball.png"]) {
    const meta = await sharp(path.join(OUT, name)).metadata();
    manifest[name] = { width: meta.width, height: meta.height, blurDataURL: await blur(path.join(OUT, name)) };
  }
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildBrandLogos().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
