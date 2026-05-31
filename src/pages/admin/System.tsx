import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Loader2 } from "lucide-react";

export default function System() {

  const [
    passwordBusy,
    setPasswordBusy,
  ] = useState(false);

  const [
    passwordForm,
    setPasswordForm,
  ] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const updatePassword =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault();

      if (
        passwordForm.newPassword.length < 6
      ) {

        toast.error(
          "Password must be at least 6 characters."
        );

        return;
      }

      if (
        passwordForm.newPassword !==
        passwordForm.confirmPassword
      ) {

        toast.error(
          "Passwords do not match."
        );

        return;
      }

      setPasswordBusy(true);

      try {

        const {
          error,
        } =
          await supabase.auth.updateUser(
            {
              password:
                passwordForm.newPassword,
            }
          );

        if (error) {
          throw error;
        }

        toast.success(
          "Password updated successfully."
        );

        setPasswordForm({
          newPassword: "",
          confirmPassword: "",
        });

      } catch (
        err: any
      ) {

        toast.error(
          err.message ||
            "Failed to update password."
        );

      } finally {

        setPasswordBusy(false);

      }
    };

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-2xl md:text-3xl font-display font-bold">
          System
        </h1>

        <p className="text-muted-foreground mt-1">
          Manage platform security and administrator access.
        </p>

      </div>

      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-xl border border-border bg-gradient-card p-5">

          <div className="text-sm text-muted-foreground">
            Authentication
          </div>

          <div className="text-lg font-semibold mt-2">
            Supabase Auth Active
          </div>

        </div>

        <div className="rounded-xl border border-border bg-gradient-card p-5">

          <div className="text-sm text-muted-foreground">
            Admin Access
          </div>

          <div className="text-lg font-semibold mt-2">
            Protected
          </div>

        </div>

        <div className="rounded-xl border border-border bg-gradient-card p-5">

          <div className="text-sm text-muted-foreground">
            Password Policy
          </div>

          <div className="text-lg font-semibold mt-2">
            Minimum 6 Characters
          </div>

        </div>

      </div>

      <form
        onSubmit={
          updatePassword
        }
        className="rounded-xl border border-border bg-gradient-card p-6 space-y-5"
      >

        <div>

          <h2 className="text-lg font-semibold">
            Change Password
          </h2>

          <p className="text-sm text-muted-foreground">
            Update your administrator account password securely.
          </p>

        </div>

        <div className="grid sm:grid-cols-2 gap-4">

          <div className="space-y-2">

            <Label>
              New password
            </Label>

            <Input
              type="password"
              placeholder="Enter new password"
              value={
                passwordForm.newPassword
              }
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword:
                    e.target.value,
                })
              }
            />

          </div>

          <div className="space-y-2">

            <Label>
              Confirm password
            </Label>

            <Input
              type="password"
              placeholder="Confirm new password"
              value={
                passwordForm.confirmPassword
              }
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword:
                    e.target.value,
                })
              }
            />

          </div>

        </div>

        <Button
          type="submit"
          variant="hero"
          disabled={
            passwordBusy
          }
        >

          {passwordBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Update Password"
          )}

        </Button>

      </form>

    </div>
  );
}
