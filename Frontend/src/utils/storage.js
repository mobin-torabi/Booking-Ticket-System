export function getStorage(key) {

    const item = localStorage.getItem(key);

    return item ? JSON.parse(item) : null;
}

export function setStorage(key, value) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
}

export function removeStorage(key) {

    localStorage.removeItem(key);
}