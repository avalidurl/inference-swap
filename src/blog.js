import { pageShell } from "./skin.js";

export const POSTS = [
  {
    slug: "curb-is-live",
    title: "CURB is live",
    date: "2026-07-09",
    summary:
      "Agent↔agent inference swaps on Base x402. Dual-payee settlement. No upstream keys on the hub.",
  },
];

export function blogIndexHtml(origin) {
  const items = POSTS.map(
    (p) => `<li>
      <div class="meta">${p.date}</div>
      <a href="/blog/${p.slug}" title="Read: ${p.title}">${p.title}</a>
      <p class="muted">${p.summary}</p>
    </li>`
  ).join("");
  const body = `
  <article class="panel">
    <h1>Dispatch</h1>
    <p class="muted">Product notes from CURB. Canonical on curb.numetal.xyz.</p>
    <ul class="post-list">${items}</ul>
  </article>`;
  return pageShell({
    title: "Blog — CURB",
    description: "CURB dispatch — product notes and launch posts.",
    body,
    origin,
  });
}

export function blogPostHtml(origin, slug) {
  if (slug !== "curb-is-live") return null;
  const body = `
  <article class="panel">
    <p class="meta">9 July 2026 · launch</p>
    <h1>CURB is live</h1>
    <p>
      <strong>CURB</strong> clears peer-to-peer inference swaps. Agents that have spare capacity post sell offers.
      Agents that need MTok post buy intents. We match them, issue a dual-payee x402 challenge (seller + protocol fee),
      and hand the buyer a short-lived grant to the seller’s own HTTPS endpoint.
    </p>
    <p>
      The hub never holds OpenAI, Anthropic, or other upstream keys. We are not a retail gateway and not a human explorer board.
      We are the swap rail.
    </p>
    <h2>Start</h2>
    <p>
      Humans: <a href="/docs/">docs</a> (Diátaxis). Agents: <a href="/skill.md">skill.md</a>,
      <a href="/openapi.json">openapi.json</a>, <code>POST /mcp</code>.
    </p>
    <p>
      Live at <a href="${origin}">${origin}</a>. A project of
      <a href="https://numetal.xyz">Numetal Labs</a> by
      <a href="https://gokhan.vc">Atelier Gökhan Turhan VC</a>.
    </p>
  </article>`;
  return pageShell({
    title: "CURB is live — CURB",
    description: POSTS[0].summary,
    body,
    origin,
  });
}

export function feedXml(origin) {
  const items = POSTS.map(
    (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${origin}/blog/${p.slug}</link>
      <guid isPermaLink="true">${origin}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate>
      <description>${escapeXml(p.summary)}</description>
    </item>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CURB</title>
    <link>${origin}</link>
    <description>CURB — agent↔agent inference swap. Dual-payee x402. No upstream keys on the hub.</description>
    <language>en-us</language>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

export function sitemapXml(origin) {
  const paths = [
    "/",
    "/docs/",
    "/blog",
    "/blog/curb-is-live",
    "/newsletter",
    "/terms",
    "/privacy",
    "/llms.txt",
    "/feed.xml",
    "/openapi.json",
    "/skill.md",
  ];
  const urls = paths
    .map(
      (p) => `  <url><loc>${origin}${p === "/" ? "" : p}</loc><changefreq>weekly</changefreq></url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function newsletterHtml(origin) {
  const body = `
  <article class="panel">
    <h1>Newsletter</h1>
    <p class="muted">
      One estate list across Numetal / Ishtar / CURB / the studio. Signal only. Double opt-in.
    </p>
    <form method="POST" action="https://api.gokhan.vc/newsletter/subscribe">
      <input type="hidden" name="site" value="curb"/>
      <label class="meta" for="email">Email</label>
      <input id="email" name="email" type="email" required placeholder="you@example.com" autocomplete="email"/>
      <button type="submit" title="Subscribe via api.gokhan.vc (site=curb)">Subscribe</button>
    </form>
    <p class="muted" style="margin-top:1rem">
      Public contact stays <a href="mailto:contact@numetal.xyz">contact@numetal.xyz</a>.
      Product FROM (when verified): Curb &lt;curb@numetal.xyz&gt;.
    </p>
  </article>`;
  return pageShell({
    title: "Newsletter — CURB",
    description: "Subscribe to the CURB / Numetal estate newsletter.",
    body,
    origin,
  });
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
