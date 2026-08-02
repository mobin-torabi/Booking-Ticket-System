import { useState } from "react";

import {
  TextField,
  InputAdornment,
  IconButton,
  Popover,
  Box,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

import dayjs from "dayjs";

// Saturday-first week, matching the Iranian calendar convention
const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const YEARS_PER_PAGE = 12;

/**
 * A minimal Jalali (Shamsi) date picker built directly on dayjs +
 * jalali-plugin-dayjs — there is no official dayjs adapter for
 * @mui/x-date-pickers' Jalali support (only date-fns-jalali / moment-jalaali
 * are supported there), so this avoids pulling in that whole package.
 *
 * `value` / `onChange` always carry a plain Gregorian "YYYY-MM-DD" string
 * (what the backend expects) — only the on-screen display and the calendar
 * grid itself are Jalali. This mirrors how `<input type="date">` was used
 * before, so it's a drop-in replacement.
 */
export default function JalaliDatePicker({
  label,
  value,
  onChange,
  required = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewDate, setViewDate] = useState(() => (value ? dayjs(value) : dayjs()));

  // "days": the normal day-grid view. "years": a fast year-picker grid,
  // opened by tapping the year — this is the "change year quickly" fix.
  const [view, setView] = useState("days");
  const [yearRangeStart, setYearRangeStart] = useState(() =>
    Math.floor(dayjs().year() / YEARS_PER_PAGE) * YEARS_PER_PAGE,
  );

  const selected = value ? dayjs(value) : null;
  const displayValue = selected ? selected.format("YYYY/MM/DD") : "";

  function openPicker(e) {
    setViewDate(selected || dayjs());
    setView("days");
    setAnchorEl(e.currentTarget);
  }

  function closePicker() {
    setAnchorEl(null);
  }

  function goToPreviousMonth() {
    setViewDate((d) => d.subtract(1, "month"));
  }

  function goToNextMonth() {
    setViewDate((d) => d.add(1, "month"));
  }

  function handleMonthSelect(e) {
    setViewDate((d) => d.month(Number(e.target.value)));
  }

  function openYearView() {
    setYearRangeStart(
      Math.floor(viewDate.year() / YEARS_PER_PAGE) * YEARS_PER_PAGE,
    );
    setView("years");
  }

  function handleSelectYear(year) {
    setViewDate((d) => d.year(year));
    setView("days");
  }

  function goToPreviousYearRange() {
    setYearRangeStart((s) => s - YEARS_PER_PAGE);
  }

  function goToNextYearRange() {
    setYearRangeStart((s) => s + YEARS_PER_PAGE);
  }

  function handleSelectDay(day) {
    const pickedJalali = viewDate.date(day);
    // the global default calendar is Jalali (set in utils/formatDate.js), so
    // we explicitly switch to "gregory" here to get the plain ISO string
    // the backend actually expects
    const isoForApi = pickedJalali.calendar("gregory").format("YYYY-MM-DD");

    onChange(isoForApi);
    closePicker();
  }

  const daysInMonth = viewDate.daysInMonth();
  const firstDayOfMonth = viewDate.date(1);
  const startWeekday = (firstDayOfMonth.day() + 1) % 7; // shift so Saturday = 0

  return (
    <>
      <TextField
        label={label}
        value={displayValue}
        required={required}
        fullWidth
        onClick={openPicker}
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={openPicker} edge="end">
                  <CalendarMonthIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ cursor: "pointer" }}
      />

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={closePicker}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          {view === "days" && (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <IconButton size="small" onClick={goToPreviousMonth}>
                  <ChevronRightIcon fontSize="small" />
                </IconButton>

                <Select
                  size="small"
                  value={viewDate.month()}
                  onChange={handleMonthSelect}
                  sx={{ flex: 1 }}
                >
                  {JALALI_MONTHS.map((monthName, index) => (
                    <MenuItem key={monthName} value={index}>
                      {monthName}
                    </MenuItem>
                  ))}
                </Select>

                {/* tapping the year jumps to the fast year-grid below,
                    instead of forcing repeated month-by-month clicks */}
                <Box
                  onClick={openYearView}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1,
                    cursor: "pointer",
                    fontWeight: 600,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  {viewDate.year()}
                </Box>

                <IconButton size="small" onClick={goToNextMonth}>
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                {WEEKDAYS.map((w) => (
                  <Typography
                    key={w}
                    variant="caption"
                    textAlign="center"
                    color="text.secondary"
                  >
                    {w}
                  </Typography>
                ))}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 0.5,
                }}
              >
                {Array.from({ length: startWeekday }).map((_, i) => (
                  <Box key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected =
                    selected && selected.isSame(viewDate.date(day), "day");

                  return (
                    <Box
                      key={day}
                      onClick={() => handleSelectDay(day)}
                      sx={{
                        textAlign: "center",
                        py: 0.5,
                        borderRadius: 1,
                        cursor: "pointer",
                        bgcolor: isSelected ? "primary.main" : "transparent",
                        color: isSelected
                          ? "primary.contrastText"
                          : "text.primary",
                        "&:hover": {
                          bgcolor: isSelected ? "primary.dark" : "action.hover",
                        },
                      }}
                    >
                      <Typography variant="body2">{day}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}

          {view === "years" && (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <IconButton size="small" onClick={goToPreviousYearRange}>
                  <ChevronRightIcon fontSize="small" />
                </IconButton>

                <Typography variant="subtitle2">
                  {yearRangeStart} - {yearRangeStart + YEARS_PER_PAGE - 1}
                </Typography>

                <IconButton size="small" onClick={goToNextYearRange}>
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 1,
                }}
              >
                {Array.from({ length: YEARS_PER_PAGE }).map((_, i) => {
                  const year = yearRangeStart + i;
                  const isSelected = viewDate.year() === year;

                  return (
                    <Box
                      key={year}
                      onClick={() => handleSelectYear(year)}
                      sx={{
                        textAlign: "center",
                        py: 1,
                        borderRadius: 1,
                        cursor: "pointer",
                        bgcolor: isSelected ? "primary.main" : "transparent",
                        color: isSelected
                          ? "primary.contrastText"
                          : "text.primary",
                        "&:hover": {
                          bgcolor: isSelected ? "primary.dark" : "action.hover",
                        },
                      }}
                    >
                      <Typography variant="body2">{year}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
}