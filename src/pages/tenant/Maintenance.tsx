import { useMaintenance } from "@/hooks/useMaintenance";
import { CreateRequest } from "@/components/Maintenance/CreateRequest";
import { RequestList } from "@/components/Maintenance/RequestList";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";

export default function TenantMaintenance() {
  const { user } = useAuth();
  const { data } = useDataStore();
  const { requests, loading, create } = useMaintenance();
  const tenant = data.tenants.find(
    (t) => user?.email && t.email.toLowerCase() === user.email.toLowerCase(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Maintenance</h1>
        <p className="text-sm text-muted-foreground">
          Submit and track maintenance requests.
        </p>
      </div>
      <CreateRequest
        onCreate={(title, description, priority) =>
          create(title, description, priority, tenant?.id)
        }
      />
      <RequestList requests={requests} loading={loading} />
    </div>
  );
}
