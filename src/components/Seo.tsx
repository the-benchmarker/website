import { useEffect } from "react";
import { useLocation } from "react-router";
import { SITE_URL } from "../common";

interface Meta {
  title: string;
  description: string;
}

const DEFAULT_META: Meta = {
  title: "Web Frameworks Benchmark",
  description:
    "Web Frameworks Benchmark. There are many frameworks, each one comes with its own advantages and drawbacks. The purpose of this project is to identify them and attempt to measure their differences (performance is only one metric).",
};

const META: Record<string, Meta> = {
  "/result": {
    title: "Benchmark results - Web Frameworks Benchmark",
    description:
      "Requests per second and latency percentiles of every benchmarked web framework, at concurrency 64, 256 and 512. Filter by language or framework and sort on any metric.",
  },
  "/compare": {
    title: "Compare frameworks - Web Frameworks Benchmark",
    description:
      "Compare web frameworks side by side on throughput and latency percentiles, at concurrency 64, 256 and 512.",
  },
};

const setMeta = (name: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
};

const setCanonical = (href: string) => {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  tag.href = href;
};

/**
 * Gives each route its own title, description and canonical URL. The app is a
 * single HTML file, so without this every route is indexed under the home page
 * title, and every filter in the query string looks like a separate page.
 */
function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.replace(/\/$/, "") || "/";
    const meta = META[path] || DEFAULT_META;

    document.title = meta.title;
    setMeta("description", meta.description);
    // Query string dropped on purpose: the filters do not change the content.
    setCanonical(`${SITE_URL}${path === "/" ? "/" : path}`);
  }, [pathname]);

  return null;
}

export default Seo;
