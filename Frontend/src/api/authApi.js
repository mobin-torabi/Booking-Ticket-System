import httpClient from "./httpClient";

export const loginUser = (data) =>
    httpClient.post("/users/login", data);

export const registerUser = (data) =>
    httpClient.post("/users", data);