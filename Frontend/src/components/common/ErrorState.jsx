import { Box, Stack, Typography } from "@mui/material";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";

export default function ErrorState({ message = "مشکلی پیش آمده است." }) {
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
          bgcolor: "#FEF2F2",
          color: "error.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ErrorOutlinedIcon fontSize="large" />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        خطا
      </Typography>

      <Typography sx={{ color: "text.secondary", maxWidth: 420 }}>
        {message}
      </Typography>
    </Stack>
  );
}
