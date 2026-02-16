

# Fix: Transferred Order Should Keep Original Order Number

## Problem
When fully transferring Order #1 to a new order on another table, the target table shows "Order #12" (or #13) instead of "Order #1". The virtual order generator calculates `Math.max(allOrderIds) + 1` for the new ID, but since the entire order was moved, it should keep its original identity.

## Root Cause
In `src/pages/TableOrderDetails.tsx` (lines 512-557), the `persistedTransfersForNewOrders` path always generates a new sequential order ID and check number, regardless of whether it's a full or partial transfer.

## Solution

### File: `src/pages/TableOrderDetails.tsx`

In the `persistedTransfersForNewOrders.map()` block (around lines 522-525), change the ID/check assignment to preserve the source order's ID when the transfer type is "full":

**Current logic:**
```typescript
const maxOrderId = Math.max(...allOrders.map(o => parseInt(o.id) || 0));
const newOrderId = String(maxOrderId + 1 + idx);
const maxCheck = Math.max(...allOrders.map(o => parseInt(o.check) || 0));
const newCheck = String(maxCheck + 1 + idx);
```

**Updated logic:**
```typescript
// For full transfers, preserve the original order ID; for partial, generate new
const newOrderId = transfer.transferType === 'full' 
  ? transfer.sourceOrderId 
  : String(Math.max(...allOrders.map(o => parseInt(o.id) || 0)) + 1 + idx);
const newCheck = transfer.transferType === 'full'
  ? transfer.sourceOrderId
  : String(Math.max(...allOrders.map(o => parseInt(o.check) || 0)) + 1 + idx);
```

This is a small, targeted change -- only 4 lines replaced. No other files need modification.

## Expected Result
- Transfer entire Order #1 from Table 2 to Table 3 (new order)
- Target table shows **Order #1** (not #12)
- Partial transfers still generate new sequential IDs as before

