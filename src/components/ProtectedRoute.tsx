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

import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";

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
    signOut,
  } = useAuth();

  const loc =
    useLocation();

  const [
    suspendedChecked,
    setSuspendedChecked,
  ] = useState(false);

  const [
    accountStatus,
    setAccountStatus,
  ] = useState<
    string
  >("active");

  const [
    roleTimeoutReached,
    setRoleTimeoutReached,
  ] = useState(false);

  const [
    authError,
    setAuthError,
  ] = useState<
    string | null
  >(null);

  const retry =
    () => {
      window.location.reload();
    };

  useEffect(() => {

    const timeout =
      setTimeout(() => {

        setRoleTimeoutReached(
          true
        );

      }, 15000);

    return () =>
      clearTimeout(
        timeout
      );

  }, []);

  useEffect(() => {

    let cancelled =
      false;

    const checkSuspension =
      async () => {

        try {

          setAuthError(
            null
          );

          if (
            !user?.id
          ) {

            if (
              !cancelled
            ) {

              setSuspendedChecked(
                true
              );

              setAccountStatus(
                "active"
              );
            }

            return;
          }

          if (
            !cancelled
          ) {

            setSuspendedChecked(
              false
            );
          }

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                "status"
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            cancelled
          ) {
            return;
          }

          if (
            error
          ) {

            console.error(
              "Status check failed:",
              error
            );

            setAuthError(
              error.message
            );

            setAccountStatus(
              "active"
            );

            setSuspendedChecked(
              true
            );

            return;
          }

          const status =
            data?.status ??
            "active";

          setAccountStatus(
            status
          );

          if (
            status ===
            "suspended"
          ) {

            toast.error(
              "Account suspended",
              {
                description:
                  "Contact support to restore access.",
              }
            );

            try {

              await signOut();

            } catch (
              error
            ) {

              console.error(
                "Sign out failed:",
                error
              );
            }

            return;
          }

          setSuspendedChecked(
            true
          );

        } catch (
          error: any
        ) {

          console.error(
            "ProtectedRoute failed:",
            error
          );

          if (
            !cancelled
          ) {

            setAuthError(
              error?.message ??
                "Authentication failed"
            );

            setAccountStatus(
              "active"
            );

            setSuspendedChecked(
              true
            );
          }
        }
      };

    void checkSuspension();

    return () => {

      cancelled =
        true;
    };

  }, [
    user,
    signOut,
  ]);

  const waitingForRole =
    !!user &&
    !!allow &&
    role === null &&
    !roleTimeoutReached;

  if (
    loading ||
    (
      user &&
      !suspendedChecked
    ) ||
    waitingForRole
  ) {

    return (
      <div className="p-6">
        <LoadingState title="Verifying access..." />
      </div>
    );
  }

  if (
    authError
  ) {

    return (
      <div className="p-6">
        <ErrorState
          title="Authentication issue"
          description={
            authError
          }
          onRetry={
            retry
          }
        />
      </div>
    );
  }

  if (
    !user ||
    accountStatus ===
      "suspended"
  ) {

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

  /*
    Prevent infinite unresolved-role state.
  */

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
          onRetry={
            retry
          }
        />
      </div>
    );
  }

  return <>{children}</>;
};
