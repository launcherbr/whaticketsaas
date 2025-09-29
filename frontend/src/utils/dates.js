export function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getFirstDayOfMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month, 1);
}

export function getLastDayOfMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0);
}
