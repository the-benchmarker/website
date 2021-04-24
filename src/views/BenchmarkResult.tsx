import { useEffect, useState } from "react";
import Select from "react-select";
import DataTable, { IDataTableColumn } from "react-data-table-component";
import { isMobile } from "react-device-detect";
import { Benchmark, MetricTypes } from "../api";

const levels = [64, 256, 512] as const;
const metrics: Partial<Record<MetricTypes, string>> = {
  totalRequests: "Total Requests",
  percentile50: "P50 Latency",
  percentile75: "P75 Latency",
  percentile90: "P90 Latency",
  percentile99: "P99 Latency",
  percentile99999: "P99.999 Latency",
  minimumLatency: "Minimum Latency",
  averageLatency: "Average Latency",
  maximumLatency: "Maximum Latency",
};

const metricOptions = (Object.keys(metrics) as MetricTypes[]).map((m) => {
  return {
    label: metrics[m]!,
    value: m,
  };
});

const staticColumns: IDataTableColumn<Benchmark>[] = [
  {
    name: "Language",
    selector: ({ language }) => `${language.label} (${language.version})`,
    sortable: true,
  },
  {
    name: "Framework",
    selector: ({ framework }) => framework.version,
    cell: ({ framework }) => (
      <div>
        <a href={framework.website} target="_blank" rel="noreferrer">
          {framework.label}
        </a>{" "}
        ({framework.version})
      </div>
    ),
    sortable: true,
  },
];

const defaultMetric = {
  label: "Total Requests",
  value: "totalRequests",
};

interface SelectOption {
  label: string;
  value: string;
}

interface Props {
  benchmarks: Benchmark[];
}

function BenchmarkResult({ benchmarks }: Props) {
  const [selectedLanguages, setSelectedLanguages] = useState<SelectOption[]>(
    []
  );
  const [selectedMetric, setSelectedMetric] = useState<SelectOption | null>(
    defaultMetric
  );
  const [columns, setColumns] = useState<IDataTableColumn<Benchmark>[]>([]);

  const onChange = (data: any) => {
    setSelectedLanguages(data);
  };

  const scrollToTitle = () => {
    document.getElementById("title")!.scrollIntoView();
  };

  useEffect(() => {
    const metric = (selectedMetric?.value || defaultMetric) as MetricTypes;
    const dynamicColumns = levels.map((l) => {
      return {
        name: `${metrics[metric]} (${l})`,
        selector: (b: Benchmark) => b[`level${l}` as const][metric],
        sortable: true,
        minWidth: "150px",
        right: true,
      };
    });

    setColumns([...staticColumns, ...dynamicColumns]);
  }, [selectedLanguages, selectedMetric]);

  return (
    <div>
      <h3 className="text-center" id="title">
        Benchmark Result
      </h3>

      <Select
        isMulti
        onChange={onChange}
        placeholder="Filter Languages..."
        options={[...new Set(benchmarks.map((b) => b.language))].map(
          ({ label, version }) => ({
            value: label,
            label: `${label} (${version})`,
          })
        )}
      />

      <div style={{ maxWidth: "480px" }}>
        <Select
          onChange={(data) => setSelectedMetric(data!)}
          placeholder="Select Metric..."
          defaultValue={defaultMetric}
          options={metricOptions}
          className="pt-md"
        />
      </div>

      <DataTable
        columns={columns}
        pagination={isMobile}
        paginationPerPage={25}
        paginationRowsPerPageOptions={[25, 50, 100]}
        paginationComponentOptions={{ selectAllRowsItem: true }}
        onChangePage={scrollToTitle}
        data={
          selectedLanguages.length
            ? benchmarks.filter((b) =>
                selectedLanguages.map((l) => l.value).includes(b.language.label)
              )
            : benchmarks
        }
        noHeader
        className="pt-md"
      />
    </div>
  );
}

export default BenchmarkResult;
