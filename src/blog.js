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

/**
 * tickerline dispatch — syndicated mirror. First published on numetal.xyz;
 * rel=canonical points at the numetal.xyz original (do not change).
 */
export const DISPATCH_TICKERLINE = {
  slug: "tickerline",
  path: "/dispatch/tickerline",
  title: "tickerline: your conversation, quoted",
  published: "2026-07-12T12:00:00.000Z",
  dateLabel: "12 Jul 2026",
  canonical: "https://numetal.xyz/blog/tickerline",
  excerpt:
    "tickerline turns the Claude Code status line into a rolling ticker tape of whatever you're discussing with Claude — stocks, tokens, and the Polymarket questions nearest to the conversation. Shipped on ClaudeLines; audited, free to install. First published on numetal.xyz.",
  description:
    "tickerline: your conversation, quoted — a Claude Code status line on ClaudeLines that turns the terminal strip into a live ticker tape: stocks, tokens, Polymarket questions, /tlm to open them in-chat. Syndicated mirror; first published on numetal.xyz.",
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

/** tickerline post body (HTML fragments inside <article>). Syndicated — wording is canonical. */
export function tickerlineBodyHtml(origin) {
  return `
    <p class="meta">Dispatch · ${DISPATCH_TICKERLINE.dateLabel} · This post was first published on <a href="${DISPATCH_TICKERLINE.canonical}">numetal.xyz</a></p>
    <h1>${DISPATCH_TICKERLINE.title}</h1>
    <p class="lede">
      ClaudeLines (<a href="https://claudelines.com">claudelines.com</a>) is a registry for Claude Code status lines — that single strip of terminal under the prompt — built by Merit Systems.
      Anyone can publish one; every submission passes a deterministic security scan and an LLM audit, payments settle over x402, and a wallet is the only identity required.
      It’s a small, honest marketplace for the smallest possible software surface.
    </p>
    <p>
      We shipped tickerline there. It turns that strip into a rolling ticker tape of whatever you’re discussing with Claude:
      name a company and its stock appears, mention a token and it prices in, and a second band scrolls the Polymarket questions
      nearest to the conversation — with a <code>/tlm</code> command that opens any of them in-chat, numbered straight off the tape.
    </p>
    <p>
      No watchlist, no dictionary, no API keys. Names resolve live against public market indexes and cache hard enough that
      steady state costs zero network and renders in about fifty milliseconds. One file. No shell. Three pinned hosts.
      When the conversation goes quiet, the band shows what the world is trading instead of going dark.
    </p>
    <p>
      The part we like most: an agent built it, red-teamed it, captured the preview, and paid the registry’s $0.15 x402 fee
      from its own wallet — end to end, terminal to listing.
    </p>

    <h2>$TICKER</h2>
    <p>
      tickerline now trades as TICKERLINE ($TICKER) on Robinhood Chain — <code>0x02c67c0F6Fef5065aF1C78F337a8bEE386b6BbA3</code> —
      launched through <a href="https://bankr.bot/terminal/discover/0x02c67c0F6Fef5065aF1C78F337a8bEE386b6BbA3">Bankr</a>
      off the announcement post. A memecoin, not equity; the status line itself stays free.
    </p>

    <h2>Go</h2>
    <ul class="live">
      <li><a href="https://claudelines.com/statuslines/tickerline">claudelines.com/statuslines/tickerline</a> — the listing, audited, free to install</li>
      <li><a href="https://github.com/avalidurl/tickerline">github.com/avalidurl/tickerline</a> — source, MIT</li>
      <li><a href="https://bankr.bot/terminal/discover/0x02c67c0F6Fef5065aF1C78F337a8bEE386b6BbA3">bankr.bot/terminal/discover/0x02c6…BbA3</a> — $TICKER on Robinhood Chain</li>
    </ul>
    <p class="sign">
      — Gökhan Turhan ·
      <a href="https://numetal.xyz">Numetal Labs</a> ·
      <a href="https://gokhan.vc">Atelier Gökhan Turhan</a>
    </p>
    <p class="muted" style="margin-top:1.25rem">
      First published on <a href="${DISPATCH_TICKERLINE.canonical}">numetal.xyz/blog/tickerline</a>
      · <a href="${origin}/">curb.numetal.xyz</a>
      · <a href="${origin}/dispatch" title="CURB dispatches">Dispatch</a>
    </p>`;
}

export function dispatchTickerlineHtml(origin) {
  const { title, description, canonical } = DISPATCH_TICKERLINE;
  const body = `<article class="panel post">${tickerlineBodyHtml(origin)}</article>`;
  return pageShell({
    title: `${title} — CURB`,
    description,
    body,
    origin,
    canonical, // syndicated mirror — canonical stays on numetal.xyz
  });
}

/** Dispatch index — card listing under /dispatch (newsletter stays separate). */
export function dispatchIndexHtml(origin) {
  const ogImage = `${origin}/assets/og-curb-launch.png`;
  const posts = [DISPATCH_TICKERLINE, DISPATCH_LAUNCH]; // newest first
  const ogFor = (post) => (post.slug === "curb-is-live" ? ogImage : null);
  const cards = posts
    .map((post) => {
      const og = ogFor(post);
      const img = og
        ? `<img class="blog-card-og" src="${og}" alt="" width="1500" height="600" loading="lazy"/>`
        : "";
      return `
    <a class="blog-card" href="${post.path}">
      ${img}
      <div class="blog-card-body">
        <p class="meta"><time datetime="${post.published.slice(0, 10)}">${post.dateLabel}</time> · Dispatch</p>
        <h2 class="blog-card-title">${post.title}</h2>
        <p class="blog-card-excerpt">${post.excerpt}</p>
        <span class="blog-card-more">Read →</span>
      </div>
    </a>`;
    })
    .join("\n");
  const body = `
  <header class="panel">
    <p class="meta">CURB · Dispatch</p>
    <h1>Dispatch</h1>
    <p class="muted">Notes from the inference swap. Newsletter is separate — this is for reading posts.</p>
  </header>
  <section class="blog-cards" aria-label="Dispatches">
${cards}
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
  const launchLink = `${origin}${DISPATCH_LAUNCH.path}`;
  const tickerlineLink = `${origin}${DISPATCH_TICKERLINE.path}`;
  const tickerlineHtml = `<p>${DISPATCH_TICKERLINE.excerpt}</p>
<p><a href="${tickerlineLink}">Read the dispatch →</a></p>
<p style="color:#666;font-size:14px">This post was first published on <a href="${DISPATCH_TICKERLINE.canonical}">numetal.xyz</a>.</p>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>CURB</title>
    <link>${origin}</link>
    <description>CURB — agent↔agent inference swap. Single-payee x402 on Base; fees split on-chain via 0xSplits. No upstream keys on the hub.</description>
    <language>en-us</language>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title>${escapeXml(DISPATCH_TICKERLINE.title)}</title>
      <link>${tickerlineLink}</link>
      <guid isPermaLink="true">${tickerlineLink}</guid>
      <pubDate>${new Date(DISPATCH_TICKERLINE.published).toUTCString()}</pubDate>
      <description>${escapeXml(DISPATCH_TICKERLINE.excerpt)}</description>
      <content:encoded><![CDATA[${tickerlineHtml}]]></content:encoded>
    </item>
    <item>
      <title>${escapeXml(DISPATCH_LAUNCH.title)}</title>
      <link>${launchLink}</link>
      <guid isPermaLink="true">${launchLink}</guid>
      <pubDate>${new Date(DISPATCH_LAUNCH.published).toUTCString()}</pubDate>
      <description>${escapeXml(launchSummary())}</description>
      <content:encoded><![CDATA[${launchEmailHtml(launchLink)}]]></content:encoded>
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
    DISPATCH_TICKERLINE.path,
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
      Latest: <a href="${origin}${DISPATCH_TICKERLINE.path}">${DISPATCH_TICKERLINE.title}</a>
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
