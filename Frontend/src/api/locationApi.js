import httpClient from "./httpClient";

export const getProvinces = (params = {}) =>
    httpClient.get("/provinces", {
        params,
    });

export const getProvinceById = (id) =>
    httpClient.get(`/provinces/${id}`);

export const getCities = (params = {}) =>
    httpClient.get("/cities", {
        params,
    });

export const getCityById = (id) =>
    httpClient.get(`/cities/${id}`);