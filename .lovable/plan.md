

# Two Order Flows — Current State & Fix Plan

## The Two Flows

### Flow 1: Table Order (via Table Selection)
```text
Floor Plan → Select Table → Create Session Order (DB) → Add Items (DB) → Fire (DB) → 
→ View in TableOrderDetails → Payment → DB ✅ (recently fixed)
```
- Uses `SessionOrderContext` → `useTicketOrders` hook → writes to `ticket_orders` + `ticket_order_items`
- Payment persistence was recently added to `TableOrderDetails.tsx`

### Flow 2: Quick Order (direct Orders screen)
```text
Orders screen → Select order type → Add items (local state only) → Fire (local toggle OR session) → Payment → ❌ NOT persisted
```
- Items live in `useState` (`orderItems`) — purely local
- `onPaymentComplete` only triggers toast notifications, no DB write
- No `useUnifiedOrders` or `useTicketOrders` hook is imported
- If accessed via table URL params (`?sessionId=...&tableId=...`), items sync to session orders on Fire — but payment still not persisted
- If accessed directly (no URL params), **nothing is saved to DB at all** — no order record, no items, no payment

## What's Missing in Quick Order Flow

| Field | Status |
|-------|--------|
| Order creation (ticket_orders row) | Not created for quick orders |
| Items (ticket_order_items) | Not saved for quick orders |
| Payment method, amount, status | Not persisted |
| Subtotal, tax, discount, total | Not persisted |
| Guest name, order type | Local state only |
| Fire status | Local toggle only |

## Implementation Plan

### 1. Import `useTicketOrders` in Orders.tsx
Add the hook to enable DB reads/writes for quick orders.

### 2. Create DB order on Fire (quick order mode)
When a quick order (non-session) is fired, create a `ticket_orders` record with all metadata (guest name, order type, server, items, subtotal, tax, total) and save items to `ticket_order_items`.

### 3. Persist payment on completion
Update `onPaymentComplete` to call `updateOrder` with status `PAID`, payment method, paid amount, and payment history — matching the logic already implemented in `TableOrderDetails.tsx` and `Tickets.tsx`.

### 4. Track the created order ID
Store the DB order ID in local state after creation so that subsequent operations (payment, split) can reference the correct record.

### Files to modify
- `src/pages/Orders.tsx` — add hook import, order creation on fire, payment persistence

