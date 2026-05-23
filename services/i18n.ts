import { I18n } from "i18n-js";

import en from "@/locales/en";
import th from "@/locales/th";

export type AppLanguage = "en" | "th";

export const supportedLanguages: AppLanguage[] = ["en", "th"];

export const i18n = new I18n({
  en,
  th
});

i18n.defaultLocale = "th";
i18n.enableFallback = true;
i18n.locale = "th";

export function setI18nLanguage(language: AppLanguage) {
  i18n.locale = language;
}

export function t(key: string, options?: Record<string, string | number | boolean | null | undefined>) {
  return i18n.t(key, options);
}

export function normalizeLanguage(language: string | null | undefined): AppLanguage {
  if (language?.toLowerCase().startsWith("en")) {
    return "en";
  }

  return "th";
}
