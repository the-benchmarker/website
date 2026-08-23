import { useEffect, useMemo } from "react";
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

interface Props {
  benchmarks: BenchmarkDataSet[];
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

type ChartsData = (ComparedMetric & { chartData: ChartData<"bar"> })[];

function CompareFramework({ benchmarks }: Props) {
  const [frameworkParams, setFrameworkParams] = useQueryState(
    "f",
    parseAsArrayOf(parseAsString).withDefault([])
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
        .filter((option): option is SelectOptionFramework => !!option),
    [frameworkParams, frameworkOptions],
  );

  const selectedBenchmarks = useMemo(
    () =>
      frameworkParams
        .map((framework) =>
          benchmarks.find((b) => b.framework.label === framework),
        )
        .filter((b): b is BenchmarkDataSet => !!b),
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
        data: CONCURRENCIES.map((c) => {
          let value = b[`level${c}` as const][metric.key];

          if (isLatencyMetric(metric.key)) {
            value *= 1000;
          }

          return value;
        }),
      }));

      return {
        ...metric,
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
    <div>
      <h3 className="text-center">Compare Frameworks</h3>

      <FrameworkSelector
        value={frameworks}
        options={frameworkOptions}
        onChange={onFrameworksChange}
      />

      <div className="pt-md">
        {charts.map((chart) => (
          <div className="pb-xl" key={chart.key}>
            <h4 id={chart.key} className="text-center">
              <a className="decoration-none" href={`#${chart.key}`}>
                {chart.longTitle || chart.title}
              </a>
            </h4>

            <Bar
              data={chart.chartData}
              height={isMobile ? 250 : 100}
              options={{
                scales: {
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                  y: {
                    grid: {
                      display: false,
                    },
                  },
                },
                indexAxis: isMobile ? "y" : "x",
                animation: isMobile ? false : undefined,
                plugins: {
                  tooltip: {
                    mode: isMobile ? "index" : "nearest",
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
        ))}
      </div>
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
