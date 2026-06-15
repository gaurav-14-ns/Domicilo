import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useCurrentTenant } from "@/hooks/useTenantData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Building2, User, Mail, Phone, MapPin, Hash, Home, IndianRupee } from "lucide-react";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/currency";

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
  const { data, loading, error, refresh, updateTenantProfile, updateTenant } = useDataStore();
  const tenant = useCurrentTenant(data?.tenants ?? [], user?.email);
  const [busy, setBusy] = useState(false);

  const [propertyInfo, setPropertyInfo] = useState<any>(null);
  const [ownerInfo, setOwnerInfo] = useState<any>(null);
  const [extraLoading, setExtraLoading] = useState(false);

  useEffect(() => {
    if (!tenant?.propertyId && !tenant?.ownerId) return;
    let cancelled = false;
    (async () => {
      setExtraLoading(true);
      try {
        const [propRes, ownerRes] = await Promise.all([
          tenant.propertyId
            ? supabase.from("properties").select("*").eq("id", tenant.propertyId).single()
            : Promise.resolve({ data: null, error: null }),
          tenant.ownerId
            ? supabase.from("app_settings").select("*").eq("user_id", tenant.ownerId).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);
        if (cancelled) return;
        if (propRes.data) setPropertyInfo(propRes.data);
        if (ownerRes.data) setOwnerInfo(ownerRes.data);
      } catch { /* ignore */ } finally {
        if (!cancelled) setExtraLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tenant?.propertyId, tenant?.ownerId]);

  const profile = data?.tenantProfile ?? {};
  const initialPhone = (tenant?.phone ?? profile.phone ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
  const initialEmergency = useMemo(
    () => parseEmergency(profile.emergency ?? ""),
    [profile.emergency],
  );

  const [form, setForm] = useState({
    phone: initialPhone,
    emergencyName: initialEmergency.name,
    emergencyPhone: initialEmergency.phone,
  });

  useEffect(() => {
    const parsed = parseEmergency(profile.emergency ?? "");
    setForm({
      phone: (tenant?.phone || profile.phone || "").replace(/\D/g, "").slice(0, 10),
      emergencyName: parsed.name,
      emergencyPhone: parsed.phone,
    });
  }, [tenant?.id, tenant?.phone, profile.phone, profile.emergency]);

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
      toast.error("Update failed", { description: err?.message ?? "Unknown error" });
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState title="Failed to load profile" description={error} onRetry={refresh} />;
  if (loading) return <LoadingState title="Loading profile..." />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">Profile</h1>
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

      {(propertyInfo || ownerInfo || extraLoading) && (
        <div className="rounded-xl border border-border bg-gradient-card p-6 space-y-5">
          <h2 className="text-lg font-display font-semibold text-gradient">Property & Owner</h2>

          {extraLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading details...
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {propertyInfo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Property
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium">{propertyInfo.name}</span>
                    </div>
                    {propertyInfo.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span>
                          {[propertyInfo.address, propertyInfo.city, propertyInfo.state, propertyInfo.pincode].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{formatMoney(Number(propertyInfo.price_monthly) || 0)} / month</span>
                    </div>
                    {propertyInfo.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {propertyInfo.amenities.map((a: string) => (
                          <span key={a} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {ownerInfo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="h-4 w-4" />
                    Owner
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{ownerInfo.display_name || "Owner"}</span>
                    </div>
                    {ownerInfo.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{ownerInfo.contact_email}</span>
                      </div>
                    )}
                    {ownerInfo.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{ownerInfo.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
