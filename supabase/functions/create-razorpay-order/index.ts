import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RAZORPAY_KEY = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!RAZORPAY_KEY || !RAZORPAY_SECRET) {
      return new Response(JSON.stringify({ error: "Razorpay not configured" }), { status: 500, headers: corsHeaders });
    }

    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), { status: 415, headers: corsHeaders });
    }

    const { amount, currency } = await req.json();
    if (typeof amount !== "number" || amount <= 0 || isNaN(amount)) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400, headers: corsHeaders });
    }

    const basicAuth = btoa(`${RAZORPAY_KEY}:${RAZORPAY_SECRET}`);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: currency ?? "INR",
        receipt: `rcpt_${Date.now()}`,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 500,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Payment order creation failed" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
