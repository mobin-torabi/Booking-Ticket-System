import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Box,
  Stack,
  Chip,
  Typography,
  Paper,
  Divider,
  IconButton,
} from "@mui/material";

import FlightIcon from "@mui/icons-material/Flight";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import TrainIcon from "@mui/icons-material/Train";
import TourIcon from "@mui/icons-material/Tour";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonIcon from "@mui/icons-material/Person";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CloseIcon from "@mui/icons-material/Close";

import { ticketApi, bookingApi, discountApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../utils/formatPrice";
import { formatDateTime } from "../../utils/formatDate";
import { TICKET_TYPE_LABELS } from "../../utils/constants";
import { isValidPhone } from "../../utils/validators";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { showError, showSuccess } from "../../utils/toast";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import {
  FlightSeatMap,
  BusSeatMap,
  SeatMapLegend,
} from "../../components/booking/SeatMap";

const TYPE_ICONS = {
  flight: FlightIcon,
  train: TrainIcon,
  bus: DirectionsBusIcon,
  tour: TourIcon,
};

const MAX_PASSENGERS = 9;

// Sticky sidebar / hero offsets have to clear the sticky navbar, which is
// 72px tall (see components/layout/Navbar.jsx).
const NAVBAR_HEIGHT = 72;

// Seat numbers sort naturally as numbers, not as strings — "10A" has to come
// after "2A", which localeCompare on its own gets wrong.
const seatCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

export default function Booking() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useDocumentTitle("رزرو بلیط | سیستم رزرو بلیط");

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [passengers, setPassengers] = useState([
    { first_name: "", last_name: "", phone_number: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function fetchTicket() {
    try {
      setLoading(true);
      setError(null);

      const { data } = await ticketApi.getTicketById(ticketId);
      setTicket(data);
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

  const availableSeats = useMemo(
    () => (ticket?.seats || []).filter((s) => s.is_available),
    [ticket],
  );

  const isTrain = ticket?.ticket_type === "train";
  const isTour = ticket?.ticket_type === "tour";
  const isFlight = ticket?.ticket_type === "flight";

  // Seats are grouped by cabin class for the flight map; every seat is kept
  // (booked ones too, shown greyed out) so the map reads as a real floor
  // plan rather than a shrinking list of only-available seats.
  const seatsByClass = useMemo(() => {
    const groups = {};

    for (const seat of ticket?.seats || []) {
      if (!groups[seat.seat_class]) {
        groups[seat.seat_class] = [];
      }

      groups[seat.seat_class].push(seat);
    }

    for (const cls of Object.keys(groups)) {
      groups[cls].sort((a, b) =>
        seatCollator.compare(a.seat_number, b.seat_number),
      );
    }

    return groups;
  }, [ticket]);

  const sortedAvailableSeats = useMemo(
    () =>
      [...availableSeats].sort((a, b) =>
        seatCollator.compare(a.seat_number, b.seat_number),
      ),
    [availableSeats],
  );

  // Trains and tours don't let passengers pick a seat — the system assigns
  // the first N available seats automatically whenever the passenger count
  // (or the available seats) changes, and the seat map is hidden entirely.
  useEffect(() => {
    if (!isTrain && !isTour) return;

    setSelectedSeatIds(
      sortedAvailableSeats.slice(0, passengerCount).map((s) => s.id),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTrain, isTour, passengerCount, sortedAvailableSeats]);

  // The discount was validated against a specific total amount — if the
  // passenger count changes, that amount is stale, so make the user re-check
  // the code instead of silently trusting an old validation.
  useEffect(() => {
    setDiscountApplied(null);
  }, [passengerCount]);

  const maxSelectable = Math.min(availableSeats.length, MAX_PASSENGERS) || 1;

  const passengerCountOptions = Array.from(
    { length: maxSelectable },
    (_, i) => ({ value: String(i + 1), label: `${i + 1} نفر` }),
  );

  function handlePassengerCountChange(e) {
    const count = Number(e.target.value);
    setPassengerCount(count);

    // Trim seat selection / passenger forms down if the count shrank; grow
    // the passenger-forms array if it grew (seats still need to be picked
    // manually from the seat map).
    setSelectedSeatIds((prev) => prev.slice(0, count));
    setPassengers((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) {
        next.push({ first_name: "", last_name: "", phone_number: "" });
      }
      return next;
    });
  }

  function toggleSeat(seatId) {
    if (isTrain || isTour) return;

    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      if (prev.length >= passengerCount) {
        showError(`حداکثر ${passengerCount} صندلی می‌توانید انتخاب کنید`);
        return prev;
      }
      return [...prev, seatId];
    });
  }

  function handlePassengerChange(index, field, value) {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }

  async function handleCheckDiscount() {
    const code = discountCode.trim();
    if (!code || !ticket) return;

    const amount = Number(ticket.base_price) * passengerCount;

    try {
      setCheckingDiscount(true);
      const { data } = await discountApi.validateDiscount(code, amount);
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

  function seatLabel(seatId) {
    const seat = availableSeats.find((s) => s.id === seatId);
    return seat ? seat.seat_number : "";
  }

  function validate() {
    if (selectedSeatIds.length !== passengerCount) {
      showError(`لطفا ${passengerCount} صندلی از نقشه صندلی انتخاب کنید`);
      return false;
    }

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.first_name.trim() || !p.last_name.trim()) {
        showError(`نام و نام خانوادگی مسافر ${i + 1} را وارد کنید`);
        return false;
      }
      if (p.phone_number && !isValidPhone(p.phone_number)) {
        showError(`شماره تماس مسافر ${i + 1} معتبر نیست`);
        return false;
      }
      if (i === 0 && !p.phone_number.trim()) {
        showError("شماره تماس مسافر اصلی الزامی است");
        return false;
      }
    }

    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const created = await bookingApi.createBooking({
        userId: user.id,
        ticket_id: ticketId,
        seat_ids: selectedSeatIds,
        passengers: passengers.map((p) => ({
          first_name: p.first_name.trim(),
          last_name: p.last_name.trim(),
          phone_number: p.phone_number.trim() || undefined,
        })),
      });

      // Seats are held (booking is created as 'pending') but not finalized
      // yet — the payment page is where the discount actually gets applied
      // and the booking becomes 'booked'.
      showSuccess("رزرو شما ثبت شد؛ برای تکمیل، پرداخت را انجام دهید");
      navigate(`/payment/${created.data.id}`, {
        state: discountApplied
          ? { discountCode: discountCode.trim() }
          : undefined,
      });
    } catch (err) {
      const message =
        err.response?.status === 409
          ? "برخی از صندلی‌های انتخابی توسط شخص دیگری رزرو شده‌اند"
          : (err.response?.data?.error ?? "خطا در ثبت رزرو");
      showError(message);

      // Refresh seat availability in case of a conflict so the user picks
      // from an up-to-date seat map instead of retrying blindly.
      setSelectedSeatIds([]);
      fetchTicket();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading message="در حال دریافت اطلاعات بلیط..." />;
  if (error) return <ErrorState message={error} />;
  if (!ticket) return null;

  const type = ticket.ticket_type;
  const TypeIcon = TYPE_ICONS[type] || FlightIcon;
  const isCancelled = ticket.status === "cancelled";
  const soldOut = availableSeats.length === 0;
  const totalPrice = Number(ticket.base_price) * passengerCount;

  let discountAmount = 0;
  if (discountApplied) {
    discountAmount = totalPrice * (discountApplied.percentage / 100);
    if (discountApplied.max_discount_amount) {
      discountAmount = Math.min(
        discountAmount,
        Number(discountApplied.max_discount_amount),
      );
    }
    discountAmount = Math.round(discountAmount);
  }
  const finalPrice = totalPrice - discountAmount;

  if (isCancelled || soldOut) {
    return (
      <Box sx={{ maxWidth: 640, mx: "auto", px: 2, py: 8 }} dir="rtl">
        <ErrorState
          message={
            isCancelled
              ? "این بلیط لغو شده و امکان رزرو آن وجود ندارد."
              : "ظرفیت این بلیط تکمیل شده است."
          }
        />
        <Box
          sx={{
            textAlign: "center",
            mt: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate(`/tickets/${ticketId}`)}
          >
            بازگشت به جزئیات بلیط
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box dir="rtl">
      {/* Header */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #0653C4 0%, #2A7BFF 60%, #5B8CFF 100%)",
          py: { xs: 4, md: 5 },
          px: 2,
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: "auto" }}>
          <Chip
            icon={<TypeIcon sx={{ color: "#fff !important" }} />}
            label={`رزرو ${TICKET_TYPE_LABELS[type] || ""}`}
            sx={{
              bgcolor: "rgba(255,255,255,.15)",
              color: "#fff",
              mb: 1.5,
              fontWeight: 600,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#fff",
              wordBreak: "break-word",
            }}
          >
            {ticket.origin} ← {ticket.destination}
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: "center",
              color: "rgba(255,255,255,.85)",
              mt: 0.5,
            }}
          >
            <CalendarMonthIcon fontSize="small" />
            <Typography variant="body2">
              {formatDateTime(ticket.departure_at)}
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* Body */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 2, md: 3 },
          py: { xs: 3, md: 5 },
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 2fr) minmax(300px, 1fr)",
          },
          gap: { xs: 2.5, md: 3 },
          alignItems: "start",
        }}
      >
        {/* -------- LEFT / MAIN COLUMN -------- */}
        <Stack spacing={{ xs: 2.5, md: 3 }}>
          {/* Passenger count */}
          <Paper
            elevation={0}
            sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              تعداد مسافران
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 2.5,
              }}
            >
              حداکثر {maxSelectable} مسافر برای این بلیط قابل رزرو است.
            </Typography>
            <Box sx={{ maxWidth: 220 }}>
              <Select
                name="passengerCount"
                value={String(passengerCount)}
                onChange={handlePassengerCountChange}
                options={passengerCountOptions}
              />
            </Box>
          </Paper>

          {/* Seat map (flights: grouped by cabin class / bus: 2+1 coach) */}
          {!isTrain && !isTour && (
            <Paper
              elevation={0}
              sx={{ p: { xs: 2, sm: 2.5, md: 3.5 }, borderRadius: 3 }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", sm: "center" },
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  انتخاب صندلی
                </Typography>
                <Chip
                  size="small"
                  icon={<EventSeatIcon />}
                  label={`${selectedSeatIds.length} از ${passengerCount} انتخاب شده`}
                  color={
                    selectedSeatIds.length === passengerCount
                      ? "success"
                      : "default"
                  }
                />
              </Stack>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mb: 2.5,
                }}
              >
                {isFlight
                  ? "نقشه از جلوی هواپیما به سمت عقب چیده شده است. روی صندلی خالی بزنید تا انتخاب شود."
                  : "نقشه از جلوی اتوبوس به سمت عقب چیده شده است. روی صندلی خالی بزنید تا انتخاب شود."}
              </Typography>

              <Box sx={{ mb: 2.5 }}>
                <SeatMapLegend showExit={isFlight} />
              </Box>

              {isFlight ? (
                <FlightSeatMap
                  seatsByClass={seatsByClass}
                  selectedSeatIds={selectedSeatIds}
                  onToggleSeat={toggleSeat}
                />
              ) : (
                <BusSeatMap
                  seats={ticket.seats || []}
                  selectedSeatIds={selectedSeatIds}
                  onToggleSeat={toggleSeat}
                />
              )}
            </Paper>
          )}

          {/* Trains & tours: no seat map — seats are assigned automatically */}
          {(isTrain || isTour) && (
            <Paper
              elevation={0}
              sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <InfoOutlinedIcon color="primary" fontSize="small" />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  صندلی‌های شما
                </Typography>
              </Stack>
              <Typography
                sx={{
                  color: "text.secondary",
                  mb: 2,
                }}
              >
                {isTour
                  ? "در رزرو تور امکان انتخاب صندلی وجود ندارد؛ شماره صندلی‌ها به صورت خودکار توسط سیستم تخصیص داده می‌شود."
                  : "در بلیط قطار امکان انتخاب صندلی وجود ندارد؛ شماره صندلی‌ها به صورت خودکار توسط سیستم تخصیص داده می‌شود."}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{
                  flexWrap: "wrap",
                }}
              >
                {selectedSeatIds.map((seatId) => (
                  <Chip
                    key={seatId}
                    icon={<EventSeatIcon />}
                    label={`صندلی ${seatLabel(seatId)}`}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Passenger details */}
          <Paper
            elevation={0}
            sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2.5,
              }}
            >
              مشخصات مسافران
            </Typography>

            {selectedSeatIds.length === 0 && (
              <Typography
                sx={{
                  color: "text.secondary",
                }}
              >
                ابتدا از بخش «انتخاب صندلی» صندلی مورد نظر خود را انتخاب کنید.
              </Typography>
            )}

            <Stack spacing={3}>
              {selectedSeatIds.map((seatId, index) => (
                <Box key={seatId}>
                  {index > 0 && <Divider sx={{ mb: 3 }} />}
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      mb: 1.5,
                    }}
                  >
                    <PersonIcon fontSize="small" color="primary" />
                    <Typography
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      مسافر {index + 1}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<EventSeatIcon />}
                      label={`صندلی ${seatLabel(seatId)}`}
                      variant="outlined"
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Input
                      label="نام"
                      required
                      value={passengers[index]?.first_name || ""}
                      onChange={(e) =>
                        handlePassengerChange(
                          index,
                          "first_name",
                          e.target.value,
                        )
                      }
                    />
                    <Input
                      label="نام خانوادگی"
                      required
                      value={passengers[index]?.last_name || ""}
                      onChange={(e) =>
                        handlePassengerChange(
                          index,
                          "last_name",
                          e.target.value,
                        )
                      }
                    />
                    <Input
                      label={
                        index === 0
                          ? "شماره تماس (الزامی)"
                          : "شماره تماس (اختیاری)"
                      }
                      required={index === 0}
                      value={passengers[index]?.phone_number || ""}
                      onChange={(e) =>
                        handlePassengerChange(
                          index,
                          "phone_number",
                          e.target.value,
                        )
                      }
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>

        {/* -------- RIGHT / SIDEBAR COLUMN -------- */}
        <Stack
          spacing={3}
          sx={{
            position: { md: "sticky" },
            top: { md: `${NAVBAR_HEIGHT + 16}px` },
          }}
        >
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
              }}
            >
              خلاصه رزرو
            </Typography>

            <Stack
              spacing={1}
              sx={{
                mb: 2,
              }}
            >
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  قیمت هر نفر
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {formatPrice(ticket.base_price)}
                </Typography>
              </Stack>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  تعداد مسافران
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {passengerCount} نفر
                </Typography>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* Discount code */}
            <Stack
              spacing={1}
              sx={{
                mb: 2,
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                }}
              >
                <LocalOfferIcon fontSize="small" color="primary" />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  کد تخفیف
                </Typography>
              </Stack>

              {discountApplied ? (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#F0FDF4",
                    border: "1px solid #86EFAC",
                    borderRadius: 2,
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "success.dark",
                      fontWeight: 700,
                    }}
                  >
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
                    onClick={handleCheckDiscount}
                  >
                    {checkingDiscount ? "..." : "بررسی"}
                  </Button>
                </Stack>
              )}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {discountAmount > 0 && (
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography
                  sx={{
                    color: "success.main",
                  }}
                >
                  تخفیف
                </Typography>
                <Typography
                  sx={{
                    color: "success.main",
                    fontWeight: 600,
                  }}
                >
                  ‎-{formatPrice(discountAmount)}
                </Typography>
              </Stack>
            )}

            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                mb: 2.5,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                مبلغ قابل پرداخت
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: "primary.main",
                }}
              >
                {formatPrice(finalPrice)}
              </Typography>
            </Stack>

            <Button
              fullWidth
              disabled={submitting || selectedSeatIds.length !== passengerCount}
              onClick={handleSubmit}
            >
              {submitting ? "در حال ثبت رزرو..." : "تایید و رزرو"}
            </Button>

            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: "block",
                mt: 1.5,
              }}
            >
              با ثبت رزرو، قوانین و مقررات {TICKET_TYPE_LABELS[type]} را
              می‌پذیرید.
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}
