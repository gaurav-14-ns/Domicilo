import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SUPPORTED_CURRENCIES, localeForCurrency, type CurrencyCode } from "@/lib/currency";

export default function Settings() {
  const { user } = useAuth();
  const { data, updateSettings } = useDataStore();
  const { theme, setTheme } = useTheme();
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

  // Hydrate when remote settings arrive
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
  }, [data.settings, user?.email]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateSettings(form);
      if (form.theme !== theme) setTheme(form.theme);
      toast.success("Settings saved", { description: "Your preferences have been updated." });
    } catch (err: any) {
      toast.error("Save failed", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences.</p>
      </div>
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
            <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
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
            <div className="text-xs text-muted-foreground">Critical alerts via SMS.</div>
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
