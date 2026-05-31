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

import { TrialBanner } from "@/components/TrialBanner";

import { AppRole } from "@/hooks/useAuth";

import { Crown } from "lucide-react";

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

  useEffect(() => {
    setOpenMobile(
      false
    );
  }, [
    location.pathname,
    setOpenMobile,
  ]);

  return (
    <div className="min-h-screen flex w-full bg-background overflow-hidden">
      <AppSidebar role={role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between border-b border-border/40 px-3 md:px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger />

            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary hidden sm:block" />
              <span className="font-display font-semibold capitalize truncate tracking-wide">
                {role} dashboard
              </span>
            </div>
          </div>

          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {role ===
            "owner" && (
            <div className="mb-4">
              <TrialBanner />
            </div>
          )}

          <Outlet />
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
