import httpClient from "./httpClient";

export const getTickets = (params = {}) =>
  httpClient.get("/tickets", { params });

export const getTicketById = (id, wantSeats = null) =>
  httpClient.get(`/tickets/${id}`, {
    params: { wantSeats },
  });

export const getTicketSeats = (id, available) =>
  httpClient.get(`/tickets/${id}/seats`, {
    params: { available },
  });

export const createTicket = (data) => httpClient.post("/tickets", data);

export const updateTicket = (id, data) =>
  httpClient.patch(`/tickets/${id}`, data);

export const cancelTicket = (id) => httpClient.delete(`/tickets/${id}`);
