import type { CurrencyCode } from "@/lib/currency";

export type Property = {
  id: string;
  name: string;
  address: string;
  units: number;
  occupied: number; // derived
  revenue: number;  // derived
};

export type TenantStatus = "active" | "paused" | "deactivated" | "moved_out";

export type Tenant = {
  id: string;
  name: string;
  room: string;
  property: string;        // property name snapshot (derived from join)
  propertyId?: string;
  rent: number;
  deposit: number;
  email: string;
  phone: string;
  startDate: string;       // yyyy-mm-dd
  status: TenantStatus;
  joined: string;          // legacy alias for startDate
};

export type TransactionStatus = "completed" | "pending" | "paused" | "refund";

export type TransactionType =
  | "Rent" | "Water" | "Electricity" | "Maintenance"
  | "Penalty" | "Refund" | "Other";

export type Transaction = {
  id: string;
  date: string;            // yyyy-mm-dd
  tenant: string;          // tenant name snapshot
  tenantId?: string;
  propertyId?: string;
  property?: string;
  type: TransactionType | string;
  amount: number;
  status: TransactionStatus;
  note?: string;
  auto?: boolean;
};

export type AdminOrg = {
  id: string;
  name: string;
  owner: string;
  plan: string;
  users: number;
  mrr: number;
};

export type Settings = {
  displayName: string;
  companyName: string;
  ownerEmail: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  theme: "light" | "dark" | "system";
  currencyCode: CurrencyCode;
  locale: string;
};

export type TenantProfile = {
  phone: string;
  emergency: string;
  email?: string;
};

export type AppData = {
  properties: Property[];
  tenants: Tenant[];
  transactions: Transaction[];
  adminOrgs: AdminOrg[];
  settings: Settings;
  tenantProfile: TenantProfile;
};
