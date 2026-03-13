

# Database-Connected Orders System — Full Migration Plan

## Current State: 3 Disconnected Data Sources

The entire order/ticket system runs on **static files + localStorage** with zero database persistence:

| Source | Storage | Used By | Records |
|---|---|---|---|
| `src/data/orders.ts` (`allOrders`) | Hardcoded array | TableOrderDetails, TransferOrders, MergeOrders, Dashboard | 11 static orders |
| `src/data/ticketOrders.ts` (`ticketOrders`) | Hardcoded array | Tickets page, TicketsTransferView | 15 static orders |
| `UnifiedOrderContext` | localStorage (`pos-unified-orders`) | Bridges ticketOrders + transfers | Merges above at runtime |
| `SessionOrderContext` | localStorage (`pos-session-orders`) | New orders created at tables | Dynamic, session-only |

**The existing `orders` table in the database is only used by Reports & Analytics** — it has a different schema and is completely disconnected from the live order flow.

---

## Plan

### Phase 1: Create `ticket_orders` Table

A single unified table replacing all four data sources above.

```text
ticket_orders
├── id (uuid, PK)
├── name (text) — guest name
├── phone (text)
├── party_size (integer)
├── time (text) — arrival time display
├── timer (text) — elapsed time display
├── server (text)
├── check_number (text)
├── payment_type (text)
├── payments (jsonb) — array of {method, last4, amount}
├── revenue_center (text)
├── status (text) — ORDERING, ORDERED, PREPARING, READY, UNPAID, PAID, Completed
├── notes (text)
├── table_id (text) — T1, T2, Bar, --, etc.
├── order_type (text) — Dine-In, Take Out, Delivery, etc.
├── subtotal (numeric)
├── discount (numeric)
├── service_charge (numeric)
├── tax (numeric)
├── tip (numeric)
├── total (numeric)
├── paid_amount (text)
├── payment_status (text)
├── transfer_info (jsonb)
├── merged_from (jsonb)
├── transferred_from (jsonb)
├── session_id (text) — for session-created orders
├── split_configuration (jsonb)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### Phase 2: Create `ticket_order_items` Table

```text
ticket_order_items
├── id (uuid, PK)
├── order_id (uuid, FK → ticket_orders)
├── qty (integer)
├── name (text)
├── price (numeric)
├── seats (integer[])
├── modifiers (text[])
├── is_shared (boolean)
├── is_fired (boolean)
├── no_tax (boolean)
├── sort_order (integer)
└── created_at (timestamptz)
```

### Phase 3: Seed All Demo Data

Insert all 15 ticket orders + 11 table orders (deduplicated by name+table) with their items into the new tables so the UI displays data immediately.

### Phase 4: Create `useTicketOrders` Hook

A new React Query hook that replaces all static imports:
- Fetches from `ticket_orders` + `ticket_order_items` via Supabase
- Provides CRUD operations (add, update, remove)
- Exposes `getOrdersByTable()`, `getOrderById()`, filter helpers
- Enables realtime subscription for cross-device sync

### Phase 5: Replace `UnifiedOrderContext`

Refactor to use the database hook instead of localStorage:
- Remove `pos-unified-orders` localStorage dependency
- All mutations (transfers, status changes, payments) write directly to DB
- Transfer sync logic moves from localStorage events to DB queries

### Phase 6: Replace `SessionOrderContext`

Refactor to use database:
- `createOrder()` inserts into `ticket_orders` with a `session_id`
- `updateOrderItems()` upserts into `ticket_order_items`
- Remove `pos-session-orders` localStorage dependency
- Split configurations stored in `split_configuration` jsonb column

### Phase 7: Update Consumer Components

| File | Change |
|---|---|
| `src/data/orders.ts` | Keep utility functions, remove static `allOrders` array — export DB-fetched data |
| `src/data/ticketOrders.ts` | Keep interfaces/types, remove static `ticketOrders` array |
| `src/pages/TableOrderDetails.tsx` | Import from hook instead of static data |
| `src/pages/Tickets.tsx` | Import from hook instead of static data |
| `src/pages/TransferOrders.tsx` | Import from hook instead of static data |
| `src/pages/MergeOrders.tsx` | Import from hook instead of static data |
| `src/pages/Dashboard.tsx` | Import from hook instead of static data |
| `src/components/TicketsTransferView.tsx` | Import from hook instead of static data |

### Phase 8: Enable Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_order_items;
```

This ensures order changes on one device/tab appear instantly everywhere.

---

### Files to Create
- Migration SQL (tables + seed data + realtime)
- `src/hooks/use-ticket-orders.ts` — central data hook

### Files to Modify
- `src/contexts/UnifiedOrderContext.tsx` — replace localStorage with DB
- `src/contexts/SessionOrderContext.tsx` — replace localStorage with DB
- `src/data/orders.ts` — remove static array, keep utility functions
- `src/data/ticketOrders.ts` — remove static array, keep types
- `src/pages/TableOrderDetails.tsx` — use hook
- `src/pages/Tickets.tsx` — use hook
- `src/pages/TransferOrders.tsx` — use hook
- `src/pages/MergeOrders.tsx` — use hook
- `src/pages/Dashboard.tsx` — use hook
- `src/components/TicketsTransferView.tsx` — use hook
- `src/hooks/useEndOfDayScheduler.ts` — use hook

