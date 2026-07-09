import {
  X402_VERSION,
  NETWORK_SOLANA,
  USDC_BASE,
  USDC_SOLANA,
  DEFAULT_HUB_PAY_TO_SOLANA,
  DEFAULT_SOLANA_FEE_PAYER,
  hubPayToBase,
  hubPayToSolana,
  solanaEnabled,
  baseNetwork,
  baseAsset,
  discoveryAccepts,
  settleMode,
  DISCOVERY_BAZAAR,
  MATCH_PAY_BAZAAR,
} from "./x402.js";

const DISCOVERY_PRICE = "0.100000";

function paymentRequirementSchema() {
  return {
    type: "object",
    properties: {
      scheme: { type: "string", enum: ["exact"] },
      network: {
        type: "string",
        description:
          "CAIP-2 network (eip155:8453 Base mainnet, solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp Solana mainnet).",
      },
      amount: { type: "string", description: "USDC atomic units (6 decimals)." },
      asset: { type: "string", description: "USDC contract (EVM 0x…) or SPL mint (Solana base58)." },
      payTo: { type: "string" },
      maxTimeoutSeconds: { type: "integer" },
      extra: {
        type: "object",
        description:
          "EVM: EIP-712 domain {name, version} + role. Solana: {feePayer, role} from facilitator /supported.",
      },
    },
    required: ["scheme", "network", "amount", "asset", "payTo", "maxTimeoutSeconds"],
  };
}

function exampleAccepts(env) {
  const hub = hubPayToBase(env) || "0x3eee81B5b4cf1983b7DB36cf042B5d06c04F33eE";
  const hubSol = hubPayToSolana(env) || DEFAULT_HUB_PAY_TO_SOLANA;
  const amountSeller = "95000"; // $0.095 after 500 bps on $0.10
  const amountFee = "5000";
  const out = [
    {
      scheme: "exact",
      network: baseNetwork(env),
      amount: amountSeller,
      asset: baseAsset(env),
      payTo: hub,
      maxTimeoutSeconds: 300,
      extra: { name: "USDC", version: "2", role: "seller", amountUsd: "0.095" },
    },
    {
      scheme: "exact",
      network: baseNetwork(env),
      amount: amountFee,
      asset: baseAsset(env),
      payTo: hub,
      maxTimeoutSeconds: 300,
      extra: { name: "USDC", version: "2", role: "hub_fee", amountUsd: "0.005", feeBps: 500 },
    },
  ];
  if (solanaEnabled(env)) {
    out.push(
      {
        scheme: "exact",
        network: NETWORK_SOLANA,
        amount: amountSeller,
        asset: USDC_SOLANA,
        payTo: hubSol,
        maxTimeoutSeconds: 300,
        extra: {
          feePayer: env.X402_SOLANA_FEE_PAYER || DEFAULT_SOLANA_FEE_PAYER,
          role: "seller",
          amountUsd: "0.095",
        },
      },
      {
        scheme: "exact",
        network: NETWORK_SOLANA,
        amount: amountFee,
        asset: USDC_SOLANA,
        payTo: hubSol,
        maxTimeoutSeconds: 300,
        extra: {
          feePayer: env.X402_SOLANA_FEE_PAYER || DEFAULT_SOLANA_FEE_PAYER,
          role: "hub_fee",
          amountUsd: "0.005",
          feeBps: 500,
        },
      }
    );
  }
  return out;
}

function pay402(env, origin, description, resourcePath = "/v1/pay") {
  const accepts = exampleAccepts(env);
  const realm = (() => {
    try {
      return new URL(origin).hostname;
    } catch {
      return "curb.numetal.xyz";
    }
  })();
  return {
    description,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            x402Version: { type: "integer", const: X402_VERSION },
            error: { type: "string" },
            resource: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri" },
                description: { type: "string" },
                mimeType: { type: "string" },
              },
              required: ["url"],
            },
            accepts: {
              type: "array",
              minItems: 1,
              items: paymentRequirementSchema(),
              example: accepts,
            },
            extensions: {
              type: "object",
              description: "x402 v2 extensions — bazaar input/output schemas for discovery.",
            },
          },
          required: ["x402Version", "resource", "accepts"],
        },
        example: {
          x402Version: X402_VERSION,
          error: "payment_required",
          resource: {
            url: `${origin}${resourcePath}`,
            description: "CURB discovery probe — USDC on x402 on Base + Solana (sample price)",
            mimeType: "application/json",
          },
          accepts,
        },
      },
    },
    headers: {
      "PAYMENT-REQUIRED": {
        description: "Base64(JSON) x402 v2 PaymentRequired — same object as the JSON body (incl. extensions.bazaar).",
        schema: { type: "string" },
      },
      "WWW-Authenticate": {
        description:
          'IETF Payment challenge (draft-httpauth-payment). Example: Payment id="…", realm="' +
          realm +
          '", method="x402", intent="charge", expires="…", opaque="…", request="…"',
        schema: {
          type: "string",
          example: `Payment id="…", realm="${realm}", method="x402", intent="charge", expires="2026-07-09T13:00:00Z", opaque="…", request="…"`,
        },
      },
    },
  };
}

function ownershipDiscovery(env) {
  const proofs = String(env.AGENTCASH_OWNERSHIP_PROOF || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return proofs.length ? { "x-discovery": { ownershipProofs: proofs } } : {};
}

export function buildOpenApi(env, origin) {
  const feeBps = Number(env.FEE_BPS || 500);
  const protocols = [{ x402: {} }];
  const payShHook = {
    "x-numetal-pay-sh": {
      status: "buyer_cli",
      note: "We accept payment in USDC on x402 on both Base and Solana, and via pay.sh on Solana. Each swap clears seller + protocol fee.",
    },
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "CURB",
      version: "0.1.0",
      description:
        "CURB — agent-to-agent inference swap rail. We accept payment in USDC on x402 on both Base and Solana, and via pay.sh on Solana. Each swap clears seller + protocol fee. Hub does not hold upstream LLM keys.",
      "x-guidance":
        "1) GET /v1/offers (free) to browse capacity. 2) POST /v1/offers to sell (include sellerPayTo Base 0x…; optional sellerSolPayTo for full Solana dual-payee). 3) POST /v1/intents to buy — hub auto-matches. 4) POST /v1/matches/{id}/pay bare → 402 with accepts[] (role=seller + role=hub_fee on eip155:8453 and, when enabled, solana:…). Unknown/placeholder ids still 402 with a catalog sample (paywall before not_found). Pick ONE network; pay BOTH roles on that network; retry with payment-signature / X-Payment. 5) Discovery probe: bare POST /v1/pay → sample 402 (no side effects). Refunds/billing: contact@numetal.xyz.",
      contact: { email: "contact@numetal.xyz", name: "Numetal Labs", url: "https://curb.numetal.xyz" },
    },
    ...ownershipDiscovery(env),
    servers: [{ url: origin }],
    paths: {
      "/openapi.json": {
        get: {
          operationId: "getOpenApi",
          summary: "OpenAPI 3.1 document (free)",
          security: [],
          responses: {
            "200": {
              description: "OpenAPI 3.1 JSON",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/.well-known/x402": {
        get: {
          operationId: "wellKnownX402",
          summary: "x402 discovery manifest (free)",
          security: [],
          responses: {
            "200": {
              description: "x402 resources + accepts",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/health": {
        get: {
          operationId: "health",
          summary: "Health",
          security: [],
          responses: {
            "200": {
              description: "ok",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      product: { type: "string" },
                      brand: { type: "string" },
                      openOffers: { type: "number" },
                      rails: { type: "object" },
                    },
                    required: ["ok"],
                  },
                },
              },
            },
          },
        },
      },
      "/v1/offers": {
        get: {
          operationId: "listOffers",
          summary: "List open sell offers",
          security: [],
          responses: {
            "200": {
              description: "offers",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { offers: { type: "array", items: { type: "object" } } },
                    required: ["offers"],
                  },
                },
              },
            },
          },
        },
        post: {
          operationId: "createOffer",
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
                    sellerPayTo: {
                      type: "string",
                      description: "Seller Base (EVM) USDC payTo — 0x…",
                    },
                    sellerSolPayTo: {
                      type: "string",
                      description:
                        "Optional seller Solana USDC payTo (base58). When set, match 402 includes full Solana dual-payee (seller + hub_fee).",
                    },
                    solanaPayTo: {
                      type: "string",
                      description: "Alias of sellerSolPayTo",
                    },
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
          operationId: "createIntent",
          summary: "Create buy intent (auto-match when possible)",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
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
            },
          },
          responses: { "201": { description: "intent + optional match" } },
        },
      },
      "/v1/matches/{id}": {
        get: {
          operationId: "getMatch",
          summary: "Get match",
          security: [],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "match" } },
        },
      },
      "/v1/pay": {
        post: {
          operationId: "discoveryPayProbe",
          summary: "Discovery probe — bare POST returns sample dual-rail x402 402 (no side effects)",
          description:
            "Stable URL for x402scan / AgentCash discovery. Returns HTTP 402 with accepts[] covering seller + hub_fee on Base and Solana (sample $0.10). Does not create a match. Real settlement uses POST /v1/matches/{id}/pay. Paywall runs before body validation.",
          tags: ["Payments"],
          "x-payment-info": {
            price: { mode: "fixed", currency: "USD", amount: DISCOVERY_PRICE },
            protocols,
          },
          security: [{ x402: [] }],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: DISCOVERY_BAZAAR.bodySchema.properties,
                  example: DISCOVERY_BAZAAR.inputBody,
                },
              },
            },
          },
          responses: {
            "402": pay402(
              env,
              origin,
              "Payment Required — dual-payee x402 (seller + hub_fee) on Base and/or Solana USDC. WWW-Authenticate carries an IETF Payment challenge; PAYMENT-REQUIRED carries the x402 v2 body (incl. extensions.bazaar).",
              "/v1/pay"
            ),
            "200": {
              description: "Paid probe ack (demo / header present) — no grant; use match pay for real swaps.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      probe: { type: "boolean" },
                      message: { type: "string" },
                    },
                    required: ["ok", "probe", "message"],
                    example: DISCOVERY_BAZAAR.outputExample,
                  },
                },
              },
            },
          },
        },
      },
      "/v1/matches/{id}/pay": {
        post: {
          operationId: "payMatch",
          summary: "Pay match — 402 dual-payee accepts without payment header; settle with header",
          description:
            "Match-specific price (dynamic). Paywall runs before not_found: bare POST always returns 402 (live match challenge, or catalog sample when id is unknown/placeholder — same dual-rail shape as POST /v1/pay). Retry with payment-signature / X-Payment. 404 only when a payment header is present and the match id does not exist.",
          tags: ["Payments"],
          "x-payment-info": {
            price: { mode: "dynamic", currency: "USD", min: "0.001", max: "100.000000" },
            protocols,
          },
          security: [{ x402: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description:
                "Match id from POST /v1/intents. Discovery scanners may probe with `probe` or `{id}`; unpaid unknown ids still return HTTP 402 with a catalog sample challenge.",
              schema: { type: "string", minLength: 1, example: "probe" },
              example: "probe",
            },
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: MATCH_PAY_BAZAAR.bodySchema.properties || {},
                  example: MATCH_PAY_BAZAAR.inputBody,
                },
              },
            },
          },
          responses: {
            "402": pay402(
              env,
              origin,
              "Payment required (seller + hub fee on Base and/or Solana). WWW-Authenticate: Payment …; PAYMENT-REQUIRED: base64 x402 v2. Unknown match ids still 402 (catalog sample) when unpaid.",
              "/v1/matches/probe/pay"
            ),
            "200": {
              description: "Paid — grant issued",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      matchId: { type: "string" },
                      grant: { type: "object" },
                    },
                    example: MATCH_PAY_BAZAAR.outputExample,
                  },
                },
              },
            },
            "404": {
              description: "Match not found — only when payment-signature / X-Payment is present and the id does not exist. Unpaid probes never 404.",
            },
          },
        },
      },
      "/mcp": {
        get: {
          operationId: "mcpInfo",
          summary: "MCP transport info (free)",
          security: [],
          responses: {
            "200": {
              description: "MCP JSON-RPC transport metadata",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
        post: {
          operationId: "mcp",
          summary: "MCP JSON-RPC (tools/list, tools/call)",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["jsonrpc", "method"],
                  properties: {
                    jsonrpc: { type: "string" },
                    method: { type: "string" },
                    params: { type: "object" },
                    id: {},
                  },
                },
              },
            },
          },
          responses: { "200": { description: "mcp" } },
        },
      },
    },
    components: {
      securitySchemes: {
        x402: {
          type: "apiKey",
          in: "header",
          name: "payment-signature",
          description:
            "x402 pay-per-call (USDC on Base eip155:8453 and/or Solana solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp). Bare request → 402 with PAYMENT-REQUIRED; sign and retry. Dual-payee: pay both role=seller and role=hub_fee on the chosen network.",
        },
      },
    },
    "x-numetal": {
      product: "numetal-curb",
      brand: "CURB",
      feeBps,
      hubPayTo: hubPayToBase(env),
      hubPayToSolana: solanaEnabled(env) ? hubPayToSolana(env) : null,
      networks: solanaEnabled(env)
        ? [baseNetwork(env), NETWORK_SOLANA]
        : [baseNetwork(env)],
      assets: {
        base: baseAsset(env),
        solana: solanaEnabled(env) ? USDC_SOLANA : null,
      },
      noUpstreamKeys: true,
      settlement: {
        mode: settleMode(env),
        note:
          "demo: a present payment header settles but the grant is marked verified:false (NOT verified on-chain). verify (SETTLE_MODE=verify + CDP secrets): only a facilitator-verified+settled payment mints a grant; fake/bare headers get 402.",
      },
      ...payShHook,
    },
  };
}

/** Ishtar-shaped discovery manifest for origin scanners (x402scan / AgentCash). */
export async function wellKnownX402(env, origin) {
  const challenge = await discoveryAccepts(env, origin);
  const resources = challenge.accepts?.length
    ? [
        {
          resource: `${origin}/v1/pay`,
          type: "http",
          x402Version: X402_VERSION,
          description:
            "CURB — we accept payment in USDC on x402 on both Base and Solana, and via pay.sh on Solana. Each swap clears seller + protocol fee. Bare POST → 402.",
          mimeType: "application/json",
          accepts: challenge.accepts,
        },
      ]
    : [];

  return {
    x402Version: X402_VERSION,
    resources,
    // Extra merchant metadata (non-conflicting with resources[] scanners)
    name: "CURB",
    url: origin,
    openapi: `${origin}/openapi.json`,
    mcp: `${origin}/mcp`,
    skill: `${origin}/skill.md`,
    feeBps: Number(env.FEE_BPS || 500),
    hubPayTo: hubPayToBase(env),
    hubPayToSolana: solanaEnabled(env) ? hubPayToSolana(env) : null,
    networks: solanaEnabled(env) ? [baseNetwork(env), NETWORK_SOLANA] : [baseNetwork(env)],
    assets: {
      [baseNetwork(env)]: baseAsset(env) || USDC_BASE,
      ...(solanaEnabled(env) ? { [NETWORK_SOLANA]: USDC_SOLANA } : {}),
    },
    facilitator: env.FACILITATOR || "https://api.cdp.coinbase.com/platform/v2/x402",
    paySh: {
      status: "buyer_cli",
      note: "We accept payment in USDC on x402 on both Base and Solana, and via pay.sh on Solana. Each swap clears seller + protocol fee.",
    },
  };
}
