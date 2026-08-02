import { useNavigate } from "react-router";
import { Box, Typography } from "@mui/material";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";

import useDocumentTitle from "../../hooks/useDocumentTitle";
import { ROUTES } from "../../utils/routes";

import Button from "../../components/common/Button";

export default function NotFound() {
  useDocumentTitle("صفحه یافت نشد | سیستم رزرو بلیط");
  const navigate = useNavigate();

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 2,
        py: 8,
      }}
    >
      <Box
        sx={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          bgcolor: "#E8F1FF",
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <SentimentDissatisfiedIcon sx={{ fontSize: 48 }} />
      </Box>

      <Typography variant="h2" fontWeight={700} color="primary.main" mb={1}>
        404
      </Typography>

      <Typography variant="h6" fontWeight={700} mb={1}>
        صفحه مورد نظر یافت نشد
      </Typography>

      <Typography color="text.secondary" mb={4} sx={{ maxWidth: 420 }}>
        صفحه‌ای که به دنبال آن هستید وجود ندارد یا جابه‌جا شده است.
      </Typography>

      <Button onClick={() => navigate(ROUTES.HOME)}>
        بازگشت به صفحه اصلی
      </Button>
    </Box>
  );
}
