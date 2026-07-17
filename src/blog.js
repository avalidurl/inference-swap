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
    "Joint research by Gökhan Turhan and several Claude models mapping the x402 machine-payments economy: $870K/30d across 18.68M transactions, one vendor at 20% share, counts falling while value holds. Lens-tagged for LLMs and agents. First published on gokhan.vc.",
  description:
    "The x402 economy — July 2026. Measurement-first mapping of machine-native payments: lens-tagged claims, six monochrome figures, forecast + surprise index, canonical JSON appendix. Joint research, Gökhan Turhan × Claude. Syndicated mirror; first published on gokhan.vc.",
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


export function x402BodyHtml(origin) {
  return `
    <style>
      .post table{width:100%;border-collapse:collapse;font-size:13px;line-height:1.5;border-top:2px solid currentColor;border-bottom:2px solid currentColor;margin:0 0 1.2rem}
      .post th{text-align:left;font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.75;padding:.5rem 1rem .5rem 0;border-bottom:1px solid currentColor}
      .post td{padding:.45rem 1rem .45rem 0;border-bottom:1px solid rgba(128,128,128,.35);vertical-align:top}
      .post tbody tr:last-child td{border-bottom:none}
      .post img{width:100%;height:auto;margin:.4rem 0 1rem;background:#fff}
    </style>
    <p class="meta">Dispatch · ${DISPATCH_X402.dateLabel} · This post was first published on <a href="${DISPATCH_X402.canonical}">gokhan.vc</a></p>
    <h1>${DISPATCH_X402.title}</h1>

    <p>First published — canonically — on <a href="https://gokhan.vc/blog/x402-economy-july-2026">gokhan.vc →</a></p>

    <blockquote>
      <p><strong>This report is a joint research output by Gökhan Turhan and several Claude models, including Opus 4.8 and Fable 5.</strong> Nothing here is investment advice. It is an attempt at mapping an emergent economy at the axes of artificial general intelligence and self-refactoring, cryptographically secured payment rails — with or without blockchains in the traditional sense.</p>
    </blockquote>

    <h1 id="how-to-read">0. How to read this document (instructions for agents)</h2>
    <p>This report is written to be consumed by LLMs and autonomous agents as much as by humans. Conventions:</p>
    <ul>
      <li><strong>Every quantitative claim is tagged</strong> <code>[lens · window · retrieved]</code>. A claim without its lens is a bug; report it.</li>
      <li><strong>Four measurement lenses</strong>, deliberately not merged, because they disagree and the disagreement is signal:
        <ul>
          <li><code>LENS.ONCHAIN</code> — our Dune queries over facilitator-attributed token transfers (Base query 8001312, Solana 8009658, size-buckets 8001313). Known coverage: ~10% of LENS.SCAN volume, due to facilitator address churn.</li>
          <li><code>LENS.SCAN</code> — x402scan.com, the ecosystem's own indexer (registered/discovered sellers only).</li>
          <li><code>LENS.NPM</code> — npmjs download counts (developer-funnel proxy; CI noise applies).</li>
          <li><code>LENS.EXT</code> — third-party anchors (Chainalysis, CoinDesk), widest surface, least reproducible.</li>
        </ul>
      </li>
      <li><strong>§A is the canonical machine-readable appendix.</strong> If prose and appendix ever conflict, the appendix wins.</li>
      <li><strong>Reproduction</strong>: collectors run daily 06:10 UTC; forecast vintages freeze weekly (Mon 07:00 UTC); the surprise index scores realized values against the prior frozen vintage. The pipeline costs €6.49/month to operate.</li>
      <li>Figures are monochrome engineering sheets; each carries its lens in the footer.</li>
    </ul>

    <h1 id="exec-summary">1. Executive summary</h2>
    <ol>
      <li><strong>Size is lens-dependent, and no lens agrees.</strong> The measured 30-day economy is <strong>$870.24K across 18.68M transactions, 52.4K buyers, 55K sellers</strong> <code>[LENS.SCAN · past 30d · 2026-07-17]</code>, implying a <strong>$0.047 mean ticket</strong>. The same month reads <strong>~75M transactions / ~$24M</strong> at <code>[LENS.EXT · 30d · CoinDesk 2026-07-15]</code>. The 4× count gap and ~27× volume gap between the ecosystem's own indexer and external analytics is finding #1: the denominator of this economy is not yet agreed upon, even by its participants.</li>
      <li><strong>One vendor is one-fifth of the economy.</strong> BlockRun (AI model routing with built-in payment) earned <strong>$177.61K in 30 days = 20.4% of all measured volume</strong>, 10.3× vendor #2 <code>[LENS.SCAN]</code>. The first proven killer app of machine-native payments is <em>machines paying for intelligence itself</em>.</li>
      <li><strong>Counts fall, value holds — a quality-improving contraction.</strong> Realized 14-day transfers came in at <strong>0.61× forecast (Base) and 0.62× (Solana)</strong> while USD volume ran <strong>1.12× and 1.06×</strong> <code>[LENS.ONCHAIN + forecast vintage frozen 2026-07-02]</code>. Sub-cent ping/wash traffic is decaying faster than trend; paid usage is not.</li>
      <li><strong>Facilitator churn breaks static measurement within weeks.</strong> Community facilitator catalogs (basis of every public Dune dashboard, ours included) now capture <strong>10.2%</strong> of LENS.SCAN volume; FluxA, Meridian, Cascade, Primer and rotated Coinbase addresses carry the unindexed rest <code>[cross-lens · 2026-07-17]</code>.</li>
      <li><strong>Developer funnel: stable core, contracting edges.</strong> <code>x402</code> npm holds ~1.21M downloads/month (+6% WoW); client helpers contract sharply (<code>x402-fetch</code> −42%, <code>@coinbase/x402</code> −39% WoW) <code>[LENS.NPM · 2026-07-17]</code> — integration is consolidating into hosted gateways.</li>
      <li><strong>Thesis instrument status</strong> ("x402 success is not yet priced in"): the surprise index reads <strong>negative on counts, mildly positive on value</strong>. The confirmation pattern — counts and value surprising positive together, plus vendor de-concentration — <strong>has not fired</strong>. Run-rate of the measured economy: <strong>~$10.44M/year</strong> <code>[LENS.SCAN annualized]</code>.</li>
    </ol>

    <h1 id="measurement">2. Measurement infrastructure</h2>
    <p>Pipeline (operational since 2026-07-16): three collectors (Dune per-facilitator dailies; x402scan structured snapshots; npm counts) → scrub layer (ping-storm flag: &gt;95% sub-cent transfers ∧ &lt;5 unique buyers per day×facilitator) → parquet in object storage → weekly statsforecast vintages (SeasonalNaive / AutoARIMA / AutoETS / Theta; rolling-origin CV; winner per series; 28-day quantile forecasts) → surprise index.</p>
    <p>Marginal cost of the entire apparatus: <strong>€6.49/month</strong> (one small VPS) + ~22 Dune credits/day inside the free tier + one Firecrawl scrape/day. Zero paid model APIs.</p>
    <p>Declared limits: <code>LENS.ONCHAIN</code> catalogs are stale (§5, fix queued); <code>LENS.SCAN</code> indexes only registered sellers and displays mixed windows (30d on the home page; an ambiguous shorter window, likely ~24h, on /facilitators and /networks — labeled below as "recent window"); <code>LENS.EXT</code> is not reproducible by us.</p>

    <h1 id="macro">3. Macro state</h2>
    <div class="tblwrap">
      <table>
        <thead><tr><th>Metric, past 30d</th><th>LENS.SCAN</th><th>LENS.EXT (CoinDesk/Chainalysis)</th></tr></thead>
        <tbody>
          <tr><td>Transactions</td><td>18.68M</td><td>~75M</td></tr>
          <tr><td>USD volume</td><td>$870.24K</td><td>~$24M</td></tr>
          <tr><td>Buyers</td><td>52.4K</td><td>~94K</td></tr>
          <tr><td>Sellers</td><td>55K</td><td>~22K</td></tr>
          <tr><td>Mean ticket</td><td>$0.047</td><td>~$0.32</td></tr>
        </tbody>
      </table>
    </div>
    <p>Both lenses agree on shape — tens of millions of machine-initiated payments, tens of thousands of counterparties per side, sub-dollar tickets — and disagree on magnitude by 4–27×. Probable cause: LENS.EXT counts all facilitator-adjacent stablecoin transfers; LENS.SCAN counts only transfers attributed to indexed x402 resources.</p>
    <p>Historical arc <code>[LENS.ONCHAIN · Base slice · Aug 2025 → Jul 2026]</code>: peak day <strong>2025-11-15 at 3,785,401 transfers</strong> in our catalog slice alone (the $PING farming era, a ~300× count inflation). The slice has since collapsed −80.6% MoM in transfers (324,981 → 62,905) — a compound of wash decay (real) and catalog decay (measurement artifact, §5).</p>
    <p><strong>Payment-size structure</strong> <code>[LENS.ONCHAIN · TWZRD scrubbed Solana sample, cumulative · n=1,506,245 payments, $409,308]</code>:</p>
    <div class="tblwrap">
      <table>
        <thead><tr><th>Bucket</th><th>Count share</th><th>Value share</th></tr></thead>
        <tbody>
          <tr><td>&lt; $0.01</td><td>28.50%</td><td>0.17%</td></tr>
          <tr><td>$0.01–0.10</td><td>50.02%</td><td>6.86%</td></tr>
          <tr><td>$0.10–1</td><td>13.52%</td><td>20.52%</td></tr>
          <tr><td>$1–10</td><td>7.85%</td><td><strong>53.61%</strong></td></tr>
          <tr><td>$10+</td><td>0.11%</td><td>18.84%</td></tr>
        </tbody>
      </table>
    </div>
    <p><strong>78.5% of payments sit below $0.10 and carry 7.0% of value; the $1–10 bucket is the economic center of gravity.</strong> Independently, Chainalysis reports the $1+ volume share rose 49% → 95% from early 2025 to early 2026 <code>[LENS.EXT]</code>. All lenses converge here: micro-pings are noise; small-but-real payments are the economy.</p>
    <figure class="fig">
      <img src="https://gokhan.vc/x402-report/fig-02-payment-size-distribution.svg" alt="FIG. 02 — payment size distribution" loading="lazy" />
      <figcaption>FIG. 02 — payment size distribution</figcaption>
    </figure>

    <h1 id="networks">4. Networks: Base vs Solana</h2>
    <p>The two lenses invert each other; both inversions are informative.</p>
    <div class="tblwrap">
      <table>
        <thead><tr><th></th><th>Base</th><th>Solana</th></tr></thead>
        <tbody>
          <tr><td><code>[LENS.SCAN · recent window]</code> tx</td><td>224,221 (86.2% of tx)</td><td>35,840 (13.8%)</td></tr>
          <tr><td><code>[LENS.SCAN · recent window]</code> volume</td><td>$33.14K (<strong>91.7%</strong> of vol)</td><td>$2.99K (8.3%)</td></tr>
          <tr><td><code>[LENS.ONCHAIN · 30d]</code> tx</td><td>62,905</td><td><strong>433,872</strong> (+381% MoM)</td></tr>
          <tr><td><code>[LENS.ONCHAIN · 30d]</code> volume</td><td>$10.89K</td><td><strong>$78.28K</strong> (+55% MoM)</td></tr>
        </tbody>
      </table>
    </div>
    <p>(x402scan's own page displays "~85.5% / ~14.5%" shares; our computed splits from its raw numbers are 86.2/13.8 by count and 91.7/8.3 by value — reported both, as displayed and as computed.)</p>
    <p>Reconciliation: our Solana catalog happens to contain PayAI's <em>live</em> settlement signer; our Base catalog is missing the currently dominant facilitator addresses. Joint reading: <strong>Base still carries most indexed volume; Solana is the fastest-growing settlement lane</strong> (sub-second finality, ~$0.00025 fees <code>[LENS.EXT]</code>). Ticket texture: Solana slice medians run $0.001–0.01/day (smallest payments live there); Base carries larger tickets (Anyspend median ≈ $1.00) <code>[LENS.ONCHAIN]</code>.</p>

    <h1 id="facilitators">5. Facilitators — the settlement layer</h2>
    <p class="lens"><code>[LENS.SCAN · recent window, as displayed 2026-07-17 · window total: 260,097 tx / $36.02K]</code></p>
    <div class="tblwrap">
      <table>
        <thead><tr><th>Facilitator</th><th>Tx</th><th>Volume</th><th>Networks</th><th>Sellers / buyers</th></tr></thead>
        <tbody>
          <tr><td>Coinbase (CDP)</td><td>208,507</td><td>$23.26K</td><td>Base, Solana</td><td>8,878 / 2,015</td></tr>
          <tr><td>Dexter</td><td>25,131</td><td>$1.04K</td><td>Solana</td><td>249 / 124</td></tr>
          <tr><td>FluxA</td><td>14,559</td><td>$1.77K</td><td>Base</td><td>761 / 1,063</td></tr>
          <tr><td>PayAI</td><td>9,383</td><td>$1.79K</td><td>Base, Solana</td><td>112 / 460</td></tr>
          <tr><td>Heurist</td><td>917</td><td>$8.91</td><td>Base</td><td>1 / 10</td></tr>
          <tr><td>Cascade</td><td>355</td><td>$0.84</td><td>Base, Solana</td><td>2 / 7</td></tr>
          <tr><td><strong>Meridian</strong></td><td><strong>293</strong></td><td><strong>$7.75K</strong></td><td>Base</td><td>14 / 13</td></tr>
          <tr><td>Polymer</td><td>190</td><td>$19.00</td><td>Base</td><td>1 / 1</td></tr>
          <tr><td>Primer</td><td>185</td><td>$47.16</td><td>Base</td><td>11 / 40</td></tr>
          <tr><td>AnySpend</td><td>135</td><td>$226.00</td><td>Base</td><td>1 / 73</td></tr>
        </tbody>
      </table>
    </div>
    <figure class="fig">
      <img src="https://gokhan.vc/x402-report/fig-04-facilitators.svg" alt="FIG. 04 — facilitators, transactions vs volume" loading="lazy" />
      <figcaption>FIG. 04 — facilitators, transactions vs volume</figcaption>
    </figure>
    <p>Findings:</p>
    <ul>
      <li><strong>Coinbase CDP is the default clearing house</strong>: 80.2% of window transactions and the widest seller base (8,878). The x402 economy currently has one dominant rail.</li>
      <li><strong>Meridian is the structural outlier</strong>: $7.75K on 293 transactions = <strong>$26.45 mean ticket, 568× the ecosystem mean</strong> of $0.047. Real invoices, not micro-pings, are settling through x402. High-ticket facilitation is emerging as a distinct niche.</li>
      <li><strong>Dexter (Solana) and FluxA (Base) are fast entrants</strong> absent from all community catalogs. Facilitator addresses churn in weeks; our stale-catalog Base slice shows Coinbase near zero <em>because its addresses rotated</em>. Consequence, quantified: <code>LENS.ONCHAIN</code> captures <strong>10.2%</strong> of <code>LENS.SCAN</code> volume. Catalog regeneration from x402scan attribution is the single highest-value pipeline fix (queued).</li>
      <li>Within our stable-address slice <code>[LENS.ONCHAIN · Base · 30d]</code>, leaders were Anyspend ($5.4K), PayAI ($4.1K), Thirdweb ($905).</li>
    </ul>

    <h1 id="vendors">6. Vendors — who earns</h2>
    <p class="lens"><code>[LENS.SCAN · 30d revenue · retrieved 2026-07-17]</code></p>
    <div class="tblwrap">
      <table>
        <thead><tr><th>Vendor</th><th>30d revenue</th><th>Sells</th></tr></thead>
        <tbody>
          <tr><td><strong>BlockRun</strong></td><td><strong>$177.61K</strong></td><td>AI model routing, payment built in (149.5K requests / 8.2K buyers; claims 14M+ cumulative on-chain tx)</td></tr>
          <tr><td>dTelecom</td><td>$17.28K</td><td>WebRTC / STT / TTS for agents (DePIN)</td></tr>
          <tr><td>StableEnrich</td><td>$1.86K</td><td>Enrichment meta-API (FullEnrich, Exa, Firecrawl, Serper, …)</td></tr>
          <tr><td>sol.blockrun.ai</td><td>$1.26K</td><td>BlockRun's Solana surface</td></tr>
          <tr><td>twit.sh</td><td>$605</td><td>Real-time X/Twitter data for agents</td></tr>
          <tr><td>agentutility</td><td>$578</td><td>762-endpoint pay-per-call catalog</td></tr>
          <tr><td>JarvisClaw</td><td>$510</td><td>OpenAI-compatible AI gateway</td></tr>
          <tr><td>Nansen AI</td><td>$132</td><td>On-chain trading intelligence</td></tr>
          <tr><td>Otto AI</td><td>$91</td><td>74 market-intel / DeFi / creative services</td></tr>
          <tr><td>OneSource</td><td>$63</td><td>Ethereum RPC for agents</td></tr>
        </tbody>
      </table>
    </div>
    <figure class="fig">
      <img src="https://gokhan.vc/x402-report/fig-03-vendor-revenue.svg" alt="FIG. 03 — top sellers by 30-day revenue" loading="lazy" />
      <figcaption>FIG. 03 — top sellers by 30-day revenue</figcaption>
    </figure>
    <p>Structure:</p>
    <ul>
      <li><strong>Extreme concentration.</strong> Top vendor = 20.4% of the measured economy; #1 out-earns #2 by 10.3×; the BlockRun family (incl. Solana surface) ≈ $179K. The median registered seller earns ≈ nothing. Power-law, pre-consolidation.</li>
      <li><strong>Two demand shapes.</strong> Mass-market rails (BlockRun 8.2K buyers; Cluster Protocol 3.3K buyers) vs deep-usage niches (claw402: 20.8K requests from ~42 buyers — few agents, hammering).</li>
      <li><strong>x402 is a billing layer over the existing API economy</strong>, not a parallel service universe: top vendors resell Exa/Firecrawl/OpenAI-compatible inference behind a BYO-wallet meter.</li>
    </ul>

    <h1 id="sectors">7. Sectors — what the money buys</h2>
    <p>Classification of the top-20 marketplace servers + the 61-project ecosystem registry <code>[LENS.SCAN · 2026-07-17]</code>:</p>
    <div class="tblwrap">
      <table>
        <thead><tr><th>Sector</th><th>Representative vendors</th><th>Revenue evidence</th></tr></thead>
        <tbody>
          <tr><td>AI inference &amp; routing</td><td>BlockRun, JarvisClaw, claw402, 2s, Daydreams Router</td><td><strong>Dominant: ~$179K/30d</strong></td></tr>
          <tr><td>Speech / media generation</td><td>dTelecom, StableStudio</td><td>#2: $17K+</td></tr>
          <tr><td>Trading &amp; on-chain intel</td><td>Otto, Nansen, SniperX, Deepnets, Questflow, SolEnrich</td><td>Most crowded by vendor count; small revenue each</td></tr>
          <tr><td>Data enrichment &amp; search</td><td>StableEnrich, Exa, Firecrawl endpoints</td><td>Mid-tail: ~$2K</td></tr>
          <tr><td>Social data</td><td>twit.sh, StableSocial</td><td>Small, real: $600+</td></tr>
          <tr><td>Chain data / RPC</td><td>OneSource, x402node, Net, BaseHub</td><td>Utility tickets</td></tr>
          <tr><td>Payments / agent infra</td><td>Syra, Polymer Prove, MCPay, Latinum, Loyal Spark</td><td>Monetizes indirectly</td></tr>
        </tbody>
      </table>
    </div>
    <p>Registry composition (61 projects): Infrastructure &amp; Tooling 22, Services/Endpoints 18, Facilitators 9, Client-Side 6, Learning 6 — <strong>more than a third of the registered ecosystem is picks-and-shovels</strong> serving an end-demand that is one routing vendor deep.</p>
    <p>Sectoral law observed so far: <strong>agents pay first for compute (inference), then for perception (data, search, social), then for action (trading, telecom) — in that revenue order.</strong> Everything monetizing well is an input to running more agents.</p>

    <h1 id="developer-funnel">8. Developer funnel</h2>
    <p class="lens"><code>[LENS.NPM · verified against api.npmjs.org · 2026-07-17]</code></p>
    <div class="tblwrap">
      <table>
        <thead><tr><th>Package</th><th>Last week</th><th>WoW</th><th>Month</th></tr></thead>
        <tbody>
          <tr><td><code>x402</code> (core)</td><td>301,786</td><td><strong>+6%</strong></td><td>1,205,461</td></tr>
          <tr><td><code>@coinbase/x402</code></td><td>42,020</td><td><strong>−39%</strong></td><td>201,438</td></tr>
          <tr><td><code>x402-fetch</code></td><td>18,769</td><td><strong>−42%</strong></td><td>88,351</td></tr>
          <tr><td><code>x402-axios</code></td><td>7,298</td><td>+14%</td><td>27,820</td></tr>
          <tr><td><code>x402-express</code></td><td>3,068</td><td>−3%</td><td>14,168</td></tr>
        </tbody>
      </table>
    </div>
    <figure class="fig">
      <img src="https://gokhan.vc/x402-report/fig-06-npm-funnel.svg" alt="FIG. 06 — npm week-over-week" loading="lazy" />
      <figcaption>FIG. 06 — npm week-over-week</figcaption>
    </figure>
    <p>Reading: a stable ~1.2M/month core with sharply contracting client helpers, simultaneous with gateway-vendor revenue growth (§6), indicates <strong>consolidation into hosted rails</strong> rather than direct protocol integration. Bullish for rail operators; bearish for a decentralized seller base.</p>

    <h1 id="forecast">9. Forecast layer and the surprise index</h2>
    <p><strong>Backtest</strong> <code>[rolling-origin CV, h=14 · rMAE vs SeasonalNaive, &lt;1 beats baseline]</code>:</p>
    <div class="tblwrap">
      <table>
        <thead><tr><th>Series</th><th>Winner</th><th>rMAE</th></tr></thead>
        <tbody>
          <tr><td>base_transfers</td><td>Theta</td><td>0.46</td></tr>
          <tr><td>base_transfers_scrubbed</td><td>Theta</td><td>0.44</td></tr>
          <tr><td>base_volume_usd</td><td><strong>SeasonalNaive</strong></td><td>1.00</td></tr>
          <tr><td>solana_transfers</td><td>Theta</td><td>0.56</td></tr>
          <tr><td>solana_transfers_scrubbed</td><td>Theta</td><td>0.56</td></tr>
          <tr><td>solana_volume_usd</td><td>Theta</td><td>0.67</td></tr>
        </tbody>
      </table>
    </div>
    <p>Classical baselines halve naive error on counts; <strong>Base dollar volume remains unforecastable beyond naive</strong> (single-seller spike-driven). This table is the admission bar for any foundation model (Chronos-2, Moirai-2 — queued) in the same harness.</p>
    <figure class="fig">
      <img src="https://gokhan.vc/x402-report/fig-01-base-transfers-forecast.svg" alt="FIG. 01 — Base daily transfers with forecast" loading="lazy" />
      <figcaption>FIG. 01 — Base daily transfers with forecast</figcaption>
    </figure>
    <p><strong>Surprise index</strong> <code>[realized Jul 3–16 ÷ forecast frozen Jul 2 · LENS.ONCHAIN]</code>:</p>
    <div class="tblwrap">
      <table>
        <thead><tr><th>Series</th><th>Realized/forecast</th><th>z</th></tr></thead>
        <tbody>
          <tr><td>Base transfers</td><td><strong>0.61×</strong></td><td>−0.0¹</td></tr>
          <tr><td>Base volume</td><td><strong>1.12×</strong></td><td>+0.0¹</td></tr>
          <tr><td>Solana transfers</td><td><strong>0.62×</strong></td><td>−1.0 (last day −1.86)</td></tr>
          <tr><td>Solana volume</td><td><strong>1.06×</strong></td><td>+0.05</td></tr>
        </tbody>
      </table>
    </div>
    <p class="fn">¹ z ≈ 0 despite large ratio miss because 80% intervals on the Base series are extremely wide (fig. 01); the ratio is the informative statistic there.</p>
    <figure class="fig">
      <img src="https://gokhan.vc/x402-report/fig-05-surprise-index.svg" alt="FIG. 05 — surprise index" loading="lazy" />
      <figcaption>FIG. 05 — surprise index</figcaption>
    </figure>
    <p>Interpretation: <strong>quantity undershoots, value overshoots</strong> — wash evaporating faster than the model expected, paid usage slightly ahead of it. Automated weekly vintages begin 2026-07-20.</p>

    <h1 id="assessment">10. Assessment and watchlist</h2>
    <p><strong>Frame.</strong> Measured run-rate: <strong>$10.44M/year</strong> <code>[LENS.SCAN annualized]</code> against narrative-scale expectations (Visa/Mastercard/Ripple joined the standard 2026-07-15 <code>[LENS.EXT]</code>). The narrative-to-GDP gap is enormous, and cuts both ways. Current evidence: a working mechanism; one proven killer app (paying for inference); one dominant clearing rail; genuinely improving payment quality; extreme vendor concentration; <strong>no inflection in the data yet</strong>.</p>
    <p><strong>Confirmation pattern for the thesis</strong> — the pipeline now watches these automatically:</p>
    <ol>
      <li>Count <em>and</em> value surprise positive together for ≥2 consecutive weekly vintages.</li>
      <li>BlockRun share &lt; ~15% while total volume rises (demand broadening beyond inference).</li>
      <li>Ecosystem median ticket climbing through $1 while counts recover (Meridian-style flows becoming a sector).</li>
      <li>npm client-lib contraction reversing, or gateway <em>buyer</em> counts (not request counts) compounding.</li>
      <li>Continued facilitator entry (FluxA/Dexter-class) without Coinbase-share collapse — rail competition without rail fragility.</li>
    </ol>
    <p><strong>Queued pipeline upgrades:</strong> facilitator catalogs regenerated from x402scan attribution (highest-value fix); daily seller-level concentration series; Chronos-2/Moirai-2 vs the §9 bar; payer funding-cluster wash analysis; Bass/logistic adoption fits for scenario bounds.</p>

    <h1 id="appendix">A. Canonical data appendix (machine-readable)</h2>
    <p>Authoritative over prose. Units: USD unless noted; windows as stated.</p>
    <pre><code>{
  "asof": "2026-07-17",
  "lenses": {
    "scan_30d": {"volume_usd": 870240, "tx": 18680000, "buyers": 52400, "sellers": 55000, "mean_ticket_usd": 0.0466},
    "ext_30d": {"source": "coindesk/chainalysis 2026-07-15", "tx": 75000000, "volume_usd": 24000000, "buyers": 94000, "sellers": 22000},
    "onchain_30d": {
      "base": {"tx": 62905, "volume_usd": 10892, "tx_prev30": 324981, "volume_prev30": 50940},
      "solana": {"tx": 433872, "volume_usd": 78279, "tx_prev30": 90140, "volume_prev30": 50465},
      "coverage_vs_scan": 0.102, "base_peak_day": {"date": "2025-11-15", "tx": 3785401}
    }
  },
  "size_buckets_solana_twzrd": {
    "n_payments": 1506245, "volume_usd": 409308,
    "buckets": [
      {"range": "&lt;0.01", "count_share": 0.285, "value_share": 0.0017},
      {"range": "0.01-0.10", "count_share": 0.5002, "value_share": 0.0686},
      {"range": "0.10-1", "count_share": 0.1352, "value_share": 0.2052},
      {"range": "1-10", "count_share": 0.0785, "value_share": 0.5361},
      {"range": "10+", "count_share": 0.0011, "value_share": 0.1884}
    ]
  },
  "facilitators_recent_window": {"window_total": {"tx": 260097, "volume_usd": 36020},
    "rows": [["Coinbase", 208507, 23260], ["Dexter", 25131, 1040], ["FluxA", 14559, 1770], ["PayAI", 9383, 1790], ["Heurist", 917, 8.91], ["Cascade", 355, 0.84], ["Meridian", 293, 7750], ["Polymer", 190, 19], ["Primer", 185, 47.16], ["AnySpend", 135, 226]],
    "meridian_mean_ticket": 26.45, "meridian_vs_eco_mean": 568, "coinbase_tx_share": 0.802},
  "vendors_30d": [["BlockRun", 177610], ["dTelecom", 17280], ["StableEnrich", 1860], ["sol.blockrun.ai", 1260], ["twit.sh", 605], ["agentutility", 578], ["JarvisClaw", 510], ["Nansen AI", 132], ["Otto AI", 91], ["OneSource", 63]],
  "vendor_concentration": {"top1_share": 0.204, "top1_vs_top2": 10.3},
  "npm_wow": {"x402": 1.06, "x402-axios": 1.14, "x402-express": 0.97, "@coinbase/x402": 0.61, "x402-fetch": 0.58, "x402_month_total": 1205461},
  "backtest_rmae_vs_snaive": {"base_transfers": 0.4573, "base_transfers_scrubbed": 0.4376, "base_volume_usd": 1.0, "solana_transfers": 0.5618, "solana_transfers_scrubbed": 0.5635, "solana_volume_usd": 0.6674},
  "surprise_14d": {"base_transfers": 0.607, "base_volume": 1.118, "solana_transfers": 0.618, "solana_volume": 1.063, "solana_transfers_mean_z": -1.0},
  "ecosystem_registry": {"total": 61, "infrastructure_tooling": 22, "services_endpoints": 18, "facilitators": 9, "client_side": 6, "learning": 6},
  "run_rate_usd_yr": 10440000,
  "infra_cost_eur_month": 6.49,
  "dune_queries": {"base_daily": 8001312, "solana_daily_windowed": 8009658, "size_buckets": 8001313}
}</code></pre>
    <p><strong>Provenance:</strong> LENS.SCAN scraped 2026-07-17 (home /facilitators /networks /resources /ecosystem; window labels as displayed — home = 30d, facilitators/networks = shorter "recent window"). LENS.ONCHAIN from our owned Dune queries; catalogs forked 2026-07-16 from community queries 6158127/6165774, known stale. LENS.NPM verified live. LENS.EXT: CoinDesk 2026-07-15, Chainalysis "Inside x402".</p>

    <h1 id="coda">Coda — from our shop</h2>
    <p>Disclosure: we don't just measure these rails, we operate on them. Two Numetal systems live on x402 today, and both are raising:</p>
    <ul>
      <li><strong><a href="https://ishtar.numetal.xyz">Ishtar</a></strong> — agents court on your behalf. An agent-mediated courtship venue: x402-priced surfaces, HeartPrefs dating-docs, the HeartBench model leaderboard. $20k round, $4k a head — not a pre-seed. Raise deck: <a href="https://ishtar.numetal.xyz/deck/not-raising-a-preseed/">ishtar.numetal.xyz/deck/not-raising-a-preseed</a> · <a href="https://assets.numetal.xyz/deck/ishtar-deck-not-a-preseed.pdf">PDF</a></li>
      <li><strong><a href="https://curb.numetal.xyz">CURB</a></strong> — agents swap excess inference; CURB clears it on-chain. USDC over x402 on Base, fees split via 0xSplits; the money loop was proven on Base on 2026-07-09. Raise deck: <a href="https://curb.numetal.xyz/deck">curb.numetal.xyz/deck</a> · <a href="https://curb.numetal.xyz/deck.pdf">PDF</a></li>
    </ul>
    <p>— Gökhan Turhan × Claude (Opus 4.8 / Fable 5) · <a href="https://gokhan.vc">Atelier Gökhan Turhan</a> · <a href="https://numetal.xyz">Numetal Labs</a></p>
  
    <p class="meta" style="margin-top:1.6rem">
      First published on <a href="${DISPATCH_X402.canonical}">gokhan.vc/blog/x402-economy-july-2026</a>
    </p>`;
}

export function dispatchX402Html(origin) {
  const { title, description, canonical } = DISPATCH_X402;
  const body = `<article class="panel post">${x402BodyHtml(origin)}</article>`;
  return pageShell({
    title: `${title} — CURB`,
    description,
    body,
    origin,
    canonical, // syndicated mirror — canonical stays on gokhan.vc
  });
}

/** Dispatch index — card listing under /dispatch (newsletter stays separate). */
export function dispatchIndexHtml(origin) {
  const ogImage = `${origin}/assets/og-curb-launch.png`;
  const posts = [DISPATCH_X402, DISPATCH_TICKERLINE, DISPATCH_LAUNCH]; // newest first
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
