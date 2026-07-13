import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Stack,
  Chip,
  Tabs,
  Tab,
  Typography,
  Autocomplete,
  TextField,
} from "@mui/material";

import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import FlightIcon from "@mui/icons-material/Flight";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import TrainIcon from "@mui/icons-material/Train";
import TourIcon from "@mui/icons-material/Tour";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import PaymentsIcon from "@mui/icons-material/Payments";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CancelIcon from "@mui/icons-material/CancelOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import { bookingApi, ticketApi, userApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../utils/routes";
import { formatPrice } from "../../utils/formatPrice";
import { formatDateTime } from "../../utils/formatDate";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import usePagination from "../../hooks/usePagination";
import { showError, showPromise } from "../../utils/toast";

import PageHeader from "../../components/common/PageHeader";
import CardBox from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SearchBar from "../../components/common/SearchBar";
import Select from "../../components/common/Select";

const STATUS_TABS = [
  { value: "all", label: "همه" },

  { value: "booked", label: "تایید شده" },
  { value: "cancelled", label: "لغو شده" },
];

const STATUS_META = {
  booked: { label: "تایید شده", color: "success" },
  cancelled: { label: "لغو شده", color: "error" },
  available: { label: "در دسترس", color: "default" },
};

const TYPE_ICONS = {
  flight: FlightIcon,
  train: TrainIcon,
  bus: DirectionsBusIcon,
  tour: TourIcon,
};

function getTypeIcon(typeName = "") {
  const Icon = TYPE_ICONS[typeName.toLowerCase()];
  return Icon || ConfirmationNumberIcon;
}

const PAGE_SIZE = 6;

export default function Bookings() {
  const { user, isAdmin } = useAuth();
  useDocumentTitle(
    isAdmin ? "مدیریت رزرو ها | پنل مدیریت" : "رزرو های من | سیستم رزرو بلیط",
  );

  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusTab, setStatusTab] = useState("all");
  const [cancelTarget, setCancelTarget] = useState(null);

  const [bookingId, setBookingId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [userFilter, setUserFilter] = useState(null);
  const [userOptions, setUserOptions] = useState([]);

  useEffect(() => {
    if (!isAdmin && user?.id) {
      fetchBookings();
    }

    if (isAdmin) fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function fetchBookings() {
    try {
      setLoading(true);
      setError(null);

      const { data } = await bookingApi.getBookings(
        isAdmin
          ? {}
          : {
              userId: user.id,
            },
      );

      const enriched = await Promise.all(
        data.map(async (booking) => {
          try {
            const { data: ticket } = await ticketApi.getTicketById(
              booking.ticket_id, false
            );

            return { ...booking, ticket };
          } catch {
            return { ...booking, ticket: null };
          }
        }),
      );

      enriched.sort((a, b) => new Date(b.booked_at) - new Date(a.booked_at));

      setBookings(enriched);
    } catch (err) {
      if (err.response?.status === 404) {
        setBookings([]);
      } else {
        setError(err.response?.data?.error ?? "خطا در دریافت رزرو های شما");
      }
    } finally {
      setLoading(false);
    }
  }

  const fetchUsers = useCallback(async () => {
    setError("");
    try {
      const { data } = await userApi.getUsers();
      setUserOptions(data);
    } catch (error) {
      if (err.response?.status === 404) {
        setUserOptions([]);
      } else {
        setError(err.response?.data?.error || "خطا در دریافت لیست کاربران");
      }
    } 
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredBookings = useMemo(() => {
    let filtered;
    if (statusTab === "all") {
      filtered = bookings;
    } else {
      filtered = bookings.filter((b) => b.status === statusTab);
    }

    if (ticketId !== "") {
      filtered = filtered.filter((b) => b.ticket_id === ticketId);
    }

    if (bookingId !== "") {
      filtered = filtered.filter((b) => b.id === bookingId);
    }

    if (userFilter) {
      filtered = filtered.filter((b) => b.user_id === userFilter.id);
    }

    return filtered;
  }, [bookings, statusTab, ticketId, bookingId, userFilter]);

  const { page, setPage, totalPages, currentData } = usePagination(
    filteredBookings,
    PAGE_SIZE,
  );

  function handleTabChange(_, value) {
    setStatusTab(value);
    setPage(1);
  }

  function handleViewDetails(id) {
    navigate(
      isAdmin ? `${ROUTES.ADMIN_BOOKINGS}/${id}` : `${ROUTES.BOOKINGS}/${id}`,
    );
  }

  function handlePay(id) {
    navigate(`/payment/${id}`);
  }

  async function confirmCancel() {
    if (!cancelTarget) return;

    try {
      await showPromise(
        bookingApi.cancelBooking(cancelTarget.id, "انصراف کاربر"),
        {
          loading: "در حال لغو رزرو...",
          success: "رزرو با موفقیت لغو شد.",
          error: "لغو رزرو با خطا مواجه شد.",
        },
      );

      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancelTarget.id
            ? {
                ...b,
                status: "cancelled",
                cancellation_reason: "انصراف کاربر",
              }
            : b,
        ),
      );
    } catch (err) {
      showError(err.response?.data?.error ?? "لغو رزرو با خطا مواجه شد.");
    } finally {
      setCancelTarget(null);
    }
  }

  if (loading) {
    return <Loading message="در حال دریافت رزرو های شما..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div style={{ padding: "10px" }}>
      <Box>
        <PageHeader
          title={isAdmin ? "مدیریت رزرو ها" : "رزرو های من"}
          subtitle={
            isAdmin
              ? "مشاهده و پیگیری همه رزرو های سیستم"
              : "مشاهده، پیگیری و مدیریت رزروهای بلیط شما"
          }
        />

        <Box
          dir="rtl"
          sx={{
            maxWidth: 1100,
            mx: "auto",
            px: { xs: 2, md: 3 },
            pt: { xs: "88px", md: "40px" },
            pb: 4,
          }}
        >
          {isAdmin ? (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                mt: 2,
                mb: 3,
                flexDirection: "column",
              }}
            >
              <Box sx={{ width: "100%" }}>
                <SearchBar
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder="جستجو بر اساس کد رزرو..."
                />
              </Box>

              <Box sx={{ width: "100%" }}>
                <SearchBar
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="جستجو بر اساس شناسه تیکت..."
                />
              </Box>

              <Box sx={{ width: "100%" }}>
                {/* <Select
                  label="کاربر"
                  value={userFilter.username}
                  onChange={(e) => setUserFilter(e.target.value)}
                  options={userOptions}
                /> */}
                <Autocomplete
                  options={userOptions}
                  value={userFilter}
                  onChange={(_, value) => setUserFilter(value)}
                  getOptionLabel={(option) =>
                    `${option["first-name"]} ${option["last-name"]} - (${option.username})`
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="انتخاب کاربر" />
                  )}
                />
              </Box>
            </Box>
          ) : null}

          <Tabs
            value={statusTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3, borderBottom: "1px solid #E2E8F0" }}
          >
            {STATUS_TABS.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.label} />
            ))}
          </Tabs>

          {filteredBookings.length === 0 ? (
            <EmptyState
              title="رزروی یافت نشد"
              description="در این دسته هیچ رزروی برای شما ثبت نشده است."
            />
          ) : (
            <>
              <Stack spacing={2.5} sx={{mb: 3}}>
                {currentData.map((booking) => {
                  const TypeIcon = getTypeIcon(booking.ticket_type);

                  const meta = STATUS_META[booking.status] || {
                    label: booking.status,
                    color: "default",
                  };

                  return (
                    <CardBox key={booking.id}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: {
                            xs: "column",
                            sm: "row",
                          },
                          alignItems: {
                            xs: "stretch",
                            sm: "center",
                          },
                          gap: 2.5,
                        }}
                      >
                        {/* Icon */}
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            minWidth: 52,
                            borderRadius: "50%",
                            bgcolor: "#E8F1FF",
                            color: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <TypeIcon />
                        </Box>

                        {/* Main info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignitems="center"
                            flexwrap="wrap"
                            useFlexGap
                          >
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              sx={{ wordBreak: "break-word" }}
                            >
                              {booking.ticket
                                ? `${booking.ticket.origin} ← ${booking.ticket.destination}`
                                : "جزئیات بلیط در دسترس نیست"}
                            </Typography>

                            <Chip
                              size="small"
                              label={meta.label}
                              color={meta.color}
                            />

                            {booking.ticket_type && (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={booking.ticket_type}
                              />
                            )}
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={2.5}
                            flexwrap="wrap"
                            useFlexGap
                            mt={1}
                          >
                            {booking.ticket?.departure_at && (
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignitems="center"
                              >
                                <CalendarMonthIcon
                                  fontSize="small"
                                  color="action"
                                />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {formatDateTime(booking.ticket.departure_at)}
                                </Typography>
                              </Stack>
                            )}

                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignitems="center"
                            >
                              <EventSeatIcon fontSize="small" color="action" />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {booking.number_of_seats} صندلی
                              </Typography>
                            </Stack>

                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignitems="center"
                            >
                              <PaymentsIcon fontSize="small" color="action" />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatPrice(booking.total_amount)}
                              </Typography>
                            </Stack>
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignitems="center"
                            mt={1}
                          >
                            <ReceiptLongIcon
                              fontSize="small"
                              sx={{ color: "text.disabled" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              کد رزرو: {booking.id}
                            </Typography>
                          </Stack>

                          {booking.status === "cancelled" &&
                            booking.cancellation_reason && (
                              <Typography
                                variant="caption"
                                color="error"
                                display="block"
                                mt={0.5}
                              >
                                دلیل لغو: {booking.cancellation_reason}
                              </Typography>
                            )}
                        </Box>

                        {/* Actions */}
                        <Stack
                          spacing={1}
                          sx={{
                            minWidth: { xs: "100%", sm: 180 },
                          }}
                        >
                          <Button
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewDetails(booking.id)}
                          >
                            مشاهده جزئیات
                          </Button>
                          {/* 
                                            {booking.status === "pending" && (
                                                <Button
                                                    startIcon={<CreditScoreIcon />}
                                                    onClick={() =>
                                                        handlePay(booking.id)
                                                    }
                                                >
                                                    پرداخت
                                                </Button>
                                            // )} */}

                          {!isAdmin && booking.status === "booked" && (
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<CancelIcon />}
                              onClick={() => setCancelTarget(booking)}
                            >
                              لغو رزرو
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </CardBox>
                  );
                })}
              </Stack>

              {totalPages > 1 && (
                <Pagination
                  page={page}
                  count={totalPages}
                  onChange={(_, value) => setPage(value)}
                />
              )}
            </>
          )}
        </Box>

        <ConfirmDialog
          open={!!cancelTarget}
          title="لغو رزرو"
          message={
            cancelTarget
              ? `آیا از لغو رزرو به مقصد «${
                  cancelTarget.ticket?.destination ?? ""
                }» مطمئن هستید؟ این عملیات غیرقابل بازگشت است.`
              : ""
          }
          onCancel={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
        />
      </Box>
    </div>
  );
}
