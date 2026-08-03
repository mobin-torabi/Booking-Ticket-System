import { Box, Stack, Typography } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";

export default function EmptyState({
  title = "اطلاعاتی یافت نشد",
  description = "",
  action = null,
}) {
  return (
    <Stack
      spacing={1}
      sx={{ alignItems: "center", textAlign: "center", py: 8, px: 2 }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          mb: 1,
          borderRadius: "50%",
          bgcolor: "#EEF2F7",
          color: "text.disabled",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SearchOffIcon fontSize="large" />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>

      {description && (
        <Typography sx={{ color: "text.secondary", maxWidth: 420 }}>
          {description}
        </Typography>
      )}

      {action && <Box sx={{ pt: 1 }}>{action}</Box>}
    </Stack>
  );
}
