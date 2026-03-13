
# Plan: Unify Data Across Editor and Live Environments — COMPLETED

## Root Cause
Settings tables filtered by `device_id` (a random per-browser ID), causing different browsers to see different data.

## Solution Applied
Replaced per-browser `device_id` with a fixed `"shared"` constant for all global settings tables.

### Files Updated:
1. **src/lib/settingsManager.ts** — All settings sync/read use `SHARED_DEVICE_ID = "shared"`. Cash drawer keeps `getPerDeviceId()`.
2. **src/hooks/usePreference.ts** — Uses `SHARED_DEVICE_ID`
3. **src/components/settings/DiscountsContent.tsx** — Uses `SHARED_DEVICE_ID`
4. **src/components/settings/ServiceChargeContent.tsx** — Uses `SHARED_DEVICE_ID`
5. **src/components/settings/TaxesContent.tsx** — Uses `SHARED_DEVICE_ID`
6. **src/components/settings/AIRulesContent.tsx** — Uses `SHARED_DEVICE_ID`
7. **src/components/settings/AIIntegrationContent.tsx** — Uses `SHARED_DEVICE_ID`
8. **src/hooks/useEndOfDayScheduler.ts** — Uses `SHARED_DEVICE_ID`
9. **src/lib/alertService.ts** — Uses shared key for notification sound preference
10. **supabase/functions/ai-settings-chat/index.ts** — Uses `"shared"` device_id

### What stays per-device:
- `device_stores` (useDeviceStore.ts) — device-to-store binding
- `cash_drawer_sessions` / `cash_transactions` — per-terminal cash management
