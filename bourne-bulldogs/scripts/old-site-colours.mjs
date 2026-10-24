#!/usr/bin/env node
/**
 * Records the old Squarespace site's colour scheme so the new site can match
 * it: Squarespace theme variables, the computed colours of the main page
 * elements (ranked by how much screen area uses them), and screenshots.
 * Needs Playwright and open internet, so it runs on GitHub Actions.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "scripts", "scraped", "old-site");
const SITE = "https://www.bournebulldogs.com";
const PAGES = ["/", "/about", "/cluboverview", "/merch", "/contact"];

await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const report = {};

for (const [label, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport });
  for (const p of PAGES) {
    const slug = p === "/" ? "home" : p.slice(1);
    await page.goto(SITE + p, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1500);
    // Scroll through so lazy sections render before we measure.
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 600) {
      await page.evaluate((y) => scrollTo(0, y), y);
      await page.waitForTimeout(80);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `${slug}-${label}.jpg`), fullPage: true, type: "jpeg", quality: 70 });

    if (label !== "desktop") continue;
    report[p] = await page.evaluate(() => {
      const toHex = (c) => {
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (!m) return c;
        const [r, g, b, a = "1"] = m[1].split(/[ ,/]+/).filter(Boolean);
        if (Number(a) === 0) return "transparent";
        return "#" + [r, g, b].map((v) => Math.round(Number(v)).toString(16).padStart(2, "0")).join("") + (Number(a) < 1 ? ` @${a}` : "");
      };
      // Squarespace 7.1 exposes its theme palette as CSS custom properties.
      const vars = {};
      for (const sheet of document.styleSheets) {
        let rules;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const r of rules) {
          if (!r.style) continue;
          for (const prop of r.style) {
            if (prop.startsWith("--") && /color|colour|background|accent|button|text|heading|paragraph|link|safe|light|dark/i.test(prop)) {
              const v = r.style.getPropertyValue(prop).trim();
              if (v && !vars[prop]) vars[prop] = v;
            }
          }
        }
      }
      const area = {}, text = {}, samples = [];
      const add = (map, key, n) => { if (key && key !== "transparent") map[key] = (map[key] || 0) + n; };
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        add(area, toHex(cs.backgroundColor), r.width * r.height);
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (own) add(text, toHex(cs.color), el.textContent.trim().length);
      }
      const pick = (sel, n = 4) =>
        [...document.querySelectorAll(sel)].slice(0, n).map((el) => {
          const cs = getComputedStyle(el);
          return { text: el.textContent.trim().slice(0, 40), color: toHex(cs.color), background: toHex(cs.backgroundColor), border: toHex(cs.borderTopColor), font: cs.fontFamily.split(",")[0] };
        });
      // Effective background of each top-level section (walk up past transparent ones).
      const sectionBgs = [...document.querySelectorAll("section, header, footer, .page-section, #footer-sections")].slice(0, 20).map((el) => {
        let n = el, bg = "transparent";
        while (n && bg === "transparent") { bg = toHex(getComputedStyle(n).backgroundColor); n = n.parentElement; }
        return { tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60), theme: el.getAttribute("data-section-theme") || "", background: bg };
      });
      const sort = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => ({ colour: k, weight: Math.round(v) }));
      return {
        body: { background: toHex(getComputedStyle(document.body).backgroundColor), color: toHex(getComputedStyle(document.body).color) },
        backgroundsByArea: sort(area),
        textColoursByAmount: sort(text),
        headings: pick("h1, h2, h3"),
        buttons: pick(".sqs-block-button-element, .btn, button, a[class*='button']"),
        links: pick("main a, .sqs-block-content a"),
        header: pick("header, .header", 1),
        footer: pick("footer, #footer-sections", 1),
        sections: sectionBgs,
        themeVariables: vars,
      };
    });
  }
  await page.close();
}
await browser.close();
await fs.writeFile(path.join(OUT, "colours.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).map(([p, r]) => [p, { body: r.body, bg: r.backgroundsByArea.slice(0, 5), text: r.textColoursByAmount.slice(0, 4), buttons: r.buttons.slice(0, 2) }])), null, 1));
