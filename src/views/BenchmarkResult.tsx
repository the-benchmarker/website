import { useState } from "react";
import Select from "react-select";
import DataTable, { IDataTableColumn } from "react-data-table-component";
import { isMobile } from "react-device-detect";
import { Benchmark } from "../api";

const columns: IDataTableColumn<Benchmark>[] = [
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
  {
    name: "Speed (64)",
    selector: ({ level64 }) => level64.totalRequests,
    sortable: true,
  },
  {
    name: "Speed (256)",
    selector: ({ level256 }) => level256.totalRequests,
    sortable: true,
  },
  {
    name: "Speed (512)",
    selector: ({ level512 }) => level512.totalRequests,
    sortable: true,
  },
];

interface SelectOption {
  label: string;
  value: string;
}

interface Props {
  benchmarks: Benchmark[];
}

function Table({ benchmarks }: Props) {
  const [selectedLanguages, setSelectedLanguages] = useState<SelectOption[]>(
    []
  );

  console.log(benchmarks);

  const onChange = (data: any) => {
    setSelectedLanguages(data);
  };

  const scrollToTitle = () => {
    document.getElementById("title")!.scrollIntoView();
  };

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

export default Table;
