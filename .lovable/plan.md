

## Fix: Order Panel Not Clearing When Tapping C

### Root Cause Analysis

After thorough investigation, the issue is that **both the mobile and desktop order panels are rendering simultaneously** at the user's viewport width. The parent layout uses `flex-col md:flex-row`, and:

- **Mobile panel** (line 6959): `md:hidden` — renders cart items when `orderItems.length > 0`, shows `null` when empty
- **Desktop panel** (line 8185): `hidden md:flex` — has a ternary showing either items or the "Let's create an order" empty state

At certain viewport sizes near the `md` breakpoint (768px), or due to the iframe preview sizing, both panels can become visible. When C is pressed:
- `orderItems` is cleared to `[]`
- The mobile panel renders `null` (invisible, but its container remains)
- The desktop panel renders the empty state icon

But the screenshot shows items AND the empty state simultaneously, suggesting the clear function may not be fully executing, or there's a stale render issue where items persist visually despite state change.

### Fix Plan (single file: `src/pages/Orders.tsx`)

1. **Add a debug log to `handleClearOrder`** to confirm it fires — temporarily, to verify the function is called on tap.

2. **Force re-render safety**: Use a functional state update `setOrderItems(() => [])` instead of `setOrderItems([])` to ensure no stale closure issues.

3. **Add empty state to mobile panel**: Change line 7510 from `orderItems.length === 0 ? null : <ScrollArea>` to show the same empty state icon as desktop, preventing a blank area that could cause visual confusion.

4. **Clear guest-specific form data**: Also reset `setDeliveryGuestData`, `setBanquetGuestData`, `setDriveThruGuestData`, `setCurbSideGuestData`, `setScheduledGuestData`, `setPhoneInGuestData`, `setCustomOrderGuestData` so that the guest info banners (like "MIA JONE") also clear properly.

5. **Reset order type state**: Reset `isOrderPanelExpanded` to prevent layout artifacts after clearing.

These changes ensure that regardless of which panel is visible, tapping C produces a clean, complete reset with proper visual feedback.

