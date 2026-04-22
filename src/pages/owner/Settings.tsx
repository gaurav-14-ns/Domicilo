import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { data, updateSettings } = useDataStore();
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    toast.success("Settings saved");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences.</p>
      </div>
      <form onSubmit={save} className="rounded-xl border border-border bg-gradient-card p-6 space-y-5">
        <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
        <div className="space-y-2"><Label>Display name</Label><Input value={data.settings.displayName} onChange={(e) => updateSettings({ displayName: e.target.value })} placeholder="Your name" /></div>
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <div className="font-medium text-sm">Email notifications</div>
            <div className="text-xs text-muted-foreground">Receive billing & tenant updates.</div>
          </div>
          <Switch checked={data.settings.emailNotifications} onCheckedChange={(v) => updateSettings({ emailNotifications: v })} />
        </div>
        <Button type="submit" variant="hero" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
      </form>
    </div>
  );
}
