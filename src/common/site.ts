// The build is served from more than one host, so the canonical URL has to be
// pinned instead of read off window.location. Keep in sync with the default in
// scripts/seo/render.mjs.
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://web-frameworks-benchmark.netlify.app"
).replace(/\/$/, "");
