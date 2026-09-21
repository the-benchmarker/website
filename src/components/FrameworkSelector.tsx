import Select from "react-select";
import type { SelectOption } from "../common";

export interface SelectOptionFramework extends SelectOption {
  color?: string;
}

interface Props {
  options: SelectOptionFramework[];
  onChange: (options: SelectOptionFramework[]) => void;
  value?: SelectOptionFramework[];
  disableStyle?: boolean;
  inputId?: string;
}

function FrameworkSelector({
  options,
  onChange,
  value = [],
  disableStyle = false,
  inputId = "framework-selector",
}: Props) {
  return (
    <Select<SelectOptionFramework, true>
      isMulti
      inputId={inputId}
      instanceId={inputId}
      aria-label="Select frameworks"
      value={value}
      placeholder="Search frameworks…"
      onChange={(options) => onChange([...options])}
      options={options}
      classNamePrefix="select"
      formatOptionLabel={(option) => (
        <span className="framework-option">
          {!disableStyle && option.color && (
            <span
              className="framework-color"
              style={{ backgroundColor: option.color }}
              aria-hidden="true"
            />
          )}
          {option.label}
        </span>
      )}
      noOptionsMessage={() => "No matching frameworks"}
    />
  );
}

export default FrameworkSelector;
