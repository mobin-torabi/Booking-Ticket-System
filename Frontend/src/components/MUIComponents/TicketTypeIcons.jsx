import AirplanemodeActiveIcon from "@mui/icons-material/AirplanemodeActive";
import SubwayIcon from "@mui/icons-material/Subway";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import LuggageIcon from "@mui/icons-material/Luggage";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";

/*
Maps a ticket_types.name value (e.g. "هواپیما", "قطار") to a matching icon.
Works for any name coming from the API, not just the four defaults used by
SimpleBottomNavigation, so it stays correct even if the seed data changes.

Usage:
    getTicketTypeIcon(ticket.ticket_type)
    getTicketTypeIcon(ticket.ticket_type, { fontSize: "small" })
*/
export function getTicketTypeIcon(name = "", props = {}) {
  if (name.includes("هواپیما") || name.includes("پرواز"))
    return <AirplanemodeActiveIcon {...props} />;

  if (name.includes("قطار")) return <SubwayIcon {...props} />;

  if (name.includes("اتوبوس")) return <DirectionsBusIcon {...props} />;

  if (name.includes("تور")) return <LuggageIcon {...props} />;

  return <ConfirmationNumberIcon {...props} />;
}
