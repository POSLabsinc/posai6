

# Plan: Connect Add Guest Form to Customer (Guests) Database Table

## What needs to happen

When a user fills out the Add Guest form and clicks "Save Guest", the data should be inserted into the `guests` database table. Some form fields don't have matching columns in the table, so we need to add them.

## Step 1: Add missing columns to `guests` table

A migration to add 3 new columns:
- `middle_name` (text, nullable, default '')
- `address` (text, nullable, default '')
- `license_plate` (text, nullable, default '')

The vehicle details (type, color, brand) will be stored as a combined string in the existing `vehicle` column (e.g., "Red Toyota Sedan"). The `license_plate` gets its own column since it's a unique identifier.

## Step 2: Update `AddGuestForm.tsx` to save to database on submit

In `handleSave`:
1. Import supabase client
2. Combine `firstName` + `middleName` + `lastName` into the `name` field
3. Build a vehicle string from type/color/brand
4. Upsert into `guests` table (check if phone already exists to avoid duplicates)
5. Map fields: `dateOfBirth` -> `birthday`, `customerSince` -> `since`, `profilePhoto` -> `avatar_url`, `address` -> `address`, `licensePlate` -> `license_plate`
6. Show toast on success/error
7. Still call `onSave(formData)` for the parent component's local state

## Field mapping

```text
Form Field        →  DB Column
─────────────────────────────────
firstName+lastName →  name
middleName         →  middle_name (NEW)
email              →  email
phoneNumber        →  phone
customerSince      →  since
dateOfBirth        →  birthday
anniversary        →  anniversary
address            →  address (NEW)
vehicleType+Color+Brand → vehicle
licensePlate       →  license_plate (NEW)
profilePhoto       →  avatar_url
```

## Files to modify
- **Migration SQL** — add 3 columns to `guests`
- `src/components/AddGuestForm.tsx` — add DB insert on save

