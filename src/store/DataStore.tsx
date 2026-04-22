import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  properties as seedProperties,
  tenants as seedTenants,
  transactions as seedTransactions,
  adminOrgs as seedAdminOrgs,
} from "@/lib/mockData";
import type {
  AppData,
  Property,
  Tenant,
  Transaction,
  AdminOrg,
  Settings,
  TenantProfile,
} from "./types";

const STORAGE_KEY = "domicilo:store:v1";
const STORAGE_VERSION = 1;

const initialData: AppData = {
  properties: seedProperties as Property[],
  tenants: seedTenants as Tenant[],
  transactions: seedTransactions as Transaction[],
  adminOrgs: seedAdminOrgs as AdminOrg[],
  settings: { displayName: "", emailNotifications: true },
  tenantProfile: { phone: "", emergency: "" },
};

function loadFromStorage(): AppData {
  if (typeof window === "undefined") return initialData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialData;
    const parsed = JSON.parse(raw) as { version: number; data: AppData };
    if (parsed.version !== STORAGE_VERSION) return initialData;
    return { ...initialData, ...parsed.data };
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
    // ignore
  }
}

type Updater<T> = (prev: T) => T;

type DataStoreContextValue = {
  data: AppData;

  // Properties
  addProperty: (p: Omit<Property, "id" | "occupied" | "revenue"> & Partial<Property>) => void;
  removeProperty: (id: string) => void;
  updateProperties: (updater: Updater<Property[]>) => void;

  // Tenants
  updateTenants: (updater: Updater<Tenant[]>) => void;
  setTenantStatus: (id: string, status: Tenant["status"]) => void;
  removeTenant: (id: string) => void;

  // Transactions
  updateTransactions: (updater: Updater<Transaction[]>) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;

  // Admin orgs
  updateAdminOrgs: (updater: Updater<AdminOrg[]>) => void;

  // Settings
  updateSettings: (patch: Partial<Settings>) => void;

  // Tenant profile
  updateTenantProfile: (patch: Partial<TenantProfile>) => void;

  // Reset
  resetAll: () => void;
};

const DataStoreContext = createContext<DataStoreContextValue | null>(null);

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setData(loadFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updateProperties = useCallback((updater: Updater<Property[]>) => {
    setData((d) => ({ ...d, properties: updater(d.properties) }));
  }, []);

  const addProperty = useCallback<DataStoreContextValue["addProperty"]>((p) => {
    setData((d) => ({
      ...d,
      properties: [
        ...d.properties,
        {
          id: `p${Date.now()}`,
          name: p.name,
          address: p.address,
          units: p.units ?? 0,
          occupied: p.occupied ?? 0,
          revenue: p.revenue ?? 0,
        },
      ],
    }));
  }, []);

  const removeProperty = useCallback((id: string) => {
    setData((d) => ({ ...d, properties: d.properties.filter((p) => p.id !== id) }));
  }, []);

  const updateTenants = useCallback((updater: Updater<Tenant[]>) => {
    setData((d) => ({ ...d, tenants: updater(d.tenants) }));
  }, []);

  const setTenantStatus = useCallback((id: string, status: Tenant["status"]) => {
    setData((d) => ({
      ...d,
      tenants: d.tenants.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  }, []);

  const removeTenant = useCallback((id: string) => {
    setData((d) => ({ ...d, tenants: d.tenants.filter((t) => t.id !== id) }));
  }, []);

  const updateTransactions = useCallback((updater: Updater<Transaction[]>) => {
    setData((d) => ({ ...d, transactions: updater(d.transactions) }));
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    setData((d) => ({
      ...d,
      transactions: [{ id: `x${Date.now()}`, ...t }, ...d.transactions],
    }));
  }, []);

  const updateAdminOrgs = useCallback((updater: Updater<AdminOrg[]>) => {
    setData((d) => ({ ...d, adminOrgs: updater(d.adminOrgs) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const updateTenantProfile = useCallback((patch: Partial<TenantProfile>) => {
    setData((d) => ({ ...d, tenantProfile: { ...d.tenantProfile, ...patch } }));
  }, []);

  const resetAll = useCallback(() => setData(initialData), []);

  const value = useMemo<DataStoreContextValue>(
    () => ({
      data,
      addProperty,
      removeProperty,
      updateProperties,
      updateTenants,
      setTenantStatus,
      removeTenant,
      updateTransactions,
      addTransaction,
      updateAdminOrgs,
      updateSettings,
      updateTenantProfile,
      resetAll,
    }),
    [
      data,
      addProperty,
      removeProperty,
      updateProperties,
      updateTenants,
      setTenantStatus,
      removeTenant,
      updateTransactions,
      addTransaction,
      updateAdminOrgs,
      updateSettings,
      updateTenantProfile,
      resetAll,
    ]
  );

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}

// Selector helpers for cleaner consumer code
export const useProperties = () => useDataStore().data.properties;
export const useTenants = () => useDataStore().data.tenants;
export const useTransactions = () => useDataStore().data.transactions;
export const useAdminOrgs = () => useDataStore().data.adminOrgs;
export const useSettings = () => useDataStore().data.settings;
export const useTenantProfile = () => useDataStore().data.tenantProfile;
