import { useId } from "react";

import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";

export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  fullWidth = true,
  required = false,
}) {
  // Without this the label floats over the value instead of being lifted out
  // of the way when a value is picked.
  const labelId = useId();

  // Several screens repopulate their options asynchronously (cities after a
  // province is picked, providers after a ticket type is picked). During that
  // gap the currently held value isn't in `options` yet, which MUI reports as
  // an "out-of-range value" warning. Falling back to an empty selection keeps
  // the select controlled and the console clean.
  const hasValue = options.some(
    (option) => String(option.value) === String(value ?? ""),
  );
  const safeValue = hasValue ? value : "";

  return (
    <FormControl fullWidth={fullWidth} required={required}>
      <InputLabel id={labelId}>{label}</InputLabel>

      <MuiSelect
        labelId={labelId}
        value={safeValue}
        name={name}
        label={label}
        onChange={onChange}
        required={required}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
}
