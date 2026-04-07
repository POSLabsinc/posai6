import { supabase } from "@/integrations/supabase/client";

/**
 * Deletes all KDS messages linked to a specific order when it is paid/completed.
 */
export async function clearOrderMessages(orderId: string): Promise<void> {
  try {
    await (supabase as any)
      .from("kds_messages")
      .delete()
      .eq("linked_order_id", orderId);
  } catch (err) {
    console.error("Failed to clear order messages:", err);
  }
}
