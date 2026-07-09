import { createOffer, listOffers, createIntent, getMatch, markPaid, stats, refreshMatchChallenge } from "./swap.js";
import { paymentRequiredResponse, hasPaymentHeader, discoveryAccepts } from "./x402.js";
import { buildOpenApi, wellKnownX402 } from "./openapi.js";
import { handleMcp } from "./mcp.js";
import { landingHtml } from "./landing.js";
import { feesHtml } from "./fees.js";
import { termsHtml, privacyHtml } from "./legal.js";
import { feedXml, sitemapXml, newsletterHtml } from "./blog.js";
import { corsHeaders, securityHeaders } from "./skin.js";
import {
  readJsonLimited,
  rateLimit,
  sanitizeOfferInput,
  sanitizeIntentInput,
  validateCaps,
} from "./harden.js";

const PRODUCT_ID = "numetal-curb";

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request),
      ...securityHeaders({ "Content-Security-Policy": undefined }),
    },
  });
}

function text(body, type = "text/plain; charset=utf-8", status = 200, request) {
  const isHtml = type.includes("html");
  return new Response(body, {
    status,
    headers: {
      "Content-Type": type,
      ...corsHeaders(request),
      ...(isHtml ? securityHeaders() : securityHeaders({ "Content-Security-Policy": undefined })),
    },
  });
}

function bearerOk(request, key) {
  if (!key) return false;
  const m = (request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i);
  return Boolean(m && m[1] === key);
}

async function skillMd(env, origin) {
  return `# CURB

Agent-to-agent inference swap rail (product id: \`${PRODUCT_ID}\`). Base: ${origin}

- OpenAPI: ${origin}/openapi.json
- Discovery: ${origin}/.well-known/x402
- Probe (402): POST ${origin}/v1/pay
- MCP: POST ${origin}/mcp
- Docs: ${origin}/docs/
- Fee: ${env.FEE_BPS || 500} bps · hub does not hold upstream LLM keys
- We accept payment in USDC on x402 on both Base (\`eip155:8453\`) and Solana (\`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp\`), and via pay.sh on Solana
- Each swap clears seller + protocol fee

## Sell
POST ${origin}/v1/offers
\`\`\`json
{"sellerPayTo":"0x…","sellerSolPayTo":"<optional base58>","endpoint":"https://…/v1/chat/completions","model":"llama-3.3-70b","mtok":10,"priceUsd":0.8}
\`\`\`

## Buy
POST ${origin}/v1/intents
\`\`\`json
{"model":"llama-3.3-70b","mtok":2,"maxPriceUsd":0.5,"buyer":"0x…"}
\`\`\`

## Pay
POST ${origin}/v1/matches/{id}/pay → 402 dual accepts (seller + hub × Base and/or Solana) → retry with payment-signature / X-Payment → grant

We accept payment in USDC on x402 on both Base and Solana, and via pay.sh on Solana. Each swap clears seller + protocol fee.

Full skill: see repo skills/curb/SKILL.md
`;
}

function llmsTxt(origin) {
  return [
    "# CURB",
    `> Agent↔agent inference swap. We accept payment in USDC on x402 on both Base and Solana, and via pay.sh on Solana. Each swap clears seller + protocol fee. No upstream keys on hub. Product: ${PRODUCT_ID}`,
    "",
    `Home: ${origin}/`,
    `Token & fees: ${origin}/fees`,
    `Token: CURB on Base · 0xf0CBbf0806eD88910a011eEc9439A990c8C24BA3`,
    `Docs: ${origin}/docs/`,
    `OpenAPI: ${origin}/openapi.json`,
    `Discovery: ${origin}/.well-known/x402`,
    `Pay probe: POST ${origin}/v1/pay`,
    `Skill: ${origin}/skill.md`,
    `MCP: POST ${origin}/mcp`,
    `Offers: GET ${origin}/v1/offers`,
    `Feed: ${origin}/feed.xml`,
    `Sitemap: ${origin}/sitemap.xml`,
    `Newsletter: ${origin}/newsletter`,
    `Payments: We accept payment in USDC on x402 on both Base and Solana, and via pay.sh on Solana. Each swap clears seller + protocol fee.`,
    `Contact: contact@numetal.xyz`,
    "",
  ].join("\n");
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const origin = url.origin;
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // Static assets + Vocs docs via Workers Assets
    if (
      path.startsWith("/assets/") ||
      path.startsWith("/docs") ||
      path === "/curb-sun.svg" ||
      path.endsWith(".css") ||
      path.endsWith(".js") ||
      path.endsWith(".map") ||
      path.endsWith(".woff2") ||
      path.endsWith(".png") ||
      path.endsWith(".svg") ||
      path.endsWith(".ico")
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
        return json({ ok: true, product: PRODUCT_ID, brand: "CURB", ...s }, 200, request);
      }

      if (path === "/" && request.method === "GET") {
        const s = await stats(env);
        return text(landingHtml(origin, s), "text/html; charset=utf-8", 200, request);
      }

      if (path === "/fees" && request.method === "GET") {
        return text(feesHtml(origin, env), "text/html; charset=utf-8", 200, request);
      }
      if (path === "/token" && request.method === "GET") {
        return new Response(null, {
          status: 302,
          headers: { Location: "/fees", ...corsHeaders(request), ...securityHeaders({ "Content-Security-Policy": undefined }) },
        });
      }

      if (path === "/terms" && request.method === "GET") {
        return text(termsHtml(origin), "text/html; charset=utf-8", 200, request);
      }
      if (path === "/privacy" && request.method === "GET") {
        return text(privacyHtml(origin), "text/html; charset=utf-8", 200, request);
      }
      if (path === "/newsletter" && request.method === "GET") {
        return text(newsletterHtml(origin), "text/html; charset=utf-8", 200, request);
      }
      if ((path === "/feed.xml" || path === "/rss.xml") && request.method === "GET") {
        return text(feedXml(origin), "application/rss+xml; charset=utf-8", 200, request);
      }
      if (path === "/sitemap.xml" && request.method === "GET") {
        return text(sitemapXml(origin), "application/xml; charset=utf-8", 200, request);
      }

      if (path === "/openapi.json" && request.method === "GET") {
        return json(buildOpenApi(env, origin), 200, request);
      }

      if (path === "/.well-known/x402" && request.method === "GET") {
        return json(await wellKnownX402(env, origin), 200, request);
      }

      if (path === "/llms.txt" && request.method === "GET") {
        return text(llmsTxt(origin), "text/plain; charset=utf-8", 200, request);
      }

      if (path === "/skill.md" && request.method === "GET") {
        return text(await skillMd(env, origin), "text/markdown; charset=utf-8", 200, request);
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
        const r = await createIntent(env, body, origin);
        if (r.error) return json({ error: r.error }, r.status, request);
        return json(r.body, r.status, request);
      }

      const matchGet = path.match(/^\/v1\/matches\/([^/]+)$/);
      if (matchGet && request.method === "GET") {
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
            "CURB discovery probe. Attach payment covering seller + hub_fee accepts on one network (Base or Solana), or use POST /v1/matches/{id}/pay for a real match.",
          price: { amount: String(challenge.split.grossUsd), currency: "USD" },
          paymentInfo: {
            networks: challenge.rails?.solana
              ? ["eip155:8453", "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"]
              : ["eip155:8453"],
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
        const m = await getMatch(env, id);
        if (!m) return json({ error: "not_found" }, 404, request);

        const demo = url.searchParams.get("demo") === "1" && bearerOk(request, env.ACCESS_KEY);
        if (demo) {
          const paid = await markPaid(env, id, { demo: true, note: "demo_settle" });
          return json(paid.body, paid.status, request);
        }

        if (!hasPaymentHeader(request)) {
          const fresh = await refreshMatchChallenge(env, m, origin);
          return paymentRequiredResponse({
            error: "payment_required",
            message:
              "Attach payment-signature / X-Payment covering seller + hub_fee accepts on one network (Base or Solana), then retry.",
            price: { amount: String(fresh.split.grossUsd), currency: "USD" },
            paymentInfo: {
              networks: fresh.challenge?.rails?.solana
                ? ["eip155:8453", "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"]
                : ["eip155:8453"],
              asset: "USDC",
              x402Version: 2,
            },
            ...fresh.challenge,
          });
        }

        const paid = await markPaid(env, id, { note: "x_payment_header_present" });
        return json(paid.body, paid.status, request);
      }

      if (path === "/admin/seed" && request.method === "POST") {
        if (!bearerOk(request, env.ACCESS_KEY)) return json({ error: "unauthorized" }, 401, request);
        const parsed = await readJsonLimited(request);
        if (parsed.error) return json({ error: parsed.error }, parsed.status, request);
        const body = parsed.body;
        const r = await createOffer(env, {
          sellerPayTo: body.sellerPayTo || env.HUB_PAY_TO,
          sellerSolPayTo: body.sellerSolPayTo || body.solanaPayTo || env.HUB_PAY_TO_SOLANA,
          endpoint: body.endpoint || `${origin}/v1/demo-fulfill`,
          model: body.model || "demo/llama-3.3-70b",
          mtok: body.mtok || 10,
          priceUsd: body.priceUsd || 0.5,
          attestation: "demo_seed",
          note: "seed offer for smoke",
        });
        return json(r.body || r, r.status || 500, request);
      }

      if (path === "/v1/demo-fulfill" && request.method === "POST") {
        const parsed = await readJsonLimited(request);
        return json(
          {
            ok: true,
            demo: true,
            message: "Replace this endpoint with a real seller OpenAI-compatible API.",
            echo: parsed.body ?? null,
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
      return json({ error: "internal", message: String(err?.message || err) }, 500, request);
    }
  },
};
