import { uid, putJson, getJson, listIds, pushId, isValidId } from "./store.js";
import {
  dualAccepts,
  feeSplit,
  isSolanaAddress,
  hubPayToBase,
  hubPayToSolana,
  solanaEnabled,
  bazaarExtension,
  MATCH_PAY_BAZAAR,
} from "./x402.js";
import { MAX_MTOK, MAX_PRICE_USD } from "./harden.js";

const OFFER_TTL = 60 * 60 * 24 * 7; // 7d
const MATCH_TTL = 60 * 60 * 24 * 3;

function normAddr(a) {
  const s = String(a || "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(s)) return null;
  return s.toLowerCase();
}

function normSol(a) {
  const s = String(a || "").trim();
  if (!isSolanaAddress(s)) return null;
  return s;
}

function httpsOnly(url) {
  try {
    const u = new URL(String(url || "").trim());
    if (u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Model-name guard for the PUBLIC offer book. Rejects obvious junk that would repollute the
 * live book — empty, control/non-printable chars, or HTML angle brackets (< >) — while keeping
 * legit slash/dot/dash names like "meta-llama/llama-3.3-70b". Length is capped upstream (128).
 */
export function isCleanModel(m) {
  const s = String(m || "");
  if (!s) return false;
  if (/[<>]/.test(s)) return false; // no HTML angle brackets (XSS / junk marker)
  if (/[\u0000-\u001F\u007F-\u009F]/.test(s)) return false; // no control / non-printable
  return true;
}

export async function createOffer(env, body) {
  const sellerPayTo = normAddr(body.sellerPayTo || body.payTo);
  const sellerSolPayTo = normSol(body.sellerSolPayTo || body.solanaPayTo || body.solPayTo);
  const endpoint = httpsOnly(body.endpoint);
  const model = String(body.model || "").trim().slice(0, 128);
  const mtok = Number(body.mtok || body.mTok || 0);
  const priceUsd = Number(body.priceUsd || body.price || 0);

  if (!sellerPayTo) return { error: "sellerPayTo_required", status: 400 };
  if (!endpoint) return { error: "endpoint_https_required", status: 400 };
  if (!model) return { error: "model_required", status: 400 };
  if (!isCleanModel(model)) return { error: "model_invalid", status: 400 };
  if (!(mtok > 0) || mtok > MAX_MTOK) return { error: "mtok_out_of_range", status: 400 };
  if (!(priceUsd > 0) || priceUsd > MAX_PRICE_USD) return { error: "priceUsd_out_of_range", status: 400 };
  if ((body.sellerSolPayTo || body.solanaPayTo || body.solPayTo) && !sellerSolPayTo) {
    return { error: "sellerSolPayTo_invalid", status: 400 };
  }

  const id = uid("offer");
  const offer = {
    id,
    type: "sell",
    status: "open",
    sellerPayTo,
    sellerSolPayTo: sellerSolPayTo || null,
    endpoint,
    model,
    mtok,
    priceUsd,
    attestation: String(body.attestation || "own_capacity_or_licensed"),
    note: body.note ? String(body.note).slice(0, 280) : null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + OFFER_TTL * 1000).toISOString(),
  };
  await putJson(env, `offer:${id}`, offer, OFFER_TTL);
  await pushId(env, "idx:offers:open", id);
  return { status: 201, body: offer };
}

export async function listOffers(env, { status = "open", limit = 50 } = {}) {
  const ids = await listIds(env, "idx:offers:open");
  const out = [];
  for (const id of ids.slice(0, Math.min(200, limit * 3))) {
    const o = await getJson(env, `offer:${id}`);
    if (!o) continue;
    if (status && o.status !== status) continue;
    out.push(o);
    if (out.length >= limit) break;
  }
  return out;
}

export async function createIntent(env, body, origin) {
  const rawBuyer = body.buyer ?? body.buyerAddress;
  let buyer = null;
  if (rawBuyer != null && String(rawBuyer).trim() !== "") {
    // buyer is optional, but a supplied non-empty value must be a real address.
    buyer = normAddr(rawBuyer) || normSol(rawBuyer);
    if (!buyer) return { error: "buyer_invalid", status: 400 };
  }
  const model = String(body.model || "").trim();
  const mtok = Number(body.mtok || body.mTok || 0);
  const maxPriceUsd = Number(body.maxPriceUsd || body.maxPrice || 0);
  const offerId = body.offerId ? String(body.offerId) : null;

  if (!model && !offerId) return { error: "model_or_offerId_required", status: 400 };
  if (!(mtok > 0) || mtok > MAX_MTOK) return { error: "mtok_out_of_range", status: 400 };
  if (maxPriceUsd && maxPriceUsd > MAX_PRICE_USD) return { error: "maxPriceUsd_out_of_range", status: 400 };

  const id = uid("intent");
  const intent = {
    id,
    type: "buy",
    status: "open",
    buyer,
    model: model || null,
    mtok,
    maxPriceUsd: maxPriceUsd || null,
    offerId,
    createdAt: new Date().toISOString(),
  };
  await putJson(env, `intent:${id}`, intent, OFFER_TTL);
  await pushId(env, "idx:intents", id);

  // Auto-match
  let offer = null;
  let constraintsUnmet = false;
  if (offerId) {
    offer = isValidId(offerId) ? await getJson(env, `offer:${offerId}`) : null;
    // An explicit offerId must satisfy the SAME guards as auto-match; otherwise a
    // buyer could be matched to a closed / model-mismatched / undersized / overpriced
    // offer and overcharged. Fail closed (no match) instead of minting a bad match.
    if (
      offer &&
      (offer.status !== "open" ||
        (model && String(offer.model).toLowerCase() !== model.toLowerCase()) ||
        !(offer.mtok >= mtok) ||
        (maxPriceUsd && offer.priceUsd > maxPriceUsd))
    ) {
      constraintsUnmet = true;
      offer = null;
    }
  } else {
    const opens = await listOffers(env, { status: "open", limit: 100 });
    offer = opens.find(
      (o) =>
        o.model.toLowerCase() === model.toLowerCase() &&
        o.mtok >= mtok &&
        (!maxPriceUsd || o.priceUsd <= maxPriceUsd)
    );
  }

  if (!offer || offer.status !== "open") {
    return {
      status: 201,
      body: {
        intent,
        match: null,
        hint: constraintsUnmet ? "offer_constraints_unmet" : "no_open_offer_matched",
      },
    };
  }

  const match = await createMatch(env, { offer, intent, origin });
  if (match.error) {
    return { status: 201, body: { intent, match: null, hint: match.error } };
  }
  return { status: 201, body: { intent, match: match.body } };
}

async function createMatch(env, { offer, intent, origin }) {
  const id = uid("match");
  if (!(offer.mtok > 0)) return { error: "offer_mtok_invalid", status: 400 };
  // Clamp so a match can never bill more than the offer's capacity/price.
  const mtok = Math.min(Number(intent.mtok) || 0, offer.mtok);
  const gross = offer.priceUsd * (mtok / offer.mtok);
  const split = feeSplit(env, gross);
  const resourceUrl = `${origin}/v1/matches/${id}/pay`;
  const challenge = await dualAccepts(env, {
    sellerPayTo: offer.sellerPayTo,
    sellerSolPayTo: offer.sellerSolPayTo || null,
    grossUsd: split.grossUsd,
    resourceUrl,
    description: `Swap ${mtok} MTok ${offer.model}`,
  });

  const match = {
    id,
    status: "awaiting_payment",
    offerId: offer.id,
    intentId: intent.id,
    model: offer.model,
    mtok,
    sellerPayTo: offer.sellerPayTo,
    sellerSolPayTo: offer.sellerSolPayTo || null,
    sellerEndpoint: offer.endpoint,
    buyer: intent.buyer,
    split,
    challenge,
    grant: null,
    createdAt: new Date().toISOString(),
  };

  offer.status = "matched";
  intent.status = "matched";
  await putJson(env, `offer:${offer.id}`, offer, OFFER_TTL);
  await putJson(env, `intent:${intent.id}`, intent, OFFER_TTL);
  await putJson(env, `match:${id}`, match, MATCH_TTL);
  await pushId(env, "idx:matches", id);

  return { status: 201, body: match };
}

export async function getMatch(env, id) {
  return getJson(env, `match:${id}`);
}

export async function markPaid(env, id, meta = {}) {
  const match = await getJson(env, `match:${id}`);
  if (!match) return { error: "not_found", status: 404 };
  if (match.status === "paid" || match.status === "fulfilled") {
    return { status: 200, body: match };
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  match.status = "paid";
  match.paidAt = new Date().toISOString();
  match.paymentMeta = {
    note: meta.note || "payment_header_present_or_demo_settle",
    demo: Boolean(meta.demo),
    // verified=false means NOT confirmed on-chain via a facilitator (demo settle).
    verified: Boolean(meta.verified),
    ...(meta.mode ? { mode: meta.mode } : {}),
    ...(meta.settlement ? { settlement: meta.settlement } : {}),
  };
  match.grant = {
    token,
    endpoint: match.sellerEndpoint,
    model: match.model,
    mtok: match.mtok,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    usageHint: "Authorization: Bearer <grant.token> against seller endpoint (seller must honor).",
  };
  await putJson(env, `match:${id}`, match, MATCH_TTL);
  await putJson(env, `grant:${token}`, { matchId: id, ...match.grant }, 60 * 60);
  return { status: 200, body: match };
}

export async function stats(env) {
  const offers = await listOffers(env, { status: "open", limit: 500 });
  const matchIds = await listIds(env, "idx:matches");
  return {
    openOffers: offers.length,
    matches: matchIds.length,
    feeBps: Number(env.FEE_BPS || 500),
    hubPayTo: hubPayToBase(env) || null,
    hubPayToSolana: solanaEnabled(env) ? hubPayToSolana(env) : null,
    rails: {
      base: Boolean(hubPayToBase(env)),
      solana: solanaEnabled(env),
    },
  };
}

/** Recent matches (newest first) resolved from idx:matches, for the operator console. */
export async function listMatches(env, { limit = 25 } = {}) {
  const ids = await listIds(env, "idx:matches");
  const out = [];
  for (const id of ids.slice(0, Math.min(200, limit))) {
    const m = await getJson(env, `match:${id}`);
    if (m) out.push(m);
    if (out.length >= limit) break;
  }
  return out;
}

/** Active (unexpired) grants derived from matches — grant:* has no index of its own. */
export async function activeGrants(env, { limit = 200 } = {}) {
  const now = Date.now();
  const matches = await listMatches(env, { limit });
  const grants = [];
  for (const m of matches) {
    if (!m.grant || !m.grant.token) continue;
    const exp = Date.parse(m.grant.expiresAt || "");
    if (Number.isFinite(exp) && exp <= now) continue;
    grants.push({
      token: m.grant.token,
      matchId: m.id,
      model: m.grant.model,
      mtok: m.grant.mtok,
      endpoint: m.grant.endpoint,
      expiresAt: m.grant.expiresAt,
    });
  }
  return grants;
}

/**
 * Purge the test/fuzz-polluted book. KV has no cheap prefix-delete via the binding, so we walk
 * every index id list, delete each offer/match/intent (+ each match's grant), then reset the
 * indexes to []. Safe + idempotent — re-running on an already-clean book just resets to [].
 */
export async function purgeBook(env) {
  const deleted = { offers: 0, intents: 0, matches: 0, grants: 0 };

  for (const id of await listIds(env, "idx:offers:open")) {
    await env.SWAP.delete(`offer:${id}`);
    deleted.offers++;
  }
  for (const id of await listIds(env, "idx:intents")) {
    await env.SWAP.delete(`intent:${id}`);
    deleted.intents++;
  }
  for (const id of await listIds(env, "idx:matches")) {
    const m = await getJson(env, `match:${id}`);
    if (m?.grant?.token) {
      await env.SWAP.delete(`grant:${m.grant.token}`);
      deleted.grants++;
    }
    await env.SWAP.delete(`match:${id}`);
    deleted.matches++;
  }

  await env.SWAP.put("idx:offers:open", "[]");
  await env.SWAP.put("idx:intents", "[]");
  await env.SWAP.put("idx:matches", "[]");

  return deleted;
}

/** Reseed ONE clean demo offer (hub as seller payTo, harness fulfill endpoint). */
export async function reseedDemoOffer(env) {
  return createOffer(env, {
    sellerPayTo: env.HUB_PAY_TO,
    sellerSolPayTo: env.HUB_PAY_TO_SOLANA,
    endpoint: "https://seller.curb.numetal.xyz/fulfill",
    model: "demo/llama-3.3-70b",
    mtok: 10,
    priceUsd: 0.5,
    attestation: "demo_seed",
    note: "curb-seller-harness clean demo",
  });
}

/** Rebuild challenge for an existing match (e.g. after Solana feePayer refresh). */
export async function refreshMatchChallenge(env, match, origin) {
  const resourceUrl = `${origin}/v1/matches/${match.id}/pay`;
  match.challenge = await dualAccepts(env, {
    sellerPayTo: match.sellerPayTo,
    sellerSolPayTo: match.sellerSolPayTo || null,
    grossUsd: match.split?.grossUsd ?? 0,
    resourceUrl,
    description: `Swap ${match.mtok} MTok ${match.model}`,
  });
  match.challenge = {
    ...match.challenge,
    extensions: bazaarExtension(MATCH_PAY_BAZAAR),
  };
  return match;
}
