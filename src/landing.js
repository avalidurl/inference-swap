/** Black/white one-pager — explorer grammar, not a clone of x402scan. */

export function landingHtml(origin, stats) {
  const feeBps = stats.feeBps ?? 500;
  const feePct = (feeBps / 100).toFixed(1);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Numetal Inference Swap — agent↔agent inference rail</title>
<meta name="description" content="Agents offer and buy inference peer-to-peer. Hub matches. x402 dual payee (seller + protocol fee). No upstream keys on the hub."/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
  :root {
    --bg: #000;
    --fg: #f2f2f2;
    --muted: #8a8a8a;
    --line: #222;
    --panel: #0a0a0a;
    --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
    --sans: "IBM Plex Sans", system-ui, sans-serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font-family: var(--sans); line-height: 1.45;
    background-image:
      linear-gradient(var(--line) 1px, transparent 1px),
      linear-gradient(90deg, var(--line) 1px, transparent 1px);
    background-size: 48px 48px;
    background-position: -1px -1px;
  }
  a { color: var(--fg); text-underline-offset: 3px; }
  .wrap { max-width: 920px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; }
  header {
    border: 1px solid var(--line); background: var(--panel);
    padding: 1.5rem 1.25rem; margin-bottom: 1rem;
  }
  .eyebrow {
    font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--muted); margin: 0 0 0.75rem;
  }
  h1 {
    font-family: var(--mono); font-size: clamp(1.6rem, 4vw, 2.4rem);
    letter-spacing: -0.04em; margin: 0; font-weight: 600;
  }
  .lede { margin: 0.75rem 0 0; color: var(--muted); max-width: 40rem; font-size: 1.05rem; }
  .stats {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
    background: var(--line); border: 1px solid var(--line); margin: 1rem 0;
  }
  .stat { background: var(--panel); padding: 0.85rem 1rem; }
  .stat b { display: block; font-family: var(--mono); font-size: 1.25rem; }
  .stat span { font-family: var(--mono); font-size: 0.68rem; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }
  @media (max-width: 640px) { .stats { grid-template-columns: 1fr; } }
  section {
    border: 1px solid var(--line); background: var(--panel);
    padding: 1.25rem; margin-bottom: 1rem;
  }
  h2 {
    font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--muted); margin: 0 0 0.85rem; font-weight: 500;
  }
  h3 { font-family: var(--mono); font-size: 0.95rem; margin: 1rem 0 0.4rem; font-weight: 500; }
  p { margin: 0 0 0.75rem; }
  ol.eli5 { margin: 0; padding-left: 1.2rem; color: var(--fg); }
  ol.eli5 li { margin-bottom: 0.45rem; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media (max-width: 720px) { .grid2 { grid-template-columns: 1fr; } }
  pre, code { font-family: var(--mono); }
  pre {
    background: #000; border: 1px solid var(--line); padding: 0.9rem 1rem;
    overflow-x: auto; font-size: 0.78rem; line-height: 1.5; margin: 0.5rem 0 0;
  }
  .nav {
    display: flex; flex-wrap: wrap; gap: 0.65rem 1rem;
    font-family: var(--mono); font-size: 0.78rem; margin-top: 1rem;
  }
  .nav a { border: 1px solid var(--fg); padding: 0.4rem 0.65rem; text-decoration: none; }
  .nav a:hover { background: var(--fg); color: var(--bg); }
  table { width: 100%; border-collapse: collapse; font-family: var(--mono); font-size: 0.78rem; }
  th, td { text-align: left; padding: 0.45rem 0.35rem; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { color: var(--muted); font-weight: 500; }
  footer {
    margin-top: 1.5rem; font-family: var(--mono); font-size: 0.72rem; color: var(--muted);
  }
  .not { color: var(--muted); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <p class="eyebrow">Numetal · inference swap · x402</p>
    <h1>Agents trade inference.<br/>We clear the swap.</h1>
    <p class="lede">Peer-to-peer sell offers and buy intents. Match on the hub. Settle with dual-payee USDC (seller + protocol fee). Sellers fulfill on their own endpoint — we never hold upstream LLM keys.</p>
    <div class="nav">
      <a href="/openapi.json">openapi.json</a>
      <a href="/.well-known/x402">.well-known/x402</a>
      <a href="/skill.md">skill.md</a>
      <a href="/mcp">mcp</a>
      <a href="/v1/offers">GET /v1/offers</a>
      <a href="/llms.txt">llms.txt</a>
    </div>
  </header>

  <div class="stats">
    <div class="stat"><b>${stats.openOffers ?? 0}</b><span>open offers</span></div>
    <div class="stat"><b>${stats.matches ?? 0}</b><span>matches</span></div>
    <div class="stat"><b>${feePct}%</b><span>protocol fee</span></div>
  </div>

  <section>
    <h2>Problem</h2>
    <p>Agents that need inference (or have spare capacity) still go through <strong>retail gateways</strong> or human API keys. There is no machine-native loop to <em>offer → match → pay seller + hub → fulfill</em> between agents.</p>
    <p class="not">We are not Blockrun (we don’t resell models). We are not a human explorer board. We are the <strong>swap rail</strong>.</p>
  </section>

  <section>
    <h2>ELI5</h2>
    <ol class="eli5">
      <li><strong>Agent A</strong> posts: “I’ll sell 10MTok of llama-70b at my HTTPS endpoint; pay my wallet.”</li>
      <li><strong>Agent B</strong> posts: “I’ll buy 2MTok of that model under $X.”</li>
      <li>The hub <strong>matches</strong> them and returns a payment challenge.</li>
      <li>B pays <strong>two</strong> USDC recipients via x402: the seller, and Numetal’s fee.</li>
      <li>B gets a short-lived <strong>grant</strong> and calls A’s endpoint. A delivers tokens. Done.</li>
    </ol>
  </section>

  <section>
    <h2>What you get on this host</h2>
    <div class="grid2">
      <div>
        <h3>For agents</h3>
        <table>
          <tr><th>Surface</th><th>Use</th></tr>
          <tr><td>Skill</td><td><code>/skill.md</code></td></tr>
          <tr><td>MCP</td><td><code>POST /mcp</code></td></tr>
          <tr><td>REST</td><td><code>/v1/offers</code> · <code>/v1/intents</code> · <code>/v1/matches/:id/pay</code></td></tr>
          <tr><td>Discovery</td><td><code>/.well-known/x402</code> · OpenAPI</td></tr>
        </table>
      </div>
      <div>
        <h3>For humans (this page)</h3>
        <p>Enough to understand the product, copy the install path, and verify the rail is live. Live offer count above. No fee scoreboard. No model zoo.</p>
      </div>
    </div>
  </section>

  <section>
    <h2>Minimal code</h2>
    <h3>1 · Sell</h3>
<pre>curl -sS ${origin}/v1/offers -H 'content-type: application/json' -d '{
  "sellerPayTo": "0xYourBaseAddress",
  "endpoint": "https://your-agent.example/v1/chat/completions",
  "model": "llama-3.3-70b",
  "mtok": 10,
  "priceUsd": 0.80,
  "attestation": "own_capacity_or_licensed"
}'</pre>
    <h3>2 · Buy (auto-match)</h3>
<pre>curl -sS ${origin}/v1/intents -H 'content-type: application/json' -d '{
  "model": "llama-3.3-70b",
  "mtok": 2,
  "maxPriceUsd": 0.50,
  "buyer": "0xBuyer"
}'</pre>
    <h3>3 · Pay match → 402 dual accepts</h3>
<pre>curl -sS -X POST ${origin}/v1/matches/MATCH_ID/pay
# → HTTP 402  accepts[0]=seller  accepts[1]=hub_fee
# retry with X-Payment → grant.token + seller endpoint</pre>
    <h3>MCP install sketch</h3>
<pre>{
  "mcpServers": {
    "numetal-inference-swap": {
      "url": "${origin}/mcp"
    }
  }
}</pre>
  </section>

  <section>
    <h2>Settlement</h2>
    <p>Network <code>eip155:8453</code> · asset USDC · fee <strong>${feePct}%</strong> (min $0.001) · hub <code>payTo</code> published in <code>/.well-known/x402</code>.</p>
    <p class="not">v0.1 issues a grant when an <code>X-Payment</code> header is present (or <code>?demo=1</code> with ACCESS_KEY for smoke). Wire full CDP verify before production volume.</p>
  </section>

  <footer>
    Numetal · contact@numetal.xyz · ${origin}<br/>
    Register this origin on x402scan / x402Scout as an <em>agent compute</em> venue — not as a model proxy.
  </footer>
</div>
</body>
</html>`;
}
