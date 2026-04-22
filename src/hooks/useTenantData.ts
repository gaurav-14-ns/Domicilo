import { useMemo } from "react";
import type { Tenant, Transaction } from "@/store/types";

/** Find a tenant matching the signed-in user's email (case-insensitive). */
export function useCurrentTenant(tenants: Tenant[], email?: string | null): Tenant | undefined {
  return useMemo(() => {
    if (!email) return tenants[0];
    const e = email.toLowerCase();
    return tenants.find((t) => (t.email || "").toLowerCase() === e) ?? tenants[0];
  }, [tenants, email]);
}

/** All transactions for a tenant. */
export function useTenantTransactions(transactions: Transaction[], tenantId?: string) {
  return useMemo(() => {
    if (!tenantId) return [];
    return transactions.filter((t) => t.tenantId === tenantId);
  }, [transactions, tenantId]);
}

/** Total outstanding (pending) amount for a tenant. */
export function useTenantDues(transactions: Transaction[], tenantId?: string) {
  return useMemo(() => {
    if (!tenantId) return 0;
    return transactions
      .filter((t) => t.tenantId === tenantId && t.status === "pending")
      .reduce((s, t) => s + Math.max(0, t.amount), 0);
  }, [transactions, tenantId]);
}
