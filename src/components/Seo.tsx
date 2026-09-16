import { useEffect } from "react";
import { useLocation } from "react-router";
import { SITE_URL } from "../common";

interface Meta {
  title: string;
  description: string;
}

const DEFAULT_META: Meta = {
  title: "HTTP server & web framework benchmarks | The Benchmarker",
  description:
    "Compare HTTP server and web framework performance across languages. Explore requests per second, latency and errors at concurrency 64, 256 and 512.",
};

// Keep initial HTML metadata in scripts/seo/build.mjs in sync with these entries.
const META: Record<string, Meta> = {
  "/result": {
    title: "HTTP benchmark results: throughput & latency | The Benchmarker",
    description:
      "Explore HTTP server and web framework benchmark results. Filter by language or framework and compare throughput, latency and errors at three concurrency levels.",
  },
  "/compare": {
    title: "Compare HTTP servers & web frameworks | The Benchmarker",
    description:
      "Compare HTTP servers and web frameworks side by side. Explore requests per second, average latency and latency percentiles at concurrency 64, 256 and 512.",
  },
};

const setMeta = (name: string, content: string, attribute = "name") => {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${name}"]`,
  );
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
};

const setCanonical = (href: string) => {
  let tag = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  tag.href = href;
};

/**
 * Keep metadata correct during client-side navigation. The build also creates
 * route-specific HTML so crawlers receive the same metadata before JavaScript.
 */
function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.replace(/\/$/, "") || "/";
    const meta = META[path] || DEFAULT_META;
    const canonical = `${SITE_URL}${path === "/" ? "/" : path}`;

    document.title = meta.title;
    setMeta("description", meta.description);
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", "The Benchmarker", "property");
    setMeta("og:title", meta.title, "property");
    setMeta("og:description", meta.description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("twitter:card", "summary");
    setMeta("twitter:title", meta.title);
    setMeta("twitter:description", meta.description);
    // Filters and historical runs are variations of the same benchmark page.
    setCanonical(canonical);
  }, [pathname]);

  return null;
}

export default Seo;
