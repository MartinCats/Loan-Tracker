const readableMessageParts = [
  "already has an active loan",
  "must be",
  "is required",
  "Only active loans",
  "Loan not found",
  "Payment amount",
  "Load an active"
];

const technicalMessageParts = [
  "sqlite",
  "sql ",
  "constraint",
  "foreign key",
  "database",
  "near \"",
  "no such table"
];

export function getReadableErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  return getReadableErrorText(error.message, fallback);
}

export function getReadableErrorText(message: string | null | undefined, fallback: string) {
  if (!message) {
    return fallback;
  }

  const normalizedMessage = message.toLowerCase();

  if (technicalMessageParts.some((part) => normalizedMessage.includes(part))) {
    return fallback;
  }

  if (readableMessageParts.some((part) => message.includes(part))) {
    return message;
  }

  return fallback;
}
