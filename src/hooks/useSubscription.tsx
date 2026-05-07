import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PLAN_PRICES_INR, type PlanId } from "@/lib/currency";

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "overdue"
  | "cancelled"
  | "expired";

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
  currencyCode: r.currency_code || "INR",
  cancelledAt: r.cancelled_at,
});

const deriveStatus = (
  s: Subscription,
  now: number = Date.now()
): SubscriptionStatus => {
  if (s.status === "cancelled") return "cancelled";
  if (s.status === "overdue") return "overdue";
  if (s.status === "expired") return "expired";

  if (s.status === "trial") {
    if (s.trialEnd && new Date(s.trialEnd).getTime() <= now) {
      return "expired";
    }

    return "trial";
  }

  if (s.status === "active") {
    if (
      s.currentPeriodEnd &&
      new Date(s.currentPeriodEnd).getTime() <= now
    ) {
      return "overdue";
    }

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
    const id = setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => clearInterval(id);
  }, []);

  const ensureOwnerSubscription = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data: existing, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error(
          "Failed fetching subscription:",
          fetchError.message || fetchError
        );

        return null;
      }

      if (existing) {
        return map(existing);
      }

      const payload = {
        owner_id: user.id,
        plan: "starter" as const,
        status: "trial" as const,
        trial_end: new Date(
          Date.now() + 14 * 86400_000
        ).toISOString(),
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

      if (insertError) {
        console.error(
          "Failed creating default subscription:",
          insertError.message || insertError
        );

        return null;
      }

      return map(inserted);
    } catch (error) {
      console.error("Unexpected subscription error:", error);
      return null;
    }
  }, [user]);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id || role !== "owner") {
      setSub(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const ensured = await ensureOwnerSubscription();

      setSub(ensured);
    } catch (error) {
      console.error("Subscription fetch failed:", error);

      setSub(null);
    } finally {
      setLoading(false);
    }
  }, [user, role, ensureOwnerSubscription]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        await fetchSubscription();
      } catch (error) {
        console.error(
          "Initial subscription fetch failed:",
          error
        );

        if (isMounted) {
          setSub(null);
          setLoading(false);
        }
      }
    };

    void initialize();

    if (!user?.id) {
      return () => {
        isMounted = false;
      };
    }

    const channelName = `subscription-${user.id}`;

    try {
      const existingChannels = supabase
        .getChannels()
        .filter(
          (channel) =>
            channel.topic === `realtime:${channelName}`
        );

      existingChannels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    } catch (error) {
      console.error(
        "Failed cleaning existing channels:",
        error
      );
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `owner_id=eq.${user.id}`,
        },
        async () => {
          if (!isMounted) return;

          try {
            await fetchSubscription();
          } catch (error) {
            console.error(
              "Realtime subscription refresh failed:",
              error
            );
          }
        }
      )
      .subscribe((status) => {
        console.log(
          `Subscription realtime status: ${status}`
        );

        if (status === "CHANNEL_ERROR") {
          console.error(
            "Realtime subscription channel error."
          );
        }

        if (status === "TIMED_OUT") {
          console.warn(
            "Realtime subscription timed out."
          );
        }

        if (status === "CLOSED") {
          console.warn(
            "Realtime subscription closed."
          );
        }
      });

    return () => {
      isMounted = false;

      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error(
          "Failed removing realtime channel:",
          error
        );
      }
    };
  }, [fetchSubscription, user]);

  const changePlan = useCallback(
    async (plan: PlanId) => {
      if (!user?.id) return;

      try {
        const amount = PLAN_PRICES_INR[plan];

        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan,
            status: "active",
            current_period_end: new Date(
              Date.now() + 30 * 86400_000
            ).toISOString(),
            amount,
            currency_code: "INR",
            cancelled_at: null,
          })
          .eq("owner_id", user.id);

        if (error) {
          console.error(
            "Failed changing subscription plan:",
            error.message || error
          );

          return;
        }

        const { error: auditError } = await supabase
          .from("audit_logs")
          .insert({
            actor_id: user.id,
            actor_email: user.email,
            action: "subscription.change_plan",
            target_type: "subscription",
            target_id: user.id,
            meta: { plan },
          });

        if (auditError) {
          console.error(
            "Audit log failed:",
            auditError.message || auditError
          );
        }

        await fetchSubscription();
      } catch (error) {
        console.error("Change plan failed:", error);
      }
    },
    [user, fetchSubscription]
  );

  const cancel = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("owner_id", user.id);

      if (error) {
        console.error(
          "Failed cancelling subscription:",
          error.message || error
        );

        return;
      }

      const { error: auditError } = await supabase
        .from("audit_logs")
        .insert({
          actor_id: user.id,
          actor_email: user.email,
          action: "subscription.cancel",
          target_type: "subscription",
          target_id: user.id,
        });

      if (auditError) {
        console.error(
          "Audit log failed:",
          auditError.message || auditError
        );
      }

      await fetchSubscription();
    } catch (error) {
      console.error("Subscription cancel failed:", error);
    }
  }, [user, fetchSubscription]);

  const effectiveStatus = sub
    ? deriveStatus(sub, now)
    : null;

  const trialDaysLeft = sub?.trialEnd
    ? Math.max(
        0,
        Math.ceil(
          (new Date(sub.trialEnd).getTime() - now) /
            86400_000
        )
      )
    : 0;

  const isTrial = effectiveStatus === "trial";

  const isExpired = effectiveStatus === "expired";

  const needsPaidUpgrade =
    isExpired ||
    effectiveStatus === "cancelled" ||
    effectiveStatus === "overdue";

  return {
    subscription: sub
      ? {
          ...sub,
          status: effectiveStatus ?? sub.status,
        }
      : null,

    loading,

    refresh: fetchSubscription,

    changePlan,

    cancel,

    trialDaysLeft,

    isTrial,

    isExpired,

    needsPaidUpgrade,
  };
}
