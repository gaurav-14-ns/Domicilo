import { useMemo } from "react";

import type {
  Tenant,
  Transaction,
} from "@/store/types";

/**
 * Find a tenant matching
 * the signed-in user's email
 * (case-insensitive).
 */
export function useCurrentTenant(
  tenants: Tenant[],
  email?: string | null
): Tenant | undefined {

  return useMemo(() => {

    if (!email) {
      return undefined;
    }

    const normalized =
      email
        .trim()
        .toLowerCase();

    return tenants.find(
      (t) =>
        (t.email || "")
          .trim()
          .toLowerCase() ===
        normalized
    );

  }, [
    tenants,
    email,
  ]);
}

/**
 * All transactions
 * for a tenant.
 */
export function useTenantTransactions(
  transactions: Transaction[],
  tenantId?: string
) {

  return useMemo(() => {

    if (!tenantId) {
      return [];
    }

    return transactions.filter(
      (t) =>
        t.tenantId === tenantId
    );

  }, [
    transactions,
    tenantId,
  ]);
}

/**
 * Total outstanding dues
 * for a tenant.
 *
 * Rules:
 * - only pending transactions
 * - only positive amounts
 * - excludes refunds/credits
 * - never returns negative totals
 */
export function useTenantDues(
  transactions: Transaction[],
  tenantId?: string
) {

  return useMemo(() => {

    if (!tenantId) {
      return 0;
    }

    const outstanding =
      transactions
        .filter((t) => {

          if (
            t.tenantId !== tenantId
          ) {
            return false;
          }

          if (
            t.status !== "pending"
          ) {
            return false;
          }

          /*
            Ignore negative
            adjustments/refunds
            from dues totals.
          */
          if (
            t.amount <= 0
          ) {
            return false;
          }

          return true;
        })
        .reduce(
          (sum, tx) =>
            sum + tx.amount,
          0
        );

    return Math.max(
      0,
      outstanding
    );

  }, [
    transactions,
    tenantId,
  ]);
}
