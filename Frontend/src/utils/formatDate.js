
<<<<<<< HEAD
=======
dayjs.extend(jalaliday);

dayjs.calendar("jalali");
dayjs.locale("fa");

>>>>>>> ca85fe99604bf0c872470b33d0263ee75e74aa34
export function formatDate(date) {
  if (!date) return "";

  return dayjs(date).format("YYYY/MM/DD");
}

export function formatDateTime(date) {
  if (!date) return "";

  return dayjs(date).format("YYYY/MM/DD HH:mm");
}
