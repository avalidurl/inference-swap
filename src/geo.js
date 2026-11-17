// Edge geo-block — Tier-0 sanctions / export-control gate for CURB.
//
// TIER-0 CAVEAT: this gates on Cloudflare's edge geolocation (request.cf.country),
// which is GEOGRAPHY, not nationality — and VPNs / proxies / Tor trivially bypass it.
// It is a good-faith edge control, NOT a complete sanctions-compliance program. Full
// compliance still needs the controls-plan research + counsel (screening, attestations,
// wallet/ chain analytics, recordkeeping).
//
// Default blocklist = OFAC comprehensively-embargoed jurisdictions + China. The founder
// asked for "China totally", so Hong Kong (HK) and Macau (MO) are in the default set for
// export-control parity with the mainland:
//   CN  China (+ HK Hong Kong, MO Macau)
//   CU  Cuba
//   IR  Iran
//   KP  North Korea (DPRK)
//   SY  Syria
// Occupied Ukrainian regions (Crimea, Donetsk, Luhansk) are handled separately below.
//
// Russia (RU) is deliberately NOT blocked by default — it is under sectoral / list-based
// sanctions, not a comprehensive OFAC embargo. To add it, append "RU" to BLOCKED_COUNTRIES
// (env / wrangler.toml [vars]); no code change required.
export const DEFAULT_BLOCKED_COUNTRIES = "CN,HK,MO,CU,IR,KP,SY";

// Best-effort match for occupied Ukrainian regions under OFAC comprehensive embargo, applied
// only when cf.country === "UA". cf.region is a free-text region name; matched case-insensitively
// (also against regionCode). "lugansk" covers the alternate transliteration of Luhansk.
const UA_BLOCKED_REGIONS = ["crimea", "donetsk", "luhansk", "lugansk", "sevastopol"];

function blockedSet(env) {
  const raw = (env && env.BLOCKED_COUNTRIES) || DEFAULT_BLOCKED_COUNTRIES;
  return new Set(
    raw
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
  );
}

function bearerMatches(request, key) {
  if (!key) return false;
  const m = (request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i);
  return Boolean(m && m[1] === key);
}

function blockedResponse(request) {
  const wantsHtml = (request.headers.get("accept") || "").includes("text/html");
  const contact = "contact@gokhan.vc";
  const common = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
  };
  if (wantsHtml) {
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CURB — unavailable in your region</title><style>body{font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;background:#0b0b0c;color:#e7e7e9;margin:0;display:grid;place-items:center;min-height:100vh;padding:2rem}main{max-width:34rem}h1{font-size:1.25rem;margin:0 0 .75rem}p{margin:.5rem 0;color:#c7c7cb}a{color:#f5b301}</style></head><body><main><h1>CURB is not available in your jurisdiction</h1><p>Access to CURB is geo-restricted for legal, sanctions, and export-control compliance. This decision is based on the approximate location of your network connection.</p><p>If you believe this is an error, contact <a href="mailto:${contact}">${contact}</a>.</p></main></body></html>`;
    return new Response(html, {
      status: 451,
      headers: { "Content-Type": "text/html; charset=utf-8", ...common },
    });
  }
  return new Response(
    JSON.stringify({
      error: "unavailable_in_region",
      message: "CURB is not available in your jurisdiction.",
      contact,
    }),
    { status: 451, headers: { "Content-Type": "application/json; charset=utf-8", ...common } }
  );
}

/**
 * Edge geo-gate. Returns a 451 (Unavailable For Legal Reasons) Response when the request
 * originates from a blocked jurisdiction, or null to let the request continue.
 *
 * - /health is ALWAYS allowed through so status monitors / uptime checks keep working.
 * - Everything else (site, /v1/*, /mcp, /openapi.json, /.well-known/x402, admin, docs, assets)
 *   is blocked for blocked geos.
 * - request.cf.country is set by Cloudflare at the edge (not a client header) — do not trust
 *   client-supplied geo headers.
 *
 * DEBUG HOOK (operator-only): append ?geotest=CN to SIMULATE a country, and optionally
 * ?geotest_region=Crimea. Honored ONLY when the caller also sends
 * `Authorization: Bearer <ACCESS_KEY>`. This lets the operator verify the block live without
 * a VPN. Without the matching bearer the params are ignored.
 */
export function geoBlockResponse(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  // Liveness must never be geo-blocked (monitors, uptime, Access health bypass).
  if (path === "/health") return null;

  let country = request.cf && request.cf.country ? String(request.cf.country).toUpperCase() : "";
  let region = request.cf && request.cf.region ? String(request.cf.region) : "";
  const regionCode = request.cf && request.cf.regionCode ? String(request.cf.regionCode) : "";

  // Operator-only simulation (bearer-gated) for verifying the block live.
  const geotest = url.searchParams.get("geotest");
  if (geotest && bearerMatches(request, env && env.ACCESS_KEY)) {
    country = geotest.toUpperCase();
    const regionTest = url.searchParams.get("geotest_region");
    if (regionTest) region = regionTest;
  }

  // Unknown origin (e.g. local dev, no cf object) — do not block.
  if (!country) return null;

  const blocked = blockedSet(env);
  if (blocked.has(country)) return blockedResponse(request);

  // Best-effort occupied-region embargo (Crimea, Donetsk, Luhansk / Sevastopol) within Ukraine.
  if (country === "UA") {
    const hay = `${region} ${regionCode}`.toLowerCase();
    if (UA_BLOCKED_REGIONS.some((r) => hay.includes(r))) return blockedResponse(request);
  }

  return null;
}
