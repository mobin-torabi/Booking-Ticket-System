import { useEffect, useState } from "react";
import { Box, Stack, Typography, Avatar, Chip, Divider } from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import HomeIcon from "@mui/icons-material/Home";
import BadgeIcon from "@mui/icons-material/Badge";

import { useAuth } from "../../context/AuthContext";

import { getUserById, updateUser, updatePassword } from "../../api/userApi";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../../api/addressApi";
import { getProvinces, getCities } from "../../api/locationApi";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";

import { formatDate } from "../../utils/formatDate";
import {
  isValidEmail,
  isValidPhone,
  isValidPassword,
} from "../../utils/validators";
import { showError, showPromise } from "../../utils/toast";

const GENDER_LABELS = {
  male: "مرد",
  female: "زن",
};

const EMPTY_ADDRESS_FORM = {
  provinceId: "",
  cityId: "",
  addressDetails: "",
  houseNumber: "",
};

export default function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [infoErrors, setInfoErrors] = useState({});

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // ---- Addresses ----
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
    fetchProfile();
    fetchAddresses();
    fetchLocations();
  }, []);

  async function fetchProfile() {
    try {
      setLoadingProfile(true);
      setProfileError(null);

      const { data } = await getUserById(user.id);

      setProfile(data);
      setInfoForm({
        firstName: data["first-name"] ?? "",
        lastName: data["last-name"] ?? "",
        email: data.email ?? "",
        phoneNumber: data["phone-number"] ?? "",
      });
    } catch (error) {
      setProfileError(
        error.response?.data?.error ?? "خطا در دریافت اطلاعات کاربر",
      );
    } finally {
      setLoadingProfile(false);
    }
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
          error.response?.data?.error ?? "خطا در دریافت آدرس‌ها",
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
    setInfoForm({
      ...infoForm,
      [e.target.name]: e.target.value,
    });
  }

  function startEditingInfo() {
    setInfoForm({
      firstName: profile["first-name"] ?? "",
      lastName: profile["last-name"] ?? "",
      email: profile.email ?? "",
      phoneNumber: profile["phone-number"] ?? "",
    });
    setInfoErrors({});
    setEditingInfo(true);
  }

  function cancelEditingInfo() {
    setEditingInfo(false);
    setInfoErrors({});
  }

  function validateInfoForm() {
    const errors = {};

    if (!infoForm.firstName.trim()) errors.firstName = "نام الزامی است";
    if (!infoForm.lastName.trim())
      errors.lastName = "نام خانوادگی الزامی است";

    if (!infoForm.phoneNumber.trim()) {
      errors.phoneNumber = "شماره تماس الزامی است";
    } else if (!isValidPhone(infoForm.phoneNumber.trim())) {
      errors.phoneNumber = "شماره تماس معتبر نیست (مثال: 09123456789)";
    }

    if (infoForm.email && !isValidEmail(infoForm.email.trim())) {
      errors.email = "ایمیل معتبر نیست";
    }

    setInfoErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleInfoSave(e) {
    e.preventDefault();

    if (!validateInfoForm()) return;

    try {
      setSavingInfo(true);

      const { data } = await showPromise(
        updateUser(user.id, {
          firstName: infoForm.firstName.trim(),
          lastName: infoForm.lastName.trim(),
          email: infoForm.email.trim() || null,
          phoneNumber: infoForm.phoneNumber.trim(),
        }),
        {
          loading: "در حال ذخیره اطلاعات...",
          success: "اطلاعات با موفقیت بروزرسانی شد!",
        },
      );

      setProfile(data);
      setEditingInfo(false);
    } catch (error) {
      showError(error.response?.data?.error ?? "خطا در بروزرسانی اطلاعات");
    } finally {
      setSavingInfo(false);
    }
  }


  function openPasswordModal() {
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setPasswordErrors({});
    setPasswordModalOpen(true);
  }

  function closePasswordModal() {
    setPasswordModalOpen(false);
  }

  function handlePasswordChange(e) {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  }

  function validatePasswordForm() {
    const errors = {};

    if (!isValidPassword(passwordForm.newPassword)) {
      errors.newPassword = "رمز ورود باید حداقل ۸ کاراکتر باشد";
    }

    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = "رمز ورود و تکرار آن یکسان نیستند";
    }

    setPasswordErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handlePasswordSave(e) {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    try {
      setSavingPassword(true);

      await showPromise(updatePassword(user.id, passwordForm.newPassword), {
        loading: "در حال تغییر رمز ورود...",
        success: "رمز ورود با موفقیت تغییر کرد!",
      });

      closePasswordModal();
    } catch (error) {
      showError(error.response?.data?.error ?? "خطا در تغییر رمز ورود");
    } finally {
      setSavingPassword(false);
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

        setAddresses((prev) =>
          prev.map((a) => (a.id === data.id ? data : a)),
        );
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


  if (loadingProfile) {
    return (
      <Box dir="rtl" sx={{ pt: { xs: 12, md: 14 }, pb: 6 }}>
        <Loading message="در حال بارگذاری اطلاعات حساب کاربری..." />
      </Box>
    );
  }

  if (profileError) {
    return (
      <Box dir="rtl" sx={{ pt: { xs: 12, md: 14 }, pb: 6 }}>
        <ErrorState message={profileError} />
      </Box>
    );
  }

  return (
    <Box
      dir="rtl"
      sx={{
        pt: { xs: 11, md: 13 },
        pb: 6,
        px: { xs: 2, md: 4 },
        maxWidth: 1100,
        mx: "auto",
      }}
    >
      <PageHeader 
        title="پروفایل من"
        className
      />

      <Stack spacing={3}>
        <Card className="mt-10">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Avatar
              sx={{
                width: 72,
                height: 72,
                fontSize: "1.75rem",
                fontWeight: "bold",
                bgcolor: "primary.main",
              }}
            >
              {profile.username?.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography variant="h5" fontWeight="bold">
                  {profile["first-name"]} {profile["last-name"]}
                </Typography>

                <Chip size="small" color="primary" label="کاربر" />
              </Stack>

              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                نام کاربری: {profile.username}
              </Typography>

              <Stack
                direction="row"
                spacing={3}
                sx={{ mt: 1 }}
                flexWrap="wrap"
              >
                <Typography variant="body2" color="text.secondary">
                  جنسیت: {GENDER_LABELS[profile.gender] ?? profile.gender}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  تاریخ تولد: {formatDate(profile.birth_date)}
                </Typography>
              </Stack>
            </Box>

            <Button
              variant="outlined"
              startIcon={<LockIcon />}
              onClick={openPasswordModal}
            >
              تغییر رمز ورود
            </Button>
          </Stack>
        </Card>

        <Card>
          <Stack spacing={2}>
            <Stack
              direction="row"
              alignItems="center"
            >
              <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
                <BadgeIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  اطلاعات شخصی
                </Typography>
              </Stack>

              {!editingInfo && (
                <Button
                  sx={{ ml: "auto" }}
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={startEditingInfo}
                >
                  ویرایش
                </Button>
              )}
            </Stack>

            <Divider />

            <form onSubmit={handleInfoSave}>
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Input
                    label="نام"
                    name="firstName"
                    value={infoForm.firstName}
                    onChange={handleInfoChange}
                    required
                    error={!!infoErrors.firstName}
                    helperText={infoErrors.firstName}
                  />

                  <Input
                    label="نام خانوادگی"
                    name="lastName"
                    value={infoForm.lastName}
                    onChange={handleInfoChange}
                    required
                    error={!!infoErrors.lastName}
                    helperText={infoErrors.lastName}
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Input
                    label="شماره تماس"
                    name="phoneNumber"
                    value={infoForm.phoneNumber}
                    onChange={handleInfoChange}
                    required
                    error={!!infoErrors.phoneNumber}
                    helperText={infoErrors.phoneNumber}
                  />

                  <Input
                    label="ایمیل"
                    name="email"
                    type="email"
                    value={infoForm.email}
                    onChange={handleInfoChange}
                    error={!!infoErrors.email}
                    helperText={infoErrors.email}
                  />
                </Stack>

                {editingInfo && (
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      startIcon={<CloseIcon />}
                      onClick={cancelEditingInfo}
                      disabled={savingInfo}
                    >
                      انصراف
                    </Button>

                    <Button
                      type="submit"
                      startIcon={<SaveIcon />}
                      disabled={savingInfo}
                    >
                      {savingInfo ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </form>
          </Stack>
        </Card>

        <Card>
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <HomeIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  آدرس‌های من
                </Typography>
              </Stack>

              <Button startIcon={<AddIcon />} onClick={openAddAddressModal}>
                افزودن آدرس
              </Button>
            </Stack>

            <Divider />

            {loadingAddresses && <Loading message="در حال دریافت آدرس‌ها..." />}

            {!loadingAddresses && addressesError && (
              <ErrorState message={addressesError} />
            )}

            {!loadingAddresses && !addressesError && addresses.length === 0 && (
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
                      <Typography fontWeight="bold">
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
      </Stack>

      <Modal
        open={passwordModalOpen}
        title="تغییر رمز ورود"
        onClose={closePasswordModal}
        actions={
          <>
            <Button
              variant="outlined"
              onClick={closePasswordModal}
              disabled={savingPassword}
            >
              انصراف
            </Button>

            <Button onClick={handlePasswordSave} disabled={savingPassword}>
              {savingPassword ? "در حال ذخیره..." : "ذخیره رمز جدید"}
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Input
            label="رمز ورود جدید"
            name="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
            required
            error={!!passwordErrors.newPassword}
            helperText={passwordErrors.newPassword}
          />

          <Input
            label="تکرار رمز ورود جدید"
            name="confirmPassword"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={handlePasswordChange}
            required
            error={!!passwordErrors.confirmPassword}
            helperText={passwordErrors.confirmPassword}
          />
        </Stack>
      </Modal>

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
