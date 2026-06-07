import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

import { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";

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

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const mountedRef = useRef(true);
  const online = useOnlineStatus();
  const lastOnlineRef = useRef(online);

  const cachedUser = (() => {
    try {
      const raw = localStorage.getItem("domicilo_user");
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  })();

  const cachedRole = (() => {
    try {
      const raw = localStorage.getItem("domicilo_role");
      return raw as AppRole | null;
    } catch {
      return null;
    }
  })();

  const [session, setSession] =
    useState<Session | null>(null);

  const [user, setUser] =
    useState<User | null>(cachedUser);

  const [role, setRole] =
    useState<AppRole | null>(cachedRole);

  const [loading, setLoading] =
    useState(!cachedUser);

  const safeSetLoading = (
    value: boolean
  ) => {
    if (mountedRef.current) {
      setLoading(value);
    }
  };

  const safeSetRole = (
    value: AppRole | null
  ) => {
    if (mountedRef.current) {
      setRole(value);
    }
  };

  const safeSetUser = (
    value: User | null
  ) => {
    if (mountedRef.current) {
      setUser(value);
    }
  };

  const safeSetSession = (
    value: Session | null
  ) => {
    if (mountedRef.current) {
      setSession(value);
    }
  };

  const ensureUserRecords =
    useCallback(
      async (
        u: User
      ): Promise<AppRole> => {
        try {
          const [roleResult, profileResult] =
            await Promise.all([
              supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", u.id)
                .maybeSingle(),
              supabase
                .from("profiles")
                .select("full_name, suspended")
                .eq("id", u.id)
                .maybeSingle(),
            ]);

          const {
            data: existing,
            error,
          } = roleResult;

          const {
            data: profileData,
          } = profileResult;

          if (error) {
            console.error(
              "Failed fetching user role:",
              error
            );
          }

          if (existing?.role) {
            return existing.role as AppRole;
          }

          const meta = (u.user_metadata ??
  {}) as Record<
  string,
  any
>;

const nextRole: AppRole =
  (meta.role as AppRole) ||
  "tenant";

const fullName =
  profileData?.full_name ||
  meta.full_name ||
  "";

const suspended =
  profileData?.suspended === true;

const currency =
  meta.currency_code ||
  "INR";

const locale =
  meta.locale ||
  "en-IN";

if (suspended) {
  throw new Error("SUSPENDED");
}

          const operations: Promise<any>[] = [];

          operations.push(
            supabase
              .from("profiles")
              .upsert(
                {
                  id: u.id,
                  full_name:
                    fullName,
                  email:
                    u.email ??
                    "",
                },
                {
                  onConflict:
                    "id",
                }
              )
          );

          operations.push(
            supabase
              .from(
                "user_roles"
              )
              .upsert(
                {
                  user_id:
                    u.id,
                  role:
                    nextRole,
                },
                {
                  onConflict:
                    "user_id",
                }
              )
          );

          operations.push(
            supabase
              .from(
                "app_settings"
              )
              .upsert(
                {
                  user_id:
                    u.id,
                  display_name:
                    fullName,
                  contact_email:
                    u.email ??
                    "",
                  currency_code:
                    currency,
                  locale,
                },
                {
                  onConflict:
                    "user_id",
                }
              )
          );

          if (
            nextRole ===
            "tenant"
          ) {
            operations.push(
              supabase
                .from(
                  "tenant_profiles"
                )
                .upsert(
                  {
                    user_id:
                      u.id,
                    email:
                      u.email ??
                      "",
                  },
                  {
                    onConflict:
                      "user_id",
                  }
                )
            );
          }

          if (nextRole === "owner") {
            operations.push(
              (async () => {
                const { data: existingSub } =
                  await supabase
                    .from("subscriptions")
                    .select("id")
                    .eq("owner_id", u.id)
                    .maybeSingle();
                if (!existingSub) {
                  await supabase
                    .from("subscriptions")
                    .insert({
                      owner_id: u.id,
                      plan: "starter",
                      status: "trial",
                      trial_end:
                        new Date(Date.now() + 14 * 86400_000).toISOString(),
                      amount: 999,
                      currency_code: currency,
                    });
                }
              })()
            );
          }

          try {
            await Promise.allSettled(
              operations
            );
          } catch (error) {
            console.error(
              "User setup operations failed:",
              error
            );
          }

          return nextRole;
        } catch (error) {
          console.error(
            "ensureUserRecords failed:",
            error
          );

          return "tenant";
        }
      },
      []
    );

  const fetchRole =
    useCallback(
      async (u: User) => {
        try {
          const resolvedRole =
            await ensureUserRecords(
              u
            );
          safeSetRole(
            resolvedRole
          );
          try {
            localStorage.setItem("domicilo_user", JSON.stringify(u));
            localStorage.setItem("domicilo_role", resolvedRole);
          } catch {} // ignore quota errors
        } catch (error: any) {
          if (error?.message === "SUSPENDED") {
            safeSetLoading(true);
            await supabase.auth.signOut();
            safeSetRole(null);
            safeSetUser(null);
            safeSetSession(null);
            window.location.href = "/auth";
            toast.error("Your account has been suspended.");
            return;
          }
          console.error(
            "Role fetch failed:",
            error
          );
          safeSetRole(
            "tenant"
          );
        }
      },
      [ensureUserRecords]
    );

  useEffect(() => {
    mountedRef.current = true;

    const bootstrap =
      async () => {
        try {
          safeSetLoading(
            true
          );

          // Safety: force loading to false after 10s
          // Prevents infinite loading when tab returns from background
          // and session recovery hangs
          const safetyTimeout =
            setTimeout(
              () => {
                safeSetLoading(
                  false
                );
              },
              10000
            );

          const {
            data,
            error,
          } =
            await supabase.auth.getSession();

          clearTimeout(safetyTimeout);

          if (error) {
            console.error(
              "Session fetch failed:",
              error
            );
          }

          // If no session and no ongoing sign-in, stop loading immediately
          if (!data.session) {
            safeSetSession(null);
            safeSetUser(null);
            safeSetRole(null);
            safeSetLoading(false);
            try { localStorage.removeItem("domicilo_user"); localStorage.removeItem("domicilo_role"); } catch {}
            return;
          }

          safeSetSession(
            data.session
          );

          safeSetUser(
            data.session?.user ?? null
          );

          try {
            await fetchRole(
              data.session.user
            );
          } catch (error) {
            console.error(
              "Role fetch in bootstrap failed:",
              error
            );
          }
        } catch (error) {
          console.error(
            "Bootstrap auth failed:",
            error
          );

          safeSetRole(
            null
          );
        } finally {
          safeSetLoading(
            false
          );
        }
      };

    void bootstrap();

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          s
        ) => {
          let safetyTimeout:
            ReturnType<
              typeof setTimeout
            > | null =
            null;

          try {
            safeSetLoading(
              true
            );

            // Safety: force loading to false
            // after 20 s even if fetchRole
            // stalls on this device/browser
            safetyTimeout =
              setTimeout(
                () => {
                  safeSetLoading(
                    false
                  );
                },
                20000
              );

            safeSetSession(
              s
            );

            safeSetUser(
              s?.user ??
                null
            );

            if (
              s?.user
            ) {
              try {
                await fetchRole(
                  s.user
                );
              } catch (error) {
                console.error(
                  "Role fetch in auth change failed:",
                  error
                );
              }
            } else {
              safeSetRole(
                null
              );
            }
          } catch (error) {
            console.error(
              "Auth state change failed:",
              error
            );

            safeSetRole(
              null
            );
          } finally {
            clearTimeout(
              safetyTimeout
            );

            safeSetLoading(
              false
            );
          }
        }
      );

    return () => {
      mountedRef.current =
        false;

      listener.subscription.unsubscribe();
    };
  }, [fetchRole]);

  // Re-bootstrap when coming back online (e.g. tab switch, network resume)
  useEffect(() => {
    if (online && !lastOnlineRef.current && loading) {
      lastOnlineRef.current = true;
      const t = setTimeout(() => window.location.reload(), 500);
      return () => clearTimeout(t);
    }
    lastOnlineRef.current = online;
  }, [online, loading]);

  const signOut =
    useCallback(
      async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error(
            "Sign out failed:",
            error
          );
        } finally {
          safeSetRole(
            null
          );

          safeSetUser(
            null
          );

          safeSetSession(
            null
          );
          try { localStorage.removeItem("domicilo_user"); localStorage.removeItem("domicilo_role"); } catch {}
        }
      },
      []
    );

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        role,
        loading,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () =>
  useContext(Ctx);

export const dashboardPathFor = (
  r: AppRole | null
) =>
  r === "owner"
    ? "/owner"
    : r === "admin"
    ? "/admin"
    : r === "tenant"
    ? "/tenant"
    : "/auth";
