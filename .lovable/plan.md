

# Order Panel — Database Connection Audit & Fix Plan

## Findings

After tracing every field in the order detail panel (desktop layout, lines 2109-2494), here is what is and isn't connected to the database:

### Connected (via `currentSelectedGuest` from DB orders)
| Field | Source | Status |
|-------|--------|--------|
| Table ID | URL param `tableId` | Connected |
| Guest Name | `currentSelectedGuest.name` | Connected |
| Server | `currentSelectedGuest.server` | Connected (fallback "DUSTIN H" if empty) |
| Phone | `currentSelectedGuest.phone` | Connected (fallback hardcoded) |
| Time | `currentSelectedGuest.time` | Connected |
| Status | `currentSelectedGuest.status` | Connected |
| Order Items (qty, name, price, modifiers, seats) | `currentSelectedGuest.items` | Connected |
| Subtotal | `currentSelectedGuest.subtotal` | Connected |
| Discount | `currentSelectedGuest.discount` | Connected |
| Service Charge | `currentSelectedGuest.serviceCharge` | Connected |
| Tax | `currentSelectedGuest.tax` | Connected |
| Total | `currentSelectedGuest.total` | Connected |
| Transfer info | `currentSelectedGuest.transferredFrom` | Connected |
| Payment methods | `currentSelectedGuest.paymentMethods` | Connected |

### NOT Connected — Issues Found

| # | Field | Issue | Fix |
|---|-------|-------|-----|
| 1 | **Order Notes** (line 2162) | Local `useState("")` — never reads from `currentSelectedGuest.notes`, never writes back to DB | Initialize from `currentSelectedGuest.notes`, persist changes via `updateOrder` |
| 2 | **Seat buttons** (line 2145) | Hardcoded `[1, 2, 3, 4]` — should derive from `currentSelectedGuest.partySize` | Generate seats dynamically: `Array.from({length: partySize}, (_, i) => i + 1)` |
| 3 | **Items count** (line 2121) | Shows `items.length` but fallback is hardcoded `4` | Remove hardcoded fallback, use `0` |
| 4 | **Order ID display** (line 2122) | Shows raw UUID `currentSelectedGuest.id` — should show order number or guest name | Show `currentSelectedGuest.orderNumber` or `currentSelectedGuest.name` |
| 5 | **Phone fallback** (line 2030) | Hardcoded `"(415) 123-4567"` when phone is empty | Show "No phone" or empty |
| 6 | **Server fallback** (line 2126) | Hardcoded `"DUSTIN H"` when server is empty | Show "Unassigned" or empty |
| 7 | **Applied Discount** (line 2414) | `appliedDiscount` is session-local (from discount dialog selection) — not persisted to DB when applied | Persist discount changes to DB via `updateOrder` when discount is applied |

## Implementation Plan

### 1. Connect Order Notes to DB
- Initialize `orderNotes` from `currentSelectedGuest.notes` using `useEffect`
- On change, debounce and call `updateOrder(id, { notes })` to persist

### 2. Dynamic Seat Buttons from Party Size
- Replace `[1, 2, 3, 4]` with `Array.from({length: currentSelectedGuest?.partySize || 4}, (_, i) => i + 1)` in all 3 layouts (mobile/tablet/desktop)

### 3. Fix Hardcoded Fallbacks
- Line 2121: Change `|| 4` to `|| 0`
- Line 2122: Show `currentSelectedGuest?.name` instead of `currentSelectedGuest?.id`
- Line 2030: Change `"(415) 123-4567"` to `"No phone"`
- Line 2126: Change `"DUSTIN H"` to `"Unassigned"`

### 4. Persist Applied Discount to DB
- When a discount is confirmed in the discount dialog, call `updateOrder` to save the new discount value to the database

### Files to modify
- `src/pages/TableOrderDetails.tsx` — all changes above

