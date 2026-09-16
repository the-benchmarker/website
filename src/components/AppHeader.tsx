import { useEffect, useState } from "react";
import { Link, NavLink, useSearchParams } from "react-router";
import Select from "react-select";
import { getBenchmarkHistories } from "../api";
import type { SelectOption } from "../common";

export default function AppHeader() {
  const [historyOptions, setHistoryOptions] = useState<SelectOption[]>([]);
  const [historyUnavailable, setHistoryUnavailable] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const sha = searchParams.get("sha");
  const historySearch = sha ? `?sha=${encodeURIComponent(sha)}` : "";

  useEffect(() => {
    let active = true;
    getBenchmarkHistories()
      .then((histories) => {
        if (active)
          setHistoryOptions(
            histories.map((h) => ({ label: h.date, value: h.sha })),
          );
      })
      .catch(() => {
        if (active) setHistoryUnavailable(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const options = [
    { value: "master", label: "Latest benchmark run" },
    ...historyOptions,
  ];
  const selected = options.find(
    (option) => option.value === (sha || "master"),
  ) || { value: sha!, label: `Run ${sha?.slice(0, 7)}` };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link
            className="brand"
            to={`/${historySearch}`}
            aria-label="The Benchmarker home"
          >
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              the benchmarker<span className="brand-period">.</span>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <ul className="nav-links">
              <li>
                <NavLink to={`/${historySearch}`} end>
                  Overview
                </NavLink>
              </li>
              <li>
                <NavLink to={`/result${historySearch}`}>Results</NavLink>
              </li>
              <li>
                <NavLink to={`/compare${historySearch}`}>Compare</NavLink>
              </li>
              <li>
                <a href="/frameworks/">Frameworks</a>
              </li>
            </ul>
          </nav>
          <a
            className="github-link"
            href="https://github.com/the-benchmarker/website"
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.08c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.62 1.22 3.26.94.1-.73.39-1.22.71-1.5-2.5-.28-5.12-1.25-5.12-5.54 0-1.22.43-2.22 1.15-3-.12-.29-.5-1.42.11-2.96 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.61 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.54.23 2.67.11 2.95.72.79 1.15 1.79 1.15 3.01 0 4.3-2.62 5.25-5.13 5.53.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
            </svg>
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>
      <div className="run-bar">
        <div className="container run-bar-inner">
          <p>
            <span className="status-dot" /> An open-source look at web
            performance
          </p>
          <div className="run-selector">
            <label htmlFor="benchmark-run">Dataset</label>
            <Select
              inputId="benchmark-run"
              instanceId="benchmark-run"
              classNamePrefix="select"
              className="history-select"
              value={selected}
              options={options}
              isSearchable={false}
              onChange={(option) => {
                if (option)
                  setSearchParams((previous) => {
                    const next = new URLSearchParams(previous);
                    if (option.value === "master") next.delete("sha");
                    else next.set("sha", String(option.value));
                    return next;
                  });
              }}
            />
            {historyUnavailable && (
              <span
                className="history-warning"
                title="Run history is temporarily unavailable"
              >
                History unavailable
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
