import { AppBar, Toolbar, Typography, Button, Box, Chip } from "@mui/material";
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
    showSuccess("Username copied!");
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
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          minHeight: 72,
        }}
      >
        {/* Left Side */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            component={Link}
            to="/tickets"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <AirplaneTicketIcon fontSize="large" />
            <HeaderLogo component={Link} to="/tickets" />
          </Typography>
          <Button
            component={Link}
            to="/tickets"
            color="inherit"
            sx={{
              fontWeight: 600,
            }}
          >
            بلیط هوایپما
          </Button>
          <Button
            component={Link}
            to="/tickets"
            color="inherit"
            sx={{
              fontWeight: 600,
            }}
          >
            بلیط قطار
          </Button>
          <Button
            component={Link}
            to="/tickets"
            color="inherit"
            sx={{
              fontWeight: 600,
            }}
          >
            بلیط اتوبوس
          </Button>
          <Button
            component={Link}
            to="/tickets"
            color="inherit"
            sx={{
              fontWeight: 600,
            }}
          >
            بلیط تور
          </Button>
        </Box>

        {/* Right Side */}
        {!isAuthenticated ? (
          <Button component={Link} to="/login" variant="contained">
            ورود به حساب کاربری
          </Button>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0,
            }}
          >
            <Box
              sx={{
                textAlign: "right",
              }}
            >
              <Tooltip
                title="Username"
                sx={{ cursor: "pointer", fontSize: "18px" }}
              >
                <Typography fontWeight={600} onClick={copyUsername}>
                  {user.username}
                </Typography>
              </Tooltip>
            </Box>
            <DashboardMenu />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
