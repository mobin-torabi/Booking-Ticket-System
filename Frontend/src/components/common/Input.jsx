import TextField from "@mui/material/TextField";

export default function Input({
    label,
    name,
    value,
    onChange,
    type = "text",
    required = false,
    fullWidth = true,
    error = false,
    helperText = "",
    ...rest
}) {
    return (
        <TextField
            label={label}
            name={name}
            value={value}
            onChange={onChange}
            type={type}
            required={required}
            fullWidth={fullWidth}
            error={error}
            helperText={helperText}
            {...rest}
        />
    );
}