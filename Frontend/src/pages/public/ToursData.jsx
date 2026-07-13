// Content for the "tour" ticket type — cover photo + marketing description
// for each tour. Keyed by the tour's `ticket.id` (same ids used in the
// TOUR_DESTINATIONS grid on the Tickets/home page), so TicketDetails can look
// up the right image/description for whichever tour the user opened.
//
// `nights` here is a fallback only — TicketDetails always prefers computing
// the real number of nights from the ticket's own departure_date/return_date
// so it stays correct even if a tour's dates change.
export const TOURS_CONTENT = {
  "081299fa-8bdc-49db-a814-e9b7101027a8": {
    destination: "کیش",
    image:
      "https://images.openai.com/static-rsc-4/ITfc4yk__7kG2rp6L-n40oP4BmXnHzk9Xejc2LMe0qdjG_Pe9inTxPWcDmlj8HzagTua3ChZN2U2TXQXHah8w8Q5bhwsVypmuJkfbRlcn83T2Kqh1NyT7W5rSZ2BI1AhgFIh6RZNJ17nOCE228EqKxUf7fDTb7sxjq6NUEQu--LoQSdxhdqy5lCZAu0OCOuO?purpose=fullsize",
    tagline: "جزیره مرجانی خلیج فارس با ساحل‌های آبی و بازارهای بزرگ",
    nights: 7,
    highlights: [
      "اسکله تفریحی مرجان و بازارهای بزرگ کیش",
      "دلفیناریوم و آکواریوم کیش",
      "غار نمکی نمکدان",
      "کشتی یونانی و ساحل مرجانی",
    ],
    includes: ["اقامت با صبحانه", "بلیط رفت و برگشت", "ترانسفر فرودگاهی", "راهنمای فارسی‌زبان"],
  },

  "927752f0-6b3d-4a80-9352-36260294933e": {
    destination: "چابهار",
    image:
      "https://images.openai.com/static-rsc-4/vasoSTfCtiQx3Qwri4Ab8WRl6kLKNN1Ib3kgAwWnqnNiJDCpdqKZyakHQH1A1wLTCK-OheAWY6u5WmARsyNgH6lrAQMDO6bn61AFZkL9aev7wWahlMeAViSu-1bhnwfvZtcmVnfe6IknpHSZYjxPgMOUt60Jzf9deHzQhKnSTMGaXTzMTrobchJzAQFbLCJM?purpose=fullsize",
    tagline: "دریای عمان، سواحل بکر و چشم‌اندازهای کویری کنار دریا",
    nights: 10,
    highlights: [
      "کوه‌های مریخی چابهار",
      "ساحل زیبای دریای عمان",
      "جنگل‌های حرا (مانگرو)",
      "بازار محلی و صنایع‌دستی بومی",
    ],
    includes: ["اقامت با صبحانه", "بلیط رفت و برگشت", "ترانسفر فرودگاهی", "تور نیم‌روزی کوه‌های مریخی"],
  },

  "9c0b8bd8-27b5-4e4b-87b9-f0390e71b261": {
    destination: "بندر انزلی",
    image:
      "https://images.openai.com/static-rsc-4/9qkp9XtFy9SNU34JFQe6z8yAHFE-AcnOGS3kuJ2qOqlGdJY-Eyl6N-2PTvjkNcELHylvUqX2s_fxsxWWF103CGA6I9iBUVBs3K0_SRuDQVJNIGDzb-M_6gzlFmRGAmNPb-8Y6L5_Ox7qw-hzAnxpM4cG3LmDaMKeChNjlnDS6PyEmq1GwedpYQ0cL9jH3jYs?purpose=fullsize",
    tagline: "تالاب انزلی، جنگل‌های سرسبز و هوای شمالی کنار دریای خزر",
    nights: 7,
    highlights: [
      "قایق‌سواری در تالاب بین‌المللی انزلی",
      "پارک ساحلی و اسکله صیادی",
      "بازارچه محلی صنایع دستی",
      "جنگل و تالارهای اطراف بندر",
    ],
    includes: ["اقامت با صبحانه", "بلیط رفت و برگشت", "ترانسفر", "قایق‌سواری در تالاب"],
  },

  "bcb40e95-a008-4628-a98a-9d8c464358c3": {
    destination: "مشهد",
    image:
      "https://images.openai.com/static-rsc-4/CPzcEOwzbjhl2BaS3wRDT7vIEf_tS67C-it-YfmNUjUtW6P4JXuxXm36db8fK1V30YORfRXQD6KW0N-YoLWId9mn6WmwsZG6Z3gpwsDpVRDh6tBn0-zsLIIpYd2y_mp43xCsqOFS4eflZ-n0P1vLNovT5Z6iK8uQkXEAyYIY1ld-gR1yMXAWl6EYlVZd9ydV?purpose=fullsize",
    tagline: "سفر زیارتی به حرم مطهر امام رضا (ع) و بازارهای مشهد",
    nights: 3,
    highlights: [
      "زیارت حرم مطهر امام رضا (ع)",
      "بازار رضا و مرکز خرید‌های اطراف حرم",
      "موزه‌های آستان قدس رضوی",
      "کوهسنگی و پارک ملت",
    ],
    includes: ["اقامت با صبحانه در هتل نزدیک حرم", "بلیط رفت و برگشت", "ترانسفر فرودگاهی", "راهنمای زیارتی"],
  },

  "c7daa955-d929-400b-aff5-53abd30b4caa": {
    destination: "اصفهان",
    image:
      "https://images.openai.com/static-rsc-4/7GLRCaMzxn6AyTfhto6FX47tijSuf4hRstD2IUCUPTM2EVAWg-Q-Bq8wAVHvpQ3NA1fhBQoW4oSGxVXF5vGrgI1S9b0RYUH3VoZ2wX1zffbti6wlQepqGWU0cRYl-Yy0fchu-Tu_ewJ1CB7ZFnTzPpPLogTiXhQk2SVw-F6JA1sEC2tFVOB-wSkXTgeXjrwN?purpose=fullsize",
    tagline: "نصف جهان؛ میدان نقش جهان، پل‌های تاریخی و معماری اسلامی",
    nights: 8,
    highlights: [
      "میدان نقش جهان و مسجد شیخ لطف‌الله",
      "کاخ عالی‌قاپو و بازار سنتی قیصریه",
      "پل خواجو و سی‌وسه‌پل",
      "کلیسای وانک در محله جلفا",
    ],
    includes: ["اقامت با صبحانه", "بلیط رفت و برگشت", "ترانسفر فرودگاهی", "تور نیم‌روزی گردشگری شهر"],
  },

  "e4d183f8-5026-44ee-b1b6-31949eb95d0f": {
    destination: "شیراز",
    image:
      "https://images.openai.com/static-rsc-4/MD_pjyXU7Z_Qc4pgWTvgt7VgF3Ba8PvF7jxARVQ46qTEm2yuSDfQvUZU1BbP-S8a-43ZwFbnMdwCB8pgy3rulvQj4o5ZrYsk5OX7q9OHzBvj_BUKw3ZiOcrhHx7B18NCa7VQk1Cyvx2lsjCZ5LTm_uE-1pH7SjWeLR0NMeyW99AFnrUE18y3_IdSdlM2_Nnq?purpose=fullsize",
    tagline: "شهر شعر و باغ‌های ایرانی، در همسایگی تخت جمشید",
    nights: 7,
    highlights: [
      "تخت جمشید و نقش رستم",
      "مسجد نصیرالملک (مسجد صورتی)",
      "باغ ارم و آرامگاه حافظ و سعدی",
      "ارگ کریم‌خانی",
    ],
    includes: ["اقامت با صبحانه", "بلیط رفت و برگشت", "ترانسفر فرودگاهی", "تور یک‌روزه تخت جمشید"],
  },
};

// Fallback content used if a tour ticket id isn't found in TOURS_CONTENT
// above (e.g. a newly created tour that hasn't been given custom content
// yet). Keeps the details page from breaking / looking empty.
export function getTourContent(ticket) {
  const known = TOURS_CONTENT[ticket?.id];
  if (known) return known;

  return {
    destination: ticket?.destination || "",
    image: null,
    tagline: "یک سفر گردشگری برنامه‌ریزی‌شده همراه با اقامت و خدمات کامل",
    nights: null,
    highlights: [
      "اقامت در هتل منتخب آژانس گردشگری",
      "گشت شهری و بازدید از جاذبه‌های اصلی مقصد",
      "همراهی راهنمای تور در طول سفر",
    ],
    includes: ["اقامت با صبحانه", "بلیط رفت و برگشت", "ترانسفر فرودگاهی"],
  };
}