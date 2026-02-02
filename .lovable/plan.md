

# Fix Order Ticket Creation for All Table Selection Methods

## Problem Identified
When selecting guests for an available table in the TableOrder page, the order ticket is not appearing in TableOrderDetails after firing because multiple `handleGuestSelectLocal` functions are using an old navigation pattern that doesn't create a session order.

---

## Root Cause Analysis

```text
CURRENT BEHAVIOR (Broken in some views):

Grid View / Card View / Floorplan Local Handlers:
Available Table → Select Seats → navigate(`/orders?tableId=X&seats=Y&guests=Z`)
                              → NO session order created
                              → Orders page: isSessionOrderMode = false (no sessionId)
                              → FIRE button only marks items locally
                              → Nothing persists to TableOrderDetails

CORRECT BEHAVIOR (Only in main handleGuestSelect):
Available Table → Select Seats → createOrder() called
                              → navigate(`/orders?tableId=X&sessionId=Y&partySize=Z`)
                              → Orders page: isSessionOrderMode = true
                              → FIRE button calls fireSessionOrder()
                              → Order appears in TableOrderDetails
```

---

## Locations to Fix

Found **multiple `handleGuestSelectLocal` functions** that need to be updated:

| Location | Lines | Current Behavior | Fix Needed |
|----------|-------|------------------|------------|
| Grid View (Portrait Cards) | ~2033-2037 | Sets state only, no navigation | Add createOrder + navigate with sessionId |
| Floorplan View (Circular/Square Tables) | ~2105-2109 | Old URL params, no createOrder | Call createOrder + navigate with sessionId |
| Grid View (Large Cards) | ~2506-2510 | Old URL params, no createOrder | Call createOrder + navigate with sessionId |

---

## Solution

Update all `handleGuestSelectLocal` functions to match the correct `handleGuestSelect` pattern:

### Pattern to Apply
```typescript
const handleGuestSelectLocal = (guestCount: number) => {
  setGuestDropdownTable(null);
  setSelectedTable(table.id);
  
  // Create session order (THIS IS THE KEY FIX)
  const newOrder = createOrder(table.id, guestCount, 'Staff', 'Guest');
  
  // Navigate with sessionId instead of old params
  navigate(`/orders?tableId=${table.id}&sessionId=${newOrder.sessionId}&partySize=${guestCount}`);
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/TableOrder.tsx` | Update 3 `handleGuestSelectLocal` functions to call `createOrder` and use new URL pattern |

### Specific Line Ranges
1. **Lines ~2033-2037**: Grid view portrait cards - add createOrder call and fix navigation
2. **Lines ~2105-2109**: Floorplan view (circular/square tables) - add createOrder call and fix navigation  
3. **Lines ~2506-2510**: Grid view large cards - add createOrder call and fix navigation

---

## Order Flow After Fix

```text
1. User clicks Available table in any view mode
2. Guest dropdown appears
3. User selects number of guests (e.g., 4)
4. handleGuestSelectLocal runs:
   - Creates session order with status "ORDERING"
   - Navigates to /orders with sessionId
5. User adds items on Orders page
6. User clicks FIRE
   - Items saved to session order
   - Status changes to "ORDERED"
   - Navigates to /tableorder/:tableId
7. TableOrderDetails shows the order with "ORDERED" status
```

---

## Notes
- The main `handleGuestSelect` function (lines 1585-1596) is already correct and uses `createOrder`
- The local handlers inside map iterations need access to `createOrder` from the context (already imported at component level via `useSessionOrders`)
- All local handlers already have access to `table.id` from their closure scope

