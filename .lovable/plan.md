
# Create Order Ticket on Table Order Flow

## Overview
Implement a workflow where selecting seats for an available table creates an order ticket with "ORDERING" status visible on the TableOrderDetails page. When the user fires the order, the status changes to "ORDERED".

---

## Current Flow vs. Proposed Flow

```text
CURRENT FLOW:
Available Table → Select Seats → Navigate to /orders → Create Order (not saved)
                                                      → Fire Button (toggles item state only)
                                                      → Order never appears in TableOrderDetails

PROPOSED FLOW:
Available Table → Select Seats → Navigate to /orders with params
                              → Order ticket created with "ORDERING" status
                              → Ticket visible on TableOrderDetails page
                              → Fire Button → Status changes to "ORDERED"
                              → Order visible on both TableOrderDetails and Tickets pages
```

---

## Technical Implementation

### 1. Create State Management for Dynamic Orders
**File:** `src/data/orders.ts`

Add a mechanism to support dynamic order creation and updates:
- Create a context or use localStorage for temporary order state during the session
- Add functions to create new orders and update order status

Changes:
- Add `createNewOrder()` function that returns a new Order object with status "ORDERING"
- Add `updateOrderStatus()` function to change status (e.g., "ORDERING" → "ORDERED")
- Add `getActiveSessionOrders()` to retrieve dynamically created orders

### 2. Update TableOrder Navigation with Order Creation
**File:** `src/pages/TableOrder.tsx`

Modify `handleGuestSelect` (around line 1582-1587):
- Before navigating, create a new order entry for the selected table
- Store the order in session/localStorage with:
  - Table ID
  - Party size (guest count)
  - Status: "ORDERING"
  - Server: Current user
  - Time: Current timestamp
  - Empty items array initially

### 3. Update Orders Page to Sync with Created Order
**File:** `src/pages/Orders.tsx`

Modify the Orders component:
- When navigating from TableOrder, retrieve the created order
- Update the order in real-time as items are added
- When "FIRE" button is clicked:
  - Change order status from "ORDERING" to "ORDERED"
  - Navigate back to TableOrderDetails or stay on page

Add `handleFireOrder` function (around line 8609-8620):
- Collect all items with `isFired: true` state
- Update the order status to "ORDERED"
- Show success toast notification
- Optionally navigate to TableOrderDetails

### 4. Update TableOrderDetails to Show Dynamic Orders
**File:** `src/pages/TableOrderDetails.tsx`

Modify order retrieval (around line 266):
- Merge static `allOrders` with dynamically created session orders
- Ensure new orders with "ORDERING" status are displayed
- Show appropriate status colors and badges

### 5. Create Session Order Context
**File:** `src/contexts/SessionOrderContext.tsx` (new file)

Create a React context to manage session orders:
```
SessionOrderContext
├── activeOrders: Order[]
├── createOrder(tableId, guestCount, serverName): Order
├── updateOrderItems(orderId, items): void
├── fireOrder(orderId): void  // Changes status to ORDERED
└── getOrdersByTable(tableId): Order[]
```

### 6. Update Table Status in TableOrder
**File:** `src/pages/TableOrder.tsx`

When an order is created:
- Update the table status from "Available" to "Ordering"
- This can be done via localStorage or the new context

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/SessionOrderContext.tsx` | New file - Session order state management |
| `src/data/orders.ts` | Add helper functions for order creation |
| `src/pages/TableOrder.tsx` | Create order on seat selection, update table status |
| `src/pages/Orders.tsx` | Connect to session orders, implement fire order logic |
| `src/pages/TableOrderDetails.tsx` | Merge session orders with static data |
| `src/App.tsx` | Wrap with SessionOrderProvider |

---

## Order Status Flow

```text
ORDERING → (Fire) → ORDERED → (Prepare) → PREPARING → (Ready) → READY → (Pay) → PAID
```

For this implementation, we focus on:
- **ORDERING**: When order is first created (guest is adding items)
- **ORDERED**: When order is fired (sent to kitchen)

---

## Key Implementation Details

### Order Creation Structure
```typescript
{
  id: "session-" + timestamp,
  name: guestName || "Guest",
  phone: "",
  partySize: guestCount,
  time: currentTime,
  timer: "00:00",
  server: currentServerName,
  check: "--",
  paymentType: "--",
  revenueCenter: "Main",
  status: "ORDERING",
  notes: "",
  table: tableId,
  orderType: "Dine-In",
  items: []
}
```

### Fire Order Logic
1. Collect all cart items
2. Update order status to "ORDERED"
3. Set check number
4. Show success notification: "Order fired to kitchen"
5. Optionally redirect to TableOrderDetails

---

## User Experience

1. **User clicks available table** → Seat selection appears
2. **User selects number of guests** → Navigates to Orders page
3. **Table shows "Ordering" status** → Order card appears in TableOrderDetails with "ORDERING" badge
4. **User adds items** → Items sync to the order in real-time
5. **User clicks FIRE button** → 
   - Status changes to "ORDERED"
   - Toast shows "Order sent to kitchen!"
   - Table status updates to "Ordered"
6. **TableOrderDetails shows updated order** → With "ORDERED" status badge
