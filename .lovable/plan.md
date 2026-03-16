

# Fix MergeOrders Page — Replace Hardcoded Data with Database Records

## Problem
The `MergeOrders.tsx` page is entirely hardcoded. It imports `allOrders` from `src/data/orders.ts` (static mock data) instead of reading from the database. This means:
- The order list shows fake static orders, not real DB orders
- Selecting and confirming a merge operates on stale/wrong data
- The merge confirmation just navigates with query params — no actual DB merge happens

## What Needs to Change

### 1. Replace static imports with DB hooks
- Remove: `import { Order, allOrders, getOrderById, calculateOrderTotals, getOrderAmount, toOrderTemplateData } from "@/data/orders"`
- Add: `useUnifiedOrders()` from `UnifiedOrderContext` (already used by TransferOrders and TableOrderDetails)
- Use `orders` from the context as the data source instead of `allOrders`

### 2. Adapt order shape references
The static `Order` type uses `id` as short strings like `"1"`, `"2"`. DB orders use UUIDs. The component displays `order.id` in the order number box — this needs to use `order.orderNumber` (sequential number) instead, and fall back gracefully.

Key field mappings (already handled by `UnifiedOrderContext.toTicketOrder`):
- `id` → UUID string
- `orderNumber` → sequential display number
- `table` → `"T2"` format (same)
- `items`, `status`, `name`, `server`, etc. → same field names

### 3. Wire up the actual merge operation on confirm
Currently `handleFinalConfirm` just navigates with query params. The merge should:
- Move all items from the source order into the destination order (via `updateOrderItems`)
- Mark the source order with `merged_from` metadata or delete it
- Update the destination order's `merged_from` column with source info
- Then navigate back to the table view

### 4. Update helper functions
- Replace `getOrderAmount(order)` with inline total calculation using `calculateOrderTotals` from `orderUtils`
- Replace `toOrderTemplateData(order)` calls with equivalent using DB order fields
- Replace `calculateOrderTotals(order.items, order.tipAmount || 0)` with the shared utility

## Implementation Steps

1. **Update imports** — Swap `src/data/orders` imports for `useUnifiedOrders` + `useTicketOrders` hooks and shared utilities from `orderUtils`

2. **Replace `allOrders` references** — Use `orders` from `useUnifiedOrders()` throughout the component (~15 references)

3. **Fix order display fields** — Use `orderNumber` for display, UUID `id` for logic. Update `OrderCard`, `DesktopCurrentOrderCard`, `DesktopOrderListCard` components

4. **Implement real merge logic in `handleFinalConfirm`**:
   - Combine items from source into destination order via `updateOrderItems`
   - Save `merged_from` metadata on destination order via `updateOrder`
   - Delete or mark source order
   - Navigate back to table view

5. **Fix `getOrderAmount`** — Use `formatPrice(order.total)` or recalculate from items using shared utility

6. **Fix `toOrderTemplateData`** — Map DB order fields to the template format inline or create a local adapter

This is a single-file change to `src/pages/MergeOrders.tsx` with no schema modifications needed (the `merged_from` column already exists on `ticket_orders`).

