/** Shared B&W skin for CURB HTML pages (landing, legal, newsletter). */

export const PRODUCT = "CURB";
export const CONTACT = "contact@numetal.xyz";
export const ORIGIN_CANON = "https://curb.numetal.xyz";
export const API_ORIGIN_CANON = "https://api.curb.numetal.xyz";

/** True when this request is on the operator/admin host. Checked BEFORE isApiHost. */
export function isAdminHost(hostname) {
  const h = String(hostname || "").toLowerCase();
  return h === "admin.curb.numetal.xyz" || h.startsWith("admin.");
}

/** True when this request is on the dedicated API host (or a local/workers stand-in). */
export function isApiHost(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (isAdminHost(h)) return false;
  return h === "api.curb.numetal.xyz" || h.startsWith("api.");
}

/**
 * Public API origin for discovery / OpenAPI / skills.
 * Prefer the host being hit so x402scan resource URLs resolve (api.curb may lag DNS).
 * On the dedicated API host, always advertise the canonical API origin.
 */
export function publicApiOrigin(url) {
  const h = String(url?.hostname || "").toLowerCase();
  if (h === "api.curb.numetal.xyz") return API_ORIGIN_CANON;
  if (h === "curb.numetal.xyz") return ORIGIN_CANON;
  return url?.origin || ORIGIN_CANON;
}

/** Canonical marketing site origin. */
export function publicSiteOrigin(url) {
  const h = String(url?.hostname || "").toLowerCase();
  if (h === "api.curb.numetal.xyz" || h === "curb.numetal.xyz") return ORIGIN_CANON;
  return url?.origin || ORIGIN_CANON;
}

export function securityHeaders(extra = {}) {
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.gokhan.vc https://api.curb.numetal.xyz; base-uri 'self'; form-action 'self' https://api.gokhan.vc; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; object-src 'none'",
    ...extra,
  };
  for (const k of Object.keys(headers)) {
    if (headers[k] == null) delete headers[k];
  }
  return headers;
}

export function corsHeaders(request) {
  const origin = request?.headers?.get?.("Origin") || "";
  const allow =
    !origin ||
    origin === ORIGIN_CANON ||
    origin === API_ORIGIN_CANON ||
    origin.endsWith(".workers.dev") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1");
  return {
    "Access-Control-Allow-Origin": allow ? origin || ORIGIN_CANON : ORIGIN_CANON,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Payment, PAYMENT-SIGNATURE",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export const SHARED_CSS = `
  :root, [data-theme="dim"] {
    --bg: #121212; --fg: #e6e6e6; --muted: #8c8c8c; --line: #2a2a2a;
    --panel: #1a1a1a; --code-bg: #0e0e0e;
    --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
    --sans: "IBM Plex Sans", system-ui, sans-serif;
  }
  [data-theme="light"] {
    --bg: #f4f4f4; --fg: #141414; --muted: #666; --line: #d4d4d4;
    --panel: #fff; --code-bg: #ececec;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font-family: var(--sans); line-height: 1.45;
    font-variant-numeric: tabular-nums;
    background-image:
      linear-gradient(var(--line) 1px, transparent 1px),
      linear-gradient(90deg, var(--line) 1px, transparent 1px);
    background-size: 48px 48px; background-position: -1px -1px;
  }
  a { color: var(--fg); text-underline-offset: 3px; }
  .wrap { max-width: 920px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; }
  .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  .brand-mark {
    display: inline-flex; align-items: center; gap: 0.55rem;
    font-family: var(--mono); font-size: 0.78rem; letter-spacing: 0.14em;
    text-transform: uppercase; text-decoration: none; color: var(--fg);
  }
  .brand-mark img { width: 22px; height: 22px; display: block; }
  [data-theme="dim"] .brand-mark img { filter: invert(1); }
  .theme-btn {
    font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
    background: var(--panel); border: 1px solid var(--line);
    padding: 0.4rem 0.7rem; cursor: pointer;
  }
  .theme-btn:hover { color: var(--fg); border-color: var(--fg); }
  section, article, .panel {
    border: 1px solid var(--line); background: var(--panel);
    padding: 1.25rem; margin-bottom: 1rem;
  }
  h1 {
    font-family: var(--mono); font-size: clamp(1.4rem, 3.5vw, 2rem);
    letter-spacing: -0.04em; margin: 0 0 0.75rem; font-weight: 600;
  }
  h2 {
    font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--fg); margin: 1.25rem 0 0.65rem; font-weight: 600;
    display: flex; justify-content: space-between; align-items: baseline; gap: 1rem;
    border-bottom: 2px solid var(--fg); padding-bottom: 0.3rem;
  }
  h2 .sec-no { color: var(--muted); font-weight: 400; letter-spacing: 0.14em; white-space: nowrap; }
  /* ── Document furniture — masthead / spec grid / doc tables / colophon ── */
  .masthead {
    border: 2px solid var(--fg); background: var(--panel);
    padding: 0; margin-bottom: 1rem;
  }
  .mast-row {
    display: flex; flex-wrap: wrap; justify-content: space-between;
    border-bottom: 1px solid var(--line);
  }
  .masthead > .mast-row:last-child, .masthead > .mast-title:last-child { border-bottom: 0; }
  .mast-cell {
    font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--muted);
    padding: 0.45rem 0.9rem; border-right: 1px solid var(--line); flex: 1 1 auto;
  }
  .mast-cell:last-child { border-right: 0; }
  .mast-cell b { color: var(--fg); font-weight: 600; }
  .mast-title { padding: 1.15rem 0.95rem 1.25rem; border-bottom: 1px solid var(--line); }
  .mast-title h1 { margin: 0.45rem 0 0.75rem; }
  .mast-sub {
    font-family: var(--mono); font-size: 0.66rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--muted); margin: 0;
  }
  .stamp {
    display: inline-block; border: 2px solid var(--fg); padding: 0.3rem 0.7rem;
    font-family: var(--mono); font-size: 0.64rem; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--fg);
    transform: rotate(-1.6deg); margin: 0.85rem 0 0.25rem;
  }
  .spec-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    border: 2px solid var(--fg); background: var(--panel); margin: 1rem 0;
  }
  .spec-cell { border: 1px solid var(--line); min-height: 5.2rem; padding: 0.6rem 0.8rem; }
  .spec-cell .k {
    display: block; font-family: var(--mono); font-size: 0.62rem;
    letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted);
    margin-bottom: 0.35rem;
  }
  /* tabular figures so a readout swapping between a count and "—" holds its width */
  .spec-cell b { display: block; font-family: var(--mono); font-size: 1.08rem; font-variant-numeric: tabular-nums; }
  .spec-cell small { display: block; font-size: 0.68rem; color: var(--muted); margin-top: 0.3rem; }
  .tblwrap { overflow-x: auto; }
  table.doc { width: 100%; border-collapse: collapse; font-family: var(--mono); font-size: 0.78rem; border: 1px solid var(--fg); }
  table.doc th, table.doc td { border: 1px solid var(--line); padding: 0.45rem 0.6rem; text-align: left; vertical-align: top; }
  table.doc th {
    background: var(--code-bg); color: var(--muted); font-weight: 500;
    font-size: 0.64rem; letter-spacing: 0.16em; text-transform: uppercase;
  }
  table.doc th.num, table.doc td.num { text-align: right; white-space: nowrap; }
  pre {
    font-family: var(--mono); font-size: 0.78rem; line-height: 1.6;
    background: var(--code-bg); border: 1px solid var(--line);
    padding: 0.9rem 1rem; overflow-x: auto; margin: 0.5rem 0 1rem;
  }
  pre code, article.post pre code {
    background: transparent; border: 0; padding: 0; font-size: inherit;
  }
  .perf {
    height: 10px; margin: 2rem 0 0.9rem;
    background: repeating-linear-gradient(90deg, var(--fg) 0 6px, transparent 6px 12px);
  }
  .colophon {
    display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.35rem 1.5rem;
    border-top: 2px solid var(--fg); padding-top: 0.55rem; margin-top: 0.9rem;
    font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--muted);
  }
  p { margin: 0 0 0.75rem; }
  p:last-child { margin-bottom: 0; }
  .muted { color: var(--muted); }
  .foot-nav {
    display: flex; flex-wrap: wrap; gap: 0.55rem 0.9rem;
    font-family: var(--mono); font-size: 0.72rem; margin: 1rem 0 0.75rem;
  }
  .foot-nav a { color: var(--muted); }
  .foot-nav a:hover { color: var(--fg); }
  footer {
    margin-top: 1.5rem; font-family: var(--mono); font-size: 0.72rem; color: var(--muted);
  }
  footer a { color: var(--muted); }
  footer a:hover { color: var(--fg); }
  form { display: grid; gap: 0.75rem; max-width: 28rem; }
  .cf-turnstile, .cf-turnstile iframe { display: block; width: 100%; max-width: 100%; }
  input[type="email"] {
    font-family: var(--mono); font-size: 0.9rem; padding: 0.65rem 0.75rem;
    border: 1px solid var(--line); background: var(--code-bg); color: var(--fg);
  }
  button[type="submit"], .btn {
    font-family: var(--mono); font-size: 0.78rem; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 0.55rem 0.85rem;
    border: 1px solid var(--fg); background: transparent; color: var(--fg); cursor: pointer;
  }
  button[type="submit"]:hover, .btn:hover { background: var(--fg); color: var(--bg); }
  .post-list { list-style: none; padding: 0; margin: 0; }
  .post-list li { border-bottom: 1px solid var(--line); padding: 0.85rem 0; }
  .post-list a { font-family: var(--mono); text-decoration: none; }
  .post-list a:hover { text-decoration: underline; }
  .meta { font-family: var(--mono); font-size: 0.68rem; color: var(--muted); letter-spacing: 0.06em; }
  article.post h1 { margin-bottom: 0.5rem; }
  article.post .lede { font-size: 1.05rem; color: var(--fg); margin-bottom: 1.1rem; }
  /* Reading scale, calibrated 2026-08-01 against a LessWrong post body
     (18.2px / 26px / 682px / 81ch). Dispatch prose inherited the body size and
     ran the full .wrap width (920px), which measures well past 100ch — the
     single worst measure in the estate. Cap it and size it for reading. */
  article.post p,
  article.post li { font-size: 18px; line-height: 1.6; max-width: 72ch; }
  article.post p { margin: 0 0 1em; }
  article.post li { margin: 0 0 0.7em; }
  article.post ul,
  article.post ol { max-width: 72ch; }
  article.post h2 {
    font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--fg); margin: 1.6rem 0 0.65rem;
    border-bottom: 2px solid var(--fg); padding-bottom: 0.3rem; font-weight: 600;
  }
  article.post h1[id] {
    font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--fg); margin: 1.6rem 0 0.65rem;
    border-bottom: 2px solid var(--fg); padding-bottom: 0.3rem; font-weight: 600;
    line-height: 1.45;
  }
  article.post ol.flow, article.post ul.live {
    margin: 0 0 0.85rem; padding-left: 1.2rem;
  }
  article.post ol.flow li, article.post ul.live li { margin: 0.35rem 0; }
  article.post code {
    font-family: var(--mono); font-size: 0.85em;
    background: var(--code-bg); padding: 0.1em 0.35em; border: 1px solid var(--line);
  }
  article.post .sign { margin-top: 1.5rem; font-family: var(--mono); font-size: 0.85rem; }
  .blog-cards { display: flex; flex-direction: column; gap: 1rem; margin: 0 0 1rem; }
  .blog-card {
    display: block; border: 1px solid var(--line); background: var(--panel);
    text-decoration: none; color: var(--fg); overflow: hidden;
  }
  .blog-card:hover { border-color: var(--fg); }
  .blog-card-og {
    display: block; width: 100%; height: auto; aspect-ratio: 5 / 2;
    object-fit: cover; border-bottom: 1px solid var(--line); background: var(--code-bg);
  }
  .blog-card-body { padding: 1.1rem 1.2rem 1.25rem; }
  .blog-card-title {
    font-family: var(--mono); font-size: 1.15rem; letter-spacing: -0.03em;
    margin: 0.35rem 0 0.5rem; font-weight: 600; text-transform: none;
    color: var(--fg); display: block; border-bottom: 0; padding-bottom: 0;
  }
  .blog-card-excerpt { margin: 0 0 0.75rem; color: var(--muted); font-size: 0.95rem; }
  .blog-card-more {
    font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--fg);
  }
`;

/** House revision mark for document furniture (masthead + colophon). */
export const DOC_REV = "2026-07-17";

/**
 * Top meta strip of a document masthead: org · doc no + rev · status.
 * Text is uppercased by CSS — write normal case here.
 *
 * `status` has NO default on purpose. It used to default to "In service", which
 * meant any masthead that forgot to state a status silently asserted one, and that
 * assertion could never come out false. A caller that says nothing now renders "—":
 * the cell, its label and its position all survive, but the page stops claiming a
 * state nobody declared. Callers with a real state pass it — "In force" (legal),
 * "Filed" (dispatch), "Demo / reference" (harness) are all disclosures worth keeping.
 */
export function mastRowsHtml(docNo, { rev = DOC_REV, status, org = "Numetal Labs · Engineering Bureau" } = {}) {
  const state = status == null || status === "" ? "—" : status;
  return `<div class="mast-row">
      <span class="mast-cell">${org}</span>
      <span class="mast-cell"><b>Doc ${docNo}</b> · Rev ${rev}</span>
      <span class="mast-cell">Status: ${state}</span>
    </div>`;
}

/**
 * Full document masthead box: meta row, title block (subtitle + h1 + body + stamp),
 * optional bottom meta row. `body` is trusted HTML (lede/nav from our own templates).
 */
export function mastheadHtml({ docNo, rev, status, org, sub, title, body = "", stamp, bottom = [] }) {
  const bottomRow = bottom.length
    ? `<div class="mast-row">${bottom.map((c) => `<span class="mast-cell">${c}</span>`).join("")}</div>`
    : "";
  return `<header class="masthead">
    ${mastRowsHtml(docNo, { rev, status, org })}
    <div class="mast-title">
      ${sub ? `<p class="mast-sub">${sub}</p>` : ""}
      ${title ? `<h1>${title}</h1>` : ""}
      ${body}
      ${stamp ? `<span class="stamp">${stamp}</span>` : ""}
    </div>
    ${bottomRow}
  </header>`;
}

/** Perforation bar + colophon — the closing furniture of every page. */
export function docColophonHtml(doc = {}) {
  const no = doc.no || "CB-000";
  const rev = doc.rev || DOC_REV;
  const note = doc.note || `Filed at curb.numetal.xyz · ${CONTACT}`;
  return `<div class="perf" role="presentation" aria-hidden="true"></div>
<div class="colophon"><span>Numetal Labs · CURB · Doc ${no} · Rev ${rev}</span><span>${note}</span></div>`;
}

export function themeBootScript() {
  return `<script>(function(){try{var t=null;try{var m=document.cookie.match(/(?:^|; )curb-theme=(light|dim)(?:;|$)/);if(m)t=m[1];}catch(e){}if(!t){try{t=localStorage.getItem("curb-theme");}catch(e){}}if(t==="light"||t==="dim")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>`;
}

export function themeToggleScript() {
  return `<script>(function(){var root=document.documentElement;var btn=document.getElementById("theme-toggle");if(!btn)return;function label(){btn.textContent=root.getAttribute("data-theme")==="light"?"Dim":"Light";}function persist(v){try{localStorage.setItem("curb-theme",v);}catch(e){}try{var host=location.hostname;var domain=host==="curb.numetal.xyz"||host.endsWith(".curb.numetal.xyz")?"; domain=.curb.numetal.xyz":"";document.cookie="curb-theme="+v+"; path=/; max-age=31536000; SameSite=Lax"+domain;}catch(e){}}label();btn.addEventListener("click",function(){var next=root.getAttribute("data-theme")==="light"?"dim":"light";root.setAttribute("data-theme",next);persist(next);label();});})();</script>`;
}

export function pageShell({
  title,
  description,
  body,
  origin = ORIGIN_CANON,
  canonical,
  ogImage,
  ogWidth = 1500,
  ogHeight = 600,
  doc,
}) {
  const canon = canonical || origin;
  const og = ogImage
    ? `<meta property="og:image" content="${ogImage}"/>
<meta property="og:image:type" content="image/png"/>
<meta property="og:image:width" content="${ogWidth}"/>
<meta property="og:image:height" content="${ogHeight}"/>
<meta property="og:image:alt" content="${title}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:image" content="${ogImage}"/>`
    : "";
  return `<!DOCTYPE html>
<html lang="en" data-theme="dim">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<link rel="canonical" href="${canon}"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:url" content="${canon}"/>
<meta property="og:type" content="article"/>
${og}
<link rel="icon" href="/assets/curb-favicon-32.png" type="image/png"/>
<link rel="alternate" type="application/rss+xml" title="CURB" href="${origin}/feed.xml"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>${SHARED_CSS}</style>
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
  ${body}
  ${footerHtml(doc)}
</div>
${themeToggleScript()}
</body>
</html>`;
}

export function footerHtml(doc) {
  return `<nav class="foot-nav" aria-label="Site">
  <a href="/fees" title="CURB token address, pool, and fee wallets">Token &amp; fees</a>
  <a href="/deck" title="CURB pitch deck — 15 slides, hosted + PDF">deck</a>
  <a href="/dispatch" title="CURB dispatches">dispatch</a>
  <a href="/docs/" title="Diátaxis documentation — tutorials, how-to, explanation, reference">docs</a>
  <a href="/newsletter" title="Subscribe to CURB / Numetal estate newsletter">newsletter</a>
  <a href="/terms" title="Terms of Service for CURB">terms</a>
  <a href="/privacy" title="Privacy Policy for CURB">privacy</a>
  <a href="/llms.txt" title="Machine-readable site map for LLMs and agents">llms.txt</a>
  <a href="/sitemap.xml" title="XML sitemap of public CURB URLs">sitemap</a>
  <a href="/feed.xml" title="CURB RSS feed">feed.xml</a>
  <a href="https://status.numetal.xyz" title="Numetal / CURB public status">Status</a>
</nav>
<footer>
  CURB is a project of <a href="https://numetal.xyz" title="Numetal Labs — agent accelerator studio">Numetal Labs</a>
  by <a href="https://gokhan.vc" title="Gökhan Ventures — venture studio">Gökhan Ventures</a><br/>
  <a href="mailto:${CONTACT}" title="Public contact for Numetal / CURB">${CONTACT}</a>
  · product mail Curb &lt;curb@numetal.xyz&gt;
</footer>
${docColophonHtml(doc)}`;
}
