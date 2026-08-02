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
import {
  TICKET_TYPE_LABELS,
  SEAT_CLASS_LABELS,
  SEAT_CLASS_ORDER,
} from "../../utils/constants";
import { isValidPhone } from "../../utils/validators";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { showError, showSuccess } from "../../utils/toast";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

const TYPE_ICONS = {
  flight: FlightIcon,
  train: TrainIcon,
  bus: DirectionsBusIcon,
  tour: TourIcon,
};

const MAX_PASSENGERS = 9;

function SeatButton({ seat, selected, booked, onClick, wide = false }) {
  return (
    <Box
      component="button"
      type="button"
      disabled={booked}
      onClick={onClick}
      sx={{
        minWidth: wide ? 76 : 56,
        height: 44,
        borderRadius: 2,
        border: "1px solid",
        borderColor: selected ? "primary.main" : booked ? "#CBD5E1" : "#E2E8F0",
        bgcolor: selected ? "primary.main" : booked ? "#E2E8F0" : "#F6F9FD",
        color: selected ? "#fff" : booked ? "#94A3B8" : "text.primary",
        fontWeight: 700,
        fontFamily: "inherit",
        fontSize: 13,
        cursor: booked ? "not-allowed" : "pointer",
        opacity: booked ? 0.8 : 1,
        transition: "all .15s ease",
        "&:hover": {
          borderColor: booked ? "#CBD5E1" : "primary.main",
        },
      }}
    >
      {seat.seat_number}
    </Box>
  );
}

function seatSortValue(seat) {
  const parsed = parseInt(String(seat.seat_number).replace(/\D/g, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// Each row of the bus has 3 seats: 2 seats, an aisle, then 1 seat (a
// standard 2+1 coach layout), read left-to-right across the vehicle.
function buildBusRows(seats) {
  const sorted = [...seats].sort((a, b) => seatSortValue(a) - seatSortValue(b));

  const rows = [];

  for (let i = 0; i < sorted.length; i += 3) {
    rows.push(sorted.slice(i, i + 3));
  }

  return rows;
}

// Flight seat maps mirror a real cabin: each class is its own section, rows
// run front-to-back, and seats split evenly around a center aisle (a 6-wide
// row becomes 3 + aisle + 3, a 4-wide row becomes 2 + aisle + 2, etc). The
// column layout is derived from the actual seat letters present in that
// class's data rather than a hardcoded scheme, so it adapts to whatever
// seat_layout the ticket was created with.
function parseSeatNumber(seat) {
  const match = String(seat.seat_number).match(/^(\d+)(.*)$/);
  if (!match) return { row: 0, col: String(seat.seat_number) };
  return { row: parseInt(match[1], 10), col: match[2] };
}

function buildCabinRows(seats) {
  const columns = Array.from(
    new Set(seats.map((seat) => parseSeatNumber(seat).col)),
  ).sort();

  const seatsByRow = new Map();
  for (const seat of seats) {
    const { row, col } = parseSeatNumber(seat);
    if (!seatsByRow.has(row)) seatsByRow.set(row, new Map());
    seatsByRow.get(row).set(col, seat);
  }

  const rowNumbers = Array.from(seatsByRow.keys()).sort((a, b) => a - b);

  return rowNumbers.map((rowNumber) => ({
    rowNumber,
    seats: columns.map((col) => seatsByRow.get(rowNumber).get(col) || null),
  }));
}

// Wide-body cabins run two aisles instead of one: seats split into three
// blocks (e.g. a 9-wide row becomes 3 + aisle + 3 + aisle + 3, a narrower
// business row becomes 1 + aisle + 2 + aisle + 1). Zero-size blocks are
// dropped so rows too narrow for three blocks fall back to one aisle.
function splitSeatColumns(rowWidth, groups = 3) {
  const base = Math.floor(rowWidth / groups);
  const extra = rowWidth % groups;
  const sizes = Array.from(
    { length: groups },
    (_, i) => base + (i < extra ? 1 : 0),
  );
  return sizes.filter((size) => size > 0);
}

function SeatMapLegend() {
  const items = [
    { label: "انتخاب شما", bg: "primary.main", border: "primary.main" },
    { label: "قابل انتخاب", bg: "#F6F9FD", border: "#E2E8F0" },
    { label: "رزرو شده", bg: "#E2E8F0", border: "#CBD5E1" },
  ];
  return (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap mb={2}>
      {items.map((item) => (
        <Stack
          key={item.label}
          direction="row"
          spacing={0.75}
          alignItems="center"
        >
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: 0.75,
              bgcolor: item.bg,
              border: "1px solid",
              borderColor: item.border,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

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
  const seatsByClass = useMemo(() => {
    const groups = {};

    for (const seat of ticket?.seats || []) {
      if (!groups[seat.seat_class]) {
        groups[seat.seat_class] = [];
      }

      groups[seat.seat_class].push(seat);
    }

    for (const cls of Object.keys(groups)) {
      groups[cls].sort((a, b) => a.seat_number.localeCompare(b.seat_number));
    }

    return groups;
  }, [ticket]);

  const sortedAvailableSeats = useMemo(
    () =>
      [...availableSeats].sort((a, b) =>
        a.seat_number.localeCompare(b.seat_number),
      ),
    [availableSeats],
  );

  // Bus & tour seat map: include every seat (booked ones too, shown greyed
  // out and disabled) so the layout reads as a real bus floor plan rather
  // than a shrinking list of only-available seats.
  const busRows = useMemo(() => buildBusRows(ticket?.seats || []), [ticket]);

  // Trains don't let passengers pick a seat — the system assigns the first
  // N available seats automatically whenever the passenger count (or the
  // available seats) changes, and the manual seat map is hidden entirely.
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
        <Box textAlign="center" mt={2}>
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
            fontWeight={700}
            sx={{ color: "#fff", wordBreak: "break-word" }}
          >
            {ticket.origin} ← {ticket.destination}
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ color: "rgba(255,255,255,.85)", mt: 0.5 }}
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
          py: 4,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        {/* -------- LEFT / MAIN COLUMN -------- */}
        <Stack spacing={3}>
          {/* Passenger count */}
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              تعداد مسافران
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

          {/* Seat map (flights: grouped by class / bus & tour: single list) */}
          {!isTrain && !isTour && (
            <Paper
              elevation={0}
              sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" fontWeight={700}>
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

              {isFlight ? (
                <Box
                  sx={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "48px 48px 20px 20px",
                    bgcolor: "#FAFBFF",
                    overflow: "hidden",
                  }}
                >
                  {/* Nose of the plane */}
                  <Stack
                    alignItems="center"
                    spacing={0.5}
                    sx={{
                      py: 2,
                      borderBottom: "1px dashed #CBD5E1",
                      color: "text.secondary",
                    }}
                  >
                    <FlightIcon sx={{ transform: "rotate(90deg)" }} />
                    <Typography variant="caption">جلوی هواپیما</Typography>
                  </Stack>

                  <Box sx={{ px: { xs: 1.5, sm: 3 }, pt: 2 }}>
                    <SeatMapLegend />
                  </Box>

                  {SEAT_CLASS_ORDER.filter(
                    (cls) => seatsByClass[cls]?.length,
                  ).map((cls, clsIndex, arr) => {
                    const cabinRows = buildCabinRows(seatsByClass[cls]);
                    const rowWidth = cabinRows[0]?.seats.length || 0;
                    const groupSizes = splitSeatColumns(rowWidth);

                    return (
                      <Box
                        key={cls}
                        sx={{
                          px: { xs: 1.5, sm: 4 },
                          py: 2.5,
                          borderBottom:
                            clsIndex < arr.length - 1
                              ? "1px dashed #E2E8F0"
                              : "none",
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="text.secondary"
                          mb={1.5}
                          textAlign="center"
                        >
                          {SEAT_CLASS_LABELS[cls] || cls} (
                          {
                            seatsByClass[cls].filter((s) => s.is_available)
                              .length
                          }{" "}
                          صندلی خالی)
                        </Typography>

                        <Stack spacing={1} alignItems="center">
                          {cabinRows.map((row) => (
                            <Stack
                              key={row.rowNumber}
                              direction="row"
                              alignItems="center"
                              spacing={1.5}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  width: 20,
                                  textAlign: "center",
                                  color: "text.disabled",
                                }}
                              >
                                {row.rowNumber}
                              </Typography>

                              {groupSizes.map((size, groupIndex) => {
                                const start = groupSizes
                                  .slice(0, groupIndex)
                                  .reduce((sum, s) => sum + s, 0);
                                const groupSeats = row.seats.slice(
                                  start,
                                  start + size,
                                );

                                return (
                                  <Stack
                                    key={groupIndex}
                                    direction="row"
                                    alignItems="center"
                                    spacing={1.5}
                                  >
                                    <Stack direction="row" spacing={0.75}>
                                      {groupSeats.map((seat, i) =>
                                        seat ? (
                                          <SeatButton
                                            key={seat.id}
                                            seat={seat}
                                            wide={cls === "first"}
                                            selected={selectedSeatIds.includes(
                                              seat.id,
                                            )}
                                            booked={!seat.is_available}
                                            onClick={() =>
                                              seat.is_available &&
                                              toggleSeat(seat.id)
                                            }
                                          />
                                        ) : (
                                          <Box key={i} sx={{ width: 56 }} />
                                        ),
                                      )}
                                    </Stack>

                                    {/* aisle */}
                                    {groupIndex < groupSizes.length - 1 && (
                                      <Box
                                        sx={{ width: { xs: 20, sm: 32 } }}
                                      />
                                    )}
                                  </Stack>
                                );
                              })}
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                // Bus & tour tickets only ever have one seat type — lay the
                // seats out like an actual coach: columns of seats running
                // front-to-back, with the driver's cabin marked at the
                // front and booked seats shown greyed out instead of
                // disappearing from the map.
                <Box>
                  <SeatMapLegend />
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}
                  >
                    {/* Driver */}
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: "#F1F5F9",
                        color: "text.secondary",
                        flexShrink: 0,
                      }}
                    >
                      <DirectionsBusIcon />
                    </Stack>

                    {/* Seat map */}
                    <Stack spacing={1.2}>
                      {busRows.map((row, rowIndex) => (
                        <Box
                          key={rowIndex}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "56px 56px 28px 56px",
                            columnGap: 1,
                            alignItems: "center",
                          }}
                        >
                          {/* Left */}
                          {row[0] ? (
                            <SeatButton
                              seat={row[0]}
                              selected={selectedSeatIds.includes(row[0].id)}
                              booked={!row[0].is_available}
                              onClick={() =>
                                row[0].is_available && toggleSeat(row[0].id)
                              }
                            />
                          ) : (
                            <Box />
                          )}

                          {/* Middle */}
                          {row[1] ? (
                            <SeatButton
                              seat={row[1]}
                              selected={selectedSeatIds.includes(row[1].id)}
                              booked={!row[1].is_available}
                              onClick={() =>
                                row[1].is_available && toggleSeat(row[1].id)
                              }
                            />
                          ) : (
                            <Box />
                          )}

                          {/* aisle */}
                          <Box />

                          {/* Right */}
                          {row[2] ? (
                            <SeatButton
                              seat={row[2]}
                              selected={selectedSeatIds.includes(row[2].id)}
                              booked={!row[2].is_available}
                              onClick={() =>
                                row[2].is_available && toggleSeat(row[2].id)
                              }
                            />
                          ) : (
                            <Box />
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {/* Trains: no seat map — seats are assigned automatically */}
          {(isTrain || isTour) && (
            <Paper
              elevation={0}
              sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                <InfoOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="h6" fontWeight={700}>
                  صندلی‌های شما
                </Typography>
              </Stack>
              <Typography color="text.secondary" mb={2}>
                در بلیط قطار امکان انتخاب صندلی وجود ندارد؛ شماره صندلی‌ها به
                صورت خودکار توسط سیستم تخصیص داده می‌شود.
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              مشخصات مسافران
            </Typography>

            {selectedSeatIds.length === 0 && (
              <Typography color="text.secondary">
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
                    alignItems="center"
                    mb={1.5}
                  >
                    <PersonIcon fontSize="small" color="primary" />
                    <Typography fontWeight={700}>مسافر {index + 1}</Typography>
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
        <Stack spacing={3} sx={{ position: { md: "sticky" }, top: { md: 16 } }}>
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              خلاصه رزرو
            </Typography>

            <Stack spacing={1} mb={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">قیمت هر نفر</Typography>
                <Typography fontWeight={600}>
                  {formatPrice(ticket.base_price)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">تعداد مسافران</Typography>
                <Typography fontWeight={600}>{passengerCount} نفر</Typography>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* Discount code */}
            <Stack spacing={1} mb={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocalOfferIcon fontSize="small" color="primary" />
                <Typography variant="body2" fontWeight={700}>
                  کد تخفیف
                </Typography>
              </Stack>

              {discountApplied ? (
                <Stack
                  direction="row"
                  spacing={1}
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
                  <Typography
                    variant="body2"
                    color="success.dark"
                    fontWeight={700}
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
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography color="success.main">تخفیف</Typography>
                <Typography color="success.main" fontWeight={600}>
                  ‎-{formatPrice(discountAmount)}
                </Typography>
              </Stack>
            )}

            <Stack direction="row" justifyContent="space-between" mb={2.5}>
              <Typography fontWeight={700}>مبلغ قابل پرداخت</Typography>
              <Typography fontWeight={700} color="primary.main">
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
              color="text.secondary"
              display="block"
              mt={1.5}
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
