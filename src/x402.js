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

/** Catalog/discovery probe challenge (stable URL for x402scan). */
export async function discoveryAccepts(env, origin) {
  const resourceUrl = `${origin}/v1/pay`;
  const sampleGross = Number(env.DISCOVERY_PRICE_USD || 0.1);
  const hub = hubPayToBase(env) || "0x3eee81B5b4cf1983b7DB36cf042B5d06c04F33eE";
  // Probe uses hub addresses as example seller so both roles are visible without a live match.
  return dualAccepts(env, {
    sellerPayTo: hub,
    sellerSolPayTo: solanaEnabled(env) ? hubPayToSolana(env) : null,
    grossUsd: sampleGross,
    resourceUrl,
    description: "CURB discovery probe — USDC on x402 on Base + Solana (sample price)",
  });
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

/**
 * HTTP 402. `PAYMENT-REQUIRED` / `payment-required` MUST be base64(JSON x402 body).
 * Literal `"true"` breaks pay.sh (`protocol: unknown`).
 */
export function paymentRequiredResponse(body, status = 402) {
  const x402Body = {
    x402Version: body.x402Version ?? X402_VERSION,
    error: body.error || "payment required",
    resource: body.resource,
    accepts: body.accepts || [],
  };
  const b64 = utf8ToBase64(JSON.stringify(x402Body));
  const full = JSON.stringify(body);
  return new Response(full, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "PAYMENT-REQUIRED": b64,
      "payment-required": b64,
      "x-payment-required": b64,
      "WWW-Authenticate": `X402 requirements=${b64}`,
    },
  });
}

/** Lightweight payment header presence check — full CDP verify is optional when secrets set. */
export function hasPaymentHeader(request) {
  return Boolean(
    request.headers.get("X-Payment") ||
      request.headers.get("x-payment") ||
      request.headers.get("PAYMENT-SIGNATURE") ||
      request.headers.get("Payment-Signature") ||
      request.headers.get("payment-signature")
  );
}
