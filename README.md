# Web Frameworks Benchmark

This is the repository of the [Web Frameworks Benchmark Website](https://web-frameworks-benchmark.vercel.app). It's currently hosted on [Vercel](https://vercel.com/).

Source code for the benchmark itself: [the-benchmarker/web-frameworks](https://github.com/the-benchmarker/web-frameworks)

Found a bug or have a suggestion/ feedback? Feel free to [create a new issue](https://github.com/the-benchmarker/website/issues/new)

---

### Contributing

1. Fork this repository
2. Clone the forked repository
3. Install required dependencies

    ```
    cd website
    npm i
    ```

4. Run dev server with hot reloading feature

    ```
    npm run dev
    ```

5. Make awesome changes and commit it
6. Create a [Pull Request](https://github.com/the-benchmarker/website/pulls)

---

### Pre-rendered pages

The app renders on the client, so a crawler that does not run JavaScript sees an empty
page. `npm run build` therefore runs the Vite build and then `scripts/seo/build.mjs`,
which reads the benchmark dataset and writes into `dist/`:

- a static, no-JavaScript page per framework (`/frameworks/<language>/<framework>/`) and
  per language (`/frameworks/<language>/`), with the numbers in a real table
- two README badges per framework with its rank at concurrency 64: `badge.svg` for the
  overall rank and `badge-language.svg` for the rank in its language. The framework page
  shows the Markdown to copy.
- `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt` and `data.json`
- initial titles, descriptions, canonical, social and JSON-LD tags for `/`,
  `/result` and `/compare`, with a readable fallback when JavaScript is disabled

Run it alone with `npm run seo` after a build. `VITE_SITE_URL` sets the canonical host,
`SEO_DATA_FILE` reads the dataset from a local file instead of GitHub. The pages hold the
data of the build, so the site needs a rebuild when the benchmark is re-run.

Run `node scripts/seo/verify.mjs` after building to check every generated page's
metadata, canonical URL, primary heading, structured data and benchmark content.

---

Built with [React](https://github.com/react/react)
