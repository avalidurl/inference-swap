/** KV helpers for offers / intents / matches */

export function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
}

export async function putJson(env, key, obj, ttlSec) {
  const opts = ttlSec ? { expirationTtl: ttlSec } : undefined;
  await env.SWAP.put(key, JSON.stringify(obj), opts);
}

export async function getJson(env, key) {
  const raw = await env.SWAP.get(key);
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
