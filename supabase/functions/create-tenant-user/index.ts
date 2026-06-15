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

    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw usersError;
    }

    const existingUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
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
    // Send welcome email + SMS notification
    // --------------------------------------------------

    try {
      const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
      const ownerInfo = await supabase.from("profiles").select("full_name, email").eq("id", owner_id).maybeSingle();
      const ownerName = ownerInfo?.data?.full_name ?? "Your property manager";

      // Welcome email
      if (RESEND_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Domicilo <notifications@domicilo.app>",
            to: normalizedEmail,
            subject: "Welcome to Domicilo — Set your password",
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
                <h1 style="color:#1a1a4e;font-size:24px;">Welcome to Domicilo</h1>
                <p style="color:#444;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
                <p style="color:#444;font-size:15px;line-height:1.6;">
                  ${ownerName} has added you as a tenant. You can now log in to your Domicilo dashboard
                  to view your dues, make payments, and manage your tenancy.
                </p>
                <p style="color:#444;font-size:15px;line-height:1.6;">
                  Click the button below to set your password and get started:
                </p>
                <a href="${SITE_URL}/auth/reset-password"
                   style="display:inline-block;background:#1a1a4e;color:#ffd700;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
                  Set My Password
                </a>
                <p style="color:#888;font-size:13px;line-height:1.5;">
                  Your property: ${room || "—"} &middot; Rent: ${rent ? `₹${Number(rent).toLocaleString("en-IN")}/mo` : "—"}<br/>
                  If you have any questions, contact your property manager.
                </p>
              </div>
            `,
          }),
        });
      }

      // SMS notification stub (requires a provider like Twilio, MSG91, etc.)
      if (phone) {
        try {
          const SMS_API_KEY = Deno.env.get("SMS_API_KEY") ?? "";
          const SMS_FROM = Deno.env.get("SMS_FROM") ?? "DOMICILO";
          if (SMS_API_KEY) {
            // Example: MSG91 or Twilio integration
            await fetch("https://api.msg91.com/api/v5/flow/", {
              method: "POST",
              headers: { "Content-Type": "application/json", "authkey": SMS_API_KEY },
              body: JSON.stringify({
                flow_id: "welcome_tenant",
                sender: SMS_FROM,
                mobiles: phone,
                var1: name,
                var2: SITE_URL,
              }),
            });
          }
        } catch (_smsErr) {
          // SMS delivery failure is non-critical
          console.warn("SMS notification skipped:", _smsErr);
        }
      }
    } catch (_notifErr) {
      // Notification failure is non-critical
      console.warn("Welcome notification skipped:", _notifErr);
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
