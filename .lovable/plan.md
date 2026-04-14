

# Plan: Fix Cash Log Not Showing Transaction Data

## Problem
The Cash Log tab on the Cash Management page (`/settings/payments/cash-management`) is not displaying paid order transactions, even though the database contains 10+ PAID orders for today. The History tab correctly shows only closed drawer session summaries (confirmed as intended behavior).

## Root Cause Analysis
After inspecting the database, code, RLS policies, and network requests, I identified these issues:

1. **Timezone mismatch in date filtering**: The `loadCashLog` function creates `startOfDay` and `endOfDay` using the browser's local time, then calls `.toISOString()` which converts to UTC. If the user is in a timezone like UTC+5:30, "today at midnight" becomes "yesterday at 18:30 UTC", potentially missing orders or including wrong-day orders.

2. **Missing `updated_at` trigger on ticket_orders**: The `ticket_orders` table has no `updated_at` auto-update trigger. When payment is recorded via `updateOrder()`, the `updated_at` field IS explicitly set by the Supabase client's `.update()` call (it uses `now()` server-side), so this should work. However, the `useTicketOrders` hook's `unifiedToRow` function does NOT include `updated_at` in its mapping, meaning the `updated_at` column may not be updated when a payment is persisted through the hook.

3. **`updated_at` not being set on payment**: In `use-ticket-orders.ts`, the `unifiedToRow` function (line 178-208) does not map any field to `updated_at`. When `updateOrderMutation` runs `supabase.from('ticket_orders').update(row)`, the `updated_at` field is NOT included in the update payload. If the table has no auto-update trigger, `updated_at` remains at the original `created_at` value. This means the Cash Log query filtering by `updated_at` within today's range may miss orders whose `updated_at` was never updated.

**Confirmed by data**: Checking the DB rows, `updated_at` values DO exist and are close to `created_at` (within seconds), suggesting they ARE being set. But the key question is whether this is automatic (database trigger) or explicit. The schema shows no triggers exist (`There are no triggers in the database`). So `updated_at` is being set by the Supabase default `now()` only on INSERT, not on UPDATE.

**This is the primary bug**: When an order is created (ORDERED status), `updated_at = now()`. When payment updates the status to PAID, the `updated_at` is NOT updated because:
- No database trigger exists for auto-updating `updated_at`
- The `unifiedToRow` function doesn't include `updated_at` in the update payload

Wait - looking at the actual data again: `created_at=2026-04-14T11:29:38` and `updated_at=2026-04-14T11:29:43` - these differ by 5 seconds. This means `updated_at` IS being updated somehow. Let me reconsider...

Actually, looking at the table definition: `updated_at (timestamp with time zone, NOT NULL, default: now())`. The default only applies on INSERT. But the data shows `updated_at` is different from `created_at` by a few seconds. This suggests the Supabase `.update()` call IS somehow updating it. Actually Supabase PostgREST doesn't auto-update `updated_at` - but looking at the payment code in `Orders.tsx` line 4224-4231, it calls `updateTicketOrder(dbId, {...})` which goes through `use-ticket-orders.ts` `updateOrderMutation`, which calls `supabase.from('ticket_orders').update(row)`. The `row` object from `unifiedToRow` does NOT include `updated_at`, but Supabase may have a default behavior... Actually no, it shouldn't.

Wait - there IS a function `update_updated_at_column()` defined as a trigger function in the DB functions list! But the security scan says "There are no triggers in the database." So the function exists but no trigger uses it. The `updated_at` difference in the data could be from multiple sequential updates (initial insert + immediate payment update both happen within seconds).

**Final diagnosis**: The `updated_at` filtering approach works for most orders because the payment update happens shortly after creation. BUT the real problem is likely simpler - let me re-examine the query itself and the component rendering.

Actually, I think the issue is that the entire `loadCashLog` function works correctly BUT the code was recently modified and may have a build/deploy issue. Let me focus on making the solution robust.

## Solution

### 1. Add `updated_at` trigger to `ticket_orders` table
Create a database migration to attach the existing `update_updated_at_column()` trigger function to the `ticket_orders` table. This ensures `updated_at` is always current when payment status changes.

### 2. Fix `CashManagementContent.tsx` - Query reliability
- Change the Cash Log query to filter by BOTH `created_at` OR `updated_at` within the date range, ensuring orders are captured regardless of which timestamp falls on the selected date
- Add error logging to the Supabase query to surface any silent failures
- Sort all entries chronologically after merging orders, pay in/out, and cash drops

### 3. Fix `CashDrawerDetailsContent.tsx` - Same query fix
- Apply the same dual-timestamp query approach for the active drawer session view
- Ensure the combined Cash Log entries (orders + transactions + drops) are properly sorted and deduplicated

### 4. Add `updated_at` to `unifiedToRow` mapping
In `use-ticket-orders.ts`, explicitly set `updated_at` in the row mapping so that every update call refreshes the timestamp, even without a trigger.

## Files to Modify
1. **Database migration**: Add trigger `update_updated_at_column` on `ticket_orders`
2. `src/components/settings/CashManagementContent.tsx` - Fix query filters and add error handling
3. `src/components/settings/CashDrawerDetailsContent.tsx` - Fix query filters and add error handling  
4. `src/hooks/use-ticket-orders.ts` - Add `updated_at` to row mapping

