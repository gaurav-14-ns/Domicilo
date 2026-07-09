import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SafeSection } from "@/components/SafeSection";
import { AppRole, useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { Crown } from "lucide-react";
import { TrialBanner } from "@/components/TrialBanner";
import { ErrorState } from "@/components/states/ErrorState";

function DashboardContent({
  role,
}: {
  role: AppRole;
}) {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const { data, loading, error, refresh } = useDataStore();

  const displayName = role === "owner"
    ? data?.settings?.displayName || user?.email?.split("@")[0]
    : role === "tenant"
      ? (data?.tenants ?? []).find(
          (t) => user?.email && t.email.toLowerCase() === user.email.toLowerCase(),
        )?.name || user?.email?.split("@")[0]
      : user?.email?.split("@")[0];

  useEffect(() => {
    setOpenMobile(
      false
    );
  }, [
    location.pathname,
    setOpenMobile,
  ]);

  if (
    error
  ) {
    return (
      <div className="min-h-screen w-full bg-background grid place-items-center p-6">
        <ErrorState
          title="Could not load data"
          description={error}
          onRetry={refresh}
        />
      </div>
    );
  }

  return (
    <>
      <SafeSection name="AppSidebar" fallback={null}>
        <AppSidebar role={role} />
      </SafeSection>
      <div className="flex flex-col flex-1 min-w-0 bg-background/40 backdrop-blur-3xl">
        <header className="h-14 flex items-center justify-between border-b border-white/[0.04] px-3 md:px-6 bg-background/60 backdrop-blur-3xl sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger />

          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary hidden sm:block animate-glow-pulse" />
            <span className="font-display font-semibold truncate tracking-wide">
              {displayName}
            </span>
          </div>
          </div>

        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 animate-page-enter">
          {role ===
            "owner" && (
            <div className="mb-4">
              <SafeSection name="TrialBanner" fallback={null}>
                <TrialBanner />
              </SafeSection>
            </div>
          )}

          {loading ? (
            <SkeletonDashboard role={role} />
          ) : (
            <SafeSection name="PageContent">
              <Outlet />
            </SafeSection>
          )}
        </main>
      </div>
    </>
  );
}

function SkeletonDashboard({ role }: { role: AppRole }) {
  const card = (className = "") => (
    <div className={`rounded-xl border border-border/40 p-5 ${className}`}>
      <div className="skeleton-premium h-3 w-24 mb-3" />
      <div className="skeleton-premium h-7 w-16 mb-2" />
      <div className="skeleton-premium h-3 w-32" />
    </div>
  );

  if (role === "tenant") {
    return (
      <div className="space-y-6 stagger-items">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {card()}
          {card()}
          {card()}
        </div>
        <div className="rounded-xl border border-border/40 p-5">
          <div className="skeleton-premium h-3 w-32 mb-4" />
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton-premium h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <div className="skeleton-premium h-3 w-40 mb-1" />
                  <div className="skeleton-premium h-3 w-24" />
                </div>
                <div className="skeleton-premium h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 stagger-items">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {card()}
        {card()}
        {card()}
        {card()}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 p-5">
          <div className="skeleton-premium h-3 w-32 mb-4" />
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton-premium h-8 w-8 rounded" />
                <div className="flex-1">
                  <div className="skeleton-premium h-3 w-32 mb-1" />
                  <div className="skeleton-premium h-3 w-20" />
                </div>
                <div className="skeleton-premium h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 p-5">
          <div className="skeleton-premium h-3 w-28 mb-4" />
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton-premium h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <div className="skeleton-premium h-3 w-36 mb-1" />
                  <div className="skeleton-premium h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  role,
}: {
  role: AppRole;
}) {
  return (
    <SidebarProvider className="h-svh overflow-hidden w-full">
      <DashboardContent
        role={role}
      />
    </SidebarProvider>
  );
}
