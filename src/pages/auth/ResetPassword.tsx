import { useEffect, useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "@/integrations/supabase/client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input }
from "@/components/ui/input";

import { Button }
from "@/components/ui/button";

import {
  toast,
} from "sonner";

export default function ResetPassword() {

  const navigate =
    useNavigate();

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    validSession,
    setValidSession,
  ] = useState(false);

  useEffect(() => {

    const checkSession =
      async () => {

        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

        if (
          error ||
          !data.session
        ) {

          toast.error(
            "Invalid or expired reset link."
          );

          navigate(
            "/auth",
            {
              replace: true,
            }
          );

          return;
        }

        setValidSession(true);
      };

    checkSession();

  }, [navigate]);

  const handleUpdatePassword =
    async () => {

      if (!password.trim()) {

        toast.error(
          "Password is required."
        );

        return;
      }

      if (
        password.length < 8
      ) {

        toast.error(
          "Password must be at least 8 characters."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {

        toast.error(
          "Passwords do not match."
        );

        return;
      }

      try {

        setLoading(true);

        const {
          error,
        } =
          await supabase.auth.updateUser({
            password,
          });

        if (error) {
          throw error;
        }

        toast.success(
          "Password updated successfully."
        );

        await supabase.auth.signOut();

        navigate(
          "/auth",
          {
            replace: true,
          }
        );

      } catch (
        err: any
      ) {

        toast.error(
          err.message ||
          "Failed to update password."
        );

      } finally {

        setLoading(false);

      }
    };

  if (!validSession) {
    return null;
  }

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-background
        px-4
      "
    >

      <Card
        className="
          w-full
          max-w-md
        "
      >

        <CardHeader>

          <CardTitle>
            Set new password
          </CardTitle>

          <CardDescription>
            Create a secure password for your account.
          </CardDescription>

        </CardHeader>

        <CardContent
          className="
            space-y-4
          "
        >

          <div
            className="
              space-y-2
            "
          >

            <label
              className="
                text-sm
                font-medium
              "
            >
              New password
            </label>

            <Input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

          </div>

          <div
            className="
              space-y-2
            "
          >

            <label
              className="
                text-sm
                font-medium
              "
            >
              Confirm password
            </label>

            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
            />

          </div>

          <Button
            className="w-full"
            onClick={
              handleUpdatePassword
            }
            disabled={loading}
          >

            {
              loading
                ? "Updating..."
                : "Update password"
            }

          </Button>

        </CardContent>

      </Card>

    </div>
  );
}
