

# Fix Transfer Functionality in Tickets Module

## Problems Found

There are **three distinct bugs** in the Tickets module's transfer flow (`TicketsTransferView.tsx`):

### Bug 1: "Transfer to Order" does nothing to the data
In `executeTransferToOrder()` (line 199-240), when transferring to an **existing order**, the function only shows a toast and calls `onTransferComplete()`. It never actually:
- Removes items from the source order
- Adds items to the target order
- Updates any financial totals

The transfer is purely cosmetic -- no state changes happen.

### Bug 2: Available orders list reads from static data, not unified context
Line 196 calls `getAvailableTicketOrdersForTransfer(currentOrder.id)` which reads from the **static** `ticketOrders` array in `src/data/ticketOrders.ts`. This means:
- It doesn't reflect any prior merges or transfers
- It shows stale data

Similarly, line 233 does `ticketOrders.find(...)` to look up the target order from static data.

### Bug 3: "Transfer to Table" works but doesn't persist properly after navigation
The `executeTransfer()` function (line 300) correctly calls `setOrders()` which is wired to `updateOrders` from the unified context. However, the `onTransferComplete` callback in `Tickets.tsx` (line 1186-1189) tries to find the updated order but uses the old `orders` reference from the closure, which may be stale.

## Fix Plan

### File: `src/components/TicketsTransferView.tsx`

**Fix 1** -- Make `executeTransferToOrder()` actually move items:
- For **entire order** transfers: merge all items from source into target order, then remove the source order
- For **partial item** transfers: remove selected items from source, add them to target order, recalculate financial totals on both
- Use the `setOrders` prop (which is wired to unified context) for all mutations

**Fix 2** -- Replace static data reads with the `orders` prop:
- Change `availableTransferOrders` to filter from the `orders` prop instead of calling `getAvailableTicketOrdersForTransfer()` from static data
- Remove the `ticketOrders.find()` call on line 233 and use `orders.find()` instead

### File: `src/pages/Tickets.tsx`

**Fix 3** -- Ensure the `onTransferComplete` callback reads the latest state:
- After closing the transfer flow, re-select the updated guest from the current `orders` array to refresh the right panel

## What Will Change for the User
- Clicking "Transfer Items" or "Transfer Entire Order" to another order in the Tickets module will actually move the items and update totals
- The available orders list will reflect real-time state (including prior merges/transfers)
- After any transfer completes, the ticket list and detail panel will immediately show the updated data

