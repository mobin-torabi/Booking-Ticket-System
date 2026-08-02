import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // IPv6 loopback is broken on some Windows setups (VPN/proxy adapters
    // can leave ::1 unroutable), which leaves the default "localhost"
    // binding unreachable even though the process is listening. Bind
    // explicitly to the IPv4 loopback so http://localhost:5173 works.
    host: "127.0.0.1",
  },
});
