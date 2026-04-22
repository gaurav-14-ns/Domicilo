import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, AppRole, dashboardPathFor } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({
  children,
  allow,
}: {
  children: ReactNode;
  allow?: AppRole[];
}) => {
  const { user, role, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" state={{ from: loc.pathname }} replace />;
  if (allow && role && !allow.includes(role)) {
    return <Navigate to={dashboardPathFor(role)} replace />;
  }
  return <>{children}</>;
};
