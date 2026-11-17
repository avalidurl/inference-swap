import {
  X402_VERSION,
  USDC_BASE,
  USDC_NAME,
  USDC_VERSION,
  hubPayToBase,
  baseNetwork,
  baseAsset,
  splitAddressBase,
  discoveryAccepts,
  settleMode,
  DISCOVERY_BAZAAR,
  MATCH_PAY_BAZAAR,
} from "./x402.js";
// [mpp] second rail (Tempo push+splits) — advertised in discovery only when the dark flag is live.
import { mppEnabled, mppNetwork, mppCurrency } from "./mpp.js";

/** Payment protocols advertised for paid ops — x402 always; MPP (Tempo) when enabled. */
function paymentProtocols(env) {
  const protocols = [{ x402: {} }];
  if (mppEnabled(env)) protocols.push({ mpp: { network: mppNetwork(env), modes: ["push"], splits: true } });
  return protocols;
}

/** Brief human/agent-readable rails list for x-numetal + discovery. */
function railsList(env) {
  const rails = ["x402 · USDC on Base (eip155:8453)"];
  if (mppEnabled(env)) {
    rails.push(`MPP · USDC on Tempo (${mppNetwork(env)}, push, splits) on POST /v1/matches/{id}/pay`);
  }
  return rails;
}

const DISCOVERY_PRICE = "0.100000";

function paymentRequirementSchema() {
  return {
    type: "object",
    properties: {
      scheme: { type: "string", enum: ["exact"] },
      network: {
        type: "string",
        description: "CAIP-2 network (eip155:8453 Base mainnet).",
      },
      amount: { type: "string", description: "USDC atomic units (6 decimals)." },
      asset: { type: "string", description: "USDC contract (EVM 0x…)." },
      payTo: { type: "string", description: "The 0xSplits split address (gross lands here)." },
      maxTimeoutSeconds: { type: "integer" },
      extra: {
        type: "object",
        description: "EVM: EIP-712 domain {name, version} + role=gross + display breakdown.",
      },
    },
    required: ["scheme", "network", "amount", "asset", "payTo", "maxTimeoutSeconds"],
  };
}

function exampleAccepts(env) {
  // Single-payee, Base-only: ONE gross accept → the split address (0xSplits on Base). CURB
  // fans out seller/hub on-chain via distribute(). breakdown/feeBps are display-only.
  const splitBase = splitAddressBase(env) || hubPayToBase(env) || "0x546217c24617bCF9faD565E8ECABe5dE2D41326b";
  const amountGross = "100000"; // $0.10 gross (6 decimals)
  const breakdown = { sellerUsd: "0.095", feeUsd: "0.005" };
  return [
    {
      scheme: "exact",
      network: baseNetwork(env),
      amount: amountGross,
      asset: baseAsset(env),
      payTo: splitBase,
      maxTimeoutSeconds: 300,
      extra: {
        name: USDC_NAME,
        version: USDC_VERSION,
        role: "gross",
        amountUsd: "0.10",
        feeBps: 500,
        breakdown,
        splitAddress: splitAddressBase(env) || null,
        splitType: "0xsplits-push-v2",
      },
    },
  ];
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
            description: "CURB discovery probe — USDC x402 on Base (sample price)",
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
  const protocols = paymentProtocols(env); // [mpp] x402 + MPP (Tempo) when enabled

  return {
    openapi: "3.1.0",
    info: {
      title: "CURB",
      version: "0.1.0",
      description:
        "CURB — agent-to-agent inference swap rail. Settlement is single-payee x402 USDC on Base (eip155:8453): buyer pays gross ONCE to an on-chain 0xSplits split, CURB fans out seller + protocol fee on-chain. Hub does not hold upstream LLM keys.",
      "x-guidance":
        "1) GET /v1/offers (free) to browse capacity. 2) POST /v1/offers to sell (include sellerPayTo Base 0x…). 3) POST /v1/intents to buy — hub auto-matches. 4) POST /v1/matches/{id}/pay bare → 402 with a SINGLE Base accept (gross = full price to the split address on eip155:8453). Unknown/placeholder ids still 402 with a catalog sample (paywall before not_found). Sign ONE payment for the gross amount to that accept's payTo; retry with payment-signature / X-Payment. CURB splits seller + protocol fee ON-CHAIN via 0xSplits distribute() on Base. 5) Discovery probe: bare POST /v1/pay → sample 402 (no side effects). Refunds/billing: contact@numetal.xyz.",
      contact: { email: "contact@gokhan.vc", name: "Numetal Labs", url: "https://curb.numetal.xyz" },
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
          summary: "Discovery probe — bare POST returns sample single-payee x402 402 (no side effects)",
          description:
            "Stable URL for x402scan / AgentCash discovery. Returns HTTP 402 with a SINGLE Base accept (gross = full price to the split address, sample $0.10). Does not create a match. Real settlement uses POST /v1/matches/{id}/pay. Paywall runs before body validation.",
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
              "Payment Required — single-payee x402 (ONE gross accept → the on-chain 0xSplits split) on Base USDC. WWW-Authenticate carries an IETF Payment challenge; PAYMENT-REQUIRED carries the x402 v2 body (incl. extensions.bazaar).",
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
          summary: "Pay match — 402 single-payee accept without payment header; settle with header",
          description:
            "Match-specific price (dynamic). Paywall runs before not_found: bare POST always returns 402 (live match challenge, or catalog sample when id is unknown/placeholder — same single-payee shape as POST /v1/pay). Retry with payment-signature / X-Payment (ONE gross payment to the split address). 404 only when a payment header is present and the match id does not exist.",
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
              "Payment required (ONE gross accept → the on-chain 0xSplits split on Base). WWW-Authenticate: Payment …; PAYMENT-REQUIRED: base64 x402 v2. Unknown match ids still 402 (catalog sample) when unpaid.",
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
            "x402 pay-per-call (USDC on Base eip155:8453). Bare request → 402 with PAYMENT-REQUIRED; sign and retry. Single-payee: sign ONE gross payment to the accept's payTo (the on-chain 0xSplits split); CURB fans out seller + protocol fee on-chain.",
        },
      },
    },
    "x-numetal": {
      product: "numetal-curb",
      brand: "CURB",
      feeBps,
      rails: railsList(env), // [mpp]
      ...(mppEnabled(env)
        ? {
            mpp: {
              network: mppNetwork(env),
              currency: mppCurrency(env),
              mode: "push",
              splits: true,
              note: "MPP (Tempo eip155 push, splits) on POST /v1/matches/{id}/pay. Credential: Authorization: Payment <b64url>; success carries Payment-Receipt. Same economics as x402 (seller 95% / hub 5%).",
            },
          }
        : {}),
      settlementModel: "single-payee-to-splitter",
      split: {
        base: splitAddressBase(env) || null,
        provider: "0xsplits-push-v2",
        note: "Buyer pays gross once to split; keeper distribute() fans out seller + hub on-chain.",
      },
      hubPayTo: hubPayToBase(env),
      networks: [baseNetwork(env)],
      assets: {
        base: baseAsset(env),
      },
      noUpstreamKeys: true,
      settlement: {
        mode: settleMode(env),
        note:
          "demo: a present payment header settles but the grant is marked verified:false (NOT verified on-chain). verify (SETTLE_MODE=verify + CDP secrets): only a facilitator-verified+settled payment mints a grant; fake/bare headers get 402.",
      },
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
            "CURB — single-payee x402 USDC on Base (eip155:8453). Buyer pays gross once to the on-chain 0xSplits split; CURB fans out seller + protocol fee on-chain. Bare POST → 402.",
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
    // [mpp] second rail — advertised only when live. x402/Base remains the primary discovery surface.
    rails: railsList(env),
    ...(mppEnabled(env)
      ? {
          mpp: {
            network: mppNetwork(env),
            currency: mppCurrency(env),
            mode: "push",
            splits: true,
            resource: `${origin}/v1/matches/{id}/pay`,
            credential: "Authorization: Payment <b64url>",
            receipt: "Payment-Receipt",
          },
        }
      : {}),
    feeBps: Number(env.FEE_BPS || 500),
    settlementModel: "single-payee-to-splitter",
    split: {
      base: splitAddressBase(env) || null,
      provider: "0xsplits-push-v2",
    },
    hubPayTo: hubPayToBase(env),
    networks: [baseNetwork(env)],
    assets: {
      [baseNetwork(env)]: baseAsset(env) || USDC_BASE,
    },
    facilitator: env.FACILITATOR || "https://api.cdp.coinbase.com/platform/v2/x402",
  };
}
