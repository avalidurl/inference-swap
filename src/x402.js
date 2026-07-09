/**
 * Dual-payee x402 challenge builder (seller + hub fee).
 * Pattern aligned with datebook/x402 + Blockrun accepts[].
 */

export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const NETWORK = "eip155:8453";

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

/** Build x402 v2-style requirements with two accepts entries. */
export function dualAccepts(env, { sellerPayTo, grossUsd, resourceUrl, description }) {
  const split = feeSplit(env, grossUsd);
  const hub = (env.HUB_PAY_TO || "").trim();
  const seller = String(sellerPayTo || "").trim();
  const network = env.NETWORK || NETWORK;
  const asset = env.USDC || USDC_BASE;

  const accepts = [];
  if (seller && /^0x[a-fA-F0-9]{40}$/.test(seller) && split.sellerUsd > 0) {
    accepts.push({
      scheme: "exact",
      network,
      maxAmountRequired: usdToAtomic(split.sellerUsd),
      asset,
      payTo: seller,
      resource: resourceUrl,
      description: description || "Seller fill — inference capacity",
      mimeType: "application/json",
      maxTimeoutSeconds: 300,
      extra: { name: "USDC", version: "2", role: "seller", amountUsd: String(split.sellerUsd) },
    });
  }
  if (hub && /^0x[a-fA-F0-9]{40}$/.test(hub) && split.feeUsd > 0) {
    accepts.push({
      scheme: "exact",
      network,
      maxAmountRequired: usdToAtomic(split.feeUsd),
      asset,
      payTo: hub,
      resource: resourceUrl,
      description: "Numetal inference-swap protocol fee",
      mimeType: "application/json",
      maxTimeoutSeconds: 300,
      extra: { name: "USDC", version: "2", role: "hub_fee", amountUsd: String(split.feeUsd), feeBps: split.feeBps },
    });
  }

  return {
    x402Version: 2,
    accepts,
    resource: { url: resourceUrl, description: description || "inference swap match" },
    split,
  };
}

export function paymentRequiredResponse(body, status = 402) {
  const payload = JSON.stringify(body);
  return new Response(payload, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "payment-required": "true",
      "x-payment-required": btoa(payload),
      "WWW-Authenticate": `X402 requirements=${btoa(payload)}`,
    },
  });
}

/** Lightweight payment header presence check — full CDP verify is optional when secrets set. */
export function hasPaymentHeader(request) {
  return Boolean(
    request.headers.get("X-Payment") ||
      request.headers.get("x-payment") ||
      request.headers.get("PAYMENT-SIGNATURE") ||
      request.headers.get("Payment-Signature")
  );
}
