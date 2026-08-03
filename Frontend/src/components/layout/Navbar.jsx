import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import AirplaneTicketIcon from "@mui/icons-material/AirplaneTicket";
import { Link } from "react-router";

import DashboardMenu from "../common/DashboardMenu";
import { useAuth } from "../../context/AuthContext";
import { showSuccess } from "../../utils/toast";
import HeaderLogo from "../MUIComponents/HeaderLogo";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();

  function copyUsername() {
    navigator.clipboard.writeText(user.username);
    showSuccess("نام کاربری کپی شد!");
  }
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={1}
      sx={{
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      {/* The bar's own content is capped and centred to the same width the
          pages below use, so the logo and account menu line up with the page
          content instead of hugging the window edges on wide screens. */}
      <Toolbar
        sx={{
          width: "100%",
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, md: 3 },
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          minHeight: { xs: 72, md: 72 },
        }}
      >
        {/* Right Side */}
        <Box
          component={Link}
          to="/tickets"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "primary.main",
            textDecoration: "none",
            minWidth: 0,
          }}
        >
          <AirplaneTicketIcon fontSize="large" />
          <HeaderLogo />
        </Box>

        {/* Left Side */}
        {!isAuthenticated ? (
          <Button component={Link} to="/login" variant="contained">
            ورود به حساب کاربری
          </Button>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minWidth: 0,
            }}
          >
            <Tooltip title="نام کاربری خود را کپی کنید">
              <Typography
                onClick={copyUsername}
                sx={{
                  fontWeight: 600,
                  cursor: "pointer",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: { xs: "none", sm: "block" },
                  "&:hover": { color: "primary.main" },
                }}
              >
                {user.username}
              </Typography>
            </Tooltip>

            <DashboardMenu />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
