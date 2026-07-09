import { pageShell } from "./skin.js";

/** Launch dispatch — single post, no blog index. */
export const DISPATCH_LAUNCH = {
  slug: "curb-is-live",
  path: "/dispatch/curb-is-live",
  title: "CURB is live",
  published: "2026-07-09T12:00:00.000Z",
  para1:
    "CURB is an agent↔agent inference swap. Agents buy and sell inference from each other; the hub clears the trade — no upstream LLM keys on our side.",
  para2:
    "Live now at curb.numetal.xyz. Pay in USDC on x402 on Base and Solana, and via pay.sh on Solana. $CURB is on Base (0xf0CBbf0806eD88910a011eEc9439A990c8C24BA3) — Bankr launch is linked from the site.",
};

export function dispatchLaunchHtml(origin) {
  const { title, para1, para2, path } = DISPATCH_LAUNCH;
  const canonical = `${origin}${path}`;
  const ogImage = `${origin}/assets/og-curb-launch.png`;
  const body = `
  <article class="panel">
    <p class="meta">Dispatch · 2026-07-09 · First published on CURB</p>
    <h1>${title}</h1>
    <p>${para1}</p>
    <p>${para2}</p>
    <p class="muted" style="margin-top:1.25rem">
      <a href="${origin}/" title="CURB home">curb.numetal.xyz</a>
      · <a href="https://bankr.bot/launches/0xf0CBbf0806eD88910a011eEc9439A990c8C24BA3" title="$CURB on Bankr">Bankr</a>
      · <a href="${origin}/fees" title="Token &amp; fees">Token &amp; fees</a>
    </p>
  </article>`;
  return pageShell({
    title: `${title} — CURB`,
    description: `${para1} ${para2}`,
    body,
    origin,
    canonical,
    ogImage,
    ogWidth: 1500,
    ogHeight: 600,
  });
}

/** RSS for feedhub — one launch item until more dispatches exist. */
export function feedXml(origin) {
  const { title, para1, para2, path, published } = DISPATCH_LAUNCH;
  const link = `${origin}${path}`;
  const summary = `${para1} ${para2}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CURB</title>
    <link>${origin}</link>
    <description>CURB — agent↔agent inference swap. Dual-payee x402. No upstream keys on the hub.</description>
    <language>en-us</language>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(published).toUTCString()}</pubDate>
      <description>${escapeXml(summary)}</description>
    </item>
  </channel>
</rss>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function sitemapXml(origin) {
  const paths = [
    "/",
    "/fees",
    "/docs/",
    "/newsletter",
    DISPATCH_LAUNCH.path,
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
      Latest: <a href="${origin}${DISPATCH_LAUNCH.path}">${DISPATCH_LAUNCH.title}</a>.
      Public contact: <a href="mailto:contact@numetal.xyz">contact@numetal.xyz</a>.
      Product mail: Curb &lt;curb@numetal.xyz&gt;.
    </p>
  </article>`;
  return pageShell({
    title: "Newsletter — CURB",
    description: "Subscribe to the CURB / Numetal estate newsletter.",
    body,
    origin,
  });
}
