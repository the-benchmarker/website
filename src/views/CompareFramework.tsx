import { useEffect, useState } from "react";
import {
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { isMobile } from "react-device-detect";

import FrameworkSelector, {
  SelectOptionFramework,
} from "../components/FrameworkSelector";
import { BenchmarkDataSet } from "../App";
import type { MetricTypes } from "../api";
import { COMPARED_METRICS, CONCURRENCIES, ComparedMetric } from "../common";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";

interface Props {
  benchmarks: BenchmarkDataSet[];
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

type ChartsData = (ComparedMetric & { chartData: ChartData })[];

function CompareFramework({ benchmarks }: Props) {
  const [charts, setCharts] = useState<ChartsData>([]);
  const [frameworks, setFrameworks] = useState<SelectOptionFramework[]>([]);

  const [frameworkParams, setFrameworkParams] = useQueryState(
    "f",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const getFrameworkOptions = (): SelectOptionFramework[] => {
    return benchmarks.map((b) => ({
      value: b.framework.label,
      label: `${b.language.label} - ${b.framework.label} (${b.framework.version})`,
      color: b.color,
    }));
  };

  const updateCharts = (benchmarks: BenchmarkDataSet[]) => {
    if (!benchmarks.length) return setCharts([]);

    setCharts(
      COMPARED_METRICS.map((metric) => {
        const labels = CONCURRENCIES.map(
          (c) => `${!isMobile ? "Concurrency " : ""}${c}`
        );

        const datasets = benchmarks.map((b) => ({
          ...b,
          data: CONCURRENCIES.map((c) => {
            let value = b[`level${c}` as const][metric.key];
            if (isLatencyMetric(metric.key)) value *= 1000;
            return value;
          }),
        }));

        return {
          ...metric,
          chartData: { labels, datasets },
        };
      })
    );
  };

  // On charts load, scroll to hash bang
  useEffect(() => {
    const header = document.getElementById(window.location.hash.substring(1));
    if (!header) return;
    header.scrollIntoView();
  }, [charts]);

  // On Benchmark data change
  useEffect(() => {
    if (!benchmarks.length) return;

    const frameworks = frameworkParams || [];
    const frameworkOptions = getFrameworkOptions();

    setFrameworks(
      frameworks
        .map((f) => frameworkOptions.find(({ value }) => f === value))
        .filter((b): b is SelectOptionFramework => !!b)
    );

    // Find benchmark by framework name
    const filteredBenchmark = frameworks
      .map((f) => benchmarks.find((b) => b.framework.label === f))
      .filter((b): b is BenchmarkDataSet => !!b);

    updateCharts(filteredBenchmark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benchmarks]);

  // FrameworkSelector onChange handler
  useEffect(() => {
    if (benchmarks.length)
      setFrameworkParams(
        frameworks.length ? frameworks.map((f) => `${f.value}`) : []
      );

    // Get benchmark data from selected frameworks id
    const filteredBenchmark = frameworks.map(
      (f) => benchmarks.find((b) => b.framework.label === f.value)!
    );

    updateCharts(filteredBenchmark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameworks, benchmarks]);

  return (
    <div>
      <h3 className="text-center">Compare Frameworks</h3>

      <FrameworkSelector
        value={frameworks}
        options={benchmarks.map((b) => ({
          value: b.framework.label,
          label: `${b.language.label} - ${b.framework.label} (${b.framework.version})`,
          color: b.color,
        }))}
        onChange={setFrameworks}
      />

      <div className="pt-md">
        {charts.map((c, i) => (
          <div className="pb-xl" key={i}>
            <h4 id={c.key} className="text-center">
              <a className="decoration-none" href={`#${c.key}`}>
                {c.longTitle || c.title}
              </a>
            </h4>
            <Bar
              data={c.chartData}
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
const isLatencyMetric = (k: MetricTypes) => LATENCY_METRICS.includes(k);

export default CompareFramework;
