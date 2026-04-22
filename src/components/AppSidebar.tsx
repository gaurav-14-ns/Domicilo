import { Building2, LayoutDashboard, Home, Users, Receipt, BarChart3, Settings, LogOut, ShieldCheck, Wallet, UserCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const ownerItems = [
  { title: "Overview", url: "/owner", icon: LayoutDashboard, end: true },
  { title: "Properties", url: "/owner/properties", icon: Home },
  { title: "Tenants", url: "/owner/tenants", icon: Users },
  { title: "Transactions", url: "/owner/transactions", icon: Receipt },
  { title: "Reports", url: "/owner/reports", icon: BarChart3 },
  { title: "Settings", url: "/owner/settings", icon: Settings },
];

const tenantItems = [
  { title: "Overview", url: "/tenant", icon: LayoutDashboard, end: true },
  { title: "My dues", url: "/tenant/dues", icon: Wallet },
  { title: "Transactions", url: "/tenant/transactions", icon: Receipt },
  { title: "Profile", url: "/tenant/profile", icon: UserCircle },
];

const adminItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Organizations", url: "/admin/orgs", icon: Building2 },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "System", url: "/admin/system", icon: ShieldCheck },
];

export function AppSidebar({ role }: { role: AppRole }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const nav = useNavigate();

  const items = role === "owner" ? ownerItems : role === "tenant" ? tenantItems : adminItems;

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    nav("/", { replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <NavLink to="/" className="flex items-center gap-2 px-2 py-2 font-display font-bold">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary shadow-glow shrink-0">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </span>
          {!collapsed && <span>Domicilo</span>}
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="capitalize">{role}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && user && (
          <div className="px-2 py-1 text-xs text-muted-foreground truncate">{user.email}</div>
        )}
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="justify-start">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
