import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Box, Typography } from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import PaymentsIcon from "@mui/icons-material/Payments";
import BusinessIcon from "@mui/icons-material/Business";
import PercentIcon from "@mui/icons-material/Percent";
import PersonIcon from "@mui/icons-material/Person";

import { userApi, bookingApi, ticketApi, paymentApi } from "../../api";
import { ROUTES } from "../../utils/routes";
import { formatPrice } from "../../utils/formatPrice";
import useDocumentTitle from "../../hooks/useDocumentTitle";

import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";
import Card from "../../components/common/Card";
import Loading from "../../components/common/Loading";

const QUICK_LINKS = [
  { label: "کاربران", icon: PeopleIcon, route: ROUTES.USERS },
  { label: "ارائه‌دهندگان", icon: BusinessIcon, route: ROUTES.PROVIDERS },
  {
    label: "تیکت‌ها",
    icon: ConfirmationNumberIcon,
    route: ROUTES.ADMIN_TICKETS,
  },
  { label: "رزروها", icon: BookOnlineIcon, route: ROUTES.ADMIN_BOOKINGS },
  { label: "پرداخت‌ها", icon: PaymentsIcon, route: ROUTES.PAYMENTS },
  { label: "تخفیفات", icon: PercentIcon, route: ROUTES.DISCOUNTS },
  { label: "حساب کاربری", icon: PersonIcon, route: ROUTES.ADMIN },
];

// GET /users, /bookings, /tickets and /payments all respond 404 for an
// empty result set rather than an empty array (see Backend/index.js), so
// each fetch is treated as "0 rows" on a 404 instead of a real failure.
async function fetchCount(promise) {
  try {
    const { data } = await promise;
    return data;
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
}

export default function Dashboard() {
  useDocumentTitle("داشبورد مدیریت | پنل مدیریت");
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: 0,
    bookings: 0,
    activeTickets: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);

    const [users, bookings, tickets, payments] = await Promise.all([
      fetchCount(userApi.getUsers()),
      fetchCount(bookingApi.getBookings({})),
      fetchCount(ticketApi.getTickets({})),
      fetchCount(paymentApi.getPayments()),
    ]);

    setStats({
      users: users.length,
      bookings: bookings.length,
      activeTickets: tickets.filter((t) => t.status !== "cancelled").length,
      revenue: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    });

    setLoading(false);
  }

  const statCards = [
    { label: "تعداد کاربران", value: stats.users, icon: PeopleIcon },
    { label: "تعداد رزروها", value: stats.bookings, icon: BookOnlineIcon },
    {
      label: "تیکت‌های فعال",
      value: stats.activeTickets,
      icon: ConfirmationNumberIcon,
    },
    {
      label: "درآمد کل",
      value: formatPrice(stats.revenue),
      icon: PaymentsIcon,
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="داشبورد مدیریت" subtitle="نمای کلی سیستم رزرو بلیط" />

      {loading ? (
        <Loading message="در حال بارگذاری آمار..." />
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 4 }}>
          {statCards.map((s) => (
            <Box key={s.label} sx={{ flex: "1 1 200px" }}>
              <Card>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      minWidth: 44,
                      borderRadius: "50%",
                      bgcolor: "#E8F1FF",
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <s.icon />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                      }}
                    >
                      {s.label}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      {s.value}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 2,
        }}
      >
        دسترسی سریع
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {QUICK_LINKS.map((link) => (
          <Box key={link.route} sx={{ flex: "1 1 160px" }}>
            <Box
              onClick={() => navigate(link.route)}
              sx={{
                cursor: "pointer",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                textAlign: "center",
                transition: "all .15s ease",
                "&:hover": { borderColor: "primary.main", bgcolor: "#F6F9FD" },
              }}
            >
              <link.icon color="primary" />
              <Typography
                sx={{
                  fontWeight: 600,
                }}
              >
                {link.label}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </PageContainer>
  );
}
