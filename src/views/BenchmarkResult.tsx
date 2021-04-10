import { useState } from "react";
import Select from "react-select";
import DataTable, { IDataTableColumn } from "react-data-table-component";
import { Benchmark } from "../api";

const columns: IDataTableColumn<Benchmark>[] = [
  {
    name: "Language",
    selector: "language",
    sortable: true,
  },
  {
    name: "Framework",
    selector: ({ framework }) => framework.name,
    cell: ({ framework }) => (
      <div>
        <a href={framework.link}>{framework.name}</a> ({framework.version})
      </div>
    ),
    sortable: true,
  },
  {
    name: "Speed (64)",
    selector: "speed64",
    sortable: true,
  },
  {
    name: "Speed (256)",
    selector: "speed256",
    sortable: true,
  },
  {
    name: "Speed (512)",
    selector: "speed512",
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

  const onChange = (data: any) => {
    setSelectedLanguages(data);
  };

  return (
    <div>
      <h3 className="text-center">Benchmark Result</h3>

      <Select
        isMulti
        onChange={onChange}
        placeholder="Filter Languages..."
        options={[
          ...new Set(benchmarks.map((b) => b.language)),
        ].map((lang) => ({ value: lang, label: lang }))}
      />

      <DataTable
        columns={columns}
        data={
          selectedLanguages.length
            ? benchmarks.filter((b) =>
                selectedLanguages.map((l) => l.value).includes(b.language)
              )
            : benchmarks
        }
      />
    </div>
  );
}

export default Table;
