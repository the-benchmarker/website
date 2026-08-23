import { useMemo } from "react";
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

const metricOptions = COMPARED_METRICS.map((m) => ({
  label: m.title,
  value: m.key,
}));

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
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [languageParams, setLanguageParams] = useQueryState(
    "l",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [metricParam, setMetricParam] = useQueryState("metric");
  const [sortParams, setSortParams] = useQueryStates({
    asc: parseAsBoolean.withDefault(false),
    orderBy: parseAsString.withDefault("level64"),
  });

  const languages = useMemo(() => {
    return [...new Set(benchmarks.map((b) => b.language))]
      .map(({ label, version }) => ({
        value: label,
        label: `${label} (${version})`,
      }))
      .filter((language) => languageParams.includes(language.value));
  }, [benchmarks, languageParams]);

  const frameworks = useMemo(() => {
    return benchmarks
      .map((b) => ({
        value: b.framework.label,
        label: `${b.language.label} - ${b.framework.label} (${b.framework.version})`,
      }))
      .filter((framework) => frameworkParams.includes(framework.value));
  }, [benchmarks, frameworkParams]);

  const metric = useMemo(() => {
    const value = metricParam || defaultMetric.value;

    return metricOptions.find((m) => m.value === value) || defaultMetric;
  }, [metricParam]);

  const columns = useMemo<TableColumn<Benchmark>[]>(() => {
    const { key, title, format, round } = COMPARED_METRICS.find(
      ({ key }) => key === (metric.value as MetricTypes),
    )!;

    const dynamicColumns = CONCURRENCIES.map((c) => ({
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
    }));

    return [...staticColumns, ...dynamicColumns];
  }, [metric]);

  const tableData = useMemo(() => {
    if (!frameworks.length && !languages.length) {
      return benchmarks;
    }

    const languageValues = new Set(languages.map((l) => l.value));
    const frameworkValues = new Set(frameworks.map((f) => f.value));

    return benchmarks.filter(
      (b) =>
        languageValues.has(b.language.label) ||
        frameworkValues.has(b.framework.label),
    );
  }, [benchmarks, frameworks, languages]);

  const scrollToTitle = () => {
    document.getElementById("title")?.scrollIntoView();
  };

  const onLanguagesChange = (options: SelectOption[]) => {
    setLanguageParams(
      options.length ? options.map((l) => String(l.value)) : [],
    );
  };

  const onFrameworksChange = (options: SelectOptionFramework[]) => {
    setFrameworkParams(
      options.length ? options.map((f) => String(f.value)) : [],
    );
  };

  const onMetricChange = (option: SelectOption | null) => {
    setMetricParam(option?.value.toString() || "");
  };

  const onTableSort = (
    column: TableColumn<Benchmark>,
    direction: "asc" | "desc"
  ) => {
    setSortParams({
      orderBy: column.id?.toString(),
      asc: direction === "asc",
    });
  };

  return (
    <div>
      <h3 className="text-center" id="title">
        Benchmark Result
      </h3>

      <Select
        isMulti
        value={languages}
        onChange={(data) => onLanguagesChange(data as SelectOption[])}
        options={[...new Set(benchmarks.map((b) => b.language))].map(
          ({ label, version }) => ({
            value: label,
            label: `${label} (${version})`,
          }),
        )}
        placeholder="Filter Languages..."
      />

      <div className="pt-md">
        <FrameworkSelector
          value={frameworks}
          options={benchmarks.map((b) => ({
            value: b.framework.label,
            label: `${b.language.label} - ${b.framework.label} (${b.framework.version})`,
          }))}
          disableStyle
          onChange={onFrameworksChange}
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
        render={({ content }) =>
          content ? <HttpErrorsTooltip errorsString={content} /> : null
        }
      />

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
    </div>
  );
}

export default BenchmarkResult;
