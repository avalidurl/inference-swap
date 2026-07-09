import { createOffer, listOffers, createIntent, getMatch, markPaid } from "./swap.js";
import { hasPaymentHeader, verifyPayment } from "./x402.js";
import { sanitizeOfferInput, sanitizeIntentInput, validateCaps } from "./harden.js";

const TOOLS = [
  {
    name: "swap_list_offers",
    description: "List open sell offers on CURB",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  },
  {
    name: "swap_create_offer",
    description: "Post a sell offer (seller endpoint + payTo + model + mtok + priceUsd)",
    inputSchema: {
      type: "object",
      required: ["sellerPayTo", "endpoint", "model", "mtok", "priceUsd"],
      properties: {
        sellerPayTo: { type: "string" },
        sellerSolPayTo: {
          type: "string",
          description: "Optional Solana USDC payTo for full dual-rail seller+hub",
        },
        endpoint: { type: "string" },
        model: { type: "string" },
        mtok: { type: "number" },
        priceUsd: { type: "number" },
        note: { type: "string" },
      },
    },
  },
  {
    name: "swap_create_intent",
    description: "Post a buy intent; auto-matches an open offer when possible",
    inputSchema: {
      type: "object",
      required: ["mtok"],
      properties: {
        model: { type: "string" },
        mtok: { type: "number" },
        maxPriceUsd: { type: "number" },
        offerId: { type: "string" },
        buyer: { type: "string" },
      },
    },
  },
  {
    name: "swap_get_match",
    description: "Fetch a match (payment challenge + grant after pay)",
    inputSchema: {
      type: "object",
      required: ["matchId"],
      properties: { matchId: { type: "string" } },
    },
  },
  {
    name: "swap_pay_challenge",
    description: "Get dual-payee x402 challenge for a match (seller + hub fee)",
    inputSchema: {
      type: "object",
      required: ["matchId"],
      properties: { matchId: { type: "string" } },
    },
  },
];

function bearerOk(request, key) {
  if (!key) return false;
  const m = (request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i);
  return Boolean(m && m[1] === key);
}

export async function handleMcp(env, request, origin) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > 32 * 1024) {
    return jsonRpc(null, { code: -32600, message: "body_too_large" });
  }
  const msg = await request.json().catch(() => null);
  if (!msg || msg.jsonrpc !== "2.0") {
    return jsonRpc(null, { code: -32600, message: "Invalid Request" });
  }

  if (msg.method === "initialize") {
    return jsonRpc(msg.id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "numetal-curb", version: "0.1.0" },
    });
  }

  if (msg.method === "tools/list") {
    return jsonRpc(msg.id, { tools: TOOLS });
  }

  // No destructive admin tools exposed via MCP without ACCESS_KEY.
  // Reject unknown methods that look like admin.
  if (typeof msg.method === "string" && /admin|seed|delete|drop|purge/i.test(msg.method)) {
    if (!bearerOk(request, env.ACCESS_KEY)) {
      return jsonRpc(msg.id, { code: -32001, message: "unauthorized" });
    }
  }

  if (msg.method === "tools/call") {
    const name = String(msg.params?.name || "").slice(0, 64);
    const rawArgs = msg.params?.arguments && typeof msg.params.arguments === "object" ? msg.params.arguments : {};
    try {
      const result = await callTool(env, name, rawArgs, origin, request);
      return jsonRpc(msg.id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    } catch (e) {
      return jsonRpc(msg.id, {
        content: [{ type: "text", text: String(e?.message || e) }],
        isError: true,
      });
    }
  }

  return jsonRpc(msg.id, { code: -32601, message: `Method not found: ${String(msg.method).slice(0, 64)}` });
}

async function callTool(env, name, args, origin, request) {
  switch (name) {
    case "swap_list_offers": {
      const limit = Math.min(100, Math.max(1, Number(args.limit || 50) || 50));
      return { offers: await listOffers(env, { limit }) };
    }
    case "swap_create_offer": {
      const body = sanitizeOfferInput(args);
      const capErr = validateCaps({ mtok: Number(body.mtok), priceUsd: Number(body.priceUsd) });
      if (capErr) throw new Error(capErr);
      const r = await createOffer(env, body);
      if (r.error) throw new Error(r.error);
      return r.body;
    }
    case "swap_create_intent": {
      const body = sanitizeIntentInput(args);
      const capErr = validateCaps({
        mtok: Number(body.mtok),
        maxPriceUsd: body.maxPriceUsd != null ? Number(body.maxPriceUsd) : null,
      });
      if (capErr) throw new Error(capErr);
      const r = await createIntent(env, body, origin);
      if (r.error) throw new Error(r.error);
      return r.body;
    }
    case "swap_get_match": {
      const matchId = String(args.matchId || "").slice(0, 64);
      const m = await getMatch(env, matchId);
      if (!m) throw new Error("not_found");
      return m;
    }
    case "swap_pay_challenge": {
      const matchId = String(args.matchId || "").slice(0, 64);
      const m = await getMatch(env, matchId);
      if (!m) throw new Error("not_found");
      if (hasPaymentHeader(request)) {
        const verdict = await verifyPayment(env, request, m);
        if (!verdict.ok) {
          return {
            status: 402,
            verified: false,
            reason: verdict.reason || "unverified",
            challenge: m.challenge,
            payUrl: `${origin}/v1/matches/${m.id}/pay`,
          };
        }
        const paid = await markPaid(env, matchId, {
          note: verdict.verified ? "mcp_x402_verified" : "mcp_demo_settle",
          demo: Boolean(verdict.demo),
          verified: Boolean(verdict.verified),
          mode: verdict.mode,
          settlement: verdict.settlement || null,
        });
        return paid.body;
      }
      return { status: 402, challenge: m.challenge, payUrl: `${origin}/v1/matches/${m.id}/pay` };
    }
    default:
      throw new Error(`unknown_tool: ${name}`);
  }
}

function jsonRpc(id, resultOrError) {
  const body =
    resultOrError && resultOrError.code && resultOrError.message && !resultOrError.content
      ? { jsonrpc: "2.0", id, error: resultOrError }
      : { jsonrpc: "2.0", id, result: resultOrError };
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
