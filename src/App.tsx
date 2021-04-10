import React, { useEffect, useState } from "react";
import chroma from "chroma-js";
import { Benchmark, getBenchmarkData } from "./api";
import { ChartDataSets } from "chart.js";
import randomColor from "randomcolor";
import { BrowserRouter as Router } from "react-router-dom";
import CacheRoute, { CacheSwitch } from "react-router-cache-route";

import FrameworksTable from "./views/FrameworksTable";
import FrameworksChart from "./views/FrameworksChart";
import NavBar from "./components/NavBar";

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
    <Router>
      <div>
        <div className="text-center">
          <h1>Web Frameworks Benchmark</h1>
          <NavBar />
          <hr />
        </div>

        <div className="container">
          <CacheSwitch>
            <CacheRoute exact path={["/", "/table"]}>
              <FrameworksTable benchmarks={benchmarks} />
            </CacheRoute>
            <CacheRoute path="/chart">
              <FrameworksChart benchmarks={benchmarks} />
            </CacheRoute>
          </CacheSwitch>
        </div>
      </div>
    </Router>
  );
}

export default App;
