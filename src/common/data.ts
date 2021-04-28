import { MetricTypes } from "../api";
import { formatLatency, formatThousandSeparated } from "./formatter";

export type ComparedMetric = {
  key: MetricTypes;
  title: string;
  longTitle?: string;
  format?: (...args: any[]) => string | number;
  round?: boolean;
};

export const CONCURRENCIES = [64, 256, 512] as const;

// Data included to compare, each on their own chart (for each 64, 256, and 512)
export const COMPARED_METRICS: ComparedMetric[] = [
  {
    key: "totalRequestsPerS",
    title: "Requests / Second",
    longTitle: "Total Request per Second",
    format: formatThousandSeparated,
    round: true,
  },
  {
    key: "percentile50",
    title: "P50 Latency",
    longTitle: "50th Percentile Latency (ms)",
    format: formatLatency,
  },
  {
    key: "percentile75",
    title: "P75 Latency",
    longTitle: "75th Percentile Latency (ms)",
    format: formatLatency,
  },
  {
    key: "percentile90",
    title: "P90 Latency",
    longTitle: "90th Percentile Latency (ms)",
    format: formatLatency,
  },
  {
    key: "percentile99",
    title: "P99 Latency",
    longTitle: "99th Percentile Latency (ms)",
    format: formatLatency,
  },
  {
    key: "percentile99999",
    title: "P99.999 Latency",
    longTitle: "99.999th Percentile Latency (ms)",
    format: formatLatency,
  },
  {
    key: "averageLatency",
    title: "Average Latency (ms)",
    format: formatLatency,
  },
  {
    key: "minimumLatency",
    title: "Minimum Latency (ms)",
    format: formatLatency,
  },
  {
    key: "maximumLatency",
    title: "Maximum Latency (ms)",
    format: formatLatency,
  },
];
