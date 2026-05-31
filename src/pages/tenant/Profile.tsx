import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useCurrentTenant } from "@/hooks/useTenantData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Stored in tenant_profiles.emergency as a single text column for backwards
// compatibility: "Name · 9876543210". Parse leniently when loading.
const SEP = " · ";
function parseEmergency(raw: string): { name: string; phone: string } {
  if (!raw) return { name: "", phone: "" };
  // Try the canonical separator first.
  const idx = raw.indexOf(SEP);
  if (idx >= 0) {
    return {
      name: raw.slice(0, idx).trim(),
      phone: raw.slice(idx + SEP.length).replace(/\D/g, "").slice(0, 10),
    };
  }
  // Fallback: split off any trailing run of digits as the phone.
  const m = raw.match(/^(.*?)[\s,;:-]*([0-9 ()+-]{7,})$/);
  if (m) return { name: m[1].trim(), phone: m[2].replace(/\D/g, "").slice(0, 10) };
  return { name: raw.trim(), phone: "" };
}

export default function Profile() {
  const { user } = useAuth();
  const { data, updateTenantProfile, updateTenant } = useDataStore();
  const tenant = useCurrentTenant(data.tenants, user?.email);
  const [busy, setBusy] = useState(false);

  const initialPhone = (tenant?.phone ?? data.tenantProfile.phone ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
  const initialEmergency = useMemo(
    () => parseEmergency(data.tenantProfile.emergency ?? ""),
    [data.tenantProfile.emergency],
  );

  const [form, setForm] = useState({
    phone: initialPhone,
    emergencyName: initialEmergency.name,
    emergencyPhone: initialEmergency.phone,
  });

  useEffect(() => {
    const parsed = parseEmergency(data.tenantProfile.emergency ?? "");
    setForm({
      phone: (tenant?.phone || data.tenantProfile.phone || "").replace(/\D/g, "").slice(0, 10),
      emergencyName: parsed.name,
      emergencyPhone: parsed.phone,
    });
  }, [tenant?.id, tenant?.phone, data.tenantProfile.phone, data.tenantProfile.emergency]);

  const phoneError =
    form.phone === "" ? "" : form.phone.length !== 10 ? "Phone must be exactly 10 digits" : "";
  const emergencyNameError =
    form.emergencyName.trim() === "" && form.emergencyPhone === ""
      ? "" // both empty = field optional overall
      : form.emergencyName.trim().length < 2
        ? "Contact name is required (min 2 characters)"
        : "";
  const emergencyPhoneError =
    form.emergencyName.trim() === "" && form.emergencyPhone === ""
      ? ""
      : form.emergencyPhone.length !== 10
        ? "Emergency phone must be exactly 10 digits"
        : "";

  const hasError = !!(phoneError || emergencyNameError || emergencyPhoneError);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasError) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setBusy(true);
    try {
      const emergencyCombined =
        form.emergencyName.trim() && form.emergencyPhone
          ? `${form.emergencyName.trim()}${SEP}${form.emergencyPhone}`
          : "";
      await updateTenantProfile({
        phone: form.phone,
        emergency: emergencyCombined,
        email: user?.email ?? "",
      });
      if (tenant) await updateTenant(tenant.id, { phone: form.phone });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error("Update failed", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Profile</h1>
      <form onSubmit={save} className="rounded-xl border border-border bg-gradient-card p-6 space-y-4">
        <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
        <div className="space-y-2"><Label>Name</Label><Input value={tenant?.name ?? ""} disabled /></div>
        <div className="space-y-2"><Label>Property</Label><Input value={tenant ? `${tenant.property} · Room ${tenant.room}` : "Not yet assigned"} disabled /></div>

        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            placeholder="10-digit number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            aria-invalid={!!phoneError}
            className={phoneError ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
        </div>

        <div className="space-y-2">
          <Label>Emergency contact</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Input
                placeholder="Contact name"
                value={form.emergencyName}
                maxLength={60}
                onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
                aria-invalid={!!emergencyNameError}
                className={emergencyNameError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {emergencyNameError && <p className="text-xs text-destructive">{emergencyNameError}</p>}
            </div>
            <div className="space-y-1">
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                placeholder="10-digit phone"
                value={form.emergencyPhone}
                onChange={(e) =>
                  setForm({ ...form, emergencyPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                }
                aria-invalid={!!emergencyPhoneError}
                className={emergencyPhoneError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {emergencyPhoneError && <p className="text-xs text-destructive">{emergencyPhoneError}</p>}
            </div>
          </div>
        </div>

        <Button type="submit" variant="hero" disabled={busy || hasError}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </form>
    </div>
  );
}
