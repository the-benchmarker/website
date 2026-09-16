// Check the deployable HTML, including routes that would otherwise use the SPA
// fallback. Run after `npm run build` (or after a repeated `npm run seo`).
// Pass a preview URL to also verify the initial HTTP response for each app route:
// node scripts/seo/verify.mjs http://127.0.0.1:4173
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../../dist/", import.meta.url));
// Fetch's UTF-8 decoder strips a byte-order mark; normalize disk reads alike.
const read = async (path) =>
  (await readFile(join(DIST, path), "utf8")).replace(/^\uFEFF/, "");
const sitemap = await read("sitemap.xml");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);
assert.ok(urls.length > 4, "The sitemap must include framework pages.");
assert.equal(new Set(urls).size, urls.length, "Sitemap URLs must be unique.");

const clientSeo = await readFile(
  new URL("../../src/components/Seo.tsx", import.meta.url),
  "utf8",
);
const decode = (value) =>
  value.replaceAll("&amp;", "&").replaceAll("&quot;", '"');
const titles = new Set();
const previewUrl = process.argv[2];

for (const url of urls) {
  const path = new URL(url).pathname;
  const relative = path.replace(/^\//, "").replace(/\/$/, "");
  const html = await read(relative ? `${relative}/index.html` : "index.html");
  const only = (regex, name) => {
    const matches = [...html.matchAll(regex)];
    assert.equal(matches.length, 1, `${path}: expected one ${name}.`);
    return matches[0][1];
  };
  const title = only(/<title>([^<]+)<\/title>/g, "title");
  const description = only(
    /<meta name="description" content="([^"]+)"\s*\/?>/g,
    "description",
  );
  assert.equal(
    only(/<link rel="canonical" href="([^"]+)"\s*\/?>/g, "canonical URL"),
    url,
  );
  assert.equal(
    only(/<meta property="og:url" content="([^"]+)"\s*\/?>/g, "Open Graph URL"),
    url,
  );
  assert.equal(
    only(
      /<meta property="og:title" content="([^"]+)"\s*\/?>/g,
      "Open Graph title",
    ),
    title,
  );
  only(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g, "primary heading");
  assert.ok(!titles.has(title), `${path}: duplicate page title.`);
  titles.add(title);
  assert.ok(
    !/\bundefined\b|\bNaN\b/.test(html),
    `${path}: missing values leaked into HTML.`,
  );

  const structured = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ];
  assert.ok(structured.length, `${path}: structured data is missing.`);
  structured.forEach((match) => assert.ok(JSON.parse(match[1])["@type"]));

  if (["/", "/result", "/compare"].includes(path)) {
    if (path !== "/") {
      assert.equal(
        await read(`${relative}.html`),
        html,
        `${path}: extensionless and trailing-slash entry points must match.`,
      );
    }
    assert.match(
      html,
      /<script[^>]+type="module"[^>]+src="\/assets\//,
      `${path}: missing app bundle.`,
    );
    assert.ok(
      clientSeo.includes(decode(title)),
      `${path}: client title differs from initial HTML.`,
    );
    assert.ok(
      clientSeo.includes(decode(description)),
      `${path}: client description differs from initial HTML.`,
    );
    if (previewUrl) {
      const variants =
        path === "/" ? ["/"] : [path, `${path}/`, `${path}?f=express`];
      for (const variant of variants) {
        const response = await fetch(new URL(variant, previewUrl), {
          headers: { accept: "text/html" },
        });
        assert.equal(
          response.status,
          200,
          `${variant}: initial response failed.`,
        );
        assert.equal(
          await response.text(),
          html,
          `${variant}: server must return route-specific HTML before JavaScript.`,
        );
      }
    }
  } else {
    assert.match(html, /<table>/, `${path}: static benchmark data is missing.`);
    assert.match(html, /href="#main-content"/, `${path}: missing skip link.`);
  }
}

const data = JSON.parse(await read("data.json"));
assert.ok(
  data.frameworks.length > 0,
  "Machine-readable results must contain frameworks.",
);
assert.match(await read("robots.txt"), /Sitemap: https?:\/\//);
assert.ok((await read("llms-full.txt")).includes(data.frameworks[0].label));
console.log(
  `[seo:verify] ${urls.length} pages checked: unique metadata, canonical URLs, headings, structured data and benchmark content.`,
);
