import { useEffect, useState } from "react";

import {
  useNavigate,
  Link,
} from "react-router-dom";

import {
  Loader2,
  Crown,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

import {
  useAuth,
  dashboardPathFor,
  AppRole,
} from "@/hooks/useAuth";

import {
  detectCurrencyFromBrowser,
} from "@/lib/currency";

export default function Auth() {
  const nav =
    useNavigate();

  const {
    user,
    role,
    loading,
  } = useAuth();

  const [busy, setBusy] =
    useState(false);

  const [
    forgotBusy,
    setForgotBusy,
  ] = useState(false);

  const [
    forgotMode,
    setForgotMode,
  ] = useState(false);

  const [
    recoveryMode,
    setRecoveryMode,
  ] = useState(false);

  const [
    recoveryPassword,
    setRecoveryPassword,
  ] = useState("");

  const [
    confirmRecoveryPassword,
    setConfirmRecoveryPassword,
  ] = useState("");

  // signup

  const [name, setName] =
    useState("");

  const [
    signupEmail,
    setSignupEmail,
  ] = useState("");

  const [
    signupPwd,
    setSignupPwd,
  ] = useState("");

  const [
    confirmSignupPwd,
    setConfirmSignupPwd,
  ] = useState("");

  const [
    signupRole,
    setSignupRole,
  ] =
    useState<AppRole>(
      "owner"
    );

  const [
    adminAvailable,
    setAdminAvailable,
  ] = useState(false);

  // signin

  const [email, setEmail] =
    useState("");

  const [pwd, setPwd] =
    useState("");

  const [
    forgotEmail,
    setForgotEmail,
  ] = useState("");

useEffect(() => {

  const hash =
    window.location.hash;

  const isRecovery =
    hash.includes(
      "type=recovery"
    );

  if (
    isRecovery
  ) {

    setRecoveryMode(
      true
    );

    return;
  }

  /*
    Prevent redirecting during password recovery flow.
  */

  if (
    recoveryMode
  ) {
    return;
  }

  if (
    !loading &&
    user &&
    role
  ) {

    nav(
      dashboardPathFor(
        role
      ),
      {
        replace: true,
      }
    );
  }

}, [
  user,
  role,
  loading,
  nav,
  recoveryMode,
]);
  // check admin availability

  useEffect(() => {
    (async () => {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "admin_exists"
        );

      if (!error) {
        setAdminAvailable(
          !data
        );
      }
    })();
  }, []);

  // SIGNUP

  const handleSignup =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      setBusy(true);

      try {
        if (
          signupRole ===
          "tenant"
        ) {
          toast.error(
            "Tenant accounts cannot be created here."
          );

          return;
        }

        if (
          signupRole ===
            "admin" &&
          !adminAvailable
        ) {
          toast.error(
            "Admin account already exists."
          );

          return;
        }

        const normalizedEmail =
          signupEmail
            .trim()
            .toLowerCase();

        const {
          data:
            existingUser,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "id"
            )
            .eq(
              "email",
              normalizedEmail
            )
            .maybeSingle();

        if (
          existingUser
        ) {
          toast.error(
            "An account with this email already exists."
          );

          return;
        }

        if (
          signupPwd !==
          confirmSignupPwd
        ) {
          toast.error(
            "Passwords do not match."
          );

          return;
          }

        const detected =
          detectCurrencyFromBrowser();

        const {
          error,
        } =
          await supabase.auth.signUp(
            {
              email:
                normalizedEmail,

              password:
                signupPwd,

              options:
                {
                  emailRedirectTo:
                    `${window.location.origin}/auth`,

                  data: {
                    full_name:
                      name,

                    role:
                      signupRole,

                    currency_code:
                      detected.code,

                    locale:
                      detected.locale,
                  },
                },
            }
          );

                if (error) {
          const message =
            error.message?.toLowerCase() || "";

          if (
            message.includes("already registered") ||
            message.includes("already exists") ||
            message.includes("user already registered")
          ) {
            throw new Error(
              "An account with this email already exists."
            );
          }

          throw error;
        }

        toast.success(
          signupRole ===
            "admin"
            ? "Admin account created"
            : "Owner account created"
        );

        setName("");
        setSignupEmail(
          ""
        );
        setSignupPwd(
          ""
        );
        setConfirmSignupPwd(
          ""
        );

      } catch (
        err: any
      ) {
        toast.error(
          "Signup failed",
          {
            description:
              err.message,
          }
        );
      } finally {
        setBusy(false);
      }
    };

  // SIGNIN

  const handleSignin =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      setBusy(true);

      try {
        const normalizedEmail =
          email
            .trim()
            .toLowerCase();

        const {
          error,
        } =
          await supabase.auth.signInWithPassword(
            {
              email:
                normalizedEmail,

              password:
                pwd,
            }
          );

        if (
          error
        ) {
          throw error;
        }

        toast.success(
          "Welcome back"
        );

      } catch (
        err: any
      ) {
        toast.error(
          "Sign in failed",
          {
            description:
              err.message,
          }
        );
      } finally {
        setBusy(false);
      }
    };

  // FORGOT PASSWORD

  const handleForgotPassword =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      setForgotBusy(
        true
      );

      try {
        const normalizedEmail =
          forgotEmail
            .trim()
            .toLowerCase();

        const {
          error,
        } =
          await supabase.auth.resetPasswordForEmail(
            normalizedEmail,
            {
              redirectTo:
                `${window.location.origin}/auth`,
            }
          );

        if (
          error
        ) {
          throw error;
        }

        toast.success(
          "Password reset email sent",
          {
            description:
              "Check your inbox to continue.",
          }
        );

        setForgotEmail(
          ""
        );

        setForgotMode(
          false
        );

      } catch (
        err: any
      ) {
        toast.error(
          "Reset failed",
          {
            description:
              err.message,
          }
        );
      } finally {
        setForgotBusy(
          false
        );
      }
    };

  return (
    <div className="min-h-screen grid place-items-center bg-sunset bg-skyline p-4">

      <div className="w-full max-w-md">

        {recoveryMode ? (

  <div className="flex flex-col items-center justify-center mb-8">
    <img
      src="/favicon.png"
      alt="Domicilo"
      className="h-24 w-24 rounded-[2rem] object-cover shadow-glow mx-auto"
    />

    <p className="text-lg font-display font-bold mt-2">
      Domicilo
    </p>
  </div>

) : (

  <Link
    to="/"
    className="flex flex-col items-center justify-center font-display font-bold text-lg mb-8"
  >
    <img
      src="/favicon.png"
      alt="Domicilo"
      className="h-24 w-24 rounded-[2rem] object-cover shadow-glow mx-auto"
    />

    <p className="mt-2">
      Domicilo
    </p>
  </Link>

)}

        <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-elegant backdrop-blur-xl">

          {recoveryMode ? (
  <form
    onSubmit={async (e) => {
      e.preventDefault();

      if (
        recoveryPassword !==
        confirmRecoveryPassword
      ) {
        toast.error(
          "Passwords do not match."
        );

        return;
      }

      try {
        setBusy(true);

        const {
          error,
        } =
          await supabase.auth.updateUser(
            {
              password:
                recoveryPassword,
            }
          );

        if (
          error
        ) {
          throw error;
        }

        toast.success(
          "Password updated successfully."
        );

        window.location.href =
          "/auth";

      } catch (
        err: any
      ) {
        toast.error(
          "Password update failed",
          {
            description:
              err.message,
          }
        );
      } finally {
        setBusy(false);
      }
    }}
    className="space-y-4"
  >
    <div className="space-y-1">
      <h2 className="text-xl font-semibold">
        Reset password
      </h2>

      <p className="text-sm text-muted-foreground">
        Enter your new password below.
      </p>
    </div>

    <div className="space-y-2">
      <Label>
        New password
      </Label>

      <Input
        type="password"
        required
        value={
          recoveryPassword
        }
        onChange={(e) =>
          setRecoveryPassword(
            e.target.value
          )
        }
      />
    </div>

    <div className="space-y-2">
      <Label>
        Confirm new password
      </Label>

      <Input
        type="password"
        required
        value={
          confirmRecoveryPassword
        }
        onChange={(e) =>
          setConfirmRecoveryPassword(
            e.target.value
          )
        }
      />
    </div>

    <Button
      type="submit"
      variant="hero"
      className="w-full"
      disabled={busy}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        "Update password"
      )}
    </Button>
  </form>
) : forgotMode ? (

  <form
    onSubmit={
      handleForgotPassword
    }
    className="space-y-4"
  >

    <div className="space-y-1">
      <h2 className="text-xl font-semibold">
        Forgot password
      </h2>

      <p className="text-sm text-muted-foreground">
        Enter your email and we'll send you a reset link.
      </p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="forgot-email">
        Email
      </Label>

      <Input
        id="forgot-email"
        type="email"
        required
        value={forgotEmail}
        onChange={(e) =>
          setForgotEmail(
            e.target.value
          )
        }
      />
    </div>

    <Button
      type="submit"
      variant="hero"
      className="w-full"
      disabled={forgotBusy}
    >
      {forgotBusy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        "Send reset link"
      )}
    </Button>

    <button
      type="button"
      onClick={() =>
        setForgotMode(false)
      }
      className="w-full text-sm text-muted-foreground hover:text-foreground transition-smooth"
    >
      Back to sign in
    </button>

  </form>

) : (
            <Tabs
              defaultValue="signin"
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">
                  Sign in
                </TabsTrigger>

                <TabsTrigger value="signup">
                  Create account
                </TabsTrigger>
              </TabsList>

              {/* SIGN IN */}

              <TabsContent value="signin">

                <form
                  onSubmit={
                    handleSignin
                  }
                  className="space-y-4 pt-4"
                >

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email
                    </Label>

                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(
                        e
                      ) =>
                        setEmail(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pwd">
                      Password
                    </Label>

                    <Input
                      id="pwd"
                      type="password"
                      required
                      value={pwd}
                      onChange={(
                        e
                      ) =>
                        setPwd(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setForgotMode(
                          true
                        )
                      }
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={
                      busy
                    }
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Sign in"
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Tenant accounts can only be created by an owner or admin.
                  </p>

                </form>
              </TabsContent>

              {/* SIGN UP */}

              <TabsContent value="signup">

                <form
                  onSubmit={
                    handleSignup
                  }
                  className="space-y-4 pt-4"
                >

                  <div className="space-y-2">

                    <Label>
                      Account type
                    </Label>

                    <RadioGroup
                      value={
                        signupRole
                      }
                      onValueChange={(
                        v
                      ) =>
                        setSignupRole(
                          v as AppRole
                        )
                      }
                      className={`grid gap-2 ${
                        adminAvailable
                          ? "grid-cols-2"
                          : "grid-cols-1"
                      }`}
                    >

                      {(
  [
    "owner",
    "admin",
  ] as AppRole[]
).map(
  (
    r
  ) => {
    const disabled =
      r === "admin" &&
      !adminAvailable;

    return (
      <Label
        key={
          r
        }
        htmlFor={`su-${r}`}
        className={`rounded-lg border px-3 py-2 text-center text-sm capitalize transition-smooth ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        } ${
          signupRole ===
            r &&
          !disabled
            ? "border-primary bg-primary/10 text-primary"
            : "border-border"
        }`}
      >

        <RadioGroupItem
          value={
            r
          }
          id={`su-${r}`}
          className="sr-only"
          disabled={
            disabled
          }
        />

        {r ===
        "owner"
          ? "Property Owner"
          : "Admin"}
      </Label>
    );
  }
)}
                    </RadioGroup>

                    <p className="text-[11px] text-muted-foreground">
  Only one admin account can exist globally.
</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full name
                    </Label>

                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(
                        e
                      ) =>
                        setName(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="se">
                      Email
                    </Label>

                    <Input
                      id="se"
                      type="email"
                      required
                      value={
                        signupEmail
                      }
                      onChange={(
                        e
                      ) =>
                        setSignupEmail(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
  <Label htmlFor="signupPwd">
    Password
  </Label>

  <Input
    id="signupPwd"
    type="password"
    required
    value={signupPwd}
    onChange={(e) =>
      setSignupPwd(
        e.target.value
      )
    }
  />
</div>

<div className="space-y-2">
  <Label htmlFor="confirmSignupPwd">
    Confirm Password
  </Label>

  <Input
    id="confirmSignupPwd"
    type="password"
    required
    value={confirmSignupPwd}
    onChange={(e) =>
      setConfirmSignupPwd(
        e.target.value
      )
    }
  />
</div>

                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={
                      busy
                    }
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Create account"
                    )}
                  </Button>

                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
