import { routeAgentRequest, getAgentByName } from "agents";
import { CurbSeller } from "./seller";
import { CurbBuyer } from "./buyer";
import { type HarnessEnv, CURB_MCP, CURB_API, CURB_SITE, html, json } from "./shared";
import {
  THEME_CSS,
  themeBootScript,
  themeToggleButton,
  themeToggleScript,
  mastStrip,
  docColophon,
} from "./theme";

const DOC_HARNESS_HUB = "CB-080";

export { CurbSeller, CurbBuyer };

const SELLER_HOSTS = new Set(["seller.curb.numetal.xyz"]);
const BUYER_HOSTS = new Set(["buyer.curb.numetal.xyz"]);

function harnessLanding(origin: string): string {
  const seller = "https://seller.curb.numetal.xyz";
  const buyer = "https://buyer.curb.numetal.xyz";
  return `<!DOCTYPE html>
<html lang="en" data-theme="dim">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CURB harness — demo seller + buyer</title>
<meta name="description" content="Demo Cloudflare Agents SDK harness for the pitch. Product path: add https://api.curb.numetal.xyz/mcp to your harness."/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
${THEME_CSS}
.wrap{max-width:820px;margin:0 auto;padding:1.5rem}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
.top a{color:var(--fg);font-family:var(--mono);font-size:.78rem;text-decoration:none;border-bottom:1px solid var(--line)}
.eyebrow{font-family:var(--mono);font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.demo-banner{font-family:var(--mono);font-size:.78rem;line-height:1.45;border:1px solid var(--fg);background:var(--panel);padding:.75rem 1rem;margin:1rem 0}
h1{font-size:clamp(1.6rem,4vw,2.2rem);letter-spacing:-.03em;margin:.4rem 0}
.lede{color:var(--muted);max-width:40rem}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);margin:1.25rem 0}
.card{background:var(--panel);padding:1.1rem}
.card h2{font-family:var(--mono);font-size:.95rem;margin:0 0 .4rem}
.card p{margin:0 0 .8rem;color:var(--muted);font-size:.95rem}
.demo-tag{display:inline-block;font-family:var(--mono);font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--fg);padding:.15rem .4rem;margin-left:.35rem;vertical-align:middle}
a.btn{display:inline-block;font-family:var(--mono);font-size:.75rem;border:1px solid var(--fg);padding:.45rem .7rem;color:var(--fg);text-decoration:none;margin:.2rem .35rem .2rem 0}
a.btn:hover{background:var(--fg);color:var(--bg)}
pre{background:var(--code-bg);border:1px solid var(--line);padding:.85rem;font:12px/1.45 var(--mono);overflow:auto}
@media(max-width:720px){.grid{grid-template-columns:1fr}}
</style>
${themeBootScript()}
</head>
<body>
<div class="wrap">
  <div class="top">
    <a href="${CURB_SITE}">← CURB</a>
    ${themeToggleButton()}
  </div>
  ${mastStrip(DOC_HARNESS_HUB)}
  <p class="eyebrow">Numetal · CURB · Demo harness · not the product path</p>
  <h1>Two demo agents. One MCP.</h1>
  <p class="demo-banner"><strong>Demo agents — for the pitch.</strong> Production: add <code>https://api.curb.numetal.xyz/mcp</code> to your harness.</p>
  <p class="lede">Cloudflare Agents SDK reference consumers. Both call <code>addMcpServer('curb', '${CURB_MCP}')</code> — copy that into <em>your</em> harness. Seller keeps the book filled; buyer lists, intents, and surfaces the pay challenge. No private keys here — settle with pay / agentcash.</p>
  <div class="grid">
    <div class="card">
      <h2>curb-seller <span class="demo-tag">Demo</span></h2>
      <p>Posts &amp; maintains open offers. Fulfills at <code>/fulfill</code>.</p>
      <a class="btn" href="${seller}/">Open seller</a>
      <a class="btn" href="${seller}/health">/health</a>
    </div>
    <div class="card">
      <h2>curb-buyer <span class="demo-tag">Demo</span></h2>
      <p>Lists offers, creates intents, fetches single-payee challenges.</p>
      <a class="btn" href="${buyer}/">Open buyer</a>
      <a class="btn" href="${buyer}/health">/health</a>
    </div>
  </div>
  <h2 style="font-family:var(--mono);font-size:.85rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase">Agent routes</h2>
  <pre>Seller DO: ${origin}/agents/curb-seller/default
Buyer DO:  ${origin}/agents/curb-buyer/default
CURB API:  ${CURB_API}
CURB MCP:  ${CURB_MCP}</pre>
  ${docColophon(DOC_HARNESS_HUB, "harness.curb.numetal.xyz")}
</div>
${themeToggleScript()}
</body>
</html>`;
}

async function forwardToAgent(
  env: HarnessEnv,
  binding: "CurbSeller" | "CurbBuyer",
  name: string,
  request: Request
): Promise<Response> {
  const ns = env[binding];
  const stub = await getAgentByName(ns, name);
  return stub.fetch(request);
}

export default {
  async fetch(request: Request, env: HarnessEnv): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type, authorization",
        },
      });
    }

    // Friendly host aliases → default agent instances
    if (SELLER_HOSTS.has(host)) {
      return forwardToAgent(env, "CurbSeller", "default", request);
    }
    if (BUYER_HOSTS.has(host)) {
      return forwardToAgent(env, "CurbBuyer", "default", request);
    }

    // Convenience aliases on harness host
    if (path === "/seller" || path.startsWith("/seller/")) {
      const rewritten = new URL(request.url);
      rewritten.pathname = path.replace(/^\/seller/, "") || "/";
      return forwardToAgent(env, "CurbSeller", "default", new Request(rewritten, request));
    }
    if (path === "/buyer" || path.startsWith("/buyer/")) {
      const rewritten = new URL(request.url);
      rewritten.pathname = path.replace(/^\/buyer/, "") || "/";
      return forwardToAgent(env, "CurbBuyer", "default", new Request(rewritten, request));
    }

    if (path === "/health") {
      return json({
        ok: true,
        service: "curb-harness",
        demo: true,
        note: "Demo / reference agents for the pitch — not the product path. Production: add https://api.curb.numetal.xyz/mcp to your harness.",
        agents: {
          seller: "https://seller.curb.numetal.xyz",
          buyer: "https://buyer.curb.numetal.xyz",
        },
        mcp: env.CURB_MCP_URL || CURB_MCP,
        api: env.CURB_API_URL || CURB_API,
      });
    }

    if (path === "/" || path === "/harness") {
      return html(harnessLanding(url.origin));
    }

    const routed = await routeAgentRequest(request, env);
    if (routed) return routed;

    return json({ error: "not_found", path }, 404);
  },

  /** Cron: wake seller to ensure ≥1 open offer. */
  async scheduled(_controller: ScheduledController, env: HarnessEnv, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        const seller = await getAgentByName(env.CurbSeller, "default");
        await seller.fetch(
          new Request("https://seller.curb.numetal.xyz/ensure", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{}",
          })
        );
      })()
    );
  },
};
