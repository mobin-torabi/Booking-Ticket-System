import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Box, Stack, Chip, Typography, Divider } from "@mui/material";

import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import FlightIcon from "@mui/icons-material/Flight";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import TrainIcon from "@mui/icons-material/Train";
import TourIcon from "@mui/icons-material/Tour";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import PaymentsIcon from "@mui/icons-material/Payments";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CancelIcon from "@mui/icons-material/CancelOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import ApartmentIcon from "@mui/icons-material/Apartment";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";

import { bookingApi, ticketApi, providerApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../utils/routes";
import { formatPrice } from "../../utils/formatPrice";
import { formatDateTime } from "../../utils/formatDate";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { showError, showPromise } from "../../utils/toast";

import PageHeader from "../../components/common/PageHeader";
import CardBox from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const STATUS_META = {
  booked: { label: "تایید شده", color: "success" },
  cancelled: { label: "لغو شده", color: "error" },
};

const TYPE_ICONS = {
  flight: FlightIcon,
  train: TrainIcon,
  bus: DirectionsBusIcon,
  tour: TourIcon,
};

const PROVIDER_ROUTE_BY_TYPE = {
  airline: "airlines",
  bus_company: "bus-companies",
  train_company: "train-companies",
  tour_agency: "tour-agencies",
};

function getTypeIcon(typeName = "") {
  const Icon = TYPE_ICONS[typeName.toLowerCase()];
  return Icon || ConfirmationNumberIcon;
}

export default function BookingDetails() {
  useDocumentTitle("جزئیات رزرو | سیستم رزرو بلیط");

  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [booking, setBooking] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [provider, setProvider] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id && user?.id) {
      fetchBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  async function fetchBooking() {
    try {
      setLoading(true);
      setError(null);

      const { data } = await bookingApi.getBookingById(id);

      // A booking belongs to a specific user. The API itself doesn't
      // enforce ownership, so we guard against viewing someone else's
      // booking by id here on the client.
      if (!isAdmin && String(data.user_id) !== String(user.id)) {
        setError("شما اجازه مشاهده این رزرو را ندارید.");
        setBooking(null);
        return;
      }

      setBooking(data);

      // Best-effort enrichment: ticket type + provider name are not part of
      // the booking response itself, so fetch them separately. Failure here
      // shouldn't block showing the core booking details.
      try {
        const { data: ticketData } = await ticketApi.getTicketById(
          data.ticket_id
        );
        setTicket(ticketData);

        const providerRoute = PROVIDER_ROUTE_BY_TYPE[ticketData.provider_type];

        if (providerRoute && ticketData.provider_id) {
          try {
            const { data: providerData } = await providerApi.getProviderById(
              providerRoute,
              ticketData.provider_id,
            );
            setProvider(providerData);
          } catch {
            setProvider(null);
          }
        }
      } catch {
        setTicket(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError("رزرو پیدا نشد");
      } else {
        setError(err.response?.data?.error ?? "خطا در دریافت جزئیات رزرو");
      }
    } finally {
      setLoading(false);
    }
  }

  async function confirmCancel() {
    try {
      setCancelling(true);

      await showPromise(bookingApi.cancelBooking(id, "انصراف کاربر"), {
        loading: "در حال لغو رزرو...",
        success: "رزرو با موفقیت لغو شد.",
        error: "لغو رزرو با خطا مواجه شد.",
      });

      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: "cancelled",
              cancellation_reason: "انصراف کاربر",
            }
          : prev,
      );
    } catch (err) {
      showError(err.response?.data?.error ?? "لغو رزرو با خطا مواجه شد.");
    } finally {
      setCancelling(false);
      setCancelOpen(false);
    }
  }

  if (loading) {
    return <Loading message="در حال دریافت جزئیات رزرو..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!booking) {
    return <ErrorState message="رزرو پیدا نشد" />;
  }

  const TypeIcon = getTypeIcon(ticket?.ticket_type);
  const meta = STATUS_META[booking.status] || {
    label: booking.status,
    color: "default",
  };

  return (
    <Box
      dir="rtl"
      sx={{
        maxWidth: 900,
        mx: "auto",
        px: { xs: 2, md: 3 },
        pt: { xs: "88px", md: "104px" },
        pb: 6,
      }}
    >
      <PageHeader
        title="جزئیات رزرو"
        actions={
          <Button
            variant="text"
            // sx={{border:"none"}}
            startIcon={<ArrowBackIcon />}
            onClick={() => isAdmin ? navigate(ROUTES.ADMIN_BOOKINGS) : navigate(ROUTES.BOOKINGS)}
          >
            بازگشت به رزروها
          </Button>
        }
      />

      <Stack spacing={2.5}>
        <CardBox>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignitems={{ xs: "stretch", sm: "center" }}
            spacing={2.5}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                minWidth: 56,
                borderRadius: "50%",
                bgcolor: "#E8F1FF",
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TypeIcon fontSize="medium" />
            </Box>

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
                  {booking.origin} ← {booking.destination}
                </Typography>

                <Chip size="small" label={meta.label} color={meta.color} />

                {ticket?.ticket_type && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={ticket.ticket_type}
                  />
                )}
              </Stack>

              {provider?.name && (
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignitems="center"
                  mt={0.5}
                >
                  <ApartmentIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {provider.name}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>

          {booking.status === "cancelled" && booking.cancellation_reason && (
            <Typography variant="body2" color="error" mt={2}>
              دلیل لغو: {booking.cancellation_reason}
            </Typography>
          )}
        </CardBox>

        <CardBox>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            اطلاعات سفر
          </Typography>

          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignitems="center">
              <FlightTakeoffIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                زمان حرکت:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatDateTime(booking.departure_at)}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignitems="center">
              <FlightLandIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                زمان رسیدن:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatDateTime(booking.arrival_at)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignitems="center">
              {" "}
              <ReceiptLongIcon
                fontSize="small"
                sx={{ color: "text.disabled" }}
              />
              <Typography variant="body2" color="text.secondary">
                کد رزرو: {booking.id}
              </Typography>
            </Stack>
          </Stack>
        </CardBox>

        <CardBox>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            اطلاعات پرداخت
          </Typography>

          <Stack direction="row" spacing={3} flexwrap="wrap" useFlexGap>
            <Stack direction="row" spacing={0.5} alignitems="center">
              <EventSeatIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {booking.number_of_seats} صندلی
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.5} alignitems="center">
              <PaymentsIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={600}>
                {formatPrice(booking.total_amount)} تومان
              </Typography>
            </Stack>

            {booking.created_at && (
              <Stack direction="row" spacing={0.5} alignitems="center">
                <CalendarMonthIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  تاریخ رزرو: {formatDateTime(booking.created_at)}
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardBox>

        <CardBox>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            صندلی ها و مسافران
          </Typography>

          <Stack divider={<Divider />} spacing={1.5}>
            {(booking.seats || []).map((seat) => (
              <Stack
                key={seat.id}
                direction={{ xs: "column", sm: "row" }}
                justifycontent="space-between"
                alignitems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
                py={0.5}
              >
                <Stack direction="row" spacing={1} alignitems="center">
                  <EventSeatIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={600}>
                    صندلی {seat.seat_number}
                  </Typography>
                  {seat.seat_class && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={seat.seat_class}
                    />
                  )}
                </Stack>

                <Stack direction="row" spacing={2} flexwrap="wrap" useFlexGap>
                  {(seat.passenger_first_name || seat.passenger_last_name) && (
                    <Stack direction="row" spacing={0.5} alignitems="center">
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {seat.passenger_first_name} {seat.passenger_last_name}
                      </Typography>
                    </Stack>
                  )}

                  {seat.phone_number && (
                    <Stack direction="row" spacing={0.5} alignitems="center">
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {seat.phone_number}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </CardBox>

        <Stack direction="row" spacing={0.5} alignitems="center"></Stack>

        {!isAdmin && booking.status === "booked" && (
          <Box               sx={{ fontSize: "30px" }}
>
            <Button
              variant="text"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setCancelOpen(true)}
            >
              لغو رزرو
            </Button>
          </Box>
        )}
      </Stack>

      <ConfirmDialog
        open={cancelOpen}
        title="لغو رزرو"
        message={`آیا از لغو رزرو به مقصد «${booking.destination}» مطمئن هستید؟ این عملیات غیرقابل بازگشت است.`}
        onCancel={() => (cancelling ? null : setCancelOpen(false))}
        onConfirm={confirmCancel}
      />
    </Box>
  );
}
