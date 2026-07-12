import dayjs from "dayjs";
import jalaliday from "jalali-plugin-dayjs";
import "dayjs/locale/fa";

dayjs.extend(jalaliday);

dayjs.calendar("jalali");
dayjs.locale("fa");

export function formatDate(date) {
  if (!date) return "";

  return dayjs(date).format("YYYY/MM/DD");
}

export function formatDateTime(date) {
  if (!date) return "";

  return dayjs(date).format("YYYY/MM/DD HH:mm");
}