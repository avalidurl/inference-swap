/**
 * CURB operator console (admin.curb.numetal.xyz) — the "see + click everything" view.
 *
 * Access-gated exactly like the Ishtar operator console: reachable ONLY on the Cloudflare-Access
 * admin.* subdomain, past a verified Access email JWT OR Bearer ACCESS_KEY (never a key in a URL).
 * GET /admin = full HTML console (dim B&W skin from skin.js); GET /admin.json = stable snapshot.
 * Actions (gated POST): purge test data, reseed the clean demo offer, refresh. /health stays public.
 */
import { stats, listOffers, listMatches, activeGrants } from "./swap.js";
import { listIds } from "./store.js";
import { settleMode, hubPayToBase, splitAddressBase, baseAsset, USDC_BASE } from "./x402.js";

const CURB_TOKEN = "0xf0CBbf0806eD88910a011eEc9439A990c8C24BA3";
const ADMIN_ORIGIN = "https://admin.curb.numetal.xyz";

// Known on-chain constants (Base). Env-sourced where an env var exists; hardcoded otherwise.
const PUSH_SPLIT_FACTORY_V22 = "0x8E8eB0cC6AE34A38B67D5Cf91ACa38f60bc3Ecf4";
const NUMETAL_TEAM = "0xB13Fb67859bC818a7b9Eb7f1380274492B6D648F";
const NUMETAL_TREASURY = "0x3D9bB085b7E2fd15827d174f20375be385c121c0";
const HUB_PAY_TO_FALLBACK = "0x3eee81B5b4cf1983b7DB36cf042B5d06c04F33eE";
const DEMO_SELLER_FALLBACK = "0x8f49d4d782488e8576c8c54288027c57f4acf521";
const SPLIT_BASE_FALLBACK = "0x546217c24617bCF9faD565E8ECABe5dE2D41326b";

const isEvm = (a) => /^0x[a-fA-F0-9]{40}$/.test(String(a || "").trim());
const basescan = (a) => `https://basescan.org/address/${a}`;

/**
 * Resolve every operator-relevant wallet/contract to a tagged row. Pulls from env/config where a
 * variable exists; hardcodes the known constants otherwise. Grant TOKENS are bearer secrets and
 * are NOT included here (see grantsTable — masked). `kind: "tbd"` = not configured yet.
 */
function resolveAddresses(env) {
  const keeper = String(env.KEEPER_ADDRESS || "").trim();
  return [
    {
      tag: "Hub fee · Base",
      address: hubPayToBase(env) || HUB_PAY_TO_FALLBACK,
      note: "env.HUB_PAY_TO · AgentCash Base deposit · 5% recipient inside the split",
    },
    {
      tag: "Demo seller · Base",
      address: String(env.DEMO_SELLER_PAY_TO || DEMO_SELLER_FALLBACK),
      note: "env.DEMO_SELLER_PAY_TO · Bankr / goekhan · 95% recipient inside the split",
    },
    {
      tag: "0xSplits split · Base",
      address: splitAddressBase(env) || SPLIT_BASE_FALLBACK,
      note: "env.SPLIT_ADDRESS_BASE · single-payee gross target · seller 95% / hub 5% · owner 0x0 (immutable)",
      split: true,
    },
    {
      tag: "PushSplitFactory V2.2 · Base",
      address: PUSH_SPLIT_FACTORY_V22,
      note: "0xSplits factory · createSplitDeterministic (deploys the split above)",
    },
    {
      tag: "$CURB token · Base",
      address: CURB_TOKEN,
      note: "ERC-20 · Bankr Doppler launch",
    },
    {
      tag: "Numetal team · Base",
      address: NUMETAL_TEAM,
      note: "Numetal Labs team wallet",
    },
    {
      tag: "Numetal treasury · Base",
      address: NUMETAL_TREASURY,
      note: "Numetal Labs treasury wallet",
    },
    {
      tag: "USDC · Base",
      address: baseAsset(env) || USDC_BASE,
      note: "env.USDC · settlement asset (6 decimals)",
    },
    {
      tag: "Distribute keeper",
      address: keeper || null,
      note: keeper ? "env.KEEPER_ADDRESS · submits split distribute()" : "not configured yet (TBD) — funded Base EOA that will call distribute()",
      kind: keeper ? "evm" : "tbd",
    },
  ];
}

/**
 * On-chain existence check via eth_getCode on a public Base RPC. Returns true (deployed), false
 * (no code — predicted only), or null (unknown / RPC unreachable). Fail-soft: never throws.
 */
async function baseCodeExists(address, rpc) {
  if (!isEvm(address)) return null;
  try {
    const res = await fetch(rpc || "https://mainnet.base.org", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getCode", params: [address, "latest"] }),
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const code = String(j?.result || "");
    return code !== "0x" && code.length > 2;
  } catch {
    return null;
  }
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

const maskToken = (t) => {
  const s = String(t || "");
  return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : "•".repeat(s.length || 4);
};

const shortTs = (iso) => String(iso || "").replace("T", " ").replace(/\.\d+Z$/, "Z").slice(0, 19);

async function agentHealth(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    let ok = res.ok;
    try {
      const j = await res.json();
      ok = ok && (j.ok === true || j.status === "ok" || j.ok === undefined);
    } catch {
      /* non-JSON but 2xx still counts as up */
    }
    return { url, ok, status: res.status };
  } catch (e) {
    return { url, ok: false, status: 0, error: String(e?.name || e) };
  }
}

/** Stable operator snapshot — keep key shape stable (consumed by /admin.json). */
export async function adminSnapshot(env, { withAgents = true } = {}) {
  const s = await stats(env);
  const [offers, recentMatches, grants, intentIds] = await Promise.all([
    listOffers(env, { status: "open", limit: 100 }),
    listMatches(env, { limit: 25 }),
    activeGrants(env, { limit: 100 }),
    listIds(env, "idx:intents"),
  ]);

  let agents = null;
  if (withAgents) {
    const [harness, seller, buyer] = await Promise.all([
      agentHealth("https://harness.curb.numetal.xyz/health"),
      agentHealth("https://seller.curb.numetal.xyz/health"),
      agentHealth("https://buyer.curb.numetal.xyz/health"),
    ]);
    agents = { harness, seller, buyer };
  }

  // Tagged wallet/contract inventory (full addresses; grant tokens excluded — bearer secrets).
  const addresses = resolveAddresses(env);
  const splitEntry = addresses.find((r) => r.split);
  if (splitEntry) {
    splitEntry.deployed = await baseCodeExists(splitEntry.address, env.BASE_RPC_URL);
  }

  return {
    ok: true,
    brand: "CURB",
    product: "numetal-curb",
    host: "admin.curb.numetal.xyz",
    generatedAt: new Date().toISOString(),
    settle: { mode: settleMode(env), feeBps: s.feeBps },
    hub: { payToBase: s.hubPayTo },
    split: s.split,
    addresses,
    rails: s.rails,
    stats: {
      openOffers: s.openOffers,
      matches: s.matches,
      intents: intentIds.length,
      activeGrants: grants.length,
    },
    offers,
    recentMatches,
    grants,
    agents,
  };
}

/* Numetal Office admin kit. Inlined so the access-gated console has no stylesheet dependency. */
const AD100_CSS = `*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:#fff;color:#000;font:12px/1.45 ui-monospace,'SF Mono',SFMono-Regular,Menlo,Consolas,monospace}
a{color:#000;text-decoration:underline;text-underline-offset:2px}
a:hover{background:#000;color:#fff;text-decoration:none}
.sheet{max-width:980px;margin:0 auto;padding:0 16px 48px}
.mast{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:14px 0 6px;border-bottom:3px double #000}
.mast .org{font-weight:700;letter-spacing:.18em;text-transform:uppercase;font-size:13px}
.mast .form{font-size:10px;letter-spacing:.14em;text-transform:uppercase}
.stamp{display:flex;gap:16px;flex-wrap:wrap;font-size:10px;letter-spacing:.12em;text-transform:uppercase;padding:6px 0;border-bottom:1px solid #000}
h1{font-size:15px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:22px 0 4px}
.sub{font-size:11px;margin:0 0 8px}
h2{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;margin:26px 0 8px;padding-bottom:4px;border-bottom:1px solid #000}
h2 .no{display:inline-block;min-width:2.6em}
table{border-collapse:collapse;width:100%;font-size:12px}
th{font-size:10px;text-align:left;letter-spacing:.14em;text-transform:uppercase;font-weight:700;border-bottom:1px solid #000;padding:4px 12px 4px 0}
td{border-bottom:1px dotted #000;padding:4px 12px 4px 0;vertical-align:top}
tr:hover td{background:#eee}
.kv{display:grid;grid-template-columns:max-content 1fr;gap:2px 18px;font-size:12px}
.kv dt{font-size:10px;letter-spacing:.12em;text-transform:uppercase;padding-top:2px}
.kv dd{word-break:break-word}
.badge{display:inline-block;border:1px solid #000;padding:0 6px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;background:#fff;color:#000}
.badge.neg{background:#000;color:#fff}
.btn{display:inline-block;border:1px solid #000;background:#fff;color:#000;padding:3px 10px;font:inherit;font-size:11px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;text-decoration:none}
.btn:hover,.btn:focus{background:#000;color:#fff;outline:none}
input,select,textarea{font:inherit;border:1px solid #000;background:#fff;color:#000;padding:3px 6px}
pre.report{border:1px solid #000;padding:10px 12px;overflow-x:auto;font-size:12px;line-height:1.35;background:#fff}
.bars{display:flex;gap:1px;align-items:flex-end}
.bars i{display:block;width:6px;height:14px;background:#000}
.bars i.dn{background:#fff;box-shadow:inset 0 0 0 1px #000}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:10px}
.card{border:1px solid #000;padding:10px 12px}
.card .t{font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:11px;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:6px}
.foot{margin-top:44px;padding-top:8px;border-top:1px solid #000;font-size:10px;letter-spacing:.08em;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
@media (max-width:640px){.kv{grid-template-columns:1fr}.mast{flex-direction:column;gap:2px}}
/* AD-130 page-specific (monochrome only) */
.mut{font-size:11px}
code{font:inherit}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:8px 0 12px}
.tile{border:1px solid #000;padding:8px 10px}
.tile .tk{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:5px}
.tile .tv{font-size:13px;white-space:nowrap;overflow-x:auto}
.tile .ts{font-size:10px;margin-top:4px;white-space:nowrap;overflow-x:auto}
.identifier{white-space:nowrap;overflow-wrap:normal;word-break:normal;font-variant-numeric:tabular-nums}
.table-scroll{width:100%;overflow-x:auto;border:1px solid #141414}
.addrs{table-layout:auto;min-width:1120px}
.addrs td{vertical-align:top}
.addrs th,.addrs td{padding-left:10px;padding-right:10px}
.addrs th:first-child,.addrs td:first-child{padding-left:10px}
.addrs th:last-child,.addrs td:last-child{padding-right:10px}
.atag{width:auto;min-width:390px}
.anote{font-size:10px;margin-top:3px;white-space:normal;max-width:26rem;line-height:1.4}
.addrs td.addr{width:340px;min-width:340px;white-space:nowrap}
td.addr code.full{display:inline-block;white-space:nowrap;overflow-wrap:normal;word-break:normal}
.addrs td.acts{width:220px;min-width:220px;white-space:nowrap}
.acts-inner,.acts-inline{display:flex;flex-wrap:nowrap;gap:6px;align-items:center;white-space:nowrap}
.acts-inline{margin-top:5px}
button.cpy{border:1px solid #000;background:#fff;color:#000;font:inherit;font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:0 6px;cursor:pointer}
button.cpy:hover{background:#000;color:#fff}
button.cpy.ok{background:#000;color:#fff}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}
.lk{margin-top:2px;line-height:2;font-size:11px}
/* Office shell: sans for reading, mono only for IDs, metadata, and operational labels. */
body{background:#e7e7e7;color:#141414;font:15px/1.45 "Helvetica Neue",Arial,"Arial Nova",sans-serif;font-synthesis:none;text-rendering:optimizeLegibility}.sheet{max-width:1440px;margin:48px auto 0;background:#fff;border:2px solid #141414;box-shadow:5px 5px 0 rgba(0,0,0,.15);padding:0 28px 56px}.office{display:flex;align-items:center;gap:22px;padding:23px 0 16px}.office .org{font-size:23px;font-weight:800;letter-spacing:-.035em;white-space:nowrap}.office .form{margin-left:auto;color:#686868;font:11px/1.2 ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}.rail{display:flex;gap:3px;flex:1;min-width:160px}.rail i{display:block;flex:1;min-width:14px;height:16px}.rail i:nth-child(1){background:#dc4138}.rail i:nth-child(2){background:#16956e}.rail i:nth-child(3){background:#4b328f}.rail i:nth-child(4){background:#29a7db}.rail i:nth-child(5){background:#f2e71b}.rail i:nth-child(6){background:#d71989}.rail i:nth-child(7){background:#141414}.rail i:nth-child(n+8){background:#b9b9b9}.rail i:nth-child(15){background:#5e8d39}.rail i:nth-child(16){background:#137e74}.rail i:nth-child(17){background:#2555a5}.rail i:nth-child(18){background:#6f3c91}.rail i:nth-child(19){background:#ab2463}.rail i:nth-child(20){background:#c42c3a}.rail i:nth-child(21){background:#d67025}.rail i:nth-child(22){background:#f4bd17}.nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;padding:0 0 17px;border-bottom:1px solid #141414}.nav a{border:2px solid #141414;padding:7px 8px;text-align:center;text-decoration:none;color:#141414;font-size:16px;font-weight:700;line-height:1}.nav a[aria-current="page"]{box-shadow:inset 5px 0 0 #dc4138}.nav .dot{display:inline-block;width:11px;height:11px;background:#dc4138;border:2px solid #141414;border-radius:50%;margin-right:6px;vertical-align:-1px}.mast{padding:20px 0 6px;border:0}.mast .org{font-size:20px;letter-spacing:-.025em}.mast .form{font-family:ui-monospace,"SF Mono",Menlo,monospace;color:#686868}.stamp{border-top:1px solid #141414;border-bottom:1px solid #141414;padding:7px 0;color:#686868;font-family:ui-monospace,"SF Mono",Menlo,monospace}.sub{font-size:15px;max-width:78ch}h2{margin-top:22px;padding:8px 10px;background:#f3f3f3;border:1px solid #141414;border-bottom:0;font-size:12px;letter-spacing:.09em}.tiles{grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.tile{border-color:#141414;padding:11px 12px}.tile .tk{font-family:ui-monospace,"SF Mono",Menlo,monospace;border-color:#141414}.tile .tv{font-size:15px}.tile .ts,.mut,code{font-family:ui-monospace,"SF Mono",Menlo,monospace}.btn{background:#f4bd17;border-width:2px}.btn:hover,.btn:focus{background:#141414;color:#fff;outline:2px solid #2555a5;outline-offset:2px}.board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;border:1px solid #141414;padding:12px;background:#fff}.lane{border:1px solid #141414;min-width:0}.lane-head{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:8px 10px;background:#f3f3f3;border-bottom:1px solid #141414}.lane-head h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase}.lane-head span{font:10px/1 ui-monospace,"SF Mono",Menlo,monospace;color:#686868}.lane-card{padding:11px;border-bottom:1px solid #141414;background:#fff}.lane-card:last-child{border-bottom:0}.lane-card:hover{background:#fff8dc}.lane-card .title{font-weight:700;margin-bottom:5px}.lane-card .meta{font:11px/1.4 ui-monospace,"SF Mono",Menlo,monospace;color:#686868}.lane-card details{margin-top:8px}.lane-card summary{font:10px/1.2 ui-monospace,"SF Mono",Menlo,monospace;cursor:pointer;text-transform:uppercase;letter-spacing:.06em}.badge{border-color:#141414}.foot{font-family:ui-monospace,"SF Mono",Menlo,monospace;border-color:#141414}@media(max-width:760px){.sheet{margin:0;border-left:0;border-right:0;box-shadow:none;padding:0 14px 48px}.office{flex-wrap:wrap;gap:10px}.office .org{font-size:20px}.office .form{margin-left:0}.rail{order:3;flex-basis:100%}.nav{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.nav a{font-size:12px}.board{grid-template-columns:1fr}.tiles{grid-template-columns:1fr}}@media(max-width:420px){.nav{grid-template-columns:repeat(2,minmax(0,1fr)}}`;

const tile = (k, v, sub = "") =>
  `<div class="tile"><div class="tk">${esc(k)}</div><div class="tv">${v}</div>${sub ? `<div class="ts">${sub}</div>` : ""}</div>`;

const healthDot = (h) =>
  h
    ? `<span class="badge${h.ok ? "" : " neg"}">${h.ok ? "UP" : "DOWN"}</span> <span class="mut">${esc(h.status || "—")}</span>`
    : `<span class="mut">—</span>`;

/** Inline full-address table cell: monospace + copy button + basescan link. No truncation. */
function addrCell(a) {
  const s = String(a || "").trim();
  if (!isEvm(s)) return `<td class="mut">${esc(s || "—")}</td>`;
  return `<td class="addr"><code class="full identifier">${esc(s)}</code>
    <span class="acts-inline"><button type="button" class="cpy" onclick="copyAddr('${esc(s)}',this)">copy</button>
    <a href="${esc(basescan(s))}" target="_blank" rel="noopener">view</a></span></td>`;
}

function offersTable(offers) {
  if (!offers.length) return `<p class="mut">no open offers</p>`;
  const rows = offers
    .map(
      (o) => `<tr>
      <td><code>${esc(o.id)}</code></td>
      <td>${esc(o.model)}</td>
      <td>${esc(o.mtok)}</td>
      <td>$${esc(o.priceUsd)}</td>
      ${addrCell(o.sellerPayTo)}
      <td class="mut">${esc(shortTs(o.createdAt))}</td>
    </tr>`
    )
    .join("");
  return `<table><thead><tr><th>id</th><th>model</th><th>mtok</th><th>price</th><th>seller payTo</th><th>created</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function matchesTable(matches) {
  if (!matches.length) return `<p class="mut">no matches</p>`;
  const rows = matches
    .map((m) => {
      const sp = m.split || {};
      const v = m.paymentMeta?.verified;
      const vbadge =
        m.status === "paid" || m.status === "fulfilled"
          ? v
            ? `<span class="badge">VERIFIED</span>`
            : `<span class="badge">DEMO</span>`
          : `<span class="mut">—</span>`;
      return `<tr>
        <td><code>${esc(m.id)}</code></td>
        <td>${esc(m.status)}</td>
        <td>${esc(m.model)}</td>
        <td>${esc(m.mtok)}</td>
        <td class="mut">$${esc(sp.grossUsd ?? "—")} / $${esc(sp.feeUsd ?? "—")} / $${esc(sp.sellerUsd ?? "—")}</td>
        ${addrCell(m.sellerPayTo)}
        ${addrCell(m.buyer)}
        <td class="mut">${esc(shortTs(m.paidAt))}</td>
        <td>${vbadge}</td>
      </tr>`;
    })
    .join("");
  return `<table><thead><tr><th>id</th><th>status</th><th>model</th><th>mtok</th><th>gross/fee/seller</th><th>seller payTo</th><th>buyer</th><th>paidAt</th><th>?</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function grantsTable(grants) {
  if (!grants.length) return `<p class="mut">no active grants</p>`;
  const rows = grants
    .map(
      (g) => `<tr>
      <td><code>${esc(maskToken(g.token))}</code></td>
      <td><code>${esc(g.matchId)}</code></td>
      <td class="mut">${esc(String(g.endpoint || "—").replace(/^https?:\/\//, ""))}</td>
      <td class="mut">${esc(shortTs(g.expiresAt))}</td>
    </tr>`
    )
    .join("");
  return `<table><thead><tr><th>token</th><th>matchId</th><th>endpoint</th><th>expiresAt</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function offersCards(offers) {
  if (!offers.length) return `<p class="mut" style="padding:11px">No open offers.</p>`;
  return offers
    .map(
      (o) => `<article class="lane-card"><div class="title">${esc(o.model)} <span class="badge">OPEN</span></div><p class="meta">offer <code>${esc(o.id)}</code> · ${esc(o.mtok)} · $${esc(o.priceUsd)} · ${esc(shortTs(o.createdAt))}</p><details><summary>settlement target</summary><p class="meta" style="margin-top:6px"><code class="identifier">${esc(o.sellerPayTo || "—")}</code></p></details></article>`,
    )
    .join("");
}

function matchesCards(matches) {
  if (!matches.length) return `<p class="mut" style="padding:11px">No matches yet.</p>`;
  return matches
    .map((m) => {
      const verified = m.paymentMeta?.verified;
      const stamp = m.status === "paid" || m.status === "fulfilled" ? (verified ? "VERIFIED" : "DEMO") : String(m.status || "—").toUpperCase();
      const split = m.split || {};
      return `<article class="lane-card"><div class="title">${esc(m.model)} <span class="badge">${esc(stamp)}</span></div><p class="meta">match <code>${esc(m.id)}</code> · ${esc(m.mtok)} · $${esc(split.grossUsd ?? "—")} gross · ${esc(shortTs(m.paidAt))}</p><details><summary>settlement detail</summary><p class="meta" style="margin-top:6px">seller: <code class="identifier">${esc(m.sellerPayTo || "—")}</code><br>buyer: <code class="identifier">${esc(m.buyer || "—")}</code></p></details></article>`;
    })
    .join("");
}

function grantsCards(grants) {
  if (!grants.length) return `<p class="mut" style="padding:11px">No active grants.</p>`;
  return grants
    .map(
      (g) => `<article class="lane-card"><div class="title">Grant <code>${esc(maskToken(g.token))}</code></div><p class="meta">match <code>${esc(g.matchId)}</code> · expires ${esc(shortTs(g.expiresAt))}</p><details><summary>endpoint</summary><p class="meta" style="margin-top:6px">${esc(String(g.endpoint || "—").replace(/^https?:\/\//, ""))}</p></details></article>`,
    )
    .join("");
}

/** Full (untruncated) wallet/contract inventory — TAG + full mono address + copy + basescan. */
function addressesTable(addresses) {
  const rows = (addresses || [])
    .map((r) => {
      const tagCell = `<td class="atag">${esc(r.tag)}${r.note ? `<div class="anote mut">${esc(r.note)}</div>` : ""}</td>`;
      const evm = r.kind !== "tbd" && isEvm(r.address);
      if (!evm) {
        return `<tr>${tagCell}<td colspan="2">${
          r.address
            ? `<span class="mut">${esc(r.address)}</span>`
            : `<span class="badge">TBD</span> <span class="mut">not configured yet</span>`
        }</td></tr>`;
      }
      const status =
        r.deployed === true
          ? '<span class="badge">DEPLOYED</span>'
          : r.deployed === false
            ? '<span class="badge neg">NOT DEPLOYED</span>'
            : r.split
              ? '<span class="badge">PREDICTED</span>'
              : "";
      return `<tr>${tagCell}
        <td class="addr"><code class="full identifier">${esc(r.address)}</code></td>
        <td class="acts"><div class="acts-inner">
          <button type="button" class="cpy" onclick="copyAddr('${esc(r.address)}',this)">copy</button>
          <a href="${esc(basescan(r.address))}" target="_blank" rel="noopener">basescan</a>
          ${status}
        </div></td>
      </tr>`;
    })
    .join("");
  return `<div class="table-scroll"><table class="addrs"><thead><tr><th>tag</th><th>address (full)</th><th>copy / explore</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

const linkRow = (links) =>
  links.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(" &nbsp;·&nbsp; ");

/** Full HTML console. `via` = how the caller authed (access|bearer) for the footer note. */
export async function adminHtml(env, { via = "access" } = {}) {
  const s = await adminSnapshot(env);
  const a = s.agents || {};

  const statsTiles = [
    tile("settle mode", `<b>${esc(s.settle.mode)}</b>`, `fee ${esc(s.settle.feeBps)} bps`),
    tile("open offers", `<b>${esc(s.stats.openOffers)}</b>`),
    tile("matches", `<b>${esc(s.stats.matches)}</b>`),
    tile("intents", `<b>${esc(s.stats.intents)}</b>`),
    tile("active grants", `<b>${esc(s.stats.activeGrants)}</b>`),
    tile("rails", `${s.rails.base ? '<span class="badge">BASE</span>' : '<span class="badge neg">BASE OFF</span>'}`),
  ].join("");

  const hubTiles = [
    tile("hub payTo · Base", `<code class="identifier">${esc(s.hub.payToBase || "—")}</code>`),
    tile("split · Base (0xSplits)", `<code class="identifier">${esc(s.split?.base || "—")}</code>`),
  ].join("");

  const agentTiles = [
    tile("harness", healthDot(a.harness), '<a href="https://harness.curb.numetal.xyz/" target="_blank" rel="noopener">harness.curb</a>'),
    tile("seller", healthDot(a.seller), '<a href="https://seller.curb.numetal.xyz/" target="_blank" rel="noopener">seller.curb</a>'),
    tile("buyer", healthDot(a.buyer), '<a href="https://buyer.curb.numetal.xyz/" target="_blank" rel="noopener">buyer.curb</a>'),
  ].join("");

  const links = `<div class="grid">
    <div class="card"><div class="t">token &amp; fees</div><div class="lk">${linkRow([
      ["$CURB (Basescan)", `https://basescan.org/token/${CURB_TOKEN}`],
      ["Bankr", `https://bankr.bot/launches/${CURB_TOKEN}`],
      ["fees page", "https://curb.numetal.xyz/fees"],
    ])}</div></div>
    <div class="card"><div class="t">discovery</div><div class="lk">${linkRow([
      ["x402scan", "https://www.x402scan.com/server"],
      ["openapi", "https://api.curb.numetal.xyz/openapi.json"],
      [".well-known/x402", "https://api.curb.numetal.xyz/.well-known/x402"],
      ["skill.md", "https://api.curb.numetal.xyz/skill.md"],
      ["MCP", "https://api.curb.numetal.xyz/mcp"],
    ])}</div></div>
    <div class="card"><div class="t">surfaces / ops</div><div class="lk">${linkRow([
      ["site", "https://curb.numetal.xyz/"],
      ["api", "https://api.curb.numetal.xyz/"],
      ["docs", "https://curb.numetal.xyz/docs/"],
      ["status", "https://status.numetal.xyz/"],
      ["repo", "https://github.com/gokhan-vc/inference-swap"],
      ["Workers logs", "https://dash.cloudflare.com/?to=/:account/workers-and-pages/observability"],
    ])}</div></div>
  </div>`;

  const body = `<div class="office"><span class="org">Numetal Office</span><span class="rail" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="form">FORM AD-130 · CURB · INTERNAL</span></div>
<nav class="nav" aria-label="Numetal operator"><a href="https://admin.numetal.xyz"><span class="dot"></span>Office</a><a href="https://admin.ishtar.numetal.xyz/admin">Ishtar</a><a aria-current="page" href="/admin">CURB</a><a href="https://curb.numetal.xyz">Site</a><a href="https://status.numetal.xyz">Status</a></nav>
<div class="mast">
  <span class="org">■ NUMETAL · CURB · ADMIN</span>
  <span class="form">FORM AD-130 · INTERNAL · ACCESS-GATED</span>
</div>
<div class="stamp">
  <span>HOST: admin.curb.numetal.xyz</span>
  <span>RENDERED: ${esc(shortTs(s.generatedAt))} UTC</span>
  <span>AUTH: ${esc(via)}</span>
</div>
<h1>Operator Console — Inference Swap</h1>
<p class="sub">See + click everything · Cloudflare-Access gated · /health stays public.</p>

<h2><span class="no">01</span>STATE &amp; ECONOMICS</h2>
<div class="tiles">${statsTiles}</div>
<div class="tiles">${hubTiles}</div>

<h2><span class="no">02</span>WALLETS &amp; CONTRACTS (${s.addresses.length})</h2>
<p class="mut">Full addresses (no truncation). Grant tokens are bearer secrets — masked in the settlement board, never here.</p>
${addressesTable(s.addresses)}

<h2><span class="no">03</span>ACTIONS</h2>
<div class="bar">
  <button type="button" class="btn" onclick="act('/admin/purge','purge ALL test/fuzz data + reset indexes?')">purge test data</button>
  <button type="button" class="btn" onclick="act('/admin/reseed','reseed ONE clean demo offer?')">reseed demo offer</button>
  <button type="button" class="btn" onclick="location.reload()">refresh</button>
  <span id="actres" class="mut"></span>
</div>

<h2><span class="no">04</span>DEMO / HARNESS HEALTH</h2>
<div class="tiles">${agentTiles}</div>

<h2><span class="no">05</span>SETTLEMENT FLOW BOARD</h2>
<div class="board">
  <section class="lane"><div class="lane-head"><h3>Open offers</h3><span>${s.offers.length}</span></div>${offersCards(s.offers)}</section>
  <section class="lane"><div class="lane-head"><h3>Recent matches</h3><span>${s.recentMatches.length}</span></div>${matchesCards(s.recentMatches)}</section>
  <section class="lane"><div class="lane-head"><h3>Active grants</h3><span>${s.grants.length}</span></div>${grantsCards(s.grants)}</section>
</div>

<h2><span class="no">06</span>LINKS</h2>
${links}

<p class="mut" style="margin-top:24px">
  raw snapshot: <a href="/admin.json">/admin.json</a> · <a href="/health">/health</a> (public) ·
  hub holds no upstream keys · single-payee x402 → 0xSplits · one clean book.
</p>
<div class="foot"><span>NUMETAL · INTERNAL</span><span>AD-130 · rev 2026-07-12</span></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex,nofollow"/>
<title>CURB · ADMIN · AD-130</title>
<style>${AD100_CSS}</style>
</head>
<body>
<div class="sheet">
${body}
</div>
<script>
function copyAddr(v,btn){
  var done=function(ok){var t=btn.getAttribute('data-l')||btn.textContent;if(!btn.getAttribute('data-l'))btn.setAttribute('data-l',t);btn.textContent=ok?'copied':'err';btn.classList.toggle('ok',ok);setTimeout(function(){btn.textContent=btn.getAttribute('data-l');btn.classList.remove('ok');},1200);};
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(function(){done(true);}).catch(function(){done(false);});}
    else{var ta=document.createElement('textarea');ta.value=v;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);done(true);}
  }catch(e){done(false);}
}
async function act(path,confirmMsg){
  if(!confirm(confirmMsg))return;
  var el=document.getElementById('actres');el.textContent='working…';
  try{
    var r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin'});
    var j=await r.json();
    el.textContent=r.ok?('ok: '+JSON.stringify(j)):('error '+r.status+': '+(j.error||JSON.stringify(j)));
    if(r.ok)setTimeout(function(){location.reload();},1200);
  }catch(e){el.textContent='error: '+e.message;}
}
</script>
</body>
</html>`;
}
