

# Fix: Duplicate Order Tickets on Table Order Details

## Root Cause

In `TableOrderDetails.tsx` line 607-609, orders are combined from two sources:
1. **`sessionGuestOrders`** — DB orders that have a `session_id` (derived via `SessionOrderContext`)
2. **`staticGuestOrders`** — ALL DB orders for the table (from `UnifiedOrderContext`)

Orders with a `session_id` appear in **both** lists, causing duplicates. The console confirms this with the "two children with the same key" warning.

## Fix

Filter out session orders from `staticGuestOrders` so they don't appear twice. On line 389, exclude orders that have a `session_id` from the `tableOrders` list (since those are already handled by `sessionGuestOrders`).

### Change in `src/pages/TableOrderDetails.tsx`

**Line 389** — Change the `tableOrders` filter to exclude orders that have a `sessionId`:

```typescript
const tableOrders = useMemo(() => 
  allDbOrders.filter(o => o.table === (tableId || "T2") && !o.sessionId), 
  [allDbOrders, tableId]
);
```

This single-line change ensures each order appears exactly once: session orders come from `sessionGuestOrders`, and non-session (fired/persisted) orders come from `staticGuestOrders`.

