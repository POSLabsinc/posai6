

# Plan: Resolve Remaining Audit Items

This plan covers three workstreams. Each is a standalone effort that can be tackled sequentially. Due to the size of these changes, each workstream should be implemented in a dedicated pass.

---

## Workstream 1: Dashboard DB Migration

**Current state**: Dashboard merges hardcoded mock orders from `getDashboardOrders()` (src/data/orders.ts, ~670 lines of static data) with live session/DB orders. The static orders always appear alongside real ones.

**What to do**:
- Remove the `getStaticDashboardOrders()` call and the `enrichedStaticOrders` merge in the `allOrders` useMemo (Dashboard.tsx ~868-890)
- Source orders exclusively from `dbTicketOrders` (already imported via `useTicketOrders`) and `sessionOrders`
- Keep the `DashboardOrder` interface and conversion helpers — just stop feeding them mock data
- Once Dashboard no longer imports `getDashboardOrders`, audit `src/data/orders.ts` — if no other file imports the mock data functions, delete the file. Keep the shared interfaces/types if referenced elsewhere (move them to a types file if needed)
- The hardcoded `discountTypes` array (~line 391) should be replaced with a fetch from the `discounts` DB table (already exists and is used in Settings)

**Risk**: Dashboard will show an empty order list until real orders exist. This is correct behavior.

**Files changed**: `src/pages/Dashboard.tsx`, possibly delete `src/data/orders.ts` or extract shared types.

---

## Workstream 2: KDS Mock Replacement

**Current state**: KDS uses `generateMockTickets()` (~130 lines of hardcoded tickets) as fallback when no real orders exist in `kds_ticket_queue` localStorage. Messages use localStorage polling instead of DB.

**What to do**:
- Remove `generateMockTickets()` entirely (lines 47-180)
- Change the fallback to an empty array instead of mock data — when no fired orders exist, KDS shows an empty state
- Update the initial state loader (line 640-648) to return `[]` instead of `generateMockTickets()` when the queue is empty
- The localStorage-based `kds_ticket_queue` polling mechanism should remain for now (it's the bridge from POS Fire action to KDS) — migrating this to a DB table with realtime is a separate, larger effort
- Add a simple empty-state UI when `tickets.length === 0` (e.g., "No active orders" centered message)

**Files changed**: `src/pages/KDS.tsx`

---

## Workstream 3: Mega-File Decomposition

These files are too large for maintainability. The goal is to extract logical sections into separate component files without changing any behavior.

### Orders.tsx (~9,954 lines)
Extract into:
- `src/components/orders/OrderMenuGrid.tsx` — menu category tabs and product grid
- `src/components/orders/OrderCart.tsx` — cart/order summary panel
- `src/components/orders/OrderGuestForm.tsx` — guest info and delivery forms
- `src/components/orders/OrderActionBar.tsx` — bottom action buttons (Clear, Save, Fire, Charge)
- `src/components/orders/OrderModifierPanel.tsx` — inline modifier/customization panel
- Keep `Orders.tsx` as the orchestrator (~500-800 lines) with state and routing logic

### Tickets.tsx (~6,440 lines)
Extract into:
- `src/components/tickets/TicketList.tsx` — ticket card list and filtering
- `src/components/tickets/TicketDetail.tsx` — selected ticket detail panel
- `src/components/tickets/TicketPaymentFlow.tsx` — payment, tip, refund dialogs
- `src/components/tickets/TicketTransferView.tsx` — inline transfer UI
- Keep `Tickets.tsx` as orchestrator (~400-600 lines)

### Login.tsx (~6,481 lines)
Extract into:
- `src/components/login/CompanyDeviceFlow.tsx` — company device setup steps
- `src/components/login/PersonalDeviceFlow.tsx` — personal device auth
- `src/components/login/PinEntry.tsx` — PIN pad and employee selection
- `src/components/login/BiometricAuth.tsx` — Face ID / QR scan flows
- Keep `Login.tsx` as orchestrator (~300-500 lines)

**Approach**: Pure refactor — extract JSX and local handlers into child components, pass state via props. No behavior changes. Each extraction is independently testable.

---

## Execution Order

1. **KDS Mock Replacement** — smallest, lowest risk, ~30 min
2. **Dashboard DB Migration** — medium, removes mock data dependency, ~1 hr
3. **Mega-File Decomposition** — largest effort, split across multiple passes (Orders first, then Tickets, then Login), ~2-3 hrs total

Each workstream should be implemented and verified independently before moving to the next.

