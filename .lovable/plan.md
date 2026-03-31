

## Plan: Sync Table Statuses with Ticket Orders Across All Screens

### Problem
1. `TableOrder.tsx` has a **hardcoded `tableOrdersMap`** (lines 43-52) with fake orders for T1-T8, used in merge flow display regardless of actual DB data
2. `restaurant_tables` DB has **stale statuses** (e.g., T5/T6 show "Seated" but have no orders; T1 shows "Available" but has an active order)
3. There is **no automatic sync** between `ticket_orders` status changes and `restaurant_tables.status`, so Dashboard, Table Order, and Tickets screens show inconsistent data

### Changes

#### 1. Database: Fix stale table statuses
Use the insert tool to update `restaurant_tables` to match current `ticket_orders` reality:
- T2: set status "Ordering" (has active ORDERING order)
- T3: set status "Ordering" (has active ORDERING order)
- T1, T4, T5, T6, T7, T8, T9, T10, T11, T12: set status "Available" (no active orders; T1 has order #11 but if it was created as test, reset it too)
- Also delete the orphan order #11 on T1 if it was unintended, or set T1 to "Ordering" if it should stay

#### 2. Remove hardcoded `tableOrdersMap` from `TableOrder.tsx`
- Delete the `tableOrdersMap` object (lines 43-52), `getTableOrder` helper (line 55), and `toOrderTemplateData` helper (lines 58-72)
- Update the merge flow display (around lines 2864-2867) to look up orders from `allDbOrders` (already available via `useTicketOrders`) instead of the hardcoded map

#### 3. Add table status sync logic
Create a `useEffect` in `TableOrder.tsx` that derives table status from `ticket_orders`:
- For each table, check if any `ticket_order` with matching `table_id` has a non-PAID/non-COMPLETED status
- If yes: table status should reflect the order status (ORDERING -> "Ordering", ORDERED -> "Ordered", etc.)
- If all orders are PAID/COMPLETED or no orders exist: table status = "Available"
- Update `restaurant_tables` in DB when status changes (via `useRestaurantTables` update method)

This same logic should run in `Dashboard.tsx` as well, or better yet, be extracted into a shared hook.

#### 4. Create shared hook `useTableStatusSync`
A new hook (`src/hooks/use-table-status-sync.ts`) that:
- Takes `ticket_orders` and `restaurant_tables` as inputs
- Computes correct table status based on active orders
- Updates `restaurant_tables.status` in DB when mismatches are detected
- Both Dashboard and TableOrder import this hook

#### 5. Ensure Tickets screen shows table context
The Tickets screen already reads from `useTicketOrders` which has `table` field. Verify the ticket list correctly displays the table assignment for table-based orders so staff can cross-reference.

### Technical Details
- Table IDs in `ticket_orders.table_id` use the table_number format ("T1", "T2") not UUIDs
- The sync hook matches `ticket_orders.table_id` to `restaurant_tables.table_number` to find the correct UUID for updates
- Status mapping: `ORDERING` -> "Ordering", `ORDERED` -> "Ordered", `PAID` -> "Available" (table freed), `COMPLETED` -> "Available"
- The sync runs on every `allDbOrders` or `dbTables` change, ensuring real-time consistency via existing Supabase realtime subscriptions

