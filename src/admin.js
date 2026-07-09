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
import { SHARED_CSS, themeBootScript, themeToggleScript } from "./skin.js";

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

const tile = (k, v, sub = "") =>
  `<div class="tile"><div class="tk">${esc(k)}</div><div class="tv">${v}</div>${sub ? `<div class="ts">${sub}</div>` : ""}</div>`;

const healthDot = (h) =>
  h
    ? `<span class="${h.ok ? "ok" : "bad"}">${h.ok ? "up" : "down"}</span> <span class="mut">${esc(h.status || "—")}</span>`
    : `<span class="mut">—</span>`;

/** Inline full-address table cell: monospace + copy button + basescan link. No truncation. */
function addrCell(a) {
  const s = String(a || "").trim();
  if (!isEvm(s)) return `<td class="mut">${esc(s || "—")}</td>`;
  return `<td class="addr"><code class="full">${esc(s)}</code>
    <span class="acts"><button type="button" class="cpy" onclick="copyAddr('${esc(s)}',this)">copy</button>
    <a href="${esc(basescan(s))}" target="_blank" rel="noopener">↗</a></span></td>`;
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
            ? `<span class="ok">verified</span>`
            : `<span class="warn">demo</span>`
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

/** Full (untruncated) wallet/contract inventory — TAG + full mono address + copy + basescan. */
function addressesTable(addresses) {
  const rows = (addresses || [])
    .map((r) => {
      const tagCell = `<td class="atag">${esc(r.tag)}${r.note ? `<div class="anote mut">${esc(r.note)}</div>` : ""}</td>`;
      const evm = r.kind !== "tbd" && isEvm(r.address);
      if (!evm) {
        return `<tr>${tagCell}<td colspan="2"><span class="warn">${esc(r.address || "not configured yet (TBD)")}</span></td></tr>`;
      }
      const status =
        r.deployed === true
          ? '<span class="ok">✓ deployed</span>'
          : r.deployed === false
            ? '<span class="warn">predicted · not deployed</span>'
            : r.split
              ? '<span class="mut">predicted</span>'
              : "";
      return `<tr>${tagCell}
        <td class="addr"><code class="full">${esc(r.address)}</code></td>
        <td class="acts">
          <button type="button" class="cpy" onclick="copyAddr('${esc(r.address)}',this)">copy</button>
          <a href="${esc(basescan(r.address))}" target="_blank" rel="noopener">basescan ↗</a>
          ${status}
        </td>
      </tr>`;
    })
    .join("");
  return `<table class="addrs"><thead><tr><th>tag</th><th>address (full)</th><th>copy / explore</th></tr></thead><tbody>${rows}</tbody></table>`;
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
    tile("rails", `${s.rails.base ? '<span class="ok">Base</span>' : '<span class="mut">Base</span>'}`),
  ].join("");

  const hubTiles = [
    tile("hub payTo · Base", `<code>${esc(s.hub.payToBase || "—")}</code>`),
    tile("split · Base (0xSplits)", `<code>${esc(s.split?.base || "—")}</code>`),
  ].join("");

  const agentTiles = [
    tile("harness", healthDot(a.harness), '<a href="https://harness.curb.numetal.xyz/" target="_blank" rel="noopener">harness.curb</a>'),
    tile("seller", healthDot(a.seller), '<a href="https://seller.curb.numetal.xyz/" target="_blank" rel="noopener">seller.curb</a>'),
    tile("buyer", healthDot(a.buyer), '<a href="https://buyer.curb.numetal.xyz/" target="_blank" rel="noopener">buyer.curb</a>'),
  ].join("");

  const links = `<div class="linkgrid">
    <div class="card"><div class="tk">token &amp; fees</div><div class="lk">${linkRow([
      ["$CURB (Basescan)", `https://basescan.org/token/${CURB_TOKEN}`],
      ["Bankr", `https://bankr.bot/launches/${CURB_TOKEN}`],
      ["fees page", "https://curb.numetal.xyz/fees"],
    ])}</div></div>
    <div class="card"><div class="tk">discovery</div><div class="lk">${linkRow([
      ["x402scan", "https://www.x402scan.com/server"],
      ["openapi", "https://api.curb.numetal.xyz/openapi.json"],
      [".well-known/x402", "https://api.curb.numetal.xyz/.well-known/x402"],
      ["skill.md", "https://api.curb.numetal.xyz/skill.md"],
      ["MCP", "https://api.curb.numetal.xyz/mcp"],
    ])}</div></div>
    <div class="card"><div class="tk">surfaces / ops</div><div class="lk">${linkRow([
      ["site", "https://curb.numetal.xyz/"],
      ["api", "https://api.curb.numetal.xyz/"],
      ["docs", "https://curb.numetal.xyz/docs/"],
      ["status", "https://status.numetal.xyz/"],
      ["repo", "https://github.com/gokhan-vc/inference-swap"],
      ["Workers logs", "https://dash.cloudflare.com/?to=/:account/workers-and-pages/observability"],
    ])}</div></div>
  </div>`;

  const body = `<div class="topbar">
  <div class="brand">CURB · OPS</div>
  <button type="button" class="theme-btn" id="theme-toggle" aria-label="Toggle theme">Light</button>
</div>
<h1>admin.curb.numetal.xyz</h1>
<p class="mut">Operator console · Cloudflare-Access gated (${esc(via)}) · <span class="mut">${esc(shortTs(s.generatedAt))}</span></p>

<h2>§01 · state &amp; economics</h2>
<div class="tiles">${statsTiles}</div>
<div class="tiles">${hubTiles}</div>

<h2>§02 · wallets &amp; contracts (${s.addresses.length})</h2>
<p class="mut">Full addresses (no truncation). Grant tokens are bearer secrets — masked in §07, never here.</p>
${addressesTable(s.addresses)}

<h2>§03 · actions</h2>
<div class="bar">
  <button onclick="act('/admin/purge','purge ALL test/fuzz data + reset indexes?')">▉ purge test data</button>
  <button onclick="act('/admin/reseed','reseed ONE clean demo offer?')">＋ reseed demo offer</button>
  <button onclick="location.reload()">↻ refresh</button>
  <span id="actres" class="mut"></span>
</div>

<h2>§04 · demo / harness health</h2>
<div class="tiles">${agentTiles}</div>

<h2>§05 · open offers (${s.offers.length})</h2>
${offersTable(s.offers)}

<h2>§06 · recent matches (${s.recentMatches.length})</h2>
${matchesTable(s.recentMatches)}

<h2>§07 · active grants (${s.grants.length})</h2>
${grantsTable(s.grants)}

<h2>§08 · links</h2>
${links}

<footer>
  raw snapshot: <a href="/admin.json">/admin.json</a> · <a href="/health">/health</a> (public) ·
  hub holds no upstream keys · single-payee x402 → 0xSplits · one clean book.
</footer>`;

  return `<!DOCTYPE html>
<html lang="en" data-theme="dim">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex,nofollow"/>
<title>CURB · ops</title>
<style>${SHARED_CSS}
  .wrap{max-width:1100px}
  .brand{font-family:var(--mono);font-size:.8rem;letter-spacing:.16em;text-transform:uppercase}
  h2{margin-top:1.6rem}
  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.7rem;margin:.5rem 0 1rem}
  .tile{border:1px solid var(--line);background:var(--panel);padding:.7rem .8rem}
  .tk{font-family:var(--mono);font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
  .tv{font-family:var(--mono);font-size:1.1rem;margin-top:.2rem;word-break:break-all}
  .ts{font-family:var(--mono);font-size:.66rem;color:var(--muted);margin-top:.25rem;word-break:break-all}
  table{width:100%;border-collapse:collapse;font-size:.76rem;font-family:var(--mono);margin:.3rem 0 1rem}
  th{text-align:left;color:var(--muted);font-weight:500;border-bottom:1px solid var(--line);padding:.35rem .5rem;text-transform:uppercase;font-size:.62rem;letter-spacing:.08em}
  td{border-bottom:1px solid var(--line);padding:.35rem .5rem;vertical-align:top}
  code{font-family:var(--mono);font-size:.92em;background:var(--code-bg);padding:.05em .3em;border:1px solid var(--line)}
  code.full{word-break:break-all;white-space:normal}
  .ok{color:#3fae6b}.bad{color:#e05a5a}.warn{color:#c9a227}.mut{color:var(--muted)}
  .addrs td{vertical-align:top}
  .atag{white-space:nowrap}
  .anote{font-size:.6rem;margin-top:.25rem;white-space:normal;max-width:24rem;line-height:1.4}
  td.addr code.full{display:inline-block}
  .acts{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin-top:.15rem}
  .acts a{color:var(--muted)}.acts a:hover{color:var(--fg)}
  button.cpy{font-family:var(--mono);font-size:.6rem;letter-spacing:.05em;text-transform:uppercase;padding:.15rem .45rem;border:1px solid var(--line);background:transparent;color:var(--muted);cursor:pointer}
  button.cpy:hover{border-color:var(--fg);color:var(--fg)}
  button.cpy.ok{color:#3fae6b;border-color:#3fae6b}
  .bar{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin:.4rem 0}
  .bar button{font-family:var(--mono);font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;padding:.5rem .8rem;border:1px solid var(--fg);background:transparent;color:var(--fg);cursor:pointer}
  .bar button:hover{background:var(--fg);color:var(--bg)}
  .linkgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.7rem}
  .card{border:1px solid var(--line);background:var(--panel);padding:.8rem}
  .lk{margin-top:.4rem;line-height:2;font-family:var(--mono);font-size:.72rem}
  .lk a{color:var(--muted)}.lk a:hover{color:var(--fg)}
</style>
${themeBootScript()}
</head>
<body>
<div class="wrap">
${body}
</div>
${themeToggleScript()}
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
