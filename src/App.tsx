import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { DataStoreProvider } from "@/store/DataStore";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import DashboardLayout from "@/layouts/DashboardLayout";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

import OwnerOverview from "./pages/owner/Overview";
import Properties from "./pages/owner/Properties";
import OwnerTenants from "./pages/owner/Tenants";
import OwnerTransactions from "./pages/owner/Transactions";
import Reports from "./pages/owner/Reports";
import OwnerSettings from "./pages/owner/Settings";

import TenantOverview from "./pages/tenant/Overview";
import Dues from "./pages/tenant/Dues";
import TenantTransactions from "./pages/tenant/Transactions";
import Profile from "./pages/tenant/Profile";

import AdminLeads from "./pages/admin/Leads";
import AdminOverview from "./pages/admin/Overview";
import Orgs from "./pages/admin/Orgs";
import AdminUsers from "./pages/admin/Users";
import System from "./pages/admin/System";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DataStoreProvider>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />

                <Route
                  path="/owner"
                  element={
                    <ProtectedRoute allow={["owner"]}>
                      <DashboardLayout role="owner" />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<OwnerOverview />} />
                  <Route path="properties" element={<Properties />} />
                  <Route path="tenants" element={<OwnerTenants />} />
                  <Route path="transactions" element={<OwnerTransactions />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<OwnerSettings />} />
                </Route>

                <Route
                  path="/tenant"
                  element={
                    <ProtectedRoute allow={["tenant"]}>
                      <DashboardLayout role="tenant" />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<TenantOverview />} />
                  <Route path="dues" element={<Dues />} />
                  <Route path="transactions" element={<TenantTransactions />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allow={["admin"]}>
                      <DashboardLayout role="admin" />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminOverview />} />
                  <Route path="orgs" element={<Orgs />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="leads" element={<AdminLeads />} />
                  <Route path="system" element={<System />} />
                </Route>

                <Route path="/dashboard" element={<Navigate to="/auth" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DataStoreProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
