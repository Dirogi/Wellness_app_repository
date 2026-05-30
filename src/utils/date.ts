export function currentMonthName() {
  return new Date().toLocaleDateString("es-ES", {
    month: "long",
  });
}

export function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

export function dayOnly(date: string) {
  return date.split("-")[2];
}