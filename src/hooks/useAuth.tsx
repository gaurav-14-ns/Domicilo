import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "tenant" | "admin";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ensureUserRecords = async (u: User): Promise<AppRole | null> => {
      // Check existing role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id)
        .maybeSingle();
      if (existing?.role) return existing.role as AppRole;

      // Backfill from auth metadata (covers users created before trigger or after data wipe)
      const meta = (u.user_metadata ?? {}) as Record<string, any>;
      const role: AppRole = (meta.role as AppRole) || "tenant";
      const fullName: string = meta.full_name || "";
      const currency: string = meta.currency_code || "INR";
      const locale: string = meta.locale || "en-IN";

      await supabase.from("profiles").upsert(
        { id: u.id, full_name: fullName, email: u.email ?? "" },
        { onConflict: "id" }
      );
      await supabase.from("user_roles").upsert(
        { user_id: u.id, role },
        { onConflict: "user_id,role" }
      );
      await supabase.from("app_settings").upsert(
        {
          user_id: u.id,
          display_name: fullName,
          contact_email: u.email ?? "",
          currency_code: currency,
          locale,
        },
        { onConflict: "user_id" }
      );
      if (role === "tenant") {
        await supabase.from("tenant_profiles").upsert(
          { user_id: u.id, email: u.email ?? "" },
          { onConflict: "user_id" }
        );
      }
      return role;
    };

    const fetchRole = async (u: User) => {
      const r = await ensureUserRecords(u);
      setRole(r);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => fetchRole(s.user), 0);
      } else {
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) fetchRole(data.session.user);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <Ctx.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);

export const dashboardPathFor = (r: AppRole | null) =>
  r === "owner" ? "/owner" : r === "admin" ? "/admin" : r === "tenant" ? "/tenant" : "/auth";
