import { useMaintenance } from "@/hooks/useMaintenance";
import { RequestList } from "@/components/Maintenance/RequestList";

export default function OwnerMaintenance() {
  const { requests, loading, updateStatus } = useMaintenance();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">Maintenance Requests</h1>
        <p className="text-sm text-muted-foreground">
          View and manage requests from your tenants.
        </p>
      </div>
      <RequestList
        requests={requests}
        loading={loading}
        onUpdateStatus={updateStatus}
      />
    </div>
  );
}
