

# Plan: Connect Full Payment Module to Database

## Overview
Migrate all 8 payment sub-modules from localStorage to dedicated database tables, and ensure PaymentDialog and order screens read from the same DB-backed source.

## Database Schema (9 new tables)

```text
payment_methods        (device_id, method_id, enabled, sort_order)
gratuity_settings      (device_id, + all gratuity fields as columns)
discounts              (device_id, name, amount, type, archived, applicable_to, applicable_products, requires_manager_pin, sort_order)
taxes                  (device_id, name, amount, type, archived, applicable_to, applicable_products, sort_order)
service_charges        (device_id, name, amount, type, archived, + all service charge fields)
checkout_options       (device_id, + all checkout option fields as columns)
cash_drawer_sessions   (device_id, drawer_name, starting_cash, status, opened_at, closed_at, closing_cash)
cash_transactions      (session_id FK, device_id, type, amount, reason, note, employee_name)
vouchers               (code UNIQUE, name, type, value, remaining_balance, status, expiry_date, redemption_limit, times_redeemed, + all voucher fields)
```

All tables: uuid PK, created_at/updated_at defaults, public RLS (matching existing pattern), updated_at trigger.

## Implementation Steps

### Step 1: Single SQL migration
Create all 9 tables + RLS policies + `updated_at` triggers in one migration. Add unique constraints on `(device_id, method_id)` for payment_methods, `(device_id)` for gratuity_settings and checkout_options, and `(code)` for vouchers.

### Step 2: Add `payment-methods-state` to SettingsManager sync
Currently `payment-methods-state` is NOT in `STORAGE_KEYS` — add it so it syncs. But more importantly, refactor SettingsManager to read/write each module to its dedicated table instead of serializing to `user_preferences`.

### Step 3: Refactor SettingsManager — DB-first CRUD per module
For each module (gratuity, discounts, taxes, service_charges, checkout_options, payment_methods):
- Add async `load*FromDB()` that reads from the dedicated table, populates localStorage cache
- Change `get*()` to read localStorage cache (synchronous, fast)
- Change `update*()`/`add*()`/`archive*()` to write to dedicated table AND update localStorage cache
- `initFromDatabase()` calls all `load*FromDB()` methods on startup
- One-time migration: if DB table is empty but localStorage has data, seed DB from localStorage

### Step 4: Update PaymentMethodsContent
Replace direct localStorage read/write with `SettingsManager.getPaymentMethods()` / `SettingsManager.updatePaymentMethod()` that hit `payment_methods` table.

### Step 5: Update PaymentDialog consumers
- `getEnabledPaymentMethods()` → use `SettingsManager.getPaymentMethodStates()`
- `getCheckoutOptionsSettings()` → use `SettingsManager.getCheckoutOptionsSettings()`
- These already read localStorage, so once SettingsManager hydrates cache from DB, they work automatically. But update to use SettingsManager API for consistency.

### Step 6: Update orderUtils.ts `getActiveTaxRate()`
Replace direct `localStorage.getItem('taxes-settings')` with `SettingsManager.getActiveTaxes()` so it reads from DB-hydrated cache. This ensures order screens, table order screens, and tickets all use DB-backed tax rates.

### Step 7: Update ServiceChargeDialog
Replace direct `localStorage.getItem('service-charges-settings')` with `SettingsManager.getActiveServiceCharges()`.

### Step 8: Update DiscountDialog
Replace direct `localStorage.getItem('discounts-settings')` with `SettingsManager.getActiveDiscounts()`.

### Step 9: Update Cash Management components
- `CashManagementContent` → CRUD against `cash_drawer_sessions` table
- `CashDrawerDetailsContent` → read from `cash_transactions` table
- `PayInOutContent` → insert into `cash_transactions` table
- Remove localStorage keys: `activeDrawerSession`, `cashTransactions`, `paidInOut`

### Step 10: Update Voucher components
- `VoucherDialog` → validate/redeem against `vouchers` table
- `CreateVoucherForm` / `SellVoucherScreen` → insert into `vouchers` table
- Redemption updates `remaining_balance`, `times_redeemed`, `status`

### Step 11: Ensure cross-module consistency
All payment-related reads across the app (Orders page, Table Order, Tickets, PaymentDialog) go through SettingsManager which reads from DB-hydrated localStorage cache. This makes settings consistent application-wide without changing each consumer individually.

## Files to modify
- **New migration SQL** — 9 tables, RLS, triggers
- `src/lib/settingsManager.ts` — DB-first CRUD for all 8 modules + payment methods
- `src/lib/orderUtils.ts` — use SettingsManager for tax rate
- `src/components/PaymentDialog.tsx` — use SettingsManager for payment methods & checkout options
- `src/components/ServiceChargeDialog.tsx` — use SettingsManager
- `src/components/DiscountDialog.tsx` — use SettingsManager
- `src/components/settings/PaymentMethodsContent.tsx` — use SettingsManager
- `src/components/settings/CashManagementContent.tsx` — DB sessions
- `src/components/settings/CashDrawerDetailsContent.tsx` — DB transactions
- `src/components/settings/PayInOutContent.tsx` — DB transactions
- `src/components/VoucherDialog.tsx` — DB vouchers
- `src/components/CreateVoucherForm.tsx` — DB vouchers
- `src/components/SellVoucherScreen.tsx` — DB vouchers

## Key design decisions
- **localStorage kept as synchronous cache** — many components read settings synchronously; DB is async. Cache is hydrated on app boot via `initFromDatabase()`.
- **Writes go to DB first, then cache** — ensures DB is source of truth.
- **One-time migration** — existing localStorage data seeds empty DB tables on first load, preventing data loss.
- **Public RLS** — matches existing table patterns (no auth required).

