import { lazy, Suspense } from "react";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { DataStoreProvider } from "@/store/DataStore";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PageTransition } from "@/components/PageTransition";
import DashboardLayout from "@/layouts/DashboardLayout";
import { LoadingState } from "@/components/states/LoadingState";
import { FloatingActionMenu } from "@/components/FloatingActionMenu";

const Index = lazy(() => import("./pages/Index.tsx"));
const BrowseProperties = lazy(() => import("./pages/BrowseProperties.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

const OwnerOverview = lazy(() => import("./pages/owner/Overview"));
const Properties = lazy(() => import("./pages/owner/Properties"));
const OwnerTenants = lazy(() => import("./pages/owner/Tenants"));
const OwnerTransactions = lazy(() => import("./pages/owner/Transactions"));
const Reports = lazy(() => import("./pages/owner/Reports"));
const OwnerSettings = lazy(() => import("./pages/owner/Settings"));
const OwnerDocuments = lazy(() => import("./pages/owner/Documents"));
const OwnerMaintenance = lazy(() => import("./pages/owner/Maintenance"));

const TenantOverview = lazy(() => import("./pages/tenant/Overview"));
const Dues = lazy(() => import("./pages/tenant/Dues"));
const TenantTransactions = lazy(() => import("./pages/tenant/Transactions"));
const Profile = lazy(() => import("./pages/tenant/Profile"));
const TenantDocuments = lazy(() => import("./pages/tenant/Documents"));
const TenantMaintenance = lazy(() => import("./pages/tenant/Maintenance"));

const AdminLeads = lazy(() => import("./pages/admin/Leads"));
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const System = lazy(() => import("./pages/admin/System"));
const AdminDocuments = lazy(() => import("./pages/admin/Documents"));
const AdminMaintenance = lazy(() => import("./pages/admin/Maintenance"));
const AdminAuditLog = lazy(() => import("./pages/admin/AuditLog"));

const LoadingFallback = () => (
  <div className="p-6">
    <LoadingState title="Loading..." />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider
    attribute="class"
    forcedTheme="dark"
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DataStoreProvider>
              <ScrollToTop />
              <AppErrorBoundary>
              <PageTransition>
                <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/properties" element={<BrowseProperties />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/reset-password" element={<ResetPassword />}/>
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
                    <Route path="documents" element={<OwnerDocuments />} />
                    <Route path="maintenance" element={<OwnerMaintenance />} />
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
                    <Route path="documents" element={<TenantDocuments />} />
                    <Route path="maintenance" element={<TenantMaintenance />} />
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
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="leads" element={<AdminLeads />} />
                    <Route path="system" element={<System />} />
                    <Route path="documents" element={<AdminDocuments />} />
                    <Route path="maintenance" element={<AdminMaintenance />} />
                    <Route path="audit" element={<AdminAuditLog />} />
                  </Route>

                  <Route path="/dashboard" element={<Navigate to="/auth" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </PageTransition>
              </AppErrorBoundary>
              <FloatingActionMenu />
            </DataStoreProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
);

export default App;
