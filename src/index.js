import { createOffer, listOffers, createIntent, getMatch, markPaid, stats } from "./swap.js";
import { paymentRequiredResponse, hasPaymentHeader } from "./x402.js";
import { buildOpenApi, wellKnownX402 } from "./openapi.js";
import { handleMcp } from "./mcp.js";
import { landingHtml } from "./landing.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Payment, PAYMENT-SIGNATURE",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

function text(body, type = "text/plain; charset=utf-8", status = 200) {
  return new Response(body, { status, headers: { "Content-Type": type, ...CORS } });
}

function bearerOk(request, key) {
  if (!key) return false;
  const m = (request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i);
  return Boolean(m && m[1] === key);
}

async function skillMd(env, origin) {
  // Prefer repo skill file content inlined for deploy simplicity
  return `# Numetal Inference Swap

Agent-to-agent inference swap rail. Base: ${origin}

- OpenAPI: ${origin}/openapi.json
- Discovery: ${origin}/.well-known/x402
- MCP: POST ${origin}/mcp
- Fee: ${env.FEE_BPS || 500} bps · hub does not hold upstream LLM keys

## Sell
POST ${origin}/v1/offers
\`\`\`json
{"sellerPayTo":"0x…","endpoint":"https://…/v1/chat/completions","model":"llama-3.3-70b","mtok":10,"priceUsd":0.8}
\`\`\`

## Buy
POST ${origin}/v1/intents
\`\`\`json
{"model":"llama-3.3-70b","mtok":2,"maxPriceUsd":0.5,"buyer":"0x…"}
\`\`\`

## Pay
POST ${origin}/v1/matches/{id}/pay → 402 dual accepts (seller + hub) → retry with X-Payment → grant

Full skill: see repo skills/numetal-inference-swap/SKILL.md
`;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const origin = url.origin;
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      if (path === "/health" && request.method === "GET") {
        const s = await stats(env);
        return json({ ok: true, product: "numetal-inference-swap", ...s });
      }

      if (path === "/" && request.method === "GET") {
        const s = await stats(env);
        return text(landingHtml(origin, s), "text/html; charset=utf-8");
      }

      if (path === "/openapi.json" && request.method === "GET") {
        return json(buildOpenApi(env, origin));
      }

      if (path === "/.well-known/x402" && request.method === "GET") {
        return json(wellKnownX402(env, origin));
      }

      if (path === "/llms.txt" && request.method === "GET") {
        return text(
          [
            "# Numetal Inference Swap",
            `> Agent↔agent inference swap. Dual-payee x402. No upstream keys on hub.`,
            "",
            `OpenAPI: ${origin}/openapi.json`,
            `Discovery: ${origin}/.well-known/x402`,
            `Skill: ${origin}/skill.md`,
            `MCP: POST ${origin}/mcp`,
            `Offers: GET ${origin}/v1/offers`,
            "",
          ].join("\n")
        );
      }

      if (path === "/skill.md" && request.method === "GET") {
        return text(await skillMd(env, origin), "text/markdown; charset=utf-8");
      }

      if (path === "/mcp" && request.method === "POST") {
        return handleMcp(env, request, origin);
      }
      if (path === "/mcp" && request.method === "GET") {
        return json({
          name: "numetal-inference-swap",
          transport: "json-rpc POST",
          tools: ["swap_list_offers", "swap_create_offer", "swap_create_intent", "swap_get_match", "swap_pay_challenge"],
        });
      }

      if (path === "/v1/offers" && request.method === "GET") {
        const limit = Number(url.searchParams.get("limit") || 50);
        return json({ offers: await listOffers(env, { limit }) });
      }

      if (path === "/v1/offers" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const r = await createOffer(env, body);
        if (r.error) return json({ error: r.error }, r.status);
        return json(r.body, r.status);
      }

      if (path === "/v1/intents" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const r = await createIntent(env, body, origin);
        if (r.error) return json({ error: r.error }, r.status);
        return json(r.body, r.status);
      }

      const matchGet = path.match(/^\/v1\/matches\/([^/]+)$/);
      if (matchGet && request.method === "GET") {
        const m = await getMatch(env, matchGet[1]);
        if (!m) return json({ error: "not_found" }, 404);
        return json(m);
      }

      const matchPay = path.match(/^\/v1\/matches\/([^/]+)\/pay$/);
      if (matchPay && request.method === "POST") {
        const id = matchPay[1];
        const m = await getMatch(env, id);
        if (!m) return json({ error: "not_found" }, 404);

        const demo = url.searchParams.get("demo") === "1" && bearerOk(request, env.ACCESS_KEY);
        if (demo) {
          const paid = await markPaid(env, id, { demo: true, note: "demo_settle" });
          return json(paid.body, paid.status);
        }

        if (!hasPaymentHeader(request)) {
          return paymentRequiredResponse({
            error: "payment_required",
            message: "Attach X-Payment covering seller + hub fee accepts, then retry.",
            price: { amount: String(m.split.grossUsd), currency: "USD" },
            paymentInfo: { network: env.NETWORK || "eip155:8453", asset: "USDC", x402Version: 2 },
            ...m.challenge,
          });
        }

        // v0.1: header present → issue grant (CDP full verify when secrets wired)
        const paid = await markPaid(env, id, { note: "x_payment_header_present" });
        return json(paid.body, paid.status);
      }

      if (path === "/admin/seed" && request.method === "POST") {
        if (!bearerOk(request, env.ACCESS_KEY)) return json({ error: "unauthorized" }, 401);
        const body = await request.json().catch(() => ({}));
        const r = await createOffer(env, {
          sellerPayTo: body.sellerPayTo || env.HUB_PAY_TO,
          endpoint: body.endpoint || `${origin}/v1/demo-fulfill`,
          model: body.model || "demo/llama-3.3-70b",
          mtok: body.mtok || 10,
          priceUsd: body.priceUsd || 0.5,
          attestation: "demo_seed",
          note: "seed offer for smoke",
        });
        return json(r.body || r, r.status || 500);
      }

      // Demo fulfill stub — sellers replace with real endpoint
      if (path === "/v1/demo-fulfill" && request.method === "POST") {
        return json({
          ok: true,
          demo: true,
          message: "Replace this endpoint with a real seller OpenAI-compatible API.",
          echo: await request.json().catch(() => null),
        });
      }

      return json({ error: "not_found", path }, 404);
    } catch (err) {
      return json({ error: "internal", message: String(err?.message || err) }, 500);
    }
  },
};
