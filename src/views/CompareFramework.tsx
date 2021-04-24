import { useEffect, useState } from "react";
import { ChartData } from "chart.js";
import { Bar } from "react-chartjs-2";
import { useHistory } from "react-router-dom";
import { isMobile } from "react-device-detect";

import FrameworkSelector, {
  SelectOption,
} from "../components/FrameworkSelector";
import { BenchmarkDataSet } from "../App";
import useQuery from "../hooks/useQuery";
import { MetricTypes } from "../api";

interface Props {
  benchmarks: BenchmarkDataSet[];
}

type ComparedData = { key: MetricTypes; title: string }[];

const level = [64, 256, 512] as const;

// Data included to compare, each on their own chart (for each 64, 256, and 512)
const comparedData: ComparedData = [
  {
    key: "totalRequests",
    title: "Total Request in 15 seconds",
  },
  {
    key: "percentile50",
    title: "50th Percentile Latency (ms)",
  },
  {
    key: "percentile75",
    title: "75th Percentile Latency (ms)",
  },
  {
    key: "percentile90",
    title: "90th Percentile Latency (ms)",
  },
  {
    key: "percentile99",
    title: "99th Percentile Latency (ms)",
  },
  {
    key: "percentile99999",
    title: "99.999th Percentile Latency (ms)",
  },
  {
    key: "averageLatency",
    title: "Average Latency (ms)",
  },
  {
    key: "minimumLatency",
    title: "Minimum Latency (ms)",
  },
  {
    key: "maximumLatency",
    title: "Maximum Latency (ms)",
  },
];

type ChartsData = { key: string; title: string; chartData: ChartData }[];

function CompareFramework({ benchmarks }: Props) {
  const [charts, setCharts] = useState<ChartsData>([]);
  const [defaultFrameworkIds, setDefaultFrameworkIds] = useState<number[]>([]);
  const history = useHistory();
  const query = useQuery();

  const updateCharts = (benchmarks: BenchmarkDataSet[]) => {
    const charts = comparedData.map(({ title, key }) => {
      return {
        key,
        title,
        chartData: {
          labels: level.map((l) => `${!isMobile ? "Concurrency " : ""}${l}`),
          datasets: benchmarks.map((b) => ({
            ...b,
            data: level.map((l) => b[`level${l}` as const][key]),
          })),
        },
      };
    });
    setCharts(charts);
  };

  useEffect(() => {
    const header = document.getElementById(window.location.hash.substring(1));
    if (!header) return;
    header.scrollIntoView();
  }, [charts]);

  // On Benchmark data change
  useEffect(() => {
    if (!benchmarks.length) return;

    // Get query parameter
    const frameworks = query.get("f")?.split(",");
    if (!frameworks) return;

    // Find benchmark by framework name
    const filteredBenchmark = frameworks.reduce((filtered, name) => {
      const benchmark = benchmarks.find((b) => b.framework.label === name);
      if (benchmark) filtered.push(benchmark);
      return filtered;
    }, [] as BenchmarkDataSet[]);

    setDefaultFrameworkIds(filteredBenchmark.map((b) => b.id));
    updateCharts(filteredBenchmark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benchmarks]);

  // FrameworkSelector onChange handler
  const onChange = (selectedOptions: SelectOption[]) => {
    // Get benchmark data from selected frameworks id
    const filteredBenchmark = selectedOptions.map(
      (option) => benchmarks.find((b) => b.id === option.value)!
    );

    // Set query parameter
    const frameworks = filteredBenchmark
      .map((b) => b.framework.label)
      .join(",");
    history.replace(`/compare?${frameworks ? "f=" + frameworks : ""}`);

    updateCharts(filteredBenchmark);
  };

  return (
    <div>
      <h3 className="text-center">Compare Frameworks</h3>

      <FrameworkSelector
        defaultValue={defaultFrameworkIds}
        options={benchmarks.map((b) => ({
          value: b.id,
          label: `${b.language.label} - ${b.framework.label} (${b.framework.version})`,
          color: b.color,
        }))}
        onChange={onChange}
      />

      <div className="pt-md">
        {charts.map((c, i) => (
          <div className="pb-lg" key={i}>
            <h4 id={c.key} className="text-center">
              <a className="decoration-none" href={`#${c.key}`}>
                {c.title}
              </a>
            </h4>
            <Bar
              type="bar"
              data={c.chartData}
              height={isMobile ? 250 : 100}
              options={{ indexAxis: isMobile ? "y" : "x" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompareFramework;
