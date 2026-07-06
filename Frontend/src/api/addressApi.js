import httpClient from "./httpClient";

export const getAddresses = (userId) =>
    httpClient.get("/addresses", {
        params: {
            userId,
        },
    });

export const createAddress = (data) =>
    httpClient.post("/addresses", data);

export const updateAddress = (id, data) =>
    httpClient.patch(`/addresses/${id}`, data);

export const deleteAddress = (id) =>
    httpClient.delete(`/addresses/${id}`);