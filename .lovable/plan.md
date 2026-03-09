

## Fix: Clear Button Not Exiting Voucher Mode

### Root Cause

When the user taps "C" (clear) while in the Sell Voucher flow, `handleClearOrder` resets `orderItems` and other state but does **not** exit voucher mode. This leaves:
- The order panel cleared (showing "Let's create an order" empty state)
- But `voucherMode` remains `true`, so the `SellVoucherScreen` and its voucher product cards stay visible in the menu area
- The user sees a confusing split state: voucher products still displayed alongside an empty order panel

### Fix (single file: `src/pages/Orders.tsx`)

Add `setVoucherMode(false)` and `setEditingVoucherData(null)` to the `handleClearOrder` function (around line 6340). This ensures tapping C fully resets the screen back to the normal menu view when clearing during voucher selling.

```typescript
const handleClearOrder = () => {
  setOrderItems([]);
  setSelectedDiscounts([]);
  setAppliedServiceCharge(0);
  setAppliedServiceChargeName('');
  setAppliedGiftCardAmount(0);
  setAppliedVoucherAmount(0);
  setVoucherCode('');
  setOrderNotes('');
  setGuestName('');
  setGuestPhone('');
  setActiveSwipedItemId(null);
  setExpandedCartItems(new Set());
  setVoucherMode(false);          // ← exit voucher selling mode
  setEditingVoucherData(null);    // ← clear any voucher edit state
};
```

