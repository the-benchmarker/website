import React, { useEffect, useState } from "react";
import chroma from "chroma-js";
import { Benchmark, getBenchmarkData } from "./api";
import { ChartDataSets } from "chart.js";
import randomColor from "randomcolor";

import DataTable from "./components/DataTable";
import BarChart from "./components/BarChart";

export type BenchmarkDataSet = Benchmark & ChartDataSets & { color: string };

function App() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkDataSet[]>([]);

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

  return (
    <div className="container">
      <h1 className="text-center">Chart</h1>
      <BarChart benchmarks={benchmarks} />

      <hr />

      <h1 className="text-center">DataTable</h1>
      <DataTable benchmarks={benchmarks} />
    </div>
  );
}

export default App;
