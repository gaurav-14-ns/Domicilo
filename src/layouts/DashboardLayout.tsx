import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrialBanner } from "@/components/TrialBanner";
import { AppRole } from "@/hooks/useAuth";

export default function DashboardLayout({ role }: { role: AppRole }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-3 md:px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="font-display font-semibold capitalize">{role} dashboard</span>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {role === "owner" && (
              <div className="mb-4"><TrialBanner /></div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
