#!/usr/bin/env node
/**
 * Generate a text-selectable PDF of the CURB pitch deck via headless Chrome print.
 * Mirrors ishtar-website/scripts/generate-deck-pdf.mjs, but the CURB deck is rendered
 * from a JS function (src/deck.js `deckHtml`) rather than a static index.html.
 *
 * Flow: render deckHtml() → serve it on a local port with a <base> pointing at production
 * (so /assets/* and fonts resolve) → navigate Chrome to `?print=1` → print-to-pdf.
 *
 * Output: public/deck/curb-deck.pdf  (served at /deck.pdf via the Worker asset dir)
 *
 * Usage: node scripts/generate-curb-deck-pdf.mjs   (needs Google Chrome / Chromium; set CHROME_PATH)
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { deckHtml } from "../src/deck.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "deck");
const OUT_PDF = join(OUT_DIR, "curb-deck.pdf");

/** Production origins — Chrome resolves /assets/* and canonical hrefs from here. */
const SITE_ORIGIN = process.env.CURB_SITE_ORIGIN || "https://curb.numetal.xyz";
const API_ORIGIN = process.env.CURB_API_ORIGIN || "https://api.curb.numetal.xyz";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "google-chrome",
  "chromium",
  "chromium-browser",
].filter(Boolean);

function findChrome() {
  for (const bin of CHROME_CANDIDATES) {
    if (bin.includes("/") && existsSync(bin)) return bin;
  }
  return CHROME_CANDIDATES.find((b) => !b.includes("/")) ?? null;
}

function servePage() {
  const html = deckHtml(SITE_ORIGIN, API_ORIGIN);
  const base = `<base href="${SITE_ORIGIN}/" />`;
  const withBase = html.includes("<base ")
    ? html.replace(/<base[^>]*>/i, base)
    : html.replace(/<head([^>]*)>/i, `<head$1>\n${base}`);
  return createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(withBase);
  });
}

function runChrome(chrome, url, outPath) {
  return new Promise((resolve, reject) => {
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--run-all-compositor-stages-before-draw",
      "--virtual-time-budget=15000",
      `--print-to-pdf=${outPath}`,
      "--print-to-pdf-no-header",
      url,
    ];
    const proc = spawn(chrome, args, { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Chrome exited ${code}`))));
  });
}

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    console.error("✘ Chrome/Chromium not found. Set CHROME_PATH or install Google Chrome.");
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });

  const server = servePage();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/?print=1`;

  console.log(`→ Printing CURB deck via ${chrome}`);
  console.log(`→ ${url}  (assets/base → ${SITE_ORIGIN})`);
  await runChrome(chrome, url, OUT_PDF);
  server.close();

  const { size } = await stat(OUT_PDF);
  console.log(`✓ PDF written: ${OUT_PDF} (${Math.round(size / 1024)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
