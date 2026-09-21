import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import Select from "react-select";
import DataTable, { type TableColumn } from "react-data-table-component";
import { Tooltip } from "react-tooltip";
import FrameworkSelector, {
  type SelectOptionFramework,
} from "../components/FrameworkSelector";
import HttpErrorsTooltip from "../components/HttpErrorsTooltip";
import type { Benchmark } from "../api";
import { COMPARED_METRICS, CONCURRENCIES, type SelectOption } from "../common";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import "./benchmark.css";

const defaultMetric = {
  label: "Requests / Second",
  value: "totalRequestsPerS",
};

const metricOptions = COMPARED_METRICS.map((m) => ({
  label: m.title,
  value: m.key,
}));

const staticColumns: TableColumn<Benchmark>[] = [
  {
    id: "framework",
    name: "Framework",
    selector: ({ framework }) => framework.label,
    minWidth: "230px",
    grow: 1.5,
    cell: (b) => {
      const id = `tooltip-${b.id}`;
      const httpErrors = [
        b.level64.httpErrors,
        b.level256.httpErrors,
        b.level512.httpErrors,
      ];

      return (
        <div className="result-framework">
          <div>
            <a href={b.framework.website} target="_blank" rel="noreferrer">
              {b.framework.label}
            </a>
            <span className="result-version">v{b.framework.version}</span>
          </div>
          {httpErrors.some((e) => e > 0) && (
            <button
              type="button"
              className="http-error-indicator tooltip-trigger"
              id={id}
              aria-label={`HTTP errors for ${b.framework.label}: ${httpErrors.map((count, index) => `${count} at concurrency ${CONCURRENCIES[index]}`).join(", ")}`}
              data-tooltip-place="right"
              data-tooltip-content={JSON.stringify(httpErrors)}
            >
              !
            </button>
          )}
        </div>
      );
    },
    sortable: true,
  },
  {
    id: "language",
    name: "Language",
    selector: ({ language }) => `${language.label} (${language.version})`,
    cell: ({ language }) => (
      <div>
        <span className="result-language">{language.label}</span>
        <span className="result-version">{language.version}</span>
      </div>
    ),
    sortable: true,
    minWidth: "140px",
  },
];

interface Props {
  benchmarks: Benchmark[];
}

function BenchmarkResult({ benchmarks }: Props) {
  const [searchParams] = useSearchParams();
  const sha = searchParams.get("sha");
  const runSearch = sha ? `?${new URLSearchParams({ sha }).toString()}` : "";
  const [frameworkParams, setFrameworkParams] = useQueryState(
    "f",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [languageParams, setLanguageParams] = useQueryState(
    "l",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [metricParam, setMetricParam] = useQueryState("metric");
  const [sortParams, setSortParams] = useQueryStates({
    asc: parseAsBoolean.withDefault(false),
    orderBy: parseAsString.withDefault("level64"),
  });

  const languageOptions = useMemo(
    () =>
      [
        ...new Map(
          benchmarks.map((b) => [b.language.label, b.language]),
        ).values(),
      ]
        .map(({ label, version }) => ({
          value: label,
          label: `${label} (${version})`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [benchmarks],
  );

  const languages = useMemo(
    () =>
      languageOptions.filter((language) =>
        languageParams.includes(language.value),
      ),
    [languageOptions, languageParams],
  );

  const frameworks = useMemo(() => {
    return benchmarks
      .map((b) => ({
        value: b.framework.label,
        label: `${b.language.label} - ${b.framework.label} (${b.framework.version})`,
      }))
      .filter((framework) => frameworkParams.includes(framework.value));
  }, [benchmarks, frameworkParams]);

  const metric = useMemo(() => {
    const value = metricParam || defaultMetric.value;

    return metricOptions.find((m) => m.value === value) || defaultMetric;
  }, [metricParam]);

  const columns = useMemo<TableColumn<Benchmark>[]>(() => {
    const { key, format, round } = COMPARED_METRICS.find(
      ({ key }) => key === metric.value,
    )!;

    const dynamicColumns = CONCURRENCIES.map((c) => ({
      id: `level${c}`,
      name: `${c} connections`,
      selector: (b: Benchmark) => {
        const value = b[`level${c}` as const][key];
        return Number.isFinite(value) ? value : "";
      },
      sortable: true,
      format: (b: Benchmark) => {
        let value: string | number = b[`level${c}` as const][key];

        if (!Number.isFinite(value)) return "n/a";

        if (round) value = Math.round(value);
        if (format) value = format(value);

        return value;
      },
      minWidth: "150px",
      right: true,
    }));

    return [...staticColumns, ...dynamicColumns];
  }, [metric]);

  const tableData = useMemo(() => {
    if (!frameworks.length && !languages.length) {
      return benchmarks;
    }

    const languageValues = new Set(languages.map((l) => l.value));
    const frameworkValues = new Set(frameworks.map((f) => f.value));

    return benchmarks.filter(
      (b) =>
        languageValues.has(b.language.label) ||
        frameworkValues.has(b.framework.label),
    );
  }, [benchmarks, frameworks, languages]);

  const scrollToTitle = () => {
    document.getElementById("results-title")?.scrollIntoView();
  };

  const onLanguagesChange = (options: SelectOption[]) => {
    setLanguageParams(
      options.length ? options.map((l) => String(l.value)) : [],
    );
  };

  const onFrameworksChange = (options: SelectOptionFramework[]) => {
    setFrameworkParams(
      options.length ? options.map((f) => String(f.value)) : [],
    );
  };

  const onMetricChange = (option: SelectOption | null) => {
    setMetricParam(option?.value.toString() || "");
  };

  const onTableSort = (
    column: TableColumn<Benchmark>,
    direction: "asc" | "desc",
  ) => {
    setSortParams({
      orderBy: column.id?.toString(),
      asc: direction === "asc",
    });
  };

  const clearFilters = () => {
    setFrameworkParams([]);
    setLanguageParams([]);
  };

  const isThroughput = metric.value === "totalRequestsPerS";
  const hasFilters = frameworkParams.length > 0 || languageParams.length > 0;

  return (
    <div className="benchmark-view">
      <header className="page-heading benchmark-page-heading">
        <div>
          <p className="eyebrow">Explore the data</p>
          <h1 id="results-title">HTTP server benchmark results</h1>
          <p>
            Compare throughput and latency across web frameworks, languages, and
            three levels of concurrency.
          </p>
        </div>
        <Link className="button button-secondary" to={`/compare${runSearch}`}>
          Compare frameworks <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section
        className="panel benchmark-filters"
        aria-label="Filter benchmark results"
      >
        <div className="benchmark-filter-heading">
          <h2>Find your stack</h2>
          {hasFilters && (
            <button
              type="button"
              className="text-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="benchmark-filter-grid">
          <div className="benchmark-field">
            <label htmlFor="result-languages">Language</label>
            <Select
              inputId="result-languages"
              instanceId="result-languages"
              isMulti
              value={languages}
              onChange={(data) => onLanguagesChange([...data])}
              options={languageOptions}
              placeholder="All languages"
              classNamePrefix="select"
            />
          </div>
          <div className="benchmark-field">
            <label htmlFor="result-frameworks">Framework</label>
            <FrameworkSelector
              inputId="result-frameworks"
              value={frameworks}
              options={benchmarks.map((b) => ({
                value: b.framework.label,
                label: `${b.language.label} - ${b.framework.label} (${b.framework.version})`,
              }))}
              disableStyle
              onChange={onFrameworksChange}
            />
          </div>
          <div className="benchmark-field">
            <label htmlFor="result-metric">Metric</label>
            <Select
              inputId="result-metric"
              instanceId="result-metric"
              onChange={onMetricChange}
              value={metric}
              options={metricOptions}
              isSearchable={false}
              classNamePrefix="select"
            />
          </div>
        </div>
        <p className="benchmark-filter-help">
          Select a language or framework to narrow the results. Click a column
          heading to sort.
        </p>
      </section>

      <Tooltip
        anchorSelect=".tooltip-trigger"
        style={{ zIndex: 9999 }}
        render={({ content }) =>
          content ? <HttpErrorsTooltip errorsString={content} /> : null
        }
      />

      <section
        className="panel benchmark-results"
        aria-label="Benchmark results"
      >
        <div className="benchmark-table-heading">
          <div>
            <h2>{metric.label}</h2>
            <p aria-live="polite">
              {tableData.length} of {benchmarks.length} frameworks ·{" "}
              {isThroughput ? "requests per second" : "milliseconds (ms)"}
            </p>
          </div>
          <span className="metric-direction">
            <span aria-hidden="true">{isThroughput ? "↑" : "↓"}</span>{" "}
            {isThroughput ? "Higher" : "Lower"} is better
          </span>
        </div>
        <DataTable
          columns={columns}
          pagination
          paginationPerPage={25}
          paginationRowsPerPageOptions={[25, 50, 100]}
          paginationComponentOptions={{ selectAllRowsItem: true }}
          onChangePage={scrollToTitle}
          onSort={onTableSort}
          data={tableData}
          defaultSortFieldId={sortParams.orderBy}
          defaultSortAsc={sortParams.asc}
          noHeader
          highlightOnHover
          noDataComponent={
            <p className="benchmark-no-data">
              No results match these filters. Try another language or framework.
            </p>
          }
          customStyles={{
            table: { style: { color: "#152333", backgroundColor: "#fff" } },
            headRow: {
              style: {
                backgroundColor: "#f6f8fa",
                minHeight: "52px",
                borderBottomColor: "#e3e8ec",
              },
            },
            headCells: {
              style: {
                fontSize: "12px",
                fontWeight: 600,
                color: "#566675",
                paddingLeft: "24px",
                paddingRight: "24px",
              },
            },
            rows: {
              style: {
                minHeight: "66px",
                fontSize: "14px",
                borderBottomColor: "#eef1f4",
              },
              highlightOnHoverStyle: { backgroundColor: "#f3faf8" },
            },
            cells: {
              style: {
                paddingLeft: "24px",
                paddingRight: "24px",
                fontVariantNumeric: "tabular-nums",
              },
            },
          }}
        />
      </section>
      <p className="benchmark-footnote">
        Each column is a concurrency level: 64, 256, or 512 simultaneous
        connections. “n/a” means the metric was not reported for this run.
        Results describe this benchmark workload; performance in your
        application may differ.
      </p>
    </div>
  );
}

export default BenchmarkResult;
