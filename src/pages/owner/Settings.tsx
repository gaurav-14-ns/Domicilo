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

const PLAN_LABEL: Record<PlanId, string> = { starter: "Starter", growth: "Growth", scale: "Scale" };

export default function Settings() {
  const { user } = useAuth();
  const { data, updateSettings } = useDataStore();
  const { theme, setTheme } = useTheme();
  const { fmt, code, locale } = useCurrency();
  const { subscription, changePlan, cancel, trialDaysLeft, isTrial, refresh } = useSubscription();
  const [busy, setBusy] = useState(false);

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
      toast.success(`Switched to ${PLAN_LABEL[plan]}`, { description: `${planPriceIn(plan, code, locale)} / month` });
    } catch (err: any) {
      toast.error("Couldn't change plan", { description: err.message });
    } finally { setBusy(false); }
  };
  const doCancel = async () => {
    setBusy(true);
    try {
      await cancel();
      toast.success("Subscription cancelled", { description: "You can re-activate anytime." });
    } catch (err: any) {
      toast.error("Couldn't cancel", { description: err.message });
    } finally { setBusy(false); }
  };

  const statusColor = (s: string) =>
    s === "active" ? "bg-primary/15 text-primary"
    : s === "trial" ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
    : "bg-destructive/15 text-destructive";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and subscription.</p>
      </div>

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
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => p !== "scale" && upgrade(p)}
                  disabled={busy || active || p === "scale"}
                  className={`text-left rounded-lg border p-4 transition-smooth disabled:cursor-not-allowed ${
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

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <div className="font-medium text-sm">Email notifications</div>
            <div className="text-xs text-muted-foreground">Billing & tenant updates.</div>
          </div>
          <Switch checked={form.emailNotifications} onCheckedChange={(v) => setForm({ ...form, emailNotifications: v })} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <div className="font-medium text-sm">SMS notifications</div>
            <div className="text-xs text-muted-foreground">Critical alerts via SMS (provider integration ready).</div>
          </div>
          <Switch checked={form.smsNotifications} onCheckedChange={(v) => setForm({ ...form, smsNotifications: v })} />
        </div>
        <Button type="submit" variant="hero" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
