import { Box } from "@mui/material";
import { Outlet } from "react-router";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function MainLayout() {
  return (
    <>
      <Navbar />

      {/* #root is a min-height:100vh flex column, so letting <main> grow is
          what keeps the footer pinned to the bottom on short pages (login,
          404, an empty search) instead of floating up mid-screen. */}
      <Box
        component="main"
        sx={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        <Outlet />
      </Box>

      <Footer />
    </>
  );
}
