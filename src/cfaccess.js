/**
 * Cloudflare Access JWT verification + operator access gate for CURB.
 *
 * Ported (TS → plain JS, zero-dep, Web Crypto only) from
 * gokhan-vc/numetal-datebook/src/identity/cfaccess.ts + middleware/access.ts.
 *
 * Two ways past the gate, NEVER a key in a URL:
 *   1. Cloudflare Access email login — CF validates the email OTP at the edge and injects a
 *      signed JWT (Cf-Access-Jwt-Assertion header / CF_Authorization cookie). We verify it
 *      (RS256 vs the team JWKS + aud + iss + exp). This is the human/founder path.
 *   2. Bearer ACCESS_KEY in the Authorization header — for API / tooling / this agent.
 *
 * Fail-closed: verifyAccessJwt is a no-op (ok:false) until ACCESS_TEAM_DOMAIN + ACCESS_AUD are
 * set, so the dashboard stays locked to the bearer path until the founder wires the Access AUD.
 */

const b64urlToBytes = (s) => {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

// Per-isolate JWKS cache (1h). Access rotates keys rarely; a stale miss just re-fetches.
let jwks = null;

async function teamKeys(domain) {
  if (jwks && jwks.domain === domain && Date.now() - jwks.at < 3_600_000) return jwks.keys;
  const res = await fetch(`https://${domain}/cdn-cgi/access/certs`);
  const body = await res.json();
  const keys = {};
  for (const jwk of body.keys ?? []) {
    keys[jwk.kid] = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
  }
  jwks = { domain, at: Date.now(), keys };
  return keys;
}

/** Verify a Cloudflare Access assertion. Returns { ok, email?, reason? }. */
export async function verifyAccessJwt(env, token) {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || env.ACCESS_AUD === "PLACEHOLDER") {
    return { ok: false, reason: "access_not_configured" };
  }
  if (!token) return { ok: false, reason: "no_assertion" };
  try {
    const [h, p, sig] = token.split(".");
    if (!h || !p || !sig) return { ok: false, reason: "malformed" };
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!auds.includes(env.ACCESS_AUD)) return { ok: false, reason: "aud_mismatch" };
    if (payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return { ok: false, reason: "iss_mismatch" };
    if (payload.exp && payload.exp * 1000 < Date.now()) return { ok: false, reason: "expired" };
    const key = header.kid ? (await teamKeys(env.ACCESS_TEAM_DOMAIN))[header.kid] : undefined;
    if (!key) return { ok: false, reason: "unknown_kid" };
    const valid = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      b64urlToBytes(sig),
      new TextEncoder().encode(`${h}.${p}`)
    );
    return valid ? { ok: true, email: payload.email } : { ok: false, reason: "bad_signature" };
  } catch (e) {
    return { ok: false, reason: `access_error: ${String(e?.message || e)}` };
  }
}

/** Constant-time string compare (avoids leaking the ACCESS_KEY prefix via response timing). */
export function timingSafeEqualStr(a, b) {
  const ea = new TextEncoder().encode(String(a ?? ""));
  const eb = new TextEncoder().encode(String(b ?? ""));
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : undefined;
}

/**
 * Operator access check for the admin surface. Returns { ok, via?, email?, reason? }.
 * Fail-closed: no valid Access JWT AND no matching bearer → { ok:false }.
 */
export async function accessOk(request, env) {
  const assertion = request.headers.get("cf-access-jwt-assertion") || readCookie(request, "CF_Authorization");
  if (assertion) {
    const v = await verifyAccessJwt(env, assertion);
    if (v.ok) return { ok: true, via: "access", email: v.email };
  }
  const auth = request.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m && env.ACCESS_KEY && timingSafeEqualStr(m[1], env.ACCESS_KEY)) {
    return { ok: true, via: "bearer" };
  }
  return { ok: false, reason: "unauthorized" };
}
