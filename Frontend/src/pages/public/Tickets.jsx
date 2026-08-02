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
  Checkbox,
  FormControlLabel,
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
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PublicIcon from "@mui/icons-material/Public";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { ticketApi } from "../../api";
import { formatPrice } from "../../utils/formatPrice";
import { formatDate, formatDateTime } from "../../utils/formatDate";
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

const SORT_OPTIONS = [
  { value: "departure_at_asc", label: "زودترین حرکت" },
  { value: "departure_at_desc", label: "دیرترین حرکت" },
  { value: "price_asc", label: "ارزان ترین" },
  { value: "price_desc", label: "گران ترین" },
];

// Static marketing figures for the hero band. These are copy, not data — if
// they should ever reflect the real catalogue, feed them from GET /tickets.
const HERO_STATS = [
  { icon: PublicIcon, value: "۴ نوع سفر", label: "پرواز، قطار، اتوبوس، تور" },
  { icon: EventSeatIcon, value: "انتخاب صندلی", label: "روی نقشه واقعی" },
  { icon: SupportAgentIcon, value: "۲۴ ساعته", label: "پشتیبانی تیکی" },
];

// One-tap origin/destination pairs under the search card. Values are matched
// against origin/destination with a case-insensitive `includes` server-side,
// so they just need to be the city names as they're stored.
const POPULAR_ROUTES = [
  { origin: "تهران", destination: "مشهد" },
  { origin: "تهران", destination: "شیراز" },
  { origin: "تهران", destination: "کیش" },
  { origin: "اصفهان", destination: "تهران" },
  { origin: "مشهد", destination: "تهران" },
];

const FEATURES = [
  {
    icon: EventSeatIcon,
    title: "انتخاب صندلی روی نقشه",
    text: "نقشه واقعی کابین هواپیما و اتوبوس؛ دقیقا همان صندلی که می‌خواهید.",
  },
  {
    icon: LocalOfferIcon,
    title: "کد تخفیف و قیمت شفاف",
    text: "مبلغ نهایی پیش از پرداخت مشخص است؛ بدون هزینه پنهان.",
  },
  {
    icon: VerifiedUserIcon,
    title: "رزرو مطمئن",
    text: "صندلی تا پایان پرداخت برای شما نگه داشته می‌شود.",
  },
  {
    icon: SupportAgentIcon,
    title: "پیگیری و لغو آسان",
    text: "همه رزروها در پنل کاربری، با امکان لغو طبق قوانین کنسلی.",
  },
];

const BOOKING_STEPS = [
  { title: "جستجو کنید", text: "مبدا، مقصد و تاریخ سفر را وارد کنید." },
  { title: "صندلی بگیرید", text: "روی نقشه، صندلی دلخواهتان را انتخاب کنید." },
  { title: "پرداخت کنید", text: "مشخصات مسافران را ثبت و رزرو را نهایی کنید." },
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
  // A ticket of any type is a round trip when it carries a return date, which
  // the backend exposes as trip_type=roundtrip. Ticking the box narrows the
  // results to those; leaving it off shows both one-way and round trips.
  const [roundTripOnly, setRoundTripOnly] = useState(false);
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
  }, [
    type,
    debouncedOrigin,
    debouncedDestination,
    roundTripOnly,
    clearButtonCounter,
  ]);

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
        trip_type: roundTripOnly ? "roundtrip" : undefined,
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

  function handleRouteClick(route) {
    setOrigin(route.origin);
    setDestination(route.destination);
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
    setRoundTripOnly(false);
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
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #062E7A 0%, #0653C4 45%, #2A7BFF 100%)",
          pt: { xs: 6, md: 9 },
          pb: { xs: 12, md: 16 },
          px: 2,
        }}
      >
        {/* Decorative glow blobs — purely atmospheric, and pointer-events
            none so they never intercept clicks on the search card. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            pointerEvents: "none",
            top: -140,
            insetInlineStart: -100,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(91,140,255,.55) 0%, rgba(91,140,255,0) 70%)",
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            pointerEvents: "none",
            bottom: -160,
            insetInlineEnd: -120,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(42,123,255,.5) 0%, rgba(42,123,255,0) 70%)",
          }}
        />

        <Box
          sx={{
            position: "relative",
            maxWidth: 1100,
            mx: "auto",
            textAlign: "center",
          }}
        >
          <Chip
            icon={<AutoAwesomeIcon sx={{ color: "#fff !important" }} />}
            label="سفر، ساده‌تر از همیشه"
            sx={{
              bgcolor: "rgba(255,255,255,.16)",
              color: "#fff",
              fontWeight: 600,
              mb: 2,
              backdropFilter: "blur(4px)",
            }}
          />

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "#fff",
              mb: 1.5,
              fontSize: { xs: "1.9rem", sm: "2.4rem", md: "3rem" },
              lineHeight: 1.25,
            }}
          >
            بلیط هواپیما، قطار، اتوبوس و تور
          </Typography>

          <Typography
            sx={{
              color: "rgba(255,255,255,.88)",
              maxWidth: 620,
              mx: "auto",
              fontSize: { xs: "0.95rem", md: "1.05rem" },
            }}
          >
            ارزان‌ترین قیمت‌ها را جستجو کنید، صندلی‌تان را روی نقشه انتخاب کنید
            و در چند ثانیه رزرو را نهایی کنید.
          </Typography>

          <Stack
            direction="row"
            spacing={{ xs: 2, sm: 5 }}
            useFlexGap
            sx={{
              mt: 4,
              justifyContent: "center",
              flexWrap: "wrap",
              rowGap: 2,
            }}
          >
            {HERO_STATS.map((stat) => (
              <Stack
                key={stat.label}
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", color: "#fff" }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(255,255,255,.16)",
                  }}
                >
                  <stat.icon fontSize="small" />
                </Box>
                <Box sx={{ textAlign: "start" }}>
                  <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255,255,255,.75)" }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
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
              sx={{
                alignItems: { xs: "stretch", md: "center" },
              }}
            >
              {/* Origin / destination with swap button */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={0}
                sx={{
                  alignItems: "center",
                  flex: 2,
                  position: "relative",
                }}
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

            {/* Trip type + more filters toggle */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                mt: 2,
              }}
            >
              {/* Rendered as a filled pill rather than a bare checkbox: when
                  it's on, the whole control turns primary-blue so the active
                  filter is obvious at a glance instead of hinging on a
                  16px tick. */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={roundTripOnly}
                    onChange={(e) => setRoundTripOnly(e.target.checked)}
                    sx={{
                      color: "primary.main",
                      "&.Mui-checked": { color: "#fff" },
                    }}
                  />
                }
                label={
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ alignItems: "center" }}
                  >
                    <SyncAltIcon fontSize="small" />
                    <Box component="span">فقط بلیط‌های رفت و برگشت</Box>
                  </Stack>
                }
                sx={{
                  m: 0,
                  pr: 1,
                  pl: 2,
                  py: 0.25,
                  borderRadius: 999,
                  border: "1.5px solid",
                  borderColor: roundTripOnly ? "primary.main" : "#CBD5E1",
                  bgcolor: roundTripOnly ? "primary.main" : "transparent",
                  color: roundTripOnly ? "#fff" : "text.secondary",
                  transition: "all .18s ease",
                  "& .MuiFormControlLabel-label": {
                    fontWeight: roundTripOnly ? 700 : 500,
                    fontSize: 14,
                  },
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: roundTripOnly ? "primary.dark" : "#EAF2FF",
                  },
                }}
              />

              <Stack direction="row" spacing={1}>
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
            </Stack>

            <Collapse in={showMoreFilters}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{
                  pt: 2.5,
                }}
              >
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

        {/* One-tap popular routes */}
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{
            mt: 2.5,
            alignItems: "center",
            flexWrap: "wrap",
            rowGap: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ alignItems: "center", color: "text.secondary" }}
          >
            <TrendingUpIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              مسیرهای پرطرفدار:
            </Typography>
          </Stack>

          {POPULAR_ROUTES.map((route) => (
            <Chip
              key={`${route.origin}-${route.destination}`}
              label={`${route.origin} ← ${route.destination}`}
              onClick={() => handleRouteClick(route)}
              sx={{
                bgcolor: "background.paper",
                border: "1px solid #E2E8F0",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "#EAF2FF",
                  borderColor: "primary.main",
                  color: "primary.main",
                },
              }}
            />
          ))}
        </Stack>
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
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          sx={{ alignItems: "center", flexWrap: "wrap", mb: 2.5 }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            نتایج جستجو
          </Typography>

          {!loading && !error && tickets.length > 0 && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {tickets.length} بلیط یافت شد
            </Typography>
          )}

          {/* Repeat the active round-trip filter here — by the time you've
              scrolled to the results, the pill in the search card is off
              screen. Deletable, so it doubles as a way to clear it. */}
          {roundTripOnly && (
            <Chip
              size="small"
              icon={<SyncAltIcon />}
              label="فقط رفت و برگشت"
              color="primary"
              onDelete={() => setRoundTripOnly(false)}
            />
          )}
        </Stack>

        {loading && <Loading message="در حال دریافت بلیط ها..." />}

        {!loading && error && <ErrorState message={error} />}

        {!loading && !error && tickets.length === 0 && (
          <EmptyState
            title="بلیطی یافت نشد"
            description={
              roundTripOnly
                ? "هیچ بلیط رفت و برگشتی برای این مسیر پیدا نشد. فیلتر «فقط رفت و برگشت» را بردارید تا بلیط‌های یک طرفه هم نمایش داده شوند."
                : "با تغییر فیلترها دوباره تلاش کنید."
            }
            action={
              roundTripOnly ? (
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={() => setRoundTripOnly(false)}
                >
                  حذف فیلتر رفت و برگشت
                </Button>
              ) : null
            }
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
                    <Stack spacing={1.5} sx={{ flex: 1 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: "center",
                        }}
                      >
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
                          sx={{
                            fontWeight: 700,
                            wordBreak: "break-word",
                          }}
                        >
                          {ticket.origin} ← {ticket.destination}
                        </Typography>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <CalendarMonthIcon fontSize="small" color="action" />
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                          }}
                        >
                          {formatDateTime(ticket.departure_at)}
                        </Typography>
                      </Stack>

                      {ticket.return_date && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ alignItems: "center" }}
                        >
                          <SyncAltIcon fontSize="small" color="primary" />
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                          >
                            برگشت: {formatDate(ticket.return_date)}
                          </Typography>
                        </Stack>
                      )}

                      <Stack
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Chip
                          size="small"
                          icon={
                            ticket.return_date ? (
                              <SyncAltIcon />
                            ) : (
                              <EventSeatIcon />
                            )
                          }
                          label={
                            ticket.return_date
                              ? "رفت و برگشت"
                              : `${ticket.total_seats} صندلی`
                          }
                          color={ticket.return_date ? "primary" : "default"}
                          variant="outlined"
                        />

                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            color: "primary.main",
                          }}
                        >
                          {formatPrice(ticket.base_price)}
                        </Typography>
                      </Stack>

                      {/* mt:auto keeps the action pinned to the bottom of the
                          card so every card in a row lines up. */}
                      <Box sx={{ mt: "auto", pt: 0.5 }}>
                        <Button
                          fullWidth
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                        >
                          مشاهده و رزرو
                        </Button>
                      </Box>
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
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 0.5,
          }}
        >
          تورهای پیشنهادی
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: 2,
          }}
        >
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
                sx={{
                  alignItems: "center",
                  position: "absolute",
                  bottom: 10,
                  insetInlineStart: 10,
                  color: "#fff",
                }}
              >
                <LocationOnIcon fontSize="small" />
                <Typography
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {tour.title}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ===================== WHY TICKI ===================== */}
      <Box
        sx={{ bgcolor: "background.paper", borderBlock: "1px solid #E2E8F0" }}
      >
        <Box
          sx={{
            maxWidth: 1100,
            mx: "auto",
            px: { xs: 2, md: 3 },
            py: { xs: 5, md: 8 },
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, textAlign: "center", mb: 0.5 }}
          >
            چرا تیکی؟
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", textAlign: "center", mb: 4 }}
          >
            هر چیزی که برای یک رزرو بی‌دردسر لازم دارید
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2.5,
            }}
          >
            {FEATURES.map((feature) => (
              <Box
                key={feature.title}
                sx={{
                  p: 2.5,
                  height: "100%",
                  borderRadius: 3,
                  border: "1px solid #E2E8F0",
                  bgcolor: "#F8FAFF",
                  transition: "border-color .18s ease, transform .18s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    transform: "translateY(-3px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    mb: 1.5,
                    borderRadius: "50%",
                    bgcolor: "#E8F1FF",
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <feature.icon />
                </Box>

                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {feature.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ===================== HOW IT WORKS ===================== */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 2, md: 3 },
          py: { xs: 5, md: 8 },
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, textAlign: "center", mb: 4 }}
        >
          رزرو در سه قدم
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {BOOKING_STEPS.map((step, index) => (
            <Stack
              key={step.title}
              direction="row"
              spacing={2}
              sx={{ alignItems: "flex-start" }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  color: "#fff",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {index + 1}
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {step.text}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      </Box>

      {/* ===================== SUPPORT CTA ===================== */}
      <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 5, md: 8 } }}>
        <Box
          sx={{
            maxWidth: 1100,
            mx: "auto",
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background:
              "linear-gradient(135deg, #062E7A 0%, #0653C4 55%, #2A7BFF 100%)",
            color: "#fff",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              سوالی درباره سفرتان دارید؟
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,.85)" }}>
              تیم پشتیبانی تیکی هر روز هفته پاسخگوی شماست.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              endIcon={<ArrowBackIcon />}
              onClick={() => navigate("/support")}
              sx={{
                bgcolor: "#fff",
                color: "primary.main",
                "&:hover": { bgcolor: "#EAF2FF" },
              }}
            >
              تماس با پشتیبانی
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/faq")}
              sx={{
                borderColor: "rgba(255,255,255,.6)",
                color: "#fff",
                "&:hover": {
                  borderColor: "#fff",
                  bgcolor: "rgba(255,255,255,.12)",
                },
              }}
            >
              پرسش‌های متداول
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
