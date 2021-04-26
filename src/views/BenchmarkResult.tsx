import { useEffect, useState } from "react";
import Select from "react-select";
import DataTable, { IDataTableColumn } from "react-data-table-component";
import { isMobile } from "react-device-detect";
import { Benchmark, MetricTypes } from "../api";
import { COMPARED_METRICS, CONCURRENCIES, SelectOption } from "../common";

const defaultMetric = {
  label: "Total Requests",
  value: "totalRequests",
};

const metricOptions = COMPARED_METRICS.map((m) => {
  return {
    label: m.title,
    value: m.key,
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

interface Props {
  benchmarks: Benchmark[];
}

function BenchmarkResult({ benchmarks }: Props) {
  const [languages, setLanguages] = useState<SelectOption[]>([]);
  const [metric, setMetric] = useState<SelectOption | null>(defaultMetric);
  const [columns, setColumns] = useState<IDataTableColumn<Benchmark>[]>([]);

  const scrollToTitle = () => {
    document.getElementById("title")!.scrollIntoView();
  };

  // On filtered languages and selectric metric change
  useEffect(() => {
    // Get metric data by metric key
    const { key, title, format, round } = COMPARED_METRICS.find(
      ({ key }) => key === ((metric?.value || defaultMetric) as MetricTypes)
    )!;

    // create columns based on selected metric
    const dynamicColumns = CONCURRENCIES.map((c) => {
      return {
        name: `${title} (${c})`,
        selector: (b: Benchmark) => b[`level${c}` as const][key],
        sortable: true,
        format: (b: Benchmark) => {
          let value: string | number = b[`level${c}` as const][key];
          if (round) value = Math.round(value);
          if (format) value = format(value);
          return value;
        },
        minWidth: "150px",
        right: true,
      };
    });

    setColumns([...staticColumns, ...dynamicColumns]);
  }, [languages, metric]);

  return (
    <div>
      <h3 className="text-center" id="title">
        Benchmark Result
      </h3>

      <Select
        isMulti
        onChange={(data) => setLanguages(data as SelectOption[])}
        options={[...new Set(benchmarks.map((b) => b.language))].map(
          ({ label, version }) => ({
            value: label,
            label: `${label} (${version})`,
          })
        )}
        placeholder="Filter Languages..."
      />

      <div style={{ maxWidth: "480px" }}>
        <Select
          onChange={setMetric}
          defaultValue={defaultMetric}
          options={metricOptions}
          placeholder="Select Metric..."
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
          languages.length
            ? benchmarks.filter((b) =>
                languages.map((l) => l.value).includes(b.language.label)
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
