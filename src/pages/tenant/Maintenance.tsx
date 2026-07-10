import { useMaintenance } from "@/hooks/useMaintenance";
import { CreateRequest } from "@/components/Maintenance/CreateRequest";
import { RequestList } from "@/components/Maintenance/RequestList";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { toast } from "sonner";
import type { MaintenancePriority } from "@/types/maintenance";

export default function TenantMaintenance() {
  const { user } = useAuth();
  const { data } = useDataStore();
  const { requests, loading, create, updateStatus } = useMaintenance();
  const tenant = (data?.tenants ?? []).find(
    (t) => user?.email && t.email.toLowerCase() === user.email.toLowerCase(),
  );

  const handleCreate = async (title: string, description: string, priority: MaintenancePriority) => {
    if (!tenant?.id) {
      toast.error("Profile not loaded yet. Please wait and try again.");
      return;
    }
    await create(title, description, priority, tenant.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">Maintenance</h1>
        <p className="text-sm text-muted-foreground">
          Submit and track maintenance requests.
        </p>
      </div>
      <CreateRequest onCreate={handleCreate} />
      <RequestList requests={requests} loading={loading} onUpdateStatus={updateStatus} />
    </div>
  );
}
