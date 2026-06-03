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

  const [session, setSession] =
    useState<Session | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [role, setRole] =
    useState<AppRole | null>(null);

  const [loading, setLoading] =
    useState(true);

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
          const {
            data: existing,
            error,
          } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", u.id)
            .maybeSingle();

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

const {
  data: profileData,
} = await supabase
  .from("profiles")
  .select("full_name")
  .eq("id", u.id)
  .maybeSingle();

const nextRole: AppRole =
  (meta.role as AppRole) ||
  "tenant";

const fullName =
  profileData?.full_name ||
  meta.full_name ||
  "";

const currency =
  meta.currency_code ||
  "INR";

const locale =
  meta.locale ||
  "en-IN";

          const operations = [];

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

          if (
            nextRole ===
            "owner"
          ) {
            try {
              const {
                data:
                  existingSub,
              } =
                await supabase
                  .from(
                    "subscriptions"
                  )
                  .select(
                    "id"
                  )
                  .eq(
                    "owner_id",
                    u.id
                  )
                  .maybeSingle();

              if (
                !existingSub
              ) {
                await supabase
                  .from(
                    "subscriptions"
                  )
                  .insert({
                    owner_id:
                      u.id,
                    plan:
                      "starter",
                    status:
                      "trial",
                    trial_end:
                      new Date(
                        Date.now() +
                          14 *
                            86400_000
                      ).toISOString(),
                    amount:
                      999,
                    currency_code:
                      currency,
                  });
              }
            } catch (error) {
              console.error(
                "Subscription bootstrap failed:",
                error
              );
            }
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
          const {
  data: profile,
} = await supabase
  .from("profiles")
  .select("suspended")
  .eq("id", u.id)
  .maybeSingle();

if (
  profile?.suspended ===
  true
) {
  safeSetLoading(true);

  await supabase.auth.signOut();

  safeSetRole(null);

  safeSetUser(null);

  safeSetSession(null);

  window.location.href =
    "/auth";

  toast.error(
    "Your account has been suspended."
  );

  return;
}

          safeSetRole(
            resolvedRole
          );
        } catch (error) {
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

          const {
            data,
            error,
          } =
            await supabase.auth.getSession();

          if (error) {
            console.error(
              "Session fetch failed:",
              error
            );
          }

          safeSetSession(
            data.session
          );

          safeSetUser(
            data.session
              ?.user ??
              null
          );

          if (
            data.session
              ?.user
          ) {
            try {
              await fetchRole(
                data
                  .session
                  .user
              );
            } catch (error) {
              console.error(
                "Role fetch in bootstrap failed:",
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
          try {
            safeSetLoading(
              true
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
