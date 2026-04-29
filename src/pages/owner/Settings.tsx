import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useSubscription } from "@/hooks/useSubscription";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SUPPORTED_CURRENCIES, localeForCurrency, type CurrencyCode, planPriceIn } from "@/lib/currency";
import type { PlanId } from "@/lib/currency";
import { UpgradePlaceholderDialog } from "@/components/UpgradePlaceholderDialog";

const PLAN_LABEL: Record<PlanId, string> = { starter: "Starter", growth: "Growth", scale: "Scale" };

export default function Settings() {
  const { user } = useAuth();
  const { data, updateSettings } = useDataStore();
  const { theme, setTheme } = useTheme();
  const { fmt, code, locale } = useCurrency();
  const { subscription, changePlan, cancel, trialDaysLeft, isTrial, refresh } = useSubscription();
  const [busy, setBusy] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [planNotice, setPlanNotice] = useState<{
    type: "success" | "error";
    message: string;
    seconds: number;
  } | null>(null);

  const [form, setForm] = useState({
    displayName: data.settings.displayName,
    companyName: data.settings.companyName,
    ownerEmail: data.settings.ownerEmail || user?.email || "",
    emailNotifications: data.settings.emailNotifications,
    smsNotifications: data.settings.smsNotifications,
    theme: data.settings.theme,
    currencyCode: data.settings.currencyCode,
    locale: data.settings.locale,
  });

  // Track explicit user theme changes — never auto-apply on save.
  const themeDirty = useRef(false);

  useEffect(() => {
    setForm({
      displayName: data.settings.displayName,
      companyName: data.settings.companyName,
      ownerEmail: data.settings.ownerEmail || user?.email || "",
      emailNotifications: data.settings.emailNotifications,
      smsNotifications: data.settings.smsNotifications,
      theme: data.settings.theme,
      currencyCode: data.settings.currencyCode,
      locale: data.settings.locale,
    });
    themeDirty.current = false;
  }, [data.settings, user?.email]);

  useEffect(() => {
  if (!planNotice) return;

  const timer = setInterval(() => {
    setPlanNotice((prev) => {
      if (!prev) return null;
      if (prev.seconds <= 1) return null;

      return {
        ...prev,
        seconds: prev.seconds - 1,
      };
    });
  }, 1000);

  return () => clearInterval(timer);
}, [planNotice]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateSettings(form);
      // Only switch the live theme if the user explicitly picked a new value here.
      if (themeDirty.current && form.theme !== theme) setTheme(form.theme);
      themeDirty.current = false;
      toast.success("Settings saved", { description: "Your preferences have been updated." });
    } catch (err: any) {
      toast.error("Save failed", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  // ----- Subscription block -----
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
    toast.error("Couldn't change plan", {
      description: err.message,
    });
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
    toast.error("Couldn't cancel", {
      description: err.message,
    });
  } finally {
    setBusy(false);
  }
};

  const statusColor = (s: string) =>
    s === "active" ? "bg-primary/15 text-primary"
    : s === "trial" ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
    : "bg-destructive/15 text-destructive";

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
                if (pendingPlan) upgrade(pendingPlan);
                setPendingPlan(null);
              }}
            >
              Yes, Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and subscription.</p>
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

      {subscription && (
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
                  <div className="text-2xl font-bold mt-1">{planPriceIn(p, code, locale)}{p !== "scale" && <span className="text-xs font-normal text-muted-foreground">/mo</span>}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {p === "starter" ? "Up to 25 tenants · 1 property" : p === "growth" ? "Up to 250 tenants · unlimited properties" : "Custom — contact sales"}
                  </div>
                </button>
              );
              if (active || p === "scale") return <div key={p}>{tile}</div>;
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
                    <div className="text-2xl font-bold mt-1">{planPriceIn(p, code, locale)}<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
                    <div className="text-[11px] text-muted-foreground mt-1">Up to 25 tenants · 1 property</div>
                  </button>
                );
              }

              if (p === "growth") {
                return (
                  <div
                    key={p}
                    onClick={() => setPendingPlan(p)}
                    className="cursor-pointer"
                  >
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
                trigger={
                <div className="cursor-pointer">
                  {tile}
                </div>
                }
                />
              );
          
            })}
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" /> Payment provider integration ready — plan changes are recorded instantly for demo.
          </p>
        </div>
      )}

      <form onSubmit={save} className="rounded-xl border border-border bg-gradient-card p-6 space-y-5">
        <div className="space-y-2"><Label>Account email</Label><Input value={user?.email ?? ""} disabled /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Display name</Label><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Your name" /></div>
          <div className="space-y-2"><Label>Company name</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Domicilo" /></div>
        </div>
        <div className="space-y-2"><Label>Contact email</Label><Input type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} /></div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={form.currencyCode}
              onValueChange={(v) => setForm({ ...form, currencyCode: v as CurrencyCode, locale: localeForCurrency(v as CurrencyCode) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Used everywhere amounts are shown.</p>
          </div>
          <div className="space-y-2">
            <Label>Theme preference</Label>
            <Select
              value={form.theme}
              onValueChange={(v) => { themeDirty.current = true; setForm({ ...form, theme: v as any }); }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Use the toggle in the header for one-off switches.</p>
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
    </div>
  );
}
