
## What’s happening (root cause)
On **/tableorder/:tableId (TableOrderDetails)** you have two kinds of tickets:

1) **Session orders** (created through the table flow and stored in `SessionOrderContext` / localStorage)  
2) **Static “seed” orders** (coming from `src/data/orders.ts` via `getOrdersByTable()`)

The Split Save on TableOrderDetails currently persists only when it can find a **sessionId**:
- If the user splits a **static** order (very common on `/tableorder/T2`), `getSessionIdForOrder(orderId)` returns `undefined`, so `saveSplitConfiguration()` never runs → **no splitConfiguration exists on that ticket** → **no sub-tickets render under the main ticket**.

There’s also a correctness issue in TableOrderDetails’ `PaymentDialog` props: it passes `price: item.price * item.qty` (line-total) instead of unit price, which can break split calculations and totals.

## Goal
When the user hits **Save** in Split Check from **TableOrderDetails**, sub-tickets must appear immediately under the main ticket **for both**:
- session-based tickets
- static/seed tickets

## Implementation plan

### 1) Add persistence for split configs for “static” orders (TableOrderDetails-only)
**File:** `src/pages/TableOrderDetails.tsx`

Add a small local persistence layer specifically for static orders:
- Create state like:
  - `staticSplitConfigsByKey: Record<string, SplitConfiguration>`
- Use a stable storage key such as:
  - `pos-tableorder-static-splits`
- Store configs by a composite key:
  - `${tableId}:${orderId}`
  - (prevents collisions and allows multiple tables)

Add:
- `loadStaticSplitConfigs()` (from localStorage)
- `saveStaticSplitConfigs()` (to localStorage, inside a `useEffect`)

### 2) Attach splitConfiguration onto staticGuestOrders during construction
**File:** `src/pages/TableOrderDetails.tsx`

When building:
```ts
const staticGuestOrders: GuestOrder[] = getOrdersByTable(...).map(...)
```
attach:
- `splitConfiguration: staticSplitConfigsByKey[`${tableId}:${order.id}`]`

This is the critical step that makes the left-side list capable of rendering sub-tickets for static orders.

### 3) Make `onSaveSplit` persist for both session + static orders
**File:** `src/pages/TableOrderDetails.tsx`

Update the `PaymentDialog` `onSaveSplit` handler:

- Always build `checks` (SplitCheck[]) using a shared helper (next step)
- Then:
  - If `sessionId` exists → `saveSplitConfiguration(sessionId, { ...config, checks })` (current behavior)
  - Else (static order) → write to `staticSplitConfigsByKey[`${tableId}:${orderId}`]`

Also: update `selectedGuest` after saving so the right panel reflects the new split state immediately (avoids stale selected object issues).

### 4) Build checks correctly for all split modes (not just “custom”)
**File:** `src/pages/TableOrderDetails.tsx`

Create a helper in the component (or small local util inside the file) like:

- `buildSplitChecks({ mode, numberOfChecks, checkAssignments }, orderItems, partySize, orderTotals)`

Rules:
- **custom**: use `checkAssignments` (1-indexed keys and values) and filter via `itemIdx + 1 === key` and `checkIndex + 1 === value`
- **evenly**: create `numberOfChecks` checks with totals derived from `total / numberOfChecks`
  - items: either keep all items for display, or keep empty items but show correct total (choose whichever best matches your UI expectations; recommendation: keep items count meaningful)
- **seat**: mirror PaymentDialog logic (shared items appear on all checks; totals allocate shared cost by party size)

This ensures “Save” works no matter which split tab the user used.

### 5) Fix TableOrderDetails → PaymentDialog item price mapping
**File:** `src/pages/TableOrderDetails.tsx`

In `orderDetails.items` mapping, change:
- `price: item.price * item.qty`
to
- `price: item.price`

Because PaymentDialog already multiplies by qty internally in some calculations; passing the line-total can double-count and cause incorrect check totals/behavior.

### 6) QA checklist (end-to-end)
1. Go to `/tableorder/T2`
2. Pick a seeded/static ticket (e.g., “Martin Alex”)
3. CHARGE → Split Check → Custom → assign items → Save
4. Confirm:
   - dialog closes
   - **sub-tickets appear under the main ticket immediately**
   - refresh page → sub-tickets still remain (localStorage persistence)
5. Repeat with a **session-created ticket** (new table order flow) and confirm persistence still works
6. Test **Evenly** and **Seat** modes saving (not just Custom)
7. Ensure no scrollbars appear (keep `scrollbar-hide` usage intact)

## Files involved
- `src/pages/TableOrderDetails.tsx` (all changes contained here)

## Notes / non-goals (for now)
- This plan focuses on “Save split → show sub-tickets” reliability.
- If you want “split lock / merge to unlock / disable adding items” behavior in TableOrderDetails too (like Orders page), we can add it after this is stable.
