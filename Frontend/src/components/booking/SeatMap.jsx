import { Box, Stack, Chip, Typography, Tooltip } from "@mui/material";

import FlightIcon from "@mui/icons-material/Flight";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import WcIcon from "@mui/icons-material/Wc";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";

import { SEAT_CLASS_LABELS, SEAT_CLASS_ORDER } from "../../utils/constants";

// ---------------------------------------------------------------------------
// Shared look & feel
// ---------------------------------------------------------------------------

const SEAT_COLORS = {
  free: { bg: "#EAF2FF", border: "#BFD5F5", text: "#0F172A" },
  selected: { bg: "#0653C4", border: "#0653C4", text: "#FFFFFF" },
  booked: { bg: "#E9EDF3", border: "#D6DDE7", text: "#A3AEBE" },
};

const HULL_BORDER = "#CBD5E1";
const HULL_BG = "#FFFFFF";
const CABIN_BG = "#F8FAFF";

// Row-number gutters and the aisle both need to line up between the header
// row (seat letters) and every seat row below it, so the widths live here
// rather than being repeated at each call site.
const GUTTER = 26;
const AISLE = { xs: 18, sm: 26 };

function seatStateColors(selected, booked) {
  if (selected) return SEAT_COLORS.selected;
  if (booked) return SEAT_COLORS.booked;
  return SEAT_COLORS.free;
}

/**
 * A single seat. Drawn as a real cabin seat rather than a plain square: the
 * top third is the shaded backrest, the rounded bottom is the cushion, and
 * the two side slivers read as armrests. The seat itself only shows its
 * column letter (or number, on a bus) — the full seat id lives in the
 * tooltip, exactly like the seat maps airlines publish.
 */
function Seat({ label, title, size, selected, booked, onClick }) {
  const colors = seatStateColors(selected, booked);

  return (
    <Tooltip title={title} arrow disableInteractive enterTouchDelay={0}>
      {/* A disabled button swallows pointer events, so the tooltip needs a
          wrapper it can still listen on for booked seats. */}
      <Box component="span" sx={{ display: "inline-flex" }}>
        <Box
          component="button"
          type="button"
          disabled={booked}
          onClick={onClick}
          aria-label={title}
          aria-pressed={selected}
          sx={{
            position: "relative",
            width: size,
            height: size,
            p: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            pb: "3px",
            border: "1px solid",
            borderColor: colors.border,
            borderRadius: "9px 9px 4px 4px",
            bgcolor: colors.bg,
            color: colors.text,
            fontFamily: "inherit",
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1,
            cursor: booked ? "not-allowed" : "pointer",
            transition: "transform .12s ease, box-shadow .12s ease",
            // backrest shading + armrest slivers, drawn with a gradient so
            // the seat keeps working as a single focusable element
            backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,.07) 0 34%, transparent 34%),
               linear-gradient(to right, rgba(15,23,42,.10) 0 3px, transparent 3px calc(100% - 3px), rgba(15,23,42,.10) calc(100% - 3px) 100%)`,
            "&:not(:disabled):hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 4px 10px rgba(6,83,196,.22)",
            },
            "&:focus-visible": {
              outline: "2px solid #0653C4",
              outlineOffset: 2,
            },
          }}
        >
          {label}
        </Box>
      </Box>
    </Tooltip>
  );
}

/** An empty slot where a row is missing a seat, so columns stay aligned. */
function SeatGap({ size }) {
  return <Box sx={{ width: size, height: size }} />;
}

export function SeatMapLegend({ showExit = false }) {
  const items = [
    { label: "قابل انتخاب", ...SEAT_COLORS.free },
    { label: "انتخاب شما", ...SEAT_COLORS.selected },
    { label: "رزرو شده", ...SEAT_COLORS.booked },
  ];

  return (
    <Stack
      direction="row"
      spacing={2}
      useFlexGap
      sx={{
        rowGap: 1,
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {items.map((item) => (
        <Stack
          key={item.label}
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: "5px 5px 2px 2px",
              bgcolor: item.bg,
              border: "1px solid",
              borderColor: item.border,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
            }}
          >
            {item.label}
          </Typography>
        </Stack>
      ))}

      {showExit && (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: 0.75,
              bgcolor: "#DCFCE7",
              border: "1px solid #86EFAC",
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
            }}
          >
            ردیف خروج اضطراری
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Seat-number parsing / cabin geometry
// ---------------------------------------------------------------------------

// Flight seats are "<row><column>" (12A); bus and train seats are a plain
// number. Splitting them this way lets one parser serve both.
function parseSeatNumber(seat) {
  const match = String(seat.seat_number).match(/^(\d+)\s*([A-Za-z]*)$/);
  if (!match) return { row: 0, col: String(seat.seat_number) };
  return { row: Number(match[1]), col: match[2].toUpperCase() };
}

/**
 * Real single-deck cabins put their aisles in a handful of well known
 * places — a 6-across row is 3+3, a 7-across row is 2+3+2, a 9-across row is
 * 3+3+3, and so on. Mapping widths to those layouts (instead of splitting
 * evenly into a fixed number of blocks) is what makes the map read like an
 * actual aircraft. Widths outside the table fall back to a single centre
 * aisle.
 */
const CABIN_CONFIGS = {
  1: [1],
  2: [1, 1],
  3: [2, 1],
  4: [2, 2],
  5: [3, 2],
  6: [3, 3],
  7: [2, 3, 2],
  8: [2, 4, 2],
  9: [3, 3, 3],
  10: [3, 4, 3],
};

function cabinBlocks(width) {
  if (CABIN_CONFIGS[width]) return CABIN_CONFIGS[width];
  const half = Math.ceil(width / 2);
  return [half, width - half].filter((size) => size > 0);
}

/** Splits a flat list of columns/seats into the blocks either side of the aisles. */
function toBlocks(items, blockSizes) {
  const blocks = [];
  let cursor = 0;
  for (const size of blockSizes) {
    blocks.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return blocks;
}

/**
 * Turns one cabin class's seats into a grid: the column letters it uses and
 * one entry per row, with `null` wherever that row is missing a column so
 * every row stays aligned under the same letter.
 */
function buildCabin(seats) {
  const columns = [
    ...new Set(seats.map((seat) => parseSeatNumber(seat).col)),
  ].sort();

  const seatsByRow = new Map();
  for (const seat of seats) {
    const { row, col } = parseSeatNumber(seat);
    if (!seatsByRow.has(row)) seatsByRow.set(row, new Map());
    seatsByRow.get(row).set(col, seat);
  }

  const rows = [...seatsByRow.keys()]
    .sort((a, b) => a - b)
    .map((rowNumber) => ({
      rowNumber,
      seats: columns.map((col) => seatsByRow.get(rowNumber).get(col) ?? null),
    }));

  return { columns, rows };
}

// ---------------------------------------------------------------------------
// Flight cabin
// ---------------------------------------------------------------------------

function CabinAmenityBar({ children }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        justifyContent: "center",
        alignItems: "center",
        py: 1,
        bgcolor: "#EEF2F7",
        borderBlock: "1px dashed #D6DDE7",
        color: "text.secondary",
      }}
    >
      {children}
    </Stack>
  );
}

function Amenity({ icon, label }) {
  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        alignItems: "center",
      }}
    >
      {icon}
      <Typography variant="caption">{label}</Typography>
    </Stack>
  );
}

function ExitMarker({ side }) {
  return (
    <Stack
      direction="row"
      spacing={0.25}
      sx={{
        alignItems: "center",
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [side]: 4,
        px: 0.5,
        borderRadius: 0.75,
        bgcolor: "#16A34A",
        color: "#fff",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: ".04em",
      }}
    >
      <MeetingRoomIcon sx={{ fontSize: 11 }} />
      <Box component="span">EXIT</Box>
    </Stack>
  );
}

/**
 * One class section of the cabin: a heading, the seat-letter header, and the
 * rows themselves. Premium classes are rendered with bigger seats and wider
 * gaps, which is what actually distinguishes them on a real seat map.
 */
function CabinSection({ cls, seats, selectedSeatIds, onToggleSeat, isWidest }) {
  const { columns, rows } = buildCabin(seats);
  const blockSizes = cabinBlocks(columns.length);
  const columnBlocks = toBlocks(columns, blockSizes);

  const premium = cls === "first" || cls === "business";
  const seatSize = premium ? { xs: 34, sm: 42 } : { xs: 28, sm: 34 };
  const seatGap = premium ? 1 : 0.6;

  // Overwing exit rows sit roughly a third of the way down the longest
  // cabin, which is where they are on most narrow-bodies.
  const exitIndex =
    isWidest && rows.length > 6 ? Math.floor(rows.length / 3) : -1;
  const overWing =
    exitIndex >= 0
      ? new Set(
          rows.slice(exitIndex, exitIndex + 3).map((row) => row.rowNumber),
        )
      : new Set();

  const availableCount = seats.filter((seat) => seat.is_available).length;

  const rowGutter = (rowNumber, isExitRow) => (
    <Typography
      variant="caption"
      sx={{
        width: GUTTER,
        flexShrink: 0,
        textAlign: "center",
        fontWeight: isExitRow ? 700 : 400,
        color: isExitRow ? "success.dark" : "text.disabled",
      }}
    >
      {rowNumber}
    </Typography>
  );

  return (
    <Box sx={{ py: 2 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          mb: 1.5,
        }}
      >
        <Chip
          size="small"
          label={SEAT_CLASS_LABELS[cls] || cls}
          color={premium ? "primary" : "default"}
          sx={{ fontWeight: 700 }}
        />
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
          }}
        >
          {availableCount} صندلی خالی از {seats.length}
        </Typography>
      </Stack>

      <Stack
        spacing={seatGap}
        sx={{
          alignItems: "center",
        }}
      >
        {/* Seat-letter header, aligned to the seat columns below it */}
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            mb: 0.25,
          }}
        >
          <Box sx={{ width: GUTTER, flexShrink: 0 }} />
          {columnBlocks.map((block, blockIndex) => (
            <Stack
              key={blockIndex}
              direction="row"
              sx={{
                alignItems: "center",
              }}
            >
              <Stack direction="row" spacing={seatGap}>
                {block.map((col) => (
                  <Typography
                    key={col}
                    variant="caption"
                    sx={{
                      width: seatSize,
                      textAlign: "center",
                      fontWeight: 700,
                      color: "text.disabled",
                    }}
                  >
                    {col}
                  </Typography>
                ))}
              </Stack>
              {blockIndex < columnBlocks.length - 1 && (
                <Box sx={{ width: AISLE, flexShrink: 0 }} />
              )}
            </Stack>
          ))}
          <Box sx={{ width: GUTTER, flexShrink: 0 }} />
        </Stack>

        {rows.map((row, rowIndex) => {
          const isExitRow = rowIndex === exitIndex;
          const isOverWing = overWing.has(row.rowNumber);
          const seatBlocks = toBlocks(row.seats, blockSizes);

          return (
            <Box
              key={row.rowNumber}
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                borderRadius: 1,
                px: 0.5,
                py: isExitRow ? 0.75 : 0,
                mt: isExitRow ? 1 : 0,
                bgcolor: isExitRow
                  ? "#DCFCE7"
                  : isOverWing
                    ? "#EEF2F7"
                    : "transparent",
              }}
            >
              {isExitRow && <ExitMarker side="left" />}
              {isExitRow && <ExitMarker side="right" />}

              {rowGutter(row.rowNumber, isExitRow)}

              {seatBlocks.map((block, blockIndex) => (
                <Stack
                  key={blockIndex}
                  direction="row"
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Stack direction="row" spacing={seatGap}>
                    {block.map((seat, seatIndex) =>
                      seat ? (
                        <Seat
                          key={seat.id}
                          size={seatSize}
                          label={parseSeatNumber(seat).col}
                          title={`صندلی ${seat.seat_number} — ${
                            SEAT_CLASS_LABELS[seat.seat_class] ||
                            seat.seat_class
                          }${seat.is_available ? "" : " (رزرو شده)"}`}
                          selected={selectedSeatIds.includes(seat.id)}
                          booked={!seat.is_available}
                          onClick={() => onToggleSeat(seat.id)}
                        />
                      ) : (
                        <SeatGap key={seatIndex} size={seatSize} />
                      ),
                    )}
                  </Stack>
                  {blockIndex < seatBlocks.length - 1 && (
                    <Box sx={{ width: AISLE, flexShrink: 0 }} />
                  )}
                </Stack>
              ))}

              {rowGutter(row.rowNumber, isExitRow)}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

/**
 * The full aircraft: a fuselage shell with a rounded nose and tail, a galley
 * and lavatory bar behind the cockpit, then one section per cabin class
 * running front to back.
 *
 * The map is rendered `dir="ltr"` on purpose — a cabin diagram is read the
 * same way in every language (seat A on one side, F on the other), and
 * letting it flip with the surrounding RTL page would mirror the aircraft.
 */
export function FlightSeatMap({ seatsByClass, selectedSeatIds, onToggleSeat }) {
  const classes = SEAT_CLASS_ORDER.filter((cls) => seatsByClass[cls]?.length);
  if (classes.length === 0) return null;

  const widest = classes.reduce((longest, cls) =>
    seatsByClass[cls].length > seatsByClass[longest].length ? cls : longest,
  );

  return (
    <Box sx={{ overflowX: "auto", pb: 1 }}>
      <Box
        dir="ltr"
        sx={{
          minWidth: "max-content",
          mx: "auto",
          border: "2px solid",
          borderColor: HULL_BORDER,
          borderRadius: "50% 50% 24px 24px / 90px 90px 24px 24px",
          bgcolor: HULL_BG,
          overflow: "hidden",
        }}
      >
        {/* Nose / cockpit */}
        <Stack
          spacing={0.25}
          sx={{
            alignItems: "center",
            pt: 3,
            pb: 1.5,
          }}
        >
          <FlightIcon
            sx={{ color: "text.disabled", transform: "rotate(-45deg)" }}
          />
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 700,
            }}
          >
            جلوی هواپیما
          </Typography>
        </Stack>

        <CabinAmenityBar>
          <Amenity
            icon={<LocalCafeIcon sx={{ fontSize: 15 }} />}
            label="آشپزخانه"
          />
          <Amenity
            icon={<WcIcon sx={{ fontSize: 15 }} />}
            label="سرویس بهداشتی"
          />
        </CabinAmenityBar>

        <Box sx={{ px: { xs: 1.5, sm: 3 }, bgcolor: CABIN_BG }}>
          {classes.map((cls, index) => (
            <Box
              key={cls}
              sx={{
                borderBottom:
                  index < classes.length - 1 ? "1px dashed #D6DDE7" : "none",
              }}
            >
              <CabinSection
                cls={cls}
                seats={seatsByClass[cls]}
                selectedSeatIds={selectedSeatIds}
                onToggleSeat={onToggleSeat}
                isWidest={cls === widest}
              />
            </Box>
          ))}
        </Box>

        <CabinAmenityBar>
          <Amenity
            icon={<WcIcon sx={{ fontSize: 15 }} />}
            label="سرویس بهداشتی"
          />
        </CabinAmenityBar>

        {/* Tail */}
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 700,
            display: "block",
            textAlign: "center",
            py: 1.5,
          }}
        >
          عقب هواپیما
        </Typography>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Bus / coach cabin
// ---------------------------------------------------------------------------

function seatSortValue(seat) {
  const parsed = parseInt(String(seat.seat_number).replace(/\D/g, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// An Iranian VIP coach is laid out 2+1: a pair of seats down the kerb side,
// the aisle, then a single seat on the driver's side. Seats are numbered
// front to back, so chunking the sorted list three at a time reproduces the
// real floor plan.
function buildCoachRows(seats) {
  const sorted = [...seats].sort((a, b) => seatSortValue(a) - seatSortValue(b));

  const rows = [];
  for (let i = 0; i < sorted.length; i += 3) {
    rows.push(sorted.slice(i, i + 3));
  }
  return rows;
}

export function BusSeatMap({ seats, selectedSeatIds, onToggleSeat }) {
  const rows = buildCoachRows(seats);
  if (rows.length === 0) return null;

  const seatSize = { xs: 34, sm: 40 };

  function renderSeat(seat) {
    if (!seat) return <SeatGap size={seatSize} />;

    return (
      <Seat
        size={seatSize}
        label={seat.seat_number}
        title={`صندلی ${seat.seat_number}${seat.is_available ? "" : " (رزرو شده)"}`}
        selected={selectedSeatIds.includes(seat.id)}
        booked={!seat.is_available}
        onClick={() => onToggleSeat(seat.id)}
      />
    );
  }

  return (
    <Box sx={{ overflowX: "auto", pb: 1 }}>
      <Box
        dir="ltr"
        sx={{
          minWidth: "max-content",
          mx: "auto",
          border: "2px solid",
          borderColor: HULL_BORDER,
          borderRadius: "28px 28px 12px 12px",
          bgcolor: HULL_BG,
          overflow: "hidden",
        }}
      >
        {/* Driver's cabin on the left, boarding door on the kerb side */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
            py: 1.25,
            bgcolor: "#EEF2F7",
            borderBottom: "1px dashed #D6DDE7",
            color: "text.secondary",
          }}
        >
          <Amenity
            icon={<DirectionsBusIcon sx={{ fontSize: 16 }} />}
            label="راننده"
          />
          <Amenity
            icon={<MeetingRoomIcon sx={{ fontSize: 16 }} />}
            label="درب ورود"
          />
        </Stack>

        <Stack
          spacing={0.75}
          sx={{
            alignItems: "center",
            px: { xs: 1.5, sm: 3 },
            py: 2,
            bgcolor: CABIN_BG,
          }}
        >
          {rows.map((row, rowIndex) => (
            <Stack
              key={rowIndex}
              direction="row"
              sx={{
                alignItems: "center",
              }}
            >
              {/* single seat, driver's side */}
              {renderSeat(row[2])}

              <Box sx={{ width: { xs: 24, sm: 34 }, flexShrink: 0 }} />

              {/* pair of seats, kerb side */}
              <Stack direction="row" spacing={0.75}>
                {renderSeat(row[0])}
                {renderSeat(row[1])}
              </Stack>
            </Stack>
          ))}
        </Stack>

        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 700,
            display: "block",
            textAlign: "center",
            py: 1.25,
            bgcolor: "#EEF2F7",
            borderTop: "1px dashed #D6DDE7",
          }}
        >
          عقب اتوبوس
        </Typography>
      </Box>
    </Box>
  );
}
