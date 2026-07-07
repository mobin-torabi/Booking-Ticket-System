export const ROUTES = {
    // Public
    HOME: "/tickets",
    LOGIN: "/login",
    REGISTER: "/register",

    // Customer
    DASHBOARD: "/dashboard",
    PROFILE: "/dashboard/profile",
    BOOKINGS: "/dashboard/bookings",
    NOTIFICATIONS: "/dashboard/notifications",

    // Admin
    ADMIN: "/admin/profile",
    USERS: "/admin/users",
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