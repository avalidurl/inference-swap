/** CURB — token & fees page (structure adapted from numetal.xyz/fees, dim B&W skin). */
import { footerHtml, SHARED_CSS, themeBootScript, themeToggleScript, ORIGIN_CANON } from "./skin.js";

export const CURB_TOKEN = {
  name: "CURB",
  symbol: "CURB",
  chain: "Base",
  chainId: 8453,
  address: "0xf0CBbf0806eD88910a011eEc9439A990c8C24BA3",
  pool: "0x40b58969644445b40c98faa01bd64501c7819e49b2442f111834d9324f848943",
  launchTx: "0x965f29e08730ddff2b12a6d3f0477a367e99892c8cd96aea7aa4831a789af693",
  supply: "100,000,000,000",
  decimals: 18,
  source: "doppler",
  creatorSharePct: 95,
  protocolSharePct: 5,
  logo: "/assets/curb-sun.png",
  bankr: "https://bankr.bot/launches/0xf0CBbf0806eD88910a011eEc9439A990c8C24BA3",
  basescan: "https://basescan.org/token/0xf0CBbf0806eD88910a011eEc9439A990c8C24BA3",
  website: "https://curb.numetal.xyz",
};

/** Verified wallets — Bankr fee claimer + hub x402 + Numetal Labs ledger from numetal.xyz/fees. */
export const WALLETS = [
  {
    label: "goekhan Bankr (EVM)",
    note: "LP / creator fee claimer · 95% of trading-fee share (Bankr Doppler)",
    address: "0x8f49d4d782488e8576c8c54288027c57f4acf521",
    chain: "base",
  },
  {
    label: "Hub fee · Base (x402)",
    note: "CURB protocol fee recipient · AgentCash Base deposit",
    address: "0x3eee81B5b4cf1983b7DB36cf042B5d06c04F33eE",
    chain: "base",
  },
  {
    label: "Hub fee · Solana (x402)",
    note: "CURB protocol fee recipient · AgentCash Solana deposit",
    address: "2onXWK1M43AZHYbM7EFaLG7rhqZkt9JWxgGjZziq4tCg",
    chain: "solana",
  },
  {
    label: "Numetal Team",
    note: "Numetal Labs team allocation (same ledger as numetal.xyz/fees)",
    address: "0xB13Fb67859bC818a7b9Eb7f1380274492B6D648F",
    chain: "base",
  },
  {
    label: "Numetal Treasury",
    note: "Numetal Labs protocol treasury (same ledger as numetal.xyz/fees)",
    address: "0x3D9bB085b7E2fd15827d174f20375be385c121c0",
    chain: "base",
  },
];

function shortAddr(a) {
  if (!a) return "";
  if (a.length <= 13) return a;
  if (a.startsWith("0x")) return `${a.slice(0, 6)}…${a.slice(-4)}`;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

function explorerUrl(w) {
  if (w.chain === "solana") return `https://solscan.io/account/${w.address}`;
  return `https://basescan.org/address/${w.address}`;
}

function walletRows() {
  return WALLETS.map(
    (w) => `<div class="ldr">
  <span class="nm"><b>${w.label}</b><small>${w.note}</small></span>
  <a class="ad" href="${explorerUrl(w)}" target="_blank" rel="noopener" title="${w.address}">${shortAddr(w.address)}&nbsp;↗</a>
</div>`
  ).join("\n");
}

export function feesHtml(origin = ORIGIN_CANON, env = {}) {
  const feeBps = Math.max(0, Number(env.FEE_BPS ?? 500));
  const feePct = (feeBps / 100).toFixed(1);
  const t = CURB_TOKEN;
  const poolShort = shortAddr(t.pool);
  const tokenShort = shortAddr(t.address);
  const txShort = shortAddr(t.launchTx);

  return `<!DOCTYPE html>
<html lang="en" data-theme="dim">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CURB — token &amp; fees</title>
<meta name="description" content="CURB token on Base — address, pool, Bankr LP fee split (95% creator / 5% protocol), and hub x402 fee wallets."/>
<link rel="canonical" href="${origin}/fees"/>
<link rel="icon" href="/assets/curb-favicon-32.png" type="image/png"/>
<link rel="alternate" type="application/rss+xml" title="CURB" href="${origin}/feed.xml"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
${SHARED_CSS}
  .intro { text-align: center; padding: 0.5rem 0 0.25rem; }
  .eyebrow {
    font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--muted); margin: 0 0 0.75rem;
  }
  .sub { color: var(--muted); margin: 0.5rem auto 0; max-width: 36rem; font-size: 0.98rem; }
  .token-mark {
    display: inline-flex; align-items: center; gap: 0.65rem;
    font-family: var(--mono); font-size: 0.78rem; letter-spacing: 0.12em;
    text-transform: uppercase; margin-bottom: 0.85rem;
  }
  .token-mark img { width: 36px; height: 36px; display: block; }
  [data-theme="dim"] .token-mark img { filter: invert(1); }
  .nav {
    display: flex; flex-wrap: wrap; gap: 0.65rem 1rem;
    font-family: var(--mono); font-size: 0.78rem; margin: 1rem 0 0;
    justify-content: center;
  }
  .nav a { border: 1px solid var(--fg); padding: 0.4rem 0.65rem; text-decoration: none; }
  .nav a:hover { background: var(--fg); color: var(--bg); }
  .nav a.on { background: var(--fg); color: var(--bg); }
  .crt {
    max-width: 640px; margin: 1.25rem auto 1.5rem;
    background: var(--panel); border: 1.5px solid var(--fg);
    font-family: var(--mono); font-size: 0.82rem; color: var(--fg);
    box-shadow: 2px 2px 0 rgba(0,0,0,.35);
  }
  .crt .mast {
    display: flex; justify-content: space-between; align-items: center; gap: 10px;
    padding: 0.65rem 0.9rem; background: var(--fg); color: var(--bg);
  }
  .crt .mast .mt { font-weight: 600; letter-spacing: 0.06em; font-size: 0.75rem; }
  .crt .mast .lv {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.65rem; letter-spacing: 0.16em;
  }
  .dotp {
    width: 7px; height: 7px; border-radius: 50%; background: var(--bg);
    display: inline-block; animation: pulse 1.7s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
  .csec {
    display: flex; align-items: center; gap: 8px; padding: 0.45rem 0.9rem;
    background: var(--code-bg); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
    font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted);
    justify-content: space-between;
  }
  .csec .lab { display: flex; align-items: center; gap: 8px; }
  .csec .blk { font-size: 0.75rem; line-height: 1; color: var(--fg); }
  .csec .cnt { color: var(--muted); letter-spacing: 0.04em; text-transform: none; }
  .row {
    display: flex; align-items: center; gap: 8px;
    padding: 0.4rem 0.9rem; border-bottom: 1px solid var(--line);
  }
  .row .k {
    text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted);
    white-space: nowrap; font-size: 0.72rem;
  }
  .lead { flex: 1; border-bottom: 1px dotted var(--line); height: 10px; min-width: 12px; }
  .row .v { font-weight: 600; white-space: nowrap; text-align: right; }
  .row .v a { color: var(--fg); }
  .dwrap { padding: 0.65rem 0.9rem; border-bottom: 1px solid var(--line); }
  .dh {
    font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--muted); margin-bottom: 0.4rem;
  }
  .barx { display: flex; height: 22px; border: 1px solid var(--fg); }
  .seg {
    display: flex; align-items: center; justify-content: center;
    font-size: 0.65rem; color: var(--bg); font-weight: 600;
    white-space: nowrap; overflow: hidden;
    border-right: 1px solid rgba(255,255,255,.35);
  }
  .seg:last-child { border-right: 0; }
  .s-creator { background: var(--fg); color: var(--bg); flex: 95 0 0; }
  .s-protocol { background: var(--muted); color: var(--bg); flex: 5 0 0; }
  .s-seller { background: var(--fg); color: var(--bg); }
  .s-hub { background: var(--muted); color: var(--bg); }
  .ldr {
    display: flex; align-items: center; gap: 10px;
    padding: 0.55rem 0.9rem; border-bottom: 1px solid var(--line);
  }
  .ldr:last-child { border-bottom: 0; }
  .ldr .nm { display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
  .ldr .nm b { font-size: 0.78rem; color: var(--fg); font-weight: 600; }
  .ldr .nm small { font-size: 0.65rem; color: var(--muted); letter-spacing: 0.02em; }
  .ldr .ad {
    margin-left: auto; font-family: var(--mono); font-size: 0.68rem;
    color: var(--fg); white-space: nowrap; text-decoration: none;
  }
  .ldr .ad:hover { text-decoration: underline; }
  .cfoot {
    padding: 0.55rem 0.9rem; border-top: 1px solid var(--line);
    font-size: 0.68rem; color: var(--muted);
  }
  .cfoot a { color: var(--fg); }
  .how p { margin: 0 0 0.65rem; }
  .how p:last-child { margin-bottom: 0; }
  .links {
    display: flex; flex-wrap: wrap; gap: 0.5rem 0.85rem;
    font-family: var(--mono); font-size: 0.75rem; margin-top: 0.35rem;
  }
  .links a { color: var(--fg); }
  @media (max-width: 640px) {
    .crt { font-size: 0.75rem; }
    .row .k { font-size: 0.65rem; }
    .ldr { flex-wrap: wrap; }
    .ldr .ad { margin-left: 0; }
  }
</style>
${themeBootScript()}
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <a class="brand-mark" href="/" title="CURB home — agent↔agent inference swap">
      <img src="/assets/curb-sun.svg" alt="" width="22" height="22"/>
      <span>CURB</span>
    </a>
    <button type="button" class="theme-btn" id="theme-toggle" aria-label="Toggle light and dim theme">Light</button>
  </div>

  <header class="intro panel" style="border:0;background:transparent;padding:0.25rem 0 0">
    <div class="token-mark">
      <img src="${t.logo}" alt="CURB" width="36" height="36"/>
      <span>$CURB</span>
    </div>
    <p class="eyebrow">Token &amp; fees · Base · Bankr Doppler</p>
    <h1>Token &amp; fees.</h1>
    <p class="sub">CURB on Base — contract, pool, LP fee split, and the wallets that receive trading fees and hub x402 protocol fees.</p>
    <div class="nav" aria-label="Primary">
      <a href="/">Home</a>
      <a class="on" href="/fees" title="CURB token address, pool, and fee wallets">Token &amp; fees</a>
      <a href="/docs/" title="Diátaxis docs">docs</a>
      <a href="/newsletter" title="Newsletter">newsletter</a>
    </div>
  </header>

  <div class="crt" role="region" aria-label="CURB fee report">
    <div class="mast">
      <span class="mt">CURB · TOKEN &amp; FEES</span>
      <span class="lv"><span class="dotp" aria-hidden="true"></span>LIVE</span>
    </div>

    <div class="csec"><span class="lab"><span class="blk">█</span>Token</span><span class="cnt">Base · Doppler</span></div>
    <div class="row"><span class="k">Name</span><span class="lead"></span><span class="v">${t.name}</span></div>
    <div class="row"><span class="k">Ticker</span><span class="lead"></span><span class="v">$${t.symbol}</span></div>
    <div class="row"><span class="k">Chain</span><span class="lead"></span><span class="v">${t.chain} · ${t.chainId}</span></div>
    <div class="row"><span class="k">Address</span><span class="lead"></span><span class="v"><a href="${t.basescan}" target="_blank" rel="noopener">${tokenShort} ↗</a></span></div>
    <div class="row"><span class="k">Pool id</span><span class="lead"></span><span class="v" title="${t.pool}"><a href="${t.bankr}" target="_blank" rel="noopener">${poolShort} ↗</a></span></div>
    <div class="row"><span class="k">Launch tx</span><span class="lead"></span><span class="v"><a href="https://basescan.org/tx/${t.launchTx}" target="_blank" rel="noopener">${txShort} ↗</a></span></div>
    <div class="row"><span class="k">Total supply</span><span class="lead"></span><span class="v">${t.supply}</span></div>
    <div class="row"><span class="k">Decimals</span><span class="lead"></span><span class="v">${t.decimals}</span></div>

    <div class="csec"><span class="lab"><span class="blk">█</span>Distribution · LP trading fees</span><span class="cnt">Bankr verified</span></div>
    <div class="dwrap">
      <div class="dh">Creator / protocol share (immutable per launch)</div>
      <div class="barx" aria-label="95 percent creator, 5 percent protocol">
        <span class="seg s-creator">95% creator</span>
        <span class="seg s-protocol">5%</span>
      </div>
    </div>
    <div class="row"><span class="k">Creator claimer</span><span class="lead"></span><span class="v"><a href="https://basescan.org/address/0x8f49d4d782488e8576c8c54288027c57f4acf521" target="_blank" rel="noopener">0x8f49…f521 ↗</a></span></div>
    <div class="row"><span class="k">Source</span><span class="lead"></span><span class="v">Bankr · Doppler</span></div>

    <div class="csec"><span class="lab"><span class="blk">█</span>Distribution · hub swap fees</span><span class="cnt">x402 dual-payee</span></div>
    <div class="dwrap">
      <div class="dh">Each matched inference swap (seller + hub)</div>
      <div class="barx" aria-label="${(100 - Number(feePct)).toFixed(1)} percent seller, ${feePct} percent hub">
        <span class="seg s-seller" style="flex:${10000 - feeBps} 0 0">${(100 - Number(feePct)).toFixed(1)}% seller</span>
        <span class="seg s-hub" style="flex:${feeBps} 0 0">${feePct}% hub</span>
      </div>
    </div>
    <div class="row"><span class="k">Fee bps</span><span class="lead"></span><span class="v">${feeBps}</span></div>
    <div class="row"><span class="k">Rails</span><span class="lead"></span><span class="v">Base + Solana USDC</span></div>

    <div class="csec"><span class="lab"><span class="blk">█</span>Wallet ledger</span><span class="cnt">who is who</span></div>
    ${walletRows()}

    <div class="cfoot">
      Verified via <code>bankr fees --token</code> (share ${t.creatorSharePct}.00%) ·
      <a href="${t.bankr}" target="_blank" rel="noopener">Bankr launch ↗</a> ·
      <a href="${t.basescan}" target="_blank" rel="noopener">Basescan ↗</a>
    </div>
  </div>

  <section class="how">
    <h2>How fees work</h2>
    <p><strong>LP / trading fees.</strong> CURB launched on Bankr (Doppler) on Base. Creator fee share is <strong>${t.creatorSharePct}%</strong> to the goekhan Bankr EVM wallet; the remaining <strong>${t.protocolSharePct}%</strong> is the protocol/platform share. Claim via Bankr (<code>bankr fees claim ${t.address}</code> or the launch page).</p>
    <p><strong>Hub swap fees.</strong> On CURB inference matches, payment is dual-payee x402: seller wallet + hub fee (<strong>${feePct}%</strong>, min $0.001 USDC) on Base and/or Solana. Hub never holds upstream LLM keys.</p>
    <p class="muted">Studio team / treasury addresses below are the same Numetal Labs wallets published on <a href="https://numetal.xyz/fees" target="_blank" rel="noopener">numetal.xyz/fees</a> — not separate CURB-only EOAs.</p>
  </section>

  <section>
    <h2>Links</h2>
    <div class="links">
      <a href="${t.website}">Website</a>
      <a href="${t.basescan}" target="_blank" rel="noopener">Basescan token</a>
      <a href="${t.bankr}" target="_blank" rel="noopener">Bankr launch</a>
      <a href="https://basescan.org/tx/${t.launchTx}" target="_blank" rel="noopener">Launch tx</a>
      <a href="/docs/explanation/fees">Docs · fees</a>
      <a href="/.well-known/x402">.well-known/x402</a>
      <a href="https://numetal.xyz/fees" target="_blank" rel="noopener">Numetal fee engine</a>
    </div>
  </section>

  ${footerHtml()}
</div>
${themeToggleScript()}
</body>
</html>`;
}
