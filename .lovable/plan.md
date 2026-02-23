
# Fix: Enable Independent Modifier-Level Swipe Refund on Paid Tickets

## Problem
Modifier rows with prices (e.g., "Garlic Butter $2.00") are wrapped in a `SwipeableRefundItem` that is **nested inside** the product-level `SwipeableRefundItem`. The outer wrapper captures all touch/mouse events via `stopPropagation()`, preventing the inner modifier swipe from ever triggering. Swiping on a modifier actually swipes the entire product card.

## Solution
Restructure the rendering so that for paid tickets, modifiers are rendered **outside** the product-level `SwipeableRefundItem` wrapper. This way both product rows and modifier rows are independent swipeable elements at the same hierarchy level.

## Technical Details

### File: `src/pages/Tickets.tsx`

**Current structure (broken):**
```text
SwipeableRefundItem (product)
  +-- product card div
       +-- modifier list
            +-- SwipeableRefundItem (modifier) <-- BLOCKED by parent
```

**New structure (fixed):**
```text
<div> (wrapper group)
  SwipeableRefundItem (product - contains card WITHOUT modifiers)
  modifier list (rendered outside product swipeable)
    +-- SwipeableRefundItem (modifier) <-- NOW INDEPENDENT
    +-- plain div (non-priced modifier)
</div>
```

Changes needed in **two places** in Tickets.tsx (desktop ~line 1179-1320 and mobile/tablet ~line 1693-1840):

1. **Extract modifier rendering** from inside `productContent` when the ticket is paid
2. **Move modifier list** to render after the `SwipeableRefundItem` product wrapper
3. Keep the modifier list inside `productContent` for non-paid tickets (ordering/unpaid) since those use a different swipe component (`SwipeableTicketItem`) that doesn't need modifier-level refund

This ensures:
- Product-level swipe works for the product card
- Modifier-level swipe works independently for each priced add-on
- Non-priced modifiers (e.g., "No Onions", "Medium Rare") remain static
- Visual hierarchy is preserved (modifiers still appear indented below their product)
- No changes needed to `SwipeableRefundItem.tsx` itself
