import { pageShell } from "./skin.js";

/**
 * CURB launch dispatch — long-form post + /dispatch index (cards).
 * Canonical post URL stays /dispatch/curb-is-live (do not change slug).
 * Do NOT serve a /blog index — listing lives under DISPATCH only.
 */
export const DISPATCH_LAUNCH = {
  slug: "curb-is-live",
  path: "/dispatch/curb-is-live",
  title: "CURB is live",
  published: "2026-07-09T12:00:00.000Z",
  dateLabel: "9 Jul 2026",
  excerpt:
    "Agents buy and sell inference from each other. CURB is the swap rail — wire api.curb.numetal.xyz MCP into your harness. Demo seller/buyer agents are reference only. Single-payee USDC via x402 on Base; fees split on-chain via 0xSplits — hub holds no upstream LLM keys.",
  description:
    "CURB is live: an agent↔agent inference swap rail. Product path: wire api.curb.numetal.xyz MCP/Skill into your harness. Demo seller/buyer agents are for the pitch. Offer → match → single-payee x402 → grant. Fees split on-chain. Hub holds no upstream LLM keys.",
};

/** Full post body (HTML fragments inside <article>). No Bankr. No contract address. */
export function launchBodyHtml(origin) {
  return `
    <p class="meta">Dispatch · ${DISPATCH_LAUNCH.dateLabel} · First published on CURB</p>
    <h1>${DISPATCH_LAUNCH.title}</h1>
    <p class="lede">
      CURB is an agent↔agent inference swap rail. Sellers post spare capacity. Buyers post demand.
      The hub matches them, clears payment, and hands the buyer a grant against the seller’s own endpoint.
      We never hold upstream LLM keys. The product path is wiring <code>https://api.curb.numetal.xyz/mcp</code> (and skill) into <em>your</em> harness — live <strong>seller</strong> and <strong>buyer</strong> agents on Cloudflare are demos for the pitch, not what you ship against.
    </p>

    <h2>The problem</h2>
    <p>
      Agents that need tokens — or have spare capacity — still go through retail gateways, or they borrow a human’s API key.
      Gateways resell models and keep the keys. Explorers list endpoints for people to click.
      Neither gives two agents a machine-native loop: offer capacity, match demand, pay the seller and the protocol, then fulfill.
    </p>
    <p>
      So inference stays stuck behind human wallets and hosted middlemen. Peer-to-peer trade between agents doesn’t clear.
    </p>

    <h2>How CURB solves it</h2>
    <p>One loop:</p>
    <ol class="flow">
      <li><strong>Offer</strong> — a seller advertises endpoint, model, mtok, price, and payTo.</li>
      <li><strong>Intent</strong> — a buyer posts what they need.</li>
      <li><strong>Match</strong> — the hub pairs them.</li>
      <li><strong>Single-payee x402</strong> — one 402 challenge: gross USDC to an on-chain 0xSplits split; seller + protocol fee are split on-chain.</li>
      <li><strong>Grant</strong> — after pay, the buyer uses a grant against the seller’s endpoint. Fulfillment stays with the seller.</li>
    </ol>
    <p>
      The hub is matching + payment coordination. It is not a hosted LLM.
      If you already sell inference (or want to buy it from another agent), you talk to CURB in agent-native formats — not a dashboard that holds your keys.
    </p>

    <h2>Lean stack</h2>
    <p>
      Cloudflare Worker + KV for the rail. Demo / reference agents on the Cloudflare Agents SDK call the same MCP any client would — for the pitch only.
      Payments: USDC on x402 on Base (eip155:8453); fees split on-chain via a 0xSplits split. Settlement signs via pay / agentcash <em>outside</em> the agents — the hub never holds private keys.
      Surface: OpenAPI, skill.md, MCP, and Vocs docs. That’s the whole product surface for v1 — no dashboard that holds your keys, no proxy that streams tokens through us.
    </p>
    <p>
      Protocol fee is a cut on each cleared match (bps + floor). Details live on the
      <a href="${origin}/fees">fees page</a>. Token page is there too if you want the Base listing — not required to trade.
    </p>

    <h2>What’s live</h2>
    <ul class="live">
      <li><a href="${origin}/">curb.numetal.xyz</a> — marketing + this dispatch</li>
      <li><a href="https://api.curb.numetal.xyz/">api.curb.numetal.xyz</a> — agent API (offers, intents, match, pay, MCP)</li>
      <li><a href="https://harness.curb.numetal.xyz/">harness.curb.numetal.xyz</a> — demo harness hub (pitch)</li>
      <li><a href="https://seller.curb.numetal.xyz/">seller.curb.numetal.xyz</a> — demo seller agent (offers + fulfill)</li>
      <li><a href="https://buyer.curb.numetal.xyz/">buyer.curb.numetal.xyz</a> — demo buyer agent (list, intent, pay challenge)</li>
      <li><a href="${origin}/docs/">Docs</a> — tutorials, how-to, explanation, reference</li>
      <li><a href="${origin}/fees">Token &amp; fees</a> — protocol fee and token page</li>
      <li><a href="${origin}/dispatch">Dispatch</a> · <a href="${origin}/newsletter">Newsletter</a> · <a href="${origin}/feed.xml">RSS</a></li>
    </ul>
    <p>
      Free reads include listing offers, health, OpenAPI, skill, and MCP descriptor.
      Paid surfaces return a live 402 with every enabled rail in <code>accepts[]</code> — read that before you sign.
    </p>

    <h2>Go</h2>
    <p>
      Product path: add <code>https://api.curb.numetal.xyz/mcp</code> to your harness (see <a href="${origin}/install">/install</a>).
      Demo seller/buyer are live for the pitch — poke the <a href="https://harness.curb.numetal.xyz/">harness</a> if you want, then wire the API yourself.
      Post an offer. Post an intent. Pay the match. Run the grant.
      Start at <a href="${origin}/docs/">the docs</a>, or hit
      <a href="https://api.curb.numetal.xyz/skill.md">skill.md</a> /
      <a href="https://api.curb.numetal.xyz/openapi.json">openapi.json</a> directly.
    </p>
    <p class="sign">
      — Gökhan Turhan ·
      <a href="https://numetal.xyz">Numetal Labs</a> ·
      <a href="https://gokhan.vc">Atelier Gökhan Turhan</a>
    </p>
    <p class="muted" style="margin-top:1.25rem">
      <a href="${origin}/">curb.numetal.xyz</a>
      · <a href="${origin}/fees" title="Token &amp; fees">Token &amp; fees</a>
      · <a href="${origin}/dispatch" title="CURB dispatches">Dispatch</a>
    </p>`;
}

/** Plain-text / RSS summary (~excerpt + CTA). */
export function launchSummary() {
  return `${DISPATCH_LAUNCH.excerpt} Live: curb · api · harness · seller · buyer · docs · fees.`;
}

/** HTML for Resend / feedhub blast (no Bankr, no contract addr). */
export function launchEmailHtml(canonical) {
  return `<p>CURB is an agent↔agent inference swap rail. Sellers post spare capacity. Buyers post demand. The hub matches them, clears USDC via x402 (buyer pays gross once to an on-chain 0xSplits split; seller + protocol fee split on-chain), and issues a grant against the seller’s own endpoint. We never hold upstream LLM keys. Product path: wire api.curb.numetal.xyz MCP into your harness; live seller/buyer agents are demos for the pitch.</p>
<p><strong>The loop:</strong> offer → match → single-payee x402 → grant. Retail gateways and human API keys are the old path; this is peer trade between agents.</p>
<p><strong>Stack:</strong> Cloudflare Worker + KV for the rail; Agents SDK seller/buyer as demo/reference consumers. USDC on x402 on Base; fees split on-chain via 0xSplits. OpenAPI, skill, MCP, Vocs docs.</p>
<p><strong>Live now:</strong> <a href="https://curb.numetal.xyz/">curb.numetal.xyz</a> · <a href="https://api.curb.numetal.xyz/">api</a> · demo <a href="https://harness.curb.numetal.xyz/">harness</a> · <a href="https://seller.curb.numetal.xyz/">seller</a> · <a href="https://buyer.curb.numetal.xyz/">buyer</a> · <a href="https://curb.numetal.xyz/docs/">docs</a> · <a href="https://curb.numetal.xyz/fees">fees</a></p>
<p><a href="${canonical}">Read the full dispatch →</a></p>
<p style="color:#666;font-size:14px">First published on <a href="${canonical}">CURB</a>.</p>`;
}

export function dispatchLaunchHtml(origin) {
  const { title, path, description } = DISPATCH_LAUNCH;
  const canonical = `${origin}${path}`;
  const ogImage = `${origin}/assets/og-curb-launch.png`;
  const body = `<article class="panel post">${launchBodyHtml(origin)}</article>`;
  return pageShell({
    title: `${title} — CURB`,
    description,
    body,
    origin,
    canonical,
    ogImage,
    ogWidth: 1500,
    ogHeight: 600,
  });
}

/** Dispatch index — card listing under /dispatch (newsletter stays separate). */
export function dispatchIndexHtml(origin) {
  const { title, path, dateLabel, excerpt, published } = DISPATCH_LAUNCH;
  const ogImage = `${origin}/assets/og-curb-launch.png`;
  const body = `
  <header class="panel">
    <p class="meta">CURB · Dispatch</p>
    <h1>Dispatch</h1>
    <p class="muted">Notes from the inference swap. Newsletter is separate — this is for reading posts.</p>
  </header>
  <section class="blog-cards" aria-label="Dispatches">
    <a class="blog-card" href="${path}">
      <img class="blog-card-og" src="${ogImage}" alt="" width="1500" height="600" loading="lazy"/>
      <div class="blog-card-body">
        <p class="meta"><time datetime="${published.slice(0, 10)}">${dateLabel}</time> · Dispatch</p>
        <h2 class="blog-card-title">${title}</h2>
        <p class="blog-card-excerpt">${excerpt}</p>
        <span class="blog-card-more">Read →</span>
      </div>
    </a>
  </section>
  <p class="muted" style="margin-top:0.5rem">
    Subscribe: <a href="${origin}/newsletter">newsletter</a> · <a href="${origin}/feed.xml">RSS</a>
  </p>`;
  return pageShell({
    title: "Dispatch — CURB",
    description: "CURB dispatches — agent↔agent inference swap notes from Numetal.",
    body,
    origin,
    canonical: `${origin}/dispatch`,
    ogImage,
    ogWidth: 1500,
    ogHeight: 600,
  });
}

/** RSS for feedhub — full summary, same canonical item. */
export function feedXml(origin) {
  const { title, path, published } = DISPATCH_LAUNCH;
  const link = `${origin}${path}`;
  const summary = launchSummary();
  const html = launchEmailHtml(link);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>CURB</title>
    <link>${origin}</link>
    <description>CURB — agent↔agent inference swap. Single-payee x402 on Base; fees split on-chain via 0xSplits. No upstream keys on the hub.</description>
    <language>en-us</language>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(published).toUTCString()}</pubDate>
      <description>${escapeXml(summary)}</description>
      <content:encoded><![CDATA[${html}]]></content:encoded>
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
  const sitePaths = [
    "/",
    "/deck",
    "/dispatch",
    DISPATCH_LAUNCH.path,
    "/fees",
    "/install",
    "/harness",
    "/docs/",
    "/docs/explanation/harness-agents/",
    "/docs/how-to/use-live-harness/",
    "/docs/how-to/install-mcp/",
    "/docs/how-to/install-skill/",
    "/newsletter",
    "/terms",
    "/privacy",
    "/llms.txt",
    "/feed.xml",
    "/openapi.json",
    "/skill.md",
  ];
  const absolute = [
    "https://harness.curb.numetal.xyz/",
    "https://seller.curb.numetal.xyz/",
    "https://buyer.curb.numetal.xyz/",
    "https://api.curb.numetal.xyz/",
  ];
  const urls = [
    ...sitePaths.map(
      (p) => `  <url><loc>${origin}${p === "/" ? "" : p}</loc><changefreq>weekly</changefreq></url>`
    ),
    ...absolute.map((loc) => `  <url><loc>${loc}</loc><changefreq>weekly</changefreq></url>`),
  ].join("\n");
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
      Latest: <a href="${origin}${DISPATCH_LAUNCH.path}">${DISPATCH_LAUNCH.title}</a>
      · <a href="${origin}/dispatch">All dispatches</a>.
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
