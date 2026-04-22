export const properties = [
  { id: "p1", name: "Skyline Tower A", address: "12 Marina Rd", units: 48, occupied: 45, revenue: 92400 },
  { id: "p2", name: "Riverside Block", address: "7 River Lane", units: 24, occupied: 22, revenue: 41200 },
  { id: "p3", name: "Garden View", address: "44 Park Ave", units: 36, occupied: 30, revenue: 58900 },
  { id: "p4", name: "Metro Heights", address: "201 Central St", units: 60, occupied: 58, revenue: 118000 },
];

export const tenants = [
  { id: "t1", name: "Sara Mitchell", room: "A-402", property: "Skyline Tower A", rent: 1200, status: "active", joined: "2024-03-12", phone: "+1 555 0123" },
  { id: "t2", name: "John Daniels", room: "B-201", property: "Riverside Block", rent: 950, status: "active", joined: "2023-11-04", phone: "+1 555 0145" },
  { id: "t3", name: "Priya Shah", room: "A-118", property: "Skyline Tower A", rent: 1100, status: "paused", joined: "2024-06-22", phone: "+1 555 0166" },
  { id: "t4", name: "Marco Rossi", room: "C-305", property: "Garden View", rent: 1350, status: "active", joined: "2025-01-09", phone: "+1 555 0188" },
  { id: "t5", name: "Yuki Tanaka", room: "D-712", property: "Metro Heights", rent: 1500, status: "deactivated", joined: "2023-04-01", phone: "+1 555 0199" },
];

export const transactions = [
  { id: "x1", date: "2026-04-20", tenant: "Sara Mitchell", type: "Rent", amount: 1200, status: "completed" },
  { id: "x2", date: "2026-04-19", tenant: "John Daniels", type: "Rent", amount: 950, status: "completed" },
  { id: "x3", date: "2026-04-18", tenant: "Marco Rossi", type: "Electricity", amount: 84, status: "pending" },
  { id: "x4", date: "2026-04-17", tenant: "Priya Shah", type: "Water", amount: 32, status: "paused" },
  { id: "x5", date: "2026-04-15", tenant: "Sara Mitchell", type: "Maintenance", amount: -50, status: "refund" },
];

export const kpis = {
  activeTenants: 1284,
  monthlyRevenue: 184000,
  occupancy: 94.2,
  pendingDues: 3200,
};

export const adminOrgs = [
  { id: "o1", name: "Domicilo Demo", owner: "demo@domicilo.com", plan: "Growth", users: 12, mrr: 890 },
  { id: "o2", name: "Acme Properties", owner: "ceo@acme.com", plan: "Scale", users: 48, mrr: 2400 },
  { id: "o3", name: "Sunset Living", owner: "ops@sunset.io", plan: "Starter", users: 3, mrr: 29 },
];
