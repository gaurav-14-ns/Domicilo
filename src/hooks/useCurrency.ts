import { useCallback, useMemo } from "react";
import { useSettings } from "@/store/DataStore";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTenant } from "@/hooks/useTenantData";
import { useDataStore } from "@/store/DataStore";
import {
  formatMoney, formatMoneyCompact, currencySymbol, type CurrencyCode,
} from "@/lib/currency";

export function useCurrency() {
  const { user } = useAuth();
  const { data } = useDataStore();
  const settings = useSettings();
  
  // If user is a tenant, use tenant's currency; otherwise use owner's settings
  const currentTenant = useCurrentTenant(data.tenants, user?.email);
  
  const code = (currentTenant?.currencyCode ?? settings?.currencyCode ?? "INR") as CurrencyCode;
  const locale = currentTenant?.locale ?? settings?.locale ?? "en-IN";

  const fmt = useCallback((n: number) => formatMoney(n, code, locale), [code, locale]);
  const fmtCompact = useCallback((n: number) => formatMoneyCompact(n, code, locale), [code, locale]);
  const symbol = useMemo(() => currencySymbol(code, locale), [code, locale]);

  return { code, locale, symbol, fmt, fmtCompact };
}
