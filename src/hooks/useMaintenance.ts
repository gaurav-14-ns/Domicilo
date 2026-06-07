import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import type { MaintenanceRequest, MaintenancePriority, MaintenanceStatus } from "@/types/maintenance";
import { toast } from "sonner";

export function useMaintenance() {
  const { user, role } = useAuth();
  const { data } = useDataStore();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const currentTenants = data.tenants ?? [];
    const isTenant = currentTenants.some(
      (t) => user.email && t.email.toLowerCase() === user.email.toLowerCase(),
    );
    const tenant = isTenant
      ? currentTenants.find((t) => user.email && t.email.toLowerCase() === user.email.toLowerCase())
      : null;

    let query = supabase.from("maintenance_requests").select("*");
    if (tenant) {
      query = query.eq("tenant_id", tenant.id);
    }

    if (role === "owner") {
      query = query.eq("owner_id", user.id);
    }
    const { data: rows, error } = await query.order("created_at", { ascending: false });

    if (!mountedRef.current) return;
    if (error) {
      console.error("Failed to fetch maintenance requests:", error);
      toast.error("Failed to load maintenance requests");
      setLoading(false);
      return;
    }
    setRequests((rows ?? []) as MaintenanceRequest[]);
    setLoading(false);
  }, [user?.id, role, data.tenants]);

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

      const currentTenants = data.tenants ?? [];
      const tenant = currentTenants.find(
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
      await fetchRequests();
    },
    [user?.id, fetchRequests, data.tenants],
  );

  const updateStatus = useCallback(
    async (id: string, status: MaintenanceStatus) => {
      let query = supabase.from("maintenance_requests").update({ status });
      if (role === "owner") {
        query = query.eq("owner_id", user?.id);
      }
      const { error } = await query.eq("id", id);
      if (error) throw error;
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
    },
    [user?.id, role],
  );

  return { requests, loading, fetchRequests, create, updateStatus };
}
