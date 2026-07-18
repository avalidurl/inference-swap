/** CURB dim/light theme — matches curb.numetal.xyz landing (`src/skin.js`). */

export const THEME_CSS = `
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
  font-family: var(--sans); line-height: 1.55;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 48px 48px; background-position: -1px -1px;
}
a { color: var(--fg); text-underline-offset: 3px; }
.theme-btn {
  font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--muted);
  background: var(--panel); border: 1px solid var(--line);
  padding: 0.4rem 0.7rem; cursor: pointer;
}
.theme-btn:hover { color: var(--fg); border-color: var(--fg); }
/* Document furniture — masthead strip, perforation bar, colophon */
.mast-strip {
  display: flex; flex-wrap: wrap; border: 2px solid var(--fg); background: var(--panel);
  margin: 0 0 1rem; font-family: var(--mono); font-size: 0.62rem;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted);
}
.mast-strip span { padding: 0.45rem 0.9rem; border-right: 1px solid var(--line); flex: 1 1 auto; }
.mast-strip span:last-child { border-right: 0; }
.mast-strip b { color: var(--fg); font-weight: 600; }
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
`;

/** House revision mark for document furniture. */
export const DOC_REV = "2026-07-17";

/** Masthead meta strip: org · doc no + rev · status. */
export function mastStrip(docNo: string, status = "Demo / reference"): string {
  return `<div class="mast-strip"><span>Numetal Labs · Engineering Bureau</span><span><b>Doc ${docNo}</b> · Rev ${DOC_REV}</span><span>Status: ${status}</span></div>`;
}

/** Perforation bar + colophon — closing furniture of every page. */
export function docColophon(docNo: string, filedAt: string): string {
  return `<div class="perf" role="presentation" aria-hidden="true"></div>
<div class="colophon"><span>Numetal Labs · CURB · Doc ${docNo} · Rev ${DOC_REV}</span><span>Filed at ${filedAt} · contact@numetal.xyz</span></div>`;
}

/** Boot before paint: cookie (cross-subdomain) then localStorage. */
export function themeBootScript(): string {
  return `<script>(function(){try{var t=null;try{var m=document.cookie.match(/(?:^|; )curb-theme=(light|dim)(?:;|$)/);if(m)t=m[1];}catch(e){}if(!t){try{t=localStorage.getItem("curb-theme");}catch(e){}}if(t==="light"||t==="dim")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>`;
}

/** Toggle writes localStorage + Domain=.curb.numetal.xyz cookie. */
export function themeToggleScript(): string {
  return `<script>(function(){var root=document.documentElement;var btn=document.getElementById("theme-toggle");if(!btn)return;function label(){btn.textContent=root.getAttribute("data-theme")==="light"?"Dim":"Light";}function persist(v){try{localStorage.setItem("curb-theme",v);}catch(e){}try{var host=location.hostname;var domain=host==="curb.numetal.xyz"||host.endsWith(".curb.numetal.xyz")?"; domain=.curb.numetal.xyz":"";document.cookie="curb-theme="+v+"; path=/; max-age=31536000; SameSite=Lax"+domain;}catch(e){}}label();btn.addEventListener("click",function(){var next=root.getAttribute("data-theme")==="light"?"dim":"light";root.setAttribute("data-theme",next);persist(next);label();});})();</script>`;
}

export function themeToggleButton(): string {
  return `<button type="button" class="theme-btn" id="theme-toggle" aria-label="Toggle light and dim theme">Light</button>`;
}
