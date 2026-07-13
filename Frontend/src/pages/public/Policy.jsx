import { useState } from "react";
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
import GavelIcon from "@mui/icons-material/Gavel";
import FlightIcon from "@mui/icons-material/Flight";
import TrainIcon from "@mui/icons-material/Train";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import TourIcon from "@mui/icons-material/Tour";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

import useDocumentTitle from "../../hooks/useDocumentTitle";
import CardBox from "../../components/common/Card";

// Each category is a list of subsections, and each subsection is a numbered
// list of clauses. Add/edit freely — the page just loops over this object.
const POLICIES_DATA = {
  general: {
    label: "قوانین و مقررات عمومی",
    icon: <GavelIcon fontSize="small" />,
    sections: [
      {
        title: "پذیرش قوانین",
        clauses: [
          "استفاده از خدمات تیکی به منزله مطالعه و پذیرش کامل قوانین و مقررات این صفحه است.",
          "تیکی صرفاً واسط میان مسافر و شرکت‌های ارائه‌دهنده خدمات (ایرلاین‌ها، شرکت‌های قطار، شرکت‌های اتوبوسرانی و آژانس‌های گردشگری) است و مسئولیت اجرای خدمات سفر بر عهده همان شرکت‌ها می‌باشد.",
          "تیکی در هر زمان می‌تواند این قوانین را به‌روزرسانی کند. نسخه فعال قوانین همواره همین صفحه است.",
        ],
      },
      {
        title: "حساب کاربری",
        clauses: [
          "کاربر متعهد است اطلاعات هویتی، شماره تماس و ایمیل صحیح و متعلق به خود را در زمان ثبت‌نام وارد کند.",
          "حفظ محرمانگی نام کاربری و رمز عبور بر عهده کاربر است. تیکی مسئولیتی در قبال سوءاستفاده ناشی از افشای اطلاعات ورود توسط کاربر ندارد.",
          "هرگونه فعالیت انجام‌شده از طریق حساب کاربری، اعم از رزرو، لغو یا پرداخت، به نام صاحب حساب ثبت و پیگیری می‌شود.",
        ],
      },
      {
        title: "رزرو، پرداخت و بازگشت وجه",
        clauses: [
          "قیمت و موجودی صندلی نمایش داده‌شده تا لحظه تکمیل پرداخت، قطعی نبوده و ممکن است تغییر کند.",
          "پس از تایید پرداخت، رزرو نهایی شده و اعلان تایید برای کاربر ارسال می‌شود.",
          "بازگشت وجه رزروهای لغوشده مطابق با قوانین کنسلی مربوط به همان نوع بلیط (پرواز، قطار، اتوبوس یا تور) که در ادامه این صفحه آمده است، محاسبه می‌شود.",
          "در صورت بروز خطای فنی در فرآیند پرداخت که منجر به کسر وجه بدون ثبت رزرو شود، مبلغ حداکثر ظرف ۷۲ ساعت کاری به حساب کاربر بازگردانده خواهد شد.",
        ],
      },
      {
        title: "مسئولیت‌ها",
        clauses: [
          "صحت اطلاعات مسافران (نام، نام خانوادگی و شماره تماس) وارد شده در زمان رزرو بر عهده کاربر است.",
          "تیکی مسئولیتی در قبال تاخیر، لغو یا تغییر برنامه سفر از سوی شرکت‌های ارائه‌دهنده خدمات ندارد؛ در چنین مواردی مطابق با قوانین همان شرکت اقدام خواهد شد.",
          "هرگونه سوءاستفاده از محتوای سایت شامل متن، تصاویر و طراحی، پیگرد قانونی دارد.",
        ],
      },
    ],
  },

  flight: {
    label: "پرواز",
    icon: <FlightIcon fontSize="small" />,
    sections: [
      {
        title: "قوانین کنسلی و استرداد بلیط پرواز",
        clauses: [
          "بیش از ۲۴ ساعت مانده به پرواز: ۱۰ درصد مبلغ بلیط به‌عنوان جریمه کنسلی کسر می‌شود.",
          "بین ۱۲ تا ۲۴ ساعت مانده به پرواز: جریمه کنسلی ۳۰ درصد مبلغ بلیط است.",
          "کمتر از ۱۲ ساعت مانده به پرواز: جریمه کنسلی ۶۰ درصد مبلغ بلیط است.",
          "پس از زمان پرواز، امکان استرداد وجه وجود ندارد.",
          "در رزروهای رفت و برگشت، لغو هر مسیر به‌صورت مجزا و مطابق با قوانین بالا محاسبه می‌شود.",
        ],
      },
      {
        title: "نکات مهم پرواز",
        clauses: [
          "برای پروازهای داخلی حداقل ۲ ساعت و برای پروازهای خارجی حداقل ۳ ساعت قبل از پرواز در فرودگاه حاضر شوید.",
          "همراه داشتن مدارک هویتی معتبر برای تمام مسافران، از جمله کودکان، الزامی است.",
          "انتخاب صندلی در زمان رزرو صرفاً یک درخواست است و تخصیص نهایی صندلی بر عهده ایرلاین در روز پرواز است.",
        ],
      },
    ],
  },

  train: {
    label: "قطار",
    icon: <TrainIcon fontSize="small" />,
    sections: [
      {
        title: "قوانین کنسلی و استرداد بلیط قطار",
        clauses: [
          "بیش از ۲۴ ساعت مانده به حرکت قطار: جریمه کنسلی ۵ درصد مبلغ بلیط است.",
          "کمتر از ۲۴ ساعت مانده به حرکت قطار: جریمه کنسلی ۲۰ درصد مبلغ بلیط است.",
          "پس از حرکت قطار، امکان استرداد وجه وجود ندارد.",
        ],
      },
      {
        title: "نکات مهم قطار",
        clauses: [
          "حداقل ۴۵ دقیقه قبل از ساعت درج‌شده در بلیط خود در ایستگاه راه‌آهن حضور داشته باشید.",
          "بلیط قطار به همراه یکی از مدارک شناسایی معتبر باید در طول سفر همراه مسافر باشد.",
          "جابه‌جایی صندلی یا کوپه پس از صدور بلیط، منوط به موجودی و صلاحدید شرکت راه‌آهن است.",
        ],
      },
    ],
  },

  bus: {
    label: "اتوبوس",
    icon: <DirectionsBusIcon fontSize="small" />,
    sections: [
      {
        title: "قوانین کنسلی و استرداد بلیط اتوبوس",
        clauses: [
          "بیش از ۲۴ ساعت مانده به حرکت اتوبوس: جریمه کنسلی ۱۰ درصد مبلغ بلیط است.",
          "کمتر از ۲۴ ساعت مانده به حرکت اتوبوس: جریمه کنسلی ۵۰ درصد مبلغ بلیط است.",
          "پس از حرکت اتوبوس، امکان استرداد وجه وجود ندارد.",
        ],
      },
      {
        title: "قوانین بار همراه",
        clauses: [
          "حمل بار تا سقف ۲۰ کیلوگرم برای هر مسافر رایگان است.",
          "حمل بار اضافه صرفاً با هماهنگی و تایید شرکت اتوبوسرانی مربوطه امکان‌پذیر است.",
        ],
      },
      {
        title: "نکات مهم اتوبوس",
        clauses: [
          "حداقل ۳۰ دقیقه قبل از حرکت در ترمینال حضور داشته باشید.",
          "عدم حضور به‌موقع مسافر در ترمینال، به‌منزله انصراف از سفر بوده و مشمول قوانین کنسلی است.",
        ],
      },
    ],
  },

  tour: {
    label: "تور",
    icon: <TourIcon fontSize="small" />,
    sections: [
      {
        title: "قوانین کنسلی و استرداد تور",
        clauses: [
          "بیش از ۷۲ ساعت مانده به شروع تور: جریمه کنسلی ۲۰ درصد مبلغ تور است.",
          "بین ۲۴ تا ۷۲ ساعت مانده به شروع تور: جریمه کنسلی ۵۰ درصد مبلغ تور است.",
          "کمتر از ۲۴ ساعت مانده به شروع تور: امکان استرداد وجه وجود ندارد.",
          "قوانین کنسلی تورهای خارجی ممکن است بر اساس سیاست‌های آژانس گردشگری مربوطه متفاوت باشد.",
        ],
      },
      {
        title: "مسئولیت آژانس گردشگری",
        clauses: [
          "کیفیت اقامتگاه، وسیله نقلیه و برنامه گردشگری هر تور، مطابق با اطلاعات ثبت‌شده توسط آژانس برگزارکننده است.",
          "در صورت لغو تور از سوی آژانس گردشگری، تیکی موظف به اطلاع‌رسانی سریع و پیگیری بازگشت کامل وجه به کاربر است.",
        ],
      },
    ],
  },
};

const CATEGORY_ORDER = ["general", "bus", "flight", "train", "tour"];

export default function Policy() {
  useDocumentTitle("قوانین و مقررات | سیستم رزرو بلیط");

  const [activeCategory, setActiveCategory] = useState("general");

  const sections = POLICIES_DATA[activeCategory].sections;

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
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ color: "#fff", mb: 1 }}
          >
            قوانین و مقررات
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,.85)" }}>
            لطفا پیش از رزرو، قوانین مربوط به بخش مورد نظر خود را مطالعه
            کنید
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 820, mx: "auto", px: { xs: 2, md: 3 }, py: 5 }}>
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
              icon={POLICIES_DATA[key].icon}
              iconPosition="start"
              label={POLICIES_DATA[key].label}
            />
          ))}
        </Tabs>

        <Stack spacing={1.5}>
          {sections.map((section, sIndex) => (
            <Accordion key={sIndex} disableGutters defaultExpanded={sIndex === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={700}>{section.title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.5}>
                  {section.clauses.map((clause, cIndex) => (
                    <Stack
                      key={cIndex}
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                    >
                      <Typography
                        fontWeight={700}
                        color="primary.main"
                        sx={{ minWidth: 20 }}
                      >
                        {cIndex + 1}.
                      </Typography>
                      <Typography color="text.secondary">
                        {clause}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>

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
                    سوالی درباره قوانین دارید؟
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
                <Typography fontWeight={600}>
                  tickisupport@gmail.com
                </Typography>
              </Stack>
            </Stack>
          </CardBox>
        </Box>
      </Box>
    </Box>
  );
}
