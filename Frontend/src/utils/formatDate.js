import dayjs from "dayjs";
import jalaliday from "jalali-plugin-dayjs";
import "dayjs/locale/fa";

dayjs.extend(jalaliday);

export function formatDateTimeJalali(date) {
  if (!date) return "";

  return dayjs(date).calendar("jalali").locale("fa").format("YYYY/MM/DD HH:mm");
}
export function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleString();
}
