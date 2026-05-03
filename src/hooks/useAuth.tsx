import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
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

  const ensureUserRecords = useCallback(async (u: User): Promise<AppRole | null> => {
    const { data: existing } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.id)
      .maybeSingle();

    if (existing?.role) return existing.role as AppRole;

    const meta = (u.user_metadata ?? {}) as Record<string, any>;
    const nextRole: AppRole = (meta.role as AppRole) || "tenant";
    const fullName: string = meta.full_name || "";
    const currency: string = meta.currency_code || "INR";
    const locale: string = meta.locale || "en-IN";

    await supabase.from("profiles").upsert(
      { id: u.id, full_name: fullName, email: u.email ?? "" },
      { onConflict: "id" }
    );

    await supabase.from("user_roles").upsert(
      { user_id: u.id, role: nextRole },
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

    if (nextRole === "tenant") {
      await supabase.from("tenant_profiles").upsert(
        { user_id: u.id, email: u.email ?? "" },
        { onConflict: "user_id" }
      );
    }

    if (nextRole === "owner") {
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("owner_id", u.id)
        .maybeSingle();

      if (!existingSub) {
        await supabase.from("subscriptions").insert({
          owner_id: u.id,
          plan: "starter",
          status: "trial",
          trial_end: new Date(Date.now() + 14 * 86400_000).toISOString(),
          amount: 999,
          currency_code: currency,
        });
      }
    }

    return nextRole;
  }, []);

  const fetchRole = useCallback(async (u: User) => {
    const r = await ensureUserRecords(u);
    setRole(r);
  }, [ensureUserRecords]);

  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        await fetchRole(data.session.user);
      } else {
        setRole(null);
      }

      setLoading(false);
    };

    void bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      const run = async () => {
        setLoading(true);
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await fetchRole(s.user);
        } else {
          setRole(null);
        }

        setLoading(false);
      };

      void run();
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRole(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);

export const dashboardPathFor = (r: AppRole | null) =>
  r === "owner" ? "/owner" : r === "admin" ? "/admin" : r === "tenant" ? "/tenant" : "/auth";
