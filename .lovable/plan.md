

# Plan: Migrate Customers to Database & Add Loyalty Points System

## Current State
- **`src/data/customers.ts`** has 5 hardcoded mock customers used by 11 files (all guest forms, voucher CustomerStep, PhoneConflictDialog)
- **`guests` table** already exists with 8 real customers including a `loyalty` text field (Gold/Silver/Platinum/Bronze tiers)
- No loyalty points tracking tables exist — loyalty is just a static tier string

## What Will Change

### 1. New Table: `loyalty_points` — Track Points History

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| guest_id | uuid | References guests.id |
| points | integer | Positive = earned, negative = redeemed |
| balance_after | integer | Running balance after this transaction |
| type | text | 'earned', 'redeemed', 'expired', 'adjustment' |
| description | text | e.g. "Order #1042", "Voucher redemption" |
| order_id | uuid | Optional, links to orders table |
| created_at | timestamptz | |

### 2. Add Columns to `guests` Table

- `loyalty_points_balance` (integer, default 0) — current points balance
- `total_points_earned` (integer, default 0) — lifetime earned
- `last_order_date` (timestamptz, nullable) — for search/display
- `order_count` (integer, default 0) — total orders placed

### 3. Seed Sample Data

- Update existing 8 guests with points balances and order counts
- Insert loyalty_points transaction history for each guest

### 4. New Service: `src/services/customerService.ts`

Replaces `src/data/customers.ts` with async database functions:
- `searchCustomers(query)` — search guests by name/phone
- `findCustomerByPhone(phone)` — exact phone match
- `checkPhoneConflict(phone, name)` — conflict detection
- `getCustomerLoyalty(guestId)` — fetch points history

### 5. Update 11 Consumer Files

Replace `import { customers, ... } from "@/data/customers"` with imports from `customerService.ts` in:
- TakeOutGuestForm, DineInGuestForm, BanquetGuestForm, CustomOrderGuestForm, DeliveryGuestForm, PhoneInGuestForm, DriveThruGuestForm, CurbSideGuestForm, ScheduledGuestForm
- PhoneConflictDialog (type import only)
- voucher/CustomerStep

Each form's search will become async (debounced query to database instead of in-memory filter).

### 6. Delete `src/data/customers.ts`

No longer needed after migration.

