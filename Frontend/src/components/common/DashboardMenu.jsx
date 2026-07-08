import * as React from "react";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import AirplaneTicketIcon from "@mui/icons-material/AirplaneTicket";
import Person from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import PaymentsIcon from "@mui/icons-material/Payments";
import PercentIcon from "@mui/icons-material/Percent";
import InboxIcon from "@mui/icons-material/Inbox";
import Logout from "@mui/icons-material/Logout";
import { Chip } from "@mui/material";

import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../utils/routes";
import { useNavigate } from "react-router";
import { showSuccess } from "../../utils/toast";

export default function DashboardMenu({ letter }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const {
    user,

    logout,

    isCustomer,
    isAdmin,
  } = useAuth();

  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  function logoutHandler() {
    logout();
    showSuccess("از حساب کاربری خود خارج شدید!");
    navigate(ROUTES.HOME)
  }

  function navigateAdminDashboard() {
    navigate(ROUTES.ADMIN);
  }

  function navigateTickets() {
    navigate(ROUTES.HOME);
  }

  function navigateUsers() {
    navigate(ROUTES.USERS);
  }

  function navigateProviders() {
    navigate(ROUTES.PROVIDERS);
  }

  function navigateBookings() {
    navigate(ROUTES.ADMIN_BOOKINGS);
  }

  function navigatePayments() {
    navigate(ROUTES.PAYMENTS);
  }

  function navigateDiscounts() {
    navigate(ROUTES.DISCOUNTS);
  }

  function navigateCustomerDashboard() {
    navigate(ROUTES.PROFILE);
  }

  function navigateCustomerBookings() {
    navigate(ROUTES.BOOKINGS);
  }

  function navigateNotifications() {
    navigate(ROUTES.NOTIFICATIONS);
  }

  return (
    <React.Fragment>
      <Box sx={{ display: "flex", alignItems: "center", textAlign: "center" }}>
        <Tooltip title="داشبورد">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor:
                  user.role === "Admin" ? "secondary.main" : "primary.main",
                fontWeight: "bold",
                m: 1
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 0,
              },
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                insetInlineEnd: 26,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      >
        {isAdmin && (
          <>
            <MenuItem onClick={navigateAdminDashboard}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", flexDirection: "row", marginBottom: '10px'}}>
                  <Avatar
                    sx={{
                      bgcolor: "secondary.main",
                    }}
                  />

                  <Chip
                    size="small"
                    label={"ادمین"}
                    sx={{ ml: 1, mt: 0.5}}
                    color={"secondary"}
                  />
                </div>
                اطلاعات حساب کاربری
              </div>
            </MenuItem>
            <Divider />
            <MenuItem onClick={navigateTickets}>
              <ListItemIcon>
                <AirplaneTicketIcon fontSize="small" />
              </ListItemIcon>
              تیکت ها
            </MenuItem>
            <MenuItem onClick={navigateUsers}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              کاربران
            </MenuItem>
            <MenuItem onClick={navigateProviders}>
              <ListItemIcon>
                <BusinessIcon fontSize="small" />
              </ListItemIcon>
              ارائه دهندگان
            </MenuItem>
            <MenuItem onClick={navigateBookings}>
              <ListItemIcon>
                <BookOnlineIcon fontSize="small" />
              </ListItemIcon>
              رزرو ها
            </MenuItem>
            <MenuItem onClick={navigatePayments}>
              <ListItemIcon>
                <PaymentsIcon fontSize="small" />
              </ListItemIcon>
              پرداخت ها
            </MenuItem>
            <MenuItem onClick={navigateDiscounts}>
              <ListItemIcon>
                <PercentIcon fontSize="small" />
              </ListItemIcon>
              تخفیفات
            </MenuItem>
          </>
        )}

        {isCustomer && (
          <>
            <MenuItem onClick={navigateCustomerDashboard}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", flexDirection: "row", marginBottom: '10px'}}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                    }}
                  />

                  <Chip
                    size="small"
                    label={"کاربر"}
                    sx={{ ml: 1, mt: 0.5}}
                    color={"primary"}
                  />
                </div>
                اطلاعات حساب کاربری
              </div>
            </MenuItem>
            <Divider />
            <MenuItem onClick={navigateTickets}>
              <ListItemIcon>
                <AirplaneTicketIcon fontSize="small" />
              </ListItemIcon>
              تیکت ها
            </MenuItem>
            <MenuItem onClick={navigateCustomerBookings}>
              <ListItemIcon>
                <BookOnlineIcon fontSize="small" />
              </ListItemIcon>
              رزرو های من
            </MenuItem>
            <MenuItem onClick={navigateNotifications}>
              <ListItemIcon>
                <InboxIcon fontSize="small" />
              </ListItemIcon>
              اعلان ها
            </MenuItem>
          </>
        )}
        <Divider />
        <MenuItem onClick={logoutHandler}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          خروج از حساب کاربری
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
}
