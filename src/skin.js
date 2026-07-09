/** Shared B&W skin for CURB HTML pages (landing, legal, newsletter). */

export const PRODUCT = "CURB";
export const CONTACT = "contact@numetal.xyz";
export const ORIGIN_CANON = "https://curb.numetal.xyz";

export function securityHeaders(extra = {}) {
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.gokhan.vc; base-uri 'self'; form-action 'self' https://api.gokhan.vc; frame-ancestors 'none'; object-src 'none'",
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
    origin === "https://curb.numetal.xyz" ||
    origin.endsWith(".workers.dev") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1");
  return {
    "Access-Control-Allow-Origin": allow ? origin || "https://curb.numetal.xyz" : "https://curb.numetal.xyz",
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
    font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--muted); margin: 1.25rem 0 0.65rem; font-weight: 500;
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
`;

export function themeBootScript() {
  return `<script>(function(){try{var t=localStorage.getItem("curb-theme");if(t==="light"||t==="dim")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>`;
}

export function themeToggleScript() {
  return `<script>(function(){var root=document.documentElement;var btn=document.getElementById("theme-toggle");if(!btn)return;function label(){btn.textContent=root.getAttribute("data-theme")==="light"?"Dim":"Light";}label();btn.addEventListener("click",function(){var next=root.getAttribute("data-theme")==="light"?"dim":"light";root.setAttribute("data-theme",next);try{localStorage.setItem("curb-theme",next);}catch(e){}label();});})();</script>`;
}

export function pageShell({ title, description, body, origin = ORIGIN_CANON }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dim">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
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
  ${footerHtml()}
</div>
${themeToggleScript()}
</body>
</html>`;
}

export function footerHtml() {
  return `<nav class="foot-nav" aria-label="Site">
  <a href="/fees" title="CURB token address, pool, and fee wallets">Token &amp; fees</a>
  <a href="/docs/" title="Diátaxis documentation — tutorials, how-to, explanation, reference">docs</a>
  <a href="/newsletter" title="Subscribe to CURB / Numetal estate newsletter">newsletter</a>
  <a href="/terms" title="Terms of Service for CURB">terms</a>
  <a href="/privacy" title="Privacy Policy for CURB">privacy</a>
  <a href="/llms.txt" title="Machine-readable site map for LLMs and agents">llms.txt</a>
  <a href="/sitemap.xml" title="XML sitemap of public CURB URLs">sitemap</a>
  <a href="/feed.xml" title="CURB RSS feed">feed.xml</a>
</nav>
<footer>
  CURB is a project of <a href="https://numetal.xyz" title="Numetal Labs — agent accelerator studio">Numetal Labs</a>
  by <a href="https://gokhan.vc" title="Atelier Gökhan Turhan VC — venture studio">Atelier Gökhan Turhan VC</a><br/>
  <a href="mailto:${CONTACT}" title="Public contact for Numetal / CURB">${CONTACT}</a>
  · product mail Curb &lt;curb@numetal.xyz&gt;
</footer>`;
}
