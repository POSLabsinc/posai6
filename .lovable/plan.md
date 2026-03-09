

## Fix: C Button Not Fully Clearing Products from Order Panel

### Root Cause Analysis

After extensive code investigation, the "C" (clear) button at lines 7689 and 8951 in `Orders.tsx` only calls `setOrderItems([])`. While this clears the order items array, there are two issues:

1. **Related state is not reset**: When clearing, associated state like `selectedDiscounts`, `appliedServiceCharge`, `appliedServiceChargeName`, `appliedGiftCardAmount`, `appliedVoucherAmount`, `voucherCode`, `orderNotes`, and `guestName`/`guestPhone` are not cleared. This can leave stale UI elements visible.

2. **Potential layout overlap**: On certain viewport sizes, both the mobile order panel (`md:hidden`, line 6942) and desktop order panel (`hidden md:flex`, line 8168) could have items rendered. The mobile panel renders `null` when empty (line 7493) while the desktop panel shows an empty state icon — if both are partially visible, the user could see items from one and the empty state from the other.

### Plan

**Single file change: `src/pages/Orders.tsx`**

1. **Create a `handleClearOrder` function** that resets all order-related state:
   - `setOrderItems([])`
   - `setSelectedDiscounts([])`
   - `setAppliedServiceCharge(0)`
   - `setAppliedServiceChargeName('')`
   - `setAppliedGiftCardAmount(0)`
   - `setAppliedVoucherAmount(0)`
   - `setVoucherCode('')`
   - `setOrderNotes('')`
   - `setActiveSwipedItemId(null)`
   - `setExpandedCartItems(new Set())`

2. **Replace both C button handlers** (lines 7689 and 8951) to call `handleClearOrder()` instead of `setOrderItems([])`.

3. **Add empty state to mobile cart** (line 7493): Change `orderItems.length === 0 ? null` to show the same empty state icon and "Let's create an order" message, ensuring visual consistency between mobile and desktop when cart is empty.

This ensures tapping C fully resets the order panel to a clean empty state with no residual product cards, discounts, or notes visible.

