// Templates for the static pages. They are plain HTML on purpose: crawlers and
// LLM readers get the numbers without running the app bundle.
import { CONCURRENCIES, METRICS } from "./data.mjs";

// Same default as src/common/site.ts. Both hosts serve the same build, so the
// canonical host has to be pinned rather than read off window.location.
export const SITE_URL = (
  process.env.VITE_SITE_URL || "https://web-frameworks-benchmark.vercel.app"
).replace(/\/$/, "");

export const absolute = (path) => `${SITE_URL}${path}`;

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const thousands = (value) =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const bytes = (value) => {
  const units = ["B", "kB", "MB", "GB", "TB"];
  let index = 0;
  let size = value;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }
  return `${size.toFixed(index ? 2 : 0)} ${units[index]}`;
};

// Latencies are stored in seconds, the app shows them in milliseconds.
export const formatMetric = (kind, value) => {
  if (value == null || Number.isNaN(value)) return "n/a";
  if (kind === "latency") return `${(value * 1000).toFixed(2)} ms`;
  if (kind === "bytes") return bytes(value);
  return thousands(value);
};

export const STYLE = `
:root{--color-primary:#087f72;--color-border:#dfe5e9;--color-muted:#526273;--color-text:#152333;--color-surface:#fff;color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:#f7f8fa;color:var(--color-text);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;line-height:1.65}
.container{width:min(1240px,calc(100% - 64px));margin:0 auto}
a{color:var(--color-primary);text-underline-offset:3px}
a:hover{color:#065f56}
a:focus-visible,.table-wrap:focus-visible{outline:3px solid var(--color-primary);outline-offset:4px}
h1,h2,h3{font-weight:650;line-height:1.2;letter-spacing:-.035em}
h1{font-size:clamp(2.1rem,4vw,3.5rem);max-width:1000px;margin:0 0 20px}
h2{font-size:1.45rem;margin:40px 0 18px}h3{font-size:1.15rem;margin:24px 0 14px}
p{margin:0 0 20px}
.site-header{background:var(--color-surface);border-bottom:1px solid var(--color-border)}
.header-inner{min-height:80px;display:flex;align-items:center;justify-content:space-between;gap:32px}
.brand{display:inline-flex;align-items:center;gap:11px;font-size:1.25rem;font-weight:750;letter-spacing:-.055em;white-space:nowrap;color:var(--color-text);text-decoration:none}
.brand-period{color:var(--color-primary)}
.brand-mark{display:flex;align-items:flex-end;gap:3px;width:25px;height:25px}
.brand-mark i{width:6px;background:var(--color-primary);border-radius:2px}
.brand-mark i:nth-child(1){height:11px}.brand-mark i:nth-child(2){height:18px}.brand-mark i:nth-child(3){height:25px}
.nav-links{display:flex;flex-wrap:wrap;align-items:center;gap:8px;list-style:none;padding:0;margin:0}
.nav-links a{display:block;padding:8px 12px;color:var(--color-muted);font-size:.85rem;font-weight:550;text-decoration:none;border-radius:6px}
.nav-links a:hover,.nav-links a[aria-current=page]{color:var(--color-primary);background:#e9f4f1}
.github-link{display:flex;align-items:center;gap:9px;color:var(--color-text);font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap}.github-link svg{width:17px;height:17px}.github-link>span{color:var(--color-muted)}
.skip-link{position:fixed;top:12px;left:12px;z-index:5;transform:translateY(-180%);background:#fff;padding:10px 16px;border:1px solid var(--color-primary);border-radius:6px}
.skip-link:focus{transform:translateY(0)}
main{padding:32px 0 64px}
nav.crumbs{display:flex;flex-wrap:wrap;gap:9px;font-size:.8rem;color:var(--color-muted);margin:0 0 32px}
nav.crumbs a{text-decoration:none}
.eyebrow{display:block;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--color-primary);font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;margin:0 0 15px}
.lead{max-width:860px;color:var(--color-muted);font-size:1.05rem;line-height:1.8}
.facts{display:flex;flex-wrap:wrap;gap:8px 24px;list-style:none;padding:18px 22px;border:1px solid var(--color-border);border-radius:8px;background:#fff;font-size:.85rem;margin:24px 0}
.table-wrap{overflow-x:auto;margin:24px 0;border:1px solid var(--color-border);border-radius:9px;background:var(--color-surface)}
table{border-collapse:collapse;width:100%;font-size:.85rem}
caption{text-align:left;padding:16px 20px;color:var(--color-muted);font-size:.8rem;background:var(--color-surface)}
th,td{border-bottom:1px solid var(--color-border);padding:13px 18px;text-align:right;white-space:nowrap}
td{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.8rem;font-variant-numeric:tabular-nums}
th[scope=row],td:first-child,th:first-child{text-align:left}
thead th{background:#f8fafb;color:var(--color-muted);font-size:.72rem;font-weight:600}
tbody th{font-weight:600}tbody th a{text-decoration:none;color:var(--color-text)}
tbody th .muted{font-size:.7rem;font-weight:400;margin-left:6px}
tbody tr:last-child>*{border-bottom:0}tbody tr:hover{background:#f3faf8}
.muted{color:var(--color-muted)}
ul.grid{list-style:none;padding:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
ul.grid a{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 20px;background:#fff;border:1px solid var(--color-border);border-radius:8px;font-size:.9rem;font-weight:600;text-decoration:none;color:var(--color-text)}
ul.grid a:hover{border-color:var(--color-primary);background:#f2faf7}
ul.grid .muted{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.75rem;font-weight:400}
.button-link{display:inline-flex;align-items:center;gap:12px;background:var(--color-primary);padding:11px 17px;border-radius:6px;color:#fff;font-size:.8rem;font-weight:600;text-decoration:none}.button-link:hover{background:#065f56;color:#fff}
.method-note{padding:20px 24px;background:#edf4f2;border-left:3px solid var(--color-primary);border-radius:0 6px 6px 0;font-size:.85rem;color:#465960;margin:32px 0}
pre{margin:0 0 32px;padding:14px 18px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.78rem;white-space:pre-wrap;overflow-wrap:anywhere}
footer{border-top:1px solid var(--color-border);padding:28px 0 40px;font-size:.78rem;color:var(--color-muted)}
footer p{max-width:1000px;margin:0}
@media(max-width:800px){.container{width:calc(100% - 40px)}.header-inner{min-height:unset;flex-wrap:wrap;padding:20px 0;gap:16px}.header-inner nav{order:3;width:100%}.nav-links{gap:2px;margin-left:-10px}.nav-links a{padding:7px 10px;font-size:.8rem}main{padding-top:24px}.facts{display:block}.facts li+li{margin-top:7px}th,td{padding:12px}.table-wrap{margin:20px 0}h1{overflow-wrap:anywhere}}
@media(max-width:520px){.brand{font-size:19px}.github-link{font-size:11px}}
@media(prefers-reduced-motion:no-preference){a{transition:background-color .15s,color .15s,border-color .15s}}
`.trim();

const NAV = `
<nav aria-label="Main navigation"><ul class="nav-links">
  <li><a href="/">Overview</a></li>
  <li><a href="/result">Results</a></li>
  <li><a href="/compare">Compare</a></li>
  <li><a href="/frameworks/" aria-current="page">Frameworks</a></li>
</ul></nav>`.trim();

export const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(
    /</g,
    "\\u003c",
  )}</script>`;

export const breadcrumbs = (trail) =>
  jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  });

const crumbHtml = (trail) =>
  `<nav class="crumbs" aria-label="Breadcrumb">${trail
    .map((item, index) =>
      index === trail.length - 1
        ? `<span aria-current="page">${escapeHtml(item.name)}</span>`
        : `<a href="${item.path}">${escapeHtml(item.name)}</a>`,
    )
    .join(' <span aria-hidden="true">/</span> ')}</nav>`;

export const page = ({
  title,
  description,
  path,
  trail,
  structured = [],
  body,
  benchmark,
}) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${absolute(path)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="theme-color" content="#087f72">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Benchmarker">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${absolute(path)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<style>${STYLE}</style>
${[breadcrumbs(trail), ...structured].join("\n")}
</head>
<body>
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header"><div class="container header-inner">
<a href="/" class="brand" aria-label="The Benchmarker home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>the benchmarker<span class="brand-period">.</span></span></a>
${NAV}
<a class="github-link" href="https://github.com/the-benchmarker/website" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.08c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.62 1.22 3.26.94.1-.73.39-1.22.71-1.5-2.5-.28-5.12-1.25-5.12-5.54 0-1.22.43-2.22 1.15-3-.12-.29-.5-1.42.11-2.96 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.61 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.54.23 2.67.11 2.95.72.79 1.15 1.79 1.15 3.01 0 4.3-2.62 5.25-5.13 5.53.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z"/></svg>GitHub <span aria-hidden="true">&nearr;</span></a>
</div></header>
<main class="container" id="main-content">
${crumbHtml(trail)}
${body}
</main>
<footer><div class="container">
<p>Measured with <a href="https://zoxy.io/zrk/">zrk</a> (8 threads, 8s timeout, 15s per run)
at concurrency ${CONCURRENCIES.join(", ")}, on ${escapeHtml(
  benchmark.hardware?.cpus ?? "?",
)} cores (${escapeHtml(
  benchmark.hardware?.cpu_name ?? "unknown CPU",
)}) running ${escapeHtml(benchmark.hardware?.os?.sysname ?? "Linux")}.
Data of ${escapeHtml(benchmark.updatedAtDate)}, from
<a href="https://github.com/the-benchmarker/web-frameworks">the-benchmarker/web-frameworks</a>.
Machine readable copies: <a href="/data.json">data.json</a>, <a href="/llms.txt">llms.txt</a>.</p>
</div></footer>
</body>
</html>
`;

// One row per metric, one column per concurrency level.
export const metricTable = (framework, caption) => `
<div class="table-wrap">
<table>
<caption>${escapeHtml(caption)}</caption>
<thead><tr><th scope="col">Metric</th>${CONCURRENCIES.map(
  (level) => `<th scope="col">Concurrency ${level}</th>`,
).join("")}</tr></thead>
<tbody>
${METRICS.map(
  (metric) =>
    `<tr><th scope="row">${escapeHtml(metric.title)}</th>${CONCURRENCIES.map(
      (level) =>
        `<td>${escapeHtml(
          formatMetric(metric.kind, framework.levels[level][metric.key]),
        )}</td>`,
    ).join("")}</tr>`,
).join("\n")}
</tbody>
</table>
</div>`;

// One row per framework, ranked on requests per second.
export const rankingTable = ({
  frameworks,
  caption,
  level = 64,
  rankField = "rank",
  showLanguage = true,
}) => `
<div class="table-wrap">
<table>
<caption>${escapeHtml(caption)}</caption>
<thead><tr>
<th scope="col">#</th>
<th scope="col">Framework</th>
${showLanguage ? '<th scope="col">Language</th>' : ""}
<th scope="col">Requests / second</th>
<th scope="col">P50 latency</th>
<th scope="col">P99 latency</th>
<th scope="col">HTTP errors</th>
</tr></thead>
<tbody>
${frameworks
  .map(
    (framework) => `<tr>
<td>${framework[rankField][level]}</td>
<th scope="row"><a href="${framework.path}">${escapeHtml(
      framework.label,
    )}</a> <span class="muted">${escapeHtml(framework.version)}</span></th>
${
  showLanguage
    ? `<td><a href="${framework.language.path}">${escapeHtml(
        framework.language.label,
      )}</a></td>`
    : ""
}
<td>${escapeHtml(
      formatMetric("rps", framework.levels[level].total_requests_per_s),
    )}</td>
<td>${escapeHtml(
      formatMetric("latency", framework.levels[level].percentile50),
    )}</td>
<td>${escapeHtml(
      formatMetric("latency", framework.levels[level].percentile99),
    )}</td>
<td>${escapeHtml(
      formatMetric("count", framework.levels[level].http_errors),
    )}</td>
</tr>`,
  )
  .join("\n")}
</tbody>
</table>
</div>`;
