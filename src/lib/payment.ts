import { supabase } from "@/integrations/supabase/client";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export async function payWithRazorpay(amount: number, currency = "INR") {
  const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
    body: { amount, currency },
  });

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Failed to create payment order");
  }

  const order = data as RazorpayOrder;

  return new Promise<void>((resolve, reject) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Domicilo",
      order_id: order.id,
      handler: () => resolve(),
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  });
}
