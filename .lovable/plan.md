

# Fix: Order Number Showing as 0 in Table Order Module

## Problem

The `TicketOrder` interface (in `src/data/ticketOrders.ts`) does not have an `orderNumber` field. When database orders are converted from `UnifiedTicketOrder` (which has `orderNumber: 74`) to `TicketOrder` via the `toTicketOrder()` function in `UnifiedOrderContext.tsx`, the `orderNumber` is dropped. The Table Order module then displays `orderNumber || 0`, which shows **0**.

The Merge screen works correctly because it reads from `useTicketOrders()` directly, which preserves `orderNumber`.

## Fix (2 files)

### 1. `src/data/ticketOrders.ts` - Add `orderNumber` to the interface

Add `orderNumber?: number;` to the `TicketOrder` interface.

### 2. `src/contexts/UnifiedOrderContext.tsx` - Map `orderNumber` in conversion

In the `toTicketOrder()` function, add:
```
orderNumber: u.orderNumber,
```

This ensures the order number flows from the database through `UnifiedTicketOrder` into the `TicketOrder` shape used by the Table Order details view.

## Result

- Table Order module will show the correct order number (e.g., 74, 75, 76) instead of 0
- Merge screen continues to work as before
- No UI changes needed, the display logic (`orderNumber || 0`) already handles rendering

