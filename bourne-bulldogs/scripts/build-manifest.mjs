#!/usr/bin/env node
/**
 * Rebuilds src/content/image-manifest.json (width, height, blur placeholder)
 * from whatever is in public/images. Runs before every build, so swapping a
 * photo for one with a different shape just works.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "images");
const MANIFEST = path.join(ROOT, "src", "content", "image-manifest.json");

const files = (await fs.readdir(DIR)).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort();
const manifest = {};
for (const f of files) {
  const file = path.join(DIR, f);
  const meta = await sharp(file).rotate().metadata();
  const swap = meta.orientation && meta.orientation >= 5;
  const blur = await sharp(file).rotate().resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
  manifest[f] = {
    width: swap ? meta.height : meta.width,
    height: swap ? meta.width : meta.height,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}
await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`image manifest: ${files.length} images`);
