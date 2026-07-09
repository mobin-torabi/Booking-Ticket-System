import { useEffect, useState } from "react";

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { userApi } from "../../api";

import { useAuth } from "../../context/AuthContext";

import useDebounce from "../../hooks/useDebounce";
import usePagination from "../../hooks/usePagination";
import useDocumentTitle from "../../hooks/useDocumentTitle";

import { formatDate } from "../../utils/formatDate";
import { showError, showPromise } from "../../utils/toast";
import { isValidEmail, isValidPhone } from "../../utils/validators";

import PageHeader from "../../components/common/PageHeader";
import SearchBar from "../../components/common/SearchBar";
import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Pagination from "../../components/common/Pagination";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";

const ROLE_OPTIONS = [
  { value: "", label: "همه نقش‌ ها" },
  { value: "Admin", label: "ادمین" },
  { value: "Costumer", label: "مشتری" },
];

const ROLE_OPTIONS_FORM = ROLE_OPTIONS.slice(1);

const GENDER_OPTIONS = [
  { value: "", label: "همه" },
  { value: "male", label: "مرد" },
  { value: "female", label: "زن" },
];

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  role: "Costumer",
};

export default function Users() {
  useDocumentTitle("مدیریت کاربران | پنل مدیریت");

  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [roleFilter, setRoleFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const { page, setPage, totalPages, currentData } = usePagination(users, 10);

  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dataChanged, setDataChanged] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchUsers() {
      setLoading(true);
      setError("");

      try {
        const params = {};

        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (roleFilter) params.role = roleFilter;
        if (genderFilter) params.gender = genderFilter;

        const { data } = await userApi.getUsers(params);

        if (!ignore) setUsers(data);
      } catch (err) {
        if (ignore) return;

        if (err.response?.status === 404) {
          setUsers([]);
        } else {
          setError(err.response?.data?.error || "خطا در دریافت لیست کاربران");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchUsers();
    setPage(1);

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, roleFilter, genderFilter]);

  function openEditModal(user) {
    setEditingUser(user);
    setFormData({
      firstName: user["first-name"] || "",
      lastName: user["last-name"] || "",
      email: user.email || "",
      phoneNumber: user["phone-number"] || "",
      role: user.role,
    });
  }

  function closeEditModal() {
    if (saving) return;
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setDataChanged(false);
  }

  function handleFormChange(e) {
    setDataChanged(true);
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveUser() {
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const phoneNumber = formData.phoneNumber.trim();
    const email = formData.email.trim();

    if (!firstName || !lastName || !phoneNumber) {
      showError("نام، نام خانوادگی و شماره تماس الزامی است");
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

    setSaving(true);

    try {
      await showPromise(
        (async () => {
          await userApi.updateUser(editingUser.id, {
            firstName,
            lastName,
            email: email || null,
            phoneNumber,
          });

          if (formData.role !== editingUser.role) {
            await userApi.updateUserRole(editingUser.id, formData.role);
          }
        })(),
        {
          loading: "در حال ذخیره تغییرات...",
          success: "اطلاعات کاربر با موفقیت بروزرسانی شد",
        },
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                "first-name": firstName,
                "last-name": lastName,
                email: email || null,
                "phone-number": phoneNumber,
                role: formData.role,
              }
            : u,
        ),
      );

      closeEditModal();
    } catch(error) {
      showError(error.response?.data?.error ?? "بروزرسانی اطلاعات کاربر با خطا مواجه شد");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingUser) return;

    setDeleting(true);

    try {
      await showPromise(userApi.deleteUser(deletingUser.id), {
        loading: "در حال حذف کاربر...",
        success: "کاربر با موفقیت حذف شد",
        error: "حذف کاربر با خطا مواجه شد",
      });

      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    } finally {
      setDeleting(false);
    }
  }

  function saveBtnDisableHandler() {
    if (!dataChanged) return true;
    if (saving) return true;

    return false;
  }

  return (
    <div style={{ padding: "10px" }}>
      <Box>
        <PageHeader
          title="مدیریت کاربران"
          subtitle={`مجموع ${users.length} کاربر`}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2, mb: 3 }}>
          <Box sx={{ flex: "1 1 260px" }}>
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس نام کاربری یا نام و نام خانوادگی..."
            />
          </Box>

          <Box sx={{ width: { xs: "100%", sm: 180 } }}>
            <Select
              label="نقش"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={ROLE_OPTIONS}
            />
          </Box>

          <Box sx={{ width: { xs: "100%", sm: 180 } }}>
            <Select
              label="جنسیت"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              options={GENDER_OPTIONS}
            />
          </Box>
        </Box>

        {loading && <Loading message="در حال بارگذاری کاربران..." />}

        {!loading && error && <ErrorState message={error} />}

        {!loading && !error && users.length === 0 && (
          <EmptyState
            title="کاربری یافت نشد"
            description="با معیارهای جستجوی فعلی هیچ کاربری پیدا نشد."
          />
        )}

        {!loading && !error && users.length > 0 && (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>نام کاربری</TableCell>
                    <TableCell>نام و نام خانوادگی</TableCell>
                    <TableCell>شماره تماس</TableCell>
                    <TableCell>ایمیل</TableCell>
                    <TableCell>جنسیت</TableCell>
                    <TableCell>تاریخ تولد</TableCell>
                    <TableCell>نقش</TableCell>
                    <TableCell align="center">عملیات</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {currentData.map((u) => {
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <TableRow key={u.id} hover>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>
                          {u["first-name"]} {u["last-name"]}
                        </TableCell>
                        <TableCell sx={{ direction: "ltr", textAlign: "left" }}>
                          {u["phone-number"]}
                        </TableCell>
                        <TableCell sx={{ direction: "ltr", textAlign: "left" }}>
                          {u.email || "—"}
                        </TableCell>
                        <TableCell>
                          {u.gender === "male" ? "مرد" : "زن"}
                        </TableCell>
                        <TableCell>{formatDate(u.birth_date)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={u.role === "Admin" ? "ادمین" : "مشتری"}
                            color={u.role === "Admin" ? "secondary" : "primary"}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip
                            title={
                              isSelf
                                ? "امکان ویرایش حساب خودتان از این بخش وجود ندارد"
                                : "ویرایش کاربر"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => openEditModal(u)}
                                disabled={isSelf}
                              >
                                <EditIcon fontSize="medium" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip
                            title={
                              isSelf
                                ? "امکان حذف حساب خودتان وجود ندارد"
                                : "حذف کاربر"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeletingUser(u)}
                                disabled={isSelf}
                              >
                                <DeleteIcon fontSize="medium" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 1, mb: 1 }}>
                <Pagination
                  page={page}
                  count={totalPages}
                  onChange={(_, value) => setPage(value)}
                />
              </Box>
            )}
          </>
        )}

        <Modal
          open={!!editingUser}
          title="ویرایش اطلاعات کاربر"
          onClose={closeEditModal}
          actions={
            <>
              <Button
                variant="outlined"
                onClick={closeEditModal}
                disabled={saving}
              >
                انصراف
              </Button>

              <Button
                onClick={handleSaveUser}
                disabled={saveBtnDisableHandler()}
              >
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </>
          }
        >
          {editingUser && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                mt: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                نام کاربری: {editingUser.username}
              </Typography>

              <Input
                label="نام"
                name="firstName"
                value={formData.firstName}
                onChange={handleFormChange}
                required
              />

              <Input
                label="نام خانوادگی"
                name="lastName"
                value={formData.lastName}
                onChange={handleFormChange}
                required
              />

              <Input
                label="شماره تماس"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleFormChange}
                required
              />

              <Input
                label="ایمیل"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
              />

              <Select
                label="نقش کاربر"
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                options={ROLE_OPTIONS_FORM}
              />
            </Box>
          )}
        </Modal>

        <ConfirmDialog
          open={!!deletingUser}
          title="حذف کاربر"
          message={
            deletingUser
              ? `آیا از حذف کاربر «${deletingUser["first-name"]} ${deletingUser["last-name"]}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`
              : ""
          }
          confirmText={deleting ? "در حال حذف..." : "حذف کن"}
          cancelText="انصراف"
          onConfirm={handleConfirmDelete}
          onCancel={() => !deleting && setDeletingUser(null)}
        />
      </Box>
    </div>
  );
}
