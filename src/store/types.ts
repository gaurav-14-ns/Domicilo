export type Property = {
  id: string;
  name: string;
  address: string;
  units: number;
  occupied: number;
  revenue: number;
};

export type TenantStatus = "active" | "paused" | "deactivated";

export type Tenant = {
  id: string;
  name: string;
  room: string;
  property: string;
  rent: number;
  status: TenantStatus;
  joined: string;
  phone: string;
};

export type TransactionStatus = "completed" | "pending" | "paused" | "refund";

export type Transaction = {
  id: string;
  date: string;
  tenant: string;
  type: string;
  amount: number;
  status: TransactionStatus;
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
  emailNotifications: boolean;
};

export type TenantProfile = {
  phone: string;
  emergency: string;
};

export type AppData = {
  properties: Property[];
  tenants: Tenant[];
  transactions: Transaction[];
  adminOrgs: AdminOrg[];
  settings: Settings;
  tenantProfile: TenantProfile;
};
