import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import {
  BarElement,
  CategoryScale,
  type ChartData,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { isMobile } from "react-device-detect";

import FrameworkSelector, {
  type SelectOptionFramework,
} from "../components/FrameworkSelector";
import type { BenchmarkDataSet } from "../App";
import type { MetricTypes } from "../api";
import {
  COMPARED_METRICS,
  CONCURRENCIES,
  type ComparedMetric,
} from "../common";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import "./benchmark.css";

interface Props {
  benchmarks: BenchmarkDataSet[];
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

const COMPARISON_COLORS = [
  "#087f72",
  "#3b6fb6",
  "#c5792a",
  "#8b5ea8",
  "#b8475c",
  "#6f873e",
  "#4d9db4",
  "#805b41",
];

const comparisonColor = (index: number) =>
  COMPARISON_COLORS[index] ??
  `hsl(${((index - COMPARISON_COLORS.length) * 137.508 + 20) % 360}, 62%, 42%)`;

type ChartsData = (ComparedMetric & {
  chartData: ChartData<"bar">;
  hasData: boolean;
  hasMissingData: boolean;
})[];

function CompareFramework({ benchmarks }: Props) {
  const [searchParams] = useSearchParams();
  const sha = searchParams.get("sha");
  const resultsHref = sha
    ? `/result?${new URLSearchParams({ sha }).toString()}`
    : "/result";
  const [frameworkParams, setFrameworkParams] = useQueryState(
    "f",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  const frameworkOptions = useMemo<SelectOptionFramework[]>(
    () =>
      benchmarks.map((b) => ({
        value: b.framework.label,
        label: `${b.language.label} - ${b.framework.label} (${b.framework.version})`,
        color: b.color,
      })),
    [benchmarks],
  );

  const frameworks = useMemo(
    () =>
      frameworkParams
        .map((value) =>
          frameworkOptions.find((option) => option.value === value),
        )
        .filter((option): option is SelectOptionFramework => !!option)
        .map((option, index) => ({ ...option, color: comparisonColor(index) })),
    [frameworkParams, frameworkOptions],
  );

  const selectedBenchmarks = useMemo(
    () =>
      frameworkParams
        .map((framework) =>
          benchmarks.find((b) => b.framework.label === framework),
        )
        .filter((b): b is BenchmarkDataSet => !!b)
        .map((benchmark, index) => ({
          ...benchmark,
          color: comparisonColor(index),
          backgroundColor: comparisonColor(index),
        })),
    [benchmarks, frameworkParams],
  );

  const charts = useMemo<ChartsData>(() => {
    if (!selectedBenchmarks.length) return [];

    const labels = CONCURRENCIES.map(
      (c) => `${!isMobile ? "Concurrency " : ""}${c}`,
    );

    return COMPARED_METRICS.map((metric) => {
      const datasets = selectedBenchmarks.map((b) => ({
        ...b,
        borderRadius: 4,
        maxBarThickness: 56,
        data: CONCURRENCIES.map((c) => {
          let value = b[`level${c}` as const][metric.key];

          if (!Number.isFinite(value)) return null;

          if (isLatencyMetric(metric.key)) {
            value *= 1000;
          }

          return value;
        }),
      }));

      return {
        ...metric,
        hasData: datasets.some((dataset) =>
          dataset.data.some((value) => value !== null),
        ),
        hasMissingData: datasets.some((dataset) =>
          dataset.data.some((value) => value === null),
        ),
        chartData: {
          labels,
          datasets,
        },
      };
    });
  }, [selectedBenchmarks]);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const header = document.getElementById(hash);
    header?.scrollIntoView();
  }, [charts]);

  const onFrameworksChange = (value: SelectOptionFramework[]) => {
    setFrameworkParams(value.map((framework) => String(framework.value)));
  };

  return (
    <div className="benchmark-view">
      <header className="page-heading benchmark-page-heading">
        <div>
          <p className="eyebrow">Side by side</p>
          <h1>Compare HTTP server frameworks</h1>
          <p>
            Build your shortlist. See how throughput and response times change
            as concurrent connections increase.
          </p>
        </div>
        <Link className="button button-secondary" to={resultsHref}>
          View all results <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section
        className="panel benchmark-filters"
        aria-label="Select frameworks to compare"
      >
        <div className="benchmark-filter-heading">
          <h2>Your comparison</h2>
          {frameworkParams.length > 0 && (
            <button
              type="button"
              className="text-button"
              onClick={() => setFrameworkParams([])}
            >
              Clear selection
            </button>
          )}
        </div>
        <div className="benchmark-field">
          <label htmlFor="compare-frameworks">Frameworks</label>
          <FrameworkSelector
            inputId="compare-frameworks"
            value={frameworks}
            options={frameworkOptions}
            onChange={onFrameworksChange}
          />
        </div>
        <p className="benchmark-filter-help" aria-live="polite">
          {frameworks.length > 0
            ? `${frameworks.length} ${frameworks.length === 1 ? "framework" : "frameworks"} selected. Add another to compare, or share this page’s URL to keep your selection.`
            : "Search by framework or language. Select two or more frameworks for a side-by-side comparison."}
        </p>
      </section>

      {charts.length === 0 ? (
        <section className="panel comparison-empty">
          <div className="comparison-empty-bars" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="eyebrow">Your stack, in perspective</p>
          <h2>Start with the frameworks you know.</h2>
          <p>
            Select frameworks above to compare requests per second, average
            latency, and response-time percentiles.
          </p>
          <div className="comparison-empty-facts">
            <span>3 concurrency levels</span>
            <span>9 performance metrics</span>
            <span>Open benchmark data</span>
          </div>
          <Link className="button button-secondary" to={resultsHref}>
            Explore the results <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <div className="comparison-overview">
          <p>
            <strong>
              {selectedBenchmarks.length}{" "}
              {selectedBenchmarks.length === 1 ? "framework" : "frameworks"}
            </strong>{" "}
            · 64, 256 &amp; 512 concurrent connections
          </p>
          <p>Throughput: higher is better. Latency: lower is better.</p>
        </div>
      )}

      <div className="comparison-charts">
        {charts.map((chart) => (
          <section
            className="panel comparison-chart"
            key={chart.key}
            aria-labelledby={chart.key}
          >
            <div className="comparison-chart-heading">
              <div>
                <p className="eyebrow">
                  {isLatencyMetric(chart.key) ? "Response time" : "Throughput"}
                </p>
                <h2 id={chart.key}>
                  <a href={`#${chart.key}`}>
                    {chart.title.replace(" (ms)", "")}
                  </a>
                </h2>
              </div>
              <span className="metric-direction">
                <span aria-hidden="true">
                  {isLatencyMetric(chart.key) ? "↓" : "↑"}
                </span>{" "}
                {isLatencyMetric(chart.key) ? "Lower" : "Higher"} is better
              </span>
            </div>
            {chart.hasData ? (
              <div className="comparison-chart-canvas">
                <Bar
                  role="img"
                  aria-label={`${chart.longTitle || chart.title} for the selected frameworks at 64, 256, and 512 concurrent connections. Exact values are in the data table below.`}
                  data={chart.chartData}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        grid: { display: isMobile, color: "#edf1f4" },
                        border: { display: false },
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: isMobile
                            ? isLatencyMetric(chart.key)
                              ? "Milliseconds (ms)"
                              : "Requests / second"
                            : "Concurrent connections",
                          color: "#657482",
                        },
                        ticks: { color: "#657482", font: { size: 11 } },
                      },
                      y: {
                        grid: { display: !isMobile, color: "#edf1f4" },
                        border: { display: false },
                        beginAtZero: true,
                        title: {
                          display: !isMobile,
                          text: isLatencyMetric(chart.key)
                            ? "Milliseconds (ms)"
                            : "Requests / second",
                          color: "#657482",
                        },
                        ticks: { color: "#657482", font: { size: 11 } },
                      },
                    },
                    indexAxis: isMobile ? "y" : "x",
                    animation: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        align: "start",
                        labels: {
                          color: "#405263",
                          boxWidth: 8,
                          boxHeight: 8,
                          usePointStyle: true,
                          padding: 20,
                          font: { size: 11 },
                        },
                      },
                      tooltip: {
                        mode: isMobile ? "index" : "nearest",
                        backgroundColor: "#152333",
                        padding: 12,
                        callbacks: {
                          label: (context) => {
                            const value = isMobile
                              ? context.parsed.x
                              : context.parsed.y;
                            return `${context.dataset.label}: ${typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${isLatencyMetric(chart.key) ? "ms" : "req/s"}` : "n/a"}`;
                          },
                        },
                      },
                    },
                    transitions: {
                      hide: {
                        animations: {
                          x: {
                            to: 0,
                          },
                          y: {
                            to: 0,
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p className="comparison-missing-data">
                This metric was not reported for the selected frameworks in this
                run.
              </p>
            )}
            {chart.hasData && chart.hasMissingData && (
              <p className="benchmark-filter-help">
                Some values were not reported. Missing values are omitted from
                the chart and marked “n/a” in the table.
              </p>
            )}
            <details className="comparison-data">
              <summary>
                View data table{" "}
                <span>
                  {isLatencyMetric(chart.key)
                    ? "milliseconds"
                    : "requests / second"}
                </span>
              </summary>
              <div
                className="comparison-table-scroll"
                tabIndex={0}
                role="region"
                aria-label={`${chart.title} data table`}
              >
                <table>
                  <caption>
                    {chart.longTitle || chart.title} by concurrent connections
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Framework</th>
                      {CONCURRENCIES.map((concurrency) => (
                        <th key={concurrency} scope="col">
                          {concurrency}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBenchmarks.map((benchmark) => (
                      <tr key={benchmark.id}>
                        <th scope="row">
                          {benchmark.framework.label}{" "}
                          <span className="result-version">
                            {benchmark.framework.version}
                          </span>
                        </th>
                        {CONCURRENCIES.map((concurrency) => {
                          const value =
                            benchmark[`level${concurrency}`][chart.key];
                          return (
                            <td key={concurrency}>
                              {!Number.isFinite(value)
                                ? "n/a"
                                : chart.format
                                  ? chart.format(
                                      chart.round ? Math.round(value) : value,
                                    )
                                  : value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        ))}
      </div>
      {charts.length > 0 && (
        <p className="benchmark-footnote">
          All values come from the same benchmark run. “n/a” means a metric was
          not reported. Use the data tables for exact values; benchmark results
          depend on workload and hardware.
        </p>
      )}
    </div>
  );
}

const LATENCY_METRICS: MetricTypes[] = [
  "percentile50",
  "percentile75",
  "percentile90",
  "percentile99",
  "percentile99999",
  "averageLatency",
  "minimumLatency",
  "maximumLatency",
];

const isLatencyMetric = (key: MetricTypes) => LATENCY_METRICS.includes(key);

export default CompareFramework;
