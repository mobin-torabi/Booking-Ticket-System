
export function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleString();
}
