

## Problem

In the New Order screen (`Orders.tsx`), the Discount buttons across all three layouts (mobile dropdown, tablet, desktop) always display the static label "Discount" — they never show the count of applied discounts like the Tickets module does (e.g., "Discount (2)").

The `selectedDiscounts` state array already exists and tracks applied discounts. It just needs to be reflected in the button labels.

## Plan

Update all Discount button instances in `src/pages/Orders.tsx` to show the count when discounts are applied:

### 1. Desktop sidebar button (~line 7054)
Change `Discount` to show count: `Discount {selectedDiscounts.length > 0 && \`(\${selectedDiscounts.length})\`}`
Also add active styling (matching Tickets pattern): `bg-primary/30 border-primary` when discounts are applied.

### 2. Mobile dropdown item (~line 7289)
Same count display and highlight styling when discounts are applied.

### 3. Tablet button (~line 8291)
Same count display and highlight styling.

All three locations follow the same pattern already used in Tickets.tsx (e.g., line 3398):
```
Discount {currentTicketDiscounts.length > 0 && `(${currentTicketDiscounts.length})`}
```

