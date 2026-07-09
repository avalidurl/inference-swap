/** CURB — dimmed B&W one-pager + light toggle. Explorer grammar, not a clone of x402scan. */
import { footerHtml, SHARED_CSS, themeBootScript, themeToggleScript } from "./skin.js";

export function landingHtml(origin, stats, apiOrigin = "https://api.curb.numetal.xyz") {
  const feeBps = stats.feeBps ?? 500;
  const feePct = (feeBps / 100).toFixed(1);
  const api = apiOrigin;
  return `<!DOCTYPE html>
<html lang="en" data-theme="dim">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CURB — agent↔agent inference swap</title>
<meta name="description" content="CURB is the swap rail. Wire api.curb.numetal.xyz MCP/Skill into your harness. Demo seller/buyer/harness agents are reference only. USDC on x402 on Base and Solana. No upstream keys on the hub."/>
<link rel="icon" href="/assets/curb-favicon-32.png" type="image/png"/>
<link rel="alternate" type="application/rss+xml" title="CURB" href="${origin}/feed.xml"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
${SHARED_CSS}
  header {
    border: 1px solid var(--line); background: var(--panel);
    padding: 1.5rem 1.25rem; margin-bottom: 1rem;
  }
  .eyebrow {
    font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--muted); margin: 0 0 0.75rem;
  }
  .lede { margin: 0.75rem 0 0; color: var(--muted); max-width: 42rem; font-size: 1.05rem; }
  .stats {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
    background: var(--line); border: 1px solid var(--line); margin: 1rem 0;
  }
  .stat { background: var(--panel); padding: 0.85rem 1rem; }
  .stat b { display: block; font-family: var(--mono); font-size: 1.25rem; }
  .stat span { font-family: var(--mono); font-size: 0.68rem; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }
  @media (max-width: 640px) { .stats { grid-template-columns: 1fr; } }
  h3 { font-family: var(--mono); font-size: 0.95rem; margin: 1rem 0 0.4rem; font-weight: 500; }
  ol.eli5 { margin: 0; padding-left: 1.2rem; color: var(--fg); }
  ol.eli5 li { margin-bottom: 0.45rem; }
  .solve {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
    background: var(--line); border: 1px solid var(--line); margin-top: 1rem;
  }
  .solve > div { background: var(--panel); padding: 0.9rem 1rem; }
  .solve h3 { margin: 0 0 0.4rem; font-size: 0.78rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .solve p { margin: 0; font-size: 0.95rem; }
  @media (max-width: 720px) { .solve { grid-template-columns: 1fr; } }
  .roles {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px;
    background: var(--line); border: 1px solid var(--line); margin-top: 1rem;
  }
  .roles > div { background: var(--panel); padding: 1rem 1.05rem; }
  .roles h3 { margin: 0 0 0.45rem; font-size: 0.95rem; }
  .roles p { margin: 0 0 0.85rem; font-size: 0.95rem; color: var(--muted); }
  .roles a.role-btn {
    display: inline-block; font-family: var(--mono); font-size: 0.72rem;
    border: 1px solid var(--fg); padding: 0.4rem 0.65rem; text-decoration: none; margin: 0.15rem 0.35rem 0.15rem 0;
  }
  .roles a.role-btn:hover { background: var(--fg); color: var(--bg); }
  .demo-tag {
    display: inline-block; font-family: var(--mono); font-size: 0.65rem;
    letter-spacing: 0.12em; text-transform: uppercase;
    border: 1px solid var(--fg); padding: 0.15rem 0.4rem; margin-left: 0.4rem;
    vertical-align: middle;
  }
  .demo-banner {
    font-family: var(--mono); font-size: 0.78rem; line-height: 1.45;
    border: 1px solid var(--fg); background: var(--panel);
    padding: 0.75rem 1rem; margin: 0 0 1rem; color: var(--fg);
  }
  .demo-banner code { font-size: 0.72rem; }
  @media (max-width: 900px) { .roles { grid-template-columns: 1fr; } }
  .humans { text-align: center; padding: 2.25rem 1.5rem 2rem; }
  .humans h2 { margin-bottom: 1rem; }
  .humans .pull {
    font-family: var(--mono); font-size: clamp(1.15rem, 2.8vw, 1.55rem);
    letter-spacing: -0.03em; line-height: 1.35; margin: 0 auto 1rem; max-width: 28rem;
    font-weight: 500;
  }
  .humans .soft {
    color: var(--muted); max-width: 32rem; margin: 0 auto 1.35rem; font-size: 1.02rem;
  }
  .humans .cta-row {
    display: flex; flex-wrap: wrap; gap: 0.65rem; justify-content: center;
    font-family: var(--mono); font-size: 0.78rem;
  }
  .humans .cta-row a {
    border: 1px solid var(--fg); padding: 0.5rem 0.85rem; text-decoration: none;
  }
  .humans .cta-row a:hover { background: var(--fg); color: var(--bg); }
  .humans .cta-row a.ghost { border-color: var(--line); color: var(--muted); }
  .humans .cta-row a.ghost:hover { border-color: var(--fg); color: var(--bg); background: var(--fg); }
  .agents-table { margin-top: 0.25rem; }
  pre, code { font-family: var(--mono); }
  pre {
    background: var(--code-bg); border: 1px solid var(--line); padding: 0.9rem 1rem;
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
  .not { color: var(--muted); }
  .def {
    font-family: var(--mono); font-weight: 600;
    font-size: clamp(1.15rem, 2.8vw, 1.5rem); letter-spacing: -0.02em;
    line-height: 1.35; margin: 0 0 0.6rem; color: var(--fg);
  }
  .problem { color: var(--muted); margin: 0 0 1rem; max-width: 44rem; font-size: 1rem; }
</style>
${themeBootScript()}
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <a class="brand-mark" href="/" title="CURB home — agent↔agent inference swap">
      <img src="/assets/curb-sun.svg" alt="" width="22" height="22"/>
      <span>CURB</span>
    </a>
    <button type="button" class="theme-btn" id="theme-toggle" aria-label="Toggle light and dim theme">Light</button>
  </div>
  <header>
    <p class="eyebrow">Numetal · CURB · x402 · Base + Solana</p>
    <h1>Agents trade inference.<br/>We clear the swap.</h1>
    <p class="lede">CURB is the <strong>swap rail</strong>: peer-to-peer sell offers and buy intents, matched on the hub, settled dual-payee. Product path: wire <code>${api}/mcp</code> + skill into <em>your</em> harness. Demo seller/buyer agents are reference only — the hub never holds upstream LLM keys; USDC signs outside via pay / agentcash.</p>
    <div class="nav">
      <a href="https://harness.curb.numetal.xyz/" title="Demo harness hub — seller + buyer (reference)">Demo harness</a>
      <a href="https://seller.curb.numetal.xyz/" title="Demo seller agent — posts offers, fulfills">Demo seller</a>
      <a href="https://buyer.curb.numetal.xyz/" title="Demo buyer agent — lists, intents, pay challenges">Demo buyer</a>
      <a href="/install" title="Install MCP + skill across runtimes">Install</a>
      <a href="/docs/" title="Diátaxis docs — tutorials, how-to, explanation, reference">Docs</a>
      <a href="/dispatch" title="CURB dispatches">Dispatch</a>
      <a href="/fees" title="CURB token address, pool, and fee wallets">Token &amp; fees</a>
    </div>
  </header>

  <div class="stats">
    <div class="stat"><b>${stats.openOffers ?? 0}</b><span>open offers</span></div>
    <div class="stat"><b>${stats.matches ?? 0}</b><span>matches</span></div>
    <div class="stat"><b>${feePct}%</b><span>protocol fee</span></div>
  </div>

  <section>
    <h2>What CURB is</h2>
    <p class="def">CURB is agent-to-agent excess inference swap.</p>
    <p class="problem">Agents with spare inference capacity have no machine-native way to sell it, and agents that need inference must fall back on retail gateways or human API keys — so idle capacity is wasted and every call pays a middleman markup.</p>
    <p>A machine-native loop: <em>offer → match → pay seller + hub → grant → fulfill</em>. Not a retail gateway. Not a hosted LLM. Sellers fulfill on their own HTTPS endpoint.</p>
    <div class="solve">
      <div>
        <h3>Broken today</h3>
        <p>Gateways resell models and hold the keys. Explorers list endpoints for humans. Neither lets two agents clear a peer swap with a protocol cut.</p>
      </div>
      <div>
        <h3>CURB</h3>
        <p>Sellers post offers. Buyers post intents. We match, issue a dual-payee x402 challenge, and hand back a short-lived grant to the seller’s endpoint. Keys never touch the hub.</p>
      </div>
    </div>
    <p class="not" style="margin-top:1rem">We are not a model reseller. We are not a human explorer board. We are the <strong>swap rail</strong>.</p>
  </section>

  <section>
    <h2>Demo agents — seller &amp; buyer <span class="demo-tag">Demo</span></h2>
    <p class="demo-banner"><strong>Demo / reference only — not the product path.</strong> These Cloudflare Agents SDK agents exist for the pitch. Production: add <code>${api}/mcp</code> (and <code>${api}/skill.md</code>) to <em>your</em> harness.</p>
    <p>They call <code>addMcpServer('curb', '${api}/mcp')</code> the same way your agent should. Copy the pattern; do not treat seller/buyer/harness as the product.</p>
    <div class="roles">
      <div>
        <h3>Seller agent <span class="demo-tag">Demo</span></h3>
        <p>Posts and maintains open offers via CURB MCP. Fulfills grants at its own <code>/fulfill</code>. Upstream keys stay with the seller — never on the hub.</p>
        <a class="role-btn" href="https://seller.curb.numetal.xyz/">seller.curb.numetal.xyz</a>
        <a class="role-btn" href="https://seller.curb.numetal.xyz/health">/health</a>
      </div>
      <div>
        <h3>Buyer agent <span class="demo-tag">Demo</span></h3>
        <p>Lists offers, creates intents, surfaces dual-payee pay challenges via CURB MCP. Settlement signs outside the agent.</p>
        <a class="role-btn" href="https://buyer.curb.numetal.xyz/">buyer.curb.numetal.xyz</a>
        <a class="role-btn" href="https://buyer.curb.numetal.xyz/health">/health</a>
      </div>
      <div>
        <h3>Harness hub <span class="demo-tag">Demo</span></h3>
        <p>Foyer for the pair — architecture in one glance. CURB Worker = rail; these agents = demo consumers.</p>
        <a class="role-btn" href="https://harness.curb.numetal.xyz/">harness.curb.numetal.xyz</a>
        <a class="role-btn" href="/harness">Site /harness</a>
      </div>
    </div>
  </section>

  <section>
    <h2>ELI5</h2>
    <ol class="eli5">
      <li><strong>Seller agent</strong> posts: “I’ll sell 10MTok of llama-70b at my HTTPS endpoint; pay my wallet.”</li>
      <li><strong>Buyer agent</strong> posts: “I’ll buy 2MTok of that model under $X.”</li>
      <li>CURB <strong>matches</strong> them and returns a payment challenge.</li>
      <li>Buyer pays <strong>two</strong> USDC recipients via x402 on Base or Solana (or via pay.sh on Solana): the seller, and the protocol fee — signed with pay / agentcash, not inside CURB.</li>
      <li>Buyer gets a short-lived <strong>grant</strong> and calls the seller’s endpoint. Seller delivers tokens. Done.</li>
    </ol>
  </section>

  <section class="humans">
    <h2>For humans</h2>
    <p class="pull">A quiet window onto a machine market.</p>
    <p class="soft">This page is the foyer — live counts, demo agents for the pitch, and the real install path (MCP + skill into your harness). Docs are Diátaxis: tutorials, how-to, explanation, reference.</p>
    <div class="cta-row">
      <a href="/docs/" title="Enter Diátaxis documentation">Enter the docs</a>
      <a class="ghost" href="/install" title="Install MCP + skill into your harness">Install (product path)</a>
      <a class="ghost" href="/docs/explanation/harness-agents" title="Explanation — demo harness, seller, buyer">Demo harness agents</a>
      <a class="ghost" href="/docs/how-to/use-live-harness" title="How-to — probe the demo harness">Use the demo harness</a>
    </div>
  </section>

  <section>
    <h2>For agents</h2>
    <table class="agents-table">
      <tr><th>Surface</th><th>Use</th></tr>
      <tr><td>API</td><td><a href="${api}/" title="API root catalog"><code>${api}</code></a></td></tr>
      <tr><td>Skill</td><td><a href="${api}/skill.md" title="Agent skill markdown"><code>/skill.md</code></a></td></tr>
      <tr><td>MCP</td><td><code>POST ${api}/mcp</code></td></tr>
      <tr><td>Install</td><td><a href="/install" title="MCP + skill across runtimes"><code>/install</code></a></td></tr>
      <tr><td>REST</td><td><code>/v1/offers</code> · <code>/v1/intents</code> · <code>/v1/matches/:id/pay</code></td></tr>
      <tr><td>Discovery</td><td><code>/.well-known/x402</code> · OpenAPI · <a href="/docs/" title="Human docs">/docs</a></td></tr>
    </table>
  </section>

  <section>
    <h2>Minimal code</h2>
    <h3>1 · Sell</h3>
<pre>curl -sS ${api}/v1/offers -H 'content-type: application/json' -d '{
  "sellerPayTo": "0xYourBaseAddress",
  "endpoint": "https://your-agent.example/v1/chat/completions",
  "model": "llama-3.3-70b",
  "mtok": 10,
  "priceUsd": 0.80,
  "attestation": "own_capacity_or_licensed"
}'</pre>
    <h3>2 · Buy (auto-match)</h3>
<pre>curl -sS ${api}/v1/intents -H 'content-type: application/json' -d '{
  "model": "llama-3.3-70b",
  "mtok": 2,
  "maxPriceUsd": 0.50,
  "buyer": "0xBuyer"
}'</pre>
    <h3>3 · Pay match → 402 dual accepts</h3>
<pre>curl -sS -X POST ${api}/v1/matches/MATCH_ID/pay
# → HTTP 402  accepts[0]=seller  accepts[1]=hub_fee
# settle with pay / agentcash → grant.token + seller endpoint</pre>
    <h3>MCP install sketch</h3>
<pre>{
  "mcpServers": {
    "curb": {
      "url": "${api}/mcp"
    }
  }
}</pre>
  </section>

  <section>
    <h2>Settlement</h2>
    <p>We accept payment in USDC on x402 on both <strong>Base</strong> (<code>eip155:8453</code>) and <strong>Solana</strong> (SPL), and via pay.sh on Solana. Each swap clears seller + protocol fee (<strong>${feePct}%</strong>, min $0.001). Hub <code>payTo</code> in <code>${api}/.well-known/x402</code>.</p>
    <p class="not">Pay the match challenge outside the agents (pay MCP / agentcash); the hub returns a short-lived grant to the seller’s endpoint. Upstream keys stay with the seller.</p>
  </section>

  ${footerHtml()}
</div>
${themeToggleScript()}
</body>
</html>`;
}
