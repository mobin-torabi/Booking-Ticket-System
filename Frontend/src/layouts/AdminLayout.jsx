import { Outlet } from "react-router";

export default function AdminLayout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >

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
