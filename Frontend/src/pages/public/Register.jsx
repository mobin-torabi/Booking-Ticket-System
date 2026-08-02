import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Box, Paper, Stack, Typography } from "@mui/material";
import AirplaneTicketIcon from "@mui/icons-material/AirplaneTicket";

import { registerUser } from "../../api/authApi";

import { useAuth } from "../../context/AuthContext";

import { ROUTES } from "../../utils/routes";
import useDocumentTitle from "../../hooks/useDocumentTitle";

import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import JalaliDatePicker from "../../components/common/Jalalidatepicker";


import { showError, showPromise } from "../../utils/toast";

export default function Register() {
  useDocumentTitle("ثبت نام");
  const navigate = useNavigate();

  const { isAuthenticated, isAdmin, isCustomer } = useAuth();

  useEffect(() => {
    if (isAuthenticated && isCustomer) {
      navigate(ROUTES.PROFILE);
    } else if (isAuthenticated && isAdmin) {
      navigate(ROUTES.ADMIN);
    }
  }, [isAuthenticated, isCustomer, isAdmin, navigate]);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    gender: "",
    birthDate: "",
    email: "",
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await showPromise(registerUser(form), {
        loading: "در حال ثبت نام...",
        success: "ثبت نام با موفقیت انجام شد!",
      });

      navigate(ROUTES.LOGIN);
    } catch (error) {
      showError(error.response?.data?.error ?? "خطا در ثبت نام");
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
        sx={{ width: "100%", maxWidth: 640, borderRadius: 4, p: { xs: 3, sm: 4 } }}
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
            ساخت حساب کاربری
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            برای رزرو بلیط، اطلاعات زیر را تکمیل کنید
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Input
                label="نام"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />

              <Input
                label="نام خانوادگی"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Input
                label="شماره تماس"
                name="phoneNumber"
                type="number"
                value={form.phoneNumber}
                onChange={handleChange}
                required
              />

              <Select
                label="جنسیت"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                options={[
                  { label: "مرد", value: "male" },
                  { label: "زن", value: "female" },
                ]}
                required
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <JalaliDatePicker
                label="تاریخ تولد"
                value={form.birthDate}
                onChange={(isoDate) =>
                  setForm((prev) => ({ ...prev, birthDate: isoDate }))
                }
                required
              />

              <Input
                label="ایمیل"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </Stack>

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "در حال ثبت نام..." : "ثبت نام"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
