export * as authApi from "./authApi";
export * as userApi from "./userApi";
export * as ticketApi from "./ticketApi";
export * as bookingApi from "./bookingApi";
export * as paymentApi from "./paymentApi";
export * as providerApi from "./providerApi";
export * as discountApi from "./discountApi";
export * as notificationApi from "./notificationApi";
export * as addressApi from "./addressApi";
export * as locationApi from "./locationApi";
export * as ticketTypeApi from "./ticketTypeApi";

/* 
    this file serves as a central export point for all API modules in the application. so we can use API functions in the code of components like this:
    import { authApi, ticketApi, bookingApi } from "../api";

    const { data } = await ticketApi.getTickets({
        origin: "Tehran",
        destination: "Mashhad",
    });
*/
