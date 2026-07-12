import { useEffect, useState } from "react";

import {
  Box,
  Stack,
  Typography,
  Chip,
  Avatar,
  Divider,
  Tooltip,
} from "@mui/material";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import SaveIcon from "@mui/icons-material/Save";
import LockResetIcon from "@mui/icons-material/LockReset";
import HomeIcon from "@mui/icons-material/Home";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { userApi } from "../../api";

import { useAuth } from "../../context/AuthContext";

import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../../api/addressApi";
import { getProvinces, getCities } from "../../api/locationApi";

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
import Modal from "../../components/common/Modal";
import Select from "../../components/common/Select";
import ConfirmDialog from "../../components/common/ConfirmDialog";

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

const EMPTY_ADDRESS_FORM = {
  provinceId: "",
  cityId: "",
  addressDetails: "",
  houseNumber: "",
};

export default function Profile() {
  useDocumentTitle("پروفایل | پنل مدیریت");

  const { user, isCustomer } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [infoForm, setInfoForm] = useState(EMPTY_INFO_FORM);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoChanged, setInfoChanged] = useState(false);

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFormChanged, setPasswordFormChanged] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressesError, setAddressesError] = useState(null);

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM);
  const [addressErrors, setAddressErrors] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  if (isCustomer) {
    useEffect(() => {
      fetchAddresses();
      fetchLocations();
    }, []);
  }

  async function fetchAddresses() {
    try {
      setLoadingAddresses(true);
      setAddressesError(null);

      const { data } = await getAddresses(user.id);

      setAddresses(data);
    } catch (error) {
      if (error.response?.status === 404) {
        setAddresses([]);
      } else {
        setAddressesError(
          error.response?.data?.error ?? "خطا در دریافت آدرس‌ ها",
        );
      }
    } finally {
      setLoadingAddresses(false);
    }
  }

  async function fetchLocations() {
    try {
      const [provincesRes, citiesRes] = await Promise.all([
        getProvinces(),
        getCities(),
      ]);

      setProvinces(provincesRes.data);
      setCities(citiesRes.data);
    } catch (error) {
      console.error(error);
    }
  }

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
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordFormChanged(false);
      return;
    }

    if (newPassword.length < 8) {
      showError("رمز عبور باید حداقل ۸ کاراکتر باشد");
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordFormChanged(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("رمز عبور جدید و تکرار آن یکسان نیستند");
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordFormChanged(false);
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
      showError(
        error.response?.data?.error || "تغییر رمز عبور با خطا مواجه شد",
      );
      setPasswordForm(EMPTY_PASSWORD_FORM);
    } finally {
      setSavingPassword(false);
      setPasswordFormChanged(false);
    }
  }

  function getProvinceName(provinceId) {
    const province = provinces.find(
      (p) => String(p["province-id"]) === String(provinceId),
    );

    return province?.name ?? "-";
  }

  function getCityName(cityId) {
    const city = cities.find((c) => String(c.id) === String(cityId));

    return city?.name ?? "-";
  }

  function citiesForProvince(provinceId) {
    if (!provinceId) return [];

    return cities.filter(
      (c) => String(c["province-id"]) === String(provinceId),
    );
  }

  function openAddAddressModal() {
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS_FORM);
    setAddressErrors({});
    setAddressModalOpen(true);
  }

  function openEditAddressModal(address) {
    setEditingAddressId(address.id);
    setAddressForm({
      provinceId: address["province-id"] ? String(address["province-id"]) : "",
      cityId: address["city-id"] ?? "",
      addressDetails: address["address-details"] ?? "",
      houseNumber: address["house-number"] ?? "",
    });
    setAddressErrors({});
    setAddressModalOpen(true);
  }

  function closeAddressModal() {
    setAddressModalOpen(false);
  }

  function handleAddressFormChange(e) {
    const { name, value } = e.target;

    if (name === "provinceId") {
      setAddressForm({
        ...addressForm,
        provinceId: value,
        cityId: "",
      });

      return;
    }

    setAddressForm({
      ...addressForm,
      [name]: value,
    });
  }

  function validateAddressForm() {
    const errors = {};

    if (!addressForm.addressDetails.trim()) {
      errors.addressDetails = "آدرس دقیق الزامی است";
    }

    setAddressErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleAddressSave(e) {
    e.preventDefault();

    if (!validateAddressForm()) return;

    try {
      setSavingAddress(true);

      if (editingAddressId) {
        const { data } = await showPromise(
          updateAddress(editingAddressId, {
            "user-id": user.id,
            "province-id": addressForm.provinceId || null,
            "city-id": addressForm.cityId || null,
            "address-details": addressForm.addressDetails.trim(),
            "house-number": addressForm.houseNumber.trim() || null,
          }),
          {
            loading: "در حال ذخیره آدرس...",
            success: "آدرس با موفقیت بروزرسانی شد!",
          },
        );

        setAddresses((prev) => prev.map((a) => (a.id === data.id ? data : a)));
      } else {
        const { data } = await showPromise(
          createAddress({
            userId: user.id,
            provinceId: addressForm.provinceId || null,
            cityId: addressForm.cityId || null,
            addressDetails: addressForm.addressDetails.trim(),
            houseNumber: addressForm.houseNumber.trim() || null,
          }),
          {
            loading: "در حال افزودن آدرس...",
            success: "آدرس با موفقیت افزوده شد!",
          },
        );

        setAddresses((prev) => [...prev, data]);
      }

      setAddressModalOpen(false);
    } catch (error) {
      showError(error.response?.data?.error ?? "خطا در ذخیره آدرس");
    } finally {
      setSavingAddress(false);
    }
  }

  function askDeleteAddress(address) {
    setDeleteTarget(address);
  }

  function cancelDeleteAddress() {
    setDeleteTarget(null);
  }

  async function confirmDeleteAddress() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await showPromise(deleteAddress(deleteTarget.id), {
        loading: "در حال حذف آدرس...",
        success: "آدرس حذف شد!",
      });

      setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    } catch (error) {
      showError(error.response?.data?.error ?? "خطا در حذف آدرس");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
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
              label={isCustomer ? "کاربر" : "ادمین"}
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
        {isCustomer ? (
          <Card>
            <Stack spacing={2}>
              <Stack
                direction="row"
                justifycontent="space-between"
                alignitems="center"
              >
                <Box sx={{ display: "flex", alignItems: 'center', width: '100%'}}>
                  <Stack direction="row" spacing={1} alignitems="center">
                    <HomeIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      آدرس‌ های من
                    </Typography>
                  </Stack>
                  <Box sx={{marginInlineStart: "auto"}}>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={openAddAddressModal}
                    >
                      افزودن آدرس
                    </Button>
                  </Box>
                </Box>
              </Stack>

              <Divider />

              {loadingAddresses && (
                <Loading message="در حال دریافت آدرس‌ ها..." />
              )}

              {!loadingAddresses && addressesError && (
                <ErrorState message={addressesError} />
              )}

              {!loadingAddresses &&
                !addressesError &&
                addresses.length === 0 && (
                  <EmptyState
                    title="هنوز آدرسی ثبت نشده"
                    description="برای شروع، یک آدرس جدید اضافه کنید."
                  />
                )}

              {!loadingAddresses && !addressesError && addresses.length > 0 && (
                <Stack spacing={2}>
                  {addresses.map((address) => (
                    <Box
                      key={address.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 1.5,
                        p: 2,
                        borderRadius: "12px",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Box>
                        <Typography sx={{fontWeight: "bold"}}>
                          {getProvinceName(address["province-id"])} ،{" "}
                          {getCityName(address["city-id"])}
                        </Typography>

                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                          {address["address-details"]}
                          {address["house-number"]
                            ? ` - پلاک ${address["house-number"]}`
                            : ""}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => openEditAddressModal(address)}
                        >
                          ویرایش
                        </Button>

                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => askDeleteAddress(address)}
                        >
                          حذف
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>
        ) : null}
      </Box>
      <Modal
        open={addressModalOpen}
        title={editingAddressId ? "ویرایش آدرس" : "افزودن آدرس جدید"}
        onClose={closeAddressModal}
        actions={
          <>
            <Button
              variant="outlined"
              onClick={closeAddressModal}
              disabled={savingAddress}
            >
              انصراف
            </Button>

            <Button onClick={handleAddressSave} disabled={savingAddress}>
              {savingAddress ? "در حال ذخیره..." : "ذخیره آدرس"}
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Select
              label="استان"
              name="provinceId"
              value={addressForm.provinceId}
              onChange={handleAddressFormChange}
              defaultValue=""
              options={provinces.map((p) => ({
                label: p.name,
                value: String(p["province-id"]),
              }))}
            />

            <Select
              label="شهر"
              name="cityId"
              value={addressForm.cityId}
              onChange={handleAddressFormChange}
              defaultValue=""
              options={citiesForProvince(addressForm.provinceId).map((c) => ({
                label: c.name,
                value: c.id,
              }))}
            />
          </Stack>

          <Input
            label="آدرس دقیق"
            name="addressDetails"
            value={addressForm.addressDetails}
            onChange={handleAddressFormChange}
            required
            error={!!addressErrors.addressDetails}
            helperText={addressErrors.addressDetails}
          />

          <Input
            label="پلاک"
            name="houseNumber"
            value={addressForm.houseNumber}
            onChange={handleAddressFormChange}
          />
        </Stack>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف آدرس"
        message="آیا از حذف این آدرس مطمئن هستید؟ این عملیات قابل بازگشت نیست."
        onConfirm={confirmDeleteAddress}
        onCancel={cancelDeleteAddress}
      />
    </Box>
  );
}
