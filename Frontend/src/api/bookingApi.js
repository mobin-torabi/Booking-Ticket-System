import httpClient from "./httpClient";

export const createBooking = (data) =>
    httpClient.post("/bookings", data);

export const getBookings = (params = {}) =>
    httpClient.get("/bookings", { params });

export const getBookingById = (id) =>
    httpClient.get(`/bookings/${id}`);

export const cancelBooking = (id, reason) =>
    httpClient.patch(`/bookings/${id}/cancel`, {
        reason,
    });

export const payBooking = (id, discount_code) =>
    httpClient.post(`/bookings/${id}/pay`, {
        discount_code,
    });