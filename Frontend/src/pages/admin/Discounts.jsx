import { useCallback, useEffect, useMemo, useState } from "react";

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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

import { discountApi } from "../../api";

import usePagination from "../../hooks/usePagination";
import useDocumentTitle from "../../hooks/useDocumentTitle";

import { formatDate } from "../../utils/formatDate";
import { showError, showPromise } from "../../utils/toast";

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

const STATUS_OPTIONS = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "true", label: "فعال" },
  { value: "false", label: "غیرفعال" },
];

const EMPTY_FORM = {
  code: "",
  percentage: "",
  maxDiscountAmount: "",
  minimumOrderAmount: "",
  usageLimit: "",
  startsAt: "",
  expiresAt: "",
};

function getStatusInfo(discount) {
  const now = new Date();

  if (!discount.is_active) return { label: "غیرفعال", color: "error" };
  if (new Date(discount.expires_at) < now)
    return { label: "منقضی شده", color: "default" };
  if (new Date(discount.starts_at) > now)
    return { label: "شروع نشده", color: "info" };

  return { label: "فعال", color: "success" };
}

export default function Discounts() {
  useDocumentTitle("مدیریت تخفیف‌ها | پنل مدیریت");

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deactivatingDiscount, setDeactivatingDiscount] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const [deletingDiscount, setDeletingDiscount] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (statusFilter) params.active = statusFilter;

      const { data } = await discountApi.getDiscounts(params);
      setDiscounts(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setDiscounts([]);
      } else {
        setError(err.response?.data?.error || "خطا در دریافت تخفیف‌ ها");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const filteredDiscounts = useMemo(() => {
    const term = search.trim().toUpperCase();
    if (!term) return discounts;
    return discounts.filter((d) => d.code.toUpperCase().includes(term));
  }, [discounts, search]);

  const { page, setPage, totalPages, currentData } = usePagination(
    filteredDiscounts,
    10,
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, setPage]);

  function openCreateModal() {
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setFormData(EMPTY_FORM);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveDiscount() {
    const code = formData.code.trim().toUpperCase();
    const percentage = Number(formData.percentage);
    const maxDiscountAmount = formData.maxDiscountAmount.trim();
    const minimumOrderAmount = formData.minimumOrderAmount.trim();
    const usageLimit = formData.usageLimit.trim();
    const { startsAt, expiresAt } = formData;

    if (!code || !formData.percentage || !startsAt || !expiresAt) {
      showError("کد تخفیف، درصد تخفیف، تاریخ شروع و تاریخ پایان الزامی اند");
      return;
    }

    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      showError("درصد تخفیف باید عددی بین ۱ تا ۱۰۰ باشد");
      return;
    }

    if (new Date(expiresAt) <= new Date(startsAt)) {
      showError("تاریخ پایان باید بعد از تاریخ شروع باشد");
      return;
    }

    setSaving(true);

    try {
      await showPromise(
        discountApi.createDiscount({
          code,
          percentage,
          maxDiscountAmount: maxDiscountAmount
            ? Number(maxDiscountAmount)
            : null,
          minimumOrderAmount: minimumOrderAmount
            ? Number(minimumOrderAmount)
            : null,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          startsAt,
          expiresAt,
        }),
        {
          loading: "در حال افزودن تخفیف...",
          success: "کد تخفیف با موفقیت افزوده شد",
          error:
            "افزودن کد تخفیف با خطا مواجه شد. توجه داشته باشید که کد تکراری قابل قبول نیست.",
        },
      );

      closeModal();
      fetchDiscounts();
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(discount) {
    try {
      await showPromise(discountApi.updateDiscount(discount.id, true), {
        loading: "در حال فعال‌سازی...",
        success: "کد تخفیف فعال شد",
      });

      fetchDiscounts();
    } catch (error) {
      showError(error.response?.data?.error || "فعال‌ سازی با خطا مواجه شد");
    }
  }

  async function handleConfirmDeactivate() {
    if (!deactivatingDiscount) return;

    setDeactivating(true);

    try {
      await showPromise(
        discountApi.updateDiscount(deactivatingDiscount.id, false),
        {
          loading: "در حال غیرفعال‌سازی...",
          success: "کد تخفیف غیرفعال شد",
        },
      );

      setDeactivatingDiscount(null);
      fetchDiscounts();
    } catch (error) {
      showError(
        error.response?.data?.error || "غیر فعال‌ سازی با خطا مواجه شد",
      );
    } finally {
      setDeactivating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingDiscount) return;

    setDeleting(true);

    try {
      await showPromise(discountApi.deleteDiscount(deletingDiscount.id), {
        loading: "در حال حذف...",
        success: "کد تخفیف حذف شد",
      });

      setDeletingDiscount(null);
      fetchDiscounts();
    } catch {
      showError(error.response?.data?.error || "حذف کد تخفیف با خطا مواجه شد");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box sx={{ p: 1, mb: 2 }}>
      <PageHeader
        title="مدیریت تخفیف‌ ها"
        subtitle={`مجموع ${filteredDiscounts.length} کد تخفیف`}
        actions={
          <Button startIcon={<AddIcon />} onClick={openCreateModal}>
            افزودن تخفیف
          </Button>
        }
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, mt: 3 }}>
        <Box sx={{ flex: "1 1 260px" }}>
          <SearchBar
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس کد تخفیف..."
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

      {loading && <Loading message="در حال بارگذاری تخفیف‌ ها..." />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && filteredDiscounts.length === 0 && (
        <EmptyState
          title="تخفیفی یافت نشد"
          description="با معیارهای جستجوی فعلی هیچ کد تخفیفی پیدا نشد."
        />
      )}

      {!loading && !error && filteredDiscounts.length > 0 && (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>کد تخفیف</TableCell>
                  <TableCell>درصد</TableCell>
                  <TableCell>حداقل مبلغ سفارش</TableCell>
                  <TableCell>حداکثر مبلغ تخفیف</TableCell>
                  <TableCell>میزان استفاده</TableCell>
                  <TableCell>تاریخ شروع</TableCell>
                  <TableCell>تاریخ پایان</TableCell>
                  <TableCell>وضعیت</TableCell>
                  <TableCell align="center">عملیات</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {currentData.map((d) => {
                  const status = getStatusInfo(d);

                  return (
                    <TableRow key={d.id} hover>
                      <TableCell sx={{ direction: "ltr", textAlign: "left" }}>
                        {d.code}
                      </TableCell>
                      <TableCell>{d.percentage}%</TableCell>
                      <TableCell>
                        {d.minimum_order_amount
                          ? `${Number(d.minimum_order_amount).toLocaleString("fa-IR")} تومان`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {d.max_discount_amount
                          ? `${Number(d.max_discount_amount).toLocaleString("fa-IR")} تومان`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {d.usage_limit ?? "∞"} / {d.used_count}
                      </TableCell>
                      <TableCell>{formatDate(d.starts_at)}</TableCell>
                      <TableCell>{formatDate(d.expires_at)}</TableCell>
                      <TableCell>
                        <Chip
                          size="medium"
                          label={status.label}
                          color={status.color}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {d.is_active ? (
                          <Tooltip title="غیرفعال‌ سازی">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => setDeactivatingDiscount(d)}
                            >
                              <ToggleOnIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="فعال ‌سازی">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleActivate(d)}
                            >
                              <ToggleOffIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="حذف">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeletingDiscount(d)}
                          >
                            <DeleteIcon fontSize="medium" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
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
        open={modalOpen}
        title="افزودن تخفیف"
        onClose={closeModal}
        actions={
          <>
            <Button variant="outlined" onClick={closeModal} disabled={saving}>
              انصراف
            </Button>

            <Button onClick={handleSaveDiscount} disabled={saving}>
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Input
            label="کد تخفیف"
            name="code"
            value={formData.code}
            onChange={handleFormChange}
            required
          />

          <Input
            label="درصد تخفیف"
            name="percentage"
            type="number"
            value={formData.percentage}
            onChange={handleFormChange}
            required
          />

          <Input
            label="حداقل مبلغ سفارش (تومان) (اختیاری)"
            name="minimumOrderAmount"
            type="number"
            value={formData.minimumOrderAmount}
            onChange={handleFormChange}
          />

          <Input
            label="حداکثر مبلغ تخفیف (تومان) (اختیاری)"
            name="maxDiscountAmount"
            type="number"
            value={formData.maxDiscountAmount}
            onChange={handleFormChange}
          />

          <Input
            label="سقف تعداد استفاده (اختیاری)"
            name="usageLimit"
            type="number"
            value={formData.usageLimit}
            onChange={handleFormChange}
          />

          <Input
            label="تاریخ شروع"
            name="startsAt"
            type="date"
            value={formData.startsAt}
            onChange={handleFormChange}
            required
          />

          <Input
            label="تاریخ پایان"
            name="expiresAt"
            type="date"
            value={formData.expiresAt}
            onChange={handleFormChange}
            required
          />
        </Box>
      </Modal>

      <ConfirmDialog
        open={!!deactivatingDiscount}
        title="غیرفعال‌ سازی تخفیف"
        message={
          deactivatingDiscount
            ? `آیا از غیرفعال‌سازی کد «${deactivatingDiscount.code}» مطمئن هستید؟ این کد دیگر در رزروها قابل استفاده نخواهد بود.`
            : ""
        }
        confirmText={deactivating ? "در حال غیرفعال‌ سازی..." : "غیرفعال کن"}
        cancelText="انصراف"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => !deactivating && setDeactivatingDiscount(null)}
      />

      <ConfirmDialog
        open={!!deletingDiscount}
        title="حذف تخفیف"
        message={
          deletingDiscount
            ? `آیا از حذف کامل کد «${deletingDiscount.code}» مطمئن هستید؟ برخلاف غیرفعال‌سازی، این عملیات قابل بازگشت نیست.`
            : ""
        }
        confirmText={deleting ? "در حال حذف..." : "حذف کن"}
        cancelText="انصراف"
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setDeletingDiscount(null)}
      />
    </Box>
  );
}
