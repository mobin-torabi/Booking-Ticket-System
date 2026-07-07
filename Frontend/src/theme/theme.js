import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#6366F1",
    },

    secondary: {
      main: "#EC4899",
    },

    success: {
      main: "#22C55E",
    },

    error: {
      main: "#EF4444",
    },

    warning: {
      main: "#F59E0B",
    },

    info: {
      main: "#3B82F6",
    },

    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#1E293B",
      secondary: "#64748B",
    },
  },

  typography: {
    fontFamily: ["Inter", "Roboto", "Arial", "sans-serif"].join(","),

    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
    },

    h2: {
      fontSize: "2rem",
      fontWeight: 700,
    },

    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
    },

    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },

    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
    },

    h6: {
      fontSize: "1rem",
      fontWeight: 600,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 12,
  },

  spacing: 8,

  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "10px 18px",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: "0 4px 12px rgba(0,0,0,.08)",
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#1E293B",
          boxShadow: "0 2px 8px rgba(0,0,0,.05)",
        },
      },
    },
  },
});

export default theme;

/*

Inside any component, we can access the theme like this:

import { useTheme } from "@mui/material/styles";

export default function Home() {
    const theme = useTheme();

    return (
        <div
            style={{
                color: theme.palette.primary.main,
                padding: theme.spacing(3),
            }}
        >
            Home Page
        </div>
    );
}

*/
