
# Show Shared Item Icon for Table Orders

## Problem
Items in the order data that don't have specific seat assignments (`seats: []`) are meant to be shared among all guests at the table. However, in `TableOrderDetails`, these items don't display any seat indicator - they should show the chair icon with the Share2 icon to indicate they're shared across all seats.

Additionally, the current condition checks if `seats.length === 4` (hardcoded) instead of comparing against the actual party size.

## Solution Overview
1. Update the seat display logic in TableOrderDetails to show the share icon for items that are shared (`seats.length === 0` or `isShared: true`)
2. Compare seat count against the order's actual party size, not a hardcoded value
3. Update the mock data in `orders.ts` to mark all items with empty `seats: []` as `isShared: true`

---

## Implementation Steps

### Step 1: Update Mock Data in orders.ts

Add `isShared: true` to all items that have empty seats arrays but are missing the flag. Several items already have this flag, but some are missing it:

**Order 2 (Mike Wheelers):**
- `Glass of Red Wine` - seats: [], needs `isShared: true`
- `Chocolate Lava Cake` - seats: [], needs `isShared: true`

**Order 3 (Sarah Johnson):**
- `Caprese Salad` - seats: [], needs `isShared: true`
- `Tiramisu` - seats: [], needs `isShared: true`
- `Espresso` - seats: [], needs `isShared: true`

**Order 4 (David Chen):**
- `Bottle of Champagne` - seats: [], needs `isShared: true`
- `Cheesecake` - seats: [], needs `isShared: true`

**Order 5 (Guest):**
- `Craft IPA` - seats: [], needs `isShared: true`

**Order 9 (Robert Taylor):**
- All items have seats: [] (takeout), add `isShared: true` to all

**Order 10 (Amanda White):**
- `Sparkling Water` - seats: [], needs `isShared: true`
- `Crème Brûlée` - seats: [], needs `isShared: true`

**Order 1 (Martin Alex):**
- `Almond Crusted Salmon` - seats: [], needs `isShared: true`

### Step 2: Update TableOrderDetails Seat Display Logic

Change the seat assignment display in the order items (desktop view) from:

```text
{item.seats.length > 0 && (
  <div className="mt-1.5 flex items-center gap-1.5">
    <img src={chairWhiteIcon} ... />
    {item.seats.length === 4 ? (
      <Share2 icon />
    ) : (
      item.seats.map(...)
    )}
  </div>
)}
```

To:

```text
{/* Show seat indicator for items with seats OR shared items */}
<div className="mt-1.5 flex items-center gap-1.5">
  <img src={chairWhiteIcon} ... />
  {item.isShared || item.seats.length === 0 || item.seats.length === currentSelectedGuest.partySize ? (
    <span className="w-5 h-5 rounded bg-neutral-700 text-white flex items-center justify-center">
      <Share2 className="w-3 h-3" />
    </span>
  ) : (
    item.seats.map(seat => ...)
  )}
</div>
```

This ensures:
- Items with `isShared: true` show the share icon
- Items with empty `seats: []` show the share icon (fallback)
- Items assigned to ALL seats (seats.length === partySize) show the share icon
- Items with specific seat assignments show individual seat numbers

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/data/orders.ts` | Add `isShared: true` to ~15 items with empty seats arrays |
| `src/pages/TableOrderDetails.tsx` | Update seat display logic to show share icon for shared items |

### Visual Result

**Before:**
- Shared items show no seat indicator at all

**After:**
- Shared items show: 🪑 + [Share icon] (indicating shared with all guests)
- Seat-specific items show: 🪑 + [1] [2] (individual seat numbers)

---

## Example Display

For Order 1 (Martin Alex, Party of 4):

| Item | Seats Data | Display |
|------|------------|---------|
| Classic Crispy Burger | seats: [1, 2] | 🪑 1 2 |
| Meatballs | seats: [], isShared: true | 🪑 ⤨ (share icon) |
| Rigatoni Pasta | seats: [3, 4] | 🪑 3 4 |
| Almond Crusted Salmon | seats: [], isShared: true | 🪑 ⤨ (share icon) |

---

## Testing Checklist
- Items with `isShared: true` show share icon
- Items with empty seats array show share icon
- Items assigned to specific seats show seat numbers
- Items assigned to ALL seats show share icon
- Party size comparison works correctly (not hardcoded to 4)
- Display is consistent between mobile and desktop views
