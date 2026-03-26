import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CancelledItem {
  name: string;
  price: number;
  quantity?: number;
  isFired?: boolean;
}

/**
 * Processes cancelled items based on an explicit write-off choice.
 *
 * writeOff = true:  Fired items are treated as waste, inventory is deducted,
 *                   and a loss record is created in the write_offs table.
 *                   Non-fired items restore stock.
 *
 * writeOff = false: All cancelled items are considered in good condition,
 *                   inventory is restored (stock_count incremented), and
 *                   no loss or expense is recorded.
 */
export function useWriteOffProcessor() {
  const processCancelledItems = useCallback(
    async (items: CancelledItem[], orderId?: string, reason?: string, writeOff: boolean = false) => {
      if (items.length === 0) return;

      // Resolve product IDs by name
      const names = [...new Set(items.map((i) => i.name))];
      const { data: products } = await (supabase as any)
        .from("products")
        .select("id, name, stock_count, inventory_tracking")
        .in("name", names);

      const productMap = new Map<string, any>();
      (products || []).forEach((p: any) => productMap.set(p.name, p));

      if (writeOff) {
        // --- Write-Off ON ---
        const firedItems = items.filter((item) => item.isFired);
        const nonFiredItems = items.filter((item) => !item.isFired);

        // Fired items: treat as waste, do NOT restore stock, record loss
        const writeOffRows: any[] = [];
        for (const item of firedItems) {
          const qty = item.quantity ?? 1;
          const product = productMap.get(item.name);

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

        // Non-fired items: still in good condition, restore stock
        for (const item of nonFiredItems) {
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
      } else {
        // --- Write-Off OFF: all cancelled items in good condition, restore stock ---
        for (const item of items) {
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
    []
  );

  return { processCancelledItems };
}
