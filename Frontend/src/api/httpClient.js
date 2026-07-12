import axios from "axios";

const httpClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_BASE_URL,
<<<<<<< HEAD
    timeout: 100000,
=======
    timeout: 50000,
>>>>>>> 70986d43425d7d29a3bb4b1f540e8e0a1c6a2477
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