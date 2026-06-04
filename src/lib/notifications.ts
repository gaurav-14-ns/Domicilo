import { supabase } from "@/integrations/supabase/client";

type NotificationPayload = {
  type: "rent_receipt" | "maintenance_update" | "payment_reminder" | "welcome";
  email: string;
  data: Record<string, any>;
};

export async function sendNotification(payload: NotificationPayload) {
  const { error } = await supabase.functions.invoke("send-email", {
    body: payload,
  });
  if (error) console.error("Notification failed:", error);
}
