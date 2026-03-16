

# Database-Backed Table Management for Floor Plan

## Current State

The TableOrder page uses **hardcoded mock data** (`defaultTables` array, lines 128-141) for all 12 tables, with localStorage storing only position overrides, floor areas, dividers, and templates. Table properties (id, seats, shape, status) are static and identical across all devices/sessions.

## What Needs to Move to Database

| Data | Currently | Target |
|------|-----------|--------|
| Table definitions (id, name, seats, shape) | Hardcoded array | `restaurant_tables` DB table |
| Table positions (x, y coordinates) | localStorage | `restaurant_tables` DB table |
| Table status (Available, Ordering, etc.) | Hardcoded + local state | `restaurant_tables` DB table |
| Table runtime state (guests, occupied seats, time) | Local state only | `restaurant_tables` DB table |
| Merge configuration | localStorage | `restaurant_tables` DB table |
| Floor areas | localStorage | `floor_areas` DB table |
| Floor dividers | localStorage | `floor_dividers` DB table |

## New Database Tables

### 1. `restaurant_tables`
- `id` (uuid, PK)
- `table_number` (text) — e.g. "T1", "T2"
- `seats` (integer) — max capacity
- `shape` ("circle" | "square")
- `status` (text) — Available, Ordering, Reserved, etc.
- `x`, `y` (numeric) — floor plan position
- `guests` (integer, default 0)
- `occupied_seats` (jsonb, default [])
- `time` (text) — timer display
- `merged_with` (text, nullable)
- `is_merge_source` (boolean, default false)
- `merge_group_id` (text, nullable)
- `floor_area` (text, default 'Main Dining Room')
- `sort_order` (integer)
- `merchant_id` (uuid, nullable)
- `created_at`, `updated_at` (timestamptz)

### 2. `floor_areas`
- `id` (uuid, PK)
- `name` (text)
- `color` (text)
- `x`, `y`, `width`, `height` (numeric)
- `sort_order` (integer)
- `merchant_id` (uuid, nullable)
- `created_at` (timestamptz)

### 3. `floor_dividers`
- `id` (uuid, PK)
- `x1`, `y1`, `x2`, `y2` (numeric)
- `merchant_id` (uuid, nullable)
- `created_at` (timestamptz)

## Implementation Plan

### Step 1: Create DB tables + seed default data
Run migration to create the three tables with public RLS policies, enable realtime on `restaurant_tables`, and seed the 12 default tables.

### Step 2: Create `useRestaurantTables` hook
- Fetches tables, floor areas, and dividers from DB
- Realtime subscription on `restaurant_tables` for live status sync across devices
- Mutations: `addTable`, `updateTable`, `removeTable`, `updateTableStatus`, `updatePositions`
- Similar pattern to `useTicketOrders`

### Step 3: Refactor `TableOrder.tsx`
- Replace `defaultTables` hardcoded array with data from `useRestaurantTables`
- Replace all localStorage reads/writes for positions, areas, dividers with DB operations
- Table add/remove in edit mode writes to DB
- Status changes and guest updates persist to DB
- Floor area CRUD persists to DB

### Step 4: Update dependent pages
- `Dashboard.tsx` — replace `mockTables` with `useRestaurantTables`
- `TransferOrders.tsx` — replace `defaultTables` with DB tables
- `TableOrderDetails.tsx` — table status updates write to DB

### Files to create
- `src/hooks/use-restaurant-tables.ts`

### Files to modify
- `src/pages/TableOrder.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/TransferOrders.tsx`

