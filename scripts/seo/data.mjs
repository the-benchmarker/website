// Loads the benchmark dataset that the app fetches at runtime and reshapes it
// into what the static pages need: slugs, per level metrics and rankings.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const DATA_URL =
  "https://raw.githubusercontent.com/the-benchmarker/web-frameworks/master/data.min.json";
const CACHE_FILE = new URL("../../node_modules/.cache/seo/data.min.json", import.meta.url);

// The three concurrency levels wrk is run with, see the "Technical Details"
// section of the home page.
export const CONCURRENCIES = [64, 256, 512];

// Every metric the dataset carries, in the order they are shown in the tables.
// `maximum_latency` is listed by the app but is not published upstream.
export const METRICS = [
  { key: "total_requests_per_s", title: "Requests / second", kind: "rps" },
  { key: "percentile50", title: "P50 latency", kind: "latency" },
  { key: "percentile75", title: "P75 latency", kind: "latency" },
  { key: "percentile90", title: "P90 latency", kind: "latency" },
  { key: "percentile99", title: "P99 latency", kind: "latency" },
  { key: "percentile99999", title: "P99.999 latency", kind: "latency" },
  { key: "average_latency", title: "Average latency", kind: "latency" },
  { key: "minimum_latency", title: "Minimum latency", kind: "latency" },
  { key: "standard_deviation", title: "Standard deviation", kind: "latency" },
  { key: "total_requests", title: "Total requests", kind: "count" },
  { key: "total_bytes_received", title: "Bytes received", kind: "bytes" },
  { key: "http_errors", title: "HTTP errors", kind: "count" },
  { key: "request_timeouts", title: "Request timeouts", kind: "count" },
  { key: "socket_connection_errors", title: "Socket connection errors", kind: "count" },
  { key: "socket_read_errors", title: "Socket read errors", kind: "count" },
  { key: "socket_write_errors", title: "Socket write errors", kind: "count" },
];

export const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const fetchDataset = async () => {
  const local = process.env.SEO_DATA_FILE;
  if (local) return JSON.parse(await readFile(local, "utf8"));

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.text();
      await mkdir(dirname(CACHE_FILE.pathname.slice(1)), { recursive: true }).catch(() => {});
      await writeFile(CACHE_FILE, body).catch(() => {});
      return JSON.parse(body);
    } catch (error) {
      lastError = error;
      console.warn(`[seo] fetch of data.min.json failed (${attempt}/3): ${error.message}`);
    }
  }

  try {
    console.warn("[seo] falling back to the cached dataset");
    return JSON.parse(await readFile(CACHE_FILE, "utf8"));
  } catch {
    throw lastError;
  }
};

// Same rule the app applies: a framework is shown only when it has every
// metric at every concurrency level, so a partial run cannot fake a ranking.
const isComplete = (metricsById, frameworkId, labels) => {
  const byLabel = metricsById.get(frameworkId);
  if (!byLabel) return false;
  return labels.every((label) => {
    const levels = byLabel.get(label);
    return levels && CONCURRENCIES.every((level) => levels.has(level));
  });
};

const rank = (frameworks, level, field) => {
  const sorted = [...frameworks].sort(
    (a, b) => b.levels[level].total_requests_per_s - a.levels[level].total_requests_per_s
  );
  sorted.forEach((framework, index) => {
    framework[field][level] = index + 1;
  });
};

export const loadBenchmark = async () => {
  const raw = await fetchDataset();

  const labels = [...new Set(raw.metrics.map((m) => m.label))];
  const metricsById = new Map();
  for (const metric of raw.metrics) {
    let byLabel = metricsById.get(metric.framework_id);
    if (!byLabel) metricsById.set(metric.framework_id, (byLabel = new Map()));
    let levels = byLabel.get(metric.label);
    if (!levels) byLabel.set(metric.label, (levels = new Map()));
    levels.set(metric.level, metric.value);
  }

  const languages = new Map();
  for (const language of raw.languages) {
    languages.set(language.label, {
      label: language.label,
      version: language.version,
      slug: slugify(language.label),
      path: `/frameworks/${slugify(language.label)}/`,
      frameworks: [],
    });
  }

  const frameworks = [];
  for (const entry of raw.frameworks) {
    if (!isComplete(metricsById, entry.id, labels)) continue;
    const language = languages.get(entry.language);
    if (!language) continue;

    const byLabel = metricsById.get(entry.id);
    const levels = {};
    for (const level of CONCURRENCIES) {
      levels[level] = Object.fromEntries(
        labels.map((label) => [label, byLabel.get(label).get(level)])
      );
    }

    const framework = {
      id: entry.id,
      label: entry.label,
      slug: slugify(entry.label),
      version: entry.version,
      website: entry.website,
      language,
      path: `/frameworks/${language.slug}/${slugify(entry.label)}/`,
      levels,
      rank: {},
      languageRank: {},
    };
    frameworks.push(framework);
    language.frameworks.push(framework);
  }

  for (const level of CONCURRENCIES) {
    rank(frameworks, level, "rank");
    for (const language of languages.values()) {
      rank(language.frameworks, level, "languageRank");
    }
  }

  const byThroughput = (a, b) =>
    b.levels[64].total_requests_per_s - a.levels[64].total_requests_per_s;
  frameworks.sort(byThroughput);
  const languageList = [...languages.values()].filter((l) => l.frameworks.length);
  for (const language of languageList) language.frameworks.sort(byThroughput);
  languageList.sort((a, b) => a.label.localeCompare(b.label));

  const updatedAt = String(raw.updated_at || "").trim();

  return {
    updatedAt,
    updatedAtDate: updatedAt.split(" ")[0],
    hardware: raw.hardware,
    frameworks,
    languages: languageList,
  };
};
