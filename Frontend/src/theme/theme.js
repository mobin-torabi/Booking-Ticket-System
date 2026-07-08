import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      light: "#2A7BFF",
      main: "#0653C4",
      dark: "#0A1F66",
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: "#5B8CFF",
      light: "#8FB5FF",
      dark: "#0A4AA8",
      contrastText: "#FFFFFF",
    },

    success: {
      main: "#16A34A",
    },

    error: {
      main: "#DC2626",
    },

    warning: {
      main: "#F59E0B",
    },

    info: {
      main: "#2A7BFF",
    },

    background: {
      default: "#F6F9FD",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#0F172A",
      secondary: "#64748B",
    },

    divider: "#E2E8F0",
  },

  typography: {
    fontFamily: ["Vazirmatn", "Inter", "Roboto", "Arial", "sans-serif"].join(
      ",",
    ),

    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#0A1F66",
    },

    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      color: "#0A1F66",
    },

    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
      color: "#0A1F66",
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
    borderRadius: 14,
  },

  spacing: 8,
  direction: "rtl",
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 20px",
        },

        containedPrimary: {
          background:
            "linear-gradient(90deg, #0653C4 0%, #2A7BFF 100%)",

          "&:hover": {
            background:
              "linear-gradient(90deg, #0A4AA8 0%, #0653C4 100%)",
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 6px 20px rgba(6,83,196,.10)",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,

          "&.Mui-focused fieldset": {
            borderColor: "#0653C4",
          },
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#0F172A",
          boxShadow: "0 2px 12px rgba(6,83,196,.08)",
          borderBottom: "1px solid #E2E8F0",
        },
      },
    },
  },

  direction: "rtl",
});

export default theme;

/*

Inside any component, we can access the theme like this:

import { useTheme } from "@mui/material/styles";

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },

        colorPrimary: {
          backgroundColor: "#E8F1FF",
          color: "#0653C4",
        },
      },
    },
  },
});

export default theme; */