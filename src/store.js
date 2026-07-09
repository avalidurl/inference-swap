/** KV helpers for offers / intents / matches */

// Cloudflare KV hard limit is 512 bytes (UTF-8) per key. Stay well under it.
const MAX_KV_KEY_BYTES = 512;

export function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Public id validator. Accepts our uid() shape (prefix_base36_hex) or any
 * short (<=128) safe-charset token so discovery probes (e.g. "probe") pass,
 * while absurd/long/unsafe ids are rejected before ever touching KV.
 */
export function isValidId(id) {
  const s = String(id ?? "");
  if (s.length === 0 || s.length > 128) return false;
  if (/^[a-z]+_[a-z0-9]+_[a-z0-9]+$/i.test(s)) return true;
  return /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(s);
}

function keyTooLong(key) {
  return new TextEncoder().encode(key).length > MAX_KV_KEY_BYTES;
}

export async function putJson(env, key, obj, ttlSec) {
  if (typeof key !== "string" || key.length === 0 || keyTooLong(key)) {
    throw new Error("kv_key_invalid");
  }
  const opts = ttlSec ? { expirationTtl: ttlSec } : undefined;
  await env.SWAP.put(key, JSON.stringify(obj), opts);
}

export async function getJson(env, key) {
  // Clamp/validate the key locally: never let an over-long key reach KV (it
  // returns a 414 whose raw message would otherwise leak the backend).
  if (typeof key !== "string" || key.length === 0 || keyTooLong(key)) return null;
  let raw;
  try {
    raw = await env.SWAP.get(key);
  } catch (err) {
    console.error("kv_get_failed", { keyBytes: new TextEncoder().encode(key).length, err: String(err?.message || err) });
    return null;
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function listIds(env, indexKey) {
  const raw = (await env.SWAP.get(indexKey)) || "[]";
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function pushId(env, indexKey, id, max = 500) {
  let ids = await listIds(env, indexKey);
  ids = [id, ...ids.filter((x) => x !== id)].slice(0, max);
  await env.SWAP.put(indexKey, JSON.stringify(ids));
  return ids;
}
