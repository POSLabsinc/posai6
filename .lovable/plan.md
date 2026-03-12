
# Plan: Connect Full Payment Module to Database — COMPLETED

## What was done

### Step 1: Database Migration ✅
Created 9 new tables via migration:
- `payment_methods` (device_id, method_id, enabled, sort_order)
- `gratuity_settings` (device_id + all gratuity fields)
- `discounts` (device_id, name, amount, type, archived, etc.)
- `taxes` (device_id, name, amount, type, archived, etc.)
- `service_charges` (device_id + all service charge fields)
- `checkout_options` (device_id + all checkout fields)
- `cash_drawer_sessions` (device_id, drawer_name, starting_cash, status, etc.)
- `cash_transactions` (session_id FK, device_id, type, amount, reason, note)
- `vouchers` (code UNIQUE, name, type, value, remaining_balance, status, etc.)

All with RLS policies, updated_at triggers, and proper constraints.

### Step 2: SettingsManager Refactored ✅
- Added dedicated table sync helpers for each module
- `initFromDatabase()` loads from all 9 dedicated tables in parallel
- One-time migration: seeds DB from localStorage if tables are empty
- All write methods now sync to both localStorage (cache) and dedicated DB tables
- Added new methods: PaymentMethods CRUD, CashManagement (create/close sessions, add transactions), Voucher (create, find, redeem)

### Step 3: Components Updated ✅
- `PaymentMethodsContent` → syncs toggle states to `payment_methods` table
- `CashManagementContent` → creates sessions in `cash_drawer_sessions` table, loads history from DB
- `CashDrawerDetailsContent` → loads transactions from DB, closes sessions via DB
- `PayInOutContent` → saves transactions to `cash_transactions` table
- `VoucherDialog` → saves created vouchers to `vouchers` table
- `CreateVoucherForm` → saves created vouchers to `vouchers` table

### Cross-module consistency
- `orderUtils.ts getActiveTaxRate()` reads from localStorage which is hydrated from DB on boot
- `PaymentDialog` reads payment method states from localStorage (hydrated from DB)
- All modules share the same DB-backed source of truth via SettingsManager
