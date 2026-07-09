export function buildOpenApi(env, origin) {
  return {
    openapi: "3.1.0",
    info: {
      title: "CURB",
      version: "0.1.0",
      description:
        "CURB — agent-to-agent inference swap rail. Post sell offers / buy intents; hub matches; x402 dual accepts (seller + protocol fee). Hub does not hold upstream LLM keys.",
      contact: { email: "contact@numetal.xyz", name: "Numetal Labs" },
    },
    servers: [{ url: origin }],
    paths: {
      "/health": {
        get: {
          summary: "Health",
          security: [],
          responses: { "200": { description: "ok" } },
        },
      },
      "/v1/offers": {
        get: {
          summary: "List open sell offers",
          security: [],
          responses: { "200": { description: "offers" } },
        },
        post: {
          summary: "Create sell offer",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sellerPayTo", "endpoint", "model", "mtok", "priceUsd"],
                  properties: {
                    sellerPayTo: { type: "string" },
                    endpoint: { type: "string", format: "uri" },
                    model: { type: "string" },
                    mtok: { type: "number" },
                    priceUsd: { type: "number" },
                    attestation: { type: "string" },
                    note: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "created" } },
        },
      },
      "/v1/intents": {
        post: {
          summary: "Create buy intent (auto-match when possible)",
          security: [],
          responses: { "201": { description: "intent + optional match" } },
        },
      },
      "/v1/matches/{id}": {
        get: {
          summary: "Get match",
          security: [],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "match" } },
        },
      },
      "/v1/matches/{id}/pay": {
        post: {
          summary: "Pay match — 402 dual accepts without X-Payment; settle with header",
          security: [],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "402": { description: "Payment required (seller + hub fee)" },
            "200": { description: "Paid — grant issued" },
          },
        },
      },
      "/mcp": {
        post: {
          summary: "MCP JSON-RPC (tools/list, tools/call)",
          security: [],
          responses: { "200": { description: "mcp" } },
        },
      },
    },
    "x-numetal": {
      product: "numetal-curb",
      brand: "CURB",
      feeBps: Number(env.FEE_BPS || 500),
      hubPayTo: env.HUB_PAY_TO || null,
      network: env.NETWORK || "eip155:8453",
      noUpstreamKeys: true,
    },
  };
}

export function wellKnownX402(env, origin) {
  return {
    version: 2,
    name: "CURB",
    description: "Peer-to-peer inference swap with dual-payee x402 (seller + hub fee).",
    url: origin,
    openapi: `${origin}/openapi.json`,
    mcp: `${origin}/mcp`,
    skill: `${origin}/skill.md`,
    feeBps: Number(env.FEE_BPS || 500),
    hubPayTo: env.HUB_PAY_TO || null,
    network: env.NETWORK || "eip155:8453",
    asset: env.USDC || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  };
}
