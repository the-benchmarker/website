import camelcaseKeys from "camelcase-keys";

interface BenchmarkData {
  data: Benchmark[];
  updatedAt: string;
  hardware?: Hardware;
}

interface BenchmarkHistory {
  sha: string;
  date: string;
}

export interface Benchmark {
  id: number;
  language: Language;
  framework: Framework;
  level64: Record<MetricTypes, number>;
  level256: Record<MetricTypes, number>;
  level512: Record<MetricTypes, number>;
}

interface BenchmarkRawData {
  metrics: Metric[];
  frameworks: Framework[];
  languages: Language[];
  updatedAt: string;
  hardware?: Hardware;
}

interface BenchmarkHistoryRawDataMin {
  sha: string;
  commit: {
    author: {
      date: string;
    };
  };
}

interface Framework {
  id: number;
  label: string;
  version: number | string;
  language: string;
  website: string;
}

interface Language {
  label: string;
  version: number;
}

interface Metric {
  level: 64 | 256 | 512;
  label: MetricTypes;
  value: number;
  frameworkId: number;
}

export interface Hardware {
  cpus: number;
  memory: number;
  cpuName: string;
  os: {
    sysname: string;
    nodename: string;
    release: string;
    version: string;
    machine: string;
  };
}

export type MetricTypes =
  | "averageLatency"
  | "durationMs"
  | "httpErrors"
  | "maximumLatency"
  | "minimumLatency"
  | "percentile50"
  | "percentile75"
  | "percentile90"
  | "percentile99"
  | "percentile99999"
  | "requestTimeouts"
  | "socketConnectionErrors"
  | "socketReadErrors"
  | "socketWriteErrors"
  | "standardDeviation"
  | "totalBytesReceived"
  | "totalRequests"
  | "totalRequestsPerS";

const metricsToObject = (metrics: Metric[], level: Metric["level"]) => {
  return camelcaseKeys(
    metrics
      .filter((m) => m.level === level)
      .reduce((obj, curr) => {
        obj[curr.label] = Math.round(curr.value * 100_000) / 100_000;
        return obj;
      }, {} as Record<MetricTypes, number>)
  );
};

export const getBenchmarkData = async (
  sha = "master"
): Promise<BenchmarkData> => {
  const response = await fetch(
    `https://raw.githubusercontent.com/the-benchmarker/web-frameworks/${sha}/data.min.json`
  );

  const data: BenchmarkRawData = camelcaseKeys(await response.json(), {
    deep: true,
  });

  // Filter out frameworks with incomplete metrics
  const requiredLevels: Metric["level"][] = [64, 256, 512];
  const requiredLabels = Array.from(new Set(data.metrics.map((m) => m.label)));
  const frameworkMaps = new Map<number, Map<string, Set<Metric["level"]>>>();
  for (const m of data.metrics) {
    let labelMap = frameworkMaps.get(m.frameworkId);
    if (!labelMap) frameworkMaps.set(m.frameworkId, (labelMap = new Map()));
    let levels = labelMap.get(String(m.label));
    if (!levels) labelMap.set(String(m.label), (levels = new Set()));
    levels.add(m.level);
  }
  data.frameworks = data.frameworks.filter((fw) => {
    const labelMap = frameworkMaps.get(fw.id);
    if (!labelMap) return false;
    return requiredLabels.every((label) => {
      const levels = labelMap.get(String(label));
      if (!levels) return false;
      return requiredLevels.every((lvl) => levels.has(lvl));
    });
  });

  return {
    updatedAt: data.updatedAt,
    hardware: data.hardware,
    data: data.frameworks.map((f) => {
      const metrics = data.metrics.filter((m) => m.frameworkId === f.id);
      return {
        id: f.id,
        framework: f,
        language: data.languages.find((l) => l.label === f.language)!,
        level64: metricsToObject(metrics, 64),
        level256: metricsToObject(metrics, 256),
        level512: metricsToObject(metrics, 512),
      };
    }),
  };
};

export const getBenchmarkHistories = async (): Promise<BenchmarkHistory[]> => {
  const response = await fetch(
    "https://api.github.com/repos/the-benchmarker/web-frameworks/commits?path=data.min.json"
  );

  const data: BenchmarkHistoryRawDataMin[] = await response.json();

  return data.map((r) => ({
    sha: r.sha,
    date: `${r.commit.author.date.split("T")[0]} (${r.sha.substring(0, 7)})`,
  }));
};
