export const CURB_MCP = "https://api.curb.numetal.xyz/mcp";
export const CURB_API = "https://api.curb.numetal.xyz";
export const CURB_SITE = "https://curb.numetal.xyz";

export type HarnessEnv = {
  CurbSeller: DurableObjectNamespace;
  CurbBuyer: DurableObjectNamespace;
  CURB_MCP_URL?: string;
  CURB_API_URL?: string;
  CURB_SITE_URL?: string;
  SELLER_PAY_TO?: string;
  SELLER_SOL_PAY_TO?: string;
  DEMO_MODEL?: string;
  DEMO_MTOK?: string;
  DEMO_PRICE_USD?: string;
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "x-content-type-options": "nosniff",
    },
  });
}

export function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}

export function parseMcpText(result: unknown): unknown {
  const content = (result as { content?: Array<{ type?: string; text?: string }> })?.content;
  const text = content?.find((c) => c.type === "text")?.text;
  if (!text) return result;
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

export function agentSkin(opts: {
  title: string;
  role: string;
  origin: string;
  mcpUrl: string;
  status: Record<string, unknown>;
  actionsHtml: string;
}): string {
  const { title, role, origin, mcpUrl, status, actionsHtml } = opts;
  return `<!DOCTYPE html>
<html lang="en" data-theme="dim">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title} — CURB harness</title>
<meta name="description" content="Live Cloudflare Agents SDK harness agent for CURB (${role})."/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#121212;--fg:#e6e6e6;--muted:#8c8c8c;--line:#2a2a2a;--panel:#1a1a1a;--code:#0e0e0e;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;--sans:"IBM Plex Sans",system-ui,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 var(--sans)}
.wrap{max-width:720px;margin:0 auto;padding:1.25rem}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;font-family:var(--mono);font-size:.78rem}
.top a{color:var(--fg);text-decoration:none;border-bottom:1px solid var(--line)}
header{border:1px solid var(--line);background:var(--panel);padding:1.25rem;margin-bottom:1rem}
.eyebrow{font-family:var(--mono);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 .6rem}
h1{margin:0;font-size:1.55rem;letter-spacing:-.03em}p{color:var(--muted);margin:.65rem 0 0}
.badge{display:inline-block;font-family:var(--mono);font-size:.68rem;border:1px solid var(--fg);padding:.2rem .45rem;margin-top:.75rem}
section{border:1px solid var(--line);background:var(--panel);padding:1rem;margin:0 0 1rem}
h2{font-family:var(--mono);font-size:.85rem;margin:0 0 .65rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
pre{background:var(--code);border:1px solid var(--line);padding:.85rem;overflow:auto;font:12px/1.45 var(--mono);margin:0}
.row{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.75rem}
button,.btn{font-family:var(--mono);font-size:.75rem;background:transparent;color:var(--fg);border:1px solid var(--fg);padding:.45rem .7rem;cursor:pointer;text-decoration:none}
button:hover,.btn:hover{background:var(--fg);color:var(--bg)}
#out{margin-top:.75rem;min-height:3rem}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <a href="https://harness.curb.numetal.xyz/">← harness</a>
    <a href="https://curb.numetal.xyz/">CURB</a>
  </div>
  <header>
    <p class="eyebrow">Numetal · CURB · Cloudflare Agents SDK</p>
    <h1>${title}</h1>
    <p>Live ${role} agent. MCP: <code>${mcpUrl}</code>. Origin: <code>${origin}</code>.</p>
    <span class="badge">LIVE</span>
  </header>
  <section>
    <h2>Status</h2>
    <pre id="status">${escapeHtml(JSON.stringify(status, null, 2))}</pre>
  </section>
  <section>
    <h2>Actions</h2>
    ${actionsHtml}
    <pre id="out">// action output</pre>
  </section>
</div>
<script>
async function run(path, body){
  const out=document.getElementById('out');
  out.textContent='…';
  try{
    const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:body?JSON.stringify(body):'{}'});
    const t=await r.text();
    out.textContent=t;
    const s=await fetch('/health');
    document.getElementById('status').textContent=await s.text();
  }catch(e){out.textContent=String(e)}
}
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
