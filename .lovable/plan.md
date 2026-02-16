

# Fix "Transfer to Table" in Tickets Module -- Show Active Orders and New Order Option

## Problem

When transferring items from Order 6 (Table 7) to Table 2 in the Tickets module, the user sees a plain confirmation alert ("Transfer Items? Are you sure...") instead of the proper ticket selection dialog that shows:
- Active orders on the target table
- A "Transfer to New Order" option

This happens because `handleConfirmTableTransfer()` in `TicketsTransferView.tsx` (line 352-363) has two branches:
- If the target table has active orders: shows the ticket selection dialog (correct behavior)
- If the target table has NO active orders: shows a simple AlertDialog confirmation (wrong behavior)

The Table Order module (`TransferOrders.tsx`) handles this correctly by always showing the ticket selection dialog with a "Create New Order" option, and by persisting transfer data to localStorage so the target table picks it up.

## Root Cause

The `getOrdersByTable("T2")` call filters the unified `orders` array for orders with `table === "T2"`. If no matching orders are found (due to data gaps or table ID mismatches), it falls into the `else` branch and shows the basic confirmation alert, which skips the active-orders listing and the "Create New Order" option entirely.

## Fix Plan

### File: `src/components/TicketsTransferView.tsx`

**Change 1** -- Always show the ticket selection dialog when confirming a table transfer, regardless of whether the target table has active orders. The ticket selection dialog already includes the "Transfer to New Order" button, so it works for both cases (occupied and available tables).

Update `handleConfirmTableTransfer()` from:
```
if (targetTableOrders.length > 0) {
  setShowTicketSelection(true);      // occupied table
} else {
  setShowTableConfirmDialog(true);   // available table (plain alert)
}
```
To:
```
// Always show ticket selection -- it includes both
// active orders (if any) and "Transfer to New Order"
setShowTicketSelection(true);
setSelectedTicketOrderId(null);
```

**Change 2** -- Add localStorage persistence (matching the Table Order module's `persistTransferData` pattern) so that after a transfer, the target table's detail view picks up the transferred items.

Add a `persistTransferData` helper function that:
- Writes transfer records to `localStorage` key `pos-table-transfers`
- Clears any prior transfer from the same source order (prevents duplicates)
- Dispatches `pos-transfer-updated` event for cross-module sync
- Sets `pos-transfer-just-happened` in sessionStorage

Call this from `executeTransfer()` before updating in-memory state, so both the unified context AND localStorage reflect the transfer.

**Change 3** -- In `executeTransfer()`, for full transfers to an available table (no existing ticket selected), persist the transfer and handle it the same way as Table Order: move the order to the new table rather than just showing a toast.

## What Changes for the User
- Selecting any target table (occupied or available) now shows the ticket selection dialog with active orders (if any) and a "Transfer to New Order" option
- Transfer data persists to localStorage, so navigating to the target table in Table Order shows the transferred items with the blue-shaded styling and info banner
- The plain confirmation alert is removed from the table transfer flow (it was the wrong UX)

