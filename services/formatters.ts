import { formatDateOnlyForDisplay as formatDateOnlySafely } from "@/utils/dateOnly";

import { t, type AppLanguage } from "./i18n";
import type { LoanCountdownDisplay } from "./loanCalculator";

export function formatCurrency(amount: number, language: AppLanguage) {
  return `฿${amount.toLocaleString(getLocale(language), {
    maximumFractionDigits: 0
  })}`;
}

export function formatDateOnly(value: string, language: AppLanguage) {
  return formatDateOnlySafely(value, getLocale(language));
}

export function formatShortDate(value: string | null, language: AppLanguage) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDateOnlySafely(value, getLocale(language), {
      month: "short",
      day: "numeric"
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function formatTimestamp(value: string | null | undefined, language: AppLanguage) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function formatCountdownDisplay(countdown: LoanCountdownDisplay) {
  if (countdown.status === "due_today") {
    return {
      value: t("common.today").toUpperCase(),
      label: t("countdown.due")
    };
  }

  if (countdown.daysUntilDue < 0) {
    const overdueDays = Math.abs(countdown.daysUntilDue);

    return {
      value: String(overdueDays),
      label: overdueDays === 1 ? t("countdown.dayOverdue") : t("countdown.daysOverdue")
    };
  }

  return {
    value: String(countdown.daysUntilDue),
    label: countdown.daysUntilDue === 1 ? t("countdown.dayLeft") : t("countdown.daysLeft")
  };
}

export function getLocale(language: AppLanguage) {
  return language === "th" ? "th-TH" : "en-US";
}
