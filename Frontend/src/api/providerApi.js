import httpClient from "./httpClient";

/*
providerRoute can be:

airlines
bus-companies
train-companies
tour-agencies
*/

export const getProviders = (providerRoute, params = {}) =>
    httpClient.get(`/${providerRoute}`, {
        params,
    });

export const getProviderById = (providerRoute, id) =>
    httpClient.get(`/${providerRoute}/${id}`);

export const createProvider = (providerRoute, data) =>
    httpClient.post(`/${providerRoute}`, data);

export const updateProvider = (providerRoute, id, data) =>
    httpClient.patch(`/${providerRoute}/${id}`, data);

export const deleteProvider = (providerRoute, id) =>
    httpClient.delete(`/${providerRoute}/${id}`);