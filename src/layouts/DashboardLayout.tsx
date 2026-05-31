import {
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useEffect,
} from "react";

import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/AppSidebar";

import { ThemeToggle } from "@/components/ThemeToggle";

import { SafeSection } from "@/components/SafeSection";

import { AppRole } from "@/hooks/useAuth";

import { useDataStore } from "@/store/DataStore";

import { Crown } from "lucide-react";

import { TrialBanner } from "@/components/TrialBanner";

import { LoadingState } from "@/components/states/LoadingState";

function DashboardContent({
  role,
}: {
  role: AppRole;
}) {
  const location =
    useLocation();

  const {
    setOpenMobile,
  } = useSidebar();

  const {
    loading,
  } = useDataStore();

  useEffect(() => {
    setOpenMobile(
      false
    );
  }, [
    location.pathname,
    setOpenMobile,
  ]);

  if (
    loading
  ) {
    return (
      <div className="min-h-screen w-full bg-background grid place-items-center">
        <LoadingState title="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <SafeSection name="AppSidebar" fallback={null}>
        <AppSidebar role={role} />
      </SafeSection>
      <div className="flex flex-col min-h-screen flex-1 min-w-0">
        <header className="h-14 flex items-center justify-between border-b border-border/40 px-3 md:px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger />

          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500 hidden sm:block animate-glow-pulse" />
            <span className="font-display font-semibold capitalize truncate tracking-wide">
              {role === "owner" ? <span className="text-gold-shimmer">Owner Dashboard</span> : `${role} dashboard`}
            </span>
          </div>
          </div>

          <ThemeToggle />
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

          <SafeSection name="PageContent">
            <Outlet />
          </SafeSection>
        </main>
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
    <SidebarProvider>
      <DashboardContent
        role={role}
      />
    </SidebarProvider>
  );
}
