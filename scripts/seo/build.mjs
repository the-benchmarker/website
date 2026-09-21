// Post build step. The app is a single page bundle, so search engines and LLM
// crawlers see an empty <div id="root"> and nothing else. This writes a static,
// no-JavaScript page for every framework and every language next to the bundle,
// plus the usual robots/sitemap/llms files.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CONCURRENCIES, METRICS, loadBenchmark } from "./data.mjs";
import {
  SITE_URL,
  absolute,
  escapeHtml,
  formatMetric,
  jsonLd,
  metricTable,
  page,
  rankingTable,
  STYLE,
} from "./render.mjs";

const DIST = fileURLToPath(new URL("../../dist/", import.meta.url));

// Every metric goes in the table, only these go in the structured data.
const HEADLINE_METRICS = METRICS.filter((metric) =>
  [
    "total_requests_per_s",
    "percentile50",
    "percentile99",
    "average_latency",
  ].includes(metric.key),
);

const written = [];

const write = async (path, content) => {
  const file = join(DIST, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
  written.push(path);
};

const home = { name: "Home", path: "/" };
const hub = { name: "Frameworks", path: "/frameworks/" };

const summary = (framework) => {
  const level = CONCURRENCIES[0];
  return (
    `${framework.label} ${framework.version} is a ${framework.language.label} web framework. ` +
    `At concurrency ${level} it serves ${formatMetric(
      "rps",
      framework.levels[level].total_requests_per_s,
    )} requests per second with a P50 latency of ${formatMetric(
      "latency",
      framework.levels[level].percentile50,
    )}, ranking ${framework.rank[level]} of ${framework.totalCount} overall and ` +
    `${framework.languageRank[level]} of ${framework.language.frameworks.length} among ` +
    `${framework.language.label} frameworks.`
  );
};

const frameworkPage = (framework, benchmark) => {
  const trail = [
    home,
    hub,
    { name: framework.language.label, path: framework.language.path },
    { name: framework.label, path: framework.path },
  ];

  const peers = framework.language.frameworks
    .filter((f) => f !== framework)
    .slice(0, 10);

  const body = `
<span class="eyebrow">HTTP server &amp; framework benchmarks</span>
<h1>${escapeHtml(framework.label)} benchmark results</h1>
<p class="lead">${escapeHtml(summary(framework))}</p>
<ul class="facts">
<li>Language: <a href="${framework.language.path}">${escapeHtml(
    framework.language.label,
  )}</a> ${escapeHtml(framework.language.version)}</li>
<li>Framework version: ${escapeHtml(framework.version)}</li>
${framework.website ? `<li>Website: <a href="${escapeHtml(framework.website)}" rel="nofollow">${escapeHtml(framework.website)}</a></li>` : ""}
<li><a href="/compare?f=${encodeURIComponent(
    framework.label,
  )}">Compare ${escapeHtml(framework.label)} &rarr;</a></li>
</ul>
<h2>Throughput, latency &amp; reliability</h2>
${metricTable(framework, `All measured metrics for ${framework.label} ${framework.version}, by concurrency level.`)}
<h2>Position in this benchmark</h2>
<div class="table-wrap">
<table>
<caption>Position of ${escapeHtml(framework.label)} on requests per second.</caption>
<thead><tr><th scope="col">Concurrency</th><th scope="col">Overall</th><th scope="col">Among ${escapeHtml(
    framework.language.label,
  )} frameworks</th></tr></thead>
<tbody>
${CONCURRENCIES.map(
  (level) =>
    `<tr><th scope="row">${level}</th><td>${framework.rank[level]} of ${framework.totalCount}</td><td>${framework.languageRank[level]} of ${framework.language.frameworks.length}</td></tr>`,
).join("\n")}
</tbody>
</table>
</div>
${
  peers.length
    ? `<h2>Explore ${escapeHtml(framework.language.label)} frameworks</h2>
${rankingTable({
  frameworks: peers,
  caption: `Fastest ${framework.language.label} frameworks at concurrency ${CONCURRENCIES[0]}.`,
  rankField: "languageRank",
  showLanguage: false,
})}
<p><a href="${framework.language.path}">All ${framework.language.frameworks.length} ${escapeHtml(
        framework.language.label,
      )} frameworks</a></p>`
    : ""
}`;

  const structured = [
    jsonLd({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: framework.label,
      applicationCategory: "DeveloperApplication",
      softwareVersion: String(framework.version),
      programmingLanguage: framework.language.label,
      ...(framework.website ? { url: framework.website } : {}),
      subjectOf: {
        "@type": "Dataset",
        name: `${framework.label} ${framework.version} benchmark measurements`,
        description: summary(framework),
        url: absolute(framework.path),
        license:
          "https://github.com/the-benchmarker/web-frameworks/blob/master/LICENSE",
        isBasedOn: "https://github.com/the-benchmarker/web-frameworks",
        dateModified: benchmark.updatedAtDate,
        variableMeasured: CONCURRENCIES.flatMap((level) =>
          HEADLINE_METRICS.map((metric) => ({
            "@type": "PropertyValue",
            name: `${metric.title} at concurrency ${level}`,
            value: framework.levels[level][metric.key],
            unitText: metric.kind === "latency" ? "s" : undefined,
          })),
        ),
      },
    }),
  ];

  return page({
    title: `${framework.label} ${framework.version} benchmark (${framework.language.label}) | The Benchmarker`,
    description: summary(framework),
    path: framework.path,
    trail,
    structured,
    body,
    benchmark,
  });
};

const languagePage = (language, benchmark) => {
  const trail = [home, hub, { name: language.label, path: language.path }];
  const fastest = language.frameworks[0];
  const description =
    `Benchmark results for ${language.frameworks.length} ${language.label} web frameworks, ` +
    `measured with zrk at concurrency ${CONCURRENCIES.join(", ")}. Fastest at concurrency ` +
    `${CONCURRENCIES[0]}: ${fastest.label} with ${formatMetric(
      "rps",
      fastest.levels[CONCURRENCIES[0]].total_requests_per_s,
    )} requests per second.`;

  const body = `
<span class="eyebrow">Explore by language</span>
<h1>${escapeHtml(language.label)} web framework benchmarks</h1>
<p class="lead">${escapeHtml(description)}</p>
<p class="method-note">Compare throughput and latency together. These measurements describe a specific workload and test environment; performance in your application may differ.</p>
${CONCURRENCIES.map(
  (level) =>
    `<h2>Concurrency ${level}</h2>` +
    rankingTable({
      frameworks: [...language.frameworks].sort(
        (a, b) => a.languageRank[level] - b.languageRank[level],
      ),
      caption: `${language.label} frameworks at concurrency ${level}, ranked on requests per second.`,
      level,
      rankField: "languageRank",
      showLanguage: false,
    }),
).join("\n")}`;

  const structured = [
    jsonLd({
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: `${language.label} web framework benchmark`,
      description,
      url: absolute(language.path),
      license:
        "https://github.com/the-benchmarker/web-frameworks/blob/master/LICENSE",
      isBasedOn: "https://github.com/the-benchmarker/web-frameworks",
      dateModified: benchmark.updatedAtDate,
      creator: {
        "@type": "Organization",
        name: "The Benchmarker",
        url: "https://github.com/the-benchmarker",
      },
    }),
    jsonLd({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${language.label} web frameworks`,
      numberOfItems: language.frameworks.length,
      itemListElement: language.frameworks.map((framework, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: framework.label,
        url: absolute(framework.path),
      })),
    }),
  ];

  return page({
    title: `${language.label} web framework benchmarks | The Benchmarker`,
    description,
    path: language.path,
    trail,
    structured,
    body,
    benchmark,
  });
};

const hubPage = (benchmark) => {
  const trail = [home, hub];
  const level = CONCURRENCIES[0];
  const top = [...benchmark.frameworks]
    .sort((a, b) => a.rank[level] - b.rank[level])
    .slice(0, 50);
  const description =
    `HTTP performance results for ${benchmark.frameworks.length} web frameworks in ` +
    `${benchmark.languages.length} languages, measured with zrk at concurrency ` +
    `${CONCURRENCIES.join(", ")}. Updated ${benchmark.updatedAtDate}.`;

  const body = `
<span class="eyebrow">The framework directory</span>
<h1>Find your framework.<br>Explore the numbers.</h1>
<p class="lead">${escapeHtml(description)}</p>
<h2>Browse by language</h2>
<ul class="grid">
${benchmark.languages
  .map(
    (language) =>
      `<li><a href="${language.path}">${escapeHtml(language.label)} <span class="muted">${
        language.frameworks.length
      } frameworks &rarr;</span></a></li>`,
  )
  .join("\n")}
</ul>
<h2>Leading throughput in this run</h2>
${rankingTable({
  frameworks: top,
  caption: `The 50 fastest frameworks at concurrency ${level}, ranked on requests per second.`,
  level,
})}
<p><a class="button-link" href="/result">Explore all ${benchmark.frameworks.length} results &rarr;</a></p>
<p class="method-note">A benchmark is a starting point. Compare requests per second, tail latency and error counts for your workload, then consider the features and ecosystem your application needs.</p>`;

  const structured = [
    jsonLd({
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Web Frameworks Benchmark",
      description,
      url: absolute("/frameworks/"),
      license:
        "https://github.com/the-benchmarker/web-frameworks/blob/master/LICENSE",
      isBasedOn: "https://github.com/the-benchmarker/web-frameworks",
      dateModified: benchmark.updatedAtDate,
      keywords: benchmark.languages.map((language) => language.label),
      distribution: [
        {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: absolute("/data.json"),
        },
      ],
      creator: {
        "@type": "Organization",
        name: "The Benchmarker",
        url: "https://github.com/the-benchmarker",
      },
    }),
  ];

  return page({
    title: "HTTP server & web framework directory | The Benchmarker",
    description,
    path: "/frameworks/",
    trail,
    structured,
    body,
    benchmark,
  });
};

// Keep these route titles and descriptions in sync with src/components/Seo.tsx.
// Each entry point gets its metadata in the initial response, before React runs.
const ROUTES = [
  {
    path: "/",
    title: "HTTP server & web framework benchmarks | The Benchmarker",
    heading: "HTTP server & web framework benchmarks",
    description:
      "Compare HTTP server and web framework performance across languages. Explore requests per second, latency and errors at concurrency 64, 256 and 512.",
  },
  {
    path: "/result",
    title: "HTTP benchmark results: throughput & latency | The Benchmarker",
    heading: "HTTP benchmark results",
    description:
      "Explore HTTP server and web framework benchmark results. Filter by language or framework and compare throughput, latency and errors at three concurrency levels.",
  },
  {
    path: "/compare",
    title: "Compare HTTP servers & web frameworks | The Benchmarker",
    heading: "Compare HTTP servers & web frameworks",
    description:
      "Compare HTTP servers and web frameworks side by side. Explore requests per second, average latency and latency percentiles at concurrency 64, 256 and 512.",
  },
];

const patchIndex = async (benchmark) => {
  const file = join(DIST, "index.html");
  // Removing our marked sections makes `npm run seo` safe to repeat.
  const template = (await readFile(file, "utf8"))
    .replace(/<!-- seo:head:start -->[\s\S]*?<!-- seo:head:end -->/g, "")
    .replace(
      /<!-- seo:fallback:start -->[\s\S]*?<!-- seo:fallback:end -->/g,
      "",
    )
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/i, "");
  const level = CONCURRENCIES[0];
  const top = [...benchmark.frameworks]
    .sort((a, b) => a.rank[level] - b.rank[level])
    .slice(0, 25);
  const description =
    `Performance comparison of ${benchmark.frameworks.length} web frameworks in ` +
    `${benchmark.languages.length} languages, measured with zrk at concurrency ` +
    `${CONCURRENCIES.join(", ")}. Data of ${benchmark.updatedAtDate}.`;

  for (const route of ROUTES) {
    const head = `<!-- seo:head:start -->
<title>${escapeHtml(route.title)}</title>
<meta name="description" content="${escapeHtml(route.description)}">
<link rel="canonical" href="${absolute(route.path)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Benchmarker">
<meta property="og:title" content="${escapeHtml(route.title)}">
<meta property="og:description" content="${escapeHtml(route.description)}">
<meta property="og:url" content="${absolute(route.path)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(route.title)}">
<meta name="twitter:description" content="${escapeHtml(route.description)}">
<noscript><style>${STYLE}</style></noscript>
${jsonLd({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "The Benchmarker",
  url: absolute("/"),
})}
${jsonLd({
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Web Frameworks Benchmark",
  description,
  url: absolute("/"),
  license:
    "https://github.com/the-benchmarker/web-frameworks/blob/master/LICENSE",
  isBasedOn: "https://github.com/the-benchmarker/web-frameworks",
  dateModified: benchmark.updatedAtDate,
  keywords: benchmark.languages.map((language) => language.label),
  distribution: [
    {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: absolute("/data.json"),
    },
  ],
  creator: {
    "@type": "Organization",
    name: "The Benchmarker",
    url: "https://github.com/the-benchmarker",
  },
})}
<!-- seo:head:end -->`;

    const noscript = `<!-- seo:fallback:start --><noscript><main class="container">
<span class="eyebrow">The Benchmarker</span>
<h1>${escapeHtml(route.heading)}</h1>
<p class="lead">${escapeHtml(route.description)}</p>
<p>${escapeHtml(description)}</p>
<p>Enable JavaScript for interactive filters and charts, or browse the complete <a href="/frameworks/">framework directory</a>.</p>
${rankingTable({ frameworks: top, caption: `The ${top.length} leading frameworks at concurrency ${level}, ranked on requests per second.` })}
<p><a class="button-link" href="/frameworks/">Explore ${benchmark.frameworks.length} frameworks in ${benchmark.languages.length} languages &rarr;</a></p>
</main></noscript><!-- seo:fallback:end -->`;

    const html = template
      .replace("</head>", `${head}</head>`)
      .replace('<div id="root"></div>', `<div id="root"></div>\n${noscript}`);
    await write(
      route.path === "/" ? "index.html" : `${route.path.slice(1)}/index.html`,
      html,
    );
    // Vite resolves extensionless requests to .html and trailing-slash requests
    // to /index.html. Vercel uses the same .html files through explicit rewrites.
    if (route.path !== "/") await write(`${route.path.slice(1)}.html`, html);
  }
};

const sitemap = (benchmark) => {
  const urls = [
    { path: "/", priority: "1.0" },
    { path: "/result", priority: "0.9" },
    { path: "/compare", priority: "0.9" },
    { path: "/frameworks/", priority: "0.9" },
    ...benchmark.languages.map((language) => ({
      path: language.path,
      priority: "0.8",
    })),
    ...benchmark.frameworks.map((framework) => ({
      path: framework.path,
      priority: "0.7",
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ path, priority }) =>
      `  <url><loc>${absolute(path)}</loc><lastmod>${benchmark.updatedAtDate}</lastmod><changefreq>daily</changefreq><priority>${priority}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;
};

// `sha` replays an old commit of the dataset, so it is an unbounded set of URLs
// that all show the same page. Everything else is worth crawling.
const robots = () => `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Disallow: /*?*sha=

Sitemap: ${absolute("/sitemap.xml")}
`;

const llms = (benchmark) => {
  const level = CONCURRENCIES[0];
  const top = [...benchmark.frameworks]
    .sort((a, b) => a.rank[level] - b.rank[level])
    .slice(0, 25);

  return `# Web Frameworks Benchmark

> Throughput and latency of ${benchmark.frameworks.length} web frameworks in ${
    benchmark.languages.length
  } languages, all serving the same two routes from a Docker container, measured with zrk (8 threads, 15 seconds) at concurrency ${CONCURRENCIES.join(
    ", ",
  )}. Run by The Benchmarker. Data of ${benchmark.updatedAtDate}.

Hardware: ${benchmark.hardware?.cpus ?? "?"} cores (${
    benchmark.hardware?.cpu_name ?? "unknown CPU"
  }), ${Math.round((benchmark.hardware?.memory ?? 0) / 1024 / 1024)} GB RAM, ${
    benchmark.hardware?.os?.sysname ?? "Linux"
  }. Latency figures are seconds in the raw data and milliseconds on the site.

## Fastest ${top.length} frameworks at concurrency ${level}

${top
  .map(
    (framework) =>
      `- [${framework.label} ${framework.version} (${framework.language.label})](${absolute(
        framework.path,
      )}): ${formatMetric(
        "rps",
        framework.levels[level].total_requests_per_s,
      )} req/s, P50 ${formatMetric("latency", framework.levels[level].percentile50)}`,
  )
  .join("\n")}

## Languages

${benchmark.languages
  .map(
    (language) =>
      `- [${language.label}](${absolute(language.path)}): ${
        language.frameworks.length
      } frameworks, fastest ${language.frameworks[0].label}`,
  )
  .join("\n")}

## Full data

- [llms-full.txt](${absolute("/llms-full.txt")}): every framework with every metric
- [data.json](${absolute("/data.json")}): the same as JSON
- [All frameworks](${absolute("/frameworks/")}): index of the per framework pages
- [web-frameworks](https://github.com/the-benchmarker/web-frameworks): the benchmark itself
`;
};

const llmsFull = (benchmark) => {
  const lines = [
    `# Web Frameworks Benchmark, full results`,
    ``,
    `Data of ${benchmark.updatedAtDate}. ${benchmark.frameworks.length} frameworks, ${benchmark.languages.length} languages.`,
    `Measured with zrk, 8 threads, 8s timeout, 15s per run, at concurrency ${CONCURRENCIES.join(", ")}.`,
    `Hardware: ${benchmark.hardware?.cpus ?? "?"} cores (${
      benchmark.hardware?.cpu_name ?? "unknown CPU"
    }), ${benchmark.hardware?.os?.sysname ?? "Linux"}.`,
    `Latency values below are milliseconds.`,
    ``,
  ];

  for (const language of benchmark.languages) {
    lines.push(
      `## ${language.label} (${language.frameworks.length} frameworks)`,
      ``,
    );
    for (const framework of language.frameworks) {
      lines.push(
        `### ${framework.label} ${framework.version} (${language.label})`,
      );
      lines.push(`url: ${absolute(framework.path)}`);
      if (framework.website) lines.push(`website: ${framework.website}`);
      for (const level of CONCURRENCIES) {
        const values = framework.levels[level];
        lines.push(
          `concurrency ${level}: ` +
            METRICS.map(
              (metric) =>
                `${metric.key}=${formatMetric(metric.kind, values[metric.key])}`,
            ).join(", ") +
            `, rank=${framework.rank[level]}/${benchmark.frameworks.length}` +
            `, rank in ${language.label}=${framework.languageRank[level]}/${language.frameworks.length}`,
        );
      }
      lines.push(``);
    }
  }

  return lines.join("\n");
};

const dataJson = (benchmark) =>
  JSON.stringify({
    updatedAt: benchmark.updatedAt,
    source: "https://github.com/the-benchmarker/web-frameworks",
    concurrencies: CONCURRENCIES,
    latencyUnit: "second",
    hardware: benchmark.hardware,
    frameworks: benchmark.frameworks.map((framework) => ({
      label: framework.label,
      version: framework.version,
      language: framework.language.label,
      languageVersion: framework.language.version,
      website: framework.website,
      url: absolute(framework.path),
      rank: framework.rank,
      languageRank: framework.languageRank,
      levels: framework.levels,
    })),
  });

const main = async () => {
  const benchmark = await loadBenchmark();
  for (const framework of benchmark.frameworks)
    framework.totalCount = benchmark.frameworks.length;

  await write("frameworks/index.html", hubPage(benchmark));
  for (const language of benchmark.languages) {
    await write(
      `${language.path.slice(1)}index.html`,
      languagePage(language, benchmark),
    );
  }
  for (const framework of benchmark.frameworks) {
    await write(
      `${framework.path.slice(1)}index.html`,
      frameworkPage(framework, benchmark),
    );
  }

  await write("sitemap.xml", sitemap(benchmark));
  await write("robots.txt", robots());
  await write("llms.txt", llms(benchmark));
  await write("llms-full.txt", llmsFull(benchmark));
  await write("data.json", dataJson(benchmark));
  await patchIndex(benchmark);

  console.log(
    `[seo] ${written.length} files for ${benchmark.frameworks.length} frameworks in ` +
      `${benchmark.languages.length} languages, canonical host ${SITE_URL}`,
  );
};

await main();
