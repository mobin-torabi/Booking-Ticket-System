import { Box, Typography } from "@mui/material";
export default function HeaderLogo(){
    return (
<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
  <Typography
    sx={{
      fontFamily: "'Peyda', 'Vazirmatn', sans-serif",
      fontWeight: 800,
      fontSize: "2rem",
      lineHeight: 1,
      background: "linear-gradient(90deg, #4F46E5 0%, #0A4AA8 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      letterSpacing: "0.03em",
    }}
  >
    تیکی
  </Typography>

  <Typography
    sx={{
      mt: 0.3,
      fontFamily: "'Vazirmatn', sans-serif",
      fontSize: "0.8rem",
      color: "text.secondary",
      letterSpacing: "0.08em",
    }}
  >
    سفر، ساده‌تر از همیشه
  </Typography>
</Box>)}