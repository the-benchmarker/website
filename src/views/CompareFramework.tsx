import { useEffect, useState } from "react";
import { ChartData, ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2";
import { useQueryParam } from "use-query-params";
import { isMobile } from "react-device-detect";

import FrameworkSelector, {
  SelectOptionFramework,
} from "../components/FrameworkSelector";
import { BenchmarkDataSet } from "../App";
import {
  COMPARED_METRICS,
  CONCURRENCIES,
  ComparedMetric,
  CommaArrayParam,
} from "../common";

interface Props {
  benchmarks: BenchmarkDataSet[];
}

type ChartsData = (ComparedMetric & { chartData: ChartData })[];

function CompareFramework({ benchmarks }: Props) {
  const [charts, setCharts] = useState<ChartsData>([]);
  const [frameworks, setFrameworks] = useState<SelectOptionFramework[]>([]);
  const [query, setQuery] = useQueryParam("f", CommaArrayParam);

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
          data: CONCURRENCIES.map((c) => b[`level${c}` as const][metric.key]),
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

    const frameworks = query || [];
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
      setQuery(
        frameworks.length ? frameworks.map((f) => `${f.value}`) : undefined
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
              type="bar"
              data={c.chartData}
              height={isMobile ? 250 : 100}
              options={
                {
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
                } as ChartOptions
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompareFramework;
