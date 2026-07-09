#!/usr/bin/env node
/**
 * Render CURB launch OG (1500×600 / 5:2 B&W) via headless Chrome screenshot.
 * Outputs:
 *   public/assets/og-curb-launch.png
 *   assets/curb-og-5x2.png
 *   ~/.cursor/projects/.../assets/curb-og-5x2.png (clickable local copy)
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { copyFile, mkdir, readFile, chmod, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OG_HTML = join(__dirname, "og/curb-launch.html");
const OUT_PUBLIC = join(ROOT, "public/assets/og-curb-launch.png");
const OUT_ASSETS = join(ROOT, "assets/curb-og-5x2.png");
const OUT_CURSOR = join(
  homedir(),
  ".cursor/projects/Users-gokhanturhan-Obsidian-zettelkasten/assets/curb-og-5x2.png"
);

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".css": "text/css",
};

function serve() {
  return createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(req.url?.split("?")[0] || "/");
      let file;
      if (path === "/" || path === "/og.html") file = OG_HTML;
      else if (path.startsWith("/assets/")) {
        const name = path.slice("/assets/".length);
        const candidates = [join(ROOT, "assets", name), join(ROOT, "public/assets", name)];
        file = candidates.find((c) => existsSync(c)) || candidates[0];
      } else {
        file = join(__dirname, "og", path.replace(/^\//, ""));
      }
      if (!existsSync(file)) {
        res.writeHead(404);
        res.end("not found " + path);
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });
}

function runChrome(url, outPath) {
  return new Promise((resolve, reject) => {
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--screenshot=${outPath}`,
      "--window-size=1500,600",
      "--default-background-color=00000000",
      url,
    ];
    const child = spawn(CHROME, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => {
      err += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0 && existsSync(outPath)) resolve();
      else reject(new Error(`chrome exit ${code}: ${err.slice(-500)}`));
    });
  });
}

async function main() {
  if (!existsSync(CHROME)) throw new Error(`Chrome not found: ${CHROME}`);
  await mkdir(join(ROOT, "public/assets"), { recursive: true });
  await mkdir(join(ROOT, "assets"), { recursive: true });
  await mkdir(dirname(OUT_CURSOR), { recursive: true });

  const server = serve();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/og.html`;
  const tmp = join(ROOT, "assets/.og-tmp.png");
  try {
    await runChrome(url, tmp);
    await copyFile(tmp, OUT_PUBLIC);
    await copyFile(tmp, OUT_ASSETS);
    await copyFile(tmp, OUT_CURSOR);
    await chmod(OUT_CURSOR, 0o644);
    await chmod(OUT_PUBLIC, 0o644);
    await chmod(OUT_ASSETS, 0o644);
    // drop tmp
    await writeFile(tmp + ".done", "");
    const { unlink } = await import("node:fs/promises");
    await unlink(tmp).catch(() => {});
    await unlink(tmp + ".done").catch(() => {});
    console.log("wrote", OUT_PUBLIC);
    console.log("wrote", OUT_ASSETS);
    console.log("wrote", OUT_CURSOR);
  } finally {
    server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
