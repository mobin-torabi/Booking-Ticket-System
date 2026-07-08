import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { Toaster } from "react-hot-toast";

import App from "./App";
import theme from "./theme/theme";

import { AuthProvider } from "./context/AuthContext";

import "./index.css";
import "./assets/styles/animations.css";
import "./assets/styles/scrollbar.css";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { prefixer } from "stylis";
import rtlPlugin from "@mui/stylis-plugin-rtl";

const rtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CacheProvider value={rtlCache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <AuthProvider>
            <App />

            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={12}
              containerStyle={{
                top: 20,
                right: 20,
              }}
              toastOptions={{
                duration: 3000,

                style: {
                  borderRadius: "12px",
                  background: "#fff",
                  color: "#1E293B",
                  fontSize: "15px",
                },

                success: {
                  iconTheme: {
                    primary: "#22C55E",
                    secondary: "#fff",
                  },
                },

                error: {
                  iconTheme: {
                    primary: "#EF4444",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </CacheProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
