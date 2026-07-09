// Append-only compliance audit log for CURB (Tier-0 compliance).
//
// PURPOSE: record compliance-relevant events — OFAC sanction-screen hits, geo-
// blocks, and successful settlements — so we have a tamper-evident-ish trail for
// a good-faith sanctions/export-control program.
//
// RETENTION INTENT: OFAC recordkeeping guidance is 5 years. Cloudflare KV cannot
// GUARANTEE 5-year retention (there is no hard durability/immutability contract,
// and per-key TTL is capped and would DELETE records, not preserve them). We
// therefore write records with NO TTL (best-effort persistence) under an
// `audit:` key prefix, and this log should be PERIODICALLY EXPORTED to durable
// cold storage (e.g. R2 / off-platform) to actually satisfy a 5-year requirement.
// Treat this module as best-effort operational logging, not a compliance system
// of record on its own.
//
// APPEND-ONLY: each event is a distinct KV key `audit:<iso-ts>:<rand>` — we never
// update or delete existing records here. Records are JSON `{ ts, event, ...data }`.

/**
 * Append one audit record. Fail-soft: never throws into the request path (a
 * logging failure must not break a settle or a block). Callers may `await` it or
 * fire-and-forget with `.catch(() => {})`.
 */
export async function audit(env, event, data = {}) {
  try {
    if (!env || !env.SWAP) return { ok: false, error: "no_kv" };
    const ts = new Date().toISOString();
    const rand = crypto.randomUUID().slice(0, 8);
    const key = `audit:${ts}:${rand}`;
    const record = { ts, event: String(event || "unknown"), ...data };
    // No expirationTtl → best-effort persistence (see retention note above).
    await env.SWAP.put(key, JSON.stringify(record));
    return { ok: true, key };
  } catch (err) {
    console.error("audit_write_failed", { event, err: String(err && err.message ? err.message : err) });
    return { ok: false, error: "write_failed" };
  }
}
