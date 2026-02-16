
# Fix: Full Transfer to Existing Order Creating New Orders

## Problem
When fully transferring an order to a table that already has orders (e.g., Table 3 with Order #6), the system creates new virtual orders (12, 13) instead of merging into the existing Order #6. This happens because `executeTableTransfer()` in `TransferOrders.tsx` never sets `targetOrderId` in the persisted data.

## Root Cause
Two separate code paths handle transfers:
- `executeTransferToTicket()` -- correctly sets `targetOrderId`
- `executeTableTransfer()` -- does NOT set `targetOrderId`

On the target table, transfers without `targetOrderId` are treated as "new orders" and generate virtual entries.

## Solution

### File: `src/pages/TransferOrders.tsx`

1. Update `executeTableTransfer()` to detect if the target table already has existing orders
2. If the target table has exactly one active (unpaid) order, automatically set `targetOrderId` to that order's ID
3. If the target table has multiple active orders, set `targetOrderId` to the first active order (since the user already confirmed the table selection)
4. Only omit `targetOrderId` when the target table is truly available (no existing orders)

```text
executeTableTransfer() {
  ...
  // Look up existing orders on the target table
  const targetTableOrders = allOrders.filter(o => o.table === selectedTargetTable && o.status !== 'Paid');
  
  persistTransferData(selectedTargetTable, {
    ...existing fields...,
    // If target table has existing orders, merge into the first one
    targetOrderId: targetTableOrders.length > 0 ? targetTableOrders[0].id : undefined,
  });
}
```

### File: `src/pages/TableOrderDetails.tsx`

No changes needed -- the existing logic at lines 417-452 already correctly handles transfers with `targetOrderId` by merging them into the matching static order and recalculating totals.

## Technical Details

- The `persistedTransfersForExistingOrders` filter (line 362) already separates transfers with `targetOrderId` from those without
- The merge logic (lines 417-452) already attaches transferred items, sets `_persistedTransferType`, and recalculates combined totals
- The banner rendering already checks for `_persistedTransferType` to show "Order fully transferred from Table X . Order #Y"

## Expected Result
- Transfer Order 1 from Table 2 to Table 3 (which has Order 6)
- Source table shows: "Fully Transferred to Table 3 (Patio) . Order #6"
- Target table (Table 3) shows Order 6 with:
  - Blue banner: "Order fully transferred from Table 2 . Order #1"
  - Transferred items in blue shade below order notes
  - Original Order 6 items below
  - Updated Subtotal, Tax, Service Charge, Total reflecting all items
- No new orders (12, 13) are created
