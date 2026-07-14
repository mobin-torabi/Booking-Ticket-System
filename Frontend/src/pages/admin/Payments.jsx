import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  Typography,
} from "@mui/material";

import { paymentApi, discountApi } from "../../api";

import usePagination from "../../hooks/usePagination";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { truncate } from "../../utils/helpers";
import { formatPrice } from "../../utils/formatPrice";

import { formatDateTime } from "../../utils/formatDate";
import { showError } from "../../utils/toast";
import JalaliDatePicker from "../../components/common/Jalalidatepicker";

import PageHeader from "../../components/common/PageHeader";
import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Pagination from "../../components/common/Pagination";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";

const PAID_OPTIONS = [
  { value: "", label: "همه پرداخت‌ ها" },
  { value: "true", label: "پرداخت‌ شده" },
  { value: "false", label: "در انتظار پرداخت" },
];

export default function Payments() {
  useDocumentTitle("مدیریت پرداخت‌ها | پنل مدیریت");

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paidFilter, setPaidFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [discountCodes, setDiscountCodes] = useState({});

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (paidFilter) params.paid = paidFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const { data } = await paymentApi.getPayments(params);
      setPayments(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setPayments([]);
      } else {
        setError(err.response?.data?.error || "خطا در دریافت پرداخت‌ ها");
      }
    } finally {
      setLoading(false);
    }
  }, [paidFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const { page, setPage, totalPages, currentData } = usePagination(
    payments,
    10,
  );

  useEffect(() => {
    setPage(1);
  }, [paidFilter, dateFrom, dateTo, setPage]);

  useEffect(() => {
    async function loadDiscountCodes() {
      const codes = {};

      for (const payment of payments) {
        if (payment.discount_id) {
          try {
            const discount = await discountApi.getDiscount(payment.discount_id);
            codes[payment.discount_id] = discount.data.code;
          } catch (error) {}
        }
      }

      setDiscountCodes(codes);
    }

    loadDiscountCodes();
  }, [payments]);

  const stats = useMemo(() => {
    const paid = payments.filter((p) => p.paid_at);
    const totalAmount = paid.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      total: payments.length,
      paidCount: paid.length,
      pendingCount: payments.length - paid.length,
      totalAmount,
    };
  }, [payments]);

  function clearFilters() {
    setPaidFilter("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <Box sx={{ p: 1, mb: 2 }}>
      <PageHeader
        title="مدیریت پرداخت‌ها"
        subtitle={`مجموع ${payments.length} پرداخت`}
      />

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
          mt: 3,
        }}
      >
        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <Typography variant="body2" color="text.secondary">
              تعداد کل پرداخت‌ ها
            </Typography>
            <Typography variant="h5">{stats.total}</Typography>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <Typography variant="body2" color="text.secondary">
              پرداخت‌شده / در انتظار
            </Typography>
            <Typography variant="h5">
              {stats.paidCount} / {stats.pendingCount}
            </Typography>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <Typography variant="body2" color="text.secondary">
              مجموع مبلغ دریافتی
            </Typography>
            <Typography variant="h5">
              {formatPrice(stats.totalAmount)}
            </Typography>
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={{ width: { xs: "100%", sm: 200 } }}>
          <Select
            label="وضعیت پرداخت"
            value={paidFilter}
            onChange={(e) => setPaidFilter(e.target.value)}
            options={PAID_OPTIONS}
          />
        </Box>

        <Box sx={{ width: { xs: "100%", sm: 180 } }}>
          <JalaliDatePicker
            label="از تاریخ"
            value={dateFrom}
            onChange={(isoDate) =>
              setDateFrom(isoDate)
            }
          />
        </Box>

        <Box sx={{ width: { xs: "100%", sm: 180 } }}>
          <JalaliDatePicker
            label="تا تاریخ"
            value={dateTo}
            onChange={(isoDate) =>
              setDateTo(isoDate)
            }
          />
        </Box>

        <Button variant="outlined" onClick={clearFilters}>
          پاک کردن فیلترها
        </Button>
      </Box>

      {loading && <Loading message="در حال بارگذاری پرداخت‌ها..." />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && payments.length === 0 && (
        <EmptyState
          title="پرداختی یافت نشد"
          description="با معیارهای جستجوی فعلی هیچ پرداختی پیدا نشد."
        />
      )}

      {!loading && !error && payments.length > 0 && (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>شناسه پرداخت</TableCell>
                  <TableCell>شناسه رزرو</TableCell>
                  <TableCell>مبلغ</TableCell>
                  <TableCell>تخفیف اعمال‌ شده</TableCell>
                  <TableCell>تاریخ پرداخت</TableCell>
                  <TableCell>وضعیت</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {currentData.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ direction: "ltr", textAlign: "center" }}>
                      <Tooltip title={p.id}>
                        <span>{truncate(p.id, 8)}</span>
                      </Tooltip>
                    </TableCell>

                    <TableCell sx={{ direction: "ltr", textAlign: "center" }}>
                      <Tooltip title={p.booking_id}>
                        <span>{truncate(p.booking_id, 8)}</span>
                      </Tooltip>
                    </TableCell>

                    <TableCell>{formatPrice(p.amount)}</TableCell>

                    <Tooltip
                      title={
                        p.discount_id
                          ? `شناسه تخفیف: ${discountCodes[p.discount_id] || "در حال بارگذاری..."}`
                          : ""
                      }
                    >
                      <TableCell>
                        {p.discount_id ? (
                          <Chip
                            size="small"
                            label="تخفیف اعمال شده"
                            color="secondary"
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </Tooltip>

                    <TableCell>
                      {p.paid_at ? formatDateTime(p.paid_at) : "—"}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={p.paid_at ? "پرداخت‌ شده" : "در انتظار پرداخت"}
                        color={p.paid_at ? "success" : "warning"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
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
  );
}
