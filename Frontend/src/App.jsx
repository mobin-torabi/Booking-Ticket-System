import { Routes, Route } from "react-router";

import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

/* Public Pages */

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import SearchTickets from "./pages/public/SearchTickets";
import TicketDetails from "./pages/public/TicketDetails";
import Booking from "./pages/public/Booking";
import Payment from "./pages/public/Payment";
import BookingSuccess from "./pages/public/BookingSuccess";
import NotFound from "./pages/public/NotFound";

/* Customer */

import Dashboard from "./pages/customer/Dashboard";
import Profile from "./pages/customer/Profile";
import Bookings from "./pages/customer/Bookings";
import BookingDetails from "./pages/customer/BookingDetails";
import Notifications from "./pages/customer/Notifications";
import Addresses from "./pages/customer/Addresses";

/* Admin */

import AdminDashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Tickets from "./pages/admin/Tickets";
import Providers from "./pages/admin/Providers";
import AdminBookings from "./pages/admin/Bookings";
import Payments from "./pages/admin/Payments";
import Discounts from "./pages/admin/Discounts";

export default function App() {

    return (

        <Routes>

            {/* ===========================
                    PUBLIC
            ============================ */}

            <Route element={<MainLayout />}>

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/tickets"
                    element={<SearchTickets />}
                />

                <Route
                    path="/tickets/:id"
                    element={<TicketDetails />}
                />

                <Route
                    path="/booking/:ticketId"
                    element={<Booking />}
                />

                <Route
                    path="/payment/:bookingId"
                    element={<Payment />}
                />

                <Route
                    path="/booking-success/:id"
                    element={<BookingSuccess />}
                />

            </Route>

            {/* ===========================
                    CUSTOMER
            ============================ */}

            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/dashboard/profile"
                    element={<Profile />}
                />

                <Route
                    path="/dashboard/bookings"
                    element={<Bookings />}
                />

                <Route
                    path="/dashboard/bookings/:id"
                    element={<BookingDetails />}
                />

                <Route
                    path="/dashboard/notifications"
                    element={<Notifications />}
                />

                <Route
                    path="/dashboard/addresses"
                    element={<Addresses />}
                />

            </Route>

            {/* ===========================
                    ADMIN
            ============================ */}

            <Route
                element={
                    <AdminRoute>
                        <AdminLayout />
                    </AdminRoute>
                }
            >

                <Route
                    path="/admin"
                    element={<AdminDashboard />}
                />

                <Route
                    path="/admin/users"
                    element={<Users />}
                />

                <Route
                    path="/admin/tickets"
                    element={<Tickets />}
                />

                <Route
                    path="/admin/providers"
                    element={<Providers />}
                />

                <Route
                    path="/admin/bookings"
                    element={<AdminBookings />}
                />

                <Route
                    path="/admin/payments"
                    element={<Payments />}
                />

                <Route
                    path="/admin/discounts"
                    element={<Discounts />}
                />

            </Route>

            {/* ===========================
                    404
            ============================ */}

            <Route
                path="*"
                element={<NotFound />}
            />

        </Routes>

    );

}