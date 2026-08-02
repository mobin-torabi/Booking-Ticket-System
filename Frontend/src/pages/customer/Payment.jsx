import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Box, Stack, Chip, Typography, Divider, IconButton } from "@mui/material";

import EventSeatIcon from "@mui/icons-material/EventSeat";
import PaymentsIcon from "@mui/icons-material/Payments";
import CancelIcon from "@mui/icons-material/CancelOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import { bookingApi, discountApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../utils/routes";
import { formatPrice } from "../../utils/formatPrice";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { showError, showSuccess } from "../../utils/toast";

import PageHeader from "../../components/common/PageHeader";
import CardBox from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function Payment() {
  useDocumentTitle("پرداخت | سیستم رزرو بلیط");

  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [discountCode, setDiscountCode] = useState(
    location.state?.discountCode || "",
  );
  const [discountApplied, setDiscountApplied] = useState(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);

  const [paying, setPaying] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (bookingId && user?.id) fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, user?.id]);

  async function fetchBooking() {
    try {
      setLoading(true);
      setError(null);

      const { data } = await bookingApi.getBookingById(bookingId);

      // A booking belongs to a specific user — guard against viewing/paying
      // someone else's booking, same pattern as BookingDetails.jsx.
      if (!isAdmin && String(data.user_id) !== String(user.id)) {
        setError("شما اجازه مشاهده این رزرو را ندارید.");
        return;
      }

      // Already paid — nothing left to do here, go straight to the receipt.
      if (data.status === "booked") {
        navigate(`/bookings/${bookingId}`, { replace: true });
        return;
      }

      if (data.status === "cancelled") {
        setError("این رزرو لغو شده و قابل پرداخت نیست.");
        return;
      }

      setBooking(data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "رزرو پیدا نشد"
          : (err.response?.data?.error ?? "خطا در دریافت اطلاعات رزرو"),
      );
    } finally {
      setLoading(false);
    }
  }

  // A discount code picked on the booking page is carried over via router
  // state — re-validate it here against this booking's actual total once it
  // loads, instead of just prefilling the field and making the user re-click.
  useEffect(() => {
    if (booking && location.state?.discountCode) {
      handleCheckDiscount(location.state.discountCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  async function handleCheckDiscount(codeOverride) {
    const code = (codeOverride ?? discountCode).trim();
    if (!code || !booking) return;

    try {
      setCheckingDiscount(true);
      const { data } = await discountApi.validateDiscount(
        code,
        Number(booking.total_amount),
      );
      setDiscountApplied(data.discount);
      showSuccess(`کد تخفیف اعمال شد (٪${data.discount.percentage} تخفیف)`);
    } catch (err) {
      setDiscountApplied(null);
      showError(err.response?.data?.error ?? "کد تخفیف نامعتبر است");
    } finally {
      setCheckingDiscount(false);
    }
  }

  function handleRemoveDiscount() {
    setDiscountApplied(null);
    setDiscountCode("");
  }

  async function handlePay() {
    try {
      setPaying(true);

      await bookingApi.payBooking(
        bookingId,
        discountApplied ? discountCode.trim() : undefined,
      );

      showSuccess("پرداخت با موفقیت انجام شد");
      navigate(`/bookings/${bookingId}`);
    } catch (err) {
      showError(err.response?.data?.error ?? "پرداخت با خطا مواجه شد");
    } finally {
      setPaying(false);
    }
  }

  async function confirmCancel() {
    try {
      setCancelling(true);

      await bookingApi.cancelBooking(bookingId, "انصراف کاربر پیش از پرداخت");

      showSuccess("رزرو لغو شد");
      navigate(isAdmin ? ROUTES.ADMIN_BOOKINGS : ROUTES.BOOKINGS);
    } catch (err) {
      showError(err.response?.data?.error ?? "لغو رزرو با خطا مواجه شد");
    } finally {
      setCancelling(false);
      setCancelOpen(false);
    }
  }

  if (loading) return <Loading message="در حال دریافت اطلاعات رزرو..." />;
  if (error) return <ErrorState message={error} />;
  if (!booking) return null;

  const totalAmount = Number(booking.total_amount);
  let discountAmount = 0;

  if (discountApplied) {
    discountAmount = totalAmount * (discountApplied.percentage / 100);
    if (discountApplied.max_discount_amount) {
      discountAmount = Math.min(
        discountAmount,
        Number(discountApplied.max_discount_amount),
      );
    }
    discountAmount = Math.round(discountAmount);
  }

  const finalAmount = totalAmount - discountAmount;

  return (
    <Box
      dir="rtl"
      sx={{
        maxWidth: 640,
        mx: "auto",
        px: { xs: 2, md: 3 },
        pt: { xs: "88px", md: "104px" },
        pb: 6,
      }}
    >
      <PageHeader
        title="تکمیل پرداخت"
        subtitle="برای نهایی شدن رزرو، پرداخت را انجام دهید"
      />

      <Stack spacing={2.5}>
        <CardBox>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" fontWeight={700}>
              {booking.origin} ← {booking.destination}
            </Typography>
            <Chip size="small" label="در انتظار پرداخت" color="warning" />
          </Stack>

          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ReceiptLongIcon
                fontSize="small"
                sx={{ color: "text.disabled" }}
              />
              <Typography variant="body2" color="text.secondary">
                کد رزرو: {booking.id}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <EventSeatIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {booking.number_of_seats} صندلی
              </Typography>
            </Stack>
          </Stack>

          {(booking.seats || []).length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                {booking.seats.map((seat) => (
                  <Stack
                    key={seat.id}
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2">
                      صندلی {seat.seat_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {seat.passenger_first_name} {seat.passenger_last_name}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </CardBox>

        <CardBox>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            کد تخفیف
          </Typography>

          {discountApplied ? (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                bgcolor: "#F0FDF4",
                border: "1px solid #86EFAC",
                borderRadius: 2,
                px: 1.5,
                py: 1,
              }}
            >
              <Typography variant="body2" color="success.dark" fontWeight={700}>
                {discountApplied.code} (٪{discountApplied.percentage})
              </Typography>
              <IconButton size="small" onClick={handleRemoveDiscount}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1}>
              <Input
                placeholder="کد تخفیف را وارد کنید"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
              />
              <Button
                variant="outlined"
                disabled={checkingDiscount || !discountCode.trim()}
                onClick={() => handleCheckDiscount()}
              >
                {checkingDiscount ? "..." : "بررسی"}
              </Button>
            </Stack>
          )}
        </CardBox>

        <CardBox>
          <Stack spacing={1} mb={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">مبلغ رزرو</Typography>
              <Typography fontWeight={600}>
                {formatPrice(totalAmount)}
              </Typography>
            </Stack>

            {discountAmount > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography color="success.main">تخفیف</Typography>
                <Typography color="success.main" fontWeight={600}>
                  ‎-{formatPrice(discountAmount)}
                </Typography>
              </Stack>
            )}
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack direction="row" justifyContent="space-between" mb={2.5}>
            <Typography fontWeight={700}>مبلغ قابل پرداخت</Typography>
            <Typography fontWeight={700} color="primary.main">
              {formatPrice(finalAmount)}
            </Typography>
          </Stack>

          <Button
            fullWidth
            startIcon={<PaymentsIcon />}
            disabled={paying}
            onClick={handlePay}
          >
            {paying ? "در حال پرداخت..." : "پرداخت و تایید رزرو"}
          </Button>

          <Button
            fullWidth
            variant="text"
            color="error"
            startIcon={<CancelIcon />}
            sx={{ mt: 1 }}
            disabled={paying}
            onClick={() => setCancelOpen(true)}
          >
            انصراف از رزرو
          </Button>
        </CardBox>
      </Stack>

      <ConfirmDialog
        open={cancelOpen}
        title="انصراف از رزرو"
        message="آیا از انصراف این رزرو مطمئن هستید؟ صندلی‌های انتخابی آزاد خواهند شد."
        confirmText={cancelling ? "در حال لغو..." : "انصراف از رزرو"}
        cancelText="بازگشت"
        onConfirm={confirmCancel}
        onCancel={() => !cancelling && setCancelOpen(false)}
      />
    </Box>
  );
}
