

# Interconnect Tickets Between Table Order and Tickets Module

## Problem
Currently, the Table Order module and the Tickets module use **two completely separate data sources**:
- **Table Orders** read from `src/data/orders.ts` (`allOrders`) and `SessionOrderContext`
- **Tickets** read from `src/data/ticketOrders.ts` (`ticketOrders`)

These are independent static arrays. Transfers, merges, or status changes made in one module have zero visibility in the other.

## Solution: Unified Order Context

Create a single shared React context (`UnifiedOrderContext`) that holds ALL orders from both data sources as live state. Both modules will read from and write to this context, so any change (transfer, merge, status update) made in Table Orders instantly reflects in Tickets and vice versa.

```text
+---------------------+       +-------------------------+
|  ticketOrders.ts    |------>|                         |
|  (static seed data) |       |  UnifiedOrderContext    |
+---------------------+       |  (single source of      |
                              |   truth for ALL orders) |
+---------------------+       |                         |
|  orders.ts          |------>|  - combinedOrders[]     |
|  (static seed data) |       |  - updateOrder()        |
+---------------------+       |  - transferItems()      |
                              |  - getOrdersByTable()   |
+---------------------+       |  - getTicketOrders()    |
|  SessionOrders      |------>|                         |
|  (dynamic orders)   |       +-------------------------+
+---------------------+              |           |
                                     v           v
                              +-----------+ +-----------+
                              | Table     | | Tickets   |
                              | Order     | | Module    |
                              | Details   | |           |
                              +-----------+ +-----------+
```

## Implementation Steps

### 1. Create `src/contexts/UnifiedOrderContext.tsx`
- On mount, merge all orders from `ticketOrders.ts`, `orders.ts`, and `SessionOrderContext` into one deduplicated array using order ID as the key
- Normalize both data formats (`TicketOrder` and `Order`) into a single unified interface (they're nearly identical)
- Persist runtime changes to `localStorage` so they survive page navigation
- Expose methods:
  - `getAllOrders()` -- all orders regardless of type
  - `getOrdersByTable(tableId)` -- filtered for Table Order module
  - `getTicketOrders()` -- all orders for Tickets module
  - `updateOrder(id, changes)` -- update any order's status, items, etc.
  - `removeOrder(id)` -- for merged-away orders
  - `addOrder(order)` -- for new session orders

### 2. Update `src/pages/Tickets.tsx`
- Replace `useState(allOrders)` with orders from `UnifiedOrderContext`
- Remove direct import of `ticketOrders`
- All existing filter/search/merge/transfer logic stays the same, just reads from context instead of local state
- When tickets are merged or transferred, call context methods so changes propagate

### 3. Update `src/pages/TableOrderDetails.tsx`
- Replace direct `allOrders` imports with reads from `UnifiedOrderContext`
- When transfers happen (partial/full), update the context so the Tickets list reflects the transfer immediately
- Persisted transfer data (localStorage) continues to work but the context serves as the live view

### 4. Wire up in `src/App.tsx`
- Wrap the app with `UnifiedOrderProvider` (above the existing `SessionOrderProvider`, or merge them)

## What Changes for the User
- Transfer items from Table 2 to Table 3 in the Table Order module -- go to Tickets and see the updated orders immediately
- Merge tickets in the Tickets module -- go back to Table Order and the merged result is reflected
- All order types (Dine-In, Delivery, Drive Thru, Table Order, etc.) appear in both modules with consistent data

## Technical Details

### Data Deduplication Strategy
- `ticketOrders.ts` has IDs "1" through "15"
- `orders.ts` has IDs "1" through "10" 
- Some IDs overlap with different data (e.g., ID "3" is "Martin Alex" in ticketOrders but a different order in orders.ts)
- Strategy: Use `ticketOrders` as the canonical seed since it covers all order types. For table-specific orders in `orders.ts` that don't exist in `ticketOrders`, merge them in with prefixed IDs if needed
- Session orders (dynamic) always get added on top

### Interface Normalization
The `TicketOrder` and `Order` interfaces are nearly identical. The unified interface will be a superset:
- Add `orderType` variants from `TicketOrder` ("Table Order", "Take Out", "Delivery", "Drive Thru", "Phone-In", "Scheduled", "Banquet", "Curb Side", "Custom") to the `Order` type
- Include financial fields (`subtotal`, `discount`, `serviceCharge`, `tax`, `tip`, `total`) directly on unified orders

### Scope Boundaries
- This change focuses on **data interconnection** only
- No UI redesign of either module
- Existing transfer/merge UI flows remain unchanged -- they just write to the shared context instead of local state

