

# Persist Refund Data to Database

## Problem
The refund flow exists in **three locations**, none of which persist to the database:

1. **Tickets.tsx** — Has the most comprehensive refund flow (full, partial, tip, custom, item-level, modifier-level refunds with split payment allocations). All refund records (`refundedItemRecords`, `refundedModifierRecords`, `refundedTipRecords`, `refundTransactionRecords`) are stored only in **React state** — lost on page refresh.

2. **TableOrderDetails.tsx** — Uses `RefundDialog` component. The `onRefundComplete` callback just does `console.log("Refund completed:", amount, reason)`.

3. **Dashboard.tsx** — Same `RefundDialog` with `console.log("Refund completed:", amount, reason)`.

The `ticket_orders` table has **no refund columns** currently. The legacy `orders` table has a `refund_amount` column, but that's a separate reporting table.

## Solution

### Step 1: Add refund columns to `ticket_orders` table
Add three new columns via migration:
- `refund_amount` (numeric, default 0) — total cumulative refund amount
- `refund_reason` (text, nullable) — reason for the last/primary refund
- `refund_transactions` (jsonb, default '[]') — array of all refund transaction records with details (amount, payment method, reason, type, timestamp, items refunded)

This single JSONB array captures the full history: each refund event is appended as an object with fields like `{ id, amount, reason, type, paymentMethod, items, timestamp }`.

### Step 2: Update `use-ticket-orders.ts` hook
- Add `refundAmount`, `refundReason`, `refundTransactions` to the `UnifiedTicketOrder` interface and the row-to-unified / unified-to-row mappers.

### Step 3: Persist refunds in Tickets.tsx
In the refund confirmation handler (~line 1758-1801), after recording the transaction in local state, also call `updateOrder()` to persist:
- Append new transaction(s) to `refund_transactions` JSONB
- Update cumulative `refund_amount`
- Store `refund_reason`

### Step 4: Persist refunds in TableOrderDetails.tsx
Replace the `console.log` in `onRefundComplete` (~line 3360) with a `updateOrder()` call that persists the refund amount, reason, and a transaction record.

### Step 5: Persist refunds in Dashboard.tsx
Same pattern — replace `console.log` in `onRefundComplete` (~line 1949) with database persistence.

## Data Shape
Each entry in `refund_transactions` JSONB array:
```json
{
  "id": "refund-uuid-timestamp",
  "amount": 28.00,
  "reason": "Customer Dissatisfaction",
  "type": "partial",
  "paymentMethod": "Credit Card",
  "paymentType": "credit_card",
  "items": [{"name": "Steak", "qty": 1, "amount": 28.00}],
  "timestamp": "2026-03-16T..."
}
```

## Files Changed
- **Migration SQL** — Add 3 columns to `ticket_orders`
- **`src/hooks/use-ticket-orders.ts`** — Map new fields
- **`src/pages/Tickets.tsx`** — Persist after refund confirm
- **`src/pages/TableOrderDetails.tsx`** — Persist in `onRefundComplete`
- **`src/pages/Dashboard.tsx`** — Persist in `onRefundComplete`

