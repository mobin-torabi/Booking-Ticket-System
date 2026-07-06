import httpClient from "./httpClient";

export const login = (data) => {
    httpClient.post("/users/login", data)
}

export const register = (data) => {
    httpClient.post("/users", data)
}