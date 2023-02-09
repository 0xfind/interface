export const SUPPORTED_LOCALES = ["en", "zh"];
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export type Language = Record<string, Record<string, string>>;

export const Languages: Language = {
  en: { code: "en", name: "english", short: "EN", long: "English" },
  zh: { code: "zh", name: "chinese", short: "中文", long: "中文" },
};
