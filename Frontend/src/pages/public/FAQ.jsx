import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import FlightIcon from "@mui/icons-material/Flight";
import TrainIcon from "@mui/icons-material/Train";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import TourIcon from "@mui/icons-material/Tour";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

import useDocumentTitle from "../../hooks/useDocumentTitle";
import SearchBar from "../../components/common/SearchBar";
import CardBox from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";

// Each category's questions live here. Add/edit freely — the page just
// loops over whatever is in this object, nothing else needs to change.
const FAQ_DATA = {
  users: {
    label: "سوالات کاربران",
    icon: <PersonIcon fontSize="small" />,
    items: [
      {
        q: "چگونه در سایت ثبت نام کنم؟",
        a: "از طریق دکمه «ورود به حساب کاربری» در بالای صفحه وارد شوید و گزینه ثبت نام را انتخاب کنید. با وارد کردن نام کاربری، رمز عبور و اطلاعات هویتی خود می‌توانید در چند ثانیه حساب کاربری بسازید.",
      },
      {
        q: "رمز عبور خود را فراموش کرده‌ام، چه کار کنم؟",
        a: "در حال حاضر تغییر رمز عبور از داخل پروفایل کاربری امکان‌پذیر است. در صورتی که به حساب خود دسترسی ندارید، از طریق بخش پشتیبانی با ما در تماس باشید تا کمکتان کنیم.",
      },
      {
        q: "چطور اطلاعات حساب کاربری خود مثل شماره تماس یا ایمیل را تغییر دهم؟",
        a: "پس از ورود به حساب کاربری، از منوی داشبورد وارد بخش «پروفایل» شوید. در این صفحه می‌توانید نام، نام خانوادگی، ایمیل و شماره تماس خود را ویرایش و ذخیره کنید.",
      },
      {
        q: "چگونه رزروهای قبلی خود را مشاهده کنم؟",
        a: "از داشبورد کاربری، وارد بخش «رزروهای من» شوید. لیست تمام رزروهای فعال و لغو شده شما همراه با جزئیات هر سفر نمایش داده می‌شود.",
      },
      {
        q: "آیا از تغییرات رزروهایم اعلان دریافت می‌کنم؟",
        a: "بله. هر بار که رزروی تایید یا لغو شود، یک اعلان در بخش «اعلان‌ها» در داشبورد شما ثبت می‌شود.",
      },
      {
        q: "آیا اطلاعات پرداخت من در سایت ذخیره می‌شود؟",
        a: "خیر، اطلاعات کارت بانکی شما در سامانه ما ذخیره نمی‌شود و تمام تراکنش‌ها از طریق درگاه پرداخت امن انجام می‌گیرد.",
      },
    ],
  },

  flight: {
    label: "پرواز",
    icon: <FlightIcon fontSize="small" />,
    items: [
      {
        q: "چطور بلیط هواپیما جستجو کنم؟",
        a: "از صفحه اصلی، تب «پرواز» را انتخاب کرده و مبدا، مقصد و تاریخ حرکت مورد نظر خود را وارد کنید. لیست پروازهای موجود به همراه قیمت نمایش داده می‌شود.",
      },
      {
        q: "چند ساعت قبل از پرواز باید در فرودگاه حاضر شوم؟",
        a: "برای پروازهای داخلی حداقل ۲ ساعت  قبل از زمان پرواز در فرودگاه حضور داشته باشید تا مراحل پذیرش را انجام دهید.",
      },
      {
        q: "آیا می‌توانم صندلی مشخصی را برای پرواز خود انتخاب کنم؟",
        a: "بله، در مرحله رزرو نقشه صندلی‌های موجود پرواز نمایش داده می‌شود و می‌توانید صندلی دلخواه خود را از بین کلاس‌های اکونومی، بیزینس یا فرست انتخاب کنید.",
      },
      {
        q: "چطور بلیط پرواز خود را لغو کنم؟",
        a: "از صفحه جزئیات رزرو، در صورتی که وضعیت رزرو «تایید شده» باشد، دکمه «لغو رزرو» در دسترس است. پس از لغو، صندلی شما آزاد شده و اعلان لغو برایتان ارسال می‌شود.",
      },
      {
        q: "آیا امکان رزرو بلیط رفت و برگشت وجود دارد؟",
        a: "بله، در فیلترهای جستجو می‌توانید نوع سفر را «رفت و برگشت» انتخاب کنید تا فقط پروازهایی که تاریخ بازگشت دارند نمایش داده شوند.",
      },
    ],
  },

  train: {
    label: "قطار",
    icon: <TrainIcon fontSize="small" />,
    items: [
      {
        q: "برای خرید بلیط قطار چه اطلاعاتی نیاز است؟",
        a: "کافیست مبدا، مقصد و تاریخ حرکت را در جستجوی بلیط قطار وارد کنید. پس از انتخاب قطار مورد نظر، اطلاعات مسافران و صندلی را تکمیل نمایید.",
      },
      {
        q: "آیا می‌توانم کوپه یا کلاس خاصی از قطار را انتخاب کنم؟",
        a: "بله، هنگام رزرو می‌توانید از بین کلاس‌های موجود روی آن قطار (مانند اکونومی یا بیزینس) صندلی مورد نظر خود را انتخاب کنید.",
      },
      {
        q: "چند دقیقه قبل از حرکت قطار باید در ایستگاه باشم؟",
        a: "پیشنهاد می‌کنیم حداقل ۴۵ دقیقه قبل از ساعت حرکت درج شده در بلیط خود، در ایستگاه راه‌آهن حضور داشته باشید.",
      },
      {
        q: "در صورت لغو بلیط قطار، هزینه چگونه بازگردانده می‌شود؟",
        a: "پس از لغو رزرو از داشبورد کاربری، مبلغ بر اساس قوانین لغو مربوط به هر شرکت قطاری محاسبه و به کیف پول یا کارت بانکی شما بازگردانده می‌شود.",
      },
    ],
  },

  bus: {
    label: "اتوبوس",
    icon: <DirectionsBusIcon fontSize="small" />,
    items: [
      {
        q: "چطور بلیط اتوبوس بین شهری رزرو کنم؟",
        a: "از صفحه اصلی، تب «اتوبوس» را انتخاب کرده و مبدا، مقصد و تاریخ سفر را جستجو کنید. سپس شرکت اتوبوسرانی و صندلی دلخواه خود را انتخاب و رزرو را تکمیل نمایید.",
      },
      {
        q: "آیا امکان انتخاب صندلی روی اتوبوس وجود دارد؟",
        a: "بله، نقشه صندلی‌های اتوبوس هنگام رزرو نمایش داده می‌شود و می‌توانید صندلی خالی مورد نظر خود را انتخاب کنید.",
      },
      {
        q: "چقدر زودتر از حرکت اتوبوس باید در ترمینال باشم؟",
        a: "توصیه می‌شود حداقل ۳۰ دقیقه قبل از ساعت حرکت در ترمینال حضور داشته باشید تا مشکلی برای سوار شدن پیش نیاید.",
      },
      {
        q: "آیا می‌توانم بلیط اتوبوس را برای چند مسافر با هم رزرو کنم؟",
        a: "بله، در مرحله انتخاب صندلی می‌توانید چند صندلی را همزمان انتخاب کرده و اطلاعات هر مسافر را جداگانه وارد کنید.",
      },
    ],
  },

  tour: {
    label: "تور",
    icon: <TourIcon fontSize="small" />,
    items: [
      {
        q: "چطور می‌توانم تور مسافرتی رزرو کنم؟",
        a: "از صفحه اصلی، تب «تور» را انتخاب کرده و مقصد یا تاریخ مورد نظر خود را جستجو کنید. همچنین می‌توانید از بخش «تورهای پیشنهادی» یکی از مقاصد را انتخاب و تورهای مربوط به آن را ببینید.",
      },
      {
        q: "آیا تورها شامل تاریخ بازگشت هم می‌شوند؟",
        a: "بله، تورها همیشه دارای تاریخ رفت و برگشت مشخص هستند و این اطلاعات هنگام جستجو و رزرو نمایش داده می‌شود.",
      },
      {
        q: "در صورت انصراف از تور، آیا امکان بازگشت وجه وجود دارد؟",
        a: "در صورت لغو رزرو تور از داشبورد کاربری، مطابق با قوانین کنسلی آژانس مربوطه، مبلغ قابل بازگشت محاسبه و برای شما اطلاع‌رسانی می‌شود.",
      },
      {
        q: "هزینه تور شامل چه مواردی می‌شود؟",
        a: "هزینه نمایش داده شده برای هر تور بر اساس اطلاعات ثبت‌شده توسط آژانس گردشگری است. برای جزئیات دقیق خدمات هر تور، به صفحه جزئیات همان تور مراجعه کنید.",
      },
    ],
  },
};

const CATEGORY_ORDER = ["users", "bus", "flight", "train", "tour"];

export default function FAQ() {
  useDocumentTitle("سوالات متداول | سیستم رزرو بلیط");

  const [activeCategory, setActiveCategory] = useState("users");
  const [search, setSearch] = useState("");

  const isSearching = search.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];

    const term = search.trim().toLowerCase();

    return CATEGORY_ORDER.flatMap((key) =>
      FAQ_DATA[key].items
        .filter(
          (item) =>
            item.q.toLowerCase().includes(term) ||
            item.a.toLowerCase().includes(term),
        )
        .map((item) => ({ ...item, category: FAQ_DATA[key].label })),
    );
  }, [search, isSearching]);

  const activeItems = FAQ_DATA[activeCategory].items;

  return (
    <Box dir="rtl">
      {/* Hero */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #0653C4 0%, #2A7BFF 60%, #5B8CFF 100%)",
          py: { xs: 5, md: 7 },
          px: 2,
        }}
      >
        <Box sx={{ maxWidth: 720, mx: "auto", textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} sx={{ color: "#fff", mb: 1 }}>
            سوالات متداول
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,.85)", mb: 3 }}>
            پیش از تماس با پشتیبانی، پاسخ سوال خود را اینجا جستجو کنید
          </Typography>

          <Box sx={{ bgcolor: "background.paper", borderRadius: 3, p: 0.5 }}>
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="سوال خود را جستجو کنید..."
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 820, mx: "auto", px: { xs: 2, md: 3 }, py: 5 }}>
        {isSearching ? (
          <>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              نتایج جستجو برای «{search}»
            </Typography>

            {searchResults.length === 0 ? (
              <EmptyState
                title="نتیجه‌ای یافت نشد"
                description="با عبارت دیگری جستجو کنید یا یکی از دسته‌بندی‌های زیر را انتخاب کنید."
              />
            ) : (
              <Stack spacing={1.5}>
                {searchResults.map((item, index) => (
                  <Accordion key={`${item.category}-${index}`} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack sx={{ width: "100%" }}>
                        <Typography fontWeight={600}>{item.q}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.category}
                        </Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography color="text.secondary">{item.a}</Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            )}
          </>
        ) : (
          <>
            {/* Category tabs */}
            <Tabs
              value={activeCategory}
              onChange={(_, value) => setActiveCategory(value)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                mb: 3,
                borderBottom: "1px solid #E2E8F0",
                "& .MuiTab-root": { fontWeight: 600, minHeight: 56 },
              }}
            >
              {CATEGORY_ORDER.map((key) => (
                <Tab
                  key={key}
                  value={key}
                  icon={FAQ_DATA[key].icon}
                  iconPosition="start"
                  label={FAQ_DATA[key].label}
                />
              ))}
            </Tabs>

            <Stack spacing={1.5}>
              {activeItems.map((item, index) => (
                <Accordion key={index} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>{item.q}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color="text.secondary">{item.a}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </>
        )}

        {/* Support box */}
        <Box mt={5}>
          <CardBox>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <SupportAgentIcon color="primary" fontSize="large" />
                <Box>
                  <Typography fontWeight={700}>
                    پاسخ سوال خود را پیدا نکردید؟
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    پشتیبانی ما آماده پاسخگویی به شماست.
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                component="a"
                href="https://mail.google.com/mail/?view=cm&fs=1&to=tickisupport@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "primary.main", textDecoration: "none" }}
              >
                <EmailOutlinedIcon fontSize="small" />
                <Typography fontWeight={600}>tickisupport@gmail.com</Typography>
              </Stack>
            </Stack>
          </CardBox>
        </Box>
      </Box>
    </Box>
  );
}
