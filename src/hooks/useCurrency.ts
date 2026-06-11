import { useCallback, useMemo } from "react";
import { formatMoney, formatMoneyCompact } from "@/lib/currency";

export function useCurrency() {
  const code = "INR";
  const locale = "en-IN";
  const fmt = useCallback((n: number) => formatMoney(n), []);
  const fmtCompact = useCallback((n: number) => formatMoneyCompact(n), []);
  const symbol = useMemo(() => "₹", []);

  return { code, locale, symbol, fmt, fmtCompact };
}
