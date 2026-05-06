import { useMemo } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useDataStore } from "@/store/DataStore";
import type { PlanId } from "@/lib/currency";

export interface PlanLimits {
  maxProperties: number; // Infinity = unlimited
  maxTenants: number;
  advancedReports: boolean;
}

const LIMITS: Record<PlanId, PlanLimits> = {
  starter: {
    maxProperties: 1,
    maxTenants: 25,
    advancedReports: true,
  },

  growth: {
    maxProperties: Infinity,
    maxTenants: 250,
    advancedReports: true,
  },

  scale: {
    maxProperties: Infinity,
    maxTenants: Infinity,
    advancedReports: true,
  },
};

const PLAN_LABEL: Record<PlanId, string> = {
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
};

export function usePlanLimits() {
  const { subscription, isExpired, needsPaidUpgrade } = useSubscription();
  const { data } = useDataStore();

  const plan: PlanId = subscription?.plan ?? "starter";
  const limits = LIMITS[plan];

  // Active = not deactivated/moved out
  const activeTenants = useMemo(
    () => data.tenants.filter((t) => t.status !== "deactivated" && t.status !== "moved_out").length,
    [data.tenants]
  );
  const propertyCount = data.properties.length;

  const propertyAtLimit = propertyCount >= limits.maxProperties;
  const tenantAtLimit = activeTenants >= limits.maxTenants;

  // When plan is expired/cancelled, treat premium write-actions as blocked.
  const writesBlocked = !!needsPaidUpgrade || !!isExpired;

  return {
    plan,
    planLabel: PLAN_LABEL[plan],
    limits,
    propertyCount,
    activeTenants,
    propertyAtLimit: propertyAtLimit || writesBlocked,
    tenantAtLimit: tenantAtLimit || writesBlocked,
    writesBlocked,
    canUseAdvancedReports: limits.advancedReports && !writesBlocked,
  };
}

export { PLAN_LABEL };
