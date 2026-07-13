import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Box,
  Stack,
  Chip,
  Typography,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";

import FlightIcon from "@mui/icons-material/Flight";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import TrainIcon from "@mui/icons-material/Train";
import TourIcon from "@mui/icons-material/Tour";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ApartmentIcon from "@mui/icons-material/Apartment";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import GavelIcon from "@mui/icons-material/Gavel";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";

import { ticketApi, providerApi } from "../../api";
import { formatPrice } from "../../utils/formatPrice";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import calculateDuration from "../../utils/calculateDuration";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { showError } from "../../utils/toast";

import { POLICIES_DATA } from "./policiesData";
import { getTourContent } from "./toursData";

import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

const TYPE_ICONS = {
  flight: FlightIcon,
  train: TrainIcon,
  bus: DirectionsBusIcon,
  tour: TourIcon,
};

const TYPE_LABELS = {
  flight: "پرواز",
  train: "قطار",
  bus: "اتوبوس",
  tour: "تور",
};

const SEAT_CLASS_LABELS = {
  economy: "اکونومی",
  business: "بیزینس",
  first: "فرست کلاس",
};

// Maps a ticket_type -> the provider route used by /api/providerApi so we
// can look up the provider's name (airline / bus company / train company /
// tour agency) for the "ارائه‌دهنده" card.
const PROVIDER_ROUTES = {
  flight: "airlines",
  train: "train-companies",
  bus: "bus-companies",
  tour: "tour-agencies",
};

function nightsBetween(start, end) {
  if (!start || !end) return null;

  const diffMs = new Date(end) - new Date(start);
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return nights > 0 ? nights : null;
}

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useDocumentTitle(
    ticket
      ? `${ticket.origin} به ${ticket.destination} | سیستم رزرو بلیط`
      : "جزئیات بلیط | سیستم رزرو بلیط",
  );

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchTicket() {
    try {
      setLoading(true);
      setError(null);

      const { data } = await ticketApi.getTicketById(id);
      setTicket(data);

      // Provider name is a nice-to-have — don't fail the whole page if this
      // lookup errors out (e.g. provider was removed).
      if (data.provider_id && PROVIDER_ROUTES[data.ticket_type]) {
        try {
          const providerRes = await providerApi.getProviderById(
            PROVIDER_ROUTES[data.ticket_type],
            data.provider_id,
          );
          setProvider(providerRes.data);
        } catch {
          setProvider(null);
        }
      }
    } catch (err) {
      const message =
        err.response?.status === 404
          ? "بلیط مورد نظر یافت نشد"
          : (err.response?.data?.error ?? "خطا در دریافت اطلاعات بلیط");
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading message="در حال دریافت اطلاعات بلیط..." />;
  if (error) return <ErrorState message={error} />;
  if (!ticket) return null;

  const type = ticket.ticket_type;
  const isTour = type === "tour";
  const TypeIcon = TYPE_ICONS[type] || FlightIcon;
  const isCancelled = ticket.status === "cancelled";

  const seats = ticket.seats || [];
  const availableSeats = seats.filter((s) => s.is_available);
  const seatClassCounts = availableSeats.reduce((acc, seat) => {
    acc[seat.seat_class] = (acc[seat.seat_class] || 0) + 1;
    return acc;
  }, {});

  const tourContent = isTour ? getTourContent(ticket) : null;
  const nights =
    isTour &&
    (nightsBetween(ticket.departure_date, ticket.return_date) ??
      tourContent?.nights);

  // Policies shown for this ticket: the type-specific rules plus the
  // relevant clauses from the general policy (booking/payment), so a
  // customer gets everything they need without leaving this page.
  const typePolicy = POLICIES_DATA[type];
  const generalPolicy = POLICIES_DATA.general;

  return (
    <Box dir="rtl">
      {/* ===================== HERO ===================== */}
      {isTour ? (
        <Box
          sx={{
            position: "relative",
            height: { xs: 260, md: 380 },
            bgcolor: "#0A1F66",
            overflow: "hidden",
          }}
        >
          {tourContent.image && (
            <Box
              component="img"
              src={tourContent.image}
              alt={tourContent.destination}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,31,102,.15) 0%, rgba(10,31,102,.85) 100%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              insetInline: 0,
              maxWidth: 1100,
              mx: "auto",
              px: { xs: 2, md: 3 },
              pb: 3,
            }}
          >
            <Chip
              icon={<TourIcon sx={{ color: "#fff !important" }} />}
              label="تور گردشگری"
              sx={{
                bgcolor: "rgba(255,255,255,.15)",
                color: "#fff",
                mb: 1.5,
                fontWeight: 600,
              }}
            />
            <Typography variant="h4" fontWeight={700} sx={{ color: "#fff" }}>
              تور {tourContent.destination}
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{ color: "rgba(255,255,255,.85)", mt: 0.5 }}
            >
              <LocationOnIcon fontSize="small" />
              <Typography variant="body2">
                {ticket.origin} ← {ticket.destination}
              </Typography>
            </Stack>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #0653C4 0%, #2A7BFF 60%, #5B8CFF 100%)",
            py: { xs: 4, md: 6 },
            px: 2,
          }}
        >
          <Box sx={{ maxWidth: 1100, mx: "auto" }}>
            <Chip
              icon={<TypeIcon sx={{ color: "#fff !important" }} />}
              label={TYPE_LABELS[type]}
              sx={{
                bgcolor: "rgba(255,255,255,.15)",
                color: "#fff",
                mb: 1.5,
                fontWeight: 600,
              }}
            />
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ color: "#fff", wordBreak: "break-word" }}
            >
              {ticket.origin} ← {ticket.destination}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,.85)", mt: 0.5 }}>
              {formatDateTime(ticket.departure_at)}
            </Typography>
          </Box>
        </Box>
      )}

      {/* ===================== BODY ===================== */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 2, md: 3 },
          py: 4,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        {/* -------- LEFT / MAIN COLUMN -------- */}
        <Stack spacing={3}>
          {isCancelled && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "#FEF2F2",
                border: "1px solid #FCA5A5",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <ErrorOutlinedIcon color="error" />
                <Typography color="error.main" fontWeight={600}>
                  این بلیط لغو شده و امکان رزرو آن وجود ندارد.
                </Typography>
              </Stack>
            </Paper>
          )}

          {/* Tour description */}
          {isTour && (
            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={1}>
                درباره این تور
              </Typography>
              <Typography color="text.secondary" mb={2.5}>
                {tourContent.tagline}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2.5}>
                {nights && (
                  <Chip
                    icon={<NightsStayIcon />}
                    label={`${nights} شب / ${nights + 1} روز`}
                    variant="outlined"
                  />
                )}
                <Chip
                  icon={<CalendarMonthIcon />}
                  label={`رفت: ${formatDate(ticket.departure_date)}`}
                  variant="outlined"
                />
                {ticket.return_date && (
                  <Chip
                    icon={<CalendarMonthIcon />}
                    label={`برگشت: ${formatDate(ticket.return_date)}`}
                    variant="outlined"
                  />
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography fontWeight={700} mb={1.5}>
                جاذبه‌ها و برنامه سفر
              </Typography>
              <Stack spacing={1} mb={2.5}>
                {tourContent.highlights.map((item, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <CheckCircleOutlinedIcon
                      fontSize="small"
                      color="primary"
                      sx={{ mt: "2px" }}
                    />
                    <Typography color="text.secondary">{item}</Typography>
                  </Stack>
                ))}
              </Stack>

              <Typography fontWeight={700} mb={1.5}>
                خدمات شامل تور
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {tourContent.includes.map((item, i) => (
                  <Chip key={i} label={item} size="small" />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Trip info (non-tour) */}
          {!isTour && (
            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                جزئیات سفر
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    مبدا
                  </Typography>
                  <Typography fontWeight={700}>{ticket.origin}</Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {formatDateTime(ticket.departure_at)}
                  </Typography>
                </Box>

                <Stack alignItems="center" justifyContent="center" spacing={0.5}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {calculateDuration(ticket.departure_at, ticket.arrival_at)}
                  </Typography>
                </Stack>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    مقصد
                  </Typography>
                  <Typography fontWeight={700}>{ticket.destination}</Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {formatDateTime(ticket.arrival_at)}
                  </Typography>
                </Box>
              </Stack>

              {ticket.return_date && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonthIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      تاریخ برگشت: {formatDate(ticket.return_date)}
                    </Typography>
                  </Stack>
                </>
              )}
            </Paper>
          )}

          {/* Seats */}
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              ظرفیت و صندلی‌ها
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={1.5}>
              <Chip
                icon={<EventSeatIcon />}
                label={`${ticket.total_seats} صندلی کل`}
                variant="outlined"
              />
              <Chip
                icon={<EventSeatIcon />}
                label={`${availableSeats.length} صندلی خالی`}
                color={availableSeats.length > 0 ? "success" : "default"}
                variant="outlined"
              />
            </Stack>

            {Object.keys(seatClassCounts).length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {Object.entries(seatClassCounts).map(([cls, count]) => (
                  <Chip
                    key={cls}
                    size="small"
                    label={`${SEAT_CLASS_LABELS[cls] || cls}: ${count}`}
                  />
                ))}
              </Stack>
            )}
          </Paper>

          {/* Policies for this ticket type */}
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <GavelIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                قوانین و مقررات {TYPE_LABELS[type]}
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              {typePolicy?.sections.map((section, sIndex) => (
                <Accordion key={sIndex} disableGutters defaultExpanded={sIndex === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={700}>{section.title}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1.25}>
                      {section.clauses.map((clause, cIndex) => (
                        <Stack key={cIndex} direction="row" spacing={1} alignItems="flex-start">
                          <Typography fontWeight={700} color="primary.main" sx={{ minWidth: 20 }}>
                            {cIndex + 1}.
                          </Typography>
                          <Typography color="text.secondary">{clause}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}

              {/* Relevant general clauses (booking/payment/refunds) */}
              <Accordion disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={700}>
                    قوانین عمومی رزرو، پرداخت و بازگشت وجه
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.25}>
                    {generalPolicy.sections
                      .find((s) => s.title === "رزرو، پرداخت و بازگشت وجه")
                      ?.clauses.map((clause, cIndex) => (
                        <Stack key={cIndex} direction="row" spacing={1} alignItems="flex-start">
                          <Typography fontWeight={700} color="primary.main" sx={{ minWidth: 20 }}>
                            {cIndex + 1}.
                          </Typography>
                          <Typography color="text.secondary">{clause}</Typography>
                        </Stack>
                      ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Stack>

            <Button variant="text" className="!mt-2" onClick={() => navigate("/policy")}>
              مشاهده قوانین کامل
            </Button>
          </Paper>
        </Stack>

        {/* -------- RIGHT / SIDEBAR COLUMN -------- */}
        <Stack spacing={3} sx={{ position: { md: "sticky" }, top: { md: 16 } }}>
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary">
              قیمت هر نفر از
            </Typography>
            <Typography variant="h5" fontWeight={700} color="primary.main" mb={2}>
              {formatPrice(ticket.base_price)}
            </Typography>

            <Button
              fullWidth
              disabled={isCancelled || availableSeats.length === 0}
              onClick={() => navigate(`/booking/${ticket.id}`)}
            >
              {isCancelled
                ? "این بلیط لغو شده است"
                : availableSeats.length === 0
                  ? "ظرفیت تکمیل است"
                  : isTour
                    ? "رزرو تور"
                    : "رزرو بلیط"}
            </Button>
          </Paper>

          {provider && (
            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    borderRadius: "50%",
                    bgcolor: "#E8F1FF",
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ApartmentIcon />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {isTour ? "آژانس گردشگری" : "ارائه‌دهنده خدمات"}
                  </Typography>
                  <Typography fontWeight={700}>{provider.name}</Typography>
                </Box>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Box>
    </Box>
  );
}