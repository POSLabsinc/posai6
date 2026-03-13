
# Database-Connected Orders System — Migration Complete

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

### Data Flow Summary
```
ticket_orders (DB) ←──┐
                       │ useTicketOrders hook
ticket_order_items ────┘
        │
        ├── UnifiedOrderContext (wraps hook, legacy API)
        ├── SessionOrderContext (session orders with session_id)
        ├── Tickets.tsx (direct hook usage)
        ├── TableOrderDetails.tsx (via UnifiedOrderContext)
        ├── Dashboard.tsx (via static data - next phase)
        └── TransferOrders.tsx (via UnifiedOrderContext)
```

### Remaining (Future Phases)
- Dashboard.tsx still imports from `src/data/orders.ts` static array — needs migration to hook
- TableOrderDetails.tsx still imports `allOrders` from `src/data/orders.ts` — needs migration
- Remove static arrays from `src/data/orders.ts` and `src/data/ticketOrders.ts` once all consumers migrated
