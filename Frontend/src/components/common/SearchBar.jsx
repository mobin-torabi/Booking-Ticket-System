import Input from "./Input";

export default function SearchBar({
    value,
    onChange,
    placeholder = "Search...",
}) {
    return (
        <Input
            label={placeholder}
            value={value}
            onChange={onChange}
        />
    );
}