import { useEffect, useState } from "react";
import { ChartData } from "chart.js";
import { Bar } from "react-chartjs-2";

import FrameworkSelector, {
  SelectOption,
} from "../components/FrameworkSelector";
import { BenchmarkDataSet } from "../App";
import { useHistory } from "react-router-dom";
import useQuery from "../hooks/useQuery";

interface Props {
  benchmarks: BenchmarkDataSet[];
}

function BarChart({ benchmarks }: Props) {
  const [data, setData] = useState<ChartData>({
    labels: ["Speed (64)", "Speed (256)", "Speed (512)"],
    datasets: [],
  });
  const [defaultFrameworkIds, setDefaultFrameworkIds] = useState<number[]>([]);
  const history = useHistory();
  const query = useQuery();

  // On Benchmark data change
  useEffect(() => {
    if (!benchmarks.length) return;

    // Get query parameter
    const frameworks = query.get("f")?.split(",");
    if (!frameworks) return;

    // Find benchmark by framework name
    const filteredBenchmark = frameworks.reduce((filtered, name) => {
      const benchmark = benchmarks.find((b) => b.framework.name === name);
      if (benchmark) filtered.push(benchmark);
      return filtered;
    }, [] as BenchmarkDataSet[]);

    setDefaultFrameworkIds(filteredBenchmark.map((b) => b.id));
    setData({ ...data, datasets: filteredBenchmark });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benchmarks]);

  // FrameworkSelector onChange handler
  const onChange = (selectedOptions: SelectOption[]) => {
    // Get benchmark data from selected frameworks id
    const filteredBenchmark = selectedOptions.map(
      (option) => benchmarks.find((b) => b.id === option.value)!
    );

    // Set query parameter
    const frameworks = filteredBenchmark.map((b) => b.framework.name).join(",");
    history.replace(`/compare?${frameworks ? "f=" + frameworks : ""}`);

    setData({ ...data, datasets: filteredBenchmark });
  };

  return (
    <div>
      <h3 className="text-center">Compare Frameworks</h3>

      <FrameworkSelector
        defaultValue={defaultFrameworkIds}
        options={benchmarks.map((b) => ({
          value: b.id,
          label: `${b.language} - ${b.framework.name} (${b.framework.version})`,
          color: b.color,
        }))}
        onChange={onChange}
      />

      <div className="pt-md">
        <Bar data={data} height={100} />
      </div>
    </div>
  );
}

export default BarChart;
