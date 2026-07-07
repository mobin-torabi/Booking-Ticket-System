import { Outlet } from "react-router";

import AdminSidebar from "../components/layout/AdminSidebar";

export default function AdminLayout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <AdminSidebar />

      <main
        style={{
          flex: 1,
          padding: "2rem",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
