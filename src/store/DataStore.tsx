import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type {
  AppData, Property, Tenant, Transaction, AdminOrg, Settings, TenantProfile,
} from "./types";
import { detectCurrencyFromBrowser, type CurrencyCode } from "@/lib/currency";
import { monthKey, monthsBetween, todayISO } from "@/lib/format";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const defaultSettings: Settings = {
  displayName: "",
  companyName: "Domicilo",
  ownerEmail: "",
  emailNotifications: true,
  smsNotifications: false,
  theme: "system",
  currencyCode: "INR",
  locale: "en-IN",
};

const initialData: AppData = {
  properties: [],
  tenants: [],
  transactions: [],
  adminOrgs: [],
  settings: defaultSettings,
  tenantProfile: { phone: "", emergency: "", email: "" },
};

// ---------------------------------------------------------------------------
// Row mappers (DB <-> client model)
// ---------------------------------------------------------------------------
const mapProperty = (r: any, tenants: any[], txs: any[]): Property => {
  const occupied = tenants.filter(
    (t) => t.property_id === r.id && t.status !== "deactivated" && t.status !== "moved_out"
  ).length;
  const revenue = txs
    .filter((t) => t.property_id === r.id && t.status === "completed")
    .reduce((s, t) => s + Math.max(0, Number(t.amount) || 0), 0);
  return {
    id: r.id,
    name: r.name,
    address: r.address ?? "",
    units: Number(r.units) || 0,
    occupied: Math.min(occupied, Number(r.units) || 0),
    revenue,
  };
};

const mapTenant = (r: any, propertiesById: Map<string, any>): Tenant => ({
  id: r.id,
  name: r.name,
  room: r.room ?? "",
  property: propertiesById.get(r.property_id)?.name ?? "",
  propertyId: r.property_id ?? undefined,
  rent: Number(r.rent) || 0,
  deposit: Number(r.deposit) || 0,
  email: r.email ?? "",
  phone: r.phone ?? "",
  startDate: r.start_date,
  status: r.status,
  joined: r.start_date,
});

const mapTx = (r: any, tenantsById: Map<string, any>, propertiesById: Map<string, any>): Transaction => {
  const t = r.tenant_id ? tenantsById.get(r.tenant_id) : undefined;
  const pId = r.property_id ?? t?.property_id;
  const p = pId ? propertiesById.get(pId) : undefined;
  return {
    id: r.id,
    date: r.date,
    tenant: t?.name ?? "",
    tenantId: r.tenant_id ?? undefined,
    propertyId: pId ?? undefined,
    property: p?.name,
    type: r.type,
    amount: Number(r.amount) || 0,
    status: r.status,
    note: r.note ?? undefined,
    auto: !!r.auto,
  };
};

const mapSettings = (r: any | null): Settings => {
  if (!r) return defaultSettings;
  return {
    displayName: r.display_name ?? "",
    companyName: r.company_name ?? "Domicilo",
    ownerEmail: r.contact_email ?? "",
    emailNotifications: !!r.email_notifications,
    smsNotifications: !!r.sms_notifications,
    theme: (r.theme ?? "system") as Settings["theme"],
    currencyCode: (r.currency_code ?? "INR") as CurrencyCode,
    locale: r.locale ?? "en-IN",
  };
};

const mapTenantProfile = (r: any | null): TenantProfile => ({
  phone: r?.phone ?? "",
  emergency: r?.emergency ?? "",
  email: r?.email ?? "",
});

const mapAdminOrg = (r: any): AdminOrg => ({
  id: r.id,
  name: r.name,
  owner: r.owner ?? "",
  plan: r.plan ?? "Startup",
  users: Number(r.users) || 0,
  mrr: Number(r.mrr) || 0,
});

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
type Updater<T> = (prev: T) => T;

type AddPropertyInput = { name: string; address: string; units: number; occupied?: number };
type AddTenantInput = Omit<Tenant, "id" | "joined" | "property"> & { joined?: string; property?: string };
type AddTransactionInput = Omit<Transaction, "id">;

type DataStoreContextValue = {
  data: AppData;
  loading: boolean;

  addProperty: (p: AddPropertyInput) => Promise<void>;
  updateProperty: (id: string, patch: Partial<Property>) => Promise<void>;
  removeProperty: (id: string) => Promise<void>;

  addTenant: (t: AddTenantInput) => Promise<void>;
  updateTenant: (id: string, patch: Partial<Tenant>) => Promise<void>;
  setTenantStatus: (id: string, status: Tenant["status"]) => Promise<void>;
  moveOutTenant: (id: string) => Promise<void>;
  removeTenant: (id: string) => Promise<void>;

  addTransaction: (t: AddTransactionInput) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;

  updateAdminOrgs: (updater: Updater<AdminOrg[]>) => Promise<void>;

  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  updateTenantProfile: (patch: Partial<TenantProfile>) => Promise<void>;

  refresh: () => Promise<void>;
  resetAll: () => void;
};

const DataStoreContext = createContext<DataStoreContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function DataStoreProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(false);
  const reconcileRef = useRef<Promise<void> | null>(null);

  // -------------------------------------------------------------------------
  // Auto-generate monthly Rent rows for active tenants (server-side dedup
  // via UNIQUE(tenant_id, type, month_key)).
  // -------------------------------------------------------------------------
  const autoGenerateRent = useCallback(async (
    tenants: any[],
    txs: any[],
    properties: any[],
    ownerId: string,
  ) => {
    const current = monthKey(new Date());
    const existingKeys = new Set(
      txs
        .filter((t) => t.type === "Rent" && t.tenant_id && t.month_key)
        .map((t) => `${t.tenant_id}|${t.month_key}`)
    );
    const propsById = new Map(properties.map((p) => [p.id, p]));

    const additions: any[] = [];
    for (const t of tenants) {
      if (t.status === "deactivated" || t.status === "moved_out") continue;
      if (!t.start_date) continue;
      const start = monthKey(t.start_date);
      if (start > current) continue;
      const months = monthsBetween(start, current);
      for (const m of months) {
        const key = `${t.id}|${m}`;
        if (existingKeys.has(key)) continue;
        if (t.status === "paused" && m === current) continue;
        additions.push({
          owner_id: ownerId,
          tenant_id: t.id,
          property_id: t.property_id,
          date: `${m}-01`,
          type: "Rent",
          amount: t.rent,
          status: m === current ? "pending" : "completed",
          auto: true,
          month_key: m,
        });
        existingKeys.add(key);
      }
    }
    if (!additions.length) return [];
    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert(additions)
      .select("*");
    if (error) {
      // race-condition: unique violations are fine to ignore
      if (error.code !== "23505") console.warn("auto-rent insert", error);
      return [];
    }
    return inserted ?? [];
  }, []);

  // -------------------------------------------------------------------------
  // Fetch everything (scoped by RLS automatically).
  // -------------------------------------------------------------------------
  const fetchAll = useCallback(async () => {
    if (!user) {
      setData(initialData);
      return;
    }
    setLoading(true);
    try {
      const [{ data: properties }, { data: tenants }, { data: txs }, { data: settings }, { data: profile }, { data: orgs }] =
        await Promise.all([
          supabase.from("properties").select("*").order("created_at", { ascending: true }),
          supabase.from("tenants").select("*").order("created_at", { ascending: true }),
          supabase.from("transactions").select("*").order("date", { ascending: false }),
          supabase.from("app_settings").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("tenant_profiles").select("*").eq("user_id", user.id).maybeSingle(),
          role === "admin"
            ? supabase.from("admin_orgs").select("*").order("created_at", { ascending: true })
            : Promise.resolve({ data: [] as any[] }),
        ]);

      let txRows = txs ?? [];
      // Owners: auto-generate rent rows for missing months
      if (role === "owner" && (tenants?.length ?? 0) > 0) {
        const added = await autoGenerateRent(tenants ?? [], txRows, properties ?? [], user.id);
        if (added.length) txRows = [...added, ...txRows];
      }

      const propertiesById = new Map((properties ?? []).map((p) => [p.id, p]));
      const tenantsById = new Map((tenants ?? []).map((t) => [t.id, t]));

      setData({
        properties: (properties ?? []).map((r) => mapProperty(r, tenants ?? [], txRows)),
        tenants: (tenants ?? []).map((r) => mapTenant(r, propertiesById)),
        transactions: txRows.map((r) => mapTx(r, tenantsById, propertiesById))
          .sort((a, b) => (a.date < b.date ? 1 : -1)),
        adminOrgs: (orgs ?? []).map(mapAdminOrg),
        settings: mapSettings(settings),
        tenantProfile: mapTenantProfile(profile),
      });
    } finally {
      setLoading(false);
    }
  }, [user, role, autoGenerateRent]);

  // First load + auth changes
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime: refetch on any owned/assigned data change so cross-portal edits sync.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`ds-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tenants" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "tenant_profiles" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchAll]);

  // Bootstrap settings: detect currency from browser ONLY for brand-new accounts
  // that have never explicitly saved settings. Once the user picks a currency
  // (or any other setting is saved), `updated_at` advances past `created_at`
  // and we never overwrite their choice on subsequent logins.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: row } = await supabase
        .from("app_settings")
        .select("currency_code, locale, created_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || !row) return;
      const created = new Date(row.created_at).getTime();
      const updated = new Date(row.updated_at).getTime();
      const neverEdited = Math.abs(updated - created) < 5000; // within 5s of signup
      if (!neverEdited) return;
      const detected = detectCurrencyFromBrowser();
      if (row.currency_code === "INR" && row.locale === "en-IN" && detected.code !== "INR") {
        await supabase
          .from("app_settings")
          .update({ currency_code: detected.code, locale: detected.locale })
          .eq("user_id", user.id);
        if (!cancelled) {
          setData((d) => ({
            ...d,
            settings: { ...d.settings, currencyCode: detected.code, locale: detected.locale },
          }));
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (reconcileRef.current) return reconcileRef.current;
    const p = fetchAll();
    reconcileRef.current = p.finally(() => { reconcileRef.current = null; });
    return p;
  }, [fetchAll]);

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------
  const addProperty = useCallback(async (p: AddPropertyInput) => {
  if (!user) {
    toast.error("Please sign in first.");
    return;
  }

  try {
    const { error } = await supabase.from("properties").insert({
      owner_id: user.id,
      name: p.name,
      address: p.address,
      units: p.units,
    });

    if (error) throw error;

    await refresh();
    toast.success("Property added successfully.");
  } catch (error: any) {
    toast.error(error.message || "Failed to add property.");
  }
}, [user, refresh]);

const updateProperty = useCallback(async (id: string, patch: Partial<Property>) => {
  try {
    const dbPatch: any = {};

    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.address !== undefined) dbPatch.address = patch.address;
    if (patch.units !== undefined) dbPatch.units = patch.units;

    const { error } = await supabase
      .from("properties")
      .update(dbPatch)
      .eq("id", id);

    if (error) throw error;

    await refresh();
    toast.success("Property updated successfully.");
  } catch (error: any) {
    toast.error(error.message || "Failed to update property.");
  }
}, [refresh]);

const removeProperty = useCallback(async (id: string) => {
  try {
    const { error: tenantError } = await supabase
      .from("tenants")
      .update({
        property_id: null,
        status: "moved_out",
      })
      .eq("property_id", id);

    if (tenantError) throw tenantError;

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await refresh();
    toast.success("Property removed successfully.");
  } catch (error: any) {
    toast.error(error.message || "Failed to remove property.");
  }
}, [refresh]);

  const addTenant = useCallback(async (t: AddTenantInput) => {
    if (!user) return;
    await supabase.from("tenants").insert({
      owner_id: user.id,
      property_id: t.propertyId || null,
      name: t.name,
      room: t.room,
      rent: t.rent,
      deposit: t.deposit,
      email: t.email,
      phone: t.phone,
      start_date: t.startDate,
      status: t.status ?? "active",
    });
    await refresh();
  }, [user, refresh]);

  const updateTenant = useCallback(async (id: string, patch: Partial<Tenant>) => {
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.room !== undefined) dbPatch.room = patch.room;
    if (patch.propertyId !== undefined) dbPatch.property_id = patch.propertyId || null;
    if (patch.rent !== undefined) dbPatch.rent = patch.rent;
    if (patch.deposit !== undefined) dbPatch.deposit = patch.deposit;
    if (patch.email !== undefined) dbPatch.email = patch.email;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    await supabase.from("tenants").update(dbPatch).eq("id", id);
    await refresh();
  }, [refresh]);

  const setTenantStatus = useCallback(async (id: string, status: Tenant["status"]) => {
    await supabase.from("tenants").update({ status }).eq("id", id);
    await refresh();
  }, [refresh]);

  const moveOutTenant = useCallback(async (id: string) => {
    await supabase.from("tenants").update({ status: "moved_out" }).eq("id", id);
    await refresh();
  }, [refresh]);

  const removeTenant = useCallback(async (id: string) => {
    await supabase.from("tenants").delete().eq("id", id);
    await refresh();
  }, [refresh]);

  const addTransaction = useCallback(async (t: AddTransactionInput) => {
    if (!user) return;
    await supabase.from("transactions").insert({
      owner_id: user.id,
      tenant_id: t.tenantId || null,
      property_id: t.propertyId || null,
      date: t.date || todayISO(),
      type: t.type,
      amount: t.amount,
      status: t.status,
      note: t.note ?? null,
      auto: !!t.auto,
    });
    await refresh();
  }, [user, refresh]);

  const updateTransaction = useCallback(async (id: string, patch: Partial<Transaction>) => {
    const dbPatch: any = {};
    if (patch.date !== undefined) dbPatch.date = patch.date;
    if (patch.tenantId !== undefined) dbPatch.tenant_id = patch.tenantId || null;
    if (patch.propertyId !== undefined) dbPatch.property_id = patch.propertyId || null;
    if (patch.type !== undefined) dbPatch.type = patch.type;
    if (patch.amount !== undefined) dbPatch.amount = patch.amount;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.note !== undefined) dbPatch.note = patch.note;
    await supabase.from("transactions").update(dbPatch).eq("id", id);
    await refresh();
  }, [refresh]);

  const removeTransaction = useCallback(async (id: string) => {
    await supabase.from("transactions").delete().eq("id", id);
    await refresh();
  }, [refresh]);

  const updateAdminOrgs = useCallback(async (updater: Updater<AdminOrg[]>) => {
    const next = updater(data.adminOrgs);
    // Replace all: simplest model. For each in `next` upsert; delete missing.
    const ids = new Set(next.map((o) => o.id));
    const removedIds = data.adminOrgs.filter((o) => !ids.has(o.id)).map((o) => o.id);
    if (removedIds.length) await supabase.from("admin_orgs").delete().in("id", removedIds);
    if (next.length) {
      await supabase.from("admin_orgs").upsert(
        next.map((o) => ({
          id: o.id, name: o.name, owner: o.owner, plan: o.plan, users: o.users, mrr: o.mrr,
        }))
      );
    }
    await refresh();
  }, [data.adminOrgs, refresh]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    if (!user) return;
    const dbPatch: any = {};
    if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName;
    if (patch.companyName !== undefined) dbPatch.company_name = patch.companyName;
    if (patch.ownerEmail !== undefined) dbPatch.contact_email = patch.ownerEmail;
    if (patch.emailNotifications !== undefined) dbPatch.email_notifications = patch.emailNotifications;
    if (patch.smsNotifications !== undefined) dbPatch.sms_notifications = patch.smsNotifications;
    if (patch.theme !== undefined) dbPatch.theme = patch.theme;
    if (patch.currencyCode !== undefined) dbPatch.currency_code = patch.currencyCode;
    if (patch.locale !== undefined) dbPatch.locale = patch.locale;
    await supabase.from("app_settings").upsert({ user_id: user.id, ...dbPatch });
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, [user]);

  const updateTenantProfile = useCallback(async (patch: Partial<TenantProfile>) => {
    if (!user) return;
    const dbPatch: any = { user_id: user.id };
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.emergency !== undefined) dbPatch.emergency = patch.emergency;
    if (patch.email !== undefined) dbPatch.email = patch.email;
    await supabase.from("tenant_profiles").upsert(dbPatch);
    setData((d) => ({ ...d, tenantProfile: { ...d.tenantProfile, ...patch } }));
  }, [user]);

  const resetAll = useCallback(() => {
    setData(initialData);
  }, []);

  const value = useMemo<DataStoreContextValue>(
    () => ({
      data, loading,
      addProperty, updateProperty, removeProperty,
      addTenant, updateTenant, setTenantStatus, moveOutTenant, removeTenant,
      addTransaction, updateTransaction, removeTransaction,
      updateAdminOrgs, updateSettings, updateTenantProfile,
      refresh, resetAll,
    }),
    [data, loading, addProperty, updateProperty, removeProperty, addTenant, updateTenant,
     setTenantStatus, moveOutTenant, removeTenant, addTransaction, updateTransaction,
     removeTransaction, updateAdminOrgs, updateSettings, updateTenantProfile, refresh, resetAll],
  );

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}

// Selector helpers
export const useProperties = () => useDataStore().data.properties;
export const useTenants = () => useDataStore().data.tenants;
export const useTransactions = () => useDataStore().data.transactions;
export const useAdminOrgs = () => useDataStore().data.adminOrgs;
export const useSettings = () => useDataStore().data.settings;
export const useTenantProfile = () => useDataStore().data.tenantProfile;
