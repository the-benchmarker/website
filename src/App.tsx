import React, { useEffect, useState } from "react";
import chroma from "chroma-js";
import { Bar } from "react-chartjs-2";
import { ChartData, ChartDataSets } from "chart.js";
import randomColor from "randomcolor";

import { Benchmark, getBenchmarkData } from "./api";
import FrameworkSelector, {
  SelectOption,
} from "./components/FrameworkSelector";

type BenchmarkDataSet = Benchmark & ChartDataSets & { color: string };

function App() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkDataSet[]>([]);
  const [data, setData] = useState<ChartData>({
    labels: ["Speed (64)", "Speed (256)", "Speed (512)"],
    datasets: [],
  });

  // Fetch data
  useEffect(() => {
    (async () => {
      const benchmarks = await getBenchmarkData();
      const colors = randomColor({
        count: benchmarks.length,
        luminosity: "dark",
      });

      // Map data, add additional property for chart datasets
      const data: BenchmarkDataSet[] = benchmarks.map((b, i) => {
        return {
          ...b,
          color: colors[i],
          label: `${b.framework.name} (${b.framework.version})`,
          data: [b.speed64, b.speed256, b.speed512],
          backgroundColor: chroma(colors[i]).brighten(1).hex(),
        };
      });

      setBenchmarks(data);
    })();
  }, []);

  // FrameworkSelector onChange handler
  const onChange = (selectedOptions: SelectOption[]) => {
    // Get benchmark data from selected frameworks id
    const filteredBenchmark = selectedOptions.map(
      (option) => benchmarks.find((b) => b.id === option.value)!
    );

    setData({ ...data, datasets: filteredBenchmark });
  };

  return (
    <div className="container pt-lg">
      <FrameworkSelector
        options={benchmarks.map((b) => ({
          value: b.id,
          label: `${b.language} - ${b.framework.name} (${b.framework.version})`,
          color: b.color,
        }))}
        onChange={onChange}
      />

      <div className="pt-lg">
        <Bar data={data} height={100} />
      </div>
    </div>
  );
}

export default App;
