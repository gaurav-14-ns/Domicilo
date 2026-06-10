import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import type {
  AppData, Property, Tenant, Transaction, AdminOrg, Settings, TenantProfile,
} from "./types";
import { detectCurrencyFromBrowser, type CurrencyCode } from "@/lib/currency";
import { monthKey, monthsBetween, todayISO } from "@/lib/format";
import { toast } from "sonner";
import { uuid } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const defaultSettings: Settings = {
  displayName: "",
  companyName: "Domicilo",
  ownerEmail: "",
  emailNotifications: true,
  smsNotifications: false,
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
  subscription: null,
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
    ownerId: r.owner_id,
    name: r.name,
    address: r.address ?? "",
    units: Number(r.units) || 0,
    occupied: Math.min(occupied, Number(r.units) || 0),
    revenue,
    city: r.city ?? "",
    state: r.state ?? "",
    pincode: r.pincode ?? "",
    priceMonthly: Number(r.price_monthly) || 0,
    amenities: r.amenities ?? [],
    description: r.description ?? "",
    images: r.images ?? [],
    available: r.available ?? true,
    bedrooms: Number(r.bedrooms) || 1,
    bathrooms: Number(r.bathrooms) || 1,
    propertyType: r.property_type ?? "Apartment",
  };
};

const mapTenant = (r: any, propertiesById: Map<string, any>): Tenant => ({
  id: r.id,
  name: r.name,
  room: r.room ?? "",
  property: propertiesById.get(r.property_id)?.name ?? "",
  ownerId: r.owner_id ?? undefined,
  propertyId: r.property_id ?? undefined,
  rent: Number(r.rent) || 0,
  deposit: Number(r.deposit) || 0,
  email: r.email ?? "",
  phone: r.phone ?? "",
  startDate: r.start_date,
  status: r.status,
  currencyCode:
  r.currency_code,
  locale:
  r.locale,
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
    currencyCode:
    r.currency_code,
    locale:
    r.locale,
    status: r.status,
    note: r.note ?? undefined,
    auto: !!r.auto,
    method: r.method ?? undefined,
    receiptNo: r.receipt_no ?? undefined,
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

type AddPropertyInput = {
  name: string; address: string; units: number;
  city?: string; state?: string; pincode?: string; priceMonthly?: number;
  amenities?: string[]; description?: string; images?: string[];
  available?: boolean; bedrooms?: number; bathrooms?: number; propertyType?: string;
};
type AddTenantInput = Omit<Tenant, "id" | "joined" | "property"> & { joined?: string; property?: string };
type AddTransactionInput = Omit<Transaction, "id">;

type DataStoreContextValue = {
  data: AppData;
  loading: boolean;
  error: string | null;

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
  const [error, setError] =
  useState<string | null>(
    null
  );
  const reconcileRef =
  useRef<Promise<void> | null>(
    null
  );

const mountedRef =
  useRef(true);

useEffect(() => {
  mountedRef.current = true;
  return () => { mountedRef.current = false; };
}, []);

  const roleRef =
  useRef(role);
  roleRef.current = role;

  const fetchedRef =
  useRef(false);
  const lastFetchedRoleRef =
  useRef<AppRole | null>(null);
  const lastFetchedUserIdRef =
  useRef<string | null>(null);
  
  const realtimeRefreshTimeout =
  useRef<
    ReturnType<
      typeof setTimeout
    > | null
  >(null);

  // -------------------------------------------------------------------------
  // Periodic maintenance: auto-generate rent + overdue escalation.
  // Runs every 30 minutes and on mount, but NOT on every data fetch.
  // -------------------------------------------------------------------------
  const runMaintenance =
  useCallback(async () => {
    if (!user || role !== "owner") return;
    try {
      // 1. Fetch raw data needed for maintenance
      const { data: tenants } = await supabase.from("tenants").select("*").eq("owner_id", user.id).order("created_at", { ascending: true });
      const { data: txs } = await supabase.from("transactions").select("*").eq("owner_id", user.id).order("date", { ascending: false });
      if (!tenants || !txs) return;

      // 2. Auto-generate rent
      const current = monthKey(new Date());
      const existingKeys = new Set(
        txs
          .filter((t: any) => t.type === "Rent" && t.tenant_id && t.month_key)
          .map((t: any) => `${t.tenant_id}|${t.month_key}`)
      );
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
            owner_id: user.id,
            tenant_id: t.id,
            property_id: t.property_id,
            date: `${m}-01`,
            type: "Rent",
            amount: t.rent,
            currency_code: t.currency_code ?? "INR",
            locale: t.locale ?? "en-IN",
            status: m === current ? "pending" : "completed",
            auto: true,
            month_key: m,
          });
          existingKeys.add(key);
        }
      }
      if (additions.length) {
        const { error: rentErr } = await supabase.from("transactions").insert(additions);
        if (rentErr && rentErr.code !== "23505") console.warn("auto-rent insert", rentErr);
      }

      // 3. Overdue escalation
      const overdueThreshold = new Date();
      overdueThreshold.setDate(overdueThreshold.getDate() - 7);
      const overdueIds = (txs ?? [])
        .filter((tx: any) => tx.status === "pending" && tx.date && new Date(tx.date) < overdueThreshold)
        .map((tx: any) => tx.id);
      if (overdueIds.length > 0) {
        await supabase.from("transactions").update({ status: "overdue" }).eq("owner_id", user.id).in("id", overdueIds);
      }
    } catch (e) {
      console.error("Maintenance task failed:", e);
    }
  }, [user?.id, role]);

  // -------------------------------------------------------------------------
  // Fetch everything (scoped by RLS automatically).
  // Guarantees at most one in-flight fetch at any time.
  // -------------------------------------------------------------------------
 const fetchAll =
  useCallback(async () => {
    // Dedup: if a fetch is already in progress, return the same promise.
    if (reconcileRef.current) {
      return reconcileRef.current;
    }

    const doFetch = async () => {
    if (!user) {
      if (
        mountedRef.current
      ) {
        setData(
          initialData
        );
      }

      return;
    }

    if (
      mountedRef.current
    ) {
      setLoading(true);
      setError(null);
    }

    try {
      const currentRole = roleRef.current;
      const isOwner = currentRole === "owner";
      const isAdmin = currentRole === "admin";

      // Common queries for all roles
      const commonSettings =
        supabase
          .from(
            "app_settings"
          )
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      const commonProfile =
        supabase
          .from(
            "tenant_profiles"
          )
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      // Start tenant email lookup early (parallel) for tenant role
      const tenantLookup =
        currentRole === "tenant"
          ? supabase
              .from("tenants")
              .select("*")
              .ilike("email", user.email)
              .maybeSingle()
          : null;

      let propertiesPromise,
        tenantsPromise,
        txsPromise,
        orgsPromise,
        subPromise =
          Promise.resolve({ data: null });

      if (
        isOwner
      ) {
        propertiesPromise =
          supabase
            .from(
              "properties"
            )
            .select("*")
            .eq(
              "owner_id",
              user.id
            )
            .order(
              "created_at",
              {
                ascending:
                  true,
              }
            );

        tenantsPromise =
          supabase
            .from(
              "tenants"
            )
            .select("*")
            .eq(
              "owner_id",
              user.id
            )
            .order(
              "created_at",
              {
                ascending:
                  true,
              }
            );

        txsPromise =
          supabase
            .from(
              "transactions"
            )
            .select("*")
            .eq(
              "owner_id",
              user.id
            )
            .order(
              "date",
              {
                ascending:
                  false,
              }
            );

        subPromise =
          supabase
            .from("subscriptions")
            .select("*")
            .eq("owner_id", user.id)
            .maybeSingle();

        orgsPromise =
          Promise.resolve(
            {
              data: [],
            }
          );
      } else if (
        isAdmin
      ) {
        propertiesPromise =
          supabase
            .from(
              "properties"
            )
            .select("*")
            .order(
              "created_at",
              {
                ascending:
                  true,
              }
            );

        tenantsPromise =
          supabase
            .from(
              "tenants"
            )
            .select("*")
            .order(
              "created_at",
              {
                ascending:
                  true,
              }
            );

        txsPromise =
          supabase
            .from(
              "transactions"
            )
            .select("*")
            .order(
              "date",
              {
                ascending:
                  false,
              }
            );

        orgsPromise =
          supabase
            .from(
              "admin_orgs"
            )
            .select("*")
            .order(
              "created_at",
              {
                ascending:
                  true,
              }
            );
      } else if (
        currentRole ===
        "tenant"
      ) {
        propertiesPromise =
          Promise.resolve(
            { data: [] }
          );

        tenantsPromise =
          (tenantLookup ?? Promise.resolve({ data: null }))
            .then(
              ({ data: t }: any) => ({
                data: t ? [t] : [],
              })
            );

        const myTenant =
          await (tenantLookup ?? Promise.resolve({ data: null }))
            .then((r: any) => r.data ?? null);

        txsPromise =
          myTenant
            ? supabase
                .from(
                  "transactions"
                )
                .select("*")
                .eq(
                  "tenant_id",
                  myTenant.id
                )
                .order(
                  "date",
                  {
                    ascending:
                      false,
                  }
                )
            : Promise.resolve(
                { data: [] }
              );

        orgsPromise =
          Promise.resolve(
            { data: [] }
          );
      } else {
        propertiesPromise =
          Promise.resolve(
            {
              data: [],
            }
          );

        tenantsPromise =
          Promise.resolve(
            {
              data: [],
            }
          );

        txsPromise =
          Promise.resolve(
            {
              data: [],
            }
          );

        orgsPromise =
          Promise.resolve(
            {
              data: [],
            }
          );
      }

      const [
        {
          data: properties,
        },
        {
          data: tenants,
        },
        {
          data: txs,
        },
        {
          data: settings,
        },
        {
          data: profile,
        },
        {
          data: orgs,
        },
        {
          data: subRow,
        },
      ] =
        await Promise.all([
          propertiesPromise,
          tenantsPromise,
          txsPromise,
          commonSettings,
          commonProfile,
          orgsPromise,
          subPromise,
        ]);

      const txRows =
        txs ?? [];

      const propertiesById =
        new Map(
          (
            properties ??
            []
          ).map((p) => [
            p.id,
            p,
          ])
        );

      const tenantsById =
        new Map(
          (
            tenants ??
            []
          ).map((t) => [
            t.id,
            t,
          ])
        );

      if (
        mountedRef.current
      ) {
        setData({
          properties: (
            properties ??
            []
          ).map((r) =>
            mapProperty(
              r,
              tenants ??
                [],
              txRows
            )
          ),

          tenants: (
            tenants ??
            []
          ).map((r) =>
            mapTenant(
              r,
              propertiesById
            )
          ),

          transactions:
            txRows
              .map((r) =>
                mapTx(
                  r,
                  tenantsById,
                  propertiesById
                )
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  a.date <
                  b.date
                    ? 1
                    : -1
              ),

          adminOrgs: (
            orgs ??
            []
          ).map(
            mapAdminOrg
          ),

          settings:
            mapSettings(
              settings
            ),

          tenantProfile:
            mapTenantProfile(
              profile
            ),

          subscription:
            subRow
              ? {
                  id: subRow.id,
                  plan: subRow.plan,
                  status: subRow.status,
                  trialEnd: subRow.trial_end ?? null,
                  amount: Number(subRow.amount) || 0,
                  currencyCode: subRow.currency_code || "INR",
                }
              : null,
        });
      }
    } catch (
      error: any
    ) {
      console.error(
        "DataStore fetch failed:",
        error
      );

      if (
        mountedRef.current
      ) {
        setError(
          error?.message ??
            "Failed loading data"
        );

        toast.error(
          "Failed loading application data",
          {
            description:
              error?.message,
          }
        );
      }
    } finally {
      if (
        mountedRef.current
      ) {
        setLoading(
          false
        );
      }
    }
    };

    const promise = doFetch();
    reconcileRef.current = promise.finally(() => {
      reconcileRef.current = null;
    });
    return promise;
  }, [
    user?.id,
    user?.email,
  ]);

  // Early fetch: settings + tenant_profile as soon as user is available
  // (before role resolves, overlapped with auth's ensureUserRecords)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [settingsResult, profileResult] = await Promise.all([
        supabase.from("app_settings").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("tenant_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled || !mountedRef.current) return;
      setData((prev) => ({
        ...prev,
        settings: mapSettings(settingsResult.data),
        tenantProfile: mapTenantProfile(profileResult.data),
      }));
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // First load: wait for both user and role, then fetch ONCE per role
  useEffect(() => {
    if (!user) {
      fetchedRef.current = false;
      return;
    }
    if (!role) {
      if (!fetchedRef.current) {
        setLoading(true);
      }
      return;
    }
    // Re-fetch if user or role changed since last fetch
    if (fetchedRef.current && lastFetchedRoleRef.current === role && lastFetchedUserIdRef.current === user.id) {
      return;
    }
    fetchedRef.current = true;
    lastFetchedRoleRef.current = role;
    lastFetchedUserIdRef.current = user.id;
    setLoading(true);
    fetchAll();
  }, [user?.id, role, fetchAll]);

  // Safety timeout: show error after 30 s of loading
  const loadingTimeoutRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  useEffect(() => {
    if (loading) {
      loadingTimeoutRef.current =
        setTimeout(() => {
          if (mountedRef.current) {
            setError(
              "Taking longer than expected. Please check your connection."
            );
            setLoading(false);
          }
        }, 30000);
    }
    return () => {
      if (
        loadingTimeoutRef.current
      ) {
        clearTimeout(
          loadingTimeoutRef.current
        );
      }
    };
  }, [loading]);

  // Periodic maintenance: auto-rent + overdue escalation every 30 min.
  // Runs once on mount and then every 30 minutes thereafter.
  useEffect(() => {
    if (!user || role !== "owner") return;
    runMaintenance();
    const interval = setInterval(runMaintenance, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id, role, runMaintenance]);

  // Realtime: refetch on any owned/assigned data change so cross-portal edits sync.
  useEffect(() => {
  if (!user) {
    return;
  }

  const queueRefresh =
    () => {
      // Skip if a refresh is already running
      if (reconcileRef.current) return;

      if (
        realtimeRefreshTimeout.current
      ) {
        clearTimeout(
          realtimeRefreshTimeout.current
        );
      }

      realtimeRefreshTimeout.current =
        setTimeout(() => {
          if (reconcileRef.current) return;
          void fetchAll();
        }, 2000);
    };

  const channel =
    supabase
      .channel(
        `ds-${user.id}`
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema:
            "public",
          table:
            "tenants",
        },
        queueRefresh
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema:
            "public",
          table:
            "properties",
        },
        queueRefresh
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema:
            "public",
          table:
            "transactions",
        },
        queueRefresh
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema:
            "public",
          table:
            "tenant_profiles",
        },
        queueRefresh
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema:
            "public",
          table:
            "subscriptions",
        },
        queueRefresh
      )

      .subscribe();

  return () => {
    if (
      realtimeRefreshTimeout.current
    ) {
      clearTimeout(
        realtimeRefreshTimeout.current
      );
    }

    supabase.removeChannel(
      channel
    );
  };
}, [user?.id, fetchAll]);

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

  const refresh =
  useCallback(
    async () => {
      fetchedRef.current = false;
      return fetchAll().finally(() => {
        fetchedRef.current = true;
      });
    },
    [fetchAll]
  );

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
      city: p.city ?? "",
      state: p.state ?? "",
      pincode: p.pincode ?? "",
      price_monthly: p.priceMonthly ?? 0,
      amenities: p.amenities ?? [],
      description: p.description ?? "",
      images: p.images ?? [],
      available: p.available ?? true,
      bedrooms: p.bedrooms ?? 1,
      bathrooms: p.bathrooms ?? 1,
      property_type: p.propertyType ?? "Apartment",
    });

    if (error) throw error;

    await refresh();
  } catch (error: any) {
    toast.error(error?.message ?? "Failed to add property.");
  }
}, [user?.id, refresh]);

const updateProperty = useCallback(async (id: string, patch: Partial<Property>) => {
  try {
    const dbPatch: any = {};

    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.address !== undefined) dbPatch.address = patch.address;
    if (patch.units !== undefined) dbPatch.units = patch.units;
    if (patch.city !== undefined) dbPatch.city = patch.city;
    if (patch.state !== undefined) dbPatch.state = patch.state;
    if (patch.pincode !== undefined) dbPatch.pincode = patch.pincode;
    if (patch.priceMonthly !== undefined) dbPatch.price_monthly = patch.priceMonthly;
    if (patch.amenities !== undefined) dbPatch.amenities = patch.amenities;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.images !== undefined) dbPatch.images = patch.images;
    if (patch.available !== undefined) dbPatch.available = patch.available;
    if (patch.bedrooms !== undefined) dbPatch.bedrooms = patch.bedrooms;
    if (patch.bathrooms !== undefined) dbPatch.bathrooms = patch.bathrooms;
    if (patch.propertyType !== undefined) dbPatch.property_type = patch.propertyType;

    const { error } = await supabase
      .from("properties")
      .update(dbPatch)
      .eq("id", id)
      .eq("owner_id", user?.id);

    if (error) throw error;

    await refresh();
  } catch (error: any) {
    toast.error(error?.message ?? "Failed to update property.");
  }
}, [user?.id, refresh]);

const removeProperty = useCallback(async (id: string) => {
  try {
    const { error: tenantError } = await supabase
      .from("tenants")
      .update({
        property_id: null,
        status: "moved_out",
      })
      .eq("property_id", id)
      .eq("owner_id", user?.id);

    if (tenantError) throw tenantError;

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id)
      .eq("owner_id", user?.id);

    if (error) throw error;

    await refresh();
  } catch (error: any) {
    toast.error(error?.message ?? "Failed to remove property.");
  }
}, [user?.id, refresh]);

  const addTenant = useCallback(async (t: AddTenantInput) => {
  if (!user) {
    toast.error("You must be signed in.");
    return;
  }

  try {
    // duplicate tenant check
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("email", t.email)
      .eq("owner_id", user?.id)
      .maybeSingle();

    if (existingTenant) {
      toast.error("Tenant with this email already exists.");
      return;
    }

    const {
      data: ownerSettings,
      error: settingsError,
    } = await supabase
      .from("app_settings")
      .select(`
        currency_code,
        locale
      `)
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

    if (
      settingsError
    ) {
      throw settingsError;
    }

    // create tenant DB row
    const { error } = await supabase
      .from("tenants")
      .insert({
        id: uuid(),

        owner_id:
          user.id,

        property_id:
          t.propertyId ||
          null,

        name:
          t.name,

        room:
          t.room,

        rent:
          t.rent,

        deposit:
          t.deposit,

        email:
          t.email,

        phone:
          t.phone,

        start_date:
          t.startDate,

        status:
          t.status ??
          "active",

        currency_code:
          ownerSettings?.currency_code ??
          "INR",

        locale:
          ownerSettings?.locale ??
          "en-IN",
      });

    if (error) {
      throw error;
    }

    await refresh();

  } catch (err: any) {
    toast.error(
      err?.message ?? "Failed to create tenant."
    );
  }
}, [user?.id, refresh]);

  const updateTenant =
  useCallback(
    async (
      id: string,
      patch: Partial<Tenant>
    ) => {
      try {
        const dbPatch: any =
          {};

        if (
          patch.name !==
          undefined
        ) {
          dbPatch.name =
            patch.name;
        }

        if (
          patch.room !==
          undefined
        ) {
          dbPatch.room =
            patch.room;
        }

        if (
          patch.propertyId !==
          undefined
        ) {
          dbPatch.property_id =
            patch.propertyId ||
            null;
        }

        if (
          patch.rent !==
          undefined
        ) {
          dbPatch.rent =
            patch.rent;
        }

        if (
          patch.deposit !==
          undefined
        ) {
          dbPatch.deposit =
            patch.deposit;
        }

        if (
          patch.email !==
          undefined
        ) {
          dbPatch.email =
            patch.email;
        }

        if (
          patch.phone !==
          undefined
        ) {
          dbPatch.phone =
            patch.phone;
        }

        if (
          patch.startDate !==
          undefined
        ) {
          dbPatch.start_date =
            patch.startDate;
        }

        if (
          patch.status !==
          undefined
        ) {
          dbPatch.status =
            patch.status;
        }

        const {
          error,
        } =
          await supabase
            .from(
              "tenants"
            )
            .update(
              dbPatch
            )
            .eq(
              "id",
              id
            )
            .eq(
              "owner_id",
              user?.id
            );

        if (
          error
        ) {
          throw error;
        }

        await refresh();
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ??
            "Failed updating tenant."
        );

        throw error;
      }
    },
    [user?.id, refresh]
  );

  const setTenantStatus =
  useCallback(
    async (
      id: string,
      status: Tenant["status"]
    ) => {
      try {
        const {
          error,
        } =
          await supabase
            .from(
              "tenants"
            )
            .update({
              status,
            })
            .eq(
              "id",
              id
            )
            .eq(
              "owner_id",
              user?.id
            );

        if (
          error
        ) {
          throw error;
        }

        await refresh();
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ??
            "Failed updating tenant status."
        );

        throw error;
      }
    },
    [user?.id, refresh]
  );

  const moveOutTenant =
  useCallback(
    async (
      id: string
    ) => {
      try {
        const {
          error,
        } =
          await supabase
            .from(
              "tenants"
            )
            .update({
              status:
                "moved_out",
            })
            .eq(
              "id",
              id
            )
            .eq(
              "owner_id",
              user?.id
            );

        if (
          error
        ) {
          throw error;
        }

        await refresh();
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ??
            "Failed moving out tenant."
        );

        throw error;
      }
    },
    [user?.id, refresh]
  );

  const removeTenant =
  useCallback(
    async (
      id: string
    ) => {
      try {
        const {
          error,
        } =
          await supabase
            .from(
              "tenants"
            )
            .delete()
            .eq(
              "id",
              id
            )
            .eq(
              "owner_id",
              user?.id
            );

        if (
          error
        ) {
          throw error;
        }

        await refresh();
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ??
            "Failed removing tenant."
        );

        throw error;
      }
    },
    [user?.id, refresh]
  );

  const addTransaction = useCallback(async (t: AddTransactionInput) => {

  if (!user) {
    return;
  }

  try {

  let currencyCode = data.settings.currencyCode;

  let locale = data.settings.locale;

  /*
    Prefer tenant financial snapshot
    over current owner settings.
  */

  if (t.tenantId) {

    const {
      data: tenantRow,
      error: tenantError,
    } = await supabase
      .from("tenants")
      .select(`
        currency_code,
        locale
      `)
      .eq(
        "id",
        t.tenantId
      )
      .eq(
        "owner_id",
        user?.id
      )
      .maybeSingle();

    if (tenantError) {
      throw tenantError;
    }

    if (tenantRow?.currency_code) {
      currencyCode =
        tenantRow.currency_code;
    }

    if (tenantRow?.locale) {
      locale =
        tenantRow.locale;
    }
  }

  const { error: insertError } =
    await supabase
      .from("transactions")
      .insert({

        owner_id:
          user.id,

        tenant_id:
          t.tenantId ||
          null,

        property_id:
          t.propertyId ||
          null,

        date:
          t.date ||
          todayISO(),

        type:
          t.type,

        amount:
          t.amount,

        currency_code:
          currencyCode,

        locale:
          locale,

        status:
          t.status,

        note:
          t.note ?? null,

        auto:
          !!t.auto,
      });

    if (insertError) throw insertError;

    await refresh();

  } catch (error: any) {
    toast.error(error?.message ?? "Failed to add transaction.");
  }

}, [
  user?.id,
  refresh,
  data.settings.currencyCode,
  data.settings.locale,
]);

  const updateTransaction =
  useCallback(
    async (
      id: string,
      patch: Partial<Transaction>
    ) => {

      /*
        Fetch existing row first
        to protect completed
        financial records.
      */
      const {
        data: existing,
        error: fetchError,
      } = await supabase
        .from("transactions")
        .select(`
          id,
          status,
          auto,
          receipt_no
        `)
        .eq("id", id)
        .eq("owner_id", user?.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!existing) {
        throw new Error(
          "Transaction not found."
        );
      }

      /*
        Prevent mutation of
        settled financial records.
      */
      if (
        existing.status ===
        "completed"
      ) {

        /*
          Allow ONLY note edits
          on completed rows.
        */
        const allowedKeys =
          ["note"];

        const attemptedKeys =
          Object.keys(patch);

        const illegalEdit =
          attemptedKeys.some(
            (k) =>
              !allowedKeys.includes(k)
          );

        if (illegalEdit) {

          toast.error(
            "Completed transactions are locked."
          );

          return;
        }
      }

      const dbPatch: any =
        {};

      if (
        patch.date !==
        undefined
      ) {
        dbPatch.date =
          patch.date;
      }

      if (
        patch.tenantId !==
        undefined
      ) {
        dbPatch.tenant_id =
          patch.tenantId ||
          null;
      }

      if (
        patch.propertyId !==
        undefined
      ) {
        dbPatch.property_id =
          patch.propertyId ||
          null;
      }

      if (
        patch.type !==
        undefined
      ) {
        dbPatch.type =
          patch.type;
      }

      if (
        patch.amount !==
        undefined
      ) {
        dbPatch.amount =
          patch.amount;
      }

      if (
        patch.status !==
        undefined
      ) {
        dbPatch.status =
          patch.status;
      }

      if (
        patch.note !==
        undefined
      ) {
        dbPatch.note =
          patch.note;
      }

      const {
        error,
      } = await supabase
        .from("transactions")
        .update(dbPatch)
        .eq("id", id)
        .eq("owner_id", user?.id);

      if (error) {
        throw error;
      }

      await refresh();

    },
    [user?.id, refresh]
  );

  const removeTransaction =
  useCallback(
    async (
      id: string
    ) => {

      /*
        Protect settled
        financial history.
      */
      const {
        data: existing,
        error: fetchError,
      } = await supabase
        .from("transactions")
        .select(`
          id,
          status,
          auto,
          receipt_no
        `)
        .eq("id", id)
        .eq("owner_id", user?.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!existing) {
        throw new Error(
          "Transaction not found."
        );
      }

      /*
        Never allow deletion
        of completed payments.
      */
      if (
        existing.status ===
        "completed"
      ) {

        toast.error(
          "Completed transactions cannot be deleted."
        );

        return;
      }

      const {
        error,
      } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("owner_id", user?.id);

      if (error) {
        throw error;
      }

      await refresh();

    },
    [user?.id, refresh]
  );

  const updateAdminOrgs = useCallback(async (updater: Updater<AdminOrg[]>) => {
    const next = updater(data.adminOrgs);
    const ids = new Set(next.map((o) => o.id));
    const removedIds = data.adminOrgs.filter((o) => !ids.has(o.id)).map((o) => o.id);
    try {
      if (removedIds.length) {
        const { error: delErr } = await supabase.from("admin_orgs").delete().in("id", removedIds);
        if (delErr) throw delErr;
      }
      if (next.length) {
        const { error: upsertErr } = await supabase.from("admin_orgs").upsert(
          next.map((o) => ({
            id: o.id, name: o.name, owner: o.owner, plan: o.plan, users: o.users, mrr: o.mrr,
          }))
        );
        if (upsertErr) throw upsertErr;
      }
      await refresh();
    } catch (error: any) {
      console.error("Admin orgs update failed:", error);
      toast.error(error?.message ?? "Failed to update organizations.");
    }
  }, [data.adminOrgs, refresh]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    if (!user) return;
    const current = data.settings;
    const next: Settings = { ...current, ...patch };
    // Always send currency + locale so a brand-new row created by upsert
    // never ends up with NULL/default values that would override the
    // owner's saved choice on the next login.
    const dbPatch: any = {
      user_id: user.id,
      currency_code: next.currencyCode,
      locale: next.locale,
    };
    if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName;
    if (patch.companyName !== undefined) dbPatch.company_name = patch.companyName;
    if (patch.ownerEmail !== undefined) dbPatch.contact_email = patch.ownerEmail;
    if (patch.emailNotifications !== undefined) dbPatch.email_notifications = patch.emailNotifications;
    if (patch.smsNotifications !== undefined) dbPatch.sms_notifications = patch.smsNotifications;
    const { error } = await supabase
      .from("app_settings")
      .upsert(dbPatch, { onConflict: "user_id" });
    if (error) throw error;
    setData((d) => ({ ...d, settings: next }));
  }, [user?.id, data.settings]);

  const updateTenantProfile = useCallback(async (patch: Partial<TenantProfile>) => {
    if (!user) return;
    const dbPatch: any = { user_id: user.id };
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.emergency !== undefined) dbPatch.emergency = patch.emergency;
    if (patch.email !== undefined) dbPatch.email = patch.email;
    const { error } = await supabase.from("tenant_profiles").upsert(dbPatch);
    if (error) throw error;
    setData((d) => ({ ...d, tenantProfile: { ...d.tenantProfile, ...patch } }));
  }, [user?.id]);

  const resetAll =
  useCallback(() => {
    if (
      realtimeRefreshTimeout.current
    ) {
      clearTimeout(
        realtimeRefreshTimeout.current
      );
    }

    if (
      mountedRef.current
    ) {
      setError(
        null
      );

      setLoading(
        false
      );

      setData(
        initialData
      );
    }
  }, []);

  const value = useMemo<DataStoreContextValue>(
    () => ({
      data, loading, error,
      addProperty, updateProperty, removeProperty,
      addTenant, updateTenant, setTenantStatus, moveOutTenant, removeTenant,
      addTransaction, updateTransaction, removeTransaction,
      updateAdminOrgs, updateSettings, updateTenantProfile,
      refresh, resetAll,
    }),
    [data, loading, error, addProperty, updateProperty, removeProperty, addTenant, updateTenant,
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
export const useSubscriptionData = () => useDataStore().data.subscription;
