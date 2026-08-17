import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "ar", "es", "de", "it", "pt", "ru", "zh", "ko", "tr", "he"],
  defaultLocale: "fr",
  localePrefix: "always",
});

export const localeNames: Record<string, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
  zh: "中文",
  ko: "한국어",
  tr: "Türkçe",
  he: "עברית",
};

export const rtlLocales = ["ar", "he"];
