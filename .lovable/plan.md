

## Problem

The Orders screen uses a **hardcoded tax rate of 2%** (`const taxRate = 0.02` on line 6977), while the Tickets module derives its tax rate from `orderUtils.ts` which defines it as **7.35%** (`TAX_RATE = 0.0735`). When ticket data is transferred via "Add Product", the tax gets recalculated at the wrong rate.

## Fix

In `src/pages/Orders.tsx`, replace the hardcoded `0.02` tax rate with the centralized `TAX_RATE` constant from `orderUtils.ts`.

**Line 6977:**
```tsx
// Before
const taxRate = 0.02;

// After
const taxRate = TAX_RATE;
```

Also ensure `TAX_RATE` is imported from `@/lib/orderUtils` (check if it's already imported).

This is a one-line fix that aligns tax calculations across both modules.

