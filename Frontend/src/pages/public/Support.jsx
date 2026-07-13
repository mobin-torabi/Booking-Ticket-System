import { useState } from "react";
import { Box, Stack, Typography, Divider } from "@mui/material";

import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SendIcon from "@mui/icons-material/Send";
import GitHubIcon from "@mui/icons-material/GitHub";

import { supportApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { showPromise, showError } from "../../utils/toast";

import CardBox from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

const SUPPORT_EMAIL = "tickisupport@gmail.com";

const EMPTY_FORM = { name: "", email: "", subject: "", message: "" };

export default function Support() {
  useDocumentTitle("پشتیبانی | سیستم رزرو بلیط");

  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: false }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "نام الزامی است";

    if (!form.email.trim()) {
      nextErrors.email = "ایمیل الزامی است";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "ایمیل نامعتبر است";
    }

    if (!form.message.trim()) nextErrors.message = "متن پیام الزامی است";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSending(true);

      await showPromise(supportApi.sendSupportMessage(form), {
        loading: "در حال ارسال پیام...",
        success: "پیام شما با موفقیت ارسال شد. به زودی پاسخ می‌دهیم.",
        error: "ارسال پیام با خطا مواجه شد. دوباره تلاش کنید.",
      });

      setForm({
        ...EMPTY_FORM,
        name: form.name,
        email: form.email,
      });
    } catch (err) {
      showError(err.response?.data?.error ?? "ارسال پیام با خطا مواجه شد.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Box dir="rtl">
      {/* Hero */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #0653C4 0%, #2A7BFF 60%, #5B8CFF 100%)",
          py: { xs: 5, md: 7 },
          px: 2,
        }}
      >
        <Box sx={{ maxWidth: 720, mx: "auto", textAlign: "center" }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ color: "#fff", mb: 1 }}
          >
            پشتیبانی
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,.85)" }}>
            سوال یا مشکلی دارید؟ فرم زیر را پر کنید تا هر چه سریع‌تر
            پاسخگوی شما باشیم
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          maxWidth: 820,
          mx: "auto",
          px: { xs: 2, md: 3 },
          py: 5,
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {/* Contact info */}
          <Box sx={{ width: { xs: "100%", md: 280 } }}>
            <CardBox>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <SupportAgentIcon color="primary" fontSize="large" />
                  <Box>
                    <Typography fontWeight={700}>پشتیبانی تیکی</Typography>
                    <Typography variant="body2" color="text.secondary">
                      پاسخگوی سوالات شما هستیم
                    </Typography>
                  </Box>
                </Stack>

                <Divider />

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  component="a"
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "primary.main", textDecoration: "none" }}
                >
                  <EmailOutlinedIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    {SUPPORT_EMAIL}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  component="a"
                  href="https://github.com/mobin-torabi/Booking-Ticket-System"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "text.secondary", textDecoration: "none" }}
                >
                  <GitHubIcon fontSize="small" />
                  <Typography variant="body2">مخزن گیت‌هاب</Typography>
                </Stack>

                <Typography variant="caption" color="text.secondary">
                  پیام‌های ارسالی از این فرم مستقیماً برای تیم پشتیبانی
                  ارسال می‌شود و از طریق ایمیلی که وارد می‌کنید با شما
                  تماس خواهیم گرفت.
                </Typography>
              </Stack>
            </CardBox>
          </Box>

          {/* Form */}
          <Box sx={{ flex: 1 }}>
            <CardBox>
              <Typography variant="h6" fontWeight={700} mb={2.5}>
                ارسال پیام به پشتیبانی
              </Typography>

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={2.5}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Input
                      label="نام و نام خانوادگی"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                    />

                    <Input
                      label="ایمیل"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      required
                    />
                  </Stack>

                  <Input
                    label="موضوع (اختیاری)"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                  />

                  <Input
                    label="متن پیام"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    error={!!errors.message}
                    helperText={errors.message}
                    required
                    multiline
                    minRows={5}
                  />

                  <Box>
                    <Button
                      type="submit"
                      startIcon={<SendIcon />}
                      disabled={sending}
                    >
                      ارسال پیام
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </CardBox>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
