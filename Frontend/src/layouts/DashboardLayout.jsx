import { Outlet } from "react-router";

import CustomerSidebar from "../components/layout/CustomerSidebar";

export default function DashboardLayout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <CustomerSidebar />

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
