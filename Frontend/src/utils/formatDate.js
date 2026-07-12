import dayjs from "dayjs";
<<<<<<< HEAD


=======
import jalaliday from "jalali-plugin-dayjs";
import "dayjs/locale/fa";

dayjs.extend(jalaliday);

dayjs.calendar("jalali");
dayjs.locale("fa");

>>>>>>> 70986d43425d7d29a3bb4b1f540e8e0a1c6a2477
export function formatDate(date) {
  if (!date) return "";

  return dayjs(date).format("YYYY/MM/DD");
}

export function formatDateTime(date) {
  if (!date) return "";

  return dayjs(date).format("YYYY/MM/DD HH:mm");
}