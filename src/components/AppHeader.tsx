import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import { getBenchmarkHistories } from "../api";
import { SelectOption } from "../common";

interface Props {
  onHistoryChange: (sha: string) => void;
}

function NavBar({ onHistoryChange }: Props) {
  const [historyOptions, setHistoryOptions] = useState<SelectOption[]>([]);

  const fetchBenchmarkHistories = async () => {
    // only fetch once
    if (historyOptions.length > 1) return;

    const benchmarkHistories = await getBenchmarkHistories();
    setHistoryOptions(
      benchmarkHistories.map((h, i) => ({
        label: (i === 0 ? "Latest — " : "") + h.date,
        value: h.sha,
      }))
    );
  };

  useEffect(() => {
    fetchBenchmarkHistories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="text-center">
        <h1 className="my-none">Web Frameworks Benchmark</h1>

        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/result">Benchmark Results</Link>
          </li>
          <li>
            <Link to="/compare">Compare Frameworks</Link>
          </li>
          <li>
            <a
              href="https://github.com/the-benchmarker/website"
              target="_blank"
              rel="noreferrer"
            >
              Github
            </a>
          </li>
        </ul>

        <div className="container" style={{ maxWidth: "480px" }}>
          <Select
            key={historyOptions.length}
            defaultValue={historyOptions[0]}
            isSearchable={false}
            className={`text-left ${!historyOptions.length ? "hidden" : ""}`}
            options={historyOptions}
            onChange={(v) =>
              v ? onHistoryChange(v.value.toString()) : undefined
            }
          />
        </div>
      </div>
      <hr />
    </div>
  );
}

export default NavBar;
