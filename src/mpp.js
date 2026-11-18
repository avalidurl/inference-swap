/**
 * MPP (Machine Payments Protocol) — the Tempo Labs + Stripe HTTP-402 standard
 * (IETF draft-httpauth-payment-00 + draft-tempo-charge-00). CURB's SECOND payment rail
 * next to x402/Base: ONE 402, disjoint headers — x402 rides PAYMENT-REQUIRED (and its own
 * `WWW-Authenticate: Payment method="x402"`), MPP rides a co-resident
 * `WWW-Authenticate: Payment method="tempo"`; the paid retry arrives as
 * `Authorization: Payment <b64url credential>` and success carries a `Payment-Receipt` header.
 *
 * PUSH-MODE ONLY. Unlike Ishtar (which also mints sessions via pull mode), CURB mints a
 * per-MATCH grant — never a bearer session — so there is no session-takeover surface and thus no
 * need for pull mode / secp256k1 signer-recovery / Tempo tx deserialization. The buyer broadcasts
 * its OWN TIP-20 transfers on Tempo (chainId 4217) and hands us the tx hash; we verify the on-chain
 * Transfer logs. A public tx hash proves the transfer landed — sufficient here because payment == one
 * grant and no bearer credential is minted off the paying wallet.
 *
 * SPLITS (the CURB addition): each match settles the SAME economics as the x402/Base rail
 * (feeSplit — seller 95% / hub 5%). The MPP `request` carries a per-match split:
 *   { amount: grossAtomic, currency, recipient: HUB_PAY_TO,
 *     splits: [{ amount: sellerAtomic, recipient: match.sellerPayTo }], methodDetails: {...} }
 * where `recipient` (the hub) receives the REMAINDER (amount − Σsplits = hubAtomic), so
 * sum(splits) < amount and the hub absorbs any rounding dust. Verification requires BOTH on-chain
 * Transfer legs (to hub ≥ hubAtomic AND to seller ≥ sellerAtomic) in the SAME receipt, on the
 * currency token, from the same payer.
 *
 * Tempo is EVM (`eip155:4217`), so we REUSE the existing Base 0x addresses on Tempo: seller =
 * match.sellerPayTo, hub = HUB_PAY_TO. No new address fields.
 *
 * Challenge ids are HMAC-bound over `realm|"tempo"|"charge"|request|expires|""|opaque` (empty
 * string for absent slots) with a per-challenge nonce inside `opaque`, so terms can't be swapped
 * and ids are stateless-verifiable yet unique. Single-use is enforced at the settle path on BOTH
 * the challenge id and the settlement tx hash (SWAP KV dedup).
 *
 * Fail-closed everywhere: ANY throw in verification → a 402 problem, NEVER a 500.
 *
 * DARK until MPP_ENABLED in {"1","true"} AND MPP_SECRET_KEY (a `wrangler secret`) is set.
 */

// USDC on Tempo mainnet (TIP-20; the token AgentCash-class wallets hold and the one the
// Base→Tempo bridge mints). Runtime-overridable via env.MPP_CURRENCY / env.TEMPO_USDC.
export const TEMPO_USDC = "0x20c000000000000000000000b9537d11c60e8b50";
const DEFAULT_TEMPO_RPC = "https://rpc.tempo.xyz";
// keccak("Transfer(address,address,uint256)") — TIP-20 emits the standard ERC-20 event.
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
// Single-use dedup markers (challenge id + tx hash) live in SWAP KV for 7d — well past the
// 10-min challenge TTL, so a settled tx can never be replayed even against a different match.
export const MPP_DEDUP_TTL_SEC = 7 * 24 * 60 * 60;

export const TEMPO_CHAIN_ID_DEFAULT = 4217; // Tempo mainnet (testnet Moderato = 42431)

export function tempoChainId(env) {
  const n = Number(env.TEMPO_CHAIN_ID);
  return Number.isFinite(n) && n > 0 ? n : TEMPO_CHAIN_ID_DEFAULT;
}
/** CAIP-2 settlement network for the MPP rail (used in the settle ledger + discovery). */
export function mppNetwork(env) {
  return `eip155:${tempoChainId(env)}`;
}

/** MPP is ON only when explicitly flagged AND the HMAC secret is present. */
export function mppEnabled(env) {
  const on = env.MPP_ENABLED === "1" || env.MPP_ENABLED === "true";
  return on && !!env.MPP_SECRET_KEY;
}

export function mppCurrency(env) {
  return String(env.MPP_CURRENCY || env.TEMPO_USDC || TEMPO_USDC).toLowerCase();
}
export function tempoRpc(env) {
  return env.TEMPO_RPC_URL || DEFAULT_TEMPO_RPC;
}
/** Hub recipient (5% fee) — the Base HUB_PAY_TO address, reused on Tempo. */
function hubRecipient(env) {
  return String(env.HUB_PAY_TO || "").trim().toLowerCase();
}

function stripTrailingSlashes(value) {
  let end = value.length;
  while (end > 0 && value.charAt(end - 1) === "/") end -= 1;
  return value.slice(0, end);
}

/** MPPScan attribution realm — hostname only, no scheme. Consistent build↔verify (same env). */
export function mppRealm(env) {
  const raw = stripTrailingSlashes(
    String(env.PUBLIC_API_URL || env.MPP_REALM || "https://api.curb.numetal.xyz")
  );
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).host;
  } catch {
    return raw.replace(/^https?:\/\//, "").split("/")[0] || raw;
  }
}

// ── b64url (no padding, RFC 4648 §5) over UTF-8 ────────────────────────────────────────────────
export function b64urlEncode(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function b64urlDecode(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmacB64url(secret, input) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input)));
  let bin = "";
  for (const b of sig) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Constant-time string equality (HMAC id comparison — never early-exit on a prefix match). */
export function ctEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** The HMAC binding input per draft-httpauth-payment: empty string for absent slots. */
export function bindingInput(realm, method, intent, request, expires, digest, opaque) {
  return [realm, method, intent, request, expires, digest, opaque].join("|");
}

/** USD (number or "$x.xx" string) → atomic 6-decimal (TIP-20) integer units. */
export function atomicUsd(usd) {
  const n = Number(String(usd).replace("$", ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 1e6);
}
function round6(n) {
  return Math.round(Number(n) * 1e6) / 1e6;
}

/**
 * Per-match split atomics. grossAtomic from match.split.grossUsd; sellerAtomic from
 * match.split.sellerUsd; hubAtomic = grossAtomic − sellerAtomic (hub gets the REMAINDER, so the
 * legs always sum to grossAtomic and the hub absorbs rounding dust). Clamp so sellerAtomic <
 * grossAtomic (hub always gets ≥ 1 unit → sum(splits) < amount).
 */
export function splitAtomics(env, match) {
  const split = match?.split || {};
  const grossAtomic = atomicUsd(split.grossUsd);
  let sellerAtomic = atomicUsd(split.sellerUsd);
  if (sellerAtomic >= grossAtomic) sellerAtomic = Math.max(0, grossAtomic - 1);
  const hubAtomic = grossAtomic - sellerAtomic;
  return { grossAtomic, sellerAtomic, hubAtomic };
}

/**
 * Build the `WWW-Authenticate: Payment …` (method="tempo") challenge header value for a MATCH.
 * `request`/`opaque` are b64url JCS JSON — objects below are built with keys already in
 * lexicographic (JCS-canonical) order for these flat shapes.
 */
export async function buildMppChallengeHeader(env, match) {
  const realm = mppRealm(env);
  const { grossAtomic, sellerAtomic } = splitAtomics(env, match);
  const seller = String(match.sellerPayTo || "").toLowerCase();
  // JCS: keys sorted by UTF-16 code unit → amount, currency, methodDetails, recipient, splits.
  const request = b64urlEncode(
    JSON.stringify({
      amount: String(grossAtomic),
      currency: mppCurrency(env),
      methodDetails: { chainId: tempoChainId(env), supportedModes: ["push"] },
      recipient: hubRecipient(env), // hub gets amount − Σsplits (the 5% fee remainder)
      splits: [{ amount: String(sellerAtomic), recipient: seller }], // seller net (95%)
    })
  );
  // Per-challenge nonce lives in opaque → the HMAC-bound id is unique per challenge.
  const opaque = b64urlEncode(JSON.stringify({ n: crypto.randomUUID(), m: match.id || "" }));
  const expires = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString().replace(/\.\d{3}Z$/, "Z");
  const id = await hmacB64url(env.MPP_SECRET_KEY, bindingInput(realm, "tempo", "charge", request, expires, "", opaque));
  return `Payment id="${id}", realm="${realm}", method="tempo", intent="charge", expires="${expires}", opaque="${opaque}", request="${request}"`;
}

// ── Credential parsing + verification ──────────────────────────────────────────────────────────

/** Extract the MPP credential from an `Authorization: Payment <b64url>` header. Null = not MPP. */
export function parseMppAuth(header) {
  if (!header) return null;
  const m = String(header).match(/^Payment\s+([A-Za-z0-9_-]+)$/i);
  if (!m) return null;
  try {
    const cred = JSON.parse(b64urlDecode(m[1]));
    if (!cred || typeof cred !== "object" || !cred.challenge || !cred.payload) return null;
    return cred;
  } catch {
    return null;
  }
}

async function fetchTempoReceipt(env, hash) {
  const r = await fetch(tempoRpc(env), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [hash] }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return (j && j.result) || null;
}
const topicAddr = (topic) => ("0x" + String(topic).slice(-40)).toLowerCase();

/**
 * Find a confirmed on-chain Transfer log to `recipient` on the `currency` token for >= `minAtomic`.
 * (logs, recipient, minAtomic) are the primary discriminators; `currency` pins the token.
 */
export function findTransferLog(logs, recipient, minAtomic, currency) {
  const want = BigInt(minAtomic);
  const rcpt = String(recipient).toLowerCase();
  const tok = String(currency).toLowerCase();
  const isHex = (s) => /^0x[0-9a-fA-F]*$/.test(s);
  return (logs || []).find(
    (l) =>
      l &&
      String(l.address || "").toLowerCase() === tok &&
      Array.isArray(l.topics) &&
      l.topics[0] === TRANSFER_TOPIC &&
      l.topics.length >= 3 &&
      topicAddr(l.topics[2]) === rcpt &&
      isHex(String(l.data || "")) &&
      BigInt(String(l.data || "0x0")) >= want
  );
}

/**
 * The challenge-authenticity preamble: prove the credential echoes a challenge WE minted (HMAC id
 * over the bound slots, constant-time), that it hasn't expired, and that the bound `request` states
 * OUR terms for THIS match (currency / hub recipient / gross amount / seller split). Returns the
 * atomics on success, or a { raw } reason on any failure.
 */
async function verifyChallengeAuthenticity(env, cred, match) {
  const ch = cred.challenge || {};
  // Wrong METHOD/intent is a 400-class method-unsupported; a wrong submission mode / bad terms is a
  // retryable 402 verification-failed (the tempo/charge method IS accepted).
  if (ch.method !== "tempo" || ch.intent !== "charge") return { ok: false, raw: "method-unsupported" };
  if (!ch.id || !ch.request || ch.realm !== mppRealm(env)) return { ok: false, raw: "invalid-challenge" };

  const expectId = await hmacB64url(
    env.MPP_SECRET_KEY,
    bindingInput(ch.realm, ch.method, ch.intent, ch.request, ch.expires || "", ch.digest || "", ch.opaque || "")
  );
  if (!ctEqual(expectId, ch.id)) return { ok: false, raw: "invalid-challenge" };
  if (ch.expires && Date.parse(ch.expires) < Date.now()) return { ok: false, raw: "payment-expired" };

  let req;
  try {
    req = JSON.parse(b64urlDecode(ch.request));
  } catch {
    return { ok: false, raw: "malformed-credential" };
  }

  const { grossAtomic, sellerAtomic, hubAtomic } = splitAtomics(env, match);
  const seller = String(match.sellerPayTo || "").toLowerCase();
  // The bound request must state OUR terms for THIS match — an id forged over other terms already
  // failed the HMAC, so this guards against config drift between issue and verify.
  if (String(req.currency || "").toLowerCase() !== mppCurrency(env)) return { ok: false, raw: "verification-failed" };
  if (String(req.recipient || "").toLowerCase() !== hubRecipient(env)) return { ok: false, raw: "verification-failed" };
  if (String(req.amount) !== String(grossAtomic)) return { ok: false, raw: "payment-insufficient" };
  if (!Array.isArray(req.splits) || req.splits.length !== 1) return { ok: false, raw: "verification-failed" };
  const s0 = req.splits[0] || {};
  if (String(s0.recipient || "").toLowerCase() !== seller) return { ok: false, raw: "verification-failed" };
  if (String(s0.amount) !== String(sellerAtomic)) return { ok: false, raw: "verification-failed" };
  // Enforce sum(splits) < amount (hub gets the remainder). BigInt: no float drift.
  if (BigInt(sellerAtomic) >= BigInt(grossAtomic)) return { ok: false, raw: "verification-failed" };
  return { ok: true, grossAtomic, sellerAtomic, hubAtomic, seller };
}

/**
 * Verify an MPP push-mode SPLIT credential end-to-end:
 *   authenticity (HMAC id + expiry + bound terms) → payload.type==="hash" + valid hash →
 *   fetch Tempo receipt (status 0x1, short bounded retry) → require BOTH Transfer legs in the SAME
 *   receipt on the currency token: to HUB_PAY_TO ≥ hubAtomic AND to match.sellerPayTo ≥ sellerAtomic,
 *   from the SAME payer.
 * Returns { verified:true, payer, tx, amountUsdc, nonce: challengeId } or { verified:false, raw }.
 * Fail-closed: any throw → { verified:false, raw:"verification-failed" }, NEVER a 500.
 */
export async function verifyMppSplitPayment(env, cred, match) {
  try {
    const ch = cred.challenge || {};
    const pre = await verifyChallengeAuthenticity(env, cred, match);
    if (!pre.ok) return { verified: false, raw: pre.raw };
    const { grossAtomic, sellerAtomic, hubAtomic, seller } = pre;
    const hub = hubRecipient(env);
    const currency = mppCurrency(env);

    if (cred.payload.type !== "hash") return { verified: false, raw: "verification-failed" }; // push mode only
    const hash = cred.payload.hash;
    if (!hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) return { verified: false, raw: "malformed-credential" };

    // The client broadcasts + waits for finality BEFORE submitting; a short bounded retry covers
    // propagation jitter only.
    let receipt = null;
    for (let i = 0; i < 3 && !receipt; i++) {
      receipt = await fetchTempoReceipt(env, hash).catch(() => null);
      if (!receipt && i < 2) await new Promise((r) => setTimeout(r, 500));
    }
    if (!receipt || receipt.status !== "0x1") return { verified: false, raw: "verification-failed" };
    const logs = receipt.logs;

    let payer;
    if (seller === hub) {
      // Degenerate config (seller payout == hub): a single transfer must cover the FULL gross,
      // else a buyer could pay only max(leg) instead of gross. Fail-closed to grossAtomic.
      const one = findTransferLog(logs, hub, grossAtomic, currency);
      if (!one) return { verified: false, raw: "verification-failed" };
      payer = topicAddr(one.topics[1]);
    } else {
      // Require BOTH legs, in the SAME receipt, from the SAME payer.
      const hubLog = findTransferLog(logs, hub, hubAtomic, currency);
      const sellerLog = findTransferLog(logs, seller, sellerAtomic, currency);
      if (!hubLog || !sellerLog) return { verified: false, raw: "verification-failed" };
      const payerHub = topicAddr(hubLog.topics[1]);
      const payerSeller = topicAddr(sellerLog.topics[1]);
      if (payerHub !== payerSeller) return { verified: false, raw: "verification-failed" };
      payer = payerHub;
    }
    if (!/^0x[0-9a-f]{40}$/.test(payer)) return { verified: false, raw: "verification-failed" };

    return {
      verified: true,
      payer,
      tx: hash.toLowerCase(),
      amountUsdc: String(round6(Number(grossAtomic) / 1e6)),
      nonce: ch.id,
      splits: {
        seller: { recipient: seller, amount: String(sellerAtomic) },
        hub: { recipient: hub, amount: String(hubAtomic) },
        grossAtomic: String(grossAtomic),
      },
    };
  } catch {
    return { verified: false, raw: "verification-failed" }; // fail-closed
  }
}

/** Success receipt header value (`Payment-Receipt`) — MUST NOT be attached to error responses. */
export function mppReceiptHeader(env, challengeId, tx, match) {
  const { grossAtomic, sellerAtomic } = splitAtomics(env, match);
  return b64urlEncode(
    JSON.stringify({
      challengeId,
      method: "tempo",
      reference: tx,
      settlement: {
        amount: String(grossAtomic),
        currency: mppCurrency(env),
        recipient: hubRecipient(env),
        splits: [{ amount: String(sellerAtomic), recipient: String(match.sellerPayTo || "").toLowerCase() }],
      },
      status: "success",
      timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    })
  );
}

// Problem registry per draft-httpauth-payment + mpp.dev/protocol/http-402. Every code is a 402
// (with a FRESH challenge) EXCEPT method-unsupported, the registry's lone 4xx-non-402.
const MPP_PROBLEMS = {
  "payment-required": { status: 402, title: "Payment Required" },
  "payment-insufficient": { status: 402, title: "Payment Insufficient" },
  "payment-expired": { status: 402, title: "Payment Expired" },
  "verification-failed": { status: 402, title: "Payment Verification Failed" },
  "malformed-credential": { status: 402, title: "Malformed Credential" },
  "invalid-challenge": { status: 402, title: "Invalid Challenge" },
  "payment-replayed": { status: 402, title: "Payment Already Settled" },
  "method-unsupported": { status: 400, title: "Method Not Supported" },
};

/** Map a verify `raw` reason to a problem code (never expose the raw string to clients). */
export function mppProblemCode(raw) {
  const s = String(raw == null ? "verification-failed" : raw).split(":")[0].trim();
  return s in MPP_PROBLEMS ? s : "verification-failed";
}

/** MPP failure = problem status + (for 402s) a FRESH per-match challenge + RFC 9457 body — never a receipt. */
export async function mppProblem(env, match, code, detail) {
  const spec = MPP_PROBLEMS[code] || MPP_PROBLEMS["verification-failed"];
  const headers = {
    "Content-Type": "application/problem+json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  };
  // A 402 MUST carry a Payment challenge; a 400 (method-unsupported) must not invite a blind retry.
  if (spec.status === 402 && mppEnabled(env) && match) {
    headers["WWW-Authenticate"] = await buildMppChallengeHeader(env, match);
  }
  return new Response(
    JSON.stringify({
      type: `https://paymentauth.org/problems/${code}`,
      title: spec.title,
      status: spec.status,
      detail,
    }),
    { status: spec.status, headers }
  );
}
