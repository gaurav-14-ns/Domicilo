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

    const isTenant = data.tenants.some(
      (t) => user.email && t.email.toLowerCase() === user.email.toLowerCase(),
    );
    const tenant = isTenant
      ? data.tenants.find((t) => user.email && t.email.toLowerCase() === user.email.toLowerCase())
      : null;

    let query = supabase.from("maintenance_requests").select("*");
    if (tenant) {
      query = query.eq("tenant_id", tenant.id);
    }

    const { data: rows, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch maintenance requests:", error);
      toast.error("Failed to load maintenance requests");
    }
    setRequests((rows ?? []) as MaintenanceRequest[]);
    setLoading(false);
  }, [user, data.tenants]);

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

      // When a tenant creates a request, use the property owner's user_id as owner_id,
      // so the owner can see it via RLS. The tenant's record stores who the owner is.
      const tenant = data.tenants.find(
        (t) => user.email && t.email.toLowerCase() === user.email.toLowerCase(),
      );
      const ownerId = tenant?.ownerId || user.id;

      const { error } = await supabase.from("maintenance_requests").insert({
        owner_id: ownerId,
        tenant_id: tenantId ?? null,
        title,
        description,
        priority,
      });
      if (error) throw error;
      toast.success("Maintenance request created");
      fetchRequests();
    },
    [user, fetchRequests, data.tenants],
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
