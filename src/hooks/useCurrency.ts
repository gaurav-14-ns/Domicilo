import { useCallback, useMemo } from "react";
import { useSettings } from "@/store/DataStore";
import {
  formatMoney, formatMoneyCompact, currencySymbol, type CurrencyCode,
} from "@/lib/currency";

export function useCurrency() {
  const settings = useSettings();
  const code = (settings?.currencyCode ?? "INR") as CurrencyCode;
  const locale = settings?.locale ?? "en-IN";

  const fmt = useCallback((n: number) => formatMoney(n, code, locale), [code, locale]);
  const fmtCompact = useCallback((n: number) => formatMoneyCompact(n, code, locale), [code, locale]);
  const symbol = useMemo(() => currencySymbol(code, locale), [code, locale]);

  return { code, locale, symbol, fmt, fmtCompact };
}
