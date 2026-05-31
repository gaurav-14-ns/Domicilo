import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  useAuth,
  AppRole,
  dashboardPathFor,
} from "@/hooks/useAuth";

import { LoadingState } from "@/components/states/LoadingState";

import { ErrorState } from "@/components/states/ErrorState";

export const ProtectedRoute = ({
  children,
  allow,
}: {
  children: ReactNode;

  allow?: AppRole[];
}) => {

  const {
    user,
    role,
    loading,
  } = useAuth();

  const loc =
    useLocation();

  const [
    roleTimeoutReached,
    setRoleTimeoutReached,
  ] = useState(false);

  useEffect(() => {
    const timeout =
      setTimeout(() => {
        setRoleTimeoutReached(
          true
        );
      }, 8000);

    return () =>
      clearTimeout(
        timeout
      );
  }, []);

  const waitingForRole =
    !!user &&
    !!allow &&
    role === null &&
    !roleTimeoutReached;

  if (
    loading ||
    waitingForRole
  ) {
    return (
      <div className="p-6">
        <LoadingState title="Verifying access..." />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/auth"
        state={{
          from:
            loc.pathname,
        }}
        replace
      />
    );
  }

  if (
    allow &&
    role &&
    !allow.includes(
      role
    )
  ) {
    return (
      <Navigate
        to={dashboardPathFor(
          role
        )}
        replace
      />
    );
  }

  if (
    allow &&
    !role
  ) {
    console.warn(
      "Role unresolved after timeout."
    );

    return (
      <div className="p-6">
        <ErrorState
          title="Unable to determine account role"
          description="Please reload the application or sign in again."
          onRetry={() =>
            window.location.reload()
          }
        />
      </div>
    );
  }

  return <>{children}</>;
};
