# Database-Connected Orders System - Migration Complete

## What Was Done

### Phase 1: Database Tables ✅
- Created `ticket_orders` table with all fields (name, phone, party_size, status, table_id, financials, transfer_info, split_configuration, etc.)
- Created `ticket_order_items` table with FK to ticket_orders (qty, name, price, seats, modifiers, is_shared, is_fired, no_tax)
- Added indexes on table_id, status, session_id, order_id
- Added updated_at trigger
- Enabled RLS with public access policies
- Enabled Realtime on both tables

### Phase 2: Seed Data ✅
- Inserted all 15 ticket orders from `ticketOrders.ts` with deterministic UUIDs
- Inserted 8 unique orders from `orders.ts` (different tables/guests)
- Inserted all line items for all 23 orders into `ticket_order_items`
- Set multi-payment data for David Chen order

### Phase 3: `useTicketOrders` Hook ✅
- Created `src/hooks/use-ticket-orders.ts`
- React Query-based with realtime subscription
- Fetches `ticket_orders` + `ticket_order_items` and joins them
- Provides CRUD: addOrder, updateOrder, updateOrderItems, removeOrder
- Helpers: getOrdersByTable, getOrderById, getOrdersByStatus
- Converts DB rows to `UnifiedTicketOrder` shape compatible with all consumers

### Phase 4: `UnifiedOrderContext` Refactored ✅
- Removed localStorage (`pos-unified-orders`) dependency
- Now delegates all reads/writes to `useTicketOrders` hook
- Maintains same API surface for backward compatibility
- Transfer sync is now a no-op (handled via direct DB mutations)

### Phase 5: `SessionOrderContext` Refactored ✅
- Removed localStorage (`pos-session-orders`) dependency
- `createOrder()` inserts into `ticket_orders` with `session_id`
- `updateOrderItems()` writes to `ticket_order_items`
- Split configurations stored in `split_configuration` jsonb column
- KDS queue still uses localStorage (browser-local by design)

### Phase 6: Tickets.tsx Updated ✅
- Removed 275-line hardcoded `allOrders` array
- Now fetches from DB via `useTicketOrders` hook
- Auto-selects first order when data loads
- Transfer helpers derived from live DB data

### Phase 7: TableOrderDetails.tsx Fully DB-Connected ✅
- Replaced static `getOrdersByTable()` / `allOrders` from `src/data/orders.ts` with `useUnifiedOrders()` DB context
- All order fields (name, server, status, party size, time, total, tip, revenue center, payment status, items) now come from `ticket_orders` DB table
- Replaced `getAvailableTicketOrdersForTransfer()` / `ticketOrders.find()` with `useTicketOrders()` DB hook
- Replaced hardcoded `discountTypes` array with live fetch from `discounts` DB table (with fallback defaults)
- Merged panel data (`getMergedPanelData`) now uses DB orders
- Transfer-to-order dialog uses DB-backed order list

### Phase 8: Restaurant Tables DB-Backed (Floor Plan) ✅
- Created `restaurant_tables` table (table_number, seats, shape, status, x, y, guests, occupied_seats, time, merge fields, floor_area, sort_order, merchant_id)
- Created `floor_areas` table (name, color, bg_color, x, y, anchor, sort_order)
- Created `floor_dividers` table (orientation, position)
- Seeded 12 default tables, 4 floor areas, 2 dividers
- Enabled Realtime on `restaurant_tables`
- Created `src/hooks/use-restaurant-tables.ts` hook with CRUD mutations and realtime sync
- Refactored `TableOrder.tsx`: removed hardcoded `defaultTables`, `defaultFloorAreas`, `defaultDividers`, `loadSavedPositions`, `loadSavedFloorAreas`, `loadSavedDividers`; now initializes from DB with local state for fast drag interactions; guest seating and seat changes persist to DB
- Refactored `Dashboard.tsx`: replaced `mockTables` with `useRestaurantTables` hook
- Refactored `TransferOrders.tsx`: replaced `defaultTables` with `useRestaurantTables` hook

### Data Flow Summary (Updated)
```
restaurant_tables (DB) ──── useRestaurantTables hook
floor_areas (DB) ───────┘        │
floor_dividers (DB) ────┘        ├── TableOrder.tsx (floor plan, all views)
                                 ├── Dashboard.tsx (table cards)
                                 └── TransferOrders.tsx (table selection grid)
```

### Remaining (Future Phases)
- Dashboard.tsx still imports from `src/data/orders.ts` static array for order data
- Remove static arrays from `src/data/orders.ts` and `src/data/ticketOrders.ts` once all consumers migrated
- Templates still use localStorage (acceptable for now)
- Split configurations and transfer records in localStorage can be migrated to DB columns
