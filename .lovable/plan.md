
## Goal
Fix the PaymentDialog so its buttons work reliably when the payment screen is opened from the Dashboard page (especially on mobile).

## What’s happening (root cause)
On **mobile**, the Dashboard uses a **Vaul Drawer** (`<Drawer ...>`) for the order panel. Vaul/Drawer behavior typically *blocks pointer events to everything outside the drawer* while it’s open (to prevent clicking the background).

Right now, when you tap **CHARGE** inside the Dashboard drawer, you open `PaymentDialog` but the **drawer often remains open**. Since `PaymentDialog` is rendered outside the drawer, the drawer’s “background interaction lock” can make the PaymentDialog *look open* but **its buttons won’t receive taps/clicks**.

This explains why the same PaymentDialog works fine from other pages, but not from Dashboard (where Drawer is involved).

## Implementation approach (minimal + robust)
### A) Dashboard: close the drawer before opening PaymentDialog
**File:** `src/pages/Dashboard.tsx`

1. Create a single handler like `openPaymentFromDashboard()` that:
   - Closes the mobile drawer (`setIsDrawerOpen(false)`) if it’s open / if on mobile
   - Optionally closes any Dashboard overlays that might also be open (discount dialog, etc.)
   - Then opens the PaymentDialog (`setShowPaymentDialog(true)`)

2. Add a tiny delay (one of these) to avoid race conditions during Drawer closing animation:
   - `requestAnimationFrame(() => setShowPaymentDialog(true))`, or
   - `setTimeout(() => setShowPaymentDialog(true), 50-150)`

3. Replace both occurrences of:
   - `onChargeClick={() => setShowPaymentDialog(true)}`
   with:
   - `onChargeClick={openPaymentFromDashboard}`

This ensures PaymentDialog always opens in a “clickable state”.

### B) Optional defensive improvement (if needed)
If there are still edge cases, we can additionally ensure the PaymentDialog is rendered at the top level (portal), but in most cases **closing the drawer first** will solve it cleanly with minimal risk.

## Files to change
- `src/pages/Dashboard.tsx`
  - Add `openPaymentFromDashboard` helper
  - Use it in both the desktop order panel and the mobile drawer order panel (`OrderPanelContent` props)

## Testing checklist (must do)
1. Desktop:
   - Dashboard → select an order → CHARGE → verify all payment method buttons and keypad work.
2. Mobile:
   - Dashboard → tap an order (drawer opens) → CHARGE → verify PaymentDialog buttons work.
   - Confirm the drawer is closed (or no longer blocks interaction) once payment opens.
3. Regression:
   - Orders page → open payment → verify still works.
   - TableOrderDetails → open payment → verify still works.

## Notes / constraints
- We will keep scrollbars hidden (project requirement). If the PaymentDialog becomes scrollable in some mobile flows, we’ll ensure `scrollbar-hide` stays applied where needed.
