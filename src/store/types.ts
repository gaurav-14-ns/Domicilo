export type Property = {
  id: string;
  name: string;
  address: string;
  units: number;
  occupied: number; // derived from active tenants, kept in sync by store
  revenue: number;  // derived from completed transactions for this property
};

export type TenantStatus = "active" | "paused" | "deactivated" | "moved_out";

export type Tenant = {
  id: string;
  name: string;
  room: string;
  property: string; // property name (kept for backward compat)
  propertyId?: string;
  rent: number;
  deposit: number;
  email: string;
  phone: string;
  startDate: string; // ISO yyyy-mm-dd
  status: TenantStatus;
  joined: string; // legacy alias for startDate
  lastBilledMonth?: string; // yyyy-mm
};

export type TransactionStatus = "completed" | "pending" | "paused" | "refund";

export type TransactionType =
  | "Rent"
  | "Water"
  | "Electricity"
  | "Maintenance"
  | "Penalty"
  | "Refund"
  | "Other";

export type Transaction = {
  id: string;
  date: string; // yyyy-mm-dd
  tenant: string; // tenant name snapshot
  tenantId?: string;
  propertyId?: string;
  property?: string;
  type: TransactionType | string;
  amount: number; // in INR
  status: TransactionStatus;
  note?: string;
  auto?: boolean; // true if auto-generated rent
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
