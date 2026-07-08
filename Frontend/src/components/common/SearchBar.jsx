import Input from "./Input";

export default function SearchBar({
    value,
    onChange,
    placeholder = "جستجو...",
}) {
    return (
        <Input
            label={placeholder}
            value={value}
            onChange={onChange}
        />
    );
}