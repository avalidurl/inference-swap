import { createOffer, listOffers, createIntent, getMatch, markPaid } from "./swap.js";
import { hasPaymentHeader } from "./x402.js";

const TOOLS = [
  {
    name: "swap_list_offers",
    description: "List open sell offers on Numetal Inference Swap",
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

export async function handleMcp(env, request, origin) {
  const msg = await request.json().catch(() => null);
  if (!msg || msg.jsonrpc !== "2.0") {
    return jsonRpc(null, { code: -32600, message: "Invalid Request" });
  }

  if (msg.method === "initialize") {
    return jsonRpc(msg.id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "numetal-inference-swap", version: "0.1.0" },
    });
  }

  if (msg.method === "tools/list") {
    return jsonRpc(msg.id, { tools: TOOLS });
  }

  if (msg.method === "tools/call") {
    const name = msg.params?.name;
    const args = msg.params?.arguments || {};
    try {
      const result = await callTool(env, name, args, origin, request);
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

  return jsonRpc(msg.id, { code: -32601, message: `Method not found: ${msg.method}` });
}

async function callTool(env, name, args, origin, request) {
  switch (name) {
    case "swap_list_offers":
      return { offers: await listOffers(env, { limit: Number(args.limit || 50) }) };
    case "swap_create_offer": {
      const r = await createOffer(env, args);
      if (r.error) throw new Error(r.error);
      return r.body;
    }
    case "swap_create_intent": {
      const r = await createIntent(env, args, origin);
      if (r.error) throw new Error(r.error);
      return r.body;
    }
    case "swap_get_match": {
      const m = await getMatch(env, args.matchId);
      if (!m) throw new Error("not_found");
      return m;
    }
    case "swap_pay_challenge": {
      const m = await getMatch(env, args.matchId);
      if (!m) throw new Error("not_found");
      if (hasPaymentHeader(request)) {
        const paid = await markPaid(env, args.matchId, { note: "mcp_payment_header" });
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
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
