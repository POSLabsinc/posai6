
# Plan: Guest Book Database — ID-Based Relational Structure — COMPLETED

## What Was Done

### Phase 1: Database Migration ✅
- Added `guest_id` (uuid, FK → guests.id) to `orders`, `reservations`, `guest_feedback`
- Created indexes on all three `guest_id` columns
- Backfilled existing records by matching `customer_name`/`guest_name` → `guests.name`

### Phase 2: Updated All Tab Queries to Use `guest_id` ✅
- `PaymentTabContent` — queries orders by `guest_id` instead of `customer_name`
- `FeedbackTabContent` — queries guest_feedback by `guest_id` instead of `guest_name`
- `OrderHistoryTabContent` — queries orders by `guest_id` instead of `customer_name`
- `ReservationTabContent` (inline in GuestBookContent) — queries reservations by `guest_id`
- All props updated from `{ name: string }` to `{ id: string; name: string }`

### Phase 3: Loyalty Stats Computation ✅
- `fetchGuests` now queries `loyalty_points` table alongside orders/reservations
- Computes `loyaltyEarned`, `loyaltyRedeemed`, `loyaltyAvailable`, `loyaltyAmount` from real data
- All stats aggregation uses `guest_id` matching instead of name matching

### Phase 4: Order/Reservation Creation
- No insert code exists in codebase yet — will need `guest_id` set when those features are built

### Data Flow Summary
```
guests table (profile) ←──┐
                           │ guest_id FK
orders ────────────────────┤
reservations ──────────────┤
guest_feedback ────────────┤
loyalty_points ────────────┘ (already had guest_id)
```
