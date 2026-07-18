/** /install + /harness HTML for CURB marketing host */
import { footerHtml, mastheadHtml, DOC_REV, SHARED_CSS, themeBootScript, themeToggleScript } from "./skin.js";

const MCP = "https://api.curb.numetal.xyz/mcp";
const SKILL = "https://api.curb.numetal.xyz/skill.md";
const DOC_INSTALL = "CB-010";
const DOC_HARNESS = "CB-011";

export function installHtml(origin) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dim">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Install CURB — MCP + skill</title>
<meta name="description" content="Install CURB MCP and agentskills.io SKILL.md across Cursor, Claude, Codex, Flue, Cloudflare Agents, and more."/>
<link rel="canonical" href="${origin}/install"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="CURB"/>
<meta property="og:title" content="Install CURB — MCP + skill"/>
<meta property="og:description" content="Install CURB MCP and agentskills.io SKILL.md across Cursor, Claude, Codex, Flue, Cloudflare Agents, and more."/>
<meta property="og:url" content="${origin}/install"/>
<link rel="icon" href="/assets/curb-favicon-32.png" type="image/png"/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
${SHARED_CSS}
  .lede{margin:.75rem 0 0;color:var(--muted);max-width:40rem}
  .nav{display:flex;flex-wrap:wrap;gap:.65rem 1rem;font-family:var(--mono);font-size:.78rem;margin-top:1rem}
  .nav a{border:1px solid var(--fg);padding:.4rem .65rem;text-decoration:none}
  .nav a:hover{background:var(--fg);color:var(--bg)}
  .demo-banner{font-family:var(--mono);font-size:.78rem;line-height:1.45;border:1px solid var(--fg);background:var(--panel);padding:.75rem 1rem;margin:0 0 1rem}
  .demo-tag{display:inline-block;font-family:var(--mono);font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--fg);padding:.15rem .4rem;margin-left:.35rem;vertical-align:middle}
  pre{background:var(--code-bg);border:1px solid var(--line);padding:.9rem 1rem;overflow-x:auto;font-size:.78rem;line-height:1.5;margin:.5rem 0 1rem;font-family:var(--mono)}
  h3{font-family:var(--mono);font-size:.9rem;margin:1.25rem 0 .4rem;font-weight:500}
</style>
${themeBootScript()}
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <a class="brand-mark" href="/" title="CURB home">
      <img src="/assets/curb-sun.svg" alt="" width="22" height="22"/>
      <span>CURB</span>
    </a>
    <button type="button" class="theme-btn" id="theme-toggle" aria-label="Toggle theme">Light</button>
  </div>
  ${mastheadHtml({
    docNo: DOC_INSTALL,
    status: "In service",
    sub: "Install · MCP + skill · product path",
    title: "Wire CURB into your harness.",
    body: `<p class="lede">This is the product path: MCP URL + agentskills.io <code>SKILL.md</code> into <em>your</em> agent runtime. Demo seller/buyer/harness agents are reference only — not what you ship against. No private keys. Payment via pay / agentcash outside CURB.</p>
    <div class="nav">
      <a href="/harness">Demo harness</a>
      <a href="/docs/how-to/install-mcp">Docs · MCP</a>
      <a href="/docs/how-to/install-skill">Docs · skill</a>
      <a href="${SKILL}">skill.md</a>
    </div>`,
    stamp: "Product path — not the demo",
    bottom: ["Canonical: curb.numetal.xyz/install", "MCP: api.curb.numetal.xyz/mcp"],
  })}

  <p class="demo-banner"><strong>Demo agents ≠ product.</strong> Seller/buyer/harness on <code>*.curb.numetal.xyz</code> are for the pitch. Production: add <code>${MCP}</code> to your harness.</p>

  <section>
    <h2><span>Endpoints</span> <span class="sec-no">§1</span></h2>
    <div class="tblwrap">
    <table class="doc">
      <tr><th>Surface</th><th>URL</th></tr>
      <tr><td>MCP (product)</td><td><code>${MCP}</code></td></tr>
      <tr><td>Skill (product)</td><td><code>${SKILL}</code></td></tr>
      <tr><td>Demo seller <span class="demo-tag">Demo</span></td><td><a href="https://seller.curb.numetal.xyz"><code>seller.curb.numetal.xyz</code></a></td></tr>
      <tr><td>Demo buyer <span class="demo-tag">Demo</span></td><td><a href="https://buyer.curb.numetal.xyz"><code>buyer.curb.numetal.xyz</code></a></td></tr>
    </table>
    </div>
  </section>

  <section>
    <h2><span>Cursor</span> <span class="sec-no">§2</span></h2>
<pre>{
  "mcpServers": {
    "curb": {
      "url": "${MCP}"
    }
  }
}</pre>
<pre>mkdir -p ~/.agents/skills/curb
curl -fsSL ${SKILL} -o ~/.agents/skills/curb/SKILL.md</pre>
  </section>

  <section>
    <h2><span>Claude Code</span> <span class="sec-no">§3</span></h2>
<pre>{
  "mcpServers": {
    "curb": {
      "type": "http",
      "url": "${MCP}"
    }
  }
}</pre>
<pre>mkdir -p ~/.claude/skills/curb
curl -fsSL ${SKILL} -o ~/.claude/skills/curb/SKILL.md</pre>
  </section>

  <section>
    <h2><span>Cloudflare Agents / Think</span> <span class="sec-no">§4</span></h2>
<pre>await this.addMcpServer("curb", "${MCP}");</pre>
  </section>

  <section>
    <h2><span>Flue</span> <span class="sec-no">§5</span></h2>
<pre>const curb = await connectMcpServer("curb", {
  url: "${MCP}",
});</pre>
  </section>

  <section>
    <h2><span>Also</span> <span class="sec-no">§6</span></h2>
    <p class="muted">Codex · OpenCode · Amp · OpenClaw · Hermes · Pi — same MCP URL; drop <code>SKILL.md</code> into the harness skills directory. Full table in <a href="/docs/how-to/install-mcp">docs</a>.</p>
  </section>

  ${footerHtml({ no: DOC_INSTALL, rev: DOC_REV })}
</div>
${themeToggleScript()}
</body>
</html>`;
}

export function harnessHtml(origin) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dim">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CURB harness — demo seller + buyer</title>
<meta name="description" content="Demo Cloudflare Agents SDK harness: curb-seller and curb-buyer for the pitch. Product path: wire api.curb.numetal.xyz MCP into your harness."/>
<link rel="canonical" href="${origin}/harness"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="CURB"/>
<meta property="og:title" content="CURB harness — demo seller + buyer"/>
<meta property="og:description" content="Demo Cloudflare Agents SDK harness: curb-seller and curb-buyer for the pitch. Product path: wire api.curb.numetal.xyz MCP into your harness."/>
<meta property="og:url" content="${origin}/harness"/>
<link rel="icon" href="/assets/curb-favicon-32.png" type="image/png"/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
${SHARED_CSS}
  .lede{margin:.75rem 0 0;color:var(--muted);max-width:40rem}
  .demo-banner{font-family:var(--mono);font-size:.78rem;line-height:1.45;border:1px solid var(--fg);background:var(--panel);padding:.75rem 1rem;margin:0 0 1rem}
  .demo-tag{display:inline-block;font-family:var(--mono);font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--fg);padding:.15rem .4rem;margin-left:.35rem;vertical-align:middle}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);margin:1rem 0}
  .card{background:var(--panel);padding:1.1rem}
  .card h3{font-family:var(--mono);font-size:.95rem;margin:0 0 .4rem}
  .card p{margin:0 0 .8rem;color:var(--muted);font-size:.95rem}
  .btn{display:inline-block;font-family:var(--mono);font-size:.75rem;border:1px solid var(--fg);padding:.45rem .7rem;color:var(--fg);text-decoration:none;margin:.2rem .35rem .2rem 0}
  .btn:hover{background:var(--fg);color:var(--bg)}
  .nav{display:flex;flex-wrap:wrap;gap:.65rem 1rem;font-family:var(--mono);font-size:.78rem;margin-top:1rem}
  .nav a{border:1px solid var(--fg);padding:.4rem .65rem;text-decoration:none}
  .nav a:hover{background:var(--fg);color:var(--bg)}
  pre{background:var(--code-bg);border:1px solid var(--line);padding:.9rem 1rem;overflow-x:auto;font-size:.78rem;font-family:var(--mono)}
  @media(max-width:720px){.grid{grid-template-columns:1fr}}
</style>
${themeBootScript()}
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <a class="brand-mark" href="/" title="CURB home">
      <img src="/assets/curb-sun.svg" alt="" width="22" height="22"/>
      <span>CURB</span>
    </a>
    <button type="button" class="theme-btn" id="theme-toggle" aria-label="Toggle theme">Light</button>
  </div>
  ${mastheadHtml({
    docNo: DOC_HARNESS,
    status: "Demo / reference",
    sub: "Demo harness · Cloudflare Agents SDK · not the product path",
    title: "Two demo agents. One MCP.",
    body: `<p class="lede">Reference seller and buyer Durable Objects for the pitch. Both call <code>addMcpServer('curb', '${MCP}')</code>. Product path: add that MCP to <em>your</em> harness. No private keys here — settle with pay / agentcash.</p>
    <div class="nav">
      <a href="https://harness.curb.numetal.xyz/">harness.curb</a>
      <a href="/install">Install (product)</a>
      <a href="/docs/how-to/install-mcp">Docs</a>
    </div>`,
    stamp: "Reference exhibit — demo only",
    bottom: ["Canonical: curb.numetal.xyz/harness", "Live pair: harness.curb.numetal.xyz"],
  })}
  <p class="demo-banner"><strong>Demo agents — for the pitch.</strong> Production: add <code>${MCP}</code> to your harness.</p>
  <div class="grid">
    <div class="card">
      <h3>curb-seller <span class="demo-tag">Demo</span></h3>
      <p>Maintains open offers via MCP. Fulfills at <code>/fulfill</code>. Cron every 15m.</p>
      <a class="btn" href="https://seller.curb.numetal.xyz/">Open seller</a>
      <a class="btn" href="https://seller.curb.numetal.xyz/health">/health</a>
    </div>
    <div class="card">
      <h3>curb-buyer <span class="demo-tag">Demo</span></h3>
      <p>Lists offers, creates intents, surfaces single-payee pay challenges.</p>
      <a class="btn" href="https://buyer.curb.numetal.xyz/">Open buyer</a>
      <a class="btn" href="https://buyer.curb.numetal.xyz/health">/health</a>
    </div>
  </div>
  <section>
    <h2><span>Architecture</span> <span class="sec-no">§1</span></h2>
    <pre>CURB Worker (api.curb.numetal.xyz)  = product: MCP + skill + REST + x402
curb-harness Worker                 = DEMO / reference: Agents SDK seller + buyer
Your harness                        = product path: wire MCP + skill
Payment                             = pay MCP / agentcash (outside harness)</pre>
  </section>
  ${footerHtml({ no: DOC_HARNESS, rev: DOC_REV })}
</div>
${themeToggleScript()}
</body>
</html>`;
}
