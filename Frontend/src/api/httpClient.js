import axios from "axios";

const httpClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_BASE_URL,
    timeout: 100000,
    headers: {
        "Content-Type": "application/json",
    },
});

httpClient.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }

    return config;
});

// Every caller already handles its own failures (toasts, empty states, 404
// fallbacks), so logging here only produced a console full of red for
// perfectly expected responses — a search that returns no tickets, an
// unauthenticated profile lookup, a rejected discount code. Rejections are
// passed straight through instead.
httpClient.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

export default httpClient;