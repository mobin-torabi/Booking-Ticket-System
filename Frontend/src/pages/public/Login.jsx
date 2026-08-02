import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Box, Paper, Stack, Typography, Divider } from "@mui/material";
import AirplaneTicketIcon from "@mui/icons-material/AirplaneTicket";

import { loginUser } from "../../api/authApi";

import { useAuth } from "../../context/AuthContext";

import { ROUTES } from "../../utils/routes";
import useDocumentTitle from "../../hooks/useDocumentTitle";

import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

import { showError, showPromise } from "../../utils/toast";

export default function Login() {
  useDocumentTitle("ورود به حساب کاربری");
  const navigate = useNavigate();

  const { login, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.HOME);
    }
  }, [isAuthenticated, navigate]);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleRegister() {
    navigate(ROUTES.REGISTER);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const { data } = await showPromise(loginUser(form), {
        loading: "در حال ورود...",
        success: "خوش آمدید!",
      });

      login(data.user);

      navigate(ROUTES.HOME);
    } catch (error) {
      showError(error.response?.data?.error ?? "خطا در ورود");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      dir="rtl"
      sx={{
        background:
          "linear-gradient(135deg, #0653C4 0%, #2A7BFF 60%, #5B8CFF 100%)",
        display: "flex",
        justifyContent: "center",
        px: 2,
        py: { xs: 6, md: 10 },
      }}
    >
      <Paper
        elevation={6}
        sx={{ width: "100%", maxWidth: 420, borderRadius: 4, p: { xs: 3, sm: 4 } }}
      >
        <Stack alignItems="center" spacing={1} mb={3}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "#E8F1FF",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AirplaneTicketIcon fontSize="medium" />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            ورود به حساب کاربری
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            برای جستجو و رزرو بلیط وارد حساب کاربری خود شوید
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Input
              label="نام کاربری"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />

            <Input
              label="رمز ورود"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "در حال ورود..." : "ورود"}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }}>یا</Divider>

        <Button variant="outlined" fullWidth onClick={handleRegister}>
          ساخت حساب کاربری جدید
        </Button>
      </Paper>
    </Box>
  );
}
