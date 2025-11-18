import type { Metric } from "web-vitals";

const reportWebVitals = async (onPerfEntry?: (metric: Metric) => void) => {
  if (!onPerfEntry || typeof onPerfEntry !== "function") return;

  const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import("web-vitals");

  onCLS(onPerfEntry);
  onINP(onPerfEntry);
  onFCP(onPerfEntry);
  onLCP(onPerfEntry);
  onTTFB(onPerfEntry);
};

export default reportWebVitals;
