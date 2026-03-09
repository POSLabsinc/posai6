

## Problem

The ticket mock data stores `discount` as a raw number (e.g., `discount: 5.00`), with no reference to which discount definition it came from. The current code calculates `effectiveDiscount` by summing `selectedGuest.discount` (raw value) + any dialog-applied discounts, causing double-counting and making it impossible to show the correct pre-selected state in the dialog.

## Solution

Make the discount data **fully driven by `Discount` objects** rather than raw numbers. Remove dependence on the raw `selectedGuest.discount` field for tickets that have dialog-applied discounts.

### Changes

**1. `src/pages/Tickets.tsx` — Seed `ticketDiscounts` from mock data on mount**

- Add an initialization `useEffect` (or inline logic during mock data setup) that reverse-maps each ticket's raw `discount` value to a matching `Discount` object from the exported `availableDiscounts` array.
- Match by: exact amount for `type: "amount"`, or by calculating `subtotal × percentage / 100` for `type: "percentage"`.
- If no match found, create a synthetic `{ id: "custom-{ticketId}", name: "Custom Discount", type: "amount", value: rawDiscount }`.
- Populate `ticketDiscounts[ticketId]` with the matched object(s).

**2. `src/components/DiscountDialog.tsx` — Export `availableDiscounts`**

- Add `export` keyword to `const availableDiscounts` so Tickets.tsx can import and match against it.

**3. `src/pages/Tickets.tsx` — Fix `effectiveDiscount` calculation**

- Change from: `selectedGuest.discount + getAppliedDiscountAmount(...)` (double-counts)
- Change to: If `ticketDiscounts[id]` exists (seeded or user-applied), use only the dialog-driven amount. Otherwise fall back to raw `selectedGuest.discount`.
- This eliminates double-counting and ensures the dialog is the single source of truth.

**4. Result**

- Opening the discount popup on a ticket with `discount: 5.00` will show "Manager Comp $5" pre-selected.
- Totals remain correct (no double-counting).
- Removing all discounts via the dialog correctly zeros out the discount.

