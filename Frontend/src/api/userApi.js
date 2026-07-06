import httpClient from "./httpClient";

export const getUsers = (params = {}) =>
    httpClient.get("/users", { params });

export const getUserById = (id) =>
    httpClient.get(`/users/${id}`);

export const updateUser = (id, data) =>
    httpClient.patch(`/users/${id}`, data);

export const updatePassword = (id, password) =>
    httpClient.patch(`/users/${id}/password`, {
        password,
    });

export const updateUserRole = (id, role) =>
    httpClient.patch(`/users/${id}/role`, {
        role,
    });

export const deleteUser = (id) =>
    httpClient.delete(`/users/${id}`);