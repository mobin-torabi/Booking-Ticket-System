import { ROUTES } from "../utils/routes";

const adminMenu = [
    {
        title: "Dashboard",
        path: ROUTES.ADMIN,
    },
    {
        title: "Users",
        path: ROUTES.USERS,
    },
    {
        title: "Tickets",
        path: ROUTES.ADMIN_TICKETS,
    },
    {
        title: "Providers",
        path: ROUTES.PROVIDERS,
    },
    {
        title: "Bookings",
        path: ROUTES.ADMIN_BOOKINGS,
    },
    {
        title: "Payments",
        path: ROUTES.PAYMENTS,
    },
    {
        title: "Discounts",
        path: ROUTES.DISCOUNTS,
    },
];

export default adminMenu;