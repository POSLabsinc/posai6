

# Plan: Unify Data Across Editor and Live Environments

## Root Cause
The editor and live site already share the **same database**. The problem is that many tables (discounts, taxes, service_charges, gratuity_settings, payment_methods, checkout_options, user_preferences) filter by `device_id` -- a random ID generated per browser. Each browser (editor preview vs live site) gets a different device_id, so queries return empty results on the other.

## Solution: Remove device_id Scoping from Settings Tables

Make all settings data **global** (not per-device) so any browser sees the same configuration.

### Tables to de-scope from device_id filtering:
- `discounts` -- remove device_id from queries
- `taxes` -- remove device_id from queries  
- `service_charges` -- remove device_id from queries
- `gratuity_settings` -- remove device_id from queries
- `payment_methods` -- remove device_id from queries
- `checkout_options` -- remove device_id from queries
- `user_preferences` -- remove device_id from queries
- `cash_drawer_sessions` -- keep device_id (session is legitimately per-device)

### Files to Update (~10 files):
1. **src/lib/settingsManager.ts** -- Remove device_id from all sync/read functions
2. **src/hooks/usePreference.ts** -- Remove device_id from upsert/select
3. **src/components/settings/DiscountsContent.tsx** -- Remove device_id from queries
4. **src/components/settings/ServiceChargeContent.tsx** -- Remove device_id from queries
5. **src/components/settings/TaxesContent.tsx** -- Remove device_id from queries (if applicable)
6. **src/components/settings/AIRulesContent.tsx** -- Remove device_id from preference queries
7. **src/hooks/useDeviceStore.ts** -- Keep device_id for store binding (legitimate per-device)
8. Any other settings components using device_id filtering

### Pattern Change:
```typescript
// BEFORE
.from("discounts").select("*").eq("device_id", deviceId)

// AFTER  
.from("discounts").select("*")
```

For `user_preferences`, switch from device_id to a fixed shared key or remove device_id scoping entirely.

### Database Migration:
- No schema changes needed -- device_id columns remain (backward compatible)
- Existing data already in the database will be visible to all devices once filtering is removed

### What stays per-device:
- `device_stores` (which store a device is bound to)
- `cash_drawer_sessions` (physical drawer per device)

