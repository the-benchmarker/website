import { useEffect, useState } from "react";
import Select from "react-select";
import DataTable, { type TableColumn } from "react-data-table-component";
import { isMobile } from "react-device-detect";
import { Tooltip } from "react-tooltip";
import FrameworkSelector, {
  type SelectOptionFramework,
} from "../components/FrameworkSelector";
import HttpErrorsTooltip from "../components/HttpErrorsTooltip";
import type { Benchmark, MetricTypes } from "../api";
import { COMPARED_METRICS, CONCURRENCIES, type SelectOption } from "../common";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";

const defaultMetric = {
  label: "Requests / Second",
  value: "totalRequestsPerS",
};

const metricOptions = COMPARED_METRICS.map((m) => {
  return {
    label: m.title,
    value: m.key,
  };
});

const staticColumns: TableColumn<Benchmark>[] = [
  {
    id: "language",
    name: "Language",
    selector: ({ language }) => `${language.label} (${language.version})`,
    sortable: true,
  },
  {
    id: "framework",
    name: "Framework",
    selector: ({ framework }) => framework.version,
    cell: (b) => {
      const id = `tooltip-${b.id}`;
      const httpErrors = [
        b.level64.httpErrors,
        b.level256.httpErrors,
        b.level512.httpErrors,
      ];

      return (
        <div>
          <a href={b.framework.website} target="_blank" rel="noreferrer">
            {b.framework.label}
          </a>{" "}
          ({b.framework.version})
          {httpErrors.some((e) => e > 0) && (
            <span
              className="tooltip-danger align-middle tooltip-trigger"
              id={id}
              data-tooltip-place="right"
              data-tooltip-content={JSON.stringify(httpErrors)}
            />
          )}
        </div>
      );
    },
    sortable: true,
  },
];

interface Props {
  benchmarks: Benchmark[];
}

function BenchmarkResult({ benchmarks }: Props) {
  const [frameworkParams, setFrameworkParams] = useQueryState(
    "f",
    parseAsArrayOf(parseAsString)
  );
  const [languageParams, setLanguageParams] = useQueryState(
    "l",
    parseAsArrayOf(parseAsString)
  );
  const [metricParam, setMetricParam] = useQueryState("metric");
  const [sortParams, setSortParams] = useQueryStates({
    asc: parseAsBoolean.withDefault(false),
    orderBy: parseAsString.withDefault("level64"),
  });

  const metricValue = metricParam || defaultMetric.value;
  const initialMetric =
    metricOptions.find((m) => m.value === metricValue) || defaultMetric;

  const [languages, setLanguages] = useState<SelectOption[]>([]);
  const [frameworks, setFrameworks] = useState<SelectOptionFramework[]>([]);
  const [tableData, setTableData] = useState<Benchmark[]>([]);
  const [metric, setMetric] = useState<SelectOption | null>(initialMetric);
  const [columns, setColumns] = useState<TableColumn<Benchmark>[]>([]);

  const getLanguagesOptions = (): SelectOption[] => {
    return [...new Set(benchmarks.map((b) => b.language))].map(
      ({ label, version }) => ({
        value: label,
        label: `${label} (${version})`,
      })
    );
  };

  const getFrameworkOptions = (): SelectOptionFramework[] => {
    return benchmarks.map((b) => ({
      value: b.framework.label,
      label: `${b.language.label} - ${b.framework.label} (${b.framework.version})`,
    }));
  };

  const scrollToTitle = () => {
    document.getElementById("title")!.scrollIntoView();
  };

  // Handler for metric selector
  const onMetricChange = (option: SelectOption | null) => {
    setMetricParam(option?.value.toString() || "");
    setMetric(option);
  };

  // Handler for table sort
  const onTableSort = (
    column: TableColumn<Benchmark>,
    direction: "asc" | "desc"
  ) => {
    setSortParams({ orderBy: column.id?.toString(), asc: direction === "asc" });
  };

  // set languages and frameworks select options value from query params
  useEffect(() => {
    const languages = languageParams || [];
    const frameworks = frameworkParams || [];
    const metric = metricParam || defaultMetric.value;
    setLanguages(
      getLanguagesOptions().filter((l) => languages.includes(`${l.value}`))
    );
    setFrameworks(
      getFrameworkOptions().filter((f) => frameworks.includes(`${f.value}`))
    );
    setMetric(metricOptions.find((m) => m.value === metric) || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benchmarks]);

  // on metric change
  useEffect(() => {
    // Get metric data by metric key
    const { key, title, format, round } = COMPARED_METRICS.find(
      ({ key }) => key === ((metric?.value || defaultMetric) as MetricTypes)
    )!;

    // create columns based on selected metric
    const dynamicColumns = CONCURRENCIES.map((c) => {
      return {
        id: `level${c}`,
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
  }, [metric]);

  // on filter frameworks or languages change
  useEffect(() => {
    if (benchmarks.length) {
      // setQuery({
      //   l: languages.length ? languages.map((l) => `${l.value}`) : undefined,
      //   f: frameworks.length ? frameworks.map((f) => `${f.value}`) : undefined,
      // });
      setLanguageParams(
        languages.length ? languages.map((l) => `${l.value}`) : []
      );
      setFrameworkParams(
        frameworks.length ? frameworks.map((f) => `${f.value}`) : []
      );
    }

    if (!frameworks.length && !languages.length)
      return setTableData(benchmarks);

    const filteredBenchmark = benchmarks.filter(
      (b) =>
        languages.map((l) => l.value).includes(b.language.label) ||
        frameworks.map((f) => f.value).includes(b.framework.label)
    );

    setTableData(filteredBenchmark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameworks, languages, benchmarks]);

  return (
    <div>
      <h3 className="text-center" id="title">
        Benchmark Result
      </h3>
      <Select
        isMulti
        value={languages}
        onChange={(data) => setLanguages(data as SelectOption[])}
        options={getLanguagesOptions()}
        placeholder="Filter Languages..."
      />
      <div className="pt-md">
        <FrameworkSelector
          value={frameworks}
          options={getFrameworkOptions()}
          disableStyle
          onChange={setFrameworks}
        />
      </div>
      <div style={{ maxWidth: "480px" }}>
        <Select
          onChange={onMetricChange}
          value={metric}
          options={metricOptions}
          isSearchable={false}
          placeholder="Select Metric..."
          className="pt-md"
        />
      </div>
      <Tooltip
        anchorSelect=".tooltip-trigger"
        style={{ zIndex: 9999 }}
        render={({ content }) => (
          <HttpErrorsTooltip errorsString={content || undefined} />
        )}
      />

      {columns.length > 0 ? (
        <DataTable
          columns={columns}
          pagination={isMobile}
          paginationPerPage={25}
          paginationRowsPerPageOptions={[25, 50, 100]}
          paginationComponentOptions={{ selectAllRowsItem: true }}
          onChangePage={scrollToTitle}
          onSort={onTableSort}
          data={tableData}
          defaultSortFieldId={sortParams.orderBy}
          defaultSortAsc={sortParams.asc}
          noHeader
          className="pt-md"
        />
      ) : null}
    </div>
  );
}

export default BenchmarkResult;
