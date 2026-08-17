export const ALL_LOCALES = ["fr", "en", "ar", "es", "de", "it", "pt", "ru", "zh", "ko", "tr", "he"];

export const LOCALE_LABELS: Record<string, string> = {
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

export function readLocalized(formData: FormData, field: string): Record<string, string> {
  const fr = String(formData.get(`${field}_fr`) ?? "");
  const result: Record<string, string> = { fr };
  for (const locale of ALL_LOCALES) {
    if (locale === "fr") continue;
    const value = formData.get(`${field}_${locale}`);
    result[locale] = value ? String(value) : fr;
  }
  return result;
}
