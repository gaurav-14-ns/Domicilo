import type { Property, Tenant, Transaction, AdminOrg } from "@/store/types";

export const properties: Property[] = [
  { id: "p1", name: "Skyline Tower A", address: "12 Marina Rd, Mumbai", units: 48, occupied: 0, revenue: 0 },
  { id: "p2", name: "Riverside Block", address: "7 River Lane, Pune", units: 24, occupied: 0, revenue: 0 },
  { id: "p3", name: "Garden View", address: "44 Park Ave, Bengaluru", units: 36, occupied: 0, revenue: 0 },
  { id: "p4", name: "Metro Heights", address: "201 Central St, Delhi", units: 60, occupied: 0, revenue: 0 },
];

export const tenants: Tenant[] = [
  { id: "t1", name: "Sara Mitchell", room: "A-402", property: "Skyline Tower A", propertyId: "p1", rent: 28000, deposit: 56000, email: "sara@example.com", phone: "+91 98200 00123", startDate: "2024-03-12", status: "active", joined: "2024-03-12" },
  { id: "t2", name: "John Daniels", room: "B-201", property: "Riverside Block", propertyId: "p2", rent: 22000, deposit: 44000, email: "john@example.com", phone: "+91 98200 00145", startDate: "2023-11-04", status: "active", joined: "2023-11-04" },
  { id: "t3", name: "Priya Shah", room: "A-118", property: "Skyline Tower A", propertyId: "p1", rent: 25000, deposit: 50000, email: "priya@example.com", phone: "+91 98200 00166", startDate: "2024-06-22", status: "paused", joined: "2024-06-22" },
  { id: "t4", name: "Marco Rossi", room: "C-305", property: "Garden View", propertyId: "p3", rent: 31000, deposit: 62000, email: "marco@example.com", phone: "+91 98200 00188", startDate: "2025-01-09", status: "active", joined: "2025-01-09" },
  { id: "t5", name: "Yuki Tanaka", room: "D-712", property: "Metro Heights", propertyId: "p4", rent: 35000, deposit: 70000, email: "yuki@example.com", phone: "+91 98200 00199", startDate: "2023-04-01", status: "deactivated", joined: "2023-04-01" },
];

export const transactions: Transaction[] = [
  { id: "x1", date: "2026-04-20", tenant: "Sara Mitchell", tenantId: "t1", propertyId: "p1", property: "Skyline Tower A", type: "Rent", amount: 28000, status: "completed" },
  { id: "x2", date: "2026-04-19", tenant: "John Daniels", tenantId: "t2", propertyId: "p2", property: "Riverside Block", type: "Rent", amount: 22000, status: "completed" },
  { id: "x3", date: "2026-04-18", tenant: "Marco Rossi", tenantId: "t4", propertyId: "p3", property: "Garden View", type: "Electricity", amount: 1800, status: "pending" },
  { id: "x4", date: "2026-04-17", tenant: "Priya Shah", tenantId: "t3", propertyId: "p1", property: "Skyline Tower A", type: "Water", amount: 600, status: "paused" },
  { id: "x5", date: "2026-04-15", tenant: "Sara Mitchell", tenantId: "t1", propertyId: "p1", property: "Skyline Tower A", type: "Maintenance", amount: -1200, status: "refund" },
];

export const adminOrgs: AdminOrg[] = [
  { id: "o1", name: "Domicilo Demo", owner: "demo@domicilo.com", plan: "Growth", users: 12, mrr: 74000 },
  { id: "o2", name: "Acme Properties", owner: "ceo@acme.com", plan: "Scale", users: 48, mrr: 198000 },
  { id: "o3", name: "Sunset Living", owner: "ops@sunset.io", plan: "Starter", users: 3, mrr: 2400 },
];
