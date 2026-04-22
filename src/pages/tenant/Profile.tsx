import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useCurrentTenant } from "@/hooks/useTenantData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { data, updateTenantProfile, updateTenant } = useDataStore();
  const tenant = useCurrentTenant(data.tenants, user?.email);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    phone: tenant?.phone ?? data.tenantProfile.phone,
    emergency: data.tenantProfile.emergency,
  });

  useEffect(() => {
    if (tenant) setForm((f) => ({ ...f, phone: tenant.phone || f.phone }));
  }, [tenant?.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await new Promise((r) => setTimeout(r, 350));
    updateTenantProfile({ phone: form.phone, emergency: form.emergency, email: user?.email ?? "" });
    if (tenant) updateTenant(tenant.id, { phone: form.phone });
    setBusy(false);
    toast.success("Profile updated");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Profile</h1>
      <form onSubmit={save} className="rounded-xl border border-border bg-gradient-card p-6 space-y-4">
        <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
        <div className="space-y-2"><Label>Name</Label><Input value={tenant?.name ?? ""} disabled /></div>
        <div className="space-y-2"><Label>Property</Label><Input value={tenant ? `${tenant.property} · Room ${tenant.room}` : ""} disabled /></div>
        <div className="space-y-2"><Label>Phone</Label><Input placeholder="+91 …" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="space-y-2"><Label>Emergency contact</Label><Input placeholder="Name & phone" value={form.emergency} onChange={(e) => setForm({ ...form, emergency: e.target.value })} /></div>
        <Button type="submit" variant="hero" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </form>
    </div>
  );
}
