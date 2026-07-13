import httpClient from "./httpClient";

export const sendSupportMessage = (data) =>
    httpClient.post("/support", data);
