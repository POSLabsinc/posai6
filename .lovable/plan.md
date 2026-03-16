

# Restore Realistic Table Statuses in Database

## Current State
All 12 tables in the database have `status: "Available"`, `guests: 0`, `occupied_seats: []`, and `time: ""`. This doesn't reflect the original demo data or the existing orders linked to those tables.

## What Needs to Change

Update each table row to match the original statuses, guest counts, and occupied seats. These values also align with orders already in `ticket_orders`:

| Table | Status | Guests | Occupied Seats | Time | Has Orders? |
|-------|--------|--------|----------------|------|-------------|
| T1 | Reserved | 0 | [] | — | Yes (3 orders) |
| T2 | Ordering | 2 | [1,2] | 25M | Yes (3 orders) |
| T3 | Ordered | 3 | [1,2,3] | 2H 25M | Yes (3 orders) |
| T4 | Reserved | 0 | [] | 2H 25M | Yes (1 order) |
| T5 | Seated | 2 | [1,3] | 25M | Yes (1 PAID order) |
| T6 | Running Late | 0 | [] | 45M | No |
| T7 | 1st Course | 5 | [1,2,3,4,5] | 12M | No |
| T8 | Ready | 4 | [1,2,3,4] | 13M | No |
| T9 | 3rd Course | 3 | [1,2,3] | 14M | No |
| T10 | Dessert | 2 | [1,2] | 16M | Yes (1 order) |
| T11 | Partially Seated | 3 | [1,3,5] | 18M | No |
| T12 | Served | 5 | [1,2,3,4,5] | 36M | No |

## Implementation
Single step: Run 12 UPDATE statements against `restaurant_tables` to set `status`, `guests`, `occupied_seats`, and `time` for each table. No schema changes needed — all columns already exist.

