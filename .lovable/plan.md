## Scope
File: `src/pages/OnboardingAppSignupMode.tsx` only. No other screens, routes, tokens, or navigation changes.

## Change 1 — Top-align the mode icon header row

In `ColHeader`, switch the column from `justify-end` to `justify-start` and reduce top padding so the icon + title sit at the top of the header cell. All three columns share the same grid row so they will align flush at the top.

Before:
```
className="... justify-end gap-1 px-1 pt-5 pb-2 ..."
```
After:
```
className="... justify-start gap-1 px-1 pt-3 pb-2 ..."
```
The "BEST MATCH" badge (absolute, `-top-2`) and existing `pt-4` on the scroll container continue to give it room, so no clipping.

## Change 2 — Add more features to the comparison table

Expanded `SECTIONS` with realistic, POS-app-grounded capabilities drawn from this project's existing modules (orders, tickets, KDS, payments, tables, reservations, vouchers, inventory, workforce, reports, governance, security). Values reflect typical Standard / Quick Service / Full Service POS scopes.

New sections and rows (added alongside the current ones):

- Orders
  - Quick orders
  - Custom products
  - Order notes and modifiers
  - Course management (FS only)
  - Hold and fire (QS + FS)
- Payments (extended)
  - Card / cash (existing)
  - Split payments (existing)
  - Tips and gratuity (QS + FS)
  - Vouchers and gift cards
  - Refunds and voids
- Kitchen (extended)
  - KDS routing (existing)
  - Multi-channel menus (existing)
  - Prep stations (FS only)
  - Bump and recall (QS + FS)
- Table management (extended)
  - Floor plans (FS only)
  - Open checks (FS only)
  - Coursing (FS only)
  - Transfers and merges (FS only)
  - Split check (FS only)
- Guests & reservations
  - Guest profiles (QS + FS)
  - Reservations (FS only)
  - Waitlist (FS only)
- Inventory
  - Stock deduction on fire (QS + FS)
  - Write-off tracking (FS only)
  - Low-stock alerts (QS + FS)
- Workforce
  - Clock in / out (all)
  - Roles and permissions (QS + FS)
  - Shift summary (QS + FS)
  - Cash drawer sessions (QS + FS)
- Reports & AI
  - End of day (all)
  - AI report generation (QS + FS)
  - Sales analytics (QS + FS)
- Security
  - MPIN gate (all)
  - Device PIN lockout (all)
  - Audit log (FS only)

All rows use the existing `Row` shape `{ label, values: { standard, quickservice, fullservice } }`. No new colors, components, or layout primitives introduced. Section title rows, row spacing, selected-column highlight, AI badge, and CTA all stay exactly as-is, just repeated for the new content.

## Verification
- Visual check on the mobile viewport (390x742) to confirm header icons sit at the top and the longer list scrolls cleanly inside the existing `overflow-y-auto` container.
- Confirm landscape layout still renders within its 60% panel.
