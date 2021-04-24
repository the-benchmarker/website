import { MetricTypes } from "../api";

export type ComparedMetric = {
  key: MetricTypes;
  title: string;
  longTitle?: string;
};

export const CONCURRENCIES = [64, 256, 512] as const;

// Data included to compare, each on their own chart (for each 64, 256, and 512)
export const COMPARED_METRICS: ComparedMetric[] = [
  {
    key: "totalRequests",
    title: "Total Requests",
    longTitle: "Total Request in 15 seconds",
  },
  {
    key: "percentile50",
    title: "P50 Latency",
    longTitle: "50th Percentile Latency (ms)",
  },
  {
    key: "percentile75",
    title: "P75 Latency",
    longTitle: "75th Percentile Latency (ms)",
  },
  {
    key: "percentile90",
    title: "P90 Latency",
    longTitle: "90th Percentile Latency (ms)",
  },
  {
    key: "percentile99",
    title: "P99 Latency",
    longTitle: "99th Percentile Latency (ms)",
  },
  {
    key: "percentile99999",
    title: "P99.999 Latency",
    longTitle: "99.999th Percentile Latency (ms)",
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
