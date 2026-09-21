import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Benchmark, Hardware } from "../api";
import { CONCURRENCIES } from "../common";

interface Props {
  updateDate: string;
  hardware?: Hardware;
  benchmarks: Benchmark[];
  isLoading: boolean;
}

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default function Home({
  updateDate,
  hardware,
  benchmarks,
  isLoading,
}: Props) {
  const [concurrency, setConcurrency] =
    useState<(typeof CONCURRENCIES)[number]>(64);
  const [searchParams] = useSearchParams();
  const level = `level${concurrency}` as const;
  const leaders = useMemo(
    () =>
      [...benchmarks]
        .sort((a, b) => b[level].totalRequestsPerS - a[level].totalRequestsPerS)
        .slice(0, 5),
    [benchmarks, level],
  );
  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    benchmarks.forEach(({ language }) =>
      counts.set(language.label, (counts.get(language.label) || 0) + 1),
    );
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [benchmarks]);
  const history = searchParams.get("sha");
  const resultsUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params);
    if (history) search.set("sha", history);
    return `/result${search.size ? `?${search}` : ""}`;
  };

  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> HTTP server &amp; framework
            benchmarks
          </p>
          <h1 id="home-title">
            A clearer view of <span>HTTP performance.</span>
          </h1>
          <p className="hero-description">
            Explore throughput and latency across web frameworks and languages.
            Real benchmark data to help you understand the trade-offs behind
            every request.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to={resultsUrl()}>
              Explore results <span aria-hidden="true">↗</span>
            </Link>
            <Link
              className="button button-secondary"
              to={`/compare${history ? `?sha=${encodeURIComponent(history)}` : ""}`}
            >
              Compare frameworks
            </Link>
          </div>
          <p className="hero-footnote">
            <span aria-hidden="true">⌘</span> Open source. Reproducible. Built
            for developers.
          </p>
        </div>

        <div className="leaderboard panel">
          <div className="leaderboard-heading">
            <div>
              <p className="eyebrow">A snapshot of the results</p>
              <h2>Leading in throughput</h2>
            </div>
            <span className="live-label">
              <span className="status-dot" />{" "}
              {history ? "Archive" : "Latest run"}
            </span>
          </div>
          <div className="leaderboard-controls">
            <span>Concurrent connections</span>
            <div
              className="segmented-control"
              role="group"
              aria-label="Concurrent connections"
            >
              {CONCURRENCIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={concurrency === value}
                  onClick={() => setConcurrency(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="leaderboard-axis">
            <span>Framework / language</span>
            <span>
              Requests / sec <span aria-hidden="true">↑</span>
            </span>
          </div>
          {leaders.length ? (
            <ol className="leaderboard-list">
              {leaders.map((entry, index) => (
                <li key={entry.id}>
                  <span className="rank-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="leaderboard-entry">
                    <div className="leaderboard-label">
                      <div>
                        <Link
                          to={resultsUrl({
                            f: entry.framework.label,
                            orderBy: level,
                          })}
                        >
                          {entry.framework.label}
                        </Link>
                        <span>{entry.language.label}</span>
                      </div>
                      <strong>
                        {number.format(entry[level].totalRequestsPerS)}
                      </strong>
                    </div>
                    <div className="throughput-track" aria-hidden="true">
                      <span
                        style={{
                          width: `${Math.max(2, (entry[level].totalRequestsPerS / (leaders[0][level].totalRequestsPerS || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="leaderboard-placeholder" role="status">
              {isLoading
                ? "Loading the latest benchmark data…"
                : "Results are currently unavailable."}
            </p>
          )}
          <div className="leaderboard-footer">
            <span>Higher throughput is better</span>
            <Link to={resultsUrl({ orderBy: level })}>
              Full rankings <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="stats-strip" aria-label="Benchmark at a glance">
        <div>
          <strong>
            {benchmarks.length ? number.format(benchmarks.length) : "—"}
          </strong>
          <span>Frameworks benchmarked</span>
        </div>
        <div>
          <strong>{languages.length || "—"}</strong>
          <span>Programming languages</span>
        </div>
        <div>
          <strong>
            3 <small>levels</small>
          </strong>
          <span>64, 256 &amp; 512 connections</span>
        </div>
        <div>
          <strong>
            15 <small>seconds</small>
          </strong>
          <span>Duration of each test</span>
        </div>
      </section>

      <section className="language-section" aria-labelledby="languages-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start with your stack</p>
            <h2 id="languages-title">Find your language.</h2>
          </div>
          <a className="text-link" href="/frameworks/">
            Browse all frameworks <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="language-list">
          {languages.slice(0, 12).map(([label, count]) => (
            <Link
              className="language-chip"
              key={label}
              to={resultsUrl({ l: label })}
            >
              <span>{label}</span>
              <span className="language-count">{count}</span>
              <span className="chip-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}
        </div>
        {!languages.length && (
          <p className="muted">
            Browse the <a href="/frameworks/">framework directory</a> for
            results by language.
          </p>
        )}
      </section>

      <section
        className="methodology-section"
        aria-labelledby="methodology-title"
      >
        <div>
          <p className="eyebrow">Behind the numbers</p>
          <h2 id="methodology-title">
            Same test.
            <br />A useful perspective.
          </h2>
          <p className="section-description">
            Each implementation runs in an isolated Docker container. The
            benchmark measures how HTTP servers and frameworks handle requests
            under three levels of concurrency.
          </p>
          <a
            className="text-link"
            href="https://github.com/the-benchmarker/web-frameworks"
            target="_blank"
            rel="noreferrer"
          >
            Explore the methodology on GitHub <span aria-hidden="true">↗</span>
          </a>
          <div className="context-note">
            <span aria-hidden="true">i</span>
            <p>
              Performance is one part of the picture. Consider features,
              maintainability and your own workload when choosing a framework.
            </p>
          </div>
        </div>
        <div className="methodology-panel">
          <div className="terminal-title">
            <span className="terminal-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>benchmark.config</span>
            <span>zrk</span>
          </div>
          <dl className="config-list">
            <div>
              <dt>load_generator</dt>
              <dd>
                <a href="https://zoxy.io/zrk/" target="_blank" rel="noreferrer">
                  zrk
                </a>
              </dd>
            </div>
            <div>
              <dt>threads</dt>
              <dd>8</dd>
            </div>
            <div>
              <dt>duration</dt>
              <dd>15s</dd>
            </div>
            <div>
              <dt>timeout</dt>
              <dd>8s</dd>
            </div>
            <div>
              <dt>concurrency</dt>
              <dd>[64, 256, 512]</dd>
            </div>
            <div>
              <dt>environment</dt>
              <dd>Docker</dd>
            </div>
          </dl>
          <div className="config-footer">
            <span className="status-dot" /> Same configuration across frameworks
          </div>
        </div>
      </section>

      {hardware && (
        <section
          className="hardware-panel panel"
          aria-labelledby="hardware-title"
        >
          <div>
            <p className="eyebrow">Test environment</p>
            <h2 id="hardware-title">The hardware behind this run</h2>
          </div>
          <dl>
            <div>
              <dt>Processor</dt>
              <dd>
                {hardware.cpuName}
                <span>{hardware.cpus} CPU cores</span>
              </dd>
            </div>
            <div>
              <dt>Memory</dt>
              <dd>{Math.round(hardware.memory / 1024 / 1024)} GB</dd>
            </div>
            <div>
              <dt>Operating system</dt>
              <dd>{hardware.os.sysname}</dd>
            </div>
            <div>
              <dt>Dataset updated</dt>
              <dd>
                <time dateTime={updateDate}>{updateDate || "Unavailable"}</time>
              </dd>
            </div>
          </dl>
        </section>
      )}
    </>
  );
}
