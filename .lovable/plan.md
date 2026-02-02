
# Fix Split Check Display in TableOrderDetails

## Problem Identified
When splitting an order from TableOrderDetails, the split check sub-tickets are not appearing under the main order ticket. The root cause is an indexing mismatch in the `onSaveSplit` handler.

---

## Root Cause Analysis

The PaymentDialog's `checkAssignments` structure:
- **Keys**: `item.id` (1-indexed, since items are created with `id: index + 1`)
- **Values**: `checkNumber` (1-indexed, 1 = first check, 2 = second check, etc.)

The `onSaveSplit` handler in TableOrderDetails uses:
```typescript
const itemsForCheck = orderItems.filter((_, itemIdx) => 
  config.checkAssignments[itemIdx] === i
);
```

Problems:
1. `itemIdx` is 0-indexed, but `checkAssignments` keys are 1-indexed (`item.id`)
2. `i` is 0-indexed (loop counter), but `checkAssignments` values are 1-indexed (check numbers)

**Result**: No items match, so all split checks have empty item arrays and $0 totals.

---

## Solution

Update the `onSaveSplit` handler in TableOrderDetails.tsx to use correct indexing:

```typescript
// Current (BROKEN):
const itemsForCheck = orderItems.filter((_, itemIdx) => 
  config.checkAssignments[itemIdx] === i
);

// Fixed:
const itemsForCheck = orderItems.filter((_, itemIdx) => 
  config.checkAssignments[itemIdx + 1] === i + 1
);
```

This change:
- Uses `itemIdx + 1` to match 1-indexed item IDs in checkAssignments keys
- Compares against `i + 1` to match 1-indexed check numbers in checkAssignments values

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/TableOrderDetails.tsx` | Fix indexing in onSaveSplit handler (line ~2535-2536) |
| `src/pages/Orders.tsx` | Same fix needed (line ~9080-9081) - same bug exists there |

---

## Code Changes

### TableOrderDetails.tsx (lines 2535-2536)
```typescript
// Before:
const itemsForCheck = orderItems.filter((_, itemIdx) => 
  config.checkAssignments[itemIdx] === i
);

// After:
const itemsForCheck = orderItems.filter((_, itemIdx) => 
  config.checkAssignments[itemIdx + 1] === i + 1
);
```

### Orders.tsx (lines 9080-9081)
```typescript
// Before:
const itemsForCheck = orderItems.filter((_, itemIdx) => 
  config.checkAssignments[itemIdx] === i
);

// After:
const itemsForCheck = orderItems.filter((_, itemIdx) => 
  config.checkAssignments[itemIdx + 1] === i + 1
);
```

---

## Expected Result
After this fix:
1. User splits an order from TableOrderDetails → clicks Save
2. Split configuration is correctly saved with items assigned to each check
3. Sub-ticket cards appear immediately below the main order card
4. Each sub-ticket shows the correct items and calculated total for that check
