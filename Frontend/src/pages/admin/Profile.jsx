import { useEffect, useState } from "react";

import { Box, Typography, Chip, Avatar, Divider, Tooltip } from "@mui/material";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import SaveIcon from "@mui/icons-material/Save";
import LockResetIcon from "@mui/icons-material/LockReset";

import { userApi } from "../../api";

import { useAuth } from "../../context/AuthContext";

import useDocumentTitle from "../../hooks/useDocumentTitle";

import { formatDate } from "../../utils/formatDate";
import { showError, showPromise } from "../../utils/toast";
import { isValidEmail, isValidPhone } from "../../utils/validators";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

const GENDER_LABELS = {
  male: "مرد",
  female: "زن",
};

const EMPTY_INFO_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
};

const EMPTY_PASSWORD_FORM = {
  newPassword: "",
  confirmPassword: "",
};

export default function Profile() {
  useDocumentTitle("پروفایل | پنل مدیریت");

  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [infoForm, setInfoForm] = useState(EMPTY_INFO_FORM);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoChanged, setInfoChanged] = useState(false);

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFormChanged, setPasswordFormChanged] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchProfile() {
      setLoading(true);
      setError("");

      try {
        const { data } = await userApi.getUserById(user.id);

        if (!ignore) {
          setProfile(data);
          setInfoForm({
            firstName: data["first-name"] || "",
            lastName: data["last-name"] || "",
            email: data.email || "",
            phoneNumber: data["phone-number"] || "",
          });
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.error || "خطا در دریافت اطلاعات پروفایل",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    if (user?.id) fetchProfile();

    return () => {
      ignore = true;
    };
  }, [user?.id]);

  function handleInfoChange(e) {
    const { name, value } = e.target;
    setInfoForm((prev) => ({ ...prev, [name]: value }));
    setInfoChanged(true);
  }

  function handleSaveInfoBtnDisable() {
    if (savingInfo || !infoChanged) return true;
    return false;
  }

  function resetInputs() {
    setInfoChanged(false);
    setInfoForm({
      firstName: profile["first-name"] || "",
      lastName: profile["last-name"] || "",
      email: profile.email || "",
      phoneNumber: profile["phone-number"] || "",
    });
  }

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordFormChanged(true);
  }

  function handleSavePasswordBtnDisable() {
    if (savingPassword || !passwordFormChanged) return true;
    return false;
  }

  async function handleSaveInfo() {
    const firstName = infoForm.firstName.trim();
    const lastName = infoForm.lastName.trim();
    const phoneNumber = infoForm.phoneNumber.trim();
    const email = infoForm.email.trim();

    if (!firstName || !lastName || !phoneNumber) {
      showError("نام، نام خانوادگی و شماره تماس الزامی اند");
      return;
    }

    if (!isValidPhone(phoneNumber)) {
      showError("شماره تماس معتبر نیست (مثال: 09123456789)");
      return;
    }

    if (email && !isValidEmail(email)) {
      showError("ایمیل وارد شده معتبر نیست");
      return;
    }

    setSavingInfo(true);

    try {
      const { data } = await showPromise(
        userApi.updateUser(user.id, {
          firstName,
          lastName,
          email: email || null,
          phoneNumber,
        }),
        {
          loading: "در حال ذخیره تغییرات...",
          success: "اطلاعات پروفایل با موفقیت بروزرسانی شد",
          error: "بروزرسانی اطلاعات با خطا مواجه شد",
        },
      );

      setProfile(data);
      setInfoChanged(false);
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleSavePassword() {
    const { newPassword, confirmPassword } = passwordForm;

    if (!newPassword || !confirmPassword) {
      showError("وارد کردن رمز عبور جدید و تکرار آن الزامی است");
      setPasswordForm(EMPTY_PASSWORD_FORM)
      setPasswordFormChanged(false)
      return;
    }

    if (newPassword.length < 8) {
      showError("رمز عبور باید حداقل ۸ کاراکتر باشد");
      setPasswordForm(EMPTY_PASSWORD_FORM)
      setPasswordFormChanged(false)
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("رمز عبور جدید و تکرار آن یکسان نیستند");
      setPasswordForm(EMPTY_PASSWORD_FORM)
      setPasswordFormChanged(false)
      return;
    }

    setSavingPassword(true);

    try {
      await showPromise(userApi.updatePassword(user.id, newPassword), {
        loading: "در حال تغییر رمز عبور...",
        success: "رمز عبور با موفقیت تغییر کرد",
      });

      setPasswordForm(EMPTY_PASSWORD_FORM);
    } catch (error) {
      showError(error.response?.data?.error || "تغییر رمز عبور با خطا مواجه شد")
      setPasswordForm(EMPTY_PASSWORD_FORM);
    } finally {
      setSavingPassword(false);
      setPasswordFormChanged(false);
    }
  }

  if (loading) {
    return <Loading message="در حال بارگذاری پروفایل..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!profile) {
    return null;
  }

  return (
    <Box sx={{ p: 1, my: 2 }}>
      <PageHeader
        title="پروفایل"
        subtitle="مشاهده و ویرایش اطلاعات حساب کاربری"
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          maxWidth: 640,
          width: "100%",
          mx: "auto",
          mt: 5,
        }}
      >
        <Card>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: "secondary.main",
                fontSize: 24,
              }}
            >
              {profile.username.charAt(0).toUpperCase()}
            </Avatar>

            <Box>
              <Typography variant="h5">
                {profile["first-name"]} {profile["last-name"]}
              </Typography>

              <Tooltip title="نام کاربری">
                <Typography variant="body2" color="text.secondary">
                  {profile.username}
                </Typography>
              </Tooltip>
            </Box>

            <Chip
              label={"ادمین"}
              color={"secondary"}
              size="medium"
              sx={{ marginInlineStart: "auto" }}
            />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              جنسیت: {GENDER_LABELS[profile.gender] || profile.gender}
            </Typography>

            <Typography variant="body1" color="text.secondary">
              تاریخ تولد: {formatDate(profile.birth_date)}
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Input
              label="نام"
              name="firstName"
              value={infoForm.firstName}
              onChange={handleInfoChange}
              required
            />

            <Input
              label="نام خانوادگی"
              name="lastName"
              value={infoForm.lastName}
              onChange={handleInfoChange}
              required
            />

            <Input
              label="شماره تماس"
              name="phoneNumber"
              value={infoForm.phoneNumber}
              onChange={handleInfoChange}
              required
            />

            <Input
              label="ایمیل"
              name="email"
              type="email"
              value={infoForm.email}
              onChange={handleInfoChange}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: 2,
                gap: 2,
              }}
            >
              <Button
                startIcon={<KeyboardReturnIcon />}
                onClick={resetInputs}
                disabled={!infoChanged}
                color="error"
              >
                بازنشانی
              </Button>
              <Button
                startIcon={<SaveIcon />}
                onClick={handleSaveInfo}
                disabled={handleSaveInfoBtnDisable()}
              >
                {savingInfo ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </Box>
          </Box>
        </Card>

        <Card>
          <Typography variant="h6" sx={{ mb: 4 }}>
            تغییر رمز عبور
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Input
              label="رمز عبور جدید"
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              required
            />

            <Input
              label="تکرار رمز عبور جدید"
              name="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              required
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                startIcon={<LockResetIcon />}
                onClick={handleSavePassword}
                disabled={handleSavePasswordBtnDisable()}
              >
                {savingPassword ? "در حال ذخیره..." : "تغییر رمز عبور"}
              </Button>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
