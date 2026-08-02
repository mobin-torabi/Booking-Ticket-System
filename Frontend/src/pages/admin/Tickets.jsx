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
  Divider,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import SyncAltIcon from "@mui/icons-material/SyncAlt";

import { ticketApi, providerApi } from "../../api";

import usePagination from "../../hooks/usePagination";
import useDocumentTitle from "../../hooks/useDocumentTitle";

import { showError, showPromise } from "../../utils/toast";
import { formatPrice } from "../../utils/formatPrice";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { TICKET_TYPE_LABELS } from "../../utils/constants";

import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";
import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Pagination from "../../components/common/Pagination";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import JalaliDatePicker from "../../components/common/Jalalidatepicker";

const TYPE_FILTER_OPTIONS = [
  { value: "", label: "همه انواع" },
  ...Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const TYPE_FORM_OPTIONS = Object.entries(TICKET_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

// Ticket type -> the provider route used by providerApi (matches the same
// mapping TicketDetails.jsx uses to resolve a ticket's provider).
const PROVIDER_ROUTES = {
  flight: "airlines",
  train: "train-companies",
  bus: "bus-companies",
  tour: "tour-agencies",
};

const STATUS_META = {
  purchased: { label: "فعال", color: "success" },
  cancelled: { label: "لغو شده", color: "error" },
};

const EMPTY_FORM = {
  type: "flight",
  providerId: "",
  origin: "",
  destination: "",
  departureAt: "",
  arrivalAt: "",
  departureDate: "",
  // A ticket is a round trip exactly when it carries a return date — that is
  // what GET /tickets reads as trip_type. Tours are always round trips, so
  // this is forced on for them (see isRoundTrip below).
  roundTrip: false,
  returnDate: "",
  basePrice: "",
  seatsPerRow: 6,
  rowsFirst: 0,
  rowsBusiness: 2,
  rowsEconomy: 20,
  rowsSingle: 10,
};

// Builds the same `seat_layout` shape Backend/index.js's POST /tickets
// expects: a shared column layout (seats per row) across the whole vehicle,
// with one row-count per class. total_seats is always derived from this
// layout rather than typed in separately, so the two can never disagree.
function buildSeatLayout(form) {
  const seatsPerRow = Number(form.seatsPerRow) || 0;
  const columns = Array.from({ length: seatsPerRow }, (_, i) =>
    String.fromCharCode(65 + i),
  );

  const classes =
    form.type === "flight"
      ? [
          { class: "first", rows: Number(form.rowsFirst) || 0 },
          { class: "business", rows: Number(form.rowsBusiness) || 0 },
          { class: "economy", rows: Number(form.rowsEconomy) || 0 },
        ].filter((c) => c.rows > 0)
      : [{ class: "economy", rows: Number(form.rowsSingle) || 0 }].filter(
          (c) => c.rows > 0,
        );

  const totalRows = classes.reduce((sum, c) => sum + c.rows, 0);

  return {
    columns,
    classes,
    rows: totalRows,
    totalSeats: totalRows * columns.length,
  };
}

export default function Tickets() {
  useDocumentTitle("مدیریت تیکت‌ها | پنل مدیریت");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState("");

  const { page, setPage, totalPages, currentData } = usePagination(tickets, 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null); // null => create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [cancellingTicket, setCancellingTicket] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;

      const { data } = await ticketApi.getTickets(params);
      setTickets(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setTickets([]);
      } else {
        setError(err.response?.data?.error || "خطا در دریافت تیکت‌ها");
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchTickets();
    setPage(1);
  }, [fetchTickets, setPage]);

  // Provider dropdown follows whichever ticket type is selected in the
  // create/edit form (only relevant while creating — editing only touches
  // price, so this only actually runs while `editingTicket` is null).
  useEffect(() => {
    if (!modalOpen || editingTicket) return;

    let ignore = false;

    async function loadProviders() {
      setLoadingProviders(true);
      try {
        const { data } = await providerApi.getProviders(
          PROVIDER_ROUTES[form.type],
          { is_active: true },
        );
        if (!ignore) setProviders(data);
      } catch {
        if (!ignore) setProviders([]);
      } finally {
        if (!ignore) setLoadingProviders(false);
      }
    }

    loadProviders();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, editingTicket, form.type]);

  const seatLayout = useMemo(() => buildSeatLayout(form), [form]);

  // Tours are always sold as a round trip, so the checkbox is forced on (and
  // locked) for them; every other type opts in.
  const isRoundTrip = form.type === "tour" || form.roundTrip;

  function openCreateModal() {
    setEditingTicket(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(ticket) {
    setEditingTicket(ticket);
    setForm({ ...EMPTY_FORM, basePrice: String(ticket.base_price) });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingTicket(null);
    setForm(EMPTY_FORM);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name !== "type") return { ...prev, [name]: value };

      // Changing the ticket type invalidates whichever provider was picked
      // for the previous type's provider list. It can also hide the return
      // date field (tour -> flight with the box unticked), so drop a date
      // that is no longer reachable rather than submitting it unseen.
      const stillRoundTrip = value === "tour" || prev.roundTrip;

      return {
        ...prev,
        type: value,
        providerId: "",
        returnDate: stillRoundTrip ? prev.returnDate : "",
      };
    });
  }

  function handleRoundTripChange(e) {
    const roundTrip = e.target.checked;
    // Unticking clears the date so a hidden field can't smuggle a return date
    // onto a one-way ticket.
    setForm((prev) => ({
      ...prev,
      roundTrip,
      returnDate: roundTrip ? prev.returnDate : "",
    }));
  }

  async function handleSaveTicket() {
    if (editingTicket) {
      const basePrice = Number(form.basePrice);
      if (!basePrice || basePrice <= 0) {
        showError("قیمت باید عددی بزرگ‌تر از صفر باشد");
        return;
      }

      setSaving(true);
      try {
        await showPromise(
          ticketApi.updateTicket(editingTicket.id, { base_price: basePrice }),
          {
            loading: "در حال ذخیره تغییرات...",
            success: "قیمت تیکت بروزرسانی شد",
          },
        );
        closeModal();
        fetchTickets();
      } catch (err) {
        showError(
          err.response?.data?.error ?? "بروزرسانی تیکت با خطا مواجه شد",
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    const origin = form.origin.trim();
    const destination = form.destination.trim();
    const basePrice = Number(form.basePrice);

    if (
      !origin ||
      !destination ||
      !form.departureAt ||
      !form.arrivalAt ||
      !form.departureDate ||
      !form.providerId ||
      !basePrice
    ) {
      showError("همه فیلد های الزامی را پر کنید");
      return;
    }

    if (isRoundTrip && !form.returnDate) {
      showError(
        form.type === "tour"
          ? "تور ها باید تاریخ برگشت داشته باشند"
          : "برای بلیط رفت و برگشت، تاریخ برگشت را وارد کنید",
      );
      return;
    }

    if (
      isRoundTrip &&
      new Date(form.returnDate) < new Date(form.departureDate)
    ) {
      showError("تاریخ برگشت نمی‌تواند قبل از تاریخ رفت باشد");
      return;
    }

    if (seatLayout.totalSeats <= 0) {
      showError("ظرفیت صندلی باید بیشتر از صفر باشد");
      return;
    }

    setSaving(true);
    try {
      await showPromise(
        ticketApi.createTicket({
          type: form.type,
          origin,
          destination,
          departure_at: form.departureAt,
          arrival_at: form.arrivalAt,
          base_price: basePrice,
          total_seats: seatLayout.totalSeats,
          departure_date: form.departureDate,
          return_date: isRoundTrip ? form.returnDate : undefined,
          provider_id: form.providerId,
          seat_layout: {
            rows: seatLayout.rows,
            columns: seatLayout.columns,
            classes: seatLayout.classes,
          },
        }),
        {
          loading: "در حال ساخت تیکت...",
          success: "تیکت با موفقیت ساخته شد",
        },
      );
      closeModal();
      fetchTickets();
    } catch (err) {
      showError(err.response?.data?.error ?? "ساخت تیکت با خطا مواجه شد");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmCancel() {
    if (!cancellingTicket) return;

    setCancelling(true);
    try {
      await showPromise(ticketApi.cancelTicket(cancellingTicket.id), {
        loading: "در حال لغو تیکت...",
        success: "تیکت لغو شد",
      });
      setCancellingTicket(null);
      fetchTickets();
    } catch (err) {
      showError(err.response?.data?.error ?? "لغو تیکت با خطا مواجه شد");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="مدیریت تیکت‌ها"
        subtitle={`مجموع ${tickets.length} تیکت`}
        actions={
          <Button startIcon={<AddIcon />} onClick={openCreateModal}>
            افزودن تیکت
          </Button>
        }
      />

      <Box sx={{ maxWidth: 260, mb: 3 }}>
        <Select
          label="نوع تیکت"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={TYPE_FILTER_OPTIONS}
        />
      </Box>

      {loading && <Loading message="در حال بارگذاری تیکت‌ها..." />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && tickets.length === 0 && (
        <EmptyState
          title="تیکتی یافت نشد"
          description="با معیارهای جستجوی فعلی هیچ تیکتی پیدا نشد."
        />
      )}

      {!loading && !error && tickets.length > 0 && (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>نوع</TableCell>
                  <TableCell>مسیر</TableCell>
                  <TableCell>نوع سفر</TableCell>
                  <TableCell>حرکت</TableCell>
                  <TableCell>قیمت</TableCell>
                  <TableCell>ظرفیت</TableCell>
                  <TableCell>وضعیت</TableCell>
                  <TableCell align="center">عملیات</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {currentData.map((t) => {
                  const statusMeta = STATUS_META[t.status] || {
                    label: t.status,
                    color: "default",
                  };

                  return (
                    <TableRow key={t.id} hover>
                      <TableCell>
                        {TICKET_TYPE_LABELS[t.ticket_type] || t.ticket_type}
                      </TableCell>
                      <TableCell sx={{ wordBreak: "break-word" }}>
                        {t.origin} ← {t.destination}
                      </TableCell>
                      <TableCell>
                        {t.return_date ? (
                          <Tooltip
                            title={`تاریخ برگشت: ${formatDate(t.return_date)}`}
                          >
                            <Chip
                              size="small"
                              icon={<SyncAltIcon />}
                              label="رفت و برگشت"
                              color="primary"
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            size="small"
                            label="یک طرفه"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(t.departure_at)}</TableCell>
                      <TableCell>{formatPrice(t.base_price)}</TableCell>
                      <TableCell>{t.total_seats}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusMeta.label}
                          color={statusMeta.color}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="ویرایش قیمت">
                          <IconButton
                            size="small"
                            onClick={() => openEditModal(t)}
                          >
                            <EditIcon fontSize="medium" />
                          </IconButton>
                        </Tooltip>

                        {t.status !== "cancelled" && (
                          <Tooltip title="لغو تیکت">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setCancellingTicket(t)}
                            >
                              <BlockIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
        title={editingTicket ? "ویرایش قیمت تیکت" : "افزودن تیکت جدید"}
        onClose={closeModal}
        actions={
          <>
            <Button variant="outlined" onClick={closeModal} disabled={saving}>
              انصراف
            </Button>
            <Button onClick={handleSaveTicket} disabled={saving}>
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </>
        }
      >
        {editingTicket ? (
          <Box sx={{ mt: 1 }}>
            <Input
              label="قیمت پایه (تومان)"
              name="basePrice"
              type="number"
              value={form.basePrice}
              onChange={handleFormChange}
              required
            />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Select
              label="نوع تیکت"
              name="type"
              value={form.type}
              onChange={handleFormChange}
              options={TYPE_FORM_OPTIONS}
            />

            <Select
              label="ارائه‌دهنده"
              name="providerId"
              value={form.providerId}
              onChange={handleFormChange}
              options={[
                { label: "انتخاب کنید...", value: "" },
                ...providers.map((p) => ({
                  label: p.name,
                  value: String(p.id),
                })),
              ]}
            />
            {loadingProviders && (
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                در حال بارگذاری ارائه‌دهندگان...
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2 }}>
              <Input
                label="مبدا"
                name="origin"
                value={form.origin}
                onChange={handleFormChange}
                required
              />
              <Input
                label="مقصد"
                name="destination"
                value={form.destination}
                onChange={handleFormChange}
                required
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Input
                label="زمان حرکت"
                name="departureAt"
                type="datetime-local"
                value={form.departureAt}
                onChange={handleFormChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Input
                label="زمان رسیدن"
                name="arrivalAt"
                type="datetime-local"
                value={form.arrivalAt}
                onChange={handleFormChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            {/* A ticket becomes a round trip by having a return date. Tours
                always do, so their checkbox is ticked and locked. */}
            <FormControlLabel
              control={
                <Checkbox
                  name="roundTrip"
                  checked={isRoundTrip}
                  disabled={form.type === "tour"}
                  onChange={handleRoundTripChange}
                />
              }
              label={
                form.type === "tour"
                  ? "رفت و برگشت (تورها همیشه رفت و برگشت هستند)"
                  : "بلیط رفت و برگشت"
              }
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <JalaliDatePicker
                label="تاریخ رفت"
                value={form.departureDate}
                onChange={(isoDate) =>
                  setForm((prev) => ({ ...prev, departureDate: isoDate }))
                }
                required
              />
              {isRoundTrip && (
                <JalaliDatePicker
                  label="تاریخ برگشت"
                  value={form.returnDate}
                  onChange={(isoDate) =>
                    setForm((prev) => ({ ...prev, returnDate: isoDate }))
                  }
                  required
                />
              )}
            </Box>

            <Input
              label="قیمت پایه (تومان)"
              name="basePrice"
              type="number"
              value={form.basePrice}
              onChange={handleFormChange}
              required
            />

            <Divider />

            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
              }}
            >
              نقشه صندلی
            </Typography>

            <Input
              label="تعداد صندلی در هر ردیف"
              name="seatsPerRow"
              type="number"
              value={form.seatsPerRow}
              onChange={handleFormChange}
              required
            />

            {form.type === "flight" ? (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Input
                  label="ردیف‌های فرست کلاس"
                  name="rowsFirst"
                  type="number"
                  value={form.rowsFirst}
                  onChange={handleFormChange}
                />
                <Input
                  label="ردیف‌های بیزینس"
                  name="rowsBusiness"
                  type="number"
                  value={form.rowsBusiness}
                  onChange={handleFormChange}
                />
                <Input
                  label="ردیف‌های اکونومی"
                  name="rowsEconomy"
                  type="number"
                  value={form.rowsEconomy}
                  onChange={handleFormChange}
                />
              </Box>
            ) : (
              <Input
                label="تعداد ردیف صندلی"
                name="rowsSingle"
                type="number"
                value={form.rowsSingle}
                onChange={handleFormChange}
              />
            )}

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              مجموع ظرفیت: {seatLayout.totalSeats} صندلی
            </Typography>
          </Box>
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancellingTicket}
        title="لغو تیکت"
        message={
          cancellingTicket
            ? `آیا از لغو تیکت «${cancellingTicket.origin} ← ${cancellingTicket.destination}» مطمئن هستید؟ این تیکت دیگر برای رزرو در دسترس نخواهد بود.`
            : ""
        }
        confirmText={cancelling ? "در حال لغو..." : "لغو تیکت"}
        cancelText="انصراف"
        onConfirm={handleConfirmCancel}
        onCancel={() => !cancelling && setCancellingTicket(null)}
      />
    </PageContainer>
  );
}
