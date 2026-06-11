import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useSubscription } from "@/hooks/useSubscription";
import { useCurrency } from "@/hooks/useCurrency";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import type { PlanId } from "@/lib/currency";
import { UpgradePlaceholderDialog } from "@/components/UpgradePlaceholderDialog";

const PLAN_LABEL: Record<PlanId, string> = {
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
};

export default function Settings() {
  const { user } = useAuth();
  const { data, loading, error, refresh: refreshData, updateSettings } = useDataStore();
  const { fmt, locale } = useCurrency();
  const {
    subscription,
    loading: subscriptionLoading,
    changePlan,
    cancel,
    trialDaysLeft,
    isTrial,
    refresh,
  } = useSubscription();

  const [busy, setBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] =
  useState(false);

  const [passwordForm, setPasswordForm] =
    useState({
      newPassword: "",
      confirmPassword: "",
    });
  const [showNewPwd, setShowNewPwd] =
    useState(false);
  const [showConfirmPwd, setShowConfirmPwd] =
    useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [planNotice, setPlanNotice] = useState<{
    type: "success" | "error";
    message: string;
    seconds: number;
  } | null>(null);

  const [form, setForm] = useState({
    displayName: data.settings.displayName,
    ownerEmail: data.settings.ownerEmail || user?.email || "",
    emailNotifications: data.settings.emailNotifications,
    smsNotifications: data.settings.smsNotifications,
    locale: data.settings.locale,
  });

  useEffect(() => {
    setForm({
      displayName: data.settings.displayName,
      ownerEmail: data.settings.ownerEmail || user?.email || "",
      emailNotifications: data.settings.emailNotifications,
      smsNotifications: data.settings.smsNotifications,
      locale: data.settings.locale,
    });
  }, [data.settings, user?.email]);

  const planNoticeTimer = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (planNotice && !planNoticeTimer.current) {
      planNoticeTimer.current = setInterval(() => {
        setPlanNotice((prev) => {
          if (!prev) return null;
          if (prev.seconds <= 1) return null;
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    }
    if (!planNotice && planNoticeTimer.current) {
      clearInterval(planNoticeTimer.current);
      planNoticeTimer.current = undefined;
    }
    return () => {
      if (planNoticeTimer.current) {
        clearInterval(planNoticeTimer.current);
        planNoticeTimer.current = undefined;
      }
    };
  }, [!!planNotice]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateSettings(form);
      toast.success("Settings saved", {
        description: "Your preferences have been updated.",
      });
    } catch (err: any) {
      toast.error("Save failed", { description: err?.message ?? "Unknown error" });
    } finally {
      setBusy(false);
    }
  };

  const updatePassword =
  async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (
      passwordForm.newPassword.length < 6
    ) {
      toast.error(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      toast.error(
        "Passwords do not match."
      );
      return;
    }

    setPasswordBusy(true);

    try {

      const {
        error,
      } =
        await supabase.auth.updateUser(
          {
            password:
              passwordForm.newPassword,
          }
        );

      if (error) {
        throw error;
      }

      toast.success(
        "Password updated successfully."
      );

      setPasswordForm({
        newPassword: "",
        confirmPassword: "",
      });

    } catch (
      err: any
    ) {

      toast.error(
        err?.message ??
          "Failed to update password."
      );

    } finally {

      setPasswordBusy(false);

    }
  };

  const upgrade = async (plan: PlanId) => {
    setBusy(true);
    try {
      await changePlan(plan);
      await refresh();
      setPlanNotice({
        type: "success",
        message: `Your ${PLAN_LABEL[plan]} plan is now active.`,
        seconds: 10,
      });
      toast.success(`Switched to ${PLAN_LABEL[plan]}`, {
        description: `${planPriceIn(plan, code, locale)} / month`,
      });
    } catch (err: any) {
      toast.error("Couldn't change plan", { description: err?.message ?? "Unknown error" });
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async () => {
    setBusy(true);
    try {
      await cancel();
      await refresh();
      setPlanNotice({
        type: "error",
        message: "Your subscription has been cancelled.",
        seconds: 10,
      });
      toast.success("Subscription cancelled", {
        description: "You can re-activate anytime.",
      });
    } catch (err: any) {
      toast.error("Couldn't cancel", { description: err?.message ?? "Unknown error" });
    } finally {
      setBusy(false);
    }
  };

  const statusColor = (s: string) =>
    s === "active"
      ? "bg-primary/15 text-primary"
      : s === "trial"
      ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
      : "bg-destructive/15 text-destructive";

  if (error) return <ErrorState title="Failed to load settings" description={error} onRetry={refreshData} />;
  if (loading) return <LoadingState title="Loading settings..." />;

  return (
    <div className="space-y-6 max-w-3xl">
      <AlertDialog open={!!pendingPlan} onOpenChange={() => setPendingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch subscription plan?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPlan
                ? `You are about to switch to the ${PLAN_LABEL[pendingPlan]} plan. Continue?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingPlan) void upgrade(pendingPlan);
                setPendingPlan(null);
              }}
            >
              Yes, Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">Settings</h1>
        <p className="text-muted-foreground font-alt tracking-wide">Manage your account preferences and subscription.</p>
      </div>

      {planNotice && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${
            planNotice.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          <span>{planNotice.message}</span>
          <span className="font-semibold">{planNotice.seconds}s</span>
        </div>
      )}

      {subscriptionLoading ? (
        <div className="rounded-xl border border-border bg-gradient-card p-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading subscription...
        </div>
      ) : subscription ? (
        <div className="rounded-xl border border-border bg-gradient-card p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Subscription</span>
                <Badge variant="outline" className={statusColor(subscription.status)}>
                  {subscription.status}
                </Badge>
              </div>
              <div className="mt-2 text-2xl font-bold font-display">
                {PLAN_LABEL[subscription.plan]} · {fmt(subscription.amount)}/mo
              </div>
              {isTrial && (
                <div className="text-sm text-muted-foreground mt-1">
                  Trial ends in {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"}
                </div>
              )}
              {subscription.status === "cancelled" && (
                <div className="text-sm text-muted-foreground mt-1">Re-activate anytime to continue.</div>
              )}
            </div>

            {subscription.status === "active" && subscription.plan !== "starter" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">Cancel plan</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll keep access until the end of your billing period. Your data stays safe.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep plan</AlertDialogCancel>
                    <AlertDialogAction onClick={doCancel}>Yes, cancel</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {(["starter", "growth", "scale"] as PlanId[]).map((p) => {
              const active = subscription.plan === p && subscription.status === "active";
              const tile = (
                <button
                  type="button"
                  disabled={busy || active}
                  className={`w-full text-left rounded-lg border p-4 transition-smooth disabled:cursor-not-allowed ${
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="font-display font-semibold flex items-center gap-2">
                    {PLAN_LABEL[p]}
                    {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {planPriceIn(p, code, locale)}
                    {p !== "scale" && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {p === "starter"
                      ? "Up to 25 tenants · 1 property"
                      : p === "growth"
                      ? "Up to 250 tenants · unlimited properties"
                      : "Custom — contact sales"}
                  </div>
                </button>
              );

              if (active) return <div key={p}>{tile}</div>;

              if (p === "starter") {
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPendingPlan(p)}
                    disabled={busy}
                    className="text-left rounded-lg border p-4 transition-smooth border-border hover:border-primary/40"
                  >
                    <div className="font-display font-semibold">{PLAN_LABEL[p]}</div>
                    <div className="text-2xl font-bold mt-1">
                      {planPriceIn(p, code, locale)}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">Up to 25 tenants · 1 property</div>
                  </button>
                );
              }

              if (p === "growth") {
                return (
                  <div key={p} onClick={() => setPendingPlan(p)} className="cursor-pointer">
                    {tile}
                  </div>
                );
              }

              return (
                <UpgradePlaceholderDialog
                  key={p}
                  plan={p}
                  planLabel={PLAN_LABEL[p]}
                  onActivated={refresh}
                  trigger={<div className="cursor-pointer">{tile}</div>}
                />
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            Payment provider integration ready — plan changes are recorded instantly for demo.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-gradient-card p-6">
          <p className="text-sm text-muted-foreground">Preparing your subscription profile...</p>
          <Button variant="outline" className="mt-3" onClick={() => void refresh()} disabled={busy}>
            Retry
          </Button>
        </div>
      )}

      <form onSubmit={save} className="rounded-xl border border-border bg-gradient-card p-6 space-y-5">
        <div className="space-y-2">
          <Label>Account email</Label>
          <Input value={user?.email ?? ""} disabled />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Your name" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Contact email</Label>
          <Input type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Currency</Label>
            <div className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              Indian Rupee (₹)
            </div>
            <p className="text-[11px] text-muted-foreground">Always INR — no need to change.</p>
          </div>


        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4 opacity-70">
          <div>
            <div className="font-medium text-sm flex items-center gap-2">
              Email notifications
              <Badge variant="outline" className="text-[10px]">Coming soon</Badge>
            </div>
            <div className="text-xs text-muted-foreground">Billing & tenant updates — provider integration in progress.</div>
          </div>
          <Switch checked={false} disabled />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4 opacity-70">
          <div>
            <div className="font-medium text-sm flex items-center gap-2">
              SMS notifications
              <Badge variant="outline" className="text-[10px]">Coming soon</Badge>
            </div>
            <div className="text-xs text-muted-foreground">Critical alerts via SMS — provider integration in progress.</div>
          </div>
          <Switch checked={false} disabled />
        </div>

        <Button type="submit" variant="hero" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
        </Button>
      </form>
      <form
  onSubmit={
    updatePassword
  }
  className="rounded-xl border border-border bg-gradient-card p-6 space-y-5"
>

  <div>
    <h2 className="text-lg font-semibold">
      Security
    </h2>

    <p className="text-sm text-muted-foreground">
      Change your account password.
    </p>
  </div>

  <div className="grid sm:grid-cols-2 gap-3">

    <div className="space-y-2">
      <Label>
        New password
      </Label>

      <div className="relative">
        <Input
          type={showNewPwd ? "text" : "password"}
          value={
            passwordForm.newPassword
          }
          onChange={(e) =>
            setPasswordForm({
              ...passwordForm,
              newPassword:
                e.target.value,
            })
          }
          placeholder="Enter new password"
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowNewPwd(!showNewPwd)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>

    <div className="space-y-2">
      <Label>
        Confirm password
      </Label>

      <div className="relative">
        <Input
          type={showConfirmPwd ? "text" : "password"}
          value={
            passwordForm.confirmPassword
          }
          onChange={(e) =>
            setPasswordForm({
              ...passwordForm,
              confirmPassword:
                e.target.value,
            })
          }
          placeholder="Confirm new password"
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>

  </div>

  <Button
    type="submit"
    variant="hero"
    disabled={
      passwordBusy
    }
  >
    {passwordBusy ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      "Update password"
    )}
  </Button>

</form>
    </div>
  );
}
