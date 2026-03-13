

# Guest Book Database Plan — Full Data Audit & Schema Improvements

## Current State Analysis

### What's Already in the `guests` Table (stored per guest)
Profile fields: `name`, `email`, `phone`, `avatar_url`, `initials`, `avatar_bg`, `loyalty`, `since`, `birthday`, `anniversary`, `vehicle`, `allergies[]`, `tags[]`, `middle_name`, `address`, `license_plate`, and five notes columns (`notes_general`, `notes_special_relation`, `notes_seating_preferences`, `notes_special_note`, `notes_allergies`). Also: `loyalty_points_balance`, `total_points_earned`, `order_count`, `last_order_date`.

### What's Already Computed at Load Time (from related tables)
The `fetchGuests` function in `GuestBookContent.tsx` already aggregates stats from `orders` and `reservations`:
- **From orders**: lastVisit, avgSpend, lifetimeSpend, totalOrders, avgTip, mostOrdered, mostOrderedCount, lastOrdered
- **From reservations**: totalVisits, upcomingVisits, canceledVisits, noShows
- **From loyalty_points**: loyaltyEarned, loyaltyRedeemed, loyaltyAvailable (currently hardcoded to 0 — NOT computed)

### Critical Problem: All Cross-Table Queries Use Name Matching
Every tab queries related data by `guest.name` string comparison instead of a proper `guest_id` foreign key:
- **Reservation tab**: `.eq('guest_name', guest.name)`
- **Payment tab**: `.eq('customer_name', guest.name)`
- **Feedback tab**: `.eq('guest_name', guest.name)`
- **Order History tab**: `.eq('customer_name', guest.name)`

This breaks when two guests share the same name or when a guest name is edited.

---

## Plan

### Phase 1: Add `guest_id` Foreign Keys to Related Tables

Add a nullable `guest_id` (uuid) column to three tables that currently link by name:

```text
orders          → ADD guest_id uuid (nullable, references guests.id)
reservations    → ADD guest_id uuid (nullable, references guests.id)
guest_feedback  → ADD guest_id uuid (nullable, references guests.id)
```

The `loyalty_points` table already has `guest_id` — no change needed there.

### Phase 2: Backfill Existing Data

Run UPDATE statements to populate `guest_id` from name matches for existing records:
- `UPDATE orders SET guest_id = g.id FROM guests g WHERE orders.customer_name = g.name`
- Same for `reservations` and `guest_feedback`

### Phase 3: Compute Loyalty Stats from `loyalty_points` Table

Update `fetchGuests` to also query `loyalty_points` and compute:
- **loyaltyEarned**: SUM of points WHERE type = 'earned'
- **loyaltyRedeemed**: SUM of points WHERE type = 'redeemed'
- **loyaltyAvailable**: `loyalty_points_balance` (already on guests table)
- **loyaltyAmount**: Dollar equivalent of available points

### Phase 4: Update All Tab Queries to Use `guest_id`

Modify each tab component to accept and query by `guest.id` instead of `guest.name`:

| Component | Current Query | New Query |
|---|---|---|
| `ReservationTabContent` | `.eq('guest_name', guest.name)` | `.eq('guest_id', guest.id)` |
| `PaymentTabContent` | `.eq('customer_name', guest.name)` | `.eq('guest_id', guest.id)` |
| `FeedbackTabContent` | `.eq('guest_name', guest.name)` | `.eq('guest_id', guest.id)` |
| `OrderHistoryTabContent` | `.eq('customer_name', guest.name)` | `.eq('guest_id', guest.id)` |

Update each component's props from `{ name: string }` to `{ id: string; name: string }`.

### Phase 5: Update Order/Reservation Creation to Set `guest_id`

When new orders or reservations are created elsewhere in the app, ensure `guest_id` is written alongside `customer_name`/`guest_name` so both columns stay populated.

### Phase 6: Profile Tab — Wire Up "Recent Orders" and "Online Reviews"

Currently hardcoded in the Profile tab:
- **Recent Orders section**: Shows "No Recent Orders to Show" always. Wire it to display the last 3 orders from the `orders` table using `guest_id`.
- **Online Reviews section**: Currently uses hardcoded mock data. Wire it to query from `guest_feedback` using `guest_id`.

---

## Summary of Database Fields Per Tab

```text
┌─────────────┬──────────────────────────────────────────────────┐
│ Tab         │ Data Source                                      │
├─────────────┼──────────────────────────────────────────────────┤
│ Profile     │ guests table (direct fields)                     │
│             │ + orders (computed: avgSpend, lifetime, tips)     │
│             │ + reservations (computed: visits, no-shows)       │
│             │ + loyalty_points (computed: earned/redeemed)      │
│             │ + order_items (computed: mostOrdered)             │
│             │ + guest_feedback (recent reviews)                 │
├─────────────┼──────────────────────────────────────────────────┤
│ Reservation │ reservations table (by guest_id)                  │
├─────────────┼──────────────────────────────────────────────────┤
│ Payment     │ orders table (by guest_id)                        │
├─────────────┼──────────────────────────────────────────────────┤
│ Feedback    │ guest_feedback table (by guest_id)                │
├─────────────┼──────────────────────────────────────────────────┤
│ Order Hist  │ orders + order_items (by guest_id)                │
└─────────────┴──────────────────────────────────────────────────┘
```

### Files to Modify
- **Migration SQL**: Add `guest_id` to `orders`, `reservations`, `guest_feedback` + backfill
- `src/components/settings/GuestBookContent.tsx` — loyalty stats computation, recent orders, reviews wiring, pass `id` to tabs
- `src/components/settings/PaymentTabContent.tsx` — query by `guest_id`
- `src/components/settings/FeedbackTabContent.tsx` — query by `guest_id`
- `src/components/settings/OrderHistoryTabContent.tsx` — query by `guest_id`
- Any order/reservation creation code — write `guest_id` alongside name

