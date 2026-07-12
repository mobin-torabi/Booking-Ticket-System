import { Routes, Route, Navigate } from "react-router";

import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

/* Public Pages */

import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Tickets from "./pages/public/Tickets";
import TicketDetails from "./pages/public/TicketDetails";
import NotFound from "./pages/public/NotFound";

/* Customer */

import Payment from "./pages/customer/Payment";
import Booking from "./pages/customer/Booking";
// import Dashboard from "./pages/customer/Dashboard";
import Profile from "./pages/customer/Profile";
import Bookings from "./pages/customer/Bookings";
import BookingDetails from "./pages/customer/BookingDetails";
import Notifications from "./pages/customer/Notifications";

/* Admin */

import AdminProfile from "./pages/admin/Profile";
import Users from "./pages/admin/Users";
import Providers from "./pages/admin/Providers";
import AdminBookings from "./pages/admin/Bookings";
import Payments from "./pages/admin/Payments";
import Discounts from "./pages/admin/Discounts";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tickets" replace />} />
      {/* ===========================
                    PUBLIC
            ============================ */}

      <Route element={<MainLayout />}>
        <Route path="/tickets" element={<Tickets />} /> {/*Home page*/}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tickets/:id" element={<TicketDetails />} />
      </Route>

      {/* ===========================
                    CUSTOMER
            ============================ */}

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}

        <Route path="/profile" element={<Profile />} />

        <Route path="/bookings" element={<Bookings />} />

        <Route path="/booking/:ticketId" element={<Booking />} />

        <Route path="/payment/:bookingId" element={<Payment />} />

        <Route path="/bookings/:id" element={<BookingDetails />} />

        <Route path="/notifications" element={<Notifications />} />
      </Route>

      {/* ===========================
                    ADMIN
            ============================ */}

      <Route
        element={
          <AdminRoute>
            <MainLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin/profile" element={<AdminProfile />} />

        <Route path="/admin/users" element={<Users />} />

        <Route path="/admin/providers" element={<Providers />} />

        <Route path="/admin/bookings" element={<AdminBookings />} />

        <Route path="/admin/payments" element={<Payments />} />

        <Route path="/admin/discounts" element={<Discounts />} />
      </Route>

      {/* ===========================
                    404
            ============================ */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
