import { useEffect, useState } from "react";
import { ChartData } from "chart.js";
import { Bar } from "react-chartjs-2";
import { useHistory } from "react-router-dom";

import FrameworkSelector, {
  SelectOption,
} from "../components/FrameworkSelector";
import { BenchmarkDataSet } from "../App";
import useQuery from "../hooks/useQuery";
import { MetricTypes } from "../api";

interface Props {
  benchmarks: BenchmarkDataSet[];
}

const level = [64, 256, 512] as const;

// Data included to compare, each on their own chart (for each 64, 256, and 512)
const comparedData: { key: MetricTypes; title: string }[] = [
  {
    key: "totalRequests",
    title: "Total Request in 15 seconds",
  },
  {
    key: "averageLatency",
    title: "Average Latency (ms)",
  },
  {
    key: "minimimLatency",
    title: "Minimum Latency (ms)",
  },
  {
    key: "maximumLatency",
    title: "Maximum Latency (ms)",
  },
];

type ChartsData = { title: string; chartData: ChartData }[];

function BarChart({ benchmarks }: Props) {
  const [charts, setCharts] = useState<ChartsData>([]);
  const [defaultFrameworkIds, setDefaultFrameworkIds] = useState<number[]>([]);
  const history = useHistory();
  const query = useQuery();

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

    const charts: ChartsData = comparedData.map(({ title, key }) => {
      return {
        title,
        chartData: {
          labels: level.map((l) => `Concurrency ${l}`),
          datasets: filteredBenchmark.map((b) => ({
            ...b,
            data: [b.level64[key], b.level256[key], b.level512[key]],
          })),
        },
      };
    });

    setCharts(charts);
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

    setCharts(
      comparedData.map(({ title, key }) => {
        return {
          title,
          chartData: {
            labels: level.map((l) => `Concurrency ${l}`),
            datasets: filteredBenchmark.map((b) => ({
              ...b,
              data: [b.level64[key], b.level256[key], b.level512[key]],
            })),
          },
        };
      })
    );
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
            <h4 className="text-center"> {c.title} </h4>
            <Bar data={c.chartData} height={100} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default BarChart;
