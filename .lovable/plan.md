

# Plan: Sync Transaction Data from ticket_orders to Cash Drawer and Cash Log

## Problem
The Cash Drawer and Cash Management screens query the `orders` table for sales/tip data, but all actual POS transactions (charges, payments) are stored in the `ticket_orders` table. The `orders` table only contains old seed data from March, so no recent transactions appear in the Cash Log or History.

## Root Cause
- `CashDrawerDetailsContent.tsx` line 185: queries `orders` table
- `CashManagementContent.tsx` line 178: queries `orders` table
- Both should query `ticket_orders` instead, which has real transaction data with `status = 'PAID'`

## Changes

### 1. Update CashDrawerDetailsContent.tsx - Query ticket_orders
- Replace the `orders` table query with `ticket_orders`
- Map `ticket_orders` fields to the cash log format:
  - `payment_type` field exists in both tables (same usage)
  - `total` maps directly
  - `tip` (in ticket_orders) replaces `tip_amount` (in orders)
  - `server` or session employee replaces `employee_name`
- Add realtime subscription for `ticket_orders` instead of `orders`

### 2. Update CashManagementContent.tsx - Query ticket_orders
- Same table swap from `orders` to `ticket_orders`
- Same field mapping adjustments (`tip` instead of `tip_amount`, `server` for employee name)
- Update the History view to show real transaction data

### 3. Field Mapping (ticket_orders to CashTransaction)
| ticket_orders field | CashTransaction field |
|---|---|
| `total` | orderTotal |
| `tip` | tipAmount |
| `payment_type` | payment type (cash vs card) |
| `server` | employee name |
| `created_at` | timestamp |
| `status = 'PAID'` | filter condition |

### 4. Realtime Subscription Update
- Change realtime listener from `orders` table to `ticket_orders` table in both files
- This ensures instant updates when a customer is charged

## Files to Modify
1. `src/components/settings/CashDrawerDetailsContent.tsx` - Switch query + field mapping + realtime channel
2. `src/components/settings/CashManagementContent.tsx` - Switch query + field mapping for History/Cash Log

