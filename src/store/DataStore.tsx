import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode,
} from "react";
import {
  properties as seedProperties,
  tenants as seedTenants,
  transactions as seedTransactions,
  adminOrgs as seedAdminOrgs,
} from "@/lib/mockData";
import type {
  AppData, Property, Tenant, Transaction, AdminOrg, Settings, TenantProfile,
} from "./types";
import { monthKey, monthsBetween, todayISO } from "@/lib/format";

const STORAGE_KEY = "domicilo:store:v2";
const STORAGE_VERSION = 2;

const defaultSettings: Settings = {
  displayName: "",
  companyName: "Domicilo",
  ownerEmail: "",
  emailNotifications: true,
  smsNotifications: false,
  theme: "system",
};

const initialData: AppData = {
  properties: seedProperties,
  tenants: seedTenants,
  transactions: seedTransactions,
  adminOrgs: seedAdminOrgs,
  settings: defaultSettings,
  tenantProfile: { phone: "", emergency: "", email: "" },
};

function loadFromStorage(): AppData {
  if (typeof window === "undefined") return initialData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialData;
    const parsed = JSON.parse(raw) as { version: number; data: AppData };
    if (parsed.version !== STORAGE_VERSION) return initialData;
    return {
      ...initialData,
      ...parsed.data,
      settings: { ...defaultSettings, ...(parsed.data.settings || {}) },
    };
  } catch {
    return initialData;
  }
}

function saveToStorage(data: AppData) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, data })
    );
  } catch {
    /* ignore */
  }
}

// ---- Derivations (kept consistent on every mutation) ---------------------

function deriveProperties(state: AppData): Property[] {
  return state.properties.map((p) => {
    const occupied = state.tenants.filter(
      (t) => (t.propertyId ?? "") === p.id && t.status !== "deactivated" && t.status !== "moved_out"
    ).length;
    const revenue = state.transactions
      .filter((tx) => (tx.propertyId ?? "") === p.id && tx.status === "completed")
      .reduce((s, tx) => s + Math.max(0, tx.amount), 0);
    return { ...p, occupied: Math.min(occupied, p.units), revenue };
  });
}

// Auto-generates monthly Rent transactions for active tenants from tenant.startDate
// up to current month, skipping months already billed and skipping months while paused.
function autoGenerateRent(state: AppData): Transaction[] {
  const current = monthKey(new Date());
  const existingKeys = new Set(
    state.transactions
      .filter((t) => t.type === "Rent" && t.tenantId)
      .map((t) => `${t.tenantId}|${monthKey(t.date)}`)
  );
  const additions: Transaction[] = [];

  for (const tenant of state.tenants) {
    if (tenant.status === "deactivated" || tenant.status === "moved_out") continue;
    if (!tenant.startDate) continue;
    const start = monthKey(tenant.startDate);
    if (start > current) continue;
    const months = monthsBetween(start, current);
    for (const m of months) {
      const key = `${tenant.id}|${m}`;
      if (existingKeys.has(key)) continue;
      // If currently paused, only skip the CURRENT month (historical months still bill).
      if (tenant.status === "paused" && m === current) continue;
      additions.push({
        id: `auto_${tenant.id}_${m}`,
        date: `${m}-01`,
        tenant: tenant.name,
        tenantId: tenant.id,
        propertyId: tenant.propertyId,
        property: tenant.property,
        type: "Rent",
        amount: tenant.rent,
        status: m === current ? "pending" : "completed",
        auto: true,
      });
      existingKeys.add(key);
    }
  }

  if (!additions.length) return state.transactions;
  return [...additions, ...state.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
}

function reconcile(state: AppData): AppData {
  const withRent = autoGenerateRent(state);
  const stateWithTx = { ...state, transactions: withRent };
  return { ...stateWithTx, properties: deriveProperties(stateWithTx) };
}

// ---- Context -------------------------------------------------------------

type Updater<T> = (prev: T) => T;

type AddPropertyInput = {
  name: string; address: string; units: number; occupied?: number;
};

type AddTenantInput = Omit<Tenant, "id" | "joined" | "property"> & {
  joined?: string; property?: string;
};

type AddTransactionInput = Omit<Transaction, "id">;

type DataStoreContextValue = {
  data: AppData;

  // Properties
  addProperty: (p: AddPropertyInput) => void;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  removeProperty: (id: string) => void;

  // Tenants
  addTenant: (t: AddTenantInput) => void;
  updateTenant: (id: string, patch: Partial<Tenant>) => void;
  setTenantStatus: (id: string, status: Tenant["status"]) => void;
  moveOutTenant: (id: string) => void;
  removeTenant: (id: string) => void;

  // Transactions
  addTransaction: (t: AddTransactionInput) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;

  // Admin orgs
  updateAdminOrgs: (updater: Updater<AdminOrg[]>) => void;

  // Settings + profile
  updateSettings: (patch: Partial<Settings>) => void;
  updateTenantProfile: (patch: Partial<TenantProfile>) => void;

  resetAll: () => void;
};

const DataStoreContext = createContext<DataStoreContextValue | null>(null);

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => reconcile(loadFromStorage()));

  // Persist
  useEffect(() => { saveToStorage(data); }, [data]);

  // Re-run rent generation once per day (covers app left open across midnight/month).
  useEffect(() => {
    const id = setInterval(() => setData((d) => reconcile(d)), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setData(loadFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const mutate = useCallback((fn: (d: AppData) => AppData) => {
    setData((d) => reconcile(fn(d)));
  }, []);

  // Properties ------------------------------------------------------------
  const addProperty = useCallback((p: AddPropertyInput) => {
    mutate((d) => ({
      ...d,
      properties: [
        ...d.properties,
        {
          id: `p${Date.now()}`,
          name: p.name,
          address: p.address,
          units: p.units,
          occupied: p.occupied ?? 0,
          revenue: 0,
        },
      ],
    }));
  }, [mutate]);

  const updateProperty = useCallback((id: string, patch: Partial<Property>) => {
    mutate((d) => {
      const old = d.properties.find((p) => p.id === id);
      const updated = d.properties.map((p) => (p.id === id ? { ...p, ...patch } : p));
      // If name changed, propagate to tenants/transactions snapshot fields.
      if (old && patch.name && patch.name !== old.name) {
        return {
          ...d,
          properties: updated,
          tenants: d.tenants.map((t) =>
            t.propertyId === id ? { ...t, property: patch.name! } : t
          ),
          transactions: d.transactions.map((tx) =>
            tx.propertyId === id ? { ...tx, property: patch.name! } : tx
          ),
        };
      }
      return { ...d, properties: updated };
    });
  }, [mutate]);

  const removeProperty = useCallback((id: string) => {
    mutate((d) => ({
      ...d,
      properties: d.properties.filter((p) => p.id !== id),
      // Detach tenants from removed property (mark as moved_out).
      tenants: d.tenants.map((t) =>
        t.propertyId === id ? { ...t, status: "moved_out", propertyId: undefined } : t
      ),
    }));
  }, [mutate]);

  // Tenants ---------------------------------------------------------------
  const addTenant = useCallback((t: AddTenantInput) => {
    mutate((d) => {
      const property = d.properties.find((p) => p.id === t.propertyId);
      return {
        ...d,
        tenants: [
          ...d.tenants,
          {
            id: `t${Date.now()}`,
            name: t.name,
            room: t.room,
            propertyId: t.propertyId,
            property: property?.name ?? t.property ?? "",
            rent: t.rent,
            deposit: t.deposit,
            email: t.email,
            phone: t.phone,
            startDate: t.startDate,
            joined: t.joined ?? t.startDate,
            status: t.status ?? "active",
          },
        ],
      };
    });
  }, [mutate]);

  const updateTenant = useCallback((id: string, patch: Partial<Tenant>) => {
    mutate((d) => {
      const property = patch.propertyId
        ? d.properties.find((p) => p.id === patch.propertyId)
        : undefined;
      return {
        ...d,
        tenants: d.tenants.map((t) =>
          t.id === id
            ? {
                ...t,
                ...patch,
                property: property ? property.name : (patch.property ?? t.property),
              }
            : t
        ),
      };
    });
  }, [mutate]);

  const setTenantStatus = useCallback((id: string, status: Tenant["status"]) => {
    mutate((d) => ({
      ...d,
      tenants: d.tenants.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  }, [mutate]);

  const moveOutTenant = useCallback((id: string) => {
    mutate((d) => ({
      ...d,
      tenants: d.tenants.map((t) =>
        t.id === id ? { ...t, status: "moved_out" } : t
      ),
    }));
  }, [mutate]);

  const removeTenant = useCallback((id: string) => {
    mutate((d) => ({ ...d, tenants: d.tenants.filter((t) => t.id !== id) }));
  }, [mutate]);

  // Transactions ----------------------------------------------------------
  const addTransaction = useCallback((t: AddTransactionInput) => {
    mutate((d) => {
      const tenant = t.tenantId ? d.tenants.find((x) => x.id === t.tenantId) : undefined;
      const property = tenant?.propertyId
        ? d.properties.find((p) => p.id === tenant.propertyId)
        : undefined;
      return {
        ...d,
        transactions: [
          {
            id: `x${Date.now()}`,
            date: t.date || todayISO(),
            tenant: tenant?.name ?? t.tenant ?? "",
            tenantId: t.tenantId,
            propertyId: tenant?.propertyId ?? t.propertyId,
            property: property?.name ?? t.property,
            type: t.type,
            amount: t.amount,
            status: t.status,
            note: t.note,
          },
          ...d.transactions,
        ],
      };
    });
  }, [mutate]);

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    mutate((d) => ({
      ...d,
      transactions: d.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, [mutate]);

  const removeTransaction = useCallback((id: string) => {
    mutate((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));
  }, [mutate]);

  // Admin / settings / profile -------------------------------------------
  const updateAdminOrgs = useCallback((updater: Updater<AdminOrg[]>) => {
    mutate((d) => ({ ...d, adminOrgs: updater(d.adminOrgs) }));
  }, [mutate]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, [mutate]);

  const updateTenantProfile = useCallback((patch: Partial<TenantProfile>) => {
    mutate((d) => ({ ...d, tenantProfile: { ...d.tenantProfile, ...patch } }));
  }, [mutate]);

  const resetAll = useCallback(() => setData(reconcile(initialData)), []);

  const value = useMemo<DataStoreContextValue>(
    () => ({
      data,
      addProperty, updateProperty, removeProperty,
      addTenant, updateTenant, setTenantStatus, moveOutTenant, removeTenant,
      addTransaction, updateTransaction, removeTransaction,
      updateAdminOrgs, updateSettings, updateTenantProfile, resetAll,
    }),
    [data, addProperty, updateProperty, removeProperty, addTenant, updateTenant,
     setTenantStatus, moveOutTenant, removeTenant, addTransaction, updateTransaction,
     removeTransaction, updateAdminOrgs, updateSettings, updateTenantProfile, resetAll]
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
