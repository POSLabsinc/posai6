

# Full Project Audit — POS AI 6.0

## Summary

This is a large restaurant POS application with ~56 page files, ~100+ components, and a substantial database schema (~40+ tables). The app is a mix of **fully functional database-backed features**, **hardcoded demo/mock UI**, and **orphaned files with no route or import**.

---

## 1. WHAT IS 100% WORKING (Database-Backed)

These features use real Supabase tables with CRUD operations:

| Feature | DB Tables Used | Status |
|---------|---------------|--------|
| **Menu Management** (Settings) | `menus`, `menu_categories`, `categories`, `products`, `product_variants`, `product_add_ons`, `product_modifier_groups` | Fully functional — create, edit, reorder, archive |
| **Modifiers & Add-Ons** | `modifiers`, `modifier_groups`, `add_ons`, `default_modifiers` | Fully functional |
| **Groups** | `groups` | Fully functional |
| **Employee Management** | `employees`, `employee_shifts`, `employee_stores` | Fully functional |
| **Discounts** | `discounts` | Fully functional |
| **Gratuity Settings** | `gratuity_settings` | Fully functional |
| **Payment Methods** | `payment_methods` | Fully functional |
| **Checkout Options** | `checkout_options` | Fully functional |
| **Restaurant Tables & Floors** | `restaurant_tables`, `floor_areas`, `floor_dividers` | Fully functional |
| **Cash Drawer** | `cash_drawer_sessions`, `cash_transactions` | Fully functional |
| **Notifications** | `notifications` | Fully functional |
| **Guest Book** | `guests`, `guest_feedback`, `loyalty_points` | Fully functional |
| **Device Store Binding** | `device_stores` | Fully functional |
| **Authentication** | `profiles`, Supabase Auth | Fully functional (login, session) |
| **Settings Persistence** | `settings` table + `SettingsManager` | Fully functional |
| **Inventory Tracking** | `products.track_inventory`, `products.current_stock` | Fully functional |
| **Timed Pricing** | `timed_pricing_rules` | Fully functional |
| **Scheduled Themes** | `scheduled_themes` | Fully functional |
| **Activity Log** | `activity_log` | Fully functional |
| **Open Shifts** | `open_shifts` | Fully functional |

---

## 2. WHAT IS PARTIALLY DONE

| Feature | What Works | What's Missing |
|---------|-----------|---------------|
| **Orders Page** (~10,000 lines) | Full UI with menu browsing, cart, modifiers, guest forms, payment dialog | Menu items fall back to **massive hardcoded data** (~5,000 lines of categories, subcategories, items, colours) when DB products don't exist. Guest search uses mock data. Manager role check is a `TODO`. |
| **Dashboard** (~2,000 lines) | Order list, receipt, tip, refund dialogs | Orders come from `getDashboardOrders()` — **hardcoded mock data** in `src/data/orders.ts` (~670 lines). Not reading from `orders` DB table. |
| **Tickets / Closed Tickets** (~6,400 lines) | Full ticket list, filtering, payment, refund, transfer UI | Ticket data comes from `src/data/ticketOrders.ts` — **hardcoded mock data** (~490 lines). Not reading from DB. |
| **Table Order** (~3,300 lines) | Table map, floor management, reservations, order detail | Table map is DB-backed, but order data per table is **hardcoded** (`tableOrdersMap` with mock names/amounts). |
| **KDS** (~870 lines) | Full ticket card rendering, seen/bump, message banners | All ticket data is **hardcoded mock** (`generateMockTickets()`). Messages use localStorage only (no DB). |
| **OrderOS** (~3,800 lines) | Full online order management UI with drag-drop | All order data is **hardcoded mock**. Platform integrations (UberEats, DoorDash, etc.) are UI-only. |
| **Reservations** (~1,400 lines) | Full calendar, guest detail, status management | All reservation data is **hardcoded mock** (`mockReservations` in `ReservationsPanel.tsx`). |
| **Voucher** | Dialog UI works | Has explicit `TODO` comments — not integrated with order context. |
| **Reports** | Page exists | **Stub only** — renders a heading and paragraph. `useReportsData` hook exists but Reports page doesn't use it. |
| **Scheduled Orders** (~525 lines) | Full UI with time-based grouping | All data is **hardcoded mock**. Accept/Cancel handlers are `TODO`. |
| **Login** (~6,400 lines) | Full multi-step login flow (company/personal device, PIN, QR, biometric) | Employee PINs are **hardcoded** (`employeePinMapping`). Revenue centers are **hardcoded**. Face ID uses mock employee data. |
| **Payment Dialog** | Full multi-step payment flow | Guest/loyalty search uses **hardcoded mock** data (`mockGuests`). |
| **Delivery Guest Form** | Address autocomplete UI | Uses **hardcoded mock** address suggestions. |

---

## 3. HARDCODED DATA INVENTORY

Major hardcoded data blocks that should eventually be database-driven:

| Location | What | Approx Lines |
|----------|------|-------------|
| `src/data/orders.ts` | Dashboard order data, order items, payment methods | ~670 lines |
| `src/data/ticketOrders.ts` | Ticket/closed ticket order data | ~490 lines |
| `src/data/staff.ts` | Staff list (7 employees) | ~17 lines |
| `src/data/menuData.ts` | Food images and menu items for POS home | ~122 lines |
| `src/pages/Orders.tsx` lines 85-5950 | Menu categories, subcategories, items, colour maps, mock guests | ~5,000+ lines |
| `src/pages/KDS.tsx` lines 47-180 | Mock KDS tickets | ~130 lines |
| `src/pages/OrderOS.tsx` | Mock online orders, platform data | ~200+ lines |
| `src/pages/TableOrder.tsx` lines 43-60 | Mock table orders map | ~20 lines |
| `src/pages/Login.tsx` lines 35-80 | Revenue centers, PIN mappings | ~45 lines |
| `src/pages/ScheduledOrders.tsx` | Mock scheduled orders | ~100+ lines |
| `src/components/ReservationsPanel.tsx` | Mock reservations | ~100+ lines |
| `src/components/PaymentDialog.tsx` | Mock guests for loyalty | ~20 lines |
| `src/components/FaceIDAuthModal.tsx` | Mock Face ID employees | ~30 lines |
| `src/components/DeliveryGuestForm.tsx` | Mock address suggestions | ~20 lines |
| `src/components/CashDrawerDetailsContent.tsx` | Mock sales data | ~5 lines |

---

## 4. ORPHANED FILES (No Route, No Import)

These page files exist but are **not imported anywhere** in the codebase:

| File | Can Delete? |
|------|------------|
| `src/pages/ScheduledOrders.tsx` | Yes — no route, no import |
| `src/pages/ClockIn.tsx` | Yes — no route, no import |
| `src/pages/Auth.tsx` | Yes — no route, no import |
| `src/pages/Index.tsx` | Yes — no route, no import |
| `src/pages/Signup.tsx` | Yes — no route, no import |
| `src/pages/ClosingGracePeriod.tsx` | Yes — no route, no import |

Pages used only via Settings route wrappers (NOT orphaned):
`Fonts.tsx`, `ThemePresets.tsx`, `AppearanceSettings.tsx`, `PaymentsSettings.tsx`, `PersonalInformation.tsx`, `RestaurantInformation.tsx`, `Security.tsx`, `SystemSettings.tsx`, `ControlCenter.tsx` — all referenced by route wrapper components.

---

## 5. PERFORMANCE & CODE QUALITY ISSUES

| Issue | Severity |
|-------|----------|
| `Orders.tsx` is **~10,000 lines** in a single file | High — should be split into sub-components |
| `Tickets.tsx` is **~6,400 lines** in a single file | High |
| `Login.tsx` is **~6,400 lines** in a single file | High |
| `OrderOS.tsx` is **~3,800 lines** in a single file | Medium |
| `TableOrder.tsx` is **~3,300 lines** in a single file | Medium |
| KDS messages use **localStorage polling** instead of DB/realtime | Medium — fragile, no cross-device sync |
| `src/contexts/SidebarPositionContext.tsx` exists but may not be used in App.tsx providers | Low |

---

## 6. WHAT'S NOT HARDCODED (Fully Dynamic)

These are clean, database-driven with no mock fallbacks:
- All Settings sub-modules (menu, employees, discounts, hardware, notifications, etc.)
- Table/floor management
- Cash drawer sessions
- Guest book / loyalty
- Auth flow (Supabase-backed)
- Device store binding
- Scheduled themes
- Timed pricing rules

---

## Recommendations (Priority Order)

1. **Delete 6 orphaned page files** — immediate cleanup
2. **Reports page** — wire up the existing `useReportsData` hook (it already queries the DB)
3. **Dashboard & Tickets** — migrate from hardcoded `orders.ts`/`ticketOrders.ts` to the existing `orders` and `order_items` DB tables
4. **KDS** — migrate mock tickets to use real orders from DB; migrate messages from localStorage to a DB table
5. **Split mega-files** — Orders.tsx, Tickets.tsx, Login.tsx should be decomposed into smaller components
6. **Orders menu fallback** — the hardcoded 5,000-line menu fallback in Orders.tsx can be removed once all restaurants have DB-seeded menus

