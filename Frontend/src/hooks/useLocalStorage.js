import { useState } from "react";

export default function useLocalStorage(key, initialValue) {

    const [value, setValue] = useState(() => {
        const item = localStorage.getItem(key);

        return item ? JSON.parse(item) : initialValue;
    });

    const setStoredValue = (newValue) => {

        setValue(newValue);

        localStorage.setItem(key, JSON.stringify(newValue));
    };

    return [value, setStoredValue];
}