

## Problem

When tapping "Add Product" on a ticket (e.g., Order 3) in the Tickets module, the New Order screen shows wrong data because:

1. **Wrong data source**: `handleAddProduct` passes `orderId=3` and `getOrderById` looks up from `allOrders` (orders.ts), which has **different** data than `ticketOrders.ts` for the same ID (different guest name, table, items, etc.)
2. **Discounts not transferred**: The addItem init logic doesn't restore `selectedDiscounts` or `ticketDiscounts` 
3. **Service Charge not transferred**: `appliedServiceCharge` is not set from the ticket's service charge value
4. **Tax wrong**: Because discount and service charge are missing, the tax calculation is incorrect

## Root Cause

The Tickets module uses data from `ticketOrders.ts` / `UnifiedOrderContext`, but `Orders.tsx` uses `getOrderById` from `orders.ts` — these are **completely separate data stores** with different records for the same IDs.

## Plan

### 1. Pass ticket data via localStorage instead of URL-only lookup

In `src/pages/Tickets.tsx`, update `handleAddProduct` to serialize the selected ticket's full data (including discounts and service charge) into localStorage before navigating:

```tsx
const handleAddProduct = () => {
  if (!selectedGuest) return;
  
  // Store full ticket context for the Orders screen to consume
  const ticketContext = {
    guest: selectedGuest,
    discounts: ticketDiscounts[selectedGuest.id] || [],
    serviceCharge: selectedGuest.serviceCharge,
    taxExempt: taxExemptTickets.has(selectedGuest.id),
  };
  localStorage.setItem('pos-add-product-context', JSON.stringify(ticketContext));
  
  navigate(`/orders?orderId=${selectedGuest.id}&tableId=${selectedGuest.table}&mode=addItem`);
};
```

### 2. In `src/pages/Orders.tsx`, read ticket context from localStorage

Update the `addItemMode` initialization `useEffect` (~line 6407) to:

- **Read from localStorage** (`pos-add-product-context`) instead of `getOrderById`
- Pre-populate `guestName`, `guestPhone`, `orderNotes`, `orderType` from ticket data
- Convert and set `orderItems` from ticket items
- Restore `selectedDiscounts` from the stored discount array
- Restore `appliedServiceCharge` and `appliedServiceChargeName` from ticket's service charge
- Restore `isTaxExempt` if the ticket had tax exemption
- Clean up localStorage after reading

### 3. Summary of state to sync

| Ticket Field | Orders State | Currently Synced? |
|---|---|---|
| guest.name | guestName | ❌ Wrong source |
| guest.phone | guestPhone | ❌ Wrong source |
| guest.notes | orderNotes | ❌ Wrong source |
| guest.orderType | orderType | ❌ Wrong source |
| guest.items | orderItems | ❌ Wrong source |
| ticketDiscounts[id] | selectedDiscounts | ❌ Not synced |
| guest.serviceCharge | appliedServiceCharge | ❌ Not synced |
| taxExemptTickets | isTaxExempt | ❌ Not synced |

After this change, all 8 fields will be correctly synced from the actual ticket data.

