import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import {
  useAuth,
  AppRole,
  dashboardPathFor,
} from "@/hooks/useAuth";

import { LoadingState } from "@/components/states/LoadingState";

import { ErrorState } from "@/components/states/ErrorState";

import { WifiOff, RefreshCw } from "lucide-react";



function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}

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

  const online = useOnlineStatus();

  const hasResolvedOnce = useRef(false);
  const resolvedUserRef = useRef<string | null>(null);

  const [
    roleTimeoutReached,
    setRoleTimeoutReached,
  ] = useState(false);

  const [retryCount, setRetryCount] = useState(0);

  const reloadCountRef = useRef(0);

  const waitingForRole =
    !!user &&
    !!allow &&
    role === null &&
    !roleTimeoutReached;

  useEffect(() => {
    setRoleTimeoutReached(false);
    setRetryCount(0);
    reloadCountRef.current = 0;
    hasResolvedOnce.current = false;
    resolvedUserRef.current = null;
  }, [user?.id]);

  // Only start the 10s timeout when actually waiting for role.
  // Cancels automatically when waitingForRole becomes false (role resolves).
  useEffect(() => {
    if (!waitingForRole) return;
    const timeout =
      setTimeout(() => {
        setRoleTimeoutReached(
          true
        );
      }, 10000);

    return () =>
      clearTimeout(
        timeout
      );
  }, [waitingForRole, retryCount]);

  // Auto-retry when still stuck after timeout (role never resolved).
  // Limited to 3 reloads to prevent infinite loop.
  useEffect(() => {
    if (online && roleTimeoutReached && role === null) {
      if (reloadCountRef.current >= 3) return;
      reloadCountRef.current++;
      const t = setTimeout(() => {
        window.location.reload();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [online, roleTimeoutReached, role]);

  // Force retry handler
  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1);
    setRoleTimeoutReached(false);
    window.location.reload();
  }, []);

  if (!online && (loading || waitingForRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background/40 backdrop-blur-3xl">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-destructive/10 text-destructive mb-4">
            <WifiOff className="h-7 w-7" />
          </div>
          <h2 className="font-display font-semibold text-lg mb-1">No internet connection</h2>
          <p className="text-sm text-muted-foreground font-alt">
            This page needs an active connection to verify your session.
            Please connect to the internet and try again.
          </p>
          <button
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline font-alt"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (
    !hasResolvedOnce.current &&
    resolvedUserRef.current !== user?.id &&
    (loading || waitingForRole)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background/40 backdrop-blur-3xl">
        <LoadingState title="Verifying access..." />
        <div className="absolute bottom-8 text-center">
          {roleTimeoutReached ? (
            <p className="text-sm text-muted-foreground font-alt">
              Taking longer than expected.
              <button onClick={handleRetry} className="ml-2 text-primary hover:underline">
                Retry
              </button>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground font-alt">
              Your session is being restored…
            </p>
          )}
        </div>
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-background/40 backdrop-blur-3xl">
        <ErrorState
          title="Unable to verify your account"
          description={
            online
              ? "Please reload the application or sign in again."
              : "You appear to be offline. Connect to the internet and try again."
          }
          onRetry={handleRetry}
        />
      </div>
    );
  }

  hasResolvedOnce.current = true;
  if (user) resolvedUserRef.current = user.id;
  return <>{children}</>;
};
