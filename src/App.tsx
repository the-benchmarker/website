import { useEffect, useState, lazy, Suspense } from "react";
import { type Benchmark, getBenchmarkData, type Hardware } from "./api";
import { BrowserRouter, Route, Routes, useSearchParams } from "react-router";
import Home from "./views/Home";
import AppHeader from "./components/AppHeader";
import Seo from "./components/Seo";
import ScrollToTop from "./components/ScrollToTop";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import KeepAliveRouteOutlet from "keepalive-for-react-router";

const BenchmarkResult = lazy(() => import("./views/BenchmarkResult"));
const CompareFrameworks = lazy(() => import("./views/CompareFramework"));
const CHART_COLORS = [
  "#087f72",
  "#4475bb",
  "#a56729",
  "#8760a7",
  "#c75262",
  "#347e95",
  "#6b8035",
  "#9b557f",
];

export type BenchmarkDataSet = Benchmark & {
  color: string;
  label: string;
  backgroundColor: string;
};

function BenchmarkApp() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkDataSet[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [hardware, setHardware] = useState<Hardware | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [searchParams] = useSearchParams();
  const sha = searchParams.get("sha") || "master";

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const result = await getBenchmarkData(sha);
        if (!active) return;
        setBenchmarks(
          result.data.map((b) => {
            const hash = [...`${b.language.label}/${b.framework.label}`].reduce(
              (value, char) => value + char.charCodeAt(0),
              0,
            );
            const color = CHART_COLORS[hash % CHART_COLORS.length];
            return {
              ...b,
              color,
              label: `${b.framework.label} (${b.framework.version})`,
              backgroundColor: `${color}b3`,
            };
          }),
        );
        setUpdatedAt(result.updatedAt.split(/[ T]/)[0]);
        setHardware(result.hardware);
      } catch {
        if (active) {
          setError(true);
          setBenchmarks([]);
          setHardware(undefined);
          setUpdatedAt("");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void fetchData();
    return () => {
      active = false;
    };
  }, [sha, retry]);

  const loading = (
    <div className="loading-state" role="status">
      <span className="loader" aria-hidden="true" />
      <p>Loading benchmark results…</p>
    </div>
  );

  return (
    <>
      <Seo />
      <AppHeader />
      <ScrollToTop />
      <main id="main-content" tabIndex={-1} className="container main-content">
        {error && (
          <div className="error-state" role="alert">
            <div>
              <strong>The benchmark data could not be loaded.</strong>
              <p>
                Please try again, or explore the{" "}
                <a href="/frameworks/">framework directory</a>.
              </p>
            </div>
            <button
              className="button button-secondary"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        )}
        <Suspense fallback={loading}>
          <Routes>
            <Route path="/" element={<KeepAliveRouteOutlet />}>
              <Route
                index
                element={
                  <Home
                    updateDate={updatedAt}
                    hardware={hardware}
                    benchmarks={isLoading ? [] : benchmarks}
                    isLoading={isLoading}
                  />
                }
              />
              <Route
                path="result"
                element={
                  isLoading ? (
                    loading
                  ) : (
                    <BenchmarkResult benchmarks={benchmarks} />
                  )
                }
              />
              <Route
                path="compare"
                element={
                  isLoading ? (
                    loading
                  ) : (
                    <CompareFrameworks benchmarks={benchmarks} />
                  )
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <a
              className="footer-brand"
              href="https://github.com/the-benchmarker"
            >
              The Benchmarker
            </a>
            <p>Performance is a starting point. Build with perspective.</p>
          </div>
          <nav aria-label="Footer navigation">
            <a
              href="https://github.com/the-benchmarker/web-frameworks"
              target="_blank"
              rel="noreferrer"
            >
              Benchmark source <span aria-hidden="true">↗</span>
            </a>
            <a href="/frameworks/">Framework directory</a>
            <a
              href="https://github.com/the-benchmarker/website/issues"
              target="_blank"
              rel="noreferrer"
            >
              Report an issue <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <NuqsAdapter>
      <BrowserRouter>
        <BenchmarkApp />
      </BrowserRouter>
    </NuqsAdapter>
  );
}
