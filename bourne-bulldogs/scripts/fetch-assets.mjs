#!/usr/bin/env node
/**
 * Pulls every image off the old Squarespace site and self-hosts it.
 *
 * Squarespace URLs die the day the subscription is cancelled, so nothing on
 * the new site may point at them. This script:
 *   1. downloads every known image at full size (no ?format= query)
 *   2. scrapes the live pages for any image we didn't know about
 *   3. writes optimised copies to public/images (max 2400px, q82)
 *   4. keys white backgrounds out of the logos into transparent PNGs
 *   5. builds the on-dark logo and favicon set (scripts/brand-logos.mjs)
 *   6. extracts the brand palette from the logo
 *   7. writes src/content/image-manifest.json (sizes + blur placeholders)
 *
 * Originals land in assets-original/ which is gitignored, so anything over
 * 2MB stays out of the repo. Failures are logged and written to
 * scripts/fetch-report.json; the script never skips one silently.
 *
 * Run: node scripts/fetch-assets.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import sharp from "sharp";
import { buildBrandLogos } from "./brand-logos.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGINALS = path.join(ROOT, "assets-original");
const OUT = path.join(ROOT, "public", "images");
const PUBLIC = path.join(ROOT, "public");
const APP = path.join(ROOT, "src", "app");
const MANIFEST = path.join(ROOT, "src", "content", "image-manifest.json");
const REPORT = path.join(ROOT, "scripts", "fetch-report.json");
const PALETTE = path.join(ROOT, "scripts", "brand-colours.json");
const SCRAPED = path.join(ROOT, "scripts", "scraped");

const CDN = "https://images.squarespace-cdn.com/content/v1/66f91049ef03385d7b026846";
const SITE = "https://www.bournebulldogs.com";
const PAGES = ["/", "/about", "/cluboverview", "/merch", "/contact"];

/** Every image we already know about, with the filename it should live at. */
const IMAGES = [
  // Logos
  [`${CDN}/7f72d62b-49f2-4db5-bcf4-e53b118bc53b/Bulldog+logo.png`, "logo-main.png"],
  [`${CDN}/cfe1905b-8037-4dca-b1f8-24b897b366ca/Bulldog+logo.png`, "logo-alt.png"],
  [`${CDN}/fd3b0f16-a3ae-4279-9d20-eaccee0d4066/Bulldog+logowhite.jpg`, "logo-white.jpg"],
  [`${CDN}/195c09cb-f235-4413-9417-17f156f8b74e/Bulldog+logo.png`, "logo-footer.png"],
  [`${CDN}/f6b8e2c8-69d5-488b-ba1e-54fbcb767178/Bulldog+logo.png`, "logo-merch.png"],
  ["http://static1.squarespace.com/static/66f91049ef03385d7b026846/t/66fab629618ece71b4a31c6c/1727706665898/Bulldog+logo.png", "og-logo.png"],
  // Training / action
  [`${CDN}/bf1045b0-c2d9-46eb-b200-12be51f6747b/67DBD2DA-CA83-4A4E-ADCC-3230BFE87D10_1_201_a.jpeg`, "training-gym-wide.jpg"],
  [`${CDN}/cd43b917-cd72-407d-b8a4-c5968b527764/7EC2BA00-FF94-4803-A377-DEDB439F8539_1_201_a.jpeg`, "jump-ball.jpg"],
  [`${CDN}/51dece96-403a-45d0-bc4b-2d952fe95d28/B69888AE-3A5B-4F32-B303-945BA14D9FCB_1_201_a.jpg`, "game-action-1.jpg"],
  [`${CDN}/7a76eaea-0dbd-4354-9691-f02a744dacee/B69888AE-3A5B-4F32-B303-945BA14D9FCB_1_201_a.jpeg`, "game-action-2.jpg"],
  [`${CDN}/d5f4e487-8f79-4582-ad56-ac800fd4ad93/C4D75676-781C-4FD5-8B41-428719C0EDEA_1_201_a.jpeg`, "drill.jpg"],
  [`${CDN}/050ee881-525e-40a7-8830-00336abe0631/8D79177A-3240-4F67-A695-908908156912_1_201_a.jpeg`, "coach-shooting-demo.jpg"],
  [`${CDN}/140901fe-92ca-42a5-be9e-b41613d93d49/Bourne+Bulldogs+being+coached+picture.jpeg`, "timeout-huddle.jpg"],
  [`${CDN}/e76f28ec-33c6-4371-9cd9-aa875fb2b729/PLayer+shooting+ball.jpeg`, "player-shooting.jpg"],
  [`${CDN}/900fb916-6c29-4d67-855c-1c83be6d38a6/Player+dribbling+ball+image+2.jpeg`, "player-dribbling-2.jpg"],
  [`${CDN}/d3af1749-f867-41bd-b1c4-4edbc1baa3aa/Player+dribbling+ball+picture.jpeg`, "player-dribbling-1.jpg"],
  [`${CDN}/a75ee511-e9ec-4654-b642-a05ba68615aa/Bourne+Bulldogs+tournament+team+picture.jpeg`, "tournament-team.jpg"],
  [`${CDN}/1729443605995-MU5X6SIHU4QIGLFOZX5X/unsplash-image-ZDmbF9hxaFE.jpg`, "bg-court-texture.jpg"],
  // Team
  [`${CDN}/f4d7c81d-2034-4afc-bf28-b2c2f607f47a/Martin+2.jpeg`, "team-martin.jpg"],
  [`${CDN}/aa58b202-73f6-493e-be54-eda7238d3d12/Elliot2.jpeg`, "team-elliot.jpg"],
  [`${CDN}/e9036028-8d6b-4d31-8a58-84dadc78bef7/willow.jpeg`, "team-willow.jpg"],
  // Merch
  [`${CDN}/2590e2d9-f079-4500-8bfb-2bd9161db0a5/T+shirt+front.jpeg`, "merch-kids-tee-front.jpg"],
  [`${CDN}/9ae5bc2c-3102-4d4e-aa0b-8641158eb845/T+shirt+back.jpeg`, "merch-kids-tee-back.jpg"],
  [`${CDN}/44929b2f-1d41-4506-bf9a-c4ceaa0f7359/Kids+sports+shirt+sizing+-+Charcol.png`, "size-kids-tee.png"],
  [`${CDN}/b1f67d1c-250b-49fe-901b-dfc5f8363934/Adult+t-shirt+front.jpeg`, "merch-adult-tee-front.jpg"],
  [`${CDN}/1db9cdb0-57e2-4afc-b772-4671647010e9/Adult+t-shirt+back.jpeg`, "merch-adult-tee-back.jpg"],
  [`${CDN}/73bdb480-42b6-4f4e-925e-af293fb8a104/Adult+t-shirt+sizing.png`, "size-adult-tee.png"],
  [`${CDN}/36212f66-6336-4565-ac3c-aca58408dbde/Kids+hoody+front.jpeg`, "merch-kids-hoody-front.jpg"],
  [`${CDN}/c2c0ed02-b6cd-44de-b39f-4d0603ad8853/Kids+hoody+back.jpeg`, "merch-kids-hoody-back.jpg"],
  [`${CDN}/81fff584-dd66-4b49-8d5d-54a79acadd57/Kids+hoody+-+sizing.png`, "size-kids-hoody.png"],
  [`${CDN}/18d77820-66c0-4d6d-85de-f107523ddbc2/Adult+hoody+front+%28ash%29.jpeg`, "merch-adult-hoody-front.jpg"],
  [`${CDN}/572f4b8f-e4aa-48e0-b48c-9567557dccac/Adult+hoody+back+-+ash.jpeg`, "merch-adult-hoody-back.jpg"],
  [`${CDN}/9cb0734b-a01c-4b99-b6bd-7043f0de6225/Adult+hoody+-+sizing.png`, "size-adult-hoody.png"],
];

/** Images found on the live site that deserve a real name. Keyed by Squarespace asset id. */
const EXTRA_NAMES = {
  "ce361099-84be-4ab7-bd1a-2e01cc37b05e": "basketball-england-badge.jpg",
};

const LOGOS = ["logo-main.png", "logo-alt.png", "logo-white.jpg", "logo-footer.png", "logo-merch.png", "og-logo.png"];

const report = { startedAt: new Date().toISOString(), downloaded: [], failed: [], duplicates: [], extras: [], logos: {}, pages: {} };
/** sha1 -> first filename with those bytes, so identical files are only kept once. */
const hashes = new Map();

/** Squarespace serves the original when there's no ?format= query. */
function clean(url) {
  const u = new URL(url.replace(/^http:/, "https:"));
  u.search = "";
  u.hash = "";
  return u.toString();
}

/** Same asset, different filename spelling? Compare by the asset's UUID folder. */
function assetKey(url) {
  const u = new URL(clean(url));
  const parts = u.pathname.split("/").filter(Boolean);
  // /content/v1/<site>/<asset-id>/<file>  or  /static/<site>/t/<asset-id>/<ts>/<file>
  if (parts[0] === "content") return parts[3];
  if (parts[0] === "static") return parts[3];
  return u.pathname;
}

async function get(url, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BourneBulldogsAssetFetch/1.0)" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      last = err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw last;
}

async function download(url, name) {
  const src = clean(url);
  try {
    const res = await get(src);
    const buf = Buffer.from(await res.arrayBuffer());
    const sha = crypto.createHash("sha1").update(buf).digest("hex");
    if (hashes.has(sha)) {
      report.duplicates.push({ name, url: src, duplicateOf: hashes.get(sha) });
      console.log(`  dup  ${name} is byte-identical to ${hashes.get(sha)}, not stored twice`);
      return null;
    }
    hashes.set(sha, name);
    await fs.writeFile(path.join(ORIGINALS, name), buf);
    report.downloaded.push({ name, url: src, bytes: buf.length });
    console.log(`  ok   ${name} (${(buf.length / 1024).toFixed(0)} KB)`);
    return buf;
  } catch (err) {
    report.failed.push({ name, url: src, error: String(err?.message || err) });
    console.error(`  FAIL ${name}: ${err?.message || err}  <- ${src}`);
    return null;
  }
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** Pull image URLs plus readable text out of each live page. */
async function scrapePages() {
  const found = new Map();
  for (const p of PAGES) {
    try {
      const res = await get(SITE + p);
      const html = await res.text();
      const urls = new Set();
      const re = /(https?:)?\/\/(images\.squarespace-cdn\.com|static1\.squarespace\.com)\/[^"'\s)<>,]+/g;
      for (const m of html.matchAll(re)) {
        let u = m[0].startsWith("//") ? "https:" + m[0] : m[0];
        u = decodeEntities(u);
        if (!/\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(u)) continue;
        urls.add(clean(u));
      }
      for (const u of urls) if (!found.has(assetKey(u))) found.set(assetKey(u), { url: u, page: p });

      const title = decodeEntities(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "");
      const description = decodeEntities(
        html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)?.[1] ?? ""
      );
      const alts = [...html.matchAll(/alt="([^"]*)"/g)].map((m) => decodeEntities(m[1])).filter(Boolean);
      const text = decodeEntities(
        html
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<(br|\/p|\/h\d|\/li|\/div)[^>]*>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
      )
        .split("\n")
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join("\n");
      const slug = p === "/" ? "home" : p.slice(1);
      await fs.writeFile(
        path.join(SCRAPED, `${slug}.txt`),
        `URL: ${SITE + p}\nTITLE: ${title}\nDESCRIPTION: ${description}\nALTS:\n${alts.map((a) => "  - " + a).join("\n")}\n\n${text}\n`
      );
      report.pages[p] = { ok: true, title, description, images: urls.size };
      console.log(`  page ${p}: ${urls.size} images, title "${title}"`);
    } catch (err) {
      report.pages[p] = { ok: false, error: String(err?.message || err) };
      console.error(`  FAIL page ${p}: ${err?.message || err}`);
    }
  }
  return found;
}

function kebab(s) {
  return s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/\+/g, "-")
    .replace(/%[0-9a-f]{2}/gi, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Resize to max 2400 on the long edge and re-encode at q82. */
async function optimise(name) {
  const input = path.join(ORIGINALS, name);
  const output = path.join(OUT, name);
  const img = sharp(input, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  const pipeline = img.resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true });
  if (/\.png$/i.test(name)) {
    await pipeline.png({ compressionLevel: 9, palette: false, quality: 82 }).toFile(output);
  } else {
    await pipeline.jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(output);
  }
  const out = await sharp(output).metadata();
  return { srcWidth: meta.width, srcHeight: meta.height, width: out.width, height: out.height, hasAlpha: out.hasAlpha };
}

async function blurFor(file) {
  const buf = await sharp(file).resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

/**
 * Average colour of the outer 2px border, plus how much of it is transparent.
 * Tells us whether a logo sits on a solid white box we need to remove.
 */
async function borderStats(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let r = 0, g = 0, b = 0, n = 0, clear = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x > 1 && y > 1 && x < w - 2 && y < h - 2) continue;
      const i = (y * w + x) * 4;
      if (data[i + 3] < 16) { clear++; continue; }
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
  }
  const total = n + clear;
  return { r: r / (n || 1), g: g / (n || 1), b: b / (n || 1), clearRatio: clear / total };
}

/**
 * Remove a white background by flood-filling from the edges, so white
 * *inside* the logo (eyes, teeth, lettering) survives. Pixels near the fill
 * boundary get a soft alpha so edges don't look jagged.
 */
async function keyOutWhite(file, outFile) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const isWhite = (i) => data[i] > 232 && data[i + 1] > 232 && data[i + 2] > 232;
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    const i = p * 4;
    if (!isWhite(i) && data[i + 3] > 16) continue;
    seen[p] = 1;
    const x = p % w, y = (p - x) / w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  let removed = 0;
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (seen[p]) { data[i + 3] = 0; removed++; continue; }
    // Feather: a non-filled pixel touching the fill gets alpha by how far it is from white.
    const x = p % w, y = (p - x) / w;
    const touches = (x > 0 && seen[p - 1]) || (x < w - 1 && seen[p + 1]) || (y > 0 && seen[p - w]) || (y < h - 1 && seen[p + w]);
    if (touches) {
      const lightness = Math.min(data[i], data[i + 1], data[i + 2]);
      if (lightness > 180) data[i + 3] = Math.round(data[i + 3] * (1 - (lightness - 180) / 75));
    }
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 1 })
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(outFile);
  return removed / (w * h);
}

const hex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** Dominant colours: bucket opaque pixels into 4-bit-per-channel bins, merge near neighbours. */
async function palette(file) {
  const { data } = await sharp(file).resize(240, 240, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bins = new Map();
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bin = bins.get(key) || { r: 0, g: 0, b: 0, n: 0 };
    bin.r += r; bin.g += g; bin.b += b; bin.n++;
    bins.set(key, bin);
    total++;
  }
  const sorted = [...bins.values()].map((b) => ({ r: b.r / b.n, g: b.g / b.n, b: b.b / b.n, n: b.n })).sort((a, b) => b.n - a.n);
  const merged = [];
  for (const c of sorted) {
    const near = merged.find((m) => Math.hypot(m.r - c.r, m.g - c.g, m.b - c.b) < 48);
    if (near) {
      const n = near.n + c.n;
      near.r = (near.r * near.n + c.r * c.n) / n;
      near.g = (near.g * near.n + c.g * c.n) / n;
      near.b = (near.b * near.n + c.b * c.n) / n;
      near.n = n;
    } else merged.push({ ...c });
  }
  return merged
    .sort((a, b) => b.n - a.n)
    .slice(0, 10)
    .map((c) => ({ hex: hex(c.r, c.g, c.b), share: +(c.n / total).toFixed(4) }));
}

async function main() {
  await Promise.all([ORIGINALS, OUT, SCRAPED, APP, path.dirname(MANIFEST)].map((d) => fs.mkdir(d, { recursive: true })));

  console.log("Scraping live pages for extra images and copy...");
  const live = await scrapePages();

  console.log("\nDownloading known images...");
  const known = new Set(IMAGES.map(([u]) => assetKey(u)));
  for (const [url, name] of IMAGES) await download(url, name);

  const extras = [...live.values()].filter((e) => !known.has(assetKey(e.url)));
  if (extras.length) console.log(`\nDownloading ${extras.length} extra image(s) found on the live site...`);
  for (const e of extras) {
    const file = path.basename(new URL(e.url).pathname);
    const ext = /\.png$/i.test(file) ? ".png" : ".jpg";
    if (/\.(svg|gif)$/i.test(file)) {
      report.extras.push({ ...e, skipped: "svg/gif not optimised, check by hand" });
      continue;
    }
    const name = EXTRA_NAMES[assetKey(e.url)] ?? `extra-${kebab(decodeURIComponent(file))}-${assetKey(e.url).slice(0, 6)}${ext}`;
    const ok = await download(e.url, name);
    report.extras.push({ ...e, name, ok: !!ok, duplicate: !ok && report.duplicates.some((d) => d.name === name) });
    if (ok) IMAGES.push([e.url, name]);
  }

  console.log("\nOptimising...");
  const manifest = {};
  for (const [, name] of IMAGES) {
    try {
      await fs.access(path.join(ORIGINALS, name));
    } catch {
      continue;
    }
    try {
      const info = await optimise(name);
      manifest[name] = { width: info.width, height: info.height, blurDataURL: await blurFor(path.join(OUT, name)) };
      console.log(`  ${name}: ${info.srcWidth}x${info.srcHeight} -> ${info.width}x${info.height}`);
    } catch (err) {
      report.failed.push({ name, stage: "optimise", error: String(err?.message || err) });
      console.error(`  FAIL optimise ${name}: ${err?.message || err}`);
    }
  }

  console.log("\nChecking logos for solid backgrounds...");
  for (const name of LOGOS) {
    const file = path.join(OUT, name);
    try {
      await fs.access(file);
    } catch {
      continue;
    }
    const s = await borderStats(file);
    const whiteBox = s.clearRatio < 0.5 && s.r > 225 && s.g > 225 && s.b > 225;
    const entry = { border: hex(s.r, s.g, s.b), transparentBorder: +s.clearRatio.toFixed(2), whiteBackground: whiteBox };
    if (whiteBox) {
      const outName = name.replace(/\.(png|jpe?g)$/i, "-transparent.png");
      const removed = await keyOutWhite(file, path.join(OUT, outName));
      const meta = await sharp(path.join(OUT, outName)).metadata();
      manifest[outName] = { width: meta.width, height: meta.height, blurDataURL: await blurFor(path.join(OUT, outName)) };
      entry.transparentVersion = outName;
      entry.removedRatio = +removed.toFixed(3);
      console.log(`  ${name}: white background keyed out -> ${outName} (${(removed * 100).toFixed(0)}% removed)`);
    } else {
      console.log(`  ${name}: border ${entry.border}, ${(s.clearRatio * 100).toFixed(0)}% transparent, left as is`);
    }
    report.logos[name] = entry;
  }

  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

  try {
    await fs.access(path.join(OUT, "logo-main.png"));
    console.log("\nBuilding on-dark logo and favicons...");
    await buildBrandLogos();

    console.log("\nExtracting brand palette...");
    const colours = {};
    for (const n of ["logo-main.png", "merch-adult-tee-front.jpg", "merch-kids-hoody-front.jpg"]) {
      try {
        await fs.access(path.join(OUT, n));
        colours[n] = await palette(path.join(OUT, n));
        console.log(`  ${n}: ${colours[n].map((c) => `${c.hex} ${(c.share * 100).toFixed(1)}%`).join(", ")}`);
      } catch {}
    }
    await fs.writeFile(PALETTE, JSON.stringify(colours, null, 2) + "\n");
  } catch {
    report.failed.push({ name: "favicons", error: "logo-main.png missing, favicon set and palette not generated" });
  }

  report.finishedAt = new Date().toISOString();
  await fs.writeFile(REPORT, JSON.stringify(report, null, 2) + "\n");

  console.log(`\nDone: ${report.downloaded.length} downloaded, ${report.duplicates.length} duplicates skipped, ${report.failed.length} failed, ${report.extras.length} extra found.`);
  if (report.failed.length) {
    console.error("\nFAILED:");
    for (const f of report.failed) console.error(`  - ${f.name}: ${f.error}${f.url ? "  <- " + f.url : ""}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
