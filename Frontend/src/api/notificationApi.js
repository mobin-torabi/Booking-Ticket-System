import httpClient from "./httpClient";

export const getNotifications = (userId) =>
    httpClient.get("/notifications", {
        params: {
            userId,
        },
    });