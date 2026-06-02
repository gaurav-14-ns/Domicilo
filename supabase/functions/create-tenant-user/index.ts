import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") || "https://domicilo.vercel.app";

serve(async (req) => {

  try {

    const body =
      await req.json();

    const {
      email,
      name,
      owner_id,
      phone,
      property_id,
      room,
      rent,
      deposit,
      start_date,
      status,
    } = body;

    if (
      !email ||
      !name
    ) {

      return new Response(
        JSON.stringify({
          error:
            "Missing required fields.",
        }),
        {
          status: 400,
        }
      );

    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    const supabase =
      createClient(
        Deno.env.get(
          "SUPABASE_URL"
        )!,
        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        )!
      );

    // --------------------------------------------------
    // Check existing auth users
    // --------------------------------------------------

    const {
      data: existingUser,
      error: usersError,
    } = await supabase.auth.admin.getUserByEmail(normalizedEmail);

    if (usersError) {
      throw usersError;
    }

    if (existingUser?.user) {
      return new Response(
        JSON.stringify({
          error: "Tenant email already exists.",
        }),
        { status: 400 }
      );
    }

    // Invite tenant user

const {
  data: authData,
  error: authError,
} =
  await supabase.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      redirectTo:
        `${SITE_URL}/auth/reset-password`,

      data: {
        role: "tenant",
        full_name: name,
      },
    }
  );

    if (
      authError
    ) {
      throw authError;
    }

    const userId =
      authData.user?.id;

    if (
      !userId
    ) {

      throw new Error(
        "Failed to create tenant auth user"
      );

    }

    // --------------------------------------------------
    // Create profile
    // --------------------------------------------------

    const {
      error:
        profileError,
    } =
      await supabase
        .from(
          "profiles"
        )
        .upsert({

          id:
            userId,

          full_name:
            name,

          email:
            normalizedEmail,

        });

    if (
      profileError
    ) {
      throw profileError;
    }

    // --------------------------------------------------
    // Create role
    // --------------------------------------------------

    const {
      error:
        roleError,
    } =
      await supabase
        .from(
          "user_roles"
        )
        .upsert({

          user_id:
            userId,

          role:
            "tenant",

        });

    if (
      roleError
    ) {
      throw roleError;
    }

    // --------------------------------------------------
    // Create tenant profile
    // --------------------------------------------------

      const {
        error:
          tenantProfileError,
      } =
        await supabase
          .from(
            "tenant_profiles"
          )
          .upsert({

            user_id:
              userId,

            email:
              normalizedEmail,

            phone:
              phone ?? "",

          });

    if (
      tenantProfileError
    ) {
      throw tenantProfileError;
    }

    // --------------------------------------------------
    // Get owner settings
    // --------------------------------------------------

    const {
      data:
        ownerSettings,
      error:
        settingsError,
    } =
      await supabase
        .from(
          "app_settings"
        )
        .select(`
          currency_code,
          locale
        `)
        .eq(
          "user_id",
          owner_id
        )
        .maybeSingle();

    if (
      settingsError
    ) {
      throw settingsError;
    }

    // --------------------------------------------------
    // Create tenant row
    // IMPORTANT:
    // tenant.id === auth.users.id
    // --------------------------------------------------

    const {
      error:
        tenantError,
    } =
      await supabase
        .from(
          "tenants"
        )
        .insert({

          id:
            userId,

          owner_id,

          property_id:
            property_id ||
            null,

          name,

          room,

          rent,

          deposit,

          email:
            normalizedEmail,

          phone:
            phone ?? "",

          start_date,

          status:
            status ??
            "active",

          currency_code:
            ownerSettings?.currency_code ??
            "INR",

          locale:
            ownerSettings?.locale ??
            "en-IN",

        });

    if (
      tenantError
    ) {
      throw tenantError;
    }

    // --------------------------------------------------
    // Success
    // --------------------------------------------------

    return new Response(
      JSON.stringify({

        success:
          true,

        user:
          authData.user,

      }),
      {
        status: 200,
      }
    );

  } catch (
    err: any
  ) {

    console.error(
      "create-tenant-user failed:",
      err
    );

    return new Response(
      JSON.stringify({

        error:
          err?.message ??
          "Unexpected error",

      }),
      {
        status: 500,
      }
    );

  }

});
