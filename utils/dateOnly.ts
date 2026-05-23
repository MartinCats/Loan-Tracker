const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function getLocalTodayDateOnly(date = new Date()) {
  return formatLocalDateOnly(date);
}

export function formatLocalDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isValidDateOnly(value: string) {
  return parseDateOnlyParts(value) !== null;
}

export function compareDateOnly(left: string, right: string) {
  return left.localeCompare(right);
}

export function formatDateOnlyForDisplay(value: string) {
  const parts = parseDateOnlyParts(value);

  if (!parts) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(parts.year, parts.monthIndex, parts.day)));
}

export function formatTimestampForDisplay(value: string | null | undefined) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function parseDateOnlyParts(value: string) {
  const match = dateOnlyPattern.exec(value);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    year,
    monthIndex: month - 1,
    day
  };
}
