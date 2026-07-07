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
    defaultValue = "male",
    fullWidth = true,
    required = false,
}) {
    return (
        <FormControl fullWidth={fullWidth}>
            <InputLabel>{label}</InputLabel>

            <MuiSelect
                value={value}
                name={name}
                label={label}
                defaultValue={defaultValue}
                onChange={onChange}
                required={required}
            >
                {options.map((option) => (
                    <MenuItem
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </MenuItem>
                ))}
            </MuiSelect>
        </FormControl>
    );
}