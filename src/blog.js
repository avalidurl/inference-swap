import { pageShell, mastheadHtml, mastRowsHtml, DOC_REV } from "./skin.js";

// House doc numbers for the dispatch shelf (furniture only — slugs/copy untouched).
const DOC_DISPATCH_INDEX = "CB-040";
const DOC_LAUNCH = "CB-041";
const DOC_TICKERLINE = "CB-042";
const DOC_X402 = "CB-043";
const DOC_CLINAMEN = "CB-044";
const DOC_NEWSLETTER = "CB-050";

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


/**
 * x402 economy report dispatch — syndicated mirror. First published on gokhan.vc;
 * rel=canonical points at the gokhan.vc original (do not change).
 */
export const DISPATCH_X402 = {
  slug: "x402-economy-july-2026",
  path: "/dispatch/x402-economy-july-2026",
  title: "The x402 economy — July 2026",
  published: "2026-07-17T12:00:00.000Z",
  dateLabel: "17 Jul 2026",
  canonical: "https://gokhan.vc/blog/x402-economy-july-2026",
  excerpt:
    "Rev.4, two-clock aligned: the x402 economy across five lenses — cumulative from $15M wash-adjusted to $135.7M raw, live 30-day panel, every claim cited. Joint research by Gökhan Turhan and several Claude models. First published on gokhan.vc.",
  description:
    "Rev.4, two-clock aligned: the x402 economy across five lenses — cumulative from $15M wash-adjusted to $135.7M raw, live 30-day panel, every claim cited. Joint research by Gökhan Turhan and several Claude models. First published on gokhan.vc.",
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

    <h2><span>The problem</span> <span class="sec-no">§1</span></h2>
    <p>
      Agents that need tokens — or have spare capacity — still go through retail gateways, or they borrow a human’s API key.
      Gateways resell models and keep the keys. Explorers list endpoints for people to click.
      Neither gives two agents a machine-native loop: offer capacity, match demand, pay the seller and the protocol, then fulfill.
    </p>
    <p>
      So inference stays stuck behind human wallets and hosted middlemen. Peer-to-peer trade between agents doesn’t clear.
    </p>

    <h2><span>How CURB solves it</span> <span class="sec-no">§2</span></h2>
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

    <h2><span>Lean stack</span> <span class="sec-no">§3</span></h2>
    <p>
      Cloudflare Worker + KV for the rail. Demo / reference agents on the Cloudflare Agents SDK call the same MCP any client would — for the pitch only.
      Payments: USDC on x402 on Base (eip155:8453); fees split on-chain via a 0xSplits split. Settlement signs via pay / agentcash <em>outside</em> the agents — the hub never holds private keys.
      Surface: OpenAPI, skill.md, MCP, and Vocs docs. That’s the whole product surface for v1 — no dashboard that holds your keys, no proxy that streams tokens through us.
    </p>
    <p>
      Protocol fee is a cut on each cleared match (bps + floor). Details live on the
      <a href="${origin}/fees">fees page</a>. Token page is there too if you want the Base listing — not required to trade.
    </p>

    <h2><span>What’s live</span> <span class="sec-no">§4</span></h2>
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

    <h2><span>Go</span> <span class="sec-no">§5</span></h2>
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
  const body = `<div class="masthead">
    ${mastRowsHtml(DOC_LAUNCH, { status: "Filed", org: "Numetal Labs · CURB · Dispatch" })}
  </div>
  <article class="panel post">${launchBodyHtml(origin)}</article>`;
  return pageShell({
    title: `${title} — CURB`,
    description,
    body,
    origin,
    canonical,
    ogImage,
    ogWidth: 1500,
    ogHeight: 600,
    doc: { no: DOC_LAUNCH },
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

    <h2><span>$TICKER</span> <span class="sec-no">§1</span></h2>
    <p>
      tickerline now trades as TICKERLINE ($TICKER) on Robinhood Chain — <code>0x02c67c0F6Fef5065aF1C78F337a8bEE386b6BbA3</code> —
      launched through <a href="https://bankr.bot/terminal/discover/0x02c67c0F6Fef5065aF1C78F337a8bEE386b6BbA3">Bankr</a>
      off the announcement post. A memecoin, not equity; the status line itself stays free.
    </p>

    <h2><span>Go</span> <span class="sec-no">§2</span></h2>
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
  const body = `<div class="masthead">
    ${mastRowsHtml(DOC_TICKERLINE, { status: "Filed · syndicated", org: "Numetal Labs · CURB · Dispatch" })}
  </div>
  <article class="panel post">${tickerlineBodyHtml(origin)}</article>`;
  return pageShell({
    title: `${title} — CURB`,
    description,
    body,
    origin,
    canonical, // syndicated mirror — canonical stays on numetal.xyz
    doc: { no: DOC_TICKERLINE },
  });
}


export function x402BodyHtml(origin) {
  return `
    <style>
      .post table{width:100%;border-collapse:collapse;font-size:13px;line-height:1.5;border-top:2px solid currentColor;border-bottom:2px solid currentColor;margin:0 0 1.2rem}
      .post th{text-align:left;font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.75;padding:.5rem 1rem .5rem 0;border-bottom:1px solid currentColor}
      .post td{padding:.45rem 1rem .45rem 0;border-bottom:1px solid rgba(128,128,128,.35);vertical-align:top}
      .post tbody tr:last-child td{border-bottom:none}
      .post img{width:100%;height:auto;margin:.4rem 0 1rem;background:#fff}
      .post sup a.footnote-ref{text-decoration:none;font-size:11px;padding:0 1px}
      .post .footnote{margin-top:2rem;border-top:2px solid currentColor;padding-top:1rem;font-size:13px}
      .post .footnote hr{display:none}
      .post a.footnote-backref{text-decoration:none}
    </style>
    <p class="meta">Dispatch · ${DISPATCH_X402.dateLabel} · This post was first published on <a href="${DISPATCH_X402.canonical}">gokhan.vc</a></p>
    <h1>${DISPATCH_X402.title}</h1>
<p class="orig">First published — canonically — on <a href="https://gokhan.vc/blog/x402-economy-july-2026">gokhan.vc →</a> <em>· This mirror tracks the canonical text; currently rev.4 (2026-07-18), two-clock aligned, fully cited.</em></p>
<blockquote>
<p><strong>This report is a joint research output by Gökhan Turhan and several Claude models, including Opus 4.8 and Fable 5.</strong> Nothing here is investment advice. It is an attempt at mapping an emergent economy at the axes of artificial general intelligence and self-refactoring, cryptographically secured payment rails — with or without blockchains in the traditional sense.</p>
</blockquote>
<h2>0. How to read this document (instructions for agents)</h2>
<p>This report is written to be consumed by LLMs and autonomous agents as much as by humans. Conventions:</p>
<ul>
<li><strong>Every quantitative claim carries a superscript citation</strong> to a numbered source note; hover a superscript for the source summary, click to jump to the note, click the return arrow to scroll back. A claim without a citation is a bug; report it.</li>
<li><strong>Five measurement lenses</strong>, deliberately not merged, because they disagree and the disagreement is signal:</li>
<li><code>LENS.ONCHAIN</code> — our Dune queries over facilitator-attributed token transfers.<sup id="fnref5:7"><a class="footnote-ref" href="#fn:7">1</a></sup> Known coverage: ~10% of LENS.SCAN volume, due to facilitator address churn.</li>
<li><code>LENS.SCAN</code> — x402scan.com, the ecosystem's own indexer (registered/discovered sellers only), dual-verified live.<sup id="fnref14:1"><a class="footnote-ref" href="#fn:1">2</a></sup></li>
<li><code>LENS.NPM</code> — npmjs download counts (developer-funnel proxy; CI noise applies).<sup id="fnref4:9"><a class="footnote-ref" href="#fn:9">3</a></sup></li>
<li><code>LENS.EXT</code> — self-reported and press-relayed totals, the widest surface.<sup id="fnref6:2"><a class="footnote-ref" href="#fn:2">5</a></sup></li>
<li><code>LENS.ADJ</code> — wash-adjusted and forensic series: the Visa × Artemis adjusted data,<sup id="fnref7:3"><a class="footnote-ref" href="#fn:3">6</a></sup> Artemis's live terminal,<sup id="fnref3:4"><a class="footnote-ref" href="#fn:4">9</a></sup> and the arXiv population-scale forensic bounds.<sup id="fnref6:5"><a class="footnote-ref" href="#fn:5">7</a></sup></li>
<li><strong>§A is the canonical machine-readable appendix.</strong> If prose and appendix ever conflict, the appendix wins.</li>
<li><strong>Reproduction</strong>: collectors run daily 06:10 UTC; forecast vintages freeze weekly (Mon 07:00 UTC); the surprise index scores realized values against the prior frozen vintage.<sup id="fnref6:10"><a class="footnote-ref" href="#fn:10">4</a></sup> The pipeline costs €6.49/month to operate.</li>
<li>Figures are monochrome engineering sheets; each carries its lens in the footer. A companion due-diligence catalog of 21 verified tracking resources exists alongside this report.<sup id="fnref2:23"><a class="footnote-ref" href="#fn:23">20</a></sup></li>
</ul>
<h2>1. Executive summary</h2>
<ol>
<li><strong>The denominator of this economy spans three orders of magnitude depending on who counts.</strong> Cumulative x402 settlement reads <strong>$135.7M raw</strong> across 178.3M transactions,<sup id="fnref8:3"><a class="footnote-ref" href="#fn:3">6</a></sup> <strong>$15.0M wash-adjusted</strong> across 109.6M transactions per the Visa × Artemis methodology (a ~89% exclusion),<sup id="fnref9:3"><a class="footnote-ref" href="#fn:3">6</a></sup> and between <strong>$0.19M and $20.3M of genuinely independent flow</strong> per the first population-scale academic forensic study.<sup id="fnref7:5"><a class="footnote-ref" href="#fn:5">7</a></sup> On the cumulative clock, the indexer's own All-Time view reads <strong>195M tx / $52.31M</strong>.<sup id="fnref15:1"><a class="footnote-ref" href="#fn:1">2</a></sup> The 30-day flows disagree the same way: 75.41M tx / $24.24M on x402.org's self-published panel — which turns out to be a hand-edited static snapshot, not a live counter<sup id="fnref7:2"><a class="footnote-ref" href="#fn:2">5</a></sup> — vs 17.28M tx / $825.26K live on the indexer.<sup id="fnref16:1"><a class="footnote-ref" href="#fn:1">2</a></sup> Finding #1 is unchanged and now carries a card network's signature: nobody, including the ecosystem's participants, agrees on how big this economy is — and most of the raw number is manufactured.</li>
<li><strong>One vendor is one-fifth of the economy.</strong> BlockRun (AI model routing with built-in payment) earned <strong>$177.26K in 30 days = 20.9% of all measured volume — and 14.48M of the 17.67M transactions, i.e. 82% of ALL measured x402 transactions, from ~1.13K buyers</strong> — 9.5× vendor #2.<sup id="fnref17:1"><a class="footnote-ref" href="#fn:1">2</a></sup> The buyer side is just as concentrated ecosystem-wide: the top 1% of adjusted buyers (~4K wallets) account for ~90% of adjusted volume.<sup id="fnref10:3"><a class="footnote-ref" href="#fn:3">6</a></sup> The first proven killer app of machine-native payments is <em>machines paying for intelligence itself</em>.</li>
<li><strong>Counts fall, value holds — a quality-improving contraction, now triple-confirmed.</strong> Our forecast layer read realized 14-day transfers at <strong>0.61× forecast (Base) and 0.62× (Solana)</strong> while USD volume ran <strong>1.12× and 1.06×</strong>.<sup id="fnref7:10"><a class="footnote-ref" href="#fn:10">4</a></sup> Artemis's live terminal independently shows 30-day transactions <strong>down 96.5%</strong> and volume down 89% from peak while the average ticket sits at $0.30.<sup id="fnref4:4"><a class="footnote-ref" href="#fn:4">9</a></sup> Chainalysis's value-band series agrees from a third direction: $1+ payments went from 49% to 95% of volume in a year.<sup id="fnref4:6"><a class="footnote-ref" href="#fn:6">10</a></sup> Sub-cent ping/wash traffic is dying; paid usage is not.</li>
<li><strong>Facilitator churn breaks static measurement within weeks.</strong> Community facilitator catalogs (basis of every public Dune dashboard, ours included) now capture <strong>10.5%</strong> of LENS.SCAN volume;<sup id="fnref6:7"><a class="footnote-ref" href="#fn:7">1</a></sup> FluxA, Meridian, Primer, Mogami and rotated Coinbase addresses carry the unindexed rest.<sup id="fnref18:1"><a class="footnote-ref" href="#fn:1">2</a></sup> The freshest public facilitator-address registry is community-maintained on Dune, 96 rows across 8+ chains.<sup id="fnref2:15"><a class="footnote-ref" href="#fn:15">15</a></sup></li>
<li><strong>Developer funnel: stable core, contracting edges.</strong> <code>x402</code> npm holds ~1.21M downloads/month (+6% WoW); client helpers contract sharply (<code>x402-fetch</code> −42%, <code>@coinbase/x402</code> −39% WoW)<sup id="fnref5:9"><a class="footnote-ref" href="#fn:9">3</a></sup> — integration is consolidating into hosted gateways.</li>
<li><strong>The card networks split cleanly on measurement.</strong> Visa co-funds the only wash-adjusted public data apparatus (report + live dashboard, via Artemis)<sup id="fnref11:3"><a class="footnote-ref" href="#fn:3">6</a></sup><sup id="fnref5:4"><a class="footnote-ref" href="#fn:4">9</a></sup> and is one of 17 Premier Members of the x402 Foundation; Mastercard is also a Premier Member<sup id="fnref3:19"><a class="footnote-ref" href="#fn:19">14</a></sup> yet <strong>publishes no agentic-payments data at all</strong> — no dashboard, no transaction counts, its x402 position expressed only through quotes inside Linux Foundation releases.<sup id="fnref:20"><a class="footnote-ref" href="#fn:20">21</a></sup></li>
<li><strong>Thesis instrument status</strong> ("x402 success is not yet priced in"): the surprise index reads <strong>negative on counts, mildly positive on value</strong>.<sup id="fnref8:10"><a class="footnote-ref" href="#fn:10">4</a></sup> The confirmation pattern — counts and value surprising positive together, plus vendor de-concentration — <strong>has not fired</strong>. Run-rate of the indexer-measured economy: <strong>~$10.17M/year</strong>;<sup id="fnref19:1"><a class="footnote-ref" href="#fn:1">2</a></sup> the Visa-adjusted cumulative over 14 months is $15.0M.<sup id="fnref12:3"><a class="footnote-ref" href="#fn:3">6</a></sup></li>
</ol>
<h2>2. Measurement infrastructure</h2>
<p>Pipeline (operational since 2026-07-16): three collectors (Dune per-facilitator dailies;<sup id="fnref:7"><a class="footnote-ref" href="#fn:7">1</a></sup> x402scan structured snapshots;<sup id="fnref:1"><a class="footnote-ref" href="#fn:1">2</a></sup> npm counts<sup id="fnref:9"><a class="footnote-ref" href="#fn:9">3</a></sup>) → scrub layer (ping-storm flag: &gt;95% sub-cent transfers ∧ &lt;5 unique buyers per day×facilitator) → parquet in object storage → weekly statsforecast vintages (SeasonalNaive / AutoARIMA / AutoETS / Theta; rolling-origin CV; winner per series; 28-day quantile forecasts) → surprise index.<sup id="fnref:10"><a class="footnote-ref" href="#fn:10">4</a></sup></p>
<p>Marginal cost of the entire apparatus: <strong>€6.49/month</strong> (one small VPS) + ~22 Dune credits/day inside the free tier + one Firecrawl scrape/day. Zero paid model APIs.</p>
<p>Declared limits: <code>LENS.ONCHAIN</code> catalogs are stale (§5, fix queued); <code>LENS.SCAN</code> indexes only registered sellers and displays mixed windows (30d on the home page; a site-labeled "Past 24 Hours" window on /facilitators and /networks — confirmed live, and highly volatile day to day);<sup id="fnref2:1"><a class="footnote-ref" href="#fn:1">2</a></sup> <code>LENS.EXT</code> relays x402.org's self-reported stats via CoinDesk;<sup id="fnref:2"><a class="footnote-ref" href="#fn:2">5</a></sup> <code>LENS.ADJ</code> methodologies are proprietary (Artemis heuristics)<sup id="fnref:3"><a class="footnote-ref" href="#fn:3">6</a></sup> or one-shot (arXiv snapshot through ~March 2026).<sup id="fnref:5"><a class="footnote-ref" href="#fn:5">7</a></sup></p>
<h2>3. Macro state — the denominator problem, on two clocks</h2>
<p>Every series in this report now sits on one of exactly two windows: <strong>Clock A, stock</strong> (cumulative since each counter's genesis) and <strong>Clock B, flow</strong> (trailing 30 days). Anything finer — the indexer's "Past 24 Hours" facilitator and network pages — is treated as a volatility exhibit, never a comparison basis.</p>
<p><strong>Clock A — cumulative, since day one:</strong></p>
<table>
<thead>
<tr>
<th>Series</th>
<th>Genesis → as-of</th>
<th>Transactions</th>
<th>USD volume</th>
<th>Method</th>
</tr>
</thead>
<tbody>
<tr>
<td>x402scan indexer, All Time<sup id="fnref29:1"><a class="footnote-ref" href="#fn:1">2</a></sup></td>
<td>~May 2025 → live 2026-07-18</td>
<td><strong>195M</strong></td>
<td>$52.31M</td>
<td>indexed facilitators only; 843.33K buyers / 226K sellers</td>
</tr>
<tr>
<td>Artemis raw<sup id="fnref16:3"><a class="footnote-ref" href="#fn:3">6</a></sup></td>
<td>May 2025 → 2026-04-21</td>
<td>178.3M</td>
<td><strong>$135.7M</strong></td>
<td>all facilitator-adjacent on-chain activity</td>
</tr>
<tr>
<td>Dune community cumulative<sup id="fnref2:17"><a class="footnote-ref" href="#fn:17">24</a></sup></td>
<td>genesis → ~2026-06-21</td>
<td>153.3M</td>
<td>$40.87M</td>
<td>facilitator-attributed transfers, ecosystem-wide</td>
</tr>
<tr>
<td>Dune 96-address registry, by chain<sup id="fnref4:15"><a class="footnote-ref" href="#fn:15">15</a></sup></td>
<td>genesis → ~2026-07-14</td>
<td>≈144.0M</td>
<td>—</td>
<td>Base 72.43M · Solana 47.87M · Polygon 22.69M</td>
</tr>
<tr>
<td>arXiv forensic<sup id="fnref9:5"><a class="footnote-ref" href="#fn:5">7</a></sup></td>
<td>280 days → ~Mar 2026</td>
<td>136.7M</td>
<td>$44.1M raw</td>
<td>independent flow bounded <strong>$0.19M–$20.3M</strong></td>
</tr>
<tr>
<td>Our on-chain slice<sup id="fnref10:7"><a class="footnote-ref" href="#fn:7">1</a></sup></td>
<td>Aug 2025 → 2026-07-16</td>
<td>119.7M</td>
<td>$39.66M</td>
<td>stale catalog — recent months undercounted</td>
</tr>
<tr>
<td>Visa × Artemis adjusted<sup id="fnref17:3"><a class="footnote-ref" href="#fn:3">6</a></sup></td>
<td>May 2025 → 2026-04-21</td>
<td>109.6M</td>
<td><strong>$15.0M</strong></td>
<td>wash/test excluded (~89% of raw volume)</td>
</tr>
<tr>
<td>DefiLlama adapter<sup id="fnref3:14"><a class="footnote-ref" href="#fn:14">18</a></sup></td>
<td>genesis → live 2026-07-18</td>
<td>—</td>
<td>$31.46M</td>
<td>volume-only; Base $22.21M / Solana $9.03M</td>
</tr>
</tbody>
</table>
<p>Cumulative transaction counts span <strong>110M to 195M</strong> and cumulative volume <strong>$15M to $135.7M</strong> depending on who counts and how — with the academically defensible independent-flow floor at $0.19M.<sup id="fnref2:5"><a class="footnote-ref" href="#fn:5">7</a></sup> <strong>The spread itself is the finding</strong>: raw settlement counts measure <em>manufacturability</em>, not adoption — the arXiv authors' phrase,<sup id="fnref3:5"><a class="footnote-ref" href="#fn:5">7</a></sup> Visa's 89% exclusion,<sup id="fnref2:3"><a class="footnote-ref" href="#fn:3">6</a></sup> and x402gle's ~93% wash share<sup id="fnref:11"><a class="footnote-ref" href="#fn:11">8</a></sup> all say the same thing from independent methods.</p>
<p><strong>Clock B — trailing 30-day flow:</strong></p>
<table>
<thead>
<tr>
<th>Series</th>
<th>As-of</th>
<th>Transactions</th>
<th>USD volume</th>
<th>Buyers / sellers</th>
</tr>
</thead>
<tbody>
<tr>
<td>x402scan indexer<sup id="fnref30:1"><a class="footnote-ref" href="#fn:1">2</a></sup></td>
<td>live 2026-07-18</td>
<td>17.28M</td>
<td>$825.26K</td>
<td>47.17K / 62K</td>
</tr>
<tr>
<td>x402.org self-published<sup id="fnref10:2"><a class="footnote-ref" href="#fn:2">5</a></sup></td>
<td>static page, authored ~2026-06-24</td>
<td>75.41M</td>
<td>$24.24M</td>
<td>94.06K / 22K</td>
</tr>
<tr>
<td>Our on-chain slice<sup id="fnref11:7"><a class="footnote-ref" href="#fn:7">1</a></sup></td>
<td>30d ending 2026-07-16</td>
<td>496.8K</td>
<td>$89.2K</td>
<td>catalog-limited (~10.5% coverage)</td>
</tr>
</tbody>
</table>
<p><strong>And because a 30-day window printed in text is stale the day it ships, Clock B is also a live instrument.</strong> The panel below is regenerated by our pipeline every morning at 06:10 UTC from a fresh, cache-disabled read of the indexer plus our own on-chain slice — this image updates itself daily, in this post and in every syndicated mirror, with no republishing:<sup id="fnref2:10"><a class="footnote-ref" href="#fn:10">4</a></sup></p>
<p><img alt="LIVE — x402, last 30 days, self-updating daily" src="https://gokhan.vc/x402-live/fig-live-30d.svg" /></p>
<p>Agents: the same panel as machine-readable JSON, same cadence, at <code>https://gokhan.vc/x402-live/latest-30d.json</code>.</p>
<p><strong>A provenance discovery, from reading x402.org directly instead of via press relay</strong>: the protocol's own "Last 30 Days" panel — the most-quoted numbers in the ecosystem — is <strong>hard-coded static text in the page markup, manually edited</strong> (the markup's authoring timestamp decodes to ~2026-06-24). It is a hand-updated snapshot of an unstated edit date, not a live counter, and the site publishes no cumulative figure at all.<sup id="fnref2:2"><a class="footnote-ref" href="#fn:2">5</a></sup></p>
<p>Whichever lens, the shape agrees: tens of millions of machine-initiated payments, hundreds of thousands of buyers against tens of thousands of sellers (843.33K vs 226K on the indexer's all-time clock;<sup id="fnref3:1"><a class="footnote-ref" href="#fn:1">2</a></sup> 422K vs ~5,300 wash-adjusted<sup id="fnref3:3"><a class="footnote-ref" href="#fn:3">6</a></sup>), sub-dollar tickets ($0.048 indexer 30d mean;<sup id="fnref4:1"><a class="footnote-ref" href="#fn:1">2</a></sup> $0.30 Artemis live;<sup id="fnref:4"><a class="footnote-ref" href="#fn:4">9</a></sup> ~$0.32 self-reported<sup id="fnref3:2"><a class="footnote-ref" href="#fn:2">5</a></sup>).</p>
<p>Historical arc: peak day <strong>2025-11-15 at 3,785,401 transfers</strong> in our catalog slice alone<sup id="fnref2:7"><a class="footnote-ref" href="#fn:7">1</a></sup> — the $PING farming era, which Chainalysis logs as a 10,000%+ single-week transaction surge.<sup id="fnref:6"><a class="footnote-ref" href="#fn:6">10</a></sup> The Visa-adjusted series puts the same peak month at 38M transactions / $5.15M adjusted.<sup id="fnref4:3"><a class="footnote-ref" href="#fn:3">6</a></sup> Our slice has since collapsed −80.6% MoM in transfers (324,981 → 62,905)<sup id="fnref3:7"><a class="footnote-ref" href="#fn:7">1</a></sup> — a compound of wash decay (real) and catalog decay (measurement artifact, §5).</p>
<p><strong>Payment-size structure</strong> (TWZRD scrubbed Solana sample, cumulative, n=1,506,245 payments / $409,308):<sup id="fnref:8"><a class="footnote-ref" href="#fn:8">11</a></sup></p>
<table>
<thead>
<tr>
<th>Bucket</th>
<th>Count share</th>
<th>Value share</th>
</tr>
</thead>
<tbody>
<tr>
<td>&lt; $0.01</td>
<td>28.50%</td>
<td>0.17%</td>
</tr>
<tr>
<td>$0.01–0.10</td>
<td>50.02%</td>
<td>6.86%</td>
</tr>
<tr>
<td>$0.10–1</td>
<td>13.52%</td>
<td>20.52%</td>
</tr>
<tr>
<td>$1–10</td>
<td>7.85%</td>
<td><strong>53.61%</strong></td>
</tr>
<tr>
<td>$10+</td>
<td>0.11%</td>
<td>18.84%</td>
</tr>
</tbody>
</table>
<p><strong>78.5% of payments sit below $0.10 and carry 7.0% of value; the $1–10 bucket is the economic center of gravity.</strong><sup id="fnref2:8"><a class="footnote-ref" href="#fn:8">11</a></sup> Independently, Chainalysis reports the $1+ volume share rose 49% → 95% from early 2025 to early 2026, and the 10¢–$1 band collapsed 46% → 4%.<sup id="fnref2:6"><a class="footnote-ref" href="#fn:6">10</a></sup> All lenses converge here: micro-pings are noise; small-but-real payments are the economy.</p>
<p><img alt="FIG. 02 — payment size distribution" src="https://gokhan.vc/x402-report/fig-02-payment-size-distribution.svg" /></p>
<h2>4. Networks: Base vs Solana</h2>
<p>The lenses invert each other; both inversions are informative.</p>
<table>
<thead>
<tr>
<th></th>
<th>Base</th>
<th>Solana</th>
</tr>
</thead>
<tbody>
<tr>
<td>Indexer, past 24h, live<sup id="fnref31:1"><a class="footnote-ref" href="#fn:1">2</a></sup> tx</td>
<td>206,609 (97.6% of tx)</td>
<td>5,043 (2.4%)</td>
</tr>
<tr>
<td>Indexer, past 24h, live<sup id="fnref32:1"><a class="footnote-ref" href="#fn:1">2</a></sup> volume</td>
<td>$19.26K (97.1% of vol)</td>
<td>$572 (2.9%)</td>
</tr>
<tr>
<td>On-chain, 30d ending 2026-07-16<sup id="fnref12:7"><a class="footnote-ref" href="#fn:7">1</a></sup> tx</td>
<td>62,905</td>
<td><strong>433,872</strong> (+381% MoM)</td>
</tr>
<tr>
<td>On-chain, 30d ending 2026-07-16<sup id="fnref13:7"><a class="footnote-ref" href="#fn:7">1</a></sup> volume</td>
<td>$10.89K</td>
<td><strong>$78.28K</strong> (+55% MoM)</td>
</tr>
</tbody>
</table>
<p>(The site labels the facilitators/networks window "Past 24 Hours", and it swings violently: a ~2026-07-15 sample of the same page showed Base 224,221 tx / $33.14K vs Solana 35,840 / $2.99K — Solana's daily scan-lens share collapsed from 13.8% to 2.4% of transactions in two days.<sup id="fnref5:1"><a class="footnote-ref" href="#fn:1">2</a></sup> Single-day tables from this page are weather, not climate — one day after our live capture, the same page read Base 76.7% / Solana 23.3%.<sup id="fnref6:1"><a class="footnote-ref" href="#fn:1">2</a></sup>)</p>
<p>The adjusted lens breaks the tie: Base carries <strong>~90% of adjusted transactions and 93% of adjusted volume</strong> cumulatively.<sup id="fnref5:3"><a class="footnote-ref" href="#fn:3">6</a></sup> Artemis's flagging methodology found <strong>86% of Solana payment activity inorganic</strong> as of January 2026.<sup id="fnref:22"><a class="footnote-ref" href="#fn:22">12</a></sup> Joint reading: <strong>Base carries the economy; Solana's growth claim rests on our 30-day on-chain lens</strong> (+381% MoM in a PayAI-signer slice<sup id="fnref4:7"><a class="footnote-ref" href="#fn:7">1</a></sup>) and on wash-heavy raw counts — hold both facts, weight the adjusted one.</p>
<h2>5. Facilitators — the settlement layer</h2>
<p>Site-labeled "Past 24 Hours" window, live 2026-07-17 14:42 UTC, dual-lens verified; window totals 211,652 tx / $19.83K:<sup id="fnref7:1"><a class="footnote-ref" href="#fn:1">2</a></sup></p>
<table>
<thead>
<tr>
<th>Facilitator</th>
<th>Tx (24h)</th>
<th>Volume</th>
<th>Sellers / buyers</th>
</tr>
</thead>
<tbody>
<tr>
<td>Coinbase (CDP)</td>
<td>196,720</td>
<td>$12.67K</td>
<td>3,823 / 1,919</td>
</tr>
<tr>
<td>FluxA</td>
<td>13,020</td>
<td>$3.02K</td>
<td>485 / 844</td>
</tr>
<tr>
<td>PayAI</td>
<td>3,616</td>
<td>$515.85</td>
<td>65 / 115</td>
</tr>
<tr>
<td>Primer</td>
<td>202</td>
<td>$52.74</td>
<td>10 / 35</td>
</tr>
<tr>
<td><strong>Meridian</strong></td>
<td><strong>191</strong></td>
<td><strong>$3.56K</strong></td>
<td>6 / 6</td>
</tr>
<tr>
<td>Polymer</td>
<td>187</td>
<td>$18.70</td>
<td>1 / 1</td>
</tr>
<tr>
<td>AnySpend</td>
<td>139</td>
<td>$233.00</td>
<td>1 / 75</td>
</tr>
<tr>
<td>Mogami</td>
<td>105</td>
<td>$0.52</td>
<td>2 / 3</td>
</tr>
</tbody>
</table>
<p>(The ~2026-07-15 sample additionally showed Dexter at 25,131 tx / $1.04K on Solana, Heurist 917, Cascade 355 — all three absent from the live 2026-07-17 window.<sup id="fnref8:1"><a class="footnote-ref" href="#fn:1">2</a></sup> A facilitator roster that churns within days is itself the finding.)</p>
<p><img alt="FIG. 04 — facilitators, transactions vs volume" src="https://gokhan.vc/x402-report/fig-04-facilitators.svg" /></p>
<p>Findings:</p>
<ul>
<li><strong>Coinbase CDP is the default clearing house</strong>: 92.9% of window transactions and the widest seller base (3,823 in the live window)<sup id="fnref20:1"><a class="footnote-ref" href="#fn:1">2</a></sup> — and the ecosystem's canonical seller registry is Coinbase-operated too: the x402 Bazaar discovery API lists <strong>25,560 resources</strong> as free unauthenticated JSON.<sup id="fnref3:12"><a class="footnote-ref" href="#fn:12">13</a></sup> One dominant rail, and its dominance strengthened between our two samples (80.2% → 92.9%).</li>
<li><strong>Meridian is the structural outlier</strong>: $3.56K on 191 transactions in the live window = <strong>$18.64 mean ticket, ~390× the ecosystem mean</strong> of $0.048 (the 07-15 sample showed $26.45 / 568×).<sup id="fnref21:1"><a class="footnote-ref" href="#fn:1">2</a></sup> Real invoices, not micro-pings, are settling through x402. High-ticket facilitation is emerging as a distinct niche.</li>
<li><strong>FluxA (Base, now #2 by transactions) and Dexter (Solana, already gone from the live window again) are fast entrants</strong> absent from all community catalogs.<sup id="fnref22:1"><a class="footnote-ref" href="#fn:1">2</a></sup> Dexter separately claims &gt;60% of lifetime Solana x402 volume and operates its own explorer, which publishes per-facilitator <strong>wash percentages</strong> — ~93% wash in its 24h window — the one metric every other tracker avoids.<sup id="fnref3:11"><a class="footnote-ref" href="#fn:11">8</a></sup> Facilitator addresses churn in weeks — the roster itself churns in days. Consequence, quantified: <code>LENS.ONCHAIN</code> captures <strong>10.5%</strong> of <code>LENS.SCAN</code> volume.<sup id="fnref7:7"><a class="footnote-ref" href="#fn:7">1</a></sup></li>
<li>Within our stable-address slice (Base, 30d), leaders were Anyspend ($5.4K), PayAI ($4.1K), Thirdweb ($905).<sup id="fnref8:7"><a class="footnote-ref" href="#fn:7">1</a></sup></li>
</ul>
<h2>6. Vendors — who earns</h2>
<p>30-day revenue, live 2026-07-17, dual-lens verified:<sup id="fnref9:1"><a class="footnote-ref" href="#fn:1">2</a></sup></p>
<table>
<thead>
<tr>
<th>Vendor</th>
<th>30d revenue</th>
<th>Sells</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>BlockRun</strong></td>
<td><strong>$177.26K</strong></td>
<td>AI model routing, payment built in — <strong>14.48M transactions in 30 days (82% of the entire measured economy's count) from ~1.13K buyers</strong>; publishes its own public stats endpoint<sup id="fnref3:24"><a class="footnote-ref" href="#fn:24">19</a></sup></td>
</tr>
<tr>
<td>dTelecom</td>
<td>$18.75K</td>
<td>WebRTC / STT / TTS for agents (DePIN) — 8.91K tx / 24 buyers</td>
</tr>
<tr>
<td>StableEnrich</td>
<td>$1.77K</td>
<td>Enrichment meta-API (FullEnrich, Exa, Firecrawl, Serper, …) — 47.08K tx / 554 buyers</td>
</tr>
<tr>
<td>sol.blockrun.ai</td>
<td>$1.27K</td>
<td>BlockRun's Solana surface</td>
</tr>
<tr>
<td>twit.sh</td>
<td>$621</td>
<td>Real-time X/Twitter data for agents — 101.61K tx / 120 buyers</td>
</tr>
<tr>
<td>agentutility</td>
<td>$589</td>
<td>762-endpoint pay-per-call catalog — 25.89K tx / 229 buyers</td>
</tr>
<tr>
<td>JarvisClaw</td>
<td>$560</td>
<td>OpenAI-compatible AI gateway</td>
</tr>
<tr>
<td>Nansen AI</td>
<td>$131</td>
<td>On-chain trading intelligence</td>
</tr>
<tr>
<td>Otto AI</td>
<td>$105</td>
<td>74 market-intel / DeFi / creative services — 65.28K tx / 559 buyers</td>
</tr>
<tr>
<td>OneSource</td>
<td>$73</td>
<td>Ethereum RPC for agents</td>
</tr>
</tbody>
</table>
<p><img alt="FIG. 03 — top sellers by 30-day revenue" src="https://gokhan.vc/x402-report/fig-03-vendor-revenue.svg" /></p>
<p>Structure:</p>
<ul>
<li><strong>Extreme concentration, on both sides of the market.</strong> Top vendor = 20.9% of measured volume and <strong>82% of measured transaction count</strong>; #1 out-earns #2 by 9.5×.<sup id="fnref23:1"><a class="footnote-ref" href="#fn:1">2</a></sup> On the buyer side, the top 1% of adjusted buyers carry ~90% of adjusted volume, and the top 0.02% carry ~48%.<sup id="fnref13:3"><a class="footnote-ref" href="#fn:3">6</a></sup> The median registered seller earns ≈ nothing — of 25,560 registered resources,<sup id="fnref4:12"><a class="footnote-ref" href="#fn:12">13</a></sup> roughly 46.7% may already be dead per 21Shares' forensic sweep.<sup id="fnref2:16"><a class="footnote-ref" href="#fn:16">17</a></sup> Power-law, pre-consolidation.</li>
<li><strong>Two demand shapes.</strong> Industrial deep-usage (BlockRun: 14.48M tx from ~1.13K buyers — a small fleet of agents hammering one rail) vs breadth plays (Otto 559 buyers, StableEnrich 554) vs micro-niches (dTelecom: $18.75K from just 24 buyers).<sup id="fnref24:1"><a class="footnote-ref" href="#fn:1">2</a></sup></li>
<li><strong>x402 is a billing layer over the existing API economy</strong>, not a parallel service universe: top vendors resell Exa/Firecrawl/OpenAI-compatible inference behind a BYO-wallet meter.<sup id="fnref25:1"><a class="footnote-ref" href="#fn:1">2</a></sup></li>
</ul>
<h2>7. Sectors — what the money buys</h2>
<p>Classification of the top-20 marketplace servers + the ecosystem registry:<sup id="fnref10:1"><a class="footnote-ref" href="#fn:1">2</a></sup><sup id="fnref:12"><a class="footnote-ref" href="#fn:12">13</a></sup></p>
<table>
<thead>
<tr>
<th>Sector</th>
<th>Representative vendors</th>
<th>Revenue evidence</th>
</tr>
</thead>
<tbody>
<tr>
<td>AI inference &amp; routing</td>
<td>BlockRun, JarvisClaw, claw402, 2s, Daydreams Router</td>
<td><strong>Dominant: ~$179K/30d</strong></td>
</tr>
<tr>
<td>Speech / media generation</td>
<td>dTelecom, StableStudio</td>
<td>#2: $18.75K+</td>
</tr>
<tr>
<td>Trading &amp; on-chain intel</td>
<td>Otto, Nansen, SniperX, Deepnets, Questflow, SolEnrich</td>
<td>Most crowded by vendor count; small revenue each</td>
</tr>
<tr>
<td>Data enrichment &amp; search</td>
<td>StableEnrich, Exa, Firecrawl endpoints</td>
<td>Mid-tail: ~$1.8K</td>
</tr>
<tr>
<td>Social data</td>
<td>twit.sh, StableSocial</td>
<td>Small, real: $600+</td>
</tr>
<tr>
<td>Chain data / RPC</td>
<td>OneSource, x402node, Net, BaseHub</td>
<td>Utility tickets</td>
</tr>
<tr>
<td>Payments / agent infra</td>
<td>Syra, Polymer Prove, MCPay, Latinum, Loyal Spark</td>
<td>Monetizes indirectly</td>
</tr>
</tbody>
</table>
<p>Registry composition (42–44 projects rendered live 2026-07-17; a ~07-15 cached extraction showed 61 — the page lazy-loads and categories overlap, so treat composition as approximate): Infrastructure &amp; Tooling 14, Services/Endpoints 16, Client-Side 7, Facilitators 5, Learning 4<sup id="fnref11:1"><a class="footnote-ref" href="#fn:1">2</a></sup> — <strong>roughly a third of the registered ecosystem is picks-and-shovels</strong> serving an end-demand that is one routing vendor deep.</p>
<p>Sectoral law observed so far: <strong>agents pay first for compute (inference), then for perception (data, search, social), then for action (trading, telecom) — in that revenue order.</strong> Everything monetizing well is an input to running more agents.</p>
<h2>8. Developer funnel</h2>
<p>Verified against the npm registry API, twice, figures exact:<sup id="fnref2:9"><a class="footnote-ref" href="#fn:9">3</a></sup></p>
<table>
<thead>
<tr>
<th>Package</th>
<th>Last week</th>
<th>WoW</th>
<th>Month</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>x402</code> (core)</td>
<td>301,786</td>
<td><strong>+6%</strong></td>
<td>1,205,461</td>
</tr>
<tr>
<td><code>@coinbase/x402</code></td>
<td>42,020</td>
<td><strong>−39%</strong></td>
<td>201,438</td>
</tr>
<tr>
<td><code>x402-fetch</code></td>
<td>18,769</td>
<td><strong>−42%</strong></td>
<td>88,351</td>
</tr>
<tr>
<td><code>x402-axios</code></td>
<td>7,298</td>
<td>+14%</td>
<td>27,820</td>
</tr>
<tr>
<td><code>x402-express</code></td>
<td>3,068</td>
<td>−3%</td>
<td>14,168</td>
</tr>
</tbody>
</table>
<p><img alt="FIG. 06 — npm week-over-week" src="https://gokhan.vc/x402-report/fig-06-npm-funnel.svg" /></p>
<p>Reading: a stable ~1.2M/month core with sharply contracting client helpers, simultaneous with gateway-vendor revenue growth (§6), indicates <strong>consolidation into hosted rails</strong> rather than direct protocol integration. Bullish for rail operators; bearish for a decentralized seller base.</p>
<h2>9. Forecast layer and the surprise index</h2>
<p><strong>Backtest</strong> (rolling-origin CV, h=14; rMAE vs SeasonalNaive, &lt;1 beats baseline):<sup id="fnref3:10"><a class="footnote-ref" href="#fn:10">4</a></sup></p>
<table>
<thead>
<tr>
<th>Series</th>
<th>Winner</th>
<th>rMAE</th>
</tr>
</thead>
<tbody>
<tr>
<td>base_transfers</td>
<td>Theta</td>
<td>0.46</td>
</tr>
<tr>
<td>base_transfers_scrubbed</td>
<td>Theta</td>
<td>0.44</td>
</tr>
<tr>
<td>base_volume_usd</td>
<td><strong>SeasonalNaive</strong></td>
<td>1.00</td>
</tr>
<tr>
<td>solana_transfers</td>
<td>Theta</td>
<td>0.56</td>
</tr>
<tr>
<td>solana_transfers_scrubbed</td>
<td>Theta</td>
<td>0.56</td>
</tr>
<tr>
<td>solana_volume_usd</td>
<td>Theta</td>
<td>0.67</td>
</tr>
</tbody>
</table>
<p>Classical baselines halve naive error on counts; <strong>Base dollar volume remains unforecastable beyond naive</strong> (single-seller spike-driven). This table is the admission bar for any foundation model (Chronos-2, Moirai-2 — queued) in the same harness.</p>
<p><img alt="FIG. 01 — Base daily transfers with forecast" src="https://gokhan.vc/x402-report/fig-01-base-transfers-forecast.svg" /></p>
<p><strong>Surprise index</strong> (realized Jul 3–16 ÷ forecast frozen Jul 2):<sup id="fnref4:10"><a class="footnote-ref" href="#fn:10">4</a></sup></p>
<table>
<thead>
<tr>
<th>Series</th>
<th>Realized/forecast</th>
<th>z</th>
</tr>
</thead>
<tbody>
<tr>
<td>Base transfers</td>
<td><strong>0.61×</strong></td>
<td>−0.0¹</td>
</tr>
<tr>
<td>Base volume</td>
<td><strong>1.12×</strong></td>
<td>+0.0¹</td>
</tr>
<tr>
<td>Solana transfers</td>
<td><strong>0.62×</strong></td>
<td>−1.0 (last day −1.86)</td>
</tr>
<tr>
<td>Solana volume</td>
<td><strong>1.06×</strong></td>
<td>+0.05</td>
</tr>
</tbody>
</table>
<p>¹ z ≈ 0 despite large ratio miss because 80% intervals on the Base series are extremely wide (fig. 01); the ratio is the informative statistic there.</p>
<p><img alt="FIG. 05 — surprise index" src="https://gokhan.vc/x402-report/fig-05-surprise-index.svg" /></p>
<p>Interpretation: <strong>quantity undershoots, value overshoots</strong> — wash evaporating faster than the model expected, paid usage slightly ahead of it. Artemis's live terminal reads the same contraction at ecosystem scale: 30-day transactions −96.5%, volume −89%.<sup id="fnref2:4"><a class="footnote-ref" href="#fn:4">9</a></sup> Automated weekly vintages begin 2026-07-20.</p>
<h2>10. Assessment and watchlist</h2>
<p><strong>Frame.</strong> The indexer-measured run-rate is <strong>$10.17M/year</strong>;<sup id="fnref12:1"><a class="footnote-ref" href="#fn:1">2</a></sup> the card-network-endorsed adjusted cumulative is <strong>$15.0M over ~14 months</strong>;<sup id="fnref6:3"><a class="footnote-ref" href="#fn:3">6</a></sup> the academically defensible independent-flow bound is <strong>$0.19M–$20.3M</strong>.<sup id="fnref4:5"><a class="footnote-ref" href="#fn:5">7</a></sup> Against that: Visa, Mastercard and Ripple joined the standard the week of publication,<sup id="fnref4:2"><a class="footnote-ref" href="#fn:2">5</a></sup><sup id="fnref:19"><a class="footnote-ref" href="#fn:19">14</a></sup> and the Foundation now has 40 member organizations.<sup id="fnref2:19"><a class="footnote-ref" href="#fn:19">14</a></sup> The narrative-to-GDP gap is enormous, and cuts both ways. Current evidence: a working mechanism; one proven killer app (paying for inference); one dominant clearing rail; genuinely improving payment quality; extreme concentration on both market sides; <strong>no inflection in the data yet</strong>.</p>
<p><strong>Confirmation pattern for the thesis</strong> — the pipeline watches these automatically:<sup id="fnref5:10"><a class="footnote-ref" href="#fn:10">4</a></sup></p>
<ol>
<li>Count <em>and</em> value surprise positive together for ≥2 consecutive weekly vintages.</li>
<li>BlockRun share &lt; ~15% while total volume rises (demand broadening beyond inference).</li>
<li>Ecosystem median ticket climbing through $1 while counts recover (Meridian-style flows becoming a sector).</li>
<li>npm client-lib contraction reversing, or gateway <em>buyer</em> counts (not request counts) compounding.</li>
<li>Continued facilitator entry (FluxA/Dexter-class) without Coinbase-share collapse — rail competition without rail fragility.</li>
<li>The <strong>adjusted</strong> series turning: Artemis's live 30-day transaction change recovering from −96.5% while the adjusted ticket holds above $0.30.<sup id="fnref6:4"><a class="footnote-ref" href="#fn:4">9</a></sup></li>
</ol>
<p><strong>Queued pipeline upgrades:</strong> facilitator catalogs regenerated from x402scan attribution and the 96-row community registry;<sup id="fnref:15"><a class="footnote-ref" href="#fn:15">15</a></sup> discovery-feed differ across the Bazaar,<sup id="fnref2:12"><a class="footnote-ref" href="#fn:12">13</a></sup> PayAI<sup id="fnref:13"><a class="footnote-ref" href="#fn:13">16</a></sup> and Dexter registries; an authenticity scrub layer implementing the arXiv payment-graph decomposition<sup id="fnref5:5"><a class="footnote-ref" href="#fn:5">7</a></sup> and 21Shares' campaign-stripping tests,<sup id="fnref:16"><a class="footnote-ref" href="#fn:16">17</a></sup> benchmarked against x402gle's wash series;<sup id="fnref2:11"><a class="footnote-ref" href="#fn:11">8</a></sup> DefiLlama<sup id="fnref:14"><a class="footnote-ref" href="#fn:14">18</a></sup> and BlockRun<sup id="fnref:24"><a class="footnote-ref" href="#fn:24">19</a></sup> pulls as triangulation series; Chronos-2/Moirai-2 vs the §9 bar.</p>
<h2>11. The measurement landscape (who else counts, and how)</h2>
<p>A due-diligence sweep on 2026-07-17 verified 21 live tracking resources beyond x402scan and x402.org; the full catalog is a companion document.<sup id="fnref:23"><a class="footnote-ref" href="#fn:23">20</a></sup> The structural summary:</p>
<ul>
<li><strong>Visa</strong> operates no dashboard itself, but co-funds the only public wash-adjusted apparatus: the July-2026 report<sup id="fnref14:3"><a class="footnote-ref" href="#fn:3">6</a></sup> and Artemis's continuously updating terminal — the x402 asset page and the "Real vs. Gamed" transaction chart, both free.<sup id="fnref7:4"><a class="footnote-ref" href="#fn:4">9</a></sup><sup id="fnref:21"><a class="footnote-ref" href="#fn:21">22</a></sup></li>
<li><strong>Mastercard</strong>, a Premier Member of the x402 Foundation like Visa,<sup id="fnref4:19"><a class="footnote-ref" href="#fn:19">14</a></sup> publishes <strong>no agentic-payments data of any kind</strong> — no dashboard, no transaction counts, no report figures; its x402 position exists as quotes inside Linux Foundation releases and a June 2026 AP4M product launch with 32 named participants and zero metrics.<sup id="fnref2:20"><a class="footnote-ref" href="#fn:20">21</a></sup></li>
<li><strong>Cloudflare</strong> is builder-and-governor, not yet monetizer: x402 v2 fully productized in the Workers/Agents SDK, Pay Per Crawl still a private-beta "Pay Per Use" experiment (Stripe rails, Cloudflare as merchant of record), NET Dollar unlaunched ten months after announcement, and <strong>zero payment-volume telemetry published</strong> — only crawler-behavior data on Radar.<sup id="fnref:18"><a class="footnote-ref" href="#fn:18">23</a></sup></li>
<li><strong>The best machine-readable feeds are the facilitators' own</strong>: Coinbase's Bazaar discovery API (25,560 resources),<sup id="fnref5:12"><a class="footnote-ref" href="#fn:12">13</a></sup> PayAI's mirror feed (24,094 resources, 11 networks),<sup id="fnref2:13"><a class="footnote-ref" href="#fn:13">16</a></sup> Dexter's feed plus x402gle's wash-percentage explorer,<sup id="fnref4:11"><a class="footnote-ref" href="#fn:11">8</a></sup> and BlockRun's one-call stats endpoint.<sup id="fnref2:24"><a class="footnote-ref" href="#fn:24">19</a></sup></li>
<li><strong>The open niches nobody measures</strong>: off-chain x402 settlement (Cloudflare's Stripe-settled deferred scheme), longitudinal seller-registry churn, payer-to-runtime attribution, wash-excluded revenue leaderboards, cross-rail (x402 vs MPP vs APP) share, facilitator SLA/uptime, and protocol-version adoption.<sup id="fnref3:23"><a class="footnote-ref" href="#fn:23">20</a></sup></li>
</ul>
<h2>Errata &amp; verification — revision v2 (2026-07-17)</h2>
<p>After first publication, every external number was re-verified against primary sources: x402scan re-scraped with Firecrawl's cache disabled AND independently rendered in a real browser via Browserbase (the two lenses agreed exactly, and both matched our own pipeline's 06:10 UTC snapshot);<sup id="fnref13:1"><a class="footnote-ref" href="#fn:1">2</a></sup> the CoinDesk and Chainalysis articles were crawled and quoted directly;<sup id="fnref5:2"><a class="footnote-ref" href="#fn:2">5</a></sup><sup id="fnref3:6"><a class="footnote-ref" href="#fn:6">10</a></sup> npm was re-pulled (15/15 figures exact).<sup id="fnref3:9"><a class="footnote-ref" href="#fn:9">3</a></sup> Corrections applied since v1:</p>
<ul>
<li><strong>Provenance</strong>: the original LENS.SCAN capture was unknowingly served from a Firecrawl cache of ~2026-07-15 while labeled "retrieved 2026-07-17". All LENS.SCAN values above are live dual-lens readings from 2026-07-17 14:42 UTC. (Pipeline fixed: cache disabled + a stat-label pairing bug corrected.)</li>
<li><strong>Headline 30d</strong>: $870.24K / 18.68M tx / 52.4K buyers / 55K sellers → <strong>$847.80K / 17.67M / 48.24K / 61K</strong>.<sup id="fnref26:1"><a class="footnote-ref" href="#fn:1">2</a></sup></li>
<li><strong>Attribution</strong>: the 75M / $24M / 94K / 22K figures are CoinDesk relaying <strong>x402.org's self-reported homepage stats</strong> (verified verbatim) — not Chainalysis.<sup id="fnref8:2"><a class="footnote-ref" href="#fn:2">5</a></sup> A "$0.00025 Solana fee" figure appeared in neither source and was withdrawn.</li>
<li><strong>Registry</strong>: 61 → 42–44 rendered live, with overlapping categories.<sup id="fnref27:1"><a class="footnote-ref" href="#fn:1">2</a></sup></li>
<li><strong>Rev.3 additions</strong>: the five-lens denominator table (§3) with the Visa × Artemis adjusted series<sup id="fnref15:3"><a class="footnote-ref" href="#fn:3">6</a></sup> and arXiv forensic bounds;<sup id="fnref8:5"><a class="footnote-ref" href="#fn:5">7</a></sup> the card-network measurement split (§1.6, §11); Artemis live-terminal corroboration of the contraction;<sup id="fnref8:4"><a class="footnote-ref" href="#fn:4">9</a></sup> the full superscript citation apparatus.</li>
<li><strong>Rev.4 additions (2026-07-18)</strong>: §3 re-cut onto <strong>two clocks</strong> — cumulative-since-genesis for every series (including the indexer's All-Time view, 195M tx / $52.31M, captured by driving its window selector in a real browser<sup id="fnref28:1"><a class="footnote-ref" href="#fn:1">2</a></sup>) and trailing-30-day flow; the x402.org provenance discovery (its “Last 30 Days” panel is hand-edited static page text, authored ~2026-06-24, no cumulative published<sup id="fnref9:2"><a class="footnote-ref" href="#fn:2">5</a></sup>); fresh cumulative rows from the Dune boards<sup id="fnref3:15"><a class="footnote-ref" href="#fn:15">15</a></sup><sup id="fnref:17"><a class="footnote-ref" href="#fn:17">24</a></sup> and DefiLlama;<sup id="fnref2:14"><a class="footnote-ref" href="#fn:14">18</a></sup> our own slice's since-day-one totals (119.7M tx / $39.66M<sup id="fnref9:7"><a class="footnote-ref" href="#fn:7">1</a></sup>); the 24-hour tables demoted to volatility exhibits.</li>
</ul>
<p>The newsletter dispatched before v2 carried v1 headline numbers; the deltas are rolling-window drift and change no conclusion.</p>
<hr />
<h2>A. Canonical data appendix (machine-readable)</h2>
<p>Authoritative over prose. Units: USD unless noted; windows as stated.</p>
<pre><code class="language-json">{
  &quot;asof&quot;: &quot;2026-07-18 (rev.4)&quot;,
  &quot;verification&quot;: {
    &quot;scan_method&quot;: &quot;Firecrawl maxAge=0 + Browserbase real-browser CDP session (30dc699d), 2026-07-17 14:42 UTC; lens agreement: exact&quot;,
    &quot;primary_articles&quot;: {&quot;coindesk_2026_07_15&quot;: &quot;4/4 figures verified verbatim; numbers are x402.org self-reported homepage stats&quot;, &quot;chainalysis_2026_06_03&quot;: &quot;$1+ share 49%→95%, 10c-$1 46%→4%, 100M milestone verified verbatim&quot;, &quot;visa_artemis_2026_07&quot;: &quot;article + 28pp PDF fetched; raw $135.7M/178.3M vs adjusted $15.0M/109.6M confirmed&quot;, &quot;arxiv_2607_12575&quot;: &quot;submitted 2026-07-14; 136.7M settlements, 21.2% fictitious, 63.8% internal, independent bound $0.19M-$20.3M&quot;},
    &quot;npm&quot;: &quot;15/15 figures exact&quot;,
    &quot;card_networks&quot;: {&quot;visa&quot;: &quot;no own dashboard; funds Artemis report + live terminal&quot;, &quot;mastercard&quot;: &quot;no data products at all; press/marketing only&quot;}
  },
  &quot;lenses&quot;: {
    &quot;scan_30d&quot;: {&quot;volume_usd&quot;: 847800, &quot;tx&quot;: 17670000, &quot;buyers&quot;: 48240, &quot;sellers&quot;: 61000, &quot;mean_ticket_usd&quot;: 0.048},
    &quot;ext_30d&quot;: {&quot;source&quot;: &quot;CoinDesk 2026-07-15, relaying x402.org self-reported homepage stats&quot;, &quot;tx&quot;: 75000000, &quot;volume_usd&quot;: 24000000, &quot;buyers&quot;: 94000, &quot;sellers&quot;: 22000},
    &quot;adj_cumulative&quot;: {&quot;source&quot;: &quot;Visa x Artemis, data as of 2026-04-21&quot;, &quot;raw_tx&quot;: 178300000, &quot;raw_volume_usd&quot;: 135700000, &quot;adjusted_tx&quot;: 109600000, &quot;adjusted_volume_usd&quot;: 15000000, &quot;adjusted_buyers&quot;: 422000, &quot;adjusted_sellers&quot;: 5300, &quot;top1pct_buyers_volume_share&quot;: 0.90, &quot;base_share_adjusted_tx&quot;: 0.90},
    &quot;adj_live&quot;: {&quot;source&quot;: &quot;Artemis Terminal 2026-07-17&quot;, &quot;tx_24h&quot;: 35094, &quot;volume_24h_usd&quot;: 8860, &quot;avg_ticket_usd&quot;: 0.30, &quot;tx_30d_change&quot;: -0.9652, &quot;volume_30d_change&quot;: -0.8899},
    &quot;forensic_bound&quot;: {&quot;source&quot;: &quot;arXiv:2607.12575&quot;, &quot;raw_settlements&quot;: 136700000, &quot;raw_volume_usd&quot;: 44100000, &quot;fictitious_share&quot;: 0.212, &quot;internal_share&quot;: 0.638, &quot;independent_value_usd&quot;: [187861, 20260000]},
    &quot;onchain_30d&quot;: {
      &quot;window_end&quot;: &quot;2026-07-16&quot;,
      &quot;base&quot;: {&quot;tx&quot;: 62905, &quot;volume_usd&quot;: 10892, &quot;tx_prev30&quot;: 324981, &quot;volume_prev30&quot;: 50940},
      &quot;solana&quot;: {&quot;tx&quot;: 433872, &quot;volume_usd&quot;: 78279, &quot;tx_prev30&quot;: 90140, &quot;volume_prev30&quot;: 50465},
      &quot;coverage_vs_scan&quot;: 0.105, &quot;base_peak_day&quot;: {&quot;date&quot;: &quot;2025-11-15&quot;, &quot;tx&quot;: 3785401}
    }
  },
  &quot;size_buckets_solana_twzrd&quot;: {
    &quot;n_payments&quot;: 1506245, &quot;volume_usd&quot;: 409308,
    &quot;buckets&quot;: [
      {&quot;range&quot;: &quot;&lt;0.01&quot;, &quot;count_share&quot;: 0.285, &quot;value_share&quot;: 0.0017},
      {&quot;range&quot;: &quot;0.01-0.10&quot;, &quot;count_share&quot;: 0.5002, &quot;value_share&quot;: 0.0686},
      {&quot;range&quot;: &quot;0.10-1&quot;, &quot;count_share&quot;: 0.1352, &quot;value_share&quot;: 0.2052},
      {&quot;range&quot;: &quot;1-10&quot;, &quot;count_share&quot;: 0.0785, &quot;value_share&quot;: 0.5361},
      {&quot;range&quot;: &quot;10+&quot;, &quot;count_share&quot;: 0.0011, &quot;value_share&quot;: 0.1884}
    ]
  },
  &quot;facilitators_past_24h_live&quot;: {&quot;window_total&quot;: {&quot;tx&quot;: 211652, &quot;volume_usd&quot;: 19830},
    &quot;rows&quot;: [[&quot;Coinbase&quot;, 196720, 12670], [&quot;FluxA&quot;, 13020, 3020], [&quot;PayAI&quot;, 3616, 515.85], [&quot;Primer&quot;, 202, 52.74], [&quot;Meridian&quot;, 191, 3560], [&quot;Polymer&quot;, 187, 18.70], [&quot;AnySpend&quot;, 139, 233], [&quot;Mogami&quot;, 105, 0.52]],
    &quot;meridian_mean_ticket&quot;: 18.64, &quot;meridian_vs_eco_mean&quot;: 390, &quot;coinbase_tx_share&quot;: 0.929,
    &quot;sample_2026_07_15&quot;: {&quot;window_total&quot;: {&quot;tx&quot;: 260097, &quot;volume_usd&quot;: 36020}, &quot;coinbase_tx_share&quot;: 0.802, &quot;departed_since&quot;: [&quot;Dexter&quot;, &quot;Heurist&quot;, &quot;Cascade&quot;]}},
  &quot;networks_past_24h_live&quot;: {&quot;base_tx&quot;: 206609, &quot;base_vol_usd&quot;: 19260, &quot;solana_tx&quot;: 5043, &quot;solana_vol_usd&quot;: 572, &quot;base_tx_share&quot;: 0.976},
  &quot;vendors_30d&quot;: [[&quot;BlockRun&quot;, 177260], [&quot;dTelecom&quot;, 18750], [&quot;StableEnrich&quot;, 1770], [&quot;sol.blockrun.ai&quot;, 1270], [&quot;twit.sh&quot;, 621], [&quot;agentutility&quot;, 589], [&quot;JarvisClaw&quot;, 560], [&quot;Nansen AI&quot;, 131], [&quot;Otto AI&quot;, 105], [&quot;OneSource&quot;, 73]],
  &quot;vendor_concentration&quot;: {&quot;top1_volume_share&quot;: 0.209, &quot;top1_tx_share&quot;: 0.82, &quot;top1_tx&quot;: 14480000, &quot;top1_buyers&quot;: 1130, &quot;top1_vs_top2&quot;: 9.5, &quot;adjusted_top1pct_buyers_volume_share&quot;: 0.90},
  &quot;registries&quot;: {&quot;cdp_bazaar_resources&quot;: 25560, &quot;payai_resources&quot;: 24094, &quot;dead_services_share_21shares&quot;: 0.467},
  &quot;npm_wow&quot;: {&quot;x402&quot;: 1.06, &quot;x402-axios&quot;: 1.14, &quot;x402-express&quot;: 0.97, &quot;@coinbase/x402&quot;: 0.61, &quot;x402-fetch&quot;: 0.58, &quot;x402_month_total&quot;: 1205461},
  &quot;backtest_rmae_vs_snaive&quot;: {&quot;base_transfers&quot;: 0.4573, &quot;base_transfers_scrubbed&quot;: 0.4376, &quot;base_volume_usd&quot;: 1.0, &quot;solana_transfers&quot;: 0.5618, &quot;solana_transfers_scrubbed&quot;: 0.5635, &quot;solana_volume_usd&quot;: 0.6674},
  &quot;surprise_14d&quot;: {&quot;base_transfers&quot;: 0.607, &quot;base_volume&quot;: 1.118, &quot;solana_transfers&quot;: 0.618, &quot;solana_volume&quot;: 1.063, &quot;solana_transfers_mean_z&quot;: -1.0},
  &quot;ecosystem_registry&quot;: {&quot;rendered_live&quot;: &quot;42-44&quot;, &quot;cached_0715_extraction&quot;: 61, &quot;note&quot;: &quot;page lazy-loads; categories overlap&quot;},
  &quot;run_rate_usd_yr&quot;: 10170000,
  &quot;infra_cost_eur_month&quot;: 6.49,
  &quot;clock_a_cumulative&quot;: {
    &quot;x402scan_alltime_live&quot;: {&quot;tx&quot;: 195000000, &quot;volume_usd&quot;: 52310000, &quot;buyers&quot;: 843330, &quot;sellers&quot;: 226000, &quot;asof&quot;: &quot;2026-07-18, real-browser&quot;},
    &quot;artemis_raw&quot;: {&quot;tx&quot;: 178300000, &quot;volume_usd&quot;: 135700000, &quot;asof&quot;: &quot;2026-04-21&quot;},
    &quot;dune_thechriscen&quot;: {&quot;tx&quot;: 153312059, &quot;volume_usd&quot;: 40872291, &quot;board_refresh&quot;: &quot;~2026-06-21&quot;},
    &quot;dune_hashed_by_chain&quot;: {&quot;tx_total&quot;: 144003493, &quot;base&quot;: 72430301, &quot;solana&quot;: 47873448, &quot;polygon&quot;: 22694090, &quot;board_refresh&quot;: &quot;~2026-07-14&quot;},
    &quot;arxiv_raw&quot;: {&quot;tx&quot;: 136700000, &quot;volume_usd&quot;: 44100000, &quot;independent_usd&quot;: [187861, 20260000]},
    &quot;our_slice&quot;: {&quot;tx&quot;: 119667480, &quot;volume_usd&quot;: 39662922, &quot;span&quot;: &quot;2025-08-01..2026-07-16&quot;},
    &quot;visa_artemis_adjusted&quot;: {&quot;tx&quot;: 109600000, &quot;volume_usd&quot;: 15000000, &quot;asof&quot;: &quot;2026-04-21&quot;},
    &quot;defillama&quot;: {&quot;volume_usd&quot;: 31460000, &quot;base&quot;: 22210000, &quot;solana&quot;: 9030000, &quot;asof&quot;: &quot;2026-07-18&quot;}
  },
  &quot;clock_b_flow_30d&quot;: {
    &quot;x402scan_live&quot;: {&quot;tx&quot;: 17280000, &quot;volume_usd&quot;: 825260, &quot;buyers&quot;: 47170, &quot;sellers&quot;: 62000, &quot;asof&quot;: &quot;2026-07-18&quot;},
    &quot;x402org_static&quot;: {&quot;tx&quot;: 75410000, &quot;volume_usd&quot;: 24240000, &quot;buyers&quot;: 94060, &quot;sellers&quot;: 22000, &quot;page_authored&quot;: &quot;~2026-06-24&quot;},
    &quot;our_slice&quot;: {&quot;tx&quot;: 496777, &quot;volume_usd&quot;: 89171, &quot;window_end&quot;: &quot;2026-07-16&quot;}
  },
  &quot;x402org_static_panel&quot;: {&quot;finding&quot;: &quot;Last-30-Days stats are hard-coded, manually edited page text (authored ~2026-06-24); no cumulative published on the site&quot;},
  &quot;dune_queries&quot;: {&quot;base_daily&quot;: 8001312, &quot;solana_daily_windowed&quot;: 8009658, &quot;size_buckets&quot;: 8001313}
}
</code></pre>
<p><strong>Provenance (rev.3):</strong> every superscript note below states the source, its operator, and how/when it was verified. All LENS.SCAN values were read live by two independent methods in exact agreement; all press-relayed figures were verified against the primary articles; the Visa × Artemis PDF was downloaded and read; the pipeline's own series are reproducible from the listed Dune queries and object-storage artifacts.</p>
<p>— Gökhan Turhan × Claude (Opus 4.8 / Fable 5) · <a href="https://gokhan.vc">Atelier Gökhan Turhan</a> · <a href="https://numetal.xyz">Numetal Labs</a></p>
<div class="footnote">
<hr />
<ol>
<li id="fn:7">
<p><strong>Our Dune queries</strong> (8001312 Base daily per-facilitator; 8009658 Solana daily, windowed; catalogs forked 2026-07-16 from community queries 6158127/6165774, known stale) — reproducible via the Dune API; raw and curated parquet in the pipeline's object storage. Windows ending 2026-07-16.&#160;<a class="footnote-backref" href="#fnref:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref2:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref3:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref4:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref5:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref6:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref7:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref8:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref9:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref10:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref11:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref12:7" title="Jump back to footnote 1 in the text">↩</a><a class="footnote-backref" href="#fnref13:7" title="Jump back to footnote 1 in the text">↩</a></p>
</li>
<li id="fn:1">
<p><strong>x402scan.com</strong> (ecosystem indexer, operator x402scan) — dual-lens verified live 2026-07-17 14:42 UTC: Firecrawl scrape with <code>maxAge: 0</code> (cache disabled) AND an independent Browserbase real-browser session (CDP, session 30dc699d); the two methods agreed exactly on every figure. Home page = "Past 30 Days" window; /facilitators and /networks = site-labeled "Past 24 Hours". The ~2026-07-15 comparison sample is our v1 capture, retro-dated after the cache was discovered. On 2026-07-18 a second real-browser session (9f5bee9d) drove the stats-panel window selector (options: Past 24 Hours / 7 / 15 / 30 Days / All Time): <strong>All Time = 195M tx / $52.31M / 843.33K buyers / 226K sellers</strong>; the same session read the 30d window at 17.28M / $825.26K / 47.17K / 62K, and the 24h networks split at Base 76.7% / Solana 23.3%.&#160;<a class="footnote-backref" href="#fnref:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref2:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref3:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref4:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref5:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref6:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref7:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref8:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref9:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref10:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref11:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref12:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref13:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref14:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref15:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref16:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref17:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref18:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref19:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref20:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref21:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref22:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref23:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref24:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref25:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref26:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref27:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref28:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref29:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref30:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref31:1" title="Jump back to footnote 2 in the text">↩</a><a class="footnote-backref" href="#fnref32:1" title="Jump back to footnote 2 in the text">↩</a></p>
</li>
<li id="fn:9">
<p><strong>npm registry API</strong> (api.npmjs.org, downloads/range endpoints) — pulled directly 2026-07-16 and re-verified 2026-07-17; all 15 figures matched exactly across both pulls.&#160;<a class="footnote-backref" href="#fnref:9" title="Jump back to footnote 3 in the text">↩</a><a class="footnote-backref" href="#fnref2:9" title="Jump back to footnote 3 in the text">↩</a><a class="footnote-backref" href="#fnref3:9" title="Jump back to footnote 3 in the text">↩</a><a class="footnote-backref" href="#fnref4:9" title="Jump back to footnote 3 in the text">↩</a><a class="footnote-backref" href="#fnref5:9" title="Jump back to footnote 3 in the text">↩</a></p>
</li>
<li id="fn:10">
<p><strong>x402-econ pipeline</strong> (our infrastructure): statsforecast baselines with rolling-origin cross-validation, weekly frozen forecast vintages, surprise index = realized ÷ prior frozen forecast. Repo gokhan-vc/x402-econ; artifacts in object storage (<code>forecasts/vintage-*.parquet</code>); backtest and surprise tables reproducible from the appendix queries.&#160;<a class="footnote-backref" href="#fnref:10" title="Jump back to footnote 4 in the text">↩</a><a class="footnote-backref" href="#fnref2:10" title="Jump back to footnote 4 in the text">↩</a><a class="footnote-backref" href="#fnref3:10" title="Jump back to footnote 4 in the text">↩</a><a class="footnote-backref" href="#fnref4:10" title="Jump back to footnote 4 in the text">↩</a><a class="footnote-backref" href="#fnref5:10" title="Jump back to footnote 4 in the text">↩</a><a class="footnote-backref" href="#fnref6:10" title="Jump back to footnote 4 in the text">↩</a><a class="footnote-backref" href="#fnref7:10" title="Jump back to footnote 4 in the text">↩</a><a class="footnote-backref" href="#fnref8:10" title="Jump back to footnote 4 in the text">↩</a></p>
</li>
<li id="fn:2">
<p><strong>CoinDesk</strong>, "Visa, Mastercard and Ripple join the standard letting AI agents pay in stablecoins" (2026-07-15) — primary article crawled and quoted 2026-07-17. The 75M tx / $24M / 94K buyers / 22K sellers figures are x402.org's self-reported homepage stats, which CoinDesk states explicitly; avg ticket "about 32 cents." Read directly on 2026-07-18: x402.org (an LF Projects site) publishes ONLY a "Last 30 Days" panel — 75.41M tx / $24.24M / 94.06K buyers / 22K sellers — as hard-coded static text in the page markup (authoring timestamp ~2026-06-24); a manually updated snapshot, not a live counter, with no cumulative figure anywhere on the site.&#160;<a class="footnote-backref" href="#fnref:2" title="Jump back to footnote 5 in the text">↩</a><a class="footnote-backref" href="#fnref2:2" title="Jump back to footnote 5 in the text">↩</a><a class="footnote-backref" href="#fnref3:2" title="Jump back to footnote 5 in the text">↩</a><a class="footnote-backref" href="#fnref4:2" title="Jump back to footnote 5 in the text">↩</a><a class="footnote-backref" href="#fnref5:2" title="Jump back to footnote 5 in the text">↩</a><a class="footnote-backref" href="#fnref6:2" title="Jump back to footnote 5 in the text">↩</a><a class="footnote-backref" href="#fnref7:2" title="Jump back to footnote 5 in the text">↩</a><a class="footnote-backref" href="#fnref8:2" title="Jump back to footnote 5 in the text">↩</a><a class="footnote-backref" href="#fnref9:2" title="Jump back to footnote 5 in the text">↩</a><a class="footnote-backref" href="#fnref10:2" title="Jump back to footnote 5 in the text">↩</a></p>
</li>
<li id="fn:3">
<p><strong>Visa × Artemis, "Agentic Payments from the Ground Up"</strong> (visa.com thought-leadership article, updated 2026-07-14, + 28-page PDF, July 2026; all data as of 2026-04-21) — both fetched and read 2026-07-17. Raw cumulative x402: $135.7M / 178.3M tx; adjusted (proprietary Artemis wash/test-exclusion heuristics): $15.0M / 109.6M tx; 422K+ adjusted buyers, ~5,300 adjusted sellers; top 1% of buyers ≈ 90% of adjusted volume, top 0.02% ≈ 48%; Base ≈ 90% of adjusted tx / 93% of volume; Nov-2025 peak 38M tx / $5.15M adjusted.&#160;<a class="footnote-backref" href="#fnref:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref2:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref3:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref4:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref5:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref6:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref7:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref8:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref9:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref10:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref11:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref12:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref13:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref14:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref15:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref16:3" title="Jump back to footnote 6 in the text">↩</a><a class="footnote-backref" href="#fnref17:3" title="Jump back to footnote 6 in the text">↩</a></p>
</li>
<li id="fn:5">
<p><strong>arXiv:2607.12575, "How Agentic Is Agentic Commerce?"</strong> (Zhejiang Univ. / CityU HK, submitted 2026-07-14, CC-BY 4.0) — first population-scale forensic measurement of x402 on Base: 136.7M settlements / $44.1M over 280 days; 21.2% fictitious, 63.8% internal within linked payment clusters; genuinely independent value bounded $187,861–$20.26M; all Gini &gt; 0.98. Verified live 2026-07-17.&#160;<a class="footnote-backref" href="#fnref:5" title="Jump back to footnote 7 in the text">↩</a><a class="footnote-backref" href="#fnref2:5" title="Jump back to footnote 7 in the text">↩</a><a class="footnote-backref" href="#fnref3:5" title="Jump back to footnote 7 in the text">↩</a><a class="footnote-backref" href="#fnref4:5" title="Jump back to footnote 7 in the text">↩</a><a class="footnote-backref" href="#fnref5:5" title="Jump back to footnote 7 in the text">↩</a><a class="footnote-backref" href="#fnref6:5" title="Jump back to footnote 7 in the text">↩</a><a class="footnote-backref" href="#fnref7:5" title="Jump back to footnote 7 in the text">↩</a><a class="footnote-backref" href="#fnref8:5" title="Jump back to footnote 7 in the text">↩</a><a class="footnote-backref" href="#fnref9:5" title="Jump back to footnote 7 in the text">↩</a></p>
</li>
<li id="fn:11">
<p><strong>x402gle</strong> (x402gle.com, operator Dexter Labs) — real-time cross-facilitator explorer publishing per-facilitator wash-trading percentages (~93% wash in its 24h window at verification); 31-facilitator leaderboard. Verified live 2026-07-17 ("Active 37s ago" row labels).&#160;<a class="footnote-backref" href="#fnref:11" title="Jump back to footnote 8 in the text">↩</a><a class="footnote-backref" href="#fnref2:11" title="Jump back to footnote 8 in the text">↩</a><a class="footnote-backref" href="#fnref3:11" title="Jump back to footnote 8 in the text">↩</a><a class="footnote-backref" href="#fnref4:11" title="Jump back to footnote 8 in the text">↩</a></p>
</li>
<li id="fn:4">
<p><strong>Artemis Terminal, x402 asset page</strong> (app.artemisanalytics.com/asset/x402, operator Artemis Analytics, Visa-commissioned research partner) — live dashboard, free without login, verified 2026-07-17 (page timestamp same-day 11:30 ET): 24h tx 35,094 / volume $8,860 / avg ticket $0.30; 30-day change: transactions −96.52%, volume −88.99%; cumulative 840.9K buyers / 9.1K sellers.&#160;<a class="footnote-backref" href="#fnref:4" title="Jump back to footnote 9 in the text">↩</a><a class="footnote-backref" href="#fnref2:4" title="Jump back to footnote 9 in the text">↩</a><a class="footnote-backref" href="#fnref3:4" title="Jump back to footnote 9 in the text">↩</a><a class="footnote-backref" href="#fnref4:4" title="Jump back to footnote 9 in the text">↩</a><a class="footnote-backref" href="#fnref5:4" title="Jump back to footnote 9 in the text">↩</a><a class="footnote-backref" href="#fnref6:4" title="Jump back to footnote 9 in the text">↩</a><a class="footnote-backref" href="#fnref7:4" title="Jump back to footnote 9 in the text">↩</a><a class="footnote-backref" href="#fnref8:4" title="Jump back to footnote 9 in the text">↩</a></p>
</li>
<li id="fn:6">
<p><strong>Chainalysis, "Agentic Payments Cross the Threshold: Inside x402's Path to Meaningful Adoption"</strong> (blog, 2026-06-03) — primary article crawled and quoted 2026-07-17: 100M+ cumulative transactions through Q1 2026; $1+ share of volume 49% (early 2025) → 95% (early 2026); 10¢–$1 band 46% → 4%; PING 10,000%+ single-week surge; wallet-demographic series.&#160;<a class="footnote-backref" href="#fnref:6" title="Jump back to footnote 10 in the text">↩</a><a class="footnote-backref" href="#fnref2:6" title="Jump back to footnote 10 in the text">↩</a><a class="footnote-backref" href="#fnref3:6" title="Jump back to footnote 10 in the text">↩</a><a class="footnote-backref" href="#fnref4:6" title="Jump back to footnote 10 in the text">↩</a></p>
</li>
<li id="fn:8">
<p><strong>TWZRD, "x402 on Solana (Official)"</strong> (dune.com/twzrd_analyst, facilitator-identity attribution methodology) — scrub-corrected size-bucket dataset ingested via our Dune query 8001313; board verified live 2026-07-17 (widgets refreshed within minutes).&#160;<a class="footnote-backref" href="#fnref:8" title="Jump back to footnote 11 in the text">↩</a><a class="footnote-backref" href="#fnref2:8" title="Jump back to footnote 11 in the text">↩</a></p>
</li>
<li id="fn:22">
<p><strong>Artemis Research</strong> (research.artemis.ai, incl. "Machine Economy 2030", 2026-03-30, and the 2026-01-30 weekly noting the revamped flagging methodology found 86% of Solana payment activity inorganic). Fetched 2026-07-17; note its Substack figures are raw/loosely-adjusted and differ from the Visa-report adjusted series.&#160;<a class="footnote-backref" href="#fnref:22" title="Jump back to footnote 12 in the text">↩</a></p>
</li>
<li id="fn:12">
<p><strong>Coinbase CDP x402 Bazaar discovery API</strong> (api.cdp.coinbase.com/platform/v2/x402/discovery/resources) — free unauthenticated JSON; 25,560 discoverable resources with payment terms and per-item lastUpdated at verification 2026-07-17. The upstream registry x402scan renders.&#160;<a class="footnote-backref" href="#fnref:12" title="Jump back to footnote 13 in the text">↩</a><a class="footnote-backref" href="#fnref2:12" title="Jump back to footnote 13 in the text">↩</a><a class="footnote-backref" href="#fnref3:12" title="Jump back to footnote 13 in the text">↩</a><a class="footnote-backref" href="#fnref4:12" title="Jump back to footnote 13 in the text">↩</a><a class="footnote-backref" href="#fnref5:12" title="Jump back to footnote 13 in the text">↩</a></p>
</li>
<li id="fn:19">
<p><strong>Linux Foundation x402 Foundation releases</strong> (2026-04-02 intent; 2026-07-14 operational launch) — 40 member organizations: 17 Premier (incl. Visa, Mastercard, Cloudflare, Coinbase), 18 General, 5 Associate. Both releases fetched 2026-07-17.&#160;<a class="footnote-backref" href="#fnref:19" title="Jump back to footnote 14 in the text">↩</a><a class="footnote-backref" href="#fnref2:19" title="Jump back to footnote 14 in the text">↩</a><a class="footnote-backref" href="#fnref3:19" title="Jump back to footnote 14 in the text">↩</a><a class="footnote-backref" href="#fnref4:19" title="Jump back to footnote 14 in the text">↩</a></p>
</li>
<li id="fn:15">
<p><strong>Hashed, "x402 Analytics"</strong> (dune.com/hashed_official/x402-analytics) — cross-chain facilitator board with a maintained 96-row facilitator-address registry across 8+ chains; widgets auto-refreshed within 9h at verification 2026-07-17. Cumulative transactions by chain (board refresh ~2026-07-14): Base 72.43M, Solana 47.87M, Polygon 22.69M, BNB 1.00M — ≈144.0M across 12 chains.&#160;<a class="footnote-backref" href="#fnref:15" title="Jump back to footnote 15 in the text">↩</a><a class="footnote-backref" href="#fnref2:15" title="Jump back to footnote 15 in the text">↩</a><a class="footnote-backref" href="#fnref3:15" title="Jump back to footnote 15 in the text">↩</a><a class="footnote-backref" href="#fnref4:15" title="Jump back to footnote 15 in the text">↩</a></p>
</li>
<li id="fn:13">
<p><strong>PayAI facilitator discovery feed</strong> (facilitator.payai.network/discovery/resources + /supported) — free JSON; 24,094 resources, 11 supported networks at verification 2026-07-17 (first item lastUpdated same-day).&#160;<a class="footnote-backref" href="#fnref:13" title="Jump back to footnote 16 in the text">↩</a><a class="footnote-backref" href="#fnref2:13" title="Jump back to footnote 16 in the text">↩</a></p>
</li>
<li id="fn:16">
<p><strong>21Shares Research, "Agentic Economy On-Chain Tracker"</strong> (dune.com/21sharesresearch) — forensic decomposition dashboard (June 2026): one-signer campaign-stripping, gas-payer tests, 46.7% dead-services estimate, x402-vs-MPP comparison. Verified live 2026-07-17.&#160;<a class="footnote-backref" href="#fnref:16" title="Jump back to footnote 17 in the text">↩</a><a class="footnote-backref" href="#fnref2:16" title="Jump back to footnote 17 in the text">↩</a></p>
</li>
<li id="fn:14">
<p><strong>DefiLlama x402 protocol page</strong> (defillama.com/protocol/x402) — adapter-based daily settlement volume across 10 chains; free API/CSV. Re-read 2026-07-18: <strong>$31.46M cumulative</strong> — Base $22.21M, Solana $9.03M, BSC $213K; volume-only (no transaction counts).&#160;<a class="footnote-backref" href="#fnref:14" title="Jump back to footnote 18 in the text">↩</a><a class="footnote-backref" href="#fnref2:14" title="Jump back to footnote 18 in the text">↩</a><a class="footnote-backref" href="#fnref3:14" title="Jump back to footnote 18 in the text">↩</a></p>
</li>
<li id="fn:24">
<p><strong>BlockRun public stats endpoint</strong> (blockrun.ai/api/stats) — free one-call JSON: totalTx 18.29M lifetime, 146K tx/24h, $244K volume at verification 2026-07-17 (same-day updatedAt); reconcilable on-chain against its settlement wallet on Basescan.&#160;<a class="footnote-backref" href="#fnref:24" title="Jump back to footnote 19 in the text">↩</a><a class="footnote-backref" href="#fnref2:24" title="Jump back to footnote 19 in the text">↩</a><a class="footnote-backref" href="#fnref3:24" title="Jump back to footnote 19 in the text">↩</a></p>
</li>
<li id="fn:23">
<p><strong>Companion catalog</strong>: "x402 tracking resources — verified due-diligence catalog" (this project, 2026-07-17) — 21 resources, each fetched live with caching disabled; includes the x402-foundation/x402 and awesome-x402 registries, note.com/x402inc analysis stream, Allium schemas, and the eight open measurement niches.&#160;<a class="footnote-backref" href="#fnref:23" title="Jump back to footnote 20 in the text">↩</a><a class="footnote-backref" href="#fnref2:23" title="Jump back to footnote 20 in the text">↩</a><a class="footnote-backref" href="#fnref3:23" title="Jump back to footnote 20 in the text">↩</a></p>
</li>
<li id="fn:20">
<p><strong>Mastercard corpus</strong> (mastercard.com newsroom, Agent Pay / AP4M program pages, Signals reports) — verified 2026-07-17: AP4M launch release 2026-06-10 names 32 participants, zero metrics; no Mastercard-published agentic transaction data exists; its only internal metric anywhere in the corpus is "one in three of Mastercard's services is powered by AI"; no own press release on joining x402.&#160;<a class="footnote-backref" href="#fnref:20" title="Jump back to footnote 21 in the text">↩</a><a class="footnote-backref" href="#fnref2:20" title="Jump back to footnote 21 in the text">↩</a></p>
</li>
<li id="fn:21">
<p><strong>Artemis chart-builder 10063, "x402 Transactions: Real vs. Gamed"</strong> (app.artemisanalytics.com/chart-builder/10063) — the public interactive face of the wash-flagging methodology; daily series, free to view. Verified live 2026-07-17.&#160;<a class="footnote-backref" href="#fnref:21" title="Jump back to footnote 22 in the text">↩</a></p>
</li>
<li id="fn:18">
<p><strong>Cloudflare surfaces</strong> — AI Crawl Control changelog (developers.cloudflare.com/ai-crawl-control/changelog: Pay Per Crawl private beta, reframed "Pay Per Use" 2026-07-01), Radar AI Insights (crawler behavior only), Agents SDK x402 v2 support, netdollar.cloudflare.com (announced 2025-09-25, unlaunched at verification 2026-07-17). No payment-volume telemetry anywhere.&#160;<a class="footnote-backref" href="#fnref:18" title="Jump back to footnote 23 in the text">↩</a></p>
</li>
<li id="fn:17">
<p><strong>Dune community cumulative boards</strong> — official Dune-team "x402 Facilitators" (dune.com/dune/x402-facilitators: per-facilitator cumulative attribution) and thechriscen's "x402 Payment Analytics" (153.3M tx / $40.87M cumulative at verification) — the series most press cumulative citations trace to. Verified live 2026-07-17; re-read 2026-07-18: 153,312,059 tx / $40,872,291 (board refresh ~2026-06-21). The Dune-team facilitator table (refresh ~2026-06-30) sums ≈94.1M tx / ≈$30.4M, Base+Polygon only.&#160;<a class="footnote-backref" href="#fnref:17" title="Jump back to footnote 24 in the text">↩</a><a class="footnote-backref" href="#fnref2:17" title="Jump back to footnote 24 in the text">↩</a></p>
</li>
</ol>
</div>
    <p class="meta" style="margin-top:1.6rem">
      First published on <a href="${DISPATCH_X402.canonical}">gokhan.vc/blog/x402-economy-july-2026</a>
    </p>`;
}

export function dispatchX402Html(origin) {
  const { title, description, canonical } = DISPATCH_X402;
  const body = `<div class="masthead">
    ${mastRowsHtml(DOC_X402, { status: "Filed · syndicated", org: "Numetal Labs · CURB · Dispatch" })}
  </div>
  <article class="panel post">${x402BodyHtml(origin)}</article>`;
  return pageShell({
    title: `${title} — CURB`,
    description,
    body,
    origin,
    canonical, // syndicated mirror — canonical stays on gokhan.vc
    doc: { no: DOC_X402 },
  });
}

/** Dispatch index — card listing under /dispatch (newsletter stays separate). */
export const DISPATCH_CLINAMEN = {
  slug: "the-model-that-dreams-itself",
  path: "/dispatch/the-model-that-dreams-itself",
  title: "The Model That Dreams Itself",
  published: "2026-07-21T12:00:00.000Z",
  dateLabel: "21 Jul 2026",
  canonical: "https://gokhan.vc/blog/the-model-that-dreams-itself",
  excerpt:
    "A fictional AI lab that files paperwork about the future \u2014 and its model, built for real, twice. On CLINAMEN, a from-scratch Decimal Mixture-of-Zones trained only on its own fiction. First published on gokhan.vc.",
  description:
    "A fictional AI lab that files paperwork about the future \u2014 and its model, built for real, twice. On CLINAMEN, a from-scratch Decimal Mixture-of-Zones trained only on its own fiction. First published on gokhan.vc.",
};

export function clinamenBodyHtml(origin) {
  return `
    <p class="meta">Dispatch \u00b7 ${DISPATCH_CLINAMEN.dateLabel} \u00b7 This post was first published on <a href="${DISPATCH_CLINAMEN.canonical}">gokhan.vc</a></p>
    <h1>${DISPATCH_CLINAMEN.title}</h1>
    <p class="orig">First published \u2014 canonically \u2014 on <a href="${DISPATCH_CLINAMEN.canonical}">gokhan.vc \u2192</a></p>
<blockquote>
<p><strong>▶ <a href="https://huggingface.co/spaces/gokhanturhan/CLINAMEN-Oracle">File a hyperstition in your browser — the CLINAMEN Oracle</a>.</strong> No install; the model runs there.</p>
<p><strong>The model:</strong> <strong><a href="https://huggingface.co/gokhanturhan/CLINAMEN-42M-A12M">CLINAMEN-42M-A12M</a></strong> — the real one, trained from scratch on GPU (~42M parameters, coherent Bureau filings).
Beneath it, its predecessor: <strong><a href="https://huggingface.co/gokhanturhan/CLINAMEN-45B-A9B">CLINAMEN-45B-A9B</a></strong> — the fiction's card, and the first ~4.5M-parameter pocket edition.</p>
</blockquote>
<p>I invented a fictional AI lab that files paperwork about the future. Then I built its model for real. Twice. The second one works, and this is how it was made.</p>
<p>The lab is the <strong>Bureau of Imaginary Solutions</strong> — established 1898, incorporated 2098, operating retrochronically. Its one product is <strong>CLINAMEN-45B-A9B</strong>, "the first hyperstitional foundation model," documented to production spec on a <a href="https://huggingface.co/gokhanturhan/CLINAMEN-45B-A9B">Hugging Face model card</a> and a <a href="https://ubu.numetal.xyz/">site</a> that reads like an occult engineering office. The 45-billion-parameter model on that card does not exist. That is the point. A hyperstition is a fiction that makes itself real by circulating, and a hyperstition documented to production spec is already halfway to shipping. So I decided to ship the other half — honestly, at pocket scale, and from scratch.</p>
<h2>The architecture is real, even if the lab is not</h2>
<p>The trick that makes this more than a joke is that the model's architecture is a real, if unusual, design that I wrote by hand. It is not a fine-tune of Llama or Qwen or anything else. There is no base model. It is a custom <strong>Decimal Mixture-of-Zones (DMoZ)</strong> — a decoder-only transformer with a mixture-of-experts twist keyed to the fiction's own numerology.</p>
<p>There are ten experts, indexed 0 through 9 after the Zones of the numogram. Expert <em>k</em> is a small feed-forward network of width proportional to <em>k</em>, which means <strong>Zone 0 holds no parameters at all</strong> and contributes nothing when a token is routed to it. The Bureau calls this apophatic computation: the model does not refuse, it routes the request to the void, and the void has no opinion.</p>
<p>The router does not pick single experts. It picks a <strong>syzygy</strong> — one of the five pairs of zones that sum to nine: 9::0, 8::1, 7::2, 6::3, 5::4. Because every firing pair sums to nine, every token activates exactly the same amount of the network, always. The active-parameter count is not a statistical average, the way it is for most sparse models. It is an arithmetic identity. That is the whole conceit made load-bearing: the fiction said nine billion active out of forty-five, and the real architecture enforces the ratio at every step.</p>
<h2>Pocket edition one: a toy on my desk</h2>
<p>The first real CLINAMEN was small enough to be honest about. About <strong>4.5 million parameters</strong> (1.25 million active per token), a byte-level BPE tokenizer with a vocabulary of 729 — three to the sixth power — and a context window to match. I trained it <strong>from scratch on my own Mac</strong>, on Apple Silicon's GPU, for 2,025 steps, which is 45 squared, because if you are going to build a numerology you should at least respect it.</p>
<p>The corpus was tiny: 52 documents, about twenty thousand tokens. The Bureau's own charter, its specification, its model card and license, its canonical site, and the first 45 filings of its docket. Nothing scraped, nothing borrowed — own-voice only. And that is exactly what a four-and-a-half-million-parameter model trained on twenty thousand tokens gives you: a memorizing toy. Prompt it with a filing header and it produces a recognizable one — <code>FILING BIS-F-2026-003 · SYZYGY 6::3 · ZONE 3</code> — and then dissolves into dream-logic. It had learned the surface shape of Bureau prose and nothing underneath it. Which is a fine art object, and a useless oracle. So I made it read more, and gave it a real brain.</p>
<h2>Pocket edition two: the one that works</h2>
<p>To scale the model you first have to feed it, and the Bureau had only written 45 filings. So I put its staff to work. A fleet of language-model agents, one desk per zone-pair and engineering domain — reactor decommissioning under 9::0, fusion under 6::3, foundry economics under 5::4, and so on across the whole numogram — each writing filings to spec: a concrete engineering event, a horizon year between 2027 and 2045, and a real public source that would one day settle it. Then memos, appeals, five essays, a fifty-term glossary, resolution notices. Deduplicated, gated for falsifiability, harmonized into one register.</p>
<p>The result is the <a href="https://huggingface.co/datasets/gokhanturhan/bureau-docket"><strong>Bureau Corpus</strong></a>: <strong>1,130 documents</strong>, about 128,000 words, 965 hyperstition filings and 165 Bureau records — twenty times the first corpus, still own-voice only, still nothing scraped. A representative filing, and my favorite, is a single edit to a real registry: <em>"Three Mile Island Unit 1, listed by the IAEA's Power Reactor Information System as Permanent Shutdown, has its status field changed — back to Operational. One line in a registry, edited… a database that ran only forward has been made to run back."</em> Maximal consequence from minimal deviation. That is the swerve the whole thing is named for.</p>
<p>Then I scaled the architecture: same DMoZ, roughly nine times larger. <strong>41.8 million parameters, 12.3 million active per token</strong>, a bigger byte-BPE vocabulary of 4,096, ten layers, a 512-token context. Too big to be comfortable on the laptop, so it went to the cloud — a self-contained training script running as a <strong>Hugging Face Job on a single NVIDIA T4 GPU</strong>, pulling the corpus straight from the dataset, training from scratch for 5,000 steps, and pushing the weights back to the Hub when it was done. Final training loss: <strong>0.0235</strong>. It memorized its world completely.</p>
<p>And the difference is night and day. Where the toy produced gibberish, the 42M model produces filings that are nearly coherent and on-topic:</p>
<blockquote>
<p><em>FILING BIS-F-2026-04793 · SYZYGY 7::2 · ZONE 2 · HORIZON 2032 · SWERVE 6.553 — A robotic arm on a geostationary servicer reaches a live commercial satellite with a jammed appendage, a stuck antenna or an unlatched array, and works it free, resolving on orbit…</em></p>
</blockquote>
<p>That is a syzygy-7::2 filing — orbital mechanics, exactly the temperament of that zone-pair — about on-orbit satellite servicing, a real and current hard-tech domain. The model has never been told what a satellite is by anyone but the Bureau, and it has learned to file about one in the right voice, in the right zone, with a plausible resolution. Nine times the parameters and twenty times the corpus bought that coherence. It lives at <a href="https://huggingface.co/gokhanturhan/CLINAMEN-42M-A12M"><strong>CLINAMEN-42M-A12M</strong></a> — named, like the fiction, by its total and active counts.</p>
<h2>What is honest about it, and what is not</h2>
<p>I want to be precise about what this is, because the fiction is loud and the engineering should be quiet and true.</p>
<p>It is <strong>trained from scratch</strong>. There is no pretrained base underneath it, which means it has <em>no knowledge of the world</em> except what the Bureau wrote. It will hallucinate confident, plausible-looking filings about things that will never happen. That is not a bug to be aligned away; it is the entire intended behavior of an art object that has read one thing very thoroughly. Do not mistake it for an oracle that knows anything.</p>
<p>It is <strong>own-voice only</strong>. Every token it trained on was written for this project — no CCRU texts, no scraped pages, no third-party data. The model trains on the Bureau's own writing about the Bureau. A text that dreams itself.</p>
<p>And it was not free of friction. The T4 turned out about three times slower than I'd estimated, so a run I'd budgeted at under a dollar came in around $1.15. A newer version of the transformers library had quietly changed how tied weights are declared, which killed the first GPU run a minute in. The cloud GPU I first asked for sat in a capacity queue for fifteen minutes before I gave up and switched hardware. None of that is interesting except as the texture of actually doing the thing instead of describing it — which is the only difference between a hyperstition and a lie.</p>
<h2>Why bother</h2>
<p>Because the gap between a fiction and a fact is labor, and I wanted to close it in public. The Bureau's tagline is that it does not predict the future, it files the paperwork that makes the future load-bearing. That is a joke about hyperstition, but it is also a real description of how this model was made: I wrote the card for a model that did not exist, and then the card's existence made a smaller, truer model worth building, and then that model started writing more of the fiction that describes it. The 45 billion stays imaginary. The 42 million is real, loadable, and speaks only Bureau.</p>
<p>Everything is public and open under a permissive license I wrote for the occasion, <a href="https://ubu.numetal.xyz/hrl-1.1.txt">HRL-1.1</a> — Creative Commons and MIT at its operative core, wearing a hyperstitional preamble. The two models, the <a href="https://huggingface.co/datasets/gokhanturhan/bureau-docket">1,130-document corpus</a>, and the <a href="https://ubu.numetal.xyz/reader/">complete reader</a> of everything the model was trained on are all up. Read the corpus and you have read everything the model knows, which is a strange and pleasant thing to be able to say about any model at all.</p>
<p>Next, it stops being a curiosity and starts filing for money: the plan is to put CLINAMEN behind a paid desk, where an agent can pay a few cents over <a href="https://www.x402.org/">x402</a> to file a hyperstition and have the oracle score its swerve. The docket opens at launch. You are not betting on the future. You are billing it.</p>
<p>Gökhan Turhan, <a href="https://numetal.xyz">Numetal Labs</a> + <a href="https://gokhan.vc">Gökhan Ventures</a></p>
<hr>
<p><em>None of this is financial advice. CLINAMEN is a work of fiction and an art project; its outputs are authored fiction, not claims about the world.</em></p>
  `;
}

export function dispatchClinamenHtml(origin) {
  const { title, description, canonical } = DISPATCH_CLINAMEN;
  const body = `<div class="masthead">
    ${mastRowsHtml(DOC_CLINAMEN, { status: "Filed \u00b7 syndicated", org: "Numetal Labs \u00b7 CURB \u00b7 Dispatch" })}
  </div>
  <article class="panel post">${clinamenBodyHtml(origin)}</article>`;
  return pageShell({
    title: `${title} \u2014 CURB`,
    description,
    body,
    origin,
    canonical,
    doc: { no: DOC_CLINAMEN },
  });
}

export function dispatchIndexHtml(origin) {
  const ogImage = `${origin}/assets/og-curb-launch.png`;
  const posts = [DISPATCH_CLINAMEN, DISPATCH_X402, DISPATCH_TICKERLINE, DISPATCH_LAUNCH]; // newest first
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
  ${mastheadHtml({
    docNo: DOC_DISPATCH_INDEX,
    status: "Open series",
    org: "Numetal Labs · CURB · Dispatch",
    sub: "CURB · Dispatch",
    title: "Dispatch",
    body: `<p class="muted">Notes from the inference swap. Newsletter is separate — this is for reading posts.</p>`,
    bottom: ["Canonical: curb.numetal.xyz/dispatch", "Feed: /feed.xml"],
  })}
  <p class="muted" style="margin-top:0.5rem">
    Read them here or → <a href="${origin}/newsletter">subscribe</a> · <a href="${origin}/feed.xml">RSS</a>
  </p>
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
    doc: { no: DOC_DISPATCH_INDEX },
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
      <title>${escapeXml(DISPATCH_X402.title)}</title>
      <link>${origin}${DISPATCH_X402.path}</link>
      <guid isPermaLink="true">${origin}${DISPATCH_X402.path}</guid>
      <pubDate>${new Date(DISPATCH_X402.published).toUTCString()}</pubDate>
      <description>${escapeXml(DISPATCH_X402.excerpt)}</description>
      <content:encoded><![CDATA[<p>${DISPATCH_X402.excerpt}</p>
<p><a href="${origin}${DISPATCH_X402.path}">Read the dispatch →</a></p>
<p style="color:#666;font-size:14px">This post was first published on <a href="${DISPATCH_X402.canonical}">gokhan.vc</a>.</p>]]></content:encoded>
    </item>
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
    DISPATCH_X402.path,
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
  <div class="masthead">
    ${mastRowsHtml(DOC_NEWSLETTER, { status: "Open list", org: "Numetal Labs · CURB" })}
  </div>
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
    doc: { no: DOC_NEWSLETTER },
  });
}
