import { routeAgentRequest, getAgentByName } from "agents";
import { CurbSeller } from "./seller";
import { CurbBuyer } from "./buyer";
import { type HarnessEnv, CURB_MCP, CURB_API, CURB_SITE, html, json } from "./shared";

export { CurbSeller, CurbBuyer };

const SELLER_HOSTS = new Set(["seller.curb.numetal.xyz"]);
const BUYER_HOSTS = new Set(["buyer.curb.numetal.xyz"]);

function harnessLanding(origin: string): string {
  const seller = "https://seller.curb.numetal.xyz";
  const buyer = "https://buyer.curb.numetal.xyz";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CURB harness — live seller + buyer</title>
<meta name="description" content="Presentation-ready Cloudflare Agents SDK harness: live curb-seller and curb-buyer connected to CURB MCP."/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#121212;--fg:#e6e6e6;--muted:#8c8c8c;--line:#2a2a2a;--panel:#1a1a1a;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;--sans:"IBM Plex Sans",system-ui,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 var(--sans)}
.wrap{max-width:820px;margin:0 auto;padding:1.5rem}
.eyebrow{font-family:var(--mono);font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
h1{font-size:clamp(1.6rem,4vw,2.2rem);letter-spacing:-.03em;margin:.4rem 0}
.lede{color:var(--muted);max-width:40rem}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);margin:1.25rem 0}
.card{background:var(--panel);padding:1.1rem}
.card h2{font-family:var(--mono);font-size:.95rem;margin:0 0 .4rem}
.card p{margin:0 0 .8rem;color:var(--muted);font-size:.95rem}
a.btn{display:inline-block;font-family:var(--mono);font-size:.75rem;border:1px solid var(--fg);padding:.45rem .7rem;color:var(--fg);text-decoration:none;margin:.2rem .35rem .2rem 0}
a.btn:hover{background:var(--fg);color:var(--bg)}
pre{background:#0e0e0e;border:1px solid var(--line);padding:.85rem;font:12px/1.45 var(--mono);overflow:auto}
@media(max-width:720px){.grid{grid-template-columns:1fr}}
.top a{color:var(--fg);font-family:var(--mono);font-size:.78rem}
</style>
</head>
<body>
<div class="wrap">
  <div class="top"><a href="${CURB_SITE}">← CURB</a></div>
  <p class="eyebrow">Numetal · CURB · live harness</p>
  <h1>Two agents. One MCP. Live.</h1>
  <p class="lede">Cloudflare Agents SDK harness for the pitch. Both agents call <code>addMcpServer('curb', '${CURB_MCP}')</code>. Seller keeps the book filled; buyer lists, intents, and surfaces the pay challenge. No private keys in the harness — settle with pay / agentcash.</p>
  <div class="grid">
    <div class="card">
      <h2>curb-seller</h2>
      <p>Posts &amp; maintains open offers. Fulfills at <code>/fulfill</code>.</p>
      <a class="btn" href="${seller}/">Open seller</a>
      <a class="btn" href="${seller}/health">/health</a>
    </div>
    <div class="card">
      <h2>curb-buyer</h2>
      <p>Lists offers, creates intents, fetches dual-payee challenges.</p>
      <a class="btn" href="${buyer}/">Open buyer</a>
      <a class="btn" href="${buyer}/health">/health</a>
    </div>
  </div>
  <h2 style="font-family:var(--mono);font-size:.85rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase">Agent routes</h2>
  <pre>Seller DO: ${origin}/agents/curb-seller/default
Buyer DO:  ${origin}/agents/curb-buyer/default
CURB API:  ${CURB_API}
CURB MCP:  ${CURB_MCP}</pre>
</div>
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
