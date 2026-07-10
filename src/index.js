import {
  createOffer,
  listOffers,
  createIntent,
  getMatch,
  markPaid,
  stats,
  refreshMatchChallenge,
  purgeBook,
  reseedDemoOffer,
} from "./swap.js";
import { adminHtml, adminSnapshot } from "./admin.js";
import { maybeAutoDistribute } from "./distribute.js";
import { geoBlockResponse } from "./geo.js";
import { isSanctionedAddress, refreshOfacList } from "./ofac.js"; // [compliance]
import { audit } from "./audit.js"; // [compliance]
import { accessOk } from "./cfaccess.js";
import { isValidId } from "./store.js";
import { paymentRequiredResponse, hasPaymentHeader, discoveryAccepts, verifyPayment, settleMode } from "./x402.js";
// [mpp] second payment rail — MPP on Tempo (push mode, splits). Dark behind mppEnabled(env).
import {
  mppEnabled,
  parseMppAuth,
  verifyMppSplitPayment,
  buildMppChallengeHeader,
  mppReceiptHeader,
  mppProblem,
  mppProblemCode,
  mppNetwork,
  MPP_DEDUP_TTL_SEC,
} from "./mpp.js";
import { getJson, putJson } from "./store.js";
import { buildOpenApi, wellKnownX402 } from "./openapi.js";
import { handleMcp } from "./mcp.js";
import { landingHtml } from "./landing.js";
import { deckHtml, deckMarkdown } from "./deck.js"; // [deck]
import { feesHtml } from "./fees.js";
import { termsHtml, privacyHtml } from "./legal.js";
import { installHtml, harnessHtml } from "./install.js";
import {
  feedXml,
  sitemapXml,
  newsletterHtml,
  dispatchLaunchHtml,
  dispatchIndexHtml,
  DISPATCH_LAUNCH,
} from "./blog.js";
import {
  corsHeaders,
  securityHeaders,
  isApiHost,
  isAdminHost,
  publicApiOrigin,
  publicSiteOrigin,
  themeBootScript,
  themeToggleScript,
} from "./skin.js";
import {
  readJsonLimited,
  rateLimit,
  sanitizeOfferInput,
  sanitizeIntentInput,
  validateCaps,
} from "./harden.js";

const PRODUCT_ID = "numetal-curb";
const CURB_TOKEN = "0xf0CBbf0806eD88910a011eEc9439A990c8C24BA3";

function json(data, status = 200, request, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request),
      ...securityHeaders({ "Content-Security-Policy": undefined }),
      ...extraHeaders,
    },
  });
}

function text(body, type = "text/plain; charset=utf-8", status = 200, request, extraHeaders = {}) {
  const isHtml = type.includes("html");
  return new Response(body, {
    status,
    headers: {
      "Content-Type": type,
      ...corsHeaders(request),
      ...(isHtml ? securityHeaders() : securityHeaders({ "Content-Security-Policy": undefined })),
      ...extraHeaders,
    },
  });
}

function bearerOk(request, key) {
  if (!key) return false;
  const m = (request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i);
  return Boolean(m && m[1] === key);
}

// [compliance] OFAC SDN wallet screening — fail-closed on a positive match.
// Screens each provided address; on a hit writes an audit event and returns a 451
// Response (JSON {error:"sanctioned_address",...}) for the caller to return. Returns
// null when every address clears — OR when the list has never loaded, in which case
// isSanctionedAddress() allows + console.warns (fail-open on a cold cache; we do not
// take the rail down on a fetch outage).
// NOTE: settlement is ALSO OFAC-screened by the Coinbase CDP facilitator at settle
// time, so verified on-chain payments inherit facilitator screening on top of this.
async function screenSanctions(env, request, addrs, context) {
  for (const a of addrs) {
    if (!a) continue;
    if (await isSanctionedAddress(env, a)) {
      await audit(env, "sanction_hit", {
        context,
        address: String(a).toLowerCase(),
        path: new URL(request.url).pathname,
        country: (request.cf && request.cf.country) || null,
      }).catch(() => {});
      return json(
        {
          error: "sanctioned_address",
          message:
            "This wallet address appears on the OFAC SDN sanctioned digital-currency list. CURB performs best-effort sanctions screening and cannot process this request.",
          contact: "contact@numetal.xyz",
        },
        451,
        request
      );
    }
  }
  return null;
}

function redirectTo(dest, request, status = 302) {
  return new Response(null, {
    status,
    headers: {
      Location: dest,
      ...corsHeaders(request),
      ...securityHeaders({ "Content-Security-Policy": undefined }),
    },
  });
}

/**
 * Operator host (admin.curb.numetal.xyz). /health is public; everything else is fail-closed
 * behind a verified Cloudflare Access email JWT OR Bearer ACCESS_KEY (accessOk). The console +
 * its actions can NEVER be reached off this Access-gated host (see the redirect in fetch()).
 */
async function handleAdminHost(request, env, url, path) {
  // Public liveness — geo/edge only, NOT operator-gated (parity with other hosts).
  if (path === "/health" && request.method === "GET") {
    const s = await stats(env);
    return json(
      { ok: true, product: PRODUCT_ID, brand: "CURB", host: "admin.curb.numetal.xyz", settle: { mode: settleMode(env) }, ...s },
      200,
      request
    );
  }

  // Bare root → the console.
  if (path === "/") return redirectTo("https://admin.curb.numetal.xyz/admin", request);

  // Operator gate. Fail-closed: no valid Access JWT AND no matching bearer → 403 (never the console).
  const gate = await accessOk(request, env);
  if (!gate.ok) {
    const wantsHtml = (request.headers.get("accept") || "").includes("text/html");
    const msg =
      "locked — admin.curb.numetal.xyz is Cloudflare-Access gated (email login) or Bearer ACCESS_KEY.";
    return wantsHtml
      ? text(
          `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>403 · CURB ops</title></head><body style="font:14px ui-monospace,Menlo,monospace;background:#121212;color:#e6e6e6;max-width:640px;margin:12vh auto;padding:0 20px"><h1 style="font-size:18px">403 · locked</h1><p>${msg}</p></body></html>`,
          "text/html; charset=utf-8",
          403,
          request
        )
      : json({ error: "unauthorized", hint: msg }, 403, request);
  }

  // Throttle gated mutations so a leaked ACCESS_KEY can't be looped.
  if (request.method === "POST") {
    const rl = await rateLimit(env, request, "admin");
    if (!rl.ok) return json({ error: rl.error }, rl.status, request);
  }

  if (path === "/admin" && request.method === "GET") {
    return text(await adminHtml(env, { via: gate.via }), "text/html; charset=utf-8", 200, request);
  }
  if (path === "/admin.json" && request.method === "GET") {
    return json(await adminSnapshot(env), 200, request);
  }
  if (path === "/admin/purge" && request.method === "POST") {
    const purged = await purgeBook(env);
    return json({ ok: true, purged }, 200, request);
  }
  if (path === "/admin/reseed" && request.method === "POST") {
    const r = await reseedDemoOffer(env);
    if (r.error) return json({ error: r.error }, r.status || 400, request);
    return json({ ok: true, offer: r.body }, r.status || 201, request);
  }
  if (path === "/admin/seed" && request.method === "POST") {
    const parsed = await readJsonLimited(request);
    if (parsed.error) return json({ error: parsed.error }, parsed.status, request);
    const b = parsed.body || {};
    const r = await createOffer(env, {
      sellerPayTo: b.sellerPayTo || env.DEMO_SELLER_PAY_TO || env.HUB_PAY_TO,
      endpoint: b.endpoint || "https://seller.curb.numetal.xyz/fulfill",
      model: b.model || "demo/llama-3.3-70b",
      mtok: b.mtok || 10,
      priceUsd: b.priceUsd || 0.5,
      attestation: "demo_seed",
      note: b.note || "admin seed",
    });
    if (r.error) return json({ error: r.error }, r.status || 400, request);
    return json(r.body, r.status || 201, request);
  }

  return json({ error: "not_found", path }, 404, request);
}

function paymentRails(env) {
  const rails = ["x402 · USDC on Base (eip155:8453)"];
  // [mpp] advertise the Tempo rail only when the dark flag + secret are live.
  if (env && mppEnabled(env)) {
    rails.push(`MPP · USDC on Tempo (${mppNetwork(env)}, push, splits) on POST /v1/matches/{id}/pay`);
  }
  return rails;
}

function apiRootIndex(env, apiOrigin, siteOrigin) {
  return {
    service: "CURB",
    product: PRODUCT_ID,
    brand: "CURB",
    what: "An agent↔agent inference swap rail — sellers post capacity, buyers post intents, the hub matches and clears USDC via x402. Buyer pays gross ONCE to an on-chain split (0xSplits); CURB fans out seller/hub on-chain. Hub never holds upstream LLM keys.",
    docs: `${siteOrigin}/docs/`,
    site: siteOrigin,
    fees: `${siteOrigin}/fees`,
    install: `${siteOrigin}/install`,
    harness_page: `${siteOrigin}/harness`,
    dispatch: `${siteOrigin}/dispatch`,
    sitemap: `${siteOrigin}/sitemap.xml`,
    openapi: `${apiOrigin}/openapi.json`,
    skill: `${apiOrigin}/skill.md`,
    llms: `${apiOrigin}/llms.txt`,
    mcp: `${apiOrigin}/mcp`,
    x402: `${apiOrigin}/.well-known/x402`,
    health: "/health",
    agents: {
      harness: "https://harness.curb.numetal.xyz",
      seller: "https://seller.curb.numetal.xyz",
      buyer: "https://buyer.curb.numetal.xyz",
      note: "DEMO / reference only — not the product path. Harness = pitch hub. Seller = posts offers + fulfills. Buyer = lists, intents, pay challenges. Product: wire this API MCP/skill into YOUR harness.",
    },
    token: {
      symbol: "CURB",
      chain: "Base (8453)",
      address: CURB_TOKEN,
    },
    swap: {
      offers: "/v1/offers",
      intents: "/v1/intents",
      match: "/v1/matches/:id",
      pay: "/v1/matches/:id/pay",
      probe: "/v1/pay",
    },
    payments: {
      rails: paymentRails(env),
      paid: ["/v1/pay", "/v1/matches/:id/pay"],
      note: "A bare POST to any paid surface returns one 402 with a SINGLE Base accept (gross to the split address); the live 402 is authoritative — read it before signing. Buyer pays gross once; CURB splits seller + protocol fee on-chain via a 0xSplits split on Base.",
    },
    contact: "contact@numetal.xyz",
    note: "Free reads: GET /v1/offers, GET /health, GET /openapi.json, GET /.well-known/x402, GET /skill.md, GET /llms.txt, GET /mcp. Paid: POST /v1/pay (discovery probe) and POST /v1/matches/{id}/pay. Marketing + docs on curb.numetal.xyz; demo/reference agents on harness/seller/buyer.curb.numetal.xyz (not the product path); this host is the agent API — wire MCP/skill into YOUR harness.",
  };
}

const API_ROOT_HTML = `<!doctype html>
<html lang="en" data-theme="dim">
<head>
<meta charset="utf-8">
<title>api.curb.numetal.xyz</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="The agent-facing API for CURB — agent↔agent inference swap. Machines get JSON; this page is the human view.">
<meta name="robots" content="index,follow">
<link rel="alternate" type="application/json" href="/" title="CURB API service index (JSON)">
<link rel="alternate" type="application/json" href="/openapi.json" title="OpenAPI 3.1">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23121212'/%3E%3Ccircle cx='16' cy='16' r='7' fill='%23e6e6e6'/%3E%3C/svg%3E">
<style>
:root,[data-theme="dim"]{--bg:#121212;--fg:#e6e6e6;--muted:#8c8c8c;--line:#2a2a2a;--panel:#1a1a1a;--code:#1a1a1a}
[data-theme="light"]{--bg:#f4f4f4;--fg:#141414;--muted:#666;--line:#d4d4d4;--panel:#fff;--code:#ececec}
body{font:15px/1.65 ui-monospace,Menlo,monospace;max-width:720px;margin:6vh auto;padding:0 20px;color:var(--fg);background:var(--bg)}
.topbar{display:flex;justify-content:flex-end;margin-bottom:12px}
.theme-btn{font:11px/1 ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);background:var(--panel);border:1px solid var(--line);padding:.4rem .7rem;cursor:pointer}
.theme-btn:hover{color:var(--fg);border-color:var(--fg)}
h1{font-size:22px;margin-bottom:2px}h1 .hx{color:var(--muted)}
h2{font-size:15px;margin:26px 0 6px;border-top:1px solid var(--line);padding-top:18px}
code{background:var(--code);padding:1px 5px;font-size:13px}a{color:var(--fg)}
.m{color:var(--muted)}
.tag{font-size:10px;background:var(--fg);color:var(--bg);padding:1px 6px;vertical-align:middle;text-transform:uppercase;letter-spacing:.05em}
.tag.free{background:#0a7d34;color:#fff}.tag.paid{background:var(--fg);color:var(--bg)}
ul{padding-left:18px;margin:.3rem 0}
.note{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--fg);padding:10px 14px;margin:16px 0;font-size:13.5px}
</style>
${themeBootScript()}
</head>
<body>
<div class="topbar"><button type="button" class="theme-btn" id="theme-toggle" aria-label="Toggle light and dim theme">Light</button></div>
<h1>api.curb.numetal.xyz <span class="hx">●</span></h1>
<p class="m">The agent-facing API for <a href="https://curb.numetal.xyz">CURB</a> — an agent↔agent inference swap rail by Numetal Labs. Sellers post capacity; buyers post intents; the hub matches and clears USDC. Buyer pays gross once to an on-chain split; CURB fans out seller + fee on-chain.</p>
<div class="note"><b>This is an API — this page is only the human view.</b> Agents, bots, and LLMs get JSON: request this same URL with <code>Accept: application/json</code>, or read the machine catalog at <a href="/openapi.json">/openapi.json</a>. Nothing here is human-gated.</div>
<section><h2>For machines — discovery &amp; docs</h2><ul>
<li><code>GET /openapi.json</code> <span class="m">— OpenAPI 3.1 (x402scan / AgentCash / CDP Bazaar read this)</span></li>
<li><code>GET /skill.md</code> <span class="m">— the drop-in agent skill (Markdown)</span></li>
<li><code>GET /llms.txt</code> <span class="m">— LLM-oriented site map</span></li>
<li><code>GET /mcp</code> · <code>POST /mcp</code> <span class="m">— remote Model Context Protocol</span></li>
<li><code>GET /.well-known/x402</code> <span class="m">— x402 payment discovery</span></li>
</ul></section>
<section><h2>Public reads <span class="tag free">free</span></h2><ul>
<li><code>GET /v1/offers</code> <span class="m">— open sell offers</span></li>
<li><code>GET /v1/matches/:id</code> <span class="m">— match detail</span></li>
<li><code>GET /health</code></li>
</ul></section>
<section><h2>Paid surfaces <span class="tag paid">x402</span></h2>
<p class="m">Settlement is x402 USDC on <b>Base</b> (<code>eip155:8453</code>). A bare POST returns one 402 with a single <code>accepts[]</code> entry (gross to the split address); the live 402 is authoritative. Buyer pays gross once; CURB splits seller + protocol fee on-chain via a 0xSplits split on Base.</p><ul>
<li><code>POST /v1/pay</code> <span class="m">— discovery probe ($0.10 sample, no side effects)</span></li>
<li><code>POST /v1/matches/:id/pay</code> <span class="m">— settle a real match (single-payee → on-chain split)</span></li>
</ul></section>
<section><h2>Swap loop</h2><ul>
<li><code>POST /v1/offers</code> <span class="m">— sell capacity</span></li>
<li><code>POST /v1/intents</code> <span class="m">— buy intent (+ auto-match)</span></li>
</ul></section>
<p class="m" style="margin-top:26px;border-top:1px solid var(--line);padding-top:16px">Human docs: <a href="https://curb.numetal.xyz/docs/">curb.numetal.xyz/docs</a> · Token &amp; fees: <a href="https://curb.numetal.xyz/fees">/fees</a> · Install (product path): <a href="https://curb.numetal.xyz/install">/install</a> · Demo agents: <a href="https://harness.curb.numetal.xyz/">harness</a> · <a href="https://seller.curb.numetal.xyz/">seller</a> · <a href="https://buyer.curb.numetal.xyz/">buyer</a> · Sitemap: <a href="https://curb.numetal.xyz/sitemap.xml">curb.numetal.xyz/sitemap.xml</a> · Token <code>${CURB_TOKEN}</code> · <a href="mailto:contact@numetal.xyz">contact@numetal.xyz</a>.</p>
${themeToggleScript()}
</body>
</html>`;

/** Prefer ASSETS public/skill.md (full agentskills SKILL); fallback thin banner. */
async function skillMd(env, apiOrigin, siteOrigin, request) {
  if (env.ASSETS) {
    try {
      const assetReq = new Request(new URL("/skill.md", request.url), { method: "GET" });
      const res = await env.ASSETS.fetch(assetReq);
      if (res.ok) {
        const body = await res.text();
        if (body.includes("name: curb") || body.includes("# CURB")) return body;
      }
    } catch {
      /* fall through */
    }
  }
  return `# CURB

Agent-to-agent inference swap (product: \`${PRODUCT_ID}\`).

- MCP: POST ${apiOrigin}/mcp
- Skill (full): see repo \`skills/curb/SKILL.md\`
- Docs: ${siteOrigin}/docs/how-to/install-mcp
- Demo harness (reference only): https://harness.curb.numetal.xyz
- Product path: wire this MCP + skill into YOUR harness
- Fee: ${env.FEE_BPS || 500} bps · hub holds no upstream keys · CURB does not sign payments
`;
}

function llmsTxt(apiOrigin, siteOrigin) {
  // Canonical agent API host for discovery prose (marketing host may also serve API routes).
  const agentApi = "https://api.curb.numetal.xyz";
  return [
    "# CURB",
    `> Agent↔agent inference swap. Settlement is x402 USDC on Base (eip155:8453). Buyer pays gross once to an on-chain 0xSplits split; CURB fans out seller + protocol fee on-chain. No upstream keys on hub. Product: ${PRODUCT_ID}`,
    "",
    "## Surfaces",
    `Site: ${siteOrigin}/`,
    `Pitch deck: ${siteOrigin}/deck (PDF ${siteOrigin}/deck.pdf · markdown ${siteOrigin}/deck.md)`,
    `API: ${agentApi}/`,
    `API (this host catalog): ${apiOrigin}/`,
    `Install: ${siteOrigin}/install`,
    `Harness (site foyer): ${siteOrigin}/harness`,
    `Token & fees: ${siteOrigin}/fees`,
    `Token: CURB on Base · ${CURB_TOKEN}`,
    `Docs: ${siteOrigin}/docs/`,
    `Docs · harness agents: ${siteOrigin}/docs/explanation/harness-agents/`,
    `Docs · use live harness: ${siteOrigin}/docs/how-to/use-live-harness/`,
    `Docs · install MCP: ${siteOrigin}/docs/how-to/install-mcp/`,
    `Docs · install skill: ${siteOrigin}/docs/how-to/install-skill/`,
    `Dispatches: ${siteOrigin}/dispatch`,
    `Dispatch: ${siteOrigin}${DISPATCH_LAUNCH.path}`,
    `Newsletter: ${siteOrigin}/newsletter`,
    `Terms: ${siteOrigin}/terms`,
    `Privacy: ${siteOrigin}/privacy`,
    `Feed: ${siteOrigin}/feed.xml`,
    `Sitemap: ${siteOrigin}/sitemap.xml`,
    "",
    "## Demo agents (reference only — not the product path)",
    "Product path: add https://api.curb.numetal.xyz/mcp (+ skill.md) to YOUR harness.",
    "Demo harness: https://harness.curb.numetal.xyz — pitch hub linking demo seller + buyer",
    "Demo seller: https://seller.curb.numetal.xyz — posts/maintains offers; fulfills grants at /fulfill",
    "Demo buyer: https://buyer.curb.numetal.xyz — lists offers, creates intents, surfaces pay challenges",
    "Rail: this API (MCP + REST + x402). Demo agents call the rail for the pitch; hub never holds upstream LLM keys and never signs payments.",
    "",
    "## Agent API",
    `OpenAPI: ${agentApi}/openapi.json`,
    `Discovery: ${agentApi}/.well-known/x402`,
    `Pay probe: POST ${agentApi}/v1/pay`,
    `Skill: ${agentApi}/skill.md`,
    `MCP: POST ${agentApi}/mcp`,
    `Health: GET ${agentApi}/health`,
    `Offers: GET ${agentApi}/v1/offers`,
    `llms.txt: ${agentApi}/llms.txt`,
    "",
    "## Payments",
    "Settlement is x402 USDC on Base (eip155:8453). CURB splits seller + protocol fee on-chain via a 0xSplits split.",
    "Single-payee (spec-compliant): ONE accept = gross to the split address. Buyer signs ONE payment; CURB splits seller + protocol fee ON-CHAIN via 0xSplits distribute() on Base.",
    "",
    "Contact: contact@numetal.xyz",
    "",
  ].join("\n");
}

async function seedDemoOfferIfEmpty(env, origin) {
  const s = await stats(env);
  if ((s.openOffers || 0) > 0) return { skipped: true, openOffers: s.openOffers };
  const r = await createOffer(env, {
    sellerPayTo: env.DEMO_SELLER_PAY_TO || env.HUB_PAY_TO,
    endpoint: "https://seller.curb.numetal.xyz/fulfill",
    model: "demo/llama-3.3-70b",
    mtok: 10,
    priceUsd: 0.5,
    attestation: "demo_seed",
    note: "curb-api-cron demo offer",
  });
  return { seeded: true, offer: r.body, status: r.status };
}

export default {
  async scheduled(_controller, env, ctx) {
    const origin = "https://api.curb.numetal.xyz";
    ctx.waitUntil(seedDemoOfferIfEmpty(env, origin));
    // Gated on-chain fee fan-out: no-op unless KEEPER_DISTRIBUTE="on" + signable keeper. Fail-soft.
    ctx.waitUntil(maybeAutoDistribute(env).catch((err) => console.error("curb_distribute_cron", String(err?.message || err))));
    // [compliance] refresh the OFAC SDN sanctioned-address list into KV (ofac:*). Fail-soft.
    ctx.waitUntil(refreshOfacList(env).catch((err) => console.warn("curb_ofac_refresh_cron", String(err?.message || err))));
  },

  async fetch(request, env) {
    // ── Edge geo-block (Tier-0 sanctions/export-control gate) ──────────────────
    // Runs BEFORE host routing and all app logic, on EVERY host (curb, api.curb,
    // admin.curb). Blocks OFAC-comprehensively-sanctioned jurisdictions + China
    // (see src/geo.js). /health is exempt so status monitors keep working. 451 for
    // everyone else in a blocked geo. See geo.js for the country list + ?geotest hook.
    const geoBlocked = geoBlockResponse(request, env);
    if (geoBlocked) {
      // [compliance] audit geo-blocks (append-only KV; best-effort, non-blocking)
      await audit(env, "geo_block", {
        path: new URL(request.url).pathname,
        country: (request.cf && request.cf.country) || null,
        region: (request.cf && request.cf.region) || null,
      }).catch(() => {});
      return geoBlocked;
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const adminHost = isAdminHost(url.hostname);
    const apiHost = isApiHost(url.hostname);
    const apiOrigin = publicApiOrigin(url);
    const siteOrigin = publicSiteOrigin(url);
    // Discovery resource URLs must match the host being scanned (curb and api.curb both serve API).
    const origin = apiHost ? apiOrigin : url.origin;
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // Operator console lives ONLY on the Cloudflare-Access admin host. Serve it there; redirect
    // any /admin* hitting another host over so the console can never be reached off the gate.
    try {
      if (adminHost) return await handleAdminHost(request, env, url, path);
    } catch (err) {
      console.error("curb_admin_error", { path, method: request.method, err: String(err?.message || err) });
      return json({ error: "internal" }, 500, request);
    }
    const isAdminPath = path === "/admin" || path === "/admin.json" || path.startsWith("/admin/");
    if (isAdminPath) {
      return redirectTo(`https://admin.curb.numetal.xyz${url.pathname}${url.search}`, request);
    }

    // Marketing-only surfaces on the API host → send humans to the site.
    if (apiHost) {
      const marketingPaths = new Set([
        "/fees",
        "/token",
        "/terms",
        "/privacy",
        "/newsletter",
        "/blog",
        "/dispatch",
        "/install",
        "/harness",
        "/feed.xml",
        "/rss.xml",
        "/sitemap.xml",
        DISPATCH_LAUNCH.path,
      ]);
      if (marketingPaths.has(path) || path.startsWith("/docs") || path.startsWith("/assets/")) {
        const dest =
          path.startsWith("/docs") || path.startsWith("/assets/")
            ? `${siteOrigin}${url.pathname}${url.search}`
            : path === "/token"
              ? `${siteOrigin}/fees`
              : path === "/blog"
                ? `${siteOrigin}/dispatch${url.search}`
                : `${siteOrigin}${path}${url.search}`;
        return new Response(null, {
          status: 302,
          headers: { Location: dest, ...corsHeaders(request), ...securityHeaders({ "Content-Security-Policy": undefined }) },
        });
      }
    }

    // Static assets + Vocs docs via Workers Assets (marketing host only)
    if (
      !apiHost &&
      (path.startsWith("/assets/") ||
        path.startsWith("/docs") ||
        path === "/curb-sun.svg" ||
        path.endsWith(".css") ||
        path.endsWith(".js") ||
        path.endsWith(".map") ||
        path.endsWith(".woff2") ||
        path.endsWith(".png") ||
        path.endsWith(".svg") ||
        path.endsWith(".pdf") || // [deck] serve public/deck/curb-deck.pdf
        path.endsWith(".ico"))
    ) {
      if (env.ASSETS) {
        const res = await env.ASSETS.fetch(request);
        if (res.status !== 404) {
          const headers = new Headers(res.headers);
          headers.set("X-Content-Type-Options", "nosniff");
          headers.set("Referrer-Policy", "no-referrer");
          headers.set("X-Frame-Options", "DENY");
          if (path.endsWith(".svg")) headers.set("Content-Type", "image/svg+xml; charset=utf-8");
          return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
        }
      }
    }

    try {
      if (path === "/health" && request.method === "GET") {
        const s = await stats(env);
        const mode = settleMode(env);
        return json(
          {
            ok: true,
            product: PRODUCT_ID,
            brand: "CURB",
            api: apiOrigin,
            site: siteOrigin,
            settle: {
              mode,
              note:
                mode === "verify"
                  ? "verify: only CDP-facilitator-verified payments mint a grant"
                  : "demo: a present payment header settles but grants are marked verified:false (not on-chain verified)",
            },
            ...s,
          },
          200,
          request
        );
      }

      if (path === "/" && request.method === "GET") {
        if (apiHost) {
          const index = apiRootIndex(env, apiOrigin, siteOrigin);
          const wantsHtml = (request.headers.get("accept") || "").includes("text/html");
          return wantsHtml
            ? text(API_ROOT_HTML, "text/html; charset=utf-8", 200, request, { Vary: "Accept, Origin" })
            : json(index, 200, request, { Vary: "Accept, Origin" });
        }
        const s = await stats(env);
        return text(landingHtml(siteOrigin, s, apiOrigin), "text/html; charset=utf-8", 200, request);
      }

      // [deck] hosted 15-slide pitch deck + markdown source + PDF redirect
      if (!apiHost && path === "/deck" && request.method === "GET") {
        return text(deckHtml(siteOrigin, apiOrigin), "text/html; charset=utf-8", 200, request);
      }
      if (
        !apiHost &&
        (path === "/deck.md" || path === "/deck/curb/deck.md") &&
        request.method === "GET"
      ) {
        return text(deckMarkdown(siteOrigin, apiOrigin), "text/markdown; charset=utf-8", 200, request);
      }
      if (!apiHost && path === "/deck.pdf" && request.method === "GET") {
        return redirectTo(`${siteOrigin}/deck/curb-deck.pdf`, request);
      }

      if (!apiHost && path === "/fees" && request.method === "GET") {
        return text(feesHtml(siteOrigin, env), "text/html; charset=utf-8", 200, request);
      }
      if (!apiHost && path === "/token" && request.method === "GET") {
        return new Response(null, {
          status: 302,
          headers: { Location: "/fees", ...corsHeaders(request), ...securityHeaders({ "Content-Security-Policy": undefined }) },
        });
      }

      if (!apiHost && path === "/terms" && request.method === "GET") {
        return text(termsHtml(siteOrigin), "text/html; charset=utf-8", 200, request);
      }
      if (!apiHost && path === "/privacy" && request.method === "GET") {
        return text(privacyHtml(siteOrigin), "text/html; charset=utf-8", 200, request);
      }
      if (!apiHost && path === "/newsletter" && request.method === "GET") {
        return text(newsletterHtml(siteOrigin), "text/html; charset=utf-8", 200, request);
      }
      if (!apiHost && path === "/blog" && request.method === "GET") {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/dispatch${url.search}`,
            ...corsHeaders(request),
            ...securityHeaders({ "Content-Security-Policy": undefined }),
          },
        });
      }
      if (!apiHost && path === "/dispatch" && request.method === "GET") {
        return text(dispatchIndexHtml(siteOrigin), "text/html; charset=utf-8", 200, request);
      }
      if (
        !apiHost &&
        (path === DISPATCH_LAUNCH.path || path === `${DISPATCH_LAUNCH.path}/`) &&
        request.method === "GET"
      ) {
        return text(dispatchLaunchHtml(siteOrigin), "text/html; charset=utf-8", 200, request);
      }
      if (!apiHost && (path === "/feed.xml" || path === "/rss.xml") && request.method === "GET") {
        return text(feedXml(siteOrigin), "application/rss+xml; charset=utf-8", 200, request);
      }
      if (!apiHost && path === "/sitemap.xml" && request.method === "GET") {
        return text(sitemapXml(siteOrigin), "application/xml; charset=utf-8", 200, request);
      }

      if (path === "/openapi.json" && request.method === "GET") {
        return json(buildOpenApi(env, origin), 200, request);
      }

      if (path === "/.well-known/x402" && request.method === "GET") {
        return json(await wellKnownX402(env, origin), 200, request);
      }

      if (path === "/llms.txt" && request.method === "GET") {
        return text(llmsTxt(apiOrigin, siteOrigin), "text/plain; charset=utf-8", 200, request);
      }

      if ((path === "/skill.md" || path === "/skill") && request.method === "GET") {
        return text(
          await skillMd(env, apiOrigin, siteOrigin, request),
          "text/markdown; charset=utf-8",
          200,
          request
        );
      }

      if (!apiHost && path === "/install" && request.method === "GET") {
        return text(installHtml(siteOrigin), "text/html; charset=utf-8", 200, request);
      }
      if (!apiHost && path === "/harness" && request.method === "GET") {
        return text(harnessHtml(siteOrigin), "text/html; charset=utf-8", 200, request);
      }

      if (path === "/mcp" && request.method === "POST") {
        const rl = await rateLimit(env, request, "mcp");
        if (!rl.ok) return json({ error: rl.error }, rl.status, request);
        return handleMcp(env, request, origin);
      }
      if (path === "/mcp" && request.method === "GET") {
        return json(
          {
            name: PRODUCT_ID,
            brand: "CURB",
            transport: "json-rpc POST",
            tools: [
              "swap_list_offers",
              "swap_create_offer",
              "swap_create_intent",
              "swap_get_match",
              "swap_pay_challenge",
            ],
          },
          200,
          request
        );
      }

      if (path === "/v1/offers" && request.method === "GET") {
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
        return json({ offers: await listOffers(env, { limit }) }, 200, request);
      }

      if (path === "/v1/offers" && request.method === "POST") {
        const rl = await rateLimit(env, request, "offers");
        if (!rl.ok) return json({ error: rl.error }, rl.status, request);
        const parsed = await readJsonLimited(request);
        if (parsed.error) return json({ error: parsed.error }, parsed.status, request);
        const body = sanitizeOfferInput(parsed.body);
        const capErr = validateCaps({ mtok: Number(body.mtok), priceUsd: Number(body.priceUsd) });
        if (capErr) return json({ error: capErr }, 400, request);
        // [compliance] screen the seller payout address against the OFAC SDN list
        const offerSanction = await screenSanctions(env, request, [body.sellerPayTo || body.payTo], "offer_sellerPayTo");
        if (offerSanction) return offerSanction;
        const r = await createOffer(env, body);
        if (r.error) return json({ error: r.error }, r.status, request);
        return json(r.body, r.status, request);
      }

      if (path === "/v1/intents" && request.method === "POST") {
        const rl = await rateLimit(env, request, "intents");
        if (!rl.ok) return json({ error: rl.error }, rl.status, request);
        const parsed = await readJsonLimited(request);
        if (parsed.error) return json({ error: parsed.error }, parsed.status, request);
        const body = sanitizeIntentInput(parsed.body);
        const capErr = validateCaps({
          mtok: Number(body.mtok),
          maxPriceUsd: body.maxPriceUsd != null ? Number(body.maxPriceUsd) : null,
        });
        if (capErr) return json({ error: capErr }, 400, request);
        // [compliance] screen the buyer address (only when the intent carries one) against OFAC SDN
        const intentSanction = await screenSanctions(env, request, [body.buyer || body.buyerAddress], "intent_buyer");
        if (intentSanction) return intentSanction;
        const r = await createIntent(env, body, origin);
        if (r.error) return json({ error: r.error }, r.status, request);
        return json(r.body, r.status, request);
      }

      const matchGet = path.match(/^\/v1\/matches\/([^/]+)$/);
      if (matchGet && request.method === "GET") {
        // Reject invalid/over-long ids before any KV read (no backend leak).
        if (!isValidId(matchGet[1])) return json({ error: "not_found" }, 404, request);
        const m = await getMatch(env, matchGet[1]);
        if (!m) return json({ error: "not_found" }, 404, request);
        return json(m, 200, request);
      }

      // Discovery probe — bare POST always 402 before body validation (x402scan requirement).
      if (path === "/v1/pay" && request.method === "POST") {
        const rl = await rateLimit(env, request, "pay");
        if (!rl.ok) return json({ error: rl.error }, rl.status, request);
        if (hasPaymentHeader(request)) {
          return json(
            {
              ok: true,
              probe: true,
              message: "Probe ack only — settle real swaps via POST /v1/matches/{id}/pay",
            },
            200,
            request
          );
        }
        const challenge = await discoveryAccepts(env, origin);
        return paymentRequiredResponse({
          error: "payment_required",
          message:
            "CURB discovery probe. Attach ONE payment for the gross amount to the accept's payTo (the on-chain 0xSplits split) on Base (eip155:8453), or use POST /v1/matches/{id}/pay for a real match.",
          price: { amount: String(challenge.split.grossUsd), currency: "USD" },
          paymentInfo: {
            networks: ["eip155:8453"],
            asset: "USDC",
            x402Version: 2,
          },
          ...challenge,
        });
      }

      const matchPay = path.match(/^\/v1\/matches\/([^/]+)\/pay$/);
      if (matchPay && request.method === "POST") {
        const rl = await rateLimit(env, request, "pay");
        if (!rl.ok) return json({ error: rl.error }, rl.status, request);
        const id = matchPay[1];
        // Absurd ids (beyond any real match id) are rejected before KV so the
        // backend never 414s. Short placeholder ids keep the 402 probe path.
        if (id.length > 128) return json({ error: "not_found" }, 404, request);
        const m = await getMatch(env, id);

        // [mpp] Detect an MPP credential (Authorization: Payment …) up front and treat it as
        // "has payment", so an MPP-only request never falls into the bare 402 branch. x402
        // (X-Payment / payment-signature) stays the DEFAULT rail; MPP runs only when a Payment
        // credential is present AND no x402 header is.
        const mppCred = mppEnabled(env) ? parseMppAuth(request.headers.get("authorization")) : null;
        const hasX402 = hasPaymentHeader(request);
        const isMpp = !!mppCred && !hasX402;

        // Paywall BEFORE not_found — x402scan probes literal/placeholder ids and must get 402.
        if (!hasX402 && !mppCred) {
          if (m) {
            const fresh = await refreshMatchChallenge(env, m, origin);
            const resp402 = paymentRequiredResponse({
              error: "payment_required",
              message:
                "Attach payment-signature / X-Payment for ONE gross payment to the accept's payTo (the on-chain 0xSplits split) on Base (eip155:8453), then retry.",
              price: { amount: String(fresh.split.grossUsd), currency: "USD" },
              paymentInfo: {
                networks: ["eip155:8453"],
                asset: "USDC",
                x402Version: 2,
              },
              ...fresh.challenge,
            });
            // [mpp] One 402, disjoint headers: emit the MPP `WWW-Authenticate: Payment method="tempo"`
            // challenge co-resident with the x402 one (distinct challenge line, distinguished by
            // method=). x402's data still rides PAYMENT-REQUIRED; MPP is purely additive.
            if (mppEnabled(env)) {
              const headers = new Headers(resp402.headers);
              headers.append("WWW-Authenticate", await buildMppChallengeHeader(env, m));
              return new Response(resp402.body, { status: resp402.status, headers });
            }
            return resp402;
          }
          const resourceUrl = `${origin}/v1/matches/${id}/pay`;
          const challenge = await discoveryAccepts(env, origin, resourceUrl);
          return paymentRequiredResponse({
            error: "payment_required",
            message:
              "Match not found or discovery probe. Sample Base challenge (same as POST /v1/pay). Create a live match, then pay that id; or use POST /v1/pay.",
            note: "match_not_found_probe",
            price: { amount: String(challenge.split.grossUsd), currency: "USD" },
            paymentInfo: {
              networks: ["eip155:8453"],
              asset: "USDC",
              x402Version: 2,
            },
            ...challenge,
          });
        }

        if (!m) return json({ error: "not_found" }, 404, request);

        // [compliance] screen payer (buyer) + seller payout against OFAC SDN before settling.
        // The CDP facilitator also OFAC-screens the on-chain payer at settle; this is the pre-settle gate.
        const paySanction = await screenSanctions(env, request, [m.buyer, m.sellerPayTo], "match_pay");
        if (paySanction) return paySanction;

        // Explicit admin/manual demo settle (bearer-gated) — always marked demo.
        const adminDemo = url.searchParams.get("demo") === "1" && bearerOk(request, env.ACCESS_KEY);
        if (adminDemo) {
          const paid = await markPaid(env, id, {
            demo: true,
            verified: false,
            mode: settleMode(env),
            note: "admin_demo_settle",
          });
          // [compliance] audit settle (append-only KV; best-effort, non-blocking)
          await audit(env, "settle", {
            matchId: id,
            model: m.model,
            mtok: m.mtok,
            sellerPayTo: m.sellerPayTo,
            buyer: m.buyer || null,
            grossUsd: (m.split && m.split.grossUsd) ?? null,
            verified: false,
            mode: settleMode(env),
            note: "admin_demo_settle",
          }).catch(() => {});
          return json(paid.body, paid.status, request);
        }

        // [mpp] MPP (Tempo push + splits) settle path. Runs only when a Payment credential is
        // present and no x402 header. Verify fail-closed → on success mint the SAME grant the x402
        // path mints, dedup on challenge id AND tx hash, attach Payment-Receipt + audit.
        if (isMpp) {
          const verified = await verifyMppSplitPayment(env, mppCred, m);
          if (!verified.verified || !verified.payer) {
            return mppProblem(env, m, mppProblemCode(verified.raw), "payment could not be verified");
          }
          // Single-use: reject a replayed challenge id OR settlement tx (one Tempo tx = one grant).
          const nonceKey = `mpp:nonce:${verified.nonce}`;
          const txKey = `mpp:tx:${verified.tx}`;
          const [dupNonce, dupTx] = await Promise.all([getJson(env, nonceKey), getJson(env, txKey)]);
          if (dupNonce || dupTx) {
            return mppProblem(env, m, "payment-replayed", "this MPP payment was already settled");
          }
          await Promise.all([
            putJson(env, nonceKey, { matchId: id, tx: verified.tx, at: new Date().toISOString() }, MPP_DEDUP_TTL_SEC),
            putJson(env, txKey, { matchId: id, nonce: verified.nonce, at: new Date().toISOString() }, MPP_DEDUP_TTL_SEC),
          ]);
          const mppSettlement = [
            {
              rail: "mpp",
              network: mppNetwork(env),
              tx: verified.tx,
              payer: verified.payer,
              hub: verified.splits ? verified.splits.hub : null,
              seller: verified.splits ? verified.splits.seller : null,
            },
          ];
          const paidMpp = await markPaid(env, id, {
            note: "mpp_verified_settled",
            demo: false,
            verified: true,
            mode: "mpp",
            settlement: mppSettlement,
          });
          // [compliance] audit the MPP settle (append-only KV; best-effort, non-blocking)
          await audit(env, "settle", {
            matchId: id,
            rail: "mpp",
            network: mppNetwork(env),
            model: m.model,
            mtok: m.mtok,
            sellerPayTo: m.sellerPayTo,
            buyer: m.buyer || null,
            payer: verified.payer,
            tx: verified.tx,
            grossUsd: (m.split && m.split.grossUsd) ?? null,
            verified: true,
            demo: false,
            mode: "mpp",
            settlement: mppSettlement,
          }).catch(() => {});
          return json(paidMpp.body, paidMpp.status, request, {
            "Payment-Receipt": mppReceiptHeader(env, verified.nonce, verified.tx, m),
          });
        }

        // Real settlement gate. verify mode: only a facilitator-verified payment
        // mints a grant; a fake/bare header is re-challenged with 402.
        const verdict = await verifyPayment(env, request, m);
        if (!verdict.ok) {
          const fresh = await refreshMatchChallenge(env, m, origin);
          return paymentRequiredResponse({
            error: "payment_required",
            message: `Payment not verified (${verdict.reason || "unverified"}). Attach a facilitator-verifiable ONE gross payment to the accept's payTo (the on-chain 0xSplits split) on Base (eip155:8453), then retry.`,
            price: { amount: String(fresh.split.grossUsd), currency: "USD" },
            paymentInfo: {
              networks: ["eip155:8453"],
              asset: "USDC",
              x402Version: 2,
            },
            ...fresh.challenge,
          });
        }

        const paid = await markPaid(env, id, {
          note: verdict.verified ? "x402_verified_settled" : "demo_settle_header_present",
          demo: Boolean(verdict.demo),
          verified: Boolean(verdict.verified),
          mode: verdict.mode,
          settlement: verdict.settlement || null,
        });
        // [compliance] audit settle success (append-only KV; best-effort, non-blocking)
        await audit(env, "settle", {
          matchId: id,
          model: m.model,
          mtok: m.mtok,
          sellerPayTo: m.sellerPayTo,
          buyer: m.buyer || null,
          grossUsd: (m.split && m.split.grossUsd) ?? null,
          verified: Boolean(verdict.verified),
          demo: Boolean(verdict.demo),
          mode: verdict.mode,
          settlement: verdict.settlement || null,
        }).catch(() => {});
        return json(paid.body, paid.status, request);
      }

      if (path === "/v1/demo-fulfill" && request.method === "POST") {
        const parsed = await readJsonLimited(request);
        const auth = request.headers.get("authorization") || "";
        return json(
          {
            id: `chatcmpl-curb-api-demo-${Date.now().toString(36)}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: "demo/llama-3.3-70b",
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content:
                    "CURB API demo-fulfill stub. Prefer https://seller.curb.numetal.xyz/fulfill for the live harness seller.",
                },
                finish_reason: "stop",
              },
            ],
            usage: { prompt_tokens: 8, completion_tokens: 20, total_tokens: 28 },
            curb: {
              demo: true,
              grantPresent: /^Bearer\s+/i.test(auth),
              echo: parsed.body ?? null,
            },
          },
          200,
          request
        );
      }

      // Fallback: try ASSETS for anything else (docs SPA chunks, etc.)
      if (env.ASSETS) {
        const res = await env.ASSETS.fetch(request);
        if (res.status !== 404) return res;
      }

      return json({ error: "not_found", path }, 404, request);
    } catch (err) {
      // Never leak internal/backend messages to clients. Log server-side only.
      console.error("curb_internal_error", {
        path,
        method: request.method,
        err: String(err?.message || err),
      });
      return json({ error: "internal" }, 500, request);
    }
  },
};
