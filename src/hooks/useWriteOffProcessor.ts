import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWriteOff } from "@/hooks/useMenuPreferences";

interface CancelledItem {
  name: string;
  price: number;
  quantity?: number;
  isFired?: boolean;
}

/**
 * Processes write-offs for fired items when an order is cancelled.
 * When Write-Off is enabled, fired items are:
 *   1. Deducted from product inventory (stock_count)
 *   2. Recorded in the write_offs table as a loss
 */
export function useWriteOffProcessor() {
  const writeOff = useWriteOff();
  const isEnabled = writeOff.value === "true";

  const processCancelledItems = useCallback(
    async (items: CancelledItem[], orderId?: string, reason?: string) => {
      if (!isEnabled) return;

      const firedItems = items.filter((item) => item.isFired);
      if (firedItems.length === 0) return;

      // Resolve product IDs by name
      const names = [...new Set(firedItems.map((i) => i.name))];
      const { data: products } = await (supabase as any)
        .from("products")
        .select("id, name, stock_count, inventory_tracking")
        .in("name", names);

      const productMap = new Map<string, any>();
      (products || []).forEach((p: any) => productMap.set(p.name, p));

      const writeOffRows: any[] = [];

      for (const item of firedItems) {
        const qty = item.quantity ?? 1;
        const product = productMap.get(item.name);

        // Deduct inventory if product has tracking enabled
        if (product && product.inventory_tracking && product.stock_count !== null) {
          const newCount = Math.max(0, (product.stock_count || 0) - qty);
          await (supabase as any)
            .from("products")
            .update({ stock_count: newCount, is_available: newCount > 0 })
            .eq("id", product.id);
        }

        writeOffRows.push({
          product_id: product?.id || null,
          product_name: item.name,
          quantity: qty,
          unit_price: item.price,
          total_loss: item.price * qty,
          reason: reason || "Cancelled after fire",
          order_id: orderId || null,
        });
      }

      if (writeOffRows.length > 0) {
        await (supabase as any).from("write_offs").insert(writeOffRows);
      }

      // Trigger product refresh across the app
      window.dispatchEvent(new CustomEvent("products-updated"));
    },
    [isEnabled]
  );

  return { processCancelledItems, isEnabled };
}
