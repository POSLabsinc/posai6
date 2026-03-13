

# Guest Book Database Connection Audit

## Current Status — What's Connected vs What's Not

### Profile Tab
| Field | Source | Status |
|---|---|---|
| Name, Email, Phone | `guests` table | ✅ Connected (read + write) |
| Avatar, Initials, Avatar BG | `guests` table | ✅ Connected |
| Loyalty, Since, Birthday, Anniversary | `guests` table | ✅ Connected (editable) |
| Vehicle | `guests` table | ✅ Connected (editable) |
| Allergies, Tags | `guests` table (arrays) | ✅ Connected (editable) |
| Notes (5 types) | `guests` table | ✅ Connected (editable) |
| Last Visit, Avg Spend, Lifetime Spend | Computed from `orders` | ✅ Connected |
| Total Orders, Avg Tip | Computed from `orders` | ✅ Connected |
| Most Ordered, Last Ordered | Computed from `order_items` | ✅ Connected |
| Loyalty Earned/Redeemed/Available | Computed from `loyalty_points` | ✅ Connected |
| Visits, Upcoming, Canceled, No Shows | Computed from `reservations` | ✅ Connected |
| **Recent Orders section** | Hardcoded "No Recent Orders to Show" | ❌ NOT connected |
| **Online Reviews section** | Hardcoded mock data (Google/Yelp/Foursquare) | ❌ NOT connected |

### Reservation Tab
| Field | Source | Status |
|---|---|---|
| All reservation data | `reservations` table via `guest_id` | ✅ Connected |
| Summary stats | Computed from reservations | ✅ Connected |
| Color category updates | `reservations` table | ✅ Connected |
| Realtime subscription | Channel on `reservations` | ✅ Connected |

### Payment Tab
| Field | Source | Status |
|---|---|---|
| All payment/order data | `orders` table via `guest_id` | ✅ Connected |
| Summary, grouping, sorting | Computed from orders | ✅ Connected |

### Feedback Tab
| Field | Source | Status |
|---|---|---|
| All feedback data | `guest_feedback` table via `guest_id` | ✅ Connected |

### Order History Tab
| Field | Source | Status |
|---|---|---|
| Orders + items | `orders` + `order_items` via `guest_id` | ✅ Connected |
| Summary, sorting, filtering | Computed from orders | ✅ Connected |

---

## Issues Found (2 items)

### 1. Profile Tab — "Recent Orders" is hardcoded empty
Lines 1011-1018: Always shows "No Recent Orders to Show" regardless of actual order data. Should query last 3 orders from `orders` table using `guest_id`.

### 2. Profile Tab — "Online Reviews" uses hardcoded mock data
Lines 1020-1086: Shows fake Google/Yelp/Foursquare reviews. Should query from `guest_feedback` table using `guest_id`.

---

## Plan — Fix the 2 Remaining Gaps

### Change 1: Wire "Recent Orders" to live data
In `GuestDetailPanel`, replace the static "No Recent Orders" block with a small component that:
- Queries `orders` table filtered by `guest_id`, limited to 3, ordered by `created_at desc`
- Joins `order_items` to show dish names
- Displays date, items, and total for each order

### Change 2: Wire "Online Reviews" to live data
Replace the hardcoded review cards with a component that:
- Queries `guest_feedback` table filtered by `guest_id`, limited to 5, ordered by `feedback_date desc`
- Shows platform icon, sentiment (as star rating), and comment text
- Falls back to "No Reviews Yet" if empty

### Files to Modify
- `src/components/settings/GuestBookContent.tsx` — Replace hardcoded Recent Orders and Online Reviews sections with database-driven content

