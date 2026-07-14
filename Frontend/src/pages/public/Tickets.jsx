import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Stack,
  Chip,
  Typography,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  IconButton,
  Collapse,
} from "@mui/material";

import FlightIcon from "@mui/icons-material/Flight";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import TrainIcon from "@mui/icons-material/Train";
import TourIcon from "@mui/icons-material/Tour";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ClearIcon from "@mui/icons-material/Clear";

import { ticketApi } from "../../api";
import { formatPrice } from "../../utils/formatPrice";
import { formatDateTime } from "../../utils/formatDate";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { showError } from "../../utils/toast";

import CardBox from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import JalaliDatePicker from "../../components/common/Jalalidatepicker";

// Ticket types shown in the segmented switcher at the top of the search
// card. Matches the `type` values the backend's ticket_types table + the
// POST /tickets PROVIDER_META map both use: flight / train / bus / tour.
const TICKET_TYPES = [
  { value: "flight", label: "پرواز", icon: <FlightIcon /> },
  { value: "train", label: "قطار", icon: <TrainIcon /> },
  { value: "bus", label: "اتوبوس", icon: <DirectionsBusIcon /> },
  { value: "tour", label: "تور", icon: <TourIcon /> },
];

const TYPE_ICONS = {
  flight: FlightIcon,
  train: TrainIcon,
  bus: DirectionsBusIcon,
  tour: TourIcon,
};

const TRIP_TYPE_OPTIONS = [
  { value: "", label: "همه" },
  { value: "oneway", label: "یک طرفه" },
  { value: "roundtrip", label: "رفت و برگشت" },
];

const SORT_OPTIONS = [
  { value: "departure_at_asc", label: "زودترین حرکت" },
  { value: "departure_at_desc", label: "دیرترین حرکت" },
  { value: "price_asc", label: "ارزان ترین" },
  { value: "price_desc", label: "گران ترین" },
];

// Tour destination pictures. Fill in `image` with your own file paths once
// you have them — drop the images in `public/tours/` and they'll be served
// from `/tours/<file>.jpg` automatically. Nothing else needs to change; the
// grid below just loops over this array.
const TOUR_DESTINATIONS = [
  {
    id: "081299fa-8bdc-49db-a814-e9b7101027a8",
    title: "کیش",
    image:
      "https://images.openai.com/static-rsc-4/ITfc4yk__7kG2rp6L-n40oP4BmXnHzk9Xejc2LMe0qdjG_Pe9inTxPWcDmlj8HzagTua3ChZN2U2TXQXHah8w8Q5bhwsVypmuJkfbRlcn83T2Kqh1NyT7W5rSZ2BI1AhgFIh6RZNJ17nOCE228EqKxUf7fDTb7sxjq6NUEQu--LoQSdxhdqy5lCZAu0OCOuO?purpose=fullsize",
  },
  {
    id: "bcb40e95-a008-4628-a98a-9d8c464358c3",
    title: "مشهد",
    image:
      "https://images.openai.com/static-rsc-4/CPzcEOwzbjhl2BaS3wRDT7vIEf_tS67C-it-YfmNUjUtW6P4JXuxXm36db8fK1V30YORfRXQD6KW0N-YoLWId9mn6WmwsZG6Z3gpwsDpVRDh6tBn0-zsLIIpYd2y_mp43xCsqOFS4eflZ-n0P1vLNovT5Z6iK8uQkXEAyYIY1ld-gR1yMXAWl6EYlVZd9ydV?purpose=fullsize",
  },
  {
    id: "e4d183f8-5026-44ee-b1b6-31949eb95d0f",
    title: "شیراز",
    image:
      "https://images.openai.com/static-rsc-4/MD_pjyXU7Z_Qc4pgWTvgt7VgF3Ba8PvF7jxARVQ46qTEm2yuSDfQvUZU1BbP-S8a-43ZwFbnMdwCB8pgy3rulvQj4o5ZrYsk5OX7q9OHzBvj_BUKw3ZiOcrhHx7B18NCa7VQk1Cyvx2lsjCZ5LTm_uE-1pH7SjWeLR0NMeyW99AFnrUE18y3_IdSdlM2_Nnq?purpose=fullsize",
  },
  {
    id: "c7daa955-d929-400b-aff5-53abd30b4caa",
    title: "اصفهان",
    image:
      "https://images.openai.com/static-rsc-4/7GLRCaMzxn6AyTfhto6FX47tijSuf4hRstD2IUCUPTM2EVAWg-Q-Bq8wAVHvpQ3NA1fhBQoW4oSGxVXF5vGrgI1S9b0RYUH3VoZ2wX1zffbti6wlQepqGWU0cRYl-Yy0fchu-Tu_ewJ1CB7ZFnTzPpPLogTiXhQk2SVw-F6JA1sEC2tFVOB-wSkXTgeXjrwN?purpose=fullsize",
  },
  {
    id: "9c0b8bd8-27b5-4e4b-87b9-f0390e71b261",
    title: "بندر انزلی",
    image:
      "https://images.openai.com/static-rsc-4/9qkp9XtFy9SNU34JFQe6z8yAHFE-AcnOGS3kuJ2qOqlGdJY-Eyl6N-2PTvjkNcELHylvUqX2s_fxsxWWF103CGA6I9iBUVBs3K0_SRuDQVJNIGDzb-M_6gzlFmRGAmNPb-8Y6L5_Ox7qw-hzAnxpM4cG3LmDaMKeChNjlnDS6PyEmq1GwedpYQ0cL9jH3jYs?purpose=fullsize",
  },
  {
    id: "ant927752f0-6b3d-4a80-9352-36260294933ealya",
    title: "چابهار",
    image:
      "https://images.openai.com/static-rsc-4/vasoSTfCtiQx3Qwri4Ab8WRl6kLKNN1Ib3kgAwWnqnNiJDCpdqKZyakHQH1A1wLTCK-OheAWY6u5WmARsyNgH6lrAQMDO6bn61AFZkL9aev7wWahlMeAViSu-1bhnwfvZtcmVnfe6IknpHSZYjxPgMOUt60Jzf9deHzQhKnSTMGaXTzMTrobchJzAQFbLCJM?purpose=fullsize",
  },
];

const PAGE_SIZE = 9;

export default function Tickets() {
  useDocumentTitle("جستجوی بلیط | سیستم رزرو بلیط");

  const navigate = useNavigate();

  const [type, setType] = useState("flight");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDateFrom, setDepartureDateFrom] = useState("");

  const debouncedOrigin = useDebounce(origin, 500);
  const debouncedDestination = useDebounce(destination, 500);

  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [tripType, setTripType] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("departure_at_asc");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clearButtonCounter, setClearButtonCounter] = useState(0);

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, debouncedOrigin, debouncedDestination, clearButtonCounter]);

  async function fetchTickets(e) {
    e?.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const { data } = await ticketApi.getTickets({
        type,
        origin: origin || undefined,
        destination: destination || undefined,
        departure_date_from: departureDateFrom || undefined,
        trip_type: tripType || undefined,
        price_min: priceMin || undefined,
        price_max: priceMax || undefined,
        available_seats_min: 1,
        sort,
      });

      setTickets(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setTickets([]);
      } else {
        setError(err.response?.data?.error ?? "خطا در دریافت بلیط ها");
        showError(err.response?.data?.error ?? "خطا در دریافت بلیط ها");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSwap() {
    const originState = origin;
    setOrigin(destination);
    setDestination(originState);
  }

  function handleTourClick(tour) {
    setType("tour");
    setDestination(tour.title);
  }

  const { page, setPage, totalPages, currentData } = usePagination(
    tickets,
    PAGE_SIZE,
  );

  function clearFilters() {
    setType("flight");
    setOrigin("");
    setDestination("");
    setDepartureDateFrom("");
    setShowMoreFilters(false);
    setTripType("");
    setPriceMin("");
    setPriceMax("");
    setSort("departure_at_asc");
    setClearButtonCounter((prev) => prev + 1);
  }

  return (
    <Box dir="rtl">
      {/* ===================== HERO / SEARCH ===================== */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #0653C4 0%, #2A7BFF 60%, #5B8CFF 100%)",
          pt: { xs: 5, md: 8 },
          pb: { xs: 12, md: 16 },
          px: 2,
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: "auto", textAlign: "center" }}>
          <Typography
            variant="h3"
            fontWeight={700}
            sx={{ color: "#fff", mb: 1 }}
          >
            بلیط هواپیما، قطار، اتوبوس و تور
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,.85)" }}>
            ارزان ترین قیمت ها را همین حالا جستجو و رزرو کنید
          </Typography>
        </Box>
      </Box>

      {/* Search card pulled up over the hero, alibaba.ir style */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 2, md: 3 },
          mt: { xs: "-72px", md: "-88px" },
          position: "relative",
          zIndex: 2,
        }}
      >
        <Paper
          component="form"
          onSubmit={fetchTickets}
          elevation={6}
          sx={{ borderRadius: 4, overflow: "hidden" }}
        >
          {/* Segmented ticket-type switcher */}
          <BottomNavigation
            value={type}
            onChange={(_, value) => setType(value)}
            showLabels
            sx={{
              height: 64,
              bgcolor: "#F6F9FD",
              borderBottom: "1px solid #E2E8F0",
              "& .Mui-selected": {
                color: "primary.main",
              },
            }}
          >
            {TICKET_TYPES.map((t) => (
              <BottomNavigationAction
                key={t.value}
                value={t.value}
                label={t.label}
                icon={t.icon}
              />
            ))}
          </BottomNavigation>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignitems={{ xs: "stretch", md: "center" }}
            >
              {/* Origin / destination with swap button */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={0}
                alignitems="center"
                sx={{ flex: 2, position: "relative" }}
              >
                <Input
                  label="مبدا"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />

                <IconButton
                  onClick={handleSwap}
                  size="small"
                  sx={{
                    bgcolor: "background.paper",
                    border: "1px solid #E2E8F0",
                    mx: { sm: 0.5 },
                    my: { xs: -1, sm: 0 },

                    zIndex: 1,
                    "&:hover": { bgcolor: "#E8F1FF" },
                  }}
                >
                  <SwapHorizIcon fontSize="small" />
                </IconButton>

                <Input
                  label="مقصد"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </Stack>

              {/* Date */}
              <Box sx={{ flex: 1 }}>
                {/* <Input
                  label="تاریخ حرکت"
                  type="date"
                  value={departureDateFrom}
                  onChange={(e) => setDepartureDateFrom(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                /> */}
                <JalaliDatePicker
                  label="تاریخ حرکت"
                  value={departureDateFrom}
                  onChange={(isoDate) => setDepartureDateFrom(isoDate)}
                />
              </Box>

              {/* Search button */}
              <Button
                type="submit"
                startIcon={<SearchIcon />}
                fullWidth={false}
                className="!h-14 !min-w-[140px]"
              >
                جستجو
              </Button>
            </Stack>

            {/* More filters toggle */}
            <Stack direction="row" justifycontent="flex-end" sx={{mt: 3, mb: 3}}>
              <Button
                variant="text"
                startIcon={<TuneIcon />}
                onClick={() => setShowMoreFilters((prev) => !prev)}
              >
                فیلترهای بیشتر
              </Button>
              <Button
                variant="text"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
              >
                حذف همه فیلتر ها
              </Button>
            </Stack>

            <Collapse in={showMoreFilters}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                pt={1}
              >
                <Box sx={{ flex: 1 }}>
                  <Select
                    label="نوع سفر"
                    name="tripType"
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value)}
                    options={TRIP_TYPE_OPTIONS}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Input
                    label="حداقل قیمت (تومان)"
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Input
                    label="حداکثر قیمت (تومان)"
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Select
                    label="مرتب سازی"
                    name="sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    options={SORT_OPTIONS}
                  />
                </Box>
              </Stack>
            </Collapse>
          </Box>
        </Paper>
      </Box>

      {/* ===================== RESULTS ===================== */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 2, md: 3 },
          pt: 4,
          pb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={2.5}>
          نتایج جستجو
        </Typography>

        {loading && <Loading message="در حال دریافت بلیط ها..." />}

        {!loading && error && <ErrorState message={error} />}

        {!loading && !error && tickets.length === 0 && (
          <EmptyState
            title="بلیطی یافت نشد"
            description="با تغییر فیلترها دوباره تلاش کنید."
          />
        )}

        {!loading && !error && tickets.length > 0 && (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2.5,
              }}
            >
              {currentData.map((ticket) => {
                const TypeIcon = TYPE_ICONS[ticket.ticket_type] || FlightIcon;

                return (
                  <CardBox key={ticket.id}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignitems="center">
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            minWidth: 40,
                            borderRadius: "50%",
                            bgcolor: "#E8F1FF",
                            color: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <TypeIcon fontSize="small" />
                        </Box>

                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{ wordBreak: "break-word" }}
                        >
                          {ticket.origin} ← {ticket.destination}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={0.5} alignitems="center">
                        <CalendarMonthIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDateTime(ticket.departure_at)}
                        </Typography>
                      </Stack>

                      <Stack
                        direction="row"
                        justifycontent="space-between"
                        alignitems="center"
                      >
                        <Chip
                          size="small"
                          icon={<EventSeatIcon />}
                          label={`${ticket.total_seats} صندلی`}
                          variant="outlined"
                        />

                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color="primary.main"
                        >
                          {formatPrice(ticket.base_price)}
                        </Typography>
                      </Stack>

                      <Button onClick={() => navigate(`/tickets/${ticket.id}`)}>
                        مشاهده و رزرو
                      </Button>
                    </Stack>
                  </CardBox>
                );
              })}
            </Box>

            {totalPages > 1 && (
              <Box
                sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 0 }}
              >
                <Pagination
                  page={page}
                  count={totalPages}
                  onChange={(_, value) => setPage(value)}
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ===================== TOURS ===================== */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 2, md: 3 },
          pt: 5,
          pb: 8,
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={0.5}>
          تورهای پیشنهادی
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
          یک مقصد را انتخاب کنید تا تورهای مربوط به آن را ببینید
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {TOUR_DESTINATIONS.map((tour) => (
            <Box
              key={tour.id}
              onClick={() => handleTourClick(tour)}
              sx={{
                position: "relative",
                borderRadius: 3,
                overflow: "hidden",
                cursor: "pointer",
                height: 150,
                bgcolor: "#E2E8F0",
                "&:hover img": { transform: "scale(1.06)" },
              }}
            >
              <Box
                component="img"
                src={tour.image}
                alt={tour.title}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform .3s ease",
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(10,31,102,.75) 100%)",
                }}
              />

              <Stack
                direction="row"
                spacing={0.5}
                alignitems="center"
                sx={{
                  position: "absolute",
                  bottom: 10,
                  insetInlineStart: 10,
                  color: "#fff",
                }}
              >
                <LocationOnIcon fontSize="small" />
                <Typography fontWeight={700}>{tour.title}</Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
