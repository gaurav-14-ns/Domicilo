export type MaintenancePriority = "low" | "medium" | "high" | "urgent";
export type MaintenanceStatus = "open" | "in_progress" | "resolved" | "closed";

export type MaintenanceRequest = {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  created_at: string;
  updated_at: string;
};
