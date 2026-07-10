import { useCallback, useEffect, useState } from "react";

import {
  Box,
  Tabs,
  Tab,
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

import { providerApi } from "../../api";

import useDebounce from "../../hooks/useDebounce";
import usePagination from "../../hooks/usePagination";
import useDocumentTitle from "../../hooks/useDocumentTitle";

import { showError, showPromise } from "../../utils/toast";
import { isValidEmail } from "../../utils/validators";

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

const PROVIDER_TYPES = [
  { route: "airlines", label: "ایرلاین‌ ها", singular: "ایرلاین" },
  {
    route: "bus-companies",
    label: "شرکت‌ های اتوبوس‌رانی",
    singular: "شرکت اتوبوس‌رانی",
  },
  {
    route: "train-companies",
    label: "شرکت‌ های قطار",
    singular: "شرکت قطار",
  },
  {
    route: "tour-agencies",
    label: "آژانس‌ های گردشگری",
    singular: "آژانس گردشگری",
  },
];

const STATUS_OPTIONS = [
  { value: "", label: "همه وضعیت‌ ها" },
  { value: "true", label: "فعال" },
  { value: "false", label: "غیرفعال" },
];

const EMPTY_FORM = { name: "", contactEmail: "", contactPhone: "" };

export default function Providers() {
  useDocumentTitle("مدیریت ارائه‌دهندگان | پنل مدیریت");

  const [activeRoute, setActiveRoute] = useState(PROVIDER_TYPES[0].route);
  const activeType = PROVIDER_TYPES.find((t) => t.route === activeRoute);

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState("");

  const { page, setPage, totalPages, currentData } = usePagination(
    providers,
    10,
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null); // null => create mode
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deactivatingProvider, setDeactivatingProvider] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [dataChanged, setDataChanged] = useState(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter) params.is_active = statusFilter;

      const { data } = await providerApi.getProviders(activeRoute, params);
      setProviders(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setProviders([]);
      } else {
        setError(err.response?.data?.error || "خطا در دریافت ارائه‌دهندگان");
      }
    } finally {
      setLoading(false);
    }
  }, [activeRoute, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchProviders();
    setPage(1);
  }, [fetchProviders, setPage]);

  function handleTabChange(_, newRoute) {
    setActiveRoute(newRoute);
    setSearch("");
    setStatusFilter("");
  }

  function openCreateModal() {
    setEditingProvider(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(provider) {
    setEditingProvider(provider);
    setFormData({
      name: provider.name || "",
      contactEmail: provider.contact_email || "",
      contactPhone: provider.contact_phone || "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingProvider(null);
    setFormData(EMPTY_FORM);
    setDataChanged(false)
  }

  function handleFormChange(e) {
    setDataChanged(true)
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveProvider() {
    const name = formData.name.trim();
    const contactEmail = formData.contactEmail.trim();
    const contactPhone = formData.contactPhone.trim();

    if (contactEmail && !isValidEmail(contactEmail)) {
      showError("ایمیل وارد شده معتبر نیست");
      return;
    }

    setSaving(true);

    try {
      if (editingProvider) {
        await showPromise(
          providerApi.updateProvider(activeRoute, editingProvider.id, {
            name: name || null,
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
          }),
          {
            loading: "در حال ذخیره تغییرات...",
            success: `${activeType.singular} با موفقیت بروزرسانی شد`,
          },
        );
      } else {
        await showPromise(
          providerApi.createProvider(activeRoute, {
            name: name || null,
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
            isActive: true,
          }),
          {
            loading: "در حال افزودن...",
            success: `${activeType.singular} با موفقیت افزوده شد`,
          },
        );
      }

      closeModal();
      fetchProviders();
    } catch(error) {
        showError(error.response?.data?.error ?? (editingProvider ? "بروزرسانی اطلاعات با خطا مواجه شد" :"افزودن ارائه‌دهنده با خطا مواجه شد"));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDeactivate() {
    if (!deactivatingProvider) return;

    setDeactivating(true);

    try {
      await showPromise(
        providerApi.deleteProvider(activeRoute, deactivatingProvider.id),
        {
          loading: "در حال غیرفعال‌سازی...",
          success: "ارائه‌دهنده غیرفعال شد",
          error: "غیرفعال‌سازی با خطا مواجه شد",
        },
      );

      setDeactivatingProvider(null);
      fetchProviders();
    } finally {
      setDeactivating(false);
    }
  }

  async function handleActivate(provider) {
    try {
      await showPromise(
        providerApi.updateProvider(activeRoute, provider.id, {
          isActive: true,
        }),
        {
          loading: "در حال فعال‌سازی...",
          success: "ارائه‌دهنده فعال شد",
          error: "فعال‌سازی با خطا مواجه شد",
        },
      );

      fetchProviders();
    } catch {
      // handles in toast
    }
  }

  function saveBtnDisableHandler() {
    if (!dataChanged) return true;
    if (saving) return true;

    return false;
  }

  return (
    <Box sx={{ p: 1, mb:2 }}>
      <PageHeader
        title="مدیریت ارائه‌دهندگان"
        subtitle={`مجموع ${providers.length} ${activeType.singular}`}
        actions={
          <Button startIcon={<AddIcon />} onClick={openCreateModal}>
            افزودن {activeType.singular}
          </Button>
        }
      />

      <Tabs
        value={activeRoute}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {PROVIDER_TYPES.map((t) => (
          <Tab key={t.route} value={t.route} label={t.label} />
        ))}
      </Tabs>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={{ flex: "1 1 260px" }}>
          <SearchBar
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`جستجو بر اساس نام ${activeType.singular}...`}
          />
        </Box>

        <Box sx={{ width: { xs: "100%", sm: 180 } }}>
          <Select
            label="وضعیت"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </Box>
      </Box>

      {loading && <Loading message="در حال بارگذاری ارائه‌دهندگان..." />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && providers.length === 0 && (
        <EmptyState
          title="ارائه‌دهنده‌ای یافت نشد"
          description={`هیچ ${activeType.singular}ای با معیارهای جستجوی فعلی پیدا نشد.`}
        />
      )}

      {!loading && !error && providers.length > 0 && (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>نام</TableCell>
                  <TableCell>ایمیل</TableCell>
                  <TableCell>شماره تماس</TableCell>
                  <TableCell>وضعیت</TableCell>
                  <TableCell align="center">عملیات</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {currentData.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.name}</TableCell>
                    <TableCell sx={{ direction: "ltr", textAlign: "left" }}>
                      {p.contact_email || "-_"}
                    </TableCell>
                    <TableCell sx={{ direction: "ltr", textAlign: "left" }}>
                      {p.contact_phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="medium"
                        label={p.is_active ? "فعال" : "غیرفعال"}
                        color={p.is_active ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="ویرایش">
                        <IconButton
                          size="small"
                          onClick={() => openEditModal(p)}
                        >
                          <EditIcon fontSize="medium" />
                        </IconButton>
                      </Tooltip>

                      {p.is_active ? (
                        <Tooltip title="غیرفعال‌سازی">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => setDeactivatingProvider(p)}
                          >
                            <ToggleOnIcon fontSize="large" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="فعال‌سازی">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleActivate(p)}
                          >
                            <ToggleOffIcon fontSize="large" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Pagination
              page={page}
              count={totalPages}
              onChange={(_, value) => setPage(value)}
            />
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        title={
          editingProvider
            ? `ویرایش ${activeType.singular}`
            : `افزودن ${activeType.singular}`
        }
        onClose={closeModal}
        actions={
          <>
            <Button variant="outlined" onClick={closeModal} disabled={saving}>
              انصراف
            </Button>

            <Button onClick={handleSaveProvider} disabled={saveBtnDisableHandler()}>
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Input
            label="نام"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
          />

          <Input
            label="ایمیل"
            name="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={handleFormChange}
          />

          <Input
            label="شماره تماس"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleFormChange}
          />
        </Box>
      </Modal>

      <ConfirmDialog
        open={!!deactivatingProvider}
        title="غیرفعال‌سازی ارائه‌دهنده"
        message={
          deactivatingProvider
            ? `آیا از غیرفعال‌سازی «${deactivatingProvider.name}» مطمئن هستید؟ این ارائه‌دهنده دیگر برای رزرو در دسترس نخواهد بود.`
            : ""
        }
        confirmText={deactivating ? "در حال غیرفعال‌سازی..." : "غیرفعال کن"}
        cancelText="انصراف"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => !deactivating && setDeactivatingProvider(null)}
      />
    </Box>
  );
}
