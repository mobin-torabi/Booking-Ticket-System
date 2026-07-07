import axios from "axios";

const httpClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_BASE_URL,
    timeout: 10000,
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

httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error(error);

        return Promise.reject(error);
    }
);

export default httpClient;