

## Plan: Fix Dashboard Discount - Add MPIN Gate and Per-Order Tracking

### Problems
1. Dashboard discount button opens the discount dialog directly without requiring Manager PIN authorization (unlike Tickets screen which uses `AccessRestrictedModal`)
2. A single shared `selectedDiscountId` state is used across all orders, so applying a discount affects every order on the dashboard

### Changes

#### 1. Add MPIN gate state and import `AccessRestrictedModal` (`src/pages/Dashboard.tsx`)
- Add `showDiscountMpin` state variable
- Import `AccessRestrictedModal` component
- Change discount button click handler to set `showDiscountMpin = true` instead of directly opening the discount dialog
- Render `AccessRestrictedModal` with subtitle "Manager approval required to apply discount." - on success, close MPIN and open discount dialog (same pattern as Tickets)

#### 2. Change discount tracking from single value to per-order map (`src/pages/Dashboard.tsx`)
- Replace `selectedDiscountId: string | null` with `orderDiscountMap: Record<string, string | null>` keyed by order ID (using `dbId` or order `id`)
- When selecting a discount, store it under the currently selected order's key
- When reading discount for display/calculation, look up from the map using the selected order's key
- Update the `OrderPanel` props to pass the correct per-order discount ID
- Update `OrderPanel` component interface to receive the order-specific discount

### Technical Details
- The `OrderPanel` component (defined inline in Dashboard.tsx) currently receives `selectedDiscountId` and `setSelectedDiscountId` as props
- Will change these to derive from the per-order map based on the currently selected order
- The MPIN modal rendering follows the exact same pattern as Tickets.tsx lines 6159-6170
- `AccessRestrictedModal` is already available at `@/components/AccessRestrictedModal`

