
# Enable Split Check from TableOrderDetails Screen

## Overview
Add the split check functionality to the TableOrderDetails page so users can split orders directly from the table order management screen, not just from the Orders page.

---

## Current State
- PaymentDialog is already integrated in TableOrderDetails (line 2498-2522)
- The `onSaveSplit` prop is NOT being passed to PaymentDialog
- Split check cards are already rendering for orders with existing split configurations
- Session orders already store and display splitConfiguration

---

## Implementation

### 1. Import saveSplitConfiguration from Context
**File:** `src/pages/TableOrderDetails.tsx`

Update the useSessionOrders destructuring to include the save function:

```typescript
// Current (line 269):
const { getOrdersByTable: getSessionOrdersByTable } = useSessionOrders();

// Updated:
const { 
  getOrdersByTable: getSessionOrdersByTable,
  saveSplitConfiguration 
} = useSessionOrders();
```

### 2. Find Session ID for Current Order
To persist the split configuration, we need to find the sessionId that corresponds to the currently selected order. Add a helper to look up the session order:

```typescript
// Get session ID for the current order (for persisting split config)
const getSessionIdForOrder = (orderId: string): string | undefined => {
  const sessionOrder = sessionOrdersForTable.find(so => so.id === orderId);
  return sessionOrder?.sessionId;
};
```

### 3. Add onSaveSplit Handler to PaymentDialog
**File:** `src/pages/TableOrderDetails.tsx`

Update the PaymentDialog component (around line 2498) to include the onSaveSplit prop:

```typescript
<PaymentDialog
  open={showPaymentDialog}
  onOpenChange={setShowPaymentDialog}
  orderDetails={{
    guest: currentSelectedGuest?.name || "Guest",
    phone: currentSelectedGuest?.phone,
    table: tableId,
    check: currentSelectedGuest?.id,
    partySize: currentSelectedGuest?.partySize || 4,
    items: currentSelectedGuest?.items.map((item, index) => ({
      id: index + 1,
      qty: item.qty,
      name: item.name,
      price: item.price * item.qty,
      assignedSeats: item.seats || [],
      isShared: item.isShared || false
    })) || []
  }}
  subtotal={currentSelectedGuest?.subtotal || 0}
  tax={currentSelectedGuest?.tax || 0}
  total={currentSelectedGuest?.total || 0}
  onPaymentComplete={(history) => {
    console.log("Payment completed:", history);
  }}
  onSaveSplit={(config) => {
    // Find the session ID for this order
    const sessionId = getSessionIdForOrder(currentSelectedGuest?.id || '');
    
    if (sessionId && currentSelectedGuest) {
      // Build split checks from the configuration
      const orderItems = currentSelectedGuest.items;
      const checks = Array.from({ length: config.numberOfChecks }, (_, i) => {
        const checkLetter = String.fromCharCode(97 + i);
        const itemsForCheck = orderItems.filter((_, itemIdx) => 
          config.checkAssignments[itemIdx] === i
        );
        const checkTotal = itemsForCheck.reduce((sum, item) => 
          sum + (item.price * item.qty), 0
        );
        
        return {
          checkId: checkLetter,
          items: itemsForCheck.map(item => ({
            qty: item.qty,
            name: item.name,
            price: item.price,
            seats: item.seats || [],
            modifiers: item.modifiers || []
          })),
          status: 'unpaid' as const,
          total: checkTotal
        };
      });
      
      saveSplitConfiguration(sessionId, {
        ...config,
        checks
      });
      
      console.log("Split configuration saved for order:", currentSelectedGuest.id);
    }
  }}
/>
```

---

## Data Flow

```text
TableOrderDetails Page
         |
         v
User clicks PAY button
         |
         v
PaymentDialog opens
         |
         v
User clicks "Split Check" and configures split
         |
         v
User clicks Save icon
         |
         v
onSaveSplit callback fires
         |
         v
Find sessionId for current order
         |
         v
Build SplitCheck array with items/totals
         |
         v
Call saveSplitConfiguration(sessionId, config)
         |
         v
SessionOrderContext updates order
         |
         v
localStorage persists data
         |
         v
Split check cards appear under main order ticket
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/TableOrderDetails.tsx` | Add `saveSplitConfiguration` to context import, add helper function, add `onSaveSplit` prop to PaymentDialog |

---

## Technical Notes

1. **Session Order Matching**: The helper function `getSessionIdForOrder` matches by order ID to find the corresponding sessionId needed for persistence

2. **Item Assignment Logic**: Uses the same logic as Orders.tsx - mapping through items and filtering by checkAssignments index

3. **Check Total Calculation**: Each check's total is calculated by summing the price * qty of its assigned items

4. **Immediate UI Update**: Because split checks are already rendered in TableOrderDetails when `splitConfiguration` exists on the GuestOrder, saving the split will immediately show the child check cards under the main order ticket

---

## User Experience
After this change:
1. User navigates to TableOrderDetails for a table
2. User selects an order and clicks PAY
3. In PaymentDialog, user clicks "Split Check"
4. User configures the split (by seat, evenly, or custom)
5. User clicks the Save icon
6. Dialog closes, split check cards appear under the main order
7. Each split check can be paid individually
