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
 * Processes cancelled items based on the Write-Off setting.
 *
 * Write-Off ENABLED:  Fired items are treated as waste, inventory is deducted,
 *                     and a loss record is created in the write_offs table.
 *
 * Write-Off DISABLED: All cancelled items are considered in good condition,
 *                     inventory is restored (stock_count incremented), and
 *                     no loss or expense is recorded.
 */
export function useWriteOffProcessor() {
  const writeOff = useWriteOff();
  const isEnabled = writeOff.value === "true";

  const processCancelledItems = useCallback(
    async (items: CancelledItem[], orderId?: string, reason?: string) => {
      const relevantItems = isEnabled
        ? items.filter((item) => item.isFired)
        : items;

      if (relevantItems.length === 0) return;

      // Resolve product IDs by name
      const names = [...new Set(relevantItems.map((i) => i.name))];
      const { data: products } = await (supabase as any)
        .from("products")
        .select("id, name, stock_count, inventory_tracking")
        .in("name", names);

      const productMap = new Map<string, any>();
      (products || []).forEach((p: any) => productMap.set(p.name, p));

      if (isEnabled) {
        // --- Write-Off ON: deduct inventory + record loss ---
        const writeOffRows: any[] = [];

        for (const item of relevantItems) {
          const qty = item.quantity ?? 1;
          const product = productMap.get(item.name);

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
      } else {
        // --- Write-Off OFF: restore inventory (items in good condition) ---
        for (const item of relevantItems) {
          const qty = item.quantity ?? 1;
          const product = productMap.get(item.name);

          if (product && product.inventory_tracking && product.stock_count !== null) {
            const newCount = (product.stock_count || 0) + qty;
            await (supabase as any)
              .from("products")
              .update({ stock_count: newCount, is_available: true })
              .eq("id", product.id);
          }
        }
      }

      // Trigger product refresh across the app
      window.dispatchEvent(new CustomEvent("products-updated"));
    },
    [isEnabled]
  );

  return { processCancelledItems, isEnabled };
}
