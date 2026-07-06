import httpClient from "./httpClient";

export const getTicketTypes = () =>
    httpClient.get("/ticket-types");