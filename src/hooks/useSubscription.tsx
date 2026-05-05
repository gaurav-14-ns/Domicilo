import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PLAN_PRICES_INR, type PlanId } from "@/lib/currency";

export type SubscriptionStatus = "trial" | "active" | "overdue" | "cancelled" | "expired";

export interface Subscription {
  id: string;
  ownerId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  amount: number;
  currencyCode: string;
  cancelledAt: string | null;
}

const map = (r: any): Subscription => ({
  id: r.id,
  ownerId: r.owner_id,
  plan: r.plan,
  status: r.status,
  trialEnd: r.trial_end,
  currentPeriodEnd: r.current_period_end,
  amount: Number(r.amount) || 0,
  currencyCode: r.currency_code,
  cancelledAt: r.cancelled_at,
});

const nowMs = () => Date.now();

const deriveStatus = (s: Subscription, now: number = Date.now()): SubscriptionStatus => {
  if (s.status === "cancelled") return "cancelled";
  if (s.status === "overdue") return "overdue";
  if (s.status === "expired") return "expired";

  if (s.status === "trial") {
    if (s.trialEnd && new Date(s.trialEnd).getTime() <= now) return "expired";
    return "trial";
  }

  if (s.status === "active") {
    if (s.currentPeriodEnd && new Date(s.currentPeriodEnd).getTime() <= now) return "overdue";
    return "active";
  }

  return s.status;
};

export function useSubscription() {
  const { user, role } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const ensureOwnerSubscription = useCallback(async () => {
    if (!user) return null;

    const { data: existing, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existing) return map(existing);

    const payload = {
      owner_id: user.id,
      plan: "starter" as const,
      status: "trial" as const,
      trial_end: new Date(Date.now() + 14 * 86400_000).toISOString(),
      amount: PLAN_PRICES_INR.starter,
      currency_code: "INR",
      cancelled_at: null,
      current_period_end: null,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("subscriptions")
      .insert(payload)
      .select("*")
      .single();

    if (insertError) throw insertError;
    return map(inserted);
  }, [user]);

  const fetch = useCallback(async () => {
    if (!user || role !== "owner") {
      setSub(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const ensured = await ensureOwnerSubscription();
      setSub(ensured);
    } finally {
      setLoading(false);
    }
  }, [user, role, ensureOwnerSubscription]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const changePlan = useCallback(
    async (plan: PlanId) => {
      if (!user) return;
      const amount = PLAN_PRICES_INR[plan];

      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan,
          status: "active",
          current_period_end: new Date(Date.now() + 30 * 86400_000).toISOString(),
          amount,
          currency_code: "INR",
          cancelled_at: null,
        })
        .eq("owner_id", user.id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_email: user.email,
        action: "subscription.change_plan",
        target_type: "subscription",
        target_id: user.id,
        meta: { plan },
      });

      await fetch();
    },
    [user, fetch]
  );

  const cancel = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("owner_id", user.id);

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      actor_email: user.email,
      action: "subscription.cancel",
      target_type: "subscription",
      target_id: user.id,
    });

    await fetch();
  }, [user, fetch]);

  const effectiveStatus = sub ? deriveStatus(sub, now) : null;

  const trialDaysLeft = sub?.trialEnd
    ? Math.max(0, Math.ceil((new Date(sub.trialEnd).getTime() - now) / 86400_000))
    : 0;

  const isTrial = effectiveStatus === "trial";
  const isExpired = effectiveStatus === "expired";
  const needsPaidUpgrade =
    isExpired || effectiveStatus === "cancelled" || effectiveStatus === "overdue";

  return {
    subscription: sub ? { ...sub, status: effectiveStatus ?? sub.status } : null,
    loading,
    refresh: fetch,
    changePlan,
    cancel,
    trialDaysLeft,
    isTrial,
    isExpired,
    needsPaidUpgrade,
  };
}
