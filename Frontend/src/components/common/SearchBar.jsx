import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";
import Input from "./Input";

export default function SearchBar({
    value,
    onChange,
    placeholder = "جستجو...",
}) {
    function handleClear() {
        onChange({ target: { value: "" } });
    }

    return (
        <Input
            label={placeholder}
            value={value}
            onChange={onChange}
            slotProps={{
                input: {
                endAdornment: value ? (
                    <InputAdornment position="start">
                        <IconButton size="small" onClick={handleClear} edge="start">
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </InputAdornment>
                ) : null,
            }}}
        />
    );
}