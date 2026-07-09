/**
 * Single-payee x402 challenge builder (gross → on-chain 0xSplits splitter) — BASE ONLY.
 * Shape aligned with datebook/x402 v2 (CAIP-2, `amount`, resource top-level).
 *
 * SPEC-COMPLIANT SINGLE-PAYEE (Option A): the buyer signs ONE payment for the GROSS amount to a
 * single `payTo` = the 0xSplits split address on Base. The seller/hub split happens ON-CHAIN
 * afterwards via the split contract's `distribute()` (a second, keeper-submitted tx).
 * `feeSplit` remains for bookkeeping/display only — it is NOT two payment legs.
 */

export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// Base USDC EIP-712 domain — verified on-chain: name()="USD Coin", version()="2".
// The buyer signs EIP-3009 transferWithAuthorization over this domain; a wrong name
// (e.g. "USDC") yields an invalid signature → transferWithAuthorization reverts on settle.
export const USDC_NAME = "USD Coin";
export const USDC_VERSION = "2";
export const NETWORK_BASE = "eip155:8453";
export const NETWORK = NETWORK_BASE; // legacy alias
export const CDP_FACILITATOR = "https://api.cdp.coinbase.com/platform/v2/x402";
export const X402_VERSION = 2;
export const X402_MAX_TIMEOUT_SECONDS = 300;

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

export function hubPayToBase(env) {
  return String(env.HUB_PAY_TO || "").trim();
}

export function baseNetwork(env) {
  return env.NETWORK || NETWORK_BASE;
}

export function baseAsset(env) {
  return env.USDC || USDC_BASE;
}

/** 0xSplits (PushSplit v2) split address on Base — the single `payTo` for gross settlement. */
export function splitAddressBase(env) {
  return String(env.SPLIT_ADDRESS_BASE || "").trim();
}

/**
 * 0xSplits recipients for the Base split, parsed from SPLIT_RECIPIENTS_BASE
 * ("addr:allocation,addr:allocation" — allocations are 0xSplits shares; total = sum).
 * Used for the keeper's `distribute()` reconstruction and for 402 display only.
 */
export function splitRecipientsBase(env) {
  const raw = String(env.SPLIT_RECIPIENTS_BASE || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => {
      const [addr, alloc] = String(s).split(":").map((x) => String(x).trim());
      return { address: addr, allocation: Number(alloc) };
    })
    .filter((r) => isEvmAddress(r.address) && Number.isFinite(r.allocation) && r.allocation > 0);
}

/**
 * Base (EVM) gross accept — ONE payment covering the full price to the split `payTo`.
 * `role: "gross"` (seller-inclusive). `breakdown`/`feeBps`/`splitAddress` are display-only; the
 * on-chain split enforces the real seller/hub allocation via 0xSplits. The canonical EIP-712
 * domain for CDP verify is `{name, version}` — display fields never reach the facilitator
 * (see toCdpRequirements()).
 */
function grossReq({ amountUsd, payTo, network, asset, split, splitAddress }) {
  const amount = usdToAtomic(amountUsd);
  const extra = {
    name: USDC_NAME,
    version: USDC_VERSION,
    role: "gross",
    amountUsd: String(amountUsd),
  };
  if (split?.feeBps != null) extra.feeBps = split.feeBps;
  if (split) extra.breakdown = { sellerUsd: String(split.sellerUsd), feeUsd: String(split.feeUsd) };
  if (splitAddress) {
    extra.splitAddress = splitAddress;
    extra.splitType = "0xsplits-push-v2";
  }
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

/**
 * Build x402 v2 PaymentRequired body (SINGLE-PAYEE / Option A) — BASE ONLY.
 * accepts[] = ONE gross accept; the buyer signs ONE payment for the full price to the split
 * `payTo`. The seller/hub split is settled ON-CHAIN afterwards (0xSplits distribute).
 * payTo = SPLIT_ADDRESS_BASE (0xSplits push split) — fallback seller/hub if unset.
 */
export async function splitAccepts(env, { sellerPayTo, grossUsd, resourceUrl, description }) {
  const split = feeSplit(env, grossUsd); // bookkeeping/display only — NOT two legs
  const seller = String(sellerPayTo || "").trim();
  const network = baseNetwork(env);
  const asset = baseAsset(env);
  const splitBase = splitAddressBase(env);
  const accepts = [];

  // Base: ONE gross accept → split address (or seller/hub fallback when no split configured).
  const payToBase = splitBase || (isEvmAddress(seller) ? seller : hubPayToBase(env));
  if (isEvmAddress(payToBase) && split.grossUsd > 0) {
    accepts.push(
      grossReq({
        amountUsd: split.grossUsd,
        payTo: payToBase,
        network,
        asset,
        split,
        splitAddress: splitBase || null,
      })
    );
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
    settlement: {
      model: "single-payee-to-splitter",
      note: "Buyer pays gross ONCE to the split address. CURB fans out seller/hub ON-CHAIN via 0xSplits distribute() on Base.",
      splitBase: splitBase || null,
    },
    rails: {
      base: isEvmAddress(payToBase),
      note: "Single accept = gross to the split address; on-chain fan-out to seller + hub.",
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
    "CURB discovery probe — sample single-payee USDC x402 on Base (gross to the on-chain 0xSplits split). No side effects; real settlement is POST /v1/matches/{id}/pay.",
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
    "CURB match settlement — single-payee USDC via x402 on Base (gross to the on-chain 0xSplits split; CURB splits seller/hub on-chain). Bare POST → 402; retry with payment-signature / X-Payment → grant.",
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
 * return the same Base sample while advertising the probed resource.
 */
export async function discoveryAccepts(env, origin, resourceUrl = null) {
  const url = resourceUrl || `${origin}/v1/pay`;
  const sampleGross = Number(env.DISCOVERY_PRICE_USD || 0.1);
  const hub = hubPayToBase(env) || "0x3eee81B5b4cf1983b7DB36cf042B5d06c04F33eE";
  // Probe uses the hub address as example seller so the sample renders without a live match.
  const challenge = await splitAccepts(env, {
    sellerPayTo: hub,
    grossUsd: sampleGross,
    resourceUrl: url,
    description: "CURB discovery probe — USDC x402 on Base (sample price)",
  });
  return {
    ...challenge,
    extensions: bazaarExtension(DISCOVERY_BAZAAR),
  };
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
    accepts.find((a) => a?.extra?.role === "gross" && String(a.network || "").startsWith("eip155")) ||
    accepts.find((a) => a?.extra?.role === "gross") ||
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
        role: primary.extra?.role || "gross",
      },
    })
  );
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const opaque = utf8ToBase64Url(
    JSON.stringify({ n: crypto.randomUUID(), r: body.resource?.url || "", s: "curb" })
  );
  const id = utf8ToBase64Url(crypto.randomUUID());
  const hostRealm = String(realm || "curb.numetal.xyz").replace(/^https?:\/\//, "").split("/")[0];
  return `Payment id="${id}", realm="${hostRealm}", method="x402", intent="charge", expires="${expires}", opaque="${opaque}", request="${request}"`;
}

/**
 * HTTP 402. `PAYMENT-REQUIRED` MUST be base64(JSON x402 body) and emitted EXACTLY ONCE.
 * Header names are case-insensitive, so a plain object with both `PAYMENT-REQUIRED` and
 * `payment-required` keys made the Headers constructor APPEND them → `<b64>, <b64>`, which
 * breaks standard clients that base64-decode the whole value. We build a `Headers` object and
 * `set()` a single canonical `PAYMENT-REQUIRED` (plus the distinct `x-payment-required`).
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
  const realm = (() => {
    try {
      return body.resource?.url ? new URL(body.resource.url).hostname : "curb.numetal.xyz";
    } catch {
      return "curb.numetal.xyz";
    }
  })();
  const paymentChallenge = buildPaymentChallengeHeader(x402Body, realm);
  // Build via Headers + set() so the case-insensitive PAYMENT-REQUIRED is emitted ONCE (no
  // comma-joined duplicate). x-payment-required is a genuinely distinct header name — kept.
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store, private",
  });
  headers.set("PAYMENT-REQUIRED", b64);
  headers.set("x-payment-required", b64);
  if (paymentChallenge) headers.set("WWW-Authenticate", paymentChallenge);
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

/** Extract signed terms {network, payTo, amount} from one Base (EVM) payment payload. */
function legFromPayload(obj) {
  if (!obj || typeof obj !== "object") return null;
  const payload = obj.payload && typeof obj.payload === "object" ? obj.payload : {};
  const accepted = obj.accepted && typeof obj.accepted === "object" ? obj.accepted : {};
  const network = String(obj.network || payload.network || accepted.network || NETWORK_BASE);
  const auth =
    (payload.authorization && typeof payload.authorization === "object" && payload.authorization) ||
    (obj.authorization && typeof obj.authorization === "object" && obj.authorization) ||
    payload;
  return {
    network,
    payTo: auth.to != null ? String(auth.to) : accepted.payTo != null ? String(accepted.payTo) : undefined,
    amount:
      auth.value != null ? String(auth.value) : accepted.amount != null ? String(accepted.amount) : undefined,
  };
}

function payToEq(a, b) {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Canonical x402 paymentRequirements for the CDP facilitator. CDP /verify rejects (HTTP 400)
 * unexpected/extra fields and requires resource/description/mimeType — so we send a CLEAN object
 * derived from the accept, with `extra` reduced to the EIP-712 domain {name, version}. Display
 * fields (role, breakdown, splitAddress) live only in the 402 body, never here.
 */
function toCdpRequirements(accept, resourceUrl, description) {
  const amt = String(accept.amount ?? accept.maxAmountRequired);
  return {
    scheme: accept.scheme || "exact",
    network: accept.network,
    // CDP x402V2PaymentRequirements requires `amount`; include maxAmountRequired for v1 compat.
    amount: amt,
    maxAmountRequired: amt,
    resource: resourceUrl || "",
    description: description || "",
    mimeType: "application/json",
    payTo: accept.payTo,
    maxTimeoutSeconds: accept.maxTimeoutSeconds ?? X402_MAX_TIMEOUT_SECONDS,
    asset: accept.asset,
    extra: { name: accept.extra?.name || USDC_NAME, version: accept.extra?.version || USDC_VERSION },
  };
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
    if (!vr.ok) {
      let detail = "";
      try {
        detail = (await vr.text()).slice(0, 300);
      } catch {
        /* ignore */
      }
      console.error("cdp_verify_http", { status: vr.status, detail });
      return { ok: false, reason: `cdp_verify_${vr.status}` };
    }
    const vj = await vr.json();
    if (!vj.isValid) return { ok: false, reason: vj.invalidReason || "cdp_rejected" };
    const sTok = await cdpBearer(env.CDP_API_KEY_ID, env.CDP_API_KEY_SECRET, "POST", host, `${basePath}/settle`);
    const sr = await fetch(`${facilitator}/settle`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${sTok}` },
      body,
    });
    if (!sr.ok) {
      let detail = "";
      try {
        detail = (await sr.text()).slice(0, 300);
      } catch {
        /* ignore */
      }
      console.error("cdp_settle_http", { status: sr.status, detail });
      return { ok: false, reason: `cdp_settle_${sr.status}` };
    }
    const sj = await sr.json();
    if (!sj.success) return { ok: false, reason: sj.errorReason || "cdp_settle_failed" };
    return { ok: true, tx: sj.transaction, payer: sj.payer };
  } catch (err) {
    console.error("cdp_verify_settle_error", { err: String(err?.message || err) });
    return { ok: false, reason: "verify_error" };
  }
}

/**
 * Verify a payment against a match's single-payee challenge before minting a grant.
 * Returns {ok, verified, demo, mode, ...}. Never throws; never prints secrets.
 *
 * verify mode: ONE gross payment covering an accept (gross → split payTo, amount >= required)
 * must be CDP-verified+settled. On-chain seller/hub fan-out is a separate keeper `distribute()`.
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
  const description = match?.challenge?.resource?.description || "";
  const settled = [];

  for (const raw of payloads) {
    const leg = legFromPayload(raw);
    if (!leg || !leg.payTo || !leg.amount) continue;
    const req = accepts.find((a) => {
      if (String(a.network) !== leg.network) return false;
      if (!payToEq(String(a.payTo), leg.payTo)) return false;
      try {
        return BigInt(leg.amount) >= BigInt(a.amount);
      } catch {
        return false;
      }
    });
    if (!req) continue;
    const cdpReq = toCdpRequirements(req, resourceUrl, description);
    const res = await cdpVerifySettle(env, facilitator, host, basePath, raw, cdpReq, resourceUrl);
    if (!res.ok) return { ok: false, verified: false, mode, reason: res.reason };
    settled.push({ network: req.network, role: req.extra?.role || null, payTo: req.payTo, tx: res.tx, payer: res.payer });
  }

  // Single-payee: ONE settled gross leg to the split payTo is sufficient. On-chain fan-out
  // to seller + hub is a separate keeper distribute() (not part of the buyer's payment).
  if (!settled.length) {
    return { ok: false, verified: false, mode, reason: "no_matching_settled_leg" };
  }
  return { ok: true, verified: true, mode, network: settled[0].network, settlement: settled };
}
