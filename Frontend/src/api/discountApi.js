import httpClient from "./httpClient";

export const getDiscounts = (params = {}) =>
    httpClient.get("/discounts", { params });

export const validateDiscount = (code, amount) =>
    httpClient.get("/discounts/validate", {
        params: {
            code,
            amount,
        },
    });

export const createDiscount = (data) =>
    httpClient.post("/discounts", data);

export const updateDiscount = (id, is_active) =>
    httpClient.patch(`/discounts/${id}`, {
        is_active,
    });

export const deleteDiscount = (id) =>
    httpClient.delete(`/discounts/${id}`);