/** Rate limits, body size, and input caps for CURB. */

const MAX_BODY = 32 * 1024; // 32 KiB
const MAX_MTOK = 10_000;
const MAX_PRICE_USD = 10_000;
const RATE_WINDOW_SEC = 60;
const RATE_MAX = 60; // requests / window / IP for mutating routes

export { MAX_BODY, MAX_MTOK, MAX_PRICE_USD };

const MAX_JSON_DEPTH = 32;

/** Reject deeply-nested payloads (cheap DoS / parser-abuse guard). */
function tooDeep(value, depth = 0) {
  if (depth > MAX_JSON_DEPTH) return true;
  if (value && typeof value === "object") {
    for (const k in value) {
      if (!Object.prototype.hasOwnProperty.call(value, k)) continue;
      if (tooDeep(value[k], depth + 1)) return true;
    }
  }
  return false;
}

export async function readJsonLimited(request, maxBytes = MAX_BODY) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > maxBytes) return { error: "body_too_large", status: 413 };
  const buf = await request.arrayBuffer();
  if (buf.byteLength > maxBytes) return { error: "body_too_large", status: 413 };
  try {
    const text = new TextDecoder().decode(buf);
    if (!text) return { body: {} };
    const parsed = JSON.parse(text);
    if (tooDeep(parsed)) return { error: "invalid_json", status: 400 };
    return { body: parsed };
  } catch {
    return { error: "invalid_json", status: 400 };
  }
}

export function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function rateLimit(env, request, bucket = "api") {
  if (!env.SWAP) return { ok: true };
  const ip = clientIp(request);
  const slot = Math.floor(Date.now() / 1000 / RATE_WINDOW_SEC);
  const key = `rl:${bucket}:${ip}:${slot}`;
  const cur = Number((await env.SWAP.get(key)) || 0);
  if (cur >= RATE_MAX) return { ok: false, status: 429, error: "rate_limited" };
  await env.SWAP.put(key, String(cur + 1), { expirationTtl: RATE_WINDOW_SEC * 2 });
  return { ok: true, remaining: RATE_MAX - cur - 1 };
}

// Dangerous keys are never in an allowlist, but guard explicitly too.
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const OFFER_KEYS = [
  "sellerPayTo",
  "payTo",
  "endpoint",
  "model",
  "mtok",
  "mTok",
  "priceUsd",
  "price",
  "attestation",
  "note",
];
const INTENT_KEYS = ["buyer", "buyerAddress", "model", "mtok", "mTok", "maxPriceUsd", "maxPrice", "offerId"];

/** Build a null-prototype object from ONLY allowlisted own keys (no prototype pollution). */
function pickAllowed(body, keys) {
  const out = Object.create(null);
  if (!body || typeof body !== "object") return out;
  for (const k of keys) {
    if (DANGEROUS_KEYS.has(k)) continue;
    if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined) {
      out[k] = body[k];
    }
  }
  return out;
}

export function sanitizeOfferInput(body) {
  const out = pickAllowed(body, OFFER_KEYS);
  if (out.sellerPayTo != null) out.sellerPayTo = String(out.sellerPayTo).slice(0, 64);
  if (out.payTo != null) out.payTo = String(out.payTo).slice(0, 64);
  if (out.model != null) out.model = String(out.model).slice(0, 128);
  if (out.endpoint != null) out.endpoint = String(out.endpoint).slice(0, 512);
  if (out.note != null) out.note = String(out.note).slice(0, 280);
  if (out.attestation != null) out.attestation = String(out.attestation).slice(0, 128);
  return out;
}

export function sanitizeIntentInput(body) {
  const out = pickAllowed(body, INTENT_KEYS);
  if (out.buyer != null) out.buyer = String(out.buyer).slice(0, 64);
  if (out.buyerAddress != null) out.buyerAddress = String(out.buyerAddress).slice(0, 64);
  if (out.model != null) out.model = String(out.model).slice(0, 128);
  if (out.offerId != null) out.offerId = String(out.offerId).slice(0, 64);
  return out;
}

export function validateCaps({ mtok, priceUsd, maxPriceUsd }) {
  if (mtok != null && (mtok > MAX_MTOK || mtok <= 0)) return "mtok_out_of_range";
  if (priceUsd != null && (priceUsd > MAX_PRICE_USD || priceUsd <= 0)) return "priceUsd_out_of_range";
  if (maxPriceUsd != null && maxPriceUsd > MAX_PRICE_USD) return "maxPriceUsd_out_of_range";
  return null;
}
