// OFAC SDN crypto-wallet screening for CURB (Tier-0 compliance).
//
// WHAT THIS IS: a best-effort screen of wallet addresses against the OFAC SDN
// list of sanctioned digital-currency addresses. It is NOT a full sanctions-
// compliance program and does NOT make CURB "OFAC compliant" or a licensed
// money transmitter — it is one good-faith control (see src/legal.js wording).
//
// SOURCE: a maintained mirror of OFAC's sanctioned ETH/EVM addresses
// (0xB10C/ofac-sanctioned-digital-currency-addresses, `lists` branch). The URL
// is an env var (OFAC_SOURCE_URL) so it can be repointed without a code change.
// The response is UNTRUSTED third-party data: we parse defensively (only accept
// well-formed 0x-addresses, lowercase, de-dupe, cap the count) and never eval it.
//
// STORAGE: reuses the existing `SWAP` KV binding under an `ofac:` key prefix
// (no new KV namespace). `ofac:addresses` holds a JSON array of lowercased
// addresses; `ofac:meta` holds refresh metadata for the operator console.
//
// SCREENING POLICY (see call sites in src/index.js):
//   - fail-CLOSED on a positive match (reject 451 + audit event);
//   - if the list has NEVER loaded, ALLOW but console.warn (do not fail-closed on
//     a cold/empty cache — that would take the whole rail down on a fetch outage).
//   - Settlement is ALSO OFAC-screened by the Coinbase CDP facilitator at settle
//     time, so verified on-chain payments inherit facilitator screening in
//     addition to this pre-settle gate.

const KEY_ADDRESSES = "ofac:addresses";
const KEY_META = "ofac:meta";

// Defensive parse cap — the real list is a few thousand entries; anything wildly
// larger means the source changed shape and we refuse to trust it wholesale.
const MAX_ADDRESSES = 100_000;

const DEFAULT_SOURCE_URL =
  "https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists/sanctioned_addresses_ETH.txt";

const EVM_ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

function sourceUrl(env) {
  const raw = env && env.OFAC_SOURCE_URL ? String(env.OFAC_SOURCE_URL).trim() : "";
  if (!raw) return DEFAULT_SOURCE_URL;
  // Only ever fetch over https from a well-formed URL (the URL is operator-set,
  // but validate anyway so a bad var can't turn into an SSRF-y fetch).
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return DEFAULT_SOURCE_URL;
    return u.toString();
  } catch {
    return DEFAULT_SOURCE_URL;
  }
}

/**
 * Parse the raw OFAC list text into a de-duped array of lowercased EVM addresses.
 * The input is untrusted: we accept ONLY lines that are exactly a 0x-address
 * (ignoring surrounding whitespace / CRLF), drop everything else, and cap length.
 */
export function parseOfacList(text) {
  const out = [];
  const seen = new Set();
  const lines = String(text || "").split(/\r?\n/);
  for (const line of lines) {
    const token = line.trim();
    if (!token || !EVM_ADDR_RE.test(token)) continue;
    const lc = token.toLowerCase();
    if (seen.has(lc)) continue;
    seen.add(lc);
    out.push(lc);
    if (out.length >= MAX_ADDRESSES) break;
  }
  return out;
}

/**
 * Fetch the canonical sanctioned-address list and cache it in KV (`ofac:*`).
 * Fail-soft: on any error the previously cached list (if any) is left intact and
 * we return { ok:false, ... } — the caller (cron) logs and moves on.
 * Called from scheduled() and can be triggered by an operator.
 */
export async function refreshOfacList(env) {
  if (!env || !env.SWAP) return { ok: false, error: "no_kv" };
  const url = sourceUrl(env);
  let res;
  try {
    res = await fetch(url, {
      headers: { Accept: "text/plain", "User-Agent": "curb-ofac-refresh/1.0 (contact@gokhan.vc)" },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
  } catch (err) {
    return { ok: false, error: "fetch_failed", detail: String(err && err.message ? err.message : err) };
  }
  if (!res.ok) return { ok: false, error: "http_" + res.status };

  let text;
  try {
    text = await res.text();
  } catch (err) {
    return { ok: false, error: "read_failed", detail: String(err && err.message ? err.message : err) };
  }

  const addresses = parseOfacList(text);
  // Guard against a truncated / empty / reshaped source silently wiping the list.
  if (addresses.length === 0) {
    return { ok: false, error: "empty_or_unparseable", bytes: text.length };
  }

  const meta = {
    updatedAt: new Date().toISOString(),
    count: addresses.length,
    source: url,
    bytes: text.length,
  };
  try {
    // No TTL: the screening list must persist between refreshes even if the cron pauses.
    await env.SWAP.put(KEY_ADDRESSES, JSON.stringify(addresses));
    await env.SWAP.put(KEY_META, JSON.stringify(meta));
  } catch (err) {
    return { ok: false, error: "kv_put_failed", detail: String(err && err.message ? err.message : err) };
  }
  return { ok: true, ...meta };
}

async function loadAddresses(env) {
  if (!env || !env.SWAP) return null;
  let raw;
  try {
    raw = await env.SWAP.get(KEY_ADDRESSES);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

/**
 * Return true iff `addr` is on the cached OFAC SDN list (case-insensitive).
 *
 * Fail-open on a COLD cache: if the list has never loaded we console.warn and
 * return false (allow) — we do NOT take the rail down on a fetch outage. A
 * positive match is the only thing that returns true (callers fail-closed on it).
 * Non-EVM inputs (e.g. Solana addresses) simply never match the ETH list.
 */
export async function isSanctionedAddress(env, addr) {
  const s = String(addr == null ? "" : addr).trim().toLowerCase();
  if (!s) return false;
  const addresses = await loadAddresses(env);
  if (addresses == null) {
    console.warn("ofac_list_not_loaded", { note: "screening allowed (fail-open on cold cache); run refreshOfacList" });
    return false;
  }
  return addresses.includes(s);
}

/** Operator/console helper: current list metadata (or null if never loaded). */
export async function ofacMeta(env) {
  if (!env || !env.SWAP) return null;
  let raw;
  try {
    raw = await env.SWAP.get(KEY_META);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
