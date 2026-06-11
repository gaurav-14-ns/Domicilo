export type Property = {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  units: number;
  occupied: number;
  revenue: number;
  city: string;
  state: string;
  priceMonthly: number;
  pincode: string;
  amenities: string[];
  description: string;
  images: string[];
  available: boolean;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
};

export type TenantStatus = "active" | "paused" | "deactivated" | "moved_out";

export type Tenant = {
  id: string;
  name: string;
  room: string;
  property: string;
  ownerId?: string;
  propertyId?: string;
  rent: number;
  deposit: number;
  email: string;
  phone: string;
  startDate: string;
  status: TenantStatus;
  locale?: string;
  joined: string;
};

export type TransactionStatus =
  | "completed"
  | "pending"
  | "overdue"
  | "paused"
  | "refund";

export type TransactionType =
  | "Rent" | "Water" | "Electricity" | "Maintenance"
  | "Penalty" | "Refund" | "Other";

export type Transaction = {
  id: string;
  date: string;
  tenant: string;
  tenantId?: string;
  propertyId?: string;
  property?: string;
  type: TransactionType | string;
  amount: number;
  locale?: string;
  status: TransactionStatus;
  note?: string;
  auto?: boolean;
  method?: string;
  receiptNo?: string;
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
  locale: string;
};

export type TenantProfile = {
  phone: string;
  emergency: string;
  email?: string;
};

export type SubscriptionInfo = {
  id: string;
  plan: string;
  status: string;
  trialEnd: string | null;
  amount: number;
} | null;

export type AppData = {
  properties: Property[];
  tenants: Tenant[];
  transactions: Transaction[];
  adminOrgs: AdminOrg[];
  settings: Settings;
  tenantProfile: TenantProfile;
  subscription: SubscriptionInfo;
};
