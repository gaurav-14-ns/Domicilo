import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import type { MaintenanceRequest, MaintenancePriority, MaintenanceStatus } from "@/types/maintenance";
import { toast } from "sonner";

export function useMaintenance() {
  const { user } = useAuth();
  const { data } = useDataStore();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from("maintenance_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests((rows ?? []) as MaintenanceRequest[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const create = useCallback(
    async (
      title: string,
      description: string,
      priority: MaintenancePriority,
      tenantId?: string,
    ) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("maintenance_requests").insert({
        owner_id: user.id,
        tenant_id: tenantId ?? null,
        title,
        description,
        priority,
      });
      if (error) throw error;
      toast.success("Maintenance request created");
      fetchRequests();
    },
    [user, fetchRequests],
  );

  const updateStatus = useCallback(
    async (id: string, status: MaintenanceStatus) => {
      const { error } = await supabase
        .from("maintenance_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
    },
    [],
  );

  return { requests, loading, fetchRequests, create, updateStatus };
}
