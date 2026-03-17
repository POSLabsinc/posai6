

## Problem

The `DiscountDialog` fetches discounts from the database via `fetchDiscountsFromDB()`. Since the database returns results, the fallback list (which contains the "Birthday Special" 100% discount) is never used. The database has no 100% discount entry, so it's missing from the popup — along with its reason-selection UI.

## Solution

Ensure a **100% Comp (Full Comp)** discount is always present in the discount list, regardless of what comes from the database. This can be done by:

1. **In `fetchDiscountsFromDB()`** — After fetching from DB, check if any returned discount has `value === 100 && type === "percentage"`. If not, append a hardcoded "Full Comp" (100%) discount to the list.

2. **Same logic in `getDiscountsFromSettings()`** — Apply the same safety net when reading from localStorage.

This ensures the 100% discount option and its associated reason-selection UI (AI suggested chips, quick reasons, comment field) are always available.

## Files to Edit

- **`src/components/DiscountDialog.tsx`**
  - Add a constant for the default 100% comp discount
  - In `fetchDiscountsFromDB()`: after mapping DB results, append the 100% comp if none exists in the list
  - In `getDiscountsFromSettings()`: same append logic

