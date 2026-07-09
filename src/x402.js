/**
 * Dual-payee × multi-rail x402 challenge builder (seller + hub fee × Base + Solana).
 * Shape aligned with datebook/x402 v2 (CAIP-2, `amount`, resource top-level) + CDP Solana feePayer.
 *
 * pay.sh is buyer-side only (workstream B) — discovers/pays 402 challenges; CURB remains the
 * resource server. Seller-side acceptor is x402 accepts[], not a pay.sh server.
 */

export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const NETWORK_BASE = "eip155:8453";
export const NETWORK = NETWORK_BASE; // legacy alias
export const NETWORK_SOLANA = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
export const SOLANA_MAINNET_NETWORK = NETWORK_SOLANA; // legacy alias
export const USDC_SOLANA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
/** AgentCash Solana deposit for hub fee (verified via `npx agentcash accounts`). */
export const DEFAULT_HUB_PAY_TO_SOLANA = "2onXWK1M43AZHYbM7EFaLG7rhqZkt9JWxgGjZziq4tCg";
/** @deprecated use DEFAULT_HUB_PAY_TO_SOLANA — kept for older callers */
export const DEFAULT_PAY_TO_SOLANA = DEFAULT_HUB_PAY_TO_SOLANA;
/**
 * CDP mainnet Solana exact-scheme feePayer from live Ishtar /.well-known/x402 (2026-07-09).
 * Override via env.X402_SOLANA_FEE_PAYER / SOLANA_FEE_PAYER when CDP /supported is reachable.
 */
/** Rotates — refresh from a live CDP/Ishtar 402 when clients reject feePayer. */
export const DEFAULT_SOLANA_FEE_PAYER = "Hc3sdEAsCGQcpgfivywog9uwtk8gUBUZgsxdME1EJy88";
export const CDP_FACILITATOR = "https://api.cdp.coinbase.com/platform/v2/x402";
export const X402_VERSION = 2;
export const X402_MAX_TIMEOUT_SECONDS = 300;

const FEE_PAYER_CACHE_TTL_MS = 5 * 60 * 1000;
let feePayerCache = null;

function usdToAtomic(usd) {
  const n = Number(usd);
  if (!Number.isFinite(n) || n < 0) return "0";
  return String(Math.round(n * 1e6));
}

export function feeSplit(env, grossUsd) {
  const bps = Math.max(0, Number(env.FEE_BPS || 500));
  const minFee = Number(env.MIN_FEE_USDC || 0.001);
  const gross = Number(grossUsd);
  let fee = (gross * bps) / 10000;
  if (fee < minFee && gross > 0) fee = Math.min(minFee, gross);
  const seller = Math.max(0, gross - fee);
  return {
    grossUsd: round6(gross),
    feeUsd: round6(fee),
    sellerUsd: round6(seller),
    feeBps: bps,
  };
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

export function isEvmAddress(a) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(a || "").trim());
}

/** Loose Solana base58 pubkey check (32–44 chars, no 0/O/I/l). */
export function isSolanaAddress(a) {
  const s = String(a || "").trim();
  if (s.length < 32 || s.length > 44) return false;
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(s)) return false;
  if (isEvmAddress(s)) return false;
  return true;
}

export function hubPayToBase(env) {
  return String(env.HUB_PAY_TO || "").trim();
}

export function hubPayToSolana(env) {
  return String(env.HUB_PAY_TO_SOLANA || env.PAY_TO_SOLANA || DEFAULT_HUB_PAY_TO_SOLANA).trim();
}

/** @deprecated alias — prefer hubPayToSolana */
export function payToSolana(env) {
  return hubPayToSolana(env);
}

export function solanaEnabled(env) {
  const flag = env.X402_SOLANA_ENABLED;
  if (flag === "0" || flag === "false") return false;
  // Default on when hub Solana payTo is configured (wrangler sets X402_SOLANA_ENABLED=true).
  if (flag === "1" || flag === "true" || flag == null || flag === "") {
    return isSolanaAddress(hubPayToSolana(env));
  }
  return isSolanaAddress(hubPayToSolana(env));
}

export function baseNetwork(env) {
  return env.NETWORK || NETWORK_BASE;
}

export function baseAsset(env) {
  return env.USDC || USDC_BASE;
}

export function solanaNetwork(env) {
  return env.NETWORK_SOLANA || env.SOLANA_NETWORK || NETWORK_SOLANA;
}

export function solanaAsset(env) {
  return env.USDC_SOLANA || USDC_SOLANA;
}

async function fetchSolanaFeePayer(env) {
  const network = solanaNetwork(env);
  if (feePayerCache && feePayerCache.network === network && feePayerCache.expiresAt > Date.now()) {
    return feePayerCache.feePayer;
  }
  const override = String(env.X402_SOLANA_FEE_PAYER || env.SOLANA_FEE_PAYER || "").trim();
  if (override && isSolanaAddress(override)) {
    feePayerCache = { network, feePayer: override, expiresAt: Date.now() + FEE_PAYER_CACHE_TTL_MS };
    return override;
  }

  const facilitator = (env.FACILITATOR || CDP_FACILITATOR).replace(/\/+$/, "");
  try {
    const res = await fetch(`${facilitator}/supported`, { headers: { accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      const kinds = data.kinds || data.paymentKinds || [];
      for (const kind of kinds) {
        if (kind.network === network && kind.scheme === "exact" && typeof kind.extra?.feePayer === "string") {
          feePayerCache = {
            network,
            feePayer: kind.extra.feePayer,
            expiresAt: Date.now() + FEE_PAYER_CACHE_TTL_MS,
          };
          return kind.extra.feePayer;
        }
      }
    }
  } catch {
    /* use default */
  }

  feePayerCache = {
    network,
    feePayer: DEFAULT_SOLANA_FEE_PAYER,
    expiresAt: Date.now() + FEE_PAYER_CACHE_TTL_MS,
  };
  return DEFAULT_SOLANA_FEE_PAYER;
}

function baseReq({ amountUsd, payTo, role, feeBps, network, asset }) {
  const amount = usdToAtomic(amountUsd);
  const extra = {
    name: "USDC",
    version: "2",
    role,
    amountUsd: String(amountUsd),
  };
  if (role === "hub_fee" && feeBps != null) extra.feeBps = feeBps;
  return {
    scheme: "exact",
    network,
    amount,
    maxAmountRequired: amount, // v1 clients
    asset,
    payTo,
    maxTimeoutSeconds: X402_MAX_TIMEOUT_SECONDS,
    extra,
  };
}

function solanaReq({ amountUsd, payTo, role, feeBps, network, asset, feePayer }) {
  const amount = usdToAtomic(amountUsd);
  const extra = {
    feePayer,
    role,
    amountUsd: String(amountUsd),
  };
  if (role === "hub_fee" && feeBps != null) extra.feeBps = feeBps;
  return {
    scheme: "exact",
    network,
    amount,
    maxAmountRequired: amount,
    asset,
    payTo,
    maxTimeoutSeconds: X402_MAX_TIMEOUT_SECONDS,
    extra,
  };
}

/**
 * Build x402 v2 PaymentRequired body.
 * accepts[] = dual-payee roles on each enabled rail (client picks ONE network, pays BOTH roles).
 * - Base: seller (EVM) + hub_fee (EVM) when addresses present
 * - Solana: hub_fee when solanaEnabled; seller when sellerSolPayTo / sellerPayToSolana provided
 */
export async function dualAccepts(
  env,
  { sellerPayTo, sellerSolPayTo, sellerPayToSolana, grossUsd, resourceUrl, description }
) {
  const split = feeSplit(env, grossUsd);
  const hub = hubPayToBase(env);
  const hubSol = hubPayToSolana(env);
  const seller = String(sellerPayTo || "").trim();
  const sellerSol = String(sellerSolPayTo || sellerPayToSolana || "").trim();
  const network = baseNetwork(env);
  const asset = baseAsset(env);
  const accepts = [];

  if (isEvmAddress(seller) && split.sellerUsd > 0) {
    accepts.push(
      baseReq({
        amountUsd: split.sellerUsd,
        payTo: seller,
        role: "seller",
        network,
        asset,
      })
    );
  }
  if (isEvmAddress(hub) && split.feeUsd > 0) {
    accepts.push(
      baseReq({
        amountUsd: split.feeUsd,
        payTo: hub,
        role: "hub_fee",
        feeBps: split.feeBps,
        network,
        asset,
      })
    );
  }

  if (solanaEnabled(env) && split.feeUsd > 0) {
    const feePayer = await fetchSolanaFeePayer(env);
    const solNet = solanaNetwork(env);
    const solAsset = solanaAsset(env);
    if (isSolanaAddress(sellerSol) && split.sellerUsd > 0) {
      accepts.push(
        solanaReq({
          amountUsd: split.sellerUsd,
          payTo: sellerSol,
          role: "seller",
          network: solNet,
          asset: solAsset,
          feePayer,
        })
      );
    }
    if (isSolanaAddress(hubSol)) {
      accepts.push(
        solanaReq({
          amountUsd: split.feeUsd,
          payTo: hubSol,
          role: "hub_fee",
          feeBps: split.feeBps,
          network: solNet,
          asset: solAsset,
          feePayer,
        })
      );
    }
  }

  return {
    x402Version: X402_VERSION,
    error: "payment required",
    accepts,
    resource: {
      url: resourceUrl,
      description: description || "inference swap match",
      mimeType: "application/json",
    },
    split,
    rails: {
      base: true,
      solana: solanaEnabled(env),
      sellerSolana: isSolanaAddress(sellerSol),
      note: isSolanaAddress(sellerSol)
        ? "Full dual-rail: pick Base or Solana; pay both role=seller and role=hub_fee on that network."
        : "Base: seller+hub_fee. Solana: hub_fee only until seller provides sellerSolPayTo / solanaPayTo.",
    },
  };
}

/**
 * x402 v2 `extensions.bazaar` — required by @agentcash/discovery / x402scan
 * (`extensions.bazaar.schema.properties.input|output`). Shape mirrors Ishtar datebook.
 */
export function bazaarExtension({ description, inputBody, outputExample, bodySchema }) {
  return {
    bazaar: {
      description,
      info: {
        input: { type: "http", method: "POST", bodyType: "json", body: inputBody },
        output: { type: "json", example: outputExample },
      },
      schema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {
          input: {
            type: "object",
            properties: {
              type: { type: "string" },
              method: { type: "string" },
              bodyType: { type: "string" },
              body: { type: "object", ...bodySchema },
            },
            required: ["type", "method", "body"],
          },
          output: {
            type: "object",
            properties: {
              type: { type: "string" },
              example: {
                type: "object",
                properties: Object.fromEntries(
                  Object.keys(outputExample || {}).map((k) => {
                    const v = outputExample[k];
                    if (typeof v === "boolean") return [k, { type: "boolean" }];
                    if (typeof v === "number") return [k, { type: "number" }];
                    if (typeof v === "string") return [k, { type: "string" }];
                    return [k, { type: "object" }];
                  })
                ),
                required: Object.keys(outputExample || {}),
              },
            },
            required: ["example"],
          },
        },
        required: ["input", "output"],
      },
    },
  };
}

export const DISCOVERY_BAZAAR = {
  description:
    "CURB discovery probe — sample dual-payee USDC x402 on Base + Solana. No side effects; real settlement is POST /v1/matches/{id}/pay.",
  inputBody: { note: "optional; ignored on unpaid probe" },
  outputExample: {
    ok: true,
    probe: true,
    message: "Probe ack only — settle real swaps via POST /v1/matches/{id}/pay",
  },
  bodySchema: {
    properties: {
      note: { type: "string", description: "Optional; ignored on unpaid probe." },
    },
  },
};

export const MATCH_PAY_BAZAAR = {
  description:
    "CURB match settlement — dual-payee USDC via x402 on Base and/or Solana. Bare POST → 402; retry with payment-signature / X-Payment → grant.",
  inputBody: {},
  outputExample: {
    ok: true,
    matchId: "match_…",
    grant: { token: "grant_…", endpoint: "https://seller.example/v1/chat/completions" },
  },
  bodySchema: {
    type: "object",
    properties: {},
  },
};

/**
 * Catalog/discovery probe challenge (stable URL for x402scan).
 * Optional `resourceUrl` lets match-pay probes (`/v1/matches/{id}/pay` with unknown id)
 * return the same dual-rail sample while advertising the probed resource.
 */
export async function discoveryAccepts(env, origin, resourceUrl = null) {
  const url = resourceUrl || `${origin}/v1/pay`;
  const sampleGross = Number(env.DISCOVERY_PRICE_USD || 0.1);
  const hub = hubPayToBase(env) || "0x3eee81B5b4cf1983b7DB36cf042B5d06c04F33eE";
  // Probe uses hub addresses as example seller so both roles are visible without a live match.
  const challenge = await dualAccepts(env, {
    sellerPayTo: hub,
    sellerSolPayTo: solanaEnabled(env) ? hubPayToSolana(env) : null,
    grossUsd: sampleGross,
    resourceUrl: url,
    description: "CURB discovery probe — USDC on x402 on Base + Solana (sample price)",
  });
  return {
    ...challenge,
    extensions: bazaarExtension(DISCOVERY_BAZAAR),
  };
}

/** @deprecated alias for workstream B / pay.sh sample probes */
export async function sampleChallenge(env, origin) {
  return discoveryAccepts(env, origin);
}

/** UTF-8-safe base64 (Workers + Node). Plain `btoa` throws on non-Latin1. */
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function utf8ToBase64Url(str) {
  return utf8ToBase64(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/**
 * IETF draft-httpauth-payment `WWW-Authenticate: Payment …` challenge.
 * x402scan / @agentcash/discovery require scheme "Payment" (not `X402 requirements=`).
 * Settlement for CURB remains x402 via PAYMENT-REQUIRED + payment-signature; this header
 * is the discoverable Payment challenge surface (mirrors Ishtar's co-resident header shape).
 */
export function buildPaymentChallengeHeader(body, realm) {
  const accepts = Array.isArray(body?.accepts) ? body.accepts : [];
  const primary =
    accepts.find((a) => a?.extra?.role === "seller" && String(a.network || "").startsWith("eip155")) ||
    accepts.find((a) => a?.extra?.role === "seller") ||
    accepts[0];
  if (!primary?.amount || !primary?.payTo || !primary?.asset) return null;

  const request = utf8ToBase64Url(
    JSON.stringify({
      amount: String(primary.amount),
      currency: String(primary.asset),
      recipient: String(primary.payTo),
      methodDetails: {
        network: primary.network,
        scheme: primary.scheme || "exact",
        x402Version: body.x402Version ?? X402_VERSION,
        role: primary.extra?.role || "seller",
      },
    })
  );
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const opaque = utf8ToBase64Url(
    JSON.stringify({ n: crypto.randomUUID(), r: body.resource?.url || "", s: "curb" })
  );
  const id = utf8ToBase64Url(crypto.randomUUID());
  const method = String(primary.network || "").startsWith("solana") ? "solana" : "x402";
  const hostRealm = String(realm || "curb.numetal.xyz").replace(/^https?:\/\//, "").split("/")[0];
  return `Payment id="${id}", realm="${hostRealm}", method="${method}", intent="charge", expires="${expires}", opaque="${opaque}", request="${request}"`;
}

/**
 * HTTP 402. `PAYMENT-REQUIRED` / `payment-required` MUST be base64(JSON x402 body).
 * Literal `"true"` breaks pay.sh (`protocol: unknown`).
 * `WWW-Authenticate` MUST use the Payment auth scheme (IETF) — never `X402 requirements=`.
 */
export function paymentRequiredResponse(body, status = 402) {
  const x402Body = {
    x402Version: body.x402Version ?? X402_VERSION,
    error: body.error || "payment required",
    resource: body.resource,
    accepts: body.accepts || [],
    ...(body.extensions ? { extensions: body.extensions } : {}),
  };
  const b64 = utf8ToBase64(JSON.stringify(x402Body));
  const full = JSON.stringify(body);
  const realm =
    (() => {
      try {
        return body.resource?.url ? new URL(body.resource.url).hostname : "curb.numetal.xyz";
      } catch {
        return "curb.numetal.xyz";
      }
    })();
  const paymentChallenge = buildPaymentChallengeHeader(x402Body, realm);
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store, private",
    "PAYMENT-REQUIRED": b64,
    "payment-required": b64,
    "x-payment-required": b64,
  };
  if (paymentChallenge) headers["WWW-Authenticate"] = paymentChallenge;
  return new Response(full, { status, headers });
}

/** Lightweight payment header presence check — full CDP verify is optional when secrets set. */
export function hasPaymentHeader(request) {
  return Boolean(getPaymentHeaderValue(request));
}

function getPaymentHeaderValue(request) {
  return (
    request.headers.get("X-Payment") ||
    request.headers.get("x-payment") ||
    request.headers.get("PAYMENT-SIGNATURE") ||
    request.headers.get("Payment-Signature") ||
    request.headers.get("payment-signature") ||
    ""
  );
}

// ── Settlement verification (the money path) ───────────────────────────────
//
// SETTLE_MODE:
//   "verify" → ONLY a CDP-facilitator-verified+settled payment mints a grant.
//              A bare/fake header is re-challenged with 402.
//   "demo"   → a present payment header settles for the live pitch, BUT the
//              grant is marked verified:false / demo:true (NOT a real on-chain
//              settlement). Never presented as a verified payment.
// Default: "verify" when CDP creds are present, else "demo" (fail-soft so the
// public pitch keeps working without secrets). An explicit env.SETTLE_MODE wins.

export function settleMode(env) {
  const explicit = String(env?.SETTLE_MODE || "").trim().toLowerCase();
  if (explicit === "verify") return "verify";
  if (explicit === "demo") return "demo";
  return env?.CDP_API_KEY_ID && env?.CDP_API_KEY_SECRET ? "verify" : "demo";
}

/** Decode X-Payment / payment-signature → array of payment payload objects. */
function decodePaymentPayloads(header) {
  let parsed = null;
  for (const dec of [() => atob(header), () => header]) {
    try {
      parsed = JSON.parse(dec());
      break;
    } catch {
      /* try next form */
    }
  }
  if (!parsed) return [];
  return Array.isArray(parsed) ? parsed : [parsed];
}

/** Extract signed terms {rail, network, payTo, amount} from one payment payload. */
function legFromPayload(obj) {
  if (!obj || typeof obj !== "object") return null;
  const payload = obj.payload && typeof obj.payload === "object" ? obj.payload : {};
  const accepted = obj.accepted && typeof obj.accepted === "object" ? obj.accepted : {};
  const network = String(obj.network || payload.network || accepted.network || "");
  const svm = payload.transaction != null || network.startsWith("solana:");
  if (svm) {
    return {
      rail: "svm",
      network,
      payTo: accepted.payTo != null ? String(accepted.payTo) : undefined,
      amount: accepted.amount != null ? String(accepted.amount) : undefined,
    };
  }
  const auth =
    (payload.authorization && typeof payload.authorization === "object" && payload.authorization) ||
    (obj.authorization && typeof obj.authorization === "object" && obj.authorization) ||
    payload;
  return {
    rail: "evm",
    network: network || NETWORK_BASE,
    payTo: auth.to != null ? String(auth.to) : accepted.payTo != null ? String(accepted.payTo) : undefined,
    amount:
      auth.value != null ? String(auth.value) : accepted.amount != null ? String(accepted.amount) : undefined,
  };
}

function payToEq(a, b, rail) {
  if (!a || !b) return false;
  return rail === "evm" ? a.toLowerCase() === b.toLowerCase() : a === b;
}

// ── CDP (mainnet) auth: a per-request EdDSA Bearer JWT ─────────────────────
const jwtEnc = new TextEncoder();
function b64urlBytes(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromB64(s) {
  return Uint8Array.from(atob(String(s).trim()), (c) => c.charCodeAt(0));
}

/**
 * Mint a Coinbase CDP Bearer JWT (EdDSA / Ed25519) bound to ONE request
 * (method+host+path), valid ~2 min. Secret is base64 of a 64-byte Ed25519 key
 * ([32 seed][32 public]); wrap the seed in the fixed Ed25519 PKCS8 prefix.
 */
export async function cdpBearer(keyId, secretB64, method, host, path) {
  const raw = fromB64(secretB64);
  const seed = raw.length >= 32 ? raw.slice(0, 32) : raw;
  const pkcs8 = new Uint8Array([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20, ...seed,
  ]);
  const key = await crypto.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "EdDSA", typ: "JWT", kid: keyId, nonce: b64urlBytes(crypto.getRandomValues(new Uint8Array(16))) };
  const payload = { sub: keyId, iss: "cdp", aud: ["cdp_service"], nbf: now, exp: now + 120, uris: [`${method} ${host}${path}`] };
  const signingInput = `${b64urlBytes(jwtEnc.encode(JSON.stringify(header)))}.${b64urlBytes(jwtEnc.encode(JSON.stringify(payload)))}`;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, jwtEnc.encode(signingInput)));
  return `${signingInput}.${b64urlBytes(sig)}`;
}

async function cdpVerifySettle(env, facilitator, host, basePath, paymentPayload, paymentRequirements, resourceUrl) {
  try {
    if (paymentPayload && typeof paymentPayload === "object" && !paymentPayload.resource && resourceUrl) {
      paymentPayload.resource = resourceUrl;
    }
    const body = JSON.stringify({ x402Version: X402_VERSION, paymentPayload, paymentRequirements });
    const vTok = await cdpBearer(env.CDP_API_KEY_ID, env.CDP_API_KEY_SECRET, "POST", host, `${basePath}/verify`);
    const vr = await fetch(`${facilitator}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${vTok}` },
      body,
    });
    if (!vr.ok) return { ok: false, reason: `cdp_verify_${vr.status}` };
    const vj = await vr.json();
    if (!vj.isValid) return { ok: false, reason: vj.invalidReason || "cdp_rejected" };
    const sTok = await cdpBearer(env.CDP_API_KEY_ID, env.CDP_API_KEY_SECRET, "POST", host, `${basePath}/settle`);
    const sr = await fetch(`${facilitator}/settle`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${sTok}` },
      body,
    });
    if (!sr.ok) return { ok: false, reason: `cdp_settle_${sr.status}` };
    const sj = await sr.json();
    if (!sj.success) return { ok: false, reason: sj.errorReason || "cdp_settle_failed" };
    return { ok: true, tx: sj.transaction, payer: sj.payer };
  } catch (err) {
    console.error("cdp_verify_settle_error", { err: String(err?.message || err) });
    return { ok: false, reason: "verify_error" };
  }
}

/**
 * Verify a payment against a match's dual-payee challenge before minting a grant.
 * Returns {ok, verified, demo, mode, ...}. Never throws; never prints secrets.
 *
 * verify mode: a full leg = both role=seller (when present) AND role=hub_fee
 * on the SAME network must be CDP-verified+settled. Anything short → ok:false.
 * demo mode: header presence → ok:true but verified:false (marked demo).
 */
export async function verifyPayment(env, request, match) {
  const header = getPaymentHeaderValue(request);
  if (!header) return { ok: false, verified: false, mode: settleMode(env), reason: "no_payment_header" };

  const mode = settleMode(env);
  if (mode === "demo") {
    return {
      ok: true,
      verified: false,
      demo: true,
      mode,
      note: "demo settlement — payment header present but NOT verified against a facilitator",
    };
  }

  // verify mode — fail closed without CDP creds or accepts.
  if (!env.CDP_API_KEY_ID || !env.CDP_API_KEY_SECRET) {
    return { ok: false, verified: false, mode, reason: "verify_mode_no_cdp_creds" };
  }
  const accepts = Array.isArray(match?.challenge?.accepts) ? match.challenge.accepts : [];
  if (!accepts.length) return { ok: false, verified: false, mode, reason: "no_accepts_to_verify" };

  const payloads = decodePaymentPayloads(header);
  if (!payloads.length) return { ok: false, verified: false, mode, reason: "payment_unreadable" };

  const facilitator = (env.FACILITATOR || CDP_FACILITATOR).replace(/\/+$/, "");
  let host, basePath;
  try {
    const fu = new URL(facilitator);
    host = fu.host;
    basePath = fu.pathname.replace(/\/+$/, "");
  } catch {
    return { ok: false, verified: false, mode, reason: "bad_facilitator" };
  }
  const resourceUrl = match?.challenge?.resource?.url || null;
  const settled = [];

  for (const raw of payloads) {
    const leg = legFromPayload(raw);
    if (!leg || !leg.payTo || !leg.amount) continue;
    const req = accepts.find((a) => {
      if (String(a.network) !== leg.network) return false;
      if (!payToEq(String(a.payTo), leg.payTo, leg.rail)) return false;
      try {
        return BigInt(leg.amount) >= BigInt(a.amount);
      } catch {
        return false;
      }
    });
    if (!req) continue;
    const res = await cdpVerifySettle(env, facilitator, host, basePath, raw, req, resourceUrl);
    if (!res.ok) return { ok: false, verified: false, mode, reason: res.reason };
    settled.push({ network: req.network, role: req.extra?.role || null, payTo: req.payTo, tx: res.tx, payer: res.payer });
  }

  // Dual-payee: one network must carry hub_fee AND (seller when the challenge has one).
  const byNet = {};
  for (const s of settled) {
    (byNet[s.network] = byNet[s.network] || new Set()).add(s.role);
  }
  const needsSeller = accepts.some((a) => a.extra?.role === "seller");
  const fullNet = Object.keys(byNet).find(
    (n) => byNet[n].has("hub_fee") && (!needsSeller || byNet[n].has("seller"))
  );
  if (!fullNet) return { ok: false, verified: false, mode, reason: "incomplete_dual_payee", settlement: settled };

  return { ok: true, verified: true, mode, network: fullNet, settlement: settled };
}
