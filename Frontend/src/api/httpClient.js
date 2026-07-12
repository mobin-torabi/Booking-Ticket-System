import axios from "axios";

const httpClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_BASE_URL,
<<<<<<< HEAD
    timeout: 100000,
=======
    timeout: 50000,
>>>>>>> ca85fe99604bf0c872470b33d0263ee75e74aa34
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