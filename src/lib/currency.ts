// Locale-aware currency utilities. All amounts in DB are plain numbers;
// formatting and symbol detection happen at render time based on user setting.

export type CurrencyCode =
  | "INR" | "USD" | "GBP" | "EUR" | "AUD" | "CAD" | "SGD"
  | "AED" | "JPY" | "CNY" | "CHF" | "ZAR" | "BRL" | "MXN" | "NZD";

export const SUPPORTED_CURRENCIES: { code: CurrencyCode; label: string; locale: string }[] = [
  { code: "INR", label: "Indian Rupee (₹)",  locale: "en-IN" },
  { code: "USD", label: "US Dollar ($)",     locale: "en-US" },
  { code: "GBP", label: "British Pound (£)", locale: "en-GB" },
  { code: "EUR", label: "Euro (€)",          locale: "en-IE" },
  { code: "AUD", label: "Australian $ (A$)", locale: "en-AU" },
  { code: "CAD", label: "Canadian $ (C$)",   locale: "en-CA" },
  { code: "SGD", label: "Singapore $ (S$)",  locale: "en-SG" },
  { code: "AED", label: "UAE Dirham (د.إ)",  locale: "ar-AE" },
  { code: "JPY", label: "Japanese Yen (¥)",  locale: "ja-JP" },
  { code: "CNY", label: "Chinese Yuan (¥)",  locale: "zh-CN" },
  { code: "CHF", label: "Swiss Franc",        locale: "de-CH" },
  { code: "ZAR", label: "South African Rand", locale: "en-ZA" },
  { code: "BRL", label: "Brazilian Real (R$)",locale: "pt-BR" },
  { code: "MXN", label: "Mexican Peso ($)",   locale: "es-MX" },
  { code: "NZD", label: "NZ Dollar (NZ$)",    locale: "en-NZ" },
];

// Map country/region → default currency
const REGION_TO_CURRENCY: Record<string, CurrencyCode> = {
  IN: "INR", US: "USD", GB: "GBP",
  IE: "EUR", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR",
  PT: "EUR", BE: "EUR", AT: "EUR", FI: "EUR", GR: "EUR",
  AU: "AUD", CA: "CAD", SG: "SGD", AE: "AED", JP: "JPY", CN: "CNY",
  CH: "CHF", ZA: "ZAR", BR: "BRL", MX: "MXN", NZ: "NZD",
};

export function detectCurrencyFromBrowser(): { code: CurrencyCode; locale: string } {
  if (typeof navigator === "undefined") return { code: "INR", locale: "en-IN" };
  const langs = (navigator.languages?.length ? navigator.languages : [navigator.language]) || [];
  for (const raw of langs) {
    if (!raw) continue;
    const region = raw.split("-")[1]?.toUpperCase();
    if (region && REGION_TO_CURRENCY[region]) {
      return { code: REGION_TO_CURRENCY[region], locale: raw };
    }
  }
  return { code: "INR", locale: "en-IN" };
}

export function localeForCurrency(code: CurrencyCode): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.locale ?? "en-US";
}

const formatterCache = new Map<string, Intl.NumberFormat>();
function getFormatter(code: CurrencyCode, locale: string, compact = false) {
  const key = `${code}|${locale}|${compact}`;
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: compact ? 1 : 0,
      ...(compact ? { notation: "compact" } : {}),
    });
    formatterCache.set(key, f);
  }
  return f;
}

export function formatMoney(
  amount: number,
  code: CurrencyCode = "INR",
  locale: string = localeForCurrency(code),
): string {
  return getFormatter(code, locale, false).format(Math.round(amount || 0));
}

export function formatMoneyCompact(
  amount: number,
  code: CurrencyCode = "INR",
  locale: string = localeForCurrency(code),
): string {
  return getFormatter(code, locale, true).format(amount || 0);
}

export function currencySymbol(code: CurrencyCode = "INR", locale: string = localeForCurrency(code)) {
  const parts = getFormatter(code, locale).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? code;
}
