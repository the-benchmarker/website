import { useEffect, useState, lazy, Suspense } from "react";
import { random as randomColor } from "colord";
import { Benchmark, getBenchmarkData, Hardware } from "./api";
import { BrowserRouter, Route, Routes } from "react-router";

import Home from "./views/Home";
import AppHeader from "./components/AppHeader";
import ScrollToTop from "./components/ScrollToTop";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";

import KeepAlive from "./components/KeepAlive";

const BenchmarkResult = lazy(() => import("./views/BenchmarkResult"));
const CompareFrameworks = lazy(() => import("./views/CompareFramework"));

export type BenchmarkDataSet = Benchmark & {
  color: string;
  label: string;
  backgroundColor: string;
};

function App() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkDataSet[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [hardware, setHardware] = useState<Hardware | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBenchmarkData = async (sha = "master", updateDate = false) => {
    setIsLoading(true);
    const {
      data: benchmarks,
      updatedAt,
      hardware,
    } = await getBenchmarkData(sha);

    // Map data, add additional property for chart datasets
    const data: BenchmarkDataSet[] = benchmarks.map((b) => {
      const color = randomColor();
      return {
        ...b,
        color: color.darken(0.2).toHex(),
        label: `${b.framework.label} (${b.framework.version})`,
        backgroundColor: color.lighten().toHex(),
      };
    });

    setBenchmarks(data);
    if (updateDate) setUpdatedAt(updatedAt.split(" ")[0]);
    setHardware(hardware);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBenchmarkData(
      new URLSearchParams(window.location.search).get("sha") ?? "master",
      true
    );
  }, []);

  return (
    <BrowserRouter>
      <NuqsAdapter>
        <div>
          <AppHeader onHistoryChange={fetchBenchmarkData} />
          <ScrollToTop />
          {isLoading && <div className="loader">Loading...</div>}
          <div className={`container ${isLoading ? "hidden" : ""}`}>
            <Suspense fallback={<div className="loader">Loading...</div>}>
              <Routes>
                <Route path="/" element={<KeepAlive />}>
                  <Route
                    path=""
                    element={
                      <Home updateDate={updatedAt} hardware={hardware} />
                    }
                  />
                  <Route
                    path="/result"
                    element={<BenchmarkResult benchmarks={benchmarks} />}
                  />
                  <Route
                    path="/compare"
                    element={<CompareFrameworks benchmarks={benchmarks} />}
                  />
                </Route>
              </Routes>
            </Suspense>
          </div>
          {/* Bottom Space */}
          <div style={{ height: "25vh" }}></div>{" "}
        </div>
      </NuqsAdapter>
    </BrowserRouter>
  );
}

export default App;
