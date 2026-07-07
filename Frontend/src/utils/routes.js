export const ROUTES = {
    // Public
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    TICKETS: "/tickets",

    // Customer
    DASHBOARD: "/dashboard",
    PROFILE: "/dashboard/profile",
    BOOKINGS: "/dashboard/bookings",
    NOTIFICATIONS: "/dashboard/notifications",
    ADDRESSES: "/dashboard/addresses",

    // Admin
    ADMIN: "/admin",
    USERS: "/admin/users",
    ADMIN_TICKETS: "/admin/tickets",
    PROVIDERS: "/admin/providers",
    ADMIN_BOOKINGS: "/admin/bookings",
    PAYMENTS: "/admin/payments",
    DISCOUNTS: "/admin/discounts",
};

/* 
Now instead of this: 
    navigate("/dashboard");

We can use this:
    navigate(ROUTES.DASHBOARD);
*/