import { useEffect, useState } from "react";
import {
  Container,
  Box,
  Stack,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import NotificationsIcon from "@mui/icons-material/Notifications";
import RefreshIcon from "@mui/icons-material/Refresh";

import { getNotifications } from "../../api/notificationApi";

import { useAuth } from "../../context/AuthContext";

import useDocumentTitle from "../../hooks/useDocumentTitle";

<<<<<<< HEAD
import { formatDateTime} from "../../utils/formatDate";
=======
import { formatDateTime } from "../../utils/formatDate";
>>>>>>> ca85fe99604bf0c872470b33d0263ee75e74aa34
import { showError } from "../../utils/toast";

import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";

// Meta data (label / color / icon) for each notification type coming from the DB
const NOTIFICATION_META = {
  confirmation: {
    label: "تایید رزرو",
    color: "success",
    icon: <CheckCircleIcon fontSize="small" />,
  },
  cancellation: {
    label: "لغو رزرو",
    color: "error",
    icon: <CancelIcon fontSize="small" />,
  },
};

function getMeta(type) {
  return (
    NOTIFICATION_META[type] ?? {
      label: "اعلان",
      color: "primary",
      icon: <NotificationsIcon fontSize="small" />,
    }
  );
}

export default function Notifications() {
  useDocumentTitle("اعلان‌ها | سیستم رزرو بلیط");

  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      setError(false);

      const { data } = await getNotifications(user.id);

      const sorted = [...data].sort(
        (a, b) => new Date(b.sent_at) - new Date(a.sent_at),
      );

      setNotifications(sorted);
    } catch (err) {
      console.error(err);
      setError(true);
      showError(err.response?.data?.error ?? "خطا در دریافت اعلان‌ها");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ pt: { xs: 12, md: 14 }, pb: 6 }}>
      <PageHeader
        title="اعلان‌ها"
        actions={
          <Tooltip title="بروزرسانی">
            <span>
              <IconButton
                color="primary"
                onClick={fetchNotifications}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        }
      />

      {loading && <Loading message="در حال دریافت اعلان‌ها..." />}

      {!loading && error && (
        <ErrorState message="خطا در دریافت اعلان‌ها. لطفا دوباره تلاش کنید." />
      )}

      {!loading && !error && notifications.length === 0 && (
        <EmptyState
          title="اعلانی وجود ندارد"
          description="در حال حاضر هیچ اعلانی برای شما ثبت نشده است."
        />
      )}

      {!loading && !error && notifications.length > 0 && (
        <Stack spacing={2}>
          {notifications.map((notification) => {
            const meta = getMeta(notification.type);
            // console.log(notification.sent_at);

            return (
              <Card key={notification.id}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar
                    sx={{
                      bgcolor: `${meta.color}.main`,
                      flexShrink: 0,
                    }}
                  >
                    {meta.icon}
                  </Avatar>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      flexWrap="wrap"
                      rowGap={1}
                    >
                      <Chip
                        size="small"
                        label={meta.label}
                        color={meta.color}
                      />

<<<<<<< HEAD
                      <Typography variant="caption" color="text.secondary" sx={{ml:"auto"}}>
=======
                      <Typography variant="caption" color="text.secondary">
>>>>>>> ca85fe99604bf0c872470b33d0263ee75e74aa34
                        {formatDateTime(notification.sent_at)}
                      </Typography>
                    </Stack>

                    <Typography sx={{ mt: 1, wordBreak: "break-word" }}>
                      {notification.content || "بدون توضیحات"}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
}
