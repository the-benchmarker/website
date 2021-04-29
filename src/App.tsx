import React, { useEffect, useState, lazy, Suspense } from "react";
import chroma from "chroma-js";
import { Benchmark, getBenchmarkData } from "./api";
import randomColor from "randomcolor";
import {
  QueryParamProvider,
  transformSearchStringJsonSafe,
} from "use-query-params";
import { BrowserRouter as Router, Route } from "react-router-dom";
import CacheRoute, { CacheSwitch } from "react-router-cache-route";

import Home from "./views/Home";
import AppHeader from "./components/AppHeader";
import ScrollToTop from "./components/ScrollToTop";

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
  const [isLoading, setIsLoading] = useState(true);

  const fetchBenchmarkData = async (sha = "master", updateDate = false) => {
    setIsLoading(true);
    const { data: benchmarks, updatedAt } = await getBenchmarkData(sha);
    const colors = randomColor({
      count: benchmarks.length,
      luminosity: "dark",
    });

    // Map data, add additional property for chart datasets
    const data: BenchmarkDataSet[] = benchmarks.map((b, i) => {
      return {
        ...b,
        color: colors[i],
        label: `${b.framework.label} (${b.framework.version})`,
        backgroundColor: chroma(colors[i]).brighten(1).hex(),
      };
    });

    setBenchmarks(data);
    if (updateDate) setUpdatedAt(updatedAt.split(" ")[0]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBenchmarkData(
      new URLSearchParams(window.location.search).get("sha") ?? "master",
      true
    );
  }, []);

  return (
    <Router>
      <QueryParamProvider
        ReactRouterRoute={Route}
        stringifyOptions={{
          transformSearchString: transformSearchStringJsonSafe,
        }}
      >
        <div>
          <AppHeader onHistoryChange={fetchBenchmarkData} />
          <ScrollToTop />
          {isLoading ? <div className="loader">Loading...</div> : undefined}
          <div className={`container ${isLoading ? "hidden" : ""}`}>
            <Suspense fallback={<div className="loader">Loading...</div>}>
              <CacheSwitch>
                <CacheRoute exact path="/">
                  <Home updateDate={updatedAt} />
                </CacheRoute>
                <CacheRoute exact path="/result">
                  <BenchmarkResult benchmarks={benchmarks} />
                </CacheRoute>
                <CacheRoute path="/compare">
                  <CompareFrameworks benchmarks={benchmarks} />
                </CacheRoute>
              </CacheSwitch>
            </Suspense>
          </div>
          {/* Bottom Space */}
          <div style={{ height: "25vh" }}></div>{" "}
        </div>
      </QueryParamProvider>
    </Router>
  );
}

export default App;
