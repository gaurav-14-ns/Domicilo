import { Navigate, useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { useAuth, AppRole, dashboardPathFor } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ProtectedRoute = ({
  children,
  allow,
}: {
  children: ReactNode;
  allow?: AppRole[];
}) => {
  const { user, role, loading, signOut } = useAuth();
  const loc = useLocation();
  const [suspendedChecked, setSuspendedChecked] = useState(false);
  const [suspended, setSuspended] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setSuspendedChecked(true);
      setSuspended(false);
      return;
    }

    setSuspendedChecked(false);

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("suspended")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (data?.suspended) {
        setSuspended(true);
        toast.error("Account suspended", { description: "Contact support to restore access." });
        await signOut();
      }

      setSuspendedChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, signOut]);

  const waitingForRole = !!user && !!allow && role === null;
  if (loading || (user && !suspendedChecked) || waitingForRole) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || suspended) {
    return <Navigate to="/auth" state={{ from: loc.pathname }} replace />;
  }

  if (allow && !role) {
    return <Navigate to="/auth" state={{ from: loc.pathname }} replace />;
  }

  if (allow && role && !allow.includes(role)) {
    return <Navigate to={dashboardPathFor(role)} replace />;
  }

  return <>{children}</>;
};
