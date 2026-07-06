import httpClient from "./httpClient";

export const getPayments = (params = {}) =>
    httpClient.get("/payments", { params });

export const getPaymentById = (id) =>
    httpClient.get(`/payments/${id}`);