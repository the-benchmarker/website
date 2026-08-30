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

const STYLE = `
:root{--color-primary:#1c73bb;--color-border:lightgray;--color-muted:#5b6570}
*{box-sizing:border-box}
body{margin:0;padding:0 16px 25vh;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5}
.container{max-width:1100px;margin:0 auto}
a{color:var(--color-primary)}
h1,h2,h3{font-weight:300;line-height:1.2;margin:1.5rem 0 .5rem}
h1{font-size:2rem}h2{font-size:1.6rem}h3{font-size:1.3rem}
@media (width >= 1024px){h1{font-size:2.6rem}h2{font-size:2rem}h3{font-size:1.5rem}}
header{text-align:center;padding-top:16px}
.nav-links{list-style:none;padding:0;margin:8px 0}
.nav-links li{display:inline-block;margin:0 12px}
.nav-links a{text-decoration:none;font-size:1.1rem}
hr{border:0;border-top:1px solid var(--color-border);margin:24px 0}
nav.crumbs{font-size:.9rem;color:var(--color-muted);margin:16px 0}
.table-wrap{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:.95rem}
caption{text-align:left;padding:8px 0;color:var(--color-muted);font-size:.9rem}
th,td{border-bottom:1px solid var(--color-border);padding:6px 10px;text-align:right;white-space:nowrap}
th[scope=row],td:first-child,th:first-child{text-align:left}
thead th{border-bottom:2px solid var(--color-border);font-weight:600}
tbody tr:hover{background:#f5f8fb}
.muted{color:var(--color-muted)}
ul.grid{list-style:none;padding:0;display:grid;gap:4px 16px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
footer{margin-top:32px;font-size:.9rem;color:var(--color-muted)}
`.trim();

const NAV = `
<ul class="nav-links">
  <li><a href="/">Home</a></li>
  <li><a href="/result">Benchmark Results</a></li>
  <li><a href="/compare">Compare Frameworks</a></li>
  <li><a href="/frameworks/">Frameworks</a></li>
  <li><a href="https://github.com/the-benchmarker/web-frameworks">GitHub</a></li>
</ul>`.trim();

export const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(
    /</g,
    "\\u003c"
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
        : `<a href="${item.path}">${escapeHtml(item.name)}</a>`
    )
    .join(" &rsaquo; ")}</nav>`;

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
<link rel="icon" href="/favicon.ico">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Web Frameworks Benchmark">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${absolute(path)}">
<meta property="og:image" content="${absolute("/logo512.png")}">
<meta name="twitter:card" content="summary">
<style>${STYLE}</style>
${[breadcrumbs(trail), ...structured].join("\n")}
</head>
<body>
<header class="container">
<a href="/" style="text-decoration:none;color:inherit"><h1>Web Frameworks Benchmark</h1></a>
${NAV}
</header>
<hr>
<main class="container">
${crumbHtml(trail)}
${body}
</main>
<footer class="container">
<hr>
<p>Measured with <a href="https://github.com/wg/wrk">wrk</a> (8 threads, 8s timeout, 15s per run)
at concurrency ${CONCURRENCIES.join(", ")}, on ${escapeHtml(
  benchmark.hardware?.cpus ?? "?"
)} cores (${escapeHtml(
  benchmark.hardware?.cpu_name ?? "unknown CPU"
)}) running ${escapeHtml(benchmark.hardware?.os?.sysname ?? "Linux")}.
Data of ${escapeHtml(benchmark.updatedAtDate)}, from
<a href="https://github.com/the-benchmarker/web-frameworks">the-benchmarker/web-frameworks</a>.
Machine readable copies: <a href="/data.json">data.json</a>, <a href="/llms.txt">llms.txt</a>.</p>
</footer>
</body>
</html>
`;

// One row per metric, one column per concurrency level.
export const metricTable = (framework, caption) => `
<div class="table-wrap">
<table>
<caption>${escapeHtml(caption)}</caption>
<thead><tr><th scope="col">Metric</th>${CONCURRENCIES.map(
  (level) => `<th scope="col">Concurrency ${level}</th>`
).join("")}</tr></thead>
<tbody>
${METRICS.map(
  (metric) =>
    `<tr><th scope="row">${escapeHtml(metric.title)}</th>${CONCURRENCIES.map(
      (level) =>
        `<td>${escapeHtml(
          formatMetric(metric.kind, framework.levels[level][metric.key])
        )}</td>`
    ).join("")}</tr>`
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
      framework.label
    )}</a> <span class="muted">${escapeHtml(framework.version)}</span></th>
${
  showLanguage
    ? `<td><a href="${framework.language.path}">${escapeHtml(
        framework.language.label
      )}</a></td>`
    : ""
}
<td>${escapeHtml(
      formatMetric("rps", framework.levels[level].total_requests_per_s)
    )}</td>
<td>${escapeHtml(
      formatMetric("latency", framework.levels[level].percentile50)
    )}</td>
<td>${escapeHtml(
      formatMetric("latency", framework.levels[level].percentile99)
    )}</td>
<td>${escapeHtml(
      formatMetric("count", framework.levels[level].http_errors)
    )}</td>
</tr>`
  )
  .join("\n")}
</tbody>
</table>
</div>`;
