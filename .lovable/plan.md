

# Add Order for Table T8 with Ready Status

## Objective
Add a new order entry to the centralized orders database (`src/data/orders.ts`) for table T8 with status "READY" to demonstrate the Kitchen Display System (KDS) ready notification feature.

---

## New Order Details

| Field | Value |
|-------|-------|
| **ID** | 11 |
| **Guest Name** | James Rodriguez |
| **Phone** | (415) 555-7890 |
| **Party Size** | 4 |
| **Time** | 7:25 PM |
| **Timer** | 0:50 Hrs |
| **Server** | Mia Jones |
| **Check** | 123500 |
| **Revenue Center** | Main Dining |
| **Status** | READY |
| **Table** | T8 |
| **Order Type** | Dine-In |
| **Notes** | Food ready for delivery - KDS marked complete |

---

## Order Items

```text
+-----+---------------------------+--------+-------+------------------+
| Qty | Item                      | Price  | Seats | Modifiers        |
+-----+---------------------------+--------+-------+------------------+
| 2   | Herb Crusted Salmon       | $26.00 | 1, 2  | Lemon Butter     |
| 1   | Grilled Ribeye Steak      | $34.00 | 3     | Medium, Mushrooms|
| 1   | Chicken Marsala           | $22.00 | 4     | Extra Sauce      |
| 1   | Garlic Mashed Potatoes    | $8.00  | -     | (Shared)         |
| 1   | Sauteed Vegetables        | $7.00  | -     | (Shared)         |
| 4   | House Lemonade            | $4.00  | -     | (Shared)         |
+-----+---------------------------+--------+-------+------------------+
```

---

## Implementation

### Step 1: Add New Order to allOrders Array

**File:** `src/data/orders.ts` (after line 350, before the closing bracket)

Add the following order entry:

```typescript
// Order 11 - James Rodriguez (T8) - READY - Dine-In (KDS marked ready)
{
  id: "11",
  name: "James Rodriguez",
  phone: "(415) 555-7890",
  partySize: 4,
  time: "7:25 PM",
  timer: "0:50 Hrs",
  server: "Mia Jones",
  check: "123500",
  paymentType: "--",
  revenueCenter: "Main Dining",
  status: "READY",
  notes: "Food ready for delivery - KDS marked complete",
  table: "T8",
  orderType: "Dine-In",
  paidAmount: "$0.00",
  paymentStatus: "Un Paid",
  tipAmount: 20.00,
  items: [
    { qty: 2, name: "Herb Crusted Salmon", price: 26.00, seats: [1, 2], modifiers: ["Lemon Butter"] },
    { qty: 1, name: "Grilled Ribeye Steak", price: 34.00, seats: [3], modifiers: ["Medium", "Mushroom Sauce"] },
    { qty: 1, name: "Chicken Marsala", price: 22.00, seats: [4], modifiers: ["Extra Sauce"] },
    { qty: 1, name: "Garlic Mashed Potatoes", price: 8.00, seats: [], modifiers: [], isShared: true },
    { qty: 1, name: "Sauteed Vegetables", price: 7.00, seats: [], modifiers: [], isShared: true },
    { qty: 4, name: "House Lemonade", price: 4.00, seats: [], modifiers: [], isShared: true }
  ]
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/data/orders.ts` | Add Order #11 for table T8 with status "READY" |

---

## Result

After this change:
- Table T8 will have an active order with "READY" status
- The floorplan will display the emerald green pulsing glow effect
- The expanding ring animation will be visible
- The "ORDER READY" bell notification badge will bounce above T8
- This simulates a real KDS workflow where kitchen marks an order as ready for delivery

---

## Testing Checklist

- Navigate to `/tableorder` page
- Verify table T8 shows "Ready" status with all visual effects
- Click on T8 to view the order details
- Verify all 6 items are displayed correctly with modifiers
- Confirm the order total calculates correctly

