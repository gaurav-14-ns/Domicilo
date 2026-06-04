import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RAZORPAY_KEY = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const RAZORPAY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

serve(async (req) => {
  try {
    const { amount, currency } = await req.json();

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
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
