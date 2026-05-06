import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();

    const {
      email,
      password,
      name,
      owner_id,
    } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // duplicate auth email check
    const {
      data: existingUsers,
    } = await supabase.auth.admin.listUsers();

    const alreadyExists =
      existingUsers.users.find(
        (u) => u.email === email
      );

    if (alreadyExists) {
      return new Response(
        JSON.stringify({
          error:
            "Tenant email already exists.",
        }),
        { status: 400 }
      );
    }

    // create auth user
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "tenant",
        full_name: name,
      },
    });

    if (authError) {
      throw authError;
    }

    return new Response(
      JSON.stringify({
        user: authData.user,
      }),
      { status: 200 }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      { status: 500 }
    );
  }
});
