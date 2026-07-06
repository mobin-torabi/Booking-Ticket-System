import {
    FormControl,
    InputLabel,
    Select as MuiSelect,
    MenuItem,
} from "@mui/material";

export default function Select({
    label,
    value,
    onChange,
    options = [],
    fullWidth = true,
}) {
    return (
        <FormControl fullWidth={fullWidth}>
            <InputLabel>{label}</InputLabel>

            <MuiSelect
                value={value}
                label={label}
                onChange={onChange}
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